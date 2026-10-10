import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useWalletContext } from "@/contexts/WalletContext";

/** Calidad: planes de control, no conformidades, acciones correctivas, trazabilidad. v2 · P3 */
export type QualityStatus = "abierta" | "en_revision" | "accion_correctiva" | "verificada" | "cerrada";
export type QualityType = "no_conformidad" | "accion_preventiva" | "accion_correctiva" | "mejora" | "inspeccion";
export type QualityPriority = "baja" | "media" | "alta" | "critica";

export interface QualityRecord {
  id: string;
  code: string;
  type: QualityType;
  priority: QualityPriority;
  description: string;
  area: string;
  responsible: string;
  rootCause?: string;
  correctiveAction?: string;
  status: QualityStatus;
  openedDate: string;
  targetDate: string;
  closedDate?: string;
  verifiedBy?: string;
  notes?: string;
  createdAt: string;
}

export interface QualityControlPlan {
  id: string;
  name: string;
  area: string;
  frequency: "diaria" | "semanal" | "mensual" | "trimestral";
  checklist: string[];
  active: boolean;
  createdAt: string;
}

const RECORDS_KEY = "cap-finanzas-calidad";
const PLANS_KEY = "cap-finanzas-calidad-planes";

function scoped(base: string, profile?: string, wallet?: string) {
  if (!profile || profile === "profile-default") return `${base}${wallet && wallet !== "wallet-default" ? `-${wallet}` : ""}`;
  return wallet && wallet !== "wallet-default" ? `${base}-${profile}-${wallet}` : `${base}-${profile}-default`;
}

export function useCalidad() {
  const { activeProfileId, activeWalletId } = useWalletContext();
  const recordsKey = scoped(RECORDS_KEY, activeProfileId, activeWalletId);
  const plansKey = scoped(PLANS_KEY, activeProfileId, activeWalletId);

  const [records, setRecords] = useLocalStorage<QualityRecord[]>(recordsKey, []);
  const [plans, setPlans] = useLocalStorage<QualityControlPlan[]>(plansKey, []);

  const addRecord = useCallback((data: Omit<QualityRecord, "id" | "createdAt">) => {
    const r = { ...data, id: `qua-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() };
    setRecords(v => [...v, r]);
    return r;
  }, [setRecords]);

  const updateRecord = useCallback((id: string, patch: Partial<QualityRecord>) => {
    setRecords(v => v.map(r => r.id === id ? { ...r, ...patch } : r));
  }, [setRecords]);

  const deleteRecord = useCallback((id: string) => {
    setRecords(v => v.filter(r => r.id !== id));
  }, [setRecords]);

  const addPlan = useCallback((data: Omit<QualityControlPlan, "id" | "createdAt">) => {
    const p = { ...data, id: `qpl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() };
    setPlans(v => [...v, p]);
    return p;
  }, [setPlans]);

  const updatePlan = useCallback((id: string, patch: Partial<QualityControlPlan>) => {
    setPlans(v => v.map(p => p.id === id ? { ...p, ...patch } : p));
  }, [setPlans]);

  const deletePlan = useCallback((id: string) => {
    setPlans(v => v.filter(p => p.id !== id));
  }, [setPlans]);

  const stats = useMemo(() => {
    const open = records.filter(r => r.status === "abierta" || r.status === "en_revision");
    const critical = records.filter(r => r.priority === "critica" && r.status !== "cerrada");
    const overdue = records.filter(r => r.targetDate < new Date().toISOString().slice(0, 10) && r.status !== "cerrada" && r.status !== "verificada");
    return { total: records.length, open: open.length, critical: critical.length, overdue: overdue.length, closed: records.filter(r => r.status === "cerrada" || r.status === "verificada").length };
  }, [records]);

  const byArea = useMemo(() => {
    const map = new Map<string, { total: number; open: number }>();
    for (const r of records) {
      const s = map.get(r.area);
      if (s) { s.total++; if (r.status === "abierta" || r.status === "en_revision") s.open++; }
      else map.set(r.area, { total: 1, open: r.status === "abierta" || r.status === "en_revision" ? 1 : 0 });
    }
    return map;
  }, [records]);

  return { records, addRecord, updateRecord, deleteRecord, plans, addPlan, updatePlan, deletePlan, stats, byArea };
}
