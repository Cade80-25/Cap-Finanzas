import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[bytes[i] % chars.length];
  return `REF-${s}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { installationId } = await req.json();
    if (!installationId || typeof installationId !== "string" || installationId.length > 100) {
      return new Response(JSON.stringify({ error: "installationId requerido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Return existing code if any
    const { data: existing } = await supabase
      .from("referrals").select("referrer_code")
      .eq("referrer_installation_id", installationId)
      .is("redeemed_by_installation_id", null)
      .limit(1).maybeSingle();
    if (existing?.referrer_code) {
      return new Response(JSON.stringify({ code: existing.referrer_code }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    for (let i = 0; i < 5; i++) {
      const code = generateCode();
      const { error } = await supabase.from("referrals").insert({
        referrer_code: code,
        referrer_installation_id: installationId,
      });
      if (!error) {
        return new Response(JSON.stringify({ code }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    return new Response(JSON.stringify({ error: "No se pudo generar código" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
