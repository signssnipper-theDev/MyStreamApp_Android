// MultiGridView: opens the SystemProfiles Tango Live grid in its own window.
// The grid script (grid.js) is injected into a tango.me page so it can reach
// inside each Tango frame (same origin), exactly like the Claude skill does.
const { app, BrowserWindow, Menu, shell, ipcMain, session, dialog } = require('electron');
const fs = require('fs');
const path = require('path');

const START_URL = 'https://www.tango.me/robots.txt';
const GRID = fs.readFileSync(path.join(__dirname, 'grid.js'), 'utf8');
const isTango = u => { try { return /(^|\.)tango\.me$/.test(new URL(u).hostname); } catch (e) { return false; } };

app.setName('MultiGridView');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
// Keep the browser engine's internal log lines (website noise) out of the console.
app.commandLine.appendSwitch('log-level', '3');
// Present as plain Chrome so Tango serves its normal web player.
app.userAgentFallback = app.userAgentFallback.replace(/\s(Electron|multigridview|MultiGridView)\/\S+/gi, '');

if (!app.requestSingleInstanceLock()) { app.quit(); }

let win;
// A broadcaster handed over by an alert ("Open in MultiGridView"). Added to the
// grid as soon as the grid script is running; queued until then.
let gridReady = false;
const pendingOpen = [];
const openArg = argv => { const a = (argv || []).find(x => typeof x === 'string' && x.startsWith('mgv-open=')); const u = a && a.slice(9); return u && /^[\w.\-]{1,64}$/.test(u) ? u : null; };
function deliverOpen() {
  if (!gridReady || !win || win.isDestroyed()) return;
  while (pendingOpen.length) {
    const u = pendingOpen.shift();
    win.webContents.executeJavaScript(`window.__spAddUser && window.__spAddUser(${JSON.stringify(u)})`).catch(() => {});
  }
}
function requestOpen(u) {
  if (!u) return;
  pendingOpen.push(u);
  if (win && !win.isDestroyed()) { if (win.isMinimized()) win.restore(); win.show(); win.focus(); }
  deliverOpen();
}
function createWindow() {
  Menu.setApplicationMenu(null);
  win = new BrowserWindow({
    width: 1500, height: 920, minWidth: 640, minHeight: 420,
    title: 'SystemProfiles', backgroundColor: '#000000', show: false,
    autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'grid-preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false }
  });
  win.once('ready-to-show', () => win.show());
  win.on('page-title-updated', e => { e.preventDefault(); win.setTitle('SystemProfiles'); });

  const wc = win.webContents;
  // Inject the grid whenever the main page finishes loading (also after F5).
  // A new grid page (reload, reconnect) needs the script again before cells can be added.
  wc.on('did-start-navigation', (e, url, inPlace, isMain) => {
    const main = e && e.isMainFrame !== undefined ? e.isMainFrame : isMain;
    const same = e && e.isSameDocument !== undefined ? e.isSameDocument : inPlace;
    if (main && !same) gridReady = false;
  });
  wc.on('did-finish-load', () => {
    if (wc.getURL().startsWith(START_URL)) wc.executeJavaScript(GRID).then(() => { gridReady = true; deliverOpen(); }).catch(err => console.error('grid inject failed', err));
  });
  // Keep the main window on the grid page; open other sites in the normal browser.
  wc.on('will-navigate', (e, url) => {
    if (url.startsWith(START_URL)) return;
    e.preventDefault();
    if (!isTango(url) && /^https?:/.test(url)) shell.openExternal(url);
  });
  wc.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url) && !isTango(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  // Keyboard: F5 / Ctrl+R reload the grid, F11 full screen, Ctrl+Shift+I dev tools.
  wc.on('before-input-event', (e, input) => {
    if (input.type !== 'keyDown') return;
    const k = input.key;
    if (k === 'F5' || (input.control && k.toLowerCase() === 'r')) { e.preventDefault(); wc.reload(); }
    else if (k === 'F11') { e.preventDefault(); win.setFullScreen(!win.isFullScreen()); }
    else if (k === 'Escape' && win.isFullScreen()) { win.setFullScreen(false); }
    else if (input.control && input.shift && k.toLowerCase() === 'i') { e.preventDefault(); wc.toggleDevTools(); }
  });
  wc.on('render-process-gone', () => { setTimeout(() => { if (!win.isDestroyed()) wc.loadURL(START_URL); }, 1500); });
  wc.on('did-fail-load', (e, code, desc, url, isMain) => {
    if (!isMain || code === -3) return;
    const html = `<body style="background:#000;color:#ddd;font:15px system-ui;display:grid;place-items:center;height:100vh;margin:0">
      <div style="text-align:center"><p>Couldn't reach tango.me (${desc}).</p><p>Check your internet connection. Retrying in 10 seconds…</p></div></body>`;
    wc.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
    setTimeout(() => { if (!win.isDestroyed()) wc.loadURL(START_URL); }, 10000);
  });

  wc.loadURL(START_URL);
}


// ---------- diagnostics ----------
// A small log of what each cell sees, so problems can be traced. Kept next to the
// alerts settings; trimmed when it grows past ~400 KB.
const DIAG = path.join(app.getPath('appData'), 'MultiGridView Alerts', 'grid-diagnostics.log');
function diagLog(o) {
  try {
    fs.mkdirSync(path.dirname(DIAG), { recursive: true });
    try { if (fs.statSync(DIAG).size > 400000) fs.writeFileSync(DIAG, ''); } catch (e) {}
    fs.appendFileSync(DIAG, JSON.stringify({ t: new Date().toISOString(), ...o }) + '\n');
  } catch (e) {}
}
ipcMain.on('mgv:log', (e, o) => diagLog(o && typeof o === 'object' ? o : { msg: String(o) }));

// ---------- session repair ----------
// Stage 1: remove the sign-in cookies (an expired sign-in the site could not renew).
// Stage 2: remove every cookie of the site, so it starts a fresh visitor session.
// Settings and lists live in the page's own storage and are not touched.
const SIGNIN_COOKIES = ['tt', 'ttu', 'tte', 'Tango-SD'];
async function resetTangoCookies(ses, stage) {
  const jar = ses.cookies; let n = 0;
  for (const c of await jar.get({})) {
    const host = (c.domain || '').replace(/^\./, '');
    if (!/(^|\.)tango\.me$/.test(host)) continue;
    if (stage < 2 && !SIGNIN_COOKIES.includes(c.name)) continue;
    try { await jar.remove('https://' + host + (c.path || '/'), c.name); n++; } catch (e) {}
  }
  try { await jar.flushStore(); } catch (e) {}
  return n;
}
let lastReset = 0;
ipcMain.on('mgv:reset-session', async (e, stage) => {
  if (Date.now() - lastReset < 60000) return; lastReset = Date.now();
  const n = await resetTangoCookies(session.defaultSession, stage === 2 ? 2 : 1);
  diagLog({ why: 'session-reset', stage, removed: n });
  if (win && !win.isDestroyed()) win.webContents.reload();
});

// The app no longer signs in to the site. Any sign-in left from an earlier
// version (and the copy that used to be shared with the alerts app) is removed
// at start, so live checks always run as a visitor.
async function dropOldSignIn() {
  try { await resetTangoCookies(session.defaultSession, 1); } catch (e) {}
  try { fs.unlinkSync(path.join(app.getPath('appData'), 'MultiGridView Alerts', 'tango-session.json')); } catch (e) {}
}

app.on('second-instance', (e, argv) => {
  const u = openArg(argv);
  if (u) return requestOpen(u);
  if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
});
app.whenReady().then(async () => { diagLog({ start: 'grid', app: app.getVersion(), chrome: process.versions.chrome, electron: process.versions.electron, ua: app.userAgentFallback }); await dropOldSignIn(); createWindow(); requestOpen(openArg(process.argv)); });
app.on('window-all-closed', () => app.quit());
