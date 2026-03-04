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
  extraAccountSlots: number;
  usedAccountCodes: string[];
}

const TRIAL_DAYS = 30;
const LICENSE_KEY = "cap-finanzas-license";

// Validate license codes with checksum verification
// Formats: CF-SIMP-XXXX-XXXXX (simple) or CF-TRAD-XXXX-XXXXX (traditional)
function validateLicenseCode(code: string): { valid: boolean; mode: LicenseMode | null; isAccountCode?: boolean } {
  const cleanCode = code.trim().toUpperCase();
  
  // New format from license generator: CF-SIMP-XXXX-XXXXX or CF-TRAD-XXXX-XXXXX
  const simpMatch = cleanCode.match(/^CF-SIMP-([A-Z0-9]{4})-([A-Z0-9]{5})$/);
  const tradMatch = cleanCode.match(/^CF-TRAD-([A-Z0-9]{4})-([A-Z0-9]{5})$/);
  const fullMatch = cleanCode.match(/^CF-FULL-([A-Z0-9]{4})-([A-Z0-9]{5})$/);
  
  // Legacy format support: CF-SIMPLE-XXXX or CF-TRAD-XXXX
  const legacySimpleMatch = cleanCode.match(/^CF-SIMPLE-[A-Z0-9]{4,}$/);
  const legacyTradMatch = cleanCode.match(/^CF-TRAD-[A-Z0-9]{4,}$/);
  
  if (simpMatch || legacySimpleMatch) {
    // Verify checksum for new format
    if (simpMatch) {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      const codeBody = simpMatch[1] + simpMatch[2].substring(0, 4);
      let checksum = 0;
      for (let i = 0; i < codeBody.length; i++) {
        checksum += codeBody.charCodeAt(i);
      }
      const expectedChecksum = chars.charAt(checksum % chars.length);
      if (simpMatch[2].charAt(4) !== expectedChecksum) {
        return { valid: false, mode: null };
      }
    }
    return { valid: true, mode: "simple" };
  }
  
  if (tradMatch || legacyTradMatch) {
    // Verify checksum for new format
    if (tradMatch) {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      const codeBody = tradMatch[1] + tradMatch[2].substring(0, 4);
      let checksum = 0;
      for (let i = 0; i < codeBody.length; i++) {
        checksum += codeBody.charCodeAt(i);
      }
      const expectedChecksum = chars.charAt(checksum % chars.length);
      if (tradMatch[2].charAt(4) !== expectedChecksum) {
        return { valid: false, mode: null };
      }
    }
    return { valid: true, mode: "traditional" };
  }
  
  if (fullMatch) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const codeBody = fullMatch[1] + fullMatch[2].substring(0, 4);
    let checksum = 0;
    for (let i = 0; i < codeBody.length; i++) {
      checksum += codeBody.charCodeAt(i);
    }
    const expectedChecksum = chars.charAt(checksum % chars.length);
    if (fullMatch[2].charAt(4) !== expectedChecksum) {
      return { valid: false, mode: null };
    }
    return { valid: true, mode: "traditional" };
  }
  
  // Account slot code: CF-ACCT-XXXX-XXXXX
  const acctMatch = cleanCode.match(/^CF-ACCT-([A-Z0-9]{4})-([A-Z0-9]{5})$/);
  if (acctMatch) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const codeBody = acctMatch[1] + acctMatch[2].substring(0, 4);
    let checksum = 0;
    for (let i = 0; i < codeBody.length; i++) {
      checksum += codeBody.charCodeAt(i);
    }
    const expectedChecksum = chars.charAt(checksum % chars.length);
    if (acctMatch[2].charAt(4) !== expectedChecksum) {
      return { valid: false, mode: null };
    }
    return { valid: true, mode: null, isAccountCode: true };
  }
  
  return { valid: false, mode: null };
}

const defaultLicenseData: LicenseData = {
  mode: "simple",
  trialStartDate: null,
  activatedAt: null,
  licenseCode: null,
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
      const { valid, mode, isAccountCode } = validateLicenseCode(code);
      
      if (!valid) {
        return { 
          success: false, 
          message: "Código de licencia inválido. Verifica que esté escrito correctamente." 
        };
      }

      const cleanCode = code.trim().toUpperCase();
      
      // Handle account slot codes
      if (isAccountCode) {
        if (licenseData.usedAccountCodes?.includes(cleanCode)) {
          return { success: false, message: "Este código de cuenta ya fue activado." };
        }
        const currentExtra = licenseData.extraAccountSlots || 0;
        if (currentExtra >= 4) {
          return { success: false, message: "Ya tienes el máximo de 5 cuentas (1 base + 4 adicionales)." };
        }
        setLicenseData((prev) => ({
          ...prev,
          extraAccountSlots: (prev.extraAccountSlots || 0) + 1,
          usedAccountCodes: [...(prev.usedAccountCodes || []), cleanCode],
        }));
        return { 
          success: true, 
          message: `¡Cuenta adicional activada! Ahora tienes ${currentExtra + 2} cuentas disponibles.` 
        };
      }

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
        : [...new Set([...licenseData.purchasedModes, mode!])];

      setLicenseData((prev) => ({
        ...prev,
        activatedAt: new Date().toISOString(),
        licenseCode: cleanCode,
        purchasedModes: newPurchasedModes,
        mode: mode!, // Switch to the newly activated mode
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

  // Check upgrade paths
  const canUpgradeFromSimple = useMemo(() => {
    return (
      licenseData.purchasedModes.includes("simple") &&
      !licenseData.purchasedModes.includes("traditional")
    );
  }, [licenseData.purchasedModes]);

  const canUpgradeFromTraditional = useMemo(() => {
    return (
      licenseData.purchasedModes.includes("traditional") &&
      !licenseData.purchasedModes.includes("simple")
    );
  }, [licenseData.purchasedModes]);

  // Legacy alias
  const canUpgrade = canUpgradeFromSimple;

  // Pricing info
  const pricing = {
    simple: 7,
    traditional: 10,
    full: 12,
    upgradeSimpleToTraditional: 3,  // $10 - $7
    upgradeSimpleToFull: 5,         // $12 - $7
    upgradeTraditionalToFull: 2,    // $12 - $10
    extraAccount: 2,
  };

  // Account slots: trial = 3, paid = 1 base + extras (max 5)
  const accountSlots = status === "trial" 
    ? 3 
    : 1 + (licenseData.extraAccountSlots || 0);

  // Profile slots: Full license = 3, others = 1, trial = 3
  const maxProfiles = useMemo(() => {
    if (status === "trial") return 3;
    const hasBoth = licenseData.purchasedModes.includes("simple") && licenseData.purchasedModes.includes("traditional");
    return hasBoth ? 3 : 1;
  }, [status, licenseData.purchasedModes]);

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
    canUpgradeFromSimple,
    canUpgradeFromTraditional,
    pricing,
    
    // Account slots & profiles
    accountSlots,
    maxProfiles,
  };
}
