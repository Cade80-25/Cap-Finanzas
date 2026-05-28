import { Link } from "react-router-dom";
import { CheckCircle2, Circle, ExternalLink, ArrowLeft, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Reflects current Paddle go-live status as of last check.
// Source of truth lives in Paddle / Lovable Cloud; this page is informational.
const verificationSteps = [
  { id: "readiness", title: "Verificación de requisitos del sitio", description: "Políticas de privacidad, términos y reembolso publicadas y accesibles.", status: "completed" as const },
  { id: "publish", title: "Publicación del proyecto", description: "La app está publicada en producción.", status: "completed" as const },
  { id: "verification", title: "Verificación de identidad y negocio", description: "Datos del vendedor verificados por Paddle.", status: "completed" as const },
  { id: "review", title: "Revisión automática de Paddle", description: "Aprobación final para procesar pagos reales.", status: "completed" as const },
];

const payoutChecklist = [
  { id: "bank", title: "Cuenta bancaria de cobro", description: "Agregar IBAN / cuenta donde recibir depósitos en USD/EUR." },
  { id: "tax", title: "Información fiscal", description: "Completar formulario fiscal (W-8BEN si estás fuera de EE. UU.)." },
  { id: "address", title: "Dirección de facturación", description: "Confirmar dirección legal del negocio o persona." },
  { id: "currency", title: "Moneda de payout", description: "Elegir la divisa en la que querés recibir tus pagos." },
  { id: "schedule", title: "Frecuencia de pagos", description: "Configurar el calendario de transferencias (semanal/mensual)." },
];

export default function PaddleStatus() {
  const allVerified = verificationSteps.every((s) => s.status === "completed");

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link to="/ajustes">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" /> Volver
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Estado de pagos</h1>
        </div>

        <Card className="p-6">
          <div className="flex items-start gap-3 mb-4">
            {allVerified ? (
              <CheckCircle2 className="w-6 h-6 text-green-500 mt-0.5" />
            ) : (
              <AlertCircle className="w-6 h-6 text-yellow-500 mt-0.5" />
            )}
            <div>
              <h2 className="text-lg font-semibold">
                {allVerified ? "Cuenta verificada" : "Verificación en progreso"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {allVerified
                  ? "Tu cuenta está aprobada para procesar pagos reales."
                  : "Completá los pasos restantes para habilitar los cobros en vivo."}
              </p>
            </div>
          </div>

          <ul className="space-y-3 mt-4">
            {verificationSteps.map((step) => (
              <li key={step.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
                {step.status === "completed" ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                )}
                <div>
                  <p className="font-medium text-sm">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-1">Checklist de datos para recibir cobros</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Configurá estos datos en el panel de Paddle para empezar a recibir los depósitos de las ventas.
          </p>

          <ul className="space-y-3">
            {payoutChecklist.map((item) => (
              <li key={item.id} className="flex items-start gap-3 p-3 rounded-lg border">
                <Circle className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </li>
            ))}
          </ul>

          <Button
            className="w-full mt-6"
            onClick={() => window.open("https://vendors.paddle.com/financial-settings", "_blank")}
          >
            Abrir configuración de payout en Paddle
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </Card>

        <p className="text-xs text-muted-foreground text-center">
          ¿Problemas con los pagos? Contactá soporte de Paddle desde tu dashboard.
        </p>
      </div>
    </div>
  );
}
