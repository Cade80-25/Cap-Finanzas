import { useNavigate } from "react-router-dom";
import { CheckCircle2, Circle, X, ChevronRight, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useOnboardingProgress } from "@/hooks/useOnboardingProgress";
import { cn } from "@/lib/utils";

export function OnboardingChecklist() {
  const navigate = useNavigate();
  const { steps, completedCount, totalSteps, progress, dismissed, dismiss } = useOnboardingProgress();

  if (dismissed) return null;

  return (
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
            onClick={() => !step.completed && navigate(step.route)}
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
  );
}
