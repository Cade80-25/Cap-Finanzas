import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard, Mail, ArrowRight, Sparkles } from "lucide-react";
import { LicenseMode, useLicense } from "@/hooks/useLicense";
import { cn } from "@/lib/utils";

interface PurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActivate: () => void;
  highlightMode?: LicenseMode;
}

export function PurchaseDialog({ open, onOpenChange, onActivate, highlightMode }: PurchaseDialogProps) {
  const { pricing, canUpgrade, purchasedModes } = useLicense();
  const [selectedPlan, setSelectedPlan] = useState<LicenseMode | "upgrade" | null>(
    highlightMode || null
  );

  const hasSimple = purchasedModes.includes("simple");
  const hasTraditional = purchasedModes.includes("traditional");

  const plans = [
    {
      id: "simple" as const,
      name: "Finanzas Personales Simples",
      price: pricing.simple,
      description: "Ideal para controlar gastos e ingresos personales",
      features: [
        "Registro de ingresos y gastos",
        "Categorías personalizables",
        "Resumen mensual con gráficos",
        "Presupuestos y metas",
        "Calendario financiero",
        "Múltiples monedas",
      ],
      disabled: hasSimple || hasTraditional,
      badge: hasSimple ? "Adquirido" : null,
    },
    {
      id: "traditional" as const,
      name: "Contabilidad Tradicional",
      price: canUpgrade ? pricing.upgrade : pricing.traditional,
      description: "Sistema completo de contabilidad de doble entrada",
      features: [
        "Todo de Finanzas Simples",
        "Libro Diario con partida doble",
        "Libro Mayor por cuenta",
        "Balance General",
        "Estado de Resultados",
        "Plan de cuentas profesional",
        "Enciclopedia contable",
      ],
      popular: true,
      disabled: hasTraditional,
      badge: hasTraditional ? "Adquirido" : canUpgrade ? "Upgrade $5" : null,
    },
  ];

  const paypalEmail = "tu-email@paypal.com"; // TODO: Cambiar por email real
  const paypalLink = `https://paypal.me/tuusuario`; // TODO: Cambiar por link real

  const getSelectedPrice = () => {
    if (!selectedPlan) return 0;
    if (selectedPlan === "upgrade") return pricing.upgrade;
    if (selectedPlan === "traditional" && canUpgrade) return pricing.upgrade;
    return selectedPlan === "simple" ? pricing.simple : pricing.traditional;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Adquirir Cap Finanzas</DialogTitle>
          <DialogDescription>
            Elige el plan que mejor se adapte a tus necesidades
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={cn(
                "relative cursor-pointer transition-all",
                selectedPlan === plan.id && "ring-2 ring-primary",
                plan.disabled && "opacity-50 cursor-not-allowed",
                plan.popular && !plan.disabled && "border-primary"
              )}
              onClick={() => !plan.disabled && setSelectedPlan(plan.id)}
            >
              {plan.popular && !plan.disabled && (
                <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Más completo
                </Badge>
              )}
              {plan.badge && (
                <Badge 
                  variant={plan.disabled ? "secondary" : "outline"} 
                  className="absolute -top-2 right-4"
                >
                  {plan.badge}
                </Badge>
              )}
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-4">
                  ${plan.id === "traditional" && canUpgrade ? pricing.upgrade : plan.price}
                  <span className="text-sm font-normal text-muted-foreground"> USD</span>
                  {plan.id === "traditional" && canUpgrade && (
                    <span className="text-sm font-normal text-muted-foreground block">
                      (Upgrade desde Finanzas Simples)
                    </span>
                  )}
                </div>
                <ul className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedPlan && (
          <Card className="mt-4 bg-muted/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Instrucciones de Pago
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm">
                  <strong>Monto a pagar:</strong> ${getSelectedPrice()} USD
                </p>
                <p className="text-sm">
                  <strong>Método:</strong> PayPal
                </p>
              </div>

              <div className="bg-background rounded-lg p-4 space-y-3">
                <p className="font-medium">Pasos para completar tu compra:</p>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>
                    Envía el pago de <strong>${getSelectedPrice()} USD</strong> a través de PayPal
                  </li>
                  <li>
                    <a 
                      href={paypalLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Ir a PayPal <ArrowRight className="h-3 w-3" />
                    </a>
                    {" "}o envía a: <code className="bg-muted px-1 rounded">{paypalEmail}</code>
                  </li>
                  <li>
                    En la nota del pago, incluye tu <strong>correo electrónico</strong>
                  </li>
                  <li>
                    Recibirás tu <strong>código de licencia</strong> por correo en menos de 24 horas
                  </li>
                </ol>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>¿Ya tienes un código de licencia?</span>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    onOpenChange(false);
                    onActivate();
                  }}
                >
                  Activar con código
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => window.open(paypalLink, "_blank")}
                >
                  Ir a PayPal
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!selectedPlan && (
          <p className="text-center text-muted-foreground text-sm mt-4">
            Selecciona un plan para ver las instrucciones de pago
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
