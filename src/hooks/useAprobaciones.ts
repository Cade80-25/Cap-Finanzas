import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useWalletContext } from "@/contexts/WalletContext";

/** Flujos de Aprobación: solicitudes, aprobaciones, rechazos. v2 · P3 */
export type ApprovalStatus = "pendiente" | "aprobado" | "rechazado" | "observado";
export type ApprovalType = "gasto" | "pago" | "orden_compra" | "presupuesto" | "contrato" | "otro";

export interface ApprovalRequest {
  id: string;
  type: ApprovalType;
  title: string;
  description: string;
  amount: number;
  currency: string;
  requester: string;
  approver: string;
  status: ApprovalStatus;
  requestDate: string;
  decisionDate?: string;
  notes?: string;
  createdAt: string;
}

const REQUESTS_KEY = "cap-finanzas-aprobaciones";

function scoped(base: string, profile?: string, wallet?: string) {
  if (!profile || profile === "profile-default") return `${base}${wallet && wallet !== "wallet-default" ? `-${wallet}` : ""}`;
  return wallet && wallet !== "wallet-default" ? `${base}-${profile}-${wallet}` : `${base}-${profile}-default`;
}

function two(n: number) { return Math.round(n * 100) / 100; }

export function useAprobaciones() {
  const { activeProfileId, activeWalletId } = useWalletContext();
  const key = scoped(REQUESTS_KEY, activeProfileId, activeWalletId);
  const [requests, setRequests] = useLocalStorage<ApprovalRequest[]>(key, []);

  const addRequest = useCallback((data: Omit<ApprovalRequest, "id" | "createdAt" | "status" | "requestDate">) => {
    const r = { ...data, id: `apr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, status: "pendiente" as ApprovalStatus, requestDate: new Date().toISOString().slice(0, 10), createdAt: new Date().toISOString() };
    setRequests(v => [...v, r]);
    return r;
  }, [setRequests]);

  const approve = useCallback((id: string, notes?: string) => {
    setRequests(v => v.map(r => r.id === id ? { ...r, status: "aprobado", decisionDate: new Date().toISOString().slice(0, 10), notes: notes || r.notes } : r));
  }, [setRequests]);

  const reject = useCallback((id: string, notes?: string) => {
    setRequests(v => v.map(r => r.id === id ? { ...r, status: "rechazado", decisionDate: new Date().toISOString().slice(0, 10), notes: notes || r.notes } : r));
  }, [setRequests]);

  const deleteRequest = useCallback((id: string) => {
    setRequests(v => v.filter(r => r.id !== id));
  }, [setRequests]);

  const stats = useMemo(() => {
    let pending = 0, pendingAmount = 0;
    for (const r of requests) {
      if (r.status === "pendiente") { pending++; pendingAmount += r.amount; }
    }
    return { total: requests.length, pending, pendingAmount: two(pendingAmount), approved: requests.filter(r => r.status === "aprobado").length, rejected: requests.filter(r => r.status === "rechazado").length };
  }, [requests]);

  const byType = useMemo(() => {
    const map = new Map<string, { count: number; amount: number }>();
    for (const r of requests) {
      const s = map.get(r.type);
      if (s) { s.count++; s.amount += r.amount; }
      else map.set(r.type, { count: 1, amount: r.amount });
    }
    return map;
  }, [requests]);

  return { requests, addRequest, approve, reject, deleteRequest, stats, byType };
}
