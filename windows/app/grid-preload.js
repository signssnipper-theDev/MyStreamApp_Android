// Lets the grid page write diagnostics and ask the app to repair its session.
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('mgvApp', {
  log: o => ipcRenderer.send('mgv:log', o),
  resetSession: stage => ipcRenderer.send('mgv:reset-session', stage)
});
