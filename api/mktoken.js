import crypto from 'crypto';

function b64url(s) {
  return Buffer.from(s).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok:false, error:'method_not_allowed' });
  }

  const { steamid } = req.body || {};
  if (!/^\d{17}$/.test(String(steamid||''))) {
    return res.status(400).json({ ok:false, error:'bad_steamid' });
  }

  const secret = process.env.LINK_SECRET;
  if (!secret) return res.status(500).json({ ok:false, error:'no_secret' });

  const payload = { steamid: String(steamid), exp: Math.floor(Date.now()/1000) + 3600 }; // 1 hour
  const p = b64url(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', secret).update(p).digest('base64')
    .replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');

  return res.status(200).json({ ok:true, token: `${p}.${sig}` });
}
