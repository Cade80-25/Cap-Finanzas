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
 *
 * El lookup es TOLERANTE: acepta mayúsculas/minúsculas, mojibake (Alimentaci뿯½n),
 * acentos (Alimentación → alimentacion) y la forma "Categoría / Subcategoría"
 * (busca primero la parte padre). Las categorías personalizadas del usuario que
 * no tienen mapeo se devuelven SIN CAMBIAR (identidad) — nunca se fuerzan a
 * "gastos-operativos", porque eso convertiría ingresos custom en gastos negativos.
 */
import { repairMojibake } from "./repairMojibake";

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
  "depreciacion-acumulada": "ahorros",
  "amortizacion": "vivienda",
  // Cuentas de empresa
  "sueldos": "otros-gastos",
  "cargas-sociales": "servicios",
  "produccion-en-curso": "ahorros",
  "productos-terminados": "ahorros",
  "materias-primas": "ahorros",
  "variacion-costos": "otros-gastos",
  "iva-por-pagar": "servicios",
  "iva-por-cobrar": "otros-ingresos",
  "compras": "otros-gastos",
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
  "depreciacion-acumulada": "expense",
  "amortizacion": "expense",
  // Cuentas de empresa
  "sueldos": "expense",
  "cargas-sociales": "expense",
  "produccion-en-curso": "expense",
  "productos-terminados": "expense",
  "materias-primas": "expense",
  "variacion-costos": "expense",
  "iva-por-pagar": "expense",
  "iva-por-cobrar": "income",
  "compras": "expense",
};

/**
 * Normaliza un nombre de categoría para lookup tolerante:
 * repara mojibake, recorta espacios, minúsculas, sin acentos, espacios→guiones.
 */
function normalizeSlug(name: string): string {
  return repairMojibake(name)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");
}

// Índice normalizado para lookup tolerante (claves normalizadas → cuenta contable)
const SIMPLE_LOOKUP: Record<string, string> = {};
for (const [key, value] of Object.entries(SIMPLE_TO_ACCOUNT)) {
  SIMPLE_LOOKUP[normalizeSlug(key)] = value;
}

/**
 * Traduce una categoría simple a su cuenta contable correspondiente.
 *
 * Cadena de lookup: exacto → partes de "Categoría / Subcategoría" (padre primero)
 * → heurística de ahorros → IDENTIDAD (categoría personalizada sin mapeo).
 */
export function simpleToAccount(categoryId: string): string {
  if (!categoryId) return "gastos-operativos";
  const direct = SIMPLE_TO_ACCOUNT[categoryId];
  if (direct) return direct;

  // "Categoría / Subcategoría" → intentar la parte padre primero
  const parts = categoryId.split("/").map((p) => p.trim()).filter(Boolean);
  for (const part of parts) {
    const hit = SIMPLE_LOOKUP[normalizeSlug(part)];
    if (hit) return hit;
  }

  // Heurística: cuentas de ahorro personalizadas ("Ahorro Vacaciones") son activos
  if (normalizeSlug(categoryId).startsWith("ahorro")) return "activo-corriente";

  // Identidad: no forzar categorías personalizadas a gastos-operativos
  return categoryId;
}

/**
 * Traduce una cuenta contable a su categoría simple correspondiente.
 * Si no existe mapeo, devuelve la cuenta original (identidad).
 */
export function accountToSimple(accountId: string): string {
  return ACCOUNT_TO_SIMPLE[accountId] || accountId;
}

/**
 * Traduce una cuenta contable a su tipo de categoría simple.
 * Si no existe mapeo, devuelve "expense" como default.
 */
export function accountToType(accountId: string): "income" | "expense" {
  return ACCOUNT_TO_TYPE[accountId] || "expense";
}

/**
 * Verifica si una categoría simple existe en el mapeo
 * (incluye las variantes tolerantes: mayúsculas, mojibake, acentos).
 */
export function isSimpleCategory(categoryId: string): boolean {
  if (!categoryId) return false;
  return simpleToAccount(categoryId) !== categoryId;
}

/**
 * Verifica si una cuenta contable existe en el mapeo.
 */
export function isAccount(accountId: string): boolean {
  return accountId in ACCOUNT_TO_SIMPLE;
}
