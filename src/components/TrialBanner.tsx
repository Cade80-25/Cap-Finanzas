import { useState } from "react";
import { useLicense } from "@/hooks/useLicense";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, X, ShoppingCart, Key } from "lucide-react";
import { PurchaseDialog } from "./PurchaseDialog";
import { ActivationDialog } from "./ActivationDialog";
import { cn } from "@/lib/utils";

export function TrialBanner() {
  const { status, trialInfo } = useLicense();
  const [dismissed, setDismissed] = useState(false);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [activationOpen, setActivationOpen] = useState(false);

  // Don't show if not in trial or already dismissed
  if (status !== "trial" || dismissed) {
    return null;
  }

  const isUrgent = trialInfo.daysRemaining <= 7;
  const isCritical = trialInfo.daysRemaining <= 3;

  return (
    <>
      <div
        className={cn(
          "flex items-center justify-between gap-4 px-4 py-2 text-sm",
          isCritical
            ? "bg-destructive/10 text-destructive border-b border-destructive/20"
            : isUrgent
            ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-b border-amber-500/20"
            : "bg-primary/5 text-foreground border-b border-primary/10"
        )}
      >
        <div className="flex items-center gap-3 flex-wrap">
          <Badge
            variant={isCritical ? "destructive" : isUrgent ? "outline" : "secondary"}
            className="gap-1"
          >
            <Clock className="h-3 w-3" />
            {trialInfo.daysRemaining} {trialInfo.daysRemaining === 1 ? "día" : "días"} restantes
          </Badge>
          <span className="hidden sm:inline">
            {isCritical
              ? "¡Tu período de prueba está por terminar!"
              : isUrgent
              ? "Tu período de prueba terminará pronto"
              : "Estás en período de prueba gratuito"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={isCritical ? "destructive" : isUrgent ? "default" : "outline"}
            className="h-7 text-xs"
            onClick={() => setPurchaseOpen(true)}
          >
            <ShoppingCart className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">Comprar</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={() => setActivationOpen(true)}
          >
            <Key className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">Activar</span>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => setDismissed(true)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <PurchaseDialog
        open={purchaseOpen}
        onOpenChange={setPurchaseOpen}
        onActivate={() => {
          setPurchaseOpen(false);
          setActivationOpen(true);
        }}
      />
      <ActivationDialog 
        open={activationOpen} 
        onOpenChange={setActivationOpen}
      />
    </>
  );
}
