// ══════════════════════════════════════════════════════════════
// WIRE-AI CHATBOT  –  rustwire.co.uk
// Hibrid megközelítés:
//   1. Beépített tudásbázis → instant válasz, NEM igényel API-t
//   2. Ha a kérdés nem ismert → opcionális Claude API hívás
//      (csak akkor fut, ha PROXY_URL be van állítva)
// ══════════════════════════════════════════════════════════════
(function () {

    // ── Opcionális Claude proxy (ha '' hagyod, csak KB alapú válasz lesz) ──
    const PROXY_URL = '';   // pl. 'https://wireai.rustwire.workers.dev/'

    // ── Tudásbázis (pattern → válasz) ───────────────────────────────────────
    const KB = [
        // Alapvető bot-info
        {
            p: /what (is|are) rustw|mi(t csinál|csoda|nde(zt|n)? rustw|az a rustw)|rustw.*bot|bot.*rustw|tell me about rustw/i,
            a: '⚡ **RustWire** egy ingyenes Discord bot, amely valós idejű Rust játék adatokat juttat el a Discord szerverére.\n\n**Főbb funkciók:**\n• 🎮 Twitch & Kick Drop kampányok\n• 🛒 Rust Store bőrök & DLC (régió-specifikus árakkal)\n• 📰 Facepunch Devblogs, commitok\n• 🔧 Oxide/uMod frissítések\n• 🔨 Raid kalkulátor, recept, blueprint tracker\n• 🗺️ Rust+ integráció\n• 🛡️ BattleMetrics ban logger\n• 🌍 9 nyelven elérhető\n\n**Ingyenes, 24/7, reklám nélkül!**'
        },
        {
            p: /how (do i|to|can i) (add|install|invite|setup|set up)|meghívni|hozzáadni|telepít|szerverre/i,
            a: '**RustWire hozzáadása Discord szerverhez:**\n\n1. Kattints az **Enlist** gombra a weboldalon\n2. Jelentkezz be Discord fiókodba\n3. Válaszd ki a szervered\n4. Erősítsd meg az engedélyeket\n\nAz összes csatorna automatikusan létrejön! Ha nem, használd a `/rust setupchannels` parancsot.\n\n✅ **Teljesen ingyenes, nem kell bankkártya.**'
        },
        // Parancsok
        {
            p: /commands?|parancs|what can|mit tud|list.*(command|parancs)|(command|parancs).*(list|all)/i,
            a: '**RustWire parancsok:**\n\n🔧 **Alap:**\n• `/rust ping` – Késleltetés ellenőrzés\n• `/rust help` – Összes parancs\n• `/rust setupchannels` – Csatornák létrehozása\n\n📰 **Tartalom:**\n• `/rust drops` – Twitch Drop kampányok\n• `/rust kick-drops` – Kick Drop kampányok\n• `/rust devblogs` – Legújabb devblog\n• `/rust commits` – GitHub commitok\n• `/rust oxide` – Oxide/uMod frissítések\n\n🏗️ **Raid:**\n• `/raid calculate` – Raid kalkulátor\n• `/raid compare` – Módszerek összehasonlítása\n• `/raid plan` – Raid terv\n\n🛠️ **Craft & Blueprint:**\n• `/craft recipe [tárgy]` – Recept\n• `/blueprint add/list` – Blueprintek\n\n👤 **Játékos:**\n• `/rust bancheck [steamid]` – Ban ellenőrzés\n• `/rust playtime [steamid]` – Játékidő\n• `/rust inventory [steamid]` – Inventory értéke'
        },
        // Drops
        {
            p: /drops?|twitch.?drop|kick.?drop|csepp|kampány/i,
            a: '**Drop kampányok parancsok:**\n\n• `/rust drops` – Aktuális Twitch Drop kampányok (azonnal postol)\n• `/rust kick-drops` – Kick Drop kampányok\n\nA bot automatikusan posztol, amint egy új kampány elindul! Nem kell manuálisan ellenőrizni.'
        },
        // Skins / Store / DLC
        {
            p: /skin|store|dlc|bolt|bőr|régió|region|price|ár/i,
            a: '**Rust Store & DLC:**\n\n• `/rust skins` – Legújabb Rust store bőrök (régió-specifikus árak!)\n• `/rust dlc` – Rust DLC tartalmak pontos árakkal\n\n💡 A régió beállításához (admin): `/rust setregion [GB/US/HU/...]`'
        },
        // Wipe
        {
            p: /wipe|tisztítás|force wipe|következő|next.?wipe/i,
            a: '**Wipe információk:**\n\n• `/rust wipe` – Következő force wipe visszaszámlálás\n\n📅 A Rust force wipe minden hónap **első csütörtökén** van. A Live Feed-en is látható az oldalon!'
        },
        // Ban / Player check
        {
            p: /ban(check)?|vac|steam.*ban|ban.*steam|játékos.*ellenőr|player.*check/i,
            a: '**Játékos ellenőrzés:**\n\n• `/rust bancheck [steamid]` – VAC, Game, Community banok + BattleMetrics\n• `/rust bans` – Legújabb szervezeti banok (API kulcs szükséges)\n• `/rust playtime [steamid]` – Rust játékidő, top 5 játék\n• `/rust inventory [steamid]` – Inventory + piaci értékek'
        },
        // Raid calc
        {
            p: /raid|robbantás|c4|rocket|satchel|kalkulátor|calculator/i,
            a: '**Raid kalkulátor:**\n\n• `/raid calculate` – Szerkezet raid költsége\n• `/raid compare` – Módszerek összehasonlítása\n• `/raid plan` – Teljes raid terv anyag elosztással\n• `/raid materials` – Robbanószer anyagok kalkuláció\n\n💣 Mindenféle szerkezethez: fa, kő, fém, armored!'
        },
        // Craft / Blueprint
        {
            p: /craft|blueprint|recept|receptje|crafter|tárgy|item/i,
            a: '**Craft & Blueprint:**\n\n• `/craft recipe [tárgy]` – Craft recept\n• `/craft batch [tárgy] [db]` – Tömeges craft\n• `/craft team [tárgy] [db]` – Csapat anyag elosztás\n• `/blueprint add/remove/list` – Blueprint kezelés\n• `/recycle item [tárgy]` – Recycler kimenet'
        },
        // Rust+
        {
            p: /rust\+|rust plus|companion|map|térkép|in.?game chat|ingame/i,
            a: '**Rust+ Integráció:**\n\n• Élő térkép megtekintés\n• Csapat tracker\n• In-game chat Discord híd\n• Monument státusz\n\nA Rust+ funkcióhoz a Steam-en belül kell párosítani a Discord fiókodhoz.'
        },
        // Admin / Beállítás
        {
            p: /admin|beállít|setup|config|engedél|permiss|szerepkör|role/i,
            a: '**Admin parancsok:**\n\n• `/rust setupchannels` – Csatornák létrehozása/frissítése\n• `/rust repopulate` – Összes tartalom újrapostolása\n• `/rust setregion [cc]` – Régió beállítás (pl. HU, GB, US)\n• `/rust filter [on/off]` – Tartalomszűrő\n• `/wire language set [lang]` – Nyelv beállítás\n• `/wire setwelcome [csatorna]` – Üdvözlő csatorna'
        },
        // Nyelv
        {
            p: /language|lang|nyelv|magyar|hungarian|english|deutsch|translation/i,
            a: '**Támogatott nyelvek (9):**\n🇭🇺 Magyar • 🇬🇧 English • 🇩🇪 Deutsch • 🇫🇷 Français • 🇪🇸 Español • 🇵🇹 Português • 🇷🇺 Русский • 🇹🇷 Türkçe • 🇨🇳 中文\n\n**Parancs:** `/wire language set [lang]` – Admin szükséges\nJelenlegi nyelv: `/wire language current`'
        },
        // Ár / Fizetés
        {
            p: /free|ingyenes|ár|price|cost|pay|fizet|premium|subscription/i,
            a: '✅ **RustWire 100% ingyenes!**\n\nNem kell bankkártya, nem kell előfizetés, nincsenek rejtett díjak.\n\n• Nincs reklám\n• Nincs premium szint\n• 24/7 online\n• Folyamatos frissítések\n\nTeljesen ingyenes, örökre!'
        },
        // Content filter
        {
            p: /filter|spam|csam|content.*filter|szűrő|szűr/i,
            a: '**Tartalomszűrő:**\n\nA RustWire automatikusan detektálja és eltávolítja a káros tartalmakat (pl. CSAM spam linkek), azonnali ban kíséretében.\n\n**Bekapcsolás/kikapcsolás (admin):**\n`/rust filter on` vagy `/rust filter off`'
        },
        // Oxide / uMod
        {
            p: /oxide|umod|plugin|frissítés|update|release/i,
            a: '**Oxide/uMod frissítések:**\n\n• `/rust oxide` – Legújabb Oxide.Rust release\n\nA bot automatikusan posztol, ha új Oxide verzió jelenik meg. A Live Feed-en is látható.'
        },
        // Üdvözlő
        {
            p: /welcom|üdvözl|greet|hello.*join|join.*hello|belép/i,
            a: '**Üdvözlő üzenetek:**\n\nA RustWire tud üdvözlő/búcsú üzenetet küldeni csatlakozáskor.\n\n**Beállítás (admin):** `/wire setwelcome [#csatorna]`\n\nEzután minden belépőnek személyre szabott üdvözlő üzenetet küld!'
        },
        // Hiba / segítség
        {
            p: /error|hiba|nem működ|doesn.?t work|problem|issue|support|segítség/i,
            a: '**Segítség / Hibabejelentés:**\n\n1. Ellenőrizd a bot engedélyeit\n2. Próbáld `/rust setupchannels` parancsot\n3. Ha az sem segít, csatlakozz a **support szerverünkre**\n\n🌐 [rustwire.co.uk](https://rustwire.co.uk) | Discord: [Support szerver](https://discord.gg/rustwire)'
        },
        // Üdvözlés
        {
            p: /^(hi|hello|hey|szia|sziasztok|jó napot|üdv|howdy|sup)[\s!?.]*/i,
            a: '👋 **Szia! Én WIRE-AI vagyok**, a RustWire hivatalos asszisztense!\n\nFeltehetem a következő kérdéseket:\n• Hogyan adhatom hozzá a botot?\n• Milyen parancsok vannak?\n• Mit tud a RustWire?\n• Wipe, Drops, Raid kalkulátor...\n\nMiben segíthetek? 🎮'
        },
        // Köszönet
        {
            p: /thank|köszön|kösz|danke|merci|gracias/i,
            a: '😊 Szívesen! Ha más kérdésed van a RustWire-ral kapcsolatban, bármikor kérdezz!\n\n🌐 [rustwire.co.uk](https://rustwire.co.uk)'
        },
    ];

    // ── Tudásbázis keresés ───────────────────────────────────────────────────
    function kbSearch(query) {
        const q = query.trim();
        for (const entry of KB) {
            if (entry.p.test(q)) return entry.a;
        }
        return null;
    }

    // ── Markdown → HTML (alap) ──────────────────────────────────────────────
    function md2html(text) {
        return text
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
            .replace(/\n/g, '<br>');
    }

    // ── Állapot ─────────────────────────────────────────────────────────────
    let waiOpen = false;
    let waiTyping = false;
    let waiGreeted = false;
    let waiHistory = [];   // csak Claude API-hoz kell

    // ── Toggle ──────────────────────────────────────────────────────────────
    window.waiToggle = function () {
        waiOpen = !waiOpen;
        const win = document.getElementById('wai-window');
        const btn = document.getElementById('wai-btn');
        const notif = document.getElementById('wai-notif');
        win.classList.toggle('open', waiOpen);
        btn.classList.toggle('open', waiOpen);
        notif.style.display = 'none';

        if (waiOpen && !waiGreeted) {
            waiGreeted = true;
            setTimeout(() => {
                waiAddMsg('bot', '⚡ **WIRE-AI online.** Kérdezz bármit a RustWire Discord botról, parancsokról, funkciókról, vagy a Rust játékról!');
            }, 280);
        }
        if (waiOpen) setTimeout(() => document.getElementById('wai-input').focus(), 350);
    };

    // ── Quick suggestion ─────────────────────────────────────────────────────
    window.waiSuggest = function (btn) {
        const input = document.getElementById('wai-input');
        input.value = btn.textContent;
        document.getElementById('wai-suggestions').style.display = 'none';
        waiSend();
    };

    // ── Küldés ──────────────────────────────────────────────────────────────
    window.waiSend = async function () {
        const input = document.getElementById('wai-input');
        const text = input.value.trim();
        if (!text || waiTyping) return;

        document.getElementById('wai-suggestions').style.display = 'none';
        input.value = '';
        input.style.height = 'auto';

        waiAddMsg('user', text);

        // 1. Tudásbázis keresés (azonnali, API nélkül)
        const kbAnswer = kbSearch(text);
        if (kbAnswer) {
            waiSetTyping(true);
            // Kis késleltetés a természetesség kedvéért
            setTimeout(() => {
                waiSetTyping(false);
                waiAddMsg('bot', kbAnswer);
            }, 400 + Math.random() * 300);
            return;
        }

        // 2. Ha nincs KB találat és van PROXY_URL → Claude API
        if (PROXY_URL) {
            waiHistory.push({ role: 'user', content: text });
            if (waiHistory.length > 12) waiHistory = waiHistory.slice(-12);

            waiSetTyping(true);
            document.getElementById('wai-send').disabled = true;

            try {
                const SYSTEM = `You are WIRE-AI, the official AI assistant for RustWire — a free Discord bot for Rust game communities. Answer in the language the user uses. Be concise and helpful. RustWire features: Twitch/Kick Drops, Rust Store skins & DLC, Devblogs, GitHub commits, Oxide/uMod updates, BattleMetrics bans, player tools (ban check, playtime, inventory), wipe countdown, Rust+ integration, raid calculator, craft recipes, blueprint tracker, content filter, 9 languages. All features are 100% free.`;

                const res = await fetch(PROXY_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: 'claude-sonnet-4-6',
                        max_tokens: 600,
                        system: SYSTEM,
                        messages: waiHistory
                    })
                });

                if (!res.ok) throw new Error('API ' + res.status);
                const data = await res.json();
                const reply = data?.content?.[0]?.text || 'Sajnos nem tudok válaszolni erre.';
                waiHistory.push({ role: 'assistant', content: reply });
                waiSetTyping(false);
                waiAddMsg('bot', reply);
            } catch {
                waiSetTyping(false);
                waiAddMsg('bot', '⚠️ Kapcsolati hiba. Ha a kérdésed a RustWire-ral kapcsolatos, próbálj pontosabban kérdezni!');
            }

            document.getElementById('wai-send').disabled = false;
            input.focus();
            return;
        }

        // 3. Nincs KB találat, nincs API → általános útmutatás
        waiSetTyping(true);
        setTimeout(() => {
            waiSetTyping(false);
            waiAddMsg('bot', '🤔 Nem találtam egyértelmű választ erre. Próbáld pontosítani a kérdésedet!\n\nNéhány téma amiben segíthetek:\n• **Parancsok** – `milyen parancsok vannak?`\n• **Hozzáadás** – `hogyan adhatom hozzá?`\n• **Wipe/Drops** – `mikor a wipe?`\n• **Raid** – `raid kalkulátor`\n• **Ár** – `ingyenes a bot?`\n\n🌐 Részletes leírás: [rustwire.co.uk](https://rustwire.co.uk)');
        }, 350);
    };

    // ── Üzenet hozzáadása ───────────────────────────────────────────────────
    function waiAddMsg(role, text) {
        const container = document.getElementById('wai-messages');
        const isBot = role === 'bot';
        const div = document.createElement('div');
        div.className = 'wai-msg ' + role;
        div.innerHTML = `
            <div class="wai-msg-avatar">${isBot ? '🤖' : 'U'}</div>
            <div class="wai-bubble">${md2html(text)}</div>`;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
        if (!waiOpen && isBot) document.getElementById('wai-notif').style.display = 'block';
    }

    // ── Gépelés jelző ───────────────────────────────────────────────────────
    function waiSetTyping(show) {
        waiTyping = show;
        document.getElementById('wai-typing').classList.toggle('show', show);
        if (show) {
            const m = document.getElementById('wai-messages');
            m.scrollTop = m.scrollHeight;
        }
    }

    // ── DOMContentLoaded ────────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', function () {
        const input = document.getElementById('wai-input');
        if (!input) return;
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); waiSend(); }
        });
        input.addEventListener('input', function () {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 100) + 'px';
        });
    });

})();
