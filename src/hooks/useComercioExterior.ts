import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useWalletContext } from "@/contexts/WalletContext";

export type TradeType = "importacion" | "exportacion";
export type TradeStatus = "cotizacion" | "en_transito" | "aduana" | "entregado" | "cancelado";
export type Incoterm = "FOB" | "CIF" | "EXW" | "DDP" | "FCA" | "CFR" | "DAP";

export interface TradeOperation {
  id: string;
  type: TradeType;
  description: string;
  status: TradeStatus;
  incoterm: Incoterm;
  origin: string;
  destination: string;
  amount: number;
  currency: string;
  customsDuties: number;
  freightCost: number;
  insuranceCost: number;
  expectedDate: string;
  broker?: string;
  notes?: string;
  createdAt: string;
}

const TRADE_KEY = "cap-finanzas-comercio";

function scoped(base: string, profile?: string, wallet?: string) {
  if (!profile || profile === "profile-default") return `${base}${wallet && wallet !== "wallet-default" ? `-${wallet}` : ""}`;
  return wallet && wallet !== "wallet-default" ? `${base}-${profile}-${wallet}` : `${base}-${profile}-default`;
}

function two(n: number) { return Math.round(n * 100) / 100; }

export function useComercioExterior() {
  const { activeProfileId, activeWalletId } = useWalletContext();
  const key = scoped(TRADE_KEY, activeProfileId, activeWalletId);
  const [operations, setOperations] = useLocalStorage<TradeOperation[]>(key, []);

  const addOperation = useCallback((data: Omit<TradeOperation, "id" | "createdAt">) => {
    const o = { ...data, id: `trd-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() };
    setOperations(v => [...v, o]);
    return o;
  }, [setOperations]);

  const updateOperation = useCallback((id: string, patch: Partial<TradeOperation>) => {
    setOperations(v => v.map(o => o.id === id ? { ...o, ...patch } : o));
  }, [setOperations]);

  const deleteOperation = useCallback((id: string) => {
    setOperations(v => v.filter(o => o.id !== id));
  }, [setOperations]);

  const stats = useMemo(() => {
    let totalAmount = 0, totalDuties = 0, totalFreight = 0;
    for (const o of operations) {
      totalAmount += o.amount; totalDuties += o.customsDuties; totalFreight += o.freightCost;
    }
    return { count: operations.length, totalAmount: two(totalAmount), totalDuties: two(totalDuties), totalFreight: two(totalFreight), active: operations.filter(o => o.status !== "entregado" && o.status !== "cancelado").length };
  }, [operations]);

  const byType = useMemo(() => {
    const map = new Map<string, { count: number; amount: number }>();
    for (const o of operations) {
      const s = map.get(o.type);
      if (s) { s.count++; s.amount += o.amount; }
      else map.set(o.type, { count: 1, amount: o.amount });
    }
    return map;
  }, [operations]);

  return { operations, addOperation, updateOperation, deleteOperation, stats, byType };
}
