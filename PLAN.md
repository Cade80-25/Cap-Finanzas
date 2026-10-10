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

## Secciones de la aplicación

| Sección | Ruta | Plan |
|---|---|---|
| Panel Principal | `/` | Ambos |
| Transacciones | `/transacciones` | Ambos |
| Calendario · Presupuesto · Monedas · Resumen | varias | Ambos |
| Categorías | `/categorias` | Empresarial |
| Contabilidad (Diario, Mayor, Balance, Resultados) | `/contabilidad` | Empresarial |
| **Bolsas en Vivo** | `/bolsas` | Empresarial (datos requieren internet) |
| Aprender · Recomendaciones · Manual | `/aprender` | Ambos |
| Enciclopedia | `/aprender?tab=enciclopedia` | Empresarial |
| Ajustes | `/ajustes` | Ambos |

### Bolsas en Vivo

Cotizaciones mundiales vía widgets de **TradingView** (no requiere API key propia).

Incluye: resumen de mercados (Acciones, Índices, Crypto, Latinoamérica, Commodities),
gráfico en tiempo real, análisis técnico, perfil de empresa y **noticias por activo**.

> Antes vivía escondida en Aprender → Recomendaciones → pestaña "Bolsas en Vivo"
> (tres niveles). Se le dio sección propia en el menú principal.

---

## Protección anti-abuso

Tres controles, todos verificados:

### 1. Reactivación permitida (hasta 5 equipos)

El código **no** queda atado a una sola computadora. Un cliente puede formatear
su PC o comprar una nueva, instalar el programa y activar con el mismo código.

| Control | Valor |
|---|---|
| Activaciones por código | **5** |
| Al agotarlas | `activation_limit_reached` → escribir a soporte |

**Antes**: el código se ataba a la primera máquina para siempre. Quien cambiaba
de equipo recibía `code_used_elsewhere` y no podía reactivar — un cliente que
había pagado quedaba fuera.

### 2. Prueba registrada en el servidor

La prueba de 30 días se registra por máquina en la tabla `trial_registrations`
(edge function `register-trial`). La app envía un `machine_id` estable.

| Fuente del `machine_id` | Sobrevive a |
|---|---|
| Huella de hardware (hostname + plataforma + CPU) | Reinstalar la app |
| ID aleatorio en carpeta aparte (`%APPDATA%/.capfinanzas-id`) | Reinstalar la app |

**Antes**: la prueba vivía solo en `localStorage`. Borrar los datos de la app
daba 30 días nuevos, sin límite.

Si no hay conexión, la app permite la prueba (no se bloquea a un cliente legítimo
sin internet).

### 3. Guardia de rutas por plan

El menú ocultaba las secciones del plan Empresarial, pero las rutas seguían
accesibles escribiendo la URL. El componente `PlanGuard` protege:

`/contabilidad` · `/categorias` · `/libro-diario` · `/libro-mayor` ·
`/balance` · `/resultados` · `/consolidado`

Si el plan no alcanza, muestra un aviso con el correo de soporte.

> **Límite honesto**: ninguna traba es infalible — el programa corre en la
> computadora del cliente. Estos controles evitan el abuso casual (borrar datos,
> escribir una URL), que es lo que ocurre en la práctica.

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
El botón de descarga apunta al **Worker de descargas** (ver abajo).

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
| Proxy de descargas | `worker/` (Cloudflare Worker `capfinanzas-downloads`) |
| Este documento | `PLAN.md` |

---

## Reglas para quien siga

1. **Cambiar un precio o vigencia = actualizar este archivo y el código, en el mismo commit.**
2. El README del repo y la landing deben reflejar esta tabla. Si no coinciden, están mal ellos.
3. El `license_type` se consulta al activar; nunca asumir un TTL fijo para todos.

---

## Roadmap v2 — Cap-Finanzas Negocios (decidido 2026-10-09)

> Decisión de Fernando: v2 incluye **todos los dominios** de gestión de una
> empresa, no solo el núcleo contable. Lo que lo hace posible es el **sistema de
> plantillas modificables**: cada dominio es una plantilla editable (rellenar,
> importar CSV o crear desde cero, según país y régimen) montada sobre el motor
> de doble entrada que ya existe. "Incluir todo" no es programar la regla fiscal
> de cada país: es dar la estructura y dejar que el usuario o su contador la
> adapten. El mapa es completo desde el día uno; la profundidad de cada dominio
> crece por iteración según el uso real.

### Dominios de v2 (mapa completo; validado contra Dolibarr y Odoo)

| Dominio | Incluye | Prioridad |
|---|---|---|
| Cuentas corrientes | Clientes (deudores, cartera), proveedores (acreedores), antigüedad 30/60/90, cobros y pagos parciales | P1 |
| Facturación e impuestos | Facturas, notas de crédito/débito, IVA configurable por país, numeración propia, asiento automático en el Diario | P1 |
| Personal (RRHH) | Empleados, sueldos, liquidaciones, vacaciones y licencias, partes médicos, descuentos; conceptos de recibo editables por plantilla | P1 (plantilla) |
| Fabricación (contable) | BOM/Lista de materiales con costos, órdenes de producción, WIP/Producción en curso, productos terminados, costeo estándar vs real, análisis de variaciones (material, mano de obra, CIF), subproductos y desperdicios, subcontratación; asientos automáticos en Diario | P1 (plantilla) |
| Activos y logística | Maquinaria, inmuebles, vehículos, depreciación, mantenimiento, ubicaciones | P2 (plantilla) |
| Inventario | Stock, valoración (PEPS/UEPS/Promedio), almacenes, ubicaciones, alertas de reposición, transferencias | P2 (plantilla) |
| Banca | Conciliación bancaria, importación de extractos con mapeo de columnas (reusar el importador CSV existente) | P2 |
| Contabilidad de proyectos / obras | Costos por proyecto/obra/orden, avance, facturación por hito, rentabilidad por proyecto | P2 (plantilla) |
| Contabilidad analítica / de costos | Centros de costo y beneficio, dimensiones analíticas, reparto de indirectos, rentabilidad por producto/cliente/canal | P2 (plantilla) |
| Gastos y notas de gasto | Reportes de gastos, reembolsos, anticipos, flujos de aprobación, políticas por categoría | P3 |
| Contratos y suscripciones | Contratos recurrentes, facturación automática, renovaciones, prorrateos | P3 |
| Calidad | Planes de control, no conformidades, acciones correctivas, trazabilidad | P3 (plantilla) |
| Mantenimiento (GMAO) | Órdenes de trabajo, preventivo/correctivo, repuestos, historial de equipos | P3 (plantilla) |
| Flota | Vehículos, gastos (combustible, peajes, seguros), mantenimiento, vencimientos | P3 (plantilla) |
| Alquiler / Rental | Equipos, inmuebles, contratos de alquiler, facturación periódica, devoluciones | P3 (plantilla) |
| Ventas / CRM ligero | Propuestas, pedidos, seguimiento de clientes, agenda de contacto | P3 |
| Punto de venta | TPV básico — solo si lo piden usuarios con comercio | P3 |
| Gestión documental | Adjuntos a asientos/facturas, OCR básico, clasificación, búsqueda | P3 |
| Flujos de aprobación | Workflows configurables: facturas, gastos, pagos, órdenes de compra | P3 |
| Business Intelligence | Dashboards, KPIs, reportes programados, alertas | P3 |

### Sistema de plantillas (el corazón de v2)

1. Marco general: crear, editar, duplicar, importar y exportar plantillas (JSON + CSV).
2. Plantillas de fábrica por dominio, con valores por defecto editables.
3. Toda plantilla genera asientos en el Libro Diario existente — el motor no cambia.
4. Descargo en Términos: la plantilla es una herramienta, no asesoramiento fiscal.

### Orden de construcción dentro de v2

P1 (cuentas corrientes + facturación + plantillas RRHH) → lanzar → escuchar a
los usuarios fundadores → profundizar los dominios según uso real. Las
prioridades P1/P2/P3 son **orden de construcción**, nunca recorte del mapa.

### Pricing decidido — PENDIENTE DE IMPLEMENTAR (respeta la regla 1)

Decidido con Fernando el 2026-10-09:

- **Personal**: $19–20 USD, pago único, permanente.
- **Empresarial**: $99–100 USD, pago único, permanente. Fin de la renovación
  semestral ("suscripción disfrazada" — decisión de identidad del producto).
- **Política de versiones** (escribirla en Términos desde ya): la licencia cubre
  la versión mayor actual y todas sus mejoras (1.x) para siempre. Versiones
  mayores nuevas (2.0+) son un upgrade pago con descuento para licencias
  activas. Correcciones de bugs siempre gratis.
- **Usuarios fundadores** (primeros compradores): v2 gratis o a precio simbólico.

⚠️ Hasta cambiar el código (TTL de `traditional` 180 días → perpetuo en
`license-activate/index.ts`, precios en `useLicense.ts`, textos en
`LicenseGate.tsx`), la tabla de la sección "Planes" de arriba **sigue
gobernando**. Este archivo y el código se cambian en el mismo commit, nunca solos.

### "Beta" queda fuera del vocabulario

Decisión de Fernando: hacia el público no se usa "beta" — toda versión es la
beta de la siguiente. El programa de testers pasa a llamarse **Programa de
Fundadores**: línea directa con el creador, su feedback define v2, precio de
fundador como recompensa. Internamente, los números de versión (1.x, 2.0)
siguen usándose solo como hitos de ingeniería.
4. Los secretos van en variables de entorno de Supabase, nunca en el repo.
