"""
Lightweight NLP utilities using TF-IDF instead of heavy ML models.
This version works on Railway's free tier without timeout issues.
"""
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import pdfplumber
import pytesseract
from PIL import Image
import numpy as np

# Global TF-IDF vectorizer
vectorizer = TfidfVectorizer(max_features=384, stop_words='english')
document_vectors = []
document_texts = []

def extract_text(file_path, source_type):
    """Extract text from PDF files"""
    if source_type.lower() == 'pdf':
        text = ""
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        return text
    else:
        raise ValueError(f"Unsupported source type: {source_type}")

def chunk_text(text, chunk_size=500, overlap=50):
    """Split text into overlapping chunks"""
    words = text.split()
    chunks = []
    
    for i in range(0, len(words), chunk_size - overlap):
        chunk = ' '.join(words[i:i + chunk_size])
        if chunk.strip():
            chunks.append(chunk)
    
    return chunks

def get_embedding(text):
    """
    Generate TF-IDF vector for text.
    Returns a 384-dimensional vector for compatibility.
    """
    global vectorizer, document_texts
    
    # Add text to corpus if not already there
    if text not in document_texts:
        document_texts.append(text)
        # Refit vectorizer with new corpus
        if len(document_texts) > 1:
            vectorizer.fit(document_texts)
    
    # Transform text to vector
    vector = vectorizer.transform([text]).toarray()[0]
    
    # Pad or truncate to 384 dimensions for consistency
    if len(vector) < 384:
        vector = np.pad(vector, (0, 384 - len(vector)), 'constant')
    else:
        vector = vector[:384]
    
    return vector

def search_similar(query, top_k=5):
    """
    Search for similar documents using TF-IDF cosine similarity.
    This replaces FAISS for lightweight deployment.
    """
    global vectorizer, document_vectors, document_texts
    
    if not document_texts:
        return []
    
    # Get query vector
    query_vector = get_embedding(query)
    
    # Calculate cosine similarity
    similarities = []
    for i, doc_vector in enumerate(document_vectors):
        similarity = cosine_similarity([query_vector], [doc_vector])[0][0]
        similarities.append((i, similarity))
    
    # Sort by similarity and return top k
    similarities.sort(key=lambda x: x[1], reverse=True)
    return similarities[:top_k]

# Dummy embedding model for compatibility
class EmbeddingModel:
    def encode(self, text):
        return get_embedding(text)

embedding_model = EmbeddingModel()
