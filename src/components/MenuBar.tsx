import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/components/ui/menubar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
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
  Key,
  ShoppingCart,
  Smartphone,
  Monitor,
  Apple,
  Laptop,
  Sun,
  Moon,
  SunMoon,
  Menu,
  Home,
  Receipt,
  Calendar,
  Target,
  Tag,
  PieChart,
  BarChart3,
  TrendingUp,
  Globe,
  Sparkles,
  Layers,
  BookOpen,
  User,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotifications";
import { TutorialButton } from "@/components/TutorialButton";
import { ModeSelector } from "@/components/ModeSelector";
import { PurchaseDialog } from "@/components/PurchaseDialog";
import { ActivationDialog } from "@/components/ActivationDialog";
import { useModeFeatures } from "@/hooks/useModeFeatures";
import { useTheme } from "next-themes";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface MenuBarProps {
  onSearchClick?: () => void;
  onToggleSidebar?: () => void;
  sidebarVisible?: boolean;
}

export default function MenuBar({ onSearchClick, onToggleSidebar, sidebarVisible }: MenuBarProps) {
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const { isSimpleMode, isFeatureAvailable } = useModeFeatures();
  const { setTheme } = useTheme();
  const isMobile = useIsMobile();
  const [themeVariant, setThemeVariant] = useState(() => localStorage.getItem("cap-finanzas-theme-variant") || "light");
  const isElectron =
    typeof window !== "undefined" && typeof (window as any).electron !== "undefined";
  const [nativeMenuVisible, setNativeMenuVisible] = useState(false);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [activationOpen, setActivationOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const applyTheme = (value: string) => {
    setThemeVariant(value);
    localStorage.setItem("cap-finanzas-theme-variant", value);
    if (value === "dim") {
      document.documentElement.setAttribute("data-theme", "dim");
      document.documentElement.classList.remove("dark");
      setTheme("light");
    } else if (value === "dark") {
      document.documentElement.removeAttribute("data-theme");
      setTheme("dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      document.documentElement.classList.remove("dark");
      setTheme("light");
    }
  };

  const addTransactionRoute = isSimpleMode ? "/transacciones" : "/libro-diario";
  const addTransactionLabel = isSimpleMode ? "Nuevo Movimiento" : "Nueva Transacción";

  const handleExport = () => {
    toast.success("Exportar datos", { description: "Se abrirá el diálogo de exportación..." });
    navigate("/configuracion");
  };

  const handleImport = () => {
    toast.success("Importar datos", { description: "Selecciona el archivo a importar..." });
    navigate("/configuracion");
  };

  const handleNativeMenuToggle = (visible: boolean) => {
    setNativeMenuVisible(visible);
    try {
      (window as any).electron?.setNativeMenuVisible?.(visible);
    } catch { /* ignore */ }
  };

  const mobileNavigate = (path: string) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  // Mobile navigation items
  const mobileNavItems = [
    { name: "Panel Principal", href: "/", icon: Home, show: true },
    { name: isSimpleMode ? "Movimientos" : "Transacciones", href: "/transacciones", icon: Receipt, show: true },
    { name: "Calendario", href: "/calendario", icon: Calendar, show: isFeatureAvailable("calendar") },
    { name: "Presupuesto", href: "/presupuesto", icon: Target, show: isFeatureAvailable("budget") },
    { name: "Monedas", href: "/monedas", icon: Globe, show: isFeatureAvailable("currencies") },
    { name: "Categorías", href: "/categorias", icon: Tag, show: isFeatureAvailable("categories") },
    { name: "Resumen", href: "/resumen", icon: PieChart, show: isFeatureAvailable("summary") },
    { name: "Consolidado", href: "/consolidado", icon: Layers, show: isFeatureAvailable("consolidated") },
    { name: "Libro Diario", href: "/libro-diario", icon: BookOpen, show: isFeatureAvailable("journal") },
    { name: "Libro Mayor", href: "/libro-mayor", icon: FileText, show: isFeatureAvailable("ledger") },
    { name: "Balance General", href: "/balance", icon: BarChart3, show: isFeatureAvailable("balance") },
    { name: "Estado de Resultados", href: "/resultados", icon: TrendingUp, show: isFeatureAvailable("incomeStatement") },
    { name: "Recomendaciones", href: "/recomendaciones", icon: Sparkles, show: isFeatureAvailable("recommendations") },
    { name: "Manual", href: "/manual", icon: Book, show: true },
    { name: "Notificaciones", href: "/notificaciones", icon: Bell, show: true },
    { name: "Cuenta", href: "/cuenta", icon: User, show: true },
    { name: "Configuración", href: "/configuracion", icon: Settings, show: true },
  ].filter(item => item.show);

  // ===== MOBILE LAYOUT =====
  if (isMobile) {
    return (
      <div className="border-b border-sidebar-border bg-sidebar flex items-center justify-between px-2 h-12">
        {/* Left: hamburger menu */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)} className="h-9 w-9">
            <Menu className="h-5 w-5" />
          </Button>
          <span className="text-sm font-bold bg-gradient-primary bg-clip-text text-transparent">
            Cap Finanzas
          </span>
        </div>

        {/* Right: key actions */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onSearchClick} className="h-8 w-8">
            <Search className="h-4 w-4" />
          </Button>

          {/* Theme toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                {themeVariant === "dark" ? <Moon className="h-4 w-4" /> : themeVariant === "dim" ? <SunMoon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => applyTheme("light")}>
                <Sun className="h-4 w-4 mr-2" /> Claro
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyTheme("dark")}>
                <Moon className="h-4 w-4 mr-2" /> Oscuro
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyTheme("dim")}>
                <SunMoon className="h-4 w-4 mr-2" /> Intermedio
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" className="relative h-8 w-8" onClick={() => navigate("/notificaciones")}>
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-medium px-1">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        </div>

        {/* Mobile navigation sheet */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="w-[280px] p-0">
            <SheetHeader className="p-4 border-b border-border">
              <SheetTitle className="text-left bg-gradient-primary bg-clip-text text-transparent">
                Cap Finanzas
              </SheetTitle>
            </SheetHeader>

            <div className="p-3">
              <ModeSelector compact onPurchaseClick={() => { setMobileMenuOpen(false); setPurchaseOpen(true); }} />
            </div>

            <nav className="flex-1 overflow-y-auto px-2 pb-4">
              {mobileNavItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => mobileNavigate(item.href)}
                  className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span>{item.name}</span>
                </button>
              ))}

              <div className="border-t border-border mt-3 pt-3 space-y-1">
                <button
                  onClick={() => { setMobileMenuOpen(false); setPurchaseOpen(true); }}
                  className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                >
                  <ShoppingCart className="h-5 w-5 flex-shrink-0" />
                  <span>Ver Planes y Comprar</span>
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); setActivationOpen(true); }}
                  className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                >
                  <Key className="h-5 w-5 flex-shrink-0" />
                  <span>Activar Licencia</span>
                </button>
                <button
                  onClick={() => mobileNavigate("/instalar")}
                  className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                >
                  <Download className="h-5 w-5 flex-shrink-0" />
                  <span>Descargar App</span>
                </button>
              </div>
            </nav>
          </SheetContent>
        </Sheet>

        <PurchaseDialog open={purchaseOpen} onOpenChange={setPurchaseOpen} onActivate={() => { setPurchaseOpen(false); setActivationOpen(true); }} />
        <ActivationDialog open={activationOpen} onOpenChange={setActivationOpen} />
      </div>
    );
  }

  // ===== DESKTOP LAYOUT =====
  return (
    <div className="border-b border-sidebar-border bg-sidebar backdrop-blur supports-[backdrop-filter]:bg-sidebar/95 flex items-center justify-between px-3 h-12">
      {/* Left section: Toggle + Menu */}
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="mr-2 h-9 w-9"
          title={sidebarVisible ? "Ocultar panel lateral" : "Mostrar panel lateral"}
        >
          {sidebarVisible ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
        </Button>

        <Menubar className="rounded-none border-0 bg-transparent">
          <MenubarMenu>
            <MenubarTrigger>Archivo</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={() => navigate(addTransactionRoute)}>
                <FileText className="mr-2 h-4 w-4" />
                {addTransactionLabel}
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
              <MenubarItem onClick={() => navigate("/transacciones")}>
                {isSimpleMode ? "Movimientos" : "Transacciones"}
              </MenubarItem>
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

              {isFeatureAvailable("journal") && (
                <MenubarItem onClick={() => navigate("/libro-diario")}>Libro Diario</MenubarItem>
              )}
              {isFeatureAvailable("ledger") && (
                <MenubarItem onClick={() => navigate("/libro-mayor")}>Libro Mayor</MenubarItem>
              )}
              {isFeatureAvailable("balance") && (
                <MenubarItem onClick={() => navigate("/balance")}>Balance General</MenubarItem>
              )}
              {isFeatureAvailable("incomeStatement") && (
                <MenubarItem onClick={() => navigate("/resultados")}>Estado de Resultados</MenubarItem>
              )}
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger>Herramientas</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={() => navigate("/presupuesto")}>Gestor de Presupuesto</MenubarItem>
              <MenubarItem onClick={() => navigate("/categorias")}>Administrar Categorías</MenubarItem>
              <MenubarItem onClick={() => navigate("/monedas")}>Conversor de Monedas</MenubarItem>
              <MenubarSeparator />
              <MenubarItem onClick={() => navigate("/calendario")}>Calendario Financiero</MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger>Ayuda</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={() => navigate("/manual")}>
                <Book className="mr-2 h-4 w-4" />
                Tutoriales Interactivos y Manual de Usuario
              </MenubarItem>
              {isFeatureAvailable("encyclopedia") && (
                <MenubarItem onClick={() => navigate("/enciclopedia")}>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Enciclopedia
                </MenubarItem>
              )}
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

          <MenubarMenu>
            <MenubarTrigger>Licencia</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={() => setPurchaseOpen(true)}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Ver Planes y Comprar
              </MenubarItem>
              <MenubarItem onClick={() => setActivationOpen(true)}>
                <Key className="mr-2 h-4 w-4" />
                Activar Licencia
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger>Descargar</MenubarTrigger>
            <MenubarContent className="w-56">
              <MenubarSub>
                <MenubarSubTrigger>
                  <Smartphone className="mr-2 h-4 w-4" />
                  Celular / Tablet
                </MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem onClick={() => navigate("/instalar")}>
                    <Smartphone className="mr-2 h-4 w-4" />
                    Android (PWA)
                  </MenubarItem>
                  <MenubarItem onClick={() => navigate("/instalar")}>
                    <Smartphone className="mr-2 h-4 w-4" />
                    iPhone / iPad (PWA)
                  </MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
              <MenubarSeparator />
              <MenubarSub>
                <MenubarSubTrigger>
                  <Monitor className="mr-2 h-4 w-4" />
                  Escritorio
                </MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem onClick={() => window.open("https://github.com/Cade80-25/cap-finanzas/releases/latest", "_blank")}>
                    <Monitor className="mr-2 h-4 w-4" />
                    Windows (.exe)
                  </MenubarItem>
                  <MenubarItem onClick={() => window.open("https://github.com/Cade80-25/cap-finanzas/releases/latest", "_blank")}>
                    <Apple className="mr-2 h-4 w-4" />
                    macOS (.dmg)
                  </MenubarItem>
                  <MenubarItem onClick={() => window.open("https://github.com/Cade80-25/cap-finanzas/releases/latest", "_blank")}>
                    <Laptop className="mr-2 h-4 w-4" />
                    Linux (.AppImage)
                  </MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
              <MenubarSeparator />
              <MenubarItem onClick={() => navigate("/instalar")} className="text-muted-foreground text-xs">
                <Info className="mr-2 h-4 w-4" />
                Instrucciones de instalación
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>

      {/* Center section: Spacer */}
      <div className="flex-1" />
    
      {/* Right section: Mode Selector + Search + Tutorial + Notifications */}
      <div className="flex items-center gap-2">
        <ModeSelector compact onPurchaseClick={() => setPurchaseOpen(true)} />
        
        <Button variant="outline" size="sm" onClick={onSearchClick} className="gap-2">
          <Search className="h-4 w-4" />
          <span className="hidden md:inline">Buscar</span>
          <kbd className="hidden md:inline pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>

        {/* Theme Toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Cambiar tema">
              {themeVariant === "dark" ? <Moon className="h-4 w-4" /> : themeVariant === "dim" ? <SunMoon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => applyTheme("light")} className={themeVariant === "light" ? "bg-accent/20" : ""}>
              <Sun className="h-4 w-4 mr-2" /> Claro
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => applyTheme("dark")} className={themeVariant === "dark" ? "bg-accent/20" : ""}>
              <Moon className="h-4 w-4 mr-2" /> Oscuro
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => applyTheme("dim")} className={themeVariant === "dim" ? "bg-accent/20" : ""}>
              <SunMoon className="h-4 w-4 mr-2" /> Intermedio
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <TutorialButton />
        
        <Button variant="ghost" size="icon" className="relative h-8 w-8" onClick={() => navigate("/notificaciones")} title="Notificaciones">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-medium px-1">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </div>

      <PurchaseDialog open={purchaseOpen} onOpenChange={setPurchaseOpen} onActivate={() => { setPurchaseOpen(false); setActivationOpen(true); }} />
      <ActivationDialog open={activationOpen} onOpenChange={setActivationOpen} />
    </div>
  );
}
