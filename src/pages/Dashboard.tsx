import { Wallet, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const recentTransactions = [
  { id: 1, description: "Salario Mensual", amount: 5000, type: "income", date: "2025-10-20" },
  { id: 2, description: "Supermercado", amount: -350, type: "expense", date: "2025-10-19" },
  { id: 3, description: "Factura de Luz", amount: -120, type: "expense", date: "2025-10-18" },
  { id: 4, description: "Venta de Artículo", amount: 200, type: "income", date: "2025-10-17" },
];

export default function Dashboard() {
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
                  className="flex items-center justify-between p-3 rounded-lg bg-gradient-card border border-border"
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
          </CardContent>
        </Card>

        <Card className="shadow-soft bg-gradient-primary">
          <CardHeader>
            <CardTitle className="text-primary-foreground">¿Necesitas Ayuda?</CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Aprende sobre conceptos contables básicos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-primary-foreground/90 mb-4">
              Explora nuestra enciclopedia para entender términos como activos, pasivos, 
              ingresos, gastos y más. Diseñado para que cualquiera pueda aprender.
            </p>
            <Button variant="secondary" className="w-full">
              Ir a Enciclopedia
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
