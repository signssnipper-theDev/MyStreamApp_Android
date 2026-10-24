// MultiGridView grid, v3 "Floating Dock" layout with the Side Dock palette.
// Runs on a tango.me page (same origin as the Tango frames it embeds).
(() => {
  const KEY = 'sp_grid_users';
  const dpr = devicePixelRatio;
  const D = document, H = D.documentElement;
  const store = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };

  // ---------- find the stream element inside a Tango frame ----------
  window.__spFindVid = d => {
    try {
      const keep = d.querySelector('[data-sp-v]');
      const dims = c => c.tagName === 'VIDEO' ? [c.videoWidth, c.videoHeight] : [c.width, c.height];
      const ok = c => { const [w, h] = dims(c); return w >= 240 && h >= 240; };
      const shown = c => { const r = c.getBoundingClientRect(); return r.width * r.height; };
      const score = c => { const [w, h] = dims(c); return w * h * 1e6 + shown(c); };
      let best = d.querySelector('canvas.kjPxA') || d.querySelector('canvas.KPCas');
      if (best && !ok(best)) best = null;
      if (!best && keep && keep.isConnected && ok(keep)) best = keep;
      if (!best) best = [...d.querySelectorAll('canvas')].filter(ok).sort((a, b) => score(b) - score(a))[0] || null;
      if (!best) best = [...d.querySelectorAll('video')].filter(ok).sort((a, b) => score(b) - score(a))[0] || null;
      d.querySelectorAll('[data-sp-v]').forEach(e => { if (e !== best) e.removeAttribute('data-sp-v'); });
      if (best && !best.hasAttribute('data-sp-v')) best.setAttribute('data-sp-v', '1');
      return best;
    } catch (e) { return null; }
  };

  // ---------- reset any previous run ----------
  D.title = 'SystemProfiles';
  clearInterval(window.__spTitle);
  window.__spTitle = setInterval(() => { if (D.title !== 'SystemProfiles') D.title = 'SystemProfiles'; }, 1000);
  (window.__spTimers || []).forEach(clearInterval); window.__spTimers = [];
  [window.__spFxT, window.__spChatT, window.__spSndT, window.__spStatsT].forEach(clearInterval);
  ['sp-root', 'sp-style', 'sp-fonts'].forEach(id => D.getElementById(id)?.remove());

  // ---------- look ----------
  const fonts = D.createElement('link');
  fonts.id = 'sp-fonts'; fonts.rel = 'stylesheet';
  fonts.href = 'https://fonts.googleapis.com/css2?family=Sora:wght@600;700&family=Figtree:wght@400;500;600;700&display=swap';
  D.head.appendChild(fonts);
  const css = D.createElement('style');
  css.id = 'sp-style';
  css.textContent = `
#sp-root{--bg:#0c1018;--panel:#131a26;--raise:#172031;--line:#222c3d;--line2:#2a3549;--ink:#e3e8f2;--muted:#8d98ad;--accent:#4f7dff;--accent2:#7aa2ff;--tint:#1d2b4d;--live:#ff4d6a;--off:#4a5468;
  position:fixed;inset:0;z-index:2147483647;background:var(--bg);color:var(--ink);font:13px/1.4 Figtree,system-ui,'Segoe UI',sans-serif;
  /* Room for a phone's notch, rounded corners and gesture bar (the phone app also passes these in). */
  --sit:max(env(safe-area-inset-top,0px),var(--mgv-it,0px));--sib:max(env(safe-area-inset-bottom,0px),var(--mgv-ib,0px));
  --sil:max(env(safe-area-inset-left,0px),var(--mgv-il,0px));--sir:max(env(safe-area-inset-right,0px),var(--mgv-ir,0px));}
html,body{background:#0c1018 !important;overflow:hidden !important;}
body > *:not(#sp-root){display:none !important;}
#sp-root button{font:600 13px Figtree,system-ui,sans-serif;color:var(--ink);background:var(--raise);border:1px solid var(--line2);border-radius:10px;padding:7px 13px;cursor:pointer;white-space:nowrap;}
#sp-root button:hover{border-color:var(--accent2);}
#sp-root button:focus-visible{outline:2px solid var(--accent2);outline-offset:2px;}
#sp-root button.on{background:var(--tint);border-color:var(--accent);color:#cfe0ff;}
#sp-root button.primary{background:var(--accent);border-color:var(--accent);color:#fff;}
#sp-top{position:absolute;top:calc(10px + var(--sit));left:calc(12px + var(--sil));right:calc(12px + var(--sir));height:32px;display:flex;align-items:center;gap:10px;}
#sp-tray{display:flex;gap:6px;min-width:0;overflow-x:auto;scrollbar-width:none;}
#sp-tray::-webkit-scrollbar{display:none;}
#sp-root .sp-chip{display:flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;font-weight:500;font-size:12px;flex:none;}
.sp-chip .an{display:none;} html.sp-anon .sp-chip .nm{display:none;} html.sp-anon .sp-chip .an{display:inline;}
.sp-chip.live .sp-dot{background:var(--live);box-shadow:0 0 0 3px rgba(255,77,106,.2);}
#sp-brand{font:700 15px Sora,system-ui,sans-serif;letter-spacing:.02em;display:flex;align-items:center;gap:8px;}
#sp-brand i{width:11px;height:11px;border-radius:3px;background:var(--accent);display:block;}
#sp-stats{margin-left:auto;flex:none;background:var(--panel);border:1px solid var(--line);border-radius:999px;padding:6px 14px;font-variant-numeric:tabular-nums;color:var(--muted);}
#sp-stats b{color:var(--ink);font-family:Sora,system-ui,sans-serif;}
#sp-grid{position:absolute;top:calc(52px + var(--sit));left:calc(10px + var(--sil));right:calc(10px + var(--sir));bottom:var(--gridb,92px);display:grid;gap:10px;min-height:0;justify-content:center;align-content:center;}
.sp-cell{position:relative;display:flex;flex-direction:column;background:var(--panel);border:1px solid var(--line);border-radius:14px;overflow:hidden;min-height:0;min-width:0;}
.sp-head{display:flex;align-items:center;gap:6px;padding:6px 8px 6px 10px;cursor:grab;touch-action:none;user-select:none;}
.sp-head.grabbing{cursor:grabbing;}
.sp-dot{width:8px;height:8px;border-radius:50%;background:var(--off);flex:none;}
.sp-cell.live .sp-dot{background:var(--live);box-shadow:0 0 0 3px rgba(255,77,106,.2);}
.sp-name{flex:1;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font-weight:600;}
.sp-name .an{display:none;}
html.sp-anon .sp-name .nm{display:none;} html.sp-anon .sp-name .an{display:inline;}
.sp-st{color:var(--muted);font-weight:500;}
.sp-vc{color:var(--muted);font-variant-numeric:tabular-nums;font-size:12px;margin-right:2px;}
#sp-root .sp-ic{width:30px;height:28px;padding:0;display:grid;place-items:center;border-radius:8px;}
#sp-root .sp-ic[disabled]{opacity:.4;cursor:default;}
.sp-body{position:relative;flex:1;min-height:0;margin:0 6px 6px;border-radius:10px;overflow:hidden;background:#000;}
.sp-body iframe{position:absolute;inset:0;width:100%;height:100%;border:0;background:#000;}
.sp-zoomer{position:absolute;inset:0;z-index:2;touch-action:none;cursor:zoom-in;display:none;}
.sp-cell.live .sp-zoomer{display:block;}
.sp-cell.zoomed .sp-zoomer{cursor:grab;} .sp-cell.zoomed .sp-zoomer.drag{cursor:grabbing;}
.sp-chat{z-index:3;}
#sp-root .sp-zm{width:auto;min-width:30px;padding:0 7px;font-size:12px;font-variant-numeric:tabular-nums;display:none;}
#sp-root .sp-cell.zoomed .sp-zm{display:grid;}
/* The frame stays fully visible underneath (a hidden frame makes the site's player
   drop to a slow mode it doesn't leave); the cover sits on top until it's ready. */
/* Loading as in 1.8.0: the stream's page shows faded until the broadcaster is live. */
.sp-cell:not(.live) iframe{opacity:.35;}
.sp-wait{position:absolute;inset:0;z-index:1;background:#000;display:grid;place-items:center;align-content:center;gap:10px;color:var(--muted);font-size:13px;text-align:center;padding:12px;}
.sp-wait{display:none !important;}
.sp-spin{width:22px;height:22px;border-radius:50%;border:2px solid var(--line2);border-top-color:var(--accent2);animation:sp-spin 1s linear infinite;}
.sp-cell.off .sp-spin{display:none;}
@keyframes sp-spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.sp-spin{animation:none;}}
.sp-cell.sp-flash{border-color:var(--accent);box-shadow:0 0 0 3px rgba(79,125,255,.45);transition:box-shadow .3s;}
.sp-cell.hidden iframe{opacity:0 !important;pointer-events:none;}
.sp-cell.mini{display:none !important;}
.sp-cell.dragging{opacity:.6;z-index:9;box-shadow:0 14px 34px rgba(0,0,0,.55);}
.sp-cell.drop-target{border-color:var(--accent);box-shadow:0 0 0 3px rgba(79,125,255,.45);}
.sp-menu{position:absolute;top:42px;right:6px;z-index:8;width:240px;max-width:calc(100% - 12px);max-height:calc(100% - 50px);overflow-y:auto;box-sizing:border-box;background:var(--panel);border:1px solid var(--line2);border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.5);padding:6px;display:none;flex-direction:column;gap:2px;cursor:default;}
.sp-cell.menu-open .sp-menu{display:flex;}
#sp-root .sp-menu .mi{background:none;border:0;border-radius:8px;text-align:left;padding:8px 10px;font-weight:500;}
#sp-root .sp-menu .mi:hover,#sp-root .sp-menu .mi:focus-visible{background:var(--raise);}
#sp-root .sp-menu .mi.danger{color:#ff9aa9;}
.sp-menu .pic{display:none;flex-direction:column;gap:7px;padding:4px 10px 6px;}
.sp-menu.pic-open .pic{display:flex;}
.sp-menu label{display:grid;grid-template-columns:72px 1fr 40px;align-items:center;gap:8px;font-size:12px;color:var(--muted);}
.sp-menu input[type=range]{width:100%;min-width:0;margin:0;accent-color:var(--accent);}
.sp-menu .val{text-align:right;font-variant-numeric:tabular-nums;color:var(--ink);}
.sp-menu hr{border:0;border-top:1px solid var(--line2);margin:4px 2px;width:auto;}
html.sp-allhide #sp-grid{opacity:0 !important;pointer-events:none !important;}
#sp-dock{position:absolute;left:calc(12px + var(--sil));right:calc(12px + var(--sir));bottom:calc(14px + var(--sib));width:fit-content;margin:0 auto;display:flex;flex-wrap:wrap;align-items:stretch;background:var(--panel);border:1px solid var(--line2);border-radius:18px;box-shadow:0 10px 30px rgba(0,0,0,.45);padding:8px 4px;box-sizing:border-box;}
.sp-sec{display:flex;flex-direction:column;gap:5px;padding:0 12px;}
.sp-sec + .sp-sec{border-left:1px solid var(--line2);}
.sp-sec h2{margin:0;font:700 10px Sora,system-ui,sans-serif;letter-spacing:.16em;color:var(--accent2);}
.sp-row{display:flex;gap:6px;}
#sp-root #sp-dockmin{align-self:center;flex:none;width:30px;height:30px;padding:0;margin:0 6px 0 2px;border-radius:50%;display:grid;place-items:center;font-size:15px;line-height:1;}
html.sp-docksmall #sp-dock .sp-sec{display:none;}
html.sp-docksmall #sp-dock{left:auto;right:calc(14px + var(--sir));margin:0;padding:5px;border-radius:999px;}
#sp-root #sp-dockopen{display:none;}
html.sp-docksmall #sp-root #sp-dockopen{display:block;border-radius:999px;}
html.sp-docksmall #sp-root #sp-dockmin{display:none;}
#sp-pop{position:absolute;left:12px;right:12px;bottom:var(--dockh,84px);margin:0 auto;width:min(560px,calc(100% - 24px));background:var(--panel);border:1px solid var(--line2);border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.5);padding:14px;display:none;flex-direction:column;gap:10px;box-sizing:border-box;}
#sp-pop.open{display:flex;}
#sp-pop h2{margin:0;font:700 11px Sora,system-ui,sans-serif;letter-spacing:.16em;color:var(--accent2);}
#sp-in{width:100%;box-sizing:border-box;min-height:70px;resize:vertical;background:var(--bg);color:var(--ink);border:1px solid var(--line2);border-radius:10px;padding:9px 11px;font:13px/1.5 Figtree,system-ui,sans-serif;outline:none;}
#sp-in:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(79,125,255,.25);}
html.sp-anon #sp-in{-webkit-text-security:disc;color:var(--muted);}
#sp-pop p{margin:0;color:var(--muted);font-size:12px;}
.sp-chat{position:absolute;left:6px;right:6px;bottom:6px;max-height:38%;overflow:hidden;display:flex;flex-direction:column;justify-content:flex-end;gap:3px;pointer-events:none;font:12px/1.35 Figtree,system-ui,sans-serif;}
.sp-chat .ln{align-self:flex-start;max-width:100%;background:rgba(12,16,24,.72);color:#f2f4f8;padding:3px 8px;border-radius:9px;overflow-wrap:anywhere;}
.sp-chat .ln b{color:var(--accent2);font-weight:700;margin-right:5px;}
.sp-chat .ln.sys{color:#a9c2ff;font-style:italic;}
html:not(.sp-chaton) .sp-chat{display:none;}
.sp-cell.rec .sp-chat{display:none !important;}
html.sp-anon .sp-chat .ln b{display:none;}
#sp-root .sp-rec{display:none;align-items:center;gap:5px;flex:none;padding:2px 8px;border-radius:999px;background:rgba(255,77,106,.16);color:#ffb3c0;font:700 11px Figtree,system-ui,sans-serif;font-variant-numeric:tabular-nums;letter-spacing:.02em;}
.sp-cell.rec .sp-rec{display:inline-flex;}
.sp-rec i{width:7px;height:7px;border-radius:50%;background:var(--live);}
@media (prefers-reduced-motion:no-preference){.sp-rec i{animation:sp-blink 1.2s steps(2,start) infinite;}}
@keyframes sp-blink{to{visibility:hidden}}
.sp-cell.rec{border-color:rgba(255,77,106,.7);}
.sp-rec.nosound{background:rgba(255,186,73,.16);color:#ffd38a;}
#sp-root .sp-menu .mi.rec{color:#ff9aa9;font-weight:600;}
.sp-toast{position:absolute;top:calc(52px + var(--sit));left:50%;transform:translateX(-50%);max-width:min(560px,calc(100% - 24px));z-index:12;background:var(--panel);border:1px solid var(--accent);color:var(--ink);border-radius:12px;padding:10px 14px;font:13px/1.4 Figtree,system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.45);cursor:pointer;white-space:pre-line;}
.sp-toast.bad{border-color:var(--live);}
@container (max-width:230px){#sp-root .sp-rec b{display:none;}}
.sp-cell{container-type:inline-size;}
@container (max-width:230px){.sp-st,.sp-vc{display:none;}.sp-head{gap:3px;padding:5px 5px 5px 8px;}#sp-root .sp-ic{width:24px;height:24px;border-radius:6px;}}
#sp-grid.focus .sp-cell:not(.focused){display:none;}
#sp-root .sp-cell.focused .sp-max{background:var(--tint);border-color:var(--accent);color:#cfe0ff;}
.sp-empty{position:absolute;inset:0;display:grid;place-items:center;color:var(--muted);text-align:center;font-size:14px;}
/* Narrower windows and phones: the controls become one full-width row that scrolls
   sideways (no wrapping), with the shrink button always visible at its end. */
@media (max-width:1100px){
  #sp-dock{left:calc(8px + var(--sil));right:calc(8px + var(--sir));bottom:calc(8px + var(--sib));width:auto;margin:0;flex-wrap:nowrap;overflow-x:auto;overscroll-behavior:contain;scrollbar-width:none;padding:8px 0 8px 2px;border-radius:16px;}
  #sp-dock::-webkit-scrollbar{display:none;}
  .sp-sec{flex:none;padding:0 10px;}
  #sp-root #sp-dockmin{position:sticky;right:0;margin:0 0 0 auto;width:40px;height:100%;min-height:36px;border-radius:0 12px 12px 0;border:0;border-left:1px solid var(--line2);background:var(--panel);}
  html.sp-docksmall #sp-dock{left:auto;right:calc(10px + var(--sir));bottom:calc(10px + var(--sib));padding:4px;border-radius:999px;overflow:visible;}
  #sp-pop{width:auto;left:calc(8px + var(--sil));right:calc(8px + var(--sir));}
}
@media (max-width:560px){
  #sp-brand{font-size:13px;} #sp-stats{padding:4px 10px;font-size:12px;}
  #sp-top{gap:8px;}
}
@media (pointer:coarse){
  #sp-root button{min-height:36px;}
  #sp-root .sp-ic{width:34px;height:32px;}
  #sp-root .sp-menu .mi{padding:11px 12px;}
}`;
  D.head.appendChild(css);
  if (!D.querySelector('meta[name="viewport"]')) { const vm = D.createElement('meta'); vm.name = 'viewport'; vm.content = 'width=device-width, initial-scale=1, viewport-fit=cover'; D.head.appendChild(vm); }

  const ICON = {
    mute: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="m22 9-6 6M16 9l6 6"/></svg>',
    sound: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
    eye: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z"/><circle cx="12" cy="12" r="2.5"/></svg>',
    max: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
    unmax: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>',
    eyeOff: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 3l18 18"/><path d="M10.6 6.1A10 10 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-3 3.6M6.3 7.6A17 17 0 0 0 2.5 12S6 18 12 18a9 9 0 0 0 4-.9"/></svg>',
    x: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    more: '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.9"/><circle cx="12" cy="12" r="1.9"/><circle cx="19" cy="12" r="1.9"/></svg>'
  };

  // ---------- structure ----------
  const root = D.createElement('div');
  root.id = 'sp-root';
  root.innerHTML = `
<div id="sp-top"><div id="sp-brand"><i></i>SystemProfiles</div><div id="sp-tray" aria-label="Minimized streams"></div><div id="sp-stats"></div></div>
<div id="sp-grid"></div>
<div id="sp-pop" role="dialog" aria-label="Feed list">
  <h2>FEEDS</h2>
  <label for="sp-in" style="position:absolute;left:-9999px">Feed list</label>
  <textarea id="sp-in" spellcheck="false" placeholder="username1, username2, @username3"></textarea>
  <p>Separate names with commas, spaces or new lines. Ctrl+Enter builds the grid.</p>
  <div class="sp-row"><button class="primary" id="sp-go">Build grid</button><button id="sp-popclose">Close</button></div>
</div>
<div id="sp-dock">
  <div class="sp-sec"><h2>FEEDS</h2><div class="sp-row"><button id="sp-edit" class="primary">Edit list</button><button id="sp-rebuild">Rebuild</button></div></div>
  <div class="sp-sec"><h2>VIEW</h2><div class="sp-row"><button id="sp-anon-btn"></button><button id="sp-allhide"></button><button id="sp-fs"></button></div></div>
  <div class="sp-sec"><h2>PICTURE</h2><div class="sp-row"><button id="sp-fx-sharp"></button><button id="sp-fx-sat"></button><button id="sp-fx-tone"></button></div></div>
  <div class="sp-sec"><h2>CHAT</h2><div class="sp-row"><button id="sp-chat-btn"></button></div></div>
  ${window.mgvApp ? '<div class="sp-sec"><h2>APP</h2><div class="sp-row">' + (window.mgvApp.openAccount ? '<button id="sp-acct">Account</button>' : '') + (window.mgvApp.openAlerts ? '<button id="sp-alerts">Alerts</button>' : '') + (window.mgvApp.about ? '<button id="sp-about">About</button>' : '') + '</div></div>' : ''}
  <button id="sp-dockmin" title="Shrink controls" aria-label="Shrink controls">&#x2013;</button>
  <button id="sp-dockopen">Controls</button>
</div>`;
  D.body.appendChild(root);
  const $ = id => D.getElementById(id);
  const grid = $('sp-grid'), input = $('sp-in'), pop = $('sp-pop'), tray = $('sp-tray');
  const parse = s => s.split(/[\s,;]+/).map(u => u.trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?tango\.me\//, '').replace(/\/.*$/, '')).filter(Boolean);

  // ---------- cells ----------
  function styleInner(f) {
    // Show only the video, as large as the cell allows, placed on whole screen
    // pixels (no half-pixel offsets, which blur the picture) and without filters
    // unless a picture setting is switched on.
    try {
      const d = f.contentDocument, c = window.__spFindVid(d);
      if (!c) return false;
      let s = d.getElementById('vo');
      if (!s) { s = d.createElement('style'); s.id = 'vo'; d.head.appendChild(s); }
      const iw = (c.tagName === 'VIDEO' ? c.videoWidth : c.width) || 720, ih = (c.tagName === 'VIDEO' ? c.videoHeight : c.height) || 1280;
      const vw = f.contentWindow.innerWidth || f.clientWidth, vh = f.contentWindow.innerHeight || f.clientHeight;
      const r = f.contentWindow.devicePixelRatio || dpr;
      const k = Math.min(vw * r / iw, vh * r / ih);
      const dw = Math.max(1, Math.floor(iw * k)), dh = Math.max(1, Math.floor(ih * k));
      const left = Math.floor((vw * r - dw) / 2) / r, top = Math.floor((vh * r - dh) / 2) / r;
      const css = `body *{visibility:hidden !important;} html,body{background:#000 !important;}
        [data-sp-v]{visibility:visible !important;position:fixed !important;left:${left}px !important;top:${top}px !important;right:auto !important;bottom:auto !important;margin:0 !important;transform:none !important;width:${dw / r}px !important;height:${dh / r}px !important;max-width:none !important;max-height:none !important;object-fit:contain !important;filter:none !important;}`;
      if (s.textContent !== css) s.textContent = css;
      return true;
    } catch (e) { return false; }
  }
  // ---------- per-cell picture (contrast / brightness / saturation) ----------
  // Saved per broadcaster, on top of the PICTURE settings for all streams.
  const PKEY = 'sp_pic';
  let pics = {}; try { pics = JSON.parse(store.get(PKEY) || '{}') || {}; } catch (e) { pics = {}; }
  const picFor = u => { const p = pics[String(u || '').toLowerCase()] || {}; return { c: +p.c || 100, b: +p.b || 100, s: p.s === 0 ? 0 : (+p.s || 100) }; };
  function picSet(u, k, v) {
    const key = String(u || '').toLowerCase(), p = picFor(u); p[k] = v;
    if (p.c === 100 && p.b === 100 && p.s === 100) delete pics[key]; else pics[key] = p;
    store.set(PKEY, JSON.stringify(pics));
  }
  // ---------- minimized streams ----------
  const MKEY = 'sp_mini';
  let minis = new Set(); try { minis = new Set((JSON.parse(store.get(MKEY) || '[]') || []).map(x => String(x).toLowerCase())); } catch (e) {}
  const saveMinis = () => store.set(MKEY, JSON.stringify([...minis]));

  // ---------- per-cell zoom ----------
  // Wheel or pinch to zoom, drag to pan, double-click / double-tap or the badge to reset.
  // Saved per broadcaster. Applied inside the cell's Tango frame to the video only.
  const ZKEY = 'sp_zoom', ZMIN = 1, ZMAX = 5;
  let zooms = {}; try { zooms = JSON.parse(store.get(ZKEY) || '{}') || {}; } catch (e) { zooms = {}; }
  const zget = u => { const z = zooms[u]; return z && z.z > 1 ? z : { z: 1, x: 0, y: 0 }; };
  let zsaveT = 0;
  const zsave = () => { clearTimeout(zsaveT); zsaveT = setTimeout(() => store.set(ZKEY, JSON.stringify(zooms)), 400); };
  function applyZoom(f, el, u) {
    const z = zget(u);
    el.classList.toggle('zoomed', z.z > 1.001);
    const b = el.querySelector('.sp-zm'); if (b) { b.textContent = z.z.toFixed(1) + '×'; b.title = 'Zoom ' + z.z.toFixed(1) + '×. Click to reset'; }
    try {
      const d = f.contentDocument; if (!d || !d.head) return;
      let st = d.getElementById('sp-zoom-style');
      if (!st) { st = d.createElement('style'); st.id = 'sp-zoom-style'; d.head.appendChild(st); }
      st.textContent = z.z > 1.001
        ? `html body [data-sp-v]{transform:translate(${z.x.toFixed(1)}px,${z.y.toFixed(1)}px) scale(${z.z.toFixed(3)}) !important;transform-origin:center center !important;}`
        : '';
    } catch (e) {}
  }
  function zoomBox(f) {
    // The on-screen size of the video inside the cell, before zoom.
    try { const v = f.contentDocument.querySelector('[data-sp-v]'); if (v) { const w = v.offsetWidth, h = v.offsetHeight; if (w && h) return { w, h }; } } catch (e) {}
    return { w: f.clientWidth, h: f.clientHeight };
  }
  function zset(f, el, u, z, x, y) {
    z = Math.min(ZMAX, Math.max(ZMIN, z));
    const bx = zoomBox(f), mx = (z - 1) * bx.w / 2, my = (z - 1) * bx.h / 2;
    x = Math.max(-mx, Math.min(mx, x)); y = Math.max(-my, Math.min(my, y));
    if (z <= 1.001) delete zooms[u]; else zooms[u] = { z, x, y };
    zsave(); applyZoom(f, el, u);
  }
  // Zoom by factor k around point (cx, cy) given relative to the cell's centre.
  function zby(f, el, u, k, cx, cy) {
    const z0 = zget(u), z1 = Math.min(ZMAX, Math.max(ZMIN, z0.z * k)), r = z1 / z0.z;
    zset(f, el, u, z1, cx - (cx - z0.x) * r, cy - (cy - z0.y) * r);
  }
  function wireZoom(f, el, u) {
    const pad = el.querySelector('.sp-zoomer');
    const rel = (e) => { const r = pad.getBoundingClientRect(); return [e.clientX - r.left - r.width / 2, e.clientY - r.top - r.height / 2]; };
    pad.addEventListener('wheel', e => { e.preventDefault(); const [cx, cy] = rel(e); zby(f, el, u, Math.exp(-e.deltaY * 0.0015), cx, cy); }, { passive: false });
    const pts = new Map(); let pinch0 = null, lastTap = 0, moved = false;
    pad.addEventListener('pointerdown', e => {
      try { pad.setPointerCapture(e.pointerId); } catch (err) {}
      pts.set(e.pointerId, [e.clientX, e.clientY]); moved = false;
      if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch0 = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), z: zget(u).z }; }
      pad.classList.add('drag');
    });
    pad.addEventListener('pointermove', e => {
      if (!pts.has(e.pointerId)) return;
      const prev = pts.get(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pts.size >= 2 && pinch0) {
        const [a, b] = [...pts.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        const r = pad.getBoundingClientRect(); const cx = (a[0] + b[0]) / 2 - r.left - r.width / 2, cy = (a[1] + b[1]) / 2 - r.top - r.height / 2;
        if (pinch0.d > 0) zby(f, el, u, (pinch0.z * d / pinch0.d) / zget(u).z, cx, cy);
        moved = true;
      } else if (pts.size === 1) {
        const dx = e.clientX - prev[0], dy = e.clientY - prev[1];
        if (Math.abs(dx) + Math.abs(dy) > 0) { const z = zget(u); if (z.z > 1.001) zset(f, el, u, z.z, z.x + dx, z.y + dy); if (Math.abs(dx) + Math.abs(dy) > 2) moved = true; }
      }
    });
    const up = e => {
      pts.delete(e.pointerId); if (pts.size < 2) pinch0 = null;
      if (!pts.size) pad.classList.remove('drag');
      if (e.type === 'pointerup' && !moved) {
        const now = Date.now();
        if (now - lastTap < 320) { zset(f, el, u, 1, 0, 0); lastTap = 0; } else lastTap = now;
      }
    };
    pad.addEventListener('pointerup', up); pad.addEventListener('pointercancel', up);
    pad.addEventListener('dblclick', e => { e.preventDefault(); zset(f, el, u, 1, 0, 0); lastTap = 0; });
    el.querySelector('.sp-zm').onclick = () => zset(f, el, u, 1, 0, 0);
  }

  // Live lookups use your sign-in when you're signed in (Account), otherwise the
  // guest session. A refused lookup is logged; the cell's own check still works.
  function sessionOk() {}
  function sessionTrouble(status, body) { if (window.mgvApp && window.mgvApp.log) window.mgvApp.log({ why: 'lookup-refused', status, body }); }

  // The site's own live lookup (with your sign-in when signed in).
  // Returns {live:true,id} / {live:false} / null when it can't tell.
  const lastLookup = {};
  async function lookup(user) {
    try {
      const r = await fetch('https://gateway.tango.me/stream-details-provider/public/byAlias?alias=' + encodeURIComponent(user), { credentials: 'include', cache: 'no-store' });
      lastLookup[user] = r.status;
      if (r.status === 401 || r.status === 403) { let body = ''; try { body = (await r.text()).slice(0, 80); } catch (e) {} lastLookup[user] = r.status + ' ' + body; sessionTrouble(r.status, body); return null; }
      sessionOk();
      if (r.status === 404) return { live: false };
      if (r.status !== 200) return null;
      const b = new Uint8Array(await r.arrayBuffer()); let s = '';
      for (const x of b) s += String.fromCharCode(x);
      const m = s.match(/\n\x16([A-Za-z0-9_-]{22})/);
      return m ? { live: true, id: m[1] } : null;
    } catch (e) { lastLookup[user] = 'error: ' + (e && e.message); return null; }
  }
  // Diagnostics (Windows app only): what a cell sees right now.
  function diag(f, user, el, why) {
    if (!window.mgvApp || !window.mgvApp.log) return;
    let path = '', title = '', media = [], picked = '', testids = 0;
    try { path = f.contentWindow.location.pathname; title = f.contentDocument.title; testids = f.contentDocument.querySelectorAll('[data-testid]').length;
      media = [...f.contentDocument.querySelectorAll('canvas,video')].filter(c => (c.width || c.videoWidth) >= 240).map(c => c.tagName.toLowerCase() + '.' + (c.className && c.className.baseVal === undefined ? c.className : '') + ' ' + (c.width || c.videoWidth) + 'x' + (c.height || c.videoHeight));
      const v = f.contentDocument.querySelector('[data-sp-v]'); picked = v ? v.tagName.toLowerCase() + '.' + v.className : ''; } catch (e) { path = 'unreadable: ' + (e && e.message); }
    window.mgvApp.log({ why, user, lookup: lastLookup[user], live: el.classList.contains('live'), path, title, testids, media, picked });
  }
  function openUser(f, user) {
    f.dataset.user = user;
    clearInterval(f.__spNav);
    const cellEl = f.closest('.sp-cell');
    if (cellEl) { cellEl.classList.remove('vready'); clearTimeout(f.__spReadyT); f.__spReadyT = 0; }
    let loadedAt = 0;
    f.onload = () => {
      f.onload = null; loadedAt = Date.now();
      // Wait for Tango's app to render, then navigate in-app: straight to the live
      // stream when the lookup finds one, otherwise to the profile.
      f.__spNav = setInterval(async () => {
        let d = null; try { d = f.contentDocument; } catch (e) {}
        const ready = d && d.querySelector('[data-testid]');
        if ((ready && Date.now() - loadedAt > 1500) || Date.now() - loadedAt > 8000) {
          clearInterval(f.__spNav);
          const info = await lookup(user);
          const path = info && info.live && info.id ? '/stream/' + info.id : '/' + user;
          try { const w = f.contentWindow; w.history.pushState({}, '', path); w.dispatchEvent(new PopStateEvent('popstate', { state: {} })); } catch (e) {}
        }
      }, 500);
    };
    f.src = 'https://www.tango.me/';
  }
  function cell(user, idx) {
    const el = D.createElement('div');
    el.className = 'sp-cell';
    el.dataset.user = user;
    el.style.order = idx;
    el.__t = [];
    el.innerHTML = `<div class="sp-head"><span class="sp-dot"></span><span class="sp-name"><span class="nm"></span><span class="an"></span> <span class="sp-st">· checking…</span></span><span class="sp-vc"></span>
      <span class="sp-rec" title="Recording with Section Recorder"><i></i><b>REC</b> <span class="t">0:00</span></span>
      <button class="sp-ic sp-zm" title="Reset zoom" aria-label="Reset zoom">1.0×</button>
      <button class="sp-ic sp-max" title="Show this stream large" aria-label="Show this stream large">${ICON.max}</button>
      <button class="sp-ic sp-snd" title="Sound on/off" aria-label="Sound on/off">${ICON.mute}</button>
      <button class="sp-ic sp-more" title="More: picture, minimize, move, remove" aria-label="More options for this stream" aria-haspopup="menu">${ICON.more}</button></div>
      <div class="sp-menu" role="menu" aria-label="Stream options">
        <button class="mi" role="menuitem" data-a="pic">Picture…</button>
        <div class="pic">
          <label>Contrast<input type="range" min="50" max="200" step="5" data-k="c" aria-label="Contrast"><span class="val"></span></label>
          <label>Brightness<input type="range" min="50" max="150" step="5" data-k="b" aria-label="Brightness"><span class="val"></span></label>
          <label>Saturation<input type="range" min="0" max="200" step="5" data-k="s" aria-label="Saturation"><span class="val"></span></label>
          <button class="mi" data-a="picreset">Reset picture</button>
        </div>
        ${window.mgvApp && window.mgvApp.rec ? '<button class="mi rec" role="menuitem" data-a="rec">Record this feed</button>' : ''}
        <hr>
        <button class="mi" role="menuitem" data-a="mini">Minimize</button>
        <button class="mi" role="menuitem" data-a="hide">Hide video</button>
        <button class="mi" role="menuitem" data-a="earlier">Move earlier</button>
        <button class="mi" role="menuitem" data-a="later">Move later</button>
        <hr>
        <button class="mi danger" role="menuitem" data-a="remove">Remove from grid</button>
      </div>
      <div class="sp-body"><div class="sp-wait"><div class="sp-spin"></div><div class="sp-msg">Connecting…</div></div><iframe allow="autoplay; fullscreen"></iframe><div class="sp-zoomer" title="Scroll or pinch to zoom, drag to move, double-click to reset"></div></div>`;
    const f = el.querySelector('iframe'), nm = el.querySelector('.nm'), st = el.querySelector('.sp-st');
    nm.textContent = '@' + user;
    el.querySelector('.an').textContent = 'Cell ' + (idx + 1);
    if (minis.has(user.toLowerCase())) {
      el.classList.add('mini'); f.dataset.user = user; addChip(el);
      lookup(user).then(info => { if (info) { el.dataset.lh = info.live ? '1' : ''; if (el.__chip) el.__chip.classList.toggle('live', !!info.live); } });
    }
    else openUser(f, user);
    wireZoom(f, el, user); applyZoom(f, el, user);
    wireMenu(el, f, user);
    wireDrag(el);
    el.querySelector('.sp-max').onclick = () => setFocus(el);
    const url = () => { try { return f.contentWindow.location.href; } catch (e) { return ''; } };
    const disp = () => { try { const t = f.contentDocument.title; return (t.match(/^(.*?) (Live Stream - Watch|\(@)/) || [])[1] || (f.contentDocument.querySelector('h1')?.textContent || '').trim().slice(0, 40); } catch (e) { return ''; } };
    const msg = el.querySelector('.sp-msg');
    let checks = 0;
    el.__resetChecks = () => { checks = 0; el.classList.remove('off'); msg.textContent = 'Connecting…'; };
    const check = () => {
      checks++;
      const live = url().includes('/stream/') || (() => { try { return / Live Stream - Watch/.test(f.contentDocument.title || ''); } catch (e) { return false; } })();
      el.classList.toggle('live', live);
      if (live) {
        const ok = styleInner(f); applyZoom(f, el, user);
        // Show the frame a moment after the video-only view is applied, so the
        // page itself (loading screen, sign-in button, menus) is never seen.
        if (ok && !el.classList.contains('vready') && !f.__spReadyT) f.__spReadyT = setTimeout(() => { f.__spReadyT = 0; if (el.classList.contains('live')) el.classList.add('vready'); }, 300);
      } else { el.classList.remove('vready'); clearTimeout(f.__spReadyT); f.__spReadyT = 0; }
      // "Not live" only after the cell has had time to reach the profile.
      const off = !live && checks > 20;
      el.classList.toggle('off', off);
      msg.textContent = live ? 'Starting video…' : off ? 'Not live right now' : 'Connecting…';
      const dn = disp();
      nm.textContent = '@' + user + (dn ? ' (' + dn + ')' : '');
      st.textContent = live ? '· LIVE' : '· not live';
    };
    // Fast checks while the cell is getting ready, then every 4 seconds.
    const every = (fn, ms) => { const id = setInterval(fn, ms); el.__t.push(id); window.__spTimers.push(id); };
    every(() => { if (el.classList.contains('mini')) return; const busy = !el.classList.contains('vready') && !el.classList.contains('off'); if (busy || checks % 5 === 0) check(); else checks++; }, 800);
    // Every minute: if this cell isn't on a stream, ask the lookup and open the stream
    // when it starts (a full reload every 5th minute as a fallback). If it is on a
    // stream that has ended, go back to the profile.
    let ticks = 0;
    setTimeout(() => { if (el.isConnected && !el.classList.contains('mini')) diag(f, user, el, 'start+30s'); }, 30000);
    every(async () => {
      ticks++;
      if (el.classList.contains('mini')) {
        // Minimized: the stream is unloaded; just keep its live dot up to date.
        const info = await lookup(user);
        if (info) { el.dataset.lh = info.live ? '1' : ''; if (el.__chip) el.__chip.classList.toggle('live', !!info.live); }
        return;
      }
      diag(f, user, el, 'minute');
      const onStream = url().includes('/stream/');
      const info = await lookup(user);
      if (!onStream) { if (!info || info.live || ticks % 5 === 0) openUser(f, user); }
      else if (info && !info.live) {
        // The site's lookup can say "not live" for streams it only shows to signed-in
        // viewers (or while a stream is in a battle), so a playing stream would be
        // reloaded every minute. Only go back to the profile when the stream page
        // itself has ended too (its title no longer says it's a live stream) two minutes running.
        let pageLive = false;
        try { const d = f.contentDocument; pageLive = / Live Stream - Watch/.test(d.title || ''); } catch (e) {}
        el.__ended = pageLive ? 0 : (el.__ended || 0) + 1;
        if (el.__ended >= 2) { el.__ended = 0; openUser(f, user); }
      } else el.__ended = 0;
    }, 60000);
    return el;
  }

  // ---------- order (drag to rearrange, Move earlier/later) ----------
  // Cells never move in the page (moving a stream's frame would reload it); their
  // CSS order changes instead, and the list is saved in that order.
  const cellsInOrder = () => [...grid.querySelectorAll('.sp-cell')].sort((a, b) => (+a.style.order || 0) - (+b.style.order || 0));
  function relabel() {
    cellsInOrder().forEach((c, i) => { c.querySelector('.an').textContent = 'Cell ' + (i + 1); if (c.__chip) c.__chip.querySelector('.an').textContent = 'Cell ' + (i + 1); });
  }
  function commitOrder(arr) {
    arr.forEach((c, i) => { c.style.order = i; });
    const list = arr.map(c => c.dataset.user);
    input.value = list.join(', ');
    store.set(KEY, JSON.stringify(list));
    relabel(); layout();
  }
  function moveBy(el, d) {
    const arr = cellsInOrder(), i = arr.indexOf(el), j = Math.max(0, Math.min(arr.length - 1, i + d));
    if (i < 0 || i === j) return;
    arr.splice(i, 1); arr.splice(j, 0, el); commitOrder(arr);
  }
  function cellAt(x, y, self) {
    for (const c of grid.querySelectorAll('.sp-cell:not(.mini)')) {
      if (c === self) continue;
      const r = c.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return c;
    }
    return null;
  }
  // Drag a cell by its header: with a mouse, just drag; on a touch screen, press
  // and hold for a moment, then drag. Drop it on another cell to take its place.
  function wireDrag(el) {
    const head = el.querySelector('.sp-head');
    let pid = null, sx = 0, sy = 0, active = false, holdT = 0, target = null;
    const start = () => { if (grid.classList.contains('focus')) return; active = true; el.classList.add('dragging'); head.classList.add('grabbing'); closeMenus(); };
    const end = drop => {
      clearTimeout(holdT);
      if (pid !== null) { try { head.releasePointerCapture(pid); } catch (e) {} }
      pid = null;
      if (active) {
        el.classList.remove('dragging'); head.classList.remove('grabbing'); el.style.transform = '';
        if (drop && target) { const arr = cellsInOrder(); const from = arr.indexOf(el), to = arr.indexOf(target); arr.splice(from, 1); arr.splice(to, 0, el); commitOrder(arr); }
      }
      if (target) target.classList.remove('drop-target');
      target = null; active = false;
    };
    head.addEventListener('pointerdown', e => {
      if (e.button !== 0 || e.target.closest('button')) return;
      pid = e.pointerId; sx = e.clientX; sy = e.clientY; active = false;
      try { head.setPointerCapture(pid); } catch (err) {}
      if (e.pointerType !== 'mouse') holdT = setTimeout(start, 380);
    });
    head.addEventListener('pointermove', e => {
      if (e.pointerId !== pid) return;
      const dx = e.clientX - sx, dy = e.clientY - sy, far = Math.hypot(dx, dy);
      if (!active) {
        if (e.pointerType === 'mouse') { if (far > 6) start(); }
        else if (far > 12) end(false);   // moved before the hold: not a drag
        if (!active) return;
      }
      el.style.transform = `translate(${dx}px,${dy}px)`;
      const over = cellAt(e.clientX, e.clientY, el);
      if (over !== target) { if (target) target.classList.remove('drop-target'); target = over; if (target) target.classList.add('drop-target'); }
    });
    head.addEventListener('pointerup', e => { if (e.pointerId === pid) end(true); });
    head.addEventListener('pointercancel', e => { if (e.pointerId === pid) end(false); });
    head.addEventListener('lostpointercapture', e => { if (e.pointerId === pid) end(false); });
  }

  // ---------- per-cell menu ----------
  function closeMenus(except) {
    grid.querySelectorAll('.sp-cell.menu-open').forEach(c => { if (c !== except) { c.classList.remove('menu-open'); const b = c.querySelector('.sp-more'); b.classList.remove('on'); b.setAttribute('aria-expanded', 'false'); } });
  }
  D.addEventListener('pointerdown', e => { if (!e.target.closest('.sp-menu, .sp-more')) closeMenus(); }, true);
  D.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenus(); });
  function wireMenu(el, f, user) {
    const more = el.querySelector('.sp-more'), menu = el.querySelector('.sp-menu');
    const hideItem = menu.querySelector('[data-a="hide"]');
    const showPic = () => menu.querySelectorAll('input[type=range]').forEach(r => { const v = picFor(user)[r.dataset.k]; r.value = v; r.nextElementSibling.textContent = v + '%'; });
    more.setAttribute('aria-expanded', 'false');
    more.onclick = () => {
      const open = !el.classList.contains('menu-open');
      closeMenus(el);
      el.classList.toggle('menu-open', open); more.classList.toggle('on', open); more.setAttribute('aria-expanded', String(open));
      if (open) {
        showPic(); hideItem.textContent = el.classList.contains('hidden') ? 'Show video' : 'Hide video';
        const ri = menu.querySelector('[data-a="rec"]'); if (ri) ri.textContent = el.__rec ? 'Stop recording' : 'Record this feed';
        const first = menu.querySelector('.mi'); if (first) first.focus();
      }
    };
    menu.querySelectorAll('input[type=range]').forEach(r => r.addEventListener('input', () => {
      picSet(user, r.dataset.k, +r.value); r.nextElementSibling.textContent = r.value + '%'; apply(f);
    }));
    menu.addEventListener('click', e => {
      const a = e.target.closest('[data-a]'); if (!a) return;
      const act = a.dataset.a;
      if (act === 'pic') { menu.classList.toggle('pic-open'); showPic(); return; }
      if (act === 'picreset') { ['c', 'b', 's'].forEach(k => picSet(user, k, 100)); showPic(); apply(f); return; }
      closeMenus();
      if (act === 'rec') { if (el.__rec) stopRec(el); else startRec(el, f, user); }
      else if (act === 'hide') el.classList.toggle('hidden');
      else if (act === 'mini') minimize(el);
      else if (act === 'earlier') moveBy(el, -1);
      else if (act === 'later') moveBy(el, 1);
      else if (act === 'remove') removeCell(el);
    });
  }

  // ---------- minimize / restore / remove ----------
  // A minimized stream is unloaded (no data, not counted as a viewer) and shown as a
  // name at the top; its live dot stays current. Clicking the name reconnects it.
  function unload(el) {
    const f = el.querySelector('iframe');
    clearInterval(f.__spNav); clearTimeout(f.__spReadyT); f.__spReadyT = 0; f.onload = null;
    try { f.src = 'about:blank'; } catch (e) {}
    el.classList.remove('vready', 'live', 'off', 'menu-open');
  }
  function addChip(el) {
    if (el.__chip) return;
    const c = D.createElement('button');
    c.className = 'sp-chip'; c.title = 'Bring this stream back';
    c.innerHTML = '<span class="sp-dot"></span><span class="nm"></span><span class="an"></span>';
    c.querySelector('.nm').textContent = '@' + el.dataset.user;
    c.onclick = () => restore(el);
    el.__chip = c; tray.appendChild(c);
  }
  function minimize(el) {
    if (el.__rec) stopRec(el);
    if (el.classList.contains('focused')) setFocus(null);
    el.dataset.lh = el.classList.contains('live') ? '1' : '';
    unload(el);
    el.classList.add('mini');
    minis.add(el.dataset.user.toLowerCase()); saveMinis();
    addChip(el); if (el.dataset.lh) el.__chip.classList.add('live');
    relabel(); layout();
  }
  function restore(el) {
    el.classList.remove('mini');
    minis.delete(el.dataset.user.toLowerCase()); saveMinis();
    if (el.__chip) { el.__chip.remove(); el.__chip = null; }
    if (el.__resetChecks) el.__resetChecks();
    openUser(el.querySelector('iframe'), el.dataset.user);
    layout(); requestAnimationFrame(() => layout()); flash(el);
  }
  function removeCell(el) {
    if (el.__rec) stopRec(el);
    (el.__t || []).forEach(clearInterval);
    unload(el);
    if (el.__chip) el.__chip.remove();
    if (el.classList.contains('focused')) grid.classList.remove('focus');
    el.remove();
    minis.delete(el.dataset.user.toLowerCase()); saveMinis();
    const rest = cellsInOrder();
    commitOrder(rest);
    if (!rest.length) build([]);
  }
  // Size every cell to the stream's own shape (9:16) so there is no empty space
  // around the video, and centre the grid. In focus mode one cell fills the area.
  function layout() {
    const all = grid.querySelectorAll('.sp-cell').length;
    let n = grid.querySelectorAll('.sp-cell:not(.mini)').length;
    let hint = grid.querySelector('.sp-allmini');
    if (all && !n) { if (!hint) { hint = D.createElement('div'); hint.className = 'sp-empty sp-allmini'; hint.textContent = 'All streams are minimized. Click a name at the top to bring one back.'; grid.appendChild(hint); } }
    else if (hint) hint.remove();
    if (grid.classList.contains('focus')) n = 1;
    if (!n) return;
    const W = grid.clientWidth || innerWidth - 20, Hh = grid.clientHeight || innerHeight - 150;
    const head = (grid.querySelector('.sp-cell:not(.mini) .sp-head') || {}).offsetHeight || 40;
    const gap = 10, padX = 14, padY = head + 8;   // borders + side margins / header + bottom margin
    let best = 1, bestW = 0;
    for (let cols = 1; cols <= n; cols++) {
      const rows = Math.ceil(n / cols);
      const cw = (W - gap * (cols - 1)) / cols - padX, ch = (Hh - gap * (rows - 1)) / rows - padY;
      const vw = Math.min(cw, ch * 9 / 16);
      if (vw > bestW) { bestW = vw; best = cols; }
    }
    const rows = Math.ceil(n / best), vw = Math.max(60, Math.floor(bestW));
    grid.style.gridTemplateColumns = `repeat(${best}, ${vw + padX}px)`;
    grid.style.gridTemplateRows = `repeat(${rows}, ${Math.floor(vw * 16 / 9) + padY}px)`;
    setTimeout(() => D.querySelectorAll('.sp-cell.live iframe').forEach(styleInner), 60);
  }
  function setFocus(el) {
    const on = el && !el.classList.contains('focused');
    grid.querySelectorAll('.sp-cell').forEach(c => {
      c.classList.toggle('focused', on && c === el);
      const b = c.querySelector('.sp-max'); if (b) { const f = on && c === el; b.innerHTML = f ? ICON.unmax : ICON.max; b.title = f ? 'Back to the grid' : 'Show this stream large'; b.setAttribute('aria-label', b.title); }
    });
    grid.classList.toggle('focus', !!on);
    layout(grid.querySelectorAll('.sp-cell').length);
  }
  function build(list) {
    grid.querySelectorAll('.sp-cell').forEach(c => { if (c.__rec) stopRec(c); });
    (window.__spTimers || []).forEach(clearInterval); window.__spTimers = [];
    store.set(KEY, JSON.stringify(list));
    tray.textContent = '';
    grid.innerHTML = '';
    if (!list.length) { grid.innerHTML = '<div class="sp-empty">No feeds yet.<br>Click Edit list to add some.</div>'; grid.style.gridTemplateColumns = '1fr'; return; }
    grid.classList.remove('focus');
    layout(list.length);
    list.forEach((u, i) => grid.appendChild(cell(u, i)));
    relabel(); layout();
    requestAnimationFrame(() => layout());
  }
  // Add one broadcaster to the grid that is already running (or point at their cell
  // if they're already in it). Used when an alert's "Open in MultiGridView" is clicked.
  function flash(el) {
    el.classList.add('sp-flash');
    try { el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) {}
    setTimeout(() => el.classList.remove('sp-flash'), 6000);
  }
  window.__spAddUser = raw => {
    const u = parse(String(raw || ''))[0];
    if (!u) return false;
    if (grid.classList.contains('focus')) setFocus(null);
    const have = cellsInOrder().find(c => c.dataset.user.toLowerCase() === u.toLowerCase());
    if (have) { if (have.classList.contains('mini')) restore(have); else flash(have); return true; }
    grid.querySelector('.sp-empty:not(.sp-allmini)')?.remove();
    const el = cell(u, grid.querySelectorAll('.sp-cell').length);
    grid.appendChild(el);
    commitOrder(cellsInOrder());
    requestAnimationFrame(() => layout());
    flash(el);
    return true;
  };
  window.addEventListener('resize', () => { const n = grid.querySelectorAll('.sp-cell').length; if (n) layout(n); });
  D.addEventListener('keydown', e => { if (e.key === 'Escape' && grid.classList.contains('focus') && !D.fullscreenElement) setFocus(null); });
  const dock = $('sp-dock');
  const fitDock = () => {
    const h = dock.offsetHeight + (parseFloat(getComputedStyle(dock).bottom) || 14);
    root.style.setProperty('--gridb', (h + 10) + 'px');
    root.style.setProperty('--dockh', (h + 8) + 'px');
    const n = grid.querySelectorAll('.sp-cell').length; if (n) layout(n);
  };
  try { new ResizeObserver(fitDock).observe(dock); } catch (e) {}
  window.addEventListener('resize', fitDock);

  // ---------- broadcasters ----------
  const openPop = o => { pop.classList.toggle('open', o); $('sp-edit').classList.toggle('on', o); if (o) input.focus(); };
  $('sp-edit').onclick = () => openPop(!pop.classList.contains('open'));
  $('sp-popclose').onclick = () => openPop(false);
  $('sp-go').onclick = () => { build(parse(input.value)); openPop(false); };
  $('sp-rebuild').onclick = () => build(parse(input.value));
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); $('sp-go').click(); } if (e.key === 'Escape') openPop(false); });

  // ---------- account (Windows app only) ----------
  if (window.mgvApp && window.mgvApp.openAlerts && $('sp-alerts')) $('sp-alerts').onclick = () => window.mgvApp.openAlerts();

  if (window.mgvApp && window.mgvApp.openAccount && $('sp-acct')) { $('sp-acct').title = 'Sign in or out. The grid reloads when you close the window.'; $('sp-acct').onclick = () => window.mgvApp.openAccount(); }

  // ---------- about ----------
  const ABOUT_FEATURES = [
    ['Account sign-in', 'Sign in from APP > Account. The grid and Alerts use your sign-in; signed out, they watch as a guest.'],
    ['Live detection', 'The grid checks each feed with your sign-in. It shares the sign-in with Alerts shortly after start, every 30 minutes and when you close Account.'],
    ['Video-sized cells', 'Each tile takes the shape of the video, with a maximize button to show one stream large.'],
    ['Loading', 'While a stream connects its page shows faded; the video takes over once the feed is live.'],
    ['Cell menu', 'Picture (contrast, brightness, saturation per feed), Minimize, Hide video, Move earlier/later, Remove.'],
    ['Rearrange', 'Drag a tile by its header, or use Move earlier/later in its menu.'],
    ['Zoom', 'Scroll or pinch on a tile to zoom, drag to move, double-click to reset.'],
    ['Picture', 'Sharpen, Saturation and Color for all tiles from the PICTURE controls.'],
    ['Controls dock', 'Shrinks to a small pill in the corner; one scrollable row in narrow windows.'],
    ['Alerts', 'Tray app with a pop-up and a small live preview when a feed goes live; click to open it in the grid. Its status list shows a small live video next to each live feed.'],
    ['Refused checks', 'If the site refuses a live check, the cell keeps checking on its own and the refusal is logged.'],
    ['Record a feed', 'Record this feed in a tile\'s menu records that tile\'s picture and sound with Section Recorder (1.6.0 or newer) on this PC. Other tiles can stay muted or playing.'],
    ['Diagnostics', 'Check and grid logs in %APPDATA%\\MultiGridView Alerts for tracing problems.']
  ];
  if (window.mgvApp && window.mgvApp.about && $('sp-about')) {
    const box = D.createElement('div');
    box.id = 'sp-aboutbox'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'About MultiGridView');
    box.style.cssText = 'position:absolute;inset:0;z-index:20;display:none;place-items:center;background:rgba(5,8,14,.6);padding:16px;box-sizing:border-box';
    box.innerHTML = '<div style="width:min(560px,100%);max-height:calc(100% - 32px);overflow:auto;background:var(--panel);border:1px solid var(--line2);border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.5);padding:18px 20px;box-sizing:border-box;display:flex;flex-direction:column;gap:12px">'
      + '<div style="display:flex;align-items:baseline;justify-content:space-between;gap:12px"><div style="font:700 18px Sora,system-ui,sans-serif;color:var(--ink)">MultiGridView</div><div id="sp-aboutver" style="font:600 13px ui-monospace,Consolas,monospace;color:var(--accent2)"></div></div>'
      + '<div id="sp-aboutengine" style="color:var(--muted);font-size:12px"></div>'
      + '<div style="font:700 11px Sora,system-ui,sans-serif;letter-spacing:.16em;color:var(--accent2)">FEATURES</div>'
      + '<dl id="sp-aboutlist" style="margin:0;display:grid;grid-template-columns:minmax(110px,auto) 1fr;gap:8px 14px;font-size:13px"></dl>'
      + '<div style="color:var(--muted);font-size:12px">The app records a feed only when you choose Record this feed, using Section Recorder on this PC.</div>'
      + '<div style="display:flex;justify-content:flex-end"><button id="sp-aboutclose" class="primary">Close</button></div></div>';
    root.appendChild(box);
    const dl = box.querySelector('#sp-aboutlist');
    ABOUT_FEATURES.forEach(([k, v]) => { const dt = D.createElement('dt'); dt.textContent = k; dt.style.cssText = 'font-weight:600;color:var(--ink)'; const dd = D.createElement('dd'); dd.textContent = v; dd.style.cssText = 'margin:0;color:var(--muted)'; dl.append(dt, dd); });
    const close = () => { box.style.display = 'none'; };
    box.querySelector('#sp-aboutclose').onclick = close;
    box.addEventListener('click', e => { if (e.target === box) close(); });
    D.addEventListener('keydown', e => { if (e.key === 'Escape' && box.style.display !== 'none') close(); });
    $('sp-about').onclick = async () => {
      try { const a = await window.mgvApp.about(); box.querySelector('#sp-aboutver').textContent = 'Version ' + a.version; box.querySelector('#sp-aboutengine').textContent = 'Windows app · Electron ' + a.electron + ' · Chromium ' + a.chrome; } catch (e) {}
      box.style.display = 'grid'; box.querySelector('#sp-aboutclose').focus();
    };
  }

  // ---------- view ----------
  H.classList.add('sp-anon');
  const toggle = (id, cls, onText, offText, after) => {
    const b = $(id);
    const upd = () => { const on = H.classList.contains(cls); b.textContent = on ? onText : offText; b.classList.toggle('on', on); };
    b.onclick = () => { H.classList.toggle(cls); upd(); after && after(); };
    upd(); return upd;
  };
  toggle('sp-anon-btn', 'sp-anon', 'Names hidden', 'Names shown');
  toggle('sp-allhide', 'sp-allhide', 'Show all', 'Hide all');
  const fsb = $('sp-fs');
  const fsUpd = () => { fsb.textContent = D.fullscreenElement ? 'Exit full screen' : 'Full screen'; fsb.classList.toggle('on', !!D.fullscreenElement); };
  fsb.onclick = async () => { try { if (D.fullscreenElement) await D.exitFullscreen(); else await H.requestFullscreen({ navigationUI: 'hide' }); } catch (e) { fsb.textContent = 'Full screen not allowed'; setTimeout(fsUpd, 2500); } };
  D.onfullscreenchange = () => { fsUpd(); setTimeout(() => { const n = grid.querySelectorAll('.sp-cell').length; if (n) layout(n); }, 200); };
  fsUpd();
  const small = store.get('sp_dock_small') === '1';
  H.classList.toggle('sp-docksmall', small);
  $('sp-dockmin').onclick = () => { H.classList.add('sp-docksmall'); store.set('sp_dock_small', '1'); openPop(false); setTimeout(() => layout(grid.querySelectorAll('.sp-cell').length || 1), 50); };
  $('sp-dockopen').onclick = () => { H.classList.remove('sp-docksmall'); store.set('sp_dock_small', '0'); setTimeout(() => layout(grid.querySelectorAll('.sp-cell').length || 1), 50); };

  // ---------- picture ----------
  const OPT = {
    sharp: { label: 'Sharpen', order: ['Off', 'Low', 'Medium', 'High'], val: { Off: 0, Low: 0.35, Medium: 0.7, High: 1.1 }, def: 'Off' },
    sat: { label: 'Saturation', order: ['Natural', 'Low', 'Medium', 'High'], val: { Natural: 1.0, Low: 1.12, Medium: 1.3, High: 1.5 }, def: 'Natural' },
    tone: { label: 'Color', order: ['Neutral', 'Warm', 'Warmer', 'Cool'], val: { Neutral: [1, 1, 1], Warm: [1.06, 1.0, 0.93], Warmer: [1.12, 1.01, 0.86], Cool: [0.94, 1.0, 1.07] }, def: 'Neutral' }
  };
  const cur = {};
  for (const k in OPT) { cur[k] = OPT[k].def; const s = store.get('sp_fx_' + k); if (s && s in OPT[k].val) cur[k] = s; }
  const kernel = a => `0 ${-a} 0 ${-a} ${1 + 4 * a} ${-a} 0 ${-a} 0`;
  function apply(f) {
    try {
      const d = f.contentDocument; if (!d || !window.__spFindVid(d)) return;
      let svg = d.getElementById('sp-fx-svg');
      if (!svg) {
        svg = d.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.id = 'sp-fx-svg'; svg.setAttribute('width', '0'); svg.setAttribute('height', '0');
        svg.style.cssText = 'position:absolute;width:0;height:0;visibility:hidden';
        svg.innerHTML = '<filter id="sp-fx" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0"/><feConvolveMatrix order="3" preserveAlpha="true" kernelMatrix="0 0 0 0 1 0 0 0 0"/></filter>';
        d.body.appendChild(svg);
      }
      const [r, g, b] = OPT.tone.val[cur.tone], a = OPT.sharp.val[cur.sharp];
      svg.querySelector('feColorMatrix').setAttribute('values', `${r} 0 0 0 0 0 ${g} 0 0 0 0 0 ${b} 0 0 0 0 0 1 0`);
      svg.querySelector('feConvolveMatrix').setAttribute('kernelMatrix', kernel(a));
      const useSvg = a > 0 || cur.tone !== 'Neutral';
      let st = d.getElementById('sp-fx-style');
      if (!st) { st = d.createElement('style'); st.id = 'sp-fx-style'; d.head.appendChild(st); }
      const pc = picFor(f.dataset.user);
      const mine = (pc.c !== 100 ? ' contrast(' + pc.c / 100 + ')' : '') + (pc.b !== 100 ? ' brightness(' + pc.b / 100 + ')' : '') + (pc.s !== 100 ? ' saturate(' + pc.s / 100 + ')' : '');
      const parts = (useSvg ? 'url(#sp-fx) ' : '') + (cur.sat !== 'Natural' ? 'saturate(' + OPT.sat.val[cur.sat] + ')' : '') + mine;
      const want = parts.trim() ? `html body [data-sp-v]{filter:${parts.trim()} !important;}` : '';
      if (st.textContent !== want) st.textContent = want;
    } catch (e) {}
  }
  const allFx = () => D.querySelectorAll('.sp-cell iframe').forEach(apply);
  for (const k in OPT) {
    const btn = $('sp-fx-' + k);
    const upd = () => { btn.textContent = OPT[k].label + ' · ' + cur[k]; btn.title = 'Click to change (' + OPT[k].order.join(' / ') + ')'; };
    btn.onclick = () => { const o = OPT[k].order; cur[k] = o[(o.indexOf(cur[k]) + 1) % o.length]; store.set('sp_fx_' + k, cur[k]); upd(); allFx(); };
    upd();
  }
  window.__spFxT = setInterval(allFx, 2000);

  // ---------- chat ----------
  const readChat = f => {
    try {
      const d = f.contentDocument;
      return [...d.querySelectorAll('[data-testid^="chat-event-"]')].map(e => {
        const parts = []; const w = d.createTreeWalker(e, NodeFilter.SHOW_TEXT); let n;
        while ((n = w.nextNode())) { const t = n.textContent.trim(); if (t) parts.push(t); }
        return parts;
      }).filter(p => p.length).slice(-10);
    } catch (e) { return []; }
  };
  function renderChat() {
    if (!H.classList.contains('sp-chaton')) return;
    D.querySelectorAll('.sp-cell').forEach(c => {
      const body = c.querySelector('.sp-body'); if (!body) return;
      let box = body.querySelector('.sp-chat');
      if (!box) { box = D.createElement('div'); box.className = 'sp-chat'; body.appendChild(box); }
      const lines = c.classList.contains('live') ? readChat(c.querySelector('iframe')) : [];
      const key = JSON.stringify(lines); if (box.dataset.k === key) return; box.dataset.k = key;
      box.textContent = '';
      for (const p of lines) {
        const ln = D.createElement('div'); ln.className = 'ln';
        const sys = p.length === 1 || /^(Battle Results:|New Follower)/.test(p[0]) || /New Follower!?$/.test(p[p.length - 1]);
        if (p.length > 1) { const b = D.createElement('b'); b.textContent = p[0]; ln.appendChild(b); ln.appendChild(D.createTextNode(p.slice(1).join(' '))); }
        else ln.appendChild(D.createTextNode(p[0]));
        if (sys) ln.classList.add('sys');
        box.appendChild(ln);
      }
    });
  }
  if (store.get('sp_chat') !== 'off') H.classList.add('sp-chaton');
  toggle('sp-chat-btn', 'sp-chaton', 'Chat on', 'Chat off', () => { store.set('sp_chat', H.classList.contains('sp-chaton') ? 'on' : 'off'); renderChat(); });
  window.__spChatT = setInterval(renderChat, 2000);

  // ---------- sound ----------
  const tangoMute = f => { try { return f.contentDocument.querySelector('[data-testid=mute]'); } catch (e) { return null; } };
  const isMuted = m => { const p = m && m.querySelector('path'); return !!p && /^M5\.47 3\.841/.test(p.getAttribute('d') || ''); };
  function syncSound() {
    D.querySelectorAll('.sp-cell').forEach(c => {
      const b = c.querySelector('.sp-snd'); if (!b) return;
      if (!b.dataset.wired) {
        b.dataset.wired = '1';
        b.onclick = () => {
          if (c.__rec && c.__rec.ownMute) { c.__rec.listen = !c.__rec.listen; applyListen(c.__rec); syncSound(); return; }
          const m = tangoMute(c.querySelector('iframe')); if (m) { m.click(); setTimeout(syncSound, 400); }
        };
      }
      const m = c.classList.contains('live') ? tangoMute(c.querySelector('iframe')) : null;
      const muted = c.__rec && c.__rec.ownMute ? !c.__rec.listen : (!m || isMuted(m));
      b.disabled = !m;
      const want = muted ? 'm' : 's';
      if (b.dataset.st !== want) { b.dataset.st = want; b.innerHTML = muted ? ICON.mute : ICON.sound; }
      b.classList.toggle('on', !!m && !muted);
      b.title = !m ? 'Sound (available when live)' : muted ? 'Turn sound on' : 'Turn sound off';
    });
  }
  window.__spSndT = setInterval(syncSound, 1500);

  // ---------- record a feed (Windows app + Section Recorder) ----------
  // The tile's picture is captured by Section Recorder from this window; its
  // sound comes from this feed only (see the sound hook in grid-preload.js) and
  // is sent to Section Recorder as 48 kHz 16-bit stereo, in 100 ms chunks.
  const WORKLET = "class SpTap extends AudioWorkletProcessor{process(i){const c=i[0];if(c&&c.length){this.port.postMessage([c[0].slice(0),(c[1]||c[0]).slice(0)]);}return true;}}registerProcessor('sp-tap',SpTap);";
  let recCtx = null, recWorklet = null;
  async function recAudioCtx() {
    if (!recCtx || recCtx.state === 'closed') { recCtx = new AudioContext({ sampleRate: 48000 }); recWorklet = null; }
    if (recCtx.state === 'suspended') { try { await recCtx.resume(); } catch (e) {} }
    if (recWorklet === null) {
      try { const url = URL.createObjectURL(new Blob([WORKLET], { type: 'application/javascript' })); await recCtx.audioWorklet.addModule(url); recWorklet = true; }
      catch (e) { recWorklet = false; }
    }
    return recCtx;
  }
  const toast = (text, bad) => {
    const n = D.createElement('div');
    n.className = 'sp-toast' + (bad ? ' bad' : ''); n.setAttribute('role', 'status');
    n.textContent = text; n.onclick = () => n.remove();
    root.appendChild(n); setTimeout(() => n.remove(), bad ? 15000 : 6000);
  };
  const fmtT = s => { s = Math.max(0, Math.floor(s)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };
  // Where the video shows on screen, in this window's pixels.
  function tileRect(el, f) {
    const body = el.querySelector('.sp-body').getBoundingClientRect();
    let r = body;
    try {
      const v = f.contentDocument.querySelector('[data-sp-v]');
      if (v) {
        const fr = f.getBoundingClientRect(), vr = v.getBoundingClientRect();
        const x0 = Math.max(body.left, fr.left + vr.left), y0 = Math.max(body.top, fr.top + vr.top);
        const x1 = Math.min(body.right, fr.left + vr.right), y1 = Math.min(body.bottom, fr.top + vr.bottom);
        if (x1 - x0 > 20 && y1 - y0 > 20) r = { left: x0, top: y0, width: x1 - x0, height: y1 - y0 };
      }
    } catch (e) {}
    const d = devicePixelRatio;
    return { x: Math.round(r.left * d), y: Math.round(r.top * d), w: Math.round(r.width * d), h: Math.round(r.height * d) };
  }
  function pushPCM(rec, l, r) {
    if (rec.stopping) return;
    for (let i = 0; i < l.length; i++) {
      const a = Math.max(-1, Math.min(1, l[i])), b = Math.max(-1, Math.min(1, r[i]));
      rec.chunk[rec.n++] = a * 32767; rec.chunk[rec.n++] = b * 32767;
      const p = Math.abs(a) > Math.abs(b) ? Math.abs(a) : Math.abs(b); if (p > rec.peak) rec.peak = p;
      if (rec.n >= rec.chunk.length) { window.mgvApp.rec.audio(rec.id, rec.chunk.buffer); rec.chunk = new Int16Array(rec.chunk.length); rec.n = 0; }
    }
  }
  // Connect this feed's sound sources (they change when the stream reloads).
  function refreshTaps(rec) {
    const W = (() => { try { return rec.f.contentWindow; } catch (e) { return null; } })();
    let taps = [];
    try { taps = W && W.__spTaps ? W.__spTaps() : []; } catch (e) { rec.err = String(e && e.message); }
    for (const t of taps) {
      if (rec.srcs.has(t.key)) continue;
      try { if (!t.stream.getAudioTracks().length) continue; const src = recCtx.createMediaStreamSource(t.stream); src.connect(rec.mixer); rec.srcs.set(t.key, { src, kind: t.kind }); }
      catch (e) { rec.err = String(e && e.message); }
    }
    for (const [k, v] of rec.srcs) if (!taps.some(t => t.key === k)) { try { v.src.disconnect(); } catch (e) {} rec.srcs.delete(k); }
    const kinds = new Set([...rec.srcs.values()].map(v => v.kind));
    rec.how = [...kinds].join('+') || (W && W.__spTaps ? 'none yet' : 'no sound hook');
    // Sound the site plays through Web Audio stops when the site is muted, so while
    // recording the site stays unmuted and the tile's sound button only changes
    // what you hear. Media elements are recorded even while muted.
    const m = tangoMute(rec.f), siteMuted = !!m && isMuted(m);
    const click = () => { if (Date.now() - (rec.clickAt || 0) > 3000) { rec.clickAt = Date.now(); m.click(); } };
    rec.ownMute = kinds.has('webaudio') || !kinds.size;
    if (rec.ownMute) { if (siteMuted) click(); applyListen(rec); }
    else { if (!rec.listen && m && !siteMuted) click(); try { W && W.__spListen && W.__spListen(true); } catch (e) {} }
  }
  function applyListen(rec) { try { const W = rec.f.contentWindow; if (W && W.__spListen) W.__spListen(rec.listen); } catch (e) {} }
  function recBadge(rec, text) { const t = rec.el.querySelector('.sp-rec .t'); if (t) t.textContent = text; }
  function cleanupRec(rec) {
    clearInterval(rec.timer);
    for (const v of rec.srcs.values()) { try { v.src.disconnect(); } catch (e) {} }
    rec.srcs.clear();
    ['mixer', 'node', 'zero', 'sink'].forEach(k => { try { rec[k] && rec[k].disconnect(); } catch (e) {} });
    try { rec.zero && rec.zero.stop(); } catch (e) {}
    // Put the tile's sound back the way you had it.
    try {
      const m = tangoMute(rec.f);
      if (rec.ownMute && !rec.listen && m && !isMuted(m)) m.click();
      const W = rec.f.contentWindow; if (W && W.__spListen) W.__spListen(true);
    } catch (e) {}
    if (rec.el.__rec === rec) rec.el.__rec = null;
    rec.el.classList.remove('rec');
    rec.el.querySelector('.sp-rec').classList.remove('nosound');
    syncSound();
  }
  async function startRec(el, f, user) {
    if (el.__rec) return;
    if (!el.classList.contains('live')) { toast('@' + user + ' isn\'t live right now, so there is nothing to record yet.', true); return; }
    const rec = { id: user + '-' + Date.now(), el, f, user, srcs: new Map(), listen: true, ownMute: false, chunk: new Int16Array(4800 * 2), n: 0, peak: 0, quiet: 0, how: '' };
    el.__rec = rec; el.classList.add('rec'); recBadge(rec, 'starting…');
    const m0 = tangoMute(f); rec.listen = !(m0 && isMuted(m0));
    try {
      const ctx = await recAudioCtx();
      rec.mixer = ctx.createGain();
      rec.zero = ctx.createConstantSource(); rec.zero.offset.value = 0; rec.zero.connect(rec.mixer); rec.zero.start();
      if (recWorklet) {
        rec.node = new AudioWorkletNode(ctx, 'sp-tap', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [2], channelCount: 2, channelCountMode: 'explicit' });
        rec.node.port.onmessage = e => pushPCM(rec, e.data[0], e.data[1]);
      } else {
        rec.node = ctx.createScriptProcessor(4096, 2, 2);
        rec.node.onaudioprocess = e => pushPCM(rec, e.inputBuffer.getChannelData(0), e.inputBuffer.getChannelData(1));
      }
      rec.sink = ctx.createGain(); rec.sink.gain.value = 0;
      rec.mixer.connect(rec.node); rec.node.connect(rec.sink); rec.sink.connect(ctx.destination);
      refreshTaps(rec);
    } catch (e) { rec.err = String(e && e.message); }
    const res = await window.mgvApp.rec.start(rec.id, { feed: '@' + user, rect: tileRect(el, f), rate: recCtx ? recCtx.sampleRate : 48000, how: rec.how });
    let info = null; try { info = f.contentWindow.__spAudioInfo && f.contentWindow.__spAudioInfo(); } catch (e) {}
    if (window.mgvApp.log) window.mgvApp.log({ rec: 'audio', user, how: rec.how, worklet: recWorklet, info, err: rec.err, ok: res && res.ok });
    if (!res || !res.ok) { rec.stopping = true; cleanupRec(rec); toast('Couldn\'t start recording @' + user + '.\n' + ((res && res.error) || ''), true); return; }
    rec.name = res.name;
    let last = '', ticks = 0;
    rec.timer = setInterval(() => {
      if (!el.isConnected) { stopRec(el); return; }
      const r = JSON.stringify(tileRect(el, f));
      if (r !== last) { last = r; window.mgvApp.rec.rect(rec.id, JSON.parse(r)); }
      if (++ticks % 2 === 0) refreshTaps(rec);
    }, 500);
    toast('Recording @' + user + ' with Section Recorder. Choose Stop recording in the tile menu to finish.');
    syncSound();
  }
  function stopRec(el) {
    const rec = el.__rec; if (!rec || rec.stopping) return;
    rec.stopping = true;
    if (rec.n) { window.mgvApp.rec.audio(rec.id, rec.chunk.slice(0, rec.n).buffer); rec.n = 0; }
    clearInterval(rec.timer);
    recBadge(rec, 'saving…');
    window.mgvApp.rec.stop(rec.id);
    rec.giveUp = setTimeout(() => cleanupRec(rec), 35000);
  }
  const recById = id => { for (const c of grid.querySelectorAll('.sp-cell')) if (c.__rec && c.__rec.id === id) return c.__rec; return null; };
  if (window.mgvApp && window.mgvApp.rec) window.mgvApp.rec.onEvent((id, msg) => {
    const rec = recById(id); if (!rec || !msg) return;
    if (msg.op === 'status') {
      if (!rec.stopping) recBadge(rec, fmtT(msg.seconds || 0));
      rec.quiet = msg.sound === false ? rec.quiet + 1 : 0;
      const b = rec.el.querySelector('.sp-rec');
      b.classList.toggle('nosound', rec.quiet >= 8);
      b.title = rec.quiet >= 8 ? 'Recording, but no sound is coming from this feed (' + rec.how + ')' : 'Recording with Section Recorder (sound: ' + rec.how + ')';
    } else if (msg.op === 'stopped') {
      clearTimeout(rec.giveUp); cleanupRec(rec);
      const files = msg.files || [];
      const name = files.length ? files[files.length - 1].split(/[\\/]/).pop() : '';
      if (msg.error) toast('Recording of @' + rec.user + ' stopped: ' + msg.error, true);
      else toast('Saved @' + rec.user + (name ? ': ' + name : '') + (files.length > 1 ? ' (' + files.length + ' parts)' : '') + (msg.message ? '\n' + msg.message : ''));
    } else if (msg.op === 'error' || msg.op === 'closed') {
      clearTimeout(rec.giveUp); cleanupRec(rec);
      toast(msg.op === 'error' ? 'Recording of @' + rec.user + ': ' + (msg.message || 'error') : 'Section Recorder closed, so the recording of @' + rec.user + ' stopped.', true);
    }
  });

  // ---------- viewers ----------
  const num = t => { t = (t || '').trim().replace(/,/g, ''); const m = t.match(/^([\d.]+)\s*([KkMm]?)/); if (!m) return null; let v = parseFloat(m[1]); if (/k/i.test(m[2])) v *= 1e3; if (/m/i.test(m[2])) v *= 1e6; return Math.round(v); };
  const fmt = n => n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e4 ? (n / 1e3).toFixed(1) + 'K' : n.toLocaleString();
  function stats() {
    let tot = 0, live = 0, all = 0;
    D.querySelectorAll('.sp-cell').forEach(c => {
      all++;
      let v = null;
      try { if (c.classList.contains('live')) { const e = c.querySelector('iframe').contentDocument.querySelector('[data-testid=viewers]'); v = e ? num(e.textContent) : null; } } catch (e) {}
      if (c.classList.contains('mini') ? c.dataset.lh === '1' : c.classList.contains('live')) live++;
      if (v != null) tot += v;
      const vc = c.querySelector('.sp-vc'); if (vc) vc.textContent = v != null ? fmt(v) + ' watching' : '';
    });
    $('sp-stats').innerHTML = `<b>${fmt(tot)}</b> viewers · ${live} of ${all} live`;
  }
  window.__spStatsT = setInterval(stats, 3000);

  // ---------- start ----------
  let saved = [];
  try { saved = JSON.parse(store.get(KEY) || '[]'); } catch (e) {}
  input.value = saved.join(', ');
  build(saved);
  stats(); syncSound();
  if (!saved.length) openPop(true);
  // One-time note (e.g. after a session repair).
  const note = store.get('sp_note');
  if (note) {
    store.set('sp_note', '');
    const n = D.createElement('div');
    n.setAttribute('role', 'status');
    n.style.cssText = 'position:absolute;top:52px;left:50%;transform:translateX(-50%);max-width:min(560px,calc(100% - 24px));z-index:5;background:var(--panel);border:1px solid var(--accent);color:var(--ink);border-radius:12px;padding:10px 14px;font:13px/1.4 Figtree,system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.45);cursor:pointer';
    n.textContent = note + '  (Click to close.)';
    n.onclick = () => n.remove();
    root.appendChild(n);
    setTimeout(() => n.remove(), 20000);
  }
})();
