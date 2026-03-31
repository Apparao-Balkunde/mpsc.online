import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import compression from 'compression';
import cors from 'cors';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(compression());
app.use(express.json({ limit: '1mb' }));

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
    res.setHeader('Cache-Control', 'no-store, must-revalidate');
    res.setHeader('CDN-Cache-Control', 'no-store');
    res.setHeader('Surrogate-Control', 'no-store');
    res.setHeader('Clear-Site-Data', '"cache"');
  }
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// ===== /api/ai — Groq proxy =====
app.post('/api/ai', async (req, res) => {
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'unknown';
  if (!rateLimit(ip, 20, 60_000)) {
    return res.status(429).json({ error: 'जास्त requests. एक मिनिट थांबा. 🙏' });
  }
  const { messages, system, max_tokens = 600 } = req.body;
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: 'Invalid request' });
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'AI service not configured.' });
  const groqMessages = [];
  if (system) groqMessages.push({ role: 'system', content: system });
  groqMessages.push(...messages.slice(-12));
  try {
    const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: groqMessages, max_tokens, temperature: 0.7, stream: false }),
    });
    if (!upstream.ok) {
      const errText = await upstream.text();
      if (upstream.status === 429) return res.status(429).json({ error: 'AI busy. थोड्या वेळाने पुन्हा.' });
      return res.status(502).json({ error: 'AI service unavailable' });
    }
    const data = await upstream.json();
    const text = data?.choices?.[0]?.message?.content || '';
    const usage = data?.usage;
    if (usage) console.log(`[Groq] ${usage.prompt_tokens}in + ${usage.completion_tokens}out`);
    res.json({ text });
  } catch (err) {
    console.error('[Groq Proxy] Error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ===== /api/analytics — Site stats (admin) =====
app.get('/api/analytics', async (req, res) => {
  const key = req.headers['x-admin-key'];
  if (key !== process.env.ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  res.json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    time: new Date().toISOString(),
    ai: process.env.GROQ_API_KEY ? 'enabled' : 'disabled',
  });
});

// ===== /api/push/subscribe — Save push subscription =====
const pushSubs = new Map(); // In-memory (use DB for production)

app.post('/api/push/subscribe', (req, res) => {
  const { subscription, userId } = req.body;
  if (!subscription) return res.status(400).json({ error: 'No subscription' });
  pushSubs.set(userId || 'anonymous', subscription);
  console.log(`[Push] Subscribed: ${userId || 'anonymous'} (${pushSubs.size} total)`);
  res.json({ ok: true, message: 'Push subscription saved!' });
});

// ===== /api/push/unsubscribe =====
app.post('/api/push/unsubscribe', (req, res) => {
  const { userId } = req.body;
  pushSubs.delete(userId || 'anonymous');
  res.json({ ok: true });
});

// ===== /api/push/send — Send notification (admin only) =====
app.post('/api/push/send', async (req, res) => {
  const key = req.headers['x-admin-key'];
  if (key !== process.env.ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  const { title = 'MPSC Sarathi 📚', body = 'आजचा अभ्यास झाला का?', url = '/' } = req.body;
  const payload = JSON.stringify({ title, body, url, icon: '/icon-192.png' });
  const sent = pushSubs.size;
  // Note: For real web push, use 'web-push' npm package with VAPID keys
  // This is a placeholder that logs and returns count
  console.log(`[Push] Would send to ${sent} subscribers: ${title}`);
  res.json({ ok: true, sent, message: `${sent} subscribers ला notification पाठवले` });
});

// ===== /api/health =====
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', ai: process.env.GROQ_API_KEY ? 'groq-enabled' : 'disabled', time: new Date().toISOString() });
});

// ===== ADMIN ROUTES (serve admin panel) =====
app.get('/admin', (req, res) => {
  // Admin panel is served as part of the React SPA
  // Access at /admin route
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
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

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log('-----------------------------------------');
  console.log('MPSC Sarathi running!');
  console.log('Port  :', PORT);
  // खालील ओळ दुरुस्त केली आहे:
  console.log('AI    :', process.env.GROQ_API_KEY ? 'ENABLED (Groq llama-3.3-70b)' : 'DISABLED');
  console.log('Admin :', process.env.ADMIN_KEY ? 'Protected' : 'NO KEY SET!');
  console.log('-----------------------------------------');
});
