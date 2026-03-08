import { useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useJournalTransactions } from "./useJournalTransactions";
import { useBudgets } from "./useBudgets";
import { useWallets } from "./useWallets";

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  emoji: string;
  completed: boolean;
  route: string;
}

export function useOnboardingProgress() {
  const [dismissed, setDismissed] = useLocalStorage("cap-onboarding-dismissed", false);
  const { transactions } = useJournalTransactions();
  const { budgets } = useBudgets();
  const { wallets } = useWallets();

  const steps: OnboardingStep[] = useMemo(() => {
    const hasWallet = wallets.length > 1; // default wallet always exists
    const hasIncome = transactions.some((t) => t.credit > 0);
    const hasExpense = transactions.some((t) => t.debit > 0);
    const hasBudget = budgets.some((b) => b.presupuesto > 0);

    return [
      {
        id: "wallet",
        title: "Crea una billetera",
        description: "Organiza tu dinero en billeteras separadas",
        emoji: "👛",
        completed: hasWallet,
        route: "/",
      },
      {
        id: "income",
        title: "Registra un ingreso",
        description: "Agrega tu primer ingreso o salario",
        emoji: "💰",
        completed: hasIncome,
        route: "/transacciones",
      },
      {
        id: "expense",
        title: "Registra un gasto",
        description: "Agrega tu primer gasto o compra",
        emoji: "🛒",
        completed: hasExpense,
        route: "/transacciones",
      },
      {
        id: "budget",
        title: "Define un presupuesto",
        description: "Establece un límite de gasto mensual",
        emoji: "🎯",
        completed: hasBudget,
        route: "/presupuesto",
      },
    ];
  }, [transactions, budgets, wallets]);

  const completedCount = steps.filter((s) => s.completed).length;
  const totalSteps = steps.length;
  const progress = Math.round((completedCount / totalSteps) * 100);
  const isComplete = completedCount === totalSteps;

  return {
    steps,
    completedCount,
    totalSteps,
    progress,
    isComplete,
    dismissed: dismissed || isComplete,
    dismiss: () => setDismissed(true),
  };
}
