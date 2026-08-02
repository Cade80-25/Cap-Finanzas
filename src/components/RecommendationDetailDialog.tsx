import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Target,
  TrendingUp,
  BookOpen,
  CheckCircle2,
  Sparkles,
  Loader2,
  Wifi,
  WifiOff,
  ChevronDown,
  ChevronUp,
  LucideIcon,
} from "lucide-react";
import {
  financialLibrary,
  type RecommendationDetail,
  type FinancialTip,
} from "@/lib/financial-library";
import { supabase } from "@/integrations/supabase/client";

interface RecommendationDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "ahorro" | "inversion" | "educacion";
  title: string;
  icon: LucideIcon;
}

export function RecommendationDetailDialog({
  open,
  onOpenChange,
  type,
  title,
  icon: Icon,
}: RecommendationDetailDialogProps) {
  const [expandedTip, setExpandedTip] = useState<number | null>(0);
  const [aiEnhancement, setAiEnhancement] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const detail: RecommendationDetail = financialLibrary[type];

  const handleGetAiEnhancement = async () => {
    setLoadingAi(true);
    setAiEnhancement(null);

    try {
      const { data, error } = await supabase.functions.invoke("ai-recommendations", {
        body: { type, context: detail.summary },
      });

      if (error) throw error;
      setAiEnhancement(data.recommendation);
    } catch (err) {
      console.error("AI enhancement error:", err);
      setAiEnhancement(
        "No se pudo conectar con el servicio de IA en este momento. Las recomendaciones de la biblioteca integrada siguen disponibles arriba."
      );
    } finally {
      setLoadingAi(false);
    }
  };

  // Listen for online/offline
  if (typeof window !== "undefined") {
    window.addEventListener("online", () => setIsOnline(true));
    window.addEventListener("offline", () => setIsOnline(false));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{detail.summary}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {/* Tips accordion */}
            {detail.tips.map((tip, idx) => (
              <Card key={idx} className="overflow-hidden">
                <button
                  className="w-full text-left p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                  onClick={() => setExpandedTip(expandedTip === idx ? null : idx)}
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {idx + 1}
                    </Badge>
                    <span className="font-medium text-sm">{tip.title}</span>
                  </div>
                  {expandedTip === idx ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {expandedTip === idx && (
                  <CardContent className="pt-0 space-y-4">
                    <Separator />
                    <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                      {tip.content}
                    </p>

                    {/* Action steps */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        Pasos de acción
                      </h4>
                      <ul className="space-y-1.5">
                        {tip.actionSteps.map((step, sIdx) => (
                          <li key={sIdx} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-primary font-bold mt-0.5">•</span>
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Key terms */}
                    {tip.keyTerms && tip.keyTerms.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold">📖 Términos clave</h4>
                        <div className="grid gap-2">
                          {tip.keyTerms.map((kt, kIdx) => (
                            <div key={kIdx} className="bg-muted/50 rounded-lg p-2.5">
                              <span className="font-medium text-sm">{kt.term}: </span>
                              <span className="text-sm text-muted-foreground">{kt.definition}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}

            {/* Resources */}
            <Card>
              <CardContent className="pt-4 space-y-2">
                <h4 className="text-sm font-semibold">📚 Recursos en la app</h4>
                {detail.resources.map((r, idx) => (
                  <p key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary">→</span> {r}
                  </p>
                ))}
              </CardContent>
            </Card>

            {/* AI Enhancement section */}
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Recomendación con IA
                </h4>
                <Badge variant="outline" className="text-xs gap-1">
                  {isOnline ? (
                    <>
                      <Wifi className="h-3 w-3" /> En línea
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-3 w-3" /> Sin conexión
                    </>
                  )}
                </Badge>
              </div>

              {!aiEnhancement && !loadingAi && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGetAiEnhancement}
                  disabled={!isOnline}
                  className="w-full"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {isOnline
                    ? "Obtener recomendación actualizada con IA"
                    : "Conéctate a internet para usar IA"}
                </Button>
              )}

              {loadingAi && (
                <Alert>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <AlertDescription>Generando recomendación personalizada...</AlertDescription>
                </Alert>
              )}

              {aiEnhancement && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-4">
                    <p className="text-sm whitespace-pre-line leading-relaxed">{aiEnhancement}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
