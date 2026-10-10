import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useWalletContext } from "@/contexts/WalletContext";

/**
 * Cuentas Corrientes (v2 · P1)
 * ----------------------------
 * Deudores (clientes que nos deben) y Acreedores (proveedores a quienes debemos),
 * con antigüedad de saldos 30/60/90 días y cobros/pagos parciales.
 *
 * Es una capa de gestión sobre el motor de doble entrada: cada factura o cobro
 * puede vincularse (journalTxId) a un asiento del Libro Diario, pero funciona
 * de forma autónoma para quien solo quiere controlar quién le debe.
 */

export type ContactType = "cliente" | "proveedor";

export interface Contact {
  id: string;
  name: string;
  type: ContactType;
  taxId?: string; // RUT / CUIT / NIF / RFC
  phone?: string;
  email?: string;
  notes?: string;
  createdAt: string;
}

/** Tipo de movimiento dentro de la cuenta corriente de un contacto. */
export type CCMovementKind =
  | "factura" // aumenta la deuda (cliente nos debe / nosotros debemos al proveedor)
  | "nota-debito" // aumenta la deuda
  | "nota-credito" // disminuye la deuda
  | "cobro" // el cliente paga (disminuye lo que nos debe)
  | "pago"; // nosotros pagamos al proveedor (disminuye lo que debemos)

export interface CCMovement {
  id: string;
  contactId: string;
  date: string; // ISO yyyy-mm-dd
  dueDate?: string; // vencimiento (para antigüedad)
  kind: CCMovementKind;
  amount: number; // siempre positivo; el signo lo define `kind`
  description: string;
  /** Referencia al asiento del Libro Diario, si se contabilizó. */
  journalTxId?: number;
  createdAt: string;
}

export interface CCMovementDraft {
  contactId: string;
  date: string;
  dueDate?: string;
  kind: CCMovementKind;
  amount: number;
  description: string;
  journalTxId?: number;
}

const CONTACTS_BASE_KEY = "cap-finanzas-contacts";
const MOVEMENTS_BASE_KEY = "cap-finanzas-cc-movements";

function scopedKey(base: string, profileId?: string, walletId?: string): string {
  const isDefaultProfile = !profileId || profileId === "profile-default";
  const isDefaultWallet = !walletId || walletId === "wallet-default";
  if (isDefaultProfile && isDefaultWallet) return base;
  if (isDefaultProfile) return `${base}-${walletId}`;
  if (isDefaultWallet) return `${base}-${profileId}-default`;
  return `${base}-${profileId}-${walletId}`;
}

/** Signo del movimiento respecto del saldo del contacto (positivo = debe más). */
function signedAmount(m: CCMovement): number {
  switch (m.kind) {
    case "factura":
    case "nota-debito":
      return m.amount;
    case "nota-credito":
    case "cobro":
    case "pago":
      return -m.amount;
    default:
      return 0;
  }
}

export interface AgingBuckets {
  corriente: number; // no vencido
  d1_30: number;
  d31_60: number;
  d61_90: number;
  d90mas: number;
  total: number;
}

export interface ContactBalance {
  contact: Contact;
  saldo: number;
  aging: AgingBuckets;
  vencido: number;
  movimientos: number;
}

export interface CCStats {
  totalPorCobrar: number;
  totalPorPagar: number;
  clientesConSaldo: number;
  proveedoresConSaldo: number;
  agingCobrar: AgingBuckets;
  agingPagar: AgingBuckets;
}

const EMPTY_AGING: AgingBuckets = {
  corriente: 0,
  d1_30: 0,
  d31_60: 0,
  d61_90: 0,
  d90mas: 0,
  total: 0,
};

function todayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function daysBetween(fromISO: string, toISO: string): number {
  const a = new Date(`${fromISO}T00:00:00`).getTime();
  const b = new Date(`${toISO}T00:00:00`).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return Math.floor((b - a) / 86400000);
}

function addToBucket(b: AgingBuckets, daysOverdue: number, amount: number) {
  if (daysOverdue <= 0) b.corriente += amount;
  else if (daysOverdue <= 30) b.d1_30 += amount;
  else if (daysOverdue <= 60) b.d31_60 += amount;
  else if (daysOverdue <= 90) b.d61_90 += amount;
  else b.d90mas += amount;
  b.total += amount;
}

export function useCuentasCorrientes() {
  const { activeProfileId, activeWalletId } = useWalletContext();

  const contactsKey = scopedKey(CONTACTS_BASE_KEY, activeProfileId, activeWalletId);
  const movementsKey = scopedKey(MOVEMENTS_BASE_KEY, activeProfileId, activeWalletId);

  const [contacts, setContacts] = useLocalStorage<Contact[]>(contactsKey, []);
  const [movements, setMovements] = useLocalStorage<CCMovement[]>(movementsKey, []);

  const addContact = useCallback(
    (draft: Omit<Contact, "id" | "createdAt">): Contact => {
      const contact: Contact = {
        ...draft,
        id: `contact-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date().toISOString(),
      };
      setContacts((prev) => [...prev, contact]);
      return contact;
    },
    [setContacts]
  );

  const updateContact = useCallback(
    (id: string, patch: Partial<Omit<Contact, "id" | "createdAt">>) => {
      setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    },
    [setContacts]
  );

  const deleteContact = useCallback(
    (id: string) => {
      setContacts((prev) => prev.filter((c) => c.id !== id));
      setMovements((prev) => prev.filter((m) => m.contactId !== id));
    },
    [setContacts, setMovements]
  );

  const addMovement = useCallback(
    (draft: CCMovementDraft): CCMovement => {
      const movement: CCMovement = {
        ...draft,
        amount: Math.abs(draft.amount) || 0,
        id: `ccm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date().toISOString(),
      };
      setMovements((prev) => [...prev, movement]);
      return movement;
    },
    [setMovements]
  );

  const deleteMovement = useCallback(
    (id: string) => {
      setMovements((prev) => prev.filter((m) => m.id !== id));
    },
    [setMovements]
  );

  // --- Derivados ---

  const movementsByContact = useMemo(() => {
    const map = new Map<string, CCMovement[]>();
    for (const m of movements) {
      const arr = map.get(m.contactId);
      if (arr) arr.push(m);
      else map.set(m.contactId, [m]);
    }
    return map;
  }, [movements]);

  const balanceFor = useCallback(
    (contactId: string, refDate?: string): ContactBalance | null => {
      const contact = contacts.find((c) => c.id === contactId);
      if (!contact) return null;
      const list = movementsByContact.get(contactId) ?? [];
      const today = refDate ?? todayISO();
      const aging: AgingBuckets = { ...EMPTY_AGING };
      let saldo = 0;

      for (const m of list) {
        const signed = signedAmount(m);
        saldo += signed;
        // La antigüedad solo se calcula sobre deuda viva de facturas/ND
        if (signed > 0) {
          const due = m.dueDate || m.date;
          addToBucket(aging, daysBetween(due, today), signed);
        }
      }

      return {
        contact,
        saldo: Math.round(saldo * 100) / 100,
        aging,
        vencido:
          Math.round((aging.d1_30 + aging.d31_60 + aging.d61_90 + aging.d90mas) * 100) / 100,
        movimientos: list.length,
      };
    },
    [contacts, movementsByContact]
  );

  const balances = useMemo(() => {
    const today = todayISO();
    const out: ContactBalance[] = [];
    for (const c of contacts) {
      const b = balanceFor(c.id, today);
      if (b) out.push(b);
    }
    return out;
  }, [contacts, balanceFor]);

  const stats: CCStats = useMemo(() => {
    const cobrar: AgingBuckets = { ...EMPTY_AGING };
    const pagar: AgingBuckets = { ...EMPTY_AGING };
    let clientesConSaldo = 0;
    let proveedoresConSaldo = 0;
    let totalPorCobrar = 0;
    let totalPorPagar = 0;

    for (const b of balances) {
      if (b.contact.type === "cliente") {
        if (Math.abs(b.saldo) > 0.004) clientesConSaldo++;
        totalPorCobrar += b.saldo;
        cobrar.corriente += b.aging.corriente;
        cobrar.d1_30 += b.aging.d1_30;
        cobrar.d31_60 += b.aging.d31_60;
        cobrar.d61_90 += b.aging.d61_90;
        cobrar.d90mas += b.aging.d90mas;
        cobrar.total += b.aging.total;
      } else {
        if (Math.abs(b.saldo) > 0.004) proveedoresConSaldo++;
        totalPorPagar += b.saldo;
        pagar.corriente += b.aging.corriente;
        pagar.d1_30 += b.aging.d1_30;
        pagar.d31_60 += b.aging.d31_60;
        pagar.d61_90 += b.aging.d61_90;
        pagar.d90mas += b.aging.d90mas;
        pagar.total += b.aging.total;
      }
    }

    const r2 = (n: number) => Math.round(n * 100) / 100;
    return {
      totalPorCobrar: r2(totalPorCobrar),
      totalPorPagar: r2(totalPorPagar),
      clientesConSaldo,
      proveedoresConSaldo,
      agingCobrar: { ...cobrar, total: r2(cobrar.total) },
      agingPagar: { ...pagar, total: r2(pagar.total) },
    };
  }, [balances]);

  return {
    contacts,
    movements,
    addContact,
    updateContact,
    deleteContact,
    addMovement,
    deleteMovement,
    balanceFor,
    balances,
    stats,
  };
}
