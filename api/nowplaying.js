// api/nowplaying.js
//
// Vercel Serverless Function — fogadja a Discord zenebot élő "Now Playing"
// állapotát (POST, a bottól), és kiszolgálja a weboldal widgetjének (GET).
//
// Adatbázis: Upstash Redis (a Vercel Marketplace-en keresztül telepítve).
// A Vercel a "KV_REST_API_URL" / "KV_REST_API_TOKEN" néven hozza létre a
// környezeti változókat (a régi "Vercel KV" elnevezést örökölte meg, még ha
// Upstash is van mögötte) — ezért ezeket olvassuk ki kifejezetten, nem a
// Redis.fromEnv() alapértelmezett neveit.
//
// ── Környezeti változó, amit neked kell beállítanod ─────────────────────────
// NOWPLAYING_WEBHOOK_SECRET — egy általad kitalált, hosszú, véletlenszerű
// string. Ugyanennek kell szerepelnie a bot secrets.json-jában is
// (NOWPLAYING_WEBHOOK_SECRET mezőként) — enélkül bárki tudna hamis
// "now playing" adatot küldeni ide.

const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const SECRET = process.env.NOWPLAYING_WEBHOOK_SECRET;
const STATE_TTL_SECONDS = 60; // ha a bot leáll/nem küld frissítést, 60s után magától eltűnik

module.exports = async function handler(req, res) {
  // CORS — engedjük, hogy a böngésző (a saját oldaladról) elérje ezt az API-t.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ── A bot küldi ide az állapotot ──────────────────────────────────────
  if (req.method === 'POST') {
    if (SECRET) {
      const authHeader = req.headers['authorization'] || '';
      if (authHeader !== `Bearer ${SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    }

    const data = req.body;
    if (!data || !data.guildId) {
      return res.status(400).json({ error: 'Missing guildId' });
    }

    try {
      await redis.set(`nowplaying:${data.guildId}`, JSON.stringify(data), { ex: STATE_TTL_SECONDS });
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('Redis write error:', err);
      return res.status(500).json({ error: 'Storage error' });
    }
  }

  // ── A weboldal widget lekérdezi az állapotot ──────────────────────────
  if (req.method === 'GET') {
    const guildId = req.query.guildId;
    if (!guildId) {
      return res.status(400).json({ error: 'Missing guildId query param' });
    }

    try {
      const raw = await redis.get(`nowplaying:${guildId}`);
      if (!raw) {
        return res.status(200).json({ playing: false, guildId });
      }
      const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return res.status(200).json(data);
    } catch (err) {
      console.error('Redis read error:', err);
      return res.status(500).json({ error: 'Storage error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
