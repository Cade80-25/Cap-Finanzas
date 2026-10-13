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
  | "accounting"
  | "cuentasCorrientes"
  | "facturacion"
  | "rrhh"
  | "fabricacion"
  | "activos"
  | "inventario"
  | "banca"
  | "proyectos"
  | "analitica"
  | "tesoreria"
  | "inmobiliaria"
  | "analisis"
  | "trading"
  | "gastos"
  | "contratos"
  | "calidad"
  | "mantenimiento"
  | "flota"
  | "alquiler"
  | "seguros"
  | "auditoria"
  | "aprobaciones"
  | "riesgos"
  | "financiamiento"
  | "proyectos"
  | "startups"
  | "comercio"
  | "crm"
  | "tpv"
  | "documentos"
  | "bi"
  | "marketing"
  | "automatizacion"
  | "journal"
  | "ledger"
  | "balance"
  | "incomeStatement"
  | "learn"
  | "encyclopedia"
  | "recommendations"
  | "markets"
  | "manual"
  | "notifications"
  | "settings"
  | "account";

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
  { key: "categories", route: "/categorias", label: "Categorías", simpleMode: false, traditionalMode: true },
  { key: "summary", route: "/resumen", label: "Resumen", simpleMode: true, traditionalMode: true, simplifiedInSimple: true },
  { key: "consolidated", route: "/resumen?tab=consolidado", label: "Consolidado", simpleMode: false, traditionalMode: true },
  { key: "accounting", route: "/contabilidad", label: "Contabilidad", simpleMode: false, traditionalMode: true },
  { key: "cuentasCorrientes", route: "/cuentas-corrientes", label: "Cuentas Corrientes", simpleMode: false, traditionalMode: true },
  { key: "facturacion", route: "/facturacion", label: "Facturación", simpleMode: false, traditionalMode: true },
  { key: "rrhh", route: "/rrhh", label: "RRHH", simpleMode: false, traditionalMode: true },
  { key: "fabricacion", route: "/fabricacion", label: "Fabricación", simpleMode: false, traditionalMode: true },
  { key: "activos", route: "/activos", label: "Activos y Logística", simpleMode: false, traditionalMode: true },
  { key: "inventario", route: "/inventario", label: "Inventario", simpleMode: false, traditionalMode: true },
  { key: "banca", route: "/banca", label: "Banca", simpleMode: false, traditionalMode: true },
  { key: "analitica", route: "/analitica", label: "Contabilidad Analítica", simpleMode: false, traditionalMode: true },
  { key: "tesoreria", route: "/tesoreria", label: "Tesorería", simpleMode: false, traditionalMode: true },
  { key: "inmobiliaria", route: "/inmobiliaria", label: "Bienes Raíces", simpleMode: false, traditionalMode: true },
  { key: "analisis", route: "/analisis", label: "Análisis Financiero", simpleMode: false, traditionalMode: true },
  { key: "trading", route: "/trading", label: "Journal de Trading", simpleMode: false, traditionalMode: true },
  { key: "gastos", route: "/gastos", label: "Gastos", simpleMode: false, traditionalMode: true },
  { key: "contratos", route: "/contratos", label: "Contratos", simpleMode: false, traditionalMode: true },
  { key: "calidad", route: "/calidad", label: "Calidad", simpleMode: false, traditionalMode: true },
  { key: "mantenimiento", route: "/mantenimiento", label: "Mantenimiento", simpleMode: false, traditionalMode: true },
  { key: "flota", route: "/flota", label: "Flota", simpleMode: false, traditionalMode: true },
  { key: "alquiler", route: "/alquiler", label: "Alquiler", simpleMode: false, traditionalMode: true },
  { key: "seguros", route: "/seguros", label: "Seguros", simpleMode: false, traditionalMode: true },
  { key: "auditoria", route: "/auditoria", label: "Auditoría", simpleMode: false, traditionalMode: true },
  { key: "aprobaciones", route: "/aprobaciones", label: "Aprobaciones", simpleMode: false, traditionalMode: true },
  { key: "riesgos", route: "/riesgos", label: "Riesgos", simpleMode: false, traditionalMode: true },
  { key: "financiamiento", route: "/financiamiento", label: "Financiamiento", simpleMode: false, traditionalMode: true },
  { key: "proyectos", route: "/proyectos", label: "Proyectos", simpleMode: false, traditionalMode: true },
  { key: "startups", route: "/startups", label: "Startups", simpleMode: false, traditionalMode: true },
  { key: "comercio", route: "/comercio", label: "Comercio Exterior", simpleMode: false, traditionalMode: true },
  { key: "crm", route: "/crm", label: "CRM", simpleMode: false, traditionalMode: true },
  { key: "tpv", route: "/tpv", label: "TPV", simpleMode: false, traditionalMode: true },
  { key: "documentos", route: "/documentos", label: "Documentos", simpleMode: false, traditionalMode: true },
  { key: "bi", route: "/bi", label: "Business Intelligence", simpleMode: false, traditionalMode: true },
  { key: "marketing", route: "/marketing", label: "Marketing y Ventas", simpleMode: false, traditionalMode: true },
  { key: "automatizacion", route: "/automatizacion", label: "Centro de Automatización", simpleMode: false, traditionalMode: true },
  { key: "journal", route: "/contabilidad?tab=diario", label: "Libro Diario", simpleMode: false, traditionalMode: true },
  { key: "ledger", route: "/contabilidad?tab=mayor", label: "Libro Mayor", simpleMode: false, traditionalMode: true },
  { key: "balance", route: "/contabilidad?tab=balance", label: "Balance General", simpleMode: false, traditionalMode: true },
  { key: "incomeStatement", route: "/contabilidad?tab=resultados", label: "Estado de Resultados", simpleMode: false, traditionalMode: true },
  { key: "learn", route: "/aprender", label: "Aprender", simpleMode: true, traditionalMode: true },
  { key: "encyclopedia", route: "/aprender?tab=enciclopedia", label: "Enciclopedia", simpleMode: false, traditionalMode: true },
  { key: "recommendations", route: "/aprender?tab=recomendaciones", label: "Recomendaciones", simpleMode: true, traditionalMode: true },
  { key: "markets", route: "/bolsas", label: "Bolsas en Vivo", simpleMode: false, traditionalMode: true },
  { key: "manual", route: "/aprender?tab=manual", label: "Manual de Usuario", simpleMode: true, traditionalMode: true },
  { key: "notifications", route: "/notificaciones", label: "Notificaciones", simpleMode: true, traditionalMode: true },
  { key: "settings", route: "/ajustes", label: "Ajustes", simpleMode: true, traditionalMode: true },
  { key: "account", route: "/ajustes?tab=cuenta", label: "Cuenta", simpleMode: true, traditionalMode: true },
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
