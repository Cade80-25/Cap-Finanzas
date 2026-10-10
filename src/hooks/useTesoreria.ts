import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useWalletContext } from "@/contexts/WalletContext";

/** Gestión de Tesorería: posición de caja, flujos previstos, encaje, inversión de excedentes. v2 · P2 */
export type CashFlowDirection = "in" | "out";
export type CashFlowStatus = "previsto" | "confirmado" | "ejecutado";

export interface CashAccount {
  id: string;
  code: string;
  name: string;
  type: "caja" | "banco" | "inversion";
  currency: string;
  balance: number;
  minimumReserve: number; // encaje mínimo
  createdAt: string;
}

export interface CashFlow {
  id: string;
  date: string;
  direction: CashFlowDirection;
  description: string;
  amount: number;
  accountId?: string;
  category: "cobro" | "pago" | "impuesto" | "nomina" | "inversion" | "otro";
  status: CashFlowStatus;
  createdAt: string;
}

export interface TreasuryPosition {
  id: string;
  date: string;
  totalCash: number;
  totalReserve: number;
  surplus: number;
  notes?: string;
  createdAt: string;
}

const ACCOUNTS_KEY = "cap-finanzas-tesoreria-cuentas";
const FLOWS_KEY = "cap-finanzas-tesoreria-flujos";
const POSITIONS_KEY = "cap-finanzas-tesoreria-posiciones";

function scoped(base: string, profile?: string, wallet?: string) {
  if (!profile || profile === "profile-default") return `${base}${wallet && wallet !== "wallet-default" ? `-${wallet}` : ""}`;
  return wallet && wallet !== "wallet-default" ? `${base}-${profile}-${wallet}` : `${base}-${profile}-default`;
}

function two(n: number) { return Math.round(n * 100) / 100; }

export function useTesoreria() {
  const { activeProfileId, activeWalletId } = useWalletContext();
  const accountsKey = scoped(ACCOUNTS_KEY, activeProfileId, activeWalletId);
  const flowsKey = scoped(FLOWS_KEY, activeProfileId, activeWalletId);
  const positionsKey = scoped(POSITIONS_KEY, activeProfileId, activeWalletId);

  const [accounts, setAccounts] = useLocalStorage<CashAccount[]>(accountsKey, []);
  const [flows, setFlows] = useLocalStorage<CashFlow[]>(flowsKey, []);
  const [positions, setPositions] = useLocalStorage<TreasuryPosition[]>(positionsKey, []);

  const addAccount = useCallback((data: Omit<CashAccount, "id" | "createdAt">) => {
    const a = { ...data, id: `tes-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() };
    setAccounts(v => [...v, a]);
    return a;
  }, [setAccounts]);

  const updateAccount = useCallback((id: string, patch: Partial<CashAccount>) => {
    setAccounts(v => v.map(a => a.id === id ? { ...a, ...patch } : a));
  }, [setAccounts]);

  const deleteAccount = useCallback((id: string) => {
    setAccounts(v => v.filter(a => a.id !== id));
    setFlows(v => v.filter(f => f.accountId !== id));
  }, [setAccounts, setFlows]);

  const addFlow = useCallback((data: Omit<CashFlow, "id" | "createdAt">) => {
    const f = { ...data, id: `flw-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() };
    setFlows(v => [...v, f]);
    return f;
  }, [setFlows]);

  const updateFlow = useCallback((id: string, patch: Partial<CashFlow>) => {
    setFlows(v => v.map(f => f.id === id ? { ...f, ...patch } : f));
  }, [setFlows]);

  const deleteFlow = useCallback((id: string) => {
    setFlows(v => v.filter(f => f.id !== id));
  }, [setFlows]);

  const addPosition = useCallback((data: Omit<TreasuryPosition, "id" | "createdAt">) => {
    const p = { ...data, id: `pos-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() };
    setPositions(v => [...v, p]);
    return p;
  }, [setPositions]);

  const deletePosition = useCallback((id: string) => {
    setPositions(v => v.filter(p => p.id !== id));
  }, [setPositions]);

  const stats = useMemo(() => {
    let totalCash = 0, totalReserve = 0;
    for (const a of accounts) { totalCash += a.balance; totalReserve += a.minimumReserve; }
    let inflow = 0, outflow = 0, pendingIn = 0, pendingOut = 0;
    for (const f of flows) {
      if (f.direction === "in") { inflow += f.amount; if (f.status !== "ejecutado") pendingIn += f.amount; }
      else { outflow += f.amount; if (f.status !== "ejecutado") pendingOut += f.amount; }
    }
    const surplus = totalCash - totalReserve;
    return {
      totalCash: two(totalCash),
      totalReserve: two(totalReserve),
      surplus: two(surplus),
      inflow: two(inflow),
      outflow: two(outflow),
      pendingIn: two(pendingIn),
      pendingOut: two(pendingOut),
      projected: two(totalCash + pendingIn - pendingOut),
      accountCount: accounts.length,
      flowCount: flows.length,
      coverageRatio: totalReserve > 0 ? two(totalCash / totalReserve) : 0,
    };
  }, [accounts, flows]);

  // Flujo proyectado por mes (próximos 6 meses)
  const projectedByMonth = useMemo(() => {
    const map = new Map<string, { in: number; out: number }>();
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map.set(key, { in: 0, out: 0 });
    }
    for (const f of flows) {
      const key = f.date.slice(0, 7);
      const entry = map.get(key);
      if (entry) { if (f.direction === "in") entry.in += f.amount; else entry.out += f.amount; }
    }
    return map;
  }, [flows]);

  return {
    accounts, addAccount, updateAccount, deleteAccount,
    flows, addFlow, updateFlow, deleteFlow,
    positions, addPosition, deletePosition,
    stats, projectedByMonth,
  };
}
