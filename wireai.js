// ══════════════════════════════════════════════════════════════
// WIRE-AI CHATBOT  –  rustwire.co.uk
// ══════════════════════════════════════════════════════════════
(function () {

    const PROXY_URL = '';

    // ── Language detection ────────────────────────────────────────
    const HU_PATTERN = /[áéíóöőúüűÁÉÍÓÖŐÚÜŰ]|mikor|hogyan|miért|mit tud|mi a |mi az|milyen|mennyi|hozzá|beállít|csinál|melyik|ingyenes|parancs|szerver|játék|kell|lehet|tudja|működ/i;
    function isHU(t) { return HU_PATTERN.test(t); }

    // ── Knowledge base ────────────────────────────────────────────
    const KB = [

        // ── RUST+ ─────────────────────────────────────────────────
        {
            p: /rust\+|rust plus|rustplus|companion|rust\+.*setup|setup.*rust\+|how.*rust\+|rust\+.*how/i,
            en: '**Rust+ Integration:**\n\nRustWire connects your Rust+ companion app to Discord:\n\n• 🗺️ **Live map** – view your server map in Discord\n• 👥 **Team tracker** – see your teammates in real time\n• 💬 **In-game chat bridge** – chat between Discord and Rust\n• 🏛️ **Monument status** – know which monuments are active\n\n**How to set up Rust+:**\n1. Open Rust on Steam\n2. Go to **Options → Rust+**\n3. Pair your device with the companion app\n4. Link your Discord account\n5. Use `/rust setupchannels` in Discord to activate\n\n💡 Rust+ features require the official Rust+ companion app.',
            hu: '**Rust+ Integráció:**\n\nA RustWire összeköti a Rust+ companion app-ot a Discorddal:\n\n• 🗺️ **Élő térkép** – szerver térkép megtekintés Discordban\n• 👥 **Csapat tracker** – csapattársak valós időben\n• 💬 **In-game chat híd** – chat Rust és Discord között\n• 🏛️ **Monument státusz** – aktív monumentok\n\n**Rust+ beállítása:**\n1. Nyisd meg a Rustot Steamen\n2. Menj az **Options → Rust+** menüre\n3. Párosítsd az eszközöd a companion app-pal\n4. Kapcsold össze a Discord fiókoddal\n5. Használd a `/rust setupchannels` parancsot Discordban\n\n💡 A Rust+ funkciókhoz a hivatalos Rust+ companion app szükséges.'
        },

        // ── BOT INFO ──────────────────────────────────────────────
        {
            p: /what (is|are) rustw|rustw.*bot|bot.*rustw|tell me about rustw|about rustw|mi(t csinál|csoda|az a rustw)|mi a rustw/i,
            en: '⚡ **RustWire** is a free Discord bot that delivers real-time Rust game data to your server.\n\n**Features:**\n• 🎮 Twitch & Kick Drop campaigns\n• 🛒 Rust Store skins & DLC (region-aware pricing)\n• 📰 Facepunch Devblogs & commits\n• 🔧 Oxide/uMod release updates\n• 🔨 Raid calculator, recipes, blueprint tracker\n• 🗺️ Rust+ integration\n• 🛡️ BattleMetrics ban logger\n• 🌍 Available in 9 languages\n\n**Free, 24/7, no ads!**',
            hu: '⚡ **RustWire** egy ingyenes Discord bot, amely valós idejű Rust adatokat juttat el a szerverodre.\n\n**Funkciók:**\n• 🎮 Twitch & Kick Drop kampányok\n• 🛒 Rust Store bőrök & DLC (régió-specifikus árak)\n• 📰 Facepunch Devblogs és commitok\n• 🔧 Oxide/uMod frissítések\n• 🔨 Raid kalkulátor, receptek, blueprint tracker\n• 🗺️ Rust+ integráció\n• 🛡️ BattleMetrics ban logger\n• 🌍 9 nyelven elérhető\n\n**Ingyenes, 24/7, reklám nélkül!**'
        },

        // ── ADD / INVITE ──────────────────────────────────────────
        {
            p: /how (do i|to|can i) (add|install|invite|setup|set up)|add.*bot|invite.*bot|meghívni|hozzáadni|hogyan adh/i,
            en: '**How to add RustWire to your server:**\n\n1. Click the **Enlist** button on the website\n2. Log in with your Discord account\n3. Select your server\n4. Confirm the permissions\n\nAll channels are created automatically! If not, run `/rust setupchannels`.\n\n✅ **Completely free, no credit card needed.**',
            hu: '**RustWire hozzáadása Discord szerverhez:**\n\n1. Kattints az **Enlist** gombra a weboldalon\n2. Jelentkezz be Discord fiókoddal\n3. Válaszd ki a szervered\n4. Erősítsd meg az engedélyeket\n\nAz összes csatorna automatikusan létrejön! Ha nem, használd a `/rust setupchannels` parancsot.\n\n✅ **Teljesen ingyenes, nem kell bankkártya.**'
        },

        // ── ALL COMMANDS ──────────────────────────────────────────
        {
            p: /all commands|every command|list.*command|command.*list|full.*command|complete.*command|what commands|milyen parancs|összes parancs/i,
            en: '**All RustWire Commands:**\n\n🔧 **General:**\n• `/rust ping` – Latency check\n• `/rust help` – Show all commands\n• `/rust faq` – FAQ\n• `/rust setupchannels` – Create/refresh feed channels *(admin)*\n• `/rust repopulate` – Repost all content *(admin)*\n• `/rust setregion [cc]` – Set store region e.g. GB, US *(admin)*\n• `/rust filter [on/off]` – Content filter *(admin)*\n• `/rust posthours` – Post hours verification card *(admin)*\n\n📰 **Content:**\n• `/rust drops` – Twitch Drop campaigns\n• `/rust kick-drops` – Kick Drop campaigns\n• `/rust skins` – Rust store skins\n• `/rust dlc` – Rust DLC with region prices\n• `/rust devblogs` – Latest Facepunch devblog\n• `/rust community` – Facepunch community posts\n• `/rust general` – Facepunch general posts\n• `/rust commits` – GitHub commits\n• `/rust oxide` – Oxide/uMod releases\n• `/rust bans` – BattleMetrics org bans\n• `/rust wipe` – Next force wipe countdown\n\n👤 **Player Tools:**\n• `/rust bancheck [steamid]` – VAC + BattleMetrics ban check\n• `/rust playtime [steamid]` – Hours played & top games\n• `/rust inventory [steamid]` – Inventory with market value\n\n🏗️ **Raid:**\n• `/raid calculate` – Raid cost calculator\n• `/raid compare` – Compare all raid methods\n• `/raid plan` – Full raid plan with material split\n• `/raid materials` – Calculate explosives materials\n\n🛠️ **Craft & Recycle:**\n• `/craft recipe [item]` – Crafting recipe\n• `/craft batch [item] [qty]` – Bulk craft materials\n• `/craft team [item] [qty]` – Split for team\n• `/craft search [query]` – Search craftable items\n• `/recycle item [item]` – Recycler output\n• `/recycle search [query]` – Search recyclable items\n\n📋 **Blueprint:**\n• `/blueprint add` – Mark blueprint as learned\n• `/blueprint remove` – Remove blueprint\n• `/blueprint list` – Show all learned blueprints\n\n⚙️ **Wire (bot settings):**\n• `/wire botstats` – Bot statistics *(owner)*\n• `/wire language set [lang]` – Set server language *(admin)*\n• `/wire language current` – Show current language\n• `/wire language list` – List all languages\n• `/wire setwelcome [channel]` – Set welcome channel *(admin)*',
            hu: '**Összes RustWire Parancs:**\n\n🔧 **Általános:**\n• `/rust ping` – Késleltetés ellenőrzés\n• `/rust help` – Összes parancs megjelenítése\n• `/rust faq` – GYIK\n• `/rust setupchannels` – Csatornák létrehozása *(admin)*\n• `/rust repopulate` – Tartalom újrapostolása *(admin)*\n• `/rust setregion [cc]` – Régió beállítás pl. HU, GB *(admin)*\n• `/rust filter [on/off]` – Tartalomszűrő *(admin)*\n• `/rust posthours` – Játékidő kártya postolása *(admin)*\n\n📰 **Tartalom:**\n• `/rust drops` – Twitch Drop kampányok\n• `/rust kick-drops` – Kick Drop kampányok\n• `/rust skins` – Rust store bőrök\n• `/rust dlc` – Rust DLC regionális árakkal\n• `/rust devblogs` – Legújabb devblog\n• `/rust community` – Facepunch community posztok\n• `/rust general` – Facepunch general posztok\n• `/rust commits` – GitHub commitok\n• `/rust oxide` – Oxide/uMod kiadások\n• `/rust bans` – BattleMetrics org banok\n• `/rust wipe` – Következő force wipe visszaszámlálás\n\n👤 **Játékos eszközök:**\n• `/rust bancheck [steamid]` – VAC + BattleMetrics ban ellenőrzés\n• `/rust playtime [steamid]` – Játékidő és top játékok\n• `/rust inventory [steamid]` – Inventory piaci értékkel\n\n🏗️ **Raid:**\n• `/raid calculate` – Raid kalkulátor\n• `/raid compare` – Módszerek összehasonlítása\n• `/raid plan` – Teljes raid terv\n• `/raid materials` – Robbanószer kalkuláció\n\n🛠️ **Craft & Recycle:**\n• `/craft recipe [tárgy]` – Craft recept\n• `/craft batch [tárgy] [db]` – Tömeges craft\n• `/craft team [tárgy] [db]` – Csapat elosztás\n• `/craft search [keresés]` – Tárgyak keresése\n• `/recycle item [tárgy]` – Recycler kimenet\n• `/recycle search [keresés]` – Recyclálható tárgyak\n\n📋 **Blueprint:**\n• `/blueprint add` – Blueprint jelölése tanultnak\n• `/blueprint remove` – Blueprint törlése\n• `/blueprint list` – Összes blueprint\n\n⚙️ **Wire (bot beállítások):**\n• `/wire botstats` – Bot statisztikák *(tulajdonos)*\n• `/wire language set [lang]` – Nyelv beállítás *(admin)*\n• `/wire language current` – Jelenlegi nyelv\n• `/wire language list` – Elérhető nyelvek\n• `/wire setwelcome [csatorna]` – Üdvözlő csatorna *(admin)*'
        },

        // ── SPECIFIC COMMAND GROUPS ───────────────────────────────
        {
            p: /\/?rust drops|twitch.?drop|kick.?drop|drop campaign/i,
            en: '**Drop Commands:**\n\n• `/rust drops` – Post current Twitch Drop campaigns instantly\n• `/rust kick-drops` – Post current Kick Drop campaigns\n\nThe bot auto-posts the moment a new campaign goes live!',
            hu: '**Drop parancsok:**\n\n• `/rust drops` – Aktuális Twitch Drop kampányok azonnal\n• `/rust kick-drops` – Aktuális Kick Drop kampányok\n\nA bot automatikusan posztol, amint egy új kampány elindul!'
        },
        {
            p: /\/?rust (skins?|dlc|store)|skin command|dlc command/i,
            en: '**Store Commands:**\n\n• `/rust skins` – Latest Rust store skins with region-aware pricing\n• `/rust dlc` – Rust DLC list with correct regional prices\n\n**Set region (admin):** `/rust setregion [cc]` e.g. `GB`, `US`, `HU`',
            hu: '**Store parancsok:**\n\n• `/rust skins` – Legújabb Rust store bőrök régió-specifikus árakkal\n• `/rust dlc` – Rust DLC lista pontos regionális árakkal\n\n**Régió beállítás (admin):** `/rust setregion [cc]` pl. `HU`, `GB`, `US`'
        },
        {
            p: /\/?rust (devblog|community|general|commit|bans?|oxide|wipe|ping|help|faq)\b/i,
            en: '**Content Commands:**\n\n• `/rust devblogs` – Latest Facepunch Devblog\n• `/rust community` – Latest Community posts\n• `/rust general` – Latest General posts\n• `/rust commits` – Latest GitHub commits\n• `/rust oxide` – Latest Oxide/uMod release\n• `/rust bans` – Latest BattleMetrics bans\n• `/rust wipe` – Next force wipe countdown\n• `/rust ping` – Bot latency\n• `/rust help` – All commands\n• `/rust faq` – FAQ',
            hu: '**Tartalom parancsok:**\n\n• `/rust devblogs` – Legújabb Facepunch Devblog\n• `/rust community` – Community posztok\n• `/rust general` – General posztok\n• `/rust commits` – Legújabb GitHub commitok\n• `/rust oxide` – Legújabb Oxide/uMod kiadás\n• `/rust bans` – Legújabb BattleMetrics banok\n• `/rust wipe` – Következő force wipe\n• `/rust ping` – Bot késleltetés\n• `/rust help` – Összes parancs\n• `/rust faq` – GYIK'
        },
        {
            p: /bancheck|ban check|\/?rust bancheck|vac check|player check|playtime|\/?rust playtime|inventory|\/?rust inventory/i,
            en: '**Player Tool Commands:**\n\n• `/rust bancheck [steamid]` – Check VAC, Game & Community bans + BattleMetrics profile\n• `/rust playtime [steamid]` – Rust hours, total Steam playtime, top 5 games\n• `/rust inventory [steamid]` – Full Rust inventory with live market prices\n\nReplace `[steamid]` with the player\'s 17-digit Steam ID.',
            hu: '**Játékos eszköz parancsok:**\n\n• `/rust bancheck [steamid]` – VAC, Game & Community banok + BattleMetrics profil\n• `/rust playtime [steamid]` – Rust játékidő, top 5 játék\n• `/rust inventory [steamid]` – Teljes Rust inventory piaci árakkal\n\nA `[steamid]` helyére a játékos 17 jegyű Steam ID-ját kell írni.'
        },
        {
            p: /\/?raid (calculate|compare|plan|materials?)|raid command|how.*raid/i,
            en: '**Raid Commands:**\n\n• `/raid calculate` – Calculate raid cost for any structure\n• `/raid compare` – Compare all raid methods side by side\n• `/raid plan` – Full raid plan with material splitting per person\n• `/raid materials` – Calculate materials needed to craft explosives\n\n💣 Supports: wood, stone, metal, armored walls, doors, and more.',
            hu: '**Raid parancsok:**\n\n• `/raid calculate` – Raid költség bármilyen szerkezethez\n• `/raid compare` – Összes raid módszer összehasonlítása\n• `/raid plan` – Teljes raid terv személyenkénti elosztással\n• `/raid materials` – Robbanószer anyagok kalkulációja\n\n💣 Támogatja: fa, kő, fém, armored falak, ajtók és egyéb.'
        },
        {
            p: /\/?craft (recipe|batch|team|search)|crafting command|\/?recycle|blueprint command|\/?blueprint/i,
            en: '**Craft, Recycle & Blueprint Commands:**\n\n🛠️ **Craft:**\n• `/craft recipe [item]` – Show crafting recipe\n• `/craft batch [item] [qty]` – Bulk crafting materials\n• `/craft team [item] [qty]` – Split materials for team\n• `/craft search [query]` – Search craftable items\n\n♻️ **Recycle:**\n• `/recycle item [item]` – Show recycler output\n• `/recycle search [query]` – Search recyclable items\n\n📋 **Blueprint:**\n• `/blueprint add` – Mark as learned\n• `/blueprint remove` – Remove\n• `/blueprint list` – Show all learned',
            hu: '**Craft, Recycle & Blueprint parancsok:**\n\n🛠️ **Craft:**\n• `/craft recipe [tárgy]` – Craft recept\n• `/craft batch [tárgy] [db]` – Tömeges craft anyagok\n• `/craft team [tárgy] [db]` – Csapat anyag elosztás\n• `/craft search [keresés]` – Tárgyak keresése\n\n♻️ **Recycle:**\n• `/recycle item [tárgy]` – Recycler kimenet\n• `/recycle search [keresés]` – Recyclálható tárgyak\n\n📋 **Blueprint:**\n• `/blueprint add` – Tanultnak jelölés\n• `/blueprint remove` – Törlés\n• `/blueprint list` – Összes blueprint'
        },
        {
            p: /\/?wire (language|setwelcome|botstats)|language (set|list|current)|set language|change language/i,
            en: '**Wire / Language Commands:**\n\n• `/wire language set [lang]` – Set server language *(admin)*\n• `/wire language current` – Show current language\n• `/wire language list` – List all available languages\n• `/wire setwelcome [#channel]` – Set welcome/leave channel *(admin)*\n• `/wire botstats` – Bot statistics *(owner only)*\n\n**Supported languages (9):**\n🇬🇧 English • 🇭🇺 Magyar • 🇩🇪 Deutsch • 🇫🇷 Français • 🇪🇸 Español • 🇵🇹 Português • 🇷🇺 Русский • 🇹🇷 Türkçe • 🇨🇳 中文',
            hu: '**Wire / Nyelv parancsok:**\n\n• `/wire language set [lang]` – Nyelv beállítás *(admin)*\n• `/wire language current` – Jelenlegi nyelv\n• `/wire language list` – Elérhető nyelvek\n• `/wire setwelcome [#csatorna]` – Üdvözlő csatorna *(admin)*\n• `/wire botstats` – Bot statisztikák *(csak tulajdonos)*\n\n**Támogatott nyelvek (9):**\n🇬🇧 English • 🇭🇺 Magyar • 🇩🇪 Deutsch • 🇫🇷 Français • 🇪🇸 Español • 🇵🇹 Português • 🇷🇺 Русский • 🇹🇷 Türkçe • 🇨🇳 中文'
        },
        {
            p: /\/?rust setupchannels|setup channels|set up channels|channel setup/i,
            en: '**`/rust setupchannels`** *(admin only)*\n\nCreates or refreshes all RustWire feed channels in your Discord server automatically.\n\nRun this after first adding the bot, or if channels get deleted/broken.',
            hu: '**`/rust setupchannels`** *(csak admin)*\n\nAutomatikusan létrehozza vagy frissíti az összes RustWire feed csatornát a Discord szerveren.\n\nFuttasd a bot hozzáadása után, vagy ha a csatornák törlődnek/elromlanak.'
        },

        // ── WIPE ─────────────────────────────────────────────────
        {
            p: /wipe|force wipe|next wipe|mikor.*wipe|wipe.*mikor/i,
            en: '**Wipe Info:**\n\n• `/rust wipe` – Next force wipe countdown\n\n📅 Rust force wipe happens every **first Thursday of the month**. Also visible in the Live Feed on the website!',
            hu: '**Wipe információk:**\n\n• `/rust wipe` – Következő force wipe visszaszámlálás\n\n📅 A Rust force wipe minden hónap **első csütörtökén** van. A weboldalon a Live Feed-en is látható!'
        },

        // ── ADMIN ─────────────────────────────────────────────────
        {
            p: /admin command|admin only|admin.*setup|setup.*admin|beállít|admin parancs/i,
            en: '**Admin-Only Commands:**\n\n• `/rust setupchannels` – Create/refresh feed channels\n• `/rust repopulate` – Repost all content to channels\n• `/rust setregion [cc]` – Set store region (e.g. GB, US)\n• `/rust filter [on/off]` – Enable/disable content filter\n• `/rust posthours` – Post hours verification card\n• `/wire language set [lang]` – Set server language\n• `/wire setwelcome [#channel]` – Set welcome channel\n\n*These require the "Manage Server" permission or server admin role.*',
            hu: '**Admin parancsok:**\n\n• `/rust setupchannels` – Csatornák létrehozása/frissítése\n• `/rust repopulate` – Összes tartalom újrapostolása\n• `/rust setregion [cc]` – Régió beállítás (pl. HU, GB)\n• `/rust filter [on/off]` – Tartalomszűrő be/ki\n• `/rust posthours` – Játékidő kártya postolása\n• `/wire language set [lang]` – Nyelv beállítás\n• `/wire setwelcome [#csatorna]` – Üdvözlő csatorna\n\n*Ezekhez "Manage Server" jogosultság vagy admin szerepkör szükséges.*'
        },

        // ── FREE / PRICE ──────────────────────────────────────────
        {
            p: /free|cost|price|pay|subscription|premium|ingyenes|ár|fizet/i,
            en: '✅ **RustWire is 100% free!**\n\nNo credit card, no subscription, no hidden fees, no ads, no premium tier.\n\n24/7 online · Constantly updated · Free forever!',
            hu: '✅ **RustWire 100% ingyenes!**\n\nNem kell bankkártya, előfizetés, nincsenek rejtett díjak, reklámok vagy premium szint.\n\n24/7 online · Folyamatos frissítések · Örökre ingyenes!'
        },

        // ── LANGUAGE ─────────────────────────────────────────────
        {
            p: /language|lang|translation|multilingual|9 lang|nyelv/i,
            en: '**Supported Languages (9):**\n🇬🇧 English • 🇭🇺 Magyar • 🇩🇪 Deutsch • 🇫🇷 Français • 🇪🇸 Español • 🇵🇹 Português • 🇷🇺 Русский • 🇹🇷 Türkçe • 🇨🇳 中文\n\n`/wire language set [lang]` – set language *(admin)*\n`/wire language current` – check current',
            hu: '**Támogatott nyelvek (9):**\n🇬🇧 English • 🇭🇺 Magyar • 🇩🇪 Deutsch • 🇫🇷 Français • 🇪🇸 Español • 🇵🇹 Português • 🇷🇺 Русский • 🇹🇷 Türkçe • 🇨🇳 中文\n\n`/wire language set [lang]` – nyelv beállítás *(admin)*\n`/wire language current` – jelenlegi nyelv'
        },

        // ── SUPPORT / ERROR ───────────────────────────────────────
        {
            p: /error|problem|issue|not work|broken|support|hiba|nem működ|segítség/i,
            en: '**Need help?**\n\n1. Check the bot has correct permissions\n2. Try `/rust setupchannels`\n3. Still broken? Visit [rustwire.co.uk](https://rustwire.co.uk) or join the support server.',
            hu: '**Segítségre van szükséged?**\n\n1. Ellenőrizd a bot jogosultságait\n2. Próbáld `/rust setupchannels` parancsot\n3. Ha sem segít, látogasd meg a [rustwire.co.uk](https://rustwire.co.uk) oldalt vagy csatlakozz a support szerverhez.'
        },

        // ── GREETINGS ─────────────────────────────────────────────
        {
            p: /^(hi|hello|hey|howdy|sup|yo|greetings)[\s!?.]*$/i,
            en: '👋 **Hey! I\'m WIRE-AI**, the official RustWire assistant!\n\nAsk me about:\n• What RustWire can do\n• All bot commands\n• Rust+ setup\n• Wipe, Drops, Raid calculator...\n\nWhat can I help you with? 🎮',
            hu: null
        },
        {
            p: /^(szia|sziasztok|üdv|helló|jó napot)[\s!?.]*$/i,
            en: null,
            hu: '👋 **Szia! Én WIRE-AI vagyok**, a RustWire hivatalos asszisztense!\n\nKérdezz bármit:\n• Mit tud a RustWire\n• Összes bot parancs\n• Rust+ beállítás\n• Wipe, Drops, Raid kalkulátor...\n\nMiben segíthetek? 🎮'
        },

        // ── THANKS ────────────────────────────────────────────────
        {
            p: /thank|thanks|thx|cheers|köszön|kösz/i,
            en: '😊 Happy to help! Ask anything else anytime.\n\n🌐 [rustwire.co.uk](https://rustwire.co.uk)',
            hu: '😊 Szívesen! Bármikor kérdezz!\n\n🌐 [rustwire.co.uk](https://rustwire.co.uk)'
        },
    ];

    // ── KB search ─────────────────────────────────────────────────
    function kbSearch(query) {
        const hu = isHU(query);
        for (const entry of KB) {
            if (!entry.p.test(query)) continue;
            if (hu && entry.hu) return entry.hu;
            if (!hu && entry.en) return entry.en;
            return entry.hu || entry.en;
        }
        return null;
    }

    // ── Markdown → HTML ───────────────────────────────────────────
    function md2html(t) {
        return t
            .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
            .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
            .replace(/`([^`]+)`/g,'<code>$1</code>')
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>')
            .replace(/\n/g,'<br>');
    }

    // ── State ─────────────────────────────────────────────────────
    let waiOpen=false, waiTyping=false, waiGreeted=false, waiHistory=[];

    // ── Toggle ────────────────────────────────────────────────────
    window.waiToggle = function() {
        waiOpen = !waiOpen;
        document.getElementById('wai-window').classList.toggle('open', waiOpen);
        document.getElementById('wai-btn').classList.toggle('open', waiOpen);
        document.getElementById('wai-notif').style.display = 'none';
        if (waiOpen && !waiGreeted) {
            waiGreeted = true;
            setTimeout(() => waiAddMsg('bot', '⚡ **WIRE-AI online.** Ask me anything about RustWire, bot commands, Rust+ setup, or the Rust game. I reply in your language!'), 280);
        }
        if (waiOpen) setTimeout(() => document.getElementById('wai-input').focus(), 350);
    };

    // ── Suggestion ────────────────────────────────────────────────
    window.waiSuggest = function(btn) {
        document.getElementById('wai-input').value = btn.textContent;
        document.getElementById('wai-suggestions').style.display = 'none';
        waiSend();
    };

    // ── Send ──────────────────────────────────────────────────────
    window.waiSend = async function() {
        const input = document.getElementById('wai-input');
        const text = input.value.trim();
        if (!text || waiTyping) return;
        document.getElementById('wai-suggestions').style.display = 'none';
        input.value = ''; input.style.height = 'auto';
        waiAddMsg('user', text);

        // 1. KB
        const kb = kbSearch(text);
        if (kb) {
            waiSetTyping(true);
            setTimeout(() => { waiSetTyping(false); waiAddMsg('bot', kb); }, 380 + Math.random()*220);
            return;
        }

        // 2. API
        if (PROXY_URL) {
            waiHistory.push({role:'user', content:text});
            if (waiHistory.length > 12) waiHistory = waiHistory.slice(-12);
            waiSetTyping(true);
            document.getElementById('wai-send').disabled = true;
            try {
                const res = await fetch(PROXY_URL, {
                    method:'POST', headers:{'Content-Type':'application/json'},
                    body: JSON.stringify({model:'claude-sonnet-4-6', max_tokens:600,
                        system:`You are WIRE-AI, the official AI assistant for RustWire — a free Discord bot for Rust game communities. Always respond in the same language the user writes in. Be concise. RustWire is free, 24/7, supports 9 languages. Features: Twitch/Kick Drops, Rust Store skins & DLC, Devblogs, commits, Oxide/uMod, BattleMetrics bans, ban check, playtime, inventory, wipe countdown, Rust+, raid calculator, craft recipes, blueprint tracker, content filter.`,
                        messages: waiHistory})
                });
                if (!res.ok) throw new Error(res.status);
                const data = await res.json();
                const reply = data?.content?.[0]?.text || 'Sorry, could not process that.';
                waiHistory.push({role:'assistant', content:reply});
                waiSetTyping(false); waiAddMsg('bot', reply);
            } catch {
                waiSetTyping(false);
                waiAddMsg('bot', isHU(text) ? '⚠️ Kapcsolati hiba. Próbáld pontosítani a kérdésedet!' : '⚠️ Connection error. Try rephrasing your question!');
            }
            document.getElementById('wai-send').disabled = false;
            input.focus(); return;
        }

        // 3. Fallback
        waiSetTyping(true);
        setTimeout(() => {
            waiSetTyping(false);
            waiAddMsg('bot', isHU(text)
                ? '🤔 Próbáld pontosítani! Például:\n• **parancsok** – milyen parancsok vannak?\n• **Rust+** – hogyan kell beállítani?\n• **raid** – raid kalkulátor\n• **wipe** – mikor a wipe?\n\n🌐 [rustwire.co.uk](https://rustwire.co.uk)'
                : '🤔 Try being more specific! For example:\n• **commands** – list all commands\n• **Rust+** – how to setup Rust+?\n• **raid** – raid calculator\n• **wipe** – next wipe date\n\n🌐 [rustwire.co.uk](https://rustwire.co.uk)');
        }, 350);
    };

    // ── Add message ───────────────────────────────────────────────
    function waiAddMsg(role, text) {
        const c = document.getElementById('wai-messages');
        const isBot = role === 'bot';
        const div = document.createElement('div');
        div.className = 'wai-msg ' + role;
        div.innerHTML = `<div class="wai-msg-avatar">${isBot ? '<img src="https://rustwire.co.uk/icon.png" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" onerror="this.parentElement.innerHTML=\'🤖\'">' : 'U'}</div><div class="wai-bubble">${md2html(text)}</div>`;
        c.appendChild(div);
        c.scrollTop = c.scrollHeight;
        if (!waiOpen && isBot) document.getElementById('wai-notif').style.display = 'block';
    }

    // ── Typing ────────────────────────────────────────────────────
    function waiSetTyping(show) {
        waiTyping = show;
        document.getElementById('wai-typing').classList.toggle('show', show);
        if (show) { const m=document.getElementById('wai-messages'); m.scrollTop=m.scrollHeight; }
    }

    // ── Init ──────────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', function() {
        const inp = document.getElementById('wai-input');
        if (!inp) return;
        inp.addEventListener('keydown', e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();waiSend();} });
        inp.addEventListener('input', function(){ this.style.height='auto'; this.style.height=Math.min(this.scrollHeight,100)+'px'; });
    });

})();
