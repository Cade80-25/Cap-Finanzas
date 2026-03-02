import { useEffect, useState } from "react";
import { useLicense } from "@/hooks/useLicense";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, Key, ShoppingCart, AlertTriangle, Sparkles } from "lucide-react";
import { PurchaseDialog } from "./PurchaseDialog";
import { ActivationDialog } from "./ActivationDialog";

interface LicenseGateProps {
  children: React.ReactNode;
}

export function LicenseGate({ children }: LicenseGateProps) {
  const { status, trialInfo, initializeTrial, purchasedModes } = useLicense();
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [activationOpen, setActivationOpen] = useState(false);

  // Initialize trial on first mount
  useEffect(() => {
    initializeTrial();
  }, [initializeTrial]);

  // If license is active or trial is valid, show the app
  if (status === "active" || status === "trial") {
    return <>{children}</>;
  }

  // Trial expired - show purchase screen
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Período de Prueba Finalizado</CardTitle>
          <CardDescription>
            Tu prueba gratuita de 30 días ha terminado. Adquiere una licencia para continuar usando Cap Finanzas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Trial progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Días de prueba usados</span>
              <span className="font-medium">30 / 30 días</span>
            </div>
            <Progress value={100} className="h-2" />
          </div>

          {/* Benefits reminder */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <p className="font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Con tu licencia obtienes:
            </p>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Acceso permanente a todas las funciones</li>
              <li>• Tus datos permanecen guardados localmente</li>
              <li>• Actualizaciones gratuitas de por vida</li>
              <li>• Sin pagos recurrentes ni suscripciones</li>
            </ul>
          </div>

          {/* Pricing summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="border rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">$5</p>
              <p className="text-xs text-muted-foreground">Finanzas Simples</p>
            </div>
            <div className="border rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">$10</p>
              <p className="text-xs text-muted-foreground">Contabilidad</p>
            </div>
            <div className="border rounded-lg p-3 text-center border-primary">
              <p className="text-2xl font-bold">$12</p>
              <p className="text-xs text-muted-foreground">Completa</p>
              <Badge variant="secondary" className="mt-1 text-xs">
                Mejor valor
              </Badge>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => setPurchaseOpen(true)}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Ver Planes y Comprar
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
