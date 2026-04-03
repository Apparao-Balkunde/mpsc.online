import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import compression from 'compression';
import cors from 'cors';
import 'dotenv/config';

// नवीन Imports
import { createClient } from '@supabase/supabase-js';
import { createClient as createRedisClient } from 'redis';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app  = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: true, // सर्व origins ला परवानगी द्या किंवा तुमची URL टाका
    credentials: true // कुकीज आणि सेशन ट्रान्सफरसाठी महत्त्वाचे
}));
app.use(compression());
app.use(express.json({ limit: '1mb' }));

// --- Redis Client सेटअप ---
const redisClient = createRedisClient({
    url: process.env.REDIS_URL || 'redis://mpsc_redis:6379' 
});

redisClient.on('error', err => console.log('Redis Client Error', err));
await redisClient.connect().catch(console.error);
console.log("Redis Connected! ⚡");

// --- Supabase Client सेटअप ---
const supabase = createClient(
    process.env.VITE_SUPABASE_URL, 
    process.env.VITE_SUPABASE_ANON_KEY
);

// Simple in-memory rate limiter
const rateLimits = new Map();
function rateLimit(ip, max = 20, windowMs = 60_000) {
  const now = Date.now();
  const entry = rateLimits.get(ip) || { count: 0, start: now };
  if (now - entry.start > windowMs) { entry.count = 0; entry.start = now; }
  entry.count++;
  rateLimits.set(ip, entry);
  return entry.count <= max;
}
setInterval(() => {
  const cutoff = Date.now() - 120_000;
  for (const [k, v] of rateLimits) if (v.start < cutoff) rateLimits.delete(k);
}, 300_000);

// Security + Cache headers (Updated for Stable Login & CORS fix)
app.use((req, res, next) => {
  // Caching Logic
  if (req.url.startsWith('/assets/')) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (req.url === '/' || req.url.endsWith('.html')) {
    res.setHeader('Cache-Control', 'no-store, must-revalidate');
    res.setHeader('CDN-Cache-Control', 'no-store');
    res.setHeader('Surrogate-Control', 'no-store');
    res.setHeader('Clear-Site-Data', '"cache"');
  }

  // --- STABLE LOGIN & SECURITY FIXES ---
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Google Popup/Redirect नीट चालण्यासाठी X-Frame-Options शिथिल केले आहे
  res.setHeader('X-Frame-Options', 'ALLOWALL'); 
  
  // रिडायरेक्ट झाल्यावर सेशन टिकवण्यासाठी
  res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
  
  // HTTPS वर कुकीज सुरक्षित ठेवण्यासाठी
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // ERR_BLOCKED_BY_RESPONSE आणि JS फाईल्स लोड होण्यासाठी
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none'); 
  
  // सेशन कुकीजसाठी
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  next();
});

// ===== /api/questions (Redis Caching Logic) =====
app.get('/api/questions/:category', async (req, res) => {
    const { category } = req.params;
    const cacheKey = `questions:${category}`;

    try {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            console.log("Serving from Redis Cache! ✅");
            return res.json(JSON.parse(cachedData));
        }

        const { data, error } = await supabase
            .from('questions')
            .select('*')
            .eq('category', category);

        if (error) throw error;

        if (data) {
            await redisClient.setEx(cacheKey, 3600, JSON.stringify(data));
            console.log("Serving from Supabase & Saved to Redis! 💾");
        }
        
        res.json(data);
    } catch (err) {
        console.error("Error fetching questions:", err);
        res.status(500).json({ error: "Failed to fetch questions" });
    }
});

// ===== /api/ai — Groq proxy =====
app.post('/api/ai', async (req, res) => {
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'unknown';
  if (!rateLimit(ip, 20, 60_000)) {
    return res.status(429).json({ error: 'जास्त requests. एक मिनिट थांबा. 🙏' });
  }
  const { messages, system, max_tokens = 600 } = req.body;
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'AI service not configured.' });
  
  const groqMessages = [];
  if (system) groqMessages.push({ role: 'system', content: system });
  groqMessages.push(...(messages?.slice(-12) || []));

  try {
    const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: groqMessages, max_tokens, temperature: 0.7 }),
    });
    const data = await upstream.json();
    res.json({ text: data?.choices?.[0]?.message?.content || '' });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Static files & SPA
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

app.listen(PORT, () => {
  console.log(`MPSC Sarathi running on port ${PORT} 🚀`);
});
