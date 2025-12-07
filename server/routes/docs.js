const express = require('express');
const router = express.Router();
const multer = require('multer');
const Document = require('../models/Document');
const Chunk = require('../models/Chunk');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

// Middleware to protect routes
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { _id: decoded.id };
      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Configure Multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage: storage });

// @route   POST /api/docs/upload
// @desc    Upload a document
// @access  Private
router.post('/upload', protect, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    const doc = await Document.create({
      ownerId: req.user._id,
      title: req.body.title || req.file.originalname,
      originalFilename: req.file.originalname,
      sourceType: path.extname(req.file.originalname).substring(1), // e.g., 'pdf'
      status: 'processing',
    });

    // Trigger Python microservice
    try {
        console.log(`Triggering processing for ${doc._id}`);
        
        // 1. Extract and Embed
        // We need to pass the absolute path. 
        // In docker-compose, server and worker share volumes? 
        // We need to make sure the worker can access the file.
        // For local dev without docker (if running separately), paths match.
        // For docker, we need shared volume.
        // Assuming shared volume mounted at /app/uploads for both?
        // In docker-compose:
        // server: ./server:/app
        // worker: ./worker:/app
        // They are different directories.
        // We need a shared volume for uploads.
        // Let's fix docker-compose later. For now, assume we can access it.
        // Or send the file content? No, too big.
        
        // Let's assume the worker can access the file via a shared path.
        // For now, we'll send the path relative to the project root if running locally.
        
        const workerUrl = process.env.NLP_SERVICE_URL;
        
        // Note: This path logic is tricky between host/container. 
        // In Docker, we mounted ./uploads to /app/uploads in both containers.
        // The file.path from multer (in server) will be something like 'uploads/filename'.
        // We need to resolve this to the absolute path inside the container.
        // Since both mount ./uploads to /app/uploads, the path /app/uploads/filename is valid for both.
        
        const absoluteFilePath = path.resolve(req.file.path);

        const extractRes = await axios.post(`${workerUrl}/extract`, {
          docId: doc._id,
          filePath: absoluteFilePath,
          sourceType: doc.sourceType
        });
        
        const { chunks } = extractRes.data;
        
        // 2. Save chunks to Mongo
        const chunkDocs = chunks.map((c, index) => ({
            docId: doc._id,
            text: c.text,
            embedding: c.embedding, // Optional to store in Mongo
            page: 1, // TODO: Get page from extractor
            chunkIndex: index
        }));
        
        const savedChunks = await Chunk.insertMany(chunkDocs);
        
        // 3. Index in FAISS
        const indexItems = savedChunks.map(c => ({
            id: c._id.toString(),
            embedding: c.embedding
        }));
        
        await axios.post(`${workerUrl}/add_chunks`, indexItems);
        
        // 4. Update Doc Status
        doc.status = 'ready';
        await doc.save();

    } catch (err) {
        console.error("Failed to process document:", err.message);
        doc.status = 'error';
        await doc.save();
    }

    res.status(202).json(doc);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/docs
// @desc    Get all documents for user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const docs = await Document.find({ ownerId: req.user._id }).sort({ uploadedAt: -1 });
    res.json(docs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/docs/:id
// @desc    Get single document
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, ownerId: req.user._id });
    if (doc) {
      res.json(doc);
    } else {
      res.status(404).json({ message: 'Document not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/docs/:id
// @desc    Delete document
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, ownerId: req.user._id });
    if (doc) {
      await Document.deleteOne({ _id: req.params.id });
      // Also delete chunks
      await Chunk.deleteMany({ docId: req.params.id });
      // TODO: Delete file from disk
      res.json({ message: 'Document removed' });
    } else {
      res.status(404).json({ message: 'Document not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
