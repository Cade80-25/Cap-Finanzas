# Instrucciones para Arreglar el Ícono Cortado

El ícono aparece cortado en la barra de tareas de Windows porque no tiene suficiente margen interno.

## Solución:

### Paso 1: Crear ícono con margen

1. Abre tu imagen del búho (icon-final.png o similar)
2. En cualquier editor de imagen (Paint, Photoshop, GIMP, Canva):
   - Crea una imagen de **256x256 píxeles** con fondo transparente
   - Coloca el búho en el centro dejando **~20 píxeles de margen** en todos los lados
   - El búho debe ocupar aproximadamente 216x216 píxeles centrado

### Paso 2: Convertir a .ICO

Usa un convertidor online como:
- https://convertio.co/png-ico/
- https://icoconvert.com/

Asegúrate de incluir todos estos tamaños en el .ICO:
- 16x16
- 24x24
- 32x32
- 48x48
- 64x64
- 128x128
- 256x256

### Paso 3: Guardar el archivo

Guarda el archivo como `build/icon.ico` en la raíz del proyecto.

```
tu-proyecto/
├── build/
│   └── icon.ico    <-- Aquí
├── electron/
├── src/
└── ...
```

### Paso 4: Reconstruir

```bash
git add .
git commit -m "Ícono con margen"
git push origin main
npm run electron:build
```

## Nota Técnica

Windows usa diferentes tamaños del ícono según el contexto:
- **Barra de tareas**: 24x24 o 32x32 (dependiendo de la escala DPI)
- **Acceso directo**: 48x48 o 256x256
- **Lista de ventanas (Alt+Tab)**: 64x64 o 128x128

Si el ícono ocupa el 100% del espacio, Windows lo recorta. Por eso necesita margen.
