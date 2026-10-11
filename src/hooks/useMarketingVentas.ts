import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useWalletContext } from "@/contexts/WalletContext";

export type CampaignStatus = "borrador" | "activa" | "pausada" | "finalizada";
export type CampaignChannel = "email" | "redes" | "ads" | "contenido" | "evento" | "otro";

export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  channel: CampaignChannel;
  budget: number;
  spent: number;
  revenue: number;
  leads: number;
  conversions: number;
  startDate: string;
  endDate: string;
  notes?: string;
  createdAt: string;
}

const CAMPAIGNS_KEY = "cap-finanzas-marketing";

function scoped(base: string, profile?: string, wallet?: string) {
  if (!profile || profile === "profile-default") return `${base}${wallet && wallet !== "wallet-default" ? `-${wallet}` : ""}`;
  return wallet && wallet !== "wallet-default" ? `${base}-${profile}-${wallet}` : `${base}-${profile}-default`;
}

function two(n: number) { return Math.round(n * 100) / 100; }

export function useMarketingVentas() {
  const { activeProfileId, activeWalletId } = useWalletContext();
  const key = scoped(CAMPAIGNS_KEY, activeProfileId, activeWalletId);
  const [campaigns, setCampaigns] = useLocalStorage<Campaign[]>(key, []);

  const addCampaign = useCallback((data: Omit<Campaign, "id" | "createdAt">) => {
    const c = { ...data, id: `mkt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() };
    setCampaigns(v => [...v, c]);
    return c;
  }, [setCampaigns]);

  const updateCampaign = useCallback((id: string, patch: Partial<Campaign>) => {
    setCampaigns(v => v.map(c => c.id === id ? { ...c, ...patch } : c));
  }, [setCampaigns]);

  const deleteCampaign = useCallback((id: string) => {
    setCampaigns(v => v.filter(c => c.id !== id));
  }, [setCampaigns]);

  const stats = useMemo(() => {
    let totalBudget = 0, totalSpent = 0, totalRevenue = 0, totalLeads = 0, totalConversions = 0;
    for (const c of campaigns) {
      if (c.status === "finalizada") continue;
      totalBudget += c.budget; totalSpent += c.spent; totalRevenue += c.revenue;
      totalLeads += c.leads; totalConversions += c.conversions;
    }
    const roi = totalSpent > 0 ? two(((totalRevenue - totalSpent) / totalSpent) * 100) : 0;
    const cac = totalConversions > 0 ? two(totalSpent / totalConversions) : 0;
    return { count: campaigns.length, totalBudget: two(totalBudget), totalSpent: two(totalSpent), totalRevenue: two(totalRevenue), totalLeads, totalConversions, roi, cac, active: campaigns.filter(c => c.status === "activa").length };
  }, [campaigns]);

  const byChannel = useMemo(() => {
    const map = new Map<string, { count: number; budget: number; revenue: number }>();
    for (const c of campaigns) {
      const s = map.get(c.channel);
      if (s) { s.count++; s.budget += c.budget; s.revenue += c.revenue; }
      else map.set(c.channel, { count: 1, budget: c.budget, revenue: c.revenue });
    }
    return map;
  }, [campaigns]);

  return { campaigns, addCampaign, updateCampaign, deleteCampaign, stats, byChannel };
}
