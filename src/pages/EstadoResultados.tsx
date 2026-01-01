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

type EstadoItem = { name: string; value: number };
type TendenciaItem = { mes: string; ingresos: number; gastos: number };

export default function EstadoResultados() {
  // Datos vacíos - se llenarán con datos reales del usuario
  const estadoData: { ingresos: EstadoItem[]; gastos: EstadoItem[] } = {
    ingresos: [],
    gastos: [],
  };

  const tendenciaMensual: TendenciaItem[] = [];

  const totalIngresos = estadoData.ingresos.reduce((sum, item) => sum + item.value, 0);
  const totalGastos = estadoData.gastos.reduce((sum, item) => sum + item.value, 0);
  const resultadoNeto = totalIngresos - totalGastos;

  // Datos para gráficos
  const comparacionData = [
    { name: "Ingresos", value: totalIngresos, color: "hsl(var(--success))" },
    { name: "Gastos", value: totalGastos, color: "hsl(var(--destructive))" },
  ];

  const distribucionIngresos = estadoData.ingresos.map(item => ({
    ...item,
    percentage: totalIngresos > 0 ? ((item.value / totalIngresos) * 100).toFixed(1) : "0",
  }));

  const distribucionGastos = estadoData.gastos.map(item => ({
    ...item,
    percentage: totalGastos > 0 ? ((item.value / totalGastos) * 100).toFixed(1) : "0",
  }));

  const COLORS = ["hsl(var(--primary))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))", "hsl(var(--accent))"];

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
                {estadoData.ingresos.length > 0 ? (
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
                ) : (
                  <div className="flex items-center justify-center h-[150px] text-muted-foreground">
                    No hay ingresos registrados
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-soft border-destructive/20">
              <CardHeader>
                <CardTitle className="text-destructive">Gastos</CardTitle>
                <CardDescription>Dinero que sale</CardDescription>
              </CardHeader>
              <CardContent>
                {estadoData.gastos.length > 0 ? (
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
                ) : (
                  <div className="flex items-center justify-center h-[150px] text-muted-foreground">
                    No hay gastos registrados
                  </div>
                )}
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
                {totalIngresos > 0 || totalGastos > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={comparacionData.filter(d => d.value > 0)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => `$${value}`} />
                      <Legend />
                      <Bar dataKey="value" fill="hsl(var(--primary))">
                        {comparacionData.filter(d => d.value > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No hay datos disponibles
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Proporción del Balance</CardTitle>
                <CardDescription>Distribución porcentual</CardDescription>
              </CardHeader>
              <CardContent>
                {totalIngresos > 0 || totalGastos > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={comparacionData.filter(d => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: $${value}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {comparacionData.filter(d => d.value > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `$${value}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No hay datos disponibles
                  </div>
                )}
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
                {distribucionIngresos.length > 0 ? (
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
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No hay ingresos registrados
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-soft border-destructive/20">
              <CardHeader>
                <CardTitle className="text-destructive">Composición de Gastos</CardTitle>
                <CardDescription>Detalle por categoría</CardDescription>
              </CardHeader>
              <CardContent>
                {distribucionGastos.length > 0 ? (
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
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No hay gastos registrados
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tendencias" className="space-y-6">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Evolución Mensual</CardTitle>
              <CardDescription>Tendencia de ingresos y gastos</CardDescription>
            </CardHeader>
            <CardContent>
              {tendenciaMensual.length > 0 ? (
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
              ) : (
                <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                  No hay datos de tendencia disponibles
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Flujo de Efectivo Acumulado</CardTitle>
              <CardDescription>Diferencia entre ingresos y gastos mensual</CardDescription>
            </CardHeader>
            <CardContent>
              {tendenciaMensual.length > 0 ? (
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
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No hay datos de tendencia disponibles
                </div>
              )}
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
                  {totalIngresos > 0 ? ((resultadoNeto / totalIngresos) * 100).toFixed(1) : "0.0"}%
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {totalIngresos === 0 ? "Sin datos" :
                   ((resultadoNeto / totalIngresos) * 100) > 30 ? "Excelente" : 
                   ((resultadoNeto / totalIngresos) * 100) > 15 ? "Bueno" : "Moderado"}
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
                  {totalIngresos > 0 ? ((resultadoNeto / totalIngresos) * 100).toFixed(1) : "0.0"}%
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {totalIngresos > 0 ? `De cada $100 ahorras $${((resultadoNeto / totalIngresos) * 100).toFixed(0)}` : "Sin datos"}
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
                  {totalIngresos > 0 ? ((totalGastos / totalIngresos) * 100).toFixed(1) : "0.0"}%
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {totalIngresos > 0 ? `Gastas ${((totalGastos / totalIngresos) * 100).toFixed(0)}% de tus ingresos` : "Sin datos"}
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
                    ${estadoData.ingresos.length > 0 ? (totalIngresos / estadoData.ingresos.length).toFixed(2) : "0.00"}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-card border border-border">
                  <div>
                    <p className="font-medium">Gasto Promedio por Categoría</p>
                    <p className="text-sm text-muted-foreground">Promedio de gastos</p>
                  </div>
                  <span className="text-2xl font-bold text-destructive">
                    ${estadoData.gastos.length > 0 ? (totalGastos / estadoData.gastos.length).toFixed(2) : "0.00"}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-card border border-border">
                  <div>
                    <p className="font-medium">Punto de Equilibrio</p>
                    <p className="text-sm text-muted-foreground">Gastos necesarios vs ingresos</p>
                  </div>
                  <span className={`text-2xl font-bold ${resultadoNeto >= 0 ? "text-success" : "text-destructive"}`}>
                    {resultadoNeto >= 0 ? "Superado ✓" : "No alcanzado"}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-card border border-border">
                  <div>
                    <p className="font-medium">Proyección Anual</p>
                    <p className="text-sm text-muted-foreground">Estimación basada en datos actuales</p>
                  </div>
                  <span className={`text-2xl font-bold ${resultadoNeto >= 0 ? "text-success" : "text-destructive"}`}>
                    ${(resultadoNeto * 12).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
