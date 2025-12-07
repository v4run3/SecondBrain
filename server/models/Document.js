const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  originalFilename: {
    type: String,
    required: true,
  },
  sourceType: {
    type: String,
    enum: ['pdf', 'docx', 'text', 'transcript', 'url'],
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  pages: {
    type: Number,
    default: 0,
  },
  metadata: {
    type: Map,
    of: String,
  },
  status: {
    type: String,
    enum: ['processing', 'ready', 'error'],
    default: 'processing',
  },
  tags: [String],
});

module.exports = mongoose.model('Document', documentSchema);
