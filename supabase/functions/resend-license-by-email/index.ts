import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string" || !EMAIL_RE.test(email) || email.length > 255) {
      return new Response(JSON.stringify({ error: "Email inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalized = email.toLowerCase().trim();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Most recent license for this email (latest created)
    const { data: license, error } = await supabase
      .from("licenses")
      .select("code, revoked")
      .eq("customer_email", normalized)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("DB error:", error);
      return new Response(JSON.stringify({ error: "Error interno" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!license || license.revoked) {
      // Don't leak whether the email exists; same generic message.
      return new Response(
        JSON.stringify({ error: "No encontramos una licencia activa para ese correo." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.error("RESEND_API_KEY missing");
      return new Response(JSON.stringify({ error: "Servicio de correo no disponible" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = `
      <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color:#1e293b;">
        <div style="background:#f3f4f8; border-radius:12px; padding:28px;">
          <h1 style="color:#4f46e5; margin:0 0 12px; font-size:22px;">Aquí está tu licencia</h1>
          <p>Nos pediste reenviar tu código de Cap Finanzas. Acá lo tenés:</p>
          <p style="font-size:26px; font-weight:bold; font-family:monospace; letter-spacing:2px; background:#fff; padding:14px; border-radius:8px; text-align:center;">${license.code}</p>
          <p>Para activarlo: abrí la app → <strong>Ajustes → Configuración → Licencia → Activar con código</strong>.</p>
          <hr style="border:none; border-top:1px solid #e2e8f0; margin:24px 0;" />
          <p style="color:#64748b; font-size:13px; margin:0;">Cap Finanzas — soporte@capfinanzas.com</p>
        </div>
      </div>`;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: "Cap Finanzas <noreply@capfinanzas.com>",
        to: [normalized],
        subject: "Tu licencia de Cap Finanzas (reenvío)",
        html,
      }),
    });

    if (!emailRes.ok) {
      const t = await emailRes.text();
      console.error("Resend error:", t);
      return new Response(JSON.stringify({ error: "No pudimos enviar el correo" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("resend-license-by-email error:", e);
    return new Response(JSON.stringify({ error: "Error interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
