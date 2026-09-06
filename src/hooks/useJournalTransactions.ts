import { useEffect, useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useWalletContext } from "@/contexts/WalletContext";

/** Línea de un asiento compuesto. */
export interface JournalLine {
  account: string;
  debit?: number;
  credit?: number;
  description?: string;
}

export type JournalTransaction = {
  id: number;
  date: string;
  account: string;
  description: string;
  debit: number;
  credit: number;
  // New fields
  price?: number;
  quantity?: number;
  creditor?: string;
  notes?: string;
  subcategory?: string;
  /** Human-readable calculator expression that produced the amount (e.g. "1050 ÷ 3 = 350"). */
  calcExpression?: string;
  /** Indica si la transacción fue conciliada (reconciliación bancaria). */
  reconciled?: boolean;
  /** Asiento compuesto: líneas de débito/crédito cuando isCompound === true. */
  isCompound?: boolean;
  lines?: JournalLine[];
};

// KEY ÚNICA Y DEFINITIVA para todas las transacciones
const JOURNAL_KEY = "cap-finanzas-journal";
const MIGRATION_DONE_KEY = "cap-finanzas-journal-migrated";

// Keys legacy para migración automática
const LEGACY_KEYS = [
  "cap-finanzas-libro-diario-transactions",
  "cap-finanzas-transacciones",
  "cap-finanzas-transactions",
  "transactions",
  "finanzas-transacciones",
  "libro-diario-transactions",
  "journal-transactions",
  "diario-transacciones",
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

  // Retrocompatibilidad: transacciones viejas sin el campo = no conciliadas
  const reconciled = raw.reconciled === true || raw.reconciled === 1 || raw.reconciled === "true";

  return {
    id,
    date,
    account: account || "gastos-operativos",
    description: description || "(sin descripción)",
    debit,
    credit,
    reconciled,
  };
}

// Función para obtener transacciones directamente de localStorage
function getStoredTransactions(): JournalTransaction[] {
  // Primero intentar la key principal
  const mainData = localStorage.getItem(JOURNAL_KEY);
  if (mainData) {
    try {
      const parsed = JSON.parse(mainData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {}
  }
  
  // Si no hay datos en la key principal, buscar en legacy
  for (const legacyKey of LEGACY_KEYS) {
    const raw = localStorage.getItem(legacyKey);
    if (!raw) continue;
    
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) continue;
      
      const normalized = parsed
        .map((item, idx) => normalizeTransaction(item, idx))
        .filter(Boolean) as JournalTransaction[];
      
      if (normalized.length > 0) {
        // Migrar datos a la nueva key
        const sorted = normalized.sort((a, b) => a.date.localeCompare(b.date));
        localStorage.setItem(JOURNAL_KEY, JSON.stringify(sorted));
        return sorted;
      }
    } catch {}
  }
  
  return [];
}

export function useJournalTransactionsForWallet(walletId?: string, profileId?: string) {
  // Build storage key: profile + wallet scoped
  const isDefaultProfile = !profileId || profileId === "profile-default";
  const isDefaultWallet = !walletId || walletId === "wallet-default";
  
  let storageKey: string;
  if (isDefaultProfile && isDefaultWallet) {
    storageKey = JOURNAL_KEY; // backward compatible
  } else if (isDefaultProfile) {
    storageKey = `cap-finanzas-journal-${walletId}`;
  } else if (isDefaultWallet) {
    storageKey = `cap-finanzas-journal-${profileId}-default`;
  } else {
    storageKey = `cap-finanzas-journal-${profileId}-${walletId}`;
  }

  const [transactions, setTransactionsInternal] = useLocalStorage<JournalTransaction[]>(
    storageKey,
    []
  );

  // Migración automática al montar (solo una vez, solo para la key principal)
  useEffect(() => {
    if (storageKey !== JOURNAL_KEY) return;
    const alreadyMigrated = localStorage.getItem(MIGRATION_DONE_KEY);
    if (alreadyMigrated) return;

    if (transactions.length === 0) {
      const migrated = getStoredTransactions();
      if (migrated.length > 0) {
        setTransactionsInternal(migrated);
      }
    }
    // Marcar migración como hecha y limpiar keys legacy
    localStorage.setItem(MIGRATION_DONE_KEY, "true");
    LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
  }, []);

  // Wrapper directo: useLocalStorage ya maneja persistencia y sincronización
  const setTransactions = useCallback(
    (value: JournalTransaction[] | ((prev: JournalTransaction[]) => JournalTransaction[])) => {
      setTransactionsInternal(value);
    },
    [setTransactionsInternal]
  );

  return { transactions, setTransactions };
}

export function useJournalTransactions() {
  const { activeProfileId, activeWalletId } = useWalletContext();
  return useJournalTransactionsForWallet(activeWalletId, activeProfileId);
}

// --- Helper functions para asientos compuestos ---

export function isCompoundTransaction(tx: JournalTransaction): boolean {
  return tx.isCompound === true && Array.isArray(tx.lines) && tx.lines.length >= 2;
}

export function getTransactionBalance(tx: JournalTransaction): number {
  if (isCompoundTransaction(tx)) {
    return tx.lines!.reduce((sum, l) => sum + (l.debit || 0) - (l.credit || 0), 0);
  }
  return (tx.debit || 0) - (tx.credit || 0);
}

export function getCompoundAccounts(tx: JournalTransaction): string[] {
  if (!isCompoundTransaction(tx)) return [];
  return tx.lines!.map(l => l.account).filter(Boolean);
}
