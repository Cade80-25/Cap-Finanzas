const { app, BrowserWindow } = require('electron');
const path = require('path');

app.setPath('userData', "C:/Users/USUARIO/AppData/Roaming/Cap-Finanzas");

app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, webPreferences: { contextIsolation: true } });
  await win.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'));
  await new Promise((r) => setTimeout(r, 3000));

  const result = await win.webContents.executeJavaScript(`
    (() => {
      const raw = localStorage.getItem('cap-finanzas-categories');
      if (!raw) return { error: 'no categories key' };
      const cats = JSON.parse(raw);
      // Buscar categorías/subcategorías con tilde corrupta
      const found = [];
      const scan = (c) => {
        if (c.label && /[%$12\\/]/.test(c.label) && /[a-zA-Z]/.test(c.label)) {
          found.push({ kind: 'cat', id: c.id, label: c.label, hex: Array.from(c.label).map(x=>x.codePointAt(0).toString(16)).join(' ') });
        }
        (c.subcategories || []).forEach(s => {
          if (s.label && /[%$12\\/]/.test(s.label) && /[a-zA-Z]/.test(s.label)) {
            found.push({ kind: 'sub', id: s.id, label: s.label, hex: Array.from(s.label).map(x=>x.codePointAt(0).toString(16)).join(' ') });
          }
        });
      };
      cats.forEach(scan);
      return { totalCats: cats.length, found };
    })()
  `);
  console.log(JSON.stringify(result, null, 2));
  app.quit();
});