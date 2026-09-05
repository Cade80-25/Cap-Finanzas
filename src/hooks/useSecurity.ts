import { useState, useEffect, useCallback, useRef } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { sanitizeBackupField, MAX_BACKUP_BYTES } from "@/lib/sanitize-backup";
import {
  hashPinPBKDF2,
  verifyPinPBKDF2,
  migrateLegacyPin,
  encryptData,
  decryptData,
} from "@/lib/crypto";

const SECURITY_KEY = "cap-finanzas-security";
const LOCK_STATE_KEY = "cap-finanzas-locked";
const BACKUP_KEY = "cap-finanzas-backup";

// ── Rate limiting ────────────────────────────────────────────────────────────
const RATE_LIMIT_MAX_ATTEMPTS = 5;
const RATE_LIMIT_BASE_SECONDS = 30;
const RATE_LIMIT_STORAGE_KEY = "cap-finanzas-security-rate-limit";

interface RateLimitState {
  failedAttempts: number;
  lockedUntil: number | null; // unix ms
}

function readRateLimit(): RateLimitState {
  try {
    const raw = localStorage.getItem(RATE_LIMIT_STORAGE_KEY);
    if (!raw) return { failedAttempts: 0, lockedUntil: null };
    return JSON.parse(raw);
  } catch {
    return { failedAttempts: 0, lockedUntil: null };
  }
}

function writeRateLimit(state: RateLimitState) {
  localStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(state));
}

function isRateLimited(state: RateLimitState): boolean {
  if (!state.lockedUntil) return false;
  return Date.now() < state.lockedUntil;
}

function getRemainingLockSeconds(state: RateLimitState): number {
  if (!state.lockedUntil) return 0;
  return Math.max(0, Math.ceil((state.lockedUntil - Date.now()) / 1000));
}

function recordFailedAttempt(state: RateLimitState): RateLimitState {
  const newAttempts = state.failedAttempts + 1;
  if (newAttempts >= RATE_LIMIT_MAX_ATTEMPTS) {
    // Bloqueo exponencial: 30s, 60s, 120s, ...
    const multiplier = Math.pow(2, Math.floor(newAttempts / RATE_LIMIT_MAX_ATTEMPTS) - 1);
    const lockSeconds = RATE_LIMIT_BASE_SECONDS * multiplier;
    return {
      failedAttempts: newAttempts,
      lockedUntil: Date.now() + lockSeconds * 1000,
    };
  }
  return { ...state, failedAttempts: newAttempts };
}

function resetRateLimit(): RateLimitState {
  return { failedAttempts: 0, lockedUntil: null };
}

// ── Pin hash format ──────────────────────────────────────────────────────────
// Soporta formato legacy (SHA-256) y nuevo (PBKDF2 con salt)
type StoredPin = string | { hash: string; salt: string };

function isLegacyPin(pin: StoredPin): pin is string {
  return typeof pin === "string";
}

// ── Security settings interface ──────────────────────────────────────────────
interface SecuritySettings {
  masterPin: StoredPin | null; // hash PBKDF2 (con salt) o SHA-256 legacy
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

  // Estado de rate limit
  const [rateLimitState, setRateLimitState] = useState<RateLimitState>(() =>
    readRateLimit()
  );

  const lastActivityRef = useRef<number>(Date.now());
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Verificar PIN (síncrono público — llama a la función async interna)
  const verifyPin = useCallback(
    async (pin: string): Promise<boolean> => {
      const stored = settings.masterPin;
      if (!stored) return false;

      if (isLegacyPin(stored)) {
        // Legacy SHA-256
        const encoder = new TextEncoder();
        const data = encoder.encode(pin);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const computed = hashArray
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        return computed === stored;
      }

      // PBKDF2 nuevo formato
      return verifyPinPBKDF2(pin, stored.hash, stored.salt);
    },
    [settings.masterPin]
  );

  // Unlock con PIN + rate limiting
  const unlock = useCallback(
    async (pin: string): Promise<boolean> => {
      // Verificar rate limit
      const rlState = readRateLimit();
      if (isRateLimited(rlState)) {
        return false; // Bloqueado por rate limit
      }

      const stored = settings.masterPin;
      if (!stored) return false;

      let valid = false;

      if (isLegacyPin(stored)) {
        // Legacy SHA-256 — verificar y migrar si es correcto
        const encoder = new TextEncoder();
        const data = encoder.encode(pin);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const computed = hashArray
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        if (computed === stored) {
          // Migrar a PBKDF2 en segundo plano
          const migrated = await migrateLegacyPin(pin, stored);
          if (migrated) {
            setSettings((prev) => ({ ...prev, masterPin: migrated }));
          }
          valid = true;
        }
      } else {
        // PBKDF2 nuevo formato
        valid = await verifyPinPBKDF2(pin, stored.hash, stored.salt);
      }

      if (valid) {
        setIsLocked(false);
        sessionStorage.setItem(LOCK_STATE_KEY, "unlocked");
        updateActivity();
        // Resetear rate limit en éxito
        const reset = resetRateLimit();
        writeRateLimit(reset);
        setRateLimitState(reset);
        return true;
      } else {
        // Registrar intento fallido
        const updated = recordFailedAttempt(rlState);
        writeRateLimit(updated);
        setRateLimitState(updated);
        return false;
      }
    },
    [settings.masterPin, setSettings, updateActivity]
  );

  // Set or change master PIN (async - stores hash PBKDF2)
  const setMasterPin = useCallback(
    async (newPin: string | null) => {
      if (newPin) {
        const hashed = await hashPinPBKDF2(newPin);
        setSettings((prev) => ({ ...prev, masterPin: hashed }));
        sessionStorage.setItem(LOCK_STATE_KEY, "unlocked");
        setIsLocked(false);
      } else {
        setSettings((prev) => ({ ...prev, masterPin: null }));
        sessionStorage.removeItem(LOCK_STATE_KEY);
        setIsLocked(false);
      }
    },
    [setSettings]
  );

  // Toggle auto-lock
  const setAutoLock = useCallback(
    (enabled: boolean) => {
      setSettings((prev) => ({ ...prev, autoLockEnabled: enabled }));
    },
    [setSettings]
  );

  // Set auto-lock timeout
  const setAutoLockMinutes = useCallback(
    (minutes: number) => {
      setSettings((prev) => ({ ...prev, autoLockMinutes: minutes }));
    },
    [setSettings]
  );

  // Toggle two-factor
  const setTwoFactor = useCallback(
    (enabled: boolean) => {
      setSettings((prev) => ({ ...prev, twoFactorEnabled: enabled }));
    },
    [setSettings]
  );

  // Toggle auto-backup
  const setAutoBackup = useCallback(
    (enabled: boolean) => {
      setSettings((prev) => ({ ...prev, autoBackupEnabled: enabled }));
    },
    [setSettings]
  );

  // Crear backup cifrado con la clave derivada del PIN
  const createBackup = useCallback(async () => {
    const backupData = {
      version: "1.0",
      date: new Date().toISOString(),
      data: {
        transactions: localStorage.getItem(
          "cap-finanzas-libro-diario-transactions"
        ),
        presupuesto: localStorage.getItem("cap-finanzas-presupuesto"),
        transacciones: localStorage.getItem("cap-finanzas-transacciones"),
        categorias: localStorage.getItem("cap-finanzas-categorias"),
        config: localStorage.getItem("cap-finanzas-config"),
        cuenta: localStorage.getItem("cap-finanzas-cuenta"),
      },
    };

    const rawJson = JSON.stringify(backupData);

    // Cifrar backup si hay PIN configurado
    if (settings.masterPin) {
      // Usar el salt del hash PBKDF2 como clave de cifrado (o un string fijo si es legacy)
      const encryptionKey = isLegacyPin(settings.masterPin)
        ? "cap-finanzas-backup-key"
        : settings.masterPin.salt;
      try {
        const encrypted = await encryptData(rawJson, encryptionKey);
        localStorage.setItem(BACKUP_KEY, encrypted);
      } catch {
        // Si falla el cifrado, guardar sin cifrar
        localStorage.setItem(BACKUP_KEY, rawJson);
      }
    } else {
      localStorage.setItem(BACKUP_KEY, rawJson);
    }

    setSettings((prev) => ({
      ...prev,
      lastBackupDate: new Date().toISOString(),
    }));

    return backupData;
  }, [settings.masterPin, setSettings]);

  // Export backup to file
  const exportBackup = useCallback(() => {
    const backup = createBackup();
    backup.then((data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cap-finanzas-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }, [createBackup]);

  // Restore from backup (con descifrado si está cifrado)
  const restoreBackup = useCallback(
    async (backupJson: string): Promise<boolean> => {
      try {
        if (typeof backupJson !== "string" || backupJson.length > MAX_BACKUP_BYTES) {
          return false;
        }

        let parsed: any;

        // Verificar si está cifrado (formato salt:iv:ciphertext o base64 xor)
        if (backupJson.includes(":") && !backupJson.startsWith("{")) {
          // Intentar descifrar
          const decryptionKey = isLegacyPin(settings.masterPin)
            ? "cap-finanzas-backup-key"
            : settings.masterPin?.salt || "cap-finanzas-backup-key";
          try {
            const decrypted = await decryptData(backupJson, decryptionKey);
            parsed = JSON.parse(decrypted);
          } catch {
            // Si falla, intentar parsear directamente
            parsed = JSON.parse(backupJson);
          }
        } else {
          parsed = JSON.parse(backupJson);
        }

        if (!parsed || !parsed.data || typeof parsed.data !== "object") return false;

        // Strict allowlist
        const storageKeyMap: Record<string, string> = {
          transactions: "cap-finanzas-libro-diario-transactions",
          transacciones: "cap-finanzas-libro-diario-transactions",
          presupuesto: "cap-finanzas-presupuesto",
          config: "cap-finanzas-config",
          cuenta: "cap-finanzas-cuenta",
          categorias: "cap-finanzas-categorias",
        };

        // Preserved security settings
        const preservedSecurity = localStorage.getItem(SECURITY_KEY);

        Object.entries(parsed.data as Record<string, unknown>).forEach(
          ([key, value]) => {
            if (!value || typeof value !== "string") return;
            const storageKey = storageKeyMap[key];
            if (!storageKey) return;
            const cleaned = sanitizeBackupField(key, value);
            if (cleaned === null) return;
            localStorage.setItem(storageKey, cleaned);
          }
        );

        if (preservedSecurity !== null) {
          localStorage.setItem(SECURITY_KEY, preservedSecurity);
        }

        return true;
      } catch {
        return false;
      }
    },
    [settings.masterPin]
  );

  // Import backup from file
  const importBackup = useCallback(
    (file: File): Promise<boolean> => {
      return new Promise((resolve) => {
        if (file.size > MAX_BACKUP_BYTES) {
          resolve(false);
          return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          resolve(restoreBackup(content));
        };
        reader.onerror = () => resolve(false);
        reader.readAsText(file);
      });
    },
    [restoreBackup]
  );

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
  }, [
    settings.autoLockEnabled,
    settings.autoLockMinutes,
    settings.masterPin,
    isLocked,
    lock,
  ]);

  // Track user activity
  useEffect(() => {
    if (!settings.autoLockEnabled || !settings.masterPin) return;

    const events = ["mousedown", "keydown", "touchstart", "scroll"];

    events.forEach((event) => {
      window.addEventListener(event, updateActivity);
    });

    return () => {
      events.forEach((event) => {
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

    // Rate limit info
    rateLimited: isRateLimited(rateLimitState),
    rateLimitRemainingSeconds: getRemainingLockSeconds(rateLimitState),
    failedAttempts: rateLimitState.failedAttempts,

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
