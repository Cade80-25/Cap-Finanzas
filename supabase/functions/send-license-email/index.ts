import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const planNames: Record<string, string> = {
  simple: "Finanzas Simples",
  traditional: "Contabilidad Tradicional",
  full: "Licencia Completa",
  account: "Cuenta Adicional",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, licenseCode, licenseType } = await req.json();

    if (!email || !licenseCode || !licenseType) {
      return new Response(
        JSON.stringify({ error: "Missing email, licenseCode, or licenseType" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const planLabel = planNames[licenseType] || licenseType;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: "Cap Finanzas <noreply@capfinanzas.com>",
        to: [email],
        subject: `Tu licencia de Cap Finanzas — ${planLabel}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563eb; text-align: center;">¡Gracias por tu compra!</h1>
            <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin: 20px 0; text-align: center;">
              <p style="margin: 0 0 8px; color: #64748b;">Tu código de activación:</p>
              <p style="font-size: 28px; font-weight: bold; font-family: monospace; color: #1e293b; letter-spacing: 2px; margin: 0;">
                ${licenseCode}
              </p>
              <p style="margin: 12px 0 0; color: #64748b; font-size: 14px;">
                ${planLabel}
              </p>
            </div>
            <h2 style="color: #1e293b;">¿Cómo activar?</h2>
            <ol style="color: #475569; line-height: 1.8;">
              <li>Abre Cap Finanzas</li>
              <li>Ve a <strong>Configuración → Licencia</strong></li>
              <li>Haz clic en <strong>"Activar con código"</strong></li>
              <li>Pega tu código: <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${licenseCode}</code></li>
            </ol>
            <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 32px;">
              Si tienes dudas, responde a este correo. ¡Disfruta Cap Finanzas!
            </p>
          </div>
        `,
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.error("Resend error:", errText);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: errText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`License email sent to ${email} - code: ${licenseCode}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
