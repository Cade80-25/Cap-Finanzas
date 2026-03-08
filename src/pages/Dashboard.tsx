import { useState } from "react";
import { Wallet, TrendingUp, TrendingDown, PiggyBank, LayoutDashboard, Sparkles, Navigation } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAccountingData } from "@/hooks/useAccountingData";
import { useSimpleAccountingData } from "@/hooks/useSimpleAccountingData";
import { useModeFeatures } from "@/hooks/useModeFeatures";
import { ContextualHelp, EmptyStateHelp } from "@/components/ContextualHelp";
import { useNumberFormat } from "@/hooks/useNumberFormat";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";
import { WeeklySummaryCard } from "@/components/WeeklySummaryCard";
import { InteractiveAppTour } from "@/components/InteractiveAppTour";

export default function Dashboard() {
  const [showPresentation, setShowPresentation] = useState(false);
  const navigate = useNavigate();
  const { isSimpleMode, isFeatureAvailable } = useModeFeatures();
  const { formatCurrency } = useNumberFormat();
  
  const traditionalData = useAccountingData();
  const simpleData = useSimpleAccountingData();

  const totales = isSimpleMode ? simpleData.totals : traditionalData.totales;
  const transaccionesRecientes = isSimpleMode ? simpleData.recentTransactions : traditionalData.transaccionesRecientes;

  const hasFinancialData = totales.ingresosDelMes > 0 || totales.gastosDelMes > 0;
  const hasTransactions = transaccionesRecientes.length > 0;

  const addTransactionRoute = isSimpleMode ? "/transacciones" : "/libro-diario";
  const addTransactionLabel = isSimpleMode ? "Agregar Movimiento" : "Ir al Libro Diario";

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 animate-in fade-in duration-500">
      <div data-tutorial="dashboard-title" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">Panel Principal</h1>
          <p className="text-muted-foreground text-sm">
            {isSimpleMode 
              ? "Resumen de tus ingresos y gastos" 
              : "Resumen general de tus finanzas"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowPresentation(true)} className="self-start">
          <Info className="h-4 w-4 mr-1" />
          ¿Cómo funciona?
        </Button>
      </div>

      <WelcomePresentation open={showPresentation} onOpenChange={setShowPresentation} />

      <WeeklySummaryCard />

      <OnboardingChecklist />

      {!isSimpleMode && hasTransactions && !hasFinancialData && (
        <ContextualHelp
          id="dashboard-no-financial-data"
          title="¿Por qué los totales muestran $0?"
          variant="warning"
        >
          <p>
            Tienes transacciones registradas, pero los totales de <strong>Ingresos</strong> y <strong>Gastos</strong> solo 
            cuentan cuentas de tipo "ingreso" o "gasto".
          </p>
          <p className="mt-2">
            Si usaste cuentas como <strong>"Banco"</strong> o <strong>"Caja"</strong> (tipo activo), esas transacciones 
            aparecen en el Balance pero no aquí.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            <strong>Solución:</strong> Para registrar un ingreso, usa la cuenta "Ingresos" con valor en Haber. 
            Para gastos, usa "Gastos Operativos" con valor en Debe.
          </p>
        </ContextualHelp>
      )}

      {!hasTransactions && (
        <EmptyStateHelp
          title={isSimpleMode ? "Sin movimientos registrados" : "Sin transacciones registradas"}
          description={isSimpleMode 
            ? "El Panel Principal muestra un resumen de tus ingresos y gastos." 
            : "El Panel Principal muestra un resumen de tus finanzas basado en las transacciones del Libro Diario."}
          icon={<LayoutDashboard className="h-16 w-16" />}
          tips={isSimpleMode ? [
            "Ve a Transacciones para registrar tu primer movimiento",
            "Registra tus ingresos (salario, ventas, etc.)",
            "Registra tus gastos (compras, servicios, etc.)",
            "Los totales aparecerán automáticamente aquí",
          ] : [
            "Ve al Libro Diario para registrar tu primera transacción",
            "Usa 'Ingresos' (Haber) para ventas, salarios, etc.",
            "Usa 'Gastos Operativos' (Debe) para pagos y compras",
            "Los datos aparecerán automáticamente aquí",
          ]}
          actionLabel={addTransactionLabel}
          onAction={() => navigate(addTransactionRoute)}
        />
      )}

      <div data-tutorial="dashboard-stats" className="grid gap-4 md:grid-cols-2">
        <StatCard
          title="Balance Total"
          value={formatCurrency(totales.balance)}
          icon={Wallet}
          variant="default"
        />
        <StatCard
          title="Ahorros"
          value={formatCurrency(totales.ahorros)}
          icon={PiggyBank}
          variant="success"
        />
      </div>

      {/* Quick actions for simple mode */}
      {isSimpleMode && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card 
            className="cursor-pointer hover:border-success/50 transition-colors group shadow-soft"
            onClick={() => navigate("/transacciones?action=income")}
          >
            <CardContent className="flex items-center gap-3 p-5">
              <div className="h-11 w-11 rounded-full bg-success/10 flex items-center justify-center group-hover:bg-success/20 transition-colors">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="font-semibold text-sm">Agregar Ingreso</p>
                <p className="text-xs text-muted-foreground">Salario, ventas...</p>
              </div>
            </CardContent>
          </Card>
          <Card 
            className="cursor-pointer hover:border-destructive/50 transition-colors group shadow-soft"
            onClick={() => navigate("/transacciones?action=expense")}
          >
            <CardContent className="flex items-center gap-3 p-5">
              <div className="h-11 w-11 rounded-full bg-destructive/10 flex items-center justify-center group-hover:bg-destructive/20 transition-colors">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="font-semibold text-sm">Agregar Gasto</p>
                <p className="text-xs text-muted-foreground">Compras, servicios...</p>
              </div>
            </CardContent>
          </Card>
          <Card 
            className="cursor-pointer hover:border-primary/50 transition-colors group shadow-soft"
            onClick={() => navigate("/recomendaciones")}
          >
            <CardContent className="flex items-center gap-3 p-5">
              <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">Recomendaciones</p>
                <p className="text-xs text-muted-foreground">Consejos con IA</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
