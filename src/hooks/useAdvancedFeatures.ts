import { useState, useEffect, useCallback, useRef } from "react";
import { useLocalStorage } from "./useLocalStorage";

const ADVANCED_KEY = "cap-finanzas-advanced";
const LOGS_KEY = "cap-finanzas-logs";

interface AdvancedSettings {
  devMode: boolean;
  dataLogging: boolean;
  autoSync: boolean;
  betaFeatures: boolean;
  syncInterval: number; // in seconds
  maxLogEntries: number;
}

interface LogEntry {
  id: string;
  timestamp: string;
  type: "info" | "warn" | "error" | "action";
  category: string;
  message: string;
  data?: any;
}

const defaultSettings: AdvancedSettings = {
  devMode: false,
  dataLogging: false,
  autoSync: false,
  betaFeatures: false,
  syncInterval: 30,
  maxLogEntries: 500,
};

export function useAdvancedFeatures() {
  const [settings, setSettings] = useLocalStorage<AdvancedSettings>(
    ADVANCED_KEY,
    defaultSettings
  );
  const [logs, setLogs] = useLocalStorage<LogEntry[]>(LOGS_KEY, []);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Add a log entry
  const addLog = useCallback((
    type: LogEntry["type"],
    category: string,
    message: string,
    data?: any
  ) => {
    if (!settings.dataLogging) return;
    
    const newEntry: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type,
      category,
      message,
      data,
    };
    
    setLogs(prev => {
      const updated = [newEntry, ...prev];
      // Keep only the max number of entries
      return updated.slice(0, settings.maxLogEntries);
    });
  }, [settings.dataLogging, settings.maxLogEntries, setLogs]);

  // Clear all logs
  const clearLogs = useCallback(() => {
    setLogs([]);
  }, [setLogs]);

  // Export logs to file
  const exportLogs = useCallback(() => {
    const content = JSON.stringify(logs, null, 2);
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cap-finanzas-logs-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [logs]);

  // Toggle dev mode
  const setDevMode = useCallback((enabled: boolean) => {
    setSettings(prev => ({ ...prev, devMode: enabled }));
    if (enabled) {
      addLog("info", "Sistema", "Modo desarrollador activado");
    }
  }, [setSettings, addLog]);

  // Toggle data logging
  const setDataLogging = useCallback((enabled: boolean) => {
    setSettings(prev => ({ ...prev, dataLogging: enabled }));
    if (enabled) {
      // Add initial log entry when logging is enabled
      const initialLog: LogEntry = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "info",
        category: "Sistema",
        message: "Registro de datos iniciado",
      };
      setLogs(prev => [initialLog, ...prev].slice(0, settings.maxLogEntries));
    }
  }, [setSettings, setLogs, settings.maxLogEntries]);

  // Sync data to localStorage (simulated cloud sync)
  const syncData = useCallback(async () => {
    setSyncStatus("syncing");
    addLog("info", "Sincronización", "Iniciando sincronización de datos");
    
    try {
      // Simulate sync delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Get all cap-finanzas data
      const allData: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith("cap-finanzas-")) {
          try {
            allData[key] = JSON.parse(localStorage.getItem(key) || "null");
          } catch {
            allData[key] = localStorage.getItem(key);
          }
        }
      }
      
      // Store sync metadata
      const syncMeta = {
        lastSync: new Date().toISOString(),
        itemCount: Object.keys(allData).length,
      };
      localStorage.setItem("cap-finanzas-sync-meta", JSON.stringify(syncMeta));
      
      setSyncStatus("success");
      setLastSyncTime(syncMeta.lastSync);
      addLog("info", "Sincronización", `Sincronización completada: ${syncMeta.itemCount} elementos`);
      
      // Reset to idle after showing success
      setTimeout(() => setSyncStatus("idle"), 2000);
      
      return true;
    } catch (error) {
      setSyncStatus("error");
      addLog("error", "Sincronización", "Error durante la sincronización", { error: String(error) });
      setTimeout(() => setSyncStatus("idle"), 3000);
      return false;
    }
  }, [addLog]);

  // Toggle auto sync
  const setAutoSync = useCallback((enabled: boolean) => {
    setSettings(prev => ({ ...prev, autoSync: enabled }));
    
    if (enabled) {
      addLog("info", "Sistema", `Sincronización automática activada (cada ${settings.syncInterval}s)`);
      // Trigger immediate sync
      syncData();
    } else {
      addLog("info", "Sistema", "Sincronización automática desactivada");
    }
  }, [setSettings, addLog, syncData, settings.syncInterval]);

  // Toggle beta features
  const setBetaFeatures = useCallback((enabled: boolean) => {
    setSettings(prev => ({ ...prev, betaFeatures: enabled }));
    addLog("info", "Sistema", enabled ? "Funciones beta activadas" : "Funciones beta desactivadas");
  }, [setSettings, addLog]);

  // Set sync interval
  const setSyncInterval = useCallback((seconds: number) => {
    setSettings(prev => ({ ...prev, syncInterval: seconds }));
    addLog("info", "Configuración", `Intervalo de sincronización cambiado a ${seconds} segundos`);
  }, [setSettings, addLog]);

  // Auto-sync timer
  useEffect(() => {
    if (!settings.autoSync) {
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
        syncTimerRef.current = null;
      }
      return;
    }

    syncTimerRef.current = setInterval(() => {
      syncData();
    }, settings.syncInterval * 1000);

    return () => {
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
      }
    };
  }, [settings.autoSync, settings.syncInterval, syncData]);

  // Load last sync time on mount
  useEffect(() => {
    try {
      const meta = localStorage.getItem("cap-finanzas-sync-meta");
      if (meta) {
        const parsed = JSON.parse(meta);
        setLastSyncTime(parsed.lastSync);
      }
    } catch {
      // Ignore
    }
  }, []);

  // Log user actions (can be called from other components)
  const logAction = useCallback((action: string, details?: any) => {
    addLog("action", "Usuario", action, details);
  }, [addLog]);

  // Get statistics
  const getStats = useCallback(() => {
    const stats = {
      totalLogs: logs.length,
      errorCount: logs.filter(l => l.type === "error").length,
      warnCount: logs.filter(l => l.type === "warn").length,
      actionCount: logs.filter(l => l.type === "action").length,
      categories: [...new Set(logs.map(l => l.category))],
    };
    return stats;
  }, [logs]);

  // Reset all data (dangerous!)
  const resetAllData = useCallback(() => {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("cap-finanzas-")) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    window.location.reload();
  }, []);

  return {
    // Settings
    devMode: settings.devMode,
    dataLogging: settings.dataLogging,
    autoSync: settings.autoSync,
    betaFeatures: settings.betaFeatures,
    syncInterval: settings.syncInterval,
    
    // Sync status
    syncStatus,
    lastSyncTime,
    
    // Logs
    logs,
    
    // Actions
    setDevMode,
    setDataLogging,
    setAutoSync,
    setBetaFeatures,
    setSyncInterval,
    syncData,
    addLog,
    logAction,
    clearLogs,
    exportLogs,
    getStats,
    resetAllData,
  };
}
