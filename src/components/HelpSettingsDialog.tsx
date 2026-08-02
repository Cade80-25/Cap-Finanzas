import { Settings, Lightbulb, RotateCcw, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useHelpPreferences } from "@/hooks/useHelpPreferences";
import { useTutorial } from "@/hooks/useTutorial";
import { toast } from "sonner";

export function HelpSettingsDialog() {
  const {
    showContextualHelp,
    showEmptyStateHelp,
    toggleContextualHelp,
    toggleEmptyStateHelp,
    resetAllHelp,
    disableAllHelp,
  } = useHelpPreferences();

  const { resetTutorial } = useTutorial();

  const handleResetAll = () => {
    resetAllHelp();
    resetTutorial();
    toast.success("Todas las ayudas han sido reactivadas");
  };

  const handleDisableAll = () => {
    disableAllHelp();
    toast.success("Ayudas desactivadas. Puedes reactivarlas aquí cuando quieras.");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Configurar Ayudas</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-warning" />
            Configuración de Ayudas
          </DialogTitle>
          <DialogDescription>
            Personaliza qué ayudas y consejos quieres ver mientras usas el programa
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="contextual-help">Ayudas contextuales</Label>
              <p className="text-xs text-muted-foreground">
                Muestra consejos y guías en cada sección
              </p>
            </div>
            <Switch
              id="contextual-help"
              checked={showContextualHelp}
              onCheckedChange={toggleContextualHelp}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="empty-state-help">Ayuda en pantallas vacías</Label>
              <p className="text-xs text-muted-foreground">
                Muestra tips cuando no hay datos
              </p>
            </div>
            <Switch
              id="empty-state-help"
              checked={showEmptyStateHelp}
              onCheckedChange={toggleEmptyStateHelp}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-sm font-medium">Acciones rápidas</p>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetAll}
                className="justify-start"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reactivar todas las ayudas
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisableAll}
                className="justify-start text-muted-foreground"
              >
                <EyeOff className="h-4 w-4 mr-2" />
                Soy usuario experto (desactivar todo)
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogTrigger asChild>
            <Button>Listo</Button>
          </DialogTrigger>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
