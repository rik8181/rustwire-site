// Vercel Serverless Function
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  // Optional: protect this endpoint
  const expected = process.env.PAIR_CALLBACK_AUTH || '';
  const auth = req.headers.authorization || '';
  if (expected && auth !== `Bearer ${expected}`) {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }

  // Get the JSON body the bot will send
  const event = req.body; // e.g. { type, steamid, discord_user_id, guild_id, at }
  console.log('Pair claimed:', event);

  // TODO: save to DB / trigger anything you want

  return res.status(200).json({ ok: true });
}
