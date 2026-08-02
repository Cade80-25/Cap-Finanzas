import { useState } from "react";
import { useLicense } from "@/hooks/useLicense";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Key, 
  ShoppingCart, 
  CheckCircle2, 
  Wallet, 
  BookOpen,
  Sparkles
} from "lucide-react";
import { PurchaseDialog } from "./PurchaseDialog";
import { ActivationDialog } from "./ActivationDialog";
import { cn } from "@/lib/utils";

export function LicenseSettings() {
  const { 
    mode, 
    status, 
    trialInfo, 
    pricing,
    setMode,
    isModeAvailable
  } = useLicense();
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [activationOpen, setActivationOpen] = useState(false);

  const trialPercentage = ((30 - trialInfo.daysRemaining) / 30) * 100;

  return (
    <div className="space-y-6">
      {/* Current License Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Estado de Licencia
              </CardTitle>
              <CardDescription>
                Información sobre tu licencia actual
              </CardDescription>
            </div>
            <Badge 
              variant={status === "active" ? "default" : status === "trial" ? "secondary" : "destructive"}
              className="text-sm px-3 py-1"
            >
              {status === "active" ? "Activa" : status === "trial" ? "Prueba" : "Expirada"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "trial" && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Período de prueba</span>
                <span className="font-medium">
                  {trialInfo.daysRemaining} {trialInfo.daysRemaining === 1 ? "día" : "días"} restantes
                </span>
              </div>
              <Progress value={trialPercentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Tu prueba gratuita de 30 días te da acceso completo a todas las funciones
              </p>
            </div>
          )}

          {status === "active" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Licencia verificada — Acceso completo</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="gap-1">
                  <Wallet className="h-3 w-3" />
                  Finanzas Simples
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <BookOpen className="h-3 w-3" />
                  Contabilidad Tradicional
                </Badge>
              </div>
            </div>
          )}

          {status === "expired" && (
            <div className="bg-destructive/10 text-destructive rounded-lg p-4">
              <p className="font-medium">Tu período de prueba ha terminado</p>
              <p className="text-sm mt-1">Adquiere tu licencia por solo ${pricing.full} USD para continuar</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Modo de Operación</CardTitle>
          <CardDescription>
            Selecciona cómo quieres usar la aplicación
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div
              className={cn(
                "relative rounded-lg border-2 p-4 cursor-pointer transition-all",
                mode === "simple" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              )}
              onClick={() => setMode("simple")}
            >
              {mode === "simple" && (
                <Badge className="absolute -top-2 -right-2 text-xs">Activo</Badge>
              )}
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">Finanzas Simples</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Registro sencillo de ingresos y gastos
                  </p>
                </div>
              </div>
            </div>

            <div
              className={cn(
                "relative rounded-lg border-2 p-4 cursor-pointer transition-all",
                mode === "traditional" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              )}
              onClick={() => setMode("traditional")}
            >
              {mode === "traditional" && (
                <Badge className="absolute -top-2 -right-2 text-xs">Activo</Badge>
              )}
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">Contabilidad Tradicional</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Sistema completo de partida doble
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Option - only show if not active */}
      {status !== "active" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Obtener Acceso Completo
            </CardTitle>
            <CardDescription>
              Un solo pago de ${pricing.full} USD — sin suscripciones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                className="flex-1" 
                onClick={() => setPurchaseOpen(true)}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Comprar por ${pricing.full} USD
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setActivationOpen(true)}
              >
                <Key className="h-4 w-4 mr-2" />
                Activar Código de Licencia
              </Button>
            </div>

            <Separator />

            <div className="text-center text-sm text-muted-foreground space-y-1">
              <p>💳 Pago único vía PayPal — sin suscripciones</p>
              <p>📧 Recibes tu código de licencia por correo electrónico</p>
              <p>🔒 Tus datos siempre permanecen en tu dispositivo</p>
            </div>
          </CardContent>
        </Card>
      )}

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
