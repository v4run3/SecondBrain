# SecondBrain

SecondBrain is an AI-powered knowledge base and document assistant. It allows you to upload documents, process them using OCR and NLP, and chat with your knowledge base using semantic search and LLMs.

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS
- **Backend**: Node.js, Express, MongoDB
- **Microservice**: Python, FastAPI, PyTesseract, SentenceTransformers, FAISS
- **Infrastructure**: Docker, Docker Compose

## Prerequisites

- Docker and Docker Compose installed
- Node.js (for local dev)
- Python 3.9+ (for local dev)

## Getting Started

1.  **Clone the repository**

2.  **Environment Setup**
    - The `server/.env` file is pre-configured for Docker.
    - If you want to use a real LLM, add your Hugging Face API key to `server/.env`:
      ```
      HF_API_KEY=your_hugging_face_api_key
      ```

3.  **Run with Docker Compose**
    ```bash
    docker-compose up --build
    ```
    This will start:
    - MongoDB on port 27017
    - Python Worker on port 8000
    - Node.js Server on port 3000

4.  **Run Frontend**
    The frontend is not currently in docker-compose (for easier local dev). Run it separately:
    ```bash
    cd client
    npm install
    npm run dev
    ```
    Access the app at `http://localhost:5173`.

## Features

- **Authentication**: Register and Login.
- **Document Upload**: Upload PDF, TXT files.
- **Processing**: Automatic text extraction (OCR for PDFs), chunking, and embedding.
- **Chat**: Ask questions about your documents. The system retrieves relevant chunks and generates an answer (mocked if no API key provided).

## Development

- **Server**: `cd server && npm run dev`
- **Worker**: `cd worker && uvicorn main:app --reload`
- **Client**: `cd client && npm run dev`
