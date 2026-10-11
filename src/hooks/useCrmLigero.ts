import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useWalletContext } from "@/contexts/WalletContext";

export type LeadStatus = "nuevo" | "contactado" | "calificado" | "propuesta" | "ganado" | "perdido";
export type LeadSource = "web" | "referido" | "redes" | "feria" | "otro";

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: LeadStatus;
  source: LeadSource;
  value: number;
  probability: number;
  expectedDate: string;
  notes?: string;
  createdAt: string;
}

const LEADS_KEY = "cap-finanzas-crm";

function scoped(base: string, profile?: string, wallet?: string) {
  if (!profile || profile === "profile-default") return `${base}${wallet && wallet !== "wallet-default" ? `-${wallet}` : ""}`;
  return wallet && wallet !== "wallet-default" ? `${base}-${profile}-${wallet}` : `${base}-${profile}-default`;
}

function two(n: number) { return Math.round(n * 100) / 100; }

export function useCrmLigero() {
  const { activeProfileId, activeWalletId } = useWalletContext();
  const key = scoped(LEADS_KEY, activeProfileId, activeWalletId);
  const [leads, setLeads] = useLocalStorage<Lead[]>(key, []);

  const addLead = useCallback((data: Omit<Lead, "id" | "createdAt">) => {
    const l = { ...data, id: `led-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() };
    setLeads(v => [...v, l]);
    return l;
  }, [setLeads]);

  const updateLead = useCallback((id: string, patch: Partial<Lead>) => {
    setLeads(v => v.map(l => l.id === id ? { ...l, ...patch } : l));
  }, [setLeads]);

  const deleteLead = useCallback((id: string) => {
    setLeads(v => v.filter(l => l.id !== id));
  }, [setLeads]);

  const stats = useMemo(() => {
    let pipelineValue = 0, wonValue = 0;
    for (const l of leads) {
      if (l.status !== "perdido" && l.status !== "ganado") pipelineValue += l.value;
      if (l.status === "ganado") wonValue += l.value;
    }
    return { count: leads.length, pipelineValue: two(pipelineValue), wonValue: two(wonValue), new: leads.filter(l => l.status === "nuevo").length, conversion: leads.length ? Math.round((leads.filter(l => l.status === "ganado").length / leads.length) * 100) : 0 };
  }, [leads]);

  const byStatus = useMemo(() => {
    const map = new Map<string, { count: number; value: number }>();
    for (const l of leads) {
      const s = map.get(l.status);
      if (s) { s.count++; s.value += l.value; }
      else map.set(l.status, { count: 1, value: l.value });
    }
    return map;
  }, [leads]);

  return { leads, addLead, updateLead, deleteLead, stats, byStatus };
}
