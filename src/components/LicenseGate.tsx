import { useEffect, useState } from "react";
import { useLicense } from "@/hooks/useLicense";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Key, ShoppingCart, AlertTriangle, Check, Wallet, Building2 } from "lucide-react";
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
    // initializeTrial es asincrono (consulta al servidor); se ignora el
    // resultado para no bloquear el render.
    void initializeTrial();
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

          {/* Dos planes: Simples (permanente) y Empresarial (permanente) */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Plan Simples */}
            <div className="border rounded-lg p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                <span className="font-semibold">Simples</span>
              </div>
              <div className="text-3xl font-bold text-primary">
                ${pricing.simple} <span className="text-base font-normal text-muted-foreground">USD</span>
              </div>
              <p className="text-xs font-medium text-muted-foreground">Pago único · Permanente</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                {["Finanzas personales", "Presupuestos y calendario", "Múltiples monedas", "Tutor IA"].map((f, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <Check className="h-3 w-3 text-primary flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Plan Empresarial */}
            <div className="border-2 border-primary rounded-lg p-5 space-y-3 relative">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <span className="font-semibold">Empresarial</span>
              </div>
              <div className="text-3xl font-bold text-primary">
                ${pricing.traditional} <span className="text-base font-normal text-muted-foreground">USD</span>
              </div>
              <p className="text-xs font-medium text-muted-foreground">Pago único · Permanente</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                {["Todo lo del plan Simples", "Libro Diario y Mayor", "Balance y Estado de Resultados", "Enciclopedia contable", "Chat IA y Bolsas en Vivo"].map((f, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <Check className="h-3 w-3 text-primary flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => setPurchaseOpen(true)}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Comprar licencia
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
            Pago vía PayPal. Recibirás tu código de licencia por correo electrónico.
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
