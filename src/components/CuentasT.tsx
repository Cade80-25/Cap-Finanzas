import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useJournalTransactions,
  isCompoundTransaction,
  type JournalTransaction,
} from "@/hooks/useJournalTransactions";
import { useAccountingData } from "@/hooks/useAccountingData";
import { useAccounts } from "@/hooks/useAccounts";
import { roundMoney } from "@/lib/numeric-input";

type Movement = {
  date: string;
  description: string;
  debit: number;
  credit: number;
};

type TAccount = {
  code: string;
  label: string;
  type: string;
  icon?: string;
  isCustom?: boolean;
  movements: Movement[];
  totalDebit: number;
  totalCredit: number;
  balance: number;
};

const fmt = (v: number): string => `$${roundMoney(v).toFixed(2)}`;

export function CuentasT() {
  const { transactions } = useJournalTransactions();
  const { ACCOUNT_CATEGORIES } = useAccountingData();
  const { getAllAccounts } = useAccounts();

  const accountMeta = useMemo(() => {
    const map: Record<string, { label: string; type: string; icon?: string; isCustom?: boolean }> = {};
    for (const acc of getAllAccounts(ACCOUNT_CATEGORIES)) {
      map[acc.code] = { label: acc.name, type: acc.type, icon: acc.icon, isCustom: acc.isCustom };
    }
    return map;
  }, [getAllAccounts, ACCOUNT_CATEGORIES]);

  const accounts = useMemo<TAccount[]>(() => {
    const map: Record<string, TAccount> = {};

    const ensure = (code: string): TAccount => {
      if (!map[code]) {
        const meta = accountMeta[code];
        const cat = ACCOUNT_CATEGORIES[code];
        map[code] = {
          code,
          label: meta?.label || cat?.label || code,
          type: meta?.type || cat?.type || "activo",
          icon: meta?.icon || cat?.icon,
          isCustom: meta?.isCustom,
          movements: [],
          totalDebit: 0,
          totalCredit: 0,
          balance: 0,
        };
      }
      return map[code];
    };

    const pushMovement = (code: string, m: Movement) => {
      const acc = ensure(code);
      acc.movements.push(m);
      acc.totalDebit += m.debit;
      acc.totalCredit += m.credit;
    };

    for (const tx of transactions as JournalTransaction[]) {
      if (isCompoundTransaction(tx)) {
        for (const line of tx.lines ?? []) {
          pushMovement(line.account, {
            date: tx.date,
            description: line.description || tx.description,
            debit: line.debit ?? 0,
            credit: line.credit ?? 0,
          });
        }
      } else {
        pushMovement(tx.account, {
          date: tx.date,
          description: tx.description,
          debit: tx.debit ?? 0,
          credit: tx.credit ?? 0,
        });
      }
    }

    // Calcular saldo neto por cuenta
    for (const acc of Object.values(map)) {
      acc.balance = acc.totalDebit - acc.totalCredit;
    }

    return Object.values(map).sort((a, b) => a.label.localeCompare(b.label));
  }, [transactions, ACCOUNT_CATEGORIES, accountMeta]);

  if (accounts.length === 0) {
    return (
      <Card className="shadow-soft">
        <CardContent className="flex items-center justify-center h-[200px] text-muted-foreground">
          No hay cuentas con movimientos. Registra transacciones en el Libro Diario para ver las Cuentas T.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {accounts.map((account) => (
          <Card key={account.code} className="shadow-soft">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                {account.icon && <span className="text-lg">{account.icon}</span>}
                <CardTitle className="text-lg">{account.label}</CardTitle>
                {account.isCustom && (
                  <Badge variant="outline" className="text-[10px]">
                    Custom
                  </Badge>
                )}
              </div>
              <CardDescription className="font-mono text-xs">
                {account.code} · Tipo: {account.type}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-hidden">
                <div className="grid grid-cols-2 text-center text-sm font-semibold bg-muted/60 border-b">
                  <div className="py-1.5 text-success border-r">DÉBITO</div>
                  <div className="py-1.5 text-destructive">CRÉDITO</div>
                </div>
                <div className="grid grid-cols-2">
                  <div className="border-r">
                    {account.movements
                      .filter((m) => m.debit > 0)
                      .map((m, i) => (
                        <div
                          key={`d-${i}`}
                          className="px-2 py-1.5 border-b text-sm flex items-center justify-between gap-1"
                        >
                          <span className="text-muted-foreground tabular-nums text-xs truncate">
                            {m.date}
                          </span>
                          <span className="tabular-nums text-success">{fmt(m.debit)}</span>
                        </div>
                      ))}
                  </div>
                  <div>
                    {account.movements
                      .filter((m) => m.credit > 0)
                      .map((m, i) => (
                        <div
                          key={`c-${i}`}
                          className="px-2 py-1.5 border-b text-sm flex items-center justify-between gap-1"
                        >
                          <span className="text-muted-foreground tabular-nums text-xs truncate">
                            {m.date}
                          </span>
                          <span className="tabular-nums text-destructive">{fmt(m.credit)}</span>
                        </div>
                      ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 text-sm font-bold bg-muted/40 border-t">
                  <div className="px-2 py-2 text-right tabular-nums text-success border-r">
                    {fmt(account.totalDebit)}
                  </div>
                  <div className="px-2 py-2 text-right tabular-nums text-destructive">
                    {fmt(account.totalCredit)}
                  </div>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between rounded-md bg-gradient-card border border-border px-3 py-2">
                <span className="text-sm text-muted-foreground">Saldo neto</span>
                <span
                  className={`font-bold tabular-nums ${
                    account.balance >= 0 ? "text-success" : "text-destructive"
                  }`}
                >
                  {account.balance >= 0 ? "" : "-"}
                  {fmt(Math.abs(account.balance))}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default CuentasT;