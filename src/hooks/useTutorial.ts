import { useState, useCallback, useEffect } from "react";
import { useLocalStorage } from "./useLocalStorage";

export type TutorialStep = {
  id: string;
  target: string; // CSS selector for the target element
  title: string;
  content: string;
  placement?: "top" | "bottom" | "left" | "right";
  page?: string; // Optional: only show on specific page
};

export type TutorialSection = {
  id: string;
  name: string;
  steps: TutorialStep[];
};

// Tutorial steps for each section of the app
export const TUTORIAL_SECTIONS: TutorialSection[] = [
  {
    id: "dashboard",
    name: "Panel Principal",
    steps: [
      {
        id: "dashboard-welcome",
        target: "[data-tutorial='dashboard-title']",
        title: "¡Bienvenido al Panel Principal!",
        content: "Aquí verás un resumen de tus finanzas. Este es tu centro de control donde puedes ver balances, ingresos y gastos de un vistazo.",
        placement: "bottom",
      },
      {
        id: "dashboard-stats",
        target: "[data-tutorial='dashboard-stats']",
        title: "Estadísticas Rápidas",
        content: "Estas tarjetas muestran tu balance total, ingresos del mes, gastos y ahorros. Se actualizan automáticamente con los datos del Libro Diario.",
        placement: "bottom",
      },
      {
        id: "dashboard-chart",
        target: "[data-tutorial='dashboard-chart']",
        title: "Gráfico de Ingresos vs Gastos",
        content: "Este gráfico te muestra la comparación mensual entre lo que ganas y lo que gastas. Es útil para identificar tendencias.",
        placement: "top",
      },
      {
        id: "dashboard-transactions",
        target: "[data-tutorial='dashboard-transactions']",
        title: "Transacciones Recientes",
        content: "Aquí aparecen tus últimas 5 transacciones del Libro Diario. Haz clic en 'Ir al Libro Diario' para ver todas.",
        placement: "top",
      },
    ],
  },
  {
    id: "libro-diario",
    name: "Libro Diario",
    steps: [
      {
        id: "diario-intro",
        target: "[data-tutorial='diario-title']",
        title: "El Libro Diario",
        content: "Este es el corazón del sistema contable. Aquí registras TODAS tus transacciones financieras en orden cronológico.",
        placement: "bottom",
      },
      {
        id: "diario-new",
        target: "[data-tutorial='diario-new-btn']",
        title: "Nueva Transacción",
        content: "Haz clic aquí para agregar una nueva transacción. Cada ingreso o gasto debe registrarse aquí.",
        placement: "left",
      },
      {
        id: "diario-table",
        target: "[data-tutorial='diario-table']",
        title: "Tabla de Asientos",
        content: "Aquí verás todas tus transacciones. Cada fila tiene: Fecha, Cuenta, Descripción, Debe (débitos) y Haber (créditos).",
        placement: "top",
      },
      {
        id: "diario-debe-haber",
        target: "[data-tutorial='diario-debe-haber']",
        title: "Debe y Haber",
        content: "💡 TIP: 'Debe' es para gastos y aumento de activos. 'Haber' es para ingresos y aumento de pasivos. ¡Solo usa uno por transacción!",
        placement: "top",
      },
    ],
  },
  {
    id: "libro-mayor",
    name: "Libro Mayor",
    steps: [
      {
        id: "mayor-intro",
        target: "[data-tutorial='mayor-title']",
        title: "El Libro Mayor",
        content: "El Libro Mayor agrupa las transacciones por cuenta. Aquí puedes ver el historial y saldo de cada cuenta contable.",
        placement: "bottom",
      },
      {
        id: "mayor-tabs",
        target: "[data-tutorial='mayor-tabs']",
        title: "Cuentas Contables",
        content: "Cada pestaña representa una cuenta diferente (Banco, Caja, Ingresos, etc.). Haz clic para ver los movimientos de esa cuenta.",
        placement: "bottom",
      },
    ],
  },
  {
    id: "balance",
    name: "Balance General",
    steps: [
      {
        id: "balance-intro",
        target: "[data-tutorial='balance-title']",
        title: "Balance General",
        content: "El Balance muestra tu situación financiera: qué tienes (Activos), qué debes (Pasivos) y tu Patrimonio neto.",
        placement: "bottom",
      },
      {
        id: "balance-patrimonio",
        target: "[data-tutorial='balance-patrimonio']",
        title: "Patrimonio Neto",
        content: "Este número es lo que realmente te pertenece: Activos - Pasivos. Es la medida más importante de tu salud financiera.",
        placement: "bottom",
      },
    ],
  },
  {
    id: "estado-resultados",
    name: "Estado de Resultados",
    steps: [
      {
        id: "resultados-intro",
        target: "[data-tutorial='resultados-title']",
        title: "Estado de Resultados",
        content: "Este reporte muestra si estás ganando o perdiendo dinero. Compara tus ingresos totales contra tus gastos totales.",
        placement: "bottom",
      },
      {
        id: "resultados-neto",
        target: "[data-tutorial='resultados-neto']",
        title: "Resultado Neto",
        content: "Si es positivo (verde), tienes ganancias. Si es negativo (rojo), tienes pérdidas. ¡El objetivo es mantenerlo en verde!",
        placement: "bottom",
      },
    ],
  },
  {
    id: "resumen",
    name: "Resumen Financiero",
    steps: [
      {
        id: "resumen-intro",
        target: "[data-tutorial='resumen-title']",
        title: "Resumen Financiero",
        content: "Aquí encuentras gráficos y visualizaciones de toda tu información financiera consolidada.",
        placement: "bottom",
      },
    ],
  },
  {
    id: "presupuesto",
    name: "Presupuesto",
    steps: [
      {
        id: "presupuesto-intro",
        target: "[data-tutorial='presupuesto-title']",
        title: "Gestión de Presupuesto",
        content: "Define límites de gasto por categoría. El sistema te alertará cuando te acerques o superes tus límites.",
        placement: "bottom",
      },
    ],
  },
];

type TutorialState = {
  completedSections: string[];
  currentStep: number;
  isActive: boolean;
  currentSectionId: string | null;
  hasSeenWelcome: boolean;
};

const initialState: TutorialState = {
  completedSections: [],
  currentStep: 0,
  isActive: false,
  currentSectionId: null,
  hasSeenWelcome: false,
};

export function useTutorial() {
  const [tutorialState, setTutorialState] = useLocalStorage<TutorialState>(
    "cap-finanzas-tutorial",
    initialState
  );

  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);

  const currentSection = TUTORIAL_SECTIONS.find(
    (s) => s.id === tutorialState.currentSectionId
  );
  
  const currentStepData = currentSection?.steps[tutorialState.currentStep];

  // Start tutorial for a specific section
  const startTutorial = useCallback((sectionId: string) => {
    const section = TUTORIAL_SECTIONS.find((s) => s.id === sectionId);
    if (!section) return;

    setTutorialState((prev) => ({
      ...prev,
      isActive: true,
      currentSectionId: sectionId,
      currentStep: 0,
    }));
  }, [setTutorialState]);

  // Go to next step
  const nextStep = useCallback(() => {
    if (!currentSection) return;

    if (tutorialState.currentStep < currentSection.steps.length - 1) {
      setTutorialState((prev) => ({
        ...prev,
        currentStep: prev.currentStep + 1,
      }));
    } else {
      // Complete this section
      setTutorialState((prev) => ({
        ...prev,
        completedSections: prev.completedSections.includes(currentSection.id)
          ? prev.completedSections
          : [...prev.completedSections, currentSection.id],
        isActive: false,
        currentSectionId: null,
        currentStep: 0,
      }));
    }
  }, [currentSection, tutorialState.currentStep, setTutorialState]);

  // Go to previous step
  const prevStep = useCallback(() => {
    if (tutorialState.currentStep > 0) {
      setTutorialState((prev) => ({
        ...prev,
        currentStep: prev.currentStep - 1,
      }));
    }
  }, [tutorialState.currentStep, setTutorialState]);

  // Skip/close tutorial
  const skipTutorial = useCallback(() => {
    setTutorialState((prev) => ({
      ...prev,
      isActive: false,
      currentSectionId: null,
      currentStep: 0,
    }));
  }, [setTutorialState]);

  // Mark welcome as seen
  const markWelcomeSeen = useCallback(() => {
    setTutorialState((prev) => ({
      ...prev,
      hasSeenWelcome: true,
    }));
  }, [setTutorialState]);

  // Reset all tutorial progress
  const resetTutorial = useCallback(() => {
    setTutorialState(initialState);
  }, [setTutorialState]);

  // Check if section is completed
  const isSectionCompleted = useCallback(
    (sectionId: string) => tutorialState.completedSections.includes(sectionId),
    [tutorialState.completedSections]
  );

  // Update highlighted element when step changes
  useEffect(() => {
    if (!currentStepData || !tutorialState.isActive) {
      setHighlightedElement(null);
      return;
    }

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      const element = document.querySelector(currentStepData.target) as HTMLElement;
      setHighlightedElement(element);
    }, 100);

    return () => clearTimeout(timer);
  }, [currentStepData, tutorialState.isActive]);

  return {
    // State
    isActive: tutorialState.isActive,
    currentStep: tutorialState.currentStep,
    currentSection,
    currentStepData,
    highlightedElement,
    hasSeenWelcome: tutorialState.hasSeenWelcome,
    totalSteps: currentSection?.steps.length ?? 0,
    completedSections: tutorialState.completedSections,

    // Actions
    startTutorial,
    nextStep,
    prevStep,
    skipTutorial,
    markWelcomeSeen,
    resetTutorial,
    isSectionCompleted,

    // Data
    allSections: TUTORIAL_SECTIONS,
  };
}
