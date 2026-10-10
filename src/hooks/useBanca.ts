import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useWalletContext } from "@/contexts/WalletContext";

/**
 * Banca: cuentas bancarias, conciliación de extractos y movimientos.
 * v2 · P2
 */

export interface BankAccount {
  id: string;
  code: string;
  name: string;
  bank: string;
  cbu: string;
  currency: string;
  initialBalance: number;
  currentBalance: number;
  type: "corriente" | "ahorro" | "inversion";
  active: boolean;
  createdAt: string;
}

export interface BankTransaction {
  id: string;
  accountId: string;
  date: string;
  description: string;
  amount: number;
  reference?: string;
  categoryId?: string;
  notes?: string;
  reconciled: boolean;
  extractRef?: string; // referencia del extracto bancario
  createdAt: string;
}

export interface ReconciliationRecord {
  id: string;
  accountId: string;
  period: string; // yyyy-mm
  bookBalance: number;
  bankBalance: number;
  difference: number;
  matched: number;
  unmatched: number;
  adjustments: number;
  notes?: string;
  createdAt: string;
}

const ACCOUNTS_KEY = "cap-finanzas-banca-accounts";
const TRANSACTIONS_KEY = "cap-finanzas-banca-transactions";
const RECONCILIATIONS_KEY = "cap-finanzas-banca-reconciliations";

function scoped(base: string, profile?: string, wallet?: string) {
  if (!profile || profile === "profile-default") return `${base}${wallet && wallet !== "wallet-default" ? `-${wallet}` : ""}`;
  return wallet && wallet !== "wallet-default" ? `${base}-${profile}-${wallet}` : `${base}-${profile}-default`;
}

function two(n: number) { return Math.round(n * 100) / 100; }

export function useBanca() {
  const { activeProfileId, activeWalletId } = useWalletContext();
  const accountsKey = scoped(ACCOUNTS_KEY, activeProfileId, activeWalletId);
  const transactionsKey = scoped(TRANSACTIONS_KEY, activeProfileId, activeWalletId);
  const reconciliationsKey = scoped(RECONCILIATIONS_KEY, activeProfileId, activeWalletId);

  const [accounts, setAccounts] = useLocalStorage<BankAccount[]>(accountsKey, []);
  const [transactions, setTransactions] = useLocalStorage<BankTransaction[]>(transactionsKey, []);
  const [reconciliations, setReconciliations] = useLocalStorage<ReconciliationRecord[]>(reconciliationsKey, []);

  const addAccount = useCallback((data: Omit<BankAccount, "id" | "createdAt" | "currentBalance">) => {
    const account = { ...data, id: `cta-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, currentBalance: data.initialBalance, createdAt: new Date().toISOString() };
    setAccounts(v => [...v, account]);
    return account;
  }, [setAccounts]);

  const updateAccount = useCallback((id: string, patch: Partial<BankAccount>) => {
    setAccounts(v => v.map(x => x.id === id ? { ...x, ...patch } : x));
  }, [setAccounts]);

  const deleteAccount = useCallback((id: string) => {
    setAccounts(v => v.filter(x => x.id !== id));
    setTransactions(v => v.filter(t => t.accountId !== id));
    setReconciliations(v => v.filter(r => r.accountId !== id));
  }, [setAccounts, setTransactions, setReconciliations]);

  const addTransaction = useCallback((data: Omit<BankTransaction, "id" | "createdAt" | "reconciled">) => {
    const tx = { ...data, id: `ban-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, reconciled: false, createdAt: new Date().toISOString() };
    setTransactions(v => [...v, tx]);
    setAccounts(v => v.map(a => a.id === data.accountId ? { ...a, currentBalance: two(a.currentBalance + data.amount) } : a));
    return tx;
  }, [setTransactions, setAccounts]);

  const updateTransaction = useCallback((id: string, patch: Partial<BankTransaction>) => {
    setTransactions(v => v.map(t => t.id === id ? { ...t, ...patch } : t));
  }, [setTransactions]);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions(v => v.filter(t => t.id !== id));
  }, [setTransactions]);

  const reconcileTransaction = useCallback((id: string, reconciled: boolean) => {
    setTransactions(v => v.map(t => t.id === id ? { ...t, reconciled } : t));
  }, [setTransactions]);

  const addReconciliation = useCallback((data: Omit<ReconciliationRecord, "id" | "createdAt">) => {
    const rec = { ...data, id: `rec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() };
    setReconciliations(v => [...v, rec]);
    return rec;
  }, [setReconciliations]);

  const deleteReconciliation = useCallback((id: string) => {
    setReconciliations(v => v.filter(r => r.id !== id));
  }, [setReconciliations]);

  const accountStats = useMemo(() => {
    let totalBalance = 0;
    let totalIn = 0;
    let totalOut = 0;
    for (const a of accounts) totalBalance += a.currentBalance;
    for (const t of transactions) {
      if (t.amount >= 0) totalIn += t.amount;
      else totalOut += Math.abs(t.amount);
    }
    return {
      totalBalance: two(totalBalance),
      totalIn: two(totalIn),
      totalOut: two(totalOut),
      count: accounts.length,
      transactionCount: transactions.length,
      unreconciled: transactions.filter(t => !t.reconciled).length,
    };
  }, [accounts, transactions]);

  const byAccount = useMemo(() => {
    const map = new Map<string, BankTransaction[]>();
    for (const t of transactions) {
      const arr = map.get(t.accountId);
      if (arr) arr.push(t);
      else map.set(t.accountId, [t]);
    }
    return map;
  }, [transactions]);

  return {
    accounts, addAccount, updateAccount, deleteAccount,
    transactions, addTransaction, updateTransaction, deleteTransaction,
    reconcileTransaction,
    reconciliations, addReconciliation, deleteReconciliation,
    accountStats, byAccount,
  };
}
