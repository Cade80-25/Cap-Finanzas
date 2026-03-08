import { Wallet, TrendingUp, TrendingDown, PiggyBank, ArrowUpRight, AlertTriangle, LayoutDashboard, Plus, Sparkles } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { useAccountingData } from "@/hooks/useAccountingData";
import { useSimpleAccountingData } from "@/hooks/useSimpleAccountingData";
import { useBudgets } from "@/hooks/useBudgets";
import { useModeFeatures } from "@/hooks/useModeFeatures";
import { ContextualHelp, EmptyStateHelp } from "@/components/ContextualHelp";
import { useNumberFormat } from "@/hooks/useNumberFormat";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";

export default function Dashboard() {
  const navigate = useNavigate();
  const { isSimpleMode, isFeatureAvailable, labels } = useModeFeatures();
  const { formatCurrency } = useNumberFormat();
  
  // Use traditional accounting data
  const traditionalData = useAccountingData();
  
  // Use simplified accounting data
  const simpleData = useSimpleAccountingData();
  
  const { budgets: presupuestoData } = useBudgets();

  // Choose data based on mode
  const totales = isSimpleMode ? simpleData.totals : traditionalData.totales;
  const resumenMensual = isSimpleMode ? simpleData.monthlySummary : traditionalData.resumenMensual;
  const datosCategorias = isSimpleMode ? simpleData.categoryChartData : traditionalData.datosCategorias;
  const transaccionesRecientes = isSimpleMode ? simpleData.recentTransactions : traditionalData.transaccionesRecientes;
  const estadoResultados = traditionalData.estadoResultados;
  const ACCOUNT_CATEGORIES = traditionalData.ACCOUNT_CATEGORIES;

  // Calcular alertas de presupuesto (desde Presupuesto + Libro Diario)
  const budgetAlerts = presupuestoData
    .filter((p) => p.presupuesto > 0)
    .map((p) => {
      const cuentaLabel = p.cuentaAsociada
        ? ACCOUNT_CATEGORIES[p.cuentaAsociada]?.label
        : undefined;

      // In simple mode, use simple category totals
      let spent = 0;
      if (isSimpleMode) {
        const simpleCat = simpleData.categories.find((c) => 
          c.id === p.cuentaAsociada || 
          c.nombre.toLowerCase().includes(p.categoria.toLowerCase())
        );
        spent = simpleCat?.gastos || 0;
      } else {
        const gastoRelacionado = cuentaLabel
          ? estadoResultados.gastos.find((g) => g.name === cuentaLabel)
          : estadoResultados.gastos.find((g) => {
              const a = g.name.toLowerCase();
              const b = p.categoria.toLowerCase();
              return a.includes(b) || b.includes(a);
            });
        spent = gastoRelacionado?.value || 0;
      }

      const percentage = p.presupuesto > 0 ? Math.round((spent / p.presupuesto) * 100) : 0;

      return {
        category: p.categoria,
        spent,
        budget: p.presupuesto,
        percentage,
      };
    })
    .filter((a) => a.percentage >= 70)
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 3);

  const hasFinancialData = totales.ingresosDelMes > 0 || totales.gastosDelMes > 0 || resumenMensual.length > 0;
  const hasTransactions = transaccionesRecientes.length > 0;

  // Determine where to navigate for adding transactions
  const addTransactionRoute = isSimpleMode ? "/transacciones" : "/libro-diario";
  const addTransactionLabel = isSimpleMode ? "Agregar Movimiento" : "Ir al Libro Diario";

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div data-tutorial="dashboard-title">
        <h1 className="text-3xl font-bold mb-2">Panel Principal</h1>
        <p className="text-muted-foreground">
          {isSimpleMode 
            ? "Resumen de tus ingresos y gastos" 
            : "Resumen general de tus finanzas (datos desde Libro Diario)"}
        </p>
      </div>

      {/* Onboarding checklist for new users */}
      <OnboardingChecklist />

      {/* Help for traditional mode when data isn't showing correctly */}
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

      <div data-tutorial="dashboard-stats" className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Balance Total"
          value={formatCurrency(totales.balance)}
          icon={Wallet}
          variant="default"
        />
        <StatCard
          title="Ingresos del Mes"
          value={formatCurrency(totales.ingresosDelMes)}
          icon={TrendingUp}
          variant="success"
        />
        <StatCard
          title="Gastos del Mes"
          value={formatCurrency(totales.gastosDelMes)}
          icon={TrendingDown}
          variant="destructive"
        />
        <StatCard
          title="Ahorros"
          value={formatCurrency(totales.ahorros)}
          icon={PiggyBank}
          variant="success"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card data-tutorial="dashboard-chart" className="shadow-soft lg:col-span-2">
          <CardHeader>
            <CardTitle>Ingresos vs Gastos</CardTitle>
            <CardDescription>Comparativa de los últimos meses</CardDescription>
          </CardHeader>
          <CardContent>
            {resumenMensual.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={resumenMensual}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="mes" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                    formatter={(value) => `$${Number(value).toFixed(2)}`}
                  />
                  <Legend />
                  <Bar dataKey="ingresos" fill="hsl(var(--success))" name="Ingresos" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="gastos" fill="hsl(var(--destructive))" name="Gastos" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[250px] text-muted-foreground">
                <p>No hay datos disponibles</p>
                <Button variant="link" onClick={() => navigate(addTransactionRoute)}>
                  {addTransactionLabel}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Gastos por Categoría</CardTitle>
            <CardDescription>Distribución del período</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            {datosCategorias.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={datosCategorias}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {datosCategorias.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                    formatter={(value) => `$${Number(value).toFixed(2)}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                No hay datos disponibles
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card data-tutorial="dashboard-transactions" className="shadow-soft">
          <CardHeader>
            <CardTitle>{isSimpleMode ? "Movimientos Recientes" : "Transacciones Recientes"}</CardTitle>
            <CardDescription>
              {isSimpleMode ? "Últimos ingresos y gastos" : "Últimas transacciones del Libro Diario"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transaccionesRecientes.length > 0 ? (
              <div className="space-y-4">
                {transaccionesRecientes.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gradient-card border border-border hover-scale"
                  >
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">{transaction.date}</p>
                    </div>
                    <span
                      className={`font-bold ${
                        transaction.type === "income" ? "text-success" : "text-destructive"
                      }`}
                    >
                      {transaction.amount > 0 ? "+" : ""}${Math.abs(transaction.amount).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[100px] text-muted-foreground">
                {isSimpleMode ? "No hay movimientos registrados" : "No hay transacciones registradas"}
              </div>
            )}
            <Button variant="outline" className="w-full mt-4" onClick={() => navigate(addTransactionRoute)}>
              <ArrowUpRight className="h-4 w-4 mr-2" />
              {addTransactionLabel}
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Alertas de Presupuesto
            </CardTitle>
            <CardDescription>
              Categorías cerca o sobre el límite
            </CardDescription>
          </CardHeader>
          <CardContent>
            {budgetAlerts.length > 0 ? (
              <div className="space-y-4">
                {budgetAlerts.map((alert, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{alert.category}</span>
                      <Badge variant={alert.percentage > 100 ? "destructive" : alert.percentage > 80 ? "secondary" : "default"}>
                        {alert.percentage}%
                      </Badge>
                    </div>
                    <Progress value={Math.min(alert.percentage, 100)} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      ${alert.spent.toFixed(2)} de ${alert.budget.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[100px] text-muted-foreground">
                {presupuestoData.length === 0 ? "Configura tu presupuesto" : "Sin alertas de presupuesto"}
              </div>
            )}
            <Button variant="outline" className="w-full mt-4" onClick={() => navigate("/presupuesto")}>
              Gestionar Presupuesto
            </Button>
          </CardContent>
        </Card>
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

      {/* Original action card */}
      {isSimpleMode ? (
        <Card className="shadow-soft bg-gradient-primary">
          <CardHeader>
            <CardTitle className="text-primary-foreground">Registrar Movimiento</CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Agrega rápidamente un ingreso o gasto
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => navigate("/transacciones")}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Movimiento
            </Button>
            <Button variant="secondary" className="flex-1" onClick={() => navigate("/recomendaciones")}>
              Obtener Recomendaciones
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-soft bg-gradient-primary">
          <CardHeader>
            <CardTitle className="text-primary-foreground">¿Necesitas Ayuda?</CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Aprende sobre conceptos contables básicos y obtén recomendaciones personalizadas
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-3">
            {isFeatureAvailable("encyclopedia") && (
              <Button variant="secondary" className="flex-1" onClick={() => navigate("/enciclopedia")}>
                Ir a Enciclopedia
              </Button>
            )}
            <Button variant="secondary" className="flex-1" onClick={() => navigate("/recomendaciones")}>
              Obtener Recomendaciones
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
