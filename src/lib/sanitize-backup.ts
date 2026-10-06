// Validation + sanitization for imported backup payloads.
// Goal: reject or strip dangerous fields before persisting to localStorage
// or re-exporting (CSV/Excel/PDF). Imported strings can contain HTML, control
// chars, script payloads, or oversized data — all of which we neutralize here.

const MAX_STRING_LEN = 2000;
const MAX_DESCRIPTION_LEN = 500;
const MAX_ARRAY_LEN = 50000;
const MAX_OBJECT_KEYS = 200;
const MAX_DEPTH = 8;
const MAX_RAW_BYTES = 10 * 1024 * 1024; // 10 MB

export const MAX_BACKUP_BYTES = MAX_RAW_BYTES;

/** Strip control chars, HTML tags, and trim/cap length. */
export function sanitizeString(input: unknown, maxLen = MAX_STRING_LEN): string {
  if (input == null) return "";
  let s = String(input);
  // remove control chars except \t \n \r
  s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  // strip HTML tags (defense vs PDF/HTML export injection)
  s = s.replace(/<[^>]*>/g, "");
  // neutralize javascript: / data: URIs in plain text
  s = s.replace(/javascript:/gi, "").replace(/data:text\/html/gi, "");
  s = s.trim();
  if (s.length > maxLen) s = s.slice(0, maxLen);
  return s;
}

function sanitizeNumber(input: unknown): number {
  const n = typeof input === "number" ? input : parseFloat(String(input ?? ""));
  if (!Number.isFinite(n)) return 0;
  // clamp to a sane financial range
  if (n > 1e15) return 1e15;
  if (n < -1e15) return -1e15;
  return n;
}

function sanitizeAny(value: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH) return null;
  if (value == null) return value;
  if (typeof value === "string") return sanitizeString(value);
  if (typeof value === "number") return sanitizeNumber(value);
  if (typeof value === "boolean") return value;
  if (Array.isArray(value)) {
    return value.slice(0, MAX_ARRAY_LEN).map((v) => sanitizeAny(v, depth + 1));
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    const entries = Object.entries(value as Record<string, unknown>).slice(
      0,
      MAX_OBJECT_KEYS
    );
    for (const [k, v] of entries) {
      // drop dangerous / prototype-pollution keys
      if (k === "__proto__" || k === "constructor" || k === "prototype") continue;
      const cleanKey = sanitizeString(k, 100);
      if (!cleanKey) continue;
      out[cleanKey] = sanitizeAny(v, depth + 1);
    }
    return out;
  }
  // functions, symbols, bigints → drop
  return null;
}

function sanitizeTransactionLike(t: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  if ("id" in t) clean.id = sanitizeNumber(t.id) || Date.now() + Math.random();
  if ("date" in t || "fecha" in t)
    clean.date = sanitizeString((t.date ?? t.fecha) as string, 10);
  if ("fecha" in t) clean.fecha = clean.date;
  if ("description" in t || "descripcion" in t) {
    const d = sanitizeString((t.description ?? t.descripcion) as string, MAX_DESCRIPTION_LEN);
    clean.description = d;
    clean.descripcion = d;
  }
  if ("account" in t || "cuenta" in t) {
    const a = sanitizeString((t.account ?? t.cuenta) as string, 100);
    clean.account = a;
    clean.cuenta = a;
  }
  if ("category" in t || "categoria" in t) {
    const c = sanitizeString((t.category ?? t.categoria) as string, 100);
    clean.category = c;
    clean.categoria = c;
  }
  if ("tipo" in t) clean.tipo = sanitizeString(t.tipo, 32);
  if ("debit" in t) clean.debit = sanitizeNumber(t.debit);
  if ("credit" in t) clean.credit = sanitizeNumber(t.credit);
  if ("debe" in t) clean.debe = sanitizeNumber(t.debe);
  if ("haber" in t) clean.haber = sanitizeNumber(t.haber);
  if ("amount" in t) clean.amount = sanitizeNumber(t.amount);
  if ("monto" in t) clean.monto = sanitizeNumber(t.monto);
  if ("price" in t) clean.price = sanitizeNumber(t.price);
  if ("quantity" in t) clean.quantity = sanitizeNumber(t.quantity);
  if ("subcategory" in t) clean.subcategory = sanitizeString(t.subcategory, 100);
  if ("creditor" in t) clean.creditor = sanitizeString(t.creditor, 100);
  if ("notes" in t) clean.notes = sanitizeString(t.notes, MAX_DESCRIPTION_LEN);
  return clean;
}

/**
 * Validate and sanitize a single backup field (stored as a JSON string).
 * Returns a re-stringified clean JSON, or null if the payload is invalid/unsafe.
 */
export function sanitizeBackupField(key: string, rawJson: string): string | null {
  if (typeof rawJson !== "string") return null;
  if (rawJson.length > MAX_RAW_BYTES) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return null;
  }

  // transactions / journal: must be an array of transaction-like objects
  if (key === "transactions" || key === "transacciones") {
    if (!Array.isArray(parsed)) return null;
    const cleaned = parsed
      .slice(0, MAX_ARRAY_LEN)
      .filter((t) => t && typeof t === "object" && !Array.isArray(t))
      .map((t) => sanitizeTransactionLike(t as Record<string, unknown>));
    return JSON.stringify(cleaned);
  }

  // categorias: array of category objects/strings
  if (key === "categorias") {
    if (!Array.isArray(parsed)) return null;
    return JSON.stringify(sanitizeAny(parsed));
  }

  // presupuesto / config / cuenta: generic object
  if (key === "presupuesto" || key === "config" || key === "cuenta") {
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return null;
    }
    return JSON.stringify(sanitizeAny(parsed));
  }

  return null;
}
