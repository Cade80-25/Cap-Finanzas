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

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "AI not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const upperSymbol = symbol.toUpperCase().trim();

    if (action === "chart") {
      const chartPrompt = `Para el activo financiero "${upperSymbol}", genera datos de precio simulados educativos para los últimos 30 días.
Responde SOLO con un JSON array, sin texto adicional ni markdown. Cada elemento debe tener: "date" (YYYY-MM-DD), "price" (número), "volume" (número).
Usa precios realistas basados en tu conocimiento del activo. Si no conoces el activo, usa valores ficticios razonables.
Ejemplo de formato: [{"date":"2026-02-01","price":150.25,"volume":45000000}]`;

      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "Eres un generador de datos financieros educativos. Responde SOLO con JSON válido, sin markdown, sin ```json, sin texto extra." },
            { role: "user", content: chartPrompt },
          ],
          max_tokens: 2000,
          temperature: 0.3,
        }),
      });

      if (!aiRes.ok) {
        throw new Error(`AI error: ${aiRes.status}`);
      }

      const aiData = await aiRes.json();
      let content = aiData.choices?.[0]?.message?.content || "[]";
      
      // Clean markdown code blocks if present
      content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      
      let chartPoints;
      try {
        chartPoints = JSON.parse(content);
      } catch {
        chartPoints = [];
      }

      return new Response(
        JSON.stringify({ chartPoints, isSimulated: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Default: quote + analysis
    const quotePrompt = `Para el activo financiero "${upperSymbol}", proporciona información general basada en tu conocimiento.
Responde SOLO con un JSON object (sin markdown, sin \`\`\`json), con estos campos exactos:
{
  "symbol": "${upperSymbol}",
  "name": "Nombre completo",
  "price": número_aproximado_reciente,
  "currency": "USD",
  "change": número_cambio_diario_estimado,
  "changePercent": porcentaje_cambio_estimado,
  "previousClose": precio_cierre_anterior_estimado,
  "open": precio_apertura_estimado,
  "dayHigh": máximo_día_estimado,
  "dayLow": mínimo_día_estimado,
  "volume": volumen_estimado,
  "marketCap": capitalización_estimada,
  "fiftyTwoWeekHigh": máximo_52_semanas_estimado,
  "fiftyTwoWeekLow": mínimo_52_semanas_estimado,
  "exchange": "Nombre de la bolsa",
  "quoteType": "EQUITY o CRYPTOCURRENCY o INDEX o COMMODITY",
  "region": "US"
}
Usa valores numéricos realistas basados en tu conocimiento más reciente. Si no conoces el activo, responde con {"error": "not_found"}.`;

    const quoteRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Eres un proveedor de datos financieros educativos. Responde SOLO con JSON válido, sin markdown, sin ```json, sin texto extra." },
          { role: "user", content: quotePrompt },
        ],
        max_tokens: 500,
        temperature: 0.2,
      }),
    });

    if (!quoteRes.ok) {
      throw new Error(`AI error: ${quoteRes.status}`);
    }

    const quoteData = await quoteRes.json();
    let quoteContent = quoteData.choices?.[0]?.message?.content || "{}";
    quoteContent = quoteContent.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let quote;
    try {
      quote = JSON.parse(quoteContent);
    } catch {
      return new Response(
        JSON.stringify({ error: "No se pudo procesar la información. Intenta de nuevo." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (quote.error === "not_found") {
      return new Response(
        JSON.stringify({ error: "Símbolo no encontrado. Verifica e intenta de nuevo." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get AI analysis
    let aiAnalysis = "";
    try {
      const analysisRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
              content: `Analiza brevemente: ${quote.name} (${quote.symbol}). Precio aproximado: ${quote.price} ${quote.currency}. Capitalización: ${quote.marketCap}. Tipo: ${quote.quoteType}.`,
            },
          ],
          max_tokens: 500,
          temperature: 0.5,
        }),
      });

      if (analysisRes.ok) {
        const analysisData = await analysisRes.json();
        aiAnalysis = analysisData.choices?.[0]?.message?.content || "";
      }
    } catch (e) {
      console.error("AI analysis error:", e);
    }

    return new Response(
      JSON.stringify({ quote, aiAnalysis, isEstimated: true }),
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
