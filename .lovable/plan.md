# Plan: Licencias firmadas + descargables multiplataforma

## Parte 1 — Sistema de licencias con tokens firmados (HMAC) y revalidación

### Objetivo
Mantener la app **offline-first**, pero hacer que la activación y la revalidación periódica pasen por el servidor. La copia local pasa a ser un **caché firmado** que no puede falsificarse sin el secreto del servidor.

### Backend

1. **Migración DB** — agregar a `licenses`:
   - `installation_id text` (qué instalación activó el código)
   - `activated_at timestamptz`
   - `last_seen_at timestamptz`
   - `revoked boolean default false`
   Índice único parcial: `(code) where is_used = true` evita doble activación.

2. **Nuevo secret** `LICENSE_SIGNING_SECRET` (HMAC-SHA256). Lo agrego con `add_secret` y lo confirmás.

3. **Edge function `license-activate`** (verify_jwt=false, público):
   - Input: `{ code, installation_id }` validado con Zod.
   - Busca el código en `licenses`. Si no existe o está `revoked` → 404.
   - Si ya está usado por **otra** installation_id → 409 ("código ya activado en otro dispositivo").
   - Si está libre o ya pertenece a esta installation: marca `is_used=true`, guarda `installation_id`, `activated_at`, `last_seen_at`.
   - Emite **token firmado** con payload `{ installation_id, code, activated_at, exp: +90d, iat }` y firma HMAC-SHA256 base64url.
   - Devuelve `{ token, exp }`.

4. **Edge function `license-verify`** (público):
   - Input: `{ token, installation_id }`.
   - Verifica firma HMAC y `exp`. Si `installation_id` del payload no coincide → 401.
   - Comprueba en DB que no esté `revoked`. Si todo OK → devuelve **token renovado** (+90d) y actualiza `last_seen_at`.
   - Si está revocado → 403.

### Frontend (`useLicense.ts` + `LicenseGate.tsx`)

5. **Installation ID estable**: generar UUID v4 en primer arranque y guardarlo en `cap-finanzas-installation-id`. Persistente.

6. **Activación**: `activateLicense(code)` llama a `license-activate`. Guarda `{ token, exp, code, installation_id }` en localStorage bajo `cap-finanzas-license-token`. Solo si la llamada al servidor tiene éxito se considera activa.
   - Si no hay red → mensaje claro: "Necesitas conexión la primera vez para activar".

7. **Verificación local** en cada arranque:
   - Si hay token cacheado: verifica firma localmente NO ES POSIBLE (el secreto vive en server). En su lugar: aceptar el token si **no expiró** y `installation_id` del payload coincide. La firma es no-falsificable sin el secret, así que el caché es seguro.
   - Cliente verifica `exp` + decodifica payload (no firma) y confía mientras el server no lo revoque.

8. **Revalidación periódica online**: en `useEffect` al iniciar, si hay red intenta `license-verify`. Si el server responde 403/revoked → limpia token y bloquea. Si responde 200 → guarda token renovado. Si falla por red → sigue funcionando offline con el token cacheado mientras no expire.

9. **Trial**: igual que hoy en localStorage (no requiere backend). Mantener `mem://security/licensing-tradeoff` actualizado: el trial sigue siendo bypassable, eso se acepta. Lo que ya **no** se puede es forjar una licencia full.

10. **Eliminar el validador checksum del cliente**: ya no se acepta nada que no venga firmado por el server. Eliminar `validateLicenseCode` del cliente.

### Lo que mejora vs hoy
- Forjar `isActivated:true` en localStorage ya no sirve: el `LicenseGate` exige un token con firma válida en `exp`.
- No se pueden inventar códigos: el server consulta la tabla `licenses`.
- Un mismo código no activa dos instalaciones distintas.
- Códigos pueden revocarse desde la DB y la app lo detecta en la siguiente revalidación.

### Lo que sigue siendo trade-off (documentado)
- Un atacante con conocimientos avanzados puede parchear el JS para saltarse el gate. Eso es inherente a apps de cliente y aceptado.

---

## Parte 2 — Descargables Mac / Linux / Windows

### Diagnóstico previo
Revisar `electron-builder.yml`, `.github/workflows/build.yml`, `electron/main.cjs`, `electron/installer.nsh` y la página `/instalar` para encontrar:
- Si los assets del release de GitHub tienen los nombres que la página `Instalar.tsx` espera.
- Si el workflow está generando los tres targets (`.dmg`/`.zip` para Mac, `.AppImage`/`.deb` para Linux, `.exe` NSIS para Windows).
- Si `autoUpdater` apunta al feed correcto.
- Si hay errores típicos: firma de código faltante en Mac (quarantine), permisos `chmod +x` en AppImage, `latest.yml`/`latest-mac.yml`/`latest-linux.yml` para auto-update.

### Acciones
1. **Workflow GitHub Actions** (`.github/workflows/build.yml`): asegurar matriz `macos-latest`, `ubuntu-latest`, `windows-latest`; publicar al release con los `latest*.yml` necesarios para auto-update; subir artefactos con nombres consistentes.
2. **electron-builder.yml**: targets `dmg+zip` (mac), `nsis` (win), `AppImage+deb` (linux); `publish: github`; `artifactName` predecible.
3. **`/instalar`**: actualizar URLs de descarga al patrón del release más reciente (`https://github.com/<owner>/<repo>/releases/latest/download/<asset>`).
4. **Auto-update**: confirmar `useAutoUpdater` y `electron/main.cjs` consumen el feed de GitHub.
5. Documentar en `INSTRUCCIONES_AUTO_UPDATE.md` los nombres finales.

Nota: la firma de código real (Apple notarization, Windows codesign) requiere certificados de pago — quedará como warning conocido (Mac mostrará "app no verificada", Windows SmartScreen). Si querés que lo cubra, hace falta agregar los certs como build secrets.

---

## Detalles técnicos (resumen)

- **Firma HMAC** en edge function con `crypto.subtle.sign("HMAC", key, data)` + base64url, sin librerías.
- **Token format**: `base64url(payloadJSON).base64url(signature)` (JWT-like simplificado, sin header).
- Migración añade columnas a `licenses`, sin tocar `orders`.
- Las funciones nuevas se agregan a `supabase/config.toml` con `verify_jwt = false`.
- Para descargables: cambios solo en workflow, electron config y `Instalar.tsx`.

## ¿Avanzo?
Si aprobás, primero corro la migración (necesita tu OK), después pido el secret `LICENSE_SIGNING_SECRET`, después implemento backend + frontend, y finalmente arreglo los descargables. ¿Le damos?
