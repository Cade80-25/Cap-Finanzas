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
    const { password, action } = await req.json();

    const adminPassword = Deno.env.get("ADMIN_PASSWORD");
    if (!adminPassword || password !== adminPassword) {
      return new Response(
        JSON.stringify({ error: "Acceso no autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (action === "stats") {
      const { data: orders } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      const { data: licenses } = await supabase
        .from("licenses")
        .select("*")
        .order("created_at", { ascending: false });

      const totalRevenue = (orders || [])
        .filter((o) => o.status === "completed")
        .reduce((sum, o) => sum + Number(o.amount), 0);

      const refundedAmount = (orders || [])
        .filter((o) => o.status === "refunded" || o.status === "reversed")
        .reduce((sum, o) => sum + Math.abs(Number(o.amount)), 0);

      return new Response(
        JSON.stringify({
          orders: orders || [],
          licenses: licenses || [],
          stats: {
            totalOrders: (orders || []).filter((o) => o.status === "completed").length,
            totalRevenue,
            refundedAmount,
            netRevenue: totalRevenue - refundedAmount,
            totalLicenses: (licenses || []).length,
            usedLicenses: (licenses || []).filter((l) => l.is_used).length,
            deliveredLicenses: (licenses || []).filter((l) => l.is_delivered).length,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Acción no válida" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Admin error:", error);
    return new Response(
      JSON.stringify({ error: "Error interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
