import { useState, useEffect, useRef, useMemo, memo } from "react";
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
  // Datos de decisión (meta del chart, sin endpoints bloqueados)
  dayHigh: number | null;
  dayLow: number | null;
  volume: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  prevClose: number | null;
  sessionStart: number | null; // epoch de apertura de la sesión (hora del exchange)
  sessionEnd: number | null;   // epoch de cierre
  sessionOpen: number | null;   // precio de apertura de la sesión
  gmtoffset: number | null;    // offset del exchange en segundos
  marketTime: number | null;    // epoch del último precio
  instrumentType: string | null;
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

// ─── Debug ───
// Buffer a nivel de módulo: addDebug se llama desde funciones de módulo
// (yfFetch), por lo que NO puede usar el setState del componente directamente
// (ReferenceError en runtime, tragado por los catch de fetchQuote → "Cargando..." eterno).
const debugBuf: string[] = [];
const debugListeners = new Set<(msgs: string[]) => void>();
function addDebug(msg: string) {
  debugBuf.push(msg);
  if (debugBuf.length > 5) debugBuf.shift();
  debugListeners.forEach((fn) => fn([...debugBuf]));
}

// ─── Rangos del gráfico ───
// 1D/5D usan velas intradía (5m) → se mueven mientras el mercado está abierto
const CHART_RANGES = [
  { id: "1d", label: "1D", interval: "5m", range: "1d" },
  { id: "5d", label: "5D", interval: "15m", range: "5d" },
  { id: "3mo", label: "3M", interval: "1d", range: "3mo" },
  { id: "6mo", label: "6M", interval: "1d", range: "6mo" },
  { id: "1y", label: "1A", interval: "1d", range: "1y" },
  { id: "5y", label: "5A", interval: "1wk", range: "5y" },
] as const;
type RangeId = (typeof CHART_RANGES)[number]["id"];

// ─── Fetch vía proxy de Electron (evita CORS) ───
async function yfFetch(url: string): Promise<any> {
  const hasElectron = typeof window !== 'undefined' && (window as any).electron;
  const hasProxy = hasElectron && (window as any).electron?.yahooFinance;
  addDebug('electron: ' + hasElectron + ', proxy: ' + hasProxy);
  
  if (hasProxy) {
    try {
      addDebug('calling proxy...');
      const result = await (window as any).electron.yahooFinance(url);
      addDebug('proxy result: ' + JSON.stringify(result).slice(0, 100));
      if (result && !result.error) return result;
      addDebug('proxy error: ' + (result?.error || 'unknown'));
    } catch (e: any) {
      addDebug('proxy exception: ' + e.message);
    }
  }
  
  // Fallback: fetch directo sin User-Agent (Yahoo lo rechaza)
  addDebug('trying direct fetch...');
  try {
    const res = await fetch(url);
    addDebug('direct fetch status: ' + res.status);
    return res.json();
  } catch (e: any) {
    addDebug('direct fetch error: ' + e.message);
    throw e;
  }
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
    const ctp = meta.currentTradingPeriod?.regular;
    return {
      symbol: meta.symbol || symbol,
      price,
      change,
      changePercent,
      currency: meta.currency || "USD",
      exchange: meta.fullExchangeName || meta.exchangeName || "",
      name: meta.longName || meta.shortName || symbol,
      dayHigh: meta.regularMarketDayHigh ?? null,
      dayLow: meta.regularMarketDayLow ?? null,
      volume: meta.regularMarketVolume ?? null,
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh ?? null,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow ?? null,
      prevClose: prevClose ?? null,
      sessionStart: ctp?.start ?? null,
      sessionEnd: ctp?.end ?? null,
      sessionOpen: (result.indicators?.quote?.[0]?.open || []).find((v: number | null) => v != null) ?? null,
      gmtoffset: meta.gmtoffset ?? null,
      marketTime: meta.regularMarketTime ?? null,
      instrumentType: meta.instrumentType ?? null,
    };
  } catch {
    return null;
  }
}

async function fetchChart(symbol: string, rangeId: RangeId = "3mo"): Promise<ChartData | null> {
  try {
    const cfg = CHART_RANGES.find((r) => r.id === rangeId) || CHART_RANGES[2];
    const data = await yfFetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${cfg.interval}&range=${cfg.range}`
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

// ─── Cinta de precios (spark: multi-símbolo en UN request) ───
// Como el "Ticker" de las terminales: precios que se mueven en un carrusel
const TICKER_SYMBOLS = [
  "^GSPC", "^IXIC", "^DJI",        // índices EE.UU.
  "AAPL", "MSFT", "NVDA", "TSLA",  // tech
  "BTC-USD", "ETH-USD",            // crypto
  "GC=F", "CL=F",                  // oro y petróleo
  "EURUSD=X", "UYU=X",             // divisas
  "^BVSP", "^MERV",                // LatAm
];

interface TickerItem {
  symbol: string;
  shortName?: string;
  price: number;
  changePercent: number;
  sessionStart?: number | null; // epoch de apertura de sesión (para el cronograma mundial)
  sessionEnd?: number | null;
  gmtoffset?: number | null;
  marketTime?: number | null;
  direction: "up" | "down" | "flat";
}

async function fetchTicker(): Promise<TickerItem[]> {
  try {
    const symbols = TICKER_SYMBOLS.join(",");
    const data = await yfFetch(
      `https://query1.finance.yahoo.com/v7/finance/spark?symbols=${encodeURIComponent(symbols)}&range=1d&interval=5m`
    );
    const results = data?.spark?.result || [];
    return results.map((r: any) => {
      const resp = r?.response?.[0];
      const meta = resp?.meta || {};
      const close = resp?.close || [];
      const first = close[0] ?? meta.chartPreviousClose ?? meta.previousClose ?? 0;
      const last = close[close.length - 1] ?? meta.regularMarketPrice ?? 0;
      const pct = first ? ((last - first) / first) * 100 : 0;
      return {
        symbol: r.symbol || meta.symbol,
        shortName: meta.shortName || r.symbol,
        price: last,
        changePercent: pct,
        direction: pct > 0.001 ? "up" : pct < -0.001 ? "down" : "flat",
      } as TickerItem;
    }).filter((t: TickerItem) => t.price > 0);
  } catch {
    return [];
  }
}

// ─── Estado del mercado: ABIERTO / CERRADO / PRE / POST ───
function marketStatus(quote: QuoteData): { label: string; open: boolean; eta: string | null } {
  if (!quote.marketTime || !quote.sessionStart || !quote.sessionEnd) {
    return { label: "—", open: false, eta: null };
  }
  const now = quote.marketTime; // epoch del último tick (aprox "ahora" en tiempo de mercado)
  if (now >= quote.sessionStart && now <= quote.sessionEnd) {
    return { label: "MERCADO ABIERTO", open: true, eta: null };
  }
  // mercado cerrado: calcular próx apertura en hora local del exchange
  const opensIn = quote.sessionStart - now;
  if (opensIn > 0 && opensIn < 86400 * 2) {
    const h = Math.floor(opensIn / 3600);
    const m = Math.floor((opensIn % 3600) / 60);
    return { label: "CERRADO — abre en", open: false, eta: `${h}h ${m}m` };
  }
  return { label: "MERCADO CERRADO", open: false, eta: null };
}

// ─── Formatos ───
function fmtNum(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return "—";
  return n.toLocaleString("es-UY", { maximumFractionDigits: 2 });
}
function fmtVol(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return "—";
  if (n >= 1e12) return (n / 1e12).toFixed(1) + " T";
  if (n >= 1e9) return (n / 1e9).toFixed(1) + " MM M";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + " M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + " K";
  return String(n);
}
function fmtExTime(epoch: number | null, gmtoffset: number | null, withDate = false): string {
  // hora en el huso del EXCHANGE (no del usuario) — como lo muestran las terminales.
  // Truco: desplazar el epoch por gmtoffset y formatear en UTC = hora de pared del exchange,
  // sin depender de zonas "Etc/GMT±X" (POSIX invierte el signo y "Etc/GMT4" es inválida).
  if (!epoch) return "—";
  try {
    const d = gmtoffset != null ? new Date((epoch + gmtoffset) * 1000) : new Date(epoch * 1000);
    const opts: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" };
    if (withDate) { opts.day = "2-digit"; opts.month = "2-digit"; }
    return new Intl.DateTimeFormat("es-UY", opts).format(d);
  } catch {
    return "—";
  }
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

    // Eje X (fechas): en intradía mostrar hora local de NY, en diario fecha
    ctx.textAlign = "center";
    const dateCount = Math.min(5, data.timestamp.length);
    const tz = "America/New_York";
    for (let i = 0; i < dateCount; i++) {
      const idx = Math.floor((data.timestamp.length - 1) * (i / (dateCount - 1 || 1)));
      const ts = data.timestamp[idx];
      if (!ts) continue;
      // hora de la bolsa (NY) para que coincida con lo que ve el usuario en la web
      const d = new Date(ts * 1000);
      const intraDay = data.timestamp.length > 0 && (data.timestamp[data.timestamp.length - 1] - data.timestamp[0]) < 86400 * 2;
      let label: string;
      try {
        label = intraDay
          ? d.toLocaleTimeString("es-UY", { timeZone: tz, hour: "2-digit", minute: "2-digit" })
          : `${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(2)}`;
      } catch {
        label = `${d.getMonth() + 1}/${d.getDate()}`;
      }
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

// ─── Cinta de precios (carrusel animado, tipo Ticker de TV) ───
const PriceTicker = memo(({ items, onSymbolClick }: { items: TickerItem[]; onSymbolClick: (s: string) => void }) => {
  if (items.length === 0) return null;
  // duplicar para el loop infinito del carrusel CSS
  const doubled = [...items, ...items];
  return (
    <div className="overflow-hidden border rounded-lg bg-card">
      <div
        className="flex gap-6 py-2 whitespace-nowrap"
        style={{
          animation: "ticker-scroll 60s linear infinite",
          width: "max-content",
        }}
      >
        {doubled.map((t, i) => (
          <button
            key={`${t.symbol}-${i}`}
            onClick={() => onSymbolClick(t.symbol)}
            className="inline-flex items-baseline gap-1.5 text-sm hover:opacity-80 transition-opacity"
            title={`Ver ${t.shortName}`}
          >
            <span className="font-semibold">{t.symbol}</span>
            <span>{t.price.toLocaleString("es-UY", { maximumFractionDigits: 2 })}</span>
            <span
              className={`text-xs font-medium ${
                t.direction === "up" ? "text-green-500" : t.direction === "down" ? "text-red-500" : "text-muted-foreground"
              }`}
            >
              {t.direction === "up" ? "▲" : t.direction === "down" ? "▼" : "="}
              {t.changePercent >= 0 ? "+" : ""}{t.changePercent.toFixed(2)}%
            </span>
          </button>
        ))}
      </div>
    </div>
  );
});
PriceTicker.displayName = "PriceTicker";

// ─── Panel de decisión (como el resumen de IBKR / eToro) ───
const DecisionPanel = memo(({ quote, prevQuote }: { quote: QuoteData | null; prevQuote: QuoteData | null }) => {
  if (!quote) {
    return (
      <div className="flex items-center justify-center h-[100px] text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Cargando datos...
      </div>
    );
  }

  const status = marketStatus(quote);
  // destello cuando el precio cambia (verde si subió, rojo si bajó) — feedback visual "en vivo"
  const priceMoved = prevQuote && prevQuote.price !== quote.price;
  const flash = priceMoved ? (quote.price > prevQuote!.price ? "flash-green" : "flash-red") : "";
  const range52 = quote.fiftyTwoWeekHigh && quote.fiftyTwoWeekLow
    ? ((quote.price - quote.fiftyTwoWeekLow) / (quote.fiftyTwoWeekHigh - quote.fiftyTwoWeekLow)) * 100
    : null;
  // posición del precio dentro del rango del día (barra)
  const dayRange = quote.dayHigh != null && quote.dayLow != null && quote.dayHigh > quote.dayLow
    ? ((quote.price - quote.dayLow) / (quote.dayHigh - quote.dayLow)) * 100
    : null;

  return (
    <div className="space-y-4">
      {/* Precio con destello + estado del mercado */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-3 flex-wrap">
          <span
            key={`${quote.marketTime}-${quote.price}`}
            className={`text-3xl font-bold price-cell ${flash}`}
          >
            {quote.price.toFixed(2)}
          </span>
          <span className="text-sm text-muted-foreground">{quote.currency}</span>
          <span className={`flex items-center gap-1 text-sm font-medium ${quote.change >= 0 ? "text-green-500" : "text-red-500"}`}>
            {quote.change >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
            {quote.change >= 0 ? "+" : ""}{quote.change.toFixed(2)} ({quote.change >= 0 ? "+" : ""}{quote.changePercent.toFixed(2)}%)
          </span>
        </div>
        <Badge variant={status.open ? "default" : "secondary"} className="gap-1">
          <span className={`inline-block h-2 w-2 rounded-full ${status.open ? "bg-green-400 animate-pulse" : "bg-gray-400"}`} />
          {status.label} {status.eta ? status.eta : ""}
        </Badge>
      </div>

      {/* Rango del día: barra con la posición del precio actual */}
      {dayRange != null && (
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Mín del día {fmtNum(quote.dayLow)}</span>
            <span>Máx del día {fmtNum(quote.dayHigh)}</span>
          </div>
          <div className="h-2 rounded-full bg-muted relative overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-red-400 via-yellow-400 to-green-500" style={{ width: "100%" }} />
            <div
              className="absolute top-[-3px] h-3.5 w-1.5 rounded-sm bg-foreground shadow"
              style={{ left: `calc(${Math.min(98, Math.max(2, dayRange))}% - 3px)` }}
            />
          </div>
          <div className="text-xs text-center text-muted-foreground mt-1">
            El precio está en el {dayRange.toFixed(0)}% del rango del día
          </div>
        </div>
      )}

      {/* Grid de datos de decisión */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-muted/50 rounded-lg p-2.5">
          <div className="text-[11px] text-muted-foreground">Apertura</div>
          <div className="text-sm font-semibold">{fmtNum(quote.sessionOpen ?? quote.dayLow)}</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-2.5">
          <div className="text-[11px] text-muted-foreground">Cierre previo</div>
          <div className="text-sm font-semibold">{fmtNum(quote.prevClose)}</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-2.5">
          <div className="text-[11px] text-muted-foreground">Volumen</div>
          <div className="text-sm font-semibold">{fmtVol(quote.volume)}</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-2.5">
          <div className="text-[11px] text-muted-foreground">Rango 52 sem.</div>
          <div className="text-sm font-semibold">
            {quote.fiftyTwoWeekLow ? fmtNum(quote.fiftyTwoWeekLow) : "—"} – {quote.fiftyTwoWeekHigh ? fmtNum(quote.fiftyTwoWeekHigh) : "—"}
          </div>
        </div>
      </div>

      {/* Posición en 52 semanas */}
      {range52 != null && (
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Mín 52 sem. {fmtNum(quote.fiftyTwoWeekLow)}</span>
            <span>Máx 52 sem. {fmtNum(quote.fiftyTwoWeekHigh)}</span>
          </div>
          <div className="h-2 rounded-full bg-muted relative overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-red-400 via-yellow-400 to-green-500" style={{ width: "100%" }} />
            <div
              className="absolute top-[-3px] h-3.5 w-1.5 rounded-sm bg-foreground shadow"
              style={{ left: `calc(${Math.min(98, Math.max(2, range52))}% - 3px)` }}
            />
          </div>
          <div className="text-xs text-center text-muted-foreground mt-1">
            {range52.toFixed(0)}% del rango de 52 semanas — {range52 > 70 ? "cerca de máximos anuales" : range52 < 30 ? "cerca de mínimos anuales" : "en zona media anual"}
          </div>
        </div>
      )}

      {/* Hora del exchange */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>Sesión: {fmtExTime(quote.sessionStart, quote.gmtoffset)} – {fmtExTime(quote.sessionEnd, quote.gmtoffset)} (hora de {quote.exchange || "exchange"})</span>
      </div>
    </div>
  );
});
DecisionPanel.displayName = "DecisionPanel";

// ─── Información del símbolo (usada por el perfil de empresa) ───
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

// ─── Tablero global de mercados (réplica de finance.yahoo.com/markets) ───

// Batches de máx 20 símbolos (límite verificado del endpoint spark)
async function fetchSparkBatch(symbols: string[]): Promise<Map<string, TickerItem & { closes: number[] }>> {
  const out = new Map<string, TickerItem & { closes: number[] }>();
  if (symbols.length === 0) return out;
  try {
    const data = await yfFetch(
      `https://query1.finance.yahoo.com/v7/finance/spark?symbols=${encodeURIComponent(symbols.join(","))}&range=1d&interval=5m`
    );
    for (const r of data?.spark?.result || []) {
      const resp = r?.response?.[0];
      const m = resp?.meta || {};
      const closes: number[] = (resp?.indicators?.quote?.[0]?.close || []).filter((v: number | null) => v != null);
      const price = m.regularMarketPrice ?? closes[closes.length - 1] ?? 0;
      if (!price) continue;
      const pct = m.regularMarketChangePercent ?? m.fulldayChangePercent ?? 0;
      out.set(r.symbol, {
        symbol: r.symbol,
        shortName: m.shortName || m.longName || r.symbol,
        price,
        changePercent: pct,
        direction: pct > 0.001 ? "up" : pct < -0.001 ? "down" : "flat",
        closes,
        sessionStart: (m.currentTradingPeriod?.regular?.start as number) ?? null,
        sessionEnd: (m.currentTradingPeriod?.regular?.end as number) ?? null,
        gmtoffset: m.gmtoffset ?? null,
        marketTime: m.regularMarketTime ?? null,
      });
    }
  } catch {}
  return out;
}

// Símbolos del tablero, agrupados como la página Markets de Yahoo
const BOARD = {
  indices: {
    america: ["^GSPC", "^DJI", "^IXIC", "^RUT", "^VIX", "^BVSP", "^MERV", "^MXX", "^GSPTSE", "^IPSA"],
    europe: ["^STOXX50E", "^FTSE", "^GDAXI", "^FCHI", "^IBEX", "^FTMIB", "^AEX", "^SSMI"],
    asia: ["^N225", "^HSI", "000001.SS", "^AXJO", "^KS11", "^TWII", "^BSESN", "^JKSE"],
  },
  commodities: ["GC=F", "SI=F", "CL=F", "NG=F", "HG=F", "PL=F", "ZW=F", "ZC=F", "KC=F", "CC=F"],
  currencies: ["EURUSD=X", "USDJPY=X", "GBPUSD=X", "UYU=X", "USDBRL=X", "USDMXN=X", "USDARS=X", "DX-Y.NYB"],
  treasuries: ["^TNX", "^FVX", "^TYX", "^IRX"],
  sectors: ["XLK", "XLF", "XLE", "XLY", "XLP", "XLI", "XLV", "XLU", "XLB", "XLRE", "XLC"],
};
const SECTOR_NAMES: Record<string, string> = {
  XLK: "Tecnología", XLF: "Financiero", XLE: "Energía", XLY: "Consumo discrecional",
  XLP: "Consumo básico", XLI: "Industrial", XLV: "Salud", XLU: "Servicios públicos",
  XLB: "Materiales", XLRE: "Inmobiliario", XLC: "Comunicaciones",
};

// Movers del día vía screener predefinido (sin login, verificado)
async function fetchMovers(kind: "day_gainers" | "day_losers" | "day_losers_active" | "most_actives"): Promise<TickerItem[]> {
  try {
    const data = await yfFetch(
      `https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?scrIds=${kind}&count=8`
    );
    const rows = data?.finance?.result?.[0]?.quotes || [];
    return rows.map((r: any) => ({
      symbol: r.symbol,
      shortName: r.shortName || r.longName || r.symbol,
      price: r.regularMarketPrice ?? 0,
      changePercent: r.regularMarketChangePercent ?? 0,
      direction: (r.regularMarketChangePercent ?? 0) > 0 ? "up" : (r.regularMarketChangePercent ?? 0) < 0 ? "down" : "flat",
    })).filter((t: TickerItem) => t.price > 0);
  } catch { return []; }
}

async function fetchTrending(): Promise<TickerItem[]> {
  try {
    const data = await yfFetch("https://query1.finance.yahoo.com/v1/finance/trending/US?count=10");
    const quotes = data?.finance?.result?.[0]?.quotes || [];
    return quotes.map((q: any) => ({
      symbol: q.symbol,
      shortName: q.shortName || q.longName || q.symbol,
      price: 0,
      changePercent: 0,
      direction: "flat" as const,
    }));
  } catch { return []; }
}

// Sparkline SVG mini (la firma visual de Yahoo Finance)
const Sparkline = memo(({ closes, up }: { closes: number[]; up: boolean }) => {
  if (closes.length < 2) return <div className="w-[60px] h-[24px]" />;
  const min = Math.min(...closes), max = Math.max(...closes);
  const span = max - min || 1;
  const pts = closes.map((c, i) => `${(i / (closes.length - 1)) * 60},${24 - ((c - min) / span) * 20 - 2}`).join(" ");
  const color = up ? "#22c55e" : "#ef4444";
  return (
    <svg width="60" height="24" className="shrink-0">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
});
Sparkline.displayName = "Sparkline";

// Fila de instrumento con destello al cambiar el precio
const BoardRow = memo(({ item, prev, onClick }: { item: TickerItem & { closes?: number[] }; prev?: TickerItem; onClick?: () => void }) => {
  const moved = prev && prev.price !== item.price;
  const flashClass = moved ? (item.price > prev!.price ? "flash-green" : "flash-red") : "";
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg hover:bg-muted/60 transition-colors text-left"
    >
      <div className="min-w-0 flex-1">
        <div className="text-xs text-muted-foreground truncate">{item.shortName || item.symbol}</div>
        <div className="text-[11px] text-muted-foreground/70">{item.symbol}</div>
      </div>
      <Sparkline closes={item.closes || []} up={item.changePercent >= 0} />
      <div className="text-right shrink-0">
        <div key={`${item.price}`} className={`text-sm font-semibold px-1.5 rounded price-cell ${flashClass}`}>
          {item.price.toLocaleString("es-UY", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
        </div>
        <div className={`text-xs font-medium ${item.changePercent >= 0 ? "text-green-500" : "text-red-500"}`}>
          {item.changePercent >= 0 ? "▲" : "▼"} {Math.abs(item.changePercent).toFixed(2)}%
        </div>
      </div>
    </button>
  );
});
BoardRow.displayName = "BoardRow";

// Countdown de cierre de sesión (como "U.S. markets close in 2h 22m")
function useMarketCountdown(quote: QuoteData | null): string | null {
  const [, force] = useState(0);
  useEffect(() => {
    const t = setInterval(() => force((x) => x + 1), 15_000); // cotización viva: cada 15 s
    return () => clearInterval(t);
  }, []);
  if (!quote?.sessionEnd || !quote?.marketTime) return null;
  const remaining = quote.sessionEnd - Math.floor(Date.now() / 1000);
  if (remaining <= 0 || remaining > 86400) return null;
  const h = Math.floor(remaining / 3600), m = Math.floor((remaining % 3600) / 60);
  return `cierra en ${h}h ${m}m`;
}

// ─── Cronograma mundial: estado de cada exchange desde el tradingPeriod de SUS índices ───
// Cada entrada usa el sessionStart/End/gmtoffset del propio símbolo (ya llegan en el batch spark).
const WORLD_MARKETS: { symbol: string; name: string }[] = [
  { symbol: "^GSPC", name: "EE.UU. (NYSE)" },
  { symbol: "^IXIC", name: "EE.UU. (Nasdaq)" },
  { symbol: "^FTSE", name: "Reino Unido (LSE)" },
  { symbol: "^GDAXI", name: "Alemania (XETRA)" },
  { symbol: "^FCHI", name: "Francia (Euronext)" },
  { symbol: "^N225", name: "Japón (TSE)" },
  { symbol: "^HSI", name: "Hong Kong (HKEX)" },
  { symbol: "000001.SS", name: "China (SSE)" },
  { symbol: "^BVSP", name: "Brasil (B3)" },
  { symbol: "^MERV", name: "Argentina (BYMA)" },
  { symbol: "^MXX", name: "México (BMV)" },
  { symbol: "^IPSA", name: "Chile (BCS)" },
];

// Estado de un mercado: ABIERTO/CERRADO + abre en / cierra en, recalculado en vivo
function worldMarketStatus(it: TickerItem | undefined): { open: boolean; label: string; localTime: string } {
  if (!it || !it.sessionStart || !it.sessionEnd || !it.gmtoffset) return { open: false, label: "—", localTime: "—" };
  // "ahora" en tiempo del exchange = último tick del mercado (aproximación viva del reloj)
  const now = Math.floor(Date.now() / 1000);
  const localTime = fmtExTime(now, it.gmtoffset); // hora de pared del exchange AHORA
  const open = now >= it.sessionStart && now <= it.sessionEnd;
  const remaining = open ? it.sessionEnd - now : it.sessionStart - now;
  const h = Math.floor(Math.abs(remaining) / 3600), m = Math.floor((Math.abs(remaining) % 3600) / 60);
  if (open) return { open: true, label: `cierra en ${h}h ${m}m`, localTime };
  if (remaining > 0 && remaining < 86400) return { open: false, label: `abre en ${h}h ${m}m`, localTime };
  if (remaining <= 0) {
    // sesión de hoy terminada y la próxima apertura es MAÑANA a la misma hora
    const nextOpen = it.sessionStart! + 86400;
    const r2 = nextOpen - now;
    if (r2 > 0 && r2 < 86400) {
      const h2 = Math.floor(r2 / 3600), m2 = Math.floor((r2 % 3600) / 60);
      return { open: false, label: `abre en ${h2}h ${m2}m`, localTime };
    }
    return { open: false, label: "fin de semana", localTime };
  }
  return { open: false, label: "fin de semana", localTime };
}

const WorldClocks = memo(({ data }: { data: Record<string, (TickerItem & { closes: number[] })[]> }) => {
  // índice plano de todos los grupos para lookup por símbolo
  const all = useMemo(() => {
    const idx = new Map<string, TickerItem>();
    for (const arr of Object.values(data)) for (const it of arr) idx.set(it.symbol, it);
    return idx;
  }, [data]);
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 text-xs" data-testid="worldclocks">
      {WORLD_MARKETS.map((wm) => {
        const st = worldMarketStatus(all.get(wm.symbol));
        return (
          <div
            key={wm.symbol}
            className={`shrink-0 rounded-lg border px-2.5 py-1.5 flex items-center gap-2 ${
              st.open ? "border-green-500/40 bg-green-500/10" : "border-muted bg-muted/40"
            }`}
          >
            <span className={`inline-block h-2 w-2 rounded-full ${st.open ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
            <div className="leading-tight">
              <div className="font-medium">{wm.name}</div>
              <div className={st.open ? "text-green-500" : "text-muted-foreground"}>
                {st.open ? `ABIERTO · ${st.label}` : `CERRADO · ${st.label}`} · {st.localTime}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});
WorldClocks.displayName = "WorldClocks";

// ─── Tablero completo: la sección que abre cuando NO hay símbolo activo ───
const MarketsBoard = memo(({ onSymbolClick }: { onSymbolClick: (s: string) => void }) => {
  const [data, setData] = useState<Record<string, (TickerItem & { closes: number[] })[]>>({});
  // prev en ref: destello sin re-renders extra
  const dataRef = useRef<Record<string, (TickerItem & { closes: number[] })[]>>({});
  const prevRef = useRef<Record<string, (TickerItem & { closes: number[] })[]>>({});
  const [movers, setMovers] = useState<{ gainers: TickerItem[]; losers: TickerItem[]; actives: TickerItem[] }>({ gainers: [], losers: [], actives: [] });
  const [trending, setTrending] = useState<TickerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState<string | null>(null);
  const [tab, setTab] = useState<"indices" | "commodities" | "currencies" | "treasuries" | "sectors">("indices");

  // carga de todos los grupos (batches paralelos de ≤20) + movers + trending
  const loadAll = async () => {
    const groups: [string, string[]][] = [
      ["america", BOARD.indices.america],
      ["europe", BOARD.indices.europe],
      ["asia", BOARD.indices.asia],
      ["commodities", BOARD.commodities],
      ["currencies", BOARD.currencies],
      ["treasuries", BOARD.treasuries],
      ["sectors", BOARD.sectors],
    ];
    const [maps, g, l, a, tr] = await Promise.all([
      Promise.all(groups.map(([k, syms]) => fetchSparkBatch(syms).then((m) => [k, m] as const))),
      fetchMovers("day_gainers"),
      fetchMovers("day_losers"),
      fetchMovers("most_actives"),
      fetchTrending(),
    ]);
    const next: Record<string, (TickerItem & { closes: number[] })[]> = {};
    const mapList = maps as unknown as [string, Map<string, TickerItem & { closes: number[] }>][];
    for (const [k, m] of mapList) {
      const syms = groups.find(([gk]) => gk === k)![1];
      next[k] = syms.map((s) => m.get(s)).filter(Boolean) as (TickerItem & { closes: number[] })[];
    }
    // destello: el estado mostrado hasta ahora pasa a ser "prev"
    prevRef.current = dataRef.current;
    dataRef.current = next;
    setData(next);
    setMovers({ gainers: g, losers: l, actives: a });
    setTrending(tr);
    setLoading(false);
    setLastUpdate(new Date());
    // countdown de cierre del mercado de EE.UU. desde el tradingPeriod del S&P
    const sp = (next["america"] || []).find((x) => x.symbol === "^GSPC") as any;
    const ctp = sp?.sessionEnd;
    if (ctp) {
      const remaining = ctp - Math.floor(Date.now() / 1000);
      if (remaining > 0 && remaining < 86400) {
        const h = Math.floor(remaining / 3600), m = Math.floor((remaining % 3600) / 60);
        setCountdown(`EE.UU. cierra en ${h}h ${m}m`);
      }
    }
  };

  useEffect(() => {
    loadAll();
    const t = setInterval(loadAll, 15_000); // tablero vivo: cada 15 s (verificado: Yahoo tolera este ritmo)
    return () => clearInterval(t);
  }, []);

  const tabs = [
    { id: "indices" as const, label: "Índices" },
    { id: "commodities" as const, label: "Commodities" },
    { id: "currencies" as const, label: "Divisas" },
    { id: "treasuries" as const, label: "Bonos EE.UU." },
    { id: "sectors" as const, label: "Sectores" },
  ];

  const groupFor = (id: string): (TickerItem & { closes: number[] })[] => {
    if (id === "indices") return [...(data["america"] || []), ...(data["europe"] || []), ...(data["asia"] || [])];
    return data[id] || [];
  };

  const prevFor = (sym: string, group: string): TickerItem | undefined =>
    (prevRef.current[group] || []).find((p) => p.symbol === sym);

  return (
    <div className="space-y-4">
      {/* Cabecera viva */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          MERCADOS EN VIVO
        </span>
        <span>
          {lastUpdate ? `Actualizado ${lastUpdate.toLocaleTimeString("es-UY", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}` : ""}
          {countdown ? ` · ${countdown}` : ""}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[200px] text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Cargando tablero global...
        </div>
      ) : (
        <>
          {/* Cronograma mundial: estado de cada exchange, vivo */}
          <WorldClocks data={data} />

          {/* Movers + Trending: la primera fila de decisión */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { title: "▲ Ganadores del día", items: movers.gainers, cls: "text-green-500" },
              { title: "▼ Perdedores del día", items: movers.losers, cls: "text-red-500" },
              { title: "★ Más activos", items: movers.actives, cls: "text-primary" },
            ].map((sec) => (
              <Card key={sec.title} className="bg-card-widget border-muted">
                <CardHeader className="pb-1 pt-3">
                  <CardTitle className={`text-sm ${sec.cls}`}>{sec.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-1">
                  {sec.items.length === 0 ? (
                    <div className="text-xs text-muted-foreground py-4 text-center">Sin datos</div>
                  ) : (
                    sec.items.slice(0, 5).map((t) => (
                      <button
                        key={t.symbol}
                        onClick={() => onSymbolClick(t.symbol)}
                        className="w-full flex items-center justify-between py-1.5 hover:bg-muted/60 rounded px-1 transition-colors text-left"
                      >
                        <span className="text-xs font-semibold truncate">{t.symbol}</span>
                        <span className="text-xs truncate text-muted-foreground flex-1 px-2">{t.shortName}</span>
                        <span className={`text-xs font-medium ${t.changePercent >= 0 ? "text-green-500" : "text-red-500"}`}>
                          {t.changePercent >= 0 ? "+" : ""}{t.changePercent.toFixed(2)}%
                        </span>
                      </button>
                    ))
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tabs de grupos */}
          <div className="flex gap-1 flex-wrap border-b border-muted pb-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors ${
                  tab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/60"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Grid de filas con sparkline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
            {groupFor(tab).map((item) => {
              const group = tab === "indices" ? (BOARD.indices.america.includes(item.symbol) ? "america" : BOARD.indices.europe.includes(item.symbol) ? "europe" : "asia") : tab;
              const label =
                tab === "sectors"
                  ? SECTOR_NAMES[item.symbol] || item.shortName
                  : item.shortName || item.symbol;
              return (
                <BoardRow
                  key={item.symbol}
                  item={{ ...item, shortName: label }}
                  prev={prevFor(item.symbol, group)}
                  onClick={() => onSymbolClick(item.symbol)}
                />
              );
            })}
          </div>

          {/* Trending tickers */}
          {trending.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">🔥 Tendencia ahora (EE.UU.)</h4>
              <div className="flex flex-wrap gap-2">
                {trending.slice(0, 10).map((t) => (
                  <button
                    key={t.symbol}
                    onClick={() => onSymbolClick(t.symbol)}
                    className="px-2.5 py-1 rounded-full bg-muted/60 hover:bg-muted text-xs font-medium transition-colors"
                  >
                    {t.symbol}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
});
MarketsBoard.displayName = "MarketsBoard";

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
  // Al entrar a /bolsas se muestra el TABLERO GLOBAL (como finance.yahoo.com/markets).
  // El último símbolo queda en localStorage para recuperarlo con un clic en "Volver a X".
  const [activeSymbol, setActiveSymbol] = useState<string | null>(null);
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [prevQuote, setPrevQuote] = useState<QuoteData | null>(null);
  const [tickerItems, setTickerItems] = useState<TickerItem[]>([]);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  // Modo en vivo: auto-refresh cada 30 s mientras el panel esté montado
  const [rangeId, setRangeId] = useState<RangeId>("1d");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [tick, setTick] = useState(0);

  // Debug: suscribirse al buffer de módulo (addDebug vive fuera del componente)
  const [, setDebugInfo] = useState<string[]>([]);
  useEffect(() => {
    const fn = (msgs: string[]) => setDebugInfo(msgs);
    debugListeners.add(fn);
    return () => { debugListeners.delete(fn); };
  }, []);

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
    let cancelled = false;
    setDataLoading(true);
    Promise.all([fetchQuote(activeSymbol), fetchChart(activeSymbol, rangeId)]).then(([q, c]) => {
      if (cancelled) return;
      setQuote((prev) => {
        if (prev && q && prev.price !== q.price) setPrevQuote(prev);
        return q;
      });
      setChartData(c);
      setDataLoading(false);
      if (q) setLastUpdate(new Date());
    });
    return () => { cancelled = true; };
    // tick: el intervalo de 30 s re-dispara este efecto → datos "en vivo"
  }, [activeSymbol, isOnline, rangeId, tick]);

  // Cinta de precios global (spark multi-símbolo): carga inicial + refresco cada 60 s
  useEffect(() => {
    if (!isOnline) return;
    let cancelled = false;
    const load = () => fetchTicker().then((items) => { if (!cancelled) setTickerItems(items); });
    load();
    const t = setInterval(load, 10_000); // detalle vivo: cada 10 s
    return () => { cancelled = true; clearInterval(t); };
  }, [isOnline]);

  // Auto-refresco del detalle: cada 10 s (verificado: Yahoo tolera)
  useEffect(() => {
    if (!activeSymbol || !isOnline) return;
    const t = setInterval(() => setTick((n) => n + 1), 10_000); // hora del exchange refresca cada 10 s
    return () => clearInterval(t);
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

      {/* Cinta de precios global — siempre visible, se desliza sola */}
      {isOnline && <PriceTicker items={tickerItems} onSymbolClick={selectSymbol} />}

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
          {/* Navegación: volver al tablero global */}
          <button
            onClick={() => setActiveSymbol(null)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Volver al tablero de mercados
          </button>

          {/* Barra de estado en vivo: hora de última actualización + badge EN VIVO */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">EN VIVO</span>
            </span>
            {lastUpdate && <span>· Actualizado: {lastUpdate.toLocaleTimeString("es-UY", { hour12: false })}</span>}
            <span>· Se actualiza solo cada 30 s</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setTick((n) => n + 1)}
              title="Actualizar ahora"
            >
              <Loader2 className={`h-3 w-3 mr-1 ${dataLoading ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
          </div>

          <Card className="bg-card-widget border-muted">
            <CardContent className="pt-4">
              {dataLoading && !quote ? (
                <div className="flex items-center justify-center h-[120px] text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Cargando...
                </div>
              ) : (
                <DecisionPanel quote={quote} prevQuote={prevQuote} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Gráfico en Tiempo Real
                </CardTitle>
                {/* Selector de rango: 1D velas de 5m → se mueven con el mercado */}
                <div className="flex gap-1">
                  {CHART_RANGES.map((r) => (
                    <Button
                      key={r.id}
                      variant={rangeId === r.id ? "default" : "ghost"}
                      size="sm"
                      className="h-7 px-2.5 text-xs font-medium"
                      onClick={() => setRangeId(r.id)}
                    >
                      {r.label}
                    </Button>
                  ))}
                </div>
              </div>
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
        <MarketsBoard onSymbolClick={selectSymbol} />
      ) : null}

      {/* Estilos locales del modo en vivo: carrusel de la cinta + destellos de precio */}
      <style>{`
        @keyframes ticker-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes flash-green-kf {
          0% { background-color: rgba(34, 197, 94, 0.35); }
          100% { background-color: transparent; }
        }
        @keyframes flash-red-kf {
          0% { background-color: rgba(239, 68, 68, 0.35); }
          100% { background-color: transparent; }
        }
        .flash-green { animation: flash-green-kf 1.2s ease-out; }
        .flash-red { animation: flash-red-kf 1.2s ease-out; }
        .price-cell { padding: 2px 8px; border-radius: 6px; }
      `}</style>
    </div>
  );
}
