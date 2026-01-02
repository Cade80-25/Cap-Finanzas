const { app, BrowserWindow, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    },
    // Usamos PNG aquí para evitar problemas de render (icono cortado) en algunos Windows
    icon: path.join(__dirname, '../public/icon-final.png')
  });

  // Oculta el menú nativo (File/Edit/View/...) por defecto, pero permite mostrarlo luego
  win.setMenuBarVisibility(false);

  // En desarrollo, carga desde el servidor de Vite
  // En producción, app.isPackaged será true
  const isDev = !app.isPackaged && process.env.NODE_ENV === 'development';

  if (isDev) {
    win.loadURL('http://localhost:8080');
    win.webContents.openDevTools();
  } else {
    // En producción, carga los archivos compilados desde la app empaquetada
    win.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'));
  }

  win.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error('did-fail-load', { errorCode, errorDescription });
  });

  return win;
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Auto-updater configuration
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

// Auto-updater events
autoUpdater.on('checking-for-update', () => {
  console.log('Checking for updates...');
});

autoUpdater.on('update-available', (info) => {
  console.log('Update available:', info.version);
  BrowserWindow.getAllWindows()[0]?.webContents.send('update-available', info);
});

autoUpdater.on('update-not-available', (info) => {
  console.log('Update not available:', info.version);
});

autoUpdater.on('error', (err) => {
  console.error('Update error:', err);
  BrowserWindow.getAllWindows()[0]?.webContents.send('update-error', err.message);
});

autoUpdater.on('download-progress', (progressObj) => {
  console.log(`Download progress: ${progressObj.percent}%`);
  BrowserWindow.getAllWindows()[0]?.webContents.send('download-progress', progressObj);
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('Update downloaded:', info.version);
  BrowserWindow.getAllWindows()[0]?.webContents.send('update-downloaded', info);
});

// IPC handlers for renderer process
ipcMain.on('check-for-updates', () => {
  if (process.env.NODE_ENV !== 'development') {
    autoUpdater.checkForUpdates();
  }
});

ipcMain.on('download-update', () => {
  autoUpdater.downloadUpdate();
});

ipcMain.on('install-update', () => {
  autoUpdater.quitAndInstall();
});

// Native menu controls
function setNativeMenuVisible(visible) {
  const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
  if (!win) return;
  win.setAutoHideMenuBar(!visible);
  win.setMenuBarVisibility(!!visible);
}

ipcMain.on('set-native-menu-visible', (_event, visible) => {
  setNativeMenuVisible(!!visible);
});

ipcMain.on('toggle-native-menu', () => {
  const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
  if (!win) return;
  const nextVisible = !win.isMenuBarVisible();
  setNativeMenuVisible(nextVisible);
});

// Check for updates on app start (only in production)
app.on('ready', () => {
  if (process.env.NODE_ENV !== 'development') {
    setTimeout(() => {
      autoUpdater.checkForUpdates();
    }, 3000);
  }
});
