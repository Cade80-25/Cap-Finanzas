/**
 * Motor de Análisis Contable Determinista — "Asesor sin IA".
 *
 * Reemplaza las recomendaciones hardcodeadas de Recomendaciones.tsx por
 * análisis REAL sobre el journal del usuario (cap-finanzas-journal).
 *
 * Principios:
 * - 100% local, determinista, sin IA ni nube: funciona para cualquier usuario.
 * - Cada recomendación cita los números que la produjeron (evidencia).
 * - Las reglas son explicables: cada una devuelve por qué se dispara.
 *
 * El motor no escribe NADA: solo analiza y propone. El usuario decide.
 */

import type { JournalTransaction } from "@/hooks/useJournalTransactions";

export type RecPriority = "alta" | "media" | "baja";

export interface AnalisisRec {
  id: string;
  tipo: "Liquidez" | "Balance" | "Gastos" | "Patrimonio" | "Cumplimiento";
  titulo: string;
  descripcion: string;
  prioridad: RecPriority;
  evidencia: string; // números que la disparan
}

export interface ResumenFinanciero {
  totalDebe: number;
  totalHaber: number;
  descuadre: number; // |debe-haber| — si > 0.01 hay descuadre
  mes: string; // YYYY-MM analizado
  gastosMes: number;
  ingresosMes: number;
  resultadoMes: number; // ingresos - gastos
  topGastos: Array<{ cuenta: string; monto: number; pct: number }>;
}

const UMBRAL_DESCUADRE = 0.01;

function esGasto(account: string): boolean {
  const gastoKeywords = [
    "gasto", "gastos", "costo", "costos", "compra", "servicio", "alquiler",
    "sueldo", "salario", "impuesto", "iva", "marketing", "publicidad",
  ];
  const a = account.toLowerCase();
  return gastoKeywords.some((g) => a.includes(g));
}

function esIngreso(account: string): boolean {
  const ingresoKeywords = [
    "venta", "ingreso", "ingresos", "ventas", "facturacion", "facturación",
    "cobro", "servicios prestados", "revenue",
  ];
  const a = account.toLowerCase();
  return ingresoKeywords.some((g) => a.includes(g));
}

function fmt(n: number): string {
  return n.toLocaleString("es-UY", { maximumFractionDigits: 2 });
}

/**
 * Analiza el journal completo y devuelve un resumen del mes actual
 * más recomendaciones deterministas basadas en los datos reales.
 */
export function analizarJournal(
  journal: JournalTransaction[]
): { resumen: ResumenFinanciero; recs: AnalisisRec[] } {
  const now = new Date();
  const mes = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  let totalDebe = 0;
  let totalHaber = 0;
  const gastosPorCuenta = new Map<string, number>();
  let gastosMes = 0;
  let ingresosMes = 0;

  for (const t of journal) {
    totalDebe += t.debit || 0;
    totalHaber += t.credit || 0;
    const esDelMes = (t.date || "").startsWith(mes);
    if (!esDelMes) continue;
    if (esGasto(t.account)) {
      gastosMes += t.debit || 0;
      gastosPorCuenta.set(t.account, (gastosPorCuenta.get(t.account) || 0) + (t.debit || 0));
    } else if (esIngreso(t.account)) {
      ingresosMes += t.credit || 0;
    }
  }

  const descuadre = Math.abs(totalDebe - totalHaber);
  const resultadoMes = ingresosMes - gastosMes;

  const topGastos = [...gastosPorCuenta.entries()]
    .map(([cuenta, monto]) => ({
      cuenta,
      monto,
      pct: gastosMes > 0 ? (monto / gastosMes) * 100 : 0,
    }))
    .sort((a, b) => b.monto - a.monto)
    .slice(0, 5);

  const resumen: ResumenFinanciero = {
    totalDebe,
    totalHaber,
    descuadre,
    mes,
    gastosMes,
    ingresosMes,
    resultadoMes,
    topGastos,
  };

  const recs: AnalisisRec[] = [];

  // Regla 1: Descuadre del libro diario (siempre prioridad alta)
  if (descuadre > UMBRAL_DESCUADRE) {
    recs.push({
      id: "descuadre",
      tipo: "Balance",
      titulo: "Descuadre en el libro diario",
      descripcion:
        `El Debe (${fmt(totalDebe)}) y el Haber (${fmt(totalHaber)}) no cuadran por ${fmt(descuadre)}. ` +
        `Revisá las últimas transacciones cargadas o importadas antes del cierre.`,
      prioridad: "alta",
      evidencia: `Diferencia debe−haber = ${fmt(descuadre)}`,
    });
  }

  // Regla 2: Pérdida del mes
  if (resultadoMes < 0 && (ingresosMes > 0 || gastosMes > 0)) {
    recs.push({
      id: "perdida-mes",
      tipo: "Patrimonio",
      titulo: `Pérdida en ${mes}`,
      descripcion:
        `Los gastos del mes (${fmt(gastosMes)}) superan los ingresos (${fmt(ingresosMes)}). ` +
        `Identificá si es puntual o estructural antes del cierre contable.`,
      prioridad: "media",
      evidencia: `Resultado del mes = ${fmt(resultadoMes)}`,
    });
  }

  // Regla 3: Gastos sin ingresos registrados
  if (ingresosMes === 0 && gastosMes > 0) {
    recs.push({
      id: "sin-ingresos",
      tipo: "Liquidez",
      titulo: "Mes con gastos y sin ingresos registrados",
      descripcion:
        `Tenés gastos por ${fmt(gastosMes)} y ningún ingreso contabilizado este mes. ` +
        `Puede faltar registrar facturación o cobros.`,
      prioridad: "media",
      evidencia: `Ingresos del mes = 0; gastos = ${fmt(gastosMes)}`,
    });
  }

  // Regla 4: Concentración de gastos en una sola cuenta (>45%)
  const top1 = topGastos[0];
  if (top1 && top1.pct > 45 && top1.monto > 0) {
    recs.push({
      id: "concentracion-gastos",
      tipo: "Gastos",
      titulo: "Gastos concentrados en una cuenta",
      descripcion:
        `«${top1.cuenta}» concentra el ${top1.pct.toFixed(0)}% del gasto del mes (${fmt(top1.monto)}). ` +
        `Si es recurrente, negociá condiciones o buscá alternativas.`,
      prioridad: top1.pct > 65 ? "alta" : "media",
      evidencia: `${top1.cuenta}: ${fmt(top1.monto)} (${top1.pct.toFixed(1)}% del gasto)`,
    });
  }

  // Regla 5: Journal vacío
  if (journal.length === 0) {
    recs.push({
      id: "journal-vacio",
      tipo: "Cumplimiento",
      titulo: "Libro diario vacío",
      descripcion:
        "No hay transacciones registradas. Cargá tu primer movimiento desde el Libro Diario " +
        "o contabilizá desde los módulos (Comercio, Marketing, Startups, Auditoría).",
      prioridad: "baja",
      evidencia: "0 transacciones en el journal",
    });
  }

  return { resumen, recs };
}
