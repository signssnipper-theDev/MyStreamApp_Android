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
  wc.on('did-finish-load', () => {
    if (wc.getURL().startsWith(START_URL)) wc.executeJavaScript(GRID).catch(err => console.error('grid inject failed', err));
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

// ---------- share your Tango sign-in with the alerts app ----------
// Copies the tango.me sign-in cookies to the alerts app's folder so its checks
// see what your account sees. Signing out here clears them there too.
const SHARE = path.join(app.getPath('appData'), 'MultiGridView Alerts', 'tango-session.json');
async function exportSession() {
  try {
    const all = await session.defaultSession.cookies.get({});
    const mine = all.filter(c => /(^|\.)tango\.me$/.test((c.domain || '').replace(/^\./, '')));
    fs.mkdirSync(path.dirname(SHARE), { recursive: true });
    fs.writeFileSync(SHARE, JSON.stringify({ at: Date.now(), cookies: mine }));
  } catch (e) {}
}

// ---------- Tango account window ----------
// Opens Tango's own site so you can sign in (or out) yourself. The sign-in
// cookie lives in the app's browser storage and is shared with the grid.
let acctWin = null;
const AUTH_HOSTS = /(^|\.)(tango\.me|google\.com|googleusercontent\.com|gstatic\.com|apple\.com|facebook\.com|twitter\.com|x\.com|telegram\.org|t\.me)$/;
const isAuth = u => { try { return AUTH_HOSTS.test(new URL(u).hostname); } catch (e) { return false; } };
function openAccount() {
  if (acctWin && !acctWin.isDestroyed()) { acctWin.focus(); return; }
  acctWin = new BrowserWindow({
    width: 520, height: 860, minWidth: 380, minHeight: 560, parent: win || undefined,
    title: 'Tango account', backgroundColor: '#0c1018', autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  acctWin.setMenu(null);
  const awc = acctWin.webContents;
  // Google blocks its sign-in inside apps ("This browser or app may not be secure").
  // Catch it before Google's error page and explain the sign-in options that work.
  const isGoogleSignIn = u => { try { const h = new URL(u).hostname; return h === 'accounts.google.com' || h.endsWith('.accounts.google.com'); } catch (e) { return false; } };
  let googleNoticeAt = 0;
  const googleNotice = () => {
    if (Date.now() - googleNoticeAt < 3000) return; googleNoticeAt = Date.now();
    dialog.showMessageBox(acctWin, { type: 'info', title: 'Use Email or Phone sign-in', buttons: ['OK'],
      message: 'Google sign-in does not work inside apps',
      detail: 'Google blocks its sign-in in apps like this one, so please choose "Continue with Email" or "Continue with Phone" instead.\n\nIf your Tango account was created with Google only, add an email address or phone number to it first in the Tango app on your phone (in its account settings, if it offers that), then sign in here with that.' });
  };
  awc.on('will-navigate', (e, url) => {
    if (isGoogleSignIn(url)) { e.preventDefault(); googleNotice(); return; }
    if (!isAuth(url)) { e.preventDefault(); if (/^https?:/.test(url)) shell.openExternal(url); }
  });
  awc.on('did-create-window', w => {
    w.webContents.on('will-navigate', (e, url) => { if (isGoogleSignIn(url)) { e.preventDefault(); googleNotice(); w.close(); } });
    w.webContents.on('did-navigate', (e, url) => { if (isGoogleSignIn(url)) { googleNotice(); w.close(); } });
  });
  awc.setWindowOpenHandler(({ url }) => {
    if (isGoogleSignIn(url)) { googleNotice(); return { action: 'deny' }; }
    if (isAuth(url)) return { action: 'allow', overrideBrowserWindowOptions: { width: 500, height: 680, parent: acctWin, autoHideMenuBar: true } };
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  acctWin.loadURL(new URL(START_URL).origin + '/');
  // When you close it, reload the grid so every cell uses the new sign-in state.
  acctWin.on('closed', () => { acctWin = null; exportSession(); if (win && !win.isDestroyed()) win.webContents.reload(); });
}
ipcMain.on('mgv:account', () => openAccount());

app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
app.whenReady().then(() => { diagLog({ start: 'grid', app: app.getVersion(), chrome: process.versions.chrome, electron: process.versions.electron, ua: app.userAgentFallback }); createWindow(); setTimeout(exportSession, 15000); setInterval(exportSession, 30 * 60000); });
app.on('window-all-closed', () => app.quit());
