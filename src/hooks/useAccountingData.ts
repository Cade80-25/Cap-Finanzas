import { useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";

// Tipo de transacción del Libro Diario
export type Transaction = {
  id: number;
  date: string;
  account: string;
  description: string;
  debit: number;
  credit: number;
};

// Mapeo de cuentas a categorías contables
const ACCOUNT_CATEGORIES: Record<string, { type: "activo" | "pasivo" | "patrimonio" | "ingreso" | "gasto"; label: string; icon: string; color: string }> = {
  "activo-corriente": { type: "activo", label: "Activo Corriente", icon: "💰", color: "bg-blue-500" },
  "activo-no-corriente": { type: "activo", label: "Activo No Corriente", icon: "🏠", color: "bg-blue-600" },
  "pasivo-corriente": { type: "pasivo", label: "Pasivo Corriente", icon: "📋", color: "bg-red-400" },
  "pasivo-no-corriente": { type: "pasivo", label: "Pasivo No Corriente", icon: "📜", color: "bg-red-500" },
  "patrimonio": { type: "patrimonio", label: "Patrimonio", icon: "🏦", color: "bg-purple-500" },
  "ingresos": { type: "ingreso", label: "Ingresos", icon: "💵", color: "bg-green-500" },
  "gastos-operativos": { type: "gasto", label: "Gastos Operativos", icon: "🏢", color: "bg-orange-500" },
  "gastos-financieros": { type: "gasto", label: "Gastos Financieros", icon: "🏧", color: "bg-orange-600" },
  "costo-ventas": { type: "gasto", label: "Costo de Ventas", icon: "📦", color: "bg-yellow-500" },
  "banco": { type: "activo", label: "Banco", icon: "🏛️", color: "bg-blue-400" },
  "caja": { type: "activo", label: "Caja", icon: "💵", color: "bg-green-400" },
  "cuentas-por-cobrar": { type: "activo", label: "Cuentas por Cobrar", icon: "📥", color: "bg-teal-500" },
  "cuentas-por-pagar": { type: "pasivo", label: "Cuentas por Pagar", icon: "📤", color: "bg-red-600" },
  "inventarios": { type: "activo", label: "Inventarios", icon: "📦", color: "bg-amber-500" },
  "depreciacion": { type: "gasto", label: "Depreciación", icon: "📉", color: "bg-gray-500" },
  "amortizacion": { type: "gasto", label: "Amortización", icon: "📊", color: "bg-gray-600" },
};

export function useAccountingData() {
  const [transactions] = useLocalStorage<Transaction[]>(
    "cap-finanzas-libro-diario-transactions",
    []
  );

  // Libro Mayor: agrupar transacciones por cuenta
  const libroMayor = useMemo(() => {
    const accountsMap: Record<string, { 
      name: string; 
      label: string;
      transactions: Array<{ date: string; description: string; debit: number; credit: number; balance: number }>;
      totalDebit: number;
      totalCredit: number;
      balance: number;
    }> = {};

    transactions.forEach((tx) => {
      if (!accountsMap[tx.account]) {
        const category = ACCOUNT_CATEGORIES[tx.account];
        accountsMap[tx.account] = {
          name: tx.account,
          label: category?.label || tx.account,
          transactions: [],
          totalDebit: 0,
          totalCredit: 0,
          balance: 0,
        };
      }

      accountsMap[tx.account].totalDebit += tx.debit;
      accountsMap[tx.account].totalCredit += tx.credit;
      accountsMap[tx.account].balance = accountsMap[tx.account].totalDebit - accountsMap[tx.account].totalCredit;

      accountsMap[tx.account].transactions.push({
        date: tx.date,
        description: tx.description,
        debit: tx.debit,
        credit: tx.credit,
        balance: accountsMap[tx.account].balance,
      });
    });

    return Object.values(accountsMap);
  }, [transactions]);

  // Estado de Resultados: calcular ingresos y gastos
  const estadoResultados = useMemo(() => {
    const ingresos: Array<{ name: string; value: number }> = [];
    const gastos: Array<{ name: string; value: number }> = [];

    libroMayor.forEach((account) => {
      const category = ACCOUNT_CATEGORIES[account.name];
      if (!category) return;

      if (category.type === "ingreso") {
        const value = account.totalCredit - account.totalDebit;
        if (value > 0) {
          ingresos.push({ name: account.label, value });
        }
      } else if (category.type === "gasto") {
        const value = account.totalDebit - account.totalCredit;
        if (value > 0) {
          gastos.push({ name: account.label, value });
        }
      }
    });

    const totalIngresos = ingresos.reduce((sum, i) => sum + i.value, 0);
    const totalGastos = gastos.reduce((sum, g) => sum + g.value, 0);

    return {
      ingresos,
      gastos,
      totalIngresos,
      totalGastos,
      resultadoNeto: totalIngresos - totalGastos,
    };
  }, [libroMayor]);

  // Balance General: calcular activos, pasivos y patrimonio
  const balanceGeneral = useMemo(() => {
    const activos: Array<{ name: string; value: number }> = [];
    const pasivos: Array<{ name: string; value: number }> = [];
    let patrimonioTotal = 0;

    libroMayor.forEach((account) => {
      const category = ACCOUNT_CATEGORIES[account.name];
      if (!category) return;

      const balance = account.balance;

      if (category.type === "activo") {
        activos.push({ name: account.label, value: balance });
      } else if (category.type === "pasivo") {
        pasivos.push({ name: account.label, value: Math.abs(balance) });
      } else if (category.type === "patrimonio") {
        patrimonioTotal += balance;
      }
    });

    const resultadoEjercicio = estadoResultados.resultadoNeto;
    
    return {
      activos,
      pasivos,
      totalActivos: activos.reduce((sum, a) => sum + a.value, 0),
      totalPasivos: pasivos.reduce((sum, p) => sum + p.value, 0),
      patrimonio: patrimonioTotal + resultadoEjercicio,
    };
  }, [libroMayor, estadoResultados.resultadoNeto]);

  // Resumen: datos mensuales para gráficos
  const resumenMensual = useMemo(() => {
    const monthlyData: Record<string, { ingresos: number; gastos: number }> = {};

    transactions.forEach((tx) => {
      const month = tx.date.substring(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = { ingresos: 0, gastos: 0 };
      }

      const category = ACCOUNT_CATEGORIES[tx.account];
      if (category?.type === "ingreso") {
        monthlyData[month].ingresos += tx.credit - tx.debit;
      } else if (category?.type === "gasto") {
        monthlyData[month].gastos += tx.debit - tx.credit;
      }
    });

    const sortedMonths = Object.keys(monthlyData).sort();
    const monthNames: Record<string, string> = {
      "01": "Ene", "02": "Feb", "03": "Mar", "04": "Abr",
      "05": "May", "06": "Jun", "07": "Jul", "08": "Ago",
      "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dic",
    };

    return sortedMonths.map((month) => ({
      mes: `${monthNames[month.substring(5, 7)]} ${month.substring(0, 4)}`,
      ingresos: Math.max(0, monthlyData[month].ingresos),
      gastos: Math.max(0, monthlyData[month].gastos),
    }));
  }, [transactions]);

  // Datos por categoría para gráficos de pie
  const datosCategorias = useMemo(() => {
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

    return estadoResultados.gastos.map((gasto, index) => ({
      name: gasto.name,
      value: gasto.value,
      color: colors[index % colors.length],
    }));
  }, [estadoResultados.gastos]);

  // Categorías: extraer todas las cuentas usadas con sus totales
  const categorias = useMemo(() => {
    return libroMayor.map((account) => {
      const category = ACCOUNT_CATEGORIES[account.name];
      const isIngreso = category?.type === "ingreso";
      const isGasto = category?.type === "gasto";
      
      let tipo: "Ingreso" | "Gasto" | "Balance" = "Balance";
      let total = Math.abs(account.balance);
      
      if (isIngreso) {
        tipo = "Ingreso";
        total = account.totalCredit - account.totalDebit;
      } else if (isGasto) {
        tipo = "Gasto";
        total = account.totalDebit - account.totalCredit;
      }

      return {
        id: account.name,
        nombre: account.label,
        tipo,
        icono: category?.icon || "📁",
        color: category?.color || "bg-gray-500",
        transacciones: account.transactions.length,
        total: Math.max(0, total),
      };
    });
  }, [libroMayor]);

  // Transacciones recientes para Dashboard
  const transaccionesRecientes = useMemo(() => {
    return [...transactions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5)
      .map((tx) => {
        const category = ACCOUNT_CATEGORIES[tx.account];
        const isIngreso = category?.type === "ingreso";
        return {
          id: tx.id,
          description: tx.description,
          amount: isIngreso ? tx.credit : -tx.debit,
          type: isIngreso ? "income" : "expense",
          date: tx.date,
        };
      });
  }, [transactions]);

  // Totales para Dashboard
  const totales = useMemo(() => {
    const currentMonth = new Date().toISOString().substring(0, 7);
    let ingresosDelMes = 0;
    let gastosDelMes = 0;

    transactions.forEach((tx) => {
      if (tx.date.startsWith(currentMonth)) {
        const category = ACCOUNT_CATEGORIES[tx.account];
        if (category?.type === "ingreso") {
          ingresosDelMes += tx.credit - tx.debit;
        } else if (category?.type === "gasto") {
          gastosDelMes += tx.debit - tx.credit;
        }
      }
    });

    return {
      balance: estadoResultados.resultadoNeto,
      ingresosDelMes: Math.max(0, ingresosDelMes),
      gastosDelMes: Math.max(0, gastosDelMes),
      ahorros: Math.max(0, estadoResultados.resultadoNeto),
    };
  }, [transactions, estadoResultados.resultadoNeto]);

  return {
    transactions,
    libroMayor,
    balanceGeneral,
    estadoResultados,
    resumenMensual,
    datosCategorias,
    categorias,
    transaccionesRecientes,
    totales,
    ACCOUNT_CATEGORIES,
  };
}
