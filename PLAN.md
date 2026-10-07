# Cap Finanzas — Modelo de negocio y planes

> **Fuente de verdad única.** Si algo en el código contradice este archivo, este archivo manda.
> Última actualización: 2026-10-07

Este documento existe porque el proyecto tenía **cuatro versiones distintas** del modelo de
negocio conviviendo (README, código, pantalla de compra y CI), y cada sesión de trabajo había
que reconstruir cuál era la correcta.

---

## Planes

| Plan | Precio | Vigencia | Códigos | Alcance |
|---|---|---|---|---|
| **Simples** | **$20 USD** | **Permanente** | `CF-SIMPLE-*` | Finanzas personales, presupuestos, calendario, múltiples monedas, Tutor IA |
| **Empresarial** | **$100 USD** | **6 meses** (renovable) | `CF-TRAD-*` | Todo lo del Simples + Libro Diario, Libro Mayor, Balance, Estado de Resultados, Enciclopedia, Chat IA, Bolsas en Vivo |

**No existe plan Empresarial permanente.** Decisión de negocio: la renovación semestral
genera más ingreso que una venta única.

### Prueba

**30 días con acceso total** a todas las funciones. Sin tarjeta de crédito.

### Upgrades

| De → A | Precio |
|---|---|
| Simples → Empresarial | **$80 USD** (diferencia) |

---

## Vigencia por plan — implementación

El token de licencia se firma con HMAC-SHA256 en la edge function `license-activate`.
El campo `exp` depende del **tipo de licencia**:

| `license_type` | `exp` | Constante |
|---|---|---|
| `simple` | `iat + 100 años` (efectivamente permanente) | `PERPETUAL_DAYS = 36500` |
| `traditional` | `iat + 180 días` | `SEMESTRAL_DAYS = 180` |
| `full` | `iat + 180 días` | `SEMESTRAL_DAYS = 180` |
| `account` | `iat + 180 días` | `SEMESTRAL_DAYS = 180` |

> **Antes**: `TOKEN_TTL_DAYS = 90` para **todos** los planes. Eso significaba que quien compraba
> el plan "permanente" se quedaba sin licencia a los 3 meses.

---

## Plataformas

**Tres sistemas operativos, mismo precio para los tres.** El binario es el mismo; lo que
cambia es el código de licencia.

| SO | Archivo | Tamaño aprox. |
|---|---|---|
| Windows | `Cap-Finanzas-Setup-<v>.exe` | 125 MB |
| macOS (Apple Silicon) | `Cap-Finanzas-<v>-arm64.dmg` | 156 MB |
| Linux | `Cap-Finanzas-<v>.AppImage` | 173 MB |

El CI (`.github/workflows/build.yml`) los compila los tres con `electron-builder`.

---

## Actualizaciones

**No hay actualizaciones de por vida.** Es un producto final cerrado.

Se eliminó esa promesa de la pantalla de compra (`LicenseGate.tsx`) porque contradecía el
modelo: si el producto está terminado, no corresponde prometer mantenimiento indefinido.

Si en el futuro se publica una versión nueva, el comprador la descarga del mismo enlace que
ya tiene.

---

## Distribución

### Página pública
`capfinanzas.com` (repo `capfinanzas-web`, público — solo la landing, sin secretos).
El botón de descarga apunta a los binarios alojados en **Cloudflare R2**.

### Comprador
Recibe por email:
1. Su **código de licencia**
2. El **enlace de descarga** de su plataforma

El código determina el plan; el binario es el mismo para todos.

---

## Dónde vive cada cosa

| Qué | Dónde |
|---|---|
| Precios (los cobra PayPal) | `src/hooks/useLicense.ts` → `pricing` |
| Vigencia del token | `supabase/functions/license-activate/index.ts` → `TOKEN_TTL_DAYS` |
| Verificación | `supabase/functions/license-verify/index.ts` |
| Pantalla de compra | `src/components/LicenseGate.tsx` |
| Generador de licencias (admin) | `src/pages/LicenseGenerator.tsx` + `supabase/functions/admin-dashboard/` |
| Email al comprador | `supabase/functions/send-license-email/index.ts` |
| Compilación multiplataforma | `.github/workflows/build.yml` |
| Este documento | `PLAN.md` |

---

## Reglas para quien siga

1. **Cambiar un precio o vigencia = actualizar este archivo y el código, en el mismo commit.**
2. El README del repo y la landing deben reflejar esta tabla. Si no coinciden, están mal ellos.
3. El `license_type` se consulta al activar; nunca asumir un TTL fijo para todos.
4. Los secretos van en variables de entorno de Supabase, nunca en el repo.
