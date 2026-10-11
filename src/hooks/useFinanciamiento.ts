import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useWalletContext } from "@/contexts/WalletContext";

export type FinancingType = "bonos" | "acciones" | "prestamo" | "leasing" | "capital_riesgo" | "subsidio";
export type FinancingStatus = "activo" | "pagado" | "vencido" | "default";

export interface FinancingItem {
  id: string;
  type: FinancingType;
  description: string;
  amount: number;
  rate: number;
  termMonths: number;
  startDate: string;
  endDate: string;
  status: FinancingStatus;
  lender?: string;
  monthlyPayment?: number;
  currency: string;
  notes?: string;
  createdAt: string;
}

const FINANCING_KEY = "cap-finanzas-financiamiento";

function scoped(base: string, profile?: string, wallet?: string) {
  if (!profile || profile === "profile-default") return `${base}${wallet && wallet !== "wallet-default" ? `-${wallet}` : ""}`;
  return wallet && wallet !== "wallet-default" ? `${base}-${profile}-${wallet}` : `${base}-${profile}-default`;
}

function two(n: number) { return Math.round(n * 100) / 100; }

export function useFinanciamiento() {
  const { activeProfileId, activeWalletId } = useWalletContext();
  const key = scoped(FINANCING_KEY, activeProfileId, activeWalletId);
  const [financings, setFinancings] = useLocalStorage<FinancingItem[]>(key, []);

  const addFinancing = useCallback((data: Omit<FinancingItem, "id" | "createdAt">) => {
    const f = { ...data, id: `fin-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() };
    setFinancings(v => [...v, f]);
    return f;
  }, [setFinancings]);

  const updateFinancing = useCallback((id: string, patch: Partial<FinancingItem>) => {
    setFinancings(v => v.map(f => f.id === id ? { ...f, ...patch } : f));
  }, [setFinancings]);

  const deleteFinancing = useCallback((id: string) => {
    setFinancings(v => v.filter(f => f.id !== id));
  }, [setFinancings]);

  const stats = useMemo(() => {
    let totalAmount = 0, totalMonthly = 0;
    for (const f of financings) {
      if (f.status === "activo") { totalAmount += f.amount; if (f.monthlyPayment) totalMonthly += f.monthlyPayment; }
    }
    return { count: financings.length, totalAmount: two(totalAmount), totalMonthly: two(totalMonthly), active: financings.filter(f => f.status === "activo").length };
  }, [financings]);

  const byType = useMemo(() => {
    const map = new Map<string, { count: number; amount: number }>();
    for (const f of financings) {
      const s = map.get(f.type);
      if (s) { s.count++; s.amount += f.amount; }
      else map.set(f.type, { count: 1, amount: f.amount });
    }
    return map;
  }, [financings]);

  return { financings, addFinancing, updateFinancing, deleteFinancing, stats, byType };
}
