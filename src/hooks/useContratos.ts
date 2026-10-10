import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useWalletContext } from "@/contexts/WalletContext";

/** Contratos y Suscripciones: recurrentes, facturación automática, renovaciones, prorrateos. v2 · P3 */
export type ContractType = "servicio" | "suscripcion" | "mantenimiento" | "alquiler" | "financiero" | "laboral";
export type ContractStatus = "borrador" | "activo" | "pendiente_renovacion" | "vencido" | "cancelado";
export type BillingFrequency = "mensual" | "trimestral" | "semestral" | "anual" | "unico";

export interface Contract {
  id: string;
  name: string;
  type: ContractType;
  counterparty: string;
  description: string;
  startDate: string;
  endDate: string;
  amount: number;
  currency: string;
  billingFrequency: BillingFrequency;
  status: ContractStatus;
  autoRenew: boolean;
  terms?: string;
  notes?: string;
  createdAt: string;
}

export interface ContractBilling {
  id: string;
  contractId: string;
  period: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: "pendiente" | "pagada" | "vencida";
  createdAt: string;
}

const CONTRACTS_KEY = "cap-finanzas-contratos";
const BILLINGS_KEY = "cap-finanzas-contratos-facturacion";

function scoped(base: string, profile?: string, wallet?: string) {
  if (!profile || profile === "profile-default") return `${base}${wallet && wallet !== "wallet-default" ? `-${wallet}` : ""}`;
  return wallet && wallet !== "wallet-default" ? `${base}-${profile}-${wallet}` : `${base}-${profile}-default`;
}

function two(n: number) { return Math.round(n * 100) / 100; }

export function useContratos() {
  const { activeProfileId, activeWalletId } = useWalletContext();
  const contractsKey = scoped(CONTRACTS_KEY, activeProfileId, activeWalletId);
  const billingsKey = scoped(BILLINGS_KEY, activeProfileId, activeWalletId);

  const [contracts, setContracts] = useLocalStorage<Contract[]>(contractsKey, []);
  const [billings, setBillings] = useLocalStorage<ContractBilling[]>(billingsKey, []);

  const addContract = useCallback((data: Omit<Contract, "id" | "createdAt">) => {
    const c = { ...data, id: `con-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() };
    setContracts(v => [...v, c]);
    return c;
  }, [setContracts]);

  const updateContract = useCallback((id: string, patch: Partial<Contract>) => {
    setContracts(v => v.map(c => c.id === id ? { ...c, ...patch } : c));
  }, [setContracts]);

  const deleteContract = useCallback((id: string) => {
    setContracts(v => v.filter(c => c.id !== id));
    setBillings(v => v.filter(b => b.contractId !== id));
  }, [setContracts, setBillings]);

  const addBilling = useCallback((data: Omit<ContractBilling, "id" | "createdAt">) => {
    const b = { ...data, id: `bil-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() };
    setBillings(v => [...v, b]);
    return b;
  }, [setBillings]);

  const updateBilling = useCallback((id: string, patch: Partial<ContractBilling>) => {
    setBillings(v => v.map(b => b.id === id ? { ...b, ...patch } : b));
  }, [setBillings]);

  const deleteBilling = useCallback((id: string) => {
    setBillings(v => v.filter(b => b.id !== id));
  }, [setBillings]);

  const markPaid = useCallback((id: string) => {
    setBillings(v => v.map(b => b.id === id ? { ...b, status: "pagada", paidDate: new Date().toISOString().slice(0, 10) } : b));
  }, [setBillings]);

  const stats = useMemo(() => {
    let monthlyRecurring = 0, pendingBilling = 0, overdueBilling = 0;
    const today = new Date().toISOString().slice(0, 10);
    for (const c of contracts) {
      if (c.status === "activo" || c.status === "pendiente_renovacion") {
        if (c.billingFrequency === "mensual") monthlyRecurring += c.amount;
        else if (c.billingFrequency === "trimestral") monthlyRecurring += c.amount / 3;
        else if (c.billingFrequency === "semestral") monthlyRecurring += c.amount / 6;
        else if (c.billingFrequency === "anual") monthlyRecurring += c.amount / 12;
      }
    }
    for (const b of billings) {
      if (b.status === "pendiente") { pendingBilling += b.amount; if (b.dueDate < today) overdueBilling += b.amount; }
    }
    return { monthlyRecurring: two(monthlyRecurring), pendingBilling: two(pendingBilling), overdueBilling: two(overdueBilling), activeContracts: contracts.filter(c => c.status === "activo").length, count: contracts.length };
  }, [contracts, billings]);

  const expiringSoon = useMemo(() => {
    const limit = new Date();
    limit.setDate(limit.getDate() + 30);
    return contracts.filter(c => {
      if (c.status !== "activo" && c.status !== "pendiente_renovacion") return false;
      const end = new Date(c.endDate);
      return end <= limit && end >= new Date();
    });
  }, [contracts]);

  return {
    contracts, addContract, updateContract, deleteContract,
    billings, addBilling, updateBilling, deleteBilling, markPaid,
    stats, expiringSoon,
  };
}
