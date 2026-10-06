// Utilities for validating and formatting numeric inputs used in
// quantity / unit price fields and money totals.

// Accepts empty string, integers and decimals with a single dot or comma
// separator (e.g. "1", "1.5", "1,5", "1000.25"). Rejects letters, signs,
// scientific notation, and multiple separators.
export function isValidNumericInput(value: string): boolean {
  if (value === "") return true;
  return /^\d+([.,]\d*)?$/.test(value.trim());
}

// Sanitizes user input while typing: keeps digits and the first
// decimal separator only. Never throws — returns a safe string suitable
// for controlled inputs.
export function sanitizeNumericInput(value: string): string {
  const cleaned = value.replace(/[^\d.,]/g, "");
  const firstSep = cleaned.search(/[.,]/);
  if (firstSep === -1) return cleaned;
  const head = cleaned.slice(0, firstSep + 1);
  const tail = cleaned.slice(firstSep + 1).replace(/[.,]/g, "");
  return head + tail;
}

// Half-away-from-zero rounding to N decimals (default 2 for money).
export function roundMoney(value: number, decimals = 2): number {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** decimals;
  return Math.sign(value) * Math.round(Math.abs(value) * factor) / factor;
}
