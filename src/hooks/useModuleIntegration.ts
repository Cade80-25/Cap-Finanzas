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
  buildAssetAcquisitionEntries,
  buildDepreciationEntries,
  buildDisposalEntries,
  buildExpenseApprovalEntries,
  buildExpenseReimbursementEntries,
  buildBankTxEntries,
  buildContractBillingEntries,
  buildRentCollectionEntries,
  buildTripEntries,
  buildMaintenanceEntries,
  buildClaimEntries,
  buildImportEntries,
  buildExportEntries,
  buildCampaignEntries,
  buildStartupFundingEntries,
  buildStartupRevenueEntries,
  buildFindingProvisionEntries,
  isBalanced,
  draftsToTransactions,
  nextJournalId,
  type DraftEntry,
  type PostedRef,
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

          category: "sistema",

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

          category: "sistema",

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

          category: "sistema",

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

          category: "sistema",

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

          category: "sistema",

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

  // ── Activos fijos ──

  const postAssetAcquisition = useCallback(
    (assetId: string, assetName: string, cost: number, date?: string): PostResult => {
      const ref = `assetacq:${assetId}`;
      return postEntries(ref, "assetacq", buildAssetAcquisitionEntries(assetName, cost, date));
    },
    [postEntries]
  );

  const postDepreciation = useCallback(
    (depId: string, assetName: string, period: string, amount: number, date?: string): PostResult => {
      const ref = `depreciation:${depId}`;
      const entries = buildDepreciationEntries(assetName, period, amount, date);
      if (entries.length === 0) return { ok: false, entries: 0, message: "Depreciación sin efecto" };
      return postEntries(ref, "depreciation", entries);
    },
    [postEntries]
  );

  const postDisposal = useCallback(
    (disposalId: string, assetName: string, saleValue: number, bookValue: number, date?: string): PostResult => {
      const ref = `disposal:${disposalId}`;
      return postEntries(ref, "disposal", buildDisposalEntries(assetName, saleValue, bookValue, date));
    },
    [postEntries]
  );

  // ── Gastos ──

  const postExpenseApproval = useCallback(
    (expenseId: string, employeeName: string, description: string, amount: number, date?: string): PostResult => {
      const ref = `expappr:${expenseId}`;
      return postEntries(ref, "expappr", buildExpenseApprovalEntries(employeeName, description, amount, date));
    },
    [postEntries]
  );

  const postExpenseReimbursement = useCallback(
    (expenseId: string, employeeName: string, description: string, amount: number, date?: string): PostResult => {
      const ref = `expreimb:${expenseId}`;
      return postEntries(ref, "expreimb", buildExpenseReimbursementEntries(employeeName, description, amount, date));
    },
    [postEntries]
  );

  // ── Banca ──

  const postBankTx = useCallback(
    (txId: string, description: string, amount: number, date?: string): PostResult => {
      const ref = `banktx:${txId}`;
      const entries = buildBankTxEntries(description, amount, date);
      if (entries.length === 0) return { ok: false, entries: 0, message: "Movimiento sin efecto" };
      return postEntries(ref, "banktx", entries);
    },
    [postEntries]
  );

  // ── Contratos ──

  const postContractBilling = useCallback(
    (billingId: string, contractName: string, period: string, amount: number, date?: string): PostResult => {
      const ref = `contractbill:${billingId}`;
      return postEntries(ref, "contractbill", buildContractBillingEntries(contractName, period, amount, date));
    },
    [postEntries]
  );

  // ── Alquiler ──

  const postRentCollection = useCallback(
    (paymentId: string, propertyName: string, period: string, amount: number, date?: string): PostResult => {
      const ref = `rent:${paymentId}`;
      return postEntries(ref, "rent", buildRentCollectionEntries(propertyName, period, amount, date));
    },
    [postEntries]
  );

  // ── Flota ──

  const postTrip = useCallback(
    (tripId: string, vehicleLabel: string, fuelCost: number, tolls: number, date?: string): PostResult => {
      const ref = `trip:${tripId}`;
      const entries = buildTripEntries(vehicleLabel, fuelCost, tolls, date);
      if (entries.length === 0) return { ok: false, entries: 0, message: "Viaje sin costos" };
      return postEntries(ref, "trip", entries);
    },
    [postEntries]
  );

  // ── Mantenimiento ──

  const postMaintenance = useCallback(
    (orderId: string, assetName: string, description: string, cost: number, date?: string): PostResult => {
      const ref = `maintenance:${orderId}`;
      const entries = buildMaintenanceEntries(assetName, description, cost, date);
      if (entries.length === 0) return { ok: false, entries: 0, message: "Orden sin costo" };
      return postEntries(ref, "maintenance", entries);
    },
    [postEntries]
  );

  // ── Seguros ──

  const postClaim = useCallback(
    (claimId: string, policyNumber: string, claimDescription: string, amount: number, date?: string): PostResult => {
      const ref = `claim:${claimId}`;
      const entries = buildClaimEntries(policyNumber, claimDescription, amount, date);
      if (entries.length === 0) return { ok: false, entries: 0, message: "Siniestro sin monto" };
      return postEntries(ref, "claim", entries);
    },
    [postEntries]
  );

  // ── Comercio Exterior ──

  const postImport = useCallback(
    (operationId: string, description: string, goodsValue: number, duties: number, freight: number, insurance: number, date?: string): PostResult => {
      const ref = `import:${operationId}`;
      const entries = buildImportEntries(description, goodsValue, duties, freight, insurance, date);
      if (entries.length === 0) return { ok: false, entries: 0, message: "Importación sin monto" };
      return postEntries(ref, "import", entries);
    },
    [postEntries]
  );

  const postExport = useCallback(
    (operationId: string, description: string, amount: number, date?: string): PostResult => {
      const ref = `export:${operationId}`;
      const entries = buildExportEntries(description, amount, date);
      if (entries.length === 0) return { ok: false, entries: 0, message: "Exportación sin monto" };
      return postEntries(ref, "export", entries);
    },
    [postEntries]
  );

  // ── Marketing y Ventas ──

  const postCampaign = useCallback(
    (campaignId: string, campaignName: string, spent: number, revenue: number, date?: string): PostResult => {
      const ref = `campaign:${campaignId}`;
      const entries = buildCampaignEntries(campaignName, spent, revenue, date);
      if (entries.length === 0) return { ok: false, entries: 0, message: "Campaña sin movimientos" };
      return postEntries(ref, "campaign", entries);
    },
    [postEntries]
  );

  // ── Startups ──

  const postStartupFunding = useCallback(
    (startupId: string, startupName: string, amount: number, date?: string): PostResult => {
      const ref = `startupfund:${startupId}`;
      const entries = buildStartupFundingEntries(startupName, amount, date);
      if (entries.length === 0) return { ok: false, entries: 0, message: "Aporte sin monto" };
      return postEntries(ref, "startupfund", entries);
    },
    [postEntries]
  );

  const postStartupRevenue = useCallback(
    (startupId: string, startupName: string, period: string, mrr: number, date?: string): PostResult => {
      const ref = `startuprev:${startupId}:${period}`;
      const entries = buildStartupRevenueEntries(startupName, period, mrr, date);
      if (entries.length === 0) return { ok: false, entries: 0, message: "MRR sin monto" };
      return postEntries(ref, "startuprev", entries);
    },
    [postEntries]
  );

  // ── Auditoría ──

  const postFindingProvision = useCallback(
    (findingId: string, findingTitle: string, amount: number, date?: string): PostResult => {
      const ref = `findingprov:${findingId}`;
      const entries = buildFindingProvisionEntries(findingTitle, amount, date);
      if (entries.length === 0) return { ok: false, entries: 0, message: "Hallazgo sin impacto económico" };
      return postEntries(ref, "findingprov", entries);
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
    postAssetAcquisition,
    postDepreciation,
    postDisposal,
    postExpenseApproval,
    postExpenseReimbursement,
    postBankTx,
    postContractBilling,
    postRentCollection,
    postTrip,
    postMaintenance,
    postClaim,
    postImport,
    postExport,
    postCampaign,
    postStartupFunding,
    postStartupRevenue,
    postFindingProvision,
    isPosted,
    getPostedRefs,
  };
}

export type { PostedRef };
