import { useState, useCallback, useEffect } from "react";
import { useLocalStorage } from "./useLocalStorage";

export type TutorialStep = {
  id: string;
  target: string; // CSS selector for the target element
  title: string;
  content: string;
  tip?: string; // Optional tip shown in a highlight box
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
        content: "Este es tu centro de control financiero. Aquí verás un resumen completo de tus finanzas: balance, ingresos, gastos y más.",
        tip: "Puedes cambiar entre modo Simple y Profesional desde el menú lateral.",
        placement: "bottom",
      },
      {
        id: "dashboard-stats",
        target: "[data-tutorial='dashboard-stats']",
        title: "Estadísticas Rápidas",
        content: "Estas tarjetas muestran tu balance total, ingresos del mes, gastos y ahorros. Se actualizan automáticamente con cada transacción.",
        tip: "Verde = positivo, Rojo = gastos. Los colores te ayudan a identificar rápidamente tu situación.",
        placement: "bottom",
      },
      {
        id: "dashboard-chart",
        target: "[data-tutorial='dashboard-chart']",
        title: "Gráfico de Ingresos vs Gastos",
        content: "Este gráfico muestra la comparación mensual entre lo que ganas y lo que gastas. Úsalo para identificar tendencias y patrones.",
        placement: "top",
      },
      {
        id: "dashboard-transactions",
        target: "[data-tutorial='dashboard-transactions']",
        title: "Transacciones Recientes",
        content: "Aquí aparecen tus últimos movimientos. Haz clic en 'Ir al Libro Diario' para ver el historial completo y agregar nuevas transacciones.",
        placement: "top",
      },
    ],
  },
  {
    id: "transacciones",
    name: "Transacciones",
    steps: [
      {
        id: "transacciones-title",
        target: "[data-tutorial='transacciones-title']",
        title: "Vista de Transacciones",
        content: "Aquí puedes ver todas tus transacciones en un solo lugar. Esta vista consolida todos los movimientos registrados para una revisión rápida.",
        placement: "bottom",
      },
      {
        id: "transacciones-resumen",
        target: "[data-tutorial='transacciones-resumen']",
        title: "Resumen de Totales",
        content: "Estas tarjetas muestran el total de transacciones, ingresos y gastos. Te dan una visión rápida de tu actividad financiera.",
        placement: "bottom",
      },
      {
        id: "transacciones-export",
        target: "[data-tutorial='transacciones-export']",
        title: "Exportar Transacciones",
        content: "Puedes exportar tus transacciones en formato CSV, Excel o PDF para llevar un respaldo externo o compartir con tu contador.",
        tip: "Los archivos exportados incluyen todas las transacciones con sus detalles completos.",
        placement: "left",
      },
      {
        id: "transacciones-tabla",
        target: "[data-tutorial='transacciones-tabla']",
        title: "Tabla de Movimientos",
        content: "Esta tabla muestra cada transacción con fecha, descripción, categoría y monto. Puedes filtrar y buscar transacciones específicas.",
        placement: "top",
      },
    ],
  },
  {
    id: "calendario",
    name: "Calendario Financiero",
    steps: [
      {
        id: "calendario-title",
        target: "[data-tutorial='calendario-title']",
        title: "Calendario Financiero",
        content: "El calendario te permite visualizar tus transacciones organizadas por fecha. Los días con movimientos aparecen resaltados.",
        placement: "bottom",
      },
      {
        id: "calendario-calendar",
        target: "[data-tutorial='calendario-calendar']",
        title: "Selecciona una Fecha",
        content: "Haz clic en cualquier día del calendario para ver las transacciones de esa fecha. Los días con actividad aparecen destacados.",
        tip: "Los días con transacciones tienen un fondo de color para identificarlos fácilmente.",
        placement: "bottom",
      },
      {
        id: "calendario-detalle",
        target: "[data-tutorial='calendario-detalle']",
        title: "Detalle del Día",
        content: "Aquí aparecen las transacciones del día seleccionado con el tipo (ingreso/gasto), monto y descripción.",
        placement: "left",
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
        content: "Aquí puedes definir límites de gasto por categoría. El sistema te alertará cuando te acerques o superes tus límites.",
        placement: "bottom",
      },
      {
        id: "presupuesto-nuevo",
        target: "[data-tutorial='presupuesto-nuevo']",
        title: "Crear Presupuesto",
        content: "Haz clic aquí para crear un nuevo presupuesto. Define una categoría, asocia una cuenta de gastos y establece el monto máximo.",
        tip: "Los gastos reales se calculan automáticamente desde el Libro Diario.",
        placement: "left",
      },
      {
        id: "presupuesto-lista",
        target: "[data-tutorial='presupuesto-lista']",
        title: "Tus Presupuestos",
        content: "Cada presupuesto muestra una barra de progreso con el porcentaje gastado. Verde = dentro del límite, Rojo = excedido.",
        placement: "top",
      },
    ],
  },
  {
    id: "monedas",
    name: "Conversor de Monedas",
    steps: [
      {
        id: "monedas-title",
        target: "[data-tutorial='monedas-title']",
        title: "Monedas y Conversiones",
        content: "Gestiona múltiples monedas y realiza conversiones en tiempo real con tasas de cambio actualizadas.",
        placement: "bottom",
      },
      {
        id: "monedas-conversor",
        target: "[data-tutorial='monedas-conversor']",
        title: "Conversor de Monedas",
        content: "Selecciona la moneda de origen y destino, ingresa la cantidad y obtén la conversión automáticamente. Puedes invertir las monedas con un clic.",
        placement: "right",
      },
      {
        id: "monedas-tasas",
        target: "[data-tutorial='monedas-tasas']",
        title: "Tabla de Tasas de Cambio",
        content: "Consulta las tasas de cambio actuales de más de 30 monedas internacionales respecto al dólar americano (USD).",
        tip: "Haz clic en 'Actualizar Tasas' para obtener los valores más recientes desde internet.",
        placement: "left",
      },
    ],
  },
  {
    id: "categorias",
    name: "Categorías",
    steps: [
      {
        id: "categorias-title",
        target: "[data-tutorial='categorias-title']",
        title: "Tus Categorías",
        content: "Las categorías se generan automáticamente desde tus transacciones. Aquí puedes ver cuánto has gastado o ganado por cada una.",
        placement: "bottom",
      },
      {
        id: "categorias-stats",
        target: "[data-tutorial='categorias-stats']",
        title: "Totales por Tipo",
        content: "Estas tarjetas muestran el total de ingresos, gastos y el número de categorías activas. Úsalas para tener una vista rápida.",
        placement: "bottom",
      },
      {
        id: "categorias-lista",
        target: "[data-tutorial='categorias-lista']",
        title: "Lista de Categorías",
        content: "Cada categoría muestra su nombre, tipo (ingreso/gasto), monto total y número de transacciones. Puedes filtrar por tipo.",
        placement: "top",
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
        content: "Aquí encuentras gráficos y visualizaciones de toda tu información financiera consolidada: tendencias, distribución y comparativas.",
        placement: "bottom",
      },
      {
        id: "resumen-stats",
        target: "[data-tutorial='resumen-stats']",
        title: "Indicadores Clave",
        content: "Estas tarjetas muestran tus ingresos totales, gastos, balance y ratio de ahorro. Son los indicadores más importantes de tu salud financiera.",
        placement: "bottom",
      },
      {
        id: "resumen-grafico",
        target: "[data-tutorial='resumen-grafico']",
        title: "Gráfico de Tendencias",
        content: "Este gráfico de barras muestra la evolución de tus ingresos y gastos mes a mes. Te ayuda a ver si estás mejorando con el tiempo.",
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
        content: "Haz clic aquí para agregar una nueva transacción. Cada ingreso o gasto debe registrarse aquí para que aparezca en los reportes.",
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
        content: "'Debe' es para gastos y aumento de activos. 'Haber' es para ingresos y aumento de pasivos.",
        tip: "¡Solo usa uno por transacción! Si algo entra al Debe, otra cuenta debe ir al Haber.",
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
        content: "Cada pestaña representa una cuenta diferente (Banco, Caja, Ingresos, etc.). Haz clic para ver los movimientos y saldo de esa cuenta.",
        tip: "El saldo final de cada cuenta se calcula automáticamente sumando débitos y restando créditos.",
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
        tip: "Un patrimonio neto creciente mes a mes indica buena gestión financiera.",
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
        tip: "Revisa este indicador cada mes para asegurarte de que estás en camino a tus metas.",
        placement: "bottom",
      },
    ],
  },
  {
    id: "recomendaciones",
    name: "Recomendaciones",
    steps: [
      {
        id: "recomendaciones-title",
        target: "[data-tutorial='recomendaciones-title']",
        title: "Recomendaciones Inteligentes",
        content: "Esta sección te ofrece sugerencias personalizadas de ahorro, inversión y educación financiera generadas por IA.",
        placement: "bottom",
      },
      {
        id: "recomendaciones-cards",
        target: "[data-tutorial='recomendaciones-cards']",
        title: "Sugerencias Automáticas",
        content: "Estas tarjetas muestran oportunidades detectadas en tus finanzas: posibles ahorros, ideas de inversión y contenido educativo.",
        tip: "Haz clic en 'Ver Detalles' para obtener información más completa sobre cada recomendación.",
        placement: "bottom",
      },
      {
        id: "recomendaciones-chat",
        target: "[data-tutorial='recomendaciones-chat']",
        title: "Tutor Financiero con IA",
        content: "Escribe cualquier pregunta sobre finanzas personales y obtén respuestas educativas. También puedes usar las preguntas sugeridas.",
        tip: "El tutor educativo está disponible en todos los planes. El chat financiero y bolsas en vivo requieren plan Tradicional o Completa.",
        placement: "top",
      },
    ],
  },
  {
    id: "notificaciones",
    name: "Notificaciones",
    steps: [
      {
        id: "notificaciones-title",
        target: "[data-tutorial='notificaciones-title']",
        title: "Centro de Notificaciones",
        content: "Aquí recibes alertas sobre presupuestos excedidos, resúmenes mensuales y avisos importantes del sistema.",
        placement: "bottom",
      },
      {
        id: "notificaciones-actions",
        target: "[data-tutorial='notificaciones-actions']",
        title: "Gestionar Notificaciones",
        content: "Puedes marcar como leídas, eliminar individualmente o limpiar todas las notificaciones. También puedes configurar qué alertas recibir.",
        placement: "left",
      },
      {
        id: "notificaciones-stats",
        target: "[data-tutorial='notificaciones-stats']",
        title: "Resumen de Alertas",
        content: "Estas tarjetas muestran el total de notificaciones, cuántas están sin leer y los tipos de alertas activas.",
        placement: "bottom",
      },
    ],
  },
  {
    id: "configuracion",
    name: "Configuración",
    steps: [
      {
        id: "configuracion-title",
        target: "[data-tutorial='configuracion-title']",
        title: "Configuración",
        content: "Personaliza la aplicación según tus preferencias: tema visual, seguridad, exportación de datos y mucho más.",
        placement: "bottom",
      },
      {
        id: "configuracion-tema",
        target: "[data-tutorial='configuracion-tema']",
        title: "Tema y Apariencia",
        content: "Elige entre tema claro, oscuro o del sistema. También puedes ajustar el tamaño de fuente y las animaciones.",
        tip: "El tema oscuro es ideal para usar la app de noche sin cansar la vista.",
        placement: "bottom",
      },
      {
        id: "configuracion-datos",
        target: "[data-tutorial='configuracion-datos']",
        title: "Gestión de Datos",
        content: "Exporta tus datos en JSON, CSV o QIF para respaldo. También puedes importar datos desde archivos externos como Excel, OFX y más.",
        tip: "Haz respaldos periódicos para no perder tu información financiera.",
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
