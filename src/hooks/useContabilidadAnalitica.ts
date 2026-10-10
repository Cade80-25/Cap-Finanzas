import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useWalletContext } from "@/contexts/WalletContext";

/** Contabilidad analítica/de costos: centros de costo, dimensiones, reparto de indirectos. v2 · P2 */
export type CostCenterType = "produccion" | "administracion" | "ventas" | "servicio" | "investigacion" | "otro";
export type DimensionType = "producto" | "cliente" | "canal" | "region" | "proyecto" | "departamento";

export interface CostCenter {
  id: string;
  code: string;
  name: string;
  type: CostCenterType;
  responsible?: string;
  budget: number;
  active: boolean;
  createdAt: string;
}

export interface AnalyticalEntry {
  id: string;
  date: string;
  costCenterId: string;
  dimensionType: DimensionType;
  dimensionValue: string;
  description: string;
  amount: number;
  createdAt: string;
}

export interface AllocationRule {
  id: string;
  name: string;
  sourceCenterId: string;
  targetCenterId: string;
  percentage: number;
  active: boolean;
  createdAt: string;
}

const CENTERS_KEY = "cap-finanzas-analitica-centros";
const ENTRIES_KEY = "cap-finanzas-analitica-asientos";
const RULES_KEY = "cap-finanzas-analitica-reglas";

function scoped(base: string, profile?: string, wallet?: string) {
  if (!profile || profile === "profile-default") return `${base}${wallet && wallet !== "wallet-default" ? `-${wallet}` : ""}`;
  return wallet && wallet !== "wallet-default" ? `${base}-${profile}-${wallet}` : `${base}-${profile}-default`;
}

function two(n: number) { return Math.round(n * 100) / 100; }

export function useContabilidadAnalitica() {
  const { activeProfileId, activeWalletId } = useWalletContext();
  const centersKey = scoped(CENTERS_KEY, activeProfileId, activeWalletId);
  const entriesKey = scoped(ENTRIES_KEY, activeProfileId, activeWalletId);
  const rulesKey = scoped(RULES_KEY, activeProfileId, activeWalletId);

  const [centers, setCenters] = useLocalStorage<CostCenter[]>(centersKey, []);
  const [entries, setEntries] = useLocalStorage<AnalyticalEntry[]>(entriesKey, []);
  const [rules, setRules] = useLocalStorage<AllocationRule[]>(rulesKey, []);

  const addCenter = useCallback((data: Omit<CostCenter, "id" | "createdAt">) => {
    const c = { ...data, id: `cc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() };
    setCenters(v => [...v, c]);
    return c;
  }, [setCenters]);

  const updateCenter = useCallback((id: string, patch: Partial<CostCenter>) => {
    setCenters(v => v.map(c => c.id === id ? { ...c, ...patch } : c));
  }, [setCenters]);

  const deleteCenter = useCallback((id: string) => {
    setCenters(v => v.filter(c => c.id !== id));
    setEntries(v => v.filter(e => e.costCenterId !== id));
    setRules(v => v.filter(r => r.sourceCenterId !== id && r.targetCenterId !== id));
  }, [setCenters, setEntries, setRules]);

  const addEntry = useCallback((data: Omit<AnalyticalEntry, "id" | "createdAt">) => {
    const e = { ...data, id: `ae-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() };
    setEntries(v => [...v, e]);
    return e;
  }, [setEntries]);

  const deleteEntry = useCallback((id: string) => {
    setEntries(v => v.filter(e => e.id !== id));
  }, [setEntries]);

  const addRule = useCallback((data: Omit<AllocationRule, "id" | "createdAt">) => {
    const r = { ...data, id: `ar-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() };
    setRules(v => [...v, r]);
    return r;
  }, [setRules]);

  const updateRule = useCallback((id: string, patch: Partial<AllocationRule>) => {
    setRules(v => v.map(r => r.id === id ? { ...r, ...patch } : r));
  }, [setRules]);

  const deleteRule = useCallback((id: string) => {
    setRules(v => v.filter(r => r.id !== id));
  }, [setRules]);

  const centerStats = useMemo(() => {
    const map = new Map<string, { total: number; budget: number; entryCount: number }>();
    for (const c of centers) map.set(c.id, { total: 0, budget: c.budget, entryCount: 0 });
    for (const e of entries) {
      const s = map.get(e.costCenterId);
      if (s) { s.total += e.amount; s.entryCount++; }
    }
    return map;
  }, [centers, entries]);

  const dimensionStats = useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    for (const e of entries) {
      const key = `${e.dimensionType}:${e.dimensionValue}`;
      const inner = map.get(e.dimensionType) ?? new Map<string, number>();
      inner.set(e.dimensionValue, (inner.get(e.dimensionValue) ?? 0) + e.amount);
      map.set(e.dimensionType, inner);
    }
    return map;
  }, [entries]);

  const globalStats = useMemo(() => {
    let total = 0;
    for (const e of entries) total += e.amount;
    return { total: two(total), count: centers.length, entryCount: entries.length, ruleCount: rules.filter(r => r.active).length };
  }, [centers, entries, rules]);

  return {
    centers, addCenter, updateCenter, deleteCenter,
    entries, addEntry, deleteEntry,
    rules, addRule, updateRule, deleteRule,
    centerStats, dimensionStats, globalStats,
  };
}
