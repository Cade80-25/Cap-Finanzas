# Recordatorios Operativos Cap-Finanzas

## ⏰ 1-nov-2026 — Reset presupuesto GitHub Actions

GitHub Actions quedó SIN presupuesto el 15-oct-2026 ($15.89 de ~$16 free en octubre; los runs mueren en 2-5s sin pasos ni logs). Los fixes aplicados (build mac gated por `vars.BUILD_MAC`, guardian cloud 3→1 slot, techos de corrida) mantienen el gasto en ~$2.3/mes equivalente una vez restablecido.

**Qué hacer el 1-nov:**
1. Verificar que los workflows de Cap-Finanzas y etoro-bot vuelven a correr (un push de prueba o re-run manual).
2. Confirmar que los crons cloud (orquestador 14:30 UTC, guardián) se despachan a horario y sin retrasos de 2-6h.
3. Hasta ese día: releases SOLO locales (`npx electron-builder --win --publish never`) + guardián local cada 15 min como única protección intradía de etoro.

## 🔘 Botones PayPal reales (desde 16-oct-2026)

| Plan | ID Hospedado | Verificado |
|---|---|---|
| Simples $20 | `JHMVWLPAW4MKY` | HTTP 200, "Finanzas Simples" 20.00 USD |
| Empresarial $100 | `KZXBA5QRWVQV2` | HTTP 200, "Contabilidad Tradicional" 100.00 USD |

- OJO: el placeholder viejo era `KZXBA5QRWVQVQV2` (15 chars) — MUERTO (404). El real de Empresarial tiene 13 chars.
- Fuente única: `src/lib/pricing.ts`. Formato usado: enlace `https://www.paypal.com/ncp/payment/<ID>`.
- Release con estos IDs: **v1.1.83** (commit `9e052f9`, Latest). Las v≤1.1.82 apuntan al botón muerto.

## 📸 Imágenes promo PayPal

- Renders actuales: `Desktop\CAP-FINANZAS\Promo y Marketing\frames_178_paypal\` (hook/features/screenshot/cta, 1080×1920).
- Para actualizar: editar versión/precio en `reel_178.html` y correr `render_paypal_frames.js` (misma carpeta). Verificar el cta.jpg por visión: el formato "$49 tachado" viejo insinuaba descontinuación — usar las 2 tarjetas de plan.
- El screenshot del balance vive en `shots_178/balance.jpg` (recortado de frames_178/f_00204.jpg — NO regenerar a ciegas, el recorte correcto excluye el título de la escena).

## 💻 PC de Fernando

- Instalada: versión anterior a 1.1.83 POR DECISIÓN de Fernando (no reinstalar sin que lo pida). Su copia tiene precios correctos y licencia activa; solo difiere el ID de botón, irrelevante para su uso.
