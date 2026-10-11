/**
 * Motor de integración entre módulos — Cap-Finanzas v2
 *
 * Traduce datos de los módulos operativos (RRHH, Fabricación, Inventario,
 * Facturación, TPV, etc.) a asientos del Libro Diario (doble entrada) y a
 * notificaciones. Funciones PURAS: reciben datos, devuelven asientos.
 *
 * El hook `useModuleIntegration` es quien las conecta a localStorage.
 */

import type { JournalTransaction } from "@/hooks/useJournalTransactions";

export type DraftEntry = {
  date: string;
  account: string;
  description: string;
  debit: number;
  credit: number;
  subcategory?: string;
  notes?: string;
};

export type PostedRef = {
  ref: string; // ej: "payroll:pay-123"
  kind: string; // payroll | production | variance | subcontract | invoice | sale
  date: string;
  entries: number;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function todayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// RRHH — Liquidación de sueldos
// ─────────────────────────────────────────────────────────────────────────────

export interface PayrollPostInput {
  payrollId: string;
  period: string;
  employeeName: string;
  baseSalary: number;
  bonifications: number;
  overtime: number;
  deductions: number; // deducciones totales (retenciones + otros)
  netPay: number;
  date?: string;
}

/**
 * Asiento de liquidación de sueldos:
 *   Debe  Sueldos (gasto) .............. bruto
 *   Haber Cargas sociales (pasivo) ..... retenciones
 *   Haber Banco (activo) ............... neto
 */
export function buildPayrollEntries(input: PayrollPostInput): DraftEntry[] {
  const date = input.date || todayISO();
  const gross = round2(input.baseSalary + input.bonifications + input.overtime);
  const retentions = round2(input.deductions);
  const net = round2(input.netPay);
  // Cuadre: si net + retentions != gross, ajustar retenciones al residuo
  const adjustedRetentions = round2(gross - net);
  const desc = `Sueldo ${input.period} — ${input.employeeName}`;

  const entries: DraftEntry[] = [
    {
      date,
      account: "sueldos",
      description: desc,
      debit: gross,
      credit: 0,
      subcategory: "RRHH",
      notes: `Liquidación ${input.payrollId}`,
    },
  ];

  if (adjustedRetentions > 0) {
    entries.push({
      date,
      account: "cargas-sociales",
      description: `${desc} (retenciones)`,
      debit: 0,
      credit: adjustedRetentions,
      subcategory: "RRHH",
    });
  }

  entries.push({
    date,
    account: "banco",
    description: `${desc} (neto)`,
    debit: 0,
    credit: net,
    subcategory: "RRHH",
  });

  return entries;
}

// ─────────────────────────────────────────────────────────────────────────────
// Fabricación — Orden de producción y WIP
// ─────────────────────────────────────────────────────────────────────────────

export interface ProductionPostInput {
  orderId: string;
  orderNumber: string;
  productName: string;
  bomCost: number; // costo estándar
  actualCost: number; // costo real acumulado en WIP
  wipBreakdown?: Array<{ type: string; amount: number }>;
  date?: string;
}

/**
 * Asiento de cierre de orden de producción (producto terminado):
 *   Debe  Productos terminados (activo) ... costo real
 *   Haber Producción en curso (activo) .... costo real
 * Y si hay variación (real - estándar) se registra aparte.
 */
export function buildProductionEntries(input: ProductionPostInput): DraftEntry[] {
  const date = input.date || todayISO();
  const desc = `Producción ${input.orderNumber} — ${input.productName}`;
  const cost = round2(input.actualCost || input.bomCost);
  const entries: DraftEntry[] = [
    {
      date,
      account: "productos-terminados",
      description: desc,
      debit: cost,
      credit: 0,
      subcategory: "Fabricación",
      notes: `Orden ${input.orderId}`,
    },
    {
      date,
      account: "produccion-en-curso",
      description: desc,
      debit: 0,
      credit: cost,
      subcategory: "Fabricación",
    },
  ];

  const variance = round2(cost - input.bomCost);
  if (Math.abs(variance) > 0.005) {
    // Variación desfavorable (real > estándar) = gasto; favorable = menor gasto
    entries.push({
      date,
      account: "variacion-costos",
      description: `${desc} (variación)`,
      debit: variance > 0 ? variance : 0,
      credit: variance < 0 ? Math.abs(variance) : 0,
      subcategory: "Fabricación",
      notes: variance > 0 ? "Desfavorable" : "Favorable",
    });
  }

  return entries;
}

/** Asiento de consumo de materiales (WIP): Debe WIP, Haber Materias primas */
export function buildMaterialConsumptionEntries(
  orderNumber: string,
  productName: string,
  amount: number,
  date?: string
): DraftEntry[] {
  const d = date || todayISO();
  const desc = `Consumo materiales ${orderNumber} — ${productName}`;
  const amt = round2(amount);
  return [
    { date: d, account: "produccion-en-curso", description: desc, debit: amt, credit: 0, subcategory: "Fabricación" },
    { date: d, account: "materias-primas", description: desc, debit: 0, credit: amt, subcategory: "Fabricación" },
  ];
}

/** Asiento de mano de obra aplicada a producción: Debe WIP, Haber Sueldos por aplicar */
export function buildLaborAppliedEntries(
  orderNumber: string,
  productName: string,
  amount: number,
  date?: string
): DraftEntry[] {
  const d = date || todayISO();
  const desc = `Mano de obra ${orderNumber} — ${productName}`;
  const amt = round2(amount);
  return [
    { date: d, account: "produccion-en-curso", description: desc, debit: amt, credit: 0, subcategory: "Fabricación" },
    { date: d, account: "sueldos", description: desc, debit: 0, credit: amt, subcategory: "Fabricación" },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Facturación → Cuentas por cobrar + Ingresos + IVA
// ─────────────────────────────────────────────────────────────────────────────

export interface InvoicePostInput {
  invoiceId: string;
  number: string;
  clientName: string;
  subtotal: number;
  tax: number;
  total: number;
  date?: string;
}

export function buildInvoiceEntries(input: InvoicePostInput): DraftEntry[] {
  const date = input.date || todayISO();
  const desc = `Factura ${input.number} — ${input.clientName}`;
  const entries: DraftEntry[] = [
    { date, account: "cuentas-por-cobrar", description: desc, debit: round2(input.total), credit: 0, subcategory: "Ventas" },
    { date, account: "ingresos", description: desc, debit: 0, credit: round2(input.subtotal), subcategory: "Ventas" },
  ];
  if (input.tax > 0) {
    entries.push({ date, account: "iva-por-pagar", description: `${desc} (IVA)`, debit: 0, credit: round2(input.tax), subcategory: "Impuestos" });
  }
  return entries;
}

/** Cobro de factura: Debe Banco, Haber Cuentas por cobrar */
export function buildCollectionEntries(
  number: string,
  clientName: string,
  amount: number,
  date?: string
): DraftEntry[] {
  const d = date || todayISO();
  const desc = `Cobro factura ${number} — ${clientName}`;
  return [
    { date: d, account: "banco", description: desc, debit: round2(amount), credit: 0, subcategory: "Cobros" },
    { date: d, account: "cuentas-por-cobrar", description: desc, debit: 0, credit: round2(amount), subcategory: "Cobros" },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// TPV → Venta directa (caja/banco)
// ─────────────────────────────────────────────────────────────────────────────

export interface SalePostInput {
  saleId: string;
  subtotal: number;
  tax: number;
  total: number;
  payment: "efectivo" | "tarjeta" | "transferencia" | "qr";
  date?: string;
}

export function buildSaleEntries(input: SalePostInput): DraftEntry[] {
  const date = input.date || todayISO();
  const cashAccount = input.payment === "efectivo" ? "caja" : "banco";
  const desc = `Venta TPV ${input.payment}`;
  const entries: DraftEntry[] = [
    { date, account: cashAccount, description: desc, debit: round2(input.total), credit: 0, subcategory: "TPV" },
    { date, account: "ingresos", description: desc, debit: 0, credit: round2(input.subtotal), subcategory: "TPV" },
  ];
  if (input.tax > 0) {
    entries.push({ date, account: "iva-por-pagar", description: `${desc} (IVA)`, debit: 0, credit: round2(input.tax), subcategory: "TPV" });
  }
  return entries;
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilidades
// ─────────────────────────────────────────────────────────────────────────────

/** Verifica que un conjunto de asientos cuadre (suma debe == suma haber). */
export function isBalanced(entries: DraftEntry[]): boolean {
  const debit = round2(entries.reduce((s, e) => s + e.debit, 0));
  const credit = round2(entries.reduce((s, e) => s + e.credit, 0));
  return Math.abs(debit - credit) < 0.01;
}

/** Convierte borradores a transacciones del journal con ids numéricos únicos. */
export function draftsToTransactions(entries: DraftEntry[], startId: number): JournalTransaction[] {
  return entries.map((e, i) => ({
    id: startId + i,
    date: e.date,
    account: e.account,
    description: e.description,
    debit: e.debit,
    credit: e.credit,
    subcategory: e.subcategory,
    notes: e.notes,
  }));
}

/** Siguiente id numérico disponible dado el journal actual. */
export function nextJournalId(transactions: JournalTransaction[]): number {
  let max = 0;
  for (const t of transactions) if (t.id > max) max = t.id;
  return max + 1;
}
