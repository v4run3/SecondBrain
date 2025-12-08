from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import List, Optional
import os
import tempfile
from nlp_utils import extract_text, chunk_text, get_embedding
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

app = FastAPI()

# Global in-memory storage (replaces FAISS)
mongo_id_list = []
embedding_vectors = []

class SearchRequest(BaseModel):
    query: str
    top_k: int = 5

class HealthCheck(BaseModel):
    status: str = "OK"

@app.get("/")
def read_root():
    return {"message": "SecondBrain NLP Worker is running"}

@app.get("/health", response_model=HealthCheck)
def health_check():
    return HealthCheck()

@app.post("/extract")
async def extract_document(
    file: UploadFile = File(...),
    docId: str = Form(...),
    sourceType: str = Form(...)
):
    """
    Extract text from uploaded file, chunk it, and generate embeddings.
    Accepts file upload via multipart/form-data instead of file path.
    """
    try:
        # Save uploaded file to temporary location
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{sourceType}") as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        
        try:
            # 1. Extract text from temporary file
            text = extract_text(tmp_file_path, sourceType)
            
            # 2. Chunk the text
            chunks = chunk_text(text)
            
            # 3. Generate embeddings for each chunk
            response_chunks = []
            for chunk_text_content in chunks:
                embedding = get_embedding(chunk_text_content)
                response_chunks.append({
                    "text": chunk_text_content,
                    "embedding": embedding.tolist()
                })
                
            return {"chunks": response_chunks}
            
        finally:
            # Clean up temporary file
            if os.path.exists(tmp_file_path):
                os.unlink(tmp_file_path)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/embed")
async def embed_text(text: str):
    embedding = get_embedding(text)
    return {"embedding": embedding.tolist()}

@app.post("/add_chunks")
async def add_chunks(items: List[dict]):
    """
    Add chunks to in-memory storage (replaces FAISS indexing).
    items: [{ "id": "mongoId", "embedding": [...] }]
    """
    global mongo_id_list
    global embedding_vectors
    
    for item in items:
        mongo_id_list.append(item['id'])
        embedding_vectors.append(np.array(item['embedding'], dtype='float32'))
    
    return {"status": "success", "total_indexed": len(mongo_id_list)}

@app.post("/search")
async def search(req: SearchRequest):
    """
    Search for similar chunks using cosine similarity (replaces FAISS search).
    """
    global mongo_id_list
    global embedding_vectors
    
    if not embedding_vectors:
        return {"results": []}
    
    # Get query embedding
    query_embedding = get_embedding(req.query)
    query_vector = np.array([query_embedding], dtype='float32')
    
    # Calculate cosine similarity with all stored vectors
    vectors_array = np.array(embedding_vectors)
    similarities = cosine_similarity(query_vector, vectors_array)[0]
    
    # Get top k results
    top_indices = np.argsort(similarities)[::-1][:req.top_k]
    
    results = []
    for idx in top_indices:
        if idx < len(mongo_id_list):
            results.append({
                "chunkId": mongo_id_list[idx],
                "score": float(similarities[idx])
            })
            
    return {"results": results}
