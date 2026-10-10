import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useWalletContext } from "@/contexts/WalletContext";

/** Bolsas en Vivo — ampliación: journal de trading, wallet cripto, staking/DeFi. v2 · P2 */
export type TradeDirection = "long" | "short";
export type TradeStatus = "abierta" | "cerrada" | "cancelada";
export type AssetType = "accion" | "cripto" | "forex" | "materia_prima" | "indice";

export interface Trade {
  id: string;
  date: string;
  symbol: string;
  assetType: AssetType;
  direction: TradeDirection;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  stopLoss?: number;
  takeProfit?: number;
  pnl?: number;
  pnlPct?: number;
  status: TradeStatus;
  notes?: string;
  tags?: string[];
  createdAt: string;
}

export interface CryptoHolding {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
  exchange: string;
  createdAt: string;
}

export interface StakingPosition {
  id: string;
  symbol: string;
  platform: string;
  amount: number;
  apy: number; // % anual
  startDate: string;
  lockupDays: number;
  rewards: number;
  active: boolean;
  createdAt: string;
}

const TRADES_KEY = "cap-finanzas-trading-journal";
const CRYPTO_KEY = "cap-finanzas-cripto-wallet";
const STAKING_KEY = "cap-finanzas-staking";

function scoped(base: string, profile?: string, wallet?: string) {
  if (!profile || profile === "profile-default") return `${base}${wallet && wallet !== "wallet-default" ? `-${wallet}` : ""}`;
  return wallet && wallet !== "wallet-default" ? `${base}-${profile}-${wallet}` : `${base}-${profile}-default`;
}

function two(n: number) { return Math.round(n * 100) / 100; }

export function useTradingJournal() {
  const { activeProfileId, activeWalletId } = useWalletContext();
  const tradesKey = scoped(TRADES_KEY, activeProfileId, activeWalletId);
  const cryptoKey = scoped(CRYPTO_KEY, activeProfileId, activeWalletId);
  const stakingKey = scoped(STAKING_KEY, activeProfileId, activeWalletId);

  const [trades, setTrades] = useLocalStorage<Trade[]>(tradesKey, []);
  const [holdings, setHoldings] = useLocalStorage<CryptoHolding[]>(cryptoKey, []);
  const [staking, setStaking] = useLocalStorage<StakingPosition[]>(stakingKey, []);

  const addTrade = useCallback((data: Omit<Trade, "id" | "createdAt">) => {
    const t = { ...data, id: `trd-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() };
    setTrades(v => [...v, t]);
    return t;
  }, [setTrades]);

  const updateTrade = useCallback((id: string, patch: Partial<Trade>) => {
    setTrades(v => v.map(t => t.id === id ? { ...t, ...patch } : t));
  }, [setTrades]);

  const closeTrade = useCallback((id: string, exitPrice: number) => {
    setTrades(v => v.map(t => {
      if (t.id !== id) return t;
      const pnl = t.direction === "long" ? (exitPrice - t.entryPrice) * t.quantity : (t.entryPrice - exitPrice) * t.quantity;
      const pnlPct = t.entryPrice > 0 ? (pnl / (t.entryPrice * t.quantity)) * 100 : 0;
      return { ...t, exitPrice, pnl: two(pnl), pnlPct: two(pnlPct), status: "cerrada" as TradeStatus };
    }));
  }, [setTrades]);

  const deleteTrade = useCallback((id: string) => {
    setTrades(v => v.filter(t => t.id !== id));
  }, [setTrades]);

  const addHolding = useCallback((data: Omit<CryptoHolding, "id" | "createdAt">) => {
    const h = { ...data, id: `cry-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() };
    setHoldings(v => [...v, h]);
    return h;
  }, [setHoldings]);

  const updateHolding = useCallback((id: string, patch: Partial<CryptoHolding>) => {
    setHoldings(v => v.map(h => h.id === id ? { ...h, ...patch } : h));
  }, [setHoldings]);

  const deleteHolding = useCallback((id: string) => {
    setHoldings(v => v.filter(h => h.id !== id));
  }, [setHoldings]);

  const addStaking = useCallback((data: Omit<StakingPosition, "id" | "createdAt">) => {
    const s = { ...data, id: `stk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() };
    setStaking(v => [...v, s]);
    return s;
  }, [setStaking]);

  const updateStaking = useCallback((id: string, patch: Partial<StakingPosition>) => {
    setStaking(v => v.map(s => s.id === id ? { ...s, ...patch } : s));
  }, [setStaking]);

  const deleteStaking = useCallback((id: string) => {
    setStaking(v => v.filter(s => s.id !== id));
  }, [setStaking]);

  const tradeStats = useMemo(() => {
    const closed = trades.filter(t => t.status === "cerrada");
    const wins = closed.filter(t => (t.pnl ?? 0) > 0);
    const losses = closed.filter(t => (t.pnl ?? 0) < 0);
    const totalPnl = closed.reduce((s, t) => s + (t.pnl ?? 0), 0);
    const winRate = closed.length > 0 ? (wins.length / closed.length) * 100 : 0;
    const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + (t.pnl ?? 0), 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + (t.pnl ?? 0), 0) / losses.length) : 0;
    const profitFactor = avgLoss > 0 ? Math.abs(avgWin / avgLoss) : avgWin > 0 ? Infinity : 0;
    const openTrades = trades.filter(t => t.status === "abierta");
    return {
      totalTrades: trades.length,
      closedTrades: closed.length,
      openTrades: openTrades.length,
      winRate: two(winRate),
      totalPnl: two(totalPnl),
      avgWin: two(avgWin),
      avgLoss: two(avgLoss),
      profitFactor: two(profitFactor),
      bestTrade: closed.length > 0 ? Math.max(...closed.map(t => t.pnl ?? 0)) : 0,
      worstTrade: closed.length > 0 ? Math.min(...closed.map(t => t.pnl ?? 0)) : 0,
    };
  }, [trades]);

  const cryptoStats = useMemo(() => {
    let totalValue = 0, totalCost = 0;
    for (const h of holdings) { totalValue += h.quantity * h.currentPrice; totalCost += h.quantity * h.avgBuyPrice; }
    const unrealizedPnl = totalValue - totalCost;
    const unrealizedPct = totalCost > 0 ? (unrealizedPnl / totalCost) * 100 : 0;
    return { totalValue: two(totalValue), totalCost: two(totalCost), unrealizedPnl: two(unrealizedPnl), unrealizedPct: two(unrealizedPct), count: holdings.length };
  }, [holdings]);

  const stakingStats = useMemo(() => {
    let totalStaked = 0, totalRewards = 0, activeCount = 0;
    for (const s of staking) { if (s.active) { totalStaked += s.amount; totalRewards += s.rewards; activeCount++; } }
    return { totalStaked: two(totalStaked), totalRewards: two(totalRewards), activeCount, count: staking.length };
  }, [staking]);

  return {
    trades, addTrade, updateTrade, closeTrade, deleteTrade,
    holdings, addHolding, updateHolding, deleteHolding,
    staking, addStaking, updateStaking, deleteStaking,
    tradeStats, cryptoStats, stakingStats,
  };
}
