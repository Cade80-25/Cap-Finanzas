# Instrucciones para Convertir Cap Finanzas en Aplicación de Escritorio

## Paso 1: Conectar con GitHub (MUY FÁCIL)

1. En Lovable, haz clic en el botón **"GitHub"** en la parte superior derecha
2. Selecciona **"Connect to GitHub"**
3. Autoriza la aplicación de Lovable en GitHub (te llevará a una página de GitHub)
4. Haz clic en **"Create Repository"** en Lovable
5. ¡Listo! Tu proyecto ahora está en GitHub automáticamente

## Paso 2: Instalar Git (Si no lo tienes)

1. Ve a **https://git-scm.com/downloads**
2. Descarga Git para Windows
3. Ejecuta el instalador descargado
4. En el instalador, deja todas las opciones por defecto y haz clic en "Next" hasta terminar
5. **IMPORTANTE**: Cierra y vuelve a abrir la terminal (cmd o PowerShell) después de instalar Git

## Paso 3: Descargar el Proyecto a tu Computadora

1. Una vez conectado a GitHub, ve a tu repositorio en GitHub.com
2. Haz clic en el botón verde **"Code"**
3. Copia la URL que aparece (ejemplo: `https://github.com/Cade80-25/finanzas-divertidas-desktop.git`)
4. Abre una terminal o línea de comandos en tu computadora:
   - **Windows**: Busca "cmd" o "PowerShell" en el menú inicio
   - **Mac**: Busca "Terminal" en Spotlight
   - **Linux**: Busca "Terminal" en tus aplicaciones

5. Escribe estos comandos (reemplaza TU_URL_AQUI con la URL que copiaste, SIN comillas):

**IMPORTANTE**: NO copies las comillas. Solo los comandos.

```
git clone TU_URL_AQUI
cd finanzas-divertidas-desktop
```

**Ejemplo real con tu repositorio**:
```
git clone https://github.com/Cade80-25/finanzas-divertidas-desktop.git
cd finanzas-divertidas-desktop
```

## Paso 4: Instalar Dependencias

Copia y pega estos comandos en la terminal (uno por uno, presiona Enter después de cada uno):

**IMPORTANTE**: NO copies la palabra "bash". Solo los comandos.

```
npm install
npm install --save-dev electron electron-builder concurrently wait-on cross-env
```

## Paso 5: Modificar package.json

1. Abre el archivo `package.json` en un editor de texto (Notepad, TextEdit, o cualquier editor)
2. Busca la sección `"scripts":` y agrega estas líneas DENTRO de esa sección:

```json
"electron:dev": "concurrently \"npm run dev\" \"wait-on http://localhost:8080 && cross-env NODE_ENV=development electron .\"",
"electron:build": "npm run build && electron-builder",
"build:win": "npm run build && electron-builder --win",
"build:mac": "npm run build && electron-builder --mac",
"build:linux": "npm run build && electron-builder --linux"
```

3. Al final del archivo `package.json`, antes del último `}`, agrega esta configuración:

```json
"main": "electron/main.js",
"build": {
  "appId": "com.capfinanzas.app",
  "productName": "Cap Finanzas",
  "directories": {
    "output": "release"
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
    "icon": "public/favicon.ico"
  },
  "linux": {
    "target": ["AppImage"],
    "icon": "public/favicon.ico"
  }
}
```

## Paso 6: Probar la Aplicación en Modo Desarrollo

En la terminal, escribe (sin la palabra "bash"):

```
npm run electron:dev
```

¡La aplicación debería abrirse como una ventana de escritorio!

## Paso 7: Crear los Instaladores

### Para Windows:
```
npm run build:win
```

### Para Mac:
```
npm run build:mac
```

### Para Linux:
```
npm run build:linux
```

Los instaladores se crearán en la carpeta `release/` de tu proyecto.

## Notas Importantes:

- **Windows**: Necesitas estar en Windows para crear el instalador de Windows
- **Mac**: Necesitas estar en Mac para crear el instalador de Mac
- **Linux**: Puedes crear el instalador de Linux desde cualquier sistema operativo

## ¿Problemas?

Si algo no funciona:
1. Asegúrate de tener Node.js instalado (descárgalo de nodejs.org)
2. Asegúrate de tener Git instalado (descárgalo de git-scm.com)
3. Reinicia la terminal después de instalar Node.js o Git
4. Si hay errores, copia el mensaje de error y pregúntame

## Próximos Pasos para Comercializar:

Una vez que la aplicación funcione correctamente:
1. Probar todas las funcionalidades en la versión de escritorio
2. Configurar firma de código (code signing) para Windows y Mac
3. Crear un sitio web de descarga
4. Configurar actualizaciones automáticas
5. Definir el modelo de negocio (precio, licencias, etc.)
