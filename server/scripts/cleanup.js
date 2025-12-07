const mongoose = require('mongoose');
const Chunk = require('../models/Chunk');
const Document = require('../models/Document');
require('dotenv').config({ path: '../.env' });

const cleanup = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    console.log('Finding orphaned chunks...');
    const chunks = await Chunk.find({});
    console.log(`Total chunks: ${chunks.length}`);

    let deletedCount = 0;
    for (const chunk of chunks) {
      const doc = await Document.findById(chunk.docId);
      if (!doc) {
        console.log(`Deleting orphaned chunk ${chunk._id} (docId: ${chunk.docId} not found)`);
        await Chunk.deleteOne({ _id: chunk._id });
        deletedCount++;
      }
    }

    console.log(`Cleanup complete. Deleted ${deletedCount} orphaned chunks.`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

cleanup();
