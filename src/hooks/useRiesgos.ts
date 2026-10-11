import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useWalletContext } from "@/contexts/WalletContext";

export type RiskType = "tipo_cambio" | "tipo_interes" | "riesgo_pais" | "comercial" | "credito" | "liquidez" | "operativo";
export type RiskStatus = "identificado" | "mitigado" | "transferido" | "aceptado";

export interface RiskItem {
  id: string;
  type: RiskType;
  description: string;
  probability: "baja" | "media" | "alta";
  impact: "bajo" | "medio" | "alto";
  exposure: number;
  currency: string;
  status: RiskStatus;
  mitigation: string;
  responsible: string;
  identifiedDate: string;
  notes?: string;
  createdAt: string;
}

const RISKS_KEY = "cap-finanzas-riesgos";

function scoped(base: string, profile?: string, wallet?: string) {
  if (!profile || profile === "profile-default") return `${base}${wallet && wallet !== "wallet-default" ? `-${wallet}` : ""}`;
  return wallet && wallet !== "wallet-default" ? `${base}-${profile}-${wallet}` : `${base}-${profile}-default`;
}

function two(n: number) { return Math.round(n * 100) / 100; }

export function useRiesgos() {
  const { activeProfileId, activeWalletId } = useWalletContext();
  const key = scoped(RISKS_KEY, activeProfileId, activeWalletId);
  const [risks, setRisks] = useLocalStorage<RiskItem[]>(key, []);

  const addRisk = useCallback((data: Omit<RiskItem, "id" | "createdAt">) => {
    const r = { ...data, id: `rsk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() };
    setRisks(v => [...v, r]);
    return r;
  }, [setRisks]);

  const updateRisk = useCallback((id: string, patch: Partial<RiskItem>) => {
    setRisks(v => v.map(r => r.id === id ? { ...r, ...patch } : r));
  }, [setRisks]);

  const deleteRisk = useCallback((id: string) => {
    setRisks(v => v.filter(r => r.id !== id));
  }, [setRisks]);

  const stats = useMemo(() => {
    let totalExposure = 0, byProbability = { baja: 0, media: 0, alta: 0 }, byImpact = { bajo: 0, medio: 0, alto: 0 };
    for (const r of risks) {
      if (r.status !== "aceptado") totalExposure += r.exposure;
      byProbability[r.probability]++;
      byImpact[r.impact]++;
    }
    return { total: risks.length, totalExposure: two(totalExposure), byProbability, byImpact, active: risks.filter(r => r.status === "identificado").length };
  }, [risks]);

  const byType = useMemo(() => {
    const map = new Map<string, { count: number; exposure: number }>();
    for (const r of risks) {
      const s = map.get(r.type);
      if (s) { s.count++; s.exposure += r.exposure; }
      else map.set(r.type, { count: 1, exposure: r.exposure });
    }
    return map;
  }, [risks]);

  return { risks, addRisk, updateRisk, deleteRisk, stats, byType };
}
