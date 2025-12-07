const mongoose = require('mongoose');

const chunkSchema = new mongoose.Schema({
  docId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  embeddingId: String, // ID in FAISS or external store
  embedding: [Number],
  page: Number,
  startChar: Number,
  endChar: Number,
  summary: String,
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Chunk', chunkSchema);
