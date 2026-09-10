const { app, BrowserWindow } = require('electron');
const path = require('path');

// Forzar el userData real de Cap Finanzas (productName "Cap Finanzas" → "Cap Finanzas")
// pero la app actual lee de "Cap-Finanzas" (name). Probar ambos.
const candidates = [
  "C:/Users/USUARIO/AppData/Roaming/Cap-Finanzas",
  "C:/Users/USUARIO/AppData/Roaming/Cap Finanzas",
];

app.setPath('userData', candidates[0]);

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    show: false,
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });

  const distPath = path.join(app.getAppPath(), 'dist', 'index.html');
  await win.loadFile(distPath);
  await new Promise((r) => setTimeout(r, 2500));

  const result = await win.webContents.executeJavaScript(`
    (() => {
      const j = localStorage.getItem('cap-finanzas-journal');
      if (!j) return { error: 'no journal', keys: Object.keys(localStorage) };
      const arr = JSON.parse(j);
      function codes(s) {
        if (!s) return null;
        return Array.from(s).map(c => c.codePointAt(0).toString(16)).join(' ');
      }
      const find = (sub) => arr.find(t => t.description && t.description.includes(sub));
      const dev = find('Devoluci'), ali = find('Alimentaci'), cor = find('Corral'), con = find('Contribuci');
      return {
        userData: 'Cap-Finanzas',
        total: arr.length,
        devolucion: dev ? { desc: dev.description, codes: codes(dev.description) } : null,
        alimentacion: ali ? { desc: ali.description, codes: codes(ali.description) } : null,
        corralon: cor ? { desc: cor.description, codes: codes(cor.description) } : null,
        contribucion: con ? { desc: con.description, codes: codes(con.description) } : null,
      };
    })()
  `);

  console.log(JSON.stringify(result, null, 2));
  app.quit();
});