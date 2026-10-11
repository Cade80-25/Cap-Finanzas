import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useWalletContext } from "@/contexts/WalletContext";

export type TPVStatus = "abierta" | "cerrada" | "anulada";
export type TPVPayment = "efectivo" | "tarjeta" | "transferencia" | "qr";

export interface TPVTransaction {
  id: string;
  date: string;
  items: { name: string; qty: number; price: number }[];
  subtotal: number;
  tax: number;
  total: number;
  payment: TPVPayment;
  status: TPVStatus;
  cashier?: string;
  notes?: string;
  createdAt: string;
}

const TPV_KEY = "cap-finanzas-tpv";

function scoped(base: string, profile?: string, wallet?: string) {
  if (!profile || profile === "profile-default") return `${base}${wallet && wallet !== "wallet-default" ? `-${wallet}` : ""}`;
  return wallet && wallet !== "wallet-default" ? `${base}-${profile}-${wallet}` : `${base}-${profile}-default`;
}

function two(n: number) { return Math.round(n * 100) / 100; }

export function useTPV() {
  const { activeProfileId, activeWalletId } = useWalletContext();
  const key = scoped(TPV_KEY, activeProfileId, activeWalletId);
  const [transactions, setTransactions] = useLocalStorage<TPVTransaction[]>(key, []);

  const addTransaction = useCallback((data: Omit<TPVTransaction, "id" | "createdAt">) => {
    const t = { ...data, id: `tpv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() };
    setTransactions(v => [...v, t]);
    return t;
  }, [setTransactions]);

  const updateTransaction = useCallback((id: string, patch: Partial<TPVTransaction>) => {
    setTransactions(v => v.map(t => t.id === id ? { ...t, ...patch } : t));
  }, [setTransactions]);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions(v => v.filter(t => t.id !== id));
  }, [setTransactions]);

  const stats = useMemo(() => {
    let totalSales = 0, totalTax = 0, todaySales = 0;
    const today = new Date().toISOString().slice(0, 10);
    for (const t of transactions) {
      if (t.status === "anulada") continue;
      totalSales += t.total; totalTax += t.tax;
      if (t.date === today) todaySales += t.total;
    }
    return { count: transactions.length, totalSales: two(totalSales), totalTax: two(totalTax), todaySales: two(todaySales), open: transactions.filter(t => t.status === "abierta").length };
  }, [transactions]);

  const byPayment = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    for (const t of transactions) {
      if (t.status === "anulada") continue;
      const s = map.get(t.payment);
      if (s) { s.count++; s.total += t.total; }
      else map.set(t.payment, { count: 1, total: t.total });
    }
    return map;
  }, [transactions]);

  return { transactions, addTransaction, updateTransaction, deleteTransaction, stats, byPayment };
}
