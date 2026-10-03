const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// ── Carpeta de datos ────────────────────────────────────────────────────────
// La app se identifica internamente como "Cap-Finanzas" (con guion), pero los
// datos historicos viven en "%APPDATA%\Cap Finanzas" (con espacio) — ahi estan
// las transacciones reales del usuario. Se fija explicitamente para que la app
// abra SIEMPRE esa carpeta y no dependa del nombre del paquete (esto ya causo
// una perdida aparente de datos: la app abria la carpeta vacia).
// Se puede sobreescribir con CAPFINANZAS_USERDATA (util para pruebas).
const carpetaDatos = process.env.CAPFINANZAS_USERDATA
  || path.join(app.getPath('appData'), 'Cap Finanzas');
app.setPath('userData', carpetaDatos);

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    show: true,
    backgroundColor: '#1a1a2e',
    autoHideMenuBar: true,
    webPreferences: {
      // Los ES modules relativos no cargan por file:// con webSecurity activo:
      // sin esto la ventana queda EN BLANCO en Windows.
      webSecurity: false,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      backgroundThrottling: false,
      spellcheck: false,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  win.setMenuBarVisibility(false);

  const isDev = !app.isPackaged && process.env.NODE_ENV === 'development';

  if (isDev) {
    win.loadURL('http://localhost:8080');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'));
  }

  // Toggle native menu
  ipcMain.on('set-native-menu-visible', (_event, visible) => {
    const win = BrowserWindow.fromWebContents(_event.sender);
    if (!win) return;
    win.setMenuBarVisibility(visible);
  });

  ipcMain.on('toggle-native-menu', (_event) => {
    const win = BrowserWindow.fromWebContents(_event.sender);
    if (!win) return;
    win.setMenuBarVisibility(!win.isMenuBarVisible());
  });

  return win;
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('web-contents-created', (_event, contents) => {
  contents.on('will-navigate', (_event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    if (parsedUrl.origin !== 'http://localhost:8080' && parsedUrl.origin !== 'file://') {
      _event.preventDefault();
    }
  });
});
