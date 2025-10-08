// api/pair-status.js
let CLAIMS = global.CLAIMS || new Map();
global.CLAIMS = CLAIMS;

const TTL_MS = 5 * 60 * 1000; // 5 minutes

export default function handler(req, res) {
  const code = String(req.query.code || '').toUpperCase().trim();
  if (!code) return res.status(400).json({ error: 'Missing code' });

  const rec = CLAIMS.get(code);
  if (!rec) return res.status(200).json({ claimed: false });

  // Expire old claims
  if (Date.now() - rec.createdAt > TTL_MS) {
    CLAIMS.delete(code);
    return res.status(200).json({ claimed: false });
  }

  return res.status(200).json({
    claimed: !!rec.claimed,
    user: rec.user || null,
  });
}
