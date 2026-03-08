import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Circle, X, ChevronRight, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOnboardingProgress } from "@/hooks/useOnboardingProgress";
import { useWalletContext } from "@/contexts/WalletContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function OnboardingChecklist() {
  const navigate = useNavigate();
  const { steps, completedCount, totalSteps, progress, dismissed, dismiss } = useOnboardingProgress();
  const { addWallet, walletIcons } = useWalletContext();
  const [showWalletDialog, setShowWalletDialog] = useState(false);
  const [walletName, setWalletName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState(walletIcons[0] || "💰");

  if (dismissed) return null;

  const handleStepClick = (step: typeof steps[0]) => {
    if (step.completed) return;
    if (step.id === "wallet") {
      setShowWalletDialog(true);
    } else {
      navigate(step.route);
    }
  };

  const handleCreateWallet = () => {
    if (!walletName.trim()) {
      toast.error("Escribe un nombre para la billetera");
      return;
    }
    const result = addWallet(walletName.trim(), selectedIcon);
    if (result.success) {
      toast.success("¡Billetera creada! 🎉");
      setShowWalletDialog(false);
      setWalletName("");
    } else {
      toast.error(result.message);
    }
  };

  return (
    <>
      <Card className="shadow-soft border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              {progress === 100 ? (
                <Trophy className="h-5 w-5 text-warning" />
              ) : (
                <span className="text-lg">🚀</span>
              )}
              {progress === 100 ? "¡Felicidades! Configuración completa" : "Primeros pasos"}
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={dismiss}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <Progress value={progress} className="h-2 flex-1" />
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
              {completedCount}/{totalSteps}
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-1.5">
          {steps.map((step) => (
            <button
              key={step.id}
              onClick={() => handleStepClick(step)}
              disabled={step.completed}
              className={cn(
                "flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-left transition-all text-sm",
                step.completed
                  ? "opacity-60"
                  : "hover:bg-primary/5 cursor-pointer"
              )}
            >
              {step.completed ? (
                <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              )}
              <span className="mr-1">{step.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className={cn("font-medium", step.completed && "line-through")}>{step.title}</p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
              {!step.completed && (
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
            </button>
          ))}
          {progress === 100 && (
            <Button variant="outline" size="sm" className="w-full mt-2" onClick={dismiss}>
              ¡Entendido! Cerrar guía
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Wallet creation dialog */}
      <Dialog open={showWalletDialog} onOpenChange={setShowWalletDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Crear Billetera 👛</DialogTitle>
            <DialogDescription>
              Organiza tu dinero creando billeteras separadas (ej: Efectivo, Banco, Ahorros)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="wallet-name">Nombre</Label>
              <Input
                id="wallet-name"
                placeholder="Ej: Mi Banco, Efectivo, Ahorros..."
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateWallet()}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Ícono</Label>
              <div className="flex flex-wrap gap-2">
                {walletIcons.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setSelectedIcon(icon)}
                    className={cn(
                      "h-10 w-10 rounded-lg text-lg flex items-center justify-center border-2 transition-all",
                      selectedIcon === icon
                        ? "border-primary bg-primary/10 scale-110"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWalletDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateWallet}>
              Crear Billetera
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
