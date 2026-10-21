// Live preview (pop-up and status-list thumbnails): only what it needs — open,
// close, the still picture and one log line. Kept separate from the settings
// window's bridge because this page shows the stream site.
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('mgvPop', {
  close: () => ipcRenderer.send('mgv:popup-close'),
  open: () => ipcRenderer.send('mgv:popup-open'),
  openTile: () => ipcRenderer.send('mgv:tile-open'),
  log: o => ipcRenderer.send('mgv:preview-log', o),
  onThumb: cb => ipcRenderer.on('mgv:thumb', (e, url) => cb(url))
});
