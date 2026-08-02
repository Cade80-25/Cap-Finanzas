import { useLocalStorage } from "./useLocalStorage";

const PAGE_TOOLTIPS: Record<string, { title: string; message: string; emoji: string }> = {
  "/": {
    title: "Panel Principal",
    message: "Aquí ves un resumen de tus finanzas: ingresos, gastos y ahorros de un vistazo.",
    emoji: "📊",
  },
  "/transacciones": {
    title: "Movimientos",
    message: "Registra tus ingresos y gastos rápidamente. Usa los botones verdes y rojos para empezar.",
    emoji: "💸",
  },
  "/calendario": {
    title: "Calendario",
    message: "Visualiza tus movimientos organizados por fecha en el calendario.",
    emoji: "📅",
  },
  "/presupuesto": {
    title: "Presupuesto",
    message: "Define límites de gasto por categoría y recibe alertas cuando estés cerca del límite.",
    emoji: "🎯",
  },
  "/monedas": {
    title: "Monedas",
    message: "Consulta tipos de cambio en tiempo real y convierte entre monedas.",
    emoji: "🌍",
  },
  "/resumen": {
    title: "Resumen",
    message: "Analiza tus finanzas con gráficos detallados de ingresos y gastos.",
    emoji: "📈",
  },
  "/recomendaciones": {
    title: "Recomendaciones",
    message: "Obtén consejos personalizados con inteligencia artificial para mejorar tus finanzas.",
    emoji: "✨",
  },
  "/categorias": {
    title: "Categorías",
    message: "Administra las categorías para organizar mejor tus transacciones.",
    emoji: "🏷️",
  },
  "/consolidado": {
    title: "Consolidado",
    message: "Ve el panorama completo de todas tus billeteras y perfiles.",
    emoji: "📋",
  },
  "/libro-diario": {
    title: "Libro Diario",
    message: "Registra transacciones con partida doble: débito y crédito.",
    emoji: "📖",
  },
  "/libro-mayor": {
    title: "Libro Mayor",
    message: "Consulta el detalle de movimientos agrupados por cuenta contable.",
    emoji: "📑",
  },
  "/balance": {
    title: "Balance General",
    message: "Revisa la situación financiera: activos, pasivos y patrimonio.",
    emoji: "⚖️",
  },
  "/resultados": {
    title: "Estado de Resultados",
    message: "Analiza la rentabilidad: ingresos menos gastos del período.",
    emoji: "📊",
  },
};

export function useFirstVisitTooltips() {
  const [visitedPages, setVisitedPages] = useLocalStorage<string[]>("cap-visited-pages", []);
  const [tooltipsEnabled, setTooltipsEnabled] = useLocalStorage("cap-first-visit-tooltips", true);

  const getTooltipForPage = (pathname: string) => {
    if (!tooltipsEnabled) return null;
    if (visitedPages.includes(pathname)) return null;
    return PAGE_TOOLTIPS[pathname] || null;
  };

  const markPageVisited = (pathname: string) => {
    if (!visitedPages.includes(pathname)) {
      setVisitedPages([...visitedPages, pathname]);
    }
  };

  const disableTooltips = () => setTooltipsEnabled(false);

  return {
    getTooltipForPage,
    markPageVisited,
    tooltipsEnabled,
    disableTooltips,
  };
}
