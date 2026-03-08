import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { X, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFirstVisitTooltips } from "@/hooks/useFirstVisitTooltips";
import { cn } from "@/lib/utils";

export function FirstVisitTooltip() {
  const location = useLocation();
  const { getTooltipForPage, markPageVisited, disableTooltips } = useFirstVisitTooltips();
  const [visible, setVisible] = useState(false);
  const [tooltip, setTooltip] = useState<{ title: string; message: string; emoji: string } | null>(null);

  useEffect(() => {
    const data = getTooltipForPage(location.pathname);
    if (data) {
      // Small delay for smooth entry
      const timer = setTimeout(() => {
        setTooltip(data);
        setVisible(true);
      }, 600);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
      setTooltip(null);
    }
  }, [location.pathname]);

  const handleDismiss = () => {
    setVisible(false);
    markPageVisited(location.pathname);
    setTimeout(() => setTooltip(null), 300);
  };

  const handleDisableAll = () => {
    setVisible(false);
    disableTooltips();
    setTimeout(() => setTooltip(null), 300);
  };

  if (!tooltip) return null;

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 max-w-sm transition-all duration-300 ease-out",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      )}
    >
      <div className="bg-card border border-border rounded-xl shadow-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">{tooltip.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-semibold text-sm">{tooltip.title}</h4>
              <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={handleDismiss}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{tooltip.message}</p>
            <div className="flex items-center gap-2 mt-2">
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleDismiss}>
                Entendido
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-muted-foreground"
                onClick={handleDisableAll}
              >
                <EyeOff className="h-3 w-3 mr-1" />
                No mostrar más
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
