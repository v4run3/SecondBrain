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
        
        // Handle both full URL (local) and hostname (Railway)
        let workerUrl = process.env.NLP_SERVICE_URL;
        if (workerUrl && !workerUrl.startsWith('http')) {
          workerUrl = `https://${workerUrl}`;
        }
        
        // Send file content to worker via multipart/form-data
        // This works on Railway where services don't share filesystem
        const FormData = require('form-data');
        const formData = new FormData();
        
        // Read the file and append to form data
        const fileStream = fs.createReadStream(req.file.path);
        formData.append('file', fileStream, req.file.originalname);
        formData.append('docId', doc._id.toString());
        formData.append('sourceType', doc.sourceType);

        const extractRes = await axios.post(`${workerUrl}/extract`, formData, {
          headers: formData.getHeaders(),
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        });
        
        const { chunks } = extractRes.data;
        
        // 2. Save chunks to Mongo
        const chunkDocs = chunks.map((c, index) => ({
            docId: doc._id,
            text: c.text,
            embedding: c.embedding,
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
