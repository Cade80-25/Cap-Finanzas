import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "npm:zod@3";

/**
 * Registra el inicio de la prueba gratuita en el servidor.
 *
 * Motivo: la prueba se controlaba solo en localStorage. Borrar los datos de la
 * app (o reinstalar) daba 30 dias nuevos, sin limite. Con esto, el servidor
 * recuerda que esa maquina ya uso su prueba.
 *
 * Responde:
 *   { allowed: true,  trial_started_at }        -> puede empezar la prueba
 *   { allowed: false, trial_started_at, days_used } -> ya la uso antes
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BodySchema = z.object({
  machine_id: z.string().min(8).max(256),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const raw = await req.json();
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "invalid_input" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const machine_id = parsed.data.machine_id.trim();
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // IP del cliente (para trazabilidad; no se usa para bloquear)
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      req.headers.get("cf-connecting-ip") ??
      null;

    // 1. ya existe registro de esta maquina?
    const { data: existente, error: selErr } = await supabase
      .from("trial_registrations")
      .select("trial_started_at")
      .eq("machine_id", machine_id)
      .maybeSingle();

    if (selErr) {
      console.error("Select error:", selErr);
      return new Response(JSON.stringify({ error: "db_error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (existente) {
      const inicio = new Date(existente.trial_started_at).getTime();
      const diasUsados = Math.floor((Date.now() - inicio) / 86400000);
      return new Response(
        JSON.stringify({
          allowed: false,
          trial_started_at: existente.trial_started_at,
          days_used: diasUsados,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 2. primera vez: registrar el inicio
    const { data: nuevo, error: insErr } = await supabase
      .from("trial_registrations")
      .insert({ machine_id, first_ip: ip })
      .select("trial_started_at")
      .single();

    if (insErr) {
      // Carrera: otra peticion lo inserto primero. Tratar como existente.
      if (insErr.code === "23505") {
        return new Response(
          JSON.stringify({ allowed: false, days_used: 0 }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      console.error("Insert error:", insErr);
      return new Response(JSON.stringify({ error: "db_error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ allowed: true, trial_started_at: nuevo.trial_started_at }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("Unexpected error:", e);
    return new Response(JSON.stringify({ error: "unexpected" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
