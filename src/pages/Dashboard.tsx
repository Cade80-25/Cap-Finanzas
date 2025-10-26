import { Wallet, TrendingUp, TrendingDown, PiggyBank, ArrowUpRight, AlertTriangle } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";

const recentTransactions = [
  { id: 1, description: "Salario Mensual", amount: 5000, type: "income", date: "2025-10-20" },
  { id: 2, description: "Supermercado", amount: -350, type: "expense", date: "2025-10-19" },
  { id: 3, description: "Factura de Luz", amount: -120, type: "expense", date: "2025-10-18" },
  { id: 4, description: "Venta de Artículo", amount: 200, type: "income", date: "2025-10-17" },
];

const monthlyData = [
  { mes: "Jul", ingresos: 4800, gastos: 2400 },
  { mes: "Ago", ingresos: 5100, gastos: 2600 },
  { mes: "Sep", ingresos: 4900, gastos: 2800 },
  { mes: "Oct", ingresos: 5200, gastos: 2890 },
];

const categoryData = [
  { name: "Alimentación", value: 890, color: "hsl(var(--primary))" },
  { name: "Transporte", value: 450, color: "hsl(var(--success))" },
  { name: "Servicios", value: 680, color: "hsl(var(--warning))" },
  { name: "Entretenimiento", value: 340, color: "hsl(var(--accent))" },
  { name: "Otros", value: 530, color: "hsl(var(--muted-foreground))" },
];

const budgetAlerts = [
  { category: "Alimentación", spent: 890, budget: 1000, percentage: 89 },
  { category: "Transporte", spent: 450, budget: 500, percentage: 90 },
  { category: "Entretenimiento", spent: 340, budget: 300, percentage: 113 },
];

export default function Dashboard() {
  const navigate = useNavigate();
  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold mb-2">Panel Principal</h1>
        <p className="text-muted-foreground">
          Resumen general de tus finanzas personales
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Balance Total"
          value="$12,450.00"
          icon={Wallet}
          variant="default"
          trend={{ value: "+15% vs mes anterior", isPositive: true }}
        />
        <StatCard
          title="Ingresos del Mes"
          value="$5,200.00"
          icon={TrendingUp}
          variant="success"
          trend={{ value: "+8% vs mes anterior", isPositive: true }}
        />
        <StatCard
          title="Gastos del Mes"
          value="$2,890.00"
          icon={TrendingDown}
          variant="destructive"
          trend={{ value: "-5% vs mes anterior", isPositive: true }}
        />
        <StatCard
          title="Ahorros"
          value="$3,560.00"
          icon={PiggyBank}
          variant="success"
          trend={{ value: "+12% vs mes anterior", isPositive: true }}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-soft lg:col-span-2">
          <CardHeader>
            <CardTitle>Ingresos vs Gastos</CardTitle>
            <CardDescription>Comparativa de los últimos 4 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="mes" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                />
                <Legend />
                <Bar dataKey="ingresos" fill="hsl(var(--success))" name="Ingresos" radius={[8, 8, 0, 0]} />
                <Bar dataKey="gastos" fill="hsl(var(--destructive))" name="Gastos" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Gastos por Categoría</CardTitle>
            <CardDescription>Distribución del mes actual</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Transacciones Recientes</CardTitle>
            <CardDescription>
              Últimas 4 transacciones registradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
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
            <Button variant="outline" className="w-full mt-4" onClick={() => navigate("/transacciones")}>
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Ver Todas
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
                    ${alert.spent} de ${alert.budget}
                  </p>
                </div>
              ))}
            </div>
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
