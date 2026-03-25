import { useEffect, useState } from "react";
import { useLicense } from "@/hooks/useLicense";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Key, ShoppingCart, AlertTriangle, Sparkles, Check } from "lucide-react";
import { PurchaseDialog } from "./PurchaseDialog";
import { ActivationDialog } from "./ActivationDialog";

interface LicenseGateProps {
  children: React.ReactNode;
}

export function LicenseGate({ children }: LicenseGateProps) {
  const { status, trialInfo, initializeTrial, pricing } = useLicense();
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [activationOpen, setActivationOpen] = useState(false);

  useEffect(() => {
    initializeTrial();
  }, [initializeTrial]);

  if (status === "active" || status === "trial") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Período de Prueba Finalizado</CardTitle>
          <CardDescription>
            Tu prueba gratuita de 30 días ha terminado. Adquiere tu licencia para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Días de prueba usados</span>
              <span className="font-medium">30 / 30 días</span>
            </div>
            <Progress value={100} className="h-2" />
          </div>

          {/* Single plan highlight */}
          <div className="border-2 border-primary rounded-lg p-6 text-center space-y-3">
            <Sparkles className="h-6 w-6 text-primary mx-auto" />
            <div className="text-4xl font-bold text-primary">${pricing.full} <span className="text-lg font-normal text-muted-foreground">USD</span></div>
            <p className="text-sm font-medium">Pago único · Acceso completo · Para siempre</p>
            <ul className="text-sm text-muted-foreground space-y-1 text-left max-w-xs mx-auto">
              {["Ambos modos de operación", "Hasta 5 cuentas base (+extras con referidos)", "Hasta 50 perfiles por instalación", "Tutor IA y Chat Financiero", "Actualizaciones de por vida"].map((f, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" /> {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => setPurchaseOpen(true)}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Comprar por ${pricing.full} USD
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setActivationOpen(true)}
            >
              <Key className="h-4 w-4 mr-2" />
              Ya tengo un código de licencia
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Pago único vía PayPal. Recibirás tu código de licencia por correo electrónico.
          </p>
        </CardContent>
      </Card>

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
    </div>
  );
}
