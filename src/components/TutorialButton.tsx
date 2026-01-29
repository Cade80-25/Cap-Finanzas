import { HelpCircle, CheckCircle2 } from "lucide-react";
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
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const ROUTE_TO_SECTION: Record<string, string> = {
  "/": "dashboard",
  "/libro-diario": "libro-diario",
  "/libro-mayor": "libro-mayor",
  "/balance": "balance",
  "/estado-resultados": "estado-resultados",
  "/resumen": "resumen",
  "/presupuesto": "presupuesto",
};

export function TutorialButton() {
  const location = useLocation();
  const { startTutorial, allSections, isSectionCompleted, resetTutorial } = useTutorial();

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
          onClick={resetTutorial}
          className="cursor-pointer text-muted-foreground"
        >
          🔄 Reiniciar todos los tutoriales
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
