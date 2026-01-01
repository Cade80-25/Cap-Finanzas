import { Target, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type PresupuestoItem = { categoria: string; presupuesto: number; gastado: number; color: string };

export default function Presupuesto() {
  // Datos vacíos - el usuario creará sus propios presupuestos
  const presupuestoData: PresupuestoItem[] = [];

  const totalPresupuesto = presupuestoData.reduce((acc, item) => acc + item.presupuesto, 0);
  const totalGastado = presupuestoData.reduce((acc, item) => acc + item.gastado, 0);
  const porcentajeGlobal = totalPresupuesto > 0 ? (totalGastado / totalPresupuesto) * 100 : 0;

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Presupuesto
          </h1>
          <p className="text-muted-foreground mt-2">
            Administra y monitorea tus límites de gastos
          </p>
        </div>
        <Button className="shadow-soft">
          <Target className="h-4 w-4 mr-2" />
          Nuevo Presupuesto
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Presupuesto Total</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPresupuesto.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Para este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Gastado</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">${totalGastado.toFixed(2)}</div>
            <Progress value={porcentajeGlobal} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {porcentajeGlobal.toFixed(1)}% del presupuesto
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Disponible</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalPresupuesto - totalGastado >= 0 ? "text-success" : "text-destructive"}`}>
              ${(totalPresupuesto - totalGastado).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalPresupuesto - totalGastado >= 0 ? "Dentro del presupuesto" : "Presupuesto excedido"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Presupuesto por Categoría</CardTitle>
          <CardDescription>
            Monitorea el uso de tu presupuesto en cada categoría
          </CardDescription>
        </CardHeader>
        <CardContent>
          {presupuestoData.length > 0 ? (
            <div className="space-y-6">
              {presupuestoData.map((item, index) => {
                const porcentaje = (item.gastado / item.presupuesto) * 100;
                const excedido = item.gastado > item.presupuesto;

                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${item.color}`} />
                        <span className="font-medium">{item.categoria}</span>
                        {excedido && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Excedido
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          ${item.gastado.toFixed(2)} / ${item.presupuesto.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {porcentaje.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <Progress 
                      value={Math.min(porcentaje, 100)} 
                      className={excedido ? "bg-destructive/20" : ""}
                    />
                    {excedido && (
                      <p className="text-xs text-destructive">
                        Has excedido el presupuesto en ${(item.gastado - item.presupuesto).toFixed(2)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground">
              No hay presupuestos configurados. Crea tu primer presupuesto.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
