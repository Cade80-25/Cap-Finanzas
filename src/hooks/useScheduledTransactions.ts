import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";

export type RecurrenceFrequency = "daily" | "weekly" | "monthly" | "yearly";

export interface ScheduledTransaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  account: string;
  category?: string;
  subcategory?: string;
  section?: string;
  notes?: string;
  creditor?: string;
  // Recurrence rule
  frequency: RecurrenceFrequency;
  interval: number; // cada N días/semanas/meses/años
  startDate: string; // YYYY-MM-DD
  endDate?: string; // fecha límite opcional
  lastGenerated?: string; // última fecha en que se generó una transacción
  enabled: boolean;
  createdAt: string;
}

const SCHEDULED_KEY = "cap-finanzas-scheduled-transactions";

const DEFAULT_SCHEDULED: ScheduledTransaction[] = [
  {
    id: "sched-alquiler",
    type: "expense",
    amount: 8500,
    description: "Alquiler mensual",
    account: "gastos-operativos",
    category: "vivienda",
    subcategory: "alquiler",
    frequency: "monthly",
    interval: 1,
    startDate: "2026-03-01",
    enabled: true,
    createdAt: "2026-02-28T10:00:00.000Z",
  },
  {
    id: "sched-sueldo",
    type: "income",
    amount: 45000,
    description: "Sueldo mensual",
    account: "ingresos-operativos",
    category: "salario",
    subcategory: "sueldo-mensual",
    frequency: "monthly",
    interval: 1,
    startDate: "2026-03-01",
    enabled: true,
    createdAt: "2026-02-28T10:00:00.000Z",
  },
  {
    id: "sched-netflix",
    type: "expense",
    amount: 650,
    description: "Netflix mensual",
    account: "gastos-operativos",
    category: "entretenimiento",
    subcategory: "streaming",
    frequency: "monthly",
    interval: 1,
    startDate: "2026-03-15",
    enabled: true,
    createdAt: "2026-02-28T10:00:00.000Z",
  },
];

/**
 * Calcula la siguiente fecha de vencimiento para una transacción programada,
 * basándose en la última vez que se generó (o la fecha de inicio si nunca se generó).
 */
export function getNextDueDate(sched: ScheduledTransaction): string {
  const base = sched.lastGenerated ?? sched.startDate;
  const d = new Date(base + "T00:00:00");
  switch (sched.frequency) {
    case "daily":
      d.setDate(d.getDate() + sched.interval);
      break;
    case "weekly":
      d.setDate(d.getDate() + sched.interval * 7);
      break;
    case "monthly":
      d.setMonth(d.getMonth() + sched.interval);
      break;
    case "yearly":
      d.setFullYear(d.getFullYear() + sched.interval);
      break;
  }
  return d.toISOString().slice(0, 10);
}

/**
 * Calcula todas las fechas vencidas hoy o antes de hoy para una transacción programada.
 */
export function getDueDates(sched: ScheduledTransaction, today: string): string[] {
  if (!sched.enabled) return [];
  const dates: string[] = [];
  let next = getNextDueDate(sched);
  // Evitar bucles infinitos: máximo 365 iteraciones
  let safety = 0;
  while (next <= today && safety < 365) {
    if (sched.endDate && next > sched.endDate) break;
    dates.push(next);
    // Avanzar al siguiente
    const d = new Date(next + "T00:00:00");
    switch (sched.frequency) {
      case "daily":
        d.setDate(d.getDate() + sched.interval);
        break;
      case "weekly":
        d.setDate(d.getDate() + sched.interval * 7);
        break;
      case "monthly":
        d.setMonth(d.getMonth() + sched.interval);
        break;
      case "yearly":
        d.setFullYear(d.getFullYear() + sched.interval);
        break;
    }
    next = d.toISOString().slice(0, 10);
    safety++;
  }
  return dates;
}

export function useScheduledTransactions() {
  const [scheduled, setScheduled] = useLocalStorage<ScheduledTransaction[]>(
    SCHEDULED_KEY,
    DEFAULT_SCHEDULED
  );

  const addScheduled = useCallback(
    (item: Omit<ScheduledTransaction, "id" | "createdAt">): ScheduledTransaction => {
      const newItem: ScheduledTransaction = {
        ...item,
        id: `sched-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date().toISOString(),
      };
      setScheduled((prev) => [...prev, newItem]);
      return newItem;
    },
    [setScheduled]
  );

  const updateScheduled = useCallback(
    (id: string, updates: Partial<Omit<ScheduledTransaction, "id" | "createdAt">>) => {
      setScheduled((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
      );
    },
    [setScheduled]
  );

  const deleteScheduled = useCallback(
    (id: string) => {
      setScheduled((prev) => prev.filter((s) => s.id !== id));
    },
    [setScheduled]
  );

  const toggleScheduled = useCallback(
    (id: string) => {
      setScheduled((prev) =>
        prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
      );
    },
    [setScheduled]
  );

  /**
   * Genera las transacciones vencidas hoy o antes.
   * Retorna el número de transacciones creadas.
   */
  const generateDueTransactions = useCallback(
    (addTransaction: (tx: {
      date: string;
      account: string;
      description: string;
      debit: number;
      credit: number;
      category?: string;
      subcategory?: string;
      section?: string;
      notes?: string;
      creditor?: string;
      reconciled?: boolean;
      price?: number;
      quantity?: number;
    }) => void,
    today?: string
  ): number => {
    const todayStr = today ?? new Date().toISOString().slice(0, 10);
    let created = 0;

    setScheduled((prev) => {
      const updated = prev.map((sched) => {
        if (!sched.enabled) return sched;
        const dueDates = getDueDates(sched, todayStr);
        if (dueDates.length === 0) return sched;

        // Generar transacciones para cada fecha vencida
        for (const date of dueDates) {
          addTransaction({
            date,
            account: sched.account,
            description: sched.description,
            debit: sched.type === "expense" ? sched.amount : 0,
            credit: sched.type === "income" ? sched.amount : 0,
            category: sched.category,
            subcategory: sched.subcategory,
            section: sched.section,
            notes: sched.notes,
            creditor: sched.creditor,
            reconciled: false,
          });
          created++;
        }

        // Actualizar lastGenerated a la última fecha procesada
        const lastDate = dueDates[dueDates.length - 1];
        return { ...sched, lastGenerated: lastDate };
      });

      return updated;
    });

    return created;
  }, [setScheduled]);

  const activeScheduled = useMemo(
    () => scheduled.filter((s) => s.enabled),
    [scheduled]
  );

  return {
    scheduled,
    activeScheduled,
    addScheduled,
    updateScheduled,
    deleteScheduled,
    toggleScheduled,
    generateDueTransactions,
    getDueDates,
    getNextDueDate,
  };
}
