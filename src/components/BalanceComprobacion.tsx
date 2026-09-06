import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useJournalTransactions,
  isCompoundTransaction,
  type JournalTransaction,
} from "@/hooks/useJournalTransactions";
import { useAccountingData } from "@/hooks/useAccountingData";
import { useAccounts } from "@/hooks/useAccounts";
import { roundMoney } from "@/lib/numeric-input";

type TrialBalanceRow = {
  code: string;
  label: string;
  totalDebit: number;
  totalCredit: number;
  deudor: number;
  acreedor: number;
};

const fmt = (v: number): string => `$${roundMoney(v).toFixed(2)}`;

export function BalanceComprobacion() {
  const { transactions } = useJournalTransactions();
  const { ACCOUNT_CATEGORIES } = useAccountingData();
  const { getAllAccounts } = useAccounts();

  const accountMeta = useMemo(() => {
    const map: Record<string, { label: string; icon?: string }> = {};
    for (const acc of getAllAccounts(ACCOUNT_CATEGORIES)) {
      map[acc.code] = { label: acc.name, icon: acc.icon };
    }
    return map;
  }, [getAllAccounts, ACCOUNT_CATEGORIES]);

  const rows = useMemo<TrialBalanceRow[]>(() => {
    const map: Record<string, TrialBalanceRow> = {};

    const ensure = (code: string): TrialBalanceRow => {
      if (!map[code]) {
        const meta = accountMeta[code];
        const cat = ACCOUNT_CATEGORIES[code];
        map[code] = {
          code,
          label: meta?.label || cat?.label || code,
          totalDebit: 0,
          totalCredit: 0,
          deudor: 0,
          acreedor: 0,
        };
      }
      return map[code];
    };

    for (const tx of transactions as JournalTransaction[]) {
      if (isCompoundTransaction(tx)) {
        for (const line of tx.lines ?? []) {
          const row = ensure(line.account);
          row.totalDebit += line.debit ?? 0;
          row.totalCredit += line.credit ?? 0;
        }
      } else {
        const row = ensure(tx.account);
        row.totalDebit += tx.debit ?? 0;
        row.totalCredit += tx.credit ?? 0;
      }
    }

    for (const row of Object.values(map)) {
      const balance = row.totalDebit - row.totalCredit;
      if (balance > 0) {
        row.deudor = balance;
      } else if (balance < 0) {
        row.acreedor = Math.abs(balance);
      }
    }

    return Object.values(map).sort((a, b) => a.label.localeCompare(b.label));
  }, [transactions, ACCOUNT_CATEGORIES, accountMeta]);

  const totals = useMemo(() => {
    const totalDebit = rows.reduce((sum, r) => sum + r.totalDebit, 0);
    const totalCredit = rows.reduce((sum, r) => sum + r.totalCredit, 0);
    const totalDeudor = rows.reduce((sum, r) => sum + r.deudor, 0);
    const totalAcreedor = rows.reduce((sum, r) => sum + r.acreedor, 0);
    return { totalDebit, totalCredit, totalDeudor, totalAcreedor };
  }, [rows]);

  const isBalanced = Math.abs(totals.totalDebit - totals.totalCredit) < 0.005;

  if (rows.length === 0) {
    return (
      <Card className="shadow-soft">
        <CardContent className="flex items-center justify-center h-[200px] text-muted-foreground">
          No hay transacciones registradas. Agrega asientos en el Libro Diario para generar el Balance de Comprobación.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-2">
        <CardTitle>Balance de Comprobación</CardTitle>
        <div
          className={`flex items-center gap-1.5 text-sm font-medium ${
            isBalanced ? "text-success" : "text-destructive"
          }`}
        >
          {isBalanced ? (
            <>
              <CheckCircle2 className="h-4 w-4" /> Sumas iguales — libro balanceado
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4" /> Sumas desiguales — revisar asientos
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cuenta</TableHead>
              <TableHead className="text-right">Suma Debe</TableHead>
              <TableHead className="text-right">Suma Haber</TableHead>
              <TableHead className="text-right">Deudor</TableHead>
              <TableHead className="text-right">Acreedor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.code} className="hover:bg-muted/50">
                <TableCell className="font-medium">
                  <span className="block">{row.label}</span>
                  <span className="font-mono text-xs text-muted-foreground">{row.code}</span>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.totalDebit > 0 ? fmt(row.totalDebit) : "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.totalCredit > 0 ? fmt(row.totalCredit) : "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums text-success">
                  {row.deudor > 0 ? fmt(row.deudor) : "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums text-destructive">
                  {row.acreedor > 0 ? fmt(row.acreedor) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow className="font-bold">
              <TableCell>TOTALES</TableCell>
              <TableCell className="text-right tabular-nums">{fmt(totals.totalDebit)}</TableCell>
              <TableCell className="text-right tabular-nums">{fmt(totals.totalCredit)}</TableCell>
              <TableCell className="text-right tabular-nums text-success">
                {fmt(totals.totalDeudor)}
              </TableCell>
              <TableCell className="text-right tabular-nums text-destructive">
                {fmt(totals.totalAcreedor)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}

export default BalanceComprobacion;