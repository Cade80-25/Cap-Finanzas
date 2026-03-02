const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const prompts: Record<string, string> = {
  ahorro:
    "Eres un asesor financiero amigable. Da 3 consejos prácticos y actualizados sobre ahorro personal para alguien en Latinoamérica. Incluye estrategias concretas con números. Sé breve y claro. Responde en español.",
  inversion:
    "Eres un asesor de inversiones accesible. Da 3 recomendaciones actualizadas sobre dónde y cómo invertir para principiantes en Latinoamérica. Menciona opciones de bajo, medio y alto riesgo con rendimientos aproximados. Sé breve y claro. Responde en español.",
  educacion:
    "Eres un tutor de educación financiera. Explica 3 conceptos financieros importantes que toda persona debería entender, con ejemplos prácticos del día a día. Sé breve y claro. Responde en español.",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, context } = await req.json();

    const systemPrompt = prompts[type] || prompts.educacion;

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "AI not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Contexto del usuario: ${context}\n\nDa recomendaciones prácticas y actualizadas.`,
            },
          ],
          max_tokens: 800,
          temperature: 0.7,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const recommendation =
      data.choices?.[0]?.message?.content || "No se pudo generar una recomendación.";

    return new Response(
      JSON.stringify({ recommendation }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("AI Recommendations error:", error);
    return new Response(
      JSON.stringify({ error: "Error generating recommendation" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
