import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useWalletContext } from "@/contexts/WalletContext";

export type StartupStage = "idea" | "mvp" | "crecimiento" | "escala" | "exit";
export type StartupStatus = "activa" | "pausada" | "cerrada" | "adquirida";

export interface Startup {
  id: string;
  name: string;
  description: string;
  stage: StartupStage;
  status: StartupStatus;
  mrr: number;
  arr: number;
  churn: number;
  runway: number;
  burnRate: number;
  valuation: number;
  founded: string;
  employees: number;
  sector: string;
  notes?: string;
  createdAt: string;
}

const STARTUPS_KEY = "cap-finanzas-startups";

function scoped(base: string, profile?: string, wallet?: string) {
  if (!profile || profile === "profile-default") return `${base}${wallet && wallet !== "wallet-default" ? `-${wallet}` : ""}`;
  return wallet && wallet !== "wallet-default" ? `${base}-${profile}-${wallet}` : `${base}-${profile}-default`;
}

function two(n: number) { return Math.round(n * 100) / 100; }

export function useStartups() {
  const { activeProfileId, activeWalletId } = useWalletContext();
  const key = scoped(STARTUPS_KEY, activeProfileId, activeWalletId);
  const [startups, setStartups] = useLocalStorage<Startup[]>(key, []);

  const addStartup = useCallback((data: Omit<Startup, "id" | "createdAt">) => {
    const s = { ...data, id: `stp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() };
    setStartups(v => [...v, s]);
    return s;
  }, [setStartups]);

  const updateStartup = useCallback((id: string, patch: Partial<Startup>) => {
    setStartups(v => v.map(s => s.id === id ? { ...s, ...patch } : s));
  }, [setStartups]);

  const deleteStartup = useCallback((id: string) => {
    setStartups(v => v.filter(s => s.id !== id));
  }, [setStartups]);

  const stats = useMemo(() => {
    let totalMrr = 0, totalArr = 0, totalValuation = 0;
    for (const s of startups) {
      if (s.status === "activa") { totalMrr += s.mrr; totalArr += s.arr; totalValuation += s.valuation; }
    }
    return { count: startups.length, totalMrr: two(totalMrr), totalArr: two(totalArr), totalValuation: two(totalValuation), active: startups.filter(s => s.status === "activa").length };
  }, [startups]);

  const byStage = useMemo(() => {
    const map = new Map<string, { count: number; mrr: number }>();
    for (const s of startups) {
      const st = map.get(s.stage);
      if (st) { st.count++; st.mrr += s.mrr; }
      else map.set(s.stage, { count: 1, mrr: s.mrr });
    }
    return map;
  }, [startups]);

  return { startups, addStartup, updateStartup, deleteStartup, stats, byStage };
}
