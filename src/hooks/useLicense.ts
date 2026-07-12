import { useLocalStorage } from "./useLocalStorage";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type LicenseMode = "simple" | "traditional";
export type LicenseStatus = "trial" | "active" | "expired";

interface LicenseTokenData {
  token: string;
  exp: number; // unix seconds
  code: string;
  activated_at: string;
  installation_id: string;
}

interface LicenseData {
  mode: LicenseMode;
  trialStartDate: string | null;
  // Legacy fields kept for backward compatibility with stored state
  activatedAt: string | null;
  licenseCode: string | null;
  isActivated: boolean;
  purchasedModes: LicenseMode[];
  extraAccountSlots: number;
  usedAccountCodes: string[];
}

const TRIAL_DAYS = 30;
const LICENSE_KEY = "cap-finanzas-license";
const TOKEN_KEY = "cap-finanzas-license-token";
const INSTALLATION_KEY = "cap-finanzas-installation-id";
const TRIAL_MAX_PROFILES = 3;
const ACTIVE_MAX_PROFILES = 50;

function getInstallationId(): string {
  let id = localStorage.getItem(INSTALLATION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(INSTALLATION_KEY, id);
  }
  return id;
}

function readToken(): LicenseTokenData | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LicenseTokenData;
    if (!parsed.token || !parsed.exp || !parsed.installation_id) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeToken(data: LicenseTokenData) {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(data));
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function isTokenValid(t: LicenseTokenData | null, installationId: string): boolean {
  if (!t) return false;
  if (t.installation_id !== installationId) return false;
  const nowSec = Math.floor(Date.now() / 1000);
  return t.exp > nowSec;
}

const defaultLicenseData: LicenseData = {
  mode: "simple",
  trialStartDate: null,
  activatedAt: null,
  licenseCode: null,
  isActivated: false,
  purchasedModes: [],
  extraAccountSlots: 0,
  usedAccountCodes: [],
};

export function useLicense() {
  const [licenseData, setLicenseData] = useLocalStorage<LicenseData>(
    LICENSE_KEY,
    defaultLicenseData,
  );
  const installationId = useMemo(() => getInstallationId(), []);
  const [token, setTokenState] = useState<LicenseTokenData | null>(() => readToken());

  // Initialize trial on first use
  const initializeTrial = useCallback(() => {
    if (!licenseData.trialStartDate) {
      setLicenseData((prev) => ({
        ...prev,
        trialStartDate: new Date().toISOString(),
      }));
    }
  }, [licenseData.trialStartDate, setLicenseData]);

  // Trial info (includes referral bonus days)
  const trialInfo = useMemo(() => {
    if (!licenseData.trialStartDate) {
      return { daysRemaining: TRIAL_DAYS, isExpired: false, bonusDays: 0 };
    }
    const bonusDays = parseInt(
      localStorage.getItem("cap-finanzas-referral-bonus") || "0",
      10,
    );
    const totalTrialDays = TRIAL_DAYS + bonusDays;
    const startDate = new Date(licenseData.trialStartDate);
    const now = new Date();
    const diffTime = now.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, totalTrialDays - diffDays);
    return {
      daysRemaining,
      isExpired: daysRemaining <= 0,
      bonusDays,
    };
  }, [licenseData.trialStartDate]);

  // App is fully free — everyone gets full access.
  const status = "active" as LicenseStatus;

  const isModeAvailable = useCallback(
    (_mode: LicenseMode): boolean =>
      status === "trial" || status === "active",
    [status],
  );

  const setMode = useCallback(
    (mode: LicenseMode) => {
      if (isModeAvailable(mode)) {
        setLicenseData((prev) => ({ ...prev, mode }));
      }
    },
    [isModeAvailable, setLicenseData],
  );

  // Server activation
  const activateLicense = useCallback(
    async (
      code: string,
    ): Promise<{ success: boolean; message: string }> => {
      const cleanCode = code.trim().toUpperCase();
      if (!cleanCode) {
        return { success: false, message: "Ingresa un código de licencia." };
      }

      try {
        const { data, error } = await supabase.functions.invoke(
          "license-activate",
          { body: { code: cleanCode, installation_id: installationId } },
        );

        if (error) {
          // Network or non-2xx
          const msg =
            (error as any)?.context?.responseJson?.error ||
            (error as any)?.message ||
            "network_error";
          return {
            success: false,
            message: humanizeError(msg),
          };
        }

        if (!data?.token) {
          return {
            success: false,
            message: "Respuesta inválida del servidor. Intenta de nuevo.",
          };
        }

        const newToken: LicenseTokenData = {
          token: data.token,
          exp: data.exp,
          activated_at: data.activated_at,
          code: cleanCode,
          installation_id: installationId,
        };
        writeToken(newToken);
        setTokenState(newToken);

        // Mirror for backwards compatibility
        setLicenseData((prev) => ({
          ...prev,
          activatedAt: data.activated_at,
          licenseCode: cleanCode,
          isActivated: true,
          purchasedModes: ["simple", "traditional"],
        }));

        return {
          success: true,
          message:
            "¡Licencia activada exitosamente! Tienes acceso completo a Cap Finanzas.",
        };
      } catch (e: any) {
        return {
          success: false,
          message:
            "No se pudo conectar con el servidor. Necesitas conexión a internet para activar la licencia la primera vez.",
        };
      }
    },
    [installationId, setLicenseData],
  );

  // Periodic re-validation when online (silent)
  useEffect(() => {
    let cancelled = false;
    const t = readToken();
    if (!t) return;
    // Only revalidate if we have internet
    if (typeof navigator !== "undefined" && navigator.onLine === false) return;

    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke(
          "license-verify",
          { body: { token: t.token, installation_id: t.installation_id } },
        );
        if (cancelled) return;

        if (error) {
          // Distinguish revoked/invalid vs network
          const status = (error as any)?.context?.status;
          if (status === 401 || status === 403 || status === 404) {
            clearToken();
            setTokenState(null);
          }
          // network errors: keep cached token
          return;
        }

        if (data?.token) {
          const renewed: LicenseTokenData = {
            token: data.token,
            exp: data.exp,
            activated_at: data.activated_at ?? t.activated_at,
            code: t.code,
            installation_id: t.installation_id,
          };
          writeToken(renewed);
          setTokenState(renewed);
        }
      } catch {
        // offline: keep cached token
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const pricing = { full: 10 };

  const referralAccountBonus = Math.min(
    parseInt(localStorage.getItem("cap-finanzas-referral-count") || "0", 10),
    5,
  );
  const accountSlots =
    status === "trial" ? 3 : Math.min(5 + referralAccountBonus, 10);
  const maxProfiles =
    status === "active" ? ACTIVE_MAX_PROFILES : TRIAL_MAX_PROFILES;

  return {
    mode: licenseData.mode,
    status,
    trialInfo,
    purchasedModes:
      status === "active" ? (["simple", "traditional"] as LicenseMode[]) : [],
    initializeTrial,
    setMode,
    activateLicense,
    isModeAvailable,
    pricing,
    accountSlots,
    maxProfiles,
    licenseToken: token?.token ?? null,
    licenseCode: token?.code ?? licenseData.licenseCode ?? null,
    installationId,
  };
}

function humanizeError(err: string): string {
  switch (err) {
    case "code_not_found":
      return "Código de licencia inválido. Verifica que esté escrito correctamente.";
    case "code_revoked":
      return "Esta licencia fue revocada. Contacta a soporte.";
    case "code_used_elsewhere":
      return "Este código ya fue activado en otra instalación.";
    case "invalid_input":
      return "Código con formato inválido.";
    case "network_error":
    default:
      return "No se pudo conectar con el servidor. Verifica tu conexión a internet e intenta de nuevo.";
  }
}
