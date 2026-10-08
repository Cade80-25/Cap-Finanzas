import { useState, useEffect, useRef, memo } from "react";
import { Search, Wifi, WifiOff, TrendingUp, BarChart3, Globe, Loader2, Newspaper, ArrowUp, ArrowDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ─── Símbolos de Yahoo Finance ───
const popularSymbols = [
  { symbol: "AAPL", name: "Apple" },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "GOOGL", name: "Google" },
  { symbol: "AMZN", name: "Amazon" },
  { symbol: "TSLA", name: "Tesla" },
  { symbol: "META", name: "Meta" },
  { symbol: "NVDA", name: "Nvidia" },
  { symbol: "NFLX", name: "Netflix" },
  { symbol: "JPM", name: "JPMorgan" },
  { symbol: "BTC-USD", name: "Bitcoin" },
  { symbol: "ETH-USD", name: "Ethereum" },
  { symbol: "^GSPC", name: "S&P 500" },
  { symbol: "GC=F", name: "Oro" },
  { symbol: "EURUSD=X", name: "Euro/Dólar" },
];

// ─── Tipos ───
interface QuoteData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  exchange: string;
  name: string;
}

interface ChartData {
  timestamp: number[];
  open: number[];
  high: number[];
  low: number[];
  close: number[];
  volume: number[];
}

interface NewsItem {
  title: string;
  publisher: string;
  link: string;
  date: number;
}

// ─── Fetch vía proxy de Electron (evita CORS) ───
async function yfFetch(url: string): Promise<any> {
  // Si estamos en Electron, usar el proxy del proceso principal
  if (typeof window !== 'undefined' && (window as any).electron?.yahooFinance) {
    try {
      const result = await (window as any).electron.yahooFinance(url);
      if (result && !result.error) return result;
    } catch {}
  }
  // Fallback: fetch directo sin User-Agent (Yahoo lo rechaza)
  const res = await fetch(url);
  return res.json();
}

// ─── API de Yahoo Finance ───
async function fetchQuote(symbol: string): Promise<QuoteData | null> {
  try {
    const data = await yfFetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`
    );
    const result = data?.chart?.result?.[0];
    if (!result) return null;
    const meta = result.meta;
    const price = meta.regularMarketPrice || 0;
    const prevClose = meta.chartPreviousClose || meta.previousClose || price;
    const change = price - prevClose;
    const changePercent = prevClose ? (change / prevClose) * 100 : 0;
    return {
      symbol: meta.symbol || symbol,
      price,
      change,
      changePercent,
      currency: meta.currency || "USD",
      exchange: meta.fullExchangeName || meta.exchangeName || "",
      name: meta.longName || meta.shortName || symbol,
    };
  } catch {
    return null;
  }
}

async function fetchChart(symbol: string): Promise<ChartData | null> {
  try {
    const data = await yfFetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=3mo`
    );
    const result = data?.chart?.result?.[0];
    if (!result) return null;
    return {
      timestamp: result.timestamp || [],
      open: result.indicators?.quote?.[0]?.open || [],
      high: result.indicators?.quote?.[0]?.high || [],
      low: result.indicators?.quote?.[0]?.low || [],
      close: result.indicators?.quote?.[0]?.close || [],
      volume: result.indicators?.quote?.[0]?.volume || [],
    };
  } catch {
    return null;
  }
}

async function fetchNews(symbol: string): Promise<NewsItem[]> {
  try {
    const data = await yfFetch(
      `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(symbol)}&newsCount=8&quotesCount=0`
    );
    return (data?.news || []).map((n: any) => ({
      title: n.title || "",
      publisher: n.publisher || "",
      link: n.link || "",
      date: n.providerPublishTime || 0,
    }));
  } catch {
    return [];
  }
}

async function searchSymbol(query: string): Promise<string | null> {
  try {
    const data = await yfFetch(
      `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=1&newsCount=0`
    );
    const quotes = data?.quotes || [];
    if (quotes.length > 0) {
      return quotes[0].symbol;
    }
  } catch {}
  return null;
}

// ─── Gráfico de velas nativo ───
const CandleChart = memo(({ data, symbol }: { data: ChartData | null; symbol: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !data || data.close.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const padding = { top: 20, right: 60, bottom: 30, left: 10 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    const closes = data.close.filter((v) => v != null);
    if (closes.length === 0) return;

    const min = Math.min(...data.low.filter((v) => v != null));
    const max = Math.max(...data.high.filter((v) => v != null));
    const range = max - min || 1;

    const candleW = Math.max(2, chartW / closes.length * 0.7);
    const gap = chartW / closes.length;

    // Fondo
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();
    }

    // Velas
    for (let i = 0; i < data.close.length; i++) {
      const x = padding.left + i * gap + gap / 2;
      const o = data.open[i];
      const c = data.close[i];
      const hi = data.high[i];
      const lo = data.low[i];
      if (o == null || c == null || hi == null || lo == null) continue;

      const isUp = c >= o;
      const color = isUp ? "#22c55e" : "#ef4444";

      // Mecha
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      const hiY = padding.top + ((max - hi) / range) * chartH;
      const loY = padding.top + ((max - lo) / range) * chartH;
      ctx.beginPath();
      ctx.moveTo(x, hiY);
      ctx.lineTo(x, loY);
      ctx.stroke();

      // Cuerpo
      const oY = padding.top + ((max - o) / range) * chartH;
      const cY = padding.top + ((max - c) / range) * chartH;
      const bodyTop = Math.min(oY, cY);
      const bodyH = Math.max(1, Math.abs(cY - oY));
      ctx.fillStyle = color;
      ctx.fillRect(x - candleW / 2, bodyTop, candleW, bodyH);
    }

    // Precio actual
    const lastPrice = closes[closes.length - 1];
    const priceY = padding.top + ((max - lastPrice) / range) * chartH;
    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(w - padding.right + 2, priceY - 8, padding.right - 4, 16);
    ctx.fillStyle = "#fff";
    ctx.font = "11px monospace";
    ctx.textAlign = "left";
    ctx.fillText(lastPrice.toFixed(2), w - padding.right + 6, priceY + 4);

    // Eje Y
    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px monospace";
    ctx.textAlign = "right";
    for (let i = 0; i <= 4; i++) {
      const val = max - (range / 4) * i;
      const y = padding.top + (chartH / 4) * i;
      ctx.fillText(val.toFixed(2), w - padding.right - 4, y + 3);
    }

    // Eje X (fechas)
    ctx.textAlign = "center";
    const dateCount = Math.min(5, data.timestamp.length);
    for (let i = 0; i < dateCount; i++) {
      const idx = Math.floor((data.timestamp.length - 1) * (i / (dateCount - 1 || 1)));
      const ts = data.timestamp[idx];
      if (!ts) continue;
      const d = new Date(ts * 1000);
      const label = `${d.getMonth() + 1}/${d.getDate()}`;
      const x = padding.left + idx * gap + gap / 2;
      ctx.fillText(label, x, h - 8);
    }
  }, [data, symbol]);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Cargando gráfico...
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-[400px] rounded-lg"
      style={{ background: "#0f172a" }}
    />
  );
});
CandleChart.displayName = "CandleChart";

// ─── Información del símbolo ───
const SymbolInfo = memo(({ quote }: { quote: QuoteData | null }) => {
  if (!quote) {
    return (
      <div className="flex items-center justify-center h-[120px] text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Cargando...
      </div>
    );
  }

  const isUp = quote.change >= 0;
  const color = isUp ? "text-green-500" : "text-red-500";
  const Icon = isUp ? ArrowUp : ArrowDown;

  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold">{quote.price.toFixed(2)}</span>
        <span className="text-sm text-muted-foreground">{quote.currency}</span>
        <span className={`flex items-center gap-1 text-sm font-medium ${color}`}>
          <Icon className="h-4 w-4" />
          {isUp ? "+" : ""}{quote.change.toFixed(2)} ({isUp ? "+" : ""}{quote.changePercent.toFixed(2)}%)
        </span>
      </div>
      <div className="text-sm text-muted-foreground">
        {quote.name} · {quote.exchange}
      </div>
    </div>
  );
});
SymbolInfo.displayName = "SymbolInfo";

// ─── Análisis técnico básico ───
const TechnicalAnalysis = memo(({ data }: { data: ChartData | null }) => {
  if (!data || data.close.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Cargando análisis...
      </div>
    );
  }

  const closes = data.close.filter((v) => v != null);
  if (closes.length < 20) {
    return <div className="text-sm text-muted-foreground">Datos insuficientes para análisis</div>;
  }

  // SMA 20
  const sma20 = closes.slice(-20).reduce((a, b) => a + b, 0) / 20;
  // SMA 50
  const sma50 = closes.slice(-50).reduce((a, b) => a + b, 0) / Math.min(50, closes.length);
  // RSI 14
  const gains: number[] = [];
  const losses: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains.push(diff);
    else losses.push(Math.abs(diff));
  }
  const avgGain = gains.slice(-14).reduce((a, b) => a + b, 0) / 14;
  const avgLoss = losses.slice(-14).reduce((a, b) => a + b, 0) / 14;
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const rsi = 100 - 100 / (1 + rs);

  const lastPrice = closes[closes.length - 1];
  const signal = lastPrice > sma20 ? "COMPRA" : "VENTA";
  const rsiSignal = rsi > 70 ? "SOBREVENTA" : rsi < 30 ? "SOBRECOMPRA" : "NEUTRAL";

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="text-xs text-muted-foreground">Precio Actual</div>
          <div className="text-lg font-bold">{lastPrice.toFixed(2)}</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="text-xs text-muted-foreground">SMA 20</div>
          <div className="text-lg font-bold">{sma20.toFixed(2)}</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="text-xs text-muted-foreground">SMA 50</div>
          <div className="text-lg font-bold">{sma50.toFixed(2)}</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="text-xs text-muted-foreground">RSI (14)</div>
          <div className="text-lg font-bold">{rsi.toFixed(1)}</div>
        </div>
      </div>
      <div className="flex gap-2">
        <Badge variant={signal === "COMPRA" ? "default" : "destructive"}>
          Señal: {signal}
        </Badge>
        <Badge variant={rsiSignal === "NEUTRAL" ? "secondary" : "outline"}>
          RSI: {rsiSignal}
        </Badge>
      </div>
    </div>
  );
});
TechnicalAnalysis.displayName = "TechnicalAnalysis";

// ─── Perfil de empresa ───
const CompanyProfile = memo(({ quote }: { quote: QuoteData | null }) => {
  if (!quote) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Cargando perfil...
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="font-semibold text-lg">{quote.name}</div>
      <div className="text-sm text-muted-foreground">{quote.exchange}</div>
      <div className="text-sm">
        <span className="text-muted-foreground">Símbolo:</span> {quote.symbol}
      </div>
      <div className="text-sm">
        <span className="text-muted-foreground">Moneda:</span> {quote.currency}
      </div>
      <div className="text-sm">
        <span className="text-muted-foreground">Precio:</span> {quote.price.toFixed(2)} {quote.currency}
      </div>
    </div>
  );
});
CompanyProfile.displayName = "CompanyProfile";

// ─── Resumen de mercados ───
const MarketOverview = memo(() => {
  const [quotes, setQuotes] = useState<QuoteData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const symbols = [
      "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META",
      "^GSPC", "^DJI", "^IXIC",
      "BTC-USD", "ETH-USD",
      "^BVSP", "^MERV", "^MXX",
      "GC=F", "SI=F", "CL=F",
    ];
    Promise.all(symbols.map((s) => fetchQuote(s))).then((results) => {
      setQuotes(results.filter((q): q is QuoteData => q !== null));
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Cargando mercados...
      </div>
    );
  }

  const groups: { title: string; items: QuoteData[] }[] = [
    { title: "Acciones", items: quotes.filter((q) => ["AAPL","MSFT","GOOGL","AMZN","TSLA","META"].includes(q.symbol)) },
    { title: "Índices", items: quotes.filter((q) => ["^GSPC","^DJI","^IXIC"].includes(q.symbol)) },
    { title: "Crypto", items: quotes.filter((q) => ["BTC-USD","ETH-USD"].includes(q.symbol)) },
    { title: "Latinoamérica", items: quotes.filter((q) => ["^BVSP","^MERV","^MXX"].includes(q.symbol)) },
    { title: "Commodities", items: quotes.filter((q) => ["GC=F","SI=F","CL=F"].includes(q.symbol)) },
  ];

  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <div key={g.title}>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">{g.title}</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {g.items.map((q) => {
              const isUp = q.change >= 0;
              return (
                <div key={q.symbol} className="bg-muted/50 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground truncate">{q.symbol}</div>
                  <div className="font-semibold">{q.price.toFixed(2)}</div>
                  <div className={`text-xs ${isUp ? "text-green-500" : "text-red-500"}`}>
                    {isUp ? "+" : ""}{q.changePercent.toFixed(2)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
});
MarketOverview.displayName = "MarketOverview";

// ─── Noticias ───
const NewsList = memo(({ news, loading }: { news: NewsItem[]; loading: boolean }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Cargando noticias...
      </div>
    );
  }

  if (news.length === 0) {
    return <div className="text-sm text-muted-foreground">No hay noticias disponibles</div>;
  }

  return (
    <div className="space-y-3">
      {news.map((n, i) => (
        <a
          key={i}
          href={n.link}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
        >
          <div className="text-sm font-medium line-clamp-2">{n.title}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {n.publisher} · {n.date ? new Date(n.date * 1000).toLocaleDateString() : ""}
          </div>
        </a>
      ))}
    </div>
  );
});
NewsList.displayName = "NewsList";

// ─── Componente principal ───
export default function MarketExplorer() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [searchTerm, setSearchTerm] = useState("");
  const [searching, setSearching] = useState(false);
  const [activeSymbol, setActiveSymbol] = useState<string | null>(() => {
    try {
      return localStorage.getItem("market-last-symbol") || null;
    } catch { return null; }
  });
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

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

  useEffect(() => {
    if (activeSymbol) {
      try { localStorage.setItem("market-last-symbol", activeSymbol); } catch {}
    }
  }, [activeSymbol]);

  useEffect(() => {
    if (!activeSymbol || !isOnline) return;
    setDataLoading(true);
    Promise.all([fetchQuote(activeSymbol), fetchChart(activeSymbol)]).then(([q, c]) => {
      setQuote(q);
      setChartData(c);
      setDataLoading(false);
    });
  }, [activeSymbol, isOnline]);

  useEffect(() => {
    if (!activeSymbol || !isOnline) return;
    setNewsLoading(true);
    fetchNews(activeSymbol).then((n) => {
      setNews(n);
      setNewsLoading(false);
    });
  }, [activeSymbol, isOnline]);

  const handleSearch = async () => {
    const q = searchTerm.trim();
    if (!q) return;
    setSearching(true);
    const found = await searchSymbol(q);
    setActiveSymbol(found || q.toUpperCase());
    setSearching(false);
  };

  const selectSymbol = (symbol: string) => {
    setSearchTerm(symbol);
    setActiveSymbol(symbol);
  };

  return (
    <div className="space-y-4">
      {!isOnline && (
        <Alert variant="destructive">
          <WifiOff className="h-4 w-4" />
          <AlertTitle>Sin Conexión a Internet</AlertTitle>
          <AlertDescription>
            Esta sección requiere conexión a internet para mostrar datos actualizados del mercado.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <Input
          placeholder="Buscar símbolo (ej: AAPL, Bitcoin, Oro)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          disabled={!isOnline}
        />
        <Button onClick={handleSearch} disabled={!isOnline || !searchTerm.trim() || searching}>
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-muted-foreground self-center">Populares:</span>
        {popularSymbols.map((s) => (
          <Badge
            key={s.symbol}
            variant={activeSymbol === s.symbol ? "default" : "outline"}
            className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
            onClick={() => selectSymbol(s.symbol)}
          >
            {s.name}
          </Badge>
        ))}
      </div>

      {isOnline && activeSymbol ? (
        <div className="space-y-4">
          <Card className="bg-card-widget border-muted">
            <CardContent className="pt-4">
              {dataLoading ? (
                <div className="flex items-center justify-center h-[120px] text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Cargando...
                </div>
              ) : (
                <SymbolInfo quote={quote} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Gráfico en Tiempo Real
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CandleChart data={chartData} symbol={activeSymbol} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Newspaper className="h-4 w-4 text-primary" />
                Noticias y Análisis de {activeSymbol}
              </CardTitle>
              <CardDescription>
                Cobertura periodística del activo, actualizada en tiempo real
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NewsList news={news} loading={newsLoading} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-card-widget border-muted">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Análisis Técnico
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TechnicalAnalysis data={chartData} />
              </CardContent>
            </Card>

            <Card className="bg-card-widget border-muted">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  Perfil de la Empresa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CompanyProfile quote={quote} />
              </CardContent>
            </Card>
          </div>
        </div>
      ) : isOnline ? (
        <Card>
          <CardContent className="pt-4">
            <MarketOverview />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
