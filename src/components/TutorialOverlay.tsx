import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
      const tooltipWidth = 360;
      const tooltipHeight = 200;
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
    
    // Recalculate on resize
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
                  rx="8"
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
            fill="rgba(0, 0, 0, 0.75)"
            mask="url(#tutorial-mask)"
          />
        </svg>
      </div>

      {/* Highlight border around target */}
      {highlightedElement && (
        <div
          className="fixed z-[9999] pointer-events-none rounded-lg border-2 border-primary shadow-lg animate-pulse"
          style={{
            top: highlightedElement.getBoundingClientRect().top - 8,
            left: highlightedElement.getBoundingClientRect().left - 8,
            width: highlightedElement.getBoundingClientRect().width + 16,
            height: highlightedElement.getBoundingClientRect().height + 16,
          }}
        />
      )}

      {/* Tooltip card */}
      {tooltipPosition && (
        <Card
          ref={tooltipRef}
          className={cn(
            "fixed z-[10000] w-[360px] shadow-2xl border-primary/20 animate-in fade-in zoom-in duration-300",
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
                <Lightbulb className="h-5 w-5 text-warning" />
                <CardTitle className="text-lg">{currentStepData.title}</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={skipTutorial}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>
              Paso {currentStep + 1} de {totalSteps}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground leading-relaxed">
              {currentStepData.content}
            </p>
          </CardContent>
          <CardFooter className="flex justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={skipTutorial}
            >
              Omitir
            </Button>
            <Button
              size="sm"
              onClick={nextStep}
            >
              {currentStep === totalSteps - 1 ? "Finalizar" : "Siguiente"}
              {currentStep < totalSteps - 1 && <ChevronRight className="h-4 w-4 ml-1" />}
            </Button>
          </CardFooter>
        </Card>
      )}
    </>,
    document.body
  );
}
