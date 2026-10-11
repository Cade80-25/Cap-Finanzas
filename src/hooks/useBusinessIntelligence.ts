import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useWalletContext } from "@/contexts/WalletContext";

export type BIReportType = "ventas" | "gastos" | "flujo" | "margen" | "rentabilidad" | "custom";
export type BIReportStatus = "programado" | "ejecutado" | "fallido";

export interface BIReport {
  id: string;
  name: string;
  type: BIReportType;
  status: BIReportStatus;
  frequency: "diario" | "semanal" | "mensual" | "trimestral";
  lastRun?: string;
  nextRun?: string;
  config: string;
  notes?: string;
  createdAt: string;
}

const BI_KEY = "cap-finanzas-bi";

function scoped(base: string, profile?: string, wallet?: string) {
  if (!profile || profile === "profile-default") return `${base}${wallet && wallet !== "wallet-default" ? `-${wallet}` : ""}`;
  return wallet && wallet !== "wallet-default" ? `${base}-${profile}-${wallet}` : `${base}-${profile}-default`;
}

export function useBusinessIntelligence() {
  const { activeProfileId, activeWalletId } = useWalletContext();
  const key = scoped(BI_KEY, activeProfileId, activeWalletId);
  const [reports, setReports] = useLocalStorage<BIReport[]>(key, []);

  const addReport = useCallback((data: Omit<BIReport, "id" | "createdAt">) => {
    const r = { ...data, id: `bi-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() };
    setReports(v => [...v, r]);
    return r;
  }, [setReports]);

  const updateReport = useCallback((id: string, patch: Partial<BIReport>) => {
    setReports(v => v.map(r => r.id === id ? { ...r, ...patch } : r));
  }, [setReports]);

  const deleteReport = useCallback((id: string) => {
    setReports(v => v.filter(r => r.id !== id));
  }, [setReports]);

  const stats = useMemo(() => {
    return { count: reports.length, scheduled: reports.filter(r => r.status === "programado").length, executed: reports.filter(r => r.status === "ejecutado").length, failed: reports.filter(r => r.status === "fallido").length };
  }, [reports]);

  const byType = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of reports) {
      map.set(r.type, (map.get(r.type) || 0) + 1);
    }
    return map;
  }, [reports]);

  return { reports, addReport, updateReport, deleteReport, stats, byType };
}
