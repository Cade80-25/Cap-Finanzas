import { Wallet, TrendingUp, TrendingDown, PiggyBank, ArrowUpRight, AlertTriangle } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { useAccountingData } from "@/hooks/useAccountingData";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface PresupuestoItem {
  id: number;
  nombre: string;
  tipo: string;
  presupuestado: number;
  actual: number;
  icono: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { totales, resumenMensual, datosCategorias, transaccionesRecientes, estadoResultados } = useAccountingData();
  const [presupuestoData] = useLocalStorage<PresupuestoItem[]>("cap-finanzas-presupuesto", []);

  // Calcular alertas de presupuesto
  const budgetAlerts = presupuestoData
    .filter(p => p.presupuestado > 0)
    .map(p => {
      // Buscar gastos relacionados
      const gastoRelacionado = estadoResultados.gastos.find(g => 
        g.name.toLowerCase().includes(p.nombre.toLowerCase()) ||
        p.nombre.toLowerCase().includes(g.name.toLowerCase())
      );
      const spent = gastoRelacionado?.value || 0;
      const percentage = Math.round((spent / p.presupuestado) * 100);
      return {
        category: p.nombre,
        spent,
        budget: p.presupuestado,
        percentage,
      };
    })
    .filter(a => a.percentage >= 70)
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 3);

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold mb-2">Panel Principal</h1>
        <p className="text-muted-foreground">
          Resumen general de tus finanzas (datos desde Libro Diario)
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Balance Total"
          value={`$${totales.balance.toFixed(2)}`}
          icon={Wallet}
          variant="default"
        />
        <StatCard
          title="Ingresos del Mes"
          value={`$${totales.ingresosDelMes.toFixed(2)}`}
          icon={TrendingUp}
          variant="success"
        />
        <StatCard
          title="Gastos del Mes"
          value={`$${totales.gastosDelMes.toFixed(2)}`}
          icon={TrendingDown}
          variant="destructive"
        />
        <StatCard
          title="Ahorros"
          value={`$${totales.ahorros.toFixed(2)}`}
          icon={PiggyBank}
          variant="success"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-soft lg:col-span-2">
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
                <Button variant="link" onClick={() => navigate("/libro-diario")}>
                  Ir al Libro Diario
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
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Transacciones Recientes</CardTitle>
            <CardDescription>
              Últimas transacciones del Libro Diario
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
                No hay transacciones registradas
              </div>
            )}
            <Button variant="outline" className="w-full mt-4" onClick={() => navigate("/libro-diario")}>
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Ir al Libro Diario
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

      <Card className="shadow-soft bg-gradient-primary">
        <CardHeader>
          <CardTitle className="text-primary-foreground">¿Necesitas Ayuda?</CardTitle>
          <CardDescription className="text-primary-foreground/80">
            Aprende sobre conceptos contables básicos y obtén recomendaciones personalizadas
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => navigate("/enciclopedia")}>
            Ir a Enciclopedia
          </Button>
          <Button variant="secondary" className="flex-1" onClick={() => navigate("/recomendaciones")}>
            Obtener Recomendaciones
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
