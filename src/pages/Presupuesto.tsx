import { useState } from "react";
import { Target, TrendingUp, AlertCircle, CheckCircle, Plus } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useLocalStorage } from "@/hooks/useLocalStorage";

type PresupuestoItem = {
  categoria: string;
  presupuesto: number;
  gastado: number;
  color: string;
};

export default function Presupuesto() {
  const [open, setOpen] = useState(false);
  const [categoria, setCategoria] = useState("");
  const [presupuesto, setPresupuesto] = useState<string>("");
  const [gastado, setGastado] = useState<string>("");

  const [presupuestoData, setPresupuestoData] = useLocalStorage<PresupuestoItem[]>(
    "cap-finanzas-presupuesto",
    []
  );

  const totalPresupuesto = presupuestoData.reduce((acc, item) => acc + item.presupuesto, 0);
  const totalGastado = presupuestoData.reduce((acc, item) => acc + item.gastado, 0);
  const porcentajeGlobal = totalPresupuesto > 0 ? (totalGastado / totalPresupuesto) * 100 : 0;

  const resetForm = () => {
    setCategoria("");
    setPresupuesto("");
    setGastado("");
  };

  const handleCreate = () => {
    const p = Number(presupuesto);
    const g = gastado === "" ? 0 : Number(gastado);

    if (!categoria.trim()) {
      toast.error("Escribe una categoría");
      return;
    }
    if (!Number.isFinite(p) || p <= 0) {
      toast.error("Ingresa un presupuesto válido");
      return;
    }
    if (!Number.isFinite(g) || g < 0) {
      toast.error("Ingresa un gasto válido");
      return;
    }

    setPresupuestoData((prev) => [
      ...prev,
      {
        categoria: categoria.trim(),
        presupuesto: p,
        gastado: g,
        color: "bg-primary",
      },
    ]);

    toast.success("Presupuesto creado");
    setOpen(false);
    resetForm();
  };

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

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-soft">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Presupuesto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo Presupuesto</DialogTitle>
              <DialogDescription>
                Crea un presupuesto por categoría (por ejemplo: Alquiler, Comida, Transporte)
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="categoria">Categoría</Label>
                <Input
                  id="categoria"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  placeholder="Ej: Alquiler"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="presupuesto">Presupuesto ($)</Label>
                <Input
                  id="presupuesto"
                  type="number"
                  inputMode="decimal"
                  value={presupuesto}
                  onChange={(e) => setPresupuesto(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="gastado">Gastado ($) (opcional)</Label>
                <Input
                  id="gastado"
                  type="number"
                  inputMode="decimal"
                  value={gastado}
                  onChange={(e) => setGastado(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleCreate}>Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
            <div
              className={`text-2xl font-bold ${
                totalPresupuesto - totalGastado >= 0 ? "text-success" : "text-destructive"
              }`}
            >
              ${(totalPresupuesto - totalGastado).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalPresupuesto - totalGastado >= 0
                ? "Dentro del presupuesto"
                : "Presupuesto excedido"}
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
                        <p className="text-xs text-muted-foreground">{porcentaje.toFixed(1)}%</p>
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
