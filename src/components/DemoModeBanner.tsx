import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, X, ListChecks, Building2 } from "lucide-react";
import { isDemoActive, loadDemoData, clearDemoData, purgeDemoData } from "@/lib/demo-data";
import { isDemoEmpresarialActive, loadDemoEmpresarial, clearDemoEmpresarial, purgeDemoEmpresarial } from "@/lib/demo-empresarial";
import { useToast } from "@/hooks/use-toast";

export function DemoModeBanner() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [active, setActive] = useState(isDemoActive() || isDemoEmpresarialActive());
  const [empresarial, setEmpresarial] = useState(isDemoEmpresarialActive());
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const demoParam = params.get("demo");
    if (demoParam && !isDemoActive() && !isDemoEmpresarialActive()) {
      if (demoParam === "empresarial") {
        try {
          loadDemoEmpresarial();
          setActive(true);
          setEmpresarial(true);
          toast({
            title: "Modo demo empresarial activado",
            description: "Ferretería El Umbral S.R.L. — 3 meses de operación completa.",
          });
        } catch (err) {
          toast({
            title: "No se pudo activar el demo empresarial",
            description: err instanceof Error ? err.message : "Error desconocido",
            variant: "destructive",
          });
          return;
        }
      } else if (demoParam === "1") {
        loadDemoData();
        setActive(true);
        setEmpresarial(false);
        toast({
          title: "Modo demo activado",
          description: "Cargamos datos de ejemplo para que explores la app.",
        });
      }
      const next = new URLSearchParams(params);
      next.delete("demo");
      setParams(next, { replace: true });
      setTimeout(() => window.location.reload(), 600);
    }
  }, [params, setParams, toast]);

  if (!active) return null;

  const handleClear = () => {
    if (empresarial) {
      clearDemoEmpresarial();
      toast({ title: "Volviste a tus datos", description: "Tus datos reales fueron restaurados." });
    } else {
      clearDemoData();
      toast({ title: "Volviste a tus datos", description: "Tus transacciones reales fueron restauradas." });
    }
    setTimeout(() => window.location.reload(), 400);
  };

  const handlePurge = () => {
    if (empresarial) {
      purgeDemoEmpresarial();
    } else {
      purgeDemoData();
    }
    toast({ title: "Datos demo eliminados", description: "La app quedó vacía y lista para tus datos." });
    setTimeout(() => window.location.reload(), 400);
  };

  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/50">
      {open && (
        <div className="px-3 py-3 border-b border-amber-200 dark:border-amber-900/50">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-100 font-medium mb-2">
              <ListChecks className="h-4 w-4" />
              {empresarial ? "Demo empresarial — Ferretería El Umbral S.R.L." : "Recorré la demo en 5 pasos"}
            </div>
            {empresarial ? (
              <ol className="text-sm text-amber-900/90 dark:text-amber-100/90 space-y-1.5 list-decimal list-inside">
                <li>
                  Mirá <strong>Contabilidad</strong>: balances por cuenta, libro diario con partida doble e IVA 22%.
                </li>
                <li>
                  Revisá <strong>Facturación</strong> (facturas con renglones) y <strong>Cuentas corrientes</strong> (cobros y pagos).
                </li>
                <li>
                  Explorá <strong>Inventario</strong> (stock y alertas), <strong>RRHH</strong> (nómina) y <strong>TPV</strong> (mostrador).
                </li>
                <li>
                  Mirá <strong>CRM</strong> (leads) y <strong>Presupuesto</strong> vs. gastos reales.
                </li>
                <li>
                  Cuando quieras usar tus datos, tocá <strong>“Volver a mis datos”</strong>.
                </li>
              </ol>
            ) : (
              <ol className="text-sm text-amber-900/90 dark:text-amber-100/90 space-y-1.5 list-decimal list-inside">
                <li>
                  Mirá el <strong>Panel principal</strong>: ingresos, gastos y balance de ejemplo ya cargados.
                </li>
                <li>
                  Registrá un gasto con el botón <strong>rayo</strong> (abajo a la derecha): monto, categoría, guardar — el balance se actualiza solo.
                </li>
                <li>
                  Andá a <strong>Bolsas</strong> en el menú: 12 mercados del mundo actualizándose en vivo.
                </li>
                <li>
                  Explorá <strong>Categorías</strong> y <strong>Resumen</strong> para ver en qué se va la plata.
                </li>
                <li>
                  Cuando quieras usar tus datos, tocá <strong>“Volver a mis datos”</strong> (o “Empezar de cero” si es tu primer día).
                </li>
              </ol>
            )}
          </div>
        </div>
      )}
      <div className="px-3 py-2 flex items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 text-amber-950 dark:text-amber-100 min-w-0">
          {empresarial ? <Building2 className="h-4 w-4 flex-shrink-0" /> : <Sparkles className="h-4 w-4 flex-shrink-0" />}
          <span className="truncate">
            <strong>Modo demo{empresarial ? " empresarial" : ""}:</strong> estás viendo datos de ejemplo, no son tuyos.
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={() => setOpen(!open)}
          >
            <ListChecks className="h-3 w-3 mr-1" />
            {open ? "Ocultar guía" : "Guía"}
          </Button>
          <Button
            size="sm"
            onClick={handleClear}
            className="h-7 text-xs"
          >
            Volver a mis datos
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={handlePurge}
          >
            <X className="h-3 w-3 mr-1" /> Empezar de cero
          </Button>
        </div>
      </div>
    </div>
  );
}
