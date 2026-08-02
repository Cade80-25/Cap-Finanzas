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
import { Check, Sparkles, Heart } from "lucide-react";

interface PurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActivate?: () => void;
  highlightMode?: string;
}

const allFeatures = [
  "Registro de ingresos y gastos",
  "Categorías y presupuestos",
  "Calendario financiero con recordatorios",
  "Contabilidad de partida doble",
  "Libro Diario, Mayor, Balance y Estado de Resultados",
  "Tutor Educativo y Chat Financiero (IA)",
  "Bolsas en Vivo",
  "Perfiles y cuentas ilimitados",
  "Actualizaciones gratuitas de por vida",
];

export function PurchaseDialog({ open, onOpenChange }: PurchaseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">Cap Finanzas es Gratis</DialogTitle>
          <DialogDescription className="text-center">
            Acceso completo sin costo. Sin suscripciones, sin códigos.
          </DialogDescription>
        </DialogHeader>

        <Card className="border-primary shadow-lg shadow-primary/10 mt-4">
          <CardContent className="pt-6 space-y-4">
            <div className="text-center">
              <Badge className="mb-3">
                <Sparkles className="h-3 w-3 mr-1" />
                Acceso Completo
              </Badge>
              <div className="text-5xl font-bold text-primary">
                Gratis
              </div>
              <p className="text-sm text-muted-foreground mt-1">Para siempre · Sin registro</p>
            </div>

            <ul className="space-y-2">
              {allFeatures.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Button className="w-full gap-2" onClick={() => onOpenChange(false)}>
              <Heart className="h-4 w-4" />
              Empezar a usar
            </Button>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
