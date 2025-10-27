import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { Download, Upload, Settings, FileText, HelpCircle, Info, Keyboard, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MenuBarProps {
  onSearchClick?: () => void;
}

export default function MenuBar({ onSearchClick }: MenuBarProps) {
  const navigate = useNavigate();

  const handleExport = () => {
    toast.success("Exportar datos", {
      description: "Se abrirá el diálogo de exportación...",
    });
    navigate("/configuracion");
  };

  const handleImport = () => {
    toast.success("Importar datos", {
      description: "Selecciona el archivo a importar...",
    });
    navigate("/configuracion");
  };

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-4">
    <Menubar className="rounded-none border-0 bg-transparent">
      <MenubarMenu>
        <MenubarTrigger>Archivo</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={() => navigate("/transacciones")}>
            <FileText className="mr-2 h-4 w-4" />
            Nueva Transacción
            <MenubarShortcut>⌘N</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={handleImport}>
            <Upload className="mr-2 h-4 w-4" />
            Importar Datos
            <MenubarShortcut>⌘O</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Exportar Datos
            <MenubarShortcut>⌘S</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={() => navigate("/configuracion")}>
            <Settings className="mr-2 h-4 w-4" />
            Preferencias
            <MenubarShortcut>⌘,</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger>Vista</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={() => navigate("/")}>
            Panel Principal
          </MenubarItem>
          <MenubarItem onClick={() => navigate("/transacciones")}>
            Transacciones
          </MenubarItem>
          <MenubarItem onClick={() => navigate("/resumen")}>
            Resumen
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={() => navigate("/libro-diario")}>
            Libro Diario
          </MenubarItem>
          <MenubarItem onClick={() => navigate("/libro-mayor")}>
            Libro Mayor
          </MenubarItem>
          <MenubarItem onClick={() => navigate("/balance")}>
            Balance General
          </MenubarItem>
          <MenubarItem onClick={() => navigate("/resultados")}>
            Estado de Resultados
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger>Herramientas</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={() => navigate("/presupuesto")}>
            Gestor de Presupuesto
          </MenubarItem>
          <MenubarItem onClick={() => navigate("/categorias")}>
            Administrar Categorías
          </MenubarItem>
          <MenubarItem onClick={() => navigate("/monedas")}>
            Conversor de Monedas
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={() => navigate("/calendario")}>
            Calendario Financiero
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger>Ayuda</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={() => navigate("/enciclopedia")}>
            <HelpCircle className="mr-2 h-4 w-4" />
            Enciclopedia
          </MenubarItem>
          <MenubarItem>
            <Keyboard className="mr-2 h-4 w-4" />
            Atajos de Teclado
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>
            <Info className="mr-2 h-4 w-4" />
            Acerca de Cap Finanzas
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
    
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onSearchClick}
        className="gap-2"
      >
        <Search className="h-4 w-4" />
        <span className="hidden md:inline">Buscar</span>
        <kbd className="hidden md:inline pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
    </div>
    </div>
  );
}
