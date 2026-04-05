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

// --- Middlewares ---
app.use(cors({ origin: true, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '1mb' }));

// --- Redis Client ---
const redisClient = createRedisClient({
    url: process.env.REDIS_URL || 'redis://mpsc_redis:6379'
});
redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.connect()
    .then(() => console.log("Redis Connected! ⚡"))
    .catch(err => console.error("Redis Connection Failed:", err));

// --- Supabase Client ---
const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

// --- Rate Limiter ---
const rateLimits = new Map();
function rateLimit(ip, max = 20, windowMs = 60000) {
    const now = Date.now();
    const entry = rateLimits.get(ip) || { count: 0, start: now };
    if (now - entry.start > windowMs) { entry.count = 0; entry.start = now; }
    entry.count++;
    rateLimits.set(ip, entry);
    return entry.count <= max;
}

// ============================================================
// ✅ SECURITY HEADERS + CSP v4 (Final Fix)
// ============================================================
// समस्या 1: Kaspersky browser extension स्वतःचे domains CSP मध्ये inject करतो
//           आणि त्यात *.adtrafficquality.google नसते → AdSense sodar block होतो
// समस्या 2: ep2, ep3... dynamically येतात — wildcard लागतो
// समस्या 3: Login error — Google OAuth redirect URL mismatch
// ============================================================
app.use((req, res, next) => {
    // Cache Control
    if (req.url.startsWith('/assets/')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (req.url === '/' || req.url.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-store, must-revalidate');
    }

    // ✅ CSP v4 — wildcard *.adtrafficquality.google for AdSense sodar scripts
    const CSP = [
        "default-src 'self' https:",

        // script-src: older browser fallback
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' " +
            "https://cdn.tailwindcss.com " +
            "https://pagead2.googlesyndication.com " +
            "https://static.cloudflareinsights.com " +
            "https://googleads.g.doubleclick.net " +
            "https://tpc.googlesyndication.com " +
            "https://www.googletagservices.com " +
            "https://adservice.google.com " +
            "https://*.adtrafficquality.google",

        // script-src-elem: modern browsers यालाच वापरतात
        // *.adtrafficquality.google → ep1, ep2, ep3... सर्व allow
        "script-src-elem 'self' 'unsafe-inline' " +
            "https://cdn.tailwindcss.com " +
            "https://pagead2.googlesyndication.com " +
            "https://static.cloudflareinsights.com " +
            "https://googleads.g.doubleclick.net " +
            "https://tpc.googlesyndication.com " +
            "https://www.googletagservices.com " +
            "https://adservice.google.com " +
            "https://*.adtrafficquality.google",

        // connect-src: Supabase + Groq + Google Ads + Google Auth
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

        "frame-src 'self' " +
            "https://googleads.g.doubleclick.net " +
            "https://tpc.googlesyndication.com " +
            "https://www.google.com " +
            "https://accounts.google.com",
    ].join("; ");

    res.setHeader("Content-Security-Policy", CSP);
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    res.setHeader('X-Frame-Options', 'ALLOWALL');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    next();
});

// ============================================================
// ✅ LOGIN FIX — Google OAuth Callback Handler
// ============================================================
// Supabase Google OAuth redirect येतो → hash (#) मध्ये error असतो
// हा route /auth/callback handle करतो — frontend ला redirect करतो
// ============================================================
app.get('/auth/callback', (req, res) => {
    // Supabase OAuth callback — frontend ला redirect करा
    // Fragment (#access_token=...) server ला येत नाही — browser handle करतो
    res.redirect('/');
});

// OAuth error redirect — Supabase error params handle करा
app.get('/', (req, res, next) => {
    // error query params असतील तर index.html serve करा (React handle करेल)
    if (req.query.error) {
        console.log('[Auth Error]', req.query.error, req.query.error_description);
    }
    next(); // static middleware ला जाऊ दे
});

// --- API: Fetch Questions ---
app.get('/api/questions/:category', async (req, res) => {
    const { category } = req.params;
    const cacheKey = `questions:${category}`;
    try {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) return res.json(JSON.parse(cachedData));
        const { data, error } = await supabase
            .from('questions').select('*').eq('category', category);
        if (error) throw error;
        if (data) await redisClient.setEx(cacheKey, 3600, JSON.stringify(data));
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch questions" });
    }
});

// --- API: AI Chat Proxy ---
app.post('/api/ai', async (req, res) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'unknown';
    if (!rateLimit(ip, 20, 60000)) {
        return res.status(429).json({ error: 'Too many requests' });
    }
    const { messages, system, prompt, max_tokens = 600 } = req.body;

    // prompt shorthand support (NewspaperSummary, AIDailyBriefing साठी)
    const msgs = messages || (prompt ? [{ role: 'user', content: prompt }] : []);

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [...(system ? [{ role: 'system', content: system }] : []), ...msgs.slice(-12)],
                max_tokens
            }),
        });
        const data = await response.json();
        const text = data?.choices?.[0]?.message?.content || '';
        res.json({ text, result: text }); // दोन्ही keys — compatibility साठी
    } catch (err) {
        res.status(500).json({ error: 'AI Error' });
    }
});

// --- Static Files & SPA Routing ---
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// --- Start Server ---
app.listen(PORT, () => console.log(`MPSC Sarathi running on port ${PORT} 🚀`));
