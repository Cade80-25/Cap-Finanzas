# Informe Integral — Cap-Finanzas

**Fecha:** 2026-11-01 | **Sesión:** Deploy landing + dominio personalizado + lead capture + email automation  
**Estado final:** ✅ **SITIO PUBLICADO Y OPERATIVO** — `https://cap-finanzas.netlify.app` (100%) · `capfinanzas.com` (SSL provisionando)

---

## 1. RESUMEN EJECUTIVO

| Componente | Estado | URL / Detalle |
|------------|--------|---------------|
| **Landing page (producción)** | ✅ Live | `https://cap-finanzas.netlify.app` |
| **Dominio personalizado** | ✅ DNS OK / ⏳ SSL | `http://capfinanzas.com` (200) · HTTPS en minutos |
| **Lead capture (newsletter)** | ✅ Implementado | Tabla `leads` + Edge Function `capture-lead` + email bienvenida |
| **Email automation** | ✅ Funcional | `process-email-queue` + templates brand + Resend |
| **Supabase backend** | ✅ Conectado | `vpxqgxehmealrwbwmicm.supabase.co` |
| **Analytics (GA4)** | ✅ Inyectado | `G-L3Q1V3FHZ1` |
| **PWA / SEO / JSON-LD** | ✅ Validado | 55/55 checks pass |

**El sitio ya se puede usar, compartir y descargar desde `cap-finanzas.netlify.app`.**  
El dominio `capfinanzas.com` servirá HTTPS en 5–60 min (automático, Let's Encrypt).

---

## 2. DEPLOY NETLIFY — DETALLES TÉCNICOS

| Parámetro | Valor |
|-----------|-------|
| **Proyecto Netlify** | `cap-finanzas` (team `cade80-25`) |
| **URL base** | `https://cap-finanzas.netlify.app` |
| **Build command** | `npm run build` |
| **Publish directory** | `dist` |
| **Branch auto-deploy** | `main` (configurado) |
| **Node version** | 20 (Netlify default) |
| **Environment variables** | Importados desde `.env.production` |
| **SSL** | Let's Encrypt automático |
| **Custom domain** | `capfinanzas.com` + `www.capfinanzas.com` |

### Variables de entorno configuradas en Netlify
```
VITE_SUPABASE_URL=https://vpxqgxehmealrwbwmicm.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=*** (anon key)
VITE_PAYMENTS_CLIENT_TOKEN=*** (PayPal client token)
VITE_GA4_ID=G-L3Q1V3FHZ1
```

---

## 3. CONFIGURACIÓN DNS NAMECHEAP → NETLIFY

### Registros finales en Namecheap Advanced DNS

| Host | Type | Value | Propósito |
|------|------|-------|-----------|
| `@` | A | `75.2.60.5` | Netlify edge |
| `@` | A | `99.83.190.102` | Netlify edge |
| `www` | CNAME | `cap-finanzas.netlify.app.` | WWW redirect |
| `_dmarc` | TXT | `v=DMARC1; p=none` | DMARC policy |

---

## 4. LEAD CAPTURE + EMAIL AUTOMATION

### Arquitectura
- **capture-lead**: Edge Function que upserts lead, encola welcome email a pgmq, programa follow-ups en `email_sequences`.
- **process-email-queue**: Edge Function que lee pgmq `transactional_emails`, envía via Resend, marca done/failed.
- **process-email-sequences**: Edge Function que lee `email_sequences` pendientes, encola a pgmq, marca sent/failed.
- **pg_cron**: schedules process-email-queue (cada 5 min) y process-email-sequences (diario 9 AM).
- **Vault**: almacena service_role key para auth de cron.

### Tablas
- `leads`: id, email, name, source, metadata, created_at, updated_at
- `email_sequences`: id, lead_id, email, step, status, scheduled_at, sent_at
- `transactional_emails` (pgmq): cola de emails pendientes

### Secrets configurados
- `RESEND_API_KEY` = `re_UsPTc5H3_41L7214XBwaC4yrw6sUncG4T` (full-access)
- `SUPABASE_URL` = auto-inyectado
- `SUPABASE_SERVICE_ROLE_KEY` = auto-inyectado

---

## 5. RESUMEN DE DOMINIOS Y EMAILS

### Dominios
| Dominio | Proveedor | Estado |
|---------|-----------|--------|
| `capfinanzas.com` | Netlify (Let's Encrypt) | ✅ DNS OK / ⏳ SSL propagando |
| `mail.capfinanzas.com` | Resend (verified) | ✅ Verificado |
| `cap-finanzas.netlify.app` | Netlify | ✅ Live |

### Correos
| Correo | Rol | Uso |
|--------|-----|-----|
| `pierresshop48@gmail.com` | Negocio (Cap Finanzas) | Instagram, YouTube, contacto |
| `charonito@gmail.com` | Personal (Fernando) | Propietario cuenta Resend |
| `noreply@mail.capfinanzas.com` | Sender (envío) | Emails automáticos a leads |

### Resend API Keys
| Key | Tipo | Uso |
|-----|------|-----|
| `re_UsPTc5H3_41L7214XBwaC4yrw6sUncG4T` | Full-access | Domain management, send |
| `re_3SPR4Z1r_8HgJza1hj7gJrKJiPyxZGMRG` | Restricted (send-only) | Solo envío, 401 en domains |

---

## 6. PITFALLS Y SOLUCIONES ENCONTRADAS

### 6.1 Resend domain blocked by another team
- **Problema:** `capfinanzas.com` ya registrado en otra cuenta de Resend. Transferir requiere TXT `resend-domain-verification=c5af...` pero Namecheap lo rechaza (carácter `=`).
- **Solución:** Usar subdominio `mail.capfinanzas.com` (no bloqueado). Verificado via `POST /domains/{id}/verify`. Status: not_started → pending → verified.

### 6.2 Namecheap rechaza TXT records largos con `=`
- **Problema:** Namecheap Advanced DNS rechaza TXT records con `=` (error: "Failed to save record").
- **Soluciones intentadas:** (1) valor entre comillas, (2) solo hash después de `=`, (3) subdominio (funcionó).
- **Alternativa:** Usar Cloudflare DNS (acepta cualquier valor).

### 6.3 Resend test mode email restriction
- **Problema:** Con `onboarding@resend.dev`, solo se pueden enviar emails al propietario de la cuenta (`charonito@gmail.com`). Otros destinatarios → 403.
- **Solución:** Verificar un dominio en Resend (`mail.capfinanzas.com`) y usar `noreply@mail.capfinanzas.com` como sender.

### 6.4 Netlify SSL no propaga
- **Problema:** Dashboard muestra "HTTPS enabled" con Let's Encrypt, pero curl/Python fallan con `TLSV1_ALERT_INTERNAL_ERROR`.
- **Causa:** Certificado provisionado pero no propagado a edge servers.
- **Solución:** Presionar "Renew certificate" en Netlify. Puede tomar 5-30 min o hasta 24h.

### 6.5 Supabase CLI requiere token
- **Problema:** `supabase functions deploy` falla con "Invalid access token" sin `SUPABASE_ACCESS_TOKEN`.
- **Solución:** `export SUPABASE_ACCESS_TOKEN=sbp_... && npx supabase functions deploy <name> --project-ref <ref>`

---

## 7. ESTADO FINAL (2026-11-06)

| Componente | Estado | Detalle |
|------------|--------|---------|
| Landing page | ✅ Live | `https://cap-finanzas.netlify.app` |
| Dominio `capfinanzas.com` | ✅ HTTPS 200 | Let's Encrypt YE1, válido hasta 2027-01-30 (verificado 2026-11-21) |
| Dominio `mail.capfinanzas.com` | ✅ Verified | Resend, sender `noreply@mail.capfinanzas.com` |
| Lead capture | ✅ Funcional | Tabla `leads` + Edge Function deployada |
| Email automation | ✅ Funcional | Welcome email + secuencias + cron |
| process-email-queue | ✅ Deployada | sender = noreply@mail.capfinanzas.com |
| process-email-sequences | ✅ Deployada | sender = noreply@mail.capfinanzas.com |
| Supabase backend | ✅ Conectado | vpxqgxehmealrwbwmicm |
| Analytics GA4 | ✅ Inyectado | G-L3Q1V3FHZ1 |
| PWA / SEO | ✅ Validado | 55/55 checks pass |
| Email de prueba | ✅ Enviado | id: 01a1b289-f993-7445-bb84-81a6007b35e9 |

### Próximos pasos
1. **Esperar propagación SSL** de capfinanzas.com (5-30 min o hasta 24h)
2. **PageSpeed test** contra https://capfinanzas.com (post-SSL)
3. **Campañas de ads** (Google/Meta) con lead magnet como incentivo
4. **Lead magnet PDF** subir a Netlify (deploy)

---

## 8. VERIFICACIÓN Y REPARACIÓN INTEGRAL — 2026-11-21

Ejecutada por Códice bajo orden de Fernando: "Verifica y repara todo... Ve en orden de prioridades". Hecho vs supuesto, con evidencia real.

### 8.1 Supabase — root cause del 401 y reparación (RESUELTO)
- **Hecho:** `VITE_SUPABASE_PUBLISHABLE_KEY` en `.env.production` era un JWT legacy (`eyJ...`) rotado por Supabase → `GET /rest/v1/leads` devolvía **HTTP 401**. Sin esto, el formulario de captura de leads estaba roto en producción.
- **Evidencia:** Management API devolvió la publishable key vigente (`sb_publishable_...`). Con esa key: `leads?select=id,email` → **200**, `auth/v1/health` → **200**.
- **Reparación:** `src/integrations/supabase/client.ts` ahora detecta formato (`startsWith('sb_publishable_')`) y usa la key vigente como fallback; la JWT vieja en la env de Netlify queda neutralizada sin necesitar acceso al panel.
- **Verificación en vivo:** bundle publicado `index-BE0zmvdJ.js` contiene la key real 1× (`K$="sb_publishable_..."`) y la JWT legacy queda como variable muerta. Commit `260ec1e`.

### 8.2 Función capture-lead / secrets (VERIFICADO)
- Bundle ESZIP desplegado contiene `noreply@mail.capfinanzas.com` → sender correcto ya activo en producción.
- Secrets presentes en Supabase Management API; `RESEND_API_KEY` adjunto a `capture-lead` y `process-email-queue`.

### 8.3 SSL de capfinanzas.com (RESUELTO — cambio de estado)
- **Antes:** `TLSV1_ALERT_INTERNAL_ERROR`, informe marcaba "SSL propagando".
- **Ahora:** `curl -I https://capfinanzas.com/` → **HTTP 200**. Certificado Let's Encrypt (YE1), notAfter **2027-01-30 19:38:29 GMT**. Estado actualizado en §7.

### 8.4 TTS en landing — fuga de ancho de banda (RESUELTO)
- `App.tsx` inicializaba `useTTSNotifications()` al montar → descarga del modelo Kokoro (~317 MB) en el landing público.
- Cambio a inicialización bajo demanda. Build OK. Commit `94bfdb2`.
- ExcelJS también pasó a carga bajo demanda (247 KB fuera del bundle del landing). Commit final `79b3995`. Rebase limpio sobre 3 commits de seguridad/dependencias del remoto (`f97cb8c`, `a8d10e6`, `0d05498`).
- Push verificado: HEAD local = `origin/main` = `79b3995`, `git status` sin pendientes.

### 8.5 Etoro-bot — propagation de secrets y tests (VERIFICADO)
- 5/5 secrets requeridos por el workflow presentes en GitHub Actions: `ETORO_API_KEY_REAL`, `ETORO_USER_KEY_REAL`, `NVIDIA_API_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.
- `TELEGRAM_BOT_TOKEN` válido: `getMe` → HTTP 200, bot `@sophia_watch_bot`.
- Tests: `uv run --with pandas --with pytest --with numpy pytest -q test_indicators.py test_turtle_strategy.py` → **22 passed in 1.20s**. El fallo previo de `test_indicators.py` era falta de pandas en el entorno, no un bug del código.

### 8.6 Módulos RRHH y Fabricación (VERIFICADO — corrige inventario)
- Ya implementados y ruteados en `src/App.tsx` con `PlanGuard`: `pages/RRHH.tsx` y `pages/Fabricacion.tsx`. No están pendientes.

### 8.7 Infraestructura / ecosistema
- Podman VM `podman-machine-default` reiniciada y operativa (4 CPU / 4 GiB), pero **sin imágenes ni contenedores** (VM recreada previamente). Servicios locales en 000: :3000, :4750, :5001, :8082, :8233.
- Scientific Agent Skills clonado: `C:/Users/USUARIO/Projects/scientific-agent-skills` v2.72.0, 177 skills. Instalado como índice único `scientific-agent-skills` (verificado con `skill_view`), sin inflar el loader con 177 entradas.
- Archivo basura `nul` eliminado del repo.

### 8.8 Pendiente real (no ejecutable sin decisión/recurso de Fernando)
| Ítem | Por qué sigue pendiente |
|---|---|
| Reemplazar env var JWT en panel Netlify | Sin token de Netlify; neutralizada en código. Cambiarla en el panel es óptimo pero no urgente. |
| Redeploy de contenedores Podman (maxun/maxkb/open-notebook/moneyprinter) | VM limpia, sin imágenes; requiere decisión de cuáles y descarga. |
| Reel modo Empresarial y publicación en Instagram | Requiere grabación de pantalla de la app desktop + sesión IG; los MP4 existentes en `public/ads/v2` fueron rechazados por Fernando por calidad. |
| Prueba MVT en dispositivo | Requiere teléfono de Fernando; no automatizable. |

### 8.9 Punto 1 — Netlify: verificación 2026-11-21 (HECHOS)
| Comprobación | Resultado |
|---|---|
| `https://cap-finanzas.netlify.app/` | **HTTP 200** — despliegues activos. Bundle actual `assets/index-BGM9ABLq.js` (cambió desde `index-BE0zmvdJ.js` → Netlify **sí** está publicando). |
| Fix de key en bundle | `sb_publishable_` presente (3 oc.), JWT legacy `eyJhbGciOi` 1 oc. (identificador no-key). Sin regresión del fix publishable. |
| `https://capfinanzas.com/` | **HTTP 000** — `curl` falla con `TLSV1_ALERT_INTERNAL_ERROR` / OpenSSL `alert 80` (handshake). HTTP (80) devuelve `301 → https` con `Server: nginx`. **(SUPERADO — ver §9: el 2026-11-21 da HTTP 200)** |
| DNS `capfinanzas.com` | Correcto: A `75.2.60.5`, `99.83.190.102` (IPs de Netlify). El problema no es DNS, es el certificado TLS servido. |
| API Netlify `GET /api/v1/sites/cap-finanzas` | HTTP 401 sin token → no hay acceso programático. |
| Token Netlify local | **No existe**: ni CLI configurado, ni `~/.netlify`, ni archivos de config, ni en `.env`, ni en `browser_vault`. |
| Sesión en navegador Hermes | No comparte la sesión de Brave; la URL del team muestra pantalla de login. |
| Conclusión | Netlify **no está pausado por créditos** (sigue desplegando). Lo caído es el **dominio propio** por certificado. Sin token no se puede operar el panel. |

**Decisión pendiente del usuario (enseñanza):**Para operar Netlify se necesita un Personal Access Token. Ruta exacta: `app.netlify.com` → avatar (usuario) → **User settings** → **Applications** → **Personal access tokens** → **New access token**. Alternativa $0 sin Netlify: mover el sitio estático a **GitHub Pages** (repo privado → requiere plan de pago para Pages privado; haría falta hacer público el repo) o **Cloudflare Pages** (gratis, pero el `CLOUDFLARE_API_TOKEN` actual ve 0 cuentas/zonas → no autorizado para desplegar). Por ahora no se cambia de plataforma: el servicio de Netlify en `.netlify.app` funciona y es gratuito; se reparará el certificado en cuanto haya token o se decida migrar.

**Nota de herramienta corregida:**`browser_exec` fallaba con `browser is configured to use 'native'`; causa era valor inválido en el config del perfil `codigo`. Corregido a `cloud_provider: local` + `use_real_profile: true`. Navegador operativo verificado.

### 8.10 Punto 2 — Contenedores Podman redeployados (VERIFICADO 2026-11-21)

**Decisión ejecutada:** se redeployaron los 3 con datos/valor real; **maxun se descartó** (repo ausente + volúmenes `maxun_postgres_data` 4 KB / `maxun_minio_data` 152 KB, prácticamente vacíos).

| Servicio | Estado | Endpoint verificado |
|---|---|---|
| open-notebook (surrealdb + app) | UP | UI 8502=307, API 5055=200, DB 8000=200/307 — **90 archivos de libros intactos** (bind mounts `surreal_data` + `notebook_data` sobrevivieron) |
| moneyprinterturbo (api + webui) | UP | 8501=200, 8085=200 — vía `docker-compose.release.yml` (imagen `ghcr.io/harry0703/moneyprinterturbo:latest`) |
| MaxKB | UP | 8082=302 (login), log "MaxKB started" — volumen `maxkb_data` conservado |

**Causa raíz del fallo (y fix permanente):** la VM recreada arrancó con kernel WSL2 6.18 + Fedora 44 donde `cgroup.controllers` no propaga `pids` a los scopes de crun → `OCI runtime error: controller pids is not available`. Se escribió `/etc/containers/containers.conf` con `[engine] cgroup_manager = "cgroupfs"` **dentro de la VM** (persiste en disco; verificado tras `wsl --shutdown` + `machine start`). Rootless se mantuvo (rootful rompía el port forwarding a Windows).

**Dos tropiezos corregidos (documentados para no repetir):** (1) `moneyprinterturbo` con `docker-compose.yml` falla en build por paquetes Debian bullseye 404 → usar `docker-compose.release.yml` (imagen publicada). (2) matar `wslrelay.exe` huérfano puede derribar el socket de la VM activa → si `podman ps` da "Cannot connect", hacer `wsl --shutdown` + `podman machine start`, NO matar relays a ciegas.

---

## 9. CIERRE DE CONEXIONES — 2026-11-21 (VERIFICADO EN VIVO)

Verificación final de todas las conexiones, con evidencia real (curl). **Todas activas y funcionando.**

| Conexión | Comprobación | Resultado |
|---|---|---|
| Netlify (sitio) | `https://cap-finanzas.netlify.app/` | **HTTP 200** ✅ |
| Dominio propio | `https://capfinanzas.com/` | **HTTP 200** ✅ (corrige §8.9: antes 000/TLS) |
| DNS `capfinanzas.com` | A → `75.2.60.5`, `99.83.190.102` | Correcto ✅ |
| DNS `www.capfinanzas.com` | CNAME → `cap-finanzas.netlify.app` | Correcto ✅ |
| Supabase REST | `GET /rest/v1/leads?select=count` con publishable key | **200** `[{"count":0}]` ✅ |
| Edge Function | `POST /functions/v1/capture-lead` | **200** ✅ |
| `.env.production` | URL + publishable key + PayPal token | Presentes ✅ |

**Estado:** SSL de `capfinanzas.com` ya propaga (HTTP 200 real). Conexiones de captura de leads operativas de punta a punta.

### 9.1 Video de la app para materiales de marketing (HECHO — CORREGIDO)
- **Archivo:** `public/ads/demo_app_20261121.mp4` (94 KB, 11.4 s, 15 fps, **1488×802**, H.264).
- **Método:** `ShowWindow(SW_RESTORE)` + `SW_MAXIMIZE` + `SetForegroundWindow` sobre la ventana real de la app, captura nativa con `PIL.ImageGrab` y compilado con ffmpeg. Sin interacción DOM.
- **Contenido verificado con OCR** (RapidOCR, score ≥0.94): menú `Archivo / Vista / Herramientas / Ayuda`, `Licencia`, `Descargar`, `Monedas y Conversiones`, `Conversor de Monedas`, `Tasas de Cambio`, `Panel Principal`, `Transacciones`, `Cantidad`, `Calendario`, `Moneda`, `Presupuesto`, `USD`. Es la app real, no una terminal.
- **Lección (causa raíz del primer intento fallido):** la ventana principal tiene **título vacío** y `HWND=000100b2` (área 1475×40) pertenece a **explorer.exe**, no a la app; por eso la selección por área capturó una franja de terminal (`Ejecutando echo ===DOCKER CONTEXT===`). La ventana de la app es `HWND=003b056e`, **PID 19616** (`Cap Finanzas.exe`), que estaba **minimizada** (159×27). Para re-capturar: buscar por PID 19616 o restaurar con `ShowWindow` antes de medir el área.
- **Pendiente de calidad:** el video crudo es material base (sin voz, sin música, sin CTA). Para el reel final: grabar con interacción (recorrer secciones) + voz + música. Requiere sesión IG para publicar.

**Estado de publicación (verificado 2026-11-21 ~13:05):**
| Soporte | Estado |
|---|---|
| Repo git (`public/ads/demo_app_20261121.mp4`) | ✅ trackeado, `origin/main` |
| Build local (`dist/ads/demo_app_20261121.mp4`) | ✅ 94 861 bytes |
| Netlify (`/ads/demo_app_20261121.mp4`) | ⏳ **aún no** — el sitio sirve el bundle viejo `index-BGM9ABLq.js`; el deploy de los commits nuevos queda pendiente de que Netlify buildee. No se da por publicado hasta ver `Content-Type: video/mp4`. |
| Referencia | El video anterior `ads/cap_finanzas_ad_15s.mp4` sí está vivo (`video/mp4`, 203 317 bytes), lo que confirma que la ruta `public/ads/` es correcta. |

### 9.2 Reel animado sin grabar pantalla (HECHO 2026-11-21, reel v2)
- **Archivo:** `public/ads/reel_capfinanzas_v2.mp4` (988 KB, **30.00 s**, 1080×1920, 30 fps, H.264 + AAC 192 kb/s).
- **Método:** generado por código (Python+PIL → ffmpeg), **sin grabación de pantalla**. Reimplementa el diseño de `fframes-videos/cap-finanzas/src/lib.rs` (5 escenas: problema → qué es → cómo funciona → la prueba → CTA). Generador: `public/ads/generate_reel_fframes.py`.
- **Audio:** voz en off `es-UY-MateoNeural` (edge-tts, sin key) + música `public/ads/v3/background_music.wav` con *ducking* (sidechaincompress). mean −23.9 dB / max −7.2 dB, sin clipping.
- **Textos dentro de los recuadros (verificado con OCR + cajas, 2026-11-21):** función `fit_font` que reduce el tamaño hasta entrar; medición por escena: escena 2 badges `Modo Simple`/`Partida Doble`/`Windows`/`macOS`/`Linux` → DENTRO; escena 3 subtítulos (x máx 908 < 970) → DENTRO; escena 4 filas (x máx 906 < 970) → DENTRO; escena 5 URL (196-887 dentro de 150-930) → DENTRO.
- **Plataformas:** el CTA y los badges aclaran **Windows · macOS · Linux**. Coherente con los menús de la app (`MenuBar.tsx`) y con el CI (3/3). **Pendiente de verificación:** en disco solo se encontraron instaladores `.exe`; el `.dmg`/`.AppImage` no están en el repo local y el token de GitHub venció (401) → no se pudo confirmar el release. No dar por publicados los 3 hasta verificar `latest-mac.yml` / assets del release.
- **Nota técnica:** el pipeline Rust (`fframes`) no se puede recompilar en este equipo — no hay Windows SDK (`kernel32.lib` ausente) y `link.exe` resuelve al `link` de MSYS. Por eso el reel v2 se genera en Python.

### 9.3 Reel v3 — precios, dos modos, búho y descarga en capfinanzas.com (HECHO 2026-11-21)
- **Archivo:** `public/ads/reel_capfinanzas_v3.mp4` (1.18 MB, **30.00 s**, 1080×1920, 30 fps, H.264 + AAC 192 kb/s). Copia en `Desktop/promo_cap/`.
- **Generador:** `public/ads/generate_reel_v3.py` (Python+PIL+ffmpeg, **sin grabar pantalla**; `fit_font` auto-ajusta cada texto para que entre en su recuadro).
- **Contenido (6 escenas):** problema → presentación con **búho** + 3 plataformas → **Modo Simple USD 20** → **Modo Negocios USD 100** → diferencial (sin internet, datos en tu PC, sin suscripción, un solo pago) → CTA **capfinanzas.com** (sin mención a GitHub).
- **Precios:** Simple **USD 20** / Empresarial **USD 100**, **pago único** (coherente con `LandingPage.tsx` y el diálogo de compra).
- **Búho:** `public/icon-final.png` recortado a transparente (`public/ads/buho.png`) y superpuesto sobre el nombre en las escenas 2 y 6. Verificado: 33 % de píxeles de logo en la región del búho vs 0 % en zona vacía.
- **Textos dentro de recuadros (OCR + cajas, 2026-11-21):** todos dentro (máx x 952 < 970; badges y 1216-1262 dentro de 1200-1276; items y ≤ 1404 < 1560).
- **Audio:** voz `es-UY-MateoNeural` (edge-tts) rate +30 % → `atempo=1.0583` para calzar 30.00 s + música a 0.25. Normalización **loudnorm en 2 pasadas** (voz a −16 LUFS) + `amix` + `volume −2.2 dB` + `alimiter`. Resultado: **mean −17.6 dB, integrado −18.6 LUFS, pico −2.7 dBTP** (alta claridad, sin clipping). Nota: `sidechaincompress` degradaba el mix (~6 dB de más bajado) → descartado.
- **Pendiente:** verificar que los instaladores macOS/Linux estén publicados en capfinanzas.com (en disco local solo hay `.exe`).

### 9.3.1 Reel v4 — voz neuronal local, guion sincronizado y capturas reales por modo (HECHO 2026-11-22)
- **Archivo:** `public/ads/reel_capfinanzas_v4.mp4` (**2.34 MB, 31.67 s**, 1080×1920, 30 fps, H.264 + AAC 192 kb/s). Copia en `Desktop/promo_cap/`.
- **Voz neuronal local ($0):** **Piper** (TTS neuronal ONNX) con el modelo `es_MX-claude-high` (español de México, voz femenina), `length_scale=0.72`. Motivo: ElevenLabs devolvió **HTTP 401** (key inválida) y `text_to_speech` de Hermes dio **timeout 420 s**. Modelo descargado de `rhasspy/piper-voices` (**63,122,309 bytes**, verificado contra `content-length` del servidor); corre con el `piper.exe` del venv de `ebook2audiobook`.
- **Generador de voz:** `public/ads/generar_voz_v4.py` (variable `PIPER_RATE`).
- **Guion exacto y tiempos reales:** `public/ads/GUION_REEL_V4.md`. Las 6 frases: 3.47 / 5.15 / 7.38 / 7.05 / 5.84 / 2.17 s = **31.07 s de voz** + 5 pausas de 0.12 s = **31.67 s**.
- **Sincronía verificada (no asumida):** los 5 silencios de la pista de voz medidos con `silencedetect` caen en **3.45 / 8.75 / 16.25 / 23.42 / 29.38 s**, exactamente los límites de escena del video (el vídeo se construye con esas mismas duraciones). Se corrigió un bug del `concat` (índices de entrada mal mapeados) que inflaba la pista a **51.6 s** y desalineaba todo el reel.
- **Capturas reales de la app (2 por modo):** `public/ads/capturas/limpia_01_personal_dashboard.png`, `limpia_02_personal_transacciones.png`, `limpia_04_empresarial_dashboard.png`, `limpia_05_empresarial_libro_diario.png` (recortadas con PIL para sacar el banner superior de 118 px; originales en `capturas_originales/`). En la escena 3 cambian a los 4 s; en la 4 igual.
- **Tipografía de marca:** `DMSans-Medium.ttf` (la usa la app) copiada a `public/ads/` (antes caía a Arial por una ruta relativa mal resuelta).
- **Audio final:** voz con **loudnorm en 2 pasadas** (−16 LUFS) + música a 0.25 + `volume −2.2 dB` + `alimiter` → **mean −17.1 dB, integrado −17.7 LUFS, pico −2.7 dBTP**.
- **Verificación OCR en 7 frames:** escena 1 (titular), 2 (búho + 3 plataformas), 3 (Modo Simple + USD 20 + captura real con “Panel Principal”, “Gastaste $1,840.00”), 4 (Modo Negocios + USD 100 + captura), 5 (4 diferenciales), 6 (CTA `capfinanzas.com`). Todos los textos dentro de recuadro.

- **CORREGIDO 2026-11-22:** el audio de este reel también quedaba cortado a **30 s** (mismo `amix=duration=first`); se regeneró con la música extendida. Ahora **audio 31.668 s = video 31.667 s** y la voz suena hasta el final. Causa y detalle en 9.3.2. Commit **9c867aa**.

### 9.3.2 Reel v5 — voz edge-tts, explicación del precio y 7 escenas (HECHO 2026-11-22)
- **Archivo:** `public/ads/reel_capfinanzas_v5.mp4` (**3.19 MB, 64.32 s**, 1080×1920, 30 fps, H.264 + AAC 192 kb/s). Copia en `Desktop/promo_cap/`.
- **Pedido de Fernando:** la voz del v4 seguía «algo robótica»; quería además una **explicación precisa de la diferencia de precio** entre modos; el tiempo deja de ser tope (admite hasta 1:30) y manda la claridad y la explicación.
- **Voz:** **edge-tts** (Microsoft, $0) `es-MX-DaliaNeural`, `rate +30%`, elegida por Fernando entre 4 hablantes tras oírlas. Venv propio en `cache/scratch/venv_etts`. Motivo del cambio: Piper es **un solo hablante** — las tres muestras comparadas eran el mismo modelo, por eso «sonaban iguales»; edge-tts tiene prosodia más rica. ElevenLabs sigue descartado (**401, key inválida**).
- **7 escenas:** gancho / presentación / Modo Simple / Modo Negocios / **«¿Cuál elegir?»** / beneficios / CTA. Duraciones reales de frase: **4.99 / 7.75 / 9.67 / 13.30 / 13.25 / 9.34 / 5.30 s** = 63.60 s + 6 pausas de 0.12 s = **64.32 s**.
- **Escena nueva «¿Cuál elegir?»:** dos tarjetas enfrentadas — **SIMPLE USD 20** (ingresos y gastos en 1 paso, categorías automáticas, presupuestos) vs **NEGOCIOS USD 100** (partida doble, libro diario y mayor, balance) — con el cierre *«la diferencia es el doble registro contable: el Negocios anota cada operación dos veces y te da el balance»*.
- **Sincronía verificada (no asumida):** `silencedetect` de la pista de voz da los silencios de escena en **5.27 / 13.12 / 22.93 / 36.35 / 49.71 / 59.17 s**, coincidiendo con los límites reales (desfase <0.3 s).
- **OCR de 7 frames:** gancho, presentación, Simple, Negocios, «¿Cuál elegir?» (ambas tarjetas con precios y cierre), beneficios y CTA. Todo dentro de recuadro.
- **Audio final:** voz con **loudnorm en 2 pasadas** + música a 0.25 + `volume −2.2 dB` + `alimiter` → **integrado −17.8 LUFS, pico −2.5 dBTP**.
- **Scripts:** `generar_voz_v5.py`, `generate_reel_v5.py`, `mezclar_v5.py`, `reintentar_voz_v5.py`; guion `GUION_REEL_V5.md`. Commit **5f15fc4**.
- **BUG encontrado y corregido** (reportado por Fernando: «se cortó la voz en mitad del video»): el stream de audio del MP4 duraba **30.000 s** contra 64.33 s de video. **Causa:** `amix=duration=first` toma la duración del **primer input del subgrafo**, que era la pista de música (`v3/background_music.wav`, **30.000 s** exactos), no la del video. **Fix:** `extender_musica()` repite la pista con `acrossfade` (fundido de 2 s) hasta la duración real + `amix=duration=longest`. **Verificado:** audio **64.32 s** = video **64.33 s**, y la voz suena de punta a punta (por tramos: t=10 −18.5 dB, t=29 −18.0, t=45 −17.5, t=62 −19.8 dB). El **v4 tenía el mismo defecto** (mismo filtro) y fue corregido de igual forma. Commit **22cb215**.

### 9.3.3 Mejoras aplicadas al v5 (2026-11-23)

Fernando aprobó el reel y pidió mejoras. Se aplicaron tres:

1. **Subtítulos quemados por escena**: la mayoría reproduce reels **sin sonido**, así que el mensaje textual deja de depender de la voz. Texto abajo, fondo semitransparente, sincronizado con cada escena (`subtitulo()` + `SUBS[]` en `generate_reel_v5.py`). Verificado por OCR sobre frames reales del MP4 en las **7 escenas**.
2. **Audio a −13.3 LUFS** (antes −18.3): rango en el que compite Instagram/TikTok; pico −0.1 dB (sin clip digital). Cambios en `mezclar_v5.py`: `loudnorm=I=-14`, se eliminó la atenuación posterior de −2.2 dB, `alimiter=limit=0.92`.
3. **`public/ads/CAPTION_REEL.md`**: caption listo para copiar y pegar + hashtags + el comentario fijado que responde la objeción de precio.

Resultado verificado: video **64.33 s** / audio **64.32 s**, 4.22 MB, 1080×1920, 30 fps. Commit **1adec80**.

**Pendiente de decisión:** el CTA usa `capfinanzas.com`; verificado el 2026-11-23 respondiendo **HTTP 200** con HTTPS (ya no hay conflicto Netlify DNS).

### 9.4 Punto 3 — Cronjob de arranque al abrir Hermes (VERIFICADO 2026-11-21)

**Pedido de Fernando:** en lugar de arrancar al encender la PC, levantar los contenedores **cuando se abre Hermes Agent**, con recordatorio.

**Implementación:** cronjob `podman-on-hermes-open` (job_id `4d8803dd164f`), `schedule: every 2m`, `no_agent: true` (sin LLM, costo $0), `deliver: origin`. Script: `C:/Users/USUARIO/AppData/Local/hermes/profiles/codigo/scripts/podman_on_hermes_open.py`.

**Mecánica (por qué funciona):** el cron corre dentro de Hermes, así que al abrirlo el job dispara y compara el `StartTime` del proceso Hermes con el estado guardado en `cache/podman_hermes_open_state.json`. Si cambió (Hermes se reabrió) → levanta VM + 3 contenedores, verifica puertos y emite: *"Hermes Agent abierto HH:MM. Contenedores Podman levantados: open-notebook=UP | moneyprinterturbo=UP | maxkb=UP"*. Si no cambió y todo está UP → stdout vacío, **sin ruido**. Si algún puerto cayó → recupera y avisa.

**Verificación real:** 1ª corrida manual emitió el recordatorio con los 3 endpoints UP; 2ª corrida dio salida vacía (correcto); job creado con `gateway_running: true` y disparado en background.

**Cambio posterior (Fernando, 2026-11-21):** el recordatorio además llega a **Telegram** (chat `1121812730`). Implementación: `notify_telegram()` dentro del mismo script, usa `sendMessage` de la API de Telegram con la key del perfil `default` (leída de `~/.hermes/.env`, sin exponerla en el perfil `codigo`). El `deliver` del cron quedó en `origin` para no depender del gateway multiplexado (que parqueaba el adapter de `codigo` por credencial duplicada). Evidencia: `cache/podman_telegram_sends.log` con líneas `ENVIADO` (13:27:39 y 13:28:01) y `gateway status` sin warnings.

---

*Informe actualizado por Códice (Hermes Agent) — 2026-11-21 UTC-3*