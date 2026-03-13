import { Home, Receipt, Target, PieChart, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useModeFeatures } from "@/hooks/useModeFeatures";

const navItems = [
  { name: "Inicio", href: "/", icon: Home },
  { name: "Movimientos", href: "/transacciones", icon: Receipt },
  { name: "Presupuesto", href: "/presupuesto", icon: Target },
  { name: "Resumen", href: "/resumen", icon: PieChart },
  { name: "Cuenta", href: "/cuenta", icon: User },
];

export function MobileBottomNav() {
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const { isSimpleMode } = useModeFeatures();

  if (!isMobile) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground active:text-foreground"
              )}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full bg-primary" />
              )}
              <item.icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
              <span className="text-[10px] font-medium">
                {item.name === "Movimientos" && !isSimpleMode ? "Transacciones" : item.name}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
