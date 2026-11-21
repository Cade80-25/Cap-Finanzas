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
| Dominio `capfinanzas.com` | ⏳ SSL propagando | Cert provisionado, edge servers pendientes |
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

*Informe actualizado por Códice (Hermes Agent) — 2026-11-06 UTC-3*