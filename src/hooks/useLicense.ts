import { useLocalStorage } from "./useLocalStorage";
import { useCallback, useMemo } from "react";

export type LicenseMode = "simple" | "traditional";
export type LicenseStatus = "trial" | "active" | "expired";

interface LicenseData {
  mode: LicenseMode;
  trialStartDate: string | null;
  activatedAt: string | null;
  licenseCode: string | null;
  purchasedModes: LicenseMode[];
}

const TRIAL_DAYS = 30;
const LICENSE_KEY = "cap-finanzas-license";

// Simple validation: codes are like "CF-SIMPLE-XXXX" or "CF-TRAD-XXXX"
function validateLicenseCode(code: string): { valid: boolean; mode: LicenseMode | null } {
  const cleanCode = code.trim().toUpperCase();
  
  if (cleanCode.startsWith("CF-SIMPLE-") && cleanCode.length >= 14) {
    return { valid: true, mode: "simple" };
  }
  if (cleanCode.startsWith("CF-TRAD-") && cleanCode.length >= 12) {
    return { valid: true, mode: "traditional" };
  }
  if (cleanCode.startsWith("CF-FULL-") && cleanCode.length >= 12) {
    // Full license activates both modes
    return { valid: true, mode: "traditional" };
  }
  
  return { valid: false, mode: null };
}

const defaultLicenseData: LicenseData = {
  mode: "simple",
  trialStartDate: null,
  activatedAt: null,
  licenseCode: null,
  purchasedModes: [],
};

export function useLicense() {
  const [licenseData, setLicenseData] = useLocalStorage<LicenseData>(
    LICENSE_KEY,
    defaultLicenseData
  );

  // Initialize trial on first use
  const initializeTrial = useCallback(() => {
    if (!licenseData.trialStartDate) {
      setLicenseData((prev) => ({
        ...prev,
        trialStartDate: new Date().toISOString(),
      }));
    }
  }, [licenseData.trialStartDate, setLicenseData]);

  // Calculate trial status
  const trialInfo = useMemo(() => {
    if (!licenseData.trialStartDate) {
      return { daysRemaining: TRIAL_DAYS, isExpired: false };
    }

    const startDate = new Date(licenseData.trialStartDate);
    const now = new Date();
    const diffTime = now.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, TRIAL_DAYS - diffDays);
    
    return {
      daysRemaining,
      isExpired: daysRemaining <= 0,
    };
  }, [licenseData.trialStartDate]);

  // Determine current license status
  const status: LicenseStatus = useMemo(() => {
    if (licenseData.purchasedModes.length > 0) {
      return "active";
    }
    if (trialInfo.isExpired) {
      return "expired";
    }
    return "trial";
  }, [licenseData.purchasedModes, trialInfo.isExpired]);

  // Check if current mode is available
  const isModeAvailable = useCallback(
    (mode: LicenseMode): boolean => {
      // During trial, both modes are available
      if (status === "trial") {
        return true;
      }
      // After trial, only purchased modes are available
      // Traditional includes simple functionality
      if (licenseData.purchasedModes.includes("traditional")) {
        return true;
      }
      return licenseData.purchasedModes.includes(mode);
    },
    [status, licenseData.purchasedModes]
  );

  // Set current mode
  const setMode = useCallback(
    (mode: LicenseMode) => {
      if (isModeAvailable(mode)) {
        setLicenseData((prev) => ({ ...prev, mode }));
      }
    },
    [isModeAvailable, setLicenseData]
  );

  // Activate license with code
  const activateLicense = useCallback(
    (code: string): { success: boolean; message: string } => {
      const { valid, mode } = validateLicenseCode(code);
      
      if (!valid || !mode) {
        return { 
          success: false, 
          message: "Código de licencia inválido. Verifica que esté escrito correctamente." 
        };
      }

      const cleanCode = code.trim().toUpperCase();
      const isFullLicense = cleanCode.startsWith("CF-FULL-");
      
      // Check if code was already used
      if (licenseData.licenseCode === cleanCode) {
        return { 
          success: false, 
          message: "Este código ya fue activado en esta instalación." 
        };
      }

      const newPurchasedModes: LicenseMode[] = isFullLicense 
        ? ["simple", "traditional"]
        : [...new Set([...licenseData.purchasedModes, mode])];

      setLicenseData((prev) => ({
        ...prev,
        activatedAt: new Date().toISOString(),
        licenseCode: cleanCode,
        purchasedModes: newPurchasedModes,
        mode: mode, // Switch to the newly activated mode
      }));

      const modeName = mode === "simple" ? "Finanzas Personales Simples" : "Contabilidad Tradicional";
      return { 
        success: true, 
        message: isFullLicense 
          ? "¡Licencia completa activada! Tienes acceso a ambos modos."
          : `¡Licencia de ${modeName} activada exitosamente!`
      };
    },
    [licenseData, setLicenseData]
  );

  // Check if user can upgrade (has simple but not traditional)
  const canUpgrade = useMemo(() => {
    return (
      licenseData.purchasedModes.includes("simple") &&
      !licenseData.purchasedModes.includes("traditional")
    );
  }, [licenseData.purchasedModes]);

  // Pricing info
  const pricing = {
    simple: 5,
    traditional: 10,
    upgrade: 5, // Difference from simple to traditional
  };

  return {
    // Current state
    mode: licenseData.mode,
    status,
    trialInfo,
    purchasedModes: licenseData.purchasedModes,
    
    // Actions
    initializeTrial,
    setMode,
    activateLicense,
    isModeAvailable,
    
    // Upgrade info
    canUpgrade,
    pricing,
  };
}
