const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Usar ubicación estándar de Electron (donde están los datos viejos)
// userData vive en %APPDATA%\Cap Finanzas\

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    show: true,
    backgroundColor: '#1a1a2e',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: true,
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
