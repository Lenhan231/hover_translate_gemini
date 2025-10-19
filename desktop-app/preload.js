// preload.js - Bridge between main and renderer
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  closeOverlay: () => ipcRenderer.invoke('close-overlay'),
  onShowTranslation: (callback) => ipcRenderer.on('show-translation', (event, data) => callback(data))
});
