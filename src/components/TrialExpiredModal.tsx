// Modal que bloquea el acceso cuando el trial expiró
import { useLicense } from "@/hooks/useLicense";
import { PurchaseDialog } from "./PurchaseDialog";
import { ActivationDialog } from "./ActivationDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock, ShoppingCart, KeyRound } from "lucide-react";
import { useState } from "react";

export function TrialExpiredGate({ children }: { children: React.ReactNode }) {
  const { status } = useLicense();
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [activationOpen, setActivationOpen] = useState(false);

  if (status === "expired") {
    return (
      <>
        <Dialog open={true}>
          <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mx-auto mb-4">
                <Lock className="h-8 w-8 text-destructive" />
              </div>
              <DialogTitle className="text-center text-2xl">Tu prueba gratuita terminó</DialogTitle>
              <DialogDescription className="text-center text-base pt-2">
                Tuviste 30 días para probar Cap Finanzas. Para seguir usándola, adquirí tu licencia.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 mt-4">
              <Button size="lg" className="gap-2 w-full" onClick={() => setPurchaseOpen(true)}>
                <ShoppingCart className="h-5 w-5" />
                Comprar licencia
              </Button>
              <Button size="lg" variant="outline" className="gap-2 w-full" onClick={() => setActivationOpen(true)}>
                <KeyRound className="h-5 w-5" />
                Ya tengo un código
              </Button>
            </div>
            <p className="text-xs text-center text-muted-foreground mt-4">
              ¿Necesitás ayuda? Escribinos a soporte@capfinanzas.com
            </p>
          </DialogContent>
        </Dialog>
        <PurchaseDialog open={purchaseOpen} onOpenChange={setPurchaseOpen} />
        <ActivationDialog open={activationOpen} onOpenChange={setActivationOpen} />
      </>
    );
  }

  return <>{children}</>;
}
