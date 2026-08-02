import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { referralCode, installationId } = await req.json();

    if (!referralCode || !installationId) {
      return new Response(
        JSON.stringify({ success: false, message: "Código de referido e ID de instalación requeridos." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find the referral code
    const { data: referral, error: findError } = await supabase
      .from("referrals")
      .select("*")
      .eq("referrer_code", referralCode.trim().toUpperCase())
      .maybeSingle();

    if (findError || !referral) {
      return new Response(
        JSON.stringify({ success: false, message: "Código de referido no encontrado." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Can't use your own code
    if (referral.referrer_installation_id === installationId) {
      return new Response(
        JSON.stringify({ success: false, message: "No puedes usar tu propio código de referido." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if already redeemed by this installation
    const { data: existing } = await supabase
      .from("referrals")
      .select("id")
      .eq("referrer_code", referralCode.trim().toUpperCase())
      .eq("redeemed_by_installation_id", installationId)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ success: false, message: "Ya usaste este código de referido." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if this installation already redeemed ANY code
    const { data: alreadyRedeemed } = await supabase
      .from("referrals")
      .select("id")
      .eq("redeemed_by_installation_id", installationId)
      .not("redeemed_at", "is", null)
      .maybeSingle();

    if (alreadyRedeemed) {
      return new Response(
        JSON.stringify({ success: false, message: "Ya usaste un código de referido anteriormente." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Record the redemption — insert a new row tracking who redeemed
    await supabase.from("referrals").insert({
      referrer_code: referral.referrer_code,
      referrer_installation_id: referral.referrer_installation_id,
      redeemed_by_installation_id: installationId,
      redeemed_at: new Date().toISOString(),
    });

    // Count total redemptions for the referrer (for their bonus)
    const { count } = await supabase
      .from("referrals")
      .select("id", { count: "exact", head: true })
      .eq("referrer_installation_id", referral.referrer_installation_id)
      .not("redeemed_at", "is", null);

    return new Response(
      JSON.stringify({
        success: true,
        message: "¡Código canjeado! Ambos reciben 15 días extra de trial.",
        referrerInstallationId: referral.referrer_installation_id,
        referrerTotalRedemptions: count || 1,
        bonusDays: 15,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Referral error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Error del servidor. Intenta de nuevo." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
