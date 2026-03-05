import { createContext, useContext, ReactNode } from "react";
import { useWallets, Wallet } from "@/hooks/useWallets";
import { useProfiles, Profile } from "@/hooks/useProfiles";

interface WalletContextValue {
  // Profiles
  profiles: Profile[];
  activeProfile: Profile;
  activeProfileId: string;
  maxProfiles: number;
  canAddProfile: boolean;
  setActiveProfile: (id: string) => void;
  addProfile: (name: string, avatar?: string) => { success: boolean; message: string };
  renameProfile: (id: string, name: string, avatar?: string) => void;
  deleteProfile: (id: string) => { success: boolean; message: string };
  setProfilePhoto: (id: string, photoUrl: string | null) => void;
  profileAvatars: string[];

  // Wallets (scoped to active profile)
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
  const profilesHook = useProfiles();
  // Pass active profile ID to scope wallets
  const walletsHook = useWallets(profilesHook.activeProfileId);

  const value: WalletContextValue = {
    ...profilesHook,
    ...walletsHook,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWalletContext() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWalletContext must be used within WalletProvider");
  return ctx;
}
