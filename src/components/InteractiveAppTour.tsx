import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, X, Sparkles, MapPin,
  MousePointerClick, Eye, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useLocalStorage } from "@/hooks/useLocalStorage";

type TourStep = {
  route: string;
  target?: string; // CSS selector to highlight
  title: string;
  description: string;
  action?: string; // instruction like "Haz clic aquí para..."
  emoji: string;
  position?: "top" | "bottom" | "left" | "right" | "center";
  delay?: number; // extra delay for page transitions
};

const TOUR_STEPS: TourStep[] = [
  {
    route: "/",
    title: "¡Bienvenido a tu tour guiado! 🎉",
    description: "Te voy a enseñar cómo moverte por la aplicación paso a paso. ¡Es muy fácil! Haz clic en 'Siguiente' para empezar.",
    emoji: "👋",
    position: "center",
  },
  {
    route: "/",
    target: "[data-tutorial='dashboard-title']",
    title: "Este es tu Panel Principal",
    description: "Aquí ves el resumen de tus finanzas de un vistazo. Es tu punto de partida cada vez que abras la app.",
    emoji: "🏠",
    position: "bottom",
  },
  {
    route: "/",
    target: "[data-tutorial='dashboard-stats']",
    title: "Tus números importantes",
    description: "Balance Total y Ahorros: los dos números que más importan. Se actualizan automáticamente con cada movimiento que registres.",
    action: "Estos datos se llenan solos cuando registres ingresos y gastos.",
    emoji: "💰",
    position: "bottom",
  },
  {
    route: "/transacciones",
    target: "[data-tutorial='transacciones-title']",
    title: "Aquí registras tus movimientos",
    description: "Ingresos, gastos, transferencias... todo se registra aquí. Es el corazón de la app.",
    action: "Usa los botones de arriba para agregar un ingreso o gasto rápidamente.",
    emoji: "💸",
    position: "bottom",
    delay: 400,
  },
  {
    route: "/presupuesto",
    target: "[data-tutorial='presupuesto-title']",
    title: "Controla tus gastos con presupuestos",
    description: "Define cuánto quieres gastar por categoría al mes. La app te avisa si te estás pasando.",
    action: "Crea tu primer presupuesto para empezar a controlar tus gastos.",
    emoji: "🎯",
    position: "bottom",
    delay: 400,
  },
  {
    route: "/resumen",
    target: "[data-tutorial='resumen-title']",
    title: "Gráficos y estadísticas",
    description: "Aquí ves tus finanzas en gráficos: ingresos vs gastos, tendencias por mes y distribución por categorías.",
    action: "Vuelve aquí después de registrar algunos movimientos para ver tus gráficos.",
    emoji: "📊",
    position: "bottom",
    delay: 400,
  },
  {
    route: "/recomendaciones",
    target: "[data-tutorial='recomendaciones-title']",
    title: "Consejos personalizados con IA",
    description: "La inteligencia artificial analiza tus finanzas y te da sugerencias para ahorrar más y gastar mejor.",
    action: "También puedes hacerle preguntas sobre finanzas personales.",
    emoji: "🤖",
    position: "bottom",
    delay: 400,
  },
  {
    route: "/configuracion",
    target: "[data-tutorial='configuracion-title']",
    title: "Personaliza tu experiencia",
    description: "Cambia el tema (claro/oscuro), formato de números, idioma de moneda, seguridad y más.",
    emoji: "⚙️",
    position: "bottom",
    delay: 400,
  },
  {
    route: "/",
    title: "¡Listo! Ya sabes lo básico 🚀",
    description: "Ahora registra tu primer movimiento y empieza a tomar el control de tus finanzas. Puedes repetir este tour cuando quieras desde el botón '¿Cómo funciona?'.",
    emoji: "🎓",
    position: "center",
    delay: 400,
  },
];

interface InteractiveAppTourProps {
  active: boolean;
  onClose: () => void;
}

export function InteractiveAppTour({ active, onClose }: InteractiveAppTourProps) {
  const [step, setStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const tooltipRef = useRef<HTMLDivElement>(null);

  const currentStep = TOUR_STEPS[step];
  const totalSteps = TOUR_STEPS.length;
  const progress = ((step + 1) / totalSteps) * 100;

  // Navigate to the step's route and find target
  useEffect(() => {
    if (!active || !currentStep) return;

    setReady(false);
    setHighlightRect(null);

    // Navigate if needed
    if (location.pathname !== currentStep.route) {
      navigate(currentStep.route);
    }

    const delay = currentStep.delay || 200;
    const timer = setTimeout(() => {
      if (currentStep.target) {
        const el = document.querySelector(currentStep.target) as HTMLElement;
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          // Wait for scroll
          setTimeout(() => {
            setHighlightRect(el.getBoundingClientRect());
            setReady(true);
          }, 300);
        } else {
          setReady(true);
        }
      } else {
        setReady(true);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [active, step, currentStep, navigate, location.pathname]);

  // Update rect on scroll/resize
  useEffect(() => {
    if (!active || !currentStep?.target || !ready) return;

    const update = () => {
      const el = document.querySelector(currentStep.target!) as HTMLElement;
      if (el) setHighlightRect(el.getBoundingClientRect());
    };

    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [active, currentStep, ready]);

  const handleNext = useCallback(() => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      handleClose();
    }
  }, [step, totalSteps]);

  const handlePrev = useCallback(() => {
    if (step > 0) setStep(step - 1);
  }, [step]);

  const handleClose = useCallback(() => {
    setStep(0);
    setHighlightRect(null);
    navigate("/");
    onClose();
  }, [navigate, onClose]);

  if (!active) return null;

  const isCentered = currentStep.position === "center" || !currentStep.target;

  // Calculate tooltip position
  let tooltipStyle: React.CSSProperties = {};
  if (isCentered) {
    tooltipStyle = {
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
    };
  } else if (highlightRect) {
    const padding = 16;
    const pos = currentStep.position || "bottom";
    switch (pos) {
      case "bottom":
        tooltipStyle = {
          top: highlightRect.bottom + padding,
          left: Math.max(padding, Math.min(highlightRect.left + highlightRect.width / 2 - 190, window.innerWidth - 396)),
        };
        break;
      case "top":
        tooltipStyle = {
          bottom: window.innerHeight - highlightRect.top + padding,
          left: Math.max(padding, Math.min(highlightRect.left + highlightRect.width / 2 - 190, window.innerWidth - 396)),
        };
        break;
      case "left":
        tooltipStyle = {
          top: highlightRect.top + highlightRect.height / 2 - 100,
          right: window.innerWidth - highlightRect.left + padding,
        };
        break;
      case "right":
        tooltipStyle = {
          top: highlightRect.top + highlightRect.height / 2 - 100,
          left: highlightRect.right + padding,
        };
        break;
    }
  }

  return createPortal(
    <div className={cn("fixed inset-0 z-[9998] transition-opacity duration-300", ready ? "opacity-100" : "opacity-0")}>
      {/* Overlay */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <mask id="tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {highlightRect && (
              <rect
                x={highlightRect.left - 8}
                y={highlightRect.top - 8}
                width={highlightRect.width + 16}
                height={highlightRect.height + 16}
                rx="12"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0" y="0" width="100%" height="100%"
          fill="rgba(0, 0, 0, 0.75)"
          mask="url(#tour-mask)"
          className="pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        />
      </svg>

      {/* Highlight ring */}
      {highlightRect && (
        <div
          className="absolute z-[9999] pointer-events-none rounded-xl animate-pulse"
          style={{
            top: highlightRect.top - 8,
            left: highlightRect.left - 8,
            width: highlightRect.width + 16,
            height: highlightRect.height + 16,
            boxShadow: '0 0 0 3px hsl(var(--primary)), 0 0 20px hsl(var(--primary) / 0.4)',
          }}
        />
      )}

      {/* Tooltip card */}
      {ready && (
        <Card
          ref={tooltipRef}
          className={cn(
            "fixed z-[10000] w-[380px] max-w-[calc(100vw-32px)] shadow-2xl border-primary/30",
            "animate-in fade-in zoom-in-95 duration-300"
          )}
          style={tooltipStyle}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{currentStep.emoji}</span>
                <div>
                  <CardTitle className="text-base leading-tight">{currentStep.title}</CardTitle>
                  <div className="flex items-center gap-1.5 mt-1">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground font-medium">
                      Paso {step + 1} de {totalSteps}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost" size="icon"
                className="h-7 w-7 rounded-full hover:bg-destructive/10 hover:text-destructive shrink-0"
                onClick={handleClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Progress value={progress} className="h-1.5 mt-2" />
          </CardHeader>

          <CardContent className="pb-3 space-y-2">
            <p className="text-sm leading-relaxed text-foreground">
              {currentStep.description}
            </p>
            {currentStep.action && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10">
                <MousePointerClick className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-foreground/80">{currentStep.action}</p>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between pt-0 pb-3 gap-2">
            <Button
              variant="ghost" size="sm"
              onClick={handlePrev}
              disabled={step === 0}
              className="text-muted-foreground"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
            <Button
              variant="ghost" size="sm"
              onClick={handleClose}
              className="text-muted-foreground hover:text-destructive text-xs"
            >
              Salir del tour
            </Button>
            <Button
              size="sm"
              onClick={handleNext}
              className="bg-gradient-primary"
            >
              {step === totalSteps - 1 ? (
                <>¡Empezar! <Sparkles className="h-4 w-4 ml-1" /></>
              ) : (
                <>Siguiente <ChevronRight className="h-4 w-4 ml-1" /></>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>,
    document.body
  );
}
