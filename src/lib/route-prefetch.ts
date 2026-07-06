/**
 * Prefetch de rutas por hover/touch/idle.
 *
 * Cada ruta apunta a un `() => import(...)` del mismo módulo que usa
 * `React.lazy` en `App.tsx`. Vite deduplica automáticamente los `import()`
 * repetidos, así que llamar varias veces al mismo loader no descarga
 * el chunk dos veces: la segunda llamada resuelve con la promesa ya
 * en curso o el módulo cacheado.
 */

type Loader = () => Promise<unknown>;

// Mapa ruta → loader del chunk. Debe coincidir con `App.tsx`.
export const ROUTE_LOADERS: Record<string, Loader> = {
  "/": () => import("@/pages/Dashboard"),
  "/transacciones": () => import("@/pages/Transacciones"),
  "/calendario": () => import("@/pages/Calendario"),
  "/presupuesto": () => import("@/pages/Presupuesto"),
  "/monedas": () => import("@/pages/Monedas"),
  "/categorias": () => import("@/pages/Categorias"),
  "/resumen": () => import("@/pages/Resumen"),
  "/contabilidad": () => import("@/pages/Contabilidad"),
  "/aprender": () => import("@/pages/Aprender"),
  "/ajustes": () => import("@/pages/Ajustes"),
  "/notificaciones": () => import("@/pages/Notificaciones"),
  "/instalar": () => import("@/pages/Instalar"),
};

const started = new Set<string>();

/**
 * Dispara el import de la ruta. Idempotente y silencioso ante errores
 * (el prefetch es best-effort — si falla, la navegación real reintenta).
 */
export function prefetchRoute(path: string): void {
  if (typeof window === "undefined") return;
  const loader = ROUTE_LOADERS[path];
  if (!loader) return;
  if (started.has(path)) return;
  started.add(path);
  loader().catch(() => {
    // Permitir reintentar si falló (p.ej. red intermitente).
    started.delete(path);
  });
}

/**
 * Handlers listos para spread sobre cualquier elemento navegable
 * (`<Link>`, `<button>`, `<Card>`).
 *
 * ```tsx
 * <Link to="/resumen" {...prefetchHandlers("/resumen")}>Resumen</Link>
 * ```
 */
export function prefetchHandlers(path: string) {
  const trigger = () => prefetchRoute(path);
  return {
    onMouseEnter: trigger,
    onFocus: trigger,
    onTouchStart: trigger,
    onPointerDown: trigger,
  };
}
