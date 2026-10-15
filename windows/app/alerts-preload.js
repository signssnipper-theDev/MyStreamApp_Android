const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('mgv', {
  get: () => ipcRenderer.invoke('mgv:get'),
  save: cfg => ipcRenderer.invoke('mgv:save', cfg),
  checkNow: () => ipcRenderer.invoke('mgv:check'),
  pause: p => ipcRenderer.invoke('mgv:pause', p),
  openGrid: () => ipcRenderer.send('mgv:open-grid'),
  onState: cb => ipcRenderer.on('mgv:state', (e, s) => cb(s)),
  popupClose: () => ipcRenderer.send('mgv:popup-close'),
  popupOpen: () => ipcRenderer.send('mgv:popup-open')
});
