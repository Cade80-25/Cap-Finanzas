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

/** Pago a proveedor: Debe Cuentas por pagar, Haber Banco */
export function buildPaymentEntries(
  number: string,
  providerName: string,
  amount: number,
  date?: string
): DraftEntry[] {
  const d = date || todayISO();
  const desc = `Pago ${number} — ${providerName}`;
  return [
    { date: d, account: "cuentas-por-pagar", description: desc, debit: round2(amount), credit: 0, subcategory: "Pagos" },
    { date: d, account: "banco", description: desc, debit: 0, credit: round2(amount), subcategory: "Pagos" },
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
// Inventario → Compras / Costo de ventas / Ajustes
// ─────────────────────────────────────────────────────────────────────────────

/** Compra de mercadería: Debe Inventarios, Haber Caja/Banco/Cuentas por Pagar */
export function buildPurchaseEntries(
  reference: string,
  supplierName: string,
  amount: number,
  payment: "efectivo" | "credito" | "transferencia",
  date?: string
): DraftEntry[] {
  const d = date || todayISO();
  const desc = `Compra ${reference} — ${supplierName}`;
  const creditAccount = payment === "efectivo" ? "caja" : payment === "transferencia" ? "banco" : "cuentas-por-pagar";
  return [
    { date: d, account: "inventarios", description: desc, debit: round2(amount), credit: 0, subcategory: "Compras" },
    { date: d, account: creditAccount, description: desc, debit: 0, credit: round2(amount), subcategory: "Compras" },
  ];
}

/** Costo de ventas: Debe Costo de Ventas, Haber Inventarios */
export function buildCostOfSalesEntries(
  reference: string,
  productName: string,
  amount: number,
  date?: string
): DraftEntry[] {
  const d = date || todayISO();
  const desc = `Costo de ventas ${reference} — ${productName}`;
  return [
    { date: d, account: "costo-ventas", description: desc, debit: round2(amount), credit: 0, subcategory: "Costos" },
    { date: d, account: "inventarios", description: desc, debit: 0, credit: round2(amount), subcategory: "Costos" },
  ];
}

/** Ajuste de inventario por valor: delta>0 = sobrante (sube stock), delta<0 = merma (baja stock) */
export function buildInventoryAdjustmentEntries(
  itemName: string,
  valueDelta: number,
  date?: string
): DraftEntry[] {
  const d = date || todayISO();
  const amt = round2(Math.abs(valueDelta));
  if (amt < 0.005) return [];
  const desc = `Ajuste inventario — ${itemName}`;
  // Sobrante: sube el activo, reduce el gasto. Merma: gasto contra el activo.
  return valueDelta > 0
    ? [
        { date: d, account: "inventarios", description: desc, debit: amt, credit: 0, subcategory: "Inventario" },
        { date: d, account: "costo-ventas", description: desc, debit: 0, credit: amt, subcategory: "Inventario" },
      ]
    : [
        { date: d, account: "costo-ventas", description: desc, debit: amt, credit: 0, subcategory: "Inventario" },
        { date: d, account: "inventarios", description: desc, debit: 0, credit: amt, subcategory: "Inventario" },
      ];
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

// ─────────────────────────────────────────────────────────────────────────────
// Activos fijos: adquisición, depreciación, baja/venta
// ─────────────────────────────────────────────────────────────────────────────

/** Adquisición de activo fijo: Debe Activo Fijo (activo-no-corriente) / Haber Banco */
export function buildAssetAcquisitionEntries(assetName: string, cost: number, date?: string): DraftEntry[] {
  const d = date || todayISO();
  const desc = `Alta activo fijo — ${assetName}`;
  return [
    { date: d, account: "activo-no-corriente", description: desc, debit: round2(cost), credit: 0, subcategory: "Activos Fijos" },
    { date: d, account: "banco", description: desc, debit: 0, credit: round2(cost), subcategory: "Activos Fijos" },
  ];
}

/** Depreciación del período: Debe Gasto Depreciación / Haber Dep. Acumulada */
export function buildDepreciationEntries(assetName: string, period: string, amount: number, date?: string): DraftEntry[] {
  const d = date || todayISO();
  if (amount < 0.005) return [];
  const desc = `Depreciación ${period} — ${assetName}`;
  return [
    { date: d, account: "depreciacion", description: desc, debit: round2(amount), credit: 0, subcategory: "Activos Fijos" },
    { date: d, account: "depreciacion-acumulada", description: desc, debit: 0, credit: round2(amount), subcategory: "Activos Fijos" },
  ];
}

/** Baja/venta: retiro al valor libro + cobro + resultado (ganancia/pérdida) */
export function buildDisposalEntries(assetName: string, saleValue: number, bookValue: number, date?: string): DraftEntry[] {
  const d = date || todayISO();
  const desc = `Baja activo — ${assetName}`;
  const out: DraftEntry[] = [];
  if (bookValue > 0.005) {
    out.push({ date: d, account: "activo-no-corriente", description: desc, debit: 0, credit: round2(bookValue), subcategory: "Activos Fijos" });
  }
  if (saleValue > 0.005) {
    out.push({ date: d, account: "caja", description: `${desc} (cobro)`, debit: round2(saleValue), credit: 0, subcategory: "Activos Fijos" });
  }
  const gainLoss = round2(saleValue - bookValue);
  if (Math.abs(gainLoss) >= 0.005) {
    if (gainLoss > 0) {
      out.push({ date: d, account: "ingresos", description: `${desc} (ganancia)`, debit: 0, credit: gainLoss, subcategory: "Activos Fijos" });
    } else {
      out.push({ date: d, account: "gastos-operativos", description: `${desc} (pérdida)`, debit: -gainLoss, credit: 0, subcategory: "Activos Fijos" });
    }
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Gastos: aprobación contabiliza el gasto; reembolso paga al empleado
// ─────────────────────────────────────────────────────────────────────────────

/** Aprobación de gasto: Debe Gastos Operativos / Haber Cuentas por Pagar (al empleado) */
export function buildExpenseApprovalEntries(employeeName: string, description: string, amount: number, date?: string): DraftEntry[] {
  const d = date || todayISO();
  const desc = `Gasto aprobado — ${description} (${employeeName})`;
  return [
    { date: d, account: "gastos-operativos", description: desc, debit: round2(amount), credit: 0, subcategory: "Gastos" },
    { date: d, account: "cuentas-por-pagar", description: desc, debit: 0, credit: round2(amount), subcategory: "Gastos" },
  ];
}

/** Reembolso de gasto: Debe Cuentas por Pagar / Haber Caja */
export function buildExpenseReimbursementEntries(employeeName: string, description: string, amount: number, date?: string): DraftEntry[] {
  const d = date || todayISO();
  const desc = `Reembolso gasto — ${description} (${employeeName})`;
  return [
    { date: d, account: "cuentas-por-pagar", description: desc, debit: round2(amount), credit: 0, subcategory: "Gastos" },
    { date: d, account: "caja", description: desc, debit: 0, credit: round2(amount), subcategory: "Gastos" },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Banca: movimiento bancario directo
// ─────────────────────────────────────────────────────────────────────────────

/** Movimiento bancario: entrada → Debe Banco / Haber Ingresos; salida → Debe Gastos / Haber Banco */
export function buildBankTxEntries(description: string, amount: number, date?: string): DraftEntry[] {
  const d = date || todayISO();
  if (Math.abs(amount) < 0.005) return [];
  if (amount > 0) {
    return [
      { date: d, account: "banco", description, debit: round2(amount), credit: 0, subcategory: "Banca" },
      { date: d, account: "ingresos", description, debit: 0, credit: round2(amount), subcategory: "Banca" },
    ];
  }
  return [
    { date: d, account: "gastos-operativos", description, debit: round2(-amount), credit: 0, subcategory: "Banca" },
    { date: d, account: "banco", description, debit: 0, credit: round2(-amount), subcategory: "Banca" },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Contratos: cobro de facturación periódica
// ─────────────────────────────────────────────────────────────────────────────

/** Cobro de contrato: Debe Banco / Haber Ingresos */
export function buildContractBillingEntries(contractName: string, period: string, amount: number, date?: string): DraftEntry[] {
  const d = date || todayISO();
  const desc = `Cobro contrato ${contractName} — ${period}`;
  return [
    { date: d, account: "banco", description: desc, debit: round2(amount), credit: 0, subcategory: "Contratos" },
    { date: d, account: "ingresos", description: desc, debit: 0, credit: round2(amount), subcategory: "Contratos" },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Alquiler: cobro de renta
// ─────────────────────────────────────────────────────────────────────────────

/** Cobro de alquiler: Debe Banco / Haber Ingresos */
export function buildRentCollectionEntries(propertyName: string, period: string, amount: number, date?: string): DraftEntry[] {
  const d = date || todayISO();
  const desc = `Cobro alquiler ${propertyName} — ${period}`;
  return [
    { date: d, account: "banco", description: desc, debit: round2(amount), credit: 0, subcategory: "Alquiler" },
    { date: d, account: "ingresos", description: desc, debit: 0, credit: round2(amount), subcategory: "Alquiler" },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Flota: viaje con combustible y peajes
// ─────────────────────────────────────────────────────────────────────────────

/** Viaje de flota: Debe Gastos Operativos (combustible+peajes) / Haber Caja */
export function buildTripEntries(vehicleLabel: string, fuelCost: number, tolls: number, date?: string): DraftEntry[] {
  const d = date || todayISO();
  const total = round2(fuelCost + tolls);
  if (total < 0.005) return [];
  const desc = `Viaje flota — ${vehicleLabel}`;
  return [
    { date: d, account: "gastos-operativos", description: desc, debit: total, credit: 0, subcategory: "Flota" },
    { date: d, account: "caja", description: desc, debit: 0, credit: total, subcategory: "Flota" },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Mantenimiento: costos de órdenes de trabajo
// ─────────────────────────────────────────────────────────────────────────────

/** Orden de trabajo: Debe Gastos Operativos / Haber Caja */
export function buildMaintenanceEntries(assetName: string, description: string, cost: number, date?: string): DraftEntry[] {
  const d = date || todayISO();
  if (cost < 0.005) return [];
  const desc = `Mantenimiento ${assetName} — ${description}`;
  return [
    { date: d, account: "gastos-operativos", description: desc, debit: round2(cost), credit: 0, subcategory: "Mantenimiento" },
    { date: d, account: "caja", description: desc, debit: 0, credit: round2(cost), subcategory: "Mantenimiento" },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Seguros: siniestro pagado por la aseguradora
// ─────────────────────────────────────────────────────────────────────────────

/** Siniestro pagado: Debe Banco / Haber Ingresos (indemnización) */
export function buildClaimEntries(policyNumber: string, claimDescription: string, amount: number, date?: string): DraftEntry[] {
  const d = date || todayISO();
  if (amount < 0.005) return [];
  const desc = `Siniestro pagado — póliza ${policyNumber}: ${claimDescription}`;
  return [
    { date: d, account: "banco", description: desc, debit: round2(amount), credit: 0, subcategory: "Seguros" },
    { date: d, account: "ingresos", description: desc, debit: 0, credit: round2(amount), subcategory: "Seguros" },
  ];
}
