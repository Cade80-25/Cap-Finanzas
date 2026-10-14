/**
 * Demo EMPRESARIAL: "Ferretería El Umbral S.R.L." — paquete de muestra completo.
 * 3 meses de operación de una ferretería mediana uruguaya:
 * contabilidad doble con IVA 22%, facturación, inventario, RRHH, TPV, CRM,
 * cuentas corrientes, seguros, activos fijos y presupuesto.
 *
 * Mecánica idéntica al demo personal (demo-data.ts): snapshot reversible de
 * TODAS las claves que escribe, restore al salir, purge para empezar de cero.
 * Sin nube, sin dependencias: 100% local y determinista.
 */

const DEMO_FLAG_KEY = "cap-finanzas-demo-empresarial-active";
const DEMO_BACKUP_KEY = "cap-finanzas-demo-empresarial-backup";

// Todas las claves que este demo escribe (para snapshot/restore completo).
const DEMO_KEYS = [
  "cap-finanzas-journal",
  "cap-finanzas-categorias",
  "cap-finanzas-contacts",
  "cap-finanzas-cc-movements",
  "cap-finanzas-invoices",
  "cap-finanzas-vat-config",
  "cap-finanzas-inventario-items",
  "cap-finanzas-inventario-movements",
  "cap-finanzas-rrhh-employees",
  "cap-finanzas-rrhh-payroll",
  "cap-finanzas-tpv",
  "cap-finanzas-crm",
  "cap-finanzas-budgets",
  "cap-finanzas-tesoreria-cuentas",
  "cap-finanzas-seguros-polizas",
  "cap-finanzas-activos-assets",
] as const;

const uid = (p: string) =>
  `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

const today = new Date();
const iso = (d: Date) => d.toISOString().slice(0, 10);
const daysAgo = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return iso(d);
};
const monthsAgo = (n: number) => {
  const d = new Date(today);
  d.setMonth(d.getMonth() - n);
  return iso(d);
};

/** Registro del libro diario (formato plano de useJournalTransactions). */
interface JournalRow {
  id: number;
  date: string;
  account: string;
  description: string;
  debit: number;
  credit: number;
}

/** Asiento = filas que comparten descripción. Validado D == C en build. */
function buildJournal(): JournalRow[] {
  const rows: JournalRow[] = [];
  let id = 1;
  const addTx = (date: string, description: string, lines: [string, number, number][]) => {
    const D = lines.reduce((s, l) => s + l[1], 0);
    const C = lines.reduce((s, l) => s + l[2], 0);
    if (D !== C) throw new Error(`Descuadre en asiento "${description}": D=${D} C=${C}`);
    for (const [account, debit, credit] of lines) {
      rows.push({ id: id++, date, account, description, debit, credit });
    }
  };

  addTx(monthsAgo(3), "Asiento de apertura", [
    ["Caja", 150000, 0],
    ["Banco BROU $", 480000, 0],
    ["Deudores comerciales", 85000, 0],
    ["Inventario de mercaderías", 260000, 0],
    ["Muebles y útiles", 120000, 0],
    ["Rodados", 350000, 0],
    ["Instalaciones", 90000, 0],
    ["Proveedores", 0, 180000],
    ["IVA a pagar (DGI)", 0, 42000],
    ["Préstamo bancario", 0, 250000],
    ["Capital social", 0, 1063000],
  ]);

  const meses = [
    { n: 3, ventas: 385000, servicios: 22000, cmv: 248000, compras: 236000 },
    { n: 2, ventas: 442000, servicios: 28000, cmv: 284000, compras: 270000 },
    { n: 1, ventas: 401000, servicios: 25000, cmv: 259000, compras: 246000 },
  ];
  for (const m of meses) {
    const f = monthsAgo(m.n);
    const contado = Math.round(m.ventas * 0.7);
    const credito = m.ventas - contado;
    const netoC = Math.round(contado / 1.22);
    const ivaC = contado - netoC;
    const netoK = Math.round(credito / 1.22);
    const ivaK = credito - netoK;
    const ivaCompras = Math.round(m.compras * 0.22);

    addTx(f, "Ventas de mercaderías al contado", [
      ["Caja", contado, 0],
      ["Ventas de mercaderías", 0, netoC],
      ["IVA a pagar (DGI)", 0, ivaC],
    ]);
    addTx(f, "Ventas de mercaderías a crédito", [
      ["Deudores comerciales", credito, 0],
      ["Ventas de mercaderías", 0, netoK],
      ["IVA a pagar (DGI)", 0, ivaK],
    ]);
    addTx(f, "Servicios de instalación facturados", [
      ["Caja", Math.round(m.servicios * 1.22), 0],
      ["Servicios de instalación", 0, m.servicios],
      ["IVA a pagar (DGI)", 0, Math.round(m.servicios * 0.22)],
    ]);
    addTx(f, "Costo de ventas del mes", [
      ["Costo de ventas", m.cmv, 0],
      ["Inventario de mercaderías", 0, m.cmv],
    ]);
    addTx(f, "Sueldos y BPS del mes", [
      ["Sueldos y jornales", 145000, 0],
      ["BPS salud (aporte patronal)", 7500, 0],
      ["Caja", 0, 152500],
    ]);
    addTx(f, "Alquiler del local", [
      ["Alquiler local", 32000, 0],
      ["Caja", 0, 32000],
    ]);
    addTx(f, "Compras a proveedores del mes", [
      ["Inventario de mercaderías", m.compras, 0],
      ["IVA a pagar (DGI)", ivaCompras, 0],
      ["Proveedores", 0, m.compras + ivaCompras],
    ]);
    addTx(f, "Pago a proveedores del mes", [
      ["Proveedores", m.compras + ivaCompras, 0],
      ["Banco BROU $", 0, m.compras + ivaCompras],
    ]);
    addTx(f, "Electricidad y agua", [
      ["Electricidad y agua", 4200, 0],
      ["Caja", 0, 4200],
    ]);
    addTx(f, "Publicidad en redes", [
      ["Publicidad", 2800, 0],
      ["Caja", 0, 2800],
    ]);
  }
  return rows;
}

// __APPEND_1__

interface DemoContact {
  id: string;
  name: string;
  type: string;
  taxId?: string;
  phone?: string;
  email?: string;
  notes?: string;
  createdAt: string;
}

function buildContactos(): DemoContact[] {
  return [
    { id: uid("ct"), name: "Constructora Fernández S.A.", type: "cliente", taxId: "211234560014", phone: "2401 2345", email: "compras@constructorafernandez.com", notes: "Cuenta corriente 30 días", createdAt: monthsAgo(3) },
    { id: uid("ct"), name: "Ana Ferreira", type: "cliente", taxId: "450123456", phone: "099 123 456", email: "ana.ferreira@gmail.com", notes: "", createdAt: monthsAgo(3) },
    { id: uid("ct"), name: "Estudio Vera & Asoc.", type: "cliente", taxId: "211987650013", phone: "2402 8765", email: "admin@estudiovera.com", notes: "", createdAt: monthsAgo(2) },
    { id: uid("ct"), name: "Ferretería Mayorista del Sur", type: "proveedor", taxId: "215432100011", phone: "2487 6543", email: "ventas@mayoristadelsur.com", notes: "Entrega a domicilio 48hs", createdAt: monthsAgo(3) },
    { id: uid("ct"), name: "Pinturas Colorshop SRL", type: "proveedor", taxId: "216789450012", phone: "2409 6677", email: "pedidos@colorshop.uy", notes: "", createdAt: monthsAgo(3) },
    { id: uid("ct"), name: "Distribuidora Río Negro S.A.", type: "proveedor", taxId: "219998870015", phone: "2413 4455", email: "ventas@distriuruguay.com", notes: "", createdAt: monthsAgo(1) },
  ];
}

interface DemoInvoiceLine { description: string; quantity: number; unitPrice: number; }

function buildInvoices(contactos: DemoContact[]): unknown[] {
  const inv: unknown[] = [];
  let n = 1;
  const mk = (date: string, contact: DemoContact, lines: DemoInvoiceLine[], status: string) => {
    const subtotal = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
    const vatAmount = Math.round(subtotal * 0.22);
    inv.push({
      id: uid("inv"),
      number: `FAC-${String(n).padStart(4, "0")}`,
      type: "factura",
      date,
      dueDate: date,
      contactId: contact.id,
      contactName: contact.name,
      items: lines.map((l) => ({
        id: uid("it"), description: l.description,
        quantity: l.quantity, unitPrice: l.unitPrice, vatRate: 22,
      })),
      subtotal,
      vatAmount,
      total: subtotal + vatAmount,
      status,
      createdAt: date,
    });
    n++;
  };
  mk(monthsAgo(2), contactos[0], [
    { description: "Cemento portland 50kg x 40", quantity: 40, unitPrice: 340 },
    { description: "Cal hidratada 25kg x 20", quantity: 20, unitPrice: 180 },
  ], "pagada");
  mk(monthsAgo(1), contactos[1], [
    { description: "Grifería cocina monocomando", quantity: 1, unitPrice: 3900 },
    { description: "Flexibles y fittings", quantity: 4, unitPrice: 320 },
  ], "pagada");
  mk(daysAgo(12), contactos[2], [
    { description: "Pintura látex interior 20L x 6", quantity: 6, unitPrice: 2450 },
    { description: "Rodillos y bandejas", quantity: 6, unitPrice: 380 },
  ], "pendiente");
  mk(daysAgo(4), contactos[0], [
    { description: "Tubería PVC 110mm x 3m — 30 uds", quantity: 30, unitPrice: 620 },
    { description: "Codos y reducciones", quantity: 50, unitPrice: 95 },
  ], "pendiente");
  return inv;
}

function buildCcMovements(contactos: DemoContact[]): unknown[] {
  const cli1 = contactos[0], cli2 = contactos[1], prov1 = contactos[3];
  return [
    { id: uid("mv"), contactId: cli1.id, date: daysAgo(40), kind: "factura", amount: 121080, description: "Factura FAC-0001 — materiales obra Pocitos", createdAt: daysAgo(40) },
    { id: uid("mv"), contactId: cli1.id, date: daysAgo(25), kind: "cobro", amount: 121080, description: "Cobro por transferencia bancaria", createdAt: daysAgo(25) },
    { id: uid("mv"), contactId: cli2.id, date: daysAgo(18), kind: "factura", amount: 48800, description: "Factura FAC-0002 — sanitarios y grifería", createdAt: daysAgo(18) },
    { id: uid("mv"), contactId: cli2.id, date: daysAgo(5), kind: "cobro", amount: 48800, description: "Cobro en efectivo en local", createdAt: daysAgo(5) },
    { id: uid("mv"), contactId: prov1.id, date: daysAgo(30), kind: "factura", amount: 288120, description: "Compra de mercaderías — al crédito 30 días", createdAt: daysAgo(30) },
    { id: uid("mv"), contactId: prov1.id, date: daysAgo(2), kind: "pago", amount: 288120, description: "Pago por transferencia BROU", createdAt: daysAgo(2) },
  ];
}

interface DemoInvItem {
  id: string; sku: string; name: string; category: string; unit: string;
  quantity: number; minimumStock: number; unitCost: number; method: string;
  location: string; createdAt: string;
}

function buildInventario(): { items: DemoInvItem[]; movements: unknown[] } {
  const items: DemoInvItem[] = [
    { id: uid("inv"), sku: "CEM-50", name: "Cemento portland 50kg", category: "Materiales", unit: "bolsa", quantity: 85, minimumStock: 40, unitCost: 340, method: "promedio", location: "Depósito A", createdAt: monthsAgo(3) },
    { id: uid("inv"), sku: "CAL-25", name: "Cal hidratada 25kg", category: "Materiales", unit: "bolsa", quantity: 12, minimumStock: 20, unitCost: 180, method: "promedio", location: "Depósito A", createdAt: monthsAgo(3) },
    { id: uid("inv"), sku: "LAT-20", name: "Pintura látex interior 20L", category: "Pinturas", unit: "balde", quantity: 34, minimumStock: 15, unitCost: 2450, method: "promedio", location: "Local", createdAt: monthsAgo(3) },
    { id: uid("inv"), sku: "PVC-110", name: "Tubería PVC 110mm x 3m", category: "Sanitarios", unit: "unidad", quantity: 48, minimumStock: 30, unitCost: 620, method: "promedio", location: "Depósito B", createdAt: monthsAgo(2) },
    { id: uid("inv"), sku: "GRI-COC", name: "Grifería cocina monocomando", category: "Sanitarios", unit: "unidad", quantity: 9, minimumStock: 5, unitCost: 3900, method: "promedio", location: "Local", createdAt: monthsAgo(2) },
    { id: uid("inv"), sku: "TOR-200", name: "Tornillos autoperforantes caja 200", category: "Ferretería", unit: "caja", quantity: 3, minimumStock: 10, unitCost: 450, method: "promedio", location: "Depósito A", createdAt: monthsAgo(1) },
  ];
  const movements = [
    { id: uid("mv"), itemId: items[0].id, date: daysAgo(75), type: "entrada", quantity: 120, unitCost: 340, reference: "Compra Mayorista del Sur", createdAt: daysAgo(75) },
    { id: uid("mv"), itemId: items[0].id, date: daysAgo(50), type: "salida", quantity: 35, unitCost: 340, reference: "Venta FAC-0001", createdAt: daysAgo(50) },
    { id: uid("mv"), itemId: items[2].id, date: daysAgo(60), type: "entrada", quantity: 40, unitCost: 2450, reference: "Compra Colorshop", createdAt: daysAgo(60) },
    { id: uid("mv"), itemId: items[2].id, date: daysAgo(12), type: "salida", quantity: 6, unitCost: 2450, reference: "Venta FAC-0003", createdAt: daysAgo(12) },
    { id: uid("mv"), itemId: items[3].id, date: daysAgo(55), type: "entrada", quantity: 80, unitCost: 620, reference: "Compra Distribuidora Río Negro", createdAt: daysAgo(55) },
    { id: uid("mv"), itemId: items[3].id, date: daysAgo(4), type: "salida", quantity: 12, unitCost: 620, reference: "Venta FAC-0004", createdAt: daysAgo(4) },
    { id: uid("mv"), itemId: items[5].id, date: daysAgo(20), type: "salida", quantity: 2, unitCost: 450, reference: "Venta de mostrador", createdAt: daysAgo(20) },
  ];
  return { items, movements };
}

// __APPEND_2__

function buildRRHH(): { employees: unknown[]; payroll: unknown[] } {
  const employees = [
    { id: uid("emp"), name: "Marta Rodríguez", position: "Encargada de local", department: "Ventas", hireDate: monthsAgo(36), salaryBase: 52000, currency: "UYU", status: "activo", createdAt: monthsAgo(36) },
    { id: uid("emp"), name: "Diego Sosa", position: "Vendedor", department: "Ventas", hireDate: monthsAgo(18), salaryBase: 42000, currency: "UYU", status: "activo", createdAt: monthsAgo(18) },
    { id: uid("emp"), name: "Laura Prieto", position: "Contadora (externa)", department: "Administración", hireDate: monthsAgo(24), salaryBase: 28000, currency: "UYU", status: "activo", createdAt: monthsAgo(24) },
    { id: uid("emp"), name: "Pablo Techera", position: "Depósito y reparto", department: "Operaciones", hireDate: monthsAgo(8), salaryBase: 38000, currency: "UYU", status: "activo", createdAt: monthsAgo(8) },
  ];
  const payroll: unknown[] = [];
  for (const per of [monthsAgo(2).slice(0, 7), monthsAgo(1).slice(0, 7)]) {
    for (const e of employees) {
      const emp = e as { id: string; position: string; salaryBase: number };
      const bonif = emp.position.includes("Vendedor") ? 3000 : 0;
      const deductions = Math.round(emp.salaryBase * 0.18);
      payroll.push({
        id: uid("pr"), employeeId: emp.id, period: per,
        baseSalary: emp.salaryBase, bonifications: bonif, overtime: 0,
        deductions, netPay: emp.salaryBase + bonif - deductions, paid: true,
        paidDate: `${per}-28`, createdAt: `${per}-28`,
      });
    }
  }
  return { employees, payroll };
}

function buildTPV(): unknown[] {
  const tpv: unknown[] = [];
  const productos: [string, number][] = [
    ["Tornillos autoperforantes caja 200", 450],
    ["Bujes y terminales surtidos", 320],
    ["Cinta aisladora 20m", 190],
    ["Guantes de trabajo", 350],
    ["Llaves allen juego", 780],
  ];
  let seed = 1;
  for (let d = 90; d >= 0; d -= 3) {
    const items = [productos[seed % 5], productos[(seed + 2) % 5]];
    const subtotal = items.reduce((s, [n, p]) => s + p, 0);
    tpv.push({
      id: uid("tpv"), date: daysAgo(d),
      items: items.map(([name, price]) => ({ name, qty: 1, price })),
      subtotal, tax: Math.round(subtotal * 0.22),
      total: subtotal + Math.round(subtotal * 0.22),
      payment: ["efectivo", "tarjeta", "qr"][seed % 3], status: "cerrada",
      cashier: "Marta Rodríguez", createdAt: daysAgo(d),
    });
    seed++;
  }
  return tpv;
}

function buildCRM(): unknown[] {
  return [
    { id: uid("ld"), name: "Rubén Olascoaga", company: "Obras Montevideo S.A.", email: "r.olascoaga@obrasmvd.com", phone: "099 887 221", status: "contactado", source: "referido", value: 85000, probability: 40, expectedDate: daysAgo(-15), createdAt: daysAgo(9) },
    { id: uid("ld"), name: "Carla Méndez", company: "Refacción Hogar", email: "carla@refaccionhogar.uy", phone: "098 445 667", status: "propuesta", source: "web", value: 120000, probability: 65, expectedDate: daysAgo(-8), createdAt: daysAgo(14) },
    { id: uid("ld"), name: "Julio Bermúdez", company: "Constructora Salto", email: "jbermudez@consalto.com", phone: "4732 8890", status: "ganado", source: "feria", value: 210000, probability: 100, expectedDate: daysAgo(3), createdAt: daysAgo(30) },
    { id: uid("ld"), name: "Viviana Ferreira", company: "Arquitecta independiente", email: "vivi@estudiovf.com", phone: "091 223 456", status: "nuevo", source: "redes", value: 45000, probability: 15, expectedDate: daysAgo(-25), createdAt: daysAgo(2) },
  ];
}

/** ¿Está activo el demo empresarial? */
export function isDemoEmpresarialActive(): boolean {
  return localStorage.getItem(DEMO_FLAG_KEY) === "1";
}

/** Carga el demo empresarial con snapshot reversible de todas las claves. */
export function loadDemoEmpresarial(): void {
  // Guard: si el demo personal está activo, no mezclar (claves solapadas).
  if (localStorage.getItem("cap-finanzas-demo-active") === "1") {
    throw new Error("Demo personal activo: salí de él antes de cargar el demo empresarial.");
  }
  // Snapshot del estado actual de TODAS las claves que vamos a sobreescribir.
  if (!localStorage.getItem(DEMO_BACKUP_KEY)) {
    const snap: Record<string, string | null> = {};
    for (const k of DEMO_KEYS) snap[k] = localStorage.getItem(k);
    localStorage.setItem(DEMO_BACKUP_KEY, JSON.stringify(snap));
  }

  const contactos = buildContactos();
  const inv = buildInventario();
  const rrhh = buildRRHH();

  localStorage.setItem("cap-finanzas-journal", JSON.stringify(buildJournal()));
  localStorage.setItem("cap-finanzas-categorias", JSON.stringify([
    { id: uid("cat"), name: "Sueldos", type: "gasto", color: "#ef4444", icon: "briefcase" },
    { id: uid("cat"), name: "Alquiler", type: "gasto", color: "#f97316", icon: "home" },
    { id: uid("cat"), name: "Servicios", type: "gasto", color: "#eab308", icon: "zap" },
    { id: uid("cat"), name: "Compras", type: "gasto", color: "#8b5cf6", icon: "package" },
    { id: uid("cat"), name: "Ventas", type: "ingreso", color: "#10b981", icon: "shopping-cart" },
    { id: uid("cat"), name: "Instalación", type: "ingreso", color: "#06b6d4", icon: "wrench" },
  ]));
  localStorage.setItem("cap-finanzas-contacts", JSON.stringify(contactos));
  localStorage.setItem("cap-finanzas-cc-movements", JSON.stringify(buildCcMovements(contactos)));
  localStorage.setItem("cap-finanzas-invoices", JSON.stringify(buildInvoices(contactos)));
  localStorage.setItem("cap-finanzas-vat-config", JSON.stringify({
    defaultRate: 22, availableRates: [0, 10, 22], invoicePrefix: "FAC",
    creditNotePrefix: "NC", debitNotePrefix: "ND", nextNumber: 5, taxName: "IVA",
  }));
  localStorage.setItem("cap-finanzas-inventario-items", JSON.stringify(inv.items));
  localStorage.setItem("cap-finanzas-inventario-movements", JSON.stringify(inv.movements));
  localStorage.setItem("cap-finanzas-rrhh-employees", JSON.stringify(rrhh.employees));
  localStorage.setItem("cap-finanzas-rrhh-payroll", JSON.stringify(rrhh.payroll));
  localStorage.setItem("cap-finanzas-tpv", JSON.stringify(buildTPV()));
  localStorage.setItem("cap-finanzas-crm", JSON.stringify(buildCRM()));
  localStorage.setItem("cap-finanzas-budgets", JSON.stringify([
    {
      id: uid("bud"), name: "Presupuesto operativo mensual",
      month: new Date().toISOString().slice(0, 7),
      categories: [
        { account: "Sueldos y jornales", amount: 145000 },
        { account: "Alquiler local", amount: 32000 },
        { account: "Electricidad y agua", amount: 4500 },
        { account: "Publicidad", amount: 3000 },
      ],
      isActive: true, createdAt: daysAgo(28),
    },
  ]));
  localStorage.setItem("cap-finanzas-tesoreria-cuentas", JSON.stringify([
    { id: uid("tes"), name: "Caja chica", type: "efectivo", currency: "UYU", openingBalance: 15000, createdAt: monthsAgo(3) },
    { id: uid("tes"), name: "Cuenta corriente BROU", type: "banco", currency: "UYU", openingBalance: 480000, createdAt: monthsAgo(3) },
  ]));
  localStorage.setItem("cap-finanzas-seguros-polizas", JSON.stringify([
    { id: uid("pol"), tipo: "Incendio y robo — local comercial", aseguradora: "Mapfre Uruguay", poliza: "MAP-88123", prima: 18500, vigenciaDesde: monthsAgo(2), vigenciaHasta: monthsAgo(-10), estado: "activa", createdAt: monthsAgo(2) },
    { id: uid("pol"), tipo: "Vehículo — camioneta Kangoo", aseguradora: "Sancor Seguros", poliza: "SAN-45677", prima: 24200, vigenciaDesde: monthsAgo(1), vigenciaHasta: monthsAgo(-11), estado: "activa", createdAt: monthsAgo(1) },
  ]));
  localStorage.setItem("cap-finanzas-activos-assets", JSON.stringify([
    { id: uid("act"), name: "Camioneta Renault Kangoo", category: "Rodados", acquisitionDate: monthsAgo(36), cost: 350000, usefulLife: 60, residualValue: 50000, method: "lineal", createdAt: monthsAgo(36) },
    { id: uid("act"), name: "Muebles y estanterías del local", category: "Muebles y útiles", acquisitionDate: monthsAgo(30), cost: 120000, usefulLife: 120, residualValue: 0, method: "lineal", createdAt: monthsAgo(30) },
    { id: uid("act"), name: "Equipos de aire y balanza", category: "Instalaciones", acquisitionDate: monthsAgo(30), cost: 90000, usefulLife: 84, residualValue: 9000, method: "lineal", createdAt: monthsAgo(30) },
  ]));

  localStorage.setItem(DEMO_FLAG_KEY, "1");
}

/** Restaura el estado previo al demo (todas las claves del snapshot). */
export function clearDemoEmpresarial(): void {
  try {
    const raw = localStorage.getItem(DEMO_BACKUP_KEY);
    if (raw) {
      const snap = JSON.parse(raw) as Record<string, string | null>;
      for (const k of DEMO_KEYS) {
        if (snap[k] != null) localStorage.setItem(k, snap[k]);
        else localStorage.removeItem(k);
      }
    } else {
      for (const k of DEMO_KEYS) localStorage.removeItem(k);
    }
  } catch {
    for (const k of DEMO_KEYS) localStorage.removeItem(k);
  }
  localStorage.removeItem(DEMO_BACKUP_KEY);
  localStorage.removeItem(DEMO_FLAG_KEY);
}

/** Sale del demo SIN restaurar: borra todas las claves del demo. */
export function purgeDemoEmpresarial(): void {
  for (const k of DEMO_KEYS) localStorage.removeItem(k);
  localStorage.removeItem(DEMO_BACKUP_KEY);
  localStorage.removeItem(DEMO_FLAG_KEY);
}
