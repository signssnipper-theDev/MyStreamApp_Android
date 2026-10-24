// Runs in the grid page and (since 1.14.0) in each stream's frame.
//  - Grid page: lets it open the account window, show About, write diagnostics
//    and record a feed with Section Recorder.
//  - Stream frames: adds a small sound hook (see audioHook) so one feed's
//    sound can be recorded on its own, even while that tile is muted.
const { contextBridge, ipcRenderer, webFrame } = require('electron');

// Installed in each stream frame before the site's own scripts run.
// The site's sound normally goes   site nodes -> speakers.
// With the hook it goes            site nodes -> mix -> out -> speakers
// so a recording can tap "mix" (all of this feed's sound) while "out" can be
// silenced on its own. Media elements that play sound directly are captured
// with captureStream(), which isn't affected by muting.
function audioHook() {
  if (window.__spAudioHook || !window.AudioNode) return;
  window.__spAudioHook = true;
  const AN = AudioNode.prototype, oconn = AN.connect, odis = AN.disconnect;
  const ctxs = new Set();
  const isDest = (n, self) => { try { return n instanceof AudioDestinationNode && n.context === self.context; } catch (e) { return false; } };
  const route = ctx => {
    if (!ctx.__spMix) {
      const mix = ctx.createGain(), out = ctx.createGain();
      oconn.call(mix, out); oconn.call(out, ctx.destination);
      ctx.__spMix = mix; ctx.__spOut = out; ctxs.add(ctx);
      if (window.__spMuteAll) out.gain.value = 0;
    }
    return ctx.__spMix;
  };
  AN.connect = function (dest, ...rest) {
    if (isDest(dest, this)) { try { oconn.call(this, route(this.context), ...rest); return dest; } catch (e) {} }
    return oconn.call(this, dest, ...rest);
  };
  AN.disconnect = function (dest, ...rest) {
    if (isDest(dest, this) && this.context.__spMix) { try { return odis.call(this, this.context.__spMix, ...rest); } catch (e) { return; } }
    return odis.apply(this, arguments);
  };
  const AC = window.BaseAudioContext || window.AudioContext;
  const omes = AC && AC.prototype.createMediaElementSource;
  if (omes) AC.prototype.createMediaElementSource = function (el) { try { el.__spRouted = true; } catch (e) {} return omes.call(this, el); };

  // Streams carrying this feed's sound, for the recorder in the grid page.
  window.__spTaps = () => {
    const list = [];
    for (const ctx of ctxs) {
      if (ctx.state === 'closed') { ctxs.delete(ctx); continue; }
      try {
        if (!ctx.__spTap) { ctx.__spTap = ctx.createMediaStreamDestination(); oconn.call(ctx.__spMix, ctx.__spTap); }
        list.push({ kind: 'webaudio', key: ctx, stream: ctx.__spTap.stream });
      } catch (e) {}
    }
    document.querySelectorAll('video,audio').forEach(el => {
      if (el.__spRouted || !el.captureStream) return;
      try {
        if (!el.__spCap) el.__spCap = el.captureStream();
        if (el.__spCap.getAudioTracks().length) list.push({ kind: 'element', key: el, stream: el.__spCap });
      } catch (e) {}
    });
    return list;
  };
  // Silence what you hear from this feed without changing what is recorded.
  window.__spListen = on => { window.__spMuteAll = !on; for (const ctx of ctxs) if (ctx.__spOut) ctx.__spOut.gain.value = on ? 1 : 0; };
  window.__spAudioInfo = () => ({ contexts: ctxs.size, elements: document.querySelectorAll('video,audio').length });
}

const isTop = (() => { try { return window.top === window; } catch (e) { return false; } })();
const isTangoFrame = () => { try { return /(^|\.)tango\.me$/.test(location.hostname); } catch (e) { return false; } };

if (isTop) {
  contextBridge.exposeInMainWorld('mgvApp', {
    openAccount: () => ipcRenderer.send('mgv:account'),
    about: () => ipcRenderer.invoke('mgv:about'),
    log: o => ipcRenderer.send('mgv:log', o),
    // Record one feed with Section Recorder (see rec-link.js).
    rec: {
      start: (id, info) => ipcRenderer.invoke('mgv:rec-start', id, info),
      rect: (id, rect) => ipcRenderer.send('mgv:rec-rect', id, rect),
      audio: (id, buf) => ipcRenderer.send('mgv:rec-audio', id, buf),
      stop: id => ipcRenderer.send('mgv:rec-stop', id),
      onEvent: cb => ipcRenderer.on('mgv:rec-event', (e, id, msg) => cb(id, msg))
    }
  });
} else if (isTangoFrame()) {
  try {
    if (contextBridge.executeInMainWorld) contextBridge.executeInMainWorld({ func: audioHook });
    else webFrame.executeJavaScript('(' + audioHook.toString() + ')()');
  } catch (e) {
    try { webFrame.executeJavaScript('(' + audioHook.toString() + ')()'); } catch (e2) {}
  }
}
