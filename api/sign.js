// api/sign.js  (Node runtime on Vercel)
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { steamId, token } = req.body || {};
    if (!/^\d{17}$/.test(String(steamId || ''))) {
      return res.status(400).json({ error: 'Invalid SteamID64' });
    }
    if (!token || String(token).length < 16) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    const secret = process.env.LINK_SECRET;
    if (!secret) return res.status(500).json({ error: 'LINK_SECRET not set' });

    // Create a compact signed “code” = base64url(payload) + '.' + base64url(HMAC)
    const payload = { steamId: String(steamId), token: String(token), ts: Date.now() };
    const payloadJson = JSON.stringify(payload);
    const payloadB64 = Buffer.from(payloadJson).toString('base64url');

    const crypto = await import('node:crypto');
    const sig = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');

    return res.json({ code: `${payloadB64}.${sig}` });
  } catch (e) {
    return res.status(500).json({ error: 'Server error' });
  }
}
