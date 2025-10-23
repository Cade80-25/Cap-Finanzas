import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

const estadoData = {
  ingresos: [
    { name: "Salario", value: 5000 },
    { name: "Ventas", value: 200 },
    { name: "Intereses Bancarios", value: 50 },
  ],
  gastos: [
    { name: "Alimentación", value: 350 },
    { name: "Servicios", value: 120 },
    { name: "Transporte", value: 200 },
    { name: "Otros", value: 150 },
  ],
};

const totalIngresos = estadoData.ingresos.reduce((sum, item) => sum + item.value, 0);
const totalGastos = estadoData.gastos.reduce((sum, item) => sum + item.value, 0);
const resultadoNeto = totalIngresos - totalGastos;

// Datos para gráficos
const comparacionData = [
  { name: "Ingresos", value: totalIngresos, color: "hsl(var(--success))" },
  { name: "Gastos", value: totalGastos, color: "hsl(var(--destructive))" },
];

const tendenciaMensual = [
  { mes: "Ene", ingresos: 4800, gastos: 3200 },
  { mes: "Feb", ingresos: 5100, gastos: 3400 },
  { mes: "Mar", ingresos: 4900, gastos: 3100 },
  { mes: "Abr", ingresos: 5300, gastos: 3600 },
  { mes: "May", ingresos: 5000, gastos: 3300 },
  { mes: "Jun", ingresos: 5250, gastos: 2890 },
];

const distribucionIngresos = estadoData.ingresos.map(item => ({
  ...item,
  percentage: ((item.value / totalIngresos) * 100).toFixed(1),
}));

const distribucionGastos = estadoData.gastos.map(item => ({
  ...item,
  percentage: ((item.value / totalGastos) * 100).toFixed(1),
}));

const COLORS = ["hsl(var(--primary))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))", "hsl(var(--accent))"];

export default function EstadoResultados() {
  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold mb-2">Estado de Resultados</h1>
        <p className="text-muted-foreground">
          Análisis completo de ingresos, gastos y rentabilidad
        </p>
      </div>

      <Card className="shadow-medium border-primary bg-gradient-primary/10">
        <CardHeader>
          <CardTitle className="text-primary">Resultado Neto del Período</CardTitle>
          <CardDescription>
            Diferencia entre ingresos y gastos (Ingresos - Gastos)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center p-6">
            <p className={`text-5xl font-bold mb-2 ${resultadoNeto >= 0 ? 'text-success' : 'text-destructive'}`}>
              {resultadoNeto >= 0 ? '+' : ''}${resultadoNeto.toFixed(2)}
            </p>
            <p className="text-muted-foreground">
              {resultadoNeto >= 0 ? 'Utilidad (ganancia)' : 'Pérdida'}
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="tablas" className="space-y-4">
        <TabsList className="bg-muted">
          <TabsTrigger value="tablas">Tablas</TabsTrigger>
          <TabsTrigger value="graficos">Gráficos</TabsTrigger>
          <TabsTrigger value="tendencias">Tendencias</TabsTrigger>
          <TabsTrigger value="estadisticas">Estadísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="tablas" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-soft border-success/20">
              <CardHeader>
                <CardTitle className="text-success">Ingresos</CardTitle>
                <CardDescription>Dinero que entra</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Concepto</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {estadoData.ingresos.map((item) => (
                      <TableRow key={item.name} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-right">${item.value.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-success/10 font-bold">
                      <TableCell>Total Ingresos</TableCell>
                      <TableCell className="text-right text-success">${totalIngresos.toFixed(2)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="shadow-soft border-destructive/20">
              <CardHeader>
                <CardTitle className="text-destructive">Gastos</CardTitle>
                <CardDescription>Dinero que sale</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Concepto</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {estadoData.gastos.map((item) => (
                      <TableRow key={item.name} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-right">${item.value.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-destructive/10 font-bold">
                      <TableCell>Total Gastos</TableCell>
                      <TableCell className="text-right text-destructive">${totalGastos.toFixed(2)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="graficos" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Comparación Ingresos vs Gastos</CardTitle>
                <CardDescription>Vista general del período</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={comparacionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${value}`} />
                    <Legend />
                    <Bar dataKey="value" fill="hsl(var(--primary))">
                      {comparacionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Proporción del Balance</CardTitle>
                <CardDescription>Distribución porcentual</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={comparacionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: $${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {comparacionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-soft border-success/20">
              <CardHeader>
                <CardTitle className="text-success">Composición de Ingresos</CardTitle>
                <CardDescription>Detalle por fuente</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={distribucionIngresos}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {distribucionIngresos.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-soft border-destructive/20">
              <CardHeader>
                <CardTitle className="text-destructive">Composición de Gastos</CardTitle>
                <CardDescription>Detalle por categoría</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={distribucionGastos}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {distribucionGastos.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tendencias" className="space-y-6">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Evolución Mensual</CardTitle>
              <CardDescription>Tendencia de ingresos y gastos en los últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={tendenciaMensual}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value}`} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="ingresos"
                    stroke="hsl(var(--success))"
                    strokeWidth={3}
                    name="Ingresos"
                  />
                  <Line
                    type="monotone"
                    dataKey="gastos"
                    stroke="hsl(var(--destructive))"
                    strokeWidth={3}
                    name="Gastos"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Flujo de Efectivo Acumulado</CardTitle>
              <CardDescription>Diferencia entre ingresos y gastos mensual</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={tendenciaMensual}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value}`} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="ingresos"
                    stackId="1"
                    stroke="hsl(var(--success))"
                    fill="hsl(var(--success))"
                    fillOpacity={0.6}
                    name="Ingresos"
                  />
                  <Area
                    type="monotone"
                    dataKey="gastos"
                    stackId="2"
                    stroke="hsl(var(--destructive))"
                    fill="hsl(var(--destructive))"
                    fillOpacity={0.6}
                    name="Gastos"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="estadisticas" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="shadow-soft bg-gradient-success/10 border-success/20">
              <CardHeader>
                <CardTitle className="text-success">Margen de Ganancia</CardTitle>
                <CardDescription>Porcentaje de utilidad</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-success">
                  {((resultadoNeto / totalIngresos) * 100).toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {((resultadoNeto / totalIngresos) * 100) > 30 ? "Excelente" : ((resultadoNeto / totalIngresos) * 100) > 15 ? "Bueno" : "Moderado"}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-soft bg-gradient-primary/10 border-primary/20">
              <CardHeader>
                <CardTitle className="text-primary">Tasa de Ahorro</CardTitle>
                <CardDescription>Capacidad de ahorro</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-primary">
                  {((resultadoNeto / totalIngresos) * 100).toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  De cada $100 ahorras ${((resultadoNeto / totalIngresos) * 100).toFixed(0)}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-soft bg-gradient-card border-border">
              <CardHeader>
                <CardTitle>Ratio de Gastos</CardTitle>
                <CardDescription>Eficiencia en gastos</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-destructive">
                  {((totalGastos / totalIngresos) * 100).toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Gastas {((totalGastos / totalIngresos) * 100).toFixed(0)}% de tus ingresos
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Métricas de Rentabilidad</CardTitle>
              <CardDescription>Indicadores financieros clave</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-card border border-border">
                  <div>
                    <p className="font-medium">Ingreso Promedio por Fuente</p>
                    <p className="text-sm text-muted-foreground">Promedio de ingresos</p>
                  </div>
                  <span className="text-2xl font-bold text-success">
                    ${(totalIngresos / estadoData.ingresos.length).toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-card border border-border">
                  <div>
                    <p className="font-medium">Gasto Promedio por Categoría</p>
                    <p className="text-sm text-muted-foreground">Promedio de gastos</p>
                  </div>
                  <span className="text-2xl font-bold text-destructive">
                    ${(totalGastos / estadoData.gastos.length).toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-card border border-border">
                  <div>
                    <p className="font-medium">Punto de Equilibrio</p>
                    <p className="text-sm text-muted-foreground">Gastos necesarios vs ingresos</p>
                  </div>
                  <span className="text-2xl font-bold text-primary">
                    {((totalGastos / totalIngresos) * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-card border border-border">
                  <div>
                    <p className="font-medium">Proyección Anual</p>
                    <p className="text-sm text-muted-foreground">Si continúa la tendencia</p>
                  </div>
                  <span className="text-2xl font-bold text-success">
                    ${(resultadoNeto * 12).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-soft border-success/20">
              <CardHeader>
                <CardTitle className="text-success">Análisis de Ingresos</CardTitle>
                <CardDescription>Desglose detallado</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {distribucionIngresos.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-muted-foreground">{item.percentage}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-success transition-all"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft border-destructive/20">
              <CardHeader>
                <CardTitle className="text-destructive">Análisis de Gastos</CardTitle>
                <CardDescription>Desglose detallado</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {distribucionGastos.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-muted-foreground">{item.percentage}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-destructive transition-all"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
