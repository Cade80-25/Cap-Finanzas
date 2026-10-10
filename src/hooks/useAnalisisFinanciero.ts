import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useWalletContext } from "@/contexts/WalletContext";

/** Análisis Financiero y Ratios: KPIs, benchmarking, tendencias, scorecards. v2 · P2 */
export type RatioCategory = "rentabilidad" | "liquidez" | "solvencia" | "eficiencia" | "valor";

export interface FinancialRatio {
  id: string;
  name: string;
  category: RatioCategory;
  formula: string;
  value: number;
  unit: "porcentaje" | "veces" | "dias" | "ratio";
  target: number;
  period: string; // "2024-Q3", "2024-09", etc.
  createdAt: string;
}

export interface BenchmarkEntry {
  id: string;
  ratioName: string;
  companyValue: number;
  industryAvg: number;
  industryBest: number;
  period: string;
  createdAt: string;
}

export interface ScorecardItem {
  id: string;
  name: string;
  weight: number; // 0-100
  score: number; // 0-100
  target: number;
  category: RatioCategory;
  createdAt: string;
}

const RATIOS_KEY = "cap-finanzas-ratios";
const BENCH_KEY = "cap-finanzas-benchmarks";
const SCORECARD_KEY = "cap-finanzas-scorecard";

function scoped(base: string, profile?: string, wallet?: string) {
  if (!profile || profile === "profile-default") return `${base}${wallet && wallet !== "wallet-default" ? `-${wallet}` : ""}`;
  return wallet && wallet !== "wallet-default" ? `${base}-${profile}-${wallet}` : `${base}-${profile}-default`;
}

function two(n: number) { return Math.round(n * 100) / 100; }

export function useAnalisisFinanciero() {
  const { activeProfileId, activeWalletId } = useWalletContext();
  const ratiosKey = scoped(RATIOS_KEY, activeProfileId, activeWalletId);
  const benchKey = scoped(BENCH_KEY, activeProfileId, activeWalletId);
  const scoreKey = scoped(SCORECARD_KEY, activeProfileId, activeWalletId);

  const [ratios, setRatios] = useLocalStorage<FinancialRatio[]>(ratiosKey, []);
  const [benchmarks, setBenchmarks] = useLocalStorage<BenchmarkEntry[]>(benchKey, []);
  const [scorecard, setScorecard] = useLocalStorage<ScorecardItem[]>(scoreKey, []);

  const addRatio = useCallback((data: Omit<FinancialRatio, "id" | "createdAt">) => {
    const r = { ...data, id: `rat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() };
    setRatios(v => [...v, r]);
    return r;
  }, [setRatios]);

  const updateRatio = useCallback((id: string, patch: Partial<FinancialRatio>) => {
    setRatios(v => v.map(r => r.id === id ? { ...r, ...patch } : r));
  }, [setRatios]);

  const deleteRatio = useCallback((id: string) => {
    setRatios(v => v.filter(r => r.id !== id));
  }, [setRatios]);

  const addBenchmark = useCallback((data: Omit<BenchmarkEntry, "id" | "createdAt">) => {
    const b = { ...data, id: `ben-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() };
    setBenchmarks(v => [...v, b]);
    return b;
  }, [setBenchmarks]);

  const deleteBenchmark = useCallback((id: string) => {
    setBenchmarks(v => v.filter(b => b.id !== id));
  }, [setBenchmarks]);

  const addScorecardItem = useCallback((data: Omit<ScorecardItem, "id" | "createdAt">) => {
    const s = { ...data, id: `sco-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() };
    setScorecard(v => [...v, s]);
    return s;
  }, [setScorecard]);

  const updateScorecardItem = useCallback((id: string, patch: Partial<ScorecardItem>) => {
    setScorecard(v => v.map(s => s.id === id ? { ...s, ...patch } : s));
  }, [setScorecard]);

  const deleteScorecardItem = useCallback((id: string) => {
    setScorecard(v => v.filter(s => s.id !== id));
  }, [setScorecard]);

  const categoryStats = useMemo(() => {
    const map = new Map<RatioCategory, { count: number; avg: number; onTarget: number }>();
    for (const cat of ["rentabilidad", "liquidez", "solvencia", "eficiencia", "valor"] as RatioCategory[]) {
      map.set(cat, { count: 0, avg: 0, onTarget: 0 });
    }
    for (const r of ratios) {
      const s = map.get(r.category);
      if (s) { s.count++; s.avg += r.value; if (r.value >= r.target) s.onTarget++; }
    }
    for (const s of map.values()) if (s.count > 0) s.avg = two(s.avg / s.count);
    return map;
  }, [ratios]);

  const weightedScore = useMemo(() => {
    let totalWeight = 0, weightedSum = 0;
    for (const s of scorecard) { totalWeight += s.weight; weightedSum += s.score * s.weight; }
    return totalWeight > 0 ? two(weightedSum / totalWeight) : 0;
  }, [scorecard]);

  const globalStats = useMemo(() => {
    return {
      ratioCount: ratios.length,
      benchmarkCount: benchmarks.length,
      scorecardCount: scorecard.length,
      weightedScore,
      onTargetPct: ratios.length > 0 ? two((ratios.filter(r => r.value >= r.target).length / ratios.length) * 100) : 0,
    };
  }, [ratios, benchmarks, scorecard, weightedScore]);

  return {
    ratios, addRatio, updateRatio, deleteRatio,
    benchmarks, addBenchmark, deleteBenchmark,
    scorecard, addScorecardItem, updateScorecardItem, deleteScorecardItem,
    categoryStats, weightedScore, globalStats,
  };
}
