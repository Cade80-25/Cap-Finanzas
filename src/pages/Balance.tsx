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
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useAccountingData } from "@/hooks/useAccountingData";

export default function Balance() {
  const { balanceGeneral, estadoResultados } = useAccountingData();

  const { activos, pasivos, totalActivos, totalPasivos, patrimonio } = balanceGeneral;

  const pieChartData = [
    { name: "Activos", value: totalActivos, color: "hsl(var(--success))" },
    { name: "Pasivos", value: totalPasivos, color: "hsl(var(--destructive))" },
  ];

  const barChartData = [
    ...activos.map(item => ({ ...item, type: "Activo" })),
    ...pasivos.map(item => ({ ...item, type: "Pasivo" })),
  ];

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold mb-2">Balance General</h1>
        <p className="text-muted-foreground">
          Estado de la situación financiera (calculado desde Libro Diario)
        </p>
      </div>

      <Card className="shadow-medium border-primary">
        <CardHeader>
          <CardTitle className="text-primary">Patrimonio Neto</CardTitle>
          <CardDescription>
            Diferencia entre activos y pasivos + resultado del ejercicio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center p-6">
            <p className="text-5xl font-bold text-primary mb-2">
              ${patrimonio.toFixed(2)}
            </p>
            <p className="text-muted-foreground">
              Activos (${totalActivos.toFixed(2)}) - Pasivos (${totalPasivos.toFixed(2)}) + Resultado (${estadoResultados.resultadoNeto.toFixed(2)})
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="tablas" className="space-y-4">
        <TabsList className="bg-muted">
          <TabsTrigger value="tablas">Tablas</TabsTrigger>
          <TabsTrigger value="graficos">Gráficos</TabsTrigger>
          <TabsTrigger value="estadisticas">Estadísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="tablas" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-soft border-success/20">
              <CardHeader>
                <CardTitle className="text-success">Activos</CardTitle>
                <CardDescription>Recursos y bienes que posees</CardDescription>
              </CardHeader>
              <CardContent>
                {activos.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cuenta</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activos.map((item) => (
                        <TableRow key={item.name} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="text-right">${item.value.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-success/10 font-bold">
                        <TableCell>Total Activos</TableCell>
                        <TableCell className="text-right text-success">${totalActivos.toFixed(2)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex items-center justify-center h-[150px] text-muted-foreground">
                    No hay activos registrados
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-soft border-destructive/20">
              <CardHeader>
                <CardTitle className="text-destructive">Pasivos</CardTitle>
                <CardDescription>Deudas y obligaciones</CardDescription>
              </CardHeader>
              <CardContent>
                {pasivos.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cuenta</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pasivos.map((item) => (
                        <TableRow key={item.name} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="text-right">${item.value.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-destructive/10 font-bold">
                        <TableCell>Total Pasivos</TableCell>
                        <TableCell className="text-right text-destructive">${totalPasivos.toFixed(2)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex items-center justify-center h-[150px] text-muted-foreground">
                    No hay pasivos registrados
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
                <CardTitle>Composición del Balance</CardTitle>
                <CardDescription>Distribución Activos vs Pasivos</CardDescription>
              </CardHeader>
              <CardContent>
                {totalActivos > 0 || totalPasivos > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieChartData.filter(d => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: $${value.toFixed(2)}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieChartData.filter(d => d.value > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
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

            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Comparación por Cuenta</CardTitle>
                <CardDescription>Todas las cuentas del balance</CardDescription>
              </CardHeader>
              <CardContent>
                {barChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={barChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                      <Legend />
                      <Bar dataKey="value" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No hay datos disponibles
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="estadisticas" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="shadow-soft bg-gradient-success/10 border-success/20">
              <CardHeader>
                <CardTitle className="text-success">Ratio de Liquidez</CardTitle>
                <CardDescription>Capacidad de pago inmediato</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-success">
                  {totalPasivos > 0 ? (totalActivos / totalPasivos).toFixed(2) : "∞"}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {totalPasivos === 0 ? "Sin pasivos" : 
                   totalActivos / totalPasivos > 1.5 ? "Excelente" : 
                   totalActivos / totalPasivos > 1 ? "Bueno" : "Necesita mejora"}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-soft bg-gradient-primary/10 border-primary/20">
              <CardHeader>
                <CardTitle className="text-primary">Ratio de Endeudamiento</CardTitle>
                <CardDescription>Nivel de deudas</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-primary">
                  {totalActivos > 0 ? ((totalPasivos / totalActivos) * 100).toFixed(1) : "0.0"}%
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {totalActivos === 0 ? "Sin datos" :
                   (totalPasivos / totalActivos) < 0.3 ? "Bajo endeudamiento" : 
                   (totalPasivos / totalActivos) < 0.5 ? "Moderado" : "Alto endeudamiento"}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-soft bg-gradient-card border-border">
              <CardHeader>
                <CardTitle>Patrimonio sobre Activos</CardTitle>
                <CardDescription>Propiedad real</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">
                  {totalActivos > 0 ? ((patrimonio / totalActivos) * 100).toFixed(1) : "0.0"}%
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Porcentaje de activos propios
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Análisis Detallado</CardTitle>
              <CardDescription>Métricas financieras importantes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-card border border-border">
                  <div>
                    <p className="font-medium">Capital de Trabajo</p>
                    <p className="text-sm text-muted-foreground">Activos - Pasivos</p>
                  </div>
                  <span className="text-2xl font-bold text-success">${(totalActivos - totalPasivos).toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-card border border-border">
                  <div>
                    <p className="font-medium">Solvencia</p>
                    <p className="text-sm text-muted-foreground">Capacidad para cubrir deudas</p>
                  </div>
                  <span className="text-2xl font-bold text-primary">
                    {totalPasivos > 0 ? (totalActivos / totalPasivos).toFixed(2) : "∞"}x
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-card border border-border">
                  <div>
                    <p className="font-medium">Autonomía Financiera</p>
                    <p className="text-sm text-muted-foreground">Independencia de deudas externas</p>
                  </div>
                  <span className="text-2xl font-bold">
                    {totalActivos > 0 ? ((patrimonio / totalActivos) * 100).toFixed(1) : "0.0"}%
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
