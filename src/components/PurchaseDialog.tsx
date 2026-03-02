import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Check, CreditCard, Mail, ArrowRight, Sparkles, Loader2, Search, Copy, CheckCircle2 } from "lucide-react";
import { LicenseMode, useLicense } from "@/hooks/useLicense";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface PurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActivate: () => void;
  highlightMode?: LicenseMode;
}

export function PurchaseDialog({ open, onOpenChange, onActivate, highlightMode }: PurchaseDialogProps) {
  const { pricing, canUpgrade, purchasedModes } = useLicense();
  const [selectedPlan, setSelectedPlan] = useState<LicenseMode | "upgrade" | "full" | null>(
    highlightMode || null
  );
  const [checkEmail, setCheckEmail] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<{
    found: boolean;
    licenses?: { code: string; type: string; date: string; used: boolean }[];
    message?: string;
  } | null>(null);
  const [showCheck, setShowCheck] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const hasSimple = purchasedModes.includes("simple");
  const hasTraditional = purchasedModes.includes("traditional");
  const hasBoth = hasSimple && hasTraditional;

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
      disabled: hasSimple || hasBoth,
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
      disabled: hasTraditional || hasBoth,
      badge: hasTraditional ? "Adquirido" : canUpgrade ? "Upgrade $5" : null,
    },
    {
      id: "full" as const,
      name: "Licencia Completa",
      price: pricing.full,
      description: "Ambos modos en una sola licencia — la mejor oferta",
      features: [
        "Todo de Finanzas Simples",
        "Todo de Contabilidad Tradicional",
        "Cambio libre entre ambos modos",
        "Ahorra $3 vs comprar por separado",
        "Actualizaciones gratuitas de por vida",
      ],
      popular: true,
      disabled: hasBoth,
      badge: hasBoth ? "Adquirido" : null,
    },
  ];

  const paypalEmail = "pierresshop48@gmail.com";
  const paypalLink = "https://paypal.me/pierresshop48";

  const getSelectedPrice = () => {
    if (!selectedPlan) return 0;
    if (selectedPlan === "full") return pricing.full;
    if (selectedPlan === "upgrade") return pricing.upgrade;
    if (selectedPlan === "traditional" && canUpgrade) return pricing.upgrade;
    return selectedPlan === "simple" ? pricing.simple : pricing.traditional;
  };

  const getPlanLabel = () => {
    if (!selectedPlan) return "";
    if (selectedPlan === "full") return "Licencia Completa";
    if (selectedPlan === "simple") return "Finanzas Simples";
    return "Contabilidad Tradicional";
  };

  const getPaypalButtonUrl = () => {
    const amount = getSelectedPrice();
    const label = getPlanLabel();
    // PayPal.me with amount
    return `${paypalLink}/${amount}USD`;
  };

  const handleCheckLicense = async () => {
    if (!checkEmail.trim()) return;
    setIsChecking(true);
    setCheckResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("check-license", {
        body: { email: checkEmail.trim().toLowerCase() },
      });

      if (error) throw error;
      setCheckResult(data);
    } catch (err) {
      console.error("Check error:", err);
      setCheckResult({
        found: false,
        message: "Error al verificar. Intenta de nuevo en unos momentos.",
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast({ title: "Código copiado", description: code });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Adquirir Cap Finanzas</DialogTitle>
          <DialogDescription>
            Elige el plan que mejor se adapte a tus necesidades
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-3 gap-4 mt-4">
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

        {/* Extra accounts info */}
        <div className="bg-muted/50 rounded-lg p-3 mt-2">
          <p className="text-sm text-muted-foreground">
            💼 <strong>¿Necesitas más cuentas?</strong> Todos los planes incluyen 1 cuenta. 
            Puedes agregar hasta 4 cuentas adicionales por <strong>$2 USD</strong> cada una.
          </p>
        </div>

        {selectedPlan && (
          <Card className="mt-4 bg-muted/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Pagar con PayPal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-background rounded-lg p-4 space-y-3">
                <p className="font-medium">
                  {getPlanLabel()} — <span className="text-primary">${getSelectedPrice()} USD</span>
                </p>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>
                    Haz clic en <strong>"Pagar con PayPal"</strong> abajo
                  </li>
                  <li>
                    En la <strong>nota del pago</strong>, escribe tu <strong>correo electrónico</strong> y el plan: <strong>{getPlanLabel()}</strong>
                  </li>
                  <li>
                    Completa el pago
                  </li>
                  <li>
                    Regresa aquí y haz clic en <strong>"Ya pagué, buscar mi licencia"</strong>
                  </li>
                </ol>
              </div>

              <div className="flex gap-2">
                <Button 
                  className="flex-1 gap-2"
                  onClick={() => window.open(getPaypalButtonUrl(), "_blank")}
                >
                  <ArrowRight className="h-4 w-4" />
                  Pagar con PayPal (${getSelectedPrice()})
                </Button>
              </div>

              <div className="border-t pt-4 space-y-3">
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => setShowCheck(!showCheck)}
                >
                  <Search className="h-4 w-4" />
                  Ya pagué, buscar mi licencia
                </Button>

                {showCheck && (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="check-email">Correo electrónico usado en el pago</Label>
                      <div className="flex gap-2">
                        <Input
                          id="check-email"
                          type="email"
                          placeholder="tu-correo@email.com"
                          value={checkEmail}
                          onChange={(e) => {
                            setCheckEmail(e.target.value);
                            setCheckResult(null);
                          }}
                          onKeyDown={(e) => e.key === "Enter" && handleCheckLicense()}
                        />
                        <Button
                          onClick={handleCheckLicense}
                          disabled={isChecking || !checkEmail.trim()}
                        >
                          {isChecking ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Buscar"
                          )}
                        </Button>
                      </div>
                    </div>

                    {checkResult && (
                      <>
                        {checkResult.found && checkResult.licenses ? (
                          <div className="space-y-2">
                            <Alert>
                              <CheckCircle2 className="h-4 w-4" />
                              <AlertDescription>
                                ¡Licencia(s) encontrada(s)! Copia tu código y actívalo.
                              </AlertDescription>
                            </Alert>
                            {checkResult.licenses.map((lic) => (
                              <div
                                key={lic.code}
                                className="flex items-center justify-between bg-background rounded-lg p-3 border"
                              >
                                <div>
                                  <code className="font-mono font-bold text-lg">{lic.code}</code>
                                  <p className="text-xs text-muted-foreground">
                                    {lic.type === "simple" ? "Finanzas Simples" : lic.type === "full" ? "Licencia Completa" : lic.type === "account" ? "Cuenta Adicional" : "Contabilidad"}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCopyCode(lic.code)}
                                  >
                                    {copiedCode === lic.code ? (
                                      <Check className="h-4 w-4" />
                                    ) : (
                                      <Copy className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      onOpenChange(false);
                                      onActivate();
                                    }}
                                  >
                                    Activar
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <Alert variant="destructive">
                            <AlertDescription>
                              {checkResult.message || "No se encontraron licencias."}
                            </AlertDescription>
                          </Alert>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t pt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>¿Ya tienes un código?</span>
                <Button
                  variant="link"
                  className="p-0 h-auto text-sm"
                  onClick={() => {
                    onOpenChange(false);
                    onActivate();
                  }}
                >
                  Activar con código
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!selectedPlan && (
          <p className="text-center text-muted-foreground text-sm mt-4">
            Selecciona un plan para ver las opciones de pago
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
