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
  position:fixed;inset:0;z-index:2147483647;background:var(--bg);color:var(--ink);font:13px/1.4 Figtree,system-ui,'Segoe UI',sans-serif;}
html,body{background:#0c1018 !important;overflow:hidden !important;}
body > *:not(#sp-root){display:none !important;}
#sp-root button{font:600 13px Figtree,system-ui,sans-serif;color:var(--ink);background:var(--raise);border:1px solid var(--line2);border-radius:10px;padding:7px 13px;cursor:pointer;white-space:nowrap;}
#sp-root button:hover{border-color:var(--accent2);}
#sp-root button:focus-visible{outline:2px solid var(--accent2);outline-offset:2px;}
#sp-root button.on{background:var(--tint);border-color:var(--accent);color:#cfe0ff;}
#sp-root button.primary{background:var(--accent);border-color:var(--accent);color:#fff;}
#sp-top{position:absolute;top:10px;left:12px;right:12px;height:32px;display:flex;align-items:center;gap:10px;}
#sp-brand{font:700 15px Sora,system-ui,sans-serif;letter-spacing:.02em;display:flex;align-items:center;gap:8px;}
#sp-brand i{width:11px;height:11px;border-radius:3px;background:var(--accent);display:block;}
#sp-stats{margin-left:auto;background:var(--panel);border:1px solid var(--line);border-radius:999px;padding:6px 14px;font-variant-numeric:tabular-nums;color:var(--muted);}
#sp-stats b{color:var(--ink);font-family:Sora,system-ui,sans-serif;}
#sp-grid{position:absolute;top:52px;left:10px;right:10px;bottom:var(--gridb,92px);display:grid;gap:10px;min-height:0;justify-content:center;align-content:center;}
.sp-cell{position:relative;display:flex;flex-direction:column;background:var(--panel);border:1px solid var(--line);border-radius:14px;overflow:hidden;min-height:0;min-width:0;}
.sp-head{display:flex;align-items:center;gap:6px;padding:6px 8px 6px 10px;}
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
.sp-cell.live.vready .sp-zoomer{display:block;}
.sp-cell.zoomed .sp-zoomer{cursor:grab;} .sp-cell.zoomed .sp-zoomer.drag{cursor:grabbing;}
.sp-chat{z-index:3;}
#sp-root .sp-zm{width:auto;min-width:30px;padding:0 7px;font-size:12px;font-variant-numeric:tabular-nums;display:none;}
#sp-root .sp-cell.zoomed .sp-zm{display:grid;}
.sp-cell:not(.vready) iframe{opacity:0 !important;pointer-events:none !important;}
.sp-wait{position:absolute;inset:0;z-index:1;display:grid;place-items:center;align-content:center;gap:10px;color:var(--muted);font-size:13px;text-align:center;padding:12px;}
.sp-cell.vready .sp-wait{display:none;}
.sp-spin{width:22px;height:22px;border-radius:50%;border:2px solid var(--line2);border-top-color:var(--accent2);animation:sp-spin 1s linear infinite;}
.sp-cell.off .sp-spin{display:none;}
@keyframes sp-spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.sp-spin{animation:none;}}
.sp-cell.sp-flash{border-color:var(--accent);box-shadow:0 0 0 3px rgba(79,125,255,.45);transition:box-shadow .3s;}
.sp-cell.hidden iframe{opacity:0 !important;pointer-events:none;}
html.sp-allhide #sp-grid{opacity:0 !important;pointer-events:none !important;}
#sp-dock{position:absolute;left:12px;right:12px;bottom:14px;width:fit-content;margin:0 auto;display:flex;flex-wrap:wrap;align-items:stretch;background:var(--panel);border:1px solid var(--line2);border-radius:18px;box-shadow:0 10px 30px rgba(0,0,0,.45);padding:8px 4px;box-sizing:border-box;}
.sp-sec{display:flex;flex-direction:column;gap:5px;padding:0 12px;}
.sp-sec + .sp-sec{border-left:1px solid var(--line2);}
.sp-sec h2{margin:0;font:700 10px Sora,system-ui,sans-serif;letter-spacing:.16em;color:var(--accent2);}
.sp-row{display:flex;gap:6px;}
#sp-root #sp-dockmin{position:absolute;right:-10px;top:-10px;width:24px;height:24px;padding:0;border-radius:50%;display:grid;place-items:center;font-size:12px;}
html.sp-docksmall #sp-dock .sp-sec{display:none;}
html.sp-docksmall #sp-dock{padding:6px;}
#sp-root #sp-dockopen{display:none;}
html.sp-docksmall #sp-root #sp-dockopen{display:block;}
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
html.sp-anon .sp-chat .ln b{display:none;}
.sp-cell{container-type:inline-size;}
@container (max-width:230px){.sp-st,.sp-vc{display:none;}.sp-head{gap:3px;padding:5px 5px 5px 8px;}#sp-root .sp-ic{width:24px;height:24px;border-radius:6px;}}
#sp-grid.focus .sp-cell:not(.focused){display:none;}
#sp-root .sp-cell.focused .sp-max{background:var(--tint);border-color:var(--accent);color:#cfe0ff;}
.sp-empty{position:absolute;inset:0;display:grid;place-items:center;color:var(--muted);text-align:center;font-size:14px;}`;
  D.head.appendChild(css);

  const ICON = {
    mute: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="m22 9-6 6M16 9l6 6"/></svg>',
    sound: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
    eye: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z"/><circle cx="12" cy="12" r="2.5"/></svg>',
    max: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
    unmax: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>',
    eyeOff: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 3l18 18"/><path d="M10.6 6.1A10 10 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-3 3.6M6.3 7.6A17 17 0 0 0 2.5 12S6 18 12 18a9 9 0 0 0 4-.9"/></svg>',
    x: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>'
  };

  // ---------- structure ----------
  const root = D.createElement('div');
  root.id = 'sp-root';
  root.innerHTML = `
<div id="sp-top"><div id="sp-brand"><i></i>SystemProfiles</div><div id="sp-stats"></div></div>
<div id="sp-grid"></div>
<div id="sp-pop" role="dialog" aria-label="Broadcaster list">
  <h2>BROADCASTERS</h2>
  <label for="sp-in" style="position:absolute;left:-9999px">Broadcaster list</label>
  <textarea id="sp-in" spellcheck="false" placeholder="username1, username2, @username3"></textarea>
  <p>Separate names with commas, spaces or new lines. Ctrl+Enter builds the grid.</p>
  <div class="sp-row"><button class="primary" id="sp-go">Build grid</button><button id="sp-popclose">Close</button></div>
</div>
<div id="sp-dock">
  <div class="sp-sec"><h2>BROADCASTERS</h2><div class="sp-row"><button id="sp-edit" class="primary">Edit list</button><button id="sp-rebuild">Rebuild</button></div></div>
  <div class="sp-sec"><h2>VIEW</h2><div class="sp-row"><button id="sp-anon-btn"></button><button id="sp-allhide"></button><button id="sp-fs"></button></div></div>
  <div class="sp-sec"><h2>PICTURE</h2><div class="sp-row"><button id="sp-fx-sharp"></button><button id="sp-fx-sat"></button><button id="sp-fx-tone"></button></div></div>
  <div class="sp-sec"><h2>CHAT</h2><div class="sp-row"><button id="sp-chat-btn"></button></div></div>
  ${window.mgvApp && window.mgvApp.openAlerts ? '<div class="sp-sec"><h2>ALERTS</h2><div class="sp-row"><button id="sp-alerts">Alerts</button></div></div>' : ''}
  <button id="sp-dockmin" title="Shrink controls" aria-label="Shrink controls">–</button>
  <button id="sp-dockopen">Controls</button>
</div>`;
  D.body.appendChild(root);
  const $ = id => D.getElementById(id);
  const grid = $('sp-grid'), input = $('sp-in'), pop = $('sp-pop');
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

  // ---------- keep the session usable ----------
  // The live lookup needs a valid session. If it keeps answering "not authorized"
  // (an expired sign-in the site couldn't renew), ask the app to repair it:
  // stage 1 drops just the expired sign-in, stage 2 starts a fresh visitor session.
  let auth401 = 0, repairStage = 0, repairAt = 0;
  function sessionOk() { auth401 = 0; if (store.get('sp_repair_stage')) store.set('sp_repair_stage', ''); }
  function sessionTrouble(status, body) {
    auth401++;
    if (auth401 < 3 || !window.mgvApp || !window.mgvApp.resetSession || Date.now() - repairAt < 90000) return;
    let stage = 1; try { stage = Math.min(2, (+store.get('sp_repair_stage') || 0) + 1); } catch (e) {}
    repairAt = Date.now(); auth401 = 0;
    store.set('sp_repair_stage', String(stage));
    store.set('sp_note', 'Live detection was being refused by the site, so the app reset its connection and is checking again.');
    if (window.mgvApp.log) window.mgvApp.log({ why: 'session-repair', stage, status, body });
    // The site keeps its session in cookies and in page storage; clear both together
    // (your grid settings, the sp_ entries, are kept).
    try { Object.keys(localStorage).filter(k => !k.startsWith('sp_')).forEach(k => localStorage.removeItem(k)); sessionStorage.clear(); } catch (e) {}
    window.mgvApp.resetSession(stage);
  }

  // The site's own live lookup (runs as a visitor).
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
    el.innerHTML = `<div class="sp-head"><span class="sp-dot"></span><span class="sp-name"><span class="nm"></span><span class="an"></span> <span class="sp-st">· checking…</span></span><span class="sp-vc"></span>
      <button class="sp-ic sp-zm" title="Reset zoom" aria-label="Reset zoom">1.0×</button>
      <button class="sp-ic sp-max" title="Show this stream large" aria-label="Show this stream large">${ICON.max}</button>
      <button class="sp-ic sp-snd" title="Sound on/off" aria-label="Sound on/off">${ICON.mute}</button>
      <button class="sp-ic sp-hide" title="Hide this stream" aria-label="Hide this stream">${ICON.eyeOff}</button>
      <button class="sp-ic sp-x" title="Remove" aria-label="Remove">${ICON.x}</button></div>
      <div class="sp-body"><div class="sp-wait"><div class="sp-spin"></div><div class="sp-msg">Connecting…</div></div><iframe allow="autoplay; fullscreen"></iframe><div class="sp-zoomer" title="Scroll or pinch to zoom, drag to move, double-click to reset"></div></div>`;
    const f = el.querySelector('iframe'), nm = el.querySelector('.nm'), st = el.querySelector('.sp-st'), hide = el.querySelector('.sp-hide');
    nm.textContent = '@' + user;
    el.querySelector('.an').textContent = 'Cell ' + (idx + 1);
    openUser(f, user);
    wireZoom(f, el, user); applyZoom(f, el, user);
    el.querySelector('.sp-max').onclick = () => setFocus(el);
    hide.onclick = () => { const h = el.classList.toggle('hidden'); hide.innerHTML = h ? ICON.eye : ICON.eyeOff; hide.title = h ? 'Show this stream' : 'Hide this stream'; hide.classList.toggle('on', h); };
    el.querySelector('.sp-x').onclick = () => { const list = parse(input.value); list.splice(idx, 1); input.value = list.join(', '); build(list); };
    const url = () => { try { return f.contentWindow.location.href; } catch (e) { return ''; } };
    const disp = () => { try { const t = f.contentDocument.title; return (t.match(/^(.*?) (Live Stream - Watch|\(@)/) || [])[1] || (f.contentDocument.querySelector('h1')?.textContent || '').trim().slice(0, 40); } catch (e) { return ''; } };
    const msg = el.querySelector('.sp-msg');
    let checks = 0;
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
      st.textContent = live ? '· LIVE' : off ? '· not live' : '· checking…';
    };
    // Fast checks while the cell is getting ready, then every 4 seconds.
    window.__spTimers.push(setInterval(() => { const busy = !el.classList.contains('vready') && !el.classList.contains('off'); if (busy || checks % 5 === 0) check(); else checks++; }, 800));
    // Every minute: if this cell isn't on a stream, ask the lookup and open the stream
    // when it starts (a full reload every 5th minute as a fallback). If it is on a
    // stream that has ended, go back to the profile.
    let ticks = 0;
    setTimeout(() => diag(f, user, el, 'start+30s'), 30000);
    window.__spTimers.push(setInterval(async () => {
      ticks++;
      diag(f, user, el, 'minute');
      const onStream = url().includes('/stream/');
      const info = await lookup(user);
      if (!onStream) { if (!info || info.live || ticks % 5 === 0) openUser(f, user); }
      else if (info && !info.live) openUser(f, user);
    }, 60000));
    return el;
  }
  // Size every cell to the stream's own shape (9:16) so there is no empty space
  // around the video, and centre the grid. In focus mode one cell fills the area.
  function layout(n) {
    if (grid.classList.contains('focus')) n = 1;
    if (!n) return;
    const W = grid.clientWidth || innerWidth - 20, Hh = grid.clientHeight || innerHeight - 150;
    const head = (grid.querySelector('.sp-cell:not([style*="display: none"]) .sp-head') || {}).offsetHeight || 40;
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
    (window.__spTimers || []).forEach(clearInterval); window.__spTimers = [];
    store.set(KEY, JSON.stringify(list));
    grid.innerHTML = '';
    if (!list.length) { grid.innerHTML = '<div class="sp-empty">No broadcasters yet.<br>Click Edit list to add some.</div>'; grid.style.gridTemplateColumns = '1fr'; return; }
    grid.classList.remove('focus');
    layout(list.length);
    list.forEach((u, i) => grid.appendChild(cell(u, i)));
    requestAnimationFrame(() => layout(list.length));
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
    const list = parse(input.value);
    const at = list.findIndex(x => x.toLowerCase() === u.toLowerCase());
    if (grid.classList.contains('focus')) setFocus(null);
    if (at >= 0) { const el = grid.querySelectorAll('.sp-cell')[at]; if (el) flash(el); return true; }
    list.push(u);
    input.value = list.join(', ');
    store.set(KEY, JSON.stringify(list));
    grid.querySelector('.sp-empty')?.remove();
    const el = cell(u, list.length - 1);
    grid.appendChild(el);
    layout(list.length);
    requestAnimationFrame(() => layout(list.length));
    flash(el);
    return true;
  };
  window.addEventListener('resize', () => { const n = grid.querySelectorAll('.sp-cell').length; if (n) layout(n); });
  D.addEventListener('keydown', e => { if (e.key === 'Escape' && grid.classList.contains('focus') && !D.fullscreenElement) setFocus(null); });
  const dock = $('sp-dock');
  const fitDock = () => {
    const h = dock.offsetHeight + 14;
    const small = H.classList.contains('sp-docksmall');
    root.style.setProperty('--gridb', (small ? h + 10 : h + 12) + 'px');
    root.style.setProperty('--dockh', (h + 10) + 'px');
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
      const parts = (useSvg ? 'url(#sp-fx) ' : '') + (cur.sat !== 'Natural' ? 'saturate(' + OPT.sat.val[cur.sat] + ')' : '');
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
      if (!b.dataset.wired) { b.dataset.wired = '1'; b.onclick = () => { const m = tangoMute(c.querySelector('iframe')); if (m) { m.click(); setTimeout(syncSound, 400); } }; }
      const m = c.classList.contains('live') ? tangoMute(c.querySelector('iframe')) : null;
      const muted = !m || isMuted(m);
      b.disabled = !m;
      const want = muted ? 'm' : 's';
      if (b.dataset.st !== want) { b.dataset.st = want; b.innerHTML = muted ? ICON.mute : ICON.sound; }
      b.classList.toggle('on', !!m && !muted);
      b.title = !m ? 'Sound (available when live)' : muted ? 'Turn sound on' : 'Turn sound off';
    });
  }
  window.__spSndT = setInterval(syncSound, 1500);

  // ---------- viewers ----------
  const num = t => { t = (t || '').trim().replace(/,/g, ''); const m = t.match(/^([\d.]+)\s*([KkMm]?)/); if (!m) return null; let v = parseFloat(m[1]); if (/k/i.test(m[2])) v *= 1e3; if (/m/i.test(m[2])) v *= 1e6; return Math.round(v); };
  const fmt = n => n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e4 ? (n / 1e3).toFixed(1) + 'K' : n.toLocaleString();
  function stats() {
    let tot = 0, live = 0, all = 0;
    D.querySelectorAll('.sp-cell').forEach(c => {
      all++;
      let v = null;
      try { if (c.classList.contains('live')) { const e = c.querySelector('iframe').contentDocument.querySelector('[data-testid=viewers]'); v = e ? num(e.textContent) : null; } } catch (e) {}
      if (c.classList.contains('live')) live++;
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
