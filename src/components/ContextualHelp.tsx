import { useState } from "react";
import { Lightbulb, X, ChevronDown, ChevronUp, EyeOff } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useHelpPreferences } from "@/hooks/useHelpPreferences";
import { cn } from "@/lib/utils";

type ContextualHelpProps = {
  id: string;
  title: string;
  children: React.ReactNode;
  variant?: "info" | "tip" | "warning";
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  className?: string;
};

export function ContextualHelp({
  id,
  title,
  children,
  variant = "tip",
  collapsible = true,
  defaultCollapsed = false,
  className,
}: ContextualHelpProps) {
  const { showContextualHelp, isHintDismissed, dismissHint } = useHelpPreferences();
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  // Don't show if help is disabled or this specific hint was dismissed
  if (!showContextualHelp || isHintDismissed(id)) {
    return null;
  }

  const variantStyles = {
    info: "border-primary/30 bg-primary/5",
    tip: "border-warning/30 bg-warning/5",
    warning: "border-destructive/30 bg-destructive/5",
  };

  const iconStyles = {
    info: "text-primary",
    tip: "text-warning",
    warning: "text-destructive",
  };

  return (
    <Alert className={cn(variantStyles[variant], "relative", className)}>
      <div className="flex items-start gap-3">
        <Lightbulb className={cn("h-5 w-5 mt-0.5 flex-shrink-0", iconStyles[variant])} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <AlertTitle className="mb-0 flex items-center gap-2">
              {title}
              {collapsible && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                >
                  {isCollapsed ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </Button>
              )}
            </AlertTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => dismissHint(id)}
              title="No mostrar de nuevo"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {!isCollapsed && (
            <AlertDescription className="mt-2 text-sm">
              {children}
            </AlertDescription>
          )}
        </div>
      </div>
    </Alert>
  );
}

type EmptyStateHelpProps = {
  title: string;
  description: string;
  tips?: string[];
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
};

export function EmptyStateHelp({
  title,
  description,
  tips,
  actionLabel,
  onAction,
  icon,
}: EmptyStateHelpProps) {
  const { showEmptyStateHelp, disableAllHelp } = useHelpPreferences();

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && <div className="mb-4 opacity-50">{icon}</div>}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4 max-w-md">{description}</p>
      
      {showEmptyStateHelp && tips && tips.length > 0 && (
        <div className="bg-muted/50 rounded-lg p-4 mb-4 max-w-lg text-left">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="h-4 w-4 text-warning" />
            <span className="font-medium text-sm">Consejos para empezar:</span>
          </div>
          <ul className="text-sm text-muted-foreground space-y-1">
            {tips.map((tip, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        {actionLabel && onAction && (
          <Button onClick={onAction}>{actionLabel}</Button>
        )}
        {showEmptyStateHelp && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={disableAllHelp}
          >
            <EyeOff className="h-4 w-4 mr-2" />
            Ya sé usar el programa
          </Button>
        )}
      </div>
    </div>
  );
}

// Account selection helper component
type AccountHelpProps = {
  className?: string;
};

export function AccountSelectionHelp({ className }: AccountHelpProps) {
  const { showContextualHelp, isHintDismissed, dismissHint } = useHelpPreferences();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!showContextualHelp || isHintDismissed("account-selection-help")) {
    return null;
  }

  return (
    <div className={cn("rounded-lg border bg-muted/30 p-3", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-warning" />
          <span className="text-sm font-medium">¿Qué cuenta debo usar?</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Ocultar" : "Ver guía"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => dismissHint("account-selection-help")}
            title="No mostrar de nuevo"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 space-y-3 text-sm">
          <div className="grid gap-2">
            <div className="p-2 rounded bg-success/10 border border-success/20">
              <p className="font-medium text-success">💵 Para registrar INGRESOS:</p>
              <p className="text-muted-foreground text-xs mt-1">
                Usa la cuenta <strong>"Ingresos"</strong> con un valor en <strong>Haber (crédito)</strong>
              </p>
              <p className="text-xs text-muted-foreground/80 mt-1">
                Ejemplo: Salario, ventas, cobros, intereses ganados
              </p>
            </div>

            <div className="p-2 rounded bg-destructive/10 border border-destructive/20">
              <p className="font-medium text-destructive">🏢 Para registrar GASTOS:</p>
              <p className="text-muted-foreground text-xs mt-1">
                Usa <strong>"Gastos Operativos"</strong>, <strong>"Gastos Financieros"</strong> o <strong>"Costo de Ventas"</strong> con un valor en <strong>Debe (débito)</strong>
              </p>
              <p className="text-xs text-muted-foreground/80 mt-1">
                Ejemplo: Alquiler, servicios, compras, intereses pagados
              </p>
            </div>

            <div className="p-2 rounded bg-primary/10 border border-primary/20">
              <p className="font-medium text-primary">🏦 Para registrar movimientos de DINERO:</p>
              <p className="text-muted-foreground text-xs mt-1">
                Usa <strong>"Banco"</strong> o <strong>"Caja"</strong>. Debe = entrada de dinero, Haber = salida
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground italic">
            💡 Solo las cuentas de Ingresos y Gastos aparecen en el Estado de Resultados y Resumen Financiero
          </p>
        </div>
      )}
    </div>
  );
}
