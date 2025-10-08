// Vercel Serverless Function: POST /api/pair-claimed
// Marks a pairing code as "claimed" so /api/pair-status can report it.

// Shared in-memory store (survives warm invocations; fine for best-effort)
let CLAIMS = global.CLAIMS || new Map();
global.CLAIMS = CLAIMS;

const TTL_MS = 5 * 60 * 1000; // 5 minutes

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  // Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  // Optional Bearer auth (set PAIR_CALLBACK_AUTH in Vercel env)
  try {
    const expected = process.env.PAIR_CALLBACK_AUTH || '';
    const auth = req.headers.authorization || '';
    if (expected && auth !== `Bearer ${expected}`) {
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }
  } catch {
    // ignore
  }

  // Parse JSON body
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

  // Accept both snake_case and camelCase
  const codeRaw = payload.code;
  const ucCode = String(codeRaw || '').toUpperCase().trim();

  const data = {
    code: ucCode,
    steamid: payload.steamid || payload.steamId || null,
    discord_user_id: payload.discord_user_id || payload.discordUserId || null,
    discord_username: payload.discord_username || payload.discordUsername || null,
    guild_id: payload.guild_id || payload.guildId || null,
    claimed_at: payload.claimed_at || payload.timestamp || payload.at || Date.now(),
    extra: payload.extra || null,
  };

  // Validation
  if (!data.code || !/^RW-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(data.code)) {
    return res.status(400).json({ ok: false, error: 'bad_code_format' });
  }
  if (!data.discord_user_id) {
    return res.status(400).json({ ok: false, error: 'missing_discord_user_id' });
  }
  if (!data.guild_id) {
    return res.status(400).json({ ok: false, error: 'missing_guild_id' });
  }

  // Prune stale claims (best-effort memory hygiene)
  try {
    const now = Date.now();
    for (const [k, v] of CLAIMS) {
      if (!v?.createdAt || now - v.createdAt > TTL_MS) {
        CLAIMS.delete(k);
      }
    }
  } catch {}

  try {
    // Record the claim so /api/pair-status?code=... returns claimed: true
    const createdAt = Date.now();
    CLAIMS.set(data.code, {
      claimed: true,
      createdAt,
      // Expose a compact "user" shape for the status endpoint/front-end
      user: data.discord_username
        ? { id: data.discord_user_id, username: data.discord_username }
        : { id: data.discord_user_id },
      // Keep extra context if you want to use it elsewhere
      guild_id: data.guild_id,
      steamid: data.steamid,
      extra: data.extra,
    });

    console.log('pair-claimed OK:', {
      code: data.code,
      steamid: data.steamid,
      discord_user_id: data.discord_user_id,
      discord_username: data.discord_username,
      guild_id: data.guild_id,
      claimed_at: data.claimed_at,
    });

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
