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
  Clock, 
  CheckCircle2, 
  Wallet, 
  BookOpen,
  ArrowUpRight,
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
    purchasedModes, 
    canUpgrade, 
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
          {/* Trial progress */}
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
                Tu prueba gratuita de 30 días te da acceso completo a ambos modos
              </p>
            </div>
          )}

          {/* Active license info */}
          {status === "active" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-success">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Licencia verificada y activa</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {purchasedModes.includes("simple") && (
                  <Badge variant="outline" className="gap-1">
                    <Wallet className="h-3 w-3" />
                    Finanzas Simples
                  </Badge>
                )}
                {purchasedModes.includes("traditional") && (
                  <Badge variant="outline" className="gap-1">
                    <BookOpen className="h-3 w-3" />
                    Contabilidad Tradicional
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Expired notice */}
          {status === "expired" && (
            <div className="bg-destructive/10 text-destructive rounded-lg p-4">
              <p className="font-medium">Tu período de prueba ha terminado</p>
              <p className="text-sm mt-1">Adquiere una licencia para continuar usando Cap Finanzas</p>
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
            {/* Simple Mode Card */}
            <div
              className={cn(
                "relative rounded-lg border-2 p-4 cursor-pointer transition-all",
                mode === "simple" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                !isModeAvailable("simple") && "opacity-50 cursor-not-allowed"
              )}
              onClick={() => isModeAvailable("simple") && setMode("simple")}
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
                  <p className="text-sm font-medium text-primary mt-2">${pricing.simple} USD</p>
                </div>
              </div>
            </div>

            {/* Traditional Mode Card */}
            <div
              className={cn(
                "relative rounded-lg border-2 p-4 cursor-pointer transition-all",
                mode === "traditional" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                !isModeAvailable("traditional") && "opacity-50 cursor-not-allowed"
              )}
              onClick={() => isModeAvailable("traditional") && setMode("traditional")}
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
                  <p className="text-sm font-medium text-primary mt-2">${pricing.traditional} USD</p>
                </div>
              </div>
            </div>
          </div>

          {!isModeAvailable("traditional") && status !== "trial" && (
            <p className="text-sm text-muted-foreground text-center">
              El modo Contabilidad Tradicional requiere la licencia correspondiente
            </p>
          )}
        </CardContent>
      </Card>

      {/* Purchase/Upgrade Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            {status === "active" && canUpgrade ? "Upgrade Disponible" : "Opciones de Compra"}
          </CardTitle>
          <CardDescription>
            {status === "active" && canUpgrade 
              ? "Desbloquea más funciones con el upgrade"
              : "Adquiere tu licencia de Cap Finanzas"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upgrade offer for existing simple users */}
          {canUpgrade && (
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 border border-primary/20">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4" />
                    Upgrade a Contabilidad Tradicional
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Paga solo la diferencia y obtén acceso completo
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">${pricing.upgrade}</p>
                  <p className="text-xs text-muted-foreground">USD</p>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              className="flex-1" 
              onClick={() => setPurchaseOpen(true)}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {canUpgrade ? "Ver Opciones de Upgrade" : "Ver Planes y Precios"}
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
            <p>💳 Pago único vía PayPal - sin suscripciones</p>
            <p>📧 Recibes tu código de licencia por correo electrónico</p>
            <p>🔒 Tus datos siempre permanecen en tu dispositivo</p>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <PurchaseDialog 
        open={purchaseOpen} 
        onOpenChange={setPurchaseOpen}
        onActivate={() => {
          setPurchaseOpen(false);
          setActivationOpen(true);
        }}
        highlightMode={canUpgrade ? "traditional" : undefined}
      />
      <ActivationDialog 
        open={activationOpen} 
        onOpenChange={setActivationOpen}
      />
    </div>
  );
}
