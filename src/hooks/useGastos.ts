import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useWalletContext } from "@/contexts/WalletContext";

/** Gastos y Notas de Gasto: reportes, reembolsos, anticipos, aprobaciones, políticas. v2 · P3 */
export type ExpenseStatus = "pendiente" | "aprobado" | "rechazado" | "reembolsado" | "contabilizado";
export type ExpenseCategory = "viaticos" | "materiales" | "servicios" | "viajes" | "alojamiento" | "comidas" | "combustible" | "mantenimiento" | "oficina" | "otro";

export interface Expense {
  id: string;
  date: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  employee: string;
  project?: string;
  receipt?: string;
  status: ExpenseStatus;
  approver?: string;
  notes?: string;
  createdAt: string;
}

export interface ExpensePolicy {
  id: string;
  name: string;
  category: ExpenseCategory;
  maxAmount: number;
  requiresApproval: boolean;
  approverRole?: string;
  active: boolean;
  createdAt: string;
}

const EXPENSES_KEY = "cap-finanzas-gastos";
const POLICIES_KEY = "cap-finanzas-gastos-politicas";

function scoped(base: string, profile?: string, wallet?: string) {
  if (!profile || profile === "profile-default") return `${base}${wallet && wallet !== "wallet-default" ? `-${wallet}` : ""}`;
  return wallet && wallet !== "wallet-default" ? `${base}-${profile}-${wallet}` : `${base}-${profile}-default`;
}

function two(n: number) { return Math.round(n * 100) / 100; }

export function useGastos() {
  const { activeProfileId, activeWalletId } = useWalletContext();
  const expensesKey = scoped(EXPENSES_KEY, activeProfileId, activeWalletId);
  const policiesKey = scoped(POLICIES_KEY, activeProfileId, activeWalletId);

  const [expenses, setExpenses] = useLocalStorage<Expense[]>(expensesKey, []);
  const [policies, setPolicies] = useLocalStorage<ExpensePolicy[]>(policiesKey, []);

  const addExpense = useCallback((data: Omit<Expense, "id" | "createdAt">) => {
    const e = { ...data, id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() };
    setExpenses(v => [...v, e]);
    return e;
  }, [setExpenses]);

  const updateExpense = useCallback((id: string, patch: Partial<Expense>) => {
    setExpenses(v => v.map(e => e.id === id ? { ...e, ...patch } : e));
  }, [setExpenses]);

  const deleteExpense = useCallback((id: string) => {
    setExpenses(v => v.filter(e => e.id !== id));
  }, [setExpenses]);

  const approveExpense = useCallback((id: string, approver: string) => {
    setExpenses(v => v.map(e => e.id === id ? { ...e, status: "aprobado", approver } : e));
  }, [setExpenses]);

  const rejectExpense = useCallback((id: string, approver: string) => {
    setExpenses(v => v.map(e => e.id === id ? { ...e, status: "rechazado", approver } : e));
  }, [setExpenses]);

  const addPolicy = useCallback((data: Omit<ExpensePolicy, "id" | "createdAt">) => {
    const p = { ...data, id: `pol-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() };
    setPolicies(v => [...v, p]);
    return p;
  }, [setPolicies]);

  const updatePolicy = useCallback((id: string, patch: Partial<ExpensePolicy>) => {
    setPolicies(v => v.map(p => p.id === id ? { ...p, ...patch } : p));
  }, [setPolicies]);

  const deletePolicy = useCallback((id: string) => {
    setPolicies(v => v.filter(p => p.id !== id));
  }, [setPolicies]);

  const stats = useMemo(() => {
    let total = 0, pending = 0, approved = 0, reimbursed = 0;
    for (const e of expenses) {
      total += e.amount;
      if (e.status === "pendiente") pending += e.amount;
      else if (e.status === "aprobado") approved += e.amount;
      else if (e.status === "reembolsado") reimbursed += e.amount;
    }
    return { total: two(total), pending: two(pending), approved: two(approved), reimbursed: two(reimbursed), count: expenses.length };
  }, [expenses]);

  const byCategory = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    for (const e of expenses) {
      const s = map.get(e.category);
      if (s) { s.total += e.amount; s.count++; }
      else map.set(e.category, { total: e.amount, count: 1 });
    }
    return map;
  }, [expenses]);

  const byEmployee = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    for (const e of expenses) {
      const s = map.get(e.employee);
      if (s) { s.total += e.amount; s.count++; }
      else map.set(e.employee, { total: e.amount, count: 1 });
    }
    return map;
  }, [expenses]);

  return {
    expenses, addExpense, updateExpense, deleteExpense, approveExpense, rejectExpense,
    policies, addPolicy, updatePolicy, deletePolicy,
    stats, byCategory, byEmployee,
  };
}
