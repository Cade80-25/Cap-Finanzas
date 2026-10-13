import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useWalletContext } from "@/contexts/WalletContext";

/** Inventario: artículos, stock, costos PEPS/UEPS/promedio y ajustes. v2 · P2 */
export type InventoryMethod = "promedio" | "peps" | "ueps";
export type StockMovementType = "entrada" | "salida" | "ajuste";

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  minimumStock: number;
  unitCost: number;
  method: InventoryMethod;
  location?: string;
  createdAt: string;
}

export interface StockMovement {
  id: string;
  itemId: string;
  date: string;
  type: StockMovementType;
  quantity: number;
  unitCost: number;
  reference?: string;
  notes?: string;
  createdAt: string;
}

const ITEMS_KEY = "cap-finanzas-inventario-items";
const MOVEMENTS_KEY = "cap-finanzas-inventario-movements";

function scoped(base: string, profile?: string, wallet?: string) {
  if (!profile || profile === "profile-default") return `${base}${wallet && wallet !== "wallet-default" ? `-${wallet}` : ""}`;
  return wallet && wallet !== "wallet-default" ? `${base}-${profile}-${wallet}` : `${base}-${profile}-default`;
}

function two(n: number) { return Math.round(n * 100) / 100; }

export function useInventario() {
  const { activeProfileId, activeWalletId } = useWalletContext();
  const itemsKey = scoped(ITEMS_KEY, activeProfileId, activeWalletId);
  const movementsKey = scoped(MOVEMENTS_KEY, activeProfileId, activeWalletId);

  const [items, setItems] = useLocalStorage<InventoryItem[]>(itemsKey, []);
  const [movements, setMovements] = useLocalStorage<StockMovement[]>(movementsKey, []);

  const addItem = useCallback((data: Omit<InventoryItem, "id" | "createdAt">) => {
    const item = { ...data, id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() };
    setItems(v => [...v, item]);
    return item;
  }, [setItems]);

  const updateItem = useCallback((id: string, patch: Partial<InventoryItem>) => {
    setItems(v => v.map(x => x.id === id ? { ...x, ...patch } : x));
  }, [setItems]);

  const deleteItem = useCallback((id: string) => {
    setItems(v => v.filter(x => x.id !== id));
    setMovements(v => v.filter(m => m.itemId !== id));
  }, [setItems, setMovements]);

  const addMovement = useCallback((data: Omit<StockMovement, "id" | "createdAt">) => {
    if (data.quantity <= 0) return null;
    const movement = { ...data, id: `stk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() };
    setMovements(v => [...v, movement]);
    setItems(v => v.map(item => {
      if (item.id !== data.itemId) return item;
      const quantity = data.type === "salida" ? item.quantity - data.quantity : item.quantity + data.quantity;
      let unitCost = item.unitCost;
      if (data.type === "entrada" && item.method === "promedio" && quantity > 0) {
        unitCost = two((item.quantity * item.unitCost + data.quantity * data.unitCost) / quantity);
      } else if (data.type === "ajuste") unitCost = data.unitCost;
      return { ...item, quantity: Math.max(0, quantity), unitCost };
    }));
    return movement;
  }, [setMovements, setItems]);

  const deleteMovement = useCallback((id: string) => {
    setMovements(v => v.filter(m => m.id !== id));
  }, [setMovements]);

  const inventoryValue = useMemo(() => items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0), [items]);
  const lowStock = useMemo(() => items.filter(i => i.quantity <= i.minimumStock), [items]);
  return { items, addItem, updateItem, deleteItem, movements, addMovement, deleteMovement, inventoryValue: two(inventoryValue), lowStock };
}

function filter<T>(array: T[], predicate: (item: T) => boolean) {
  return array.filter(predicate);
}
