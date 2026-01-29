import { BookOpen, Lightbulb, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTutorial } from "@/hooks/useTutorial";

export function WelcomeDialog() {
  const { hasSeenWelcome, markWelcomeSeen, startTutorial } = useTutorial();

  const handleStartTutorial = () => {
    markWelcomeSeen();
    startTutorial("dashboard");
  };

  const handleSkip = () => {
    markWelcomeSeen();
  };

  return (
    <Dialog open={!hasSeenWelcome} onOpenChange={(open) => !open && handleSkip()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-primary/10">
              <BookOpen className="h-8 w-8 text-primary" />
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

        <div className="space-y-4 py-4">
          <p className="text-muted-foreground">
            Parece que es tu primera vez aquí. ¿Te gustaría un recorrido guiado 
            para aprender a usar el programa?
          </p>

          <div className="grid gap-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Lightbulb className="h-5 w-5 text-warning mt-0.5" />
              <div>
                <p className="font-medium text-sm">Tutorial interactivo</p>
                <p className="text-xs text-muted-foreground">
                  Te guiaremos paso a paso por cada sección del programa con 
                  explicaciones claras y flechas indicadoras.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <BookOpen className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">Ayuda siempre disponible</p>
                <p className="text-xs text-muted-foreground">
                  Puedes acceder a los tutoriales en cualquier momento desde el 
                  botón de ayuda <span className="inline-flex items-center">(❓)</span> en la barra superior.
                </p>
              </div>
            </div>
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
            onClick={handleStartTutorial}
            className="w-full sm:w-auto bg-gradient-primary"
          >
            <Play className="h-4 w-4 mr-2" />
            Iniciar Tutorial
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
