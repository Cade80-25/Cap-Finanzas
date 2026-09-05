/**
 * Perfil geográfico — dato maestro del usuario que configura todo el marco contable.
 *
 * La ZONA GEOGRÁFICA DE RESIDENCIA es el dato primario. Al elegir país/región,
 * la app importa: moneda, formato numérico, idioma, e impuestos (nacional,
 * provincial/municipal, comercial) + normas contables locales.
 *
 * Diseñado como módulo extensible: cada país es una entrada en REGIONES.
 * Las tasas son de referencia (IVA/VAT/sales tax estándar). Los impuestos
 * subnacionales (provinciales/municipales) se modelan como `subnationalTaxes`
 * para los países donde aplican; el usuario puede ajustarlas en Configuración.
 */

export type SubnationalTax = {
  /** Nombre del impuesto subnacional (ej. "Impuesto municipal"). */
  label: string;
  /** Tasa en porcentaje o null si es variable/por localidad. */
  ratePercent: number | null;
  /** Ámbito al que aplica. */
  scope: "regional" | "municipal" | "comercial";
};

export type GeographicProfile = {
  /** Código ISO 3166-1 alpha-2. */
  code: string;
  /** Nombre en español. */
  name: string;
  /** Idioma primario (código IETF, ej. "es-UY"). */
  language: string;
  /** Moneda ISO 4217. */
  currency: string;
  /** Nombre local del impuesto al valor (IVA / VAT / GST / sales tax...). */
  taxName: string;
  /** Tasa estándar del impuesto al valor, en %. */
  standardTaxRate: number;
  /** Tasas reducidas (si existen). */
  reducedTaxRates?: { label: string; ratePercent: number }[];
  /** Impuestos subnacionales (provinciales/municipales/comerciales). */
  subnationalTaxes?: SubnationalTax[];
  /** Separador decimal ("," para es-UY, "." para en-US). */
  decimalSeparator: string;
  /** Separador de miles. */
  thousandsSeparator: string;
  /** Nota breve de normas contables locales (para el manual/ayuda). */
  notes?: string;
};

export const REGIONES: GeographicProfile[] = [
  {
    code: "UY",
    name: "Uruguay",
    language: "es-UY",
    currency: "UYU",
    taxName: "IVA",
    standardTaxRate: 22,
    reducedTaxRates: [{ label: "Tasa mínima", ratePercent: 10 }],
    subnationalTaxes: [
      { label: "Impuesto de Enseñanza Primaria (patrimonio)", ratePercent: null, scope: "comercial" },
    ],
    decimalSeparator: ",",
    thousandsSeparator: ".",
    notes: "IVA 22% (mínima 10%). Impuesto al Patrimonio e IRAE para empresas. Moneda $UYU.",
  },
  {
    code: "AR",
    name: "Argentina",
    language: "es-AR",
    currency: "ARS",
    taxName: "IVA",
    standardTaxRate: 21,
    reducedTaxRates: [{ label: "Alícuota reducida", ratePercent: 10.5 }],
    subnationalTaxes: [
      { label: "IIBB (Ingresos Brutos, provincial)", ratePercent: null, scope: "regional" },
    ],
    decimalSeparator: ",",
    thousandsSeparator: ".",
    notes: "IVA 21% (10.5% reducida). IIBB provincial varía (3%-5% aprox). Moneda $ARS.",
  },
  {
    code: "ES",
    name: "España",
    language: "es-ES",
    currency: "EUR",
    taxName: "IVA",
    standardTaxRate: 21,
    reducedTaxRates: [
      { label: "Reducido", ratePercent: 10 },
      { label: "Superreducido", ratePercent: 4 },
    ],
    decimalSeparator: ",",
    thousandsSeparator: ".",
    notes: "IVA 21% (10% reducido, 4% superreducido). Impuesto de Sociedades 25%. Euro €.",
  },
  {
    code: "US",
    name: "Estados Unidos",
    language: "en-US",
    currency: "USD",
    taxName: "Sales Tax",
    standardTaxRate: 0,
    subnationalTaxes: [
      { label: "Sales tax estatal", ratePercent: null, scope: "regional" },
      { label: "Sales tax municipal", ratePercent: null, scope: "municipal" },
    ],
    decimalSeparator: ".",
    thousandsSeparator: ",",
    notes: "Sin IVA federal. Sales tax estatal/municipal varía (0%-10%). Impuesto federal a sociedades. USD $.",
  },
  {
    code: "MX",
    name: "México",
    language: "es-MX",
    currency: "MXN",
    taxName: "IVA",
    standardTaxRate: 16,
    reducedTaxRates: [{ label: "Frontera norte", ratePercent: 8 }],
    decimalSeparator: ".",
    thousandsSeparator: ",",
    notes: "IVA 16% (8% frontera norte). ISR empresas 30%. Moneda $MXN.",
  },
  {
    code: "BR",
    name: "Brasil",
    language: "pt-BR",
    currency: "BRL",
    taxName: "ICMS / ISS",
    standardTaxRate: 18,
    subnationalTaxes: [
      { label: "ICMS (estadual)", ratePercent: null, scope: "regional" },
      { label: "ISS (municipal)", ratePercent: null, scope: "municipal" },
    ],
    decimalSeparator: ",",
    thousandsSeparator: ".",
    notes: "Sistema complejo: ICMS estadual + ISS municipal + PIS/COFINS federales. Moneda R$.",
  },
  {
    code: "CL",
    name: "Chile",
    language: "es-CL",
    currency: "CLP",
    taxName: "IVA",
    standardTaxRate: 19,
    decimalSeparator: ",",
    thousandsSeparator: ".",
    notes: "IVA 19%. Impuesto de Primera Categoría (empresas) 27%. Moneda $CLP.",
  },
];

/** Buscar perfil por código ISO (default Uruguay). */
export function getRegion(code: string | null | undefined): GeographicProfile {
  return REGIONES.find((r) => r.code === code) ?? REGIONES[0];
}

/** Formatear un número según el perfil regional (decimales + miles + moneda). */
export function formatCurrency(
  amount: number,
  profile: GeographicProfile,
  opts?: { showSymbol?: boolean }
): string {
  const fixed = amount.toFixed(2);
  const [int, dec] = fixed.split(".");
  const intGrouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, profile.thousandsSeparator);
  const num = `${intGrouped}${profile.decimalSeparator}${dec}`;
  const symbolMap: Record<string, string> = {
    UYU: "$", ARS: "$", USD: "$", EUR: "€", MXN: "$", BRL: "R$", CLP: "$", GBP: "£",
  };
  const sym = symbolMap[profile.currency] ?? profile.currency;
  return opts?.showSymbol === false ? num : `${sym} ${num}`;
}