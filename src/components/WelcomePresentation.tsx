import { useState } from "react";
import { 
  ChevronLeft, ChevronRight, X, Wallet, TrendingUp, TrendingDown, 
  PiggyBank, BarChart3, BookOpen, Shield, Sparkles, Target, 
  CalendarDays, Globe, ArrowRight, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Slide {
  emoji: string;
  title: string;
  subtitle: string;
  points: { icon: React.ReactNode; text: string }[];
  gradient: string;
  accentColor: string;
}

const slides: Slide[] = [
  {
    emoji: "👋",
    title: "¡Bienvenido a Cap Finanzas!",
    subtitle: "Tu compañero para manejar el dinero de forma fácil y segura",
    points: [
      { icon: <CheckCircle2 className="h-4 w-4 text-success" />, text: "Controla ingresos y gastos sin complicaciones" },
      { icon: <CheckCircle2 className="h-4 w-4 text-success" />, text: "Todo se guarda en tu dispositivo, 100% privado" },
      { icon: <CheckCircle2 className="h-4 w-4 text-success" />, text: "Dos modos: Simple para el día a día o Contabilidad profesional" },
    ],
    gradient: "from-primary/20 via-primary/5 to-transparent",
    accentColor: "text-primary",
  },
  {
    emoji: "📊",
    title: "Panel Principal",
    subtitle: "Tu resumen financiero de un vistazo",
    points: [
      { icon: <Wallet className="h-4 w-4 text-primary" />, text: "Mira tu balance total: cuánto tienes disponible" },
      { icon: <PiggyBank className="h-4 w-4 text-success" />, text: "Revisa tus ahorros acumulados" },
      { icon: <TrendingUp className="h-4 w-4 text-success" />, text: "Resumen semanal con lo que ganaste y gastaste" },
    ],
    gradient: "from-blue-500/20 via-blue-500/5 to-transparent",
    accentColor: "text-blue-500",
  },
  {
    emoji: "💰",
    title: "Registra tus Movimientos",
    subtitle: "Agregar ingresos y gastos es rapidísimo",
    points: [
      { icon: <TrendingUp className="h-4 w-4 text-success" />, text: "Ingreso: salario, ventas, regalos, freelance..." },
      { icon: <TrendingDown className="h-4 w-4 text-destructive" />, text: "Gasto: comida, transporte, servicios, compras..." },
      { icon: <Sparkles className="h-4 w-4 text-primary" />, text: "La app clasifica automáticamente por categoría" },
    ],
    gradient: "from-success/20 via-success/5 to-transparent",
    accentColor: "text-success",
  },
  {
    emoji: "🎯",
    title: "Presupuestos",
    subtitle: "Pon límites a tus gastos y no te pases",
    points: [
      { icon: <Target className="h-4 w-4 text-warning" />, text: "Define cuánto quieres gastar por categoría" },
      { icon: <BarChart3 className="h-4 w-4 text-primary" />, text: "Ve el progreso con barras visuales" },
      { icon: <CheckCircle2 className="h-4 w-4 text-destructive" />, text: "Recibe alertas si te pasas del límite" },
    ],
    gradient: "from-warning/20 via-warning/5 to-transparent",
    accentColor: "text-warning",
  },
  {
    emoji: "📈",
    title: "Resumen y Gráficos",
    subtitle: "Entiende tus finanzas con gráficos claros",
    points: [
      { icon: <BarChart3 className="h-4 w-4 text-primary" />, text: "Gráficos de ingresos vs gastos por mes" },
      { icon: <CalendarDays className="h-4 w-4 text-primary" />, text: "Historial completo de todos tus movimientos" },
      { icon: <Globe className="h-4 w-4 text-primary" />, text: "Exporta tus datos a Excel cuando quieras" },
    ],
    gradient: "from-violet-500/20 via-violet-500/5 to-transparent",
    accentColor: "text-violet-500",
  },
  {
    emoji: "🤖",
    title: "Recomendaciones con IA",
    subtitle: "Consejos personalizados para mejorar tus finanzas",
    points: [
      { icon: <Sparkles className="h-4 w-4 text-primary" />, text: "Analiza tus hábitos y sugiere mejoras" },
      { icon: <BookOpen className="h-4 w-4 text-primary" />, text: "Enciclopedia financiera para aprender conceptos" },
      { icon: <Shield className="h-4 w-4 text-success" />, text: "Todo procesado de forma privada y segura" },
    ],
    gradient: "from-pink-500/20 via-pink-500/5 to-transparent",
    accentColor: "text-pink-500",
  },
  {
    emoji: "🚀",
    title: "¡Listo para empezar!",
    subtitle: "Registra tu primer movimiento y toma el control",
    points: [
      { icon: <ArrowRight className="h-4 w-4 text-primary" />, text: "Paso 1: Crea una billetera (ej: Efectivo, Banco)" },
      { icon: <ArrowRight className="h-4 w-4 text-success" />, text: "Paso 2: Registra tu primer ingreso o gasto" },
      { icon: <ArrowRight className="h-4 w-4 text-warning" />, text: "Paso 3: Define un presupuesto mensual" },
    ],
    gradient: "from-primary/20 via-success/5 to-transparent",
    accentColor: "text-primary",
  },
];

interface WelcomePresentationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WelcomePresentation({ open, onOpenChange }: WelcomePresentationProps) {
  const [current, setCurrent] = useState(0);
  const slide = slides[current];
  const isLast = current === slides.length - 1;
  const isFirst = current === 0;

  const handleClose = () => {
    setCurrent(0);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0 border-0">
        {/* Header gradient */}
        <div className={cn("relative px-6 pt-8 pb-6 bg-gradient-to-br", slide.gradient)}>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 h-8 w-8 rounded-full"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="text-center space-y-2">
            <span className="text-5xl block animate-in zoom-in duration-300" key={`emoji-${current}`}>
              {slide.emoji}
            </span>
            <h2 className="text-xl font-bold animate-in fade-in slide-in-from-bottom-2 duration-300" key={`title-${current}`}>
              {slide.title}
            </h2>
            <p className="text-sm text-muted-foreground animate-in fade-in slide-in-from-bottom-2 duration-300" key={`sub-${current}`}>
              {slide.subtitle}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-3" key={`content-${current}`}>
          {slide.points.map((point, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 border border-border/50 animate-in slide-in-from-right duration-300"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {point.icon}
              <p className="text-sm">{point.text}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 space-y-4">
          {/* Progress dots */}
          <div className="flex justify-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  i === current ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex gap-2">
            {!isFirst && (
              <Button variant="outline" className="flex-1" onClick={() => setCurrent(current - 1)}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
            )}
            {isFirst && (
              <Button variant="outline" className="flex-1" onClick={handleClose}>
                Omitir
              </Button>
            )}
            {!isLast ? (
              <Button className="flex-1 bg-gradient-primary" onClick={() => setCurrent(current + 1)}>
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button className="flex-1 bg-gradient-primary" onClick={handleClose}>
                ¡Empezar!
                <Sparkles className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
