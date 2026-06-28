// ══════════════════════════════════════════════════════════════
// WIRE-AI CHATBOT  –  rustwire.co.uk
// Hybrid approach:
//   1. Built-in knowledge base → instant answer, no API needed
//   2. Unknown question → optional Claude API call
//      (only runs if PROXY_URL is set)
// Language: auto-detects from user input, responds in same language
// ══════════════════════════════════════════════════════════════
(function () {

    // ── Optional Claude proxy (leave '' for KB-only mode) ────────
    const PROXY_URL = '';   // e.g. 'https://wireai.rustwire.workers.dev/'

    // ── Language detection ────────────────────────────────────────
    const HU_PATTERN = /[áéíóöőúüűÁÉÍÓÖŐÚÜŰ]|mikor|hogyan|miért|mit|mi(t|nek|vel|ről|re|ben|nek)?|van.e|tud|kell|lehet|parancs|ingyenes|szerver|játék|hozzá|beállít|csinál|milyen|melyik|mennyi/i;

    function isHungarian(text) {
        return HU_PATTERN.test(text);
    }

    // ── Knowledge base (bilingual) ────────────────────────────────
    const KB = [
        {
            p: /what (is|are) rustw|rustw.*bot|bot.*rustw|tell me about rustw|about rustw|mi(t csinál|csoda|az a rustw)|mi a rustw/i,
            en: '⚡ **RustWire** is a free Discord bot that delivers real-time Rust game data straight to your Discord server.\n\n**Key features:**\n• 🎮 Twitch & Kick Drop campaigns\n• 🛒 Rust Store skins & DLC (region-aware pricing)\n• 📰 Facepunch Devblogs & commits\n• 🔧 Oxide/uMod release updates\n• 🔨 Raid calculator, recipes, blueprint tracker\n• 🗺️ Rust+ integration\n• 🛡️ BattleMetrics ban logger\n• 🌍 Available in 9 languages\n\n**Free, 24/7, no ads!**',
            hu: '⚡ **RustWire** egy ingyenes Discord bot, amely valós idejű Rust játék adatokat juttat el a Discord szerveredre.\n\n**Főbb funkciók:**\n• 🎮 Twitch & Kick Drop kampányok\n• 🛒 Rust Store bőrök & DLC (régió-specifikus árak)\n• 📰 Facepunch Devblogs és commitok\n• 🔧 Oxide/uMod frissítések\n• 🔨 Raid kalkulátor, receptek, blueprint tracker\n• 🗺️ Rust+ integráció\n• 🛡️ BattleMetrics ban logger\n• 🌍 9 nyelven elérhető\n\n**Ingyenes, 24/7, reklám nélkül!**'
        },
        {
            p: /how (do i|to|can i) (add|install|invite|setup|set up)|add.*bot|invite.*bot|meghívni|hozzáadni|telepít|hogyan adh/i,
            en: '**How to add RustWire to your server:**\n\n1. Click the **Enlist** button on the website\n2. Log in with your Discord account\n3. Select your server\n4. Confirm the permissions\n\nAll channels are created automatically! If not, run `/rust setupchannels`.\n\n✅ **Completely free, no credit card needed.**',
            hu: '**RustWire hozzáadása Discord szerverhez:**\n\n1. Kattints az **Enlist** gombra a weboldalon\n2. Jelentkezz be Discord fiókoddal\n3. Válaszd ki a szervered\n4. Erősítsd meg az engedélyeket\n\nAz összes csatorna automatikusan létrejön! Ha nem, használd a `/rust setupchannels` parancsot.\n\n✅ **Teljesen ingyenes, nem kell bankkártya.**'
        },
        {
            p: /command|what can|list.*command|all.*command|parancs|mit tud|milyen parancs/i,
            en: '**RustWire Commands:**\n\n🔧 **General:**\n• `/rust ping` – Latency check\n• `/rust help` – All commands\n• `/rust setupchannels` – Create feed channels\n\n📰 **Content:**\n• `/rust drops` – Twitch Drop campaigns\n• `/rust kick-drops` – Kick Drop campaigns\n• `/rust devblogs` – Latest Facepunch devblog\n• `/rust commits` – GitHub commits\n• `/rust oxide` – Oxide/uMod updates\n• `/rust skins` – Rust store skins\n• `/rust dlc` – DLC with region prices\n\n🏗️ **Raid:**\n• `/raid calculate` – Raid cost calculator\n• `/raid compare` – Compare raid methods\n• `/raid plan` – Full raid plan\n\n🛠️ **Craft & Blueprint:**\n• `/craft recipe [item]` – Craft recipe\n• `/blueprint add/list` – Blueprint tracker\n\n👤 **Player:**\n• `/rust bancheck [steamid]` – Ban check\n• `/rust playtime [steamid]` – Hours played\n• `/rust inventory [steamid]` – Inventory value',
            hu: '**RustWire Parancsok:**\n\n🔧 **Általános:**\n• `/rust ping` – Késleltetés ellenőrzés\n• `/rust help` – Összes parancs\n• `/rust setupchannels` – Csatornák létrehozása\n\n📰 **Tartalom:**\n• `/rust drops` – Twitch Drop kampányok\n• `/rust kick-drops` – Kick Drop kampányok\n• `/rust devblogs` – Legújabb devblog\n• `/rust commits` – GitHub commitok\n• `/rust oxide` – Oxide/uMod frissítések\n• `/rust skins` – Rust store bőrök\n• `/rust dlc` – DLC régió-specifikus árakkal\n\n🏗️ **Raid:**\n• `/raid calculate` – Raid kalkulátor\n• `/raid compare` – Módszerek összehasonlítása\n• `/raid plan` – Teljes raid terv\n\n🛠️ **Craft & Blueprint:**\n• `/craft recipe [tárgy]` – Craft recept\n• `/blueprint add/list` – Blueprint tracker\n\n👤 **Játékos:**\n• `/rust bancheck [steamid]` – Ban ellenőrzés\n• `/rust playtime [steamid]` – Játékidő\n• `/rust inventory [steamid]` – Inventory értéke'
        },
        {
            p: /drops?|twitch.?drop|kick.?drop|campaign|kampány/i,
            en: '**Drop Campaigns:**\n\n• `/rust drops` – Current Twitch Drop campaigns (posts instantly)\n• `/rust kick-drops` – Kick Drop campaigns\n\nThe bot posts automatically the moment a new campaign goes live — no need to check manually!',
            hu: '**Drop kampányok:**\n\n• `/rust drops` – Aktuális Twitch Drop kampányok (azonnal poszt)\n• `/rust kick-drops` – Kick Drop kampányok\n\nA bot automatikusan posztol, amint egy új kampány elindul — nem kell manuálisan ellenőrizni!'
        },
        {
            p: /skin|store|dlc|region|price|ár|bőr|régió/i,
            en: '**Rust Store & DLC:**\n\n• `/rust skins` – Latest Rust store skins (region-aware prices)\n• `/rust dlc` – Rust DLC with accurate regional pricing\n\n💡 To set your region (admin): `/rust setregion [GB/US/HU/...]`',
            hu: '**Rust Store & DLC:**\n\n• `/rust skins` – Legújabb Rust store bőrök (régió-specifikus árak)\n• `/rust dlc` – Rust DLC pontos regionális árakkal\n\n💡 Régió beállítás (admin): `/rust setregion [GB/US/HU/...]`'
        },
        {
            p: /wipe|force wipe|next wipe|következő.*wipe|mikor.*wipe/i,
            en: '**Wipe Info:**\n\n• `/rust wipe` – Next force wipe countdown\n\n📅 Rust force wipe happens every **first Thursday of the month**. Also visible in the Live Feed on the website!',
            hu: '**Wipe információk:**\n\n• `/rust wipe` – Következő force wipe visszaszámlálás\n\n📅 A Rust force wipe minden hónap **első csütörtökén** van. A weboldalon a Live Feed-en is látható!'
        },
        {
            p: /ban(check)?|vac|steam.*ban|player.*check|játékos.*ellenőr/i,
            en: '**Player Checks:**\n\n• `/rust bancheck [steamid]` – VAC, Game & Community bans + BattleMetrics\n• `/rust bans` – Latest org bans (BattleMetrics API key required)\n• `/rust playtime [steamid]` – Rust hours, top 5 games\n• `/rust inventory [steamid]` – Inventory with market values',
            hu: '**Játékos ellenőrzés:**\n\n• `/rust bancheck [steamid]` – VAC, Game & Community banok + BattleMetrics\n• `/rust bans` – Legújabb szervezeti banok (API kulcs szükséges)\n• `/rust playtime [steamid]` – Rust játékidő, top 5 játék\n• `/rust inventory [steamid]` – Inventory piaci értékkel'
        },
        {
            p: /raid|c4|rocket|satchel|calculator|kalkulátor|robbantás/i,
            en: '**Raid Calculator:**\n\n• `/raid calculate` – Raid cost for any structure\n• `/raid compare` – Compare all raid methods side by side\n• `/raid plan` – Full raid plan with material splitting\n• `/raid materials` – Calculate explosives materials\n\n💣 Works for all wall types: wood, stone, metal, armored!',
            hu: '**Raid Kalkulátor:**\n\n• `/raid calculate` – Raid költség bármilyen szerkezethez\n• `/raid compare` – Összes módszer összehasonlítása\n• `/raid plan` – Teljes raid terv anyag elosztással\n• `/raid materials` – Robbanószer anyagok kalkuláció\n\n💣 Minden falhoz: fa, kő, fém, armored!'
        },
        {
            p: /craft|blueprint|recipe|recept|crafting/i,
            en: '**Craft & Blueprint:**\n\n• `/craft recipe [item]` – Crafting recipe\n• `/craft batch [item] [qty]` – Bulk crafting materials\n• `/craft team [item] [qty]` – Split materials for your team\n• `/blueprint add/remove/list` – Manage learned blueprints\n• `/recycle item [item]` – Recycler output',
            hu: '**Craft & Blueprint:**\n\n• `/craft recipe [tárgy]` – Craft recept\n• `/craft batch [tárgy] [db]` – Tömeges craft anyagok\n• `/craft team [tárgy] [db]` – Csapat anyag elosztás\n• `/blueprint add/remove/list` – Blueprint kezelés\n• `/recycle item [tárgy]` – Recycler kimenet'
        },
        {
            p: /rust\+|rust plus|companion|live map|ingame chat|in-game/i,
            en: '**Rust+ Integration:**\n\n• Live map viewer\n• Team tracker\n• In-game chat ↔ Discord bridge\n• Monument status\n\nRequires pairing your Discord account via the Rust+ companion app in Steam.',
            hu: '**Rust+ Integráció:**\n\n• Élő térkép megtekintés\n• Csapat tracker\n• In-game chat ↔ Discord híd\n• Monument státusz\n\nSteam-ben a Rust+ companion app-on keresztül kell párosítani a Discord fiókodhoz.'
        },
        {
            p: /admin|setup|config|permission|role|beállít|engedél|szerepkör/i,
            en: '**Admin Commands:**\n\n• `/rust setupchannels` – Create/refresh feed channels\n• `/rust repopulate` – Repost all content\n• `/rust setregion [cc]` – Set region (e.g. GB, US, HU)\n• `/rust filter [on/off]` – Content filter\n• `/wire language set [lang]` – Set language\n• `/wire setwelcome [#channel]` – Set welcome channel',
            hu: '**Admin Parancsok:**\n\n• `/rust setupchannels` – Csatornák létrehozása/frissítése\n• `/rust repopulate` – Összes tartalom újrapostolása\n• `/rust setregion [cc]` – Régió beállítás (pl. GB, US, HU)\n• `/rust filter [on/off]` – Tartalomszűrő\n• `/wire language set [lang]` – Nyelv beállítás\n• `/wire setwelcome [#csatorna]` – Üdvözlő csatorna'
        },
        {
            p: /language|lang|translation|multilingual|nyelv|fordítás/i,
            en: '**Supported Languages (9):**\n🇬🇧 English • 🇭🇺 Magyar • 🇩🇪 Deutsch • 🇫🇷 Français • 🇪🇸 Español • 🇵🇹 Português • 🇷🇺 Русский • 🇹🇷 Türkçe • 🇨🇳 中文\n\n**Command:** `/wire language set [lang]` (admin only)\nCheck current: `/wire language current`',
            hu: '**Támogatott nyelvek (9):**\n🇬🇧 English • 🇭🇺 Magyar • 🇩🇪 Deutsch • 🇫🇷 Français • 🇪🇸 Español • 🇵🇹 Português • 🇷🇺 Русский • 🇹🇷 Türkçe • 🇨🇳 中文\n\n**Parancs:** `/wire language set [lang]` (admin szükséges)\nJelenlegi: `/wire language current`'
        },
        {
            p: /free|cost|price|pay|subscription|premium|ingyenes|ár|fizet|előfizet/i,
            en: '✅ **RustWire is 100% free!**\n\nNo credit card, no subscription, no hidden fees.\n\n• No ads\n• No premium tier\n• 24/7 online\n• Constantly updated\n\nFree forever!',
            hu: '✅ **RustWire 100% ingyenes!**\n\nNem kell bankkártya, előfizetés, nincsenek rejtett díjak.\n\n• Nincs reklám\n• Nincs premium szint\n• 24/7 online\n• Folyamatos frissítések\n\nÖrökre ingyenes!'
        },
        {
            p: /filter|spam|csam|content filter|szűrő/i,
            en: '**Content Filter:**\n\nRustWire automatically detects and removes harmful content (e.g. CSAM spam links) with an instant ban.\n\n**Toggle (admin):** `/rust filter on` or `/rust filter off`',
            hu: '**Tartalomszűrő:**\n\nA RustWire automatikusan detektálja és eltávolítja a káros tartalmakat (pl. CSAM spam linkek), azonnali ban kíséretében.\n\n**Be/kikapcsolás (admin):** `/rust filter on` vagy `/rust filter off`'
        },
        {
            p: /oxide|umod|plugin|update|release|frissítés/i,
            en: '**Oxide/uMod Updates:**\n\n• `/rust oxide` – Latest Oxide.Rust release\n\nThe bot automatically posts when a new Oxide version is released. Also visible in the Live Feed.',
            hu: '**Oxide/uMod Frissítések:**\n\n• `/rust oxide` – Legújabb Oxide.Rust release\n\nA bot automatikusan posztol, ha új Oxide verzió jelenik meg. A Live Feed-en is látható.'
        },
        {
            p: /error|problem|issue|not work|support|help|segítség|hiba|nem működ/i,
            en: '**Support / Bug Report:**\n\n1. Check bot permissions in your server\n2. Try `/rust setupchannels`\n3. Still broken? Join our **support server**\n\n🌐 [rustwire.co.uk](https://rustwire.co.uk)',
            hu: '**Segítség / Hibabejelentés:**\n\n1. Ellenőrizd a bot engedélyeit\n2. Próbáld `/rust setupchannels` parancsot\n3. Ha sem segít, csatlakozz a **support szerverünkre**\n\n🌐 [rustwire.co.uk](https://rustwire.co.uk)'
        },
        {
            p: /^(hi|hello|hey|howdy|sup|yo|greetings)[\s!?.]*$/i,
            en: '👋 **Hey! I\'m WIRE-AI**, the official RustWire assistant!\n\nI can help you with:\n• What RustWire can do\n• All bot commands\n• How to add the bot\n• Wipe, Drops, Raid calculator...\n\nWhat can I help you with? 🎮',
            hu: '👋 **Szia! Én WIRE-AI vagyok**, a RustWire hivatalos asszisztense!\n\nSegíthetek ezekben:\n• Mit tud a RustWire\n• Összes bot parancs\n• Hogyan adható hozzá\n• Wipe, Drops, Raid kalkulátor...\n\nMiben segíthetek? 🎮'
        },
        {
            p: /^(szia|sziasztok|üdv|helló|jó napot|jónap)[\s!?.]*$/i,
            en: null,
            hu: '👋 **Szia! Én WIRE-AI vagyok**, a RustWire hivatalos asszisztense!\n\nSegíthetek ezekben:\n• Mit tud a RustWire\n• Összes bot parancs\n• Hogyan adható hozzá\n• Wipe, Drops, Raid kalkulátor...\n\nMiben segíthetek? 🎮'
        },
        {
            p: /thank|thanks|thx|köszön|kösz|thx/i,
            en: '😊 Happy to help! Feel free to ask anything else about RustWire.\n\n🌐 [rustwire.co.uk](https://rustwire.co.uk)',
            hu: '😊 Szívesen! Ha más kérdésed van, bármikor kérdezz!\n\n🌐 [rustwire.co.uk](https://rustwire.co.uk)'
        },
    ];

    // ── KB search with language detection ────────────────────────
    function kbSearch(query) {
        const hu = isHungarian(query);
        for (const entry of KB) {
            if (!entry.p.test(query)) continue;
            if (hu && entry.hu) return entry.hu;
            if (!hu && entry.en) return entry.en;
            return entry.hu || entry.en;
        }
        return null;
    }

    // ── Markdown → HTML ──────────────────────────────────────────
    function md2html(text) {
        return text
            .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
            .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
            .replace(/`([^`]+)`/g,'<code>$1</code>')
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>')
            .replace(/\n/g,'<br>');
    }

    // ── State ─────────────────────────────────────────────────────
    let waiOpen = false, waiTyping = false, waiGreeted = false, waiHistory = [];

    // ── Toggle ────────────────────────────────────────────────────
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
                waiAddMsg('bot', '⚡ **WIRE-AI online.** Ask me anything about RustWire, its commands, features, or Rust itself. I reply in your language!');
            }, 280);
        }
        if (waiOpen) setTimeout(() => document.getElementById('wai-input').focus(), 350);
    };

    // ── Quick suggestion ──────────────────────────────────────────
    window.waiSuggest = function (btn) {
        const input = document.getElementById('wai-input');
        input.value = btn.textContent;
        document.getElementById('wai-suggestions').style.display = 'none';
        waiSend();
    };

    // ── Send ──────────────────────────────────────────────────────
    window.waiSend = async function () {
        const input = document.getElementById('wai-input');
        const text = input.value.trim();
        if (!text || waiTyping) return;

        document.getElementById('wai-suggestions').style.display = 'none';
        input.value = '';
        input.style.height = 'auto';
        waiAddMsg('user', text);

        // 1. KB lookup
        const kbAnswer = kbSearch(text);
        if (kbAnswer) {
            waiSetTyping(true);
            setTimeout(() => { waiSetTyping(false); waiAddMsg('bot', kbAnswer); }, 400 + Math.random() * 250);
            return;
        }

        // 2. Claude API (if proxy set)
        if (PROXY_URL) {
            waiHistory.push({ role: 'user', content: text });
            if (waiHistory.length > 12) waiHistory = waiHistory.slice(-12);
            waiSetTyping(true);
            document.getElementById('wai-send').disabled = true;
            try {
                const SYSTEM = `You are WIRE-AI, the official AI assistant for RustWire — a free Discord bot for Rust game communities. Detect the user's language and always respond in that same language. Be concise and helpful. RustWire features: Twitch/Kick Drops, Rust Store skins & DLC (region-aware), Devblogs, GitHub commits, Oxide/uMod updates, BattleMetrics bans, player tools (ban check, playtime, inventory), wipe countdown, Rust+ integration, raid calculator, craft recipes, blueprint tracker, content filter, 9 languages. All features are 100% free, no subscription needed.`;
                const res = await fetch(PROXY_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 600, system: SYSTEM, messages: waiHistory })
                });
                if (!res.ok) throw new Error('API ' + res.status);
                const data = await res.json();
                const reply = data?.content?.[0]?.text || 'Sorry, I could not process that.';
                waiHistory.push({ role: 'assistant', content: reply });
                waiSetTyping(false);
                waiAddMsg('bot', reply);
            } catch {
                waiSetTyping(false);
                const hu = isHungarian(text);
                waiAddMsg('bot', hu ? '⚠️ Kapcsolati hiba. Próbáld pontosítani a kérdésedet!' : '⚠️ Connection error. Please try rephrasing your question!');
            }
            document.getElementById('wai-send').disabled = false;
            input.focus();
            return;
        }

        // 3. No KB match, no API
        waiSetTyping(true);
        const hu = isHungarian(text);
        setTimeout(() => {
            waiSetTyping(false);
            waiAddMsg('bot', hu
                ? '🤔 Nem találtam egyértelmű választ. Próbálj rákérdezni ezekre:\n• **parancsok** – milyen parancsok vannak?\n• **hozzáadás** – hogyan adhatom hozzá?\n• **wipe** – mikor a wipe?\n• **raid** – raid kalkulátor\n• **ár** – ingyenes a bot?\n\n🌐 [rustwire.co.uk](https://rustwire.co.uk)'
                : '🤔 I couldn\'t find a clear answer. Try asking about:\n• **commands** – what commands are there?\n• **setup** – how do I add the bot?\n• **wipe** – when is the next wipe?\n• **raid** – raid calculator\n• **price** – is it free?\n\n🌐 [rustwire.co.uk](https://rustwire.co.uk)'
            );
        }, 350);
    };

    // ── Add message ───────────────────────────────────────────────
    function waiAddMsg(role, text) {
        const container = document.getElementById('wai-messages');
        const isBot = role === 'bot';
        const div = document.createElement('div');
        div.className = 'wai-msg ' + role;
        div.innerHTML = `
            <div class="wai-msg-avatar">${isBot ? '<img src="https://rustwire.co.uk/icon.png" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" onerror="this.parentElement.innerHTML=\'🤖\'">' : 'U'}</div>
            <div class="wai-bubble">${md2html(text)}</div>`;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
        if (!waiOpen && isBot) document.getElementById('wai-notif').style.display = 'block';
    }

    // ── Typing indicator ──────────────────────────────────────────
    function waiSetTyping(show) {
        waiTyping = show;
        document.getElementById('wai-typing').classList.toggle('show', show);
        if (show) { const m = document.getElementById('wai-messages'); m.scrollTop = m.scrollHeight; }
    }

    // ── Init ──────────────────────────────────────────────────────
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
