import { useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Plus, TrendingUp, TrendingDown, Trash2, Pencil, Calendar, Tag, AlertTriangle, QrCode, Download, FileSpreadsheet, FileText, Calculator, StickyNote, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useJournalTransactions } from "@/hooks/useJournalTransactions";
import { useSimpleAccountingData } from "@/hooks/useSimpleAccountingData";
import { useCategories } from "@/hooks/useCategories";
import { CategorySelector } from "@/components/CategorySelector";
import { suggestCategory } from "@/hooks/useAutoCategory";
import { toast } from "sonner";
import QRReceiptScanner from "@/components/QRReceiptScanner";
import { exportToCSV, exportToExcel, exportToPDF, type ExportTransaction } from "@/lib/export-transactions";
import { parseFlexibleNumber } from "@/lib/parse-flexible-number";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface EditingTransaction {
  id: number;
  type: "income" | "expense";
  amount: number;
  description: string;
  category: string;
  subcategory?: string;
  date: string;
  price?: number;
  quantity?: number;
  creditor?: string;
  notes?: string;
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
  const { getCategoryById } = useCategories();
  const [type, setType] = useState<"income" | "expense">(editing?.type ?? qrPrefill?.type ?? defaultType);
  const [amount, setAmount] = useState(editing ? String(editing.amount) : qrPrefill?.amount ? String(qrPrefill.amount) : "");
  const [useCalculator, setUseCalculator] = useState(!!(editing?.quantity && editing.quantity > 1));
  const [price, setPrice] = useState(editing?.price ? String(editing.price) : "");
  const [quantity, setQuantity] = useState(editing?.quantity ? String(editing.quantity) : "1");
  const [description, setDescription] = useState(editing?.description ?? qrPrefill?.description ?? "");
  const [category, setCategory] = useState(editing?.category ?? "");
  const [subcategory, setSubcategory] = useState(editing?.subcategory ?? "");
  const [date, setDate] = useState(editing?.date ?? qrPrefill?.date ?? new Date().toISOString().split("T")[0]);
  const [creditor, setCreditor] = useState(editing?.creditor ?? qrPrefill?.description ?? "");
  const [notes, setNotes] = useState(editing?.notes ?? "");

  const sum = useMemo(() => {
    if (useCalculator) {
      const p = parseFlexibleNumber(price);
      const q = parseFlexibleNumber(quantity, 1);
      return p * q;
    }
    return parseFlexibleNumber(amount);
  }, [useCalculator, price, quantity, amount]);

  const handleQRScanned = useCallback((data: { amount?: number; date?: string; description?: string; type?: "income" | "expense" }) => {
    if (data.amount) setAmount(String(data.amount));
    if (data.date) {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sum <= 0) {
      toast.error("Ingresa un precio válido");
      return;
    }
    if (!category) {
      toast.error("Selecciona una categoría");
      return;
    }

    const cat = getCategoryById(category);
    const label = cat?.label || category;
    const parsedPrice = useCalculator ? parseFlexibleNumber(price) : undefined;
    const parsedQuantity = useCalculator ? parseFlexibleNumber(quantity, 1) : undefined;

    if (editing) {
      setTransactions(transactions.map(tx =>
        tx.id === editing.id
          ? {
              ...tx, date, account: category, subcategory: subcategory || undefined,
              description: description || label,
              debit: type === "expense" ? sum : 0,
              credit: type === "income" ? sum : 0,
              price: useCalculator && parsedPrice ? parsedPrice : undefined,
              quantity: useCalculator && parsedQuantity !== 1 ? parsedQuantity : undefined,
              creditor: creditor || undefined,
              notes: notes || undefined,
            }
          : tx
      ));
      toast.success("Movimiento actualizado");
    } else {
      const newTransaction = {
        id: Date.now(), date, account: category, subcategory: subcategory || undefined,
        description: description || label,
        debit: type === "expense" ? sum : 0,
        credit: type === "income" ? sum : 0,
        price: useCalculator && parsedPrice ? parsedPrice : undefined,
        quantity: useCalculator && parsedQuantity !== 1 ? parsedQuantity : undefined,
        creditor: creditor || undefined,
        notes: notes || undefined,
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
            <TrendingUp className="h-4 w-4" /> Ingreso
          </TabsTrigger>
          <TabsTrigger value="expense" className="gap-2">
            <TrendingDown className="h-4 w-4" /> Gasto
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Amount input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Importe</Label>
          <Button type="button" variant="ghost" size="sm" className="text-xs gap-1 h-6"
            onClick={() => {
              if (!useCalculator && sum > 0) {
                setPrice(String(sum));
                setQuantity("1");
              }
              if (useCalculator) {
                setAmount(String(sum));
              }
              setUseCalculator(!useCalculator);
            }}>
            <Calculator className="h-3 w-3" />
            {useCalculator ? "Ingreso directo" : "Usar calculadora"}
          </Button>
        </div>

        {useCalculator ? (
          <div className="space-y-2 border rounded-md p-3 bg-muted/30">
            <div className="grid grid-cols-[1fr,auto,60px,auto,1fr] items-center gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Precio</Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <Input
                    type="text" inputMode="decimal" autoComplete="off"
                    value={price} onChange={e => setPrice(e.target.value)}
                    placeholder="0.00" className="pl-6" autoFocus
                  />
                </div>
              </div>
              <span className="text-muted-foreground font-bold mt-5">×</span>
              <div>
                <Label className="text-xs text-muted-foreground">Cant.</Label>
                <Input
                  type="text" inputMode="decimal" autoComplete="off"
                  value={quantity} onChange={e => setQuantity(e.target.value)}
                  placeholder="1"
                />
              </div>
              <span className="text-muted-foreground font-bold mt-5">=</span>
              <div>
                <Label className="text-xs text-muted-foreground">Total</Label>
                <div className="h-10 flex items-center px-3 rounded-md border bg-muted/50 font-bold text-lg">
                  ${sum.toFixed(2)}
                </div>
              </div>
            </div>
            {parseFlexibleNumber(quantity, 1) !== 1 && parseFlexibleNumber(quantity, 1) > 0 && (
              <p className="text-xs text-muted-foreground">
                💡 {quantity} unid. × ${parseFlexibleNumber(price).toFixed(2)} = ${sum.toFixed(2)}
              </p>
            )}
          </div>
        ) : (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <Input
              type="text" inputMode="decimal" autoComplete="off"
              value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="0.00" className="pl-7 text-lg font-semibold h-12" autoFocus
            />
          </div>
        )}
      </div>

      {/* Category with subcategory support */}
      <CategorySelector
        type={type}
        value={category}
        subcategoryValue={subcategory}
        onSelect={(catId, subId) => { setCategory(catId); setSubcategory(subId || ""); }}
      />

      {/* Acreedor / Pagador (reemplaza descripción) */}
      <div className="space-y-2">
        <Label htmlFor="creditor">Acreedor / Pagador</Label>
        <Input
          id="creditor"
          value={creditor}
          onChange={e => {
            setCreditor(e.target.value);
            setDescription(e.target.value);
            if (!category || !editing) {
              const suggested = suggestCategory(e.target.value);
              if (suggested) setCategory(suggested);
            }
          }}
          placeholder="Ej: Juan Pérez, Empresa X, Almuerzo con cliente"
        />
      </div>

      {/* Anotaciones */}
      <div className="space-y-2">
        <Label htmlFor="notes">
          <StickyNote className="h-3.5 w-3.5 inline mr-1" />
          Anotaciones
        </Label>
        <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas adicionales..." rows={2} />
      </div>

      {/* Date */}
      <div className="space-y-2">
        <Label htmlFor="date">Fecha</Label>
        <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} />
      </div>

      {/* QR Scanner */}
      <div className="flex items-center gap-2">
        <QRReceiptScanner onDataScanned={handleQRScanned} triggerVariant="outline" triggerSize="sm" />
        <span className="text-xs text-muted-foreground">Escanear recibo QR</span>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
        <Button type="submit" className={type === "income" ? "bg-success hover:bg-success/90" : ""}>
          {editing ? "Guardar Cambios" : type === "income" ? "Agregar Ingreso" : "Agregar Gasto"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function SimpleTransactionsView() {
  const { transactions, setTransactions } = useJournalTransactions();
  const { totals } = useSimpleAccountingData();
  const { getCategoryById } = useCategories();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [defaultType, setDefaultType] = useState<"income" | "expense">("expense");
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  const [editingTx, setEditingTx] = useState<EditingTransaction | null>(null);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [qrPrefill, setQrPrefill] = useState<QRPrefillData | null>(null);

  const handleDelete = (id: number) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    toast.success("Movimiento eliminado");
  };

  const handleClearAll = () => {
    setTransactions([]);
    setConfirmClearOpen(false);
    toast.success("Todos los movimientos han sido eliminados");
  };

  const openDialog = (type: "income" | "expense") => {
    setEditingTx(null);
    setQrPrefill(null);
    setDefaultType(type);
    setDialogOpen(true);
  };

  const openEditDialog = (tx: EditingTransaction) => {
    setEditingTx(tx);
    setDefaultType(tx.type);
    setDialogOpen(true);
  };

  const allTransactions = useMemo(() =>
    transactions
      .map(tx => ({
        id: tx.id, date: tx.date, description: tx.description,
        category: tx.account, subcategory: tx.subcategory,
        type: tx.credit > 0 ? "income" as const : "expense" as const,
        amount: tx.credit > 0 ? tx.credit : tx.debit,
        price: tx.price, quantity: tx.quantity,
        creditor: tx.creditor, notes: tx.notes,
      }))
      .sort((a, b) => b.date.localeCompare(a.date)),
    [transactions]
  );

  const filteredTransactions = filter === "all"
    ? allTransactions
    : allTransactions.filter(t => t.type === filter);

  // Group by type for improved view
  const incomeTransactions = filteredTransactions.filter(t => t.type === "income");
  const expenseTransactions = filteredTransactions.filter(t => t.type === "expense");
  const totalFilteredIncome = incomeTransactions.reduce((s, t) => s + t.amount, 0);
  const totalFilteredExpense = expenseTransactions.reduce((s, t) => s + t.amount, 0);

  const getCategoryLabel = (categoryId: string, subcategoryId?: string) => {
    const cat = getCategoryById(categoryId);
    if (cat) {
      const sub = subcategoryId ? cat.subcategories.find(s => s.id === subcategoryId) : null;
      return {
        label: sub ? `${cat.label} > ${sub.label}` : cat.label,
        icon: cat.icon,
      };
    }
    return { label: categoryId, icon: "📁" };
  };

  const exportData = (): ExportTransaction[] => allTransactions.map(t => ({
    fecha: t.date,
    descripcion: t.description,
    categoria: getCategoryLabel(t.category, t.subcategory).label,
    tipo: t.type === "income" ? "Ingreso" : "Gasto",
    monto: t.type === "income" ? t.amount : -t.amount,
  }));

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Mis Movimientos</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Registra tus ingresos y gastos de forma detallada
          </p>
        </div>
        {transactions.length > 0 && (
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" /> Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { exportToCSV(exportData()); toast.success("Exportando CSV..."); }}>
                  <FileText className="h-4 w-4 mr-2" /> CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={async () => { await exportToExcel(exportData()); toast.success("Exportando Excel..."); }}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { exportToPDF(exportData()); toast.success("Generando PDF..."); }}>
                  <FileText className="h-4 w-4 mr-2" /> PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setConfirmClearOpen(true)}>
              <Trash2 className="h-4 w-4 mr-2" /> Borrar Todo
            </Button>
          </div>
        )}
      </div>

      {/* Quick action cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:border-success/50 transition-colors group" onClick={() => openDialog("income")}>
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
        <Card className="cursor-pointer hover:border-destructive/50 transition-colors group" onClick={() => openDialog("expense")}>
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
            <p className="text-xs text-muted-foreground">Apunta la cámara al código QR de tu factura</p>
          </div>
          <QRReceiptScanner
            onDataScanned={(data) => {
              setEditingTx(null);
              setDefaultType(data.type || "expense");
              setDialogOpen(true);
              setQrPrefill(data);
            }}
            triggerVariant="default" triggerSize="sm"
          />
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Balance</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totals.balance >= 0 ? "text-success" : "text-destructive"}`}>
              ${totals.balance.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-success">+${totals.ingresosDelMes.toFixed(2)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Gastos del Mes</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-destructive">-${totals.gastosDelMes.toFixed(2)}</div></CardContent>
        </Card>
      </div>

      {/* Transactions list with grouping */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Historial</CardTitle>
              <CardDescription>Todos tus movimientos</CardDescription>
            </div>
            <Tabs value={filter} onValueChange={v => setFilter(v as any)}>
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
            <div className="space-y-2">
              {/* Subtotals bar */}
              {filter === "all" && (
                <div className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/50 mb-3">
                  <span className="text-success font-medium">Ingresos: ${totalFilteredIncome.toFixed(2)}</span>
                  <span className="text-destructive font-medium">Gastos: ${totalFilteredExpense.toFixed(2)}</span>
                  <span className={cn("font-bold", totalFilteredIncome - totalFilteredExpense >= 0 ? "text-success" : "text-destructive")}>
                    Neto: ${(totalFilteredIncome - totalFilteredExpense).toFixed(2)}
                  </span>
                </div>
              )}

              {filteredTransactions.map(tx => {
                const cat = getCategoryLabel(tx.category, tx.subcategory);
                return (
                  <div key={tx.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-lg shrink-0">
                      {cat.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{tx.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{tx.date}</span>
                        <span className="inline-flex items-center gap-1"><Tag className="h-3 w-3" />{cat.label}</span>
                        {tx.quantity && tx.quantity !== 1 && (
                          <span className="text-primary">×{tx.quantity}</span>
                        )}
                        {tx.creditor && (
                          <span className="text-muted-foreground">• {tx.creditor}</span>
                        )}
                      </div>
                      {tx.notes && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate italic">📝 {tx.notes}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`font-bold ${tx.type === "income" ? "text-success" : "text-destructive"}`}>
                        {tx.type === "income" ? "+" : "-"}${tx.amount.toFixed(2)}
                      </p>
                      {tx.price && tx.quantity && tx.quantity !== 1 && (
                        <p className="text-[10px] text-muted-foreground">${tx.price.toFixed(2)} × {tx.quantity}</p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={e => { e.stopPropagation(); openEditDialog(tx); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={e => { e.stopPropagation(); handleDelete(tx.id); }}>
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

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) { setEditingTx(null); setQrPrefill(null); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTx ? "Editar Movimiento" : defaultType === "income" ? "Nuevo Ingreso" : "Nuevo Gasto"}
            </DialogTitle>
            <DialogDescription>
              {editingTx ? "Modifica los datos del movimiento" : `Registra un ${defaultType === "income" ? "ingreso" : "gasto"} con detalle`}
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

      {/* Confirm clear all */}
      <AlertDialog open={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              ¿Borrar todos los movimientos?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente todos los movimientos ({transactions.length} en total). No se puede deshacer.
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
