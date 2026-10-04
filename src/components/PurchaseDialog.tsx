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
import { Check, Sparkles, ShoppingCart, KeyRound, Mail } from "lucide-react";
import { CONFIG } from "@/lib/config";
import { getPayPalLink } from "@/lib/paypal";

interface PurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Lleva al dialogo de activacion (lo pasa TrialExpiredGate). */
  onActivate?: () => void;
}

/**
 * Dialogo de compra real. Antes este componente mostraba "Cap Finanzas es Gratis"
 * con un boton "Empezar a usar" que solo cerraba el dialogo: al abrirse desde el
 * aviso de prueba vencida, volvia al aviso y nunca se podia entrar (bucle).
 */
const PLANES = [
  {
    id: "personal" as const,
    nombre: "Personal",
    precio: CONFIG.PRICING.PERSONAL.price,
    detalle: "Pago unico · para siempre",
    destacado: true,
    incluye: [
      "Ambos modos: Finanzas Simples y Contabilidad completa",
      "Libro Diario, Mayor, Balance y Estado de Resultados",
      "Tutor Educativo y Chat Financiero (IA)",
      "Presupuestos, calendario, metas y monedas",
      "Perfiles y cuentas (hasta 5 + extras por referidos)",
      "Actualizaciones de por vida",
    ],
  },
  {
    id: "empresarial" as const,
    nombre: "Empresarial",
    precio: CONFIG.PRICING.EMPRESARIAL.price,
    detalle: "Semestral · para empresas",
    destacado: false,
    incluye: [
      "Todo lo del plan Personal",
      "Multiples empresas y perfiles de trabajo",
      "Plan de cuentas y asientos compuestos",
      "Conciliacion bancaria e importacion CSV",
      "Soporte prioritario",
    ],
  },
];

export function PurchaseDialog({ open, onOpenChange, onActivate }: PurchaseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">
            Elegí tu licencia de Cap Finanzas
          </DialogTitle>
          <DialogDescription className="text-center">
            Pagás y recibís tu código de activación por correo electrónico.
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-4 mt-2">
          {PLANES.map((plan) => (
            <Card
              key={plan.id}
              className={plan.destacado ? "border-primary shadow-lg shadow-primary/10" : ""}
            >
              <CardContent className="pt-6 space-y-4">
                <div className="text-center">
                  <Badge className="mb-3" variant={plan.destacado ? "default" : "secondary"}>
                    <Sparkles className="h-3 w-3 mr-1" />
                    {plan.nombre}
                  </Badge>
                  <div className="text-4xl font-bold text-primary">
                    ${plan.precio}{" "}
                    <span className="text-base font-normal text-muted-foreground">USD</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{plan.detalle}</p>
                </div>

                <ul className="space-y-2">
                  {plan.incluye.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full gap-2"
                  variant={plan.destacado ? "default" : "outline"}
                  onClick={() => window.open(getPayPalLink(plan.id), "_blank")}
                >
                  <ShoppingCart className="h-4 w-4" />
                  Pagar ${plan.precio} USD con PayPal
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-3 mt-2">
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => {
              if (onActivate) {
                onOpenChange(false);
                onActivate();
              }
            }}
          >
            <KeyRound className="h-4 w-4" />
            Ya tengo un código de licencia
          </Button>
          <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
            <Mail className="h-3 w-3" />
            Tras el pago recibís el código en tu correo. Si demora, escribinos a {CONFIG.SUPPORT_EMAIL}.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
