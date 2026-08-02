import { Card, CardContent } from "@/components/ui/card";
import { useSimpleAccountingData } from "@/hooks/useSimpleAccountingData";
import { useNumberFormat } from "@/hooks/useNumberFormat";
import { useModeFeatures } from "@/hooks/useModeFeatures";

export function WeeklySummaryCard() {
  const { isSimpleMode } = useModeFeatures();
  const { recentTransactions } = useSimpleAccountingData();
  const { formatCurrency } = useNumberFormat();

  if (!isSimpleMode) return null;

  // Calculate this week's totals
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const weekTransactions = recentTransactions.filter((tx) => {
    const txDate = new Date(tx.date);
    return txDate >= startOfWeek;
  });

  const weekIncome = weekTransactions
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const weekExpense = weekTransactions
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const balance = weekIncome - weekExpense;
  const txCount = weekTransactions.length;

  if (txCount === 0) return null;

  const balanceEmoji = balance >= 0 ? "🎉" : "😅";
  const balanceText = balance >= 0 ? "¡Vas bien!" : "Cuidado con los gastos";

  return (
    <Card className="shadow-soft border-primary/10 bg-gradient-to-r from-primary/5 to-transparent">
      <CardContent className="p-4">
        <p className="text-sm leading-relaxed">
          <span className="font-semibold">📊 Esta semana:</span>{" "}
          {weekExpense > 0 && (
            <>💸 Gastaste <span className="font-bold text-destructive">{formatCurrency(weekExpense)}</span></>
          )}
          {weekIncome > 0 && weekExpense > 0 && " · "}
          {weekIncome > 0 && (
            <>💰 Ganaste <span className="font-bold text-success">{formatCurrency(weekIncome)}</span></>
          )}
          {" · "}
          {balanceEmoji} {balanceText}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {txCount} movimiento{txCount !== 1 ? "s" : ""} registrado{txCount !== 1 ? "s" : ""}
        </p>
      </CardContent>
    </Card>
  );
}
