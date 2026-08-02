import { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';

interface UpdateInfo {
  version: string;
  releaseDate?: string;
}

interface ProgressInfo {
  percent: number;
  transferred: number;
  total: number;
}

export function useAutoUpdater() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    // Check if running in Electron
    if (!window.electron) return;

    // Handle update available
    window.electron.onUpdateAvailable((info: UpdateInfo) => {
      setUpdateAvailable(true);
      setUpdateInfo(info);
      toast({
        title: 'Actualización disponible',
        description: `La versión ${info.version} está disponible. Puede descargarla desde el menú de configuración.`,
      });
    });

    // Handle update errors
    window.electron.onUpdateError((message: string) => {
      toast({
        title: 'Error de actualización',
        description: message,
        variant: 'destructive',
      });
      setDownloading(false);
    });

    // Handle download progress
    window.electron.onDownloadProgress((progress: ProgressInfo) => {
      setDownloadProgress(Math.round(progress.percent));
    });

    // Handle update downloaded
    window.electron.onUpdateDownloaded((info: UpdateInfo) => {
      setDownloading(false);
      setUpdateReady(true);
      toast({
        title: 'Actualización descargada',
        description: `La versión ${info.version} está lista. Puede instalarla desde el menú de configuración.`,
      });
    });

    // Cleanup listeners
    return () => {
      window.electron.removeUpdateListeners();
    };
  }, []);

  const handleCheckForUpdates = () => {
    if (window.electron) {
      window.electron.checkForUpdates();
      toast({
        title: 'Buscando actualizaciones',
        description: 'Verificando si hay nuevas versiones disponibles...',
      });
    }
  };

  const handleDownload = () => {
    if (window.electron) {
      setDownloading(true);
      window.electron.downloadUpdate();
      toast({
        title: 'Descargando actualización',
        description: 'La descarga comenzará en breve...',
      });
    }
  };

  const handleInstall = () => {
    if (window.electron) {
      window.electron.installUpdate();
    }
  };

  return {
    updateAvailable,
    updateInfo,
    downloading,
    downloadProgress,
    updateReady,
    checkForUpdates: handleCheckForUpdates,
    downloadUpdate: handleDownload,
    installUpdate: handleInstall,
  };
}

// Type declarations for Electron API
declare global {
  interface Window {
    electron?: {
      platform: string;
      checkForUpdates: () => void;
      downloadUpdate: () => void;
      installUpdate: () => void;
      onUpdateAvailable: (callback: (info: UpdateInfo) => void) => void;
      onUpdateError: (callback: (message: string) => void) => void;
      onDownloadProgress: (callback: (progress: ProgressInfo) => void) => void;
      onUpdateDownloaded: (callback: (info: UpdateInfo) => void) => void;
      removeUpdateListeners: () => void;
    };
  }
}
