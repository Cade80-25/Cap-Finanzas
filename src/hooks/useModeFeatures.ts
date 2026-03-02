import { useMemo } from "react";
import { useLicense, LicenseMode } from "./useLicense";

/**
 * Features available in each mode
 */
export type FeatureKey = 
  | "dashboard"
  | "transactions"
  | "calendar"
  | "budget"
  | "currencies"
  | "categories"
  | "summary"
  | "consolidated"
  | "journal"        // Libro Diario (full double-entry)
  | "ledger"         // Libro Mayor
  | "balance"        // Balance General
  | "incomeStatement" // Estado de Resultados
  | "encyclopedia"
  | "recommendations"
  | "manual"
  | "notifications"
  | "account"
  | "settings";

interface FeatureConfig {
  key: FeatureKey;
  route: string;
  label: string;
  simpleMode: boolean;  // Available in simple mode
  traditionalMode: boolean; // Available in traditional mode
  simplifiedInSimple?: boolean; // Shows simplified version in simple mode
}

const FEATURE_CONFIG: FeatureConfig[] = [
  { key: "dashboard", route: "/", label: "Panel Principal", simpleMode: true, traditionalMode: true },
  { key: "transactions", route: "/transacciones", label: "Transacciones", simpleMode: true, traditionalMode: true, simplifiedInSimple: true },
  { key: "calendar", route: "/calendario", label: "Calendario", simpleMode: true, traditionalMode: true },
  { key: "budget", route: "/presupuesto", label: "Presupuesto", simpleMode: true, traditionalMode: true },
  { key: "currencies", route: "/monedas", label: "Monedas", simpleMode: true, traditionalMode: true },
  { key: "categories", route: "/categorias", label: "Categorías", simpleMode: true, traditionalMode: true },
  { key: "summary", route: "/resumen", label: "Resumen", simpleMode: true, traditionalMode: true, simplifiedInSimple: true },
  { key: "consolidated", route: "/consolidado", label: "Consolidado", simpleMode: true, traditionalMode: true },
  { key: "journal", route: "/libro-diario", label: "Libro Diario", simpleMode: false, traditionalMode: true },
  { key: "ledger", route: "/libro-mayor", label: "Libro Mayor", simpleMode: false, traditionalMode: true },
  { key: "balance", route: "/balance", label: "Balance General", simpleMode: false, traditionalMode: true },
  { key: "incomeStatement", route: "/resultados", label: "Estado de Resultados", simpleMode: false, traditionalMode: true },
  { key: "encyclopedia", route: "/enciclopedia", label: "Enciclopedia", simpleMode: false, traditionalMode: true },
  { key: "recommendations", route: "/recomendaciones", label: "Recomendaciones", simpleMode: true, traditionalMode: true },
  { key: "manual", route: "/manual", label: "Manual de Usuario", simpleMode: true, traditionalMode: true },
  { key: "notifications", route: "/notificaciones", label: "Notificaciones", simpleMode: true, traditionalMode: true },
  { key: "account", route: "/cuenta", label: "Cuenta", simpleMode: true, traditionalMode: true },
  { key: "settings", route: "/configuracion", label: "Configuración", simpleMode: true, traditionalMode: true },
];

export function useModeFeatures() {
  const { mode } = useLicense();

  /**
   * Check if a feature is available in the current mode
   */
  const isFeatureAvailable = useMemo(() => {
    return (feature: FeatureKey): boolean => {
      const config = FEATURE_CONFIG.find((f) => f.key === feature);
      if (!config) return false;
      return mode === "simple" ? config.simpleMode : config.traditionalMode;
    };
  }, [mode]);

  /**
   * Check if a feature should show simplified version
   */
  const isSimplifiedView = useMemo(() => {
    return (feature: FeatureKey): boolean => {
      if (mode !== "simple") return false;
      const config = FEATURE_CONFIG.find((f) => f.key === feature);
      return config?.simplifiedInSimple ?? false;
    };
  }, [mode]);

  /**
   * Get all available features for current mode
   */
  const availableFeatures = useMemo(() => {
    return FEATURE_CONFIG.filter((f) => 
      mode === "simple" ? f.simpleMode : f.traditionalMode
    );
  }, [mode]);

  /**
   * Get navigation items for sidebar based on mode
   */
  const navigationItems = useMemo(() => {
    return availableFeatures.map((f) => ({
      name: f.label,
      href: f.route,
      key: f.key,
    }));
  }, [availableFeatures]);

  /**
   * Labels based on mode
   */
  const labels = useMemo(() => {
    if (mode === "simple") {
      return {
        transactions: "Movimientos",
        income: "Ingresos",
        expense: "Gastos",
        addTransaction: "Agregar Movimiento",
        debit: "Gasto",
        credit: "Ingreso",
        account: "Categoría",
        journal: "Registro",
      };
    }
    return {
      transactions: "Transacciones",
      income: "Ingresos",
      expense: "Gastos",
      addTransaction: "Nueva Transacción",
      debit: "Debe",
      credit: "Haber",
      account: "Cuenta",
      journal: "Libro Diario",
    };
  }, [mode]);

  return {
    mode,
    isSimpleMode: mode === "simple",
    isTraditionalMode: mode === "traditional",
    isFeatureAvailable,
    isSimplifiedView,
    availableFeatures,
    navigationItems,
    labels,
    featureConfig: FEATURE_CONFIG,
  };
}
