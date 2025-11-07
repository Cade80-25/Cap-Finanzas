# Configuración de Auto-Actualizaciones con GitHub Releases

## 1. Configurar package.json

Necesitas agregar la configuración de publicación en tu `package.json`. Abre el archivo y añade lo siguiente dentro de la sección `"build"`:

```json
{
  "name": "cap-finanzas",
  "version": "1.0.0",
  "main": "electron/main.js",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "electron:dev": "concurrently \"npm run dev\" \"wait-on http://localhost:8080 && cross-env NODE_ENV=development electron .\"",
    "electron:build:win": "npm run build && electron-builder --win --publish never",
    "electron:build:mac": "npm run build && electron-builder --mac --publish never",
    "electron:build:linux": "npm run build && electron-builder --linux --publish never",
    "electron:publish": "npm run build && electron-builder --publish always"
  },
  "build": {
    "appId": "com.capfinanzas.app",
    "productName": "Cap Finanzas",
    "directories": {
      "output": "dist-electron"
    },
    "files": [
      "dist/**/*",
      "electron/**/*"
    ],
    "win": {
      "target": ["nsis"],
      "icon": "public/favicon.ico"
    },
    "mac": {
      "target": ["dmg"],
      "icon": "public/favicon.ico",
      "category": "public.app-category.finance"
    },
    "linux": {
      "target": ["AppImage"],
      "icon": "public/favicon.ico",
      "category": "Finance"
    },
    "publish": {
      "provider": "github",
      "owner": "TU_USUARIO_GITHUB",
      "repo": "NOMBRE_DE_TU_REPOSITORIO",
      "private": false
    }
  }
}
```

**IMPORTANTE:** Reemplaza `TU_USUARIO_GITHUB` y `NOMBRE_DE_TU_REPOSITORIO` con tus datos reales de GitHub.

## 2. Configurar Token de GitHub

Para poder publicar releases en GitHub, necesitas crear un token de acceso personal:

1. Ve a GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Haz clic en "Generate new token (classic)"
3. Dale un nombre descriptivo como "Electron Builder"
4. Selecciona el scope: `repo` (acceso completo al repositorio)
5. Genera el token y cópialo

Luego, configura el token como variable de entorno:

**Windows:**
```bash
setx GH_TOKEN "tu_token_aqui"
```

**macOS/Linux:**
```bash
export GH_TOKEN="tu_token_aqui"
# Para que sea permanente, agrégalo a tu ~/.bashrc o ~/.zshrc
echo 'export GH_TOKEN="tu_token_aqui"' >> ~/.bashrc
```

## 3. Publicar una Release

Para crear una nueva versión y publicarla en GitHub:

1. **Actualiza la versión en package.json**:
   ```json
   "version": "1.0.1"
   ```

2. **Construye y publica**:
   ```bash
   npm run electron:publish
   ```

   Esto creará automáticamente:
   - Un tag de git con la versión
   - Una GitHub Release
   - Los instaladores adjuntos a la release

## 4. Usar el Sistema de Auto-Actualizaciones en tu App

Ya está todo configurado en el código. El sistema de auto-actualizaciones:

- ✅ Verifica actualizaciones automáticamente al iniciar la app (solo en producción)
- ✅ Muestra notificaciones toast cuando hay actualizaciones disponibles
- ✅ Permite descargar actualizaciones en segundo plano
- ✅ Muestra progreso de descarga
- ✅ Instala actualizaciones al reiniciar la app

### Usar el Hook en tus Componentes

Puedes usar el hook `useAutoUpdater` en cualquier componente:

```tsx
import { useAutoUpdater } from '@/hooks/useAutoUpdater';

function MiComponente() {
  const {
    updateAvailable,
    updateInfo,
    downloading,
    downloadProgress,
    updateReady,
    checkForUpdates,
    downloadUpdate,
    installUpdate
  } = useAutoUpdater();

  return (
    <div>
      <button onClick={checkForUpdates}>
        Buscar actualizaciones
      </button>
      
      {updateAvailable && (
        <button onClick={downloadUpdate}>
          Descargar v{updateInfo?.version}
        </button>
      )}
      
      {downloading && (
        <div>Descargando: {downloadProgress}%</div>
      )}
      
      {updateReady && (
        <button onClick={installUpdate}>
          Instalar ahora
        </button>
      )}
    </div>
  );
}
```

## 5. Flujo de Actualización

1. **App inicia** → Verifica automáticamente si hay actualizaciones
2. **Actualización disponible** → Muestra notificación toast al usuario
3. **Usuario descarga** → Descarga en segundo plano con barra de progreso
4. **Descarga completa** → Notifica que está lista para instalar
5. **Usuario instala** → La app se cierra, instala y se reinicia automáticamente

## 6. Testing

Para probar el sistema de actualizaciones:

1. Publica la versión 1.0.0:
   ```bash
   npm run electron:publish
   ```

2. Instala la app en tu sistema

3. Actualiza la versión en package.json a 1.0.1

4. Publica la nueva versión:
   ```bash
   npm run electron:publish
   ```

5. Abre la app instalada (versión 1.0.0)

6. Debería detectar automáticamente la nueva versión 1.0.1

## 7. Notas Importantes

- ⚠️ Las actualizaciones **NO funcionan en modo desarrollo**
- ⚠️ Solo funcionan en apps instaladas (no en el .exe sin instalar)
- ⚠️ En Windows, requiere que el instalador esté firmado para actualizaciones silenciosas
- ⚠️ El repositorio de GitHub debe ser **público** o configurar correctamente los tokens para repos privados
- ✅ Las actualizaciones se descargan e instalan automáticamente al cerrar la app
