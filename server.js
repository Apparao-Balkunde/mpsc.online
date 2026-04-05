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

// --- Rate Limiter Logic ---
const rateLimits = new Map();
function rateLimit(ip, max = 20, windowMs = 60000) {
    const now = Date.now();
    const entry = rateLimits.get(ip) || { count: 0, start: now };
    if (now - entry.start > windowMs) {
        entry.count = 0;
        entry.start = now;
    }
    entry.count++;
    rateLimits.set(ip, entry);
    return entry.count <= max;
}

// --- Security & CSP Headers ---
app.use((req, res, next) => {
    // Cache Control for Assets
    if (req.url.startsWith('/assets/')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (req.url === '/' || req.url.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-store, must-revalidate');
    }

    // ✅ FIXED CSP v3 — Google AdSense sodar (ep1/ep2/ep3) + Kaspersky handled
    // NOTE: Kaspersky browser extension inject करतो — ते block होणे CORRECT आहे.
    // Google AdSense च्या sodar scripts साठी *.adtrafficquality.google wildcard वापरला.
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

        // script-src-elem: modern browsers — AdSense sodar (ep1/ep2/ep3...) साठी wildcard
        "script-src-elem 'self' 'unsafe-inline' " +
            "https://cdn.tailwindcss.com " +
            "https://pagead2.googlesyndication.com " +
            "https://static.cloudflareinsights.com " +
            "https://googleads.g.doubleclick.net " +
            "https://tpc.googlesyndication.com " +
            "https://www.googletagservices.com " +
            "https://adservice.google.com " +
            "https://*.adtrafficquality.google",

        // connect-src: Supabase, Groq AI, Google Ads quality checks
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
            "https://accounts.google.com",

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

// --- API: Fetch Questions ---
app.get('/api/questions/:category', async (req, res) => {
    const { category } = req.params;
    const cacheKey = `questions:${category}`;
    try {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) return res.json(JSON.parse(cachedData));

        const { data, error } = await supabase
            .from('questions')
            .select('*')
            .eq('category', category);

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

    const { messages, system, max_tokens = 600 } = req.body;
    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [...(system ? [{ role: 'system', content: system }] : []), ...(messages?.slice(-12) || [])],
                max_tokens
            }),
        });
        const data = await response.json();
        res.json({ text: data?.choices?.[0]?.message?.content || '' });
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
