# Informe de Sesión — Cap-Finanzas v1.1.83
**Fechas:** 2026-10-15 → 2026-10-17 · **Alcance:** Precios unificados · Botones PayPal reales · Release v1.1.83 · Imágenes promocionales corregidas
**Resultado final:** ✅ Circuito de venta completo y verificado en vivo · 2 botones PayPal reales integrados · Release publicada · 0 pendientes de reparación

---

## 1. Resumen ejecutivo

- Se publicó **v1.1.83** (commit `9e052f9`, release Latest en GitHub, instalador local 140.294.522 bytes) con los **botones PayPal reales** de ambos planes. La v1.1.82 y anteriores tenían el ID de prueba muerto (`KZXBA5QRWVQVQV2` → 404 en PayPal): cualquier compra caía en "página no encontrada".
- Se corrigieron las **4 imágenes promocionales para PayPal** (`frames_178_paypal\`): versión v1.1.78→v1.1.82, precio viejo $29/$49 → planes $20 Simples / $100 Empresarial, y reconstrucción del screenshot del balance perdido en la mudanza de carpetas.
- Verificación en vivo del circuito completo (17-oct): botones HTTP 200 con precio correcto, funciones Supabase vivas y validando, release Latest publicada.

## 2. Botones PayPal (creados por Fernando en su cuenta, integrados por Hermes)

| Plan | ID Hospedado | Verificación en vivo |
|---|---|---|
| Simples $20 | `JHMVWLPAW4MKY` | "Finanzas Simples" — 20.00 USD ✓ (HTTP 200) |
| Empresarial $100 | `KZXBA5QRWVQV2` | "Contabilidad Tradicional" — 100.00 USD ✓ (HTTP 200) |

- **Formato de uso:** enlace de pago `https://www.paypal.com/ncp/payment/<ID>` (la app es de escritorio; el código de incrustación HostedButtons no se usa).
- **Ojo con el ID de Empresarial:** el placeholder viejo era `KZXBA5QRWVQVQV2` (15 chars, muerto); el real es `KZXBA5QRWVQV2` (13 chars). Diferencia de 2 caracteres, verificada contra PayPal antes de integrar.
- Archivos tocados: `src/lib/pricing.ts` (fuente única de IDs), `src/components/PurchaseDialog.tsx` (comentario).

## 3. Circuito de venta completo (verificado 17-oct)

1. Comprador → "Comprar licencia" en la app → abre enlace NCP del botón según plan.
2. Pago en PayPal → IPN a `paypal-ipn` (Supabase) → verificación contra ipnpb.paypal.com.
3. `send-license-email` envía licencia al email de PayPal del comprador (monto $20→simple, $100→full).
4. Estado verificado: IPN responde "Not verified" a pings falsos; send-license valida y rechaza bodies vacíos ("Email inválido"). Ambas vivas.

**Notas del cliente configuradas en los botones** (texto dado por Hermes): producto digital, sin envío, licencia por email en ≤24 h; Empresarial con nombre de empresa opcional.

## 4. Imágenes promocionales para PayPal

- Fuente: `Desktop\CAP-FINANZAS\Promo y Marketing\reel_178.html` → renders en `frames_178_paypal\` (hook, features, screenshot, cta — 1080×1920, JPEG 92).
- Correcciones: v1.1.82 en caption; cta rediseñado con 2 tarjetas de plan ($20/$100, sin tachado que insinuaba descontinuación); balance.jpg reconstruido desde `frames_178/f_00204.jpg` con detección programática de bordes (primer recorte incluía el título → superposición; corregido detectando el marco real del shot-frame).
- Script de render reutilizable guardado: `render_paypal_frames.js` en la misma carpeta (para próximas versiones: cambiar versión/precio en reel_178.html y correrlo).

## 5. Releases

| Tag | Estado | Contenido |
|---|---|---|
| v1.1.82 | anterior | SEO y precios unificados (botón PayPal aún de prueba) |
| **v1.1.83** | **Latest** | Botones PayPal reales integrados, asar verificado (1×JHMVW, 1×KZXBA5, 0×ID muerto) |

- Builds locales (GitHub Actions sin presupuesto hasta el 1-nov; reset mensual reactiva los crons automáticamente).
- PC de Fernando: **queda en versión instalada anterior por decisión de Fernando** (innecesario reinstalar; precios ya correctos en su copia y licencia activa). Si reinstala, el instalador v1.1.83 ya viene corregido.

## 6. Estado y pendientes

- **Pendientes de reparación: 0.**
- Recordatorio permanente: **1-nov** se resetea el presupuesto de GitHub Actions → reactivar verificación de los crons cloud ese día (hasta entonces, releases locales + guardián local).
- Próximo frente: **marketing y publicidad** (sesión nueva recomendada por longitud de esta).
