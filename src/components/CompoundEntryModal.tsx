import { useState, useMemo } from "react";
import { Plus, Trash2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useJournalTransactions, type JournalLine, type JournalTransaction } from "@/hooks/useJournalTransactions";
import { useAccounts } from "@/hooks/useAccounts";
import { useAccountingData } from "@/hooks/useAccountingData";
import { parseFlexibleNumber } from "@/lib/parse-flexible-number";
import { roundMoney } from "@/lib/numeric-input";
import { toast } from "sonner";

interface CompoundEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface LineEntry {
  id: number;
  account: string;
  debit: string;
  credit: string;
  description: string;
}

export function CompoundEntryModal({ open, onOpenChange }: CompoundEntryModalProps) {
  const { transactions, setTransactions } = useJournalTransactions();
  const { ACCOUNT_CATEGORIES } = useAccountingData();
  const { customAccounts, getAllAccounts } = useAccounts();

  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState<LineEntry[]>([
    { id: 1, account: "", debit: "", credit: "", description: "" },
    { id: 2, account: "", debit: "", credit: "", description: "" },
  ]);

  const allAccounts = useMemo(() => getAllAccounts(ACCOUNT_CATEGORIES), [getAllAccounts, ACCOUNT_CATEGORIES]);

  const totals = useMemo(() => {
    const totalDebit = lines.reduce((sum, l) => sum + parseFlexibleNumber(l.debit, 0), 0);
    const creditDebit = lines.reduce((sum, l) => sum + parseFlexibleNumber(l.credit, 0), 0);
    return {
      totalDebit: roundMoney(totalDebit),
      totalCredit: roundMoney(creditDebit),
      difference: roundMoney(Math.abs(totalDebit - creditDebit)),
      isBalanced: Math.abs(totalDebit - creditDebit) < 0.005,
    };
  }, [lines]);

  const resetForm = () => {
    setDate(new Date().toISOString().split("T")[0]);
    setDescription("");
    setLines([
      { id: Date.now(), account: "", debit: "", credit: "", description: "" },
      { id: Date.now() + 1, account: "", debit: "", credit: "", description: "" },
    ]);
  };

  const addLine = () => {
    setLines([...lines, { id: Date.now(), account: "", debit: "", credit: "", description: "" }]);
  };

  const removeLine = (id: number) => {
    if (lines.length <= 2) {
      toast.error("Un asiento compuesto debe tener al menos 2 líneas");
      return;
    }
    setLines(lines.filter((l) => l.id !== id));
  };

  const updateLine = (id: number, field: keyof LineEntry, value: string) => {
    setLines(lines.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  };

  const handleSave = () => {
    // Validaciones
    if (!date) {
      toast.error("Selecciona una fecha");
      return;
    }

    if (!description.trim()) {
      toast.error("Escribe una descripción general para el asiento");
      return;
    }

    const validLines = lines.filter(
      (l) => l.account && (parseFlexibleNumber(l.debit, 0) > 0 || parseFlexibleNumber(l.credit, 0) > 0)
    );

    if (validLines.length < 2) {
      toast.error("Un asiento compuesto requiere al menos 2 líneas con cuenta y monto");
      return;
    }

    // Verificar que haya al menos un débito y un crédito
    const hasDebit = validLines.some((l) => parseFlexibleNumber(l.debit, 0) > 0);
    const hasCredit = validLines.some((l) => parseFlexibleNumber(l.credit, 0) > 0);

    if (!hasDebit || !hasCredit) {
      toast.error("El asiento debe tener al menos un débito y un crédito");
      return;
    }

    // Verificar balance
    if (!totals.isBalanced) {
      toast.error(`El asiento no está balanceado. Diferencia: $${totals.difference.toFixed(2)}`);
      return;
    }

    // Construir JournalTransaction compuesta
    const journalLines: JournalLine[] = validLines.map((l) => ({
      account: l.account,
      debit: parseFlexibleNumber(l.debit, 0) || undefined,
      credit: parseFlexibleNumber(l.credit, 0) || undefined,
      description: l.description || undefined,
    }));

    const newTransaction: JournalTransaction = {
      id: Date.now(),
      date,
      account: "asiento-compuesto",
      description: description.trim(),
      debit: 0,
      credit: 0,
      lines: journalLines,
      isCompound: true,
      reconciled: false,
    };

    setTransactions([...transactions, newTransaction]);
    toast.success("Asiento compuesto registrado exitosamente");
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Asiento Compuesto
          </DialogTitle>
          <DialogDescription>
            Registra un asiento contable con múltiples líneas (débitos y créditos).
            La suma de débitos debe igualar la suma de créditos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Fecha y descripción general */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="compound-date">Fecha</Label>
              <Input
                id="compound-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="compound-description">Descripción del asiento</Label>
              <Input
                id="compound-description"
                placeholder="Ej: Compra de mercadería con IVA"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Tabla de líneas */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Cuenta</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="w-[120px] text-right">Débito</TableHead>
                  <TableHead className="w-[120px] text-right">Crédito</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>
                      <Select
                        value={line.account}
                        onValueChange={(v) => updateLine(line.id, "account", v)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Cuenta" />
                        </SelectTrigger>
                        <SelectContent>
                          {allAccounts.map((acc) => (
                            <SelectItem key={acc.code} value={acc.code}>
                              {acc.icon && <span className="mr-1">{acc.icon}</span>}
                              {acc.name}
                              {acc.isCustom && (
                                <Badge variant="outline" className="ml-2 text-[10px]">
                                  Custom
                                </Badge>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={line.description}
                        onChange={(e) => updateLine(line.id, "description", e.target.value)}
                        placeholder="Descripción opcional"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={line.debit}
                        onChange={(e) => updateLine(line.id, "debit", e.target.value)}
                        placeholder="0.00"
                        className="text-right"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={line.credit}
                        onChange={(e) => updateLine(line.id, "credit", e.target.value)}
                        placeholder="0.00"
                        className="text-right"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => removeLine(line.id)}
                        disabled={lines.length <= 2}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Botón agregar línea */}
          <Button type="button" variant="outline" size="sm" onClick={addLine}>
            <Plus className="h-4 w-4 mr-1" />
            Agregar línea
          </Button>

          {/* Resumen de totales */}
          <div className="flex justify-end">
            <div className="w-72 space-y-2 rounded-md border p-3 bg-muted/30">
              <div className="flex justify-between text-sm">
                <span>Total Débitos:</span>
                <span className="font-semibold">${totals.totalDebit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Créditos:</span>
                <span className="font-semibold">${totals.totalCredit.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between text-sm font-medium">
                <span>Diferencia:</span>
                <span className={totals.isBalanced ? "text-green-600" : "text-destructive"}>
                  ${totals.difference.toFixed(2)}
                </span>
              </div>
              {totals.isBalanced ? (
                <div className="flex items-center gap-1 text-green-600 text-xs">
                  <CheckCircle2 className="h-3 w-3" />
                  Asiento balanceado
                </div>
              ) : totals.totalDebit > 0 || totals.totalCredit > 0 ? (
                <div className="flex items-center gap-1 text-destructive text-xs">
                  <AlertCircle className="h-3 w-3" />
                  Asiento desbalanceado
                </div>
              ) : null}
            </div>
          </div>

          {/* Alerta si está desbalanceado */}
          {!totals.isBalanced && (totals.totalDebit > 0 || totals.totalCredit > 0) && (
            <Alert className="border-warning bg-warning/10">
              <AlertCircle className="h-4 w-4 text-warning" />
              <AlertDescription>
                El asiento no está balanceado. La suma de débitos (${totals.totalDebit.toFixed(2)}) debe
                igualar la suma de créditos (${totals.totalCredit.toFixed(2)}).
                Diferencia: ${totals.difference.toFixed(2)}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              resetForm();
              onOpenChange(false);
            }}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!totals.isBalanced}>
            Guardar Asiento Compuesto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
