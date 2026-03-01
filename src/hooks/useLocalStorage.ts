import { useState, useEffect, useCallback, useRef } from "react";

const LOCAL_STORAGE_SYNC_EVENT = "cap-finanzas:local-storage-sync";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const instanceIdRef = useRef(
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? (crypto as Crypto).randomUUID()
      : `${Date.now()}-${Math.random()}`
  );

  // Cargar valor inicial desde localStorage
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      return initialValue;
    }
  });

  // Sincronizar cambios entre distintos componentes (mismo window) y pestañas (storage)
  useEffect(() => {
    const syncFromStorage = (raw: string | null) => {
      try {
        const next = raw ? (JSON.parse(raw) as T) : initialValue;
        setStoredValue(next);
      } catch (error) {
        console.error(`Error parsing ${key} from localStorage:`, error);
      }
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key !== key) return;
      syncFromStorage(e.newValue);
    };

    const onCustomSync = (e: Event) => {
      const ce = e as CustomEvent<{ key?: string; source?: string }>;
      if (ce.detail?.key !== key) return;
      if (ce.detail?.source === instanceIdRef.current) return;
      syncFromStorage(localStorage.getItem(key));
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(LOCAL_STORAGE_SYNC_EVENT, onCustomSync);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(LOCAL_STORAGE_SYNC_EVENT, onCustomSync);
    };
  }, [key, initialValue]);

  // Función para actualizar el valor - escribe a localStorage sincrónicamente
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    setStoredValue((prev) => {
      const next = value instanceof Function ? value(prev) : value;
      try {
        localStorage.setItem(key, JSON.stringify(next));
        window.dispatchEvent(
          new CustomEvent(LOCAL_STORAGE_SYNC_EVENT, {
            detail: { key, source: instanceIdRef.current },
          })
        );
      } catch (error) {
        console.error(`Error saving ${key} to localStorage:`, error);
      }
      return next;
    });
  }, [key]);

  return [storedValue, setValue] as const;
}
