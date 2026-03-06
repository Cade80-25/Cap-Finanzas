const { contextBridge, ipcRenderer } = require('electron');

// Expone APIs seguras al proceso de renderizado si es necesario
contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
  isElectron: true,

  // Native menu (File/Edit/View/...)
  setNativeMenuVisible: (visible) => ipcRenderer.send('set-native-menu-visible', visible),
  toggleNativeMenu: () => ipcRenderer.send('toggle-native-menu'),

  // Auto-updater API
  checkForUpdates: () => ipcRenderer.send('check-for-updates'),
  downloadUpdate: () => ipcRenderer.send('download-update'),
  installUpdate: () => ipcRenderer.send('install-update'),
  onUpdateAvailable: (callback) => ipcRenderer.on('update-available', (_, info) => callback(info)),
  onUpdateError: (callback) => ipcRenderer.on('update-error', (_, message) => callback(message)),
  onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (_, progress) => callback(progress)),
  onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', (_, info) => callback(info)),
  removeUpdateListeners: () => {
    ipcRenderer.removeAllListeners('update-available');
    ipcRenderer.removeAllListeners('update-error');
    ipcRenderer.removeAllListeners('download-progress');
    ipcRenderer.removeAllListeners('update-downloaded');
  }
});
