/**
 * Mapeo bidireccional entre categorías simples y cuentas contables.
 * 
 * Las categorías simples (modo Simple) se traducen a cuentas contables (modo Completo)
 * según las normas contables:
 * - Ingresos → cuenta "ingresos" (crédito)
 * - Gastos → cuenta "gastos-operativos" (débito)
 * - Ahorros → cuenta "activo-corriente" (débito, es un activo)
 * 
 * Y viceversa: las cuentas contables se traducen a categorías simples legibles.
 */

// Mapeo de categoría simple → cuenta contable
export const SIMPLE_TO_ACCOUNT: Record<string, string> = {
  // Ingresos
  "salario": "ingresos",
  "freelance": "ingresos",
  "ventas": "ingresos",
  "inversiones": "ingresos",
  "regalo": "ingresos",
  "devolucion": "ingresos",
  "otros-ingresos": "ingresos",
  
  // Gastos
  "alimentacion": "gastos-operativos",
  "transporte": "gastos-operativos",
  "vivienda": "gastos-operativos",
  "servicios": "gastos-operativos",
  "salud": "gastos-operativos",
  "entretenimiento": "gastos-operativos",
  "educacion": "gastos-operativos",
  "ropa": "gastos-operativos",
  "tecnologia": "gastos-operativos",
  "seguros": "gastos-operativos",
  "impuestos": "gastos-operativos",
  "ahorros": "activo-corriente", // Los ahorros son un activo, no un gasto
  "mascotas": "gastos-operativos",
  "otros-gastos": "gastos-operativos",
};

// Mapeo de cuenta contable → categoría simple (para mostrar en modo Simple)
export const ACCOUNT_TO_SIMPLE: Record<string, string> = {
  "ingresos": "otros-ingresos",
  "gastos-operativos": "otros-gastos",
  "activo-corriente": "ahorros",
  "activo-no-corriente": "vivienda",
  "pasivo-corriente": "servicios",
  "pasivo-no-corriente": "servicios",
  "patrimonio": "ahorros",
  "gastos-financieros": "servicios",
  "costo-ventas": "alimentacion",
  "banco": "ahorros",
  "caja": "ahorros",
  "cuentas-por-cobrar": "otros-ingresos",
  "cuentas-por-pagar": "servicios",
  "inventarios": "alimentacion",
  "depreciacion": "vivienda",
  "amortizacion": "vivienda",
};

// Mapeo de cuenta contable → tipo de categoría simple
export const ACCOUNT_TO_TYPE: Record<string, "income" | "expense"> = {
  "ingresos": "income",
  "gastos-operativos": "expense",
  "activo-corriente": "expense",
  "activo-no-corriente": "expense",
  "pasivo-corriente": "expense",
  "pasivo-no-corriente": "expense",
  "patrimonio": "expense",
  "gastos-financieros": "expense",
  "costo-ventas": "expense",
  "banco": "expense",
  "caja": "expense",
  "cuentas-por-cobrar": "income",
  "cuentas-por-pagar": "expense",
  "inventarios": "expense",
  "depreciacion": "expense",
  "amortizacion": "expense",
};

/**
 * Traduce una categoría simple a su cuenta contable correspondiente.
 * Si no existe mapeo, devuelve "gastos-operativos" como default.
 */
export function simpleToAccount(categoryId: string): string {
  return SIMPLE_TO_ACCOUNT[categoryId] || "gastos-operativos";
}

/**
 * Traduce una cuenta contable a su categoría simple correspondiente.
 * Si no existe mapeo, devuelve "otros-gastos" como default.
 */
export function accountToSimple(accountId: string): string {
  return ACCOUNT_TO_SIMPLE[accountId] || "otros-gastos";
}

/**
 * Traduce una cuenta contable a su tipo de categoría simple.
 * Si no existe mapeo, devuelve "expense" como default.
 */
export function accountToType(accountId: string): "income" | "expense" {
  return ACCOUNT_TO_TYPE[accountId] || "expense";
}

/**
 * Verifica si una categoría simple existe en el mapeo.
 */
export function isSimpleCategory(categoryId: string): boolean {
  return categoryId in SIMPLE_TO_ACCOUNT;
}

/**
 * Verifica si una cuenta contable existe en el mapeo.
 */
export function isAccount(accountId: string): boolean {
  return accountId in ACCOUNT_TO_SIMPLE;
}
