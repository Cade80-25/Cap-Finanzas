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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

      <Tabs defaultValue="tendencias" className="space-y-4">
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
    </div>
  );
}
