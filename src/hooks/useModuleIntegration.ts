/**
 * Hook de integración entre módulos — Cap-Finanzas v2
 *
 * Conecta los módulos operativos (RRHH, Fabricación, Facturación, TPV)
 * con el Libro Diario. Genera asientos automáticos, marca los registros
 * como contabilizados y emite notificaciones.
 */

import { useCallback } from "react";
import { useJournalTransactions } from "@/hooks/useJournalTransactions";
import { useNotifications } from "@/hooks/useNotifications";
import {
  buildPayrollEntries,
  buildProductionEntries,
  buildMaterialConsumptionEntries,
  buildLaborAppliedEntries,
  buildInvoiceEntries,
  buildCollectionEntries,
  buildPaymentEntries,
  buildSaleEntries,
  buildPurchaseEntries,
  buildCostOfSalesEntries,
  buildInventoryAdjustmentEntries,
  isBalanced,
  draftsToTransactions,
  nextJournalId,
  type DraftEntry,
  type PayrollPostInput,
  type ProductionPostInput,
  type InvoicePostInput,
  type SalePostInput,
} from "@/lib/moduleIntegration";

const POSTED_KEY = "cap-finanzas-integration-posted";

function getPosted(): Record<string, PostedRef> {
  try {
    const raw = localStorage.getItem(POSTED_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function savePosted(posted: Record<string, PostedRef>) {
  localStorage.setItem(POSTED_KEY, JSON.stringify(posted));
}

export interface PostResult {
  ok: boolean;
  entries: number;
  message: string;
}

export function useModuleIntegration() {
  const { transactions, setTransactions } = useJournalTransactions();
  const { addNotification } = useNotifications();

  const postEntries = useCallback(
    (ref: string, kind: string, entries: DraftEntry[]): PostResult => {
      const posted = getPosted();
      if (posted[ref]) {
        return { ok: false, entries: 0, message: "Ya contabilizado" };
      }
      if (!isBalanced(entries)) {
        return { ok: false, entries: 0, message: "Asiento no cuadra" };
      }
      const startId = nextJournalId(transactions);
      const txs = draftsToTransactions(entries, startId);
      setTransactions((prev) => [...prev, ...txs]);
      posted[ref] = { ref, kind, date: entries[0]?.date || "", entries: txs.length };
      savePosted(posted);
      return { ok: true, entries: txs.length, message: `${txs.length} asientos generados` };
    },
    [transactions, setTransactions]
  );

  // ── RRHH ──

  const postPayroll = useCallback(
    (input: PayrollPostInput): PostResult => {
      const ref = `payroll:${input.payrollId}`;
      const entries = buildPayrollEntries(input);
      const result = postEntries(ref, "payroll", entries);
      if (result.ok) {
        addNotification({
          type: "info",
          title: "Nómina contabilizada",
          message: `${input.employeeName} — ${input.period}: ${result.entries} asientos`,
        });
      }
      return result;
    },
    [postEntries, addNotification]
  );

  // ── Fabricación ──

  const postProduction = useCallback(
    (input: ProductionPostInput): PostResult => {
      const ref = `production:${input.orderId}`;
      const entries = buildProductionEntries(input);
      const result = postEntries(ref, "production", entries);
      if (result.ok) {
        addNotification({
          type: "info",
          title: "Producción contabilizada",
          message: `${input.orderNumber} — ${input.productName}: ${result.entries} asientos`,
        });
      }
      return result;
    },
    [postEntries, addNotification]
  );

  const postMaterialConsumption = useCallback(
    (orderNumber: string, productName: string, amount: number, date?: string): PostResult => {
      const ref = `material:${orderNumber}:${date || ""}`;
      const entries = buildMaterialConsumptionEntries(orderNumber, productName, amount, date);
      return postEntries(ref, "material", entries);
    },
    [postEntries]
  );

  const postLaborApplied = useCallback(
    (orderNumber: string, productName: string, amount: number, date?: string): PostResult => {
      const ref = `labor:${orderNumber}:${date || ""}`;
      const entries = buildLaborAppliedEntries(orderNumber, productName, amount, date);
      return postEntries(ref, "labor", entries);
    },
    [postEntries]
  );

  // ── Facturación ──

  const postInvoice = useCallback(
    (input: InvoicePostInput): PostResult => {
      const ref = `invoice:${input.invoiceId}`;
      const entries = buildInvoiceEntries(input);
      const result = postEntries(ref, "invoice", entries);
      if (result.ok) {
        addNotification({
          type: "info",
          title: "Factura contabilizada",
          message: `${input.number} — ${input.clientName}: ${result.entries} asientos`,
        });
      }
      return result;
    },
    [postEntries, addNotification]
  );

  const postCollection = useCallback(
    (number: string, clientName: string, amount: number, date?: string): PostResult => {
      const ref = `collection:${number}:${date || ""}`;
      const entries = buildCollectionEntries(number, clientName, amount, date);
      return postEntries(ref, "collection", entries);
    },
    [postEntries]
  );

  const postPayment = useCallback(
    (number: string, providerName: string, amount: number, date?: string): PostResult => {
      const ref = `payment:${number}:${date || ""}`;
      const entries = buildPaymentEntries(number, providerName, amount, date);
      return postEntries(ref, "payment", entries);
    },
    [postEntries]
  );

  // ── TPV ──

  const postSale = useCallback(
    (input: SalePostInput): PostResult => {
      const ref = `sale:${input.saleId}`;
      const entries = buildSaleEntries(input);
      const result = postEntries(ref, "sale", entries);
      if (result.ok) {
        addNotification({
          type: "info",
          title: "Venta contabilizada",
          message: `TPV ${input.payment}: ${result.entries} asientos`,
        });
      }
      return result;
    },
    [postEntries, addNotification]
  );

  // ── Inventario ──

  const postPurchase = useCallback(
    (reference: string, supplierName: string, amount: number, payment: "efectivo" | "credito" | "transferencia", date?: string, refId?: string): PostResult => {
      const ref = `purchase:${refId || reference}:${date || ""}`;
      const entries = buildPurchaseEntries(reference, supplierName, amount, payment, date);
      const result = postEntries(ref, "purchase", entries);
      if (result.ok) {
        addNotification({
          type: "info",
          title: "Compra contabilizada",
          message: `${reference} — ${supplierName}: ${result.entries} asientos`,
        });
      }
      return result;
    },
    [postEntries, addNotification]
  );

  const postCostOfSales = useCallback(
    (reference: string, productName: string, amount: number, date?: string, refId?: string): PostResult => {
      const ref = `costsales:${refId || reference}:${date || ""}`;
      const entries = buildCostOfSalesEntries(reference, productName, amount, date);
      return postEntries(ref, "costsales", entries);
    },
    [postEntries]
  );

  const postInventoryAdjustment = useCallback(
    (movementId: string, itemName: string, amount: number, date?: string): PostResult => {
      const ref = `invadj:${movementId}`;
      const entries = buildInventoryAdjustmentEntries(itemName, amount, date);
      if (entries.length === 0) return { ok: false, entries: 0, message: "Ajuste sin efecto" };
      return postEntries(ref, "invadj", entries);
    },
    [postEntries]
  );

  // ── Utilidades ──

  const isPosted = useCallback((ref: string): boolean => {
    return !!getPosted()[ref];
  }, []);

  const getPostedRefs = useCallback((): Record<string, PostedRef> => {
    return getPosted();
  }, []);

  return {
    postPayroll,
    postProduction,
    postMaterialConsumption,
    postLaborApplied,
    postInvoice,
    postCollection,
    postPayment,
    postSale,
    postPurchase,
    postCostOfSales,
    postInventoryAdjustment,
    isPosted,
    getPostedRefs,
  };
}

export type { PostedRef };
