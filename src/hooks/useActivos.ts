import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useWalletContext } from "@/contexts/WalletContext";

/**
 * Activos fijos y logística — maquinaria, inmuebles, vehículos,
 * depreciación (lineal, saldo decreciente, unidades producidas),
 * mantenimiento y ubicaciones.
 * v2 · P2
 */

export type AssetCategory =
  | "maquinaria"
  | "inmueble"
  | "vehiculo"
  | "mobiliario"
  | "equipo_informatico"
  | "herramienta"
  | "otro";

export type DepreciationMethod = "lineal" | "saldo_decreciente" | "unidades_producidas";

export type AssetStatus = "activo" | "mantenimiento" | "baja" | "vendido";

export interface FixedAsset {
  id: string;
  code: string;
  name: string;
  category: AssetCategory;
  description?: string;
  location: string; // ubicación física / sucursal
  acquisitionDate: string;
  acquisitionCost: number;
  residualValue: number; // valor residual / de desecho
  usefulLifeYears: number;
  depreciationMethod: DepreciationMethod;
  decliningRate?: number; // % anual para saldo decreciente
  totalUnits?: number; // unidades producidas totales estimadas
  unitsProduced?: number; // unidades producidas hasta ahora
  status: AssetStatus;
  serialNumber?: string;
  responsible?: string; // responsable del activo
  notes?: string;
  createdAt: string;
}

export interface DepreciationEntry {
  id: string;
  assetId: string;
  period: string; // yyyy-mm
  amount: number;
  accumulated: number;
  bookValue: number;
  method: DepreciationMethod;
  notes?: string;
  createdAt: string;
}

export interface MaintenanceRecord {
  id: string;
  assetId: string;
  date: string;
  type: "preventivo" | "correctivo" | "inspeccion" | "reparacion";
  description: string;
  cost: number;
  provider?: string;
  nextDueDate?: string;
  createdAt: string;
}

export interface AssetDisposal {
  id: string;
  assetId: string;
  date: string;
  type: "venta" | "baja" | "donacion";
  saleValue: number;
  bookValueAtDisposal: number;
  gainLoss: number; // saleValue - bookValueAtDisposal
  notes?: string;
  createdAt: string;
}

const ASSETS_KEY = "cap-finanzas-activos-assets";
const DEPRECIATION_KEY = "cap-finanzas-activos-depreciation";
const MAINTENANCE_KEY = "cap-finanzas-activos-maintenance";
const DISPOSALS_KEY = "cap-finanzas-activos-disposals";

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

/** Años transcurridos (con decimales) desde la fecha de adquisición */
function yearsElapsed(acquisitionDate: string, asOf: Date = new Date()): number {
  const acq = new Date(acquisitionDate + "T00:00:00");
  if (isNaN(acq.getTime())) return 0;
  const ms = asOf.getTime() - acq.getTime();
  return Math.max(0, ms / (1000 * 60 * 60 * 24 * 365.25));
}

export function useActivos() {
  const { activeProfileId, activeWalletId } = useWalletContext();

  const assetsKey = scopedKey(ASSETS_KEY, activeProfileId, activeWalletId);
  const depreciationKey = scopedKey(DEPRECIATION_KEY, activeProfileId, activeWalletId);
  const maintenanceKey = scopedKey(MAINTENANCE_KEY, activeProfileId, activeWalletId);
  const disposalsKey = scopedKey(DISPOSALS_KEY, activeProfileId, activeWalletId);

  const [assets, setAssets] = useLocalStorage<FixedAsset[]>(assetsKey, []);
  const [depreciationEntries, setDepreciationEntries] = useLocalStorage<DepreciationEntry[]>(depreciationKey, []);
  const [maintenanceRecords, setMaintenanceRecords] = useLocalStorage<MaintenanceRecord[]>(maintenanceKey, []);
  const [disposals, setDisposals] = useLocalStorage<AssetDisposal[]>(disposalsKey, []);

  // --- Activos ---

  const addAsset = useCallback(
    (data: Omit<FixedAsset, "id" | "createdAt">) => {
      const asset: FixedAsset = {
        ...data,
        id: `ast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date().toISOString(),
      };
      setAssets((prev) => [...prev, asset]);
      return asset;
    },
    [setAssets]
  );

  const updateAsset = useCallback(
    (id: string, patch: Partial<FixedAsset>) => {
      setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
    },
    [setAssets]
  );

  const deleteAsset = useCallback(
    (id: string) => {
      setAssets((prev) => prev.filter((a) => a.id !== id));
      setDepreciationEntries((prev) => prev.filter((d) => d.assetId !== id));
      setMaintenanceRecords((prev) => prev.filter((m) => m.assetId !== id));
      setDisposals((prev) => prev.filter((d) => d.assetId !== id));
    },
    [setAssets, setDepreciationEntries, setMaintenanceRecords, setDisposals]
  );

  // --- Depreciación ---

  /**
   * Calcula la depreciación acumulada y el valor en libros de un activo.
   * - lineal: (costo - residual) / vida útil * años transcurridos
   * - saldo_decreciente: valor en libros * tasa anual, acumulado
   * - unidades_producidas: (costo - residual) * unidades producidas / total unidades
   */
  const calculateDepreciation = useCallback((asset: FixedAsset) => {
    const depreciableBase = Math.max(0, asset.acquisitionCost - asset.residualValue);

    if (asset.depreciationMethod === "unidades_producidas") {
      const total = asset.totalUnits || 0;
      const produced = asset.unitsProduced || 0;
      const ratio = total > 0 ? Math.min(1, produced / total) : 0;
      const accumulated = round2(depreciableBase * ratio);
      const bookValue = round2(asset.acquisitionCost - accumulated);
      return { accumulated, bookValue, annualDepreciation: 0 };
    }

    if (asset.depreciationMethod === "saldo_decreciente") {
      const rate = (asset.decliningRate ?? 0) / 100;
      const years = yearsElapsed(asset.acquisitionDate);
      let bookValue = asset.acquisitionCost;
      let accumulated = 0;
      // Iteramos por años completos + fracción del año en curso
      const fullYears = Math.floor(years);
      for (let i = 0; i < fullYears; i++) {
        const dep = bookValue * rate;
        const cappedDep = Math.min(dep, bookValue - asset.residualValue);
        if (cappedDep <= 0) break;
        accumulated += cappedDep;
        bookValue -= cappedDep;
      }
      const fraction = years - fullYears;
      if (fraction > 0 && bookValue > asset.residualValue) {
        const dep = bookValue * rate * fraction;
        const cappedDep = Math.min(dep, bookValue - asset.residualValue);
        accumulated += cappedDep;
        bookValue -= cappedDep;
      }
      const annual = bookValue * rate;
      return {
        accumulated: round2(accumulated),
        bookValue: round2(Math.max(asset.residualValue, bookValue)),
        annualDepreciation: round2(annual),
      };
    }

    // lineal (default)
    const life = asset.usefulLifeYears || 1;
    const annual = depreciableBase / life;
    const years = yearsElapsed(asset.acquisitionDate);
    const accumulated = round2(Math.min(depreciableBase, annual * years));
    const bookValue = round2(asset.acquisitionCost - accumulated);
    return { accumulated, bookValue, annualDepreciation: round2(annual) };
  }, []);

  const registerDepreciation = useCallback(
    (assetId: string, period: string, notes?: string) => {
      const asset = assets.find((a) => a.id === assetId);
      if (!asset) return null;

      const { accumulated, bookValue } = calculateDepreciation(asset);
      const prevEntries = depreciationEntries.filter((d) => d.assetId === assetId);
      const prevAccumulated = prevEntries.reduce((max, d) => Math.max(max, d.accumulated), 0);
      const delta = round2(Math.max(0, accumulated - prevAccumulated));

      const entry: DepreciationEntry = {
        id: `dep-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        assetId,
        period,
        amount: delta,
        accumulated,
        bookValue,
        method: asset.depreciationMethod,
        notes,
        createdAt: new Date().toISOString(),
      };
      setDepreciationEntries((prev) => [...prev, entry]);
      return entry;
    },
    [assets, depreciationEntries, calculateDepreciation, setDepreciationEntries]
  );

  const deleteDepreciation = useCallback(
    (id: string) => {
      setDepreciationEntries((prev) => prev.filter((d) => d.id !== id));
    },
    [setDepreciationEntries]
  );

  // --- Mantenimiento ---

  const addMaintenance = useCallback(
    (data: Omit<MaintenanceRecord, "id" | "createdAt">) => {
      const rec: MaintenanceRecord = {
        ...data,
        id: `mnt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date().toISOString(),
      };
      setMaintenanceRecords((prev) => [...prev, rec]);
      return rec;
    },
    [setMaintenanceRecords]
  );

  const deleteMaintenance = useCallback(
    (id: string) => {
      setMaintenanceRecords((prev) => prev.filter((m) => m.id !== id));
    },
    [setMaintenanceRecords]
  );

  // --- Bajas / ventas ---

  const registerDisposal = useCallback(
    (assetId: string, data: Omit<AssetDisposal, "id" | "assetId" | "bookValueAtDisposal" | "gainLoss" | "createdAt">) => {
      const asset = assets.find((a) => a.id === assetId);
      if (!asset) return null;
      const { bookValue } = calculateDepreciation(asset);
      const gainLoss = round2(data.saleValue - bookValue);
      const disposal: AssetDisposal = {
        ...data,
        id: `dis-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        assetId,
        bookValueAtDisposal: bookValue,
        gainLoss,
        createdAt: new Date().toISOString(),
      };
      setDisposals((prev) => [...prev, disposal]);
      // Actualiza el estado del activo
      updateAsset(assetId, {
        status: data.type === "venta" ? "vendido" : "baja",
      });
      return disposal;
    },
    [assets, calculateDepreciation, setDisposals, updateAsset]
  );

  const deleteDisposal = useCallback(
    (id: string) => {
      setDisposals((prev) => prev.filter((d) => d.id !== id));
    },
    [setDisposals]
  );

  // --- Derivados ---

  const assetValuations = useMemo(() => {
    const map = new Map<string, { accumulated: number; bookValue: number; annualDepreciation: number }>();
    for (const a of assets) {
      map.set(a.id, calculateDepreciation(a));
    }
    return map;
  }, [assets, calculateDepreciation]);

  const assetStats = useMemo(() => {
    let totalCost = 0;
    let totalBookValue = 0;
    let totalAccumulated = 0;
    let totalAnnualDepreciation = 0;
    let active = 0;
    let inMaintenance = 0;

    for (const a of assets) {
      totalCost += a.acquisitionCost;
      const val = assetValuations.get(a.id);
      if (val) {
        totalBookValue += val.bookValue;
        totalAccumulated += val.accumulated;
        totalAnnualDepreciation += val.annualDepreciation;
      }
      if (a.status === "activo") active++;
      else if (a.status === "mantenimiento") inMaintenance++;
    }

    return {
      totalCost: round2(totalCost),
      totalBookValue: round2(totalBookValue),
      totalAccumulated: round2(totalAccumulated),
      totalAnnualDepreciation: round2(totalAnnualDepreciation),
      active,
      inMaintenance,
      count: assets.length,
    };
  }, [assets, assetValuations]);

  const byCategory = useMemo(() => {
    const map = new Map<AssetCategory, { count: number; cost: number; bookValue: number }>();
    for (const a of assets) {
      const cur = map.get(a.category) ?? { count: 0, cost: 0, bookValue: 0 };
      cur.count++;
      cur.cost += a.acquisitionCost;
      const val = assetValuations.get(a.id);
      cur.bookValue += val ? val.bookValue : 0;
      map.set(a.category, cur);
    }
    return map;
  }, [assets, assetValuations]);

  const maintenanceStats = useMemo(() => {
    let totalCost = 0;
    let preventive = 0;
    let corrective = 0;
    const upcoming: MaintenanceRecord[] = [];

    for (const m of maintenanceRecords) {
      totalCost += m.cost;
      if (m.type === "preventivo") preventive++;
      else if (m.type === "correctivo") corrective++;
    }

    return {
      totalCost: round2(totalCost),
      preventive,
      corrective,
      count: maintenanceRecords.length,
    };
  }, [maintenanceRecords]);

  const disposalStats = useMemo(() => {
    let totalSaleValue = 0;
    let totalBookValue = 0;
    let totalGainLoss = 0;
    for (const d of disposals) {
      totalSaleValue += d.saleValue;
      totalBookValue += d.bookValueAtDisposal;
      totalGainLoss += d.gainLoss;
    }
    return {
      totalSaleValue: round2(totalSaleValue),
      totalBookValue: round2(totalBookValue),
      totalGainLoss: round2(totalGainLoss),
      count: disposals.length,
    };
  }, [disposals]);

  const assetDepreciationMap = useMemo(() => {
    const map = new Map<string, DepreciationEntry[]>();
    for (const d of depreciationEntries) {
      const arr = map.get(d.assetId);
      if (arr) arr.push(d);
      else map.set(d.assetId, [d]);
    }
    return map;
  }, [depreciationEntries]);

  const assetMaintenanceMap = useMemo(() => {
    const map = new Map<string, MaintenanceRecord[]>();
    for (const m of maintenanceRecords) {
      const arr = map.get(m.assetId);
      if (arr) arr.push(m);
      else map.set(m.assetId, [m]);
    }
    return map;
  }, [maintenanceRecords]);

  return {
    assets,
    addAsset,
    updateAsset,
    deleteAsset,
    depreciationEntries,
    calculateDepreciation,
    registerDepreciation,
    deleteDepreciation,
    maintenanceRecords,
    addMaintenance,
    deleteMaintenance,
    disposals,
    registerDisposal,
    deleteDisposal,
    assetValuations,
    assetStats,
    byCategory,
    maintenanceStats,
    disposalStats,
    assetDepreciationMap,
    assetMaintenanceMap,
  };
}
