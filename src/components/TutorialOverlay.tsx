import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight, Lightbulb, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useTutorial } from "@/hooks/useTutorial";
import { cn } from "@/lib/utils";

type TooltipPosition = {
  top: number;
  left: number;
  arrowPosition: "top" | "bottom" | "left" | "right";
};

export function TutorialOverlay() {
  const {
    isActive,
    currentStep,
    currentStepData,
    highlightedElement,
    totalSteps,
    currentSection,
    nextStep,
    prevStep,
    skipTutorial,
  } = useTutorial();

  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Calculate tooltip position based on target element
  useEffect(() => {
    if (!highlightedElement || !currentStepData) {
      setTooltipPosition(null);
      return;
    }

    const calculatePosition = () => {
      const rect = highlightedElement.getBoundingClientRect();
      const tooltipWidth = 380;
      const tooltipHeight = 240;
      const padding = 16;
      const arrowSize = 12;

      let top = 0;
      let left = 0;
      let arrowPosition: "top" | "bottom" | "left" | "right" = "top";

      const placement = currentStepData.placement || "bottom";

      switch (placement) {
        case "top":
          top = rect.top - tooltipHeight - arrowSize - padding;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          arrowPosition = "bottom";
          break;
        case "bottom":
          top = rect.bottom + arrowSize + padding;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          arrowPosition = "top";
          break;
        case "left":
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.left - tooltipWidth - arrowSize - padding;
          arrowPosition = "right";
          break;
        case "right":
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.right + arrowSize + padding;
          arrowPosition = "left";
          break;
      }

      // Keep tooltip within viewport
      if (left < padding) left = padding;
      if (left + tooltipWidth > window.innerWidth - padding) {
        left = window.innerWidth - tooltipWidth - padding;
      }
      if (top < padding) top = rect.bottom + arrowSize + padding;
      if (top + tooltipHeight > window.innerHeight - padding) {
        top = rect.top - tooltipHeight - arrowSize - padding;
      }

      setTooltipPosition({ top, left, arrowPosition });
    };

    calculatePosition();
    
    window.addEventListener("resize", calculatePosition);
    window.addEventListener("scroll", calculatePosition, true);

    return () => {
      window.removeEventListener("resize", calculatePosition);
      window.removeEventListener("scroll", calculatePosition, true);
    };
  }, [highlightedElement, currentStepData]);

  // Scroll element into view
  useEffect(() => {
    if (highlightedElement) {
      highlightedElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [highlightedElement]);

  if (!isActive || !currentStepData) return null;

  const progressPercent = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;

  const arrowClasses = {
    top: "before:absolute before:-top-2 before:left-1/2 before:-translate-x-1/2 before:border-8 before:border-transparent before:border-b-card",
    bottom: "before:absolute before:-bottom-2 before:left-1/2 before:-translate-x-1/2 before:border-8 before:border-transparent before:border-t-card",
    left: "before:absolute before:top-1/2 before:-left-2 before:-translate-y-1/2 before:border-8 before:border-transparent before:border-r-card",
    right: "before:absolute before:top-1/2 before:-right-2 before:-translate-y-1/2 before:border-8 before:border-transparent before:border-l-card",
  };

  return createPortal(
    <>
      {/* Dark overlay with hole for highlighted element */}
      <div className="fixed inset-0 z-[9998] pointer-events-none">
        <svg className="w-full h-full">
          <defs>
            <mask id="tutorial-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {highlightedElement && (
                <rect
                  x={highlightedElement.getBoundingClientRect().left - 8}
                  y={highlightedElement.getBoundingClientRect().top - 8}
                  width={highlightedElement.getBoundingClientRect().width + 16}
                  height={highlightedElement.getBoundingClientRect().height + 16}
                  rx="12"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.7)"
            mask="url(#tutorial-mask)"
          />
        </svg>
      </div>

      {/* Highlight border around target */}
      {highlightedElement && (
        <div
          className="fixed z-[9999] pointer-events-none rounded-xl ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg"
          style={{
            top: highlightedElement.getBoundingClientRect().top - 8,
            left: highlightedElement.getBoundingClientRect().left - 8,
            width: highlightedElement.getBoundingClientRect().width + 16,
            height: highlightedElement.getBoundingClientRect().height + 16,
            boxShadow: '0 0 0 4px hsl(var(--primary) / 0.2), 0 0 20px hsl(var(--primary) / 0.15)',
          }}
        />
      )}

      {/* Tooltip card */}
      {tooltipPosition && (
        <Card
          ref={tooltipRef}
          className={cn(
            "fixed z-[10000] w-[380px] shadow-2xl border-primary/30 animate-in fade-in zoom-in duration-300",
            arrowClasses[tooltipPosition.arrowPosition]
          )}
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
          }}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-base">{currentStepData.title}</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full hover:bg-destructive/10 hover:text-destructive"
                onClick={skipTutorial}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {/* Progress bar */}
            <div className="space-y-1 pt-1">
              <Progress value={progressPercent} className="h-1.5" />
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs">
                  {currentSection?.name}
                </CardDescription>
                <span className="text-xs text-muted-foreground font-medium">
                  {currentStep + 1}/{totalSteps}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-3">
            <p className="text-sm text-foreground leading-relaxed">
              {currentStepData.content}
            </p>
            {currentStepData.tip && (
              <div className="mt-3 p-2.5 rounded-lg bg-warning/10 border border-warning/20">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                  <p className="text-xs text-foreground/80">{currentStepData.tip}</p>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between pt-0 pb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="text-muted-foreground"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={skipTutorial}
              className="text-muted-foreground hover:text-destructive"
            >
              Omitir
            </Button>
            <Button
              size="sm"
              onClick={nextStep}
              className="bg-gradient-primary"
            >
              {currentStep === totalSteps - 1 ? "¡Listo!" : "Siguiente"}
              {currentStep < totalSteps - 1 && <ChevronRight className="h-4 w-4 ml-1" />}
            </Button>
          </CardFooter>
        </Card>
      )}
    </>,
    document.body
  );
}
