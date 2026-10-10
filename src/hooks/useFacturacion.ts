import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useWalletContext } from "@/contexts/WalletContext";
import { useCuentasCorrientes } from "./useCuentasCorrientes";

/**
 * Facturación + IVA configurable (v2 · P1)
 * ----------------------------------------
 * Facturas, notas de crédito/débito, IVA configurable por país,
 * numeración propia, y asiento automático en Cuentas Corrientes.
 *
 * Integración:
 * - Al crear una factura → movimiento en Cuentas Corrientes (CCMovement)
 * - Al crear nota de crédito/débito → movimiento en CC vinculado
 * - Opcional: asiento en Libro Diario (journalTxId)
 */

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  /** Tasa de IVA aplicable a este item (0, 5, 10, 22, etc.) */
  vatRate: number;
}

export type InvoiceStatus = "pendiente" | "pagada" | "anulada";
export type InvoiceType = "factura" | "nota-credito" | "nota-debito";

export interface Invoice {
  id: string;
  number: string; // ej: FAC-0001, NC-0001, ND-0001
  type: InvoiceType;
  date: string; // ISO yyyy-mm-dd
  dueDate?: string;
  contactId: string; // vinculo con Cuentas Corrientes
  contactName: string; // snapshot del nombre
  items: InvoiceItem[];
  subtotal: number;
  vatAmount: number;
  total: number;
  status: InvoiceStatus;
  notes?: string;
  /** Para notas: factura original que anula/modifica */
  relatedInvoiceId?: string;
  /** Asiento en Libro Diario (si se contabilizó) */
  journalTxId?: number;
  createdAt: string;
}

export interface VatConfig {
  /** Tasa por defecto (%) */
  defaultRate: number;
  /** Tasas disponibles para seleccionar */
  availableRates: number[];
  /** Prefijo de numeración para facturas */
  invoicePrefix: string;
  /** Prefijo para notas de crédito */
  creditNotePrefix: string;
  /** Prefijo para notas de débito */
  debitNotePrefix: string;
  /** Correlativo actual (se incrementa automáticamente) */
  nextNumber: number;
  /** Nombre del impuesto (IVA, ITBMS, etc.) */
  taxName: string;
}

const INVOICES_BASE_KEY = "cap-finanzas-invoices";
const VAT_CONFIG_BASE_KEY = "cap-finanzas-vat-config";

const DEFAULT_VAT_CONFIG: VatConfig = {
  defaultRate: 22,
  availableRates: [0, 5, 10, 22],
  invoicePrefix: "FAC-",
  creditNotePrefix: "NC-",
  debitNotePrefix: "ND-",
  nextNumber: 1,
  taxName: "IVA",
};

function scopedKey(base: string, profileId?: string, walletId?: string): string {
  const isDefaultProfile = !profileId || profileId === "profile-default";
  const isDefaultWallet = !walletId || walletId === "wallet-default";
  if (isDefaultProfile && isDefaultWallet) return base;
  if (isDefaultProfile) return `${base}-${walletId}`;
  if (isDefaultWallet) return `${base}-${profileId}-default`;
  return `${base}-${profileId}-${walletId}`;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function todayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export interface InvoiceDraft {
  type: InvoiceType;
  date: string;
  dueDate?: string;
  contactId: string;
  items: Omit<InvoiceItem, "id">[];
  notes?: string;
  relatedInvoiceId?: string;
}

export function useFacturacion() {
  const { activeProfileId, activeWalletId } = useWalletContext();
  const { addMovement } = useCuentasCorrientes();

  const invoicesKey = scopedKey(INVOICES_BASE_KEY, activeProfileId, activeWalletId);
  const vatConfigKey = scopedKey(VAT_CONFIG_BASE_KEY, activeProfileId, activeWalletId);

  const [invoices, setInvoices] = useLocalStorage<Invoice[]>(invoicesKey, []);
  const [vatConfig, setVatConfig] = useLocalStorage<VatConfig>(vatConfigKey, DEFAULT_VAT_CONFIG);

  const updateVatConfig = useCallback(
    (patch: Partial<VatConfig>) => {
      setVatConfig((prev) => ({ ...prev, ...patch }));
    },
    [setVatConfig]
  );

  const generateNumber = useCallback(
    (type: InvoiceType): string => {
      const prefix =
        type === "factura"
          ? vatConfig.invoicePrefix
          : type === "nota-credito"
          ? vatConfig.creditNotePrefix
          : vatConfig.debitNotePrefix;
      const num = String(vatConfig.nextNumber).padStart(4, "0");
      return `${prefix}${num}`;
    },
    [vatConfig]
  );

  const createInvoice = useCallback(
    (draft: InvoiceDraft): Invoice | null => {
      const contact = draft.contactId;
      if (!contact) return null;

      const items: InvoiceItem[] = draft.items.map((item) => ({
        ...item,
        id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      }));

      const subtotal = round2(
        items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
      );
      const vatAmount = round2(
        items.reduce(
          (sum, item) => sum + (item.quantity * item.unitPrice * item.vatRate) / 100,
          0
        )
      );
      const total = round2(subtotal + vatAmount);

      const number = generateNumber(draft.type);

      const invoice: Invoice = {
        id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        number,
        type: draft.type,
        date: draft.date,
        dueDate: draft.dueDate,
        contactId: draft.contactId,
        contactName: "", // se llena desde CC
        items,
        subtotal,
        vatAmount,
        total,
        status: "pendiente",
        notes: draft.notes,
        relatedInvoiceId: draft.relatedInvoiceId,
        createdAt: new Date().toISOString(),
      };

      setInvoices((prev) => [...prev, invoice]);

      // Incrementar correlativo
      setVatConfig((prev) => ({ ...prev, nextNumber: prev.nextNumber + 1 }));

      // Integración con Cuentas Corrientes
      const isCredit = draft.type === "nota-credito";
      const isDebit = draft.type === "nota-debito";
      const ccType = isCredit
        ? "nota-credito"
        : isDebit
        ? "nota-debito"
        : "factura";

      addMovement({
        contactId: draft.contactId,
        date: draft.date,
        dueDate: draft.dueDate,
        kind: ccType,
        amount: total,
        description: `${number} - ${draft.items.map((i) => i.description).join(", ").slice(0, 50)}`,
      });

      return invoice;
    },
    [generateNumber, setInvoices, setVatConfig, addMovement]
  );

  const updateInvoiceStatus = useCallback(
    (id: string, status: InvoiceStatus) => {
      setInvoices((prev) =>
        prev.map((inv) => (inv.id === id ? { ...inv, status } : inv))
      );
    },
    [setInvoices]
  );

  const deleteInvoice = useCallback(
    (id: string) => {
      setInvoices((prev) => prev.filter((inv) => inv.id !== id));
    },
    [setInvoices]
  );

  // --- Derivados ---

  const invoicesByContact = useMemo(() => {
    const map = new Map<string, Invoice[]>();
    for (const inv of invoices) {
      const arr = map.get(inv.contactId);
      if (arr) arr.push(inv);
      else map.set(inv.contactId, [inv]);
    }
    return map;
  }, [invoices]);

  const stats = useMemo(() => {
    let totalFacturado = 0;
    let totalPendiente = 0;
    let totalIVA = 0;
    let countPendientes = 0;

    for (const inv of invoices) {
      if (inv.status === "anulada") continue;
      if (inv.type === "factura") {
        totalFacturado += inv.total;
        totalIVA += inv.vatAmount;
        if (inv.status === "pendiente") {
          totalPendiente += inv.total;
          countPendientes++;
        }
      } else if (inv.type === "nota-credito") {
        totalFacturado -= inv.total;
        totalIVA -= inv.vatAmount;
      } else if (inv.type === "nota-debito") {
        totalFacturado += inv.total;
        totalIVA += inv.vatAmount;
      }
    }

    const r2 = (n: number) => Math.round(n * 100) / 100;
    return {
      totalFacturado: r2(totalFacturado),
      totalPendiente: r2(totalPendiente),
      totalIVA: r2(totalIVA),
      countPendientes,
      countTotal: invoices.length,
    };
  }, [invoices]);

  return {
    invoices,
    vatConfig,
    updateVatConfig,
    createInvoice,
    updateInvoiceStatus,
    deleteInvoice,
    invoicesByContact,
    stats,
  };
}
