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
| **Empresarial** | **$100 USD** | **Permanente** | `CF-TRAD-*` | Todo lo del Simples + Libro Diario, Libro Mayor, Balance, Estado de Resultados, Enciclopedia, Chat IA, Bolsas en Vivo, Cuentas Corrientes |

**Ambos planes son perpetuos (pago único).** Decisión de Fernando (2026-10-09): fin de la renovación semestral ("suscripción disfrazada").

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
| `traditional` | `iat + 100 años` (efectivamente permanente) | `PERPETUAL_DAYS = 36500` |
| `full` | `iat + 100 años` (compatibilidad) | `PERPETUAL_DAYS = 36500` |
| `account` | `iat + 100 años` (compatibilidad) | `PERPETUAL_DAYS = 36500` |

> **2026-10-09**: `traditional` pasó de semestral (180 días) a perpetuo (36500 días).
> Decisión de Fernando: ambos planes son pago único y permanentes. Fin de la renovación semestral.

---

## Secciones de la aplicación

| Sección | Ruta | Plan |
|---|---|---|
| Panel Principal | `/` | Ambos |
| Transacciones | `/transacciones` | Ambos |
| Calendario · Presupuesto · Monedas · Resumen | varias | Ambos |
| Categorías | `/categorias` | Empresarial |
| Contabilidad (Diario, Mayor, Balance, Resultados) | `/contabilidad` | Empresarial |
| Cuentas Corrientes (deudores/acreedores) | `/cuentas-corrientes` | Empresarial |
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
| Personal (RRHH) | Empleados, sueldos, liquidaciones, vacaciones y licencias, partes médicos, descuentos; conceptos de recibo editables por plantilla | ✅ Implementado (integrado al Diario) |
| Fabricación (contable) | BOM/Lista de materiales con costos, órdenes de producción, WIP/Producción en curso, productos terminados, costeo estándar vs real, análisis de variaciones (material, mano de obra, CIF), subproductos y desperdicios, subcontratación; asientos automáticos en Diario | ✅ Implementado (integrado al Diario) |
| Activos y logística | Maquinaria, inmuebles, vehículos, depreciación, mantenimiento, ubicaciones | ✅ Implementado |
| Inventario | Stock, valoración (PEPS/UEPS/Promedio), almacenes, ubicaciones, alertas de reposición, transferencias | ✅ Implementado |
| Banca | Conciliación bancaria, importación de extractos con mapeo de columnas (reusar el importador CSV existente) | ✅ Implementado |
| Bolsas en Vivo | Trading, criptomonedas, mercado de capitales | ✅ Implementado |
| Contabilidad de proyectos / obras | Costos por proyecto/obra/orden, avance, facturación por hito, rentabilidad por proyecto | ✅ Implementado |
| Contabilidad analítica / de costos | Centros de costo y beneficio, dimensiones analíticas, reparto de indirectos, rentabilidad por producto/cliente/canal | ✅ Implementado |
| **Gastos y Notas de Gasto** | Reportes de gastos, reembolsos, anticipos, aprobaciones, políticas de gasto | ✅ Implementado |
| **Contratos y Suscripciones** | Contratos recurrentes, suscripciones, facturación automática, renovaciones, prorrateos | ✅ Implementado |
| **Gestión de Tesorería** | Posición de caja diaria, flujos previstos, encaje bancario, inversión excedentes, cash pooling | ✅ Implementado |
| **Gestión de Riesgos Financieros** | Cobertura tipo de cambio/tipo interés, riesgo país/comercial/crédito, límites por contraparte | ✅ Implementado |
| **Financiamiento Estructurado** | Emisión bonos/valores, rating, estructura capital (WACC), costo deuda vs patrimonio | ✅ Implementado |
| **Calidad** | Planes de control, no conformidades, acciones correctivas, trazabilidad | ✅ Implementado |
| **Mantenimiento (GMAO)** | Órdenes de trabajo, preventivo/correctivo, repuestos, historial de equipos | ✅ Implementado |
| **Flota** | Vehículos, gastos (combustible, peajes, seguros), mantenimiento, vencimientos | ✅ Implementado |
| **Alquiler / Rental** | Equipos, inmuebles, contratos de alquiler, facturación periódica, devoluciones | ✅ Implementado |
| Ventas / CRM ligero | Propuestas, pedidos, seguimiento de clientes, agenda de contacto | ✅ Implementado |
| Punto de venta | TPV básico — solo si lo piden usuarios con comercio | ✅ Implementado |
| Gestión documental | Adjuntos a asientos/facturas, OCR básico, clasificación, búsqueda | ✅ Implementado |
| **Flujos de Aprobación** | Workflows configurables: facturas, gastos, pagos, órdenes de compra | ✅ Implementado |
| Business Intelligence | Dashboards, KPIs, reportes programados, alertas | ✅ Implementado |
| **Bolsas en Vivo (ampliación)** | Trading: análisis técnico/fundamental, journal de trading, gestión de posiciones. Criptomonedas: wallet tracking, ganancias/pérdidas por exchange, staking/DeFi, reporte fiscal cripto. Todo dentro de `/bolsas` como tabs, no como secciones separadas | ✅ Implementado (journal de trading + wallet cripto + staking) |
| **Bienes Raíces e Inversión Inmobiliaria** | Propiedades, arrendamientos, hipotecas, ROI inmobiliario, depreciación de inmuebles, plusvalía | ✅ Implementado |
| **Seguros** | Pólizas, coberturas, siniestros, vencimientos, aseguradoras, deducibles | ✅ Implementado |
| **Auditoría y Control Interno** | Checklist de auditoría, hallazgos, planes de acción, segregación de funciones, compliance | ✅ Implementado |
| **Gestión de Proyectos** | Gantt, hitos, presupuesto por proyecto, rentabilidad por proyecto, recursos asignados | ✅ Implementado |
| **Startups y Emprendimiento** | Plan de negocio, métricas de startup (MRR/ARR/Churn), runway, burn rate, cap table | ✅ Implementado |
| **Análisis Financiero y Ratios** | KPIs financieros (ROE/ROA/margen/EBITDA), benchmarking, tendencias, scorecards | ✅ Implementado |
| **Comercio Exterior** | Importación/exportación, aduanas, aranceles, Incoterms, divisas, despachantes | ✅ Implementado |
| **Marketing y Ventas avanzado** | Campañas, embudos de venta, CAC/LTV, segmentación, automatización | ✅ Implementado |

### Etapa 3 — Ciclo de Venta-Stock Completo ✅ Implementado

**TPV → Diario + Inventario**:
- Al cobrar una venta → asiento automático: Debe Caja/Banco (según medio de pago) / Haber Ingresos + IVA por Pagar
- Cierre de ciclo real: cada ítem vendido descuenta stock del Inventario (match por nombre)
- Por cada ítem con stock: asiento de costo de ventas (Debe Costo de Ventas / Haber Inventarios)
- Badge "Contab." en la tabla de ventas

**Inventario → Diario**:
- Entrada (compra) → asiento: Debe Inventarios / Haber Caja (efectivo)
- Salida → asiento de costo de ventas: Debe Costo de Ventas / Haber Inventarios
- Ajuste → asiento por valor del delta: sobrante reduce gasto, merma lo aumenta
- Badge "Contab." en la tabla de movimientos
- Referencias únicas por id de movimiento (`purchase:{id}:{fecha}`, `costsales:{id}:{fecha}`, `invadj:{id}`) — permite múltiples operaciones del mismo artículo el mismo día

**Motor de automatización extendido**:
- Nueva alerta TPV: ventas en estado "abierta" sin cobrar
- `useTPV` integrado al panel de estado del negocio

### Etapa 2 — Cadena de Ventas Completa ✅ Implementado

**Facturación → Diario**:
- Al crear una factura → asiento automático: Debe Cuentas por Cobrar / Haber Ingresos + IVA por Pagar
- Badge "Contabilizado" visible en la tabla de facturas
- Nota de crédito/débito también contabilizan (ajustan la cuenta por cobrar)

**Cuentas Corrientes → Diario**:
- Al registrar un cobro → asiento automático: Debe Banco / Haber Cuentas por Cobrar
- Al registrar un pago → asiento automático: Debe Cuentas por Pagar / Haber Banco
- Badge "Contabilizado" visible en la tabla de movimientos
- Integración bidireccional: los asientos se reflejan en el Diario con referencia cruzada

**Motor de integración extendido**:
- `buildPaymentEntries`: asiento de pago a proveedor (Debe Cuentas por Pagar / Haber Banco)
- `postPayment` en `useModuleIntegration`: hook para publicar pagos
- Referencias únicas por movimiento (`ccm:{id}`) para evitar duplicados

### Etapa 1 — Integración y Profundización ✅ Implementado

**Motor de integración** (`src/lib/moduleIntegration.ts` + `src/hooks/useModuleIntegration.ts`):
- Funciones puras que traducen datos de módulos operativos a asientos del Libro Diario (doble entrada)
- RRHH: sueldos → Debe Sueldos / Haber Cargas Sociales + Banco
- Fabricación: cierre de orden → Debe Productos Terminados / Haber WIP + variación; consumo materiales → Debe WIP / Haber Materias Primas; mano de obra → Debe WIP / Haber Sueldos
- Facturación: venta → Debe Cuentas por Cobrar / Haber Ingresos + IVA; cobro → Debe Banco / Haber Cuentas por Cobrar
- TPV: venta directa → Debe Caja/Banco / Haber Ingresos + IVA
- Hook `useModuleIntegration`: conecta al journal, marca registros como contabilizados, emite notificaciones
- Plan de cuentas empresarial extendido: sueldos, cargas-sociales, produccion-en-curso, productos-terminados, materias-primas, variacion-costos, iva-por-pagar, iva-por-cobrar, compras

**Automatización sobre datos del usuario** (`src/hooks/useAutomatizacion.ts` + `src/pages/Automatizacion.tsx`):
- Centro de Automatización: alertas automáticas generadas desde los datos que el usuario ya cargó
- Alertas: cuentas por cobrar vencidas, cuentas por pagar vencidas, stock bajo mínimo, pólizas por vencer, contratos por vencer, facturas vencidas sin cobrar, variaciones de costo desfavorables, nómina pendiente de pago
- Severidad: crítica / alta / media / baja, con monto en riesgo consolidado
- Cada alerta enlaza al módulo correspondiente para acción inmediata
- Sin conexión externa: trabaja 100% sobre datos locales del usuario

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
