import { DollarSign, TrendingUp, TrendingDown, Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export default function Resumen() {
  const { estadoResultados, resumenMensual, datosCategorias } = useAccountingData();

  const { totalIngresos, totalGastos, resultadoNeto } = estadoResultados;
  const tasaAhorro = totalIngresos > 0 ? ((resultadoNeto / totalIngresos) * 100).toFixed(1) : "0.0";

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div data-tutorial="resumen-title">
        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Resumen Financiero
        </h1>
        <p className="text-muted-foreground mt-2">
          Visualización completa de tu situación financiera (desde Libro Diario)
        </p>
      </div>

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
