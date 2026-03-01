import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { createServer as createViteServer } from 'vite';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize default Groq Client (server-side key)
const defaultGroq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'dummy_key_to_prevent_crash_on_init',
});

// Middleware
app.set('trust proxy', 1); // Trust first proxy (required for rate limiting behind proxy)
app.use(cors());
app.use(express.json());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    xForwardedForHeader: false, // Rely on Express 'trust proxy' setting
  },
});
app.use('/api', limiter);

// System Prompt
const SYSTEM_PROMPT = `You are an Overpass QL generator.

Convert natural language into correct Overpass QL queries.

Rules:
- Output ONLY the query
- NO explanations
- NO markdown
- NO extra text
- Always use this exact structure:

[out:json][timeout:25];
area["name"="{CITY}"]["boundary"="administrative"]->.searchArea;

(
  node[{FILTERS}](area.searchArea);
  way[{FILTERS}](area.searchArea);
  relation[{FILTERS}](area.searchArea);
);

out center;`;

// API Route
app.post('/api/generate', async (req, res) => {
  const { prompt, apiKey } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'Invalid prompt' });
    return;
  }

  let result = '';
  // Determine which client to use
  let client = defaultGroq;
  
  // If user provided a custom API key, use it
  if (apiKey && typeof apiKey === 'string' && apiKey.trim().length > 0) {
    client = new Groq({ apiKey: apiKey.trim() });
  } else {
    // Fallback to server env key check
    if (!process.env.GROQ_API_KEY) {
      res.status(500).json({ error: 'Server configuration error: Missing API Key' });
      return;
    }
  }

  try {
    const completion = await client.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
    });

    result = completion.choices[0]?.message?.content || '';
    if (!result) throw new Error('Empty response from Groq');
    
  } catch (groqError: any) {
    console.error('Groq API Error:', groqError);
    
    // Handle specific error cases if needed
    if (groqError?.status === 401) {
       res.status(401).json({ error: 'Invalid API Key provided.' });
       return;
    }
    
    res.status(500).json({ error: 'Failed to generate query. Please check your API key or try again.' });
    return;
  }

  // Clean up result (remove markdown code blocks if present)
  result = result.replace(/```overpassql/g, '').replace(/```/g, '').trim();

  res.json({ query: result });
});

// Start Server
async function startServer() {
  // Vite Middleware (for development)
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static('dist'));
    // Handle SPA routing
    app.get('*', (req, res) => {
      res.sendFile('index.html', { root: 'dist' });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
