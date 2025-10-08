// Vercel Serverless Function: POST /api/pair-claimed
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  // Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  // Optional auth via Bearer token (set PAIR_CALLBACK_AUTH in Vercel env)
  try {
    const expected = process.env.PAIR_CALLBACK_AUTH || '';
    const auth = req.headers.authorization || '';
    if (expected && auth !== `Bearer ${expected}`) {
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }
  } catch {
    // fall through – treat as unauthorized below if needed
  }

  // Parse JSON body (works if body is already an object or a JSON string)
  let payload = req.body;
  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload);
    } catch {
      return res.status(400).json({ ok: false, error: 'invalid_json' });
    }
  }
  if (!payload || typeof payload !== 'object') {
    return res.status(400).json({ ok: false, error: 'missing_body' });
  }

  // Accept both snake_case and camelCase from different callers
  const data = {
    code: payload.code,
    steamid: payload.steamid || payload.steamId || null,
    discord_user_id: payload.discord_user_id || payload.discordUserId || null,
    discord_username: payload.discord_username || payload.discordUsername || null,
    guild_id: payload.guild_id || payload.guildId || null,
    claimed_at: payload.claimed_at || payload.timestamp || payload.at || Date.now(),
    // pass-through for anything else you might add later:
    extra: payload.extra || null,
  };

  // Basic validation
  if (!data.code || !/^RW-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(String(data.code).toUpperCase())) {
    return res.status(400).json({ ok: false, error: 'bad_code_format' });
  }
  if (!data.discord_user_id) {
    return res.status(400).json({ ok: false, error: 'missing_discord_user_id' });
  }
  if (!data.guild_id) {
    return res.status(400).json({ ok: false, error: 'missing_guild_id' });
  }

  // ---- TODO: persist or trigger something useful ----
  // Example ideas:
  // - Write to your DB (Supabase/PlanetScale/Firestore/etc.)
  // - Call a Discord webhook to notify staff
  // - Mark the code as "claimed" in your own storage to show UI state
  //
  // This function runs server-side on Vercel; avoid writing to the filesystem
  // (it’s ephemeral). Use a database or external API instead.

  try {
    console.log('pair-claimed OK:', {
      code: data.code,
      steamid: data.steamid,
      discord_user_id: data.discord_user_id,
      discord_username: data.discord_username,
      guild_id: data.guild_id,
      claimed_at: data.claimed_at,
    });

    // Example success response the bot/site can read
    return res.status(200).json({
      ok: true,
      code: data.code,
      guild_id: data.guild_id,
      discord_user_id: data.discord_user_id,
      claimed_at: data.claimed_at,
    });
  } catch (e) {
    console.error('pair-claimed error:', e);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
}
