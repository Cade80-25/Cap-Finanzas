import { useState, useEffect, useCallback, useRef } from "react";
import { useLocalStorage } from "./useLocalStorage";

const SECURITY_KEY = "cap-finanzas-security";
const LOCK_STATE_KEY = "cap-finanzas-locked";
const BACKUP_KEY = "cap-finanzas-backup";

// Hash a PIN using SHA-256 via Web Crypto API
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

interface SecuritySettings {
  masterPin: string | null; // now stores SHA-256 hash
  autoLockEnabled: boolean;
  autoLockMinutes: number;
  twoFactorEnabled: boolean;
  autoBackupEnabled: boolean;
  lastBackupDate: string | null;
}

const defaultSettings: SecuritySettings = {
  masterPin: null,
  autoLockEnabled: true,
  autoLockMinutes: 5,
  twoFactorEnabled: false,
  autoBackupEnabled: true,
  lastBackupDate: null,
};

export function useSecurity() {
  const [settings, setSettings] = useLocalStorage<SecuritySettings>(
    SECURITY_KEY,
    defaultSettings
  );
  const [isLocked, setIsLocked] = useState(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem(SECURITY_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.masterPin) {
          const lockState = sessionStorage.getItem(LOCK_STATE_KEY);
          return lockState !== "unlocked";
        }
      } catch {
        // ignore
      }
    }
    return false;
  });
  
  const lastActivityRef = useRef<number>(Date.now());
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Update activity timestamp
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Lock the app
  const lock = useCallback(() => {
    if (settings.masterPin) {
      setIsLocked(true);
      sessionStorage.removeItem(LOCK_STATE_KEY);
    }
  }, [settings.masterPin]);

  // Unlock with PIN (async - compares hash)
  const unlock = useCallback(async (pin: string): Promise<boolean> => {
    const hashed = await hashPin(pin);
    if (hashed === settings.masterPin) {
      setIsLocked(false);
      sessionStorage.setItem(LOCK_STATE_KEY, "unlocked");
      updateActivity();
      return true;
    }
    return false;
  }, [settings.masterPin, updateActivity]);

  // Set or change master PIN (async - stores hash)
  const setMasterPin = useCallback(async (newPin: string | null) => {
    if (newPin) {
      const hashed = await hashPin(newPin);
      setSettings(prev => ({ ...prev, masterPin: hashed }));
      sessionStorage.setItem(LOCK_STATE_KEY, "unlocked");
      setIsLocked(false);
    } else {
      setSettings(prev => ({ ...prev, masterPin: null }));
      sessionStorage.removeItem(LOCK_STATE_KEY);
      setIsLocked(false);
    }
  }, [setSettings]);

  // Verify current PIN (async)
  const verifyPin = useCallback(async (pin: string): Promise<boolean> => {
    const hashed = await hashPin(pin);
    return hashed === settings.masterPin;
  }, [settings.masterPin]);

  // Toggle auto-lock
  const setAutoLock = useCallback((enabled: boolean) => {
    setSettings(prev => ({ ...prev, autoLockEnabled: enabled }));
  }, [setSettings]);

  // Set auto-lock timeout
  const setAutoLockMinutes = useCallback((minutes: number) => {
    setSettings(prev => ({ ...prev, autoLockMinutes: minutes }));
  }, [setSettings]);

  // Toggle two-factor
  const setTwoFactor = useCallback((enabled: boolean) => {
    setSettings(prev => ({ ...prev, twoFactorEnabled: enabled }));
  }, [setSettings]);

  // Toggle auto-backup
  const setAutoBackup = useCallback((enabled: boolean) => {
    setSettings(prev => ({ ...prev, autoBackupEnabled: enabled }));
  }, [setSettings]);

  // Create backup
  const createBackup = useCallback(() => {
    const backupData = {
      version: "1.0",
      date: new Date().toISOString(),
      data: {
        transactions: localStorage.getItem("cap-finanzas-libro-diario-transactions"),
        presupuesto: localStorage.getItem("cap-finanzas-presupuesto"),
        transacciones: localStorage.getItem("cap-finanzas-transacciones"),
        categorias: localStorage.getItem("cap-finanzas-categorias"),
        config: localStorage.getItem("cap-finanzas-config"),
        cuenta: localStorage.getItem("cap-finanzas-cuenta"),
      }
    };
    
    localStorage.setItem(BACKUP_KEY, JSON.stringify(backupData));
    setSettings(prev => ({ ...prev, lastBackupDate: new Date().toISOString() }));
    
    return backupData;
  }, [setSettings]);

  // Export backup to file
  const exportBackup = useCallback(() => {
    const backup = createBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cap-finanzas-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [createBackup]);

  // Restore from backup
  const restoreBackup = useCallback((backupJson: string): boolean => {
    try {
      const backup = JSON.parse(backupJson);
      if (!backup.data) return false;
      
      const storageKeyMap: Record<string, string> = {
        transactions: "cap-finanzas-libro-diario-transactions",
        transacciones: "cap-finanzas-libro-diario-transactions",
        presupuesto: "cap-finanzas-presupuesto",
        config: "cap-finanzas-config",
        cuenta: "cap-finanzas-cuenta",
        categorias: "cap-finanzas-categorias",
      };

      Object.entries(backup.data).forEach(([key, value]) => {
        if (!value) return;
        const storageKey = storageKeyMap[key] ?? `cap-finanzas-${key}`;
        localStorage.setItem(storageKey, value as string);
      });

      return true;
    } catch {
      return false;
    }
  }, []);

  // Import backup from file
  const importBackup = useCallback((file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(restoreBackup(content));
      };
      reader.onerror = () => resolve(false);
      reader.readAsText(file);
    });
  }, [restoreBackup]);

  // Auto-lock on inactivity
  useEffect(() => {
    if (!settings.autoLockEnabled || !settings.masterPin) {
      if (inactivityTimerRef.current) {
        clearInterval(inactivityTimerRef.current);
      }
      return;
    }

    const checkInactivity = () => {
      const elapsed = Date.now() - lastActivityRef.current;
      const timeout = settings.autoLockMinutes * 60 * 1000;
      
      if (elapsed >= timeout && !isLocked) {
        lock();
      }
    };

    inactivityTimerRef.current = setInterval(checkInactivity, 10000);

    return () => {
      if (inactivityTimerRef.current) {
        clearInterval(inactivityTimerRef.current);
      }
    };
  }, [settings.autoLockEnabled, settings.autoLockMinutes, settings.masterPin, isLocked, lock]);

  // Track user activity
  useEffect(() => {
    if (!settings.autoLockEnabled || !settings.masterPin) return;

    const events = ["mousedown", "keydown", "touchstart", "scroll"];
    
    events.forEach(event => {
      window.addEventListener(event, updateActivity);
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
    };
  }, [settings.autoLockEnabled, settings.masterPin, updateActivity]);

  // Auto-backup on app load (once per day)
  useEffect(() => {
    if (!settings.autoBackupEnabled) return;
    
    const lastBackup = settings.lastBackupDate;
    if (lastBackup) {
      const lastDate = new Date(lastBackup).toDateString();
      const today = new Date().toDateString();
      if (lastDate === today) return;
    }
    
    createBackup();
  }, [settings.autoBackupEnabled, settings.lastBackupDate, createBackup]);

  return {
    // State
    isLocked,
    hasMasterPin: !!settings.masterPin,
    autoLockEnabled: settings.autoLockEnabled,
    autoLockMinutes: settings.autoLockMinutes,
    twoFactorEnabled: settings.twoFactorEnabled,
    autoBackupEnabled: settings.autoBackupEnabled,
    lastBackupDate: settings.lastBackupDate,
    
    // Actions
    lock,
    unlock,
    setMasterPin,
    verifyPin,
    setAutoLock,
    setAutoLockMinutes,
    setTwoFactor,
    setAutoBackup,
    createBackup,
    exportBackup,
    importBackup,
    updateActivity,
  };
}
