const { app, BrowserWindow, ipcMain, session } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');

// ─── Proxy de Yahoo Finance (evita CORS desde el renderer) ───
// Usa https nativo de Node.js (siempre disponible en Electron)
const https = require('https');

function yahooFetch(url) {
  return new Promise((resolve) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ error: 'Invalid JSON' });
        }
      });
    });
    req.on('error', (e) => resolve({ error: e.message }));
    req.setTimeout(15000, () => {
      req.destroy();
      resolve({ error: 'Timeout' });
    });
  });
}

ipcMain.handle('yahoo-finance', async (event, url) => {
  try {
    return await yahooFetch(url);
  } catch (e) {
    return { error: e.message || 'Unknown error' };
  }
});

// userData canónico: SIEMPRE "Cap Finanzas" (espacio), ANTES de que Chromium
// inicialice el storage. Esto alinea TODOS los launchers (exe directo, accesos
// directos, instalador) a la misma carpeta con los datos del usuario, sin
// importar el name/productName del package.json ni la carpeta de instalación.
// Evita la divergencia espacio/guion que ocultaba transacciones.
app.setPath('userData', path.join(app.getPath('appData'), 'Cap Finanzas'));

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false, // Mostrar solo cuando esté listo para evitar el flash blanco y acelerar la percepción de carga
    backgroundColor: '#1a1a2e',
    autoHideMenuBar: true,
    webPreferences: {
      // file:// + ES modules relativos requieren webSecurity desactivado (pantalla blanca si no)
      webSecurity: false,
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false, // Mantiene rendimiento aunque la ventana pierda foco
      spellcheck: false,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  // Mostrar la ventana cuando el contenido esté listo (arranque visiblemente más rápido)
  win.once('ready-to-show', () => win.show());

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

/**
 * Identificador estable de la maquina, para controlar la prueba gratuita.
 *
 * Se combinan dos fuentes:
 *  1. Una huella del hardware (hostname + plataforma + CPU). Sobrevive a
 *     reinstalar la app, y cambia solo si cambian piezas importantes.
 *  2. Un id aleatorio guardado en una carpeta aparte de los datos de la app
 *     (no se borra al reinstalar, solo al formatear).
 *
 * El servidor recuerda cualquiera de los dos. Asi un cliente legitimo que
 * cambia una pieza no queda bloqueado, pero borrar los datos no reinicia
 * la prueba.
 */
function obtenerMachineId() {
  // --- 1. huella de hardware ---
  let huella = '';
  try {
    const cpu = os.cpus()?.[0]?.model ?? '';
    huella = crypto
      .createHash('sha256')
      .update([os.hostname(), os.platform(), os.arch(), cpu].join('|'))
      .digest('hex')
      .slice(0, 32);
  } catch (_) {
    huella = '';
  }

  // --- 2. id persistente fuera de los datos de la app ---
  let idGuardado = '';
  try {
    const carpeta = path.join(app.getPath('appData'), '.capfinanzas-id');
    const archivo = path.join(carpeta, 'machine.id');
    if (fs.existsSync(archivo)) {
      idGuardado = fs.readFileSync(archivo, 'utf8').trim();
    }
    if (!idGuardado) {
      idGuardado = crypto.randomBytes(16).toString('hex');
      fs.mkdirSync(carpeta, { recursive: true });
      fs.writeFileSync(archivo, idGuardado, { mode: 0o600 });
    }
  } catch (_) {
    idGuardado = '';
  }

  // Se expone la huella como principal; el servidor guarda ambas.
  return huella || idGuardado;
}

ipcMain.handle('get-machine-id', () => obtenerMachineId());

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

// Check for updates on app start (only in production)
app.on('ready', () => {
  if (process.env.NODE_ENV !== 'development') {
    setTimeout(() => {
      autoUpdater.checkForUpdates();
    }, 3000);
  }
});
