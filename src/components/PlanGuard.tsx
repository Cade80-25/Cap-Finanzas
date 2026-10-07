import { Navigate, useLocation } from "react-router-dom";
import { useModeFeatures, FeatureKey } from "@/hooks/useModeFeatures";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, ArrowLeft } from "lucide-react";

/**
 * Guardia de rutas por plan.
 *
 * Sin esto, un usuario con el plan Simples podia escribir la URL a mano
 * (por ejemplo /contabilidad) y entrar al modo completo sin pagar la
 * diferencia. El menu ocultaba el enlace, pero la ruta seguia accesible.
 *
 * Uso:
 *   <Route path="contabilidad" element={
 *     <PlanGuard feature="accounting"><Contabilidad /></PlanGuard>
 *   } />
 */

interface PlanGuardProps {
  feature: FeatureKey;
  children: React.ReactNode;
}

export function PlanGuard({ feature, children }: PlanGuardProps) {
  const { isFeatureAvailable } = useModeFeatures();
  const location = useLocation();

  if (isFeatureAvailable(feature)) {
    return <>{children}</>;
  }

  // No tiene el plan: mostrar aviso en vez del contenido
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-xl">Función del plan Empresarial</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Esta sección forma parte del plan <strong>Empresarial</strong>, que incluye
            contabilidad de partida doble, Libro Diario y Mayor, Balance General y
            Estado de Resultados.
          </p>
          <p className="text-sm text-muted-foreground text-center">
            Tu plan actual es <strong>Simples</strong>. Puedes mejorar tu licencia
            por la diferencia escribiéndonos a{" "}
            <a href="mailto:soporte@capfinanzas.com" className="text-primary underline">
              soporte@capfinanzas.com
            </a>.
          </p>
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => {
              // Volver al panel principal
              window.location.hash = "#/";
              if (!window.location.hash) window.location.href = "/";
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al panel principal
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
