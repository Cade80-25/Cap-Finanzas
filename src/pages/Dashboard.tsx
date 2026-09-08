import { Wallet, TrendingUp, TrendingDown, Plus, Zap, Sparkles, Navigation, Receipt, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAccountingData } from "@/hooks/useAccountingData";
import { useSimpleAccountingData } from "@/hooks/useSimpleAccountingData";
import { useModeFeatures } from "@/hooks/useModeFeatures";
import { useNumberFormat } from "@/hooks/useNumberFormat";
import { prefetchHandlers } from "@/lib/route-prefetch";

export default function Dashboard() {
  const navigate = useNavigate();
  const { isSimpleMode } = useModeFeatures();
  const { formatCurrency } = useNumberFormat();

  const traditionalData = useAccountingData();
  const simpleData = useSimpleAccountingData();

  const totales = isSimpleMode ? simpleData.totals : traditionalData.totales;
  const transaccionesRecientes = isSimpleMode ? simpleData.recentTransactions : traditionalData.transaccionesRecientes;

  const addTransactionRoute = isSimpleMode ? "/transacciones" : "/libro-diario";
  const addTransactionLabel = isSimpleMode ? "Agregar Movimiento" : "Ir al Libro Diario";

  // Separar ingresos y gastos recientes para la tabla jerárquica
  const ingresos = transaccionesRecientes.filter((t) => t.amount > 0);
  const gastos = transaccionesRecientes.filter((t) => t.amount < 0);
  const sumaTotal = transaccionesRecientes.reduce((acc, t) => acc + t.amount, 0);

  const startTour = () => {
    window.dispatchEvent(new CustomEvent("start-app-tour"));
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 animate-in fade-in duration-500">
      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Inicio</p>
          <h1 className="text-xl sm:text-2xl font-bold">Panel Principal</h1>
        </div>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={startTour} className="self-start">
          <Navigation className="h-4 w-4 mr-1" />
          Tour guiado
        </Button>
      </div>

      {/* 3 cards de resumen (estilo Personal Finances: Balance dorado, Ingresos verde, Gastos rojo) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-soft">
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-muted-foreground tracking-wide">BALANCE TOTAL</p>
            <p className="text-2xl sm:text-3xl font-bold mt-2 tabular-nums text-amber-500">{formatCurrency(totales.balance)}</p>
            <p className="text-xs text-muted-foreground mt-1">Todas las cuentas</p>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-muted-foreground tracking-wide">INGRESOS DEL MES</p>
            <p className="text-2xl sm:text-3xl font-bold mt-2 tabular-nums text-emerald-600">+ {formatCurrency(totales.ingresosDelMes)}</p>
            <p className="text-xs text-muted-foreground mt-1">Créditos del período</p>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-muted-foreground tracking-wide">GASTOS DEL MES</p>
            <p className="text-2xl sm:text-3xl font-bold mt-2 tabular-nums text-red-600">− {formatCurrency(totales.gastosDelMes)}</p>
            <p className="text-xs text-muted-foreground mt-1">Débitos del período</p>
          </CardContent>
        </Card>
      </div>

      {/* Acciones rápidas */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => navigate(addTransactionRoute)}>
          <Plus className="h-4 w-4 mr-1" /> {addTransactionLabel}
        </Button>
        {isSimpleMode && (
          <>
            <Button size="sm" variant="outline" onClick={() => navigate("/transacciones?action=income")}>
              <TrendingUp className="h-4 w-4 mr-1 text-emerald-600" /> Agregar Ingreso
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate("/transacciones?action=expense")}>
              <TrendingDown className="h-4 w-4 mr-1 text-red-600" /> Agregar Gasto
            </Button>
          </>
        )}
        <div className="flex-1" />
        <Button size="sm" variant="ghost" onClick={() => navigate("/recomendaciones")}>
          <Sparkles className="h-4 w-4 mr-1" /> Recomendaciones
        </Button>
      </div>

      {/* Tabla jerárquica estilo Personal Finances: Precio x Cantidad = Suma */}
      <Card className="shadow-soft overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <h2 className="text-base font-semibold">Transacciones recientes</h2>
          <div className="flex-1" />
          <Button size="sm" variant="outline" onClick={() => navigate("/transacciones")}>
            <Receipt className="h-4 w-4 mr-1" /> Ver todo
          </Button>
        </div>

        {transaccionesRecientes.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            <Wallet className="h-10 w-10 mx-auto mb-2 opacity-40" />
            Sin movimientos todavía. Registrá tu primer ingreso o gasto.
            <div className="mt-3">
              <Button size="sm" onClick={() => navigate(addTransactionRoute)}>
                <Plus className="h-4 w-4 mr-1" /> {addTransactionLabel}
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b bg-muted/40">
                  <th className="px-4 py-2.5 w-8"></th>
                  <th className="px-4 py-2.5 font-semibold">Descripción</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Precio</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Cant.</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Suma</th>
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
                      <td className="px-4 py-2 text-right font-semibold text-emerald-600 tabular-nums">
                        + {formatCurrency(ingresos.reduce((a, t) => a + t.amount, 0))}
                      </td>
                    </tr>
                    {ingresos.map((t) => (
                      <tr key={t.id} className="border-b hover:bg-muted/30">
                        <td className="px-4 py-2"></td>
                        <td className="px-4 py-2 pl-8">{t.description}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(t.amount)}</td>
                        <td className="px-4 py-2 text-right tabular-nums">1</td>
                        <td className="px-4 py-2 text-right font-semibold tabular-nums text-emerald-600">{formatCurrency(t.amount)}</td>
                      </tr>
                    ))}
                  </>
                )}
                {gastos.length > 0 && (
                  <>
                    <tr className="border-b bg-red-50/40">
                      <td className="px-4 py-2 text-muted-foreground">▾</td>
                      <td className="px-4 py-2 font-bold">Gastos</td>
                      <td className="px-4 py-2"></td>
                      <td className="px-4 py-2"></td>
                      <td className="px-4 py-2 text-right font-semibold text-red-600 tabular-nums">
                        − {formatCurrency(Math.abs(gastos.reduce((a, t) => a + t.amount, 0)))}
                      </td>
                    </tr>
                    {gastos.map((t) => (
                      <tr key={t.id} className="border-b hover:bg-muted/30">
                        <td className="px-4 py-2"></td>
                        <td className="px-4 py-2 pl-8">{t.description}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(Math.abs(t.amount))}</td>
                        <td className="px-4 py-2 text-right tabular-nums">1</td>
                        <td className="px-4 py-2 text-right font-semibold tabular-nums text-red-600">{formatCurrency(Math.abs(t.amount))}</td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}