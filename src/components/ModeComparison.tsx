import { ReactNode } from "react";
import {
  Wallet, Calculator, Check, X, Receipt, BookOpen, FileText,
  BarChart3, TrendingUp, Tag, Layers, Sparkles, Lightbulb,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { InteractiveModeExample } from "./InteractiveModeExample";

type Row = {
  feature: string;
  description: string;
  simple: ReactNode;
  completo: ReactNode;
};

const ROWS: Row[] = [
  {
    feature: "Registrar movimientos",
    description: "Anotar cuánto entra y cuánto sale",
    simple: <span className="text-sm">Ingreso o Gasto, en 1 paso</span>,
    completo: <span className="text-sm">Asiento por partida doble (Debe / Haber)</span>,
  },
  {
    feature: "Categorías",
    description: "Cómo agrupar tus gastos e ingresos",
    simple: <span className="text-sm">Automáticas con emojis 🍔 🚗 🏠</span>,
    completo: <span className="text-sm">Plan de cuentas editable y subcategorías</span>,
  },
  {
    feature: "Libro Diario",
    description: "Registro cronológico de transacciones contables",
    simple: <X className="h-4 w-4 text-muted-foreground mx-auto" />,
    completo: <Check className="h-4 w-4 text-success mx-auto" />,
  },
  {
    feature: "Libro Mayor",
    description: "Movimientos agrupados por cuenta contable",
    simple: <X className="h-4 w-4 text-muted-foreground mx-auto" />,
    completo: <Check className="h-4 w-4 text-success mx-auto" />,
  },
  {
    feature: "Balance General",
    description: "Activo, pasivo y patrimonio en una fecha",
    simple: <X className="h-4 w-4 text-muted-foreground mx-auto" />,
    completo: <Check className="h-4 w-4 text-success mx-auto" />,
  },
  {
    feature: "Estado de Resultados",
    description: "Ganancias y pérdidas del período",
    simple: <X className="h-4 w-4 text-muted-foreground mx-auto" />,
    completo: <Check className="h-4 w-4 text-success mx-auto" />,
  },
  {
    feature: "Reporte Consolidado",
    description: "Sumar varias cuentas o perfiles juntos",
    simple: <X className="h-4 w-4 text-muted-foreground mx-auto" />,
    completo: <Check className="h-4 w-4 text-success mx-auto" />,
  },
  {
    feature: "Presupuestos",
    description: "Definir límites de gasto mensual",
    simple: <Check className="h-4 w-4 text-success mx-auto" />,
    completo: <Check className="h-4 w-4 text-success mx-auto" />,
  },
  {
    feature: "Resumen visual y gráficos",
    description: "Gráficos de tu situación financiera",
    simple: <Check className="h-4 w-4 text-success mx-auto" />,
    completo: <Check className="h-4 w-4 text-success mx-auto" />,
  },
  {
    feature: "Calendario y recordatorios",
    description: "Agenda de pagos y vencimientos",
    simple: <Check className="h-4 w-4 text-success mx-auto" />,
    completo: <Check className="h-4 w-4 text-success mx-auto" />,
  },
  {
    feature: "Multimoneda",
    description: "Convertir entre USD, EUR, ARS, etc.",
    simple: <Check className="h-4 w-4 text-success mx-auto" />,
    completo: <Check className="h-4 w-4 text-success mx-auto" />,
  },
];

interface ModeComparisonProps {
  highlightMode?: "simple" | "traditional";
  compact?: boolean;
}

export function ModeComparison({ highlightMode, compact = false }: ModeComparisonProps) {
  return (
    <div className="space-y-4">
      {/* Ejemplo interactivo en vivo */}
      <InteractiveModeExample />

      {/* Tabla comparativa */}
      <Card className="overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto] sm:grid-cols-[2fr_1fr_1fr] gap-x-2 sm:gap-x-4">
          {/* Header */}
          <div className="bg-muted/50 px-3 sm:px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">
            Función
          </div>
          <div className={cn(
            "px-2 sm:px-4 py-2.5 text-center",
            highlightMode === "simple" && "bg-primary/10"
          )}>
            <div className="flex items-center justify-center gap-1.5">
              <Wallet className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold">Simple</span>
            </div>
          </div>
          <div className={cn(
            "px-2 sm:px-4 py-2.5 text-center",
            highlightMode === "traditional" && "bg-primary/10"
          )}>
            <div className="flex items-center justify-center gap-1.5">
              <Calculator className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold">Completo</span>
            </div>
          </div>

          {/* Rows */}
          {ROWS.map((row, i) => (
            <div key={row.feature} className="contents">
              <div className={cn(
                "px-3 sm:px-4 py-3 border-t border-border",
                i % 2 === 1 && "bg-muted/20"
              )}>
                <p className="text-sm font-medium leading-tight">{row.feature}</p>
                {!compact && (
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                    {row.description}
                  </p>
                )}
              </div>
              <div className={cn(
                "px-2 sm:px-4 py-3 border-t border-border flex items-center justify-center text-center",
                i % 2 === 1 && "bg-muted/20",
                highlightMode === "simple" && "bg-primary/5"
              )}>
                {row.simple}
              </div>
              <div className={cn(
                "px-2 sm:px-4 py-3 border-t border-border flex items-center justify-center text-center",
                i % 2 === 1 && "bg-muted/20",
                highlightMode === "traditional" && "bg-primary/5"
              )}>
                {row.completo}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recomendación */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="p-3 border-l-4 border-l-primary">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">Elegí Simple si…</p>
          </div>
          <ul className="text-xs text-muted-foreground space-y-1 ml-1">
            <li>• Querés controlar tu plata sin estudiar contabilidad</li>
            <li>• Buscás algo rápido y visual</li>
            <li>• Nunca usaste un Libro Diario</li>
          </ul>
        </Card>
        <Card className="p-3 border-l-4 border-l-primary">
          <div className="flex items-center gap-2 mb-1">
            <Calculator className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">Elegí Completo si…</p>
          </div>
          <ul className="text-xs text-muted-foreground space-y-1 ml-1">
            <li>• Sabés contabilidad o estás aprendiendo</li>
            <li>• Llevás las cuentas de un emprendimiento</li>
            <li>• Necesitás Balance y Estado de Resultados</li>
          </ul>
        </Card>
      </div>

      <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1.5">
        <Sparkles className="h-3 w-3" />
        Podés cambiar de modo cuando quieras desde la barra superior
      </p>
    </div>
  );
}
