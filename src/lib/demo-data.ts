/**
 * Demo data loader: seeds the user's localStorage with realistic transactions
 * so they can explore the app without entering anything. Reversible: removeDemoData()
 * cleans up.
 */

const DEMO_FLAG_KEY = "cap-finanzas-demo-active";
const JOURNAL_KEY = "cap-finanzas-journal";
const BUDGETS_KEY = "cap-finanzas-budgets";

const DEMO_BACKUP_KEY = "cap-finanzas-demo-backup";

interface DemoTx {
  date: string;
  account: string;
  description: string;
  debit: number;
  credit: number;
}

function buildDemoTransactions(): DemoTx[] {
  const today = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const daysAgo = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    return iso(d);
  };

  return [
    // Ingresos
    { date: daysAgo(28), account: "ingresos-sueldo", description: "Sueldo mensual", debit: 0, credit: 65000 },
    { date: daysAgo(14), account: "ingresos-freelance", description: "Proyecto freelance", debit: 0, credit: 12000 },
    { date: daysAgo(2), account: "ingresos-otros", description: "Venta de items usados", debit: 0, credit: 3500 },
    // Vivienda
    { date: daysAgo(27), account: "gastos-vivienda", description: "Alquiler", debit: 18000, credit: 0 },
    { date: daysAgo(25), account: "gastos-servicios", description: "Internet", debit: 1200, credit: 0 },
    { date: daysAgo(24), account: "gastos-servicios", description: "Luz", debit: 2100, credit: 0 },
    { date: daysAgo(22), account: "gastos-servicios", description: "Agua", debit: 900, credit: 0 },
    // Alimentación
    { date: daysAgo(26), account: "gastos-alimentacion", description: "Compra supermercado", debit: 5400, credit: 0 },
    { date: daysAgo(20), account: "gastos-alimentacion", description: "Supermercado", debit: 4900, credit: 0 },
    { date: daysAgo(13), account: "gastos-alimentacion", description: "Supermercado", debit: 5100, credit: 0 },
    { date: daysAgo(6), account: "gastos-alimentacion", description: "Supermercado", debit: 4800, credit: 0 },
    { date: daysAgo(18), account: "gastos-alimentacion", description: "Almuerzo de trabajo", debit: 650, credit: 0 },
    { date: daysAgo(11), account: "gastos-alimentacion", description: "Café", debit: 320, credit: 0 },
    // Transporte
    { date: daysAgo(21), account: "gastos-transporte", description: "Carga combustible", debit: 2200, credit: 0 },
    { date: daysAgo(10), account: "gastos-transporte", description: "Carga combustible", debit: 2350, credit: 0 },
    { date: daysAgo(15), account: "gastos-transporte", description: "Transporte público", debit: 450, credit: 0 },
    // Ocio
    { date: daysAgo(17), account: "gastos-ocio", description: "Suscripción streaming", debit: 800, credit: 0 },
    { date: daysAgo(8), account: "gastos-ocio", description: "Cena con amigos", debit: 2400, credit: 0 },
    { date: daysAgo(3), account: "gastos-ocio", description: "Cine", debit: 700, credit: 0 },
    // Salud
    { date: daysAgo(19), account: "gastos-salud", description: "Farmacia", debit: 980, credit: 0 },
    { date: daysAgo(5), account: "gastos-salud", description: "Consulta médica", debit: 1800, credit: 0 },
    // Educación
    { date: daysAgo(12), account: "gastos-educacion", description: "Libro técnico", debit: 1500, credit: 0 },
    // Ahorro / inversión
    { date: daysAgo(28), account: "gastos-otros", description: "Aporte ahorro mensual", debit: 8000, credit: 0 },
    // Recientes
    { date: daysAgo(1), account: "gastos-alimentacion", description: "Panadería", debit: 280, credit: 0 },
    { date: daysAgo(1), account: "gastos-transporte", description: "Taxi", debit: 540, credit: 0 },
    { date: daysAgo(0), account: "gastos-alimentacion", description: "Café", debit: 320, credit: 0 },
  ];
}

function buildDemoBudgets() {
  return [
    {
      id: "demo-budget-1",
      name: "Presupuesto mensual",
      month: new Date().toISOString().slice(0, 7),
      categories: [
        { account: "gastos-alimentacion", amount: 25000 },
        { account: "gastos-vivienda", amount: 22000 },
        { account: "gastos-transporte", amount: 6000 },
        { account: "gastos-ocio", amount: 5000 },
        { account: "gastos-salud", amount: 4000 },
      ],
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ];
}

export function isDemoActive(): boolean {
  return localStorage.getItem(DEMO_FLAG_KEY) === "1";
}

export function loadDemoData() {
  // Snapshot existing data so the user can roll back.
  if (!localStorage.getItem(DEMO_BACKUP_KEY)) {
    const backup = {
      journal: localStorage.getItem(JOURNAL_KEY),
      budgets: localStorage.getItem(BUDGETS_KEY),
    };
    localStorage.setItem(DEMO_BACKUP_KEY, JSON.stringify(backup));
  }

  const txs = buildDemoTransactions().map((t, i) => ({
    id: Date.now() + i,
    ...t,
  }));
  localStorage.setItem(JOURNAL_KEY, JSON.stringify(txs));
  localStorage.setItem(BUDGETS_KEY, JSON.stringify(buildDemoBudgets()));
  localStorage.setItem(DEMO_FLAG_KEY, "1");
}

export function clearDemoData() {
  try {
    const raw = localStorage.getItem(DEMO_BACKUP_KEY);
    if (raw) {
      const backup = JSON.parse(raw) as { journal: string | null; budgets: string | null };
      if (backup.journal != null) localStorage.setItem(JOURNAL_KEY, backup.journal);
      else localStorage.removeItem(JOURNAL_KEY);
      if (backup.budgets != null) localStorage.setItem(BUDGETS_KEY, backup.budgets);
      else localStorage.removeItem(BUDGETS_KEY);
    } else {
      localStorage.removeItem(JOURNAL_KEY);
      localStorage.removeItem(BUDGETS_KEY);
    }
  } catch {
    localStorage.removeItem(JOURNAL_KEY);
    localStorage.removeItem(BUDGETS_KEY);
  }
  localStorage.removeItem(DEMO_BACKUP_KEY);
  localStorage.removeItem(DEMO_FLAG_KEY);
}
