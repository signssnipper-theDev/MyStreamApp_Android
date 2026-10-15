// Live check, same logic as the grid: open Tango's home page in a frame,
// wait until Tango's app has rendered, navigate in-app to /<username>, and see
// whether Tango moves it to its live stream.
// Resolves true (live), false (not live) or null (couldn't tell).
window.__mgvCheckFrame = (user) => new Promise(resolve => {
  const f = document.createElement('iframe');
  f.style.cssText = 'position:fixed;left:0;top:0;width:420px;height:760px;border:0;opacity:0;pointer-events:none';
  f.setAttribute('allow', 'autoplay');
  let done = false, loadedAt = 0, navAt = 0, navTries = 0;
  const timers = [];
  const finish = v => {
    if (done) return; done = true;
    timers.forEach(clearInterval);
    try { f.src = 'about:blank'; } catch (e) {}
    setTimeout(() => f.remove(), 300);
    resolve(v);
  };
  const win = () => { try { return f.contentWindow; } catch (e) { return null; } };
  const doc = () => { try { return f.contentDocument; } catch (e) { return null; } };
  const isLive = () => {
    const w = win(), d = doc(); if (!w || !d) return false;
    const p = w.location.pathname || '';
    return p.startsWith('/stream/') || / Live Stream - Watch/.test(d.title || '');
  };
  const nav = () => {
    const w = win(); if (!w) return;
    try { w.history.pushState({}, '', '/' + user); w.dispatchEvent(new PopStateEvent('popstate', { state: {} })); } catch (e) {}
    navAt = Date.now(); navTries++;
  };
  f.onload = () => { if (!loadedAt) loadedAt = Date.now(); };
  timers.push(setInterval(() => {
    if (isLive()) return finish(true);
    if (!loadedAt) return;
    const d = doc();
    if (!navAt) {
      // Wait for Tango's app to render (or 8 s), then navigate like Tango's own search does.
      const rendered = d && d.querySelector('[data-testid]');
      if ((rendered && Date.now() - loadedAt > 1500) || Date.now() - loadedAt > 8000) nav();
      return;
    }
    const p = (win() && win().location.pathname) || '';
    if (p === '/' && navTries < 2 && Date.now() - navAt > 4000) return nav();   // bounced home: try once more
    if (Date.now() - navAt > 15000) finish(false);
  }, 500));
  timers.push(setTimeout(() => finish(navAt ? false : null), 40000));
  f.src = location.origin + '/';
  document.body.appendChild(f);
});

// Primary check: Tango's own public stream lookup by username (the same request
// Tango's profile page makes). 200 = live, 404 = not live. Only the status code
// is used. Anything else falls back to the page-based check above.
window.__mgvCheckDetail = async (user) => {
  const base = /(^|\.)tango\.me$/.test(location.hostname) ? 'https://gateway.tango.me' : location.origin + '/gw';
  let status = null, err = null;
  try {
    const r = await fetch(base + '/stream-details-provider/public/byAlias?alias=' + encodeURIComponent(user), { credentials: 'include', cache: 'no-store' });
    status = r.status;
    if (r.status === 404) return { live: false, status, via: 'lookup' };
    if (r.status === 200) { const b = await r.arrayBuffer(); if (b.byteLength > 0) return { live: true, status, via: 'lookup' }; }
  } catch (e) { err = e && e.message; }
  const live = await window.__mgvCheckFrame(user);
  return { live, status, err, via: 'page' };
};
window.__mgvCheck = async (user) => (await window.__mgvCheckDetail(user)).live;
true;
