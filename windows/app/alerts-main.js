// MultiGridView Alerts: a tray app that checks your broadcasters and pops up
// an alert when one goes live. Started with: MultiGridView.exe --alerts
const { app, BrowserWindow, Tray, Menu, Notification, ipcMain, nativeImage, shell, screen, session, net } = require('electron');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const START_URL = 'https://www.tango.me/robots.txt';
const CHECKER = fs.readFileSync(path.join(__dirname, 'checker.js'), 'utf8');
const PREVIEW = fs.readFileSync(path.join(__dirname, 'preview.js'), 'utf8');
const LIVE_PREVIEWS = 2;      // at most this many pop-ups play a live preview at once
const AUMID = 'com.multigridview.alerts';
const PARALLEL = 3;

app.setName('MultiGridView Alerts');
app.setPath('userData', path.join(app.getPath('appData'), 'MultiGridView Alerts'));
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
// Keep the browser engine's internal log lines (website noise) out of the console.
app.commandLine.appendSwitch('log-level', '3');
app.userAgentFallback = app.userAgentFallback.replace(/\s(Electron|multigridview|MultiGridView[^/]*)\/\S+/gi, '');
if (process.platform === 'win32') app.setAppUserModelId(AUMID);

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  start();
}

function start() {
  // ---------- settings ----------
  const CFG = path.join(app.getPath('userData'), 'alerts.json');
  const DEF = { users: [], minutes: 2, hideNames: true, toast: true, sound: true, paused: false, livePreview: true };
  let cfg = { ...DEF };
  try { cfg = { ...DEF, ...JSON.parse(fs.readFileSync(CFG, 'utf8')) }; } catch (e) {}
  const save = () => { try { fs.mkdirSync(path.dirname(CFG), { recursive: true }); fs.writeFileSync(CFG, JSON.stringify(cfg, null, 2)); } catch (e) {} };

  const status = {};            // user -> { live: true|false|null, checked: ms }
  const CHECKLOG = path.join(app.getPath('userData'), 'checks.log');
  function checkLog(o) {
    try {
      try { if (fs.statSync(CHECKLOG).size > 400000) fs.writeFileSync(CHECKLOG, ''); } catch (e) {}
      fs.appendFileSync(CHECKLOG, JSON.stringify({ t: new Date().toISOString(), ...o }) + '\n');
    } catch (e) {}
  }
  let checkerWin = null, ready = false, settingsWin = null, tray = null;
  let running = false, timer = null, nextAt = 0;
  const popups = [];

  const label = u => cfg.hideNames ? 'Broadcaster ' + (cfg.users.indexOf(u) + 1) : '@' + u;
  const liveCount = () => cfg.users.filter(u => status[u] && status[u].live).length;

  // ---------- guest session shared by the grid ----------
  // No account sign-in. The grid app runs the site as a guest, and the site keeps
  // that guest session renewed while the grid is open. The grid copies the guest
  // cookies here (tango-session.json) and the checks use the newest copy.
  const SHARE = path.join(app.getPath('userData'), 'tango-session.json');
  let shareStamp = -1;
  async function importSession(force) {
    let data = null, stamp = 0;
    try { stamp = fs.statSync(SHARE).mtimeMs; } catch (e) { stamp = 0; }
    if (!stamp || (stamp === shareStamp && !force)) return false;
    shareStamp = stamp;
    try { data = JSON.parse(fs.readFileSync(SHARE, 'utf8')); } catch (e) { return false; }
    const jar = session.defaultSession.cookies;
    for (const c of (data && data.cookies) || []) {
      try {
        const host = c.domain.replace(/^\./, '');
        const o = { url: 'https://' + host + (c.path || '/'), name: c.name, value: c.value, path: c.path, secure: c.secure, httpOnly: c.httpOnly, sameSite: c.sameSite };
        if (!c.hostOnly) o.domain = c.domain;
        if (c.expirationDate) o.expirationDate = c.expirationDate;
        await jar.set(o);
      } catch (e) {}
    }
    checkLog({ why: 'guest-session-imported', from: new Date(data.at || stamp).toISOString() });
    return true;
  }

  // ---------- hidden checker page ----------
  function makeChecker() {
    ready = false;
    // Offscreen rendering: the page runs as if visible (Tango's app needs that to
    // move a live profile to its stream) without ever showing a window.
    checkerWin = new BrowserWindow({ show: false, width: 500, height: 820, webPreferences: { offscreen: true, contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false } });
    const wc = checkerWin.webContents;
    wc.setFrameRate(5);
    wc.setAudioMuted(true);
    wc.setWindowOpenHandler(() => ({ action: 'deny' }));
    wc.on('did-finish-load', () => {
      if (!wc.getURL().startsWith(START_URL)) return;
      wc.executeJavaScript(CHECKER).then(() => { ready = true; schedule(1000); }).catch(() => {});
    });
    wc.on('did-fail-load', (e, code, desc, url, isMain) => { if (isMain && code !== -3) { ready = false; setTimeout(() => { if (checkerWin && !checkerWin.isDestroyed()) wc.loadURL(START_URL); }, 30000); } });
    wc.on('render-process-gone', () => { ready = false; setTimeout(() => { checkerWin.destroy(); makeChecker(); }, 5000); });
    wc.loadURL(START_URL);
  }

  // ---------- refused checks ----------
  // If the site refuses the checks, take the grid's newest guest session again.
  let auth401 = 0;
  async function authTrouble() {
    if (++auth401 < 2) return;
    auth401 = 0;
    await importSession(true);
  }

  async function checkOne(u) {
    if (!ready || !checkerWin || checkerWin.isDestroyed()) return;
    let live = null, det = null;
    try { det = await checkerWin.webContents.executeJavaScript(`window.__mgvCheckDetail(${JSON.stringify(u)})`); live = det ? det.live : null; } catch (e) { det = { err: 'inject: ' + (e && e.message) }; }
    checkLog({ user: u, ...(det || {}), live });
    if (det && (det.status === 401 || det.status === 403)) await authTrouble(); else if (det && (det.status === 200 || det.status === 404)) auth401 = 0;
    if (live === null || !cfg.users.includes(u)) return;
    const prev = status[u] ? status[u].live : null;
    status[u] = { live, checked: Date.now() };
    if (live && prev !== true) alertLive(u);
    if (!live) delete thumbs[u];
    push();
  }

  // ---------- preview pictures ----------
  // The picture Tango shows for a live stream, fetched once when someone goes
  // live and kept only in memory (as a small image) while they stay live.
  const thumbs = {};            // user -> data: URL
  async function getThumb(u) {
    if (!ready || !checkerWin || checkerWin.isDestroyed()) return null;
    try {
      const url = await checkerWin.webContents.executeJavaScript(`window.__mgvThumb(${JSON.stringify(u)})`);
      if (!url || !/^https:\/\/cget\.tango\.me\//.test(url)) return null;
      const r = await net.fetch(url);
      if (!r.ok) return null;
      let img = nativeImage.createFromBuffer(Buffer.from(await r.arrayBuffer()));
      if (img.isEmpty()) return null;
      const sz = img.getSize();
      if (sz.width > 160 || sz.height > 160) img = img.resize(sz.width >= sz.height ? { width: 160 } : { height: 160 });
      return img;
    } catch (e) { return null; }
  }

  async function cycle() {
    clearTimeout(timer); timer = null;
    if (running || !ready) return;
    if (cfg.paused) { schedule(); return; }
    running = true; push();
    await importSession();
    const queue = cfg.users.slice();
    const worker = async () => { while (queue.length) await checkOne(queue.shift()); };
    await Promise.all(Array.from({ length: Math.min(PARALLEL, queue.length) }, worker));
    running = false;
    schedule();
  }
  function schedule(ms) {
    clearTimeout(timer);
    const wait = ms != null ? ms : Math.max(1, cfg.minutes) * 60000;
    nextAt = Date.now() + wait;
    timer = setTimeout(cycle, wait);
    push();
  }

  // ---------- alerts ----------
  async function alertLive(u) {
    const name = label(u);
    const p = showPopup(name, u);
    // The pop-up shows at once; its picture (and the Windows notification) follow
    // when the preview has loaded, or after about 20 seconds without one.
    const img = await Promise.race([getThumb(u), new Promise(r => setTimeout(() => r(null), 20000))]);
    if (img) {
      thumbs[u] = img.toDataURL();
      if (p && !p.isDestroyed()) p.webContents.send('mgv:thumb', thumbs[u]);
      push();
    }
    if (cfg.toast && Notification.isSupported()) {
      const n = new Notification({ title: 'Live now', body: name + ' just went live. Click to open in MultiGridView.', silent: !cfg.sound, ...(img ? { icon: img } : {}) });
      n.on('click', () => openGrid(u));
      n.show();
    } else if (cfg.sound) shell.beep();
  }
  function layoutPopups() {
    const wa = screen.getPrimaryDisplay().workArea;
    let y = wa.y + wa.height - 6;
    popups.forEach(p => { if (p.isDestroyed()) return; const h = p.getBounds().height; y -= h; p.setPosition(wa.x + wa.width - 376, y); y -= 10; });
  }
  // Only the newest pop-ups play their live preview; older ones keep the still picture.
  function limitPreviews() {
    popups.filter(p => !p.isDestroyed() && p.__live).slice(LIVE_PREVIEWS).forEach(p => {
      p.__live = false;
      p.webContents.executeJavaScript('window.__mgvPreviewStop && window.__mgvPreviewStop()').catch(() => {});
    });
  }
  function plainPopup(p, name) {
    p.setSize(360, 96);
    p.loadFile(path.join(__dirname, 'alerts-popup.html'), { query: { name } });
  }
  function showPopup(name, user) {
    const live = !!cfg.livePreview && typeof user === 'string';
    const p = new BrowserWindow({
      width: 360, height: live ? 232 : 96, frame: false, resizable: false, movable: false, minimizable: false, maximizable: false,
      alwaysOnTop: true, skipTaskbar: true, show: false, backgroundColor: '#131a26',
      webPreferences: { preload: path.join(__dirname, live ? 'preview-preload.js' : 'alerts-preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false }
    });
    p.setAlwaysOnTop(true, 'screen-saver');
    p.__user = user;
    p.__live = live;
    if (live) {
      // A small muted live preview: the stream site's page with only the video shown.
      const wc = p.webContents;
      wc.setAudioMuted(true);
      wc.setWindowOpenHandler(() => ({ action: 'deny' }));
      wc.on('will-navigate', e => e.preventDefault());
      let injected = false;
      wc.on('did-finish-load', () => {
        if (injected || !wc.getURL().startsWith(START_URL)) return;
        injected = true;
        wc.executeJavaScript(`window.__mgvPreview=${JSON.stringify({ user, name })};` + PREVIEW).catch(() => {});
        if (!p.isVisible()) p.showInactive();
      });
      wc.on('did-fail-load', (e, code, desc, url, isMain) => { if (isMain && code !== -3 && !p.isDestroyed()) { p.__live = false; plainPopup(p, name); layoutPopups(); } });
      p.loadURL(START_URL);
    } else {
      p.loadFile(path.join(__dirname, 'alerts-popup.html'), { query: { name } });
    }
    p.once('ready-to-show', () => p.showInactive());
    popups.unshift(p);
    limitPreviews();
    while (popups.length > 4) { const old = popups.pop(); if (!old.isDestroyed()) old.close(); }
    p.on('closed', () => { const i = popups.indexOf(p); if (i >= 0) popups.splice(i, 1); layoutPopups(); });
    layoutPopups();
    return p;
  }
  // Opens the grid. With a broadcaster, the grid adds them to the streams it is
  // already showing (or starts with your list plus them). A running grid gets
  // the request through Windows' single-instance hand-off.
  function openGrid(user) {
    const args = app.isPackaged ? [] : [app.getAppPath()];
    if (typeof user === 'string' && /^[\w.\-]{1,64}$/.test(user)) args.push('mgv-open=' + user);
    try { spawn(process.execPath, args, { detached: true, stdio: 'ignore' }).unref(); } catch (e) {}
  }

  // ---------- settings window ----------
  function openSettings() {
    if (settingsWin && !settingsWin.isDestroyed()) { settingsWin.show(); settingsWin.focus(); return; }
    settingsWin = new BrowserWindow({
      width: 560, height: 720, minWidth: 420, minHeight: 520, title: 'MultiGridView Alerts', backgroundColor: '#0c1018', autoHideMenuBar: true, show: false,
      icon: nativeImage.createFromPath(path.join(__dirname, 'icon.png')),
      webPreferences: { preload: path.join(__dirname, 'alerts-preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true }
    });
    settingsWin.setMenu(null);
    settingsWin.loadFile(path.join(__dirname, 'alerts-settings.html'));
    settingsWin.once('ready-to-show', () => settingsWin.show());
  }
  function state() {
    return {
      cfg, running, nextAt, ready,
      startWithWindows: process.platform === 'win32' ? app.getLoginItemSettings({ path: process.execPath, args: ['--alerts'] }).openAtLogin : false,
      rows: cfg.users.map((u, i) => ({ user: u, label: label(u), live: status[u] ? status[u].live : null, checked: status[u] ? status[u].checked : 0, thumb: status[u] && status[u].live ? thumbs[u] || null : null }))
    };
  }
  function push() {
    if (settingsWin && !settingsWin.isDestroyed()) settingsWin.webContents.send('mgv:state', state());
    if (tray) {
      const n = liveCount();
      tray.setToolTip(cfg.paused ? 'MultiGridView Alerts (paused)' : `MultiGridView Alerts: ${n} of ${cfg.users.length} live`);
      buildMenu();
    }
  }

  ipcMain.handle('mgv:get', () => state());
  ipcMain.handle('mgv:save', (e, next) => {
    const users = Array.isArray(next.users) ? [...new Set(next.users.map(s => String(s).trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?tango\.me\//, '').replace(/\/.*$/, '')).filter(s => /^[\w.\-]{1,64}$/.test(s)))] : cfg.users;
    cfg = { ...cfg, users, minutes: [1, 2, 5, 10, 15].includes(+next.minutes) ? +next.minutes : cfg.minutes, hideNames: !!next.hideNames, toast: !!next.toast, sound: !!next.sound, livePreview: next.livePreview === undefined ? cfg.livePreview : !!next.livePreview };
    for (const u of Object.keys(status)) if (!users.includes(u)) delete status[u];
    save();
    if (process.platform === 'win32' && typeof next.startWithWindows === 'boolean') app.setLoginItemSettings({ openAtLogin: next.startWithWindows, path: process.execPath, args: ['--alerts'] });
    schedule(500);
    return state();
  });
  ipcMain.handle('mgv:check', () => { if (!running) schedule(100); return state(); });
  ipcMain.handle('mgv:pause', (e, p) => { cfg.paused = !!p; save(); push(); return state(); });
  ipcMain.on('mgv:open-grid', (e, user) => openGrid(user));
  ipcMain.on('mgv:popup-close', e => { const w = BrowserWindow.fromWebContents(e.sender); if (w) w.close(); });
  ipcMain.on('mgv:popup-open', e => { const w = BrowserWindow.fromWebContents(e.sender); openGrid(w && w.__user); if (w) w.close(); });

  // ---------- tray ----------
  function buildMenu() {
    if (!tray) return;
    tray.setContextMenu(Menu.buildFromTemplate([
      { label: `${liveCount()} of ${cfg.users.length} live`, enabled: false },
      { type: 'separator' },
      { label: 'Open MultiGridView', click: () => openGrid() },
      { label: 'Alerts settings…', click: openSettings },
      { label: 'Check now', enabled: !running && !cfg.paused, click: () => schedule(100) },
      { label: 'Pause alerts', type: 'checkbox', checked: cfg.paused, click: m => { cfg.paused = m.checked; save(); push(); } },
      { type: 'separator' },
      { label: 'Quit alerts', click: () => { app.exit(0); } }
    ]));
  }

  app.on('second-instance', () => openSettings());
  app.on('window-all-closed', () => { /* keep running in the tray */ });

  app.whenReady().then(() => {
    if (process.platform === 'win32') {
      // A Start menu shortcut carrying our app ID lets Windows show our notifications.
      try {
        const lnk = path.join(app.getPath('appData'), 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'MultiGridView Alerts.lnk');
        shell.writeShortcutLink(lnk, 'create', { target: process.execPath, args: '--alerts', cwd: path.dirname(process.execPath), appUserModelId: AUMID, description: 'Go-live alerts for MultiGridView', icon: process.execPath, iconIndex: 0 });
      } catch (e) {}
    }
    checkLog({ start: 'alerts', app: app.getVersion(), chrome: process.versions.chrome, electron: process.versions.electron, ua: app.userAgentFallback });
    tray = new Tray(nativeImage.createFromPath(path.join(__dirname, 'icon.png')));
    tray.on('click', openSettings);
    tray.on('double-click', openSettings);
    push();
    importSession(true).finally(makeChecker);
    if (!cfg.users.length) openSettings();
  });
}
