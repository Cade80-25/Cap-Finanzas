import { useState, useEffect } from "react";
import { Search, Wifi, WifiOff, TrendingUp, TrendingDown, BarChart3, Building2, Globe, ShieldAlert, Loader2, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

type QuoteData = {
  symbol: string;
  name: string;
  price: number;
  currency: string;
  change: number;
  changePercent: number;
  previousClose: number;
  open: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  marketCap: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  exchange: string;
  quoteType: string;
  region: string;
};

type ChartPoint = {
  date: string;
  price: number;
  volume: number;
};

const popularSymbols = [
  { symbol: "AAPL", name: "Apple" },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "GOOGL", name: "Google" },
  { symbol: "AMZN", name: "Amazon" },
  { symbol: "TSLA", name: "Tesla" },
  { symbol: "META", name: "Meta" },
  { symbol: "^GSPC", name: "S&P 500" },
  { symbol: "^DJI", name: "Dow Jones" },
  { symbol: "BTC-USD", name: "Bitcoin" },
  { symbol: "GC=F", name: "Oro" },
];

function formatNumber(num: number | undefined): string {
  if (num == null) return "N/A";
  if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  return num.toLocaleString("es-ES");
}

export default function MarketExplorer() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [chartData, setChartData] = useState<ChartPoint[]>([]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const fetchQuote = async (symbol: string) => {
    if (!isOnline) {
      toast.error("Sin conexión a internet. Esta función requiere conexión.");
      return;
    }

    setLoading(true);
    setQuote(null);
    setAiAnalysis("");
    setChartData([]);

    try {
      const { data, error } = await supabase.functions.invoke("market-data", {
        body: { symbol, action: "quote" },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setQuote(data.quote);
      setAiAnalysis(data.aiAnalysis || "");

      // Fetch chart in parallel
      fetchChart(symbol);
    } catch (err) {
      console.error("Error fetching quote:", err);
      toast.error("Error al obtener datos. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const fetchChart = async (symbol: string) => {
    setChartLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("market-data", {
        body: { symbol, action: "chart" },
      });

      if (error) throw error;
      if (data?.chartPoints) {
        setChartData(data.chartPoints);
      }
    } catch (err) {
      console.error("Error fetching chart:", err);
    } finally {
      setChartLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      fetchQuote(searchTerm.trim());
    }
  };

  const isPositive = quote ? quote.change >= 0 : false;

  return (
    <div className="space-y-4">
      {/* Online/Offline indicator */}
      <Alert variant={isOnline ? "default" : "destructive"} className={isOnline ? "border-green-500/50 bg-green-500/10 [&>svg]:text-green-500" : ""}>
        {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
        <AlertTitle>{isOnline ? "Conectado a Internet" : "Sin Conexión a Internet"}</AlertTitle>
        <AlertDescription>
          {isOnline
            ? "Los datos del mercado se obtienen en tiempo real de las bolsas de valores mundiales."
            : "Esta sección requiere conexión a internet para mostrar datos actualizados del mercado. Conéctate a una red para usar esta función."}
        </AlertDescription>
      </Alert>

      {/* Disclaimer */}
      <Alert variant="destructive" className="border-yellow-500/50 bg-yellow-500/10 text-foreground [&>svg]:text-yellow-500">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Datos del Mercado — Solo con Fines Educativos</AlertTitle>
        <AlertDescription>
          Los datos provienen de fuentes públicas de mercados financieros (Yahoo Finance) y el análisis es generado por IA.
          <strong> No constituye asesoría financiera profesional.</strong> Toda decisión de inversión es bajo tu propio riesgo.
          Los precios pueden tener un retraso de 15-20 minutos según la bolsa.
        </AlertDescription>
      </Alert>

      {/* Search */}
      <div className="flex gap-2">
        <Input
          placeholder="Buscar símbolo (ej: AAPL, MSFT, BTC-USD, ^GSPC)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          disabled={!isOnline}
        />
        <Button onClick={handleSearch} disabled={!isOnline || loading || !searchTerm.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>

      {/* Popular symbols */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-muted-foreground self-center">Populares:</span>
        {popularSymbols.map((s) => (
          <Badge
            key={s.symbol}
            variant="outline"
            className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
            onClick={() => {
              setSearchTerm(s.symbol);
              fetchQuote(s.symbol);
            }}
          >
            {s.name}
          </Badge>
        ))}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-lg" />
        </div>
      )}

      {/* Quote data */}
      {quote && !loading && (
        <div className="space-y-4">
          {/* Header */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    {quote.name}
                    <Badge variant="secondary">{quote.symbol}</Badge>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Globe className="h-3 w-3" />
                    {quote.exchange} • {quote.quoteType}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">
                    {quote.price?.toFixed(2)} <span className="text-sm text-muted-foreground">{quote.currency}</span>
                  </p>
                  <div className={`flex items-center gap-1 justify-end ${isPositive ? "text-green-500" : "text-red-500"}`}>
                    {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    <span className="font-semibold">
                      {isPositive ? "+" : ""}{quote.change?.toFixed(2)} ({isPositive ? "+" : ""}{quote.changePercent?.toFixed(2)}%)
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Apertura", value: quote.open?.toFixed(2) },
              { label: "Cierre Anterior", value: quote.previousClose?.toFixed(2) },
              { label: "Máximo del Día", value: quote.dayHigh?.toFixed(2) },
              { label: "Mínimo del Día", value: quote.dayLow?.toFixed(2) },
              { label: "Máx. 52 Semanas", value: quote.fiftyTwoWeekHigh?.toFixed(2) },
              { label: "Mín. 52 Semanas", value: quote.fiftyTwoWeekLow?.toFixed(2) },
              { label: "Volumen", value: formatNumber(quote.volume) },
              { label: "Cap. de Mercado", value: formatNumber(quote.marketCap) },
            ].map((stat) => (
              <Card key={stat.label} className="p-3">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-sm font-semibold">{stat.value || "N/A"}</p>
              </Card>
            ))}
          </div>

          {/* Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Gráfico de Precio (Último Mes)
              </CardTitle>
              <CardDescription>
                Fuente: Yahoo Finance • Los precios pueden tener retraso
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chartLoading ? (
                <Skeleton className="h-56 w-full" />
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isPositive ? "#22c55e" : "#ef4444"} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={isPositive ? "#22c55e" : "#ef4444"} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v) => {
                        const d = new Date(v);
                        return `${d.getDate()}/${d.getMonth() + 1}`;
                      }}
                    />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      domain={["auto", "auto"]}
                      tickFormatter={(v) => v.toFixed(0)}
                    />
                    <Tooltip
                      formatter={(value: number) => [`${value.toFixed(2)} ${quote.currency}`, "Precio"]}
                      labelFormatter={(label) => {
                        const d = new Date(label);
                        return d.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke={isPositive ? "#22c55e" : "#ef4444"}
                      fill="url(#priceGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">No hay datos de gráfico disponibles</p>
              )}
            </CardContent>
          </Card>

          {/* AI Analysis */}
          {aiAnalysis && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  Análisis General (IA)
                </CardTitle>
                <CardDescription>
                  Generado por IA con fines educativos • No es asesoría financiera
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-line text-sm">{aiAnalysis}</div>
              </CardContent>
            </Card>
          )}

          {/* Source info */}
          <div className="flex items-start gap-2 p-3 rounded-lg border bg-muted/50">
            <Info className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <p className="text-xs text-muted-foreground">
              <strong>Fuentes de datos:</strong> Precios y datos financieros de Yahoo Finance (datos públicos con posible retraso de 15-20 min).
              Análisis general generado por IA (Google Gemini). Los datos se actualizan cada vez que realizas una búsqueda.
              Esta herramienta es exclusivamente educativa.
            </p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!quote && !loading && isOnline && (
        <div className="text-center py-8 text-muted-foreground">
          <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium mb-1">Explorador de Mercados</p>
          <p className="text-sm">Busca cualquier acción, índice, criptomoneda o commodity por su símbolo bursátil</p>
          <p className="text-xs mt-2">Ejemplos: AAPL (Apple), ^GSPC (S&P 500), BTC-USD (Bitcoin), GC=F (Oro)</p>
        </div>
      )}
    </div>
  );
}
