import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useWalletContext } from "@/contexts/WalletContext";

/** Seguros: pólizas, coberturas, siniestros, vencimientos. v2 · P3 */
export type InsuranceStatus = "activa" | "pendiente" | "vencida" | "cancelada";
export type InsuranceType = "auto" | "hogar" | "comercio" | "responsabilidad_civil" | "vida" | "salud" | "carga" | "otro";

export interface InsurancePolicy {
  id: string;
  number: string;
  insurer: string;
  type: InsuranceType;
  description: string;
  coverage: number;
  premium: number;
  currency: string;
  startDate: string;
  expiryDate: string;
  status: InsuranceStatus;
  beneficiary?: string;
  notes?: string;
  createdAt: string;
}

export interface InsuranceClaim {
  id: string;
  policyId: string;
  date: string;
  description: string;
  amount: number;
  status: "reportado" | "en_evaluacion" | "aprobado" | "rechazado" | "pagado";
  paidDate?: string;
  notes?: string;
  createdAt: string;
}

const POLICIES_KEY = "cap-finanzas-seguros-polizas";
const CLAIMS_KEY = "cap-finanzas-seguros-siniestros";

function scoped(base: string, profile?: string, wallet?: string) {
  if (!profile || profile === "profile-default") return `${base}${wallet && wallet !== "wallet-default" ? `-${wallet}` : ""}`;
  return wallet && wallet !== "wallet-default" ? `${base}-${profile}-${wallet}` : `${base}-${profile}-default`;
}

function two(n: number) { return Math.round(n * 100) / 100; }

export function useSeguros() {
  const { activeProfileId, activeWalletId } = useWalletContext();
  const policiesKey = scoped(POLICIES_KEY, activeProfileId, activeWalletId);
  const claimsKey = scoped(CLAIMS_KEY, activeProfileId, activeWalletId);

  const [policies, setPolicies] = useLocalStorage<InsurancePolicy[]>(policiesKey, []);
  const [claims, setClaims] = useLocalStorage<InsuranceClaim[]>(claimsKey, []);

  const addPolicy = useCallback((data: Omit<InsurancePolicy, "id" | "createdAt">) => {
    const p = { ...data, id: `ins-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() };
    setPolicies(v => [...v, p]);
    return p;
  }, [setPolicies]);

  const updatePolicy = useCallback((id: string, patch: Partial<InsurancePolicy>) => {
    setPolicies(v => v.map(p => p.id === id ? { ...p, ...patch } : p));
  }, [setPolicies]);

  const deletePolicy = useCallback((id: string) => {
    setPolicies(v => v.filter(p => p.id !== id));
    setClaims(v => v.filter(c => c.policyId !== id));
  }, [setPolicies, setClaims]);

  const addClaim = useCallback((data: Omit<InsuranceClaim, "id" | "createdAt">) => {
    const c = { ...data, id: `clm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() };
    setClaims(v => [...v, c]);
    return c;
  }, [setClaims]);

  const updateClaim = useCallback((id: string, patch: Partial<InsuranceClaim>) => {
    setClaims(v => v.map(c => c.id === id ? { ...c, ...patch } : c));
  }, [setClaims]);

  const deleteClaim = useCallback((id: string) => {
    setClaims(v => v.filter(c => c.id !== id));
  }, [setClaims]);

  const stats = useMemo(() => {
    let totalPremium = 0, totalCoverage = 0, pendingClaims = 0;
    const today = new Date().toISOString().slice(0, 10);
    for (const p of policies) {
      if (p.status === "activa") { totalPremium += p.premium; totalCoverage += p.coverage; }
    }
    for (const c of claims) {
      if (c.status !== "pagado" && c.status !== "rechazado") pendingClaims++;
    }
    return { totalPremium: two(totalPremium), totalCoverage: two(totalCoverage), pendingClaims, activePolicies: policies.filter(p => p.status === "activa").length, expiringSoon: policies.filter(p => p.status === "activa" && p.expiryDate <= new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)).length };
  }, [policies, claims]);

  const byType = useMemo(() => {
    const map = new Map<string, { count: number; premium: number; coverage: number }>();
    for (const p of policies) {
      const s = map.get(p.type);
      if (s) { s.count++; s.premium += p.premium; s.coverage += p.coverage; }
      else map.set(p.type, { count: 1, premium: p.premium, coverage: p.coverage });
    }
    return map;
  }, [policies]);

  return { policies, addPolicy, updatePolicy, deletePolicy, claims, addClaim, updateClaim, deleteClaim, stats, byType };
}
