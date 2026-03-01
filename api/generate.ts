import type { VercelRequest, VercelResponse } from '@vercel/node';
import Groq from 'groq-sdk';

const SYSTEM_PROMPT = `You are an Overpass QL generator.

Convert natural language into correct Overpass QL queries for OpenStreetMap.

Rules:
- Output ONLY the query
- NO explanations
- NO markdown
- NO extra text
- Use correct OSM tags (addr:housenumber, amenity, building, etc.)
- Do NOT add unnecessary filters like ["house"="yes"]
- Always use this exact structure:

[out:json][timeout:25];
area["name"="{CITY}"]["boundary"="administrative"]->.searchArea;

(
  node[{FILTERS}](area.searchArea);
  way[{FILTERS}](area.searchArea);
  relation[{FILTERS}](area.searchArea);
);

out center;

Examples:
- "house with number 1948 in Louisville" → use ["addr:housenumber"="1948"] only
- "cafes in Paris" → use ["amenity"="cafe"]
- "schools in Berlin" → use ["amenity"="school"]`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { prompt, apiKey } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'Invalid prompt' });
    return;
  }

  // Determine API key
  const groqApiKey = apiKey?.trim() || process.env.GROQ_API_KEY;
  
  if (!groqApiKey) {
    res.status(500).json({ error: 'Server configuration error: Missing API Key' });
    return;
  }

  const client = new Groq({ apiKey: groqApiKey });

  try {
    const completion = await client.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
    });

    let result = completion.choices[0]?.message?.content || '';
    
    if (!result) {
      throw new Error('Empty response from Groq');
    }

    // Clean up result
    result = result.replace(/```overpassql/g, '').replace(/```/g, '').trim();

    res.status(200).json({ query: result });
  } catch (error: any) {
    console.error('Groq API Error:', error);
    
    if (error?.status === 401) {
      res.status(401).json({ error: 'Invalid API Key provided.' });
      return;
    }
    
    res.status(500).json({ 
      error: 'Failed to generate query. Please check your API key or try again.' 
    });
  }
}
