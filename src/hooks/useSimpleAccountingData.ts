import { useMemo } from "react";
import { useJournalTransactions, JournalTransaction } from "./useJournalTransactions";
import { useLicense } from "./useLicense";

/**
 * Simplified accounting data for "Simple Finance" mode
 * In simple mode:
 * - All debits = expenses
 * - All credits = income
 * - No complex account categorization
 */
export function useSimpleAccountingData() {
  const { transactions } = useJournalTransactions();
  const { mode } = useLicense();

  // Simple monthly summary - treats all debits as expenses, credits as income
  const simpleMonthlySummary = useMemo(() => {
    const monthlyData: Record<string, { ingresos: number; gastos: number }> = {};

    transactions.forEach((tx) => {
      const month = tx.date.substring(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = { ingresos: 0, gastos: 0 };
      }

      // Simple logic: credit = income, debit = expense
      monthlyData[month].ingresos += tx.credit;
      monthlyData[month].gastos += tx.debit;
    });

    const sortedMonths = Object.keys(monthlyData).sort();
    const monthNames: Record<string, string> = {
      "01": "Ene", "02": "Feb", "03": "Mar", "04": "Abr",
      "05": "May", "06": "Jun", "07": "Jul", "08": "Ago",
      "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dic",
    };

    return sortedMonths.map((month) => ({
      mes: `${monthNames[month.substring(5, 7)]} ${month.substring(0, 4)}`,
      ingresos: monthlyData[month].ingresos,
      gastos: monthlyData[month].gastos,
    }));
  }, [transactions]);

  // Simple totals - all credits are income, all debits are expenses
  const simpleTotals = useMemo(() => {
    const currentMonth = new Date().toISOString().substring(0, 7);
    let totalIngresos = 0;
    let totalGastos = 0;
    let ingresosDelMes = 0;
    let gastosDelMes = 0;

    transactions.forEach((tx) => {
      totalIngresos += tx.credit;
      totalGastos += tx.debit;

      if (tx.date.startsWith(currentMonth)) {
        ingresosDelMes += tx.credit;
        gastosDelMes += tx.debit;
      }
    });

    const balance = totalIngresos - totalGastos;

    return {
      balance,
      totalIngresos,
      totalGastos,
      ingresosDelMes,
      gastosDelMes,
      ahorros: Math.max(0, balance),
    };
  }, [transactions]);

  // Simple recent transactions - show as income/expense based on debit/credit
  const simpleRecentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5)
      .map((tx) => {
        // If has credit, it's income; if has debit, it's expense
        const isIncome = tx.credit > 0;
        const amount = isIncome ? tx.credit : -tx.debit;

        return {
          id: tx.id,
          description: tx.description,
          amount,
          type: isIncome ? "income" as const : "expense" as const,
          date: tx.date,
          category: tx.account,
        };
      });
  }, [transactions]);

  // Simple categories by total spent/earned
  const simpleCategories = useMemo(() => {
    const categoryTotals: Record<string, { gastos: number; ingresos: number; count: number }> = {};

    transactions.forEach((tx) => {
      const cat = tx.account || "sin-categoria";
      if (!categoryTotals[cat]) {
        categoryTotals[cat] = { gastos: 0, ingresos: 0, count: 0 };
      }
      categoryTotals[cat].gastos += tx.debit;
      categoryTotals[cat].ingresos += tx.credit;
      categoryTotals[cat].count++;
    });

    return Object.entries(categoryTotals).map(([name, data]) => ({
      id: name,
      nombre: formatCategoryName(name),
      gastos: data.gastos,
      ingresos: data.ingresos,
      transacciones: data.count,
      tipo: data.ingresos > data.gastos ? "Ingreso" as const : "Gasto" as const,
    }));
  }, [transactions]);

  // Category pie chart data
  const simpleCategoryChartData = useMemo(() => {
    const colors = [
      "hsl(var(--primary))",
      "hsl(var(--success))",
      "hsl(var(--warning))",
      "hsl(var(--destructive))",
      "hsl(var(--accent))",
      "#8884d8",
      "#82ca9d",
      "#ffc658",
    ];

    return simpleCategories
      .filter((c) => c.gastos > 0)
      .map((cat, index) => ({
        name: cat.nombre,
        value: cat.gastos,
        color: colors[index % colors.length],
      }));
  }, [simpleCategories]);

  return {
    transactions,
    monthlySummary: simpleMonthlySummary,
    totals: simpleTotals,
    recentTransactions: simpleRecentTransactions,
    categories: simpleCategories,
    categoryChartData: simpleCategoryChartData,
    isSimpleMode: mode === "simple",
  };
}

// Helper to format category slugs to readable names
function formatCategoryName(slug: string): string {
  const names: Record<string, string> = {
    "gastos-operativos": "Gastos Operativos",
    "ingresos": "Ingresos",
    "banco": "Banco",
    "caja": "Efectivo",
    "activo-corriente": "Activo Corriente",
    "pasivo-corriente": "Pasivo Corriente",
    "cuentas-por-cobrar": "Cuentas por Cobrar",
    "cuentas-por-pagar": "Cuentas por Pagar",
    "inventarios": "Inventarios",
    "costo-ventas": "Costo de Ventas",
    "gastos-financieros": "Gastos Financieros",
    "sin-categoria": "Sin Categoría",
  };
  
  return names[slug] || slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}
