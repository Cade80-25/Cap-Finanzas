export function parseFlexibleNumber(value: string | number | undefined | null, fallback = 0): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }

  const raw = String(value ?? "").trim();
  if (!raw) return fallback;

  const normalized = normalizeFlexibleNumberString(raw);
  const parsed = Number.parseFloat(normalized);

  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeFlexibleNumberString(value: string): string {
  const cleaned = value.replace(/\s+/g, "");
  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");

  if (hasComma && hasDot) {
    return cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")
      ? cleaned.replace(/\./g, "").replace(",", ".")
      : cleaned.replace(/,/g, "");
  }

  return cleaned.replace(",", ".");
}