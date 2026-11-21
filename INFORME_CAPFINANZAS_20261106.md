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

### 9.2 Punto 3 — Cronjob de arranque al abrir Hermes (VERIFICADO 2026-11-21)

**Pedido de Fernando:** en lugar de arrancar al encender la PC, levantar los contenedores **cuando se abre Hermes Agent**, con recordatorio.

**Implementación:** cronjob `podman-on-hermes-open` (job_id `4d8803dd164f`), `schedule: every 2m`, `no_agent: true` (sin LLM, costo $0), `deliver: origin`. Script: `C:/Users/USUARIO/AppData/Local/hermes/profiles/codigo/scripts/podman_on_hermes_open.py`.

**Mecánica (por qué funciona):** el cron corre dentro de Hermes, así que al abrirlo el job dispara y compara el `StartTime` del proceso Hermes con el estado guardado en `cache/podman_hermes_open_state.json`. Si cambió (Hermes se reabrió) → levanta VM + 3 contenedores, verifica puertos y emite: *"Hermes Agent abierto HH:MM. Contenedores Podman levantados: open-notebook=UP | moneyprinterturbo=UP | maxkb=UP"*. Si no cambió y todo está UP → stdout vacío, **sin ruido**. Si algún puerto cayó → recupera y avisa.

**Verificación real:** 1ª corrida manual emitió el recordatorio con los 3 endpoints UP; 2ª corrida dio salida vacía (correcto); job creado con `gateway_running: true` y disparado en background.

---

*Informe actualizado por Códice (Hermes Agent) — 2026-11-21 UTC-3*