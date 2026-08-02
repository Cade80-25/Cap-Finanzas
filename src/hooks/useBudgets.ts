import { useEffect } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

export type BudgetItem = {
  id: string;
  categoria: string;
  cuentaAsociada: string;
  presupuesto: number;
  color: string;
};

const BUDGETS_KEY = "cap-finanzas-presupuesto";
const LEGACY_BUDGET_KEYS = ["cap-finanzas-presupuesto-v2"];

function normalizeBudgetItem(raw: any): BudgetItem | null {
  if (!raw || typeof raw !== "object") return null;

  // Formato actual (v2)
  if (
    typeof raw.id === "string" &&
    typeof raw.categoria === "string" &&
    typeof raw.cuentaAsociada === "string" &&
    typeof raw.presupuesto === "number"
  ) {
    return {
      id: raw.id,
      categoria: raw.categoria,
      cuentaAsociada: raw.cuentaAsociada,
      presupuesto: raw.presupuesto,
      color: typeof raw.color === "string" ? raw.color : "bg-primary",
    };
  }

  // Formato legacy (Dashboard antiguo)
  if (typeof raw.nombre === "string" && typeof raw.presupuestado === "number") {
    return {
      id: typeof raw.id === "string" ? raw.id : String(raw.id ?? Date.now()),
      categoria: raw.nombre,
      cuentaAsociada: "",
      presupuesto: raw.presupuestado,
      color: "bg-primary",
    };
  }

  // Formato legacy (notificaciones antiguo)
  if (typeof raw.categoria === "string" && typeof raw.presupuesto === "number") {
    return {
      id: typeof raw.id === "string" ? raw.id : String(raw.id ?? Date.now()),
      categoria: raw.categoria,
      cuentaAsociada: typeof raw.cuentaAsociada === "string" ? raw.cuentaAsociada : "",
      presupuesto: raw.presupuesto,
      color: typeof raw.color === "string" ? raw.color : "bg-primary",
    };
  }

  return null;
}

export function useBudgets() {
  const [budgets, setBudgets] = useLocalStorage<BudgetItem[]>(BUDGETS_KEY, []);

  // Migración automática desde keys antiguas
  useEffect(() => {
    if (budgets.length > 0) return;

    for (const legacyKey of LEGACY_BUDGET_KEYS) {
      const raw = localStorage.getItem(legacyKey);
      if (!raw) continue;

      try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) continue;

        const normalized = parsed
          .map((i) => normalizeBudgetItem(i))
          .filter(Boolean) as BudgetItem[];

        if (normalized.length > 0) {
          setBudgets(normalized);
          localStorage.removeItem(legacyKey);
        }
      } catch {
        // ignore
      }

      break;
    }
  }, [budgets.length, setBudgets]);

  return { budgets, setBudgets };
}
