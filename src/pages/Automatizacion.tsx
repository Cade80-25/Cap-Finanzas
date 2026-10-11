import { useNavigate } from "react-router-dom";
import { AlertTriangle, AlertCircle, Info, CheckCircle2, ArrowRight, Activity, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAutomatizacion, AlertSeverity } from "@/hooks/useAutomatizacion";

const MONEY = (n: number) =>
  `$${(Number.isFinite(n) ? n : 0).toLocaleString("es-UY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const SEVERITY_META: Record<AlertSeverity, { label: string; color: string; icon: typeof AlertTriangle }> = {
  critica: { label: "Crítica", color: "bg-red-100 text-red-800 border-red-300", icon: ShieldAlert },
  alta: { label: "Alta", color: "bg-orange-100 text-orange-800 border-orange-300", icon: AlertTriangle },
  media: { label: "Media", color: "bg-amber-100 text-amber-800 border-amber-300", icon: AlertCircle },
  baja: { label: "Baja", color: "bg-blue-100 text-blue-800 border-blue-300", icon: Info },
};

export default function Automatizacion() {
  const navigate = useNavigate();
  const { alerts, resumen } = useAutomatizacion();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6" /> Centro de Automatización
          </h1>
          <p className="text-sm text-muted-foreground">
            Alertas generadas automáticamente a partir de los datos cargados en cada módulo
          </p>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Alertas activas</p>
            <p className="text-2xl font-bold">{resumen.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Críticas / Altas</p>
            <p className="text-2xl font-bold text-red-600">
              {resumen.porSeveridad.critica + resumen.porSeveridad.alta}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Monto en riesgo</p>
            <p className="text-2xl font-bold">{MONEY(resumen.montoEnRiesgo)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Estado</p>
            <p className="text-2xl font-bold">
              {resumen.hayCriticas ? (
                <span className="text-red-600">Requiere atención</span>
              ) : resumen.total > 0 ? (
                <span className="text-amber-600">Con avisos</span>
              ) : (
                <span className="text-green-600">Todo en orden</span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de alertas */}
      {alerts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-[220px] text-muted-foreground gap-3">
            <CheckCircle2 className="h-10 w-10 text-green-500 opacity-70" />
            <p className="text-sm">No hay alertas pendientes</p>
            <p className="text-xs">Cargá datos en los módulos (facturas, inventario, seguros, contratos) y las alertas aparecerán aquí.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((a) => {
            const meta = SEVERITY_META[a.severity];
            const Icon = meta.icon;
            return (
              <Card key={a.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`rounded-full p-2 ${meta.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{a.title}</span>
                      <Badge variant="outline" className={`text-xs ${meta.color}`}>{meta.label}</Badge>
                      <Badge variant="secondary" className="text-xs">{a.module}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{a.message}</p>
                  </div>
                  {a.amount != null && a.amount > 0 && (
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">Monto</p>
                      <p className="font-semibold">{MONEY(a.amount)}</p>
                    </div>
                  )}
                  {a.route && (
                    <Button size="sm" variant="outline" onClick={() => navigate(a.route!)}>
                      Ir <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
