import os
import pytesseract
import pdfplumber
from PIL import Image
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np

# Initialize models
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
dimension = 384
index = faiss.IndexFlatL2(dimension)

# Map FAISS IDs to Chunk IDs (in memory for now, ideally persistent)
# In a real app, we might use a FAISS index that supports IDs (IndexIDMap)
# or just rely on the order if we don't delete often.
# For simplicity, we'll just return the embedding and let Node store it?
# Or we keep the index here. Let's keep the index here.
id_map = {} 

def extract_text_from_pdf(file_path):
    text = ""
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
            else:
                # Fallback to OCR if no text found
                # Convert page to image (requires ghostscript/imagemagick usually, 
                # but pdfplumber can do to_image)
                im = page.to_image()
                text += pytesseract.image_to_string(im.original) + "\n"
    return text

def extract_text(file_path, source_type):
    if source_type == 'pdf':
        return extract_text_from_pdf(file_path)
    elif source_type in ['txt', 'md']:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    else:
        # TODO: Add support for docx
        return ""

def chunk_text(text, chunk_size=500, overlap=50):
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)
    return chunks

def get_embedding(text):
    return embedding_model.encode([text])[0]

def add_to_index(embeddings, ids):
    # embeddings should be a numpy array of float32
    # ids should be a list of string IDs (but FAISS IndexFlatL2 doesn't store IDs natively unless we use IndexIDMap)
    # For this MVP, let's use IndexIDMap if we want to retrieve by ID, 
    # OR we just search and get the index, then look up in our own map.
    
    # Let's use IndexIDMap for integer IDs. 
    # But our Mongo IDs are strings. We can hash them or just use an auto-increment int and map it back.
    pass

# We'll expose simple functions to be called by the API
