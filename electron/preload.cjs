const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isElectron: true,

  setNativeMenuVisible: (visible) => ipcRenderer.send('set-native-menu-visible', visible),
  toggleNativeMenu: () => ipcRenderer.send('toggle-native-menu'),

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
  },
});
