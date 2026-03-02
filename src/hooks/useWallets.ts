import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useLicense } from "./useLicense";

export interface Wallet {
  id: string;
  name: string;
  icon: string;
  createdAt: string;
}

interface WalletsData {
  activeWalletId: string;
  wallets: Wallet[];
}

const WALLETS_KEY = "cap-finanzas-wallets";
const DEFAULT_WALLET_ID = "wallet-default";

const WALLET_ICONS = ["💼", "🏠", "🛒", "💰", "🎓", "🏦", "✈️", "🎯", "🚗", "❤️"];

const defaultWalletsData: WalletsData = {
  activeWalletId: DEFAULT_WALLET_ID,
  wallets: [
    {
      id: DEFAULT_WALLET_ID,
      name: "Principal",
      icon: "💼",
      createdAt: new Date().toISOString(),
    },
  ],
};

export function useWallets() {
  const [data, setData] = useLocalStorage<WalletsData>(WALLETS_KEY, defaultWalletsData);
  const { accountSlots } = useLicense();

  const maxWallets = accountSlots;

  const activeWallet = useMemo(
    () => data.wallets.find((w) => w.id === data.activeWalletId) ?? data.wallets[0],
    [data]
  );

  const canAddWallet = data.wallets.length < maxWallets;

  const setActiveWallet = useCallback(
    (walletId: string) => {
      setData((prev) => ({ ...prev, activeWalletId: walletId }));
    },
    [setData]
  );

  const addWallet = useCallback(
    (name: string, icon?: string): { success: boolean; message: string } => {
      if (data.wallets.length >= maxWallets) {
        return {
          success: false,
          message: `Has alcanzado el límite de ${maxWallets} cuentas. Activa una cuenta adicional ($2) para agregar más.`,
        };
      }

      const newWallet: Wallet = {
        id: `wallet-${Date.now()}`,
        name: name.trim() || `Cuenta ${data.wallets.length + 1}`,
        icon: icon || WALLET_ICONS[data.wallets.length % WALLET_ICONS.length],
        createdAt: new Date().toISOString(),
      };

      setData((prev) => ({
        ...prev,
        wallets: [...prev.wallets, newWallet],
        activeWalletId: newWallet.id,
      }));

      return { success: true, message: `Cuenta "${newWallet.name}" creada` };
    },
    [data.wallets.length, maxWallets, setData]
  );

  const renameWallet = useCallback(
    (walletId: string, name: string, icon?: string) => {
      setData((prev) => ({
        ...prev,
        wallets: prev.wallets.map((w) =>
          w.id === walletId ? { ...w, name: name.trim() || w.name, ...(icon ? { icon } : {}) } : w
        ),
      }));
    },
    [setData]
  );

  const deleteWallet = useCallback(
    (walletId: string): { success: boolean; message: string } => {
      if (walletId === DEFAULT_WALLET_ID) {
        return { success: false, message: "No puedes eliminar la cuenta principal" };
      }
      if (data.wallets.length <= 1) {
        return { success: false, message: "Debes tener al menos una cuenta" };
      }

      setData((prev) => {
        const newWallets = prev.wallets.filter((w) => w.id !== walletId);
        // Remove wallet's transactions from localStorage
        localStorage.removeItem(`cap-finanzas-journal-${walletId}`);
        return {
          ...prev,
          wallets: newWallets,
          activeWalletId:
            prev.activeWalletId === walletId ? newWallets[0].id : prev.activeWalletId,
        };
      });

      return { success: true, message: "Cuenta eliminada" };
    },
    [data.wallets.length, setData]
  );

  return {
    wallets: data.wallets,
    activeWallet,
    activeWalletId: data.activeWalletId,
    maxWallets,
    canAddWallet,
    setActiveWallet,
    addWallet,
    renameWallet,
    deleteWallet,
    walletIcons: WALLET_ICONS,
  };
}
