import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Enlaces de descarga (ver PLAN.md). Los binarios viven en Cloudflare R2.
// Se pueden sobreescribir por variable de entorno sin tocar el codigo.
const DL_BASE = Deno.env.get("DOWNLOAD_BASE_URL") ??
  "https://capfinanzas-downloads.capfinanzas.workers.dev";
const DOWNLOADS = {
  windows: `${DL_BASE}/Cap-Finanzas-Setup.exe`,
  mac: `${DL_BASE}/Cap-Finanzas-arm64.dmg`,
  linux: `${DL_BASE}/Cap-Finanzas.AppImage`,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, licenseCode, licenseType } = await req.json();

    // Strict input validation
    if (!email || typeof email !== "string" || !EMAIL_RE.test(email) || email.length > 255) {
      return new Response(
        JSON.stringify({ error: "Email inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!licenseCode || typeof licenseCode !== "string" || licenseCode.length > 64) {
      return new Response(
        JSON.stringify({ error: "Código inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedCode = licenseCode.trim().toUpperCase();

    // Nombre del plan y vigencia, para que el correo diga la verdad.
    const planRaw = String(licenseType ?? "full").toLowerCase();
    const isSimple = planRaw === "simple";
    const planName = isSimple ? "Simples" : "Empresarial";
    const planVigencia = isSimple
      ? "Licencia permanente (pago único)"
      : "Vigencia de 6 meses, renovable";

    // Verify code actually exists and belongs to this email (prevents spam relay)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: license } = await supabase
      .from("licenses")
      .select("code")
      .eq("code", normalizedCode)
      .eq("customer_email", normalizedEmail)
      .maybeSingle();

    if (!license) {
      return new Response(
        JSON.stringify({ error: "Código no encontrado para ese correo" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: "Cap Finanzas <noreply@capfinanzas.com>",
        to: [normalizedEmail],
        subject: `Tu licencia de Cap Finanzas — Plan ${planName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563eb; text-align: center;">¡Gracias por tu compra!</h1>
            <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin: 20px 0; text-align: center;">
              <p style="margin: 0 0 8px; color: #64748b;">Tu código de activación:</p>
              <p style="font-size: 28px; font-weight: bold; font-family: monospace; color: #1e293b; letter-spacing: 2px; margin: 0;">
                ${normalizedCode}
              </p>
              <p style="margin: 12px 0 0; color: #64748b; font-size: 14px;">
                Plan ${planName} — Cap Finanzas
              </p>
              <p style="margin: 4px 0 0; color: #94a3b8; font-size: 13px;">
                ${planVigencia}
              </p>
            </div>

            <h2 style="color: #1e293b;">Descarga el programa</h2>
            <p style="color: #475569; line-height: 1.6;">
              Elige la versión para tu sistema operativo:
            </p>
            <div style="text-align: center; margin: 16px 0;">
              <a href="${DOWNLOADS.windows}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; margin: 4px;">
                Descargar para Windows
              </a>
              <a href="${DOWNLOADS.mac}" style="display: inline-block; background: #1e293b; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; margin: 4px;">
                Descargar para Mac
              </a>
              <a href="${DOWNLOADS.linux}" style="display: inline-block; background: #475569; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; margin: 4px;">
                Descargar para Linux
              </a>
            </div>
            <h2 style="color: #1e293b;">¿Cómo activar?</h2>
            <ol style="color: #475569; line-height: 1.8;">
              <li>Abre Cap Finanzas</li>
              <li>Ve a <strong>Configuración → Licencia</strong></li>
              <li>Haz clic en <strong>"Activar con código"</strong></li>
              <li>Pega tu código: <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${normalizedCode}</code></li>
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
        JSON.stringify({ error: "Failed to send email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Error interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
