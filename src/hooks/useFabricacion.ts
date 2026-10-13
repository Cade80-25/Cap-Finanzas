import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useWalletContext } from "@/contexts/WalletContext";

/**
 * Fabricación contable — BOM, órdenes de producción, WIP, costeo,
 * variaciones, subproductos y subcontratación
 * v2 · P1
 */

export type ProductType = "terminado" | "subproducto" | "servicio";

export interface BillOfMaterial {
  id: string;
  productId: string;
  materialId: string;
  materialName: string;
  quantity: number;
  unit: string;
  unitCost: number;
  scrapPercent: number;
  notes?: string;
  createdAt: string;
}

export type OrderStatus = "planificada" | "en_produccion" | "pausada" | "completada" | "cancelada";

export interface ProductionOrder {
  id: string;
  orderNumber: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  status: OrderStatus;
  plannedStart: string;
  plannedEnd: string;
  actualStart?: string;
  actualEnd?: string;
  bomCost: number; // costo estándar calculado del BOM
  actualCost: number; // costo real (materiales + mano de obra + gastos)
  overheadApplied: number; // gastos generales aplicados
  variances: CostVariance[];
  wipEntries: WipEntry[];
  notes?: string;
  createdAt: string;
}

export interface CostVariance {
  id: string;
  orderId: string;
  type: "material_price" | "material_quantity" | "labor_rate" | "labor_efficiency" | "overhead" | "subproduct" | "subcontract";
  description: string;
  standardCost: number;
  actualCost: number;
  variance: number; // actual - standard (negativo = favorable)
  percentVariance: number;
  notes?: string;
  createdAt: string;
}

export interface WipEntry {
  id: string;
  orderId: string;
  date: string;
  type: "material" | "labor" | "overhead" | "subcontract" | "transfer";
  description: string;
  amount: number;
  account: string;
  createdAt: string;
}

export interface SubcontractOrder {
  id: string;
  orderNumber: string;
  providerId: string;
  providerName: string;
  orderId: string; // orden de producción relacionada
  description: string;
  amount: number;
  status: "pendiente" | "en_proceso" | "completada" | "cancelada";
  startDate: string;
  endDate: string;
  costVariance: number; // diferencia con costo estándar
  notes?: string;
  createdAt: string;
}

export interface FinishedProduct {
  id: string;
  sku: string;
  name: string;
  type: ProductType;
  unit: string;
  standardCost: number;
  salePrice: number;
  createdAt: string;
}

const BOM_KEY = "cap-finanzas-fabricacion-bom";
const ORDERS_KEY = "cap-finanzas-fabricacion-orders";
const VARIANCES_KEY = "cap-finanzas-fabricacion-variances";
const SUBCONTRACTS_KEY = "cap-finanzas-fabricacion-subcontracts";
const PRODUCTS_KEY = "cap-finanzas-fabricacion-products";

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

function currentPeriod(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function useFabricacion() {
  const { activeProfileId, activeWalletId } = useWalletContext();

  const bomKey = scopedKey(BOM_KEY, activeProfileId, activeWalletId);
  const ordersKey = scopedKey(ORDERS_KEY, activeProfileId, activeWalletId);
  const variancesKey = scopedKey(VARIANCES_KEY, activeProfileId, activeWalletId);
  const subcontractsKey = scopedKey(SUBCONTRACTS_KEY, activeProfileId, activeWalletId);
  const productsKey = scopedKey(PRODUCTS_KEY, activeProfileId, activeWalletId);

  const [bomEntries, setBomEntries] = useLocalStorage<BillOfMaterial[]>(bomKey, []);
  const [orders, setOrders] = useLocalStorage<ProductionOrder[]>(ordersKey, []);
  const [variances, setVariances] = useLocalStorage<CostVariance[]>(variancesKey, []);
  const [subcontracts, setSubcontracts] = useLocalStorage<SubcontractOrder[]>(subcontractsKey, []);
  const [products, setProducts] = useLocalStorage<FinishedProduct[]>(productsKey, []);

  // --- Productos terminados ---

  const addProduct = useCallback(
    (data: Omit<FinishedProduct, "id" | "createdAt">) => {
      const product: FinishedProduct = {
        ...data,
        id: `prod-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date().toISOString(),
      };
      setProducts((prev) => [...prev, product]);
      return product;
    },
    [setProducts]
  );

  const updateProduct = useCallback(
    (id: string, patch: Partial<FinishedProduct>) => {
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    },
    [setProducts]
  );

  const deleteProduct = useCallback(
    (id: string) => {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setBomEntries((prev) => prev.filter((b) => b.productId !== id));
    },
    [setProducts, setBomEntries]
  );

  // --- BOM (Lista de materiales) ---

  const addBomEntry = useCallback(
    (data: Omit<BillOfMaterial, "id" | "createdAt">) => {
      const entry: BillOfMaterial = {
        ...data,
        id: `bom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date().toISOString(),
      };
      setBomEntries((prev) => [...prev, entry]);
      return entry;
    },
    [setBomEntries]
  );

  const updateBomEntry = useCallback(
    (id: string, patch: Partial<BillOfMaterial>) => {
      setBomEntries((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    },
    [setBomEntries]
  );

  const deleteBomEntry = useCallback(
    (id: string) => {
      setBomEntries((prev) => prev.filter((b) => b.id !== id));
    },
    [setBomEntries]
  );

  const getBomForProduct = useCallback(
    (productId: string) => bomEntries.filter((b) => b.productId === productId),
    [bomEntries]
  );

  const calculateBomCost = useCallback(
    (productId: string): number => {
      const entries = getBomForProduct(productId);
      return round2(
        entries.reduce((sum, e) => {
          const scrapFactor = 1 + (e.scrapPercent || 0) / 100;
          return sum + e.quantity * e.unitCost * scrapFactor;
        }, 0)
      );
    },
    [getBomForProduct]
  );

  // --- Órdenes de producción ---

  const createProductionOrder = useCallback(
    (data: Omit<ProductionOrder, "id" | "createdAt" | "status" | "bomCost" | "actualCost" | "overheadApplied" | "variances" | "wipEntries">) => {
      const bomCost = calculateBomCost(data.productId);
      const order: ProductionOrder = {
        ...data,
        id: `ord-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        status: "planificada",
        bomCost,
        actualCost: 0,
        overheadApplied: 0,
        variances: [],
        wipEntries: [],
        createdAt: new Date().toISOString(),
      };
      setOrders((prev) => [...prev, order]);
      return order;
    },
    [calculateBomCost, setOrders]
  );

  const updateOrder = useCallback(
    (id: string, patch: Partial<ProductionOrder>) => {
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
    },
    [setOrders]
  );

  const startProduction = useCallback(
    (id: string) => {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === id
            ? { ...o, status: "en_produccion" as OrderStatus, actualStart: todayISO() }
            : o
        )
      );
    },
    [setOrders]
  );

  const pauseProduction = useCallback(
    (id: string) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: "pausada" as OrderStatus } : o))
      );
    },
    [setOrders]
  );

  const completeProduction = useCallback(
    (id: string) => {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === id
            ? { ...o, status: "completada" as OrderStatus, actualEnd: todayISO() }
            : o
        )
      );
    },
    [setOrders]
  );

  const cancelOrder = useCallback(
    (id: string) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: "cancelada" as OrderStatus } : o))
      );
    },
    [setOrders]
  );

  const deleteOrder = useCallback(
    (id: string) => {
      setOrders((prev) => prev.filter((o) => o.id !== id));
      setVariances((prev) => prev.filter((v) => v.orderId !== id));
    },
    [setOrders, setVariances]
  );

  // --- WIP (Work in Progress) ---

  const addWipEntry = useCallback(
    (orderId: string, data: Omit<WipEntry, "id" | "orderId" | "createdAt">) => {
      const entry: WipEntry = {
        ...data,
        id: `wip-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        orderId,
        createdAt: new Date().toISOString(),
      };
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== orderId) return o;
          const wipEntries = [...o.wipEntries, entry];
          const actualCost = round2(wipEntries.reduce((sum, e) => sum + e.amount, 0));
          return { ...o, wipEntries, actualCost };
        })
      );
      return entry;
    },
    [setOrders]
  );

  const deleteWipEntry = useCallback(
    (orderId: string, entryId: string) => {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== orderId) return o;
          const wipEntries = o.wipEntries.filter((e) => e.id !== entryId);
          const actualCost = round2(wipEntries.reduce((sum, e) => sum + e.amount, 0));
          return { ...o, wipEntries, actualCost };
        })
      );
    },
    [setOrders]
  );

  // --- Variaciones de costo ---

  const addVariance = useCallback(
    (orderId: string, data: Omit<CostVariance, "id" | "orderId" | "variance" | "percentVariance" | "createdAt">) => {
      const variance = round2(data.actualCost - data.standardCost);
      const percentVariance = data.standardCost !== 0 ? round2((variance / data.standardCost) * 100) : 0;
      const v: CostVariance = {
        ...data,
        id: `var-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        orderId,
        variance,
        percentVariance,
        createdAt: new Date().toISOString(),
      };
      setVariances((prev) => [...prev, v]);
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== orderId) return o;
          const variances = [...o.variances, v];
          return { ...o, variances };
        })
      );
      return v;
    },
    [setVariances, setOrders]
  );

  const deleteVariance = useCallback(
    (id: string) => {
      setVariances((prev) => prev.filter((v) => v.id !== id));
    },
    [setVariances]
  );

  // --- Subcontratación ---

  const addSubcontract = useCallback(
    (data: Omit<SubcontractOrder, "id" | "createdAt" | "status" | "costVariance">) => {
      const sub: SubcontractOrder = {
        ...data,
        id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        status: "pendiente",
        costVariance: 0,
        createdAt: new Date().toISOString(),
      };
      setSubcontracts((prev) => [...prev, sub]);
      return sub;
    },
    [setSubcontracts]
  );

  const updateSubcontractStatus = useCallback(
    (id: string, status: SubcontractOrder["status"]) => {
      setSubcontracts((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
    },
    [setSubcontracts]
  );

  const deleteSubcontract = useCallback(
    (id: string) => {
      setSubcontracts((prev) => prev.filter((s) => s.id !== id));
    },
    [setSubcontracts]
  );

  // --- Derivados ---

  const orderStats = useMemo(() => {
    let totalBomCost = 0;
    let totalActualCost = 0;
    let totalOverhead = 0;
    let totalVariance = 0;
    let inProduction = 0;
    let completed = 0;
    let planned = 0;

    for (const o of orders) {
      totalBomCost += o.bomCost;
      totalActualCost += o.actualCost;
      totalOverhead += o.overheadApplied;
      if (o.status === "en_produccion" || o.status === "pausada") inProduction++;
      else if (o.status === "completada") completed++;
      else if (o.status === "planificada") planned++;
    }

    for (const v of variances) {
      totalVariance += v.variance;
    }

    return {
      totalBomCost: round2(totalBomCost),
      totalActualCost: round2(totalActualCost),
      totalOverhead: round2(totalOverhead),
      totalVariance: round2(totalVariance),
      inProduction,
      completed,
      planned,
      count: orders.length,
    };
  }, [orders, variances]);

  const varianceStats = useMemo(() => {
    let favorable = 0;
    let unfavorable = 0;
    let totalVariance = 0;
    const byType: Record<string, { count: number; variance: number }> = {};

    for (const v of variances) {
      totalVariance += v.variance;
      if (v.variance < 0) favorable += Math.abs(v.variance);
      else unfavorable += v.variance;
      if (!byType[v.type]) byType[v.type] = { count: 0, variance: 0 };
      byType[v.type].count++;
      byType[v.type].variance += v.variance;
    }

    return {
      favorable: round2(favorable),
      unfavorable: round2(unfavorable),
      totalVariance: round2(totalVariance),
      count: variances.length,
      byType,
    };
  }, [variances]);

  const subcontractStats = useMemo(() => {
    let totalAmount = 0;
    let pending = 0;
    let inProcess = 0;
    let completed = 0;
    for (const s of subcontracts) {
      totalAmount += s.amount;
      if (s.status === "pendiente") pending++;
      else if (s.status === "en_proceso") inProcess++;
      else if (s.status === "completada") completed++;
    }
    return {
      totalAmount: round2(totalAmount),
      pending,
      inProcess,
      completed,
      count: subcontracts.length,
    };
  }, [subcontracts]);

  const productMap = useMemo(() => {
    const map = new Map<string, FinishedProduct>();
    for (const p of products) map.set(p.id, p);
    return map;
  }, [products]);

  return {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    bomEntries,
    addBomEntry,
    updateBomEntry,
    deleteBomEntry,
    getBomForProduct,
    calculateBomCost,
    orders,
    createProductionOrder,
    updateOrder,
    startProduction,
    pauseProduction,
    completeProduction,
    cancelOrder,
    deleteOrder,
    addWipEntry,
    deleteWipEntry,
    variances,
    addVariance,
    deleteVariance,
    subcontracts,
    addSubcontract,
    updateSubcontractStatus,
    deleteSubcontract,
    orderStats,
    varianceStats,
    subcontractStats,
    productMap,
    currentPeriod,
  };
}
