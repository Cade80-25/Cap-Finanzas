import { useState, useMemo, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { WalletSelector } from "@/components/WalletSelector";
import { ProfileSelector } from "@/components/ProfileSelector";
import {
  Home, Receipt, Calendar, Target, Tag, PieChart, Cog,
  X, Globe, GraduationCap, Calculator, LucideIcon, Clock, Upload,
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
import { FloatingAddAccount } from "@/components/FloatingAddAccount";
import { FirstVisitTooltip } from "@/components/FirstVisitTooltip";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { prefetchHandlers } from "@/lib/route-prefetch";

type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  featureKey: FeatureKey;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const allNavigationGroups: NavGroup[] = [
  {
    label: "Principal",
    items: [
      { name: "Panel Principal", href: "/", icon: Home, featureKey: "dashboard" },
      { name: "Transacciones", href: "/transacciones", icon: Receipt, featureKey: "transactions" },
      { name: "Calendario", href: "/calendario", icon: Calendar, featureKey: "calendar" },
      { name: "Programados", href: "/scheduler", icon: Clock, featureKey: "scheduler" },
      { name: "Importar", href: "/importar", icon: Upload, featureKey: "importar" },
      { name: "Presupuesto", href: "/presupuesto", icon: Target, featureKey: "budget" },
    ],
  },
  {
    label: "Organización",
    items: [
      { name: "Monedas", href: "/monedas", icon: Globe, featureKey: "currencies" },
      { name: "Categorías", href: "/categorias", icon: Tag, featureKey: "categories" },
    ],
  },
  {
    label: "Análisis",
    items: [
      { name: "Resumen", href: "/resumen", icon: PieChart, featureKey: "summary" },
      { name: "Contabilidad", href: "/contabilidad", icon: Calculator, featureKey: "accounting" },
      { name: "Aprender", href: "/aprender", icon: GraduationCap, featureKey: "learn" },
      { name: "Ajustes", href: "/ajustes", icon: Cog, featureKey: "settings" },
    ],
  },
];

export default function Layout() {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [tourActive, setTourActive] = useState(false);
  const location = useLocation();
  const { isLocked, unlock, hasMasterPin } = useSecurity();
  const { isFeatureAvailable } = useModeFeatures();
  const isMobile = useIsMobile();

  // Listen for tour start events from Dashboard
  useEffect(() => {
    const handler = () => setTourActive(true);
    window.addEventListener("start-app-tour", handler);
    return () => window.removeEventListener("start-app-tour", handler);
  }, []);

  const navigationGroups = useMemo(() => {
    return allNavigationGroups
      .map((group) => ({
        label: group.label,
        items: group.items.filter((item) => isFeatureAvailable(item.featureKey)),
      }))
      .filter((group) => group.items.length > 0);
  }, [isFeatureAvailable]);

  if (isLocked && hasMasterPin) {
    return <LockScreen onUnlock={unlock} />;
  }

  return (
    <LicenseGate>
      <div className="flex flex-col h-screen overflow-hidden bg-background">
        <WelcomeDialog />
        <TutorialOverlay />
        <InteractiveAppTour active={tourActive} onClose={() => setTourActive(false)} />
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
            <aside className="flex flex-col w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300">
              <div className="flex items-center gap-3 px-4 py-4 border-b border-sidebar-border flex-shrink-0">
                <div className="h-9 w-9 rounded-lg bg-gradient-primary flex items-center justify-center text-white font-bold text-base shrink-0">
                  CF
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-base font-semibold text-white leading-tight">Cap Finanzas</h1>
                  <span className="block text-[10px] text-amber-400 tracking-widest">TU DINERO, CLARO</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarVisible(false)}
                  className="h-8 w-8 text-sidebar-foreground hover:text-white"
                  aria-label="Cerrar panel lateral"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="px-3 pb-2 space-y-1">
                <ProfileSelector />
                <WalletSelector />
              </div>

              <nav className="flex-1 px-2 py-3 overflow-y-auto">
                {navigationGroups.map((group) => (
                  <div key={group.label} className="mb-1">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50 px-3 pt-4 pb-1">
                      {group.label}
                    </div>
                    {group.items.map((item) => {
                      const isActive = location.pathname === item.href;
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          {...prefetchHandlers(item.href)}
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
                  </div>
                ))}
              </nav>
            </aside>
          )}

          {/* Main Content */}
          <main className={cn("flex-1 overflow-auto flex flex-col", isMobile && "pb-14")}>
            <div className="flex-1">
              <Outlet />
            </div>
            <footer className="border-t border-border/50 px-4 py-3 text-xs text-muted-foreground flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
              <span>© {new Date().getFullYear()} Cap Finanzas</span>
              <Link to="/privacidad" className="hover:text-foreground hover:underline">Privacidad</Link>
              <Link to="/terminos" className="hover:text-foreground hover:underline">Términos</Link>
              <a href="mailto:pierresshop48@gmail.com" className="hover:text-foreground hover:underline">Contacto</a>
            </footer>
          </main>

          <FloatingAddAccount />
          <FirstVisitTooltip />
          <MobileBottomNav />
        </div>
      </div>
    </LicenseGate>
  );
}

