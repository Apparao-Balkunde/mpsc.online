import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import compression from 'compression';
import 'dotenv/config'; // ही ओळ सर्वात वर हवी!

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(compression());
app.use(express.json({ limit: '16kb' }));

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

// Security + Cache headers
app.use((req, res, next) => {
  if (req.url.startsWith('/assets/')) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (req.url === '/' || req.url.endsWith('.html')) {
    res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
  }
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// /api/ai -- Groq proxy (FREE, no credit card)
app.post('/api/ai', async (req, res) => {
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'unknown';

  // 20 AI calls/min per IP (Groq free limit is generous, but protect server)
  if (!rateLimit(ip, 20, 60_000)) {
    return res.status(429).json({ error: 'जास्त requests. एक मिनिट थांबा. 🙏' });
  }

  const { messages, system, max_tokens = 600 } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'AI service not configured. GROQ_API_KEY set करा.' });
  }

  // Build messages array with optional system prompt
  const groqMessages = [];
  if (system) {
    groqMessages.push({ role: 'system', content: system });
  }
  groqMessages.push(...messages.slice(-12)); // last 12 for context window

  try {
    const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile', // best free model
        messages: groqMessages,
        max_tokens,
        temperature: 0.7,
        stream: false,
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      console.error('[Groq] Error:', upstream.status, errText);

      // Rate limit hit -- Groq returns 429
      if (upstream.status === 429) {
        return res.status(429).json({ error: 'AI busy आहे. थोड्या वेळाने पुन्हा प्रयत्न करा.' });
      }
      return res.status(502).json({ error: 'AI service temporarily unavailable' });
    }

    const data = await upstream.json();
    const text = data?.choices?.[0]?.message?.content || '';

    // Log token usage (optional -- to monitor free tier)
    const usage = data?.usage;
    if (usage) {
      console.log(`[Groq] tokens: ${usage.prompt_tokens} in + ${usage.completion_tokens} out`);
    }

    res.json({ text });

  } catch (err) {
    console.error('[Groq Proxy] Error:', err);
    res.status(500).json({ error: 'Server error. पुन्हा प्रयत्न करा.' });
  }
});

// Health check
app.get('/api/health', (_, res) => {
  res.json({
    status: 'ok',
    ai: process.env.GROQ_API_KEY ? 'groq-enabled' : 'disabled',
    time: new Date().toISOString(),
  });
});

// Static files
app.use(express.static(path.join(__dirname, 'dist')));

app.get('/sitemap.xml', (req, res) => {
  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.sendFile(path.join(__dirname, 'dist', 'sitemap.xml'));
});

app.get('/robots.txt', (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.sendFile(path.join(__dirname, 'dist', 'robots.txt'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log('-----------------------------------------');
  console.log('MPSC Sarathi running!');
  console.log('Port :', PORT);
  console.log('AI   :', process.env.GROQ_API_KEY ? 'Groq FREE (llama-3.3-70b)' : 'DISABLED - set GROQ_API_KEY');
  console.log('-----------------------------------------');
});
