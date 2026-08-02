# Configuración para Windows - Sistema de Auto-Actualizaciones

## ✅ Archivos ya configurados

El código de auto-actualizaciones ya está implementado. Solo necesitas 2 pasos simples.

---

## 📋 PASO 1: Actualizar package.json

Abre el archivo `package.json` en tu editor de código y haz estos cambios:

### A) Cambiar el nombre y versión (líneas 2-4)

**ANTES:**
```json
{
  "name": "vite_react_shadcn_ts",
  "private": true,
  "version": "0.0.0",
```

**DESPUÉS:**
```json
{
  "name": "cap-finanzas",
  "private": true,
  "version": "1.0.0",
```

### B) Actualizar los scripts (líneas 12-16)

**ANTES:**
```json
    "electron:dev": "concurrently \"npm run dev\" \"wait-on http://localhost:8080 && cross-env NODE_ENV=development electron .\"",
    "electron:build": "npm run build && electron-builder",
    "build:win": "npm run build && electron-builder --win",
    "build:mac": "npm run build && electron-builder --mac",
    "build:linux": "npm run build && electron-builder --linux"
```

**DESPUÉS:**
```json
    "electron:dev": "concurrently \"npm run dev\" \"wait-on http://localhost:8080 && cross-env NODE_ENV=development electron .\"",
    "electron:build": "npm run build && electron-builder",
    "build:win": "npm run build && electron-builder --win --publish never",
    "build:mac": "npm run build && electron-builder --mac --publish never",
    "build:linux": "npm run build && electron-builder --linux --publish never",
    "publish": "npm run build && electron-builder --publish always"
```

### C) Agregar configuración de GitHub (al final del archivo)

**ANTES (líneas 112-119):**
```json
    "linux": {
      "target": [
        "AppImage"
      ],
      "icon": "public/favicon.ico"
    }
  }
}
```

**DESPUÉS:**
```json
    "linux": {
      "target": [
        "AppImage"
      ],
      "icon": "public/favicon.ico"
    },
    "publish": {
      "provider": "github",
      "owner": "TU_USUARIO_GITHUB",
      "repo": "TU_REPOSITORIO",
      "private": false
    }
  }
}
```

**⚠️ IMPORTANTE:** Reemplaza:
- `TU_USUARIO_GITHUB` → Tu usuario de GitHub (ej: `juanperez`)
- `TU_REPOSITORIO` → Nombre de tu repositorio (ej: `cap-finanzas`)

---

## 📋 PASO 2: Configurar GitHub Token

### A) Crear Token de GitHub

1. Ve a: https://github.com/settings/tokens
2. Click en **"Generate new token"** → **"Generate new token (classic)"**
3. Dale un nombre: `Electron Builder`
4. Selecciona el permiso: `repo` ✓ (marca toda la casilla)
5. Click en **"Generate token"**
6. **¡COPIA EL TOKEN!** (solo lo verás una vez)

### B) Configurar el Token en Windows

Abre **PowerShell como Administrador** y ejecuta:

```powershell
setx GH_TOKEN "tu_token_aqui"
```

**Ejemplo:**
```powershell
setx GH_TOKEN "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

**⚠️ IMPORTANTE:** Después de ejecutar este comando, **cierra y vuelve a abrir** todas las ventanas de terminal/PowerShell para que el cambio tenga efecto.

### C) Verificar la Configuración

Abre una **nueva** PowerShell y verifica:

```powershell
echo $env:GH_TOKEN
```

Deberías ver tu token. Si aparece vacío, repite el paso 2.B.

---

## 🚀 Publicar tu Primera Versión

### Publicar versión 1.0.0 (primera vez)

```bash
npm run publish
```

Esto:
- ✅ Compila la aplicación
- ✅ Crea un instalador para Windows
- ✅ Crea un Release en GitHub con la versión 1.0.0
- ✅ Sube el instalador a GitHub

### Publicar Actualizaciones (versiones futuras)

1. **Cambia la versión en package.json:**
   ```json
   "version": "1.0.1",
   ```

2. **Publica:**
   ```bash
   npm run publish
   ```

## 🎯 Cómo Funciona el Sistema de Actualizaciones

1. **Usuario abre la app** → La app verifica automáticamente si hay actualizaciones
2. **Hay actualización** → Muestra notificación toast
3. **Usuario puede descargar** → Se descarga en segundo plano
4. **Usuario instala** → La app se reinicia con la nueva versión

## 🧪 Probar el Sistema

1. Publica versión 1.0.0
2. Instala la app en tu PC
3. Cambia version a 1.0.1 en package.json
4. Publica versión 1.0.1
5. Abre la app instalada (1.0.0)
6. ¡Debería detectar automáticamente la nueva versión!

## 🛠️ Comandos Útiles

```bash
# Desarrollo (no busca actualizaciones)
npm run electron:dev

# Compilar solo para Windows (sin publicar)
npm run build:win

# Publicar nueva versión en GitHub
npm run publish
```

## ❓ Solución de Problemas

### "Error: Cannot find GitHub token"
→ Verifica que configuraste el GH_TOKEN correctamente (PASO 2.B)
→ Cierra y abre una nueva terminal

### "Error: Repository not found"
→ Verifica que owner y repo en package.json sean correctos
→ Asegúrate de que el repositorio exista en GitHub

### Las actualizaciones no se detectan
→ Solo funcionan en producción (apps instaladas)
→ No funcionan en modo desarrollo

## 📚 Más Información

Para detalles técnicos completos, consulta: `INSTRUCCIONES_AUTO_UPDATE.md`
