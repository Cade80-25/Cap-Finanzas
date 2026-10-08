import { lazy, Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Loader2, Lock } from "lucide-react";
import { useLicense } from "@/hooks/useLicense";

const MarketExplorer = lazy(() => import("@/components/MarketExplorer"));

/**
 * Bolsas en Vivo — pagina propia.
 *
 * Antes esta seccion vivia escondida en Aprender → Recomendaciones → pestaña
 * "Bolsas en Vivo" (tres niveles), asi que casi nadie la encontraba.
 */
export default function Bolsas() {
  const { status, purchasedModes } = useLicense();

  // Acceso completo con prueba activa o licencia que incluya ambos modos
  const tieneAcceso =
    status === "trial" ||
    (status === "active" &&
      purchasedModes.includes("simple") &&
      purchasedModes.includes("traditional"));

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 max-w-7xl">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Bolsas en Vivo</h1>
          <p className="text-sm text-muted-foreground">
            Cotizaciones, gráficos, análisis técnico y noticias de los mercados mundiales
          </p>
        </div>
      </div>

      {tieneAcceso ? (
        <Suspense
          fallback={
            <Card>
              <CardContent className="py-12 flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Cargando datos del mercado...
              </CardContent>
            </Card>
          }
        >
          <MarketExplorer />
        </Suspense>
      ) : (
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-7 w-7 text-primary" />
            </div>
            <CardTitle>Función del plan Empresarial</CardTitle>
            <CardDescription>
              Las bolsas en vivo forman parte del plan Empresarial, junto con la
              contabilidad de partida doble y el Chat Financiero.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              Tu plan actual es <strong>Simples</strong>. Podés mejorarlo escribiéndonos a{" "}
              <a href="mailto:soporte@capfinanzas.com" className="text-primary underline">
                soporte@capfinanzas.com
              </a>.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
