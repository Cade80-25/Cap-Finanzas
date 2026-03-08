import { DollarSign, TrendingUp, TrendingDown, Target, Layers, CheckSquare, Square } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, LineChart, Line, PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { useConsolidatedData } from "@/hooks/useConsolidatedData";

export default function Consolidado() {
  const {
    allSources,
    selectedKeys,
    toggleSource,
    selectAll,
    selectNone,
    stats,
    monthlySummary,
    perSourceSummary,
    categoryBreakdown,
  } = useConsolidatedData();

  const hasData = stats.totalTransacciones > 0;
  const selectedCount = selectedKeys.size;

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Reporte Consolidado
        </h1>
        <p className="text-muted-foreground mt-2">
          Visualiza las finanzas combinadas de múltiples cuentas y perfiles
        </p>
      </div>

      {/* Source selector */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Cuentas incluidas</CardTitle>
              <Badge variant="secondary">{selectedCount} de {allSources.length}</Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>Todas</Button>
              <Button variant="outline" size="sm" onClick={selectNone}>Ninguna</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {allSources.map((source) => {
              const key = `${source.profileId}::${source.walletId}`;
              const isSelected = selectedKeys.has(key);
              return (
                <button
                  key={key}
                  onClick={() => toggleSource(source.profileId, source.walletId)}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border text-left text-sm transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-muted/30 text-muted-foreground"
                  }`}
                >
                  {isSelected
                    ? <CheckSquare className="h-4 w-4 text-primary flex-shrink-0" />
                    : <Square className="h-4 w-4 flex-shrink-0" />
                  }
                  <span className="flex-shrink-0">{source.walletIcon}</span>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{source.walletName}</div>
                    <div className="text-xs text-muted-foreground truncate">{source.profileName}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {!hasData && selectedCount > 0 && (
        <Card className="p-8 text-center text-muted-foreground">
          <Layers className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No hay transacciones en las cuentas seleccionadas</p>
          <p className="text-sm mt-1">Registra movimientos para verlos aquí consolidados.</p>
        </Card>
      )}

      {selectedCount === 0 && (
        <Card className="p-8 text-center text-muted-foreground">
          <Square className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Selecciona al menos una cuenta</p>
        </Card>
      )}

      {hasData && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                <TrendingUp className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">${stats.totalIngresos.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">{selectedCount} cuenta(s)</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Gastos Totales</CardTitle>
                <TrendingDown className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">${stats.totalGastos.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">{stats.totalTransacciones} movimientos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Balance Consolidado</CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stats.balance >= 0 ? "text-success" : "text-destructive"}`}>
                  ${stats.balance.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Ingresos - Gastos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Tasa de Ahorro</CardTitle>
                <Target className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{stats.tasaAhorro.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground mt-1">Del total de ingresos</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="por-cuenta" className="space-y-4">
            <TabsList>
              <TabsTrigger value="por-cuenta">Por Cuenta</TabsTrigger>
              <TabsTrigger value="tendencias">Tendencias</TabsTrigger>
              <TabsTrigger value="categorias">Categorías</TabsTrigger>
              <TabsTrigger value="comparativa">Comparativa</TabsTrigger>
            </TabsList>

            {/* Per-account breakdown */}
            <TabsContent value="por-cuenta" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Desglose por Cuenta</CardTitle>
                  <CardDescription>Balance individual de cada cuenta seleccionada</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {perSourceSummary.map((s) => (
                      <div
                        key={`${s.profileId}-${s.walletId}`}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
                      >
                        <span className="text-xl">{s.walletIcon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{s.walletName}</div>
                          <div className="text-xs text-muted-foreground">
                            {s.profileName} · {s.count} movimientos
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-success">+${s.ingresos.toFixed(2)}</div>
                          <div className="text-sm text-destructive">-${s.gastos.toFixed(2)}</div>
                        </div>
                        <div className={`text-right font-bold min-w-[80px] ${s.balance >= 0 ? "text-success" : "text-destructive"}`}>
                          ${s.balance.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Trends */}
            <TabsContent value="tendencias" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Evolución Mensual Consolidada</CardTitle>
                  <CardDescription>Ingresos y gastos combinados de todas las cuentas seleccionadas</CardDescription>
                </CardHeader>
                <CardContent>
                  {monthlySummary.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={monthlySummary}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" />
                        <YAxis />
                        <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                        <Legend />
                        <Line type="monotone" dataKey="ingresos" stroke="hsl(var(--success))" strokeWidth={2} name="Ingresos" />
                        <Line type="monotone" dataKey="gastos" stroke="hsl(var(--destructive))" strokeWidth={2} name="Gastos" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                      No hay datos disponibles
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Categories */}
            <TabsContent value="categorias" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Distribución de Gastos</CardTitle>
                  <CardDescription>Gastos agrupados por categoría (todas las cuentas)</CardDescription>
                </CardHeader>
                <CardContent>
                  {categoryBreakdown.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <RePieChart>
                        <Pie
                          data={categoryBreakdown}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {categoryBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                        <Legend />
                      </RePieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                      No hay datos de gastos disponibles
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Bar comparison */}
            <TabsContent value="comparativa" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Comparativa Mensual</CardTitle>
                  <CardDescription>Ingresos vs Gastos consolidados por mes</CardDescription>
                </CardHeader>
                <CardContent>
                  {monthlySummary.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={monthlySummary}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" />
                        <YAxis />
                        <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                        <Legend />
                        <Bar dataKey="ingresos" fill="hsl(var(--success))" name="Ingresos" />
                        <Bar dataKey="gastos" fill="hsl(var(--destructive))" name="Gastos" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                      No hay datos disponibles
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
