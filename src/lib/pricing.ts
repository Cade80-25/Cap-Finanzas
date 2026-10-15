// ─────────────────────────────────────────────────────────────────────────────
// FUENTE ÚNICA DE PRECIOS Y VIGENCIA DE LICENCIAS — Cap Finanzas
// Ver PLAN.md (sección "Planes"). Decisión de Fernando (2026-10-09):
//   Ambos planes son perpetuos (pago único). Fin de la renovación semestral.
// Regla: ningún componente/texto debe escribir un precio o vigencia literal;
// todo sale de aquí. Si cambiás un precio, cambiás SOLO este archivo.
// ─────────────────────────────────────────────────────────────────────────────

export type PlanId = 'simple' | 'full';

export interface PlanInfo {
  id: PlanId;
  name: string;
  /** Precio en USD, pago único */
  price: number;
  /** Vigencia humana, p.ej. "Permanente" */
  duration: string;
  /** Etiqueta corta para badges: "Simples $20 USD · Permanente" */
  badge: string;
  /** Descripción para diálogos/meta */
  description: string;
  /** Plan de PayPal de este tier (hosted button id) */
  paypalButtonId: string;
}

export const PLANS: Record<PlanId, PlanInfo> = {
  simple: {
    id: 'simple',
    name: 'Simples',
    price: 20,
    duration: 'Permanente',
    badge: 'Simples $20 USD · Permanente',
    description: 'Finanzas personales: presupuestos, calendario, múltiples monedas, Tutor IA. Pago único, permanente.',
    paypalButtonId: 'KZXBA5QRWVQVQV2', // TODO(Fernando): botón PayPal de $20 — crear en PayPal y reemplazar este ID
  },
  full: {
    id: 'full',
    name: 'Empresarial',
    price: 100,
    duration: 'Permanente',
    badge: 'Empresarial $100 USD · Permanente',
    description: 'Todo lo del Simples + Libro Diario, Mayor, Balance, Estado de Resultados, Enciclopedia, Chat IA, Bolsas en Vivo. Pago único, permanente.',
    paypalButtonId: 'KZXBA5QRWVQVQV2', // TODO(Fernando): botón PayPal de $100 — crear en PayPal y reemplazar este ID
    },
};

/** Precio del upgrade Simples → Empresarial (diferencia). */
export const UPGRADE_PRICE = 80;

/** Texto legal corto de todos los textos de compra/upgrade. */
export const LEGAL_TEXT =
  'Licencias de pago único y vigencia permanente. Correcciones de bugs siempre gratis. ' +
  'La licencia cubre la versión mayor actual (1.x) y todas sus mejoras para siempre; ' +
  'versiones mayores nuevas (2.0+) son un upgrade pago con descuento para licencias activas.';

// Compatibilidad hacia atrás: `pricing.simple` / `pricing.traditional` siguen funcionando.
export const pricing = { simple: PLANS.simple.price, traditional: PLANS.full.price };

// Mensajes pre-escritos que antes estaban hardcodeados por archivo:
export const PRICING_TEXTS = {
  aboutDialog: 'Plan Simples USD 20 (permanente) o Empresarial USD 100 (permanente).',
  manual: 'Plan Simples USD 20 (permanente) o Empresarial USD 100 (permanente).',
  trialExpiry: `Vence \${date}. Licencia Simples \${PLANS.simple.price} USD permanente o Empresarial \${PLANS.full.price} USD permanente — seguí sin interrupciones.`,
};
