import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useWalletContext } from "@/contexts/WalletContext";

/** Bienes Raíces e Inversión Inmobiliaria: propiedades, arrendamientos, hipotecas, ROI. v2 · P2 */
export type PropertyType = "residencial" | "comercial" | "industrial" | "terreno" | "oficina";
export type PropertyStatus = "propia" | "alquilada" | "en_venta" | "en_construccion";

export interface Property {
  id: string;
  code: string;
  name: string;
  address: string;
  type: PropertyType;
  status: PropertyStatus;
  purchaseDate: string;
  purchasePrice: number;
  currentValue: number;
  area: number; // m²
  notes?: string;
  createdAt: string;
}

export interface Lease {
  id: string;
  propertyId: string;
  tenant: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  currency: string;
  deposit: number;
  active: boolean;
  createdAt: string;
}

export interface Mortgage {
  id: string;
  propertyId: string;
  lender: string;
  principal: number;
  outstanding: number;
  interestRate: number; // % anual
  termMonths: number;
  monthlyPayment: number;
  startDate: string;
  active: boolean;
  createdAt: string;
}

export interface PropertyExpense {
  id: string;
  propertyId: string;
  date: string;
  category: "mantenimiento" | "impuestos" | "seguro" | "servicios" | "otro";
  description: string;
  amount: number;
  createdAt: string;
}

const PROPERTIES_KEY = "cap-finanzas-inmobiliaria-propiedades";
const LEASES_KEY = "cap-finanzas-inmobiliaria-arrendamientos";
const MORTGAGES_KEY = "cap-finanzas-inmobiliaria-hipotecas";
const EXPENSES_KEY = "cap-finanzas-inmobiliaria-gastos";

function scoped(base: string, profile?: string, wallet?: string) {
  if (!profile || profile === "profile-default") return `${base}${wallet && wallet !== "wallet-default" ? `-${wallet}` : ""}`;
  return wallet && wallet !== "wallet-default" ? `${base}-${profile}-${wallet}` : `${base}-${profile}-default`;
}

function two(n: number) { return Math.round(n * 100) / 100; }

export function useInmobiliaria() {
  const { activeProfileId, activeWalletId } = useWalletContext();
  const propertiesKey = scoped(PROPERTIES_KEY, activeProfileId, activeWalletId);
  const leasesKey = scoped(LEASES_KEY, activeProfileId, activeWalletId);
  const mortgagesKey = scoped(MORTGAGES_KEY, activeProfileId, activeWalletId);
  const expensesKey = scoped(EXPENSES_KEY, activeProfileId, activeWalletId);

  const [properties, setProperties] = useLocalStorage<Property[]>(propertiesKey, []);
  const [leases, setLeases] = useLocalStorage<Lease[]>(leasesKey, []);
  const [mortgages, setMortgages] = useLocalStorage<Mortgage[]>(mortgagesKey, []);
  const [expenses, setExpenses] = useLocalStorage<PropertyExpense[]>(expensesKey, []);

  const addProperty = useCallback((data: Omit<Property, "id" | "createdAt">) => {
    const p = { ...data, id: `inm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() };
    setProperties(v => [...v, p]);
    return p;
  }, [setProperties]);

  const updateProperty = useCallback((id: string, patch: Partial<Property>) => {
    setProperties(v => v.map(p => p.id === id ? { ...p, ...patch } : p));
  }, [setProperties]);

  const deleteProperty = useCallback((id: string) => {
    setProperties(v => v.filter(p => p.id !== id));
    setLeases(v => v.filter(l => l.propertyId !== id));
    setMortgages(v => v.filter(m => m.propertyId !== id));
    setExpenses(v => v.filter(e => e.propertyId !== id));
  }, [setProperties, setLeases, setMortgages, setExpenses]);

  const addLease = useCallback((data: Omit<Lease, "id" | "createdAt">) => {
    const l = { ...data, id: `lea-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() };
    setLeases(v => [...v, l]);
    return l;
  }, [setLeases]);

  const updateLease = useCallback((id: string, patch: Partial<Lease>) => {
    setLeases(v => v.map(l => l.id === id ? { ...l, ...patch } : l));
  }, [setLeases]);

  const deleteLease = useCallback((id: string) => {
    setLeases(v => v.filter(l => l.id !== id));
  }, [setLeases]);

  const addMortgage = useCallback((data: Omit<Mortgage, "id" | "createdAt">) => {
    const m = { ...data, id: `mor-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() };
    setMortgages(v => [...v, m]);
    return m;
  }, [setMortgages]);

  const updateMortgage = useCallback((id: string, patch: Partial<Mortgage>) => {
    setMortgages(v => v.map(m => m.id === id ? { ...m, ...patch } : m));
  }, [setMortgages]);

  const deleteMortgage = useCallback((id: string) => {
    setMortgages(v => v.filter(m => m.id !== id));
  }, [setMortgages]);

  const addExpense = useCallback((data: Omit<PropertyExpense, "id" | "createdAt">) => {
    const e = { ...data, id: `pex-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() };
    setExpenses(v => [...v, e]);
    return e;
  }, [setExpenses]);

  const deleteExpense = useCallback((id: string) => {
    setExpenses(v => v.filter(e => e.id !== id));
  }, [setExpenses]);

  const propertyStats = useMemo(() => {
    const map = new Map<string, { annualRent: number; annualExpenses: number; mortgageDebt: number; monthlyPayment: number }>();
    for (const p of properties) map.set(p.id, { annualRent: 0, annualExpenses: 0, mortgageDebt: 0, monthlyPayment: 0 });
    for (const l of leases) {
      const s = map.get(l.propertyId);
      if (s && l.active) s.annualRent += l.monthlyRent * 12;
    }
    for (const e of expenses) {
      const s = map.get(e.propertyId);
      if (s) s.annualExpenses += e.amount;
    }
    for (const m of mortgages) {
      const s = map.get(m.propertyId);
      if (s && m.active) { s.mortgageDebt += m.outstanding; s.monthlyPayment += m.monthlyPayment; }
    }
    return map;
  }, [properties, leases, expenses, mortgages]);

  const byProperty = useMemo(() => {
    const leaseMap = new Map<string, Lease[]>();
    const mortgageMap = new Map<string, Mortgage[]>();
    const expenseMap = new Map<string, PropertyExpense[]>();
    for (const l of leases) { const a = leaseMap.get(l.propertyId); if (a) a.push(l); else leaseMap.set(l.propertyId, [l]); }
    for (const m of mortgages) { const a = mortgageMap.get(m.propertyId); if (a) a.push(m); else mortgageMap.set(m.propertyId, [m]); }
    for (const e of expenses) { const a = expenseMap.get(e.propertyId); if (a) a.push(e); else expenseMap.set(e.propertyId, [e]); }
    return { leaseMap, mortgageMap, expenseMap };
  }, [leases, mortgages, expenses]);

  const globalStats = useMemo(() => {
    let totalValue = 0, totalPurchase = 0, annualRent = 0, annualExpenses = 0, totalDebt = 0, monthlyPayments = 0;
    for (const p of properties) { totalValue += p.currentValue; totalPurchase += p.purchasePrice; }
    for (const l of leases) if (l.active) annualRent += l.monthlyRent * 12;
    for (const e of expenses) annualExpenses += e.amount;
    for (const m of mortgages) if (m.active) { totalDebt += m.outstanding; monthlyPayments += m.monthlyPayment; }
    const equity = totalValue - totalDebt;
    const netIncome = annualRent - annualExpenses;
    const grossYield = totalValue > 0 ? (annualRent / totalValue) * 100 : 0;
    const netYield = totalValue > 0 ? (netIncome / totalValue) * 100 : 0;
    return {
      totalValue: two(totalValue), totalPurchase: two(totalPurchase), totalDebt: two(totalDebt),
      equity: two(equity), annualRent: two(annualRent), annualExpenses: two(annualExpenses),
      netIncome: two(netIncome), monthlyPayments: two(monthlyPayments),
      grossYield: two(grossYield), netYield: two(netYield),
      capitalGain: two(totalValue - totalPurchase),
      count: properties.length, rented: properties.filter(p => p.status === "alquilada").length,
    };
  }, [properties, leases, expenses, mortgages]);

  return {
    properties, addProperty, updateProperty, deleteProperty,
    leases, addLease, updateLease, deleteLease,
    mortgages, addMortgage, updateMortgage, deleteMortgage,
    expenses, addExpense, deleteExpense,
    propertyStats, byProperty, globalStats,
  };
}
