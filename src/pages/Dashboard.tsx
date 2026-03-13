import { Wallet, TrendingUp, TrendingDown, PiggyBank, LayoutDashboard, Sparkles, Navigation, PieChart, Target, Receipt, Globe, ArrowRight } from "lucide-react";
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

const exploreCards = [
  {
    name: "Transacciones",
    description: "Registra ingresos y gastos",
    href: "/transacciones",
    icon: Receipt,
    gradient: "from-primary/15 to-primary/5",
    iconColor: "text-primary",
    emoji: "💸",
  },
  {
    name: "Presupuesto",
    description: "Controla tus límites de gasto",
    href: "/presupuesto",
    icon: Target,
    gradient: "from-warning/15 to-warning/5",
    iconColor: "text-warning",
    emoji: "🎯",
  },
  {
    name: "Resumen",
    description: "Gráficos y estadísticas",
    href: "/resumen",
    icon: PieChart,
    gradient: "from-success/15 to-success/5",
    iconColor: "text-success",
    emoji: "📊",
  },
  {
    name: "Monedas",
    description: "Tipos de cambio en vivo",
    href: "/monedas",
    icon: Globe,
    gradient: "from-accent/15 to-accent/5",
    iconColor: "text-accent",
    emoji: "🌍",
  },
];

export default function Dashboard() {
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

  const startTour = () => {
    window.dispatchEvent(new CustomEvent("start-app-tour"));
  };

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
        <Button variant="outline" size="sm" onClick={startTour} className="self-start">
          <Navigation className="h-4 w-4 mr-1" />
          Tour guiado
        </Button>
      </div>

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

      {/* Explore section - encourages navigation to reduce bounce rate */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span>🧭</span> Explora la app
          </h2>
          <Button variant="ghost" size="sm" onClick={startTour} className="text-xs text-muted-foreground">
            Tour completo
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {exploreCards.map((card) => (
            <Card
              key={card.href}
              className="cursor-pointer group hover:shadow-medium transition-all duration-300 hover:-translate-y-0.5 border-border/60"
              onClick={() => navigate(card.href)}
            >
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <card.icon className={`h-6 w-6 ${card.iconColor}`} />
                </div>
                <div>
                  <p className="font-semibold text-sm">{card.name}</p>
                  <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{card.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
