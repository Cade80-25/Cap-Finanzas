const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol, action } = await req.json();

    if (!symbol) {
      return new Response(
        JSON.stringify({ error: "Symbol is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const upperSymbol = symbol.toUpperCase().trim();

    if (action === "chart") {
      // Fetch 1-month chart data
      const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(upperSymbol)}?range=1mo&interval=1d`;
      const chartRes = await fetch(chartUrl, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });

      if (!chartRes.ok) {
        throw new Error(`Chart data fetch failed: ${chartRes.status}`);
      }

      const chartData = await chartRes.json();
      const result = chartData.chart?.result?.[0];

      if (!result) {
        return new Response(
          JSON.stringify({ error: "No se encontraron datos para este símbolo." }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const timestamps = result.timestamp || [];
      const closes = result.indicators?.quote?.[0]?.close || [];
      const volumes = result.indicators?.quote?.[0]?.volume || [];

      const chartPoints = timestamps.map((ts: number, i: number) => ({
        date: new Date(ts * 1000).toISOString().split("T")[0],
        price: closes[i] != null ? Number(closes[i].toFixed(2)) : null,
        volume: volumes[i] || 0,
      })).filter((p: any) => p.price !== null);

      return new Response(
        JSON.stringify({ chartPoints }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Default: quote + summary
    const quoteUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(upperSymbol)}`;
    const quoteRes = await fetch(quoteUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!quoteRes.ok) {
      throw new Error(`Quote fetch failed: ${quoteRes.status}`);
    }

    const quoteData = await quoteRes.json();
    const quote = quoteData.quoteResponse?.result?.[0];

    if (!quote) {
      return new Response(
        JSON.stringify({ error: "Símbolo no encontrado. Verifica e intenta de nuevo." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const summary = {
      symbol: quote.symbol,
      name: quote.shortName || quote.longName || quote.symbol,
      price: quote.regularMarketPrice,
      currency: quote.currency,
      change: quote.regularMarketChange,
      changePercent: quote.regularMarketChangePercent,
      previousClose: quote.regularMarketPreviousClose,
      open: quote.regularMarketOpen,
      dayHigh: quote.regularMarketDayHigh,
      dayLow: quote.regularMarketDayLow,
      volume: quote.regularMarketVolume,
      marketCap: quote.marketCap,
      fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
      exchange: quote.fullExchangeName || quote.exchange,
      quoteType: quote.quoteType,
      region: quote.region,
    };

    // Get AI analysis
    let aiAnalysis = "";
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (apiKey) {
      try {
        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              {
                role: "system",
                content: `Eres un analista financiero educativo. Proporciona un resumen breve (máximo 200 palabras) sobre la empresa o activo financiero indicado. Incluye:
- Sector e industria
- Qué hace la empresa (1-2 oraciones)
- Datos clave para un inversor principiante
- Nivel de riesgo general (bajo/medio/alto)
Responde en español. NO des recomendaciones de compra/venta. Termina con: "⚠️ Información educativa, no constituye asesoría financiera."`,
              },
              {
                role: "user",
                content: `Analiza brevemente: ${quote.shortName || quote.symbol} (${quote.symbol}). Precio actual: ${quote.regularMarketPrice} ${quote.currency}. Capitalización: ${quote.marketCap}. Tipo: ${quote.quoteType}.`,
              },
            ],
            max_tokens: 500,
            temperature: 0.5,
          }),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          aiAnalysis = aiData.choices?.[0]?.message?.content || "";
        }
      } catch (e) {
        console.error("AI analysis error:", e);
      }
    }

    return new Response(
      JSON.stringify({ quote: summary, aiAnalysis }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Market data error:", error);
    return new Response(
      JSON.stringify({ error: "Error al obtener datos del mercado. Intenta de nuevo." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
