import { useState, useMemo, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { WalletSelector } from "@/components/WalletSelector";
import { ProfileSelector } from "@/components/ProfileSelector";
import {
  Home, Receipt, Calendar, Target, User, Tag, PieChart, Settings,
  BookOpen, FileText, BarChart3, TrendingUp, HelpCircle, X, Sparkles,
  Globe, Bell, Book, Layers, LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import MenuBar from "@/components/MenuBar";
import GlobalSearch from "@/components/GlobalSearch";
import { LockScreen } from "@/components/LockScreen";
import { useSecurity } from "@/hooks/useSecurity";
import { TutorialOverlay } from "@/components/TutorialOverlay";
import { WelcomeDialog } from "@/components/WelcomeDialog";
import { InteractiveAppTour } from "@/components/InteractiveAppTour";
import { LicenseGate } from "@/components/LicenseGate";
import { TrialBanner } from "@/components/TrialBanner";
import { useModeFeatures, FeatureKey } from "@/hooks/useModeFeatures";
import { Badge } from "@/components/ui/badge";
import { FloatingAddAccount } from "@/components/FloatingAddAccount";
import { FirstVisitTooltip } from "@/components/FirstVisitTooltip";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { useIsMobile } from "@/hooks/use-mobile";

type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  featureKey: FeatureKey;
  traditionalOnly?: boolean;
};

const allNavigation: NavItem[] = [
  { name: "Panel Principal", href: "/", icon: Home, featureKey: "dashboard" },
  { name: "Transacciones", href: "/transacciones", icon: Receipt, featureKey: "transactions" },
  { name: "Calendario", href: "/calendario", icon: Calendar, featureKey: "calendar" },
  { name: "Presupuesto", href: "/presupuesto", icon: Target, featureKey: "budget" },
  { name: "Monedas", href: "/monedas", icon: Globe, featureKey: "currencies" },
  { name: "Categorías", href: "/categorias", icon: Tag, featureKey: "categories" },
  { name: "Resumen", href: "/resumen", icon: PieChart, featureKey: "summary" },
  { name: "Consolidado", href: "/consolidado", icon: Layers, featureKey: "consolidated" },
  { name: "Libro Diario", href: "/libro-diario", icon: BookOpen, featureKey: "journal", traditionalOnly: true },
  { name: "Libro Mayor", href: "/libro-mayor", icon: FileText, featureKey: "ledger", traditionalOnly: true },
  { name: "Balance General", href: "/balance", icon: BarChart3, featureKey: "balance", traditionalOnly: true },
  { name: "Estado de Resultados", href: "/resultados", icon: TrendingUp, featureKey: "incomeStatement", traditionalOnly: true },
  { name: "Enciclopedia", href: "/enciclopedia", icon: HelpCircle, featureKey: "encyclopedia", traditionalOnly: true },
  { name: "Recomendaciones", href: "/recomendaciones", icon: Sparkles, featureKey: "recommendations" },
  { name: "Manual de Usuario", href: "/manual", icon: Book, featureKey: "manual" },
  { name: "Notificaciones", href: "/notificaciones", icon: Bell, featureKey: "notifications" },
  { name: "Cuenta", href: "/cuenta", icon: User, featureKey: "account" },
  { name: "Configuración", href: "/configuracion", icon: Settings, featureKey: "settings" },
];

export default function Layout() {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const { isLocked, unlock, hasMasterPin } = useSecurity();
  const { isFeatureAvailable, isSimpleMode } = useModeFeatures();
  const isMobile = useIsMobile();

  const navigation = useMemo(() => {
    return allNavigation.filter((item) => isFeatureAvailable(item.featureKey));
  }, [isFeatureAvailable]);

  if (isLocked && hasMasterPin) {
    return <LockScreen onUnlock={unlock} />;
  }

  return (
    <LicenseGate>
      <div className="flex flex-col h-screen overflow-hidden bg-background">
        <WelcomeDialog />
        <TutorialOverlay />
        <TrialBanner />

        <MenuBar 
          onSearchClick={() => setSearchOpen(true)} 
          onToggleSidebar={() => setSidebarVisible(!sidebarVisible)}
          sidebarVisible={sidebarVisible}
        />
        
        <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - hidden on mobile (mobile uses MenuBar's Sheet) */}
          {!isMobile && sidebarVisible && (
            <aside className="flex flex-col w-64 bg-sidebar border-r border-sidebar-border transition-all duration-300">
              <div className="flex h-12 items-center justify-between px-4 border-b border-sidebar-border flex-shrink-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent">
                    Cap Finanzas
                  </h1>
                  {isSimpleMode && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      Simple
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarVisible(false)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="px-3 pb-2 space-y-1">
                <ProfileSelector />
                <WalletSelector />
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
          <main className={cn("flex-1 overflow-auto", isMobile && "pb-14")}>
            <Outlet />
          </main>

          <FloatingAddAccount />
          <FirstVisitTooltip />
          <MobileBottomNav />
        </div>
      </div>
    </LicenseGate>
  );
}
