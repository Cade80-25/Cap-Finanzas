import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Check, CreditCard, Mail, ArrowRight, Sparkles, Loader2, Search, Copy, CheckCircle2, Zap } from "lucide-react";
import { useLicense } from "@/hooks/useLicense";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { initializePaddle, getPaddlePriceId, getPaddleEnvironment } from "@/lib/paddle";
interface PurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActivate: () => void;
  highlightMode?: string;
}

export function PurchaseDialog({ open, onOpenChange, onActivate }: PurchaseDialogProps) {
  const { pricing } = useLicense();
  const [checkEmail, setCheckEmail] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<{
    found: boolean;
    licenses?: { code: string; type: string; date: string; used: boolean }[];
    message?: string;
  } | null>(null);
  const [showCheck, setShowCheck] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const paypalButtonId = "KZXBA5QRWVQV2";
  const paypalUrl = `https://www.paypal.com/ncp/payment/${paypalButtonId}`;

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

  const allFeatures = [
    "Registro de ingresos y gastos",
    "Categorías y presupuestos",
    "Calendario financiero con recordatorios",
    "Contabilidad de partida doble",
    "Libro Diario, Mayor, Balance y Estado de Resultados",
    "Tutor Educativo y Chat Financiero (IA)",
    "Bolsas en Vivo",
    "Hasta 5 cuentas base (+extras con referidos)",
    "Hasta 50 perfiles por instalación",
    "Actualizaciones gratuitas de por vida",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">Adquirir Cap Finanzas</DialogTitle>
          <DialogDescription className="text-center">
            Un solo pago, acceso completo para siempre
          </DialogDescription>
        </DialogHeader>

        {/* Single Plan Card */}
        <Card className="border-primary shadow-lg shadow-primary/10 mt-4">
          <CardContent className="pt-6 space-y-4">
            <div className="text-center">
              <Badge className="mb-3">
                <Sparkles className="h-3 w-3 mr-1" />
                Acceso Completo
              </Badge>
              <div className="text-5xl font-bold text-primary">
                ${pricing.full}
                <span className="text-lg font-normal text-muted-foreground"> USD</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Pago único · Sin suscripciones</p>
            </div>

            <ul className="space-y-2">
              {allFeatures.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Payment Section */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2 font-medium">
              <CreditCard className="h-5 w-5" />
              Pagar con PayPal
            </div>

            <div className="bg-background rounded-lg p-4 space-y-3">
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Haz clic en <strong>"Pagar con PayPal"</strong> abajo</li>
                <li>Completa el pago con tu cuenta de PayPal</li>
                <li>Regresa aquí y haz clic en <strong>"Ya pagué, buscar mi licencia"</strong></li>
              </ol>
              <p className="text-xs text-muted-foreground">
                Tu licencia se generará automáticamente usando el correo de tu cuenta de PayPal.
              </p>
            </div>

            <Button
              className="w-full gap-2"
              onClick={() => window.open(paypalUrl, "_blank")}
            >
              <ArrowRight className="h-4 w-4" />
              Pagar con PayPal (${pricing.full} USD)
            </Button>

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
                        {isChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
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
                              ¡Licencia encontrada! Copia tu código y actívalo.
                            </AlertDescription>
                          </Alert>
                          {checkResult.licenses.map((lic) => (
                            <div
                              key={lic.code}
                              className="flex items-center justify-between bg-background rounded-lg p-3 border"
                            >
                              <div>
                                <code className="font-mono font-bold text-lg">{lic.code}</code>
                                <p className="text-xs text-muted-foreground">Cap Finanzas — Acceso Completo</p>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleCopyCode(lic.code)}>
                                  {copiedCode === lic.code ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
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
      </DialogContent>
    </Dialog>
  );
}
