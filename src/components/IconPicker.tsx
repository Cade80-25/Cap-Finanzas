import { useState } from "react";
import { Search } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ICON_LIBRARY, ICON_GROUPS, NAME_ICON_MAP, searchIcons, type IconLibraryEntry } from "@/lib/icon-library";

interface IconPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** name actual (p.ej. "utensils") para marcar el seleccionado. */
  value?: string;
  /** Recibe el name de lucide elegido (se guarda en la categoria). */
  onSelect: (name: string) => void;
}

/**
 * Biblioteca visual de iconos para categorias/subcategorias: busca en espanol,
 * filtra por grupo y elige con un clic. Reemplaza escribir un emoji a mano
 * (que renderiza inconsistente/corrupto en Electron/Windows).
 */
export function IconPicker({ open, onOpenChange, value, onSelect }: IconPickerProps) {
  const [query, setQuery] = useState("");
  const [grupo, setGrupo] = useState("Todos");

  const resultados: IconLibraryEntry[] = searchIcons(query, grupo);
  const seleccionado = value ? NAME_ICON_MAP[value] : undefined;

  const elegir = (name: string) => {
    onSelect(name);
    onOpenChange(false);
    setQuery("");
    setGrupo("Todos");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Elegí un ícono</DialogTitle>
          <DialogDescription>
            {ICON_LIBRARY.length} íconos con búsqueda en español. El ícono se guarda como vector (SVG), nítido en cualquier pantalla.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar: comida, auto, banco, salud..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="pl-8"
              autoFocus
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {ICON_GROUPS.map(g => (
              <Button
                key={g}
                type="button"
                variant={grupo === g ? "default" : "outline"}
                size="sm"
                className="h-7 px-2.5 text-xs"
                onClick={() => setGrupo(g)}
              >
                {g}
              </Button>
            ))}
          </div>

          <ScrollArea className="h-[300px] border rounded-md">
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-1 p-2">
              {resultados.map(e => {
                const IconComp = e.Component;
                const activo = value === e.name;
                return (
                  <button
                    key={e.name}
                    type="button"
                    title={`${e.label} (${e.grupo})`}
                    onClick={() => elegir(e.name)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 rounded-md p-2 cursor-pointer transition-colors",
                      activo ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    )}
                  >
                    <IconComp className="h-5 w-5" aria-hidden="true" />
                    <span className="text-[10px] leading-tight text-center line-clamp-2 w-full">
                      {e.label}
                    </span>
                  </button>
                );
              })}
            </div>
            {resultados.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-6">
                No se encontró ningún ícono con «{query}»
              </p>
            )}
          </ScrollArea>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {seleccionado ? "Ícono actual marcado en la grilla." : "Sin ícono elegido todavía."}
            </span>
            <span>{resultados.length} resultados</span>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Label className="sr-only">Icono</Label>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default IconPicker;
