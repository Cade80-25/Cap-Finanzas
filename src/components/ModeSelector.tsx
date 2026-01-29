import { useLicense, LicenseMode } from "@/hooks/useLicense";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Wallet, BookOpen, ChevronDown, Lock, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModeSelectorProps {
  onPurchaseClick?: () => void;
  compact?: boolean;
}

export function ModeSelector({ onPurchaseClick, compact = false }: ModeSelectorProps) {
  const { mode, setMode, isModeAvailable, status, trialInfo } = useLicense();

  const modes = [
    {
      id: "simple" as LicenseMode,
      name: "Finanzas Simples",
      fullName: "Finanzas Personales Simples",
      description: "Control básico de ingresos y gastos",
      icon: Wallet,
    },
    {
      id: "traditional" as LicenseMode,
      name: "Contabilidad",
      fullName: "Contabilidad Tradicional",
      description: "Sistema completo de partida doble",
      icon: BookOpen,
    },
  ];

  const currentMode = modes.find((m) => m.id === mode) || modes[0];
  const CurrentIcon = currentMode.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size={compact ? "sm" : "default"}
          className={cn(
            "gap-2",
            compact && "h-8 px-2"
          )}
        >
          <CurrentIcon className={cn("h-4 w-4", compact && "h-3 w-3")} />
          <span className={cn(compact && "hidden sm:inline")}>
            {compact ? currentMode.name : currentMode.fullName}
          </span>
          <ChevronDown className={cn("h-4 w-4 opacity-50", compact && "h-3 w-3")} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Modo de Operación</span>
          {status === "trial" && (
            <Badge variant="secondary" className="text-xs">
              Prueba: {trialInfo.daysRemaining}d
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {modes.map((modeOption) => {
          const Icon = modeOption.icon;
          const isAvailable = isModeAvailable(modeOption.id);
          const isActive = mode === modeOption.id;

          return (
            <DropdownMenuItem
              key={modeOption.id}
              onClick={() => isAvailable && setMode(modeOption.id)}
              className={cn(
                "flex items-start gap-3 p-3 cursor-pointer",
                !isAvailable && "opacity-50 cursor-not-allowed"
              )}
              disabled={!isAvailable}
            >
              <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{modeOption.fullName}</span>
                  {isActive && <Check className="h-4 w-4 text-primary" />}
                  {!isAvailable && <Lock className="h-3 w-3" />}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {modeOption.description}
                </p>
              </div>
            </DropdownMenuItem>
          );
        })}

        {status === "expired" && onPurchaseClick && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={onPurchaseClick}
              className="text-primary font-medium"
            >
              Adquirir licencia
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
