import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useWalletContext } from "@/contexts/WalletContext";

/** Auditoría y Control Interno: checklist, hallazgos, planes de acción. v2 · P3 */
export type AuditStatus = "planificada" | "en_ejecucion" | "completada" | "cancelada";
export type FindingSeverity = "baja" | "media" | "alta" | "critica";
export type FindingStatus = "abierto" | "en_progreso" | "mitigado" | "cerrado";

export interface Audit {
  id: string;
  name: string;
  area: string;
  auditor: string;
  startDate: string;
  endDate?: string;
  status: AuditStatus;
  notes?: string;
  createdAt: string;
}

export interface AuditFinding {
  id: string;
  auditId: string;
  title: string;
  description: string;
  severity: FindingSeverity;
  recommendation: string;
  responsible: string;
  dueDate: string;
  status: FindingStatus;
  /** Impacto económico estimado del hallazgo (opcional) — si > 0 se provisiona en el diario. */
  economicImpact?: number;
  closedDate?: string;
  notes?: string;
  createdAt: string;
}

const AUDITS_KEY = "cap-finanzas-auditoria-auditorias";
const FINDINGS_KEY = "cap-finanzas-auditoria-hallazgos";

function scoped(base: string, profile?: string, wallet?: string) {
  if (!profile || profile === "profile-default") return `${base}${wallet && wallet !== "wallet-default" ? `-${wallet}` : ""}`;
  return wallet && wallet !== "wallet-default" ? `${base}-${profile}-${wallet}` : `${base}-${profile}-default`;
}

export function useAuditoria() {
  const { activeProfileId, activeWalletId } = useWalletContext();
  const auditsKey = scoped(AUDITS_KEY, activeProfileId, activeWalletId);
  const findingsKey = scoped(FINDINGS_KEY, activeProfileId, activeWalletId);

  const [audits, setAudits] = useLocalStorage<Audit[]>(auditsKey, []);
  const [findings, setFindings] = useLocalStorage<AuditFinding[]>(findingsKey, []);

  const addAudit = useCallback((data: Omit<Audit, "id" | "createdAt">) => {
    const a = { ...data, id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() };
    setAudits(v => [...v, a]);
    return a;
  }, [setAudits]);

  const updateAudit = useCallback((id: string, patch: Partial<Audit>) => {
    setAudits(v => v.map(a => a.id === id ? { ...a, ...patch } : a));
  }, [setAudits]);

  const deleteAudit = useCallback((id: string) => {
    setAudits(v => v.filter(a => a.id !== id));
    setFindings(v => v.filter(f => f.auditId !== id));
  }, [setAudits, setFindings]);

  const addFinding = useCallback((data: Omit<AuditFinding, "id" | "createdAt">) => {
    const f = { ...data, id: `fnd-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() };
    setFindings(v => [...v, f]);
    return f;
  }, [setFindings]);

  const updateFinding = useCallback((id: string, patch: Partial<AuditFinding>) => {
    setFindings(v => v.map(f => f.id === id ? { ...f, ...patch } : f));
  }, [setFindings]);

  const deleteFinding = useCallback((id: string) => {
    setFindings(v => v.filter(f => f.id !== id));
  }, [setFindings]);

  const stats = useMemo(() => {
    let open = 0, critical = 0, overdue = 0;
    const today = new Date().toISOString().slice(0, 10);
    for (const f of findings) {
      if (f.status === "abierto" || f.status === "en_progreso") open++;
      if (f.severity === "critica" && f.status !== "cerrado" && f.status !== "mitigado") critical++;
      if (f.dueDate < today && f.status !== "cerrado" && f.status !== "mitigado") overdue++;
    }
    return { totalFindings: findings.length, open, critical, overdue, closed: findings.filter(f => f.status === "cerrado" || f.status === "mitigado").length, audits: audits.length };
  }, [findings, audits]);

  const bySeverity = useMemo(() => {
    const map = new Map<string, number>();
    for (const f of findings) {
      map.set(f.severity, (map.get(f.severity) ?? 0) + 1);
    }
    return map;
  }, [findings]);

  return { audits, addAudit, updateAudit, deleteAudit, findings, addFinding, updateFinding, deleteFinding, stats, bySeverity };
}
