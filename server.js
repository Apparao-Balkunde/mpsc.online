import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import compression from 'compression';
import cors from 'cors';
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { createClient as createRedisClient } from 'redis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '1mb' }));

// Redis
const redisClient = createRedisClient({ url: process.env.REDIS_URL || 'redis://mpsc_redis:6379' });
redisClient.on('error', err => console.log('Redis Error', err));
redisClient.connect().then(() => console.log('Redis ⚡')).catch(err => console.error('Redis failed:', err));

// Supabase
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

// Rate limiter
const rateLimits = new Map();
function rateLimit(ip, max = 20, windowMs = 60000) {
    const now = Date.now();
    const entry = rateLimits.get(ip) || { count: 0, start: now };
    if (now - entry.start > windowMs) { entry.count = 0; entry.start = now; }
    entry.count++;
    rateLimits.set(ip, entry);
    return entry.count <= max;
}

// ═══════════════════════════════════════════════════
// ✅ SECURITY & TRUST HEADERS
// ScamAdviser trust score सुधारण्यासाठी industry-standard headers
// ═══════════════════════════════════════════════════
app.use((req, res, next) => {
    // Cache control
    if (req.url.startsWith('/assets/')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (req.url === '/' || req.url.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-store, must-revalidate');
    }

    // ✅ CSP v5 — wildcard *.adtrafficquality.google (ep1, ep2, ep3...)
    const CSP = [
        "default-src 'self' https:",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' " +
            "https://cdn.tailwindcss.com " +
            "https://pagead2.googlesyndication.com " +
            "https://static.cloudflareinsights.com " +
            "https://googleads.g.doubleclick.net " +
            "https://tpc.googlesyndication.com " +
            "https://www.googletagservices.com " +
            "https://adservice.google.com " +
            "https://*.adtrafficquality.google",
        "script-src-elem 'self' 'unsafe-inline' " +
            "https://cdn.tailwindcss.com " +
            "https://pagead2.googlesyndication.com " +
            "https://static.cloudflareinsights.com " +
            "https://googleads.g.doubleclick.net " +
            "https://tpc.googlesyndication.com " +
            "https://www.googletagservices.com " +
            "https://adservice.google.com " +
            "https://*.adtrafficquality.google",
        "connect-src 'self' " +
            "https://vswtorhncwprbxlzewar.supabase.co " +
            "wss://vswtorhncwprbxlzewar.supabase.co " +
            "https://api.groq.com " +
            "https://mpscsarathi.online " +
            "https://pagead2.googlesyndication.com " +
            "https://*.adtrafficquality.google " +
            "https://googleads.g.doubleclick.net " +
            "https://adservice.google.com " +
            "https://www.google.com " +
            "https://accounts.google.com " +
            "https://*.googleapis.com",
        "img-src 'self' data: blob: https:",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "frame-src 'self' https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com https://accounts.google.com",
    ].join("; ");

    res.setHeader("Content-Security-Policy", CSP);

    // ✅ TRUST SCORE HEADERS — ScamAdviser + security scanners check these
    // HSTS — HTTPS enforced (major trust signal)
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    // Prevent MIME sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // XSS protection (legacy browsers)
    res.setHeader('X-XSS-Protection', '1; mode=block');
    // Referrer policy — privacy friendly
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    // Permissions policy — limit browser features
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
    // CORS
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    // ✅ Site identity — ScamAdviser हे check करतो
    res.setHeader('X-Powered-By', 'MPSC Sarathi');

    next();
});

// ✅ robots.txt — clearly define crawlable content (trust signal)
app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send([
        'User-agent: *',
        'Allow: /',
        'Disallow: /api/',
        'Disallow: /admin/',
        '',
        'Sitemap: https://mpscsarathi.online/sitemap.xml',
    ].join('\n'));
});

// ✅ security.txt — industry standard trust signal
app.get('/.well-known/security.txt', (req, res) => {
    res.type('text/plain');
    res.send([
        'Contact: mailto:support@mpscsarathi.online',
        'Expires: 2026-12-31T23:59:59Z',
        'Preferred-Languages: mr, en',
        'Policy: https://mpscsarathi.online/privacy',
    ].join('\n'));
});

// ✅ Google OAuth callback
app.get('/auth/callback', (req, res) => res.redirect('/'));
app.get('/', (req, res, next) => {
    if (req.query.error) console.log('[Auth Error]', req.query.error, req.query.error_description);
    next();
});

// ✅ API: Fetch Questions
app.get('/api/questions/:category', async (req, res) => {
    const { category } = req.params;
    const cacheKey = `questions:${category}`;
    try {
        const cached = await redisClient.get(cacheKey);
        if (cached) return res.json(JSON.parse(cached));
        const { data, error } = await supabase.from('questions').select('*').eq('category', category);
        if (error) throw error;
        if (data) await redisClient.setEx(cacheKey, 3600, JSON.stringify(data));
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch questions" });
    }
});

// ✅ API: AI Chat Proxy
app.post('/api/ai', async (req, res) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'unknown';
    if (!rateLimit(ip, 20, 60000)) return res.status(429).json({ error: 'Too many requests' });

    const { messages, system, prompt, max_tokens = 600 } = req.body;
    const msgs = messages || (prompt ? [{ role: 'user', content: prompt }] : []);

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [...(system ? [{ role: 'system', content: system }] : []), ...msgs.slice(-12)],
                max_tokens
            }),
        });
        const data = await response.json();
        const text = data?.choices?.[0]?.message?.content || '';
        res.json({ text, result: text });
    } catch (err) {
        res.status(500).json({ error: 'AI Error' });
    }
});

// Static + SPA
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

app.listen(PORT, () => console.log(`MPSC Sarathi 🚀 port ${PORT}`));
