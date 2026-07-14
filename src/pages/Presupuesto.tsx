import { useEffect, useMemo, useRef, useState } from "react";
import { Target, TrendingUp, AlertCircle, CheckCircle, Plus, Trash2, Pencil, Save, Download, ArrowUpDown, Search } from "lucide-react";
import { exportToCSV } from "@/lib/export-transactions";
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
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useNumberFormat } from "@/hooks/useNumberFormat";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
  "hsl(var(--accent))",
  "hsl(var(--secondary))",
];

export default function Presupuesto() {
  const [open, setOpen] = useState(false);
  const [categoria, setCategoria] = useState("");
  const [cuentaAsociada, setCuentaAsociada] = useState("");
  const [presupuesto, setPresupuesto] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ categoria: string; presupuesto: string }>({ categoria: "", presupuesto: "" });

  const { transactions, ACCOUNT_CATEGORIES } = useAccountingData();
  const { budgets: presupuestoData, setBudgets: setPresupuestoData } = useBudgets();
  const { formatCurrency } = useNumberFormat();

  // Mes seleccionado (YYYY-MM). Persistido en localStorage. Default: mes actual.
  const currentMonth = new Date().toISOString().substring(0, 7);
  const [selectedMonth, setSelectedMonth] = useLocalStorage<string>(
    "cap-finanzas-presupuesto-mes",
    currentMonth
  );

  // Meses disponibles: mes actual + todos los meses con transacciones
  const availableMonths = useMemo(() => {
    const set = new Set<string>([currentMonth]);
    transactions.forEach((tx) => {
      if (typeof tx.date === "string" && tx.date.length >= 7) {
        set.add(tx.date.substring(0, 7));
      }
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [transactions, currentMonth]);

  const monthLabel = (ym: string) => {
    const [y, m] = ym.split("-");
    const names = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
    const idx = Math.max(0, Math.min(11, Number(m) - 1));
    return `${names[idx]} ${y}`;
  };

  // Gasto por cuenta para el mes seleccionado
  const gastosPorCuentaMes = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach((tx) => {
      if (!tx.date?.startsWith(selectedMonth)) return;
      const cat = ACCOUNT_CATEGORIES[tx.account];
      if (cat?.type !== "gasto") return;
      map[tx.account] = (map[tx.account] || 0) + (tx.debit - tx.credit);
    });
    return map;
  }, [transactions, selectedMonth, ACCOUNT_CATEGORIES]);

  // Gastos detallados del mes seleccionado (para tabla de detalle)
  const gastosDetalladosMes = useMemo(() => {
    // Mapa cuenta -> nombre de presupuesto (si existe)
    const cuentaAPresupuesto: Record<string, string> = {};
    presupuestoData.forEach((b) => {
      cuentaAPresupuesto[b.cuentaAsociada] = b.categoria;
    });
    return transactions
      .filter((tx) => {
        if (!tx.date?.startsWith(selectedMonth)) return false;
        const cat = ACCOUNT_CATEGORIES[tx.account];
        if (cat?.type !== "gasto") return false;
        return tx.debit - tx.credit > 0;
      })
      .map((tx) => {
        const cat = ACCOUNT_CATEGORIES[tx.account];
        return {
          id: `${tx.date}-${tx.account}-${tx.description}-${tx.debit}-${tx.credit}-${Math.random()}`,
          date: tx.date,
          description: tx.description,
          cuentaLabel: cat?.label || tx.account,
          presupuesto: cuentaAPresupuesto[tx.account] || null,
          monto: tx.debit - tx.credit,
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, selectedMonth, ACCOUNT_CATEGORIES, presupuestoData]);

  const presupuestosConGastos = presupuestoData.map((item) => ({
    ...item,
    gastado: Math.max(0, gastosPorCuentaMes[item.cuentaAsociada] || 0),
  }));

  const totalPresupuesto = presupuestosConGastos.reduce((acc, item) => acc + item.presupuesto, 0);
  const totalGastado = presupuestosConGastos.reduce((acc, item) => acc + item.gastado, 0);
  const porcentajeGlobal = totalPresupuesto > 0 ? (totalGastado / totalPresupuesto) * 100 : 0;

  // Alertas 80% / 100% — se dispara una vez por (mes, id, umbral)
  const alertedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    presupuestosConGastos.forEach((item) => {
      if (item.presupuesto <= 0) return;
      const pct = (item.gastado / item.presupuesto) * 100;
      const keyOver = `${selectedMonth}:${item.id}:100`;
      const keyWarn = `${selectedMonth}:${item.id}:80`;
      if (pct >= 100 && !alertedRef.current.has(keyOver)) {
        alertedRef.current.add(keyOver);
        toast.error(`"${item.categoria}" superó el 100% del presupuesto`, {
          description: `Gastado ${formatCurrency(item.gastado)} de ${formatCurrency(item.presupuesto)} en ${monthLabel(selectedMonth)}`,
        });
      } else if (pct >= 80 && pct < 100 && !alertedRef.current.has(keyWarn)) {
        alertedRef.current.add(keyWarn);
        toast.warning(`"${item.categoria}" alcanzó el ${pct.toFixed(0)}% del presupuesto`, {
          description: `Gastado ${formatCurrency(item.gastado)} de ${formatCurrency(item.presupuesto)} en ${monthLabel(selectedMonth)}`,
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, JSON.stringify(presupuestosConGastos.map((p) => [p.id, p.gastado, p.presupuesto]))]);

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

  const startEdit = (item: BudgetItem) => {
    setEditingId(item.id);
    setEditValues({ categoria: item.categoria, presupuesto: String(item.presupuesto) });
  };

  const saveEdit = (id: string) => {
    const p = Number(editValues.presupuesto);
    if (!editValues.categoria.trim()) {
      toast.error("El nombre no puede estar vacío");
      return;
    }
    if (!Number.isFinite(p) || p <= 0) {
      toast.error("Ingresa un presupuesto válido");
      return;
    }

    setPresupuestoData((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, categoria: editValues.categoria.trim(), presupuesto: p }
          : item
      )
    );
    setEditingId(null);
    toast.success("Presupuesto actualizado");
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div data-tutorial="presupuesto-title">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Presupuesto
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
            Consumo de {monthLabel(selectedMonth)} vinculado al Libro Diario
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Selecciona mes" />
            </SelectTrigger>
            <SelectContent>
              {availableMonths.map((m) => (
                <SelectItem key={m} value={m}>
                  {monthLabel(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>


        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-tutorial="presupuesto-nuevo" className="shadow-soft">
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
      </div>


      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Presupuesto Total</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPresupuesto)}</div>
            <p className="text-xs text-muted-foreground mt-1">Límite establecido</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Gastado</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(totalGastado)}</div>
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
              {formatCurrency(totalPresupuesto - totalGastado)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalPresupuesto - totalGastado >= 0
                ? "Dentro del presupuesto"
                : "Presupuesto excedido"}
            </p>
          </CardContent>
        </Card>
      </div>

      {presupuestosConGastos.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Distribución del Presupuesto</CardTitle>
              <CardDescription>Cómo se reparte tu límite mensual por categoría</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={presupuestosConGastos.map((p) => ({ name: p.categoria, value: p.presupuesto }))}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={(entry) => entry.name}
                  >
                    {presupuestosConGastos.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(Number(value))}
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Presupuestado vs Gastado</CardTitle>
              <CardDescription>Compara tu límite con lo que ya llevas gastado</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={presupuestosConGastos.map((p) => ({ name: p.categoria, Presupuestado: p.presupuesto, Gastado: p.gastado }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(Number(value))}
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  />
                  <Legend />
                  <Bar dataKey="Presupuestado" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Gastado" fill="hsl(var(--destructive))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      <Card data-tutorial="presupuesto-lista">
        <CardHeader>
          <CardTitle>Presupuesto por Categoría</CardTitle>
          <CardDescription>
            Los gastos se calculan automáticamente desde el Libro Diario. Haz clic en el lápiz para editar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {presupuestosConGastos.length > 0 ? (
            <div className="space-y-6">
              {presupuestosConGastos.map((item) => {
                const porcentaje = item.presupuesto > 0 ? (item.gastado / item.presupuesto) * 100 : 0;
                const excedido = item.gastado > item.presupuesto;
                const cerca = !excedido && porcentaje >= 80;
                const cuentaLabel = ACCOUNT_CATEGORIES[item.cuentaAsociada]?.label || item.cuentaAsociada;
                const isEditing = editingId === item.id;

                return (
                  <div key={item.id} className="p-4 rounded-xl border border-border bg-card space-y-3">
                    {isEditing ? (
                      /* Editing mode */
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs text-muted-foreground">Nombre</Label>
                            <Input
                              value={editValues.categoria}
                              onChange={(e) => setEditValues((prev) => ({ ...prev, categoria: e.target.value }))}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Límite ($)</Label>
                            <Input
                              type="number"
                              inputMode="decimal"
                              value={editValues.presupuesto}
                              onChange={(e) => setEditValues((prev) => ({ ...prev, presupuesto: e.target.value }))}
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="ghost" size="sm" onClick={cancelEdit}>
                            Cancelar
                          </Button>
                          <Button size="sm" onClick={() => saveEdit(item.id)}>
                            <Save className="h-3.5 w-3.5 mr-1" />
                            Guardar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* Display mode */
                      <>
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
                            {cerca && (
                              <Badge className="text-xs bg-warning text-warning-foreground hover:bg-warning">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Cerca del límite
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => startEdit(item)}
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
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

                        {/* Budget details - always visible */}
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div className="p-2 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground">Presupuestado</p>
                            <p className="font-semibold">{formatCurrency(item.presupuesto)}</p>
                          </div>
                          <div className="p-2 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground">Gastado</p>
                            <p className={`font-semibold ${excedido ? "text-destructive" : ""}`}>
                              {formatCurrency(item.gastado)}
                            </p>
                          </div>
                          <div className="p-2 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground">Disponible</p>
                            <p className={`font-semibold ${item.presupuesto - item.gastado < 0 ? "text-destructive" : "text-success"}`}>
                              {formatCurrency(item.presupuesto - item.gastado)}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Progress
                            value={Math.min(porcentaje, 100)}
                            className={excedido ? "bg-destructive/20" : ""}
                          />
                          <p className="text-xs text-muted-foreground text-right">
                            {porcentaje.toFixed(1)}% utilizado
                          </p>
                        </div>

                        {excedido && (
                          <p className="text-xs text-destructive">
                            Has excedido el presupuesto en {formatCurrency(item.gastado - item.presupuesto)}
                          </p>
                        )}
                      </>
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

      <Card>
        <CardHeader>
          <CardTitle>Detalle de Gastos de {monthLabel(selectedMonth)}</CardTitle>
          <CardDescription>
            Transacciones que alimentan los gráficos y el consumo del mes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {gastosDetalladosMes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Fecha</th>
                    <th className="py-2 pr-3 font-medium">Descripción</th>
                    <th className="py-2 pr-3 font-medium">Cuenta</th>
                    <th className="py-2 pr-3 font-medium">Presupuesto</th>
                    <th className="py-2 pl-3 font-medium text-right">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {gastosDetalladosMes.map((g) => (
                    <tr key={g.id} className="border-b border-border/50 last:border-0">
                      <td className="py-2 pr-3 whitespace-nowrap text-muted-foreground">{g.date}</td>
                      <td className="py-2 pr-3">{g.description || "—"}</td>
                      <td className="py-2 pr-3">{g.cuentaLabel}</td>
                      <td className="py-2 pr-3">
                        {g.presupuesto ? (
                          <Badge variant="secondary" className="text-xs">{g.presupuesto}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sin asignar</span>
                        )}
                      </td>
                      <td className="py-2 pl-3 text-right font-medium text-destructive">
                        {formatCurrency(g.monto)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-semibold">
                    <td colSpan={4} className="py-2 pr-3 text-right">Total</td>
                    <td className="py-2 pl-3 text-right text-destructive">
                      {formatCurrency(gastosDetalladosMes.reduce((s, g) => s + g.monto, 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[160px] text-muted-foreground">
              <TrendingUp className="h-10 w-10 mb-3 opacity-50" />
              <p>No hay gastos registrados en {monthLabel(selectedMonth)}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
