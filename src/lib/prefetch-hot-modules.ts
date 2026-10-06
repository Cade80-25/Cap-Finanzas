/**
 * Prefetch en idle de los módulos más usados para reducir el tiempo
 * hasta la primera interacción (TTI). Vite los servirá como chunks
 * separados (vendor-* + page chunks), así que disparamos los `import()`
 * cuando el navegador está ocioso para que estén calientes en caché
 * antes de que el usuario navegue.
 *
 * Nota: NO importamos pdfjs / exceljs / qrcode aquí — son pesados y
 * solo se usan bajo demanda en exportación/escaneo.
 */

type PrefetchTask = () => Promise<unknown>;

// Orden por probabilidad de uso real medido en la app.
const TASKS: PrefetchTask[] = [
  () => import("@/pages/Dashboard"),
  () => import("@/pages/Transacciones"),
  () => import("@/pages/Calendario"),
  () => import("@/pages/Contabilidad"),
  () => import("@/pages/Presupuesto"),
  () => import("@/pages/Resumen"),
  () => import("@/pages/Ajustes"),
  () => import("@/pages/Notificaciones"),
];

const ric: (cb: () => void, opts?: { timeout: number }) => number =
  (typeof window !== "undefined" && (window as any).requestIdleCallback) ||
  ((cb: () => void) => window.setTimeout(cb, 200));

let started = false;

export function prefetchHotModules() {
  if (started || typeof window === "undefined") return;
  started = true;

  // Respetar conexiones lentas / ahorro de datos.
  const conn = (navigator as any).connection;
  if (conn?.saveData) return;
  if (conn?.effectiveType && /(^|-)2g$/.test(conn.effectiveType)) return;

  const run = (i: number) => {
    if (i >= TASKS.length) return;
    ric(
      () => {
        // Ignoramos errores: el prefetch es best-effort.
        TASKS[i]().catch(() => {}).finally(() => run(i + 1));
      },
      { timeout: 2000 },
    );
  };

  // Esperar al load para no competir con recursos críticos.
  if (document.readyState === "complete") {
    run(0);
  } else {
    window.addEventListener("load", () => run(0), { once: true });
  }
}
