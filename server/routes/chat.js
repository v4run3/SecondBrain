const express = require('express');
const router = express.Router();
const axios = require('axios');
const Chunk = require('../models/Chunk');
const Document = require('../models/Document');
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

// @route   POST /api/chat
// @desc    Chat with documents
// @access  Private
router.post('/', protect, async (req, res) => {
  const { query, conversationId } = req.body;

  if (!query) {
    return res.status(400).json({ message: 'Query is required' });
  }

  try {
    // Handle both full URL (local) and hostname (Render)
    let workerUrl = process.env.NLP_SERVICE_URL;
    if (workerUrl && !workerUrl.startsWith('http')) {
      workerUrl = `https://${workerUrl}`;
    }

    // 1. Search for relevant chunks
    const searchRes = await axios.post(`${workerUrl}/search`, { 
      query, 
      top_k: 5 
    });
    
    const results = searchRes.data.results; // [{ chunkId, score }]
    const chunkIds = results.map(r => r.chunkId);
    
    // 2. Fetch chunks from Mongo
    const chunks = await Chunk.find({ _id: { $in: chunkIds } }).populate('docId', 'title');
    
    // 3. Construct Context
    const context = chunks.map(c => `Source: ${c.docId ? c.docId.title : 'Unknown Document'}\n${c.text}`).join('\n\n---\n\n');
    
    // 4. Call LLM
    const hfToken = process.env.HF_API_KEY;
    
    let answer = "";
    
    // Try Groq API (free and fast alternative)
    const userApiKey = req.headers['x-groq-api-key'];
    const envApiKey = process.env.GROQ_API_KEY;
    
    // Prioritize user key, fallback to env key
    const effectiveApiKey = userApiKey || envApiKey;

    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('User Key Provided:', !!userApiKey);
    console.log('Env Key Available:', !!envApiKey);
    console.log('Using Key:', userApiKey ? 'User Key' : (envApiKey ? 'Env Key' : 'None'));

    if (!effectiveApiKey) {
      return res.status(401).json({ message: 'API Key missing. Please add your Groq API Key in Settings or configure the server environment.' });
    }

    try {
        console.log('Calling Groq API...');
        const groqRes = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama-3.1-8b-instant',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful assistant. Answer questions based only on the provided context. If the answer is not in the context, say "I don\'t know".'
                    },
                    {
                        role: 'user',
                        content: `Context:\n${context}\n\nQuestion: ${query}`
                    }
                ],
                max_tokens: 1024,
                temperature: 0.7
            },
            {
                headers: {
                    'Authorization': `Bearer ${effectiveApiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            answer = groqRes.data.choices[0]?.message?.content || "No answer generated.";
        } catch (groqErr) {
            console.error("Groq API Error:", groqErr.response?.data || groqErr.message);
            // Fallback to context-based answer
            answer = `Based on your documents:\n\n${context.substring(0, 500)}...\n\n(Error calling Groq API. Check your API key.)`;
        }


    res.json({
      answer,
      sources: chunks.map(c => ({ id: c._id, title: c.docId ? c.docId.title : 'Unknown Document', text: c.text.substring(0, 50) + "..." }))
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error processing chat request' });
  }
});

module.exports = router;
