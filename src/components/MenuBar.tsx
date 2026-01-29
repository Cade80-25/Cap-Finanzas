import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar";
import {
  Download,
  Upload,
  Settings,
  FileText,
  HelpCircle,
  Info,
  Keyboard,
  Search,
  PanelLeft,
  PanelLeftClose,
  Bell,
  Book,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotifications";

interface MenuBarProps {
  onSearchClick?: () => void;
  onToggleSidebar?: () => void;
  sidebarVisible?: boolean;
}

export default function MenuBar({ onSearchClick, onToggleSidebar, sidebarVisible }: MenuBarProps) {
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const isElectron =
    typeof window !== "undefined" && typeof (window as any).electron !== "undefined";
  const [nativeMenuVisible, setNativeMenuVisible] = useState(false);

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

  const handleNativeMenuToggle = (visible: boolean) => {
    setNativeMenuVisible(visible);
    try {
      (window as any).electron?.setNativeMenuVisible?.(visible);
    } catch {
      // ignore
    }
  };

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-3 h-12">
      {/* Left section: Toggle + Menu */}
      <div className="flex items-center">
        {/* Botón para mostrar/ocultar sidebar */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="mr-2 h-9 w-9"
          title={sidebarVisible ? "Ocultar panel lateral" : "Mostrar panel lateral"}
        >
          {sidebarVisible ? (
            <PanelLeftClose className="h-5 w-5" />
          ) : (
            <PanelLeft className="h-5 w-5" />
          )}
        </Button>

        <Menubar className="rounded-none border-0 bg-transparent">
          <MenubarMenu>
            <MenubarTrigger>Archivo</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={() => navigate("/libro-diario")}>
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
              <MenubarItem onClick={() => navigate("/")}>Panel Principal</MenubarItem>
              <MenubarItem onClick={() => navigate("/transacciones")}>Transacciones</MenubarItem>
              <MenubarItem onClick={() => navigate("/resumen")}>Resumen</MenubarItem>
              <MenubarSeparator />

              {isElectron && (
                <>
                  <MenubarCheckboxItem
                    checked={nativeMenuVisible}
                    onCheckedChange={handleNativeMenuToggle}
                  >
                    Mostrar menú del sistema
                  </MenubarCheckboxItem>
                  <MenubarSeparator />
                </>
              )}

              <MenubarItem onClick={() => navigate("/libro-diario")}>Libro Diario</MenubarItem>
              <MenubarItem onClick={() => navigate("/libro-mayor")}>Libro Mayor</MenubarItem>
              <MenubarItem onClick={() => navigate("/balance")}>Balance General</MenubarItem>
              <MenubarItem onClick={() => navigate("/resultados")}>Estado de Resultados</MenubarItem>
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
              <MenubarItem onClick={() => navigate("/manual")}>
                <Book className="mr-2 h-4 w-4" />
                Manual de Usuario
              </MenubarItem>
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
      </div>

      {/* Center section: Spacer */}
      <div className="flex-1" />
    
      {/* Right section: Search + Notifications */}
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
        
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8"
          onClick={() => navigate("/notificaciones")}
          title="Notificaciones"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-medium px-1">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
