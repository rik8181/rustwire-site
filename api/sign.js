// api/sign.js  (Vercel Serverless Function)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { steamId } = req.body || {};
    if (!/^\d{17}$/.test(String(steamId || ''))) {
      return res.status(400).json({ error: 'Invalid SteamID64' });
    }

    const secret = process.env.LINK_SECRET;
    if (!secret) return res.status(500).json({ error: 'LINK_SECRET not set' });

    // Payload the bot expects: { steamid, exp } signed with HMAC-SHA256
    const payload = {
      steamid: String(steamId),
      exp: Math.floor(Date.now() / 1000) + 15 * 60, // expires in 15 minutes
    };

    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');

    const crypto = await import('node:crypto');
    const sig = crypto
      .createHmac('sha256', secret)
      .update(payloadB64)
      .digest('base64url');

    return res.json({ code: `${payloadB64}.${sig}` });
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
}
