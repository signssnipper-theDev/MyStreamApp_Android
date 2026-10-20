// Lets the grid page open the account window, show the About details and write diagnostics.
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('mgvApp', {
  openAccount: () => ipcRenderer.send('mgv:account'),
  about: () => ipcRenderer.invoke('mgv:about'),
  log: o => ipcRenderer.send('mgv:log', o)
});
