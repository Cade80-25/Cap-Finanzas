# Cap Finanzas v1.1.8

Fecha: 22 de mayo de 2026

Esta versión refuerza la seguridad de licencias y comunicaciones, y automatiza la publicación de instaladores para Windows, macOS y Linux.

## 🔐 Sistema de licencias con tokens firmados

- **Activación verificada en servidor** mediante la nueva función `license-activate`. Cada código se valida contra la base de datos antes de habilitar la app.
- **Token HMAC-SHA256** emitido por el servidor con vigencia de 90 días. La caché local ya **no se puede falsificar** editando `localStorage`.
- **Revalidación periódica online** vía `license-verify`: si el código fue revocado, la app se bloquea en el siguiente arranque con conexión.
- **Vinculación a installation_id** estable: un mismo código no activa dos dispositivos distintos sin intervención manual.
- **Modo offline preservado**: una vez activado, podés seguir trabajando sin conexión hasta que expire el token o haya revocación.
- Eliminado el validador checksum del cliente: ya no se aceptan licencias que no estén firmadas por el servidor.

## 🛡️ Mejoras de seguridad en recordatorios por email

- **Prevención de inyección HTML**: los campos del recordatorio (título, descripción, fecha, hora) ahora se escapan antes de insertarse en el template del email.
- **Bloqueo de open-relay**: la función `schedule-reminder` exige un `licenseToken` HMAC válido ligado al `installationId`. Sin licencia activa no se pueden enviar emails desde el backend.
- **Sanitización de entrada**: títulos y descripciones se limpian de HTML antes de guardarse en la base de datos.
- Los recordatorios **locales dentro de la app** siguen funcionando para usuarios en trial; solo los emails requieren licencia.

## 🖥️ Descargables e instaladores

- **Permisos del workflow corregidos**: agregado `contents: write` en `.github/workflows/build.yml`. Esto destraba la publicación de `.exe`, `.dmg`, `.AppImage`, `.deb` y los feeds `latest*.yml` para auto-update.
- **Validación de versión** en el workflow: el tag debe coincidir con `package.json` o el build se detiene antes de publicar un release inconsistente.
- **Matriz multiplataforma** estable: Windows (NSIS x64), macOS (dmg + zip, x64 y arm64) y Linux (AppImage + deb).
- **Página `/instalar`** apuntando al release más reciente de GitHub.

## 🤖 Script de release repetible

Nuevo `scripts/release.mjs` y aliases en `package.json`:

```bash
npm run release:patch   # 1.1.8 → 1.1.9
npm run release:minor   # 1.1.8 → 1.2.0
npm run release:major   # 1.1.8 → 2.0.0
# o versión exacta:
node scripts/release.mjs 1.2.3
```

El script verifica que el repo esté limpio y en `main`, sube la versión, crea el commit `chore(release): vX.Y.Z`, el tag anotado y hace push — lo que dispara automáticamente el build y publicación de instaladores.

## 🗄️ Cambios de base de datos

Migración aplicada sobre la tabla `licenses`:

- `installation_id text` — dispositivo que activó el código.
- `activated_at timestamptz` — momento de activación.
- `last_seen_at timestamptz` — última revalidación exitosa.
- `revoked boolean default false` — permite revocar códigos desde el backend.
- Índice único parcial sobre `(code) WHERE is_used = true` para evitar doble activación.

## 📦 Cómo actualizar

- **Desktop (Windows / macOS / Linux)**: el auto-updater detecta v1.1.8 al abrir la app. También podés bajar el instalador desde `https://capfinanzas.com/#/instalar`.
- **Web / PWA**: se actualiza sola en el próximo refresh.

## 🔁 Compatibilidad

- Las licencias activadas en versiones previas seguirán funcionando: en el primer arranque con conexión, la app las migra al nuevo formato firmado.
- Los datos locales (perfiles, billeteras, transacciones) **no se tocan** durante la actualización.
