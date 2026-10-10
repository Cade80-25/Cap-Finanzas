import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useWalletContext } from "@/contexts/WalletContext";

/** Mantenimiento GMAO: activos, planes, órdenes de trabajo, repuestos, historial. v2 · P3 */
export type MaintenanceStatus = "pendiente" | "programado" | "en_curso" | "completado" | "cancelado";
export type MaintenanceType = "preventivo" | "correctivo" | "predictivo" | "inspeccion";
export type MaintenancePriority = "baja" | "media" | "alta" | "urgente";

export interface MaintenanceAsset {
  id: string;
  code: string;
  name: string;
  category: string;
  location: string;
  brand: string;
  model: string;
  serialNumber: string;
  purchaseDate: string;
  warrantyExpiry: string;
  status: "operativo" | "en_mantenimiento" | "fuera_servicio" | "baja";
  notes?: string;
  createdAt: string;
}

export interface MaintenanceOrder {
  id: string;
  assetId: string;
  type: MaintenanceType;
  priority: MaintenancePriority;
  description: string;
  scheduledDate: string;
  completedDate?: string;
  technician: string;
  cost: number;
  parts: string[];
  status: MaintenanceStatus;
  notes?: string;
  createdAt: string;
}

const ASSETS_KEY = "cap-finanzas-mantenimiento-activos";
const ORDERS_KEY = "cap-finanzas-mantenimiento-ordenes";

function scoped(base: string, profile?: string, wallet?: string) {
  if (!profile || profile === "profile-default") return `${base}${wallet && wallet !== "wallet-default" ? `-${wallet}` : ""}`;
  return wallet && wallet !== "wallet-default" ? `${base}-${profile}-${wallet}` : `${base}-${profile}-default`;
}

function two(n: number) { return Math.round(n * 100) / 100; }

export function useMantenimiento() {
  const { activeProfileId, activeWalletId } = useWalletContext();
  const assetsKey = scoped(ASSETS_KEY, activeProfileId, activeWalletId);
  const ordersKey = scoped(ORDERS_KEY, activeProfileId, activeWalletId);

  const [assets, setAssets] = useLocalStorage<MaintenanceAsset[]>(assetsKey, []);
  const [orders, setOrders] = useLocalStorage<MaintenanceOrder[]>(ordersKey, []);

  const addAsset = useCallback((data: Omit<MaintenanceAsset, "id" | "createdAt">) => {
    const a = { ...data, id: `mnt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() };
    setAssets(v => [...v, a]);
    return a;
  }, [setAssets]);

  const updateAsset = useCallback((id: string, patch: Partial<MaintenanceAsset>) => {
    setAssets(v => v.map(a => a.id === id ? { ...a, ...patch } : a));
  }, [setAssets]);

  const deleteAsset = useCallback((id: string) => {
    setAssets(v => v.filter(a => a.id !== id));
    setOrders(v => v.filter(o => o.assetId !== id));
  }, [setAssets, setOrders]);

  const addOrder = useCallback((data: Omit<MaintenanceOrder, "id" | "createdAt">) => {
    const o = { ...data, id: `mwo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() };
    setOrders(v => [...v, o]);
    return o;
  }, [setOrders]);

  const updateOrder = useCallback((id: string, patch: Partial<MaintenanceOrder>) => {
    setOrders(v => v.map(o => o.id === id ? { ...o, ...patch } : o));
  }, [setOrders]);

  const deleteOrder = useCallback((id: string) => {
    setOrders(v => v.filter(o => o.id !== id));
  }, [setOrders]);

  const stats = useMemo(() => {
    let totalCost = 0, pending = 0, inProgress = 0, completed = 0;
    for (const o of orders) {
      totalCost += o.cost;
      if (o.status === "pendiente" || o.status === "programado") pending++;
      else if (o.status === "en_curso") inProgress++;
      else if (o.status === "completado") completed++;
    }
    return { totalCost: two(totalCost), pending, inProgress, completed, assetCount: assets.length, operational: assets.filter(a => a.status === "operativo").length };
  }, [orders, assets]);

  const byAsset = useMemo(() => {
    const map = new Map<string, { count: number; cost: number }>();
    for (const o of orders) {
      const s = map.get(o.assetId);
      if (s) { s.count++; s.cost += o.cost; }
      else map.set(o.assetId, { count: 1, cost: o.cost });
    }
    return map;
  }, [orders]);

  const byTechnician = useMemo(() => {
    const map = new Map<string, { count: number; cost: number }>();
    for (const o of orders) {
      const s = map.get(o.technician);
      if (s) { s.count++; s.cost += o.cost; }
      else map.set(o.technician, { count: 1, cost: o.cost });
    }
    return map;
  }, [orders]);

  return { assets, addAsset, updateAsset, deleteAsset, orders, addOrder, updateOrder, deleteOrder, stats, byAsset, byTechnician };
}
