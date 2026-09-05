const { app, BrowserWindow, ipcMain, session, safeStorage } = require('electron');
// Desactivado: auto-updater roto por build local sin GitHub Release firmado
const autoUpdater = {
  autoDownload: false,
  autoInstallOnAppQuit: false,
  on: () => {},
  checkForUpdates: () => {},
  downloadUpdate: () => {},
  quitAndInstall: () => {},
};
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false, // Mostrar solo cuando esté listo para evitar el flash blanco y acelerar la percepción de carga
    backgroundColor: '#1a1a2e',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true, // Seguridad: aisla el renderer del sistema
      webSecurity: true, // Seguridad: impide acceso a recursos inseguros
      backgroundThrottling: false, // Mantiene rendimiento aunque la ventana pierda foco
      spellcheck: false,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  // Mostrar la ventana cuando el contenido esté listo (arranque visiblemente más rápido)
  win.once('ready-to-show', () => win.show());

  // Fallback: mostrar la ventana si la página falla al cargar
  win.once('did-fail-load', () => {
    win.show();
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

  win.webContents.on('did-fail-load', () => {
    // Load failure handled silently
  });

  return win;
}

// Deshabilitar aceleración de GPU antes de que la app esté lista para evitar crashes de network service/GPU en Windows
if (process.platform === 'win32') {
  app.disableHardwareAcceleration();
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
  // Silent check
});

autoUpdater.on('update-available', (info) => {
  BrowserWindow.getAllWindows()[0]?.webContents.send('update-available', info);
});

autoUpdater.on('update-not-available', () => {
  // No update available
});

autoUpdater.on('error', (err) => {
  BrowserWindow.getAllWindows()[0]?.webContents.send('update-error', err.message);
});

autoUpdater.on('download-progress', (progressObj) => {
  BrowserWindow.getAllWindows()[0]?.webContents.send('download-progress', progressObj);
});

autoUpdater.on('update-downloaded', (info) => {
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

// ── Secure Storage (safeStorage de Electron) ─────────────────────────────────
ipcMain.handle('secure-store-get', (_event, key: string) => {
  try {
    if (!safeStorage?.isEncryptionAvailable) return null;
    const encrypted = safeStorage.encryptString(key);
    // Guardar en localStorage del main process (no es localStorage del renderer)
    // Usamos un Map en memoria para no persistir en disco sin cifrar
    secureStorageCache.set(key, encrypted);
    return true;
  } catch {
    return false;
  }
});

ipcMain.handle('secure-store-set', (_event, key: string, value: string) => {
  try {
    if (!safeStorage?.isEncryptionAvailable) return false;
    const encrypted = safeStorage.encryptString(value);
    secureStorageCache.set(key, encrypted);
    return true;
  } catch {
    return false;
  }
});

ipcMain.handle('secure-store-get-value', (_event, key: string) => {
  try {
    if (!safeStorage?.isEncryptionAvailable) return null;
    const encrypted = secureStorageCache.get(key);
    if (!encrypted) return null;
    return safeStorage.decryptString(encrypted);
  } catch {
    return null;
  }
});

ipcMain.handle('secure-store-delete', (_event, key: string) => {
  secureStorageCache.delete(key);
  return true;
});

// Cache en memoria para datos cifrados con safeStorage
const secureStorageCache = new Map<string, ArrayBuffer>();

// Check for updates on app start (only in production)
app.on('ready', () => {
  if (process.env.NODE_ENV !== 'development') {
    setTimeout(() => {
      autoUpdater.checkForUpdates();
    }, 3000);
  }
});
