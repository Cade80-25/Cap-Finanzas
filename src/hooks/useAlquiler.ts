import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useWalletContext } from "@/contexts/WalletContext";

/** Alquiler / Rental: propiedades arrendadas, contratos, pagos, mantenimiento. v2 · P3 */
export type RentalStatus = "activo" | "pendiente" | "finalizado" | "cancelado";
export type RentalType = "residencial" | "comercial" | "industrial" | "temporal";

export interface RentalProperty {
  id: string;
  code: string;
  name: string;
  address: string;
  type: RentalType;
  area: number;
  monthlyRent: number;
  currency: string;
  startDate: string;
  endDate: string;
  tenant: string;
  tenantContact: string;
  deposit: number;
  status: RentalStatus;
  notes?: string;
  createdAt: string;
}

export interface RentalPayment {
  id: string;
  propertyId: string;
  period: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: "pendiente" | "pagado" | "vencido";
  notes?: string;
  createdAt: string;
}

const PROPERTIES_KEY = "cap-finanzas-alquiler-propiedades";
const PAYMENTS_KEY = "cap-finanzas-alquiler-pagos";

function scoped(base: string, profile?: string, wallet?: string) {
  if (!profile || profile === "profile-default") return `${base}${wallet && wallet !== "wallet-default" ? `-${wallet}` : ""}`;
  return wallet && wallet !== "wallet-default" ? `${base}-${profile}-${wallet}` : `${base}-${profile}-default`;
}

function two(n: number) { return Math.round(n * 100) / 100; }

export function useAlquiler() {
  const { activeProfileId, activeWalletId } = useWalletContext();
  const propertiesKey = scoped(PROPERTIES_KEY, activeProfileId, activeWalletId);
  const paymentsKey = scoped(PAYMENTS_KEY, activeProfileId, activeWalletId);

  const [properties, setProperties] = useLocalStorage<RentalProperty[]>(propertiesKey, []);
  const [payments, setPayments] = useLocalStorage<RentalPayment[]>(paymentsKey, []);

  const addProperty = useCallback((data: Omit<RentalProperty, "id" | "createdAt">) => {
    const p = { ...data, id: `ren-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() };
    setProperties(v => [...v, p]);
    return p;
  }, [setProperties]);

  const updateProperty = useCallback((id: string, patch: Partial<RentalProperty>) => {
    setProperties(v => v.map(p => p.id === id ? { ...p, ...patch } : p));
  }, [setProperties]);

  const deleteProperty = useCallback((id: string) => {
    setProperties(v => v.filter(p => p.id !== id));
    setPayments(v => v.filter(p => p.propertyId !== id));
  }, [setProperties, setPayments]);

  const addPayment = useCallback((data: Omit<RentalPayment, "id" | "createdAt">) => {
    const p = { ...data, id: `rpa-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() };
    setPayments(v => [...v, p]);
    return p;
  }, [setPayments]);

  const updatePayment = useCallback((id: string, patch: Partial<RentalPayment>) => {
    setPayments(v => v.map(p => p.id === id ? { ...p, ...patch } : p));
  }, [setPayments]);

  const deletePayment = useCallback((id: string) => {
    setPayments(v => v.filter(p => p.id !== id));
  }, [setPayments]);

  const markPaid = useCallback((id: string) => {
    setPayments(v => v.map(p => p.id === id ? { ...p, status: "pagado", paidDate: new Date().toISOString().slice(0, 10) } : p));
  }, [setPayments]);

  const stats = useMemo(() => {
    let monthlyRent = 0, pending = 0, collected = 0;
    const today = new Date().toISOString().slice(0, 10);
    for (const p of properties) { if (p.status === "activo") monthlyRent += p.monthlyRent; }
    for (const p of payments) {
      if (p.status === "pagado") collected += p.amount;
      else if (p.status === "pendiente") { pending += p.amount; }
    }
    return { monthlyRent: two(monthlyRent), pending: two(pending), collected: two(collected), activeProperties: properties.filter(p => p.status === "activo").length, count: properties.length };
  }, [properties, payments]);

  const byProperty = useMemo(() => {
    const map = new Map<string, { payments: number; total: number; pending: number }>();
    for (const p of payments) {
      const s = map.get(p.propertyId);
      if (s) { s.payments++; s.total += p.amount; if (p.status !== "pagado") s.pending += p.amount; }
      else map.set(p.propertyId, { payments: 1, total: p.amount, pending: p.status !== "pagado" ? p.amount : 0 });
    }
    return map;
  }, [payments]);

  return { properties, addProperty, updateProperty, deleteProperty, payments, addPayment, updatePayment, deletePayment, markPaid, stats, byProperty };
}
