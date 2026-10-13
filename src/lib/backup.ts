import { toast } from "sonner";

/**
 * Backup y Restore de Cap-Finanzas.
 *
 * Exporta TODA la contabilidad del usuario (todas las claves cap-finanzas-* de
 * localStorage) a un único archivo .json con manifiesto de integridad.
 * El import restaura el estado exacto con validación previa y safety-backup.
 *
 * - Sin IA, sin nube, sin dependencias nuevas: determinista y 100% local.
 * - El archivo puede guardarse en cualquier lado (USB, OneDrive, historial de
 *   archivos de Windows, etc.).
 */

export interface BackupManifest {
  app: "cap-finanzas";
  version: string; // versión de la app al momento del export
  schema: 1; // versión del formato de backup
  createdAt: string; // ISO
  keyCount: number;
  entryCount: number; // total de registros entre todas las claves
  keys: string[]; // claves incluidas (para verificación)
}

export interface BackupFile {
  manifest: BackupManifest;
  data: Record<string, string>; // clave localStorage -> valor crudo (string)
}

function lsKeys(): string[] {
  const out: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k) out.push(k);
  }
  return out;
}

/** Claves que pertenecen a la app: cap-finanzas-* + wallet/profile si existen. */
function appKeys(): string[] {
  return lsKeys().filter((k) =>
    k.startsWith("cap-finanzas-") ||
    k === "wallet-context" ||
    k === "cap-welcome-seen"
  );
}

function countEntries(keys: string[]): number {
  let n = 0;
  for (const k of keys) {
    const raw = localStorage.getItem(k) || "";
    if (!raw) continue;
    try {
      const v = JSON.parse(raw);
      if (Array.isArray(v)) n += v.length;
      else if (v && typeof v === "object") n += 1;
    } catch {
      /* valor no-JSON: no cuenta como registro */
    }
  }
  return n;
}

function downloadJson(obj: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function currentVersion(): string {
  const w = window as unknown as { capFinanzasVersion?: string };
  return w.capFinanzasVersion || "unknown";
}

/** Exporta todos los datos de la app a un archivo JSON con manifiesto. */
export function exportBackup(): void {
  const keys = appKeys();
  if (keys.length === 0) {
    toast.error("No hay datos para exportar.");
    return;
  }

  const data: Record<string, string> = {};
  for (const k of keys) data[k] = localStorage.getItem(k) || "";

  const manifest: BackupManifest = {
    app: "cap-finanzas",
    version: currentVersion(),
    schema: 1,
    createdAt: new Date().toISOString(),
    keyCount: keys.length,
    entryCount: countEntries(keys),
    keys,
  };

  downloadJson(
    { manifest, data } as BackupFile,
    `Cap-Finanzas-Backup-${manifest.createdAt.slice(0, 10)}.json`
  );
  toast.success(`Respaldo exportado: ${manifest.keyCount} claves, ${manifest.entryCount} registros.`);
}

/** Valida la estructura de un archivo de backup. Devuelve null si inválido. */
export function validateBackup(raw: unknown): BackupFile | null {
  if (!raw || typeof raw !== "object") return null;
  const f = raw as Partial<BackupFile>;
  if (f.manifest?.app !== "cap-finanzas" || f.manifest.schema !== 1) return null;
  if (!Array.isArray(f.manifest.keys) || f.manifest.keys.length === 0) return null;
  if (!f.data || typeof f.data !== "object") return null;
  for (const k of f.manifest.keys) {
    if (!(k in f.data)) return null;
  }
  return f as BackupFile;
}

/** Restaura un backup validado (REEMPLAZA el estado actual, con safety-backup previo). */
export async function importBackup(file: File): Promise<void> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    toast.error("Archivo inválido: no es JSON válido.");
    return;
  }
  const backup = validateBackup(parsed);
  if (!backup) {
    toast.error("Archivo inválido: no es un respaldo de Cap-Finanzas.");
    return;
  }

  const ok = window.confirm(
    `Restaurar respaldo del ${backup.manifest.createdAt.slice(0, 10)}?\n\n` +
      `El respaldo contiene ${backup.manifest.keyCount} claves y ` +
      `${backup.manifest.entryCount} registros.\n\n` +
      `Se reemplazarán TODOS los datos actuales. Antes se descargará un ` +
      `respaldo de seguridad del estado actual (por si necesitas volver atrás).`
  );
  if (!ok) return;

  // Safety-backup del estado actual (por si el usuario se arrepiente)
  const currentKeys = appKeys();
  if (currentKeys.length > 0) {
    const safetyData: Record<string, string> = {};
    for (const k of currentKeys) safetyData[k] = localStorage.getItem(k) || "";
    const safetyManifest: BackupManifest = {
      app: "cap-finanzas",
      version: currentVersion(),
      schema: 1,
      createdAt: new Date().toISOString(),
      keyCount: currentKeys.length,
      entryCount: countEntries(currentKeys),
      keys: currentKeys,
    };
    downloadJson(
      { manifest: safetyManifest, data: safetyData } as BackupFile,
      `Cap-Finanzas-PreRestore-${safetyManifest.createdAt.slice(0, 10)}.json`
    );
    // dar tiempo al navegador para iniciar la descarga antes de sobreescribir
    await new Promise((r) => setTimeout(r, 600));
  }

  // Aplicar el backup
  for (const [k, v] of Object.entries(backup.data)) {
    localStorage.setItem(k, v);
  }
  toast.success(`Respaldo restaurado: ${backup.manifest.keyCount} claves. Recargando…`);
  setTimeout(() => window.location.reload(), 1500);
}
