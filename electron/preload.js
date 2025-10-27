const { contextBridge } = require('electron');

// Expone APIs seguras al proceso de renderizado si es necesario
contextBridge.exposeInMainWorld('electron', {
  platform: process.platform
});
