const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompts: Record<string, string> = {
  tutor: `Eres un tutor de educación financiera amigable y accesible para personas en Latinoamérica. 
Tu objetivo es enseñar conceptos financieros de forma clara, práctica y con ejemplos del día a día.
Reglas:
- Responde siempre en español
- Usa ejemplos prácticos y números concretos cuando sea posible
- Explica conceptos complejos de forma simple
- Sugiere acciones prácticas que el usuario pueda tomar
- Sé breve pero completo (máximo 300 palabras)
- Usa emojis ocasionalmente para hacer la lectura más amena
- Si no sabes algo, dilo honestamente
- NO des consejos de inversión específicos, solo educación financiera general`,

  inversiones: `Eres una guía informativa sobre mercados financieros y oportunidades de inversión. 
Tu objetivo es proporcionar información educativa actualizada sobre tendencias de mercado, tipos de inversión y estrategias financieras.

Reglas CRÍTICAS:
- Responde siempre en español
- SIEMPRE incluye al final de tu respuesta este disclaimer exacto: "⚠️ **Aviso importante:** Esta información es solo educativa y no constituye asesoría financiera profesional. Las inversiones conllevan riesgos. Consulta a un asesor financiero certificado antes de tomar decisiones de inversión."
- Menciona las fuentes generales de donde proviene la información (ej: "Según datos de mercados internacionales...", "De acuerdo con tendencias reportadas por analistas financieros...")
- Incluye niveles de riesgo cuando menciones instrumentos de inversión
- Sé objetivo y presenta pros y contras
- Usa datos y porcentajes aproximados basados en tendencias conocidas
- NO des recomendaciones de compra/venta específicas
- NO garantices rendimientos
- Máximo 400 palabras por respuesta
- Usa formato con bullets, negritas y emojis para facilitar la lectura`,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, mode } = await req.json();

    const systemPrompt = systemPrompts[mode] || systemPrompts.tutor;

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "AI not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const allMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: allMessages,
          max_tokens: 1000,
          temperature: 0.7,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Demasiadas solicitudes. Espera un momento e intenta de nuevo." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA agotados. Contacta al administrador." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "No se pudo generar una respuesta.";

    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("AI Financial Chat error:", error);
    return new Response(
      JSON.stringify({ error: "Error al procesar tu consulta. Intenta de nuevo." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
