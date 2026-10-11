/**
 * Motor de automatización sobre datos del usuario — Cap-Finanzas v2
 *
 * Lee los datos que el usuario ya cargó en cada módulo y genera:
 *  - Alertas (notificaciones) automáticas
 *  - Un panel de "estado del negocio" consolidado
 *
 * No requiere conexión externa: trabaja sobre lo que el usuario ingresó.
 * Las fuentes externas (bancos, exchanges) son opcionales y alimentan
 * estos mismos módulos.
 */

import { useMemo } from "react";
import { useCuentasCorrientes } from "@/hooks/useCuentasCorrientes";
import { useFacturacion } from "@/hooks/useFacturacion";
import { useInventario } from "@/hooks/useInventario";
import { useSeguros } from "@/hooks/useSeguros";
import { useContratos } from "@/hooks/useContratos";
import { useFabricacion } from "@/hooks/useFabricacion";
import { useRRHH } from "@/hooks/useRRHH";

export type AlertSeverity = "critica" | "alta" | "media" | "baja";

export interface BusinessAlert {
  id: string;
  severity: AlertSeverity;
  module: string;
  title: string;
  message: string;
  count?: number;
  amount?: number;
  route?: string;
}

function daysBetween(fromISO: string, toISO: string): number {
  const a = new Date(fromISO + "T00:00:00");
  const b = new Date(toISO + "T00:00:00");
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function todayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const SEVERITY_ORDER: Record<AlertSeverity, number> = { critica: 0, alta: 1, media: 2, baja: 3 };

export function useAutomatizacion() {
  const cc = useCuentasCorrientes();
  const fac = useFacturacion();
  const inv = useInventario();
  const seg = useSeguros();
  const con = useContratos();
  const fab = useFabricacion();
  const rrhh = useRRHH();

  const alerts = useMemo<BusinessAlert[]>(() => {
    const out: BusinessAlert[] = [];
    const today = todayISO();

    // ── Cuentas por cobrar vencidas ──
    try {
      const vencidas = (cc.movements || []).filter(
        (m) => m.dueDate && m.dueDate < today && (m.kind === "factura" || m.kind === "nota-debito")
      );
      if (vencidas.length > 0) {
        const amount = vencidas.reduce((s, m) => s + m.amount, 0);
        const peor = vencidas.reduce((min, m) => (m.dueDate! < min ? m.dueDate! : min), vencidas[0].dueDate!);
        const dias = daysBetween(peor, today);
        out.push({
          id: "cc-cobrar-vencidas",
          severity: dias > 60 ? "critica" : dias > 30 ? "alta" : "media",
          module: "Cuentas Corrientes",
          title: "Cuentas por cobrar vencidas",
          message: `${vencidas.length} factura(s) vencida(s), la más antigua hace ${dias} días`,
          count: vencidas.length,
          amount,
          route: "/cuentas-corrientes",
        });
      }
    } catch { /* módulo sin datos */ }

    // ── Cuentas por pagar vencidas ──
    try {
      const vencidas = (cc.movements || []).filter(
        (m) => m.dueDate && m.dueDate < today && (m.kind === "pago" || m.kind === "nota-credito")
      );
      if (vencidas.length > 0) {
        const amount = vencidas.reduce((s, m) => s + m.amount, 0);
        out.push({
          id: "cc-pagar-vencidas",
          severity: "alta",
          module: "Cuentas Corrientes",
          title: "Cuentas por pagar vencidas",
          message: `${vencidas.length} obligación(es) vencida(s)`,
          count: vencidas.length,
          amount,
          route: "/cuentas-corrientes",
        });
      }
    } catch { /* noop */ }

    // ── Stock bajo mínimo ──
    try {
      const bajos = (inv.items || []).filter((i) => i.quantity <= i.minimumStock);
      if (bajos.length > 0) {
        const valor = bajos.reduce((s, i) => s + (i.minimumStock - i.quantity) * i.unitCost, 0);
        out.push({
          id: "inv-stock-bajo",
          severity: bajos.some((i) => i.quantity === 0) ? "alta" : "media",
          module: "Inventario",
          title: "Stock bajo mínimo",
          message: `${bajos.length} artículo(s) por reponer${bajos.some((i) => i.quantity === 0) ? " (hay agotados)" : ""}`,
          count: bajos.length,
          amount: valor,
          route: "/inventario",
        });
      }
    } catch { /* noop */ }

    // ── Pólizas por vencer (60 días) ──
    try {
      const porVencer = (seg.policies || []).filter((p) => {
        if (!p.expiryDate) return false;
        const d = daysBetween(today, p.expiryDate);
        return d >= 0 && d <= 60;
      });
      if (porVencer.length > 0) {
        out.push({
          id: "seg-por-vencer",
          severity: porVencer.some((p) => daysBetween(today, p.expiryDate) <= 15) ? "alta" : "media",
          module: "Seguros",
          title: "Pólizas por vencer",
          message: `${porVencer.length} póliza(s) vencen en los próximos 60 días`,
          count: porVencer.length,
          route: "/seguros",
        });
      }
    } catch { /* noop */ }

    // ── Contratos por vencer (30 días) ──
    try {
      const porVencer = (con.contracts || []).filter((c) => {
        if (!c.endDate || c.status !== "activo") return false;
        const d = daysBetween(today, c.endDate);
        return d >= 0 && d <= 30;
      });
      if (porVencer.length > 0) {
        out.push({
          id: "con-por-vencer",
          severity: "media",
          module: "Contratos",
          title: "Contratos por vencer",
          message: `${porVencer.length} contrato(s) vencen en 30 días o menos`,
          count: porVencer.length,
          route: "/contratos",
        });
      }
    } catch { /* noop */ }

    // ── Facturas vencidas sin cobrar ──
    try {
      const vencidas = (fac.invoices || []).filter(
        (i) => i.dueDate && i.dueDate < today && i.status !== "pagada" && i.status !== "anulada"
      );
      if (vencidas.length > 0) {
        const amount = vencidas.reduce((s, i) => s + i.total, 0);
        out.push({
          id: "fac-vencidas",
          severity: "alta",
          module: "Facturación",
          title: "Facturas vencidas sin cobrar",
          message: `${vencidas.length} factura(s) con vencimiento superado`,
          count: vencidas.length,
          amount,
          route: "/facturacion",
        });
      }
    } catch { /* noop */ }

    // ── Variaciones de costo desfavorables ──
    try {
      const desfavorables = (fab.variances || []).filter((v) => v.actualCost > v.standardCost * 1.05);
      if (desfavorables.length > 0) {
        const exceso = desfavorables.reduce((s, v) => s + (v.actualCost - v.standardCost), 0);
        out.push({
          id: "fab-variaciones",
          severity: exceso > 10000 ? "alta" : "media",
          module: "Fabricación",
          title: "Variaciones de costo desfavorables",
          message: `${desfavorables.length} orden(es) con sobrecosto > 5%`,
          count: desfavorables.length,
          amount: exceso,
          route: "/fabricacion",
        });
      }
    } catch { /* noop */ }

    // ── Liquidaciones pendientes de pago ──
    try {
      const pendientes = (rrhh.payrollEntries || []).filter((p) => !p.paid);
      if (pendientes.length > 0) {
        const amount = pendientes.reduce((s, p) => s + p.netPay, 0);
        out.push({
          id: "rrhh-nomina-pendiente",
          severity: "media",
          module: "Personal",
          title: "Nómina pendiente de pago",
          message: `${pendientes.length} liquidación(es) sin pagar`,
          count: pendientes.length,
          amount,
          route: "/rrhh",
        });
      }
    } catch { /* noop */ }

    return out.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
  }, [cc.movements, fac.invoices, inv.items, seg.policies, con.contracts, fab.variances, rrhh.payrollEntries]);

  const resumen = useMemo(() => {
    const porSeveridad = { critica: 0, alta: 0, media: 0, baja: 0 };
    let montoEnRiesgo = 0;
    for (const a of alerts) {
      porSeveridad[a.severity]++;
      if (a.amount) montoEnRiesgo += a.amount;
    }
    return {
      total: alerts.length,
      porSeveridad,
      montoEnRiesgo: Math.round(montoEnRiesgo * 100) / 100,
      hayCriticas: porSeveridad.critica > 0,
    };
  }, [alerts]);

  return { alerts, resumen };
}

export type { BusinessAlert };
