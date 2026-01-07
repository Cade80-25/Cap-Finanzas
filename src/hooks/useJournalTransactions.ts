import { useEffect } from "react";
import { useLocalStorage } from "./useLocalStorage";

export type JournalTransaction = {
  id: number;
  date: string;
  account: string;
  description: string;
  debit: number;
  credit: number;
};

const JOURNAL_KEY = "cap-finanzas-libro-diario-transactions";

// Keys legacy que aparecieron en versiones anteriores o en backups
const LEGACY_KEYS = [
  "cap-finanzas-transacciones",
  "cap-finanzas-transactions",
  "transactions",
  "finanzas-transacciones",
  "libro-diario-transactions",
];

function asNumber(v: unknown): number {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? "0"));
  return Number.isFinite(n) ? n : 0;
}

function normalizeTransaction(raw: any, index: number): JournalTransaction | null {
  if (!raw || typeof raw !== "object") return null;

  const date = String(raw.date ?? raw.fecha ?? "").slice(0, 10);
  const description = String(raw.description ?? raw.descripcion ?? raw.memo ?? raw.concepto ?? "");
  const account = String(raw.account ?? raw.cuenta ?? raw.category ?? raw.categoria ?? "");

  const debitRaw = raw.debit ?? raw.debe;
  const creditRaw = raw.credit ?? raw.haber;
  const amountRaw = raw.amount ?? raw.monto;

  let debit = asNumber(debitRaw);
  let credit = asNumber(creditRaw);

  if (debit === 0 && credit === 0 && amountRaw != null) {
    const amount = asNumber(amountRaw);
    debit = amount > 0 ? amount : 0;
    credit = amount < 0 ? Math.abs(amount) : 0;
  }

  if (!date) return null;

  const id = asNumber(raw.id) || Date.now() + index;

  return {
    id,
    date,
    account: account || "gastos-operativos",
    description: description || "(sin descripción)",
    debit,
    credit,
  };
}

export function useJournalTransactions() {
  const [transactions, setTransactions] = useLocalStorage<JournalTransaction[]>(
    JOURNAL_KEY,
    []
  );

  // Migración: si no hay transacciones en la key actual, intentar traer de keys legacy
  useEffect(() => {
    if (transactions.length > 0) return;

    for (const legacyKey of LEGACY_KEYS) {
      const raw = localStorage.getItem(legacyKey);
      if (!raw) continue;

      try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) continue;

        const normalized = parsed
          .map((item, idx) => normalizeTransaction(item, idx))
          .filter(Boolean) as JournalTransaction[];

        if (normalized.length > 0) {
          setTransactions(
            normalized.sort((a, b) => a.date.localeCompare(b.date))
          );
          // No borramos la legacy por seguridad: permite rollback si el usuario necesita.
        }
      } catch {
        // ignore
      }

      break;
    }
  }, [transactions.length, setTransactions]);

  return { transactions, setTransactions };
}
