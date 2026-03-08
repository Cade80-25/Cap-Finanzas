import { DollarSign, TrendingUp, TrendingDown, Target, PieChart as PieChartIcon, Wallet, CalendarDays, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useAccountingData } from "@/hooks/useAccountingData";
import { useSimpleAccountingData } from "@/hooks/useSimpleAccountingData";
import { useBudgets } from "@/hooks/useBudgets";
import { useNavigate } from "react-router-dom";
import { ContextualHelp, EmptyStateHelp } from "@/components/ContextualHelp";

export default function Resumen() {
  const accountingData = useAccountingData();
  const simpleData = useSimpleAccountingData();
  const { budgets } = useBudgets();
  const navigate = useNavigate();

  const isSimple = simpleData.isSimpleMode;

  const totalIngresos = isSimple ? simpleData.totals.totalIngresos : accountingData.estadoResultados.totalIngresos;
  const totalGastos = isSimple ? simpleData.totals.totalGastos : accountingData.estadoResultados.totalGastos;
  const resultadoNeto = totalIngresos - totalGastos;
  const tasaAhorro = totalIngresos > 0 ? ((resultadoNeto / totalIngresos) * 100).toFixed(1) : "0.0";
  const resumenMensual = isSimple ? simpleData.monthlySummary : accountingData.resumenMensual;
  const datosCategorias = isSimple ? simpleData.categoryChartData : accountingData.datosCategorias;
  const hasData = resumenMensual.length > 0 || datosCategorias.length > 0;

  // Datos del mes actual
  const ingresosDelMes = isSimple ? simpleData.totals.ingresosDelMes : 0;
  const gastosDelMes = isSimple ? simpleData.totals.gastosDelMes : 0;

  // Presupuestos con gastos reales
  const presupuestosConGastos = budgets.map((item) => {
    const gastoReal = accountingData.estadoResultados.gastos.find((g) => {
      const categoria = Object.entries(accountingData.ACCOUNT_CATEGORIES).find(
        ([key, val]) => val.label === g.name
      );
      return categoria?.[0] === item.cuentaAsociada;
    });
    return { ...item, gastado: gastoReal?.value || 0 };
  });
  const totalPresupuesto = presupuestosConGastos.reduce((acc, i) => acc + i.presupuesto, 0);
  const totalGastadoPresupuesto = presupuestosConGastos.reduce((acc, i) => acc + i.gastado, 0);

  // Transacciones recientes
  const recentTx = isSimple
    ? simpleData.recentTransactions.slice(0, 5)
    : [];

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div data-tutorial="resumen-title">
        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Resumen Financiero
        </h1>
        <p className="text-muted-foreground mt-2">
          {isSimple ? "Visualización completa de tu situación financiera" : "Visualización completa de tu situación financiera (desde Libro Diario)"}
        </p>
      </div>

      {!hasData && (
        <EmptyStateHelp
          title="No hay datos para mostrar"
          description={isSimple 
            ? "El Resumen Financiero visualiza tus ingresos y gastos registrados en Movimientos."
            : "El Resumen Financiero visualiza tus ingresos y gastos registrados en el Libro Diario."
          }
          icon={<PieChartIcon className="h-16 w-16" />}
          tips={isSimple ? [
            "Registra movimientos en la sección de Movimientos para ver gráficos aquí",
            "Agrega tus ingresos como salario, ventas, freelance, etc.",
            "Registra tus gastos como alimentación, transporte, servicios, etc.",
            "Los gráficos mostrarán la evolución mensual de tus finanzas",
          ] : [
            "Registra transacciones en el Libro Diario para ver gráficos aquí",
            "Usa la cuenta 'Ingresos' para ventas, salarios, etc.",
            "Usa 'Gastos Operativos' para pagos de servicios, compras, etc.",
            "Los gráficos mostrarán la evolución mensual de tus finanzas",
          ]}
          actionLabel={isSimple ? "Ir a Movimientos" : "Ir al Libro Diario"}
          onAction={() => navigate(isSimple ? "/transacciones" : "/libro-diario")}
        />
      )}

      {hasData && (
        <ContextualHelp
          id="resumen-intro"
          title="¿Qué muestra este resumen?"
          variant="info"
          defaultCollapsed
        >
          <p>
            Este panel muestra gráficos de tus <strong className="text-success">ingresos</strong> y{" "}
            <strong className="text-destructive">gastos</strong> a lo largo del tiempo.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Solo se incluyen transacciones con cuentas de tipo "Ingresos" o "Gastos". 
            Movimientos de Banco, Caja u otras cuentas de balance no aparecen aquí.
          </p>
        </ContextualHelp>
      )}

      <div data-tutorial="resumen-stats" className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Ingresos</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">${totalIngresos.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Período actual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Gastos</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">${totalGastos.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Período actual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${resultadoNeto >= 0 ? "text-success" : "text-destructive"}`}>
              ${resultadoNeto.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Ingresos - Gastos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Ahorro</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{tasaAhorro}%</div>
            <p className="text-xs text-muted-foreground mt-1">De tus ingresos</p>
          </CardContent>
        </Card>
      </div>

      <Tabs data-tutorial="resumen-grafico" defaultValue="tendencias" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tendencias">Tendencias</TabsTrigger>
          <TabsTrigger value="categorias">Por Categorías</TabsTrigger>
          <TabsTrigger value="comparativa">Comparativa</TabsTrigger>
        </TabsList>

        <TabsContent value="tendencias" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Evolución Mensual</CardTitle>
              <CardDescription>
                Comparación de ingresos y gastos por mes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {resumenMensual.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={resumenMensual}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="ingresos"
                      stroke="hsl(var(--success))"
                      strokeWidth={2}
                      name="Ingresos"
                    />
                    <Line
                      type="monotone"
                      dataKey="gastos"
                      stroke="hsl(var(--destructive))"
                      strokeWidth={2}
                      name="Gastos"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                  No hay datos disponibles. Agrega transacciones en el Libro Diario.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categorias" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribución de Gastos</CardTitle>
              <CardDescription>
                Gastos agrupados por categoría
              </CardDescription>
            </CardHeader>
            <CardContent>
              {datosCategorias.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <RePieChart>
                    <Pie
                      data={datosCategorias}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {datosCategorias.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                    <Legend />
                  </RePieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                  No hay datos de gastos disponibles
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparativa" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comparativa Mensual</CardTitle>
              <CardDescription>
                Comparación directa de ingresos vs gastos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {resumenMensual.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={resumenMensual}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                    <Legend />
                    <Bar dataKey="ingresos" fill="hsl(var(--success))" name="Ingresos" />
                    <Bar dataKey="gastos" fill="hsl(var(--destructive))" name="Gastos" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                  No hay datos disponibles
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sección de Presupuesto */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Presupuesto
            </CardTitle>
            <CardDescription>
              {budgets.length > 0
                ? `${budgets.length} categoría(s) · Gastado $${totalGastadoPresupuesto.toFixed(2)} de $${totalPresupuesto.toFixed(2)}`
                : "Configura tus presupuestos para controlar tus gastos"}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/presupuesto")}>
            {budgets.length > 0 ? "Ver todo" : "Configurar"}
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {presupuestosConGastos.length > 0 ? (
            <div className="space-y-4">
              {presupuestosConGastos.slice(0, 4).map((item) => {
                const porcentaje = item.presupuesto > 0 ? (item.gastado / item.presupuesto) * 100 : 0;
                const excedido = porcentaje > 100;
                return (
                  <div key={item.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.categoria}</span>
                      <div className="flex items-center gap-2">
                        <span className={excedido ? "text-destructive font-semibold" : "text-muted-foreground"}>
                          ${item.gastado.toFixed(2)} / ${item.presupuesto.toFixed(2)}
                        </span>
                        {excedido && <Badge variant="destructive" className="text-xs">Excedido</Badge>}
                      </div>
                    </div>
                    <Progress value={Math.min(porcentaje, 100)} className={excedido ? "[&>div]:bg-destructive" : ""} />
                  </div>
                );
              })}
              {presupuestosConGastos.length > 4 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{presupuestosConGastos.length - 4} más...
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Target className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No tienes presupuestos configurados</p>
              <Button variant="link" size="sm" onClick={() => navigate("/presupuesto")}>
                Crear mi primer presupuesto
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumen del Mes + Transacciones recientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Resumen del Mes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarDays className="h-5 w-5 text-primary" />
              Este Mes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Ingresos del mes</span>
              <span className="font-semibold text-success">${ingresosDelMes.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Gastos del mes</span>
              <span className="font-semibold text-destructive">${gastosDelMes.toFixed(2)}</span>
            </div>
            <div className="border-t pt-3 flex justify-between items-center">
              <span className="text-sm font-medium">Balance del mes</span>
              <span className={`font-bold text-lg ${ingresosDelMes - gastosDelMes >= 0 ? "text-success" : "text-destructive"}`}>
                ${(ingresosDelMes - gastosDelMes).toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Últimos movimientos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wallet className="h-5 w-5 text-primary" />
              Últimos Movimientos
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => navigate(isSimple ? "/transacciones" : "/libro-diario")}>
              Ver todos <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentTx.length > 0 ? (
              <div className="space-y-3">
                {recentTx.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between text-sm">
                    <div className="flex flex-col">
                      <span className="font-medium truncate max-w-[200px]">{tx.description}</span>
                      <span className="text-xs text-muted-foreground">{tx.date}</span>
                    </div>
                    <span className={tx.type === "income" ? "text-success font-semibold" : "text-destructive font-semibold"}>
                      {tx.type === "income" ? "+" : ""}${Math.abs(tx.amount).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Wallet className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Sin movimientos recientes</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
