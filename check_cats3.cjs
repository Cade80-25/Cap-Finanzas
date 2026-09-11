const { app, BrowserWindow } = require('electron');
const path = require('path');

app.setPath('userData', "C:/Users/USUARIO/AppData/Roaming/Cap-Finanzas");

app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, webPreferences: { contextIsolation: true } });
  await win.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'));
  await new Promise((r) => setTimeout(r, 3000));

  const result = await win.webContents.executeJavaScript(`
    (() => {
      const keys = Object.keys(localStorage);
      return { keys: keys.map(k => ({ k, len: (localStorage.getItem(k)||'').length })) };
    })()
  `);
  console.log('__RESULT__' + JSON.stringify(result));
  app.quit();
});