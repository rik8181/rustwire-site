// RustWire website — Live Feed data (Vercel serverless function → /api/feed)
// Fetches Steam news, Facepunch commits and Twitch/Kick Drops on the server,
// where browser CORS rules don't apply. Cached at Vercel's edge for 10 minutes.

const UA = { 'User-Agent': 'Mozilla/5.0 (compatible; RustWireSite/1.0; +https://rustwire.co.uk)' };

async function get(url, type = 'text') {
  const res = await fetch(url, { headers: UA, redirect: 'follow', signal: AbortSignal.timeout(9000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return type === 'json' ? res.json() : res.text();
}

const decode = (t = '') => t
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
  .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
const plain = (t = '') => decode(t).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

// ---------- Steam news ----------
// Text from Steam's official news API; the big cover image from the Steam RSS
// feed (<enclosure>), because the cover is usually NOT inside the post text.
async function steamCovers() {
  try {
    const xml = await get('https://store.steampowered.com/feeds/news/app/252490/');
    const covers = new Map();
    for (const [, it] of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
      const title = plain((it.match(/<title[^>]*>([\s\S]*?)<\/title>/) || [])[1] || '');
      const encl = (it.match(/<enclosure[^>]+url="([^"]+)"/i) || [])[1];
      const inText = (decode((it.match(/<description[^>]*>([\s\S]*?)<\/description>/) || [])[1] || '').match(/<img[^>]+src=["']?([^"' >]+)/i) || [])[1];
      const img = encl || inText;
      if (title && img) covers.set(title.toLowerCase(), decode(img));
    }
    return covers;
  } catch { return new Map(); }
}

async function devblogs() {
  const [json, covers] = await Promise.all([
    get('https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=252490&count=8&maxlength=0&format=json', 'json'),
    steamCovers(),
  ]);
  return (json.appnews?.newsitems || [])
    .filter(n => n.feedname === 'steam_community_announcements' || n.feed_type === 1)
    .slice(0, 2)
    .map(n => {
      const contents = n.contents || '';
      const clanImg = contents.match(/\{STEAM_CLAN_IMAGE\}\/([^\s\[\]"']+)/);
      const plainImg = contents.match(/https?:\/\/[^\s\[\]"'<>]+\.(?:jpg|jpeg|png|gif|webp)/i);
      const image = covers.get((n.title || '').toLowerCase())
        || (clanImg ? 'https://clan.akamai.steamstatic.com/images/' + clanImg[1] : '')
        || (plainImg ? plainImg[0] : '');
      const text = contents
        .replace(/\{STEAM_CLAN_IMAGE\}\/[^\s\[\]"']+/g, '')
        .replace(/\[\/?[^\]]+\]/g, ' ');
      return {
        title: n.title || '',
        date: new Date(n.date * 1000).toISOString(),
        link: n.url,
        description: plain(text).slice(0, 180),
        image,
      };
    });
}

// ---------- Facepunch commits (JSON, falls back to RSS) ----------
async function commits() {
  try {
    const json = await get('https://commits.facepunch.com/?format=json', 'json');
    const list = (json.results || (Array.isArray(json) ? json : []))
      .filter(c => (c.message || '').trim() && (!c.repo || /rust/i.test(c.repo)))
      .slice(0, 2)
      .map(c => ({
        title: (c.message || '').split('\n')[0].trim(),
        date: c.created || c.date || '',
        link: c.id ? `https://commits.facepunch.com/${c.id}` : 'https://commits.facepunch.com/',
        description: [c.user?.name || c.author, c.branch].filter(Boolean).join(' • '),
        image: '',
      }));
    if (list.length) return list;
  } catch { /* try RSS */ }
  const xml = await get('https://commits.facepunch.com/?format=rss');
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 2).map(([, it]) => {
    const tag = n => (it.match(new RegExp(`<${n}[^>]*>([\\s\\S]*?)</${n}>`)) || [])[1] || '';
    return { title: plain(tag('title')), date: tag('pubDate'), link: plain(tag('link')), description: plain(tag('description')).slice(0, 180), image: '' };
  }).filter(i => i.title);
}

// ---------- Twitch / Kick Drops (same scraping as the RustWire bot) ----------
async function drops(url, platform, how) {
  const html = await get(url);
  const body = plain(html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' '));
  const rm = body.match(/Round\s+(\d+)\s+(.+?)\s+Event\s+(Live|Upcoming|Ended)/i);
  const ts = [...html.matchAll(/data-date-id="[^"]*?(\d{9,13})"/g)].map(m => +m[1]).map(t => t < 1e12 ? t * 1000 : t).sort((a, b) => a - b);
  if (!rm || !ts.length) return null;
  const end = ts[ts.length - 1];
  if (/ended/i.test(rm[3]) || Date.now() > end) return null;

  const rewards = []; const seen = new Set();
  for (const m of html.matchAll(/src="(https:\/\/files\.facepunch\.com\/[^"]+\.(?:jpg|jpeg|png|webp))"/gi)) {
    if (/logo|marque|header/i.test(m[1])) continue;
    // Only the text that belongs to this image: up to the next <img>
    const tagEnd = html.indexOf('>', m.index) + 1;
    const rest = html.substring(tagEnd, tagEnd + 600);
    const cut = rest.search(/<img/i);
    const snip = plain(cut > -1 ? rest.slice(0, cut) : rest);
    const nh = snip.match(/^\s*([A-Za-z][A-Za-z0-9\s\-']{1,30}?)\s+(\d+)\s+Hours?/i);
    if (!nh) continue;
    const name = nh[1].trim().replace(/^[\s\W]+/, '');
    if (!name || seen.has(name)) continue;
    seen.add(name); rewards.push({ name, hours: +nh[2] });
    if (rewards.length >= 8) break;
  }
  const imgM = [...html.matchAll(/<img[^>]+src="([^"]+)"/gi)].map(m => m[1]).find(s => s.includes('facepunch.com') && !/logo|marque|svg/i.test(s));
  return {
    active: true, auto: true, status: rm[3], platform,
    title: `Round ${rm[1]} — ${rm[2].trim()}`,
    reward: rewards.length ? rewards.slice(0, 3).map(r => `${r.name} (${r.hours}h)`).join(', ') + (rewards.length > 3 ? ` +${rewards.length - 3} more` : '') : 'See the campaign page',
    start: new Date(ts[0]).toISOString(),
    end: new Date(end).toISOString(),
    link: url,
    image: imgM ? (imgM.startsWith('http') ? imgM : 'https://files.facepunch.com' + imgM) : '',
    desc: `${how} to earn ${rewards.length ? rewards.map(r => r.name).join(', ') : 'free in-game items'}.`,
  };
}

export default async function handler(req, res) {
  const errors = {};
  const safe = (name, p) => p.catch(e => { errors[name] = e.message; return name.startsWith('drops') ? null : []; });
  const [d, c, tw, kk] = await Promise.all([
    safe('devblogs', devblogs()),
    safe('commits', commits()),
    safe('drops_twitch', drops('https://twitch.facepunch.com/', 'Twitch', 'Watch any Rust stream on Twitch with the Drops Enabled tag')),
    safe('drops_kick', drops('https://kick.facepunch.com/', 'Kick', 'Watch any Rust stream on Kick with the Drops Enabled tag')),
  ]);
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1800');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({ at: new Date().toISOString(), devblogs: d, commits: c, drops: { twitch: tw, kick: kk }, errors });
}
