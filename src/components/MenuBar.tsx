import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { Download, Upload, Settings, FileText, HelpCircle, Info, Keyboard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function MenuBar() {
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
    <Menubar className="border-b rounded-none bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
            Acerca de FinanzApp
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}
