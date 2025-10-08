// api/sign.js — Vercel (Node runtime)
// Signs a short-lived code for linking (steamId + token) using HMAC(SHA-256).

// ---- Helpers ----
function send(res, status, data, extraHeaders = {}) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  for (const [k, v] of Object.entries(extraHeaders)) res.setHeader(k, v);
  res.end(JSON.stringify(data));
}

// Read and parse body safely (JSON or x-www-form-urlencoded)
async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  const ct = (req.headers['content-type'] || '').toLowerCase();

  if (ct.includes('application/json')) {
    try { return JSON.parse(raw || '{}'); } catch { return {}; }
  }
  if (ct.includes('application/x-www-form-urlencoded')) {
    const params = new URLSearchParams(raw);
    const obj = {};
    for (const [k, v] of params.entries()) obj[k] = v;
    return obj;
  }
  // Fallback: try JSON, then empty
  try { return JSON.parse(raw || '{}'); } catch { return {}; }
}

// Basic CORS (no credentials)
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

export default async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(204);
    for (const [k, v] of Object.entries(CORS_HEADERS)) res.setHeader(k, v);
    return res.end();
  }

  if (req.method !== 'POST') {
    return send(res, 405, { error: 'Method not allowed' }, CORS_HEADERS);
  }

  try {
    const body = await readBody(req);
    const steamId = String(body.steamId || '').trim();
    const token   = String(body.token   || '').trim();

    if (!/^\d{17}$/.test(steamId)) {
      return send(res, 400, { error: 'Invalid SteamID64' }, CORS_HEADERS);
    }
    if (!token || token.length < 16) {
      return send(res, 400, { error: 'Invalid token' }, CORS_HEADERS);
    }

    const secret = process.env.LINK_SECRET;
    if (!secret) {
      return send(res, 500, { error: 'LINK_SECRET not set' }, CORS_HEADERS);
    }

    // TTL (seconds) — defaults to 10 minutes; override with env LINK_TTL_SEC
    const ttlSec = Math.max(60, Number(process.env.LINK_TTL_SEC || 600));
    const nowMs  = Date.now();
    const expMs  = nowMs + ttlSec * 1000;

    // Payload is compact and versioned
    const payload = {
      v: 1,
      steamId,
      token,
      iat: nowMs,
      exp: expMs
    };

    const payloadJson = JSON.stringify(payload);
    const payloadB64  = Buffer.from(payloadJson, 'utf8').toString('base64url');

    const crypto = await import('node:crypto');
    const sig = crypto
      .createHmac('sha256', secret)
      .update(payloadB64)
      .digest('base64url');

    return send(
      res,
      200,
      { code: `${payloadB64}.${sig}`, ttlSec, expiresAt: expMs },
      CORS_HEADERS
    );
  } catch (e) {
    return send(res, 500, { error: 'Server error' }, CORS_HEADERS);
  }
}
