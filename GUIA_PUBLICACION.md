# Guía Completa: Publicar Cap Finanzas

Esta guía te explica paso a paso cómo compilar la aplicación, publicarla en GitHub, y empezar a vender licencias.

## Índice

1. [Requisitos Previos](#1-requisitos-previos)
2. [Configurar tu Información de Pago](#2-configurar-tu-información-de-pago)
3. [Descargar el Código](#3-descargar-el-código)
4. [Compilar la Aplicación](#4-compilar-la-aplicación)
5. [Publicar en GitHub Releases](#5-publicar-en-github-releases)
6. [Configurar la Landing Page](#6-configurar-la-landing-page)
7. [Proceso de Venta](#7-proceso-de-venta)

---

## 1. Requisitos Previos

Antes de empezar, necesitas tener instalado:

### Windows
- **Node.js 18+**: Descarga de [nodejs.org](https://nodejs.org)
- **Git**: Descarga de [git-scm.com](https://git-scm.com/download/win)

### Verificar instalación
Abre una terminal (cmd o PowerShell) y ejecuta:
```bash
node --version   # Debe mostrar v18 o superior
npm --version    # Debe mostrar 9 o superior
git --version    # Debe mostrar git version 2.x
```

---

## 2. Configurar tu Información de Pago

### En el archivo `src/components/PurchaseDialog.tsx`:

Busca estas líneas (cerca de la línea 43):
```typescript
const paypalEmail = "tu-email@paypal.com"; // TODO: Cambiar por email real
const paypalLink = `https://paypal.me/tuusuario`; // TODO: Cambiar por link real
```

Cámbialas por tus datos reales de PayPal:
```typescript
const paypalEmail = "tu-email-real@gmail.com";
const paypalLink = "https://paypal.me/TuUsuarioPayPal";
```

### En el archivo `src/pages/LandingPage.tsx`:

Busca y actualiza:
```typescript
const downloadUrl = "https://github.com/TU_USUARIO/cap-finanzas/releases/latest/download/Cap-Finanzas-Setup.exe";
```

También actualiza los links de GitHub y el email de soporte en el footer.

---

## 3. Descargar el Código

### Opción A: Desde Lovable (Recomendado)

1. En Lovable, conecta tu proyecto a GitHub (botón GitHub arriba a la derecha)
2. Crea un repositorio nuevo
3. En tu terminal:
```bash
git clone https://github.com/TU_USUARIO/TU_REPO.git
cd TU_REPO
```

### Opción B: Descargar ZIP
1. En Lovable, ve a la pestaña de código
2. Descarga como ZIP
3. Extrae en una carpeta

---

## 4. Compilar la Aplicación

### Instalar dependencias
```bash
npm install
```

### Probar en modo desarrollo
```bash
npm run electron:dev
```
Esto abrirá la aplicación para que puedas probar que todo funciona.

### Compilar el instalador para Windows
```bash
npm run build:win
```

El instalador se creará en:
```
release/Cap Finanzas Setup X.X.X.exe
```

### Notas importantes:
- El archivo pesará aproximadamente 80-120 MB
- Si ves errores de firma de código, puedes ignorarlos por ahora (solo es necesario para distribución en tiendas)

---

## 5. Publicar en GitHub Releases

### Crear un Release

1. Ve a tu repositorio en GitHub.com
2. Click en **"Releases"** (lado derecho)
3. Click en **"Create a new release"**
4. Configura:
   - **Tag**: `v1.0.0`
   - **Title**: `Cap Finanzas v1.0.0`
   - **Description**:
   ```markdown
   ## Primera versión de Cap Finanzas
   
   ### Incluye:
   - Modo Finanzas Simples ($5)
   - Modo Contabilidad Completa ($10)
   - 30 días de prueba gratis
   - 100% offline
   
   ### Instalación:
   1. Descarga `Cap-Finanzas-Setup-1.0.0.exe`
   2. Ejecuta el instalador
   3. ¡Listo!
   ```
5. Arrastra el archivo `.exe` de la carpeta `release/`
6. Click en **"Publish release"**

### URL de descarga
Tu archivo estará disponible en:
```
https://github.com/TU_USUARIO/TU_REPO/releases/latest/download/Cap-Finanzas-Setup-1.0.0.exe
```

---

## 6. Configurar la Landing Page

### Opción A: Publicar con Lovable

1. En Lovable, haz click en **"Publish"**
2. Tu landing page estará disponible en `tu-proyecto.lovable.app`
3. Puedes conectar un dominio personalizado en Settings > Domains

### Opción B: Alojar en GitHub Pages

1. En tu repo de GitHub, ve a Settings > Pages
2. Selecciona la rama `main` y carpeta `/ (root)`
3. Tu sitio estará en `tu-usuario.github.io/tu-repo`

---

## 7. Proceso de Venta

### Flujo completo:

```
Cliente ve landing → Descarga gratis → Usa 30 días →
Paga por PayPal → Tú generas código → Lo envías por email →
Cliente activa → ¡Licencia permanente!
```

### Paso a paso:

1. **Cliente paga por PayPal**
   - Recibes notificación de pago
   - El cliente debe incluir su email en la nota

2. **Generas el código de licencia**
   - Ve a `/license-generator` en la app (ruta oculta para admin)
   - Selecciona el tipo de licencia (Simple $5 o Completa $10)
   - Genera el código

3. **Envías el código por email**
   - Copia el código generado
   - Envía al cliente con instrucciones

### Template de email:

```
Asunto: Tu licencia de Cap Finanzas

¡Hola!

Gracias por tu compra de Cap Finanzas.

Tu código de licencia es:
CF-TRAD-XXXX-XXXXX

Para activar:
1. Abre Cap Finanzas
2. Ve a Configuración > Licencia
3. Click en "Activar con código"
4. Ingresa el código

¿Dudas? Responde a este correo.

¡Gracias!
```

---

## Extras

### Acceso al Generador de Licencias

El generador está en una ruta separada que puedes acceder:
- En desarrollo: `http://localhost:8080/license-generator`
- En la app de escritorio: desde el menú de desarrollo (Ctrl+Shift+I)

### Actualizar versiones

Para publicar una nueva versión:
1. Cambia la versión en `package.json`
2. Compila: `npm run build:win`
3. Crea un nuevo Release en GitHub
4. Los usuarios pueden descargar la nueva versión

### Firma de código (Opcional)

Para eliminar la advertencia "Editor desconocido" de Windows:
1. Obtén un certificado de firma de código (~$100-300/año)
2. Configura en `electron-builder.yml`:
```yaml
win:
  certificateFile: path/to/cert.pfx
  certificatePassword: ${env.WIN_CSC_KEY_PASSWORD}
```

---

## ¿Problemas?

### Error "ENOENT: no such file or directory"
Solución: Ejecuta `npm install` de nuevo

### Error al compilar en Windows
Solución: Instala las herramientas de compilación:
```bash
npm install --global windows-build-tools
```

### La app no abre después de instalar
Solución: Verifica que el antivirus no esté bloqueando la aplicación

---

¡Listo! Ahora tienes todo lo necesario para vender Cap Finanzas.
