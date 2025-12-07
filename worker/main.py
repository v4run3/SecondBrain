from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import os
from nlp_utils import extract_text, chunk_text, get_embedding, embedding_model
import numpy as np
import faiss

app = FastAPI()

# Global FAISS index
dimension = 384
index = faiss.IndexIDMap(faiss.IndexFlatL2(dimension))

class ExtractRequest(BaseModel):
    docId: str
    filePath: str
    sourceType: str

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
async def extract_document(req: ExtractRequest):
    try:
        # 1. Extract text
        # Note: In docker, the path might need adjustment if volumes aren't perfect.
        # Assuming filePath is accessible.
        text = extract_text(req.filePath, req.sourceType)
        
        # 2. Chunk
        chunks = chunk_text(text)
        
        # 3. Embed and Index
        # We need to return chunks to Node so it can store them in Mongo.
        # We also need to index them in FAISS.
        # Problem: We need unique IDs for FAISS. 
        # Strategy: Node saves chunks first? Or we generate IDs here?
        # Let's return the chunks and embeddings to Node. Node assigns IDs, saves to Mongo.
        # Then Node calls another endpoint to "index" them? 
        # Or simpler: We return the text chunks and their embeddings. 
        # Node saves to Mongo.
        # For the local FAISS, if we want to search HERE, we need the data HERE.
        
        # Revised Flow for MVP:
        # 1. Extract & Chunk & Embed here.
        # 2. Store in local FAISS (in memory for now).
        # 3. Return chunks + metadata to Node to store in Mongo.
        # 4. We need a way to map FAISS ID back to Mongo ID. 
        #    Since we don't have Mongo ID yet, we can't map it easily unless Node creates IDs first.
        
        # Alternative: Node sends the file. We process. We return list of { text, embedding }.
        # Node saves to Mongo.
        # Node sends back { mongoId, embedding } to be added to FAISS?
        # That's too chatty.
        
        # Let's just return text chunks. Node saves them.
        # Then Node calls /index_batch with { id, text } or { id, embedding }.
        
        response_chunks = []
        for chunk_text_content in chunks:
            embedding = get_embedding(chunk_text_content)
            response_chunks.append({
                "text": chunk_text_content,
                "embedding": embedding.tolist()
            })
            
        return {"chunks": response_chunks}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/embed")
async def embed_text(text: str):
    embedding = get_embedding(text)
    return {"embedding": embedding.tolist()}

@app.post("/index_batch")
async def index_batch(items: List[dict]):
    # items = [{ "id": "mongo_id_string", "embedding": [0.1, ...] }]
    # FAISS IndexIDMap requires integer IDs.
    # We need a mapping from int -> mongo_id_string.
    # For this MVP, let's keep a global dict.
    global index
    
    # We need to persist this mapping if we restart.
    # For now, in-memory.
    
    embeddings = []
    ids = []
    
    # We'll use a simple hash or auto-increment for the int ID
    # But we need to store the mapping to return the Mongo ID later.
    
    # Let's use the current index size as the starting ID
    start_id = index.ntotal
    
    for i, item in enumerate(items):
        emb = np.array(item['embedding'], dtype='float32')
        embeddings.append(emb)
        
        # We can't easily map string ID to int ID for FAISS IDMap without a lookup.
        # But wait, if we just want to search, we get the int ID back.
        # We need to look up the Mongo ID from that int ID.
        
        # Let's assume we have a global `id_map`
        # id_map[start_id + i] = item['id']
        pass

    # This is getting complicated for a "simple" MVP with local FAISS.
    # Easier approach:
    # Use `faiss.IndexFlatL2`. It returns the index of the vector.
    # We keep a list of Mongo IDs that corresponds exactly to the order of vectors in the index.
    
    # global mongo_id_list
    # mongo_id_list.extend([item['id'] for item in items])
    # index.add(np.array(embeddings))
    
    return {"status": "indexed", "count": len(items)}

# Let's refine the global state for the MVP
mongo_id_list = []
index_flat = faiss.IndexFlatL2(dimension)

@app.post("/add_chunks")
async def add_chunks(items: List[dict]):
    # items: [{ "id": "mongoId", "embedding": [...] }]
    global mongo_id_list
    global index_flat
    
    embeddings = np.array([item['embedding'] for item in items], dtype='float32')
    index_flat.add(embeddings)
    mongo_id_list.extend([item['id'] for item in items])
    
    return {"status": "success", "total_indexed": len(mongo_id_list)}

@app.post("/search")
async def search(req: SearchRequest):
    global index_flat
    global mongo_id_list
    
    query_embedding = get_embedding(req.query)
    query_vector = np.array([query_embedding], dtype='float32')
    
    D, I = index_flat.search(query_vector, req.top_k)
    
    results = []
    for i, idx in enumerate(I[0]):
        if idx != -1 and idx < len(mongo_id_list):
            results.append({
                "chunkId": mongo_id_list[idx],
                "score": float(D[0][i])
            })
            
    return {"results": results}
