import { useLocalStorage } from "./useLocalStorage";
import { useCallback } from "react";

export type NumberFormatType = "dot" | "comma";

// dot = 1,234.56 (US/UK)
// comma = 1.234,56 (Europe/Latin America)

export function useNumberFormat() {
  const [format, setFormat] = useLocalStorage<NumberFormatType>(
    "cap-finanzas-number-format",
    "dot"
  );

  const formatNumber = useCallback(
    (value: number, decimals = 2): string => {
      const abs = Math.abs(value);
      const fixed = abs.toFixed(decimals);

      if (format === "comma") {
        // 1.234,56
        const [intPart, decPart] = fixed.split(".");
        const withThousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        return `${value < 0 ? "-" : ""}${withThousands},${decPart}`;
      } else {
        // 1,234.56
        const [intPart, decPart] = fixed.split(".");
        const withThousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return `${value < 0 ? "-" : ""}${withThousands}.${decPart}`;
      }
    },
    [format]
  );

  const formatCurrency = useCallback(
    (value: number, decimals = 2, symbol = "$"): string => {
      return `${symbol}${formatNumber(value, decimals)}`;
    },
    [formatNumber]
  );

  return {
    format,
    setFormat,
    formatNumber,
    formatCurrency,
  };
}
