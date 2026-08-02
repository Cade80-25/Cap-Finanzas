# Plan: Mejoras integrales (SEO, Pagos, Seguridad, Retención)

Voy a implementar las 8 sugerencias agrupadas por área. Todo es trabajo de frontend + algunas edge functions, sin tocar la lógica core offline.

## SEO y búsqueda AI

1. **Página `/comparativa`** (nueva ruta)
   - Tabla comparativa Cap Finanzas vs Fintonic, Mobills, Monefy, Excel
   - Ejes: precio, offline, contabilidad doble, multimoneda, suscripción, datos propios
   - SEO completo con `<Helmet>`: title, description, canonical, JSON-LD `Product` + `FAQPage`
   - Añadir a `sitemap.xml`, `robots.txt`, `llms.txt` y al menú/footer

2. **3 artículos indexables bajo `/aprender/articulos/:slug`**
   - "Cómo llevar contabilidad personal sin Excel"
   - "Partida doble explicada simple"
   - "Diferencia entre finanzas personales y contabilidad"
   - Cada uno con Helmet (Article JSON-LD + BreadcrumbList), contenido ~600 palabras
   - Index en `/aprender` con tarjetas de cada artículo
   - Listados en sitemap.xml y llms.txt

3. **FAQ Schema JSON-LD en landing**
   - Sección visible "Preguntas frecuentes" en `LandingPage.tsx` (6 preguntas)
   - JSON-LD `FAQPage` para SERP

4. **CTA reforzado para instalar PWA en `/`**
   - Banner/sección destacada con botones "Instalar como app" + "Descargar Windows"
   - Hook que detecte `beforeinstallprompt` y muestre botón nativo de instalar PWA

## Pagos

5. **Pantalla `/checkout/success`**
   - Confirmación visual, instrucciones de activación paso a paso
   - Formulario "No recibí mi licencia" que llama edge function nueva `resend-license` (busca por email y reenvía)
   - Ruta agregada a `App.tsx`

6. **Recordatorio en-app cuando trial está por vencer**
   - Hook `useTrialExpiryReminder` que mira `useLicense` y, si quedan ≤5 días, muestra notificación con CTA a checkout
   - Una vez al día (localStorage flag)

7. **Prueba social en landing**
   - Sección "Lo que dicen los usuarios" con 3 testimonios (placeholders honestos: "Reseñas pendientes" o testimonios genuinos de uso si existen)
   - Contador "+N descargas" basado en visitas/total (estático honesto: "Desde 2024")

## Seguridad

8. **Rate limiting en `license-activate` y `license-verify`**
   - Tabla `rate_limits` (key text, count int, window_start timestamp)
   - Helper compartido `_shared/rate-limit.ts`: máx 10 intentos por IP+key cada 15 min
   - Devuelve 429 con `Retry-After`

## Retención

9. **Modo demo sin instalar**
   - Botón "Probar con datos de ejemplo" en landing → navega a `/?demo=1`
   - Hook que detecta `?demo=1`, carga dataset semilla en localStorage (perfil "Demo", ~30 transacciones, presupuestos) y muestra banner "Estás en modo demo - [Borrar datos demo]"

10. **Reporte mensual PDF por email (opt-in)**
    - Configuración existente de email para recordatorios ya tiene email del usuario
    - Edge function `monthly-report` programada vía pg_cron mensual: genera resumen (NO datos personales, solo lo que el usuario decida enviar)
    - **Realismo:** como los datos son 100% locales, el servidor no puede generar el PDF. En su lugar implemento:
      - Botón en app "Generar reporte mensual PDF" (cliente, usando jsPDF que ya existe en `export-transactions`)
      - Opción "Enviármelo por email" → cliente sube el PDF base64 a edge function `send-report-email` que lo adjunta y reenvía
      - Toggle en Configuración → Notificaciones: "Recordarme generar el reporte cada mes" (recordatorio local in-app el día 1)

## Cambios técnicos resumidos

```text
NEW src/pages/Comparativa.tsx
NEW src/pages/ArticuloEducativo.tsx (+ datos en src/lib/articles.ts)
NEW src/pages/CheckoutSuccess.tsx
NEW src/components/PWAInstallButton.tsx
NEW src/components/FAQSection.tsx
NEW src/components/TestimonialsSection.tsx
NEW src/components/DemoModeBanner.tsx
NEW src/hooks/useTrialExpiryReminder.ts
NEW src/hooks/useDemoMode.ts
NEW src/lib/demo-data.ts
NEW src/lib/monthly-report-pdf.ts
EDIT src/App.tsx (rutas nuevas + hooks)
EDIT src/pages/LandingPage.tsx (FAQ, testimonios, CTA PWA, link demo)
EDIT src/pages/Aprender.tsx (index de artículos)
EDIT src/pages/Configuracion.tsx (toggle reporte mensual)
EDIT public/sitemap.xml, public/robots.txt, public/llms.txt
EDIT scripts/seo-routes.mjs

NEW supabase/functions/resend-license/index.ts
NEW supabase/functions/send-report-email/index.ts
NEW supabase/functions/_shared/rate-limit.ts
EDIT supabase/functions/license-activate/index.ts (rate limit)
EDIT supabase/functions/license-verify/index.ts (rate limit)
EDIT supabase/config.toml (declarar nuevas funciones)

MIGRATION: tabla rate_limits + RLS (service_role)
```

## Fuera de alcance (lo aclaro)

- No genero testimonios falsos: dejo placeholder honesto si no tenés reseñas reales
- El "reporte mensual automático" puro server-side es imposible con datos 100% locales — implemento la versión cliente + envío opcional
- No toco el flujo offline ni la estructura de datos en localStorage