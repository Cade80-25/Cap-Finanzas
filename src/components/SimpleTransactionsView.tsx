import { useState, useCallback } from "react";
import { Plus, TrendingUp, TrendingDown, Trash2, Pencil, Calendar, Tag, AlertTriangle, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useJournalTransactions } from "@/hooks/useJournalTransactions";
import { useSimpleAccountingData } from "@/hooks/useSimpleAccountingData";
import { toast } from "sonner";
import QRReceiptScanner from "@/components/QRReceiptScanner";

// Categorías predefinidas para modo simple
const SIMPLE_CATEGORIES = {
  income: [
    { id: "salario", label: "Salario", icon: "💰" },
    { id: "freelance", label: "Trabajo Freelance", icon: "💻" },
    { id: "ventas", label: "Ventas", icon: "🛒" },
    { id: "inversiones", label: "Inversiones", icon: "📈" },
    { id: "regalo", label: "Regalo", icon: "🎁" },
    { id: "otros-ingresos", label: "Otros Ingresos", icon: "💵" },
  ],
  expense: [
    { id: "alimentacion", label: "Alimentación", icon: "🍔" },
    { id: "transporte", label: "Transporte", icon: "🚗" },
    { id: "vivienda", label: "Vivienda", icon: "🏠" },
    { id: "servicios", label: "Servicios", icon: "💡" },
    { id: "salud", label: "Salud", icon: "🏥" },
    { id: "entretenimiento", label: "Entretenimiento", icon: "🎬" },
    { id: "educacion", label: "Educación", icon: "📚" },
    { id: "ropa", label: "Ropa", icon: "👕" },
    { id: "tecnologia", label: "Tecnología", icon: "📱" },
    { id: "otros-gastos", label: "Otros Gastos", icon: "📦" },
  ],
};

interface EditingTransaction {
  id: number;
  type: "income" | "expense";
  amount: number;
  description: string;
  category: string;
  date: string;
}

interface QRPrefillData {
  amount?: number;
  date?: string;
  description?: string;
  type?: "income" | "expense";
}

interface SimpleTransactionFormProps {
  onClose: () => void;
  defaultType?: "income" | "expense";
  editing?: EditingTransaction | null;
  qrPrefill?: QRPrefillData | null;
}

function SimpleTransactionForm({ onClose, defaultType = "expense", editing, qrPrefill }: SimpleTransactionFormProps) {
  const { transactions, setTransactions } = useJournalTransactions();
  const [type, setType] = useState<"income" | "expense">(editing?.type ?? qrPrefill?.type ?? defaultType);
  const [amount, setAmount] = useState(editing ? String(editing.amount) : qrPrefill?.amount ? String(qrPrefill.amount) : "");
  const [description, setDescription] = useState(editing?.description ?? qrPrefill?.description ?? "");
  const [category, setCategory] = useState(editing?.category ?? "");
  const [date, setDate] = useState(editing?.date ?? qrPrefill?.date ?? new Date().toISOString().split("T")[0]);

  const handleQRScanned = useCallback((data: { amount?: number; date?: string; description?: string; type?: "income" | "expense" }) => {
    if (data.amount) setAmount(String(data.amount));
    if (data.date) {
      // Try to normalize date format to YYYY-MM-DD
      const parts = data.date.split(/[-/]/);
      if (parts.length === 3) {
        const [d, m, y] = parts;
        const year = y.length === 2 ? `20${y}` : y;
        setDate(`${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`);
      }
    }
    if (data.description) setDescription(data.description);
    if (data.type) setType(data.type);
  }, []);

  const categories = type === "income" ? SIMPLE_CATEGORIES.income : SIMPLE_CATEGORIES.expense;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Ingresa un monto válido");
      return;
    }

    if (!category) {
      toast.error("Selecciona una categoría");
      return;
    }

    if (editing) {
      // Update existing transaction
      setTransactions(transactions.map(tx => 
        tx.id === editing.id
          ? {
              ...tx,
              date,
              account: category,
              description: description || categories.find(c => c.id === category)?.label || "Sin descripción",
              debit: type === "expense" ? numAmount : 0,
              credit: type === "income" ? numAmount : 0,
            }
          : tx
      ));
      toast.success("Movimiento actualizado");
    } else {
      const newTransaction = {
        id: Date.now(),
        date,
        account: category,
        description: description || categories.find(c => c.id === category)?.label || "Sin descripción",
        debit: type === "expense" ? numAmount : 0,
        credit: type === "income" ? numAmount : 0,
      };
      setTransactions([...transactions, newTransaction]);
      toast.success(type === "income" ? "Ingreso registrado" : "Gasto registrado");
    }
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type selector */}
      <Tabs value={type} onValueChange={(v) => setType(v as "income" | "expense")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="income" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Ingreso
          </TabsTrigger>
          <TabsTrigger value="expense" className="gap-2">
            <TrendingDown className="h-4 w-4" />
            Gasto
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Amount + QR Scanner */}
      <div className="space-y-2">
        <Label htmlFor="amount">Monto</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="pl-7 text-lg"
              autoFocus
            />
          </div>
          <QRReceiptScanner
            onDataScanned={handleQRScanned}
            triggerVariant="outline"
            triggerSize="icon"
          />
        </div>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label>Categoría</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona una categoría" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                <span className="flex items-center gap-2">
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Descripción (opcional)</Label>
        <Input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ej: Almuerzo con cliente"
        />
      </div>

      {/* Date */}
      <div className="space-y-2">
        <Label htmlFor="date">Fecha</Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" className={type === "income" ? "bg-success hover:bg-success/90" : ""}>
          {editing ? "Guardar Cambios" : type === "income" ? "Agregar Ingreso" : "Agregar Gasto"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function SimpleTransactionsView() {
  const { transactions, setTransactions } = useJournalTransactions();
  const { totals, recentTransactions } = useSimpleAccountingData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [defaultType, setDefaultType] = useState<"income" | "expense">("expense");
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  const [editingTx, setEditingTx] = useState<EditingTransaction | null>(null);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const handleDelete = (id: number) => {
    setTransactions(prev => prev.filter((t) => t.id !== id));
    toast.success("Movimiento eliminado");
  };

  const handleClearAll = () => {
    setTransactions([]);
    setConfirmClearOpen(false);
    toast.success("Todos los movimientos han sido eliminados");
  };

  const [qrPrefill, setQrPrefill] = useState<QRPrefillData | null>(null);

  const openDialog = (type: "income" | "expense") => {
    setEditingTx(null);
    setQrPrefill(null);
    setDefaultType(type);
    setDialogOpen(true);
  };

  const openEditDialog = (tx: { id: number; date: string; description: string; category: string; type: "income" | "expense"; amount: number }) => {
    setEditingTx({
      id: tx.id,
      type: tx.type,
      amount: tx.amount,
      description: tx.description,
      category: tx.category,
      date: tx.date,
    });
    setDefaultType(tx.type);
    setDialogOpen(true);
  };

  // Get all transactions formatted for simple view
  const allTransactions = transactions
    .map((tx) => ({
      id: tx.id,
      date: tx.date,
      description: tx.description,
      category: tx.account,
      type: tx.credit > 0 ? "income" as const : "expense" as const,
      amount: tx.credit > 0 ? tx.credit : tx.debit,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));

  const filteredTransactions = filter === "all" 
    ? allTransactions 
    : allTransactions.filter(t => t.type === filter);

  const getCategoryLabel = (categoryId: string) => {
    const incomeMatch = SIMPLE_CATEGORIES.income.find(c => c.id === categoryId);
    if (incomeMatch) return incomeMatch;
    const expenseMatch = SIMPLE_CATEGORIES.expense.find(c => c.id === categoryId);
    if (expenseMatch) return expenseMatch;
    return { label: categoryId, icon: "📁" };
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mis Movimientos</h1>
          <p className="text-muted-foreground">
            Registra tus ingresos y gastos de forma sencilla
          </p>
        </div>
        {transactions.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => setConfirmClearOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Borrar Todo
          </Button>
        )}
      </div>

      {/* Quick action cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card 
          className="cursor-pointer hover:border-success/50 transition-colors group"
          onClick={() => openDialog("income")}
        >
          <CardContent className="flex items-center gap-4 p-6">
            <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center group-hover:bg-success/20 transition-colors">
              <TrendingUp className="h-6 w-6 text-success" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Agregar Ingreso</p>
              <p className="text-sm text-muted-foreground">Salario, ventas, etc.</p>
            </div>
            <Plus className="h-5 w-5 text-muted-foreground group-hover:text-success transition-colors" />
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:border-destructive/50 transition-colors group"
          onClick={() => openDialog("expense")}
        >
          <CardContent className="flex items-center gap-4 p-6">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center group-hover:bg-destructive/20 transition-colors">
              <TrendingDown className="h-6 w-6 text-destructive" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Agregar Gasto</p>
              <p className="text-sm text-muted-foreground">Compras, servicios, etc.</p>
            </div>
            <Plus className="h-5 w-5 text-muted-foreground group-hover:text-destructive transition-colors" />
          </CardContent>
        </Card>
      </div>

      {/* QR Scanner Banner */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 hover:border-primary/40 transition-colors">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <QrCode className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Escanear Recibo con QR</p>
            <p className="text-xs text-muted-foreground">
              Apunta la cámara al código QR de tu factura y se registra automáticamente
            </p>
          </div>
          <QRReceiptScanner
            onDataScanned={(data) => {
              // Open dialog pre-filled with QR data
              setEditingTx(null);
              setDefaultType(data.type || "expense");
              setDialogOpen(true);
              setQrPrefill(data);
            }}
            triggerVariant="default"
            triggerSize="sm"
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totals.balance >= 0 ? "text-success" : "text-destructive"}`}>
              ${totals.balance.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              +${totals.ingresosDelMes.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gastos del Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              -${totals.gastosDelMes.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions list */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Historial</CardTitle>
              <CardDescription>Todos tus movimientos</CardDescription>
            </div>
            <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
              <TabsList>
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="income">Ingresos</TabsTrigger>
                <TabsTrigger value="expense">Gastos</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length > 0 ? (
            <div className="space-y-3">
              {filteredTransactions.map((tx) => {
                const cat = getCategoryLabel(tx.category);
                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
                  >
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-lg">
                      {cat.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{tx.description}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{tx.date}</span>
                        <Tag className="h-3 w-3 ml-2" />
                        <span>{cat.label}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${tx.type === "income" ? "text-success" : "text-destructive"}`}>
                        {tx.type === "income" ? "+" : "-"}${tx.amount.toFixed(2)}
                      </p>
                      <Badge variant={tx.type === "income" ? "default" : "secondary"} className="text-xs">
                        {tx.type === "income" ? "Ingreso" : "Gasto"}
                      </Badge>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={(e) => { e.stopPropagation(); openEditDialog(tx); }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); handleDelete(tx.id); }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <p className="mb-2">No hay movimientos registrados</p>
              <p className="text-sm">Usa los botones de arriba para agregar tu primer ingreso o gasto</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit transaction dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingTx(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTx ? "Editar Movimiento" : defaultType === "income" ? "Nuevo Ingreso" : "Nuevo Gasto"}
            </DialogTitle>
            <DialogDescription>
              {editingTx ? "Modifica los datos del movimiento" : `Registra un ${defaultType === "income" ? "ingreso" : "gasto"} de forma rápida`}
            </DialogDescription>
          </DialogHeader>
          <SimpleTransactionForm 
            onClose={() => { setDialogOpen(false); setEditingTx(null); setQrPrefill(null); }} 
            defaultType={defaultType}
            editing={editingTx}
            qrPrefill={qrPrefill}
          />
        </DialogContent>
      </Dialog>

      {/* Confirm clear all dialog */}
      <AlertDialog open={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              ¿Borrar todos los movimientos?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente todos los movimientos registrados ({transactions.length} en total). 
              No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearAll} className="bg-destructive hover:bg-destructive/90">
              Sí, borrar todo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
