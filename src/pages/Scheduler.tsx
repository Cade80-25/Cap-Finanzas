import { useState } from "react";
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useScheduledTransactions, ScheduledTransaction, RecurrenceFrequency } from "@/hooks/useScheduledTransactions";
import { useCategories } from "@/hooks/useCategories";
import { useSections } from "@/hooks/useSections";
import { toast } from "sonner";

const FREQUENCY_LABELS: Record<RecurrenceFrequency, string> = {
  daily: "Diario",
  weekly: "Semanal",
  monthly: "Mensual",
  yearly: "Anual",
};

const TYPE_LABELS = {
  expense: "Gasto",
  income: "Ingreso",
};

export default function Scheduler() {
  const {
    scheduled,
    addScheduled,
    updateScheduled,
    deleteScheduled,
    toggleScheduled,
    getNextDueDate,
  } = useScheduledTransactions();
  const { categories } = useCategories();
  const { sections } = useSections();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ScheduledTransaction | null>(null);

  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [account, setAccount] = useState("gastos-operativos");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [section, setSection] = useState("");
  const [notes, setNotes] = useState("");
  const [creditor, setCreditor] = useState("");
  const [frequency, setFrequency] = useState<RecurrenceFrequency>("monthly");
  const [interval, setInterval] = useState("1");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");

  const resetForm = () => {
    setType("expense");
    setAmount("");
    setDescription("");
    setAccount("gastos-operativos");
    setCategory("");
    setSubcategory("");
    setSection("");
    setNotes("");
    setCreditor("");
    setFrequency("monthly");
    setInterval("1");
    setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate("");
    setEditing(null);
  };

  const openNew = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (item: ScheduledTransaction) => {
    setEditing(item);
    setType(item.type);
    setAmount(String(item.amount));
    setDescription(item.description);
    setAccount(item.account);
    setCategory(item.category || "");
    setSubcategory(item.subcategory || "");
    setSection(item.section || "");
    setNotes(item.notes || "");
    setCreditor(item.creditor || "");
    setFrequency(item.frequency);
    setInterval(String(item.interval));
    setStartDate(item.startDate);
    setEndDate(item.endDate || "");
    setDialogOpen(true);
  };

  const handleSave = () => {
    const value = parseFloat(amount);
    if (!description.trim()) {
      toast.error("Ingresa una descripción");
      return;
    }
    if (!value || value <= 0) {
      toast.error("Ingresa un monto válido");
      return;
    }

    const data = {
      type,
      amount: value,
      description: description.trim(),
      account,
      category: category || undefined,
      subcategory: subcategory || undefined,
      section: section || undefined,
      notes: notes || undefined,
      creditor: creditor || undefined,
      frequency,
      interval: parseInt(interval) || 1,
      startDate,
      endDate: endDate || undefined,
      enabled: true,
    };

    if (editing) {
      updateScheduled(editing.id, data);
      toast.success("Transacción programada actualizada");
    } else {
      addScheduled(data);
      toast.success("Transacción programada creada");
    }
    setDialogOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    deleteScheduled(id);
    toast.success("Transacción programada eliminada");
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Transacciones Programadas</h1>
          <p className="text-sm text-muted-foreground">
            Gastos e ingresos recurrentes que se generan automáticamente
          </p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Programación
        </Button>
      </div>

      {scheduled.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-[200px] text-muted-foreground gap-3">
            <Calendar className="h-10 w-10" />
            <p>No hay transacciones programadas</p>
            <p className="text-xs">Crea una para automatizar gastos o ingresos recurrentes</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {scheduled.map((item) => (
            <Card
              key={item.id}
              className={`transition-all ${!item.enabled ? "opacity-50" : ""}`}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate">{item.description}</span>
                    <Badge variant={item.type === "expense" ? "destructive" : "default"}>
                      {TYPE_LABELS[item.type]}
                    </Badge>
                    <Badge variant="outline">
                      {FREQUENCY_LABELS[item.frequency]} (cada {item.interval})
                    </Badge>
                    {!item.enabled && <Badge variant="secondary">Pausada</Badge>}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                    <span className={item.type === "expense" ? "text-destructive" : "text-success"}>
                      {item.type === "expense" ? "-" : "+"}${item.amount.toFixed(2)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Próximo: {getNextDueDate(item)}
                    </span>
                    {item.lastGenerated && (
                      <span>Último: {item.lastGenerated}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleScheduled(item.id)}
                    title={item.enabled ? "Pausar" : "Reanudar"}
                  >
                    {item.enabled ? (
                      <ToggleRight className="h-5 w-5 text-success" />
                    ) : (
                      <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(item)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de creación/edición */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar Programación" : "Nueva Transacción Programada"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={type} onValueChange={(v) => setType(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Gasto</SelectItem>
                    <SelectItem value="income">Ingreso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Monto</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Alquiler, Netflix, Sueldo..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Frecuencia</Label>
                <Select value={frequency} onValueChange={(v) => setFrequency(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diario</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensual</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cada</Label>
                <Input
                  type="number"
                  min="1"
                  value={interval}
                  onChange={(e) => setInterval(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Fecha inicio</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha fin (opcional)</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Sección (opcional)</Label>
              <Select value={section} onValueChange={setSection}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin sección" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin sección</SelectItem>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.icon && <span className="mr-1">{s.icon}</span>}
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notas (opcional)</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas adicionales..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editing ? "Guardar Cambios" : "Crear Programación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
