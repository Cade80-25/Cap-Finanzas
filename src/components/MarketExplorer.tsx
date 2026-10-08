import { useState, useEffect, useRef, memo } from "react";
import { Search, Wifi, WifiOff, TrendingUp, BarChart3, Globe, Loader2, Newspaper } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const popularSymbols = [
  { symbol: "NASDAQ:AAPL", name: "Apple" },
  { symbol: "NASDAQ:MSFT", name: "Microsoft" },
  { symbol: "NASDAQ:GOOGL", name: "Google" },
  { symbol: "NASDAQ:AMZN", name: "Amazon" },
  { symbol: "NASDAQ:TSLA", name: "Tesla" },
  { symbol: "NASDAQ:META", name: "Meta" },
  { symbol: "NASDAQ:NVDA", name: "Nvidia" },
  { symbol: "NASDAQ:NFLX", name: "Netflix" },
  { symbol: "NYSE:JPM", name: "JPMorgan" },
  { symbol: "BINANCE:BTCUSDT", name: "Bitcoin" },
  { symbol: "BINANCE:ETHUSDT", name: "Ethereum" },
  { symbol: "SP:SPX", name: "S&P 500" },
  { symbol: "TVC:GOLD", name: "Oro" },
  { symbol: "OANDA:EURUSD", name: "Euro/Dólar" },
];

// TradingView Chart Widget
const TradingViewChart = memo(({ symbol }: { symbol: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: symbol,
      interval: "D",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "es",
      allow_symbol_change: true,
      calendar: false,
      support_host: "https://www.tradingview.com",
    });

    containerRef.current.appendChild(script);
  }, [symbol]);

  return (
    <div className="tradingview-widget-container" style={{ height: 500, width: "100%" }}>
      <div ref={containerRef} style={{ height: "100%", width: "100%" }} />
    </div>
  );
});
TradingViewChart.displayName = "TradingViewChart";

// TradingView Symbol Info Widget
const TradingViewSymbolInfo = memo(({ symbol }: { symbol: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol: symbol,
      width: "100%",
      locale: "es",
      colorTheme: "dark",
      isTransparent: true,
    });

    containerRef.current.appendChild(script);
  }, [symbol]);

  return (
    <div className="tradingview-widget-container">
      <div ref={containerRef} />
    </div>
  );
});
TradingViewSymbolInfo.displayName = "TradingViewSymbolInfo";

// TradingView Company Profile Widget
const TradingViewProfile = memo(({ symbol }: { symbol: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-symbol-profile.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      width: "100%",
      height: 400,
      symbol: symbol,
      colorTheme: "dark",
      isTransparent: true,
      locale: "es",
    });

    containerRef.current.appendChild(script);
  }, [symbol]);

  return (
    <div className="tradingview-widget-container" style={{ height: 400 }}>
      <div ref={containerRef} style={{ height: "100%" }} />
    </div>
  );
});
TradingViewProfile.displayName = "TradingViewProfile";

// TradingView Technical Analysis Widget
const TradingViewAnalysis = memo(({ symbol }: { symbol: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      interval: "1D",
      width: "100%",
      isTransparent: true,
      height: 400,
      symbol: symbol,
      showIntervalTabs: true,
      displayMode: "single",
      locale: "es",
      colorTheme: "dark",
    });

    containerRef.current.appendChild(script);
  }, [symbol]);

  return (
    <div className="tradingview-widget-container" style={{ height: 400 }}>
      <div ref={containerRef} style={{ height: "100%" }} />
    </div>
  );
});
TradingViewAnalysis.displayName = "TradingViewAnalysis";

// Market Overview Widget (shown by default)
const TradingViewOverview = memo(() => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme: "dark",
      dateRange: "1D",
      showChart: true,
      locale: "es",
      width: "100%",
      height: 550,
      largeChartUrl: "",
      isTransparent: true,
      showSymbolLogo: true,
      showFloatingTooltip: true,
      tabs: [
        {
          title: "Acciones",
          symbols: [
            { s: "NASDAQ:AAPL", d: "Apple" },
            { s: "NASDAQ:MSFT", d: "Microsoft" },
            { s: "NASDAQ:GOOGL", d: "Google" },
            { s: "NASDAQ:AMZN", d: "Amazon" },
            { s: "NASDAQ:TSLA", d: "Tesla" },
            { s: "NASDAQ:META", d: "Meta" },
          ],
        },
        {
          title: "Índices",
          symbols: [
            { s: "FOREXCOM:SPXUSD", d: "S&P 500" },
            { s: "FOREXCOM:DJI", d: "Dow Jones" },
            { s: "FOREXCOM:NSXUSD", d: "NASDAQ 100" },
          ],
        },
        {
          title: "Crypto",
          symbols: [
            { s: "BINANCE:BTCUSDT", d: "Bitcoin" },
            { s: "BINANCE:ETHUSDT", d: "Ethereum" },
            { s: "BINANCE:SOLUSDT", d: "Solana" },
          ],
        },
        {
          title: "Latinoamérica",
          symbols: [
            { s: "BMFBOVESPA:IBOV", d: "Bovespa (Brasil)" },
            { s: "SP:IMV", d: "Merval (Argentina)" },
            { s: "BMV:ME", d: "IPC (México)" },
          ],
        },
        {
          title: "Commodities",
          symbols: [
            { s: "TVC:GOLD", d: "Oro" },
            { s: "TVC:SILVER", d: "Plata" },
            { s: "NYMEX:CL1!", d: "Petróleo" },
          ],
        },
      ],
    });

    containerRef.current.appendChild(script);
  }, []);

  return (
    <div className="tradingview-widget-container" style={{ height: 550 }}>
      <div ref={containerRef} style={{ height: "100%" }} />
    </div>
  );
});
TradingViewOverview.displayName = "TradingViewOverview";

// Noticias del activo (TradingView Timeline)
const TradingViewNews = memo(({ symbol }: { symbol: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-timeline.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      feedMode: "symbol",
      symbol: symbol,
      isTransparent: true,
      displayMode: "regular",
      width: "100%",
      height: 460,
      colorTheme: "light",
      locale: "es",
    });
    containerRef.current.appendChild(script);
  }, [symbol]);

  return (
    <div className="tradingview-widget-container" ref={containerRef} style={{ height: 460 }}>
      <div className="tradingview-widget-container__widget" />
    </div>
  );
});
TradingViewNews.displayName = "TradingViewNews";

// Buscar simbolo en la API de TradingView
async function searchSymbol(query: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://symbol-search.tradingview.com/symbol_search/?text=${encodeURIComponent(query)}&lang=es`,
      { headers: { 'Origin': 'https://www.tradingview.com' } }
    );
    const data = await res.json();
    if (data && data.length > 0) {
      const r = data[0];
      return `${r.exchange}:${r.symbol}`;
    }
  } catch {}
  return null;
}

export default function MarketExplorer() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [searchTerm, setSearchTerm] = useState("");
  const [searching, setSearching] = useState(false);
  const [activeSymbol, setActiveSymbol] = useState<string | null>(() => {
    try {
      return localStorage.getItem("market-last-symbol") || null;
    } catch { return null; }
  });

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

  const handleSearch = async () => {
    const q = searchTerm.trim();
    if (!q) return;
    setSearching(true);
    // Si ya tiene exchange, usar directo
    if (q.includes(':')) {
      setActiveSymbol(q.toUpperCase());
      return;
    }
    // Buscar en TradingView
    const found = await searchSymbol(q);
    if (found) {
      setActiveSymbol(found);
    } else {
      // Si no se encuentra, intentar con el texto original
      setActiveSymbol(q.toUpperCase());
    }
    setSearching(false);
  };

  const selectSymbol = (symbol: string) => {
    setSearchTerm(symbol);
    setActiveSymbol(symbol);
  };

  return (
    <div className="space-y-4">
      {/* Only show alert when offline */}
      {!isOnline && (
        <Alert variant="destructive">
          <WifiOff className="h-4 w-4" />
          <AlertTitle>Sin Conexión a Internet</AlertTitle>
          <AlertDescription>
            Esta sección requiere conexión a internet para mostrar datos actualizados del mercado.
          </AlertDescription>
        </Alert>
      )}

      {/* Search */}
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

      {/* Popular symbols */}
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
          {/* Symbol Info */}
          <Card className="bg-card-widget border-muted">
            <CardContent className="pt-4">
              <TradingViewSymbolInfo symbol={activeSymbol} />
            </CardContent>
          </Card>

          {/* Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Gráfico en Tiempo Real
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TradingViewChart symbol={activeSymbol} />
            </CardContent>
          </Card>

          {/* Noticias del activo */}
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
              <TradingViewNews symbol={activeSymbol} />
            </CardContent>
          </Card>

          {/* Analysis & Profile */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-card-widget border-muted">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Análisis Técnico
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TradingViewAnalysis symbol={activeSymbol} />
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
                <TradingViewProfile symbol={activeSymbol} />
              </CardContent>
            </Card>
          </div>
        </div>
      ) : isOnline ? (
        <Card>
          <CardContent className="pt-4">
            <TradingViewOverview />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
