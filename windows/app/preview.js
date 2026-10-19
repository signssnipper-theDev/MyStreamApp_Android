// Go-live pop-up with a small live preview (MultiGridView Alerts).
// Injected into a page of the stream site (same origin as the frame it shows), with
// window.__mgvPreview = { user, name } set first. The preview is muted, shows only
// the video, and plays only while the pop-up is on screen; until the video is ready
// (or if it never is) the stream's still picture is shown instead.
(() => {
  const P = window.__mgvPreview || {};
  const user = String(P.user || ''), name = String(P.name || 'A broadcaster');
  const D = document;
  D.title = 'Live now';
  const css = D.createElement('style');
  css.textContent = `
html,body{margin:0;height:100%;background:#131a26 !important;overflow:hidden !important;}
body > *:not(#pv){display:none !important;}
#pv{position:fixed;inset:0;z-index:2147483647;display:flex;gap:12px;padding:10px 12px 10px 10px;box-sizing:border-box;border:1px solid #2a3549;background:#131a26;color:#e3e8f2;font:13px/1.35 'Segoe UI',system-ui,sans-serif;user-select:none;}
#pv .vid{position:relative;flex:none;width:118px;height:210px;border-radius:10px;overflow:hidden;background:#000;border:1px solid #2a3549;}
#pv iframe{position:absolute;inset:0;width:100%;height:100%;border:0;background:#000;pointer-events:none;}
#pv .cover{position:absolute;inset:0;background:#000 center/cover no-repeat;display:grid;place-items:center;}
#pv.ready .cover{display:none;}
#pv .spin{width:20px;height:20px;border-radius:50%;border:2px solid rgba(255,255,255,.25);border-top-color:#7aa2ff;animation:pvs 1s linear infinite;}
#pv.still .spin{display:none;}
@keyframes pvs{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){#pv .spin{animation:none;}}
#pv .badge{position:absolute;left:6px;top:6px;z-index:2;background:#ff4d6a;color:#fff;font:700 9px 'Segoe UI',sans-serif;letter-spacing:.12em;padding:2px 6px;border-radius:5px;}
#pv .txt{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center;gap:4px;}
#pv .k{font:700 10px 'Segoe UI',sans-serif;letter-spacing:.16em;color:#7aa2ff;}
#pv .n{font-weight:600;font-size:15px;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;}
#pv .note{color:#8d98ad;font-size:11px;}
#pv .row{display:flex;flex-direction:column;gap:6px;margin-top:8px;}
#pv button{font:600 12px 'Segoe UI',system-ui,sans-serif;color:#e3e8f2;background:#172031;border:1px solid #2a3549;border-radius:8px;padding:7px 10px;cursor:pointer;}
#pv button:hover{border-color:#7aa2ff;}
#pv button:focus-visible{outline:2px solid #7aa2ff;outline-offset:2px;}
#pv button.primary{background:#4f7dff;border-color:#4f7dff;color:#fff;}
#pv .x{position:absolute;top:4px;right:6px;background:none;border:0;color:#8d98ad;font-size:16px;padding:2px 6px;}`;
  D.head.appendChild(css);

  const root = D.createElement('div');
  root.id = 'pv';
  root.innerHTML = `<div class="vid"><iframe allow="autoplay"></iframe><div class="cover"><div class="spin"></div></div><span class="badge">LIVE</span></div>
    <div class="txt"><div class="k">LIVE NOW</div><div class="n"></div><div class="note">Preview is muted</div>
    <div class="row"><button class="primary" id="pv-open">Open in MultiGridView</button><button id="pv-later">Dismiss</button></div></div>
    <button class="x" id="pv-x" aria-label="Close">×</button>`;
  D.body.appendChild(root);
  root.querySelector('.n').textContent = name + ' just went live';
  const f = root.querySelector('iframe'), cover = root.querySelector('.cover');
  const api = window.mgvPop || {};
  D.getElementById('pv-open').onclick = () => api.open && api.open();
  D.getElementById('pv-later').onclick = () => api.close && api.close();
  D.getElementById('pv-x').onclick = () => api.close && api.close();
  if (api.onThumb) api.onThumb(url => { if (/^data:image\//.test(url || '')) cover.style.backgroundImage = `url("${url}")`; });

  // Close after a while, but not while the pointer is over it.
  let hover = false, left = 25;
  root.onmouseenter = () => hover = true;
  root.onmouseleave = () => hover = false;
  const tick = setInterval(() => { if (!hover && --left <= 0) { clearInterval(tick); api.close && api.close(); } }, 1000);

  // ---------- the preview ----------
  const timers = [];
  const stop = () => { timers.forEach(clearInterval); timers.length = 0; try { f.src = 'about:blank'; } catch (e) {} root.classList.remove('ready'); root.classList.add('still'); };
  window.__mgvPreviewStop = stop;
  const findVid = d => {
    const dims = c => c.tagName === 'VIDEO' ? [c.videoWidth, c.videoHeight] : [c.width, c.height];
    const ok = c => { const [w, h] = dims(c); return w >= 240 && h >= 240; };
    const score = c => { const [w, h] = dims(c); return w * h; };
    let best = d.querySelector('canvas.kjPxA') || d.querySelector('canvas.KPCas');
    if (best && !ok(best)) best = null;
    if (!best) best = [...d.querySelectorAll('canvas')].filter(ok).sort((a, b) => score(b) - score(a))[0] || null;
    if (!best) best = [...d.querySelectorAll('video')].filter(ok).sort((a, b) => score(b) - score(a))[0] || null;
    d.querySelectorAll('[data-pv-v]').forEach(e => { if (e !== best) e.removeAttribute('data-pv-v'); });
    if (best) best.setAttribute('data-pv-v', '1');
    return best;
  };
  const videoOnly = () => {
    try {
      const d = f.contentDocument; if (!d || !d.head) return false;
      const c = findVid(d); if (!c) return false;
      let s = d.getElementById('pv-vo');
      if (!s) { s = d.createElement('style'); s.id = 'pv-vo'; d.head.appendChild(s); }
      const want = `body *{visibility:hidden !important;} html,body{background:#000 !important;}
        [data-pv-v]{visibility:visible !important;position:fixed !important;inset:0 !important;margin:0 !important;transform:none !important;width:100% !important;height:100% !important;max-width:none !important;max-height:none !important;object-fit:cover !important;filter:none !important;}`;
      if (s.textContent !== want) s.textContent = want;
      return true;
    } catch (e) { return false; }
  };
  async function streamPath() {
    try {
      const r = await fetch('https://gateway.tango.me/stream-details-provider/public/byAlias?alias=' + encodeURIComponent(user), { credentials: 'include', cache: 'no-store' });
      if (r.status !== 200) return '/' + user;
      const b = new Uint8Array(await r.arrayBuffer()); let s = '';
      for (const x of b) s += String.fromCharCode(x);
      const m = s.match(/\n\x16([A-Za-z0-9_-]{22})/);
      return m ? '/stream/' + m[1] : '/' + user;
    } catch (e) { return '/' + user; }
  }
  if (!/^[\w.\-]{1,64}$/.test(user)) { stop(); return; }
  let loadedAt = 0, navAt = 0, readyAt = 0;
  f.onload = () => { if (!loadedAt) loadedAt = Date.now(); };
  timers.push(setInterval(async () => {
    if (!loadedAt) return;
    let d = null; try { d = f.contentDocument; } catch (e) {}
    if (!navAt) {
      const rendered = d && d.querySelector('[data-testid]');
      if ((rendered && Date.now() - loadedAt > 1500) || Date.now() - loadedAt > 8000) {
        navAt = Date.now();
        const p = await streamPath();
        try { const w = f.contentWindow; w.history.pushState({}, '', p); w.dispatchEvent(new PopStateEvent('popstate', { state: {} })); } catch (e) {}
      }
      return;
    }
    const live = (() => { try { return f.contentWindow.location.pathname.startsWith('/stream/'); } catch (e) { return false; } })();
    if (live && videoOnly()) { if (!readyAt) readyAt = Date.now(); else if (Date.now() - readyAt > 300) root.classList.add('ready'); }
    // No video after 20 seconds: keep the still picture and stop loading.
    if (!root.classList.contains('ready') && Date.now() - navAt > 20000) stop();
  }, 500));
  f.src = 'https://www.tango.me/';
})();
true;
