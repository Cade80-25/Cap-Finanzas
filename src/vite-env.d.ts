/// <reference types="vite/client" />

interface SecureStoreAPI {
  set(key: string, value: string): Promise<boolean>;
  get(key: string): Promise<string | null>;
  delete(key: string): Promise<boolean>;
}

interface ElectronAPI {
  platform: string;
  isElectron: boolean;
  setNativeMenuVisible(visible: boolean): void;
  toggleNativeMenu(): void;
  checkForUpdates(): void;
  downloadUpdate(): void;
  installUpdate(): void;
  onUpdateAvailable(callback: (info: unknown) => void): void;
  onUpdateError(callback: (message: string) => void): void;
  onDownloadProgress(callback: (progress: unknown) => void): void;
  onUpdateDownloaded(callback: (info: unknown) => void): void;
  removeUpdateListeners(): void;
  secureStore: SecureStoreAPI;
}

interface Window {
  electronAPI?: ElectronAPI;
}
