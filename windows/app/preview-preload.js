// Live-preview pop-up: only what the pop-up needs (open, close, still picture).
// Kept separate from the settings window's bridge because this pop-up shows the
// stream site's page.
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('mgvPop', {
  close: () => ipcRenderer.send('mgv:popup-close'),
  open: () => ipcRenderer.send('mgv:popup-open'),
  onThumb: cb => ipcRenderer.on('mgv:thumb', (e, url) => cb(url))
});
