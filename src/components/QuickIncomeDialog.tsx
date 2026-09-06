import { useState } from "react";
import { TrendingUp } from "lucide-react";
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

// Cuentas de tipo ingreso disponibles para el ingreso rápido
const INCOME_ACCOUNTS = [
  { id: "ingresos-operativos", label: "Ingresos Operativos" },
  { id: "ingresos-financieros", label: "Ingresos Financieros" },
  { id: "ventas", label: "Ventas" },
  { id: "honorarios", label: "Honorarios" },
  { id: "otros-ingresos", label: "Otros Ingresos" },
];

/**
 * Diálogo de "Ingreso Rápido": un solo paso.
 * Abre un diálogo mínimo (monto + descripción) y crea la transacción de ingreso
 * de inmediato (cuenta ingresos-operativos, credit=monto).
 */
export function QuickIncomeDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { transactions, setTransactions } = useJournalTransactions();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [account, setAccount] = useState("ingresos-operativos");

  const reset = () => {
    setAmount("");
    setDescription("");
    setAccount("ingresos-operativos");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFlexibleNumber(amount);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Ingresa un monto válido mayor a cero");
      return;
    }

    const date = new Date().toISOString().split("T")[0];
    const selected = INCOME_ACCOUNTS.find((a) => a.id === account);
    const label = selected?.label || "Ingresos Operativos";

    const newTransaction = {
      id: Date.now(),
      date,
      account,
      description: description.trim() || label,
      debit: 0,
      credit: value,
      reconciled: false,
    };

    setTransactions([...transactions, newTransaction]);
    toast.success(`Ingreso registrado: $${value.toFixed(2)}`);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-success" />
            Ingreso Rápido
          </DialogTitle>
          <DialogDescription>
            Registra un ingreso en un solo paso. Solo necesitas el monto y la descripción.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quick-income-amount">Monto</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <Input
                id="quick-income-amount"
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
            <Label htmlFor="quick-income-description">Descripción</Label>
            <Input
              id="quick-income-description"
              type="text"
              placeholder="Ej: Sueldo, venta, honorarios..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quick-income-account">Categoría (opcional)</Label>
            <Select value={account} onValueChange={setAccount}>
              <SelectTrigger id="quick-income-account" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INCOME_ACCOUNTS.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" variant="default">
            <TrendingUp className="h-4 w-4 mr-2" />
            Registrar Ingreso
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}