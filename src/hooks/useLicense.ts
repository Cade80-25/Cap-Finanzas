import { useLocalStorage } from "./useLocalStorage";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CONFIG } from "@/lib/config";

export type LicenseMode = "simple" | "traditional";
export type LicenseStatus = "trial" | "active" | "expired";

interface LicenseTokenData {
  token: string;
  exp: number;
  code: string;
  activated_at: string;
  installation_id: string;
}

interface LicenseData {
  mode: LicenseMode;
  trialStartDate: string | null;
  activatedAt: string | null;
  licenseCode: string | null;
  isActivated: boolean;
  purchasedModes: LicenseMode[];
  extraAccountSlots: number;
  usedAccountCodes: string[];
}

const LICENSE_KEY = "cap-finanzas-license";
const TOKEN_KEY = "cap-finanzas-license-token";
const INSTALLATION_KEY = "cap-finanzas-installation-id";

function getInstallationId(): string {
  let id = localStorage.getItem(INSTALLATION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(INSTALLATION_KEY, id);
  }
  return id;
}

function readToken(installationId: string): LicenseTokenData | null {
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
  try {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(data));
  } catch {
    // localStorage lleno o desactivado
  }
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
    defaultLicenseData
  );
  const installationId = useMemo(() => getInstallationId(), []);
  const [token, setTokenState] = useState<LicenseTokenData | null>(() => readToken(installationId));

  useEffect(() => {
    setTokenState(readToken(installationId));
  }, [installationId]);

  const initializeTrial = useCallback(() => {
    if (!licenseData.trialStartDate) {
      setLicenseData((prev) => ({
        ...prev,
        trialStartDate: new Date().toISOString(),
      }));
    }
  }, [licenseData.trialStartDate, setLicenseData]);

  const trialInfo = useMemo(() => {
    if (!licenseData.trialStartDate) {
      return { daysRemaining: CONFIG.TRIAL_DAYS, isExpired: false, bonusDays: 0 };
    }
    const bonusDays = parseInt(
      localStorage.getItem("cap-finanzas-referral-bonus") || "0",
      10
    );
    const totalTrialDays = CONFIG.TRIAL_DAYS + bonusDays;
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

  const hasValidToken = isTokenValid(token, installationId);
  const status: LicenseStatus = hasValidToken
    ? "active"
    : trialInfo.isExpired
      ? "expired"
      : "trial";

  const isModeAvailable = useCallback(
    (_mode: LicenseMode): boolean => {
      // Licencia activada localmente (isActivated) habilita ambos modos,
      // incluso sin conexión al servidor de verificación.
      if (licenseData.isActivated) return true;
      return status === "trial" || status === "active";
    },
    [licenseData.isActivated, status]
  );

  const getDaysUntilExpiry = useCallback((): number => {
    if (hasValidToken) {
      const nowSec = Math.floor(Date.now() / 1000);
      return Math.max(0, Math.floor((token!.exp - nowSec) / 86400));
    }
    return trialInfo.daysRemaining;
  }, [hasValidToken, token, trialInfo.daysRemaining]);

  const setMode = useCallback(
    (mode: LicenseMode) => {
      if (isModeAvailable(mode)) {
        setLicenseData((prev) => ({ ...prev, mode }));
      }
    },
    [isModeAvailable, setLicenseData]
  );

  const activateLicense = useCallback(
    async (
      code: string
    ): Promise<{ success: boolean; message: string }> => {
      const cleanCode = code.trim().toUpperCase();
      if (!cleanCode) {
        return { success: false, message: "Ingresa un código de licencia." };
      }

      try {
        const { data, error } = await supabase.functions.invoke(
          "license-activate",
          { body: { code: cleanCode, installation_id: installationId } }
        );

        if (error) {
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

        setLicenseData((prev) => ({
          ...prev,
          activatedAt: data.activated_at,
          licenseCode: cleanCode,
          isActivated: true,
          purchasedModes: ["simple", "traditional"],
        }));

        return {
          success: true,
          message: "¡Licencia activada exitosamente!",
        };
      } catch (e: any) {
        return {
          success: false,
          message: "No se pudo conectar con el servidor.",
        };
      }
    },
    [installationId, setLicenseData]
  );

  useEffect(() => {
    let cancelled = false;
    const t = readToken(installationId);
    if (!t) return;
    if (typeof navigator !== "undefined" && navigator.onLine === false) return;

    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke(
          "license-verify",
          { body: { token: t.token, installation_id: t.installation_id } }
        );
        if (cancelled) return;

        if (error) {
          const status = (error as any)?.context?.status;
          if (status === 401 || status === 403 || status === 404) {
            clearToken();
            setTokenState(null);
          }
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
        // offline
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [installationId]);

  const pricing = {
    personal: CONFIG.PRICING.PERSONAL.price,
    empresarial: CONFIG.PRICING.EMPRESARIAL.price,
  };

  const referralAccountBonus = Math.min(
    parseInt(localStorage.getItem("cap-finanzas-referral-count") || "0", 10),
    5
  );
  const accountSlots = Math.min(5 + referralAccountBonus, 10);
  const maxProfiles = 50;

  // Modos comprados: prioriza lo guardado localmente (isActivated).
  // Si la licencia está activada localmente, respeta purchasedModes persistido.
  const purchasedModes: LicenseMode[] = licenseData.isActivated
    ? licenseData.purchasedModes.length > 0
      ? licenseData.purchasedModes
      : ["simple", "traditional"]
    : status === "active"
      ? ["simple", "traditional"]
      : [];

  // Ajusta el modo al arrancar si el modo persistido no está entre los comprados
  // (p.ej. solo compró "simple" pero quedó "traditional" guardado).
  useEffect(() => {
    if (purchasedModes.length === 1 && licenseData.mode !== purchasedModes[0]) {
      setLicenseData((prev) => ({ ...prev, mode: purchasedModes[0] }));
    }
  }, [purchasedModes, licenseData.mode, setLicenseData]);

  return {
    mode: licenseData.mode,
    status,
    trialInfo,
    purchasedModes,
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
    getDaysUntilExpiry,
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
