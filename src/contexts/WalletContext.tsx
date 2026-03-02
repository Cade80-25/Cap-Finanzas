import { createContext, useContext, ReactNode } from "react";
import { useWallets, Wallet } from "@/hooks/useWallets";

interface WalletContextValue {
  wallets: Wallet[];
  activeWallet: Wallet;
  activeWalletId: string;
  maxWallets: number;
  canAddWallet: boolean;
  setActiveWallet: (id: string) => void;
  addWallet: (name: string, icon?: string) => { success: boolean; message: string };
  renameWallet: (id: string, name: string, icon?: string) => void;
  deleteWallet: (id: string) => { success: boolean; message: string };
  walletIcons: string[];
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const wallets = useWallets();
  return <WalletContext.Provider value={wallets}>{children}</WalletContext.Provider>;
}

export function useWalletContext() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWalletContext must be used within WalletProvider");
  return ctx;
}
