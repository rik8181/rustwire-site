/**
 * BotForge — Live Now Playing Widget
 * ============================================================
 * Framework-agnostic (vanilla JS) — works in a plain HTML page, or dropped
 * into a React/Vue/whatever component via a ref + useEffect.
 *
 * USAGE:
 *   <div id="bf-nowplaying" data-guild-id="1448337263548305520"></div>
 *   <script src="/nowplaying-widget.js"></script>
 *   <script>
 *     BotForgeNowPlaying.mount('#bf-nowplaying', {
 *       apiUrl: '/api/nowplaying',   // your Vercel API route
 *       guildId: '1448337263548305520',
 *       pollMs: 4000                 // how often to re-sync with the bot
 *     });
 *   </script>
 *
 * You can mount as many of these as you want on one page (one per guildId) —
 * e.g. one for "CoD Magyar Közösség" and one for "BotForge Music".
 *
 * WHY THIS IS ACTUALLY "LIVE": the bot only tells us the song's startTime +
 * duration every few seconds. Between those syncs, this widget calculates
 * `elapsed = now - startTime` itself, every animation frame, via
 * requestAnimationFrame — so the progress bar moves completely smoothly in
 * the browser, with zero extra network requests. Discord can't do this
 * (embeds are static images); a webpage can.
 */
(function (global) {
  'use strict';

  const STYLE_ID = 'bf-nowplaying-styles';

  function injectStylesOnce() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .bf-np {
        --bf-accent: #8B3CF0;
        --bf-accent-2: #E85FF5;
        position: relative;
        display: flex;
        gap: 18px;
        align-items: center;
        background: linear-gradient(135deg, #0a0a0f 0%, #12081c 100%);
        border: 1px solid color-mix(in srgb, var(--bf-accent) 35%, transparent);
        border-radius: 18px;
        padding: 16px 20px;
        font-family: 'Poppins', 'Inter', system-ui, -apple-system, sans-serif;
        color: #fff;
        overflow: hidden;
        max-width: 560px;
        box-shadow: 0 0 0 1px rgba(255,255,255,0.03), 0 20px 50px -20px rgba(0,0,0,0.6);
      }
      .bf-np::before {
        content: '';
        position: absolute;
        inset: -40% -20% auto auto;
        width: 220px; height: 220px;
        background: radial-gradient(circle, color-mix(in srgb, var(--bf-accent) 28%, transparent) 0%, transparent 70%);
        pointer-events: none;
      }
      .bf-np-art {
        position: relative;
        width: 64px; height: 64px;
        border-radius: 12px;
        flex-shrink: 0;
        background: #1a1220 center/cover no-repeat;
        border: 1px solid color-mix(in srgb, var(--bf-accent) 45%, transparent);
        overflow: hidden;
      }
      .bf-np-art::after {
        content: '';
        position: absolute; inset: 0;
        background: linear-gradient(160deg, transparent 40%, rgba(0,0,0,0.35) 100%);
      }
      .bf-np-body { flex: 1; min-width: 0; position: relative; z-index: 1; }
      .bf-np-eyebrow {
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--bf-accent-2);
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 3px;
      }
      .bf-np-live-dot {
        width: 6px; height: 6px; border-radius: 50%;
        background: #FF4D4D;
        box-shadow: 0 0 8px #FF4D4D;
        animation: bf-pulse 1.4s ease-in-out infinite;
      }
      @keyframes bf-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }

      .bf-np-title {
        font-size: 15px;
        font-weight: 700;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .bf-np-artist {
        font-size: 12.5px;
        color: rgba(255,255,255,0.55);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-top: 1px;
      }

      .bf-np-bar-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 9px;
      }
      .bf-np-time {
        font-size: 10.5px;
        color: rgba(255,255,255,0.45);
        font-variant-numeric: tabular-nums;
        min-width: 32px;
      }
      .bf-np-time.end { text-align: right; }
      .bf-np-bar {
        flex: 1;
        height: 5px;
        border-radius: 3px;
        background: rgba(255,255,255,0.12);
        overflow: hidden;
        position: relative;
      }
      .bf-np-bar-fill {
        height: 100%;
        border-radius: 3px;
        background: linear-gradient(90deg, var(--bf-accent), var(--bf-accent-2));
        width: 0%;
        box-shadow: 0 0 8px color-mix(in srgb, var(--bf-accent) 60%, transparent);
      }

      .bf-np-eq {
        display: flex;
        align-items: flex-end;
        gap: 2px;
        height: 16px;
        flex-shrink: 0;
      }
      .bf-np-eq span {
        width: 3px;
        border-radius: 2px;
        background: linear-gradient(180deg, var(--bf-accent-2), var(--bf-accent));
        animation: bf-eq 1s ease-in-out infinite;
      }
      .bf-np-eq span:nth-child(1) { animation-delay: -0.9s; }
      .bf-np-eq span:nth-child(2) { animation-delay: -0.6s; }
      .bf-np-eq span:nth-child(3) { animation-delay: -0.3s; }
      .bf-np-eq span:nth-child(4) { animation-delay: -0.1s; }
      @keyframes bf-eq {
        0%, 100% { height: 3px; }
        50% { height: 16px; }
      }
      .bf-np.paused .bf-np-eq span { animation-play-state: paused; height: 4px; }

      .bf-np-offline {
        display: flex;
        align-items: center;
        gap: 12px;
        color: rgba(255,255,255,0.4);
        font-size: 13px;
      }
      .bf-np-offline-dot {
        width: 8px; height: 8px; border-radius: 50%;
        background: rgba(255,255,255,0.25);
      }

      .bf-np-guild {
        font-size: 10px;
        color: rgba(255,255,255,0.35);
        margin-left: auto;
        white-space: nowrap;
      }
    `;
    document.head.appendChild(style);
  }

  function formatClock(totalSeconds) {
    if (!isFinite(totalSeconds) || totalSeconds < 0) totalSeconds = 0;
    const m = Math.floor(totalSeconds / 60);
    const s = Math.floor(totalSeconds % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function buildSkeleton(root) {
    root.classList.add('bf-np');
    root.innerHTML = `
      <div class="bf-np-offline">
        <div class="bf-np-offline-dot"></div>
        <span>Nothing playing right now</span>
      </div>
    `;
  }

  function buildPlayingDOM(root) {
    root.innerHTML = `
      <div class="bf-np-art" data-art></div>
      <div class="bf-np-body">
        <div class="bf-np-eyebrow">
          <span class="bf-np-live-dot" data-live-dot style="display:none"></span>
          <span data-eyebrow>NOW PLAYING</span>
          <span class="bf-np-guild" data-guild></span>
        </div>
        <div class="bf-np-title" data-title>—</div>
        <div class="bf-np-artist" data-artist>—</div>
        <div class="bf-np-bar-row">
          <span class="bf-np-time" data-elapsed>0:00</span>
          <div class="bf-np-bar"><div class="bf-np-bar-fill" data-fill></div></div>
          <span class="bf-np-time end" data-total>0:00</span>
        </div>
      </div>
      <div class="bf-np-eq" data-eq><span></span><span></span><span></span><span></span></div>
    `;
  }

  class NowPlayingWidget {
    constructor(root, opts) {
      this.root = root;
      this.apiUrl = opts.apiUrl || '/api/nowplaying';
      this.guildId = opts.guildId;
      this.pollMs = opts.pollMs || 4000;
      this.state = null; // last payload from the server
      this.rafId = null;
      this.pollTimer = null;

      injectStylesOnce();
      buildSkeleton(this.root);
      this._poll();
      this.pollTimer = setInterval(() => this._poll(), this.pollMs);
    }

    destroy() {
      if (this.pollTimer) clearInterval(this.pollTimer);
      if (this.rafId) cancelAnimationFrame(this.rafId);
    }

    async _poll() {
      try {
        const res = await fetch(`${this.apiUrl}?guildId=${encodeURIComponent(this.guildId)}`, { cache: 'no-store' });
        const data = await res.json();
        this._applyState(data);
      } catch (err) {
        // Silently keep showing the last known state on a transient network error
        console.warn('[BotForgeNowPlaying] poll failed:', err);
      }
    }

    _applyState(data) {
      const wasPlaying = !!this.state?.playing;
      this.state = data;

      if (!data.playing) {
        if (wasPlaying || !this.root.querySelector('.bf-np-offline')) {
          buildSkeleton(this.root);
        }
        if (this.rafId) { cancelAnimationFrame(this.rafId); this.rafId = null; }
        return;
      }

      if (!wasPlaying || !this.root.querySelector('[data-title]')) {
        buildPlayingDOM(this.root);
      }

      const artEl = this.root.querySelector('[data-art]');
      const titleEl = this.root.querySelector('[data-title]');
      const artistEl = this.root.querySelector('[data-artist]');
      const eyebrowEl = this.root.querySelector('[data-eyebrow]');
      const liveDotEl = this.root.querySelector('[data-live-dot]');
      const guildEl = this.root.querySelector('[data-guild]');
      const totalEl = this.root.querySelector('[data-total]');

      if (data.accentColor) this.root.style.setProperty('--bf-accent', data.accentColor);
      if (data.accentSecondary) this.root.style.setProperty('--bf-accent-2', data.accentSecondary);

      if (artEl) artEl.style.backgroundImage = data.thumbnail ? `url("${data.thumbnail}")` : 'none';
      if (titleEl) titleEl.textContent = data.title || 'Unknown';
      if (artistEl) artistEl.textContent = data.isRadio ? (data.liveTrackInfo || data.artist || '') : (data.artist || '');
      if (guildEl) guildEl.textContent = data.guildName || '';

      if (data.isRadio) {
        eyebrowEl.textContent = 'LIVE RADIO';
        liveDotEl.style.display = '';
        totalEl.textContent = 'LIVE';
      } else {
        eyebrowEl.textContent = 'NOW PLAYING';
        liveDotEl.style.display = 'none';
        totalEl.textContent = formatClock(data.durationSeconds || 0);
      }

      this.root.classList.toggle('paused', !!data.isPaused);

      if (!this.rafId) this._tick();
    }

    _tick() {
      this.rafId = requestAnimationFrame(() => this._tick());
      const data = this.state;
      if (!data || !data.playing) return;

      const elapsedEl = this.root.querySelector('[data-elapsed]');
      const fillEl = this.root.querySelector('[data-fill]');
      if (!elapsedEl || !fillEl) return;

      if (data.isRadio) {
        const onAirSeconds = data.startTime ? Math.max(0, (Date.now() - data.startTime) / 1000) : 0;
        elapsedEl.textContent = formatClock(onAirSeconds);
        fillEl.style.width = data.isPaused ? fillEl.style.width : '100%';
        return;
      }

      if (data.isPaused || !data.startTime || !data.durationSeconds) return;

      const elapsedSeconds = Math.max(0, (Date.now() - data.startTime) / 1000);
      const clamped = Math.min(elapsedSeconds, data.durationSeconds);
      const pct = data.durationSeconds > 0 ? (clamped / data.durationSeconds) * 100 : 0;

      elapsedEl.textContent = formatClock(clamped);
      fillEl.style.width = `${pct}%`;
    }
  }

  global.BotForgeNowPlaying = {
    mount(selector, opts) {
      const root = typeof selector === 'string' ? document.querySelector(selector) : selector;
      if (!root) {
        console.error('[BotForgeNowPlaying] mount target not found:', selector);
        return null;
      }
      return new NowPlayingWidget(root, opts || {});
    }
  };
})(window);
