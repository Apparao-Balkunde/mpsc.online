import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import compression from 'compression';
import 'dotenv/config'; // ही ओळ सर्वात वर हवी!
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(compression());
app.use(express.json({ limit: '16kb' }));

// सुपॅबेस क्लायंट तयार करा
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY?.replace('>', '');
const supabase = createClient(supabaseUrl, supabaseKey);

// १. युजर डेटा सेव्ह करण्यासाठी API एंडपॉईंट
app.post('/api/save-user', async (req, res) => {
  try {
    const userData = req.body;
    const { data, error } = await supabase
      .from('users') 
      .upsert(userData, { onConflict: 'email' });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    console.error('Supabase Save Error:', err.message);
    res.status(500).json({ error: 'डेटा सेव्ह करताना अडचण आली.' });
  }
});

// २. Rate Limiter (सुरक्षेसाठी)
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

// ३. Security + Cache headers
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

// ४. AI Proxy - Groq (llama-3.3-70b)
app.post('/api/ai', async (req, res) => {
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'unknown';

  if (!rateLimit(ip, 20, 60_000)) {
    return res.status(429).json({ error: 'जास्त requests. एक मिनिट थांबा. 🙏' });
  }

  const { messages, system, max_tokens = 600 } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'AI service not configured.' });
  }

  const groqMessages = [];
  if (system) groqMessages.push({ role: 'system', content: system });
  groqMessages.push(...messages.slice(-12));

  try {
    const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: groqMessages,
        max_tokens,
        temperature: 0.7,
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      console.error('[Groq] Error:', upstream.status, errText);
      return res.status(upstream.status === 429 ? 429 : 502).json({ error: 'AI busy आहे.' });
    }

    const data = await upstream.json();
    const text = data?.choices?.[0]?.message?.content || '';
    const usage = data?.usage;
    if (usage) console.log(`[Groq] tokens: ${usage.prompt_tokens} in + ${usage.completion_tokens} out`);

    res.json({ text });
  } catch (err) {
    console.error('[Groq Proxy] Error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ५. Health Check API
app.get('/api/health', (_, res) => {
  res.json({
    status: 'ok',
    ai: process.env.GROQ_API_KEY ? 'groq-enabled' : 'disabled',
    supabase: supabaseUrl ? 'configured' : 'missing',
    time: new Date().toISOString(),
  });
});

// ६. Static Files Handling
app.use(express.static(path.join(__dirname, 'dist')));

app.get('/sitemap.xml', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'sitemap.xml'), (err) => {
    if (err) res.status(404).end();
  });
});

app.get('/robots.txt', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'robots.txt'), (err) => {
    if (err) res.status(404).send("User-agent: *\nDisallow:");
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// ७. Server Listener - (Connect Check सह)
app.listen(PORT, () => {
  console.log('-----------------------------------------');
  console.log('🚀 MPSC Sarathi Server Started!');
  console.log('📍 Port     :', PORT);
  console.log('🗄️  Supabase :', supabaseUrl ? 'CONNECTED ✅' : 'MISSING URL ❌');
  console.log('🤖 AI       :', process.env.GROQ_API_KEY ? 'Groq (llama-3.3-70b) ✅' : 'DISABLED ❌');
  console.log('-----------------------------------------');
});
