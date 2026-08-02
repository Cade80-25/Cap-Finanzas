import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { installationId, code } = await req.json();
    if (!installationId || typeof installationId !== "string" || installationId.length > 100) {
      return new Response(JSON.stringify({ error: "installationId requerido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Find this installation's referral code if any
    let myCode = code as string | null;
    if (!myCode) {
      const { data } = await supabase.from("referrals").select("referrer_code")
        .eq("referrer_installation_id", installationId).limit(1).maybeSingle();
      myCode = data?.referrer_code ?? null;
    }

    let count = 0;
    if (myCode) {
      const { count: c } = await supabase
        .from("referrals")
        .select("id", { count: "exact", head: true })
        .eq("referrer_code", myCode)
        .not("redeemed_at", "is", null);
      count = c || 0;
    }

    return new Response(JSON.stringify({ code: myCode, count }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
