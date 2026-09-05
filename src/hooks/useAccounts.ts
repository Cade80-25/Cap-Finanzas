import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";

export type Account = {
  /** Código único de la cuenta (ej: "activo-corriente", "custom-001"). */
  code: string;
  /** Nombre legible de la cuenta. */
  name: string;
  /** Tipo de cuenta contable. */
  type: "activo" | "pasivo" | "patrimonio" | "ingreso" | "gasto";
  /** Icono opcional para la UI. */
  icon?: string;
  /** Indica si es una cuenta personalizada (true) o del sistema (false). */
  isCustom?: boolean;
};

const CUSTOM_ACCOUNTS_KEY = "cap-finanzas-custom-accounts";

const defaultCustomAccounts: Account[] = [];

export function useAccounts() {
  const [customAccounts, setCustomAccounts] = useLocalStorage<Account[]>(
    CUSTOM_ACCOUNTS_KEY,
    defaultCustomAccounts
  );

  const addCustomAccount = useCallback(
    (account: Omit<Account, "isCustom">) => {
      const newAccount: Account = {
        ...account,
        isCustom: true,
        code: account.code || `custom-${Date.now()}`,
      };
      setCustomAccounts((prev) => [...prev, newAccount]);
      return newAccount;
    },
    [setCustomAccounts]
  );

  const editCustomAccount = useCallback(
    (code: string, updates: Partial<Omit<Account, "code" | "isCustom">>) => {
      setCustomAccounts((prev) =>
        prev.map((acc) =>
          acc.code === code ? { ...acc, ...updates } : acc
        )
      );
    },
    [setCustomAccounts]
  );

  const deleteCustomAccount = useCallback(
    (code: string) => {
      setCustomAccounts((prev) => prev.filter((acc) => acc.code !== code));
    },
    [setCustomAccounts]
  );

  const getAllAccounts = useCallback(
    (systemAccounts: Record<string, { type: Account["type"]; label: string; icon?: string }>) => {
      const accounts: Account[] = [];

      // Agregar cuentas del sistema
      for (const [code, info] of Object.entries(systemAccounts)) {
        accounts.push({
          code,
          name: info.label,
          type: info.type,
          icon: info.icon,
          isCustom: false,
        });
      }

      // Agregar cuentas personalizadas
      for (const custom of customAccounts) {
        // Evitar duplicados si el código ya existe en cuentas del sistema
        if (!systemAccounts[custom.code]) {
          accounts.push(custom);
        }
      }

      return accounts;
    },
    [customAccounts]
  );

  const getAccountByCode = useCallback(
    (code: string, systemAccounts: Record<string, { type: Account["type"]; label: string; icon?: string }>) => {
      if (systemAccounts[code]) {
        const sys = systemAccounts[code];
        return {
          code,
          name: sys.label,
          type: sys.type,
          icon: sys.icon,
          isCustom: false,
        };
      }
      return customAccounts.find((acc) => acc.code === code);
    },
    [customAccounts]
  );

  return {
    customAccounts,
    addCustomAccount,
    editCustomAccount,
    deleteCustomAccount,
    getAllAccounts,
    getAccountByCode,
  };
}
