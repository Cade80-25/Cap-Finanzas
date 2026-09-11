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
      const catKeys = keys.filter(k => k.toLowerCase().includes('cat') || k.toLowerCase().includes('categ'));
      const result = {};
      for (const k of catKeys) {
        const v = localStorage.getItem(k);
        result[k] = v ? v.length : null;
      }
      return { allKeys: keys.length, catKeys: catKeys, sizes: result };
    })()
  `);
  console.log(JSON.stringify(result, null, 2));
  app.quit();
});