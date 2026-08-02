import { HelpCircle, CheckCircle2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTutorial } from "@/hooks/useTutorial";
import { useHelpPreferences } from "@/hooks/useHelpPreferences";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { HelpSettingsDialog } from "@/components/HelpSettingsDialog";

const ROUTE_TO_SECTION: Record<string, string> = {
  "/": "dashboard",
  "/transacciones": "transacciones",
  "/calendario": "calendario",
  "/presupuesto": "presupuesto",
  "/monedas": "monedas",
  "/categorias": "categorias",
  "/resumen": "resumen",
  "/libro-diario": "libro-diario",
  "/libro-mayor": "libro-mayor",
  "/balance": "balance",
  "/estado-resultados": "estado-resultados",
  "/resultados": "estado-resultados",
  "/recomendaciones": "recomendaciones",
  "/notificaciones": "notificaciones",
  "/configuracion": "configuracion",
};

export function TutorialButton() {
  const location = useLocation();
  const navigate = useNavigate();
  const { startTutorial, allSections, isSectionCompleted, resetTutorial } = useTutorial();
  const { showContextualHelp, toggleContextualHelp } = useHelpPreferences();

  const currentSectionId = ROUTE_TO_SECTION[location.pathname];
  const currentSection = allSections.find((s) => s.id === currentSectionId);

  const handleStartCurrentSection = () => {
    if (currentSectionId) {
      startTutorial(currentSectionId);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          title="Ayuda y tutoriales"
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4" />
          Tutoriales de Ayuda
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {currentSection && (
          <>
            <DropdownMenuItem
              onClick={handleStartCurrentSection}
              className="cursor-pointer"
            >
              <div className="flex items-center justify-between w-full">
                <span>📍 Aprender esta sección</span>
                {isSectionCompleted(currentSectionId) && (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                )}
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Todas las secciones
        </DropdownMenuLabel>

        {allSections.map((section) => (
          <DropdownMenuItem
            key={section.id}
            onClick={() => startTutorial(section.id)}
            className={cn(
              "cursor-pointer flex items-center justify-between",
              isSectionCompleted(section.id) && "text-muted-foreground"
            )}
          >
            <span>{section.name}</span>
            {isSectionCompleted(section.id) && (
              <CheckCircle2 className="h-4 w-4 text-success" />
            )}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={toggleContextualHelp}
          className="cursor-pointer"
        >
          {showContextualHelp ? "🙈 Ocultar ayudas contextuales" : "👁️ Mostrar ayudas contextuales"}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={resetTutorial}
          className="cursor-pointer text-muted-foreground"
        >
          🔄 Reiniciar todos los tutoriales
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild className="p-0">
          <div className="w-full">
            <HelpSettingsDialog />
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
