import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ error: "Email requerido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find licenses for this email
    const { data: licenses, error } = await supabase
      .from("licenses")
      .select("code, license_type, created_at, is_used")
      .eq("customer_email", email.toLowerCase().trim())
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Query error:", error);
      return new Response(
        JSON.stringify({ error: "Error al buscar licencias" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!licenses || licenses.length === 0) {
      return new Response(
        JSON.stringify({
          found: false,
          message: "No se encontraron licencias para este correo. Si ya pagaste, el proceso puede tardar unos minutos.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark as delivered
    for (const lic of licenses) {
      await supabase
        .from("licenses")
        .update({ is_delivered: true })
        .eq("code", lic.code);
    }

    return new Response(
      JSON.stringify({
        found: true,
        licenses: licenses.map((l) => ({
          code: l.code,
          type: l.license_type,
          date: l.created_at,
          used: l.is_used,
        })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Check license error:", error);
    return new Response(
      JSON.stringify({ error: "Error interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
