import { TrendingUp, TrendingDown, Plus, Zap, Calculator } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAccountingData } from "@/hooks/useAccountingData";
import { useSimpleAccountingData } from "@/hooks/useSimpleAccountingData";
import { useModeFeatures } from "@/hooks/useModeFeatures";
import { useNumberFormat } from "@/hooks/useNumberFormat";
import { useJournalTransactions } from "@/hooks/useJournalTransactions";
import { QuickExpenseDialog } from "@/components/FloatingQuickExpense";
import { useState } from "react";

function formatShortDate(date: string): string {
  if (!date) return "—";
  const [y, m, d] = date.split("-");
  return `${d}/${m}`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { isSimpleMode } = useModeFeatures();
  const { formatCurrency } = useNumberFormat();
  const { transactions } = useJournalTransactions();
  const [quickExpenseOpen, setQuickExpenseOpen] = useState(false);

  const traditionalData = useAccountingData();
  const simpleData = useSimpleAccountingData();

  const totales = isSimpleMode ? simpleData.totals : traditionalData.totales;

  // Transacciones reales (con price/quantity) agrupadas por ingresos/gastos
  const ingresos = transactions.filter((t) => t.credit > 0);
  const gastos = transactions.filter((t) => t.debit > 0);

  const sumaIngresos = ingresos.reduce((a, t) => a + t.credit, 0);
  const sumaGastos = gastos.reduce((a, t) => a + t.debit, 0);

  const addTransactionRoute = isSimpleMode ? "/transacciones" : "/libro-diario";
  const addTransactionLabel = isSimpleMode ? "+ Añadir" : "Ir al Libro Diario";

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 animate-in fade-in duration-500">
      {/* 3 cards de resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-soft border-0">
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-muted-foreground tracking-wide">BALANCE TOTAL</p>
            <p className="text-2xl sm:text-3xl font-bold mt-2 tabular-nums text-amber-500">{formatCurrency(totales.balance)}</p>
            <p className="text-xs text-muted-foreground mt-1">Todas las cuentas</p>
          </CardContent>
        </Card>
        <Card className="shadow-soft border-0">
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-muted-foreground tracking-wide">INGRESOS DEL MES</p>
            <p className="text-2xl sm:text-3xl font-bold mt-2 tabular-nums text-emerald-600">+ {formatCurrency(totales.ingresosDelMes)}</p>
            <p className="text-xs text-muted-foreground mt-1">Créditos del período</p>
          </CardContent>
        </Card>
        <Card className="shadow-soft border-0">
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-muted-foreground tracking-wide">GASTOS DEL MES</p>
            <p className="text-2xl sm:text-3xl font-bold mt-2 tabular-nums text-red-600">− {formatCurrency(totales.gastosDelMes)}</p>
            <p className="text-xs text-muted-foreground mt-1">Débitos del período</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla jerárquica estilo Personal Finances */}
      <Card className="shadow-soft overflow-hidden border-0">
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <h2 className="text-base font-semibold">Transacciones recientes</h2>
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={() => navigate(addTransactionRoute)}>
            <Plus className="h-4 w-4 mr-1" /> {addTransactionLabel}
          </Button>
          {isSimpleMode && (
            <Button size="sm" variant="secondary" onClick={() => setQuickExpenseOpen(true)}>
              <Zap className="h-4 w-4 mr-1" /> Gasto rápido
            </Button>
          )}
        </div>

        {transactions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            Sin movimientos todavía. Registrá tu primer ingreso o gasto.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b bg-muted/40">
                  <th className="px-4 py-2.5 w-8 font-semibold">#</th>
                  <th className="px-4 py-2.5 font-semibold">Descripción</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Precio</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Cant.</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Suma</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {ingresos.length > 0 && (
                  <>
                    <tr className="border-b bg-emerald-50/40">
                      <td className="px-4 py-2 text-muted-foreground">▾</td>
                      <td className="px-4 py-2 font-bold">Ingresos</td>
                      <td className="px-4 py-2"></td>
                      <td className="px-4 py-2"></td>
                      <td className="px-4 py-2 text-right font-semibold text-emerald-600 tabular-nums">+ {formatCurrency(sumaIngresos)}</td>
                      <td className="px-4 py-2">—</td>
                    </tr>
                    {ingresos.map((t) => {
                      const price = t.price ?? t.credit;
                      const qty = t.quantity ?? 1;
                      return (
                        <tr key={t.id} className="border-b hover:bg-muted/30">
                          <td className="px-4 py-2"></td>
                          <td className="px-4 py-2 pl-8">{t.description}</td>
                          <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(price)}</td>
                          <td className="px-4 py-2 text-right tabular-nums">{qty}</td>
                          <td className="px-4 py-2 text-right font-semibold tabular-nums text-emerald-600">{formatCurrency(t.credit)}</td>
                          <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">{formatShortDate(t.date)}</td>
                        </tr>
                      );
                    })}
                  </>
                )}
                {gastos.length > 0 && (
                  <>
                    <tr className="border-b bg-red-50/40">
                      <td className="px-4 py-2 text-muted-foreground">▾</td>
                      <td className="px-4 py-2 font-bold">Gastos</td>
                      <td className="px-4 py-2"></td>
                      <td className="px-4 py-2"></td>
                      <td className="px-4 py-2 text-right font-semibold text-red-600 tabular-nums">− {formatCurrency(sumaGastos)}</td>
                      <td className="px-4 py-2">—</td>
                    </tr>
                    {gastos.map((t) => {
                      const price = t.price ?? t.debit;
                      const qty = t.quantity ?? 1;
                      return (
                        <tr key={t.id} className="border-b hover:bg-muted/30">
                          <td className="px-4 py-2"></td>
                          <td className="px-4 py-2 pl-8">{t.description}</td>
                          <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(price)}</td>
                          <td className="px-4 py-2 text-right tabular-nums">{qty}</td>
                          <td className="px-4 py-2 text-right font-semibold tabular-nums text-red-600">{formatCurrency(t.debit)}</td>
                          <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">{formatShortDate(t.date)}</td>
                        </tr>
                      );
                    })}
                  </>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Nota calculadora inteligente */}
        <div className="m-4 p-3 rounded-lg bg-primary/10 border border-primary/40 text-sm text-muted-foreground">
          💡 <b className="text-foreground">Nueva calculadora inteligente:</b> la columna «Suma» calcula{" "}
          <b>Precio × Cantidad</b> automáticamente. El icono{" "}
          <Calculator className="h-3.5 w-3.5 inline-block mx-0.5 text-primary" /> junto a cada campo de
          monto abre una <b>mini-calculadora</b> para calcular el valor y volcarlo al campo (como en Personal Finances).
        </div>
      </Card>

      {/* Footer versión */}
      <p className="text-center text-[11px] text-muted-foreground pt-2">
        Cap Finanzas · v1.2 "Personal &amp; Empresa"
      </p>

      <QuickExpenseDialog open={quickExpenseOpen} onOpenChange={setQuickExpenseOpen} />
    </div>
  );
}