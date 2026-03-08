import { useState } from "react";
import { Plus, AlertCircle, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { useJournalTransactions, type JournalTransaction } from "@/hooks/useJournalTransactions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ContextualHelp, AccountSelectionHelp } from "@/components/ContextualHelp";

type Transaction = JournalTransaction;

// Sistema inteligente de validación de transacciones
const validateTransaction = (account: string, description: string, debit: number, credit: number) => {
  const suggestions: Array<{ message: string; suggestedAccount: string; suggestedDebit: number; suggestedCredit: number }> = [];
  
  // Reglas de validación contable
  const incomeKeywords = ['salario', 'venta', 'ingreso', 'cobro', 'ganancia', 'interés'];
  const expenseKeywords = ['gasto', 'pago', 'factura', 'compra', 'servicios', 'supermercado', 'alquiler', 'renta'];
  
  const desc = description.toLowerCase();
  
  // Validar Ingresos
  if (incomeKeywords.some(keyword => desc.includes(keyword))) {
    if (!account.includes('ingreso') && debit > 0) {
      suggestions.push({
        message: "Detectamos un ingreso. Se recomienda registrarlo en 'Ingresos' con un Haber (crédito).",
        suggestedAccount: "ingresos",
        suggestedDebit: 0,
        suggestedCredit: debit
      });
    }
  }
  
  // Validar Gastos
  if (expenseKeywords.some(keyword => desc.includes(keyword))) {
    if (!account.includes('gasto') && credit > 0) {
      suggestions.push({
        message: "Detectamos un gasto. Se recomienda registrarlo en 'Gastos Operativos' con un Debe (débito).",
        suggestedAccount: "gastos-operativos",
        suggestedDebit: credit,
        suggestedCredit: 0
      });
    }
  }
  
  // Validar que Debe y Haber no estén ambos vacíos o ambos llenos
  if (debit > 0 && credit > 0) {
    suggestions.push({
      message: "Una transacción no puede tener valores en Debe y Haber simultáneamente. Use solo uno.",
      suggestedAccount: account,
      suggestedDebit: debit,
      suggestedCredit: 0
    });
  }
  
  if (debit === 0 && credit === 0) {
    suggestions.push({
      message: "Debe ingresar un monto en Debe o Haber.",
      suggestedAccount: account,
      suggestedDebit: 0,
      suggestedCredit: 0
    });
  }
  
  return suggestions;
};

export default function LibroDiario() {
  const [open, setOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  
  const [date, setDate] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [description, setDescription] = useState("");
  const [debit, setDebit] = useState<number>(0);
  const [credit, setCredit] = useState<number>(0);
  const [validationSuggestions, setValidationSuggestions] = useState<
    Array<{
      message: string;
      suggestedAccount: string;
      suggestedDebit: number;
      suggestedCredit: number;
    }>
  >([]);

  const { transactions, setTransactions } = useJournalTransactions();

  const resetForm = () => {
    setValidationSuggestions([]);
    setSelectedAccount("");
    setDescription("");
    setDebit(0);
    setCredit(0);
    setDate("");
    setEditingTransaction(null);
  };

  const hasBlockingError = (d: number, c: number) => (d === 0 && c === 0) || (d > 0 && c > 0);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen && !editingTransaction) {
      setDate((prev) => prev || new Date().toISOString().slice(0, 10));
    }
    if (!nextOpen) {
      resetForm();
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setDate(transaction.date);
    setSelectedAccount(transaction.account);
    setDescription(transaction.description);
    setDebit(transaction.debit);
    setCredit(transaction.credit);
    setOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!transactionToDelete) return;
    
    setTransactions((prev) => prev.filter((t) => t.id !== transactionToDelete.id));
    toast.success("Transacción eliminada");
    setDeleteDialogOpen(false);
    setTransactionToDelete(null);
  };

  const handleDelete = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setDeleteDialogOpen(true);
  };


  const handleSave = () => {
    if (!date) {
      toast.error("Selecciona una fecha");
      return;
    }
    if (!selectedAccount) {
      toast.error("Selecciona una cuenta");
      return;
    }
    if (!description.trim()) {
      toast.error("Escribe una descripción");
      return;
    }
    if (hasBlockingError(debit, credit)) {
      toast.error(
        debit > 0 && credit > 0
          ? "Usa solo Debe o Haber (no ambos)"
          : "Ingresa un monto en Debe o Haber"
      );
      return;
    }

    if (editingTransaction) {
      // Update existing transaction
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === editingTransaction.id
            ? {
                ...t,
                date,
                account: selectedAccount,
                description: description.trim(),
                debit,
                credit,
              }
            : t
        ).sort((a, b) => a.date.localeCompare(b.date))
      );
      toast.success("Transacción actualizada");
    } else {
      // Create new transaction
      const newTx: Transaction = {
        id: Date.now(),
        date,
        account: selectedAccount,
        description: description.trim(),
        debit,
        credit,
      };

      setTransactions((prev) =>
        [...prev, newTx].sort((a, b) => a.date.localeCompare(b.date))
      );
      toast.success("Transacción registrada exitosamente");
    }

    setOpen(false);
    resetForm();
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div data-tutorial="diario-title">
          <h1 className="text-3xl font-bold mb-2">Libro Diario</h1>
          <p className="text-muted-foreground">
            Registro cronológico de todas las transacciones
          </p>
        </div>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button data-tutorial="diario-new-btn" className="bg-gradient-primary shadow-soft">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Transacción
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingTransaction ? "Editar Transacción" : "Registrar Transacción"}
              </DialogTitle>
              <DialogDescription>
                {editingTransaction 
                  ? "Modifica los detalles de la transacción"
                  : "Ingresa los detalles de la nueva transacción contable"}
              </DialogDescription>
            </DialogHeader>
            
            {/* Account selection help */}
            <AccountSelectionHelp className="my-2" />
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="date">Fecha</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="account">Cuenta</Label>
                <Select 
                  value={selectedAccount}
                  onValueChange={(value) => {
                    setSelectedAccount(value);
                    const suggestions = validateTransaction(value, description, debit, credit);
                    setValidationSuggestions(suggestions);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una cuenta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo-corriente">Activo Corriente</SelectItem>
                    <SelectItem value="activo-no-corriente">Activo No Corriente</SelectItem>
                    <SelectItem value="pasivo-corriente">Pasivo Corriente</SelectItem>
                    <SelectItem value="pasivo-no-corriente">Pasivo No Corriente</SelectItem>
                    <SelectItem value="patrimonio">Patrimonio</SelectItem>
                    <SelectItem value="ingresos">Ingresos</SelectItem>
                    <SelectItem value="gastos-operativos">Gastos Operativos</SelectItem>
                    <SelectItem value="gastos-financieros">Gastos Financieros</SelectItem>
                    <SelectItem value="costo-ventas">Costo de Ventas</SelectItem>
                    <SelectItem value="banco">Banco</SelectItem>
                    <SelectItem value="caja">Caja</SelectItem>
                    <SelectItem value="cuentas-por-cobrar">Cuentas por Cobrar</SelectItem>
                    <SelectItem value="cuentas-por-pagar">Cuentas por Pagar</SelectItem>
                    <SelectItem value="inventarios">Inventarios</SelectItem>
                    <SelectItem value="depreciacion">Depreciación</SelectItem>
                    <SelectItem value="amortizacion">Amortización</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Descripción (o escribe tu propia categoría)</Label>
                <Input 
                  id="description" 
                  placeholder="Ej: Pago de renta, Ingreso por ventas, etc."
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    const suggestions = validateTransaction(selectedAccount, e.target.value, debit, credit);
                    setValidationSuggestions(suggestions);
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="debit">Debe ($)</Label>
                  <Input 
                    id="debit" 
                    type="number" 
                    placeholder="0.00"
                    value={debit || ""}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      setDebit(value);
                      const suggestions = validateTransaction(selectedAccount, description, value, credit);
                      setValidationSuggestions(suggestions);
                    }}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="credit">Haber ($)</Label>
                  <Input 
                    id="credit" 
                    type="number" 
                    placeholder="0.00"
                    value={credit || ""}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      setCredit(value);
                      const suggestions = validateTransaction(selectedAccount, description, debit, value);
                      setValidationSuggestions(suggestions);
                    }}
                  />
                </div>
              </div>
              
              {validationSuggestions.length > 0 && (
                <Alert className="border-warning bg-warning/10">
                  <AlertCircle className="h-4 w-4 text-warning" />
                  <AlertDescription>
                    <div className="space-y-2">
                      {validationSuggestions.map((suggestion, index) => (
                        <div key={index}>
                          <p className="font-medium text-warning">{suggestion.message}</p>
                          {suggestion.suggestedAccount && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2"
                              onClick={() => {
                                setSelectedAccount(suggestion.suggestedAccount);
                                setDebit(suggestion.suggestedDebit);
                                setCredit(suggestion.suggestedCredit);
                                toast.success("Corrección aplicada automáticamente");
                                setValidationSuggestions([]);
                              }}
                            >
                              Aplicar Corrección
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
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
              <Button onClick={handleSave}>
                {editingTransaction ? "Actualizar" : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar transacción?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la transacción 
              "{transactionToDelete?.description}" del {transactionToDelete?.date}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card data-tutorial="diario-table" className="shadow-soft">
        <CardHeader>
          <CardTitle>Asientos Contables</CardTitle>
          <CardDescription>
            Todas las operaciones registradas en orden cronológico
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cuenta</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead data-tutorial="diario-debe-haber" className="text-right">Debe</TableHead>
                  <TableHead className="text-right">Haber</TableHead>
                  <TableHead className="text-right w-24">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{transaction.date}</TableCell>
                    <TableCell>{transaction.account}</TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell className="text-right font-medium text-success">
                      {transaction.debit > 0 ? `$${transaction.debit.toFixed(2)}` : "-"}
                    </TableCell>
                    <TableCell className="text-right font-medium text-destructive">
                      {transaction.credit > 0 ? `$${transaction.credit.toFixed(2)}` : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(transaction)}
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(transaction)}
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground">
              No hay transacciones registradas. Agrega tu primera transacción.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
