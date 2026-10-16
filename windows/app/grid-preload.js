// Lets the grid page ask the app to open the Tango account (sign-in) window.
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('mgvApp', {
  openAccount: () => ipcRenderer.send('mgv:account'),
  log: o => ipcRenderer.send('mgv:log', o)
});
