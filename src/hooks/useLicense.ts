import { useLocalStorage } from "./useLocalStorage";
import { useCallback, useMemo } from "react";

export type LicenseMode = "simple" | "traditional";
export type LicenseStatus = "trial" | "active" | "expired";

interface LicenseData {
  mode: LicenseMode;
  trialStartDate: string | null;
  activatedAt: string | null;
  licenseCode: string | null;
  isActivated: boolean;
  // Legacy fields kept for backward compatibility
  purchasedModes: LicenseMode[];
  extraAccountSlots: number;
  usedAccountCodes: string[];
}

const TRIAL_DAYS = 30;
const LICENSE_KEY = "cap-finanzas-license";

// Validate license codes with checksum verification
// All codes now use CF-FULL format (single plan)
// Legacy formats CF-SIMP and CF-TRAD are still accepted
function validateLicenseCode(code: string): { valid: boolean } {
  const cleanCode = code.trim().toUpperCase();
  
  // All valid formats
  const patterns = [
    /^CF-FULL-([A-Z0-9]{4})-([A-Z0-9]{5})$/,
    /^CF-SIMP-([A-Z0-9]{4})-([A-Z0-9]{5})$/,
    /^CF-TRAD-([A-Z0-9]{4})-([A-Z0-9]{5})$/,
  ];

  for (const pattern of patterns) {
    const match = cleanCode.match(pattern);
    if (match) {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      const codeBody = match[1] + match[2].substring(0, 4);
      let checksum = 0;
      for (let i = 0; i < codeBody.length; i++) {
        checksum += codeBody.charCodeAt(i);
      }
      const expectedChecksum = chars.charAt(checksum % chars.length);
      if (match[2].charAt(4) !== expectedChecksum) {
        return { valid: false };
      }
      return { valid: true };
    }
  }

  // Legacy format support
  if (/^CF-SIMPLE-[A-Z0-9]{4,}$/.test(cleanCode) || /^CF-TRAD-[A-Z0-9]{4,}$/.test(cleanCode)) {
    return { valid: true };
  }

  return { valid: false };
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
  // Support both new isActivated flag and legacy purchasedModes
  const status: LicenseStatus = useMemo(() => {
    if (licenseData.isActivated || licenseData.purchasedModes.length > 0) {
      return "active";
    }
    if (trialInfo.isExpired) {
      return "expired";
    }
    return "trial";
  }, [licenseData.isActivated, licenseData.purchasedModes, trialInfo.isExpired]);

  // All modes available when active or trial
  const isModeAvailable = useCallback(
    (_mode: LicenseMode): boolean => {
      return status === "trial" || status === "active";
    },
    [status]
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
      const { valid } = validateLicenseCode(code);
      
      if (!valid) {
        return { 
          success: false, 
          message: "Código de licencia inválido. Verifica que esté escrito correctamente." 
        };
      }

      const cleanCode = code.trim().toUpperCase();
      
      // Check if code was already used
      if (licenseData.licenseCode === cleanCode) {
        return { 
          success: false, 
          message: "Este código ya fue activado en esta instalación." 
        };
      }

      setLicenseData((prev) => ({
        ...prev,
        activatedAt: new Date().toISOString(),
        licenseCode: cleanCode,
        isActivated: true,
        purchasedModes: ["simple", "traditional"], // Full access
      }));

      return { 
        success: true, 
        message: "¡Licencia activada exitosamente! Tienes acceso completo a Cap Finanzas."
      };
    },
    [licenseData, setLicenseData]
  );

  // Pricing info - single plan
  const pricing = {
    full: 10,
  };

  // Active license: 5 accounts, 3 profiles. Trial: 3 accounts, 3 profiles
  const accountSlots = status === "trial" ? 3 : 5;
  const maxProfiles = 3;

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
    
    // Pricing
    pricing,
    
    // Account slots & profiles
    accountSlots,
    maxProfiles,
  };
}
