import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import {
  Home,
  Receipt,
  Calendar,
  Target,
  User,
  Tag,
  PieChart,
  Settings,
  BookOpen,
  FileText,
  BarChart3,
  TrendingUp,
  HelpCircle,
  Menu,
  X,
  Sparkles,
  Calculator,
  Globe,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import MenuBar from "@/components/MenuBar";
import GlobalSearch from "@/components/GlobalSearch";

const navigation = [
  { name: "Panel Principal", href: "/", icon: Home },
  { name: "Transacciones", href: "/transacciones", icon: Receipt },
  { name: "Calendario", href: "/calendario", icon: Calendar },
  { name: "Presupuesto", href: "/presupuesto", icon: Target },
  { name: "Monedas", href: "/monedas", icon: Globe },
  { name: "Calculadora IRPF", href: "/calculadora-irpf", icon: Calculator },
  { name: "Categorías", href: "/categorias", icon: Tag },
  { name: "Resumen", href: "/resumen", icon: PieChart },
  { name: "Libro Diario", href: "/libro-diario", icon: BookOpen },
  { name: "Libro Mayor", href: "/libro-mayor", icon: FileText },
  { name: "Balance General", href: "/balance", icon: BarChart3 },
  { name: "Estado de Resultados", href: "/resultados", icon: TrendingUp },
  { name: "Enciclopedia", href: "/enciclopedia", icon: HelpCircle },
  { name: "Recomendaciones", href: "/recomendaciones", icon: Sparkles },
  { name: "Cuenta", href: "/cuenta", icon: User },
  { name: "Configuración", href: "/configuracion", icon: Settings },
];

export default function Layout() {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* MenuBar siempre visible en la parte superior */}
      <MenuBar 
        onSearchClick={() => setSearchOpen(true)} 
        onToggleSidebar={() => setSidebarVisible(!sidebarVisible)}
        sidebarVisible={sidebarVisible}
      />
      
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - visible solo cuando sidebarVisible es true */}
        {sidebarVisible && (
          <aside className="flex flex-col w-64 bg-sidebar border-r border-sidebar-border transition-all duration-300">
            <div className="flex h-12 items-center justify-between px-4 border-b border-sidebar-border flex-shrink-0">
              <h1 className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent">
                Cap Finanzas
              </h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarVisible(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-soft"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}