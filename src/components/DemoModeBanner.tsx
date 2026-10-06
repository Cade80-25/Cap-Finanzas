import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, X } from "lucide-react";
import { isDemoActive, loadDemoData, clearDemoData } from "@/lib/demo-data";
import { useToast } from "@/hooks/use-toast";

export function DemoModeBanner() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [active, setActive] = useState(isDemoActive());

  useEffect(() => {
    if (params.get("demo") === "1" && !isDemoActive()) {
      loadDemoData();
      setActive(true);
      toast({
        title: "Modo demo activado",
        description: "Cargamos datos de ejemplo para que explores la app.",
      });
      const next = new URLSearchParams(params);
      next.delete("demo");
      setParams(next, { replace: true });
      setTimeout(() => window.location.reload(), 600);
    }
  }, [params, setParams, toast]);

  if (!active) return null;

  const handleClear = () => {
    clearDemoData();
    toast({ title: "Datos demo eliminados", description: "Tu app quedó vacía y lista." });
    setTimeout(() => window.location.reload(), 400);
  };

  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/50 px-3 py-2 flex items-center justify-between gap-3 text-sm">
      <div className="flex items-center gap-2 text-amber-900 dark:text-amber-100 min-w-0">
        <Sparkles className="h-4 w-4 flex-shrink-0" />
        <span className="truncate">
          <strong>Modo demo:</strong> estás viendo datos de ejemplo, no son tuyos.
        </span>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="flex-shrink-0 h-7 text-xs"
        onClick={handleClear}
      >
        <X className="h-3 w-3 mr-1" /> Borrar datos demo
      </Button>
    </div>
  );
}
