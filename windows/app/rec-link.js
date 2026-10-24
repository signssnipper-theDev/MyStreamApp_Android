// "Record this feed": talks to Section Recorder on this PC.
// Section Recorder records the tile's picture from this window and adds the
// feed's sound, which this app sends over a local connection (127.0.0.1 only).
// Section Recorder writes where to connect in %APPDATA%\SectionRecorder\link.json.
const { app, ipcMain } = require('electron');
const net = require('net');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const LINK = () => path.join(app.getPath('appData'), 'SectionRecorder', 'link.json');
const readLink = () => { try { const j = JSON.parse(fs.readFileSync(LINK(), 'utf8')); return j && j.port && j.token ? j : null; } catch (e) { return null; } };
const sleep = ms => new Promise(r => setTimeout(r, ms));

function frame(type, payload) {
  const body = Buffer.isBuffer(payload) ? payload : Buffer.from(payload);
  const h = Buffer.alloc(5);
  h.writeUInt32LE(body.length + 1, 0);
  h[4] = type.charCodeAt(0);
  return Buffer.concat([h, body]);
}
const jsonFrame = o => frame('J', JSON.stringify(o));

function connect(link) {
  return new Promise((resolve, reject) => {
    const s = net.createConnection({ host: '127.0.0.1', port: link.port });
    const t = setTimeout(() => { s.destroy(); reject(new Error('timeout')); }, 3000);
    s.once('connect', () => { clearTimeout(t); resolve(s); });
    s.once('error', e => { clearTimeout(t); reject(e); });
  });
}

// Find Section Recorder, starting it if it isn't running.
async function reach(log) {
  let link = readLink();
  if (link) { try { return { link, sock: await connect(link) }; } catch (e) {} }
  const exe = link && link.exe;
  if (!exe || !fs.existsSync(exe)) return { error: 'Section Recorder isn\'t running. Open Section Recorder (version 1.6.0 or newer), then try again.' };
  log({ rec: 'starting Section Recorder', exe });
  try { spawn(exe, [], { detached: true, stdio: 'ignore' }).unref(); } catch (e) { return { error: 'Couldn\'t start Section Recorder: ' + e.message }; }
  for (let i = 0; i < 20; i++) {
    await sleep(500);
    const l2 = readLink();
    if (l2 && (!link || l2.token !== link.token)) { try { return { link: l2, sock: await connect(l2) }; } catch (e) {} }
  }
  return { error: 'Section Recorder didn\'t start. Open it yourself, then try again.' };
}

function setup(getWin, log) {
  const recs = new Map(); // id -> { sock }

  const send = (id, msg) => { const w = getWin(); if (w && !w.isDestroyed() && !w.webContents.isDestroyed()) w.webContents.send('mgv:rec-event', id, msg); };

  ipcMain.handle('mgv:rec-start', async (e, id, info) => {
    const win = getWin();
    if (!win || win.isDestroyed()) return { ok: false, error: 'The grid window is closed.' };
    const r = await reach(log);
    if (r.error) return { ok: false, error: r.error };
    const sock = r.sock;
    sock.setNoDelay(true);
    let buf = Buffer.alloc(0), started = null, done = false;
    const waitStart = new Promise(res => { started = res; });
    sock.on('data', d => {
      buf = Buffer.concat([buf, d]);
      while (buf.length >= 4) {
        const n = buf.readUInt32LE(0);
        if (buf.length < 4 + n) break;
        const type = String.fromCharCode(buf[4]), body = buf.subarray(5, 4 + n);
        buf = buf.subarray(4 + n);
        if (type !== 'J') continue;
        let m; try { m = JSON.parse(body.toString('utf8')); } catch (err) { continue; }
        if (m.op === 'started') started({ ok: true, name: m.name });
        else if (m.op === 'error') { started({ ok: false, error: m.message }); send(id, m); }
        else if (m.op !== 'welcome') send(id, m);
        if (m.op === 'stopped') done = true;
      }
    });
    sock.on('close', () => { recs.delete(id); started({ ok: false, error: 'Section Recorder closed the connection.' }); if (!done) send(id, { op: 'closed' }); });
    sock.on('error', () => {});
    const hwnd = win.getNativeWindowHandle();
    const handle = hwnd.length >= 8 ? Number(hwnd.readBigUInt64LE(0)) : hwnd.readUInt32LE(0);
    sock.write(jsonFrame({ op: 'hello', token: r.link.token, app: 'MultiGridView', version: app.getVersion() }));
    sock.write(jsonFrame({ op: 'start', feed: info.feed, hwnd: handle, rect: info.rect, rate: info.rate }));
    const res = await Promise.race([waitStart, sleep(15000).then(() => ({ ok: false, error: 'Section Recorder didn\'t answer.' }))]);
    if (res.ok) recs.set(id, { sock }); else sock.destroy();
    log({ rec: 'start', feed: info.feed, rect: info.rect, rate: info.rate, how: info.how, ok: res.ok, error: res.error });
    return res;
  });
  ipcMain.on('mgv:rec-rect', (e, id, rect) => { const r = recs.get(id); if (r && rect) r.sock.write(jsonFrame({ op: 'rect', rect })); });
  ipcMain.on('mgv:rec-audio', (e, id, ab) => {
    const r = recs.get(id);
    if (r && ab && ab.byteLength && r.sock.writableLength < (4 << 20)) r.sock.write(frame('A', Buffer.from(ab)));
  });
  ipcMain.on('mgv:rec-stop', (e, id) => {
    const r = recs.get(id); if (!r) return;
    r.sock.write(jsonFrame({ op: 'stop' }));
    // Section Recorder answers "stopped" and closes; don't wait forever.
    setTimeout(() => { if (recs.get(id) === r) { r.sock.destroy(); recs.delete(id); } }, 30000);
  });
  // Closing the app: Section Recorder saves when the connection closes.
  app.on('before-quit', () => { for (const r of recs.values()) { try { r.sock.write(jsonFrame({ op: 'stop' })); r.sock.end(); } catch (e) {} } });
}

module.exports = { setup };
