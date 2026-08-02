import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string" || !EMAIL_RE.test(email) || email.length > 255) {
      return new Response(
        JSON.stringify({ error: "Email inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Only return UNDELIVERED licenses for this email (one-time retrieval).
    // Once delivered, the user must use the code stored in their original email.
    // This prevents license-code harvesting via repeated polling.
    const { data: licenses, error } = await supabase
      .from("licenses")
      .select("code, license_type, created_at, is_used, is_delivered")
      .eq("customer_email", email.toLowerCase().trim())
      .eq("is_delivered", false)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Query error:", error);
      return new Response(
        JSON.stringify({ error: "Error al buscar licencias" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!licenses || licenses.length === 0) {
      // Check if there are delivered licenses to distinguish the message
      const { data: delivered } = await supabase
        .from("licenses")
        .select("id")
        .eq("customer_email", email.toLowerCase().trim())
        .eq("is_delivered", true)
        .limit(1);

      if (delivered && delivered.length > 0) {
        return new Response(
          JSON.stringify({
            found: false,
            alreadyDelivered: true,
            message: "Las licencias para este correo ya fueron entregadas. Revisa tu bandeja de entrada (y la carpeta de spam) del correo de compra.",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          found: false,
          message: "No se encontraron licencias para este correo. Si ya pagaste, el proceso puede tardar unos minutos.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark as delivered so codes can only be retrieved once via this endpoint
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
