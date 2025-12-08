FROM python:3.9-slim

WORKDIR /app

# Install system dependencies for Tesseract and PDF processing
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    libtesseract-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install Python packages with minimal cache
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# Use non-reload mode for production
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
