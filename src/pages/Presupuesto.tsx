import { useState } from "react";
import { Target, TrendingUp, AlertCircle, CheckCircle, Plus, Trash2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAccountingData } from "@/hooks/useAccountingData";
import { useBudgets, type BudgetItem } from "@/hooks/useBudgets";

type PresupuestoItem = BudgetItem;

export default function Presupuesto() {
  const [open, setOpen] = useState(false);
  const [categoria, setCategoria] = useState("");
  const [cuentaAsociada, setCuentaAsociada] = useState("");
  const [presupuesto, setPresupuesto] = useState<string>("");

  const { estadoResultados, ACCOUNT_CATEGORIES } = useAccountingData();

  const { budgets: presupuestoData, setBudgets: setPresupuestoData } = useBudgets();

  // Calcular gastos reales por cada presupuesto
  const presupuestosConGastos = presupuestoData.map((item) => {
    // Buscar el gasto real en estadoResultados
    const gastoReal = estadoResultados.gastos.find((g) => {
      const categoria = Object.entries(ACCOUNT_CATEGORIES).find(
        ([key, val]) => val.label === g.name
      );
      return categoria?.[0] === item.cuentaAsociada;
    });
    
    return {
      ...item,
      gastado: gastoReal?.value || 0,
    };
  });

  const totalPresupuesto = presupuestosConGastos.reduce((acc, item) => acc + item.presupuesto, 0);
  const totalGastado = presupuestosConGastos.reduce((acc, item) => acc + item.gastado, 0);
  const porcentajeGlobal = totalPresupuesto > 0 ? (totalGastado / totalPresupuesto) * 100 : 0;

  // Cuentas de tipo gasto disponibles
  const cuentasGasto = Object.entries(ACCOUNT_CATEGORIES)
    .filter(([_, val]) => val.type === "gasto")
    .map(([key, val]) => ({ value: key, label: val.label }));

  const resetForm = () => {
    setCategoria("");
    setCuentaAsociada("");
    setPresupuesto("");
  };

  const handleCreate = () => {
    const p = Number(presupuesto);

    if (!categoria.trim()) {
      toast.error("Escribe un nombre para el presupuesto");
      return;
    }
    if (!cuentaAsociada) {
      toast.error("Selecciona una cuenta de gastos");
      return;
    }
    if (!Number.isFinite(p) || p <= 0) {
      toast.error("Ingresa un presupuesto válido");
      return;
    }

    setPresupuestoData((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        categoria: categoria.trim(),
        cuentaAsociada,
        presupuesto: p,
        color: "bg-primary",
      },
    ]);

    toast.success("Presupuesto creado");
    setOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    setPresupuestoData((prev) => prev.filter((item) => item.id !== id));
    toast.success("Presupuesto eliminado");
  };

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div data-tutorial="presupuesto-title">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Presupuesto
          </h1>
          <p className="text-muted-foreground mt-2">
            Administra límites de gastos vinculados al Libro Diario
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
                Crea un presupuesto vinculado a una cuenta de gastos del Libro Diario
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="categoria">Nombre del Presupuesto</Label>
                <Input
                  id="categoria"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  placeholder="Ej: Gastos del hogar"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="cuenta">Cuenta de Gastos Asociada</Label>
                <Select value={cuentaAsociada} onValueChange={setCuentaAsociada}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una cuenta" />
                  </SelectTrigger>
                  <SelectContent>
                    {cuentasGasto.map((cuenta) => (
                      <SelectItem key={cuenta.value} value={cuenta.value}>
                        {cuenta.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  El gasto real se calculará automáticamente desde el Libro Diario
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="presupuesto">Límite de Presupuesto ($)</Label>
                <Input
                  id="presupuesto"
                  type="number"
                  inputMode="decimal"
                  value={presupuesto}
                  onChange={(e) => setPresupuesto(e.target.value)}
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
            <p className="text-xs text-muted-foreground mt-1">Límite establecido</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Gastado</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">${totalGastado.toFixed(2)}</div>
            <Progress value={Math.min(porcentajeGlobal, 100)} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {porcentajeGlobal.toFixed(1)}% del presupuesto (desde Libro Diario)
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
            Los gastos se calculan automáticamente desde el Libro Diario
          </CardDescription>
        </CardHeader>
        <CardContent>
          {presupuestosConGastos.length > 0 ? (
            <div className="space-y-6">
              {presupuestosConGastos.map((item) => {
                const porcentaje = (item.gastado / item.presupuesto) * 100;
                const excedido = item.gastado > item.presupuesto;
                const cuentaLabel = ACCOUNT_CATEGORIES[item.cuentaAsociada]?.label || item.cuentaAsociada;

                return (
                  <div key={item.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${item.color}`} />
                        <div>
                          <span className="font-medium">{item.categoria}</span>
                          <p className="text-xs text-muted-foreground">{cuentaLabel}</p>
                        </div>
                        {excedido && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Excedido
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold">
                            ${item.gastado.toFixed(2)} / ${item.presupuesto.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">{porcentaje.toFixed(1)}%</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(item.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
              <Target className="h-12 w-12 mb-4 opacity-50" />
              <p>No hay presupuestos configurados</p>
              <p className="text-sm">Crea un presupuesto vinculado al Libro Diario</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
