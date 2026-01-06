import { useEffect, useRef } from "react";
import { useNotifications } from "./useNotifications";
import { useAccountingData } from "./useAccountingData";
import { useBudgets } from "./useBudgets";

export function useNotificationGenerator() {
  const { addNotification, settings } = useNotifications();
  const { estadoResultados, ACCOUNT_CATEGORIES } = useAccountingData();
  const { budgets: presupuestoData } = useBudgets();
  const lastCheckRef = useRef<string>("");

  useEffect(() => {
    // Solo ejecutar una vez por sesión para evitar notificaciones repetidas
    const today = new Date().toISOString().slice(0, 10);
    if (lastCheckRef.current === today || !settings.enableInApp) {
      return;
    }
    lastCheckRef.current = today;

    // Verificar alertas de presupuesto
    presupuestoData.forEach((item) => {
      const cuentaLabel = item.cuentaAsociada
        ? ACCOUNT_CATEGORIES[item.cuentaAsociada]?.label
        : undefined;

      const gastoRelacionado = cuentaLabel
        ? estadoResultados.gastos.find((g) => g.name === cuentaLabel)
        : estadoResultados.gastos.find((g) => {
            const a = g.name.toLowerCase();
            const b = item.categoria.toLowerCase();
            return a.includes(b) || b.includes(a);
          });

      const gastado = gastoRelacionado?.value || 0;
      const porcentaje = item.presupuesto > 0 ? (gastado / item.presupuesto) * 100 : 0;

      if (porcentaje >= 100) {
        addNotification({
          title: `¡Presupuesto excedido!`,
          message: `Has excedido el presupuesto de "${item.categoria}" por $${(gastado - item.presupuesto).toFixed(2)}`,
          type: "error",
          category: "presupuesto",
        });
      } else if (porcentaje >= 80) {
        addNotification({
          title: `Alerta de presupuesto`,
          message: `Has usado el ${porcentaje.toFixed(0)}% del presupuesto de "${item.categoria}"`,
          type: "warning",
          category: "presupuesto",
        });
      }
    });

    // Verificar si hay gastos altos vs ingresos
    if (estadoResultados.totalIngresos > 0 && estadoResultados.totalGastos > 0) {
      const ratioGastos = (estadoResultados.totalGastos / estadoResultados.totalIngresos) * 100;
      
      if (ratioGastos >= 90) {
        addNotification({
          title: "Gastos elevados",
          message: `Tus gastos representan el ${ratioGastos.toFixed(0)}% de tus ingresos. Considera revisar tu presupuesto.`,
          type: "warning",
          category: "resumen",
        });
      }
    }

    // Notificación de bienvenida si no hay datos
    if (estadoResultados.totalIngresos === 0 && estadoResultados.totalGastos === 0) {
      addNotification({
        title: "¡Bienvenido a Cap Finanzas!",
        message: "Comienza registrando tus transacciones en el Libro Diario para ver tus finanzas.",
        type: "info",
        category: "sistema",
      });
    }

    // Recordatorio de fin de mes
    const dayOfMonth = new Date().getDate();
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    
    if (dayOfMonth >= daysInMonth - 3) {
      addNotification({
        title: "Fin de mes próximo",
        message: "El mes está por terminar. Revisa tu resumen financiero y prepara el presupuesto del próximo mes.",
        type: "info",
        category: "resumen",
      });
    }

  }, [presupuestoData, estadoResultados, settings.enableInApp, addNotification]);
}
