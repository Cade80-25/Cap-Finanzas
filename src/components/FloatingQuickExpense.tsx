import { useState } from "react";
import { Zap, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { useJournalTransactions } from "@/hooks/useJournalTransactions";
import { parseFlexibleNumber } from "@/lib/parse-flexible-number";
import { sanitizeNumericInput } from "@/lib/numeric-input";
import { toast } from "sonner";

// Cuentas de tipo gasto disponibles para el gasto rápido
const EXPENSE_ACCOUNTS = [
  { id: "gastos-operativos", label: "Gastos Operativos" },
  { id: "gastos-financieros", label: "Gastos Financieros" },
  { id: "costo-ventas", label: "Costo de Ventas" },
  { id: "depreciacion", label: "Depreciación" },
  { id: "amortizacion", label: "Amortización" },
];

/**
 * Botón flotante de "Gasto Rápido": un solo paso.
 * Abre un diálogo mínimo (monto + descripción) y crea la transacción de gasto
 * de inmediato con valores por defecto razonables (cuenta gastos-operativos, debit=monto).
 */
export function FloatingQuickExpense() {
  const { transactions, setTransactions } = useJournalTransactions();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [account, setAccount] = useState("gastos-operativos");

  const reset = () => {
    setAmount("");
    setDescription("");
    setAccount("gastos-operativos");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFlexibleNumber(amount);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Ingresa un monto válido mayor a cero");
      return;
    }

    const date = new Date().toISOString().split("T")[0];
    const selected = EXPENSE_ACCOUNTS.find((a) => a.id === account);
    const label = selected?.label || "Gastos Operativos";

    const newTransaction = {
      id: Date.now(),
      date,
      account,
      description: description.trim() || label,
      debit: value,
      credit: 0,
      reconciled: false,
    };

    setTransactions([...transactions, newTransaction]);
    toast.success(`Gasto registrado: $${value.toFixed(2)}`);
    reset();
    setOpen(false);
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="icon"
        aria-label="Gasto rápido"
        className="fixed bottom-24 right-6 z-40 h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all bg-destructive hover:bg-destructive/90"
      >
        <Zap className="h-5 w-5" aria-hidden="true" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-destructive" />
              Gasto Rápido
            </DialogTitle>
            <DialogDescription>
              Registra un gasto en un solo paso. Solo necesitas el monto y la descripción.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quick-expense-amount">Monto</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  id="quick-expense-amount"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  className="pl-7 text-lg font-semibold h-12"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(sanitizeNumericInput(e.target.value))}
                  autoFocus
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quick-expense-description">Descripción</Label>
              <Input
                id="quick-expense-description"
                type="text"
                placeholder="Ej: Compra supermercado, combustible..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quick-expense-account">Categoría (opcional)</Label>
              <Select value={account} onValueChange={setAccount}>
                <SelectTrigger id="quick-expense-account" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_ACCOUNTS.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" variant="destructive">
              <TrendingDown className="h-4 w-4 mr-2" />
              Registrar Gasto
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}