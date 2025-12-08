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
    print(f"[EXTRACT] Starting extraction for docId: {docId}, type: {sourceType}")
    
    try:
        # Save uploaded file to temporary location
        print(f"[EXTRACT] Saving uploaded file...")
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{sourceType}") as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        
        print(f"[EXTRACT] File saved to: {tmp_file_path}")
        
        try:
            # 1. Extract text from temporary file
            print(f"[EXTRACT] Extracting text...")
            text = extract_text(tmp_file_path, sourceType)
            print(f"[EXTRACT] Extracted {len(text)} characters")
            
            # 2. Chunk the text
            print(f"[EXTRACT] Chunking text...")
            chunks = chunk_text(text)
            print(f"[EXTRACT] Created {len(chunks)} chunks")
            
            # 3. Generate embeddings for each chunk
            print(f"[EXTRACT] Generating embeddings...")
            response_chunks = []
            for i, chunk_text_content in enumerate(chunks):
                print(f"[EXTRACT] Processing chunk {i+1}/{len(chunks)}")
                embedding = get_embedding(chunk_text_content)
                response_chunks.append({
                    "text": chunk_text_content,
                    "embedding": embedding.tolist()
                })
            
            print(f"[EXTRACT] Successfully processed {len(response_chunks)} chunks")
            return {"chunks": response_chunks}
            
        finally:
            # Clean up temporary file
            if os.path.exists(tmp_file_path):
                os.unlink(tmp_file_path)
                print(f"[EXTRACT] Cleaned up temp file")

    except Exception as e:
        print(f"[EXTRACT ERROR] {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {str(e)}")

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
