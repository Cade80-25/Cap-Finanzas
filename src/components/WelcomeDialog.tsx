import { BookOpen, Lightbulb, Play, Globe, DollarSign, BarChart3, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useTutorial } from "@/hooks/useTutorial";
import { useNumberFormat, NumberFormatType } from "@/hooks/useNumberFormat";
import { useState } from "react";

export function WelcomeDialog() {
  const { hasSeenWelcome, markWelcomeSeen, startTutorial } = useTutorial();
  const { format, setFormat } = useNumberFormat();
  const [step, setStep] = useState(0);
  const [selectedFormat, setSelectedFormat] = useState<NumberFormatType>(format);

  const handleStartTutorial = () => {
    setFormat(selectedFormat);
    markWelcomeSeen();
    // Start the interactive app tour instead of the old tutorial
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("start-app-tour"));
    }, 500);
  };

  const handleSkip = () => {
    setFormat(selectedFormat);
    markWelcomeSeen();
  };

  const handleNext = () => {
    setStep(1);
  };

  return (
    <Dialog open={!hasSeenWelcome} onOpenChange={(open) => !open && handleSkip()}>
      <DialogContent className="sm:max-w-lg overflow-hidden">
        {step === 0 ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-2xl bg-primary/10 animate-in zoom-in duration-500">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-2xl">
                    ¡Bienvenido a Cap Finanzas!
                  </DialogTitle>
                  <DialogDescription>
                    Tu sistema de contabilidad personal
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-3 py-4">
              <p className="text-muted-foreground text-sm">
                Descubre todas las herramientas para gestionar tus finanzas de forma sencilla y profesional.
              </p>

              <div className="grid gap-2">
                {[
                  { icon: BarChart3, title: "Panel de control", desc: "Visualiza tus ingresos, gastos y ahorros de un vistazo", color: "text-primary" },
                  { icon: BookOpen, title: "Contabilidad completa", desc: "Libro Diario, Mayor, Balance y Estado de Resultados", color: "text-primary" },
                  { icon: DollarSign, title: "Presupuestos inteligentes", desc: "Define límites y recibe alertas cuando los superes", color: "text-warning" },
                  { icon: Shield, title: "100% privado y seguro", desc: "Tus datos se guardan localmente en tu dispositivo", color: "text-success" },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 border border-border/50 animate-in slide-in-from-bottom duration-300"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <item.icon className={`h-5 w-5 mt-0.5 ${item.color}`} />
                    <div>
                      <p className="font-medium text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={handleSkip}
                className="w-full sm:w-auto"
              >
                Explorar por mi cuenta
              </Button>
              <Button
                onClick={handleNext}
                className="w-full sm:w-auto bg-gradient-primary"
              >
                Continuar
                <Sparkles className="h-4 w-4 ml-2" />
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-2xl bg-primary/10">
                  <Globe className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-xl">
                    Formato Numérico
                  </DialogTitle>
                  <DialogDescription>
                    ¿Cómo prefieres ver los números?
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="py-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Selecciona el formato de puntuación para cifras monetarias. Podrás cambiarlo después en Configuración.
              </p>

              <RadioGroup
                value={selectedFormat}
                onValueChange={(val) => setSelectedFormat(val as NumberFormatType)}
                className="space-y-3"
              >
                <label
                  htmlFor="format-dot"
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedFormat === "dot"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <RadioGroupItem value="dot" id="format-dot" />
                  <div className="flex-1">
                    <p className="font-medium">Punto decimal</p>
                    <p className="text-xs text-muted-foreground">EE.UU., Reino Unido, México, Japón</p>
                    <p className="text-lg font-bold text-primary mt-1">$1,234.56</p>
                  </div>
                </label>

                <label
                  htmlFor="format-comma"
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedFormat === "comma"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <RadioGroupItem value="comma" id="format-comma" />
                  <div className="flex-1">
                    <p className="font-medium">Coma decimal</p>
                    <p className="text-xs text-muted-foreground">España, Alemania, Argentina, Brasil</p>
                    <p className="text-lg font-bold text-primary mt-1">$1.234,56</p>
                  </div>
                </label>
              </RadioGroup>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setStep(0)}
                className="w-full sm:w-auto"
              >
                Atrás
              </Button>
              <Button
                onClick={handleStartTutorial}
                className="w-full sm:w-auto bg-gradient-primary"
              >
                <Play className="h-4 w-4 mr-2" />
                Iniciar Tutorial
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
