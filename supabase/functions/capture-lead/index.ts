import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import { enqueueEmail } from "../_shared/email-queue.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BodySchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  name: z.string().max(100).optional(),
  source: z.string().max(50).default("landing_newsletter"),
  metadata: z.record(z.unknown()).optional(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const raw = await req.json();
    const parsed = BodySchema.safeParse(raw);

    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "invalid_input", details: parsed.error.flatten() }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, name, source, metadata } = parsed.data;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Capture the lead (upsert on email)
    const { data: lead, error: leadError } = await supabase.rpc("capture_lead", {
      p_email: email,
      p_name: name ?? null,
      p_source: source,
      p_metadata: metadata ?? {},
    });

    if (leadError) {
      console.error("Lead capture error:", leadError);
      return new Response(JSON.stringify({ error: "db_error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isNew = lead?.[0]?.is_new ?? false;
    const leadId = lead?.[0]?.id;

    // If new lead, enqueue welcome email
    if (isNew && leadId) {
      const messageId = crypto.randomUUID();
      const unsubscribeToken = crypto.randomUUID();

      const welcomePayload = {
        message_id: messageId,
        run_id: `welcome-${leadId}`,
        to: email,
        from: "onboarding@resend.dev",
        sender_domain: "capfinanzas.com",
        subject: "¡Bienvenido a Cap Finanzas! 🎉",
        label: "welcome_newsletter",
        purpose: "transactional",
        idempotency_key: `welcome-${leadId}`,
        unsubscribe_token: unsubscribeToken,
        html: generateWelcomeHtml(email, name, unsubscribeToken),
        text: generateWelcomeText(email, name, unsubscribeToken),
        queued_at: new Date().toISOString(),
      };

      await enqueueEmail(supabase, "transactional_emails", welcomePayload);

      // Enqueue email sequence steps (2,3,4) with scheduled dates
      try {
        const now = new Date();
        const steps = [
          { step: 2, days: 2 },
          { step: 3, days: 5 },
          { step: 4, days: 8 },
        ];
        for (const s of steps) {
          const scheduled = new Date(now.getTime() + s.days * 24 * 60 * 60 * 1000);
          await supabase.from("email_sequences").insert({
            lead_id: leadId,
            email,
            step: s.step,
            scheduled_at: scheduled.toISOString(),
          });
        }
      } catch (e) {
        console.error("Failed to enqueue sequence:", e);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        lead_id: leadId,
        is_new: isNew,
        message: isNew ? "¡Suscripción confirmada! Revisa tu email." : "Ya estás suscrito.",
      }),
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

function generateWelcomeHtml(email: string, name?: string, unsubscribeToken?: string): string {
  const greeting = name ? `Hola ${name},` : "Hola,";
  const unsubscribeUrl = unsubscribeToken
    ? `https://capfinanzas.com/unsubscribe?token=${unsubscribeToken}`
    : "#";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>¡Bienvenido a Cap Finanzas!</title>
</head>
<body style="margin:0;padding:32px 12px;background:#e8eaf0;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto;background:#f3f4f8;border-radius:16px;overflow:hidden;border:1px solid #dce1e8;box-shadow:0 10px 28px -10px rgba(20,25,50,0.22)">
    <div style="background:linear-gradient(135deg,#4f46e5 0%,#818cf8 100%);padding:28px;text-align:center">
      <img src="https://pcxvnqsoafagnthazoir.supabase.co/storage/v1/object/public/email-assets/logo.png" alt="Cap Finanzas" style="width:56px;height:56px;border-radius:14px;display:block;margin:0 auto 10px;background:transparent;padding:6px" />
      <h1 style="color:#fff;font-size:16px;font-weight:700;margin:0;letter-spacing:0.3px">Cap Finanzas</h1>
    </div>
    <div style="padding:32px 32px 8px">
      <h2 style="font-size:22px;font-weight:700;color:#1e2433;margin:0 0 16px">¡Gracias por suscribirte!</h2>
      <p style="font-size:15px;color:#5a6a7e;line-height:1.6;margin:0 0 18px">${greeting}</p>
      <p style="font-size:15px;color:#5a6a7e;line-height:1.6;margin:0 0 18px">Ahora formas parte de la comunidad de Cap Finanzas. Recibirás consejos de finanzas personales, actualizaciones de la app y contenido exclusivo para llevar tu dinero al siguiente nivel.</p>
      <p style="font-size:15px;color:#5a6a7e;line-height:1.6;margin:0 0 18px"><strong>¿Qué puedes esperar?</strong></p>
      <ul style="font-size:15px;color:#5a6a7e;line-height:1.8;margin:0 0 24px;padding-left:20px">
        <li>Trucos para ahorrar más cada mes</li>
        <li>Actualizaciones y nuevas funciones de la app</li>
        <li>Contenido educativo de contabilidad y finanzas</li>
        <li>Ofertas exclusivas para suscriptores</li>
      </ul>
      <div style="text-align:center;margin:8px 0 24px">
        <a href="https://capfinanzas.com/lead-magnet-finanzas-personales.pdf" style="background:#4f46e5;color:#fff;font-size:15px;font-weight:700;border-radius:12px;padding:14px 28px;text-decoration:none;display:inline-block">Descargar Guía Gratuita</a>
      </div>
      <hr style="border:none;border-top:1px solid #dce1e8;margin:24px 0 16px" />
      <p style="font-size:12px;color:#8b98a8;line-height:1.6;text-align:center;margin:0">Si no te suscribiste tú, ignora este email.<br />
      <a href="${unsubscribeUrl}" style="color:#4f46e5;text-decoration:underline">Darte de baja</a> | Cap Finanzas · Tu dinero, tus reglas</p>
    </div>
  </div>
</body>
</html>`;
}

function generateWelcomeText(email: string, name?: string, unsubscribeToken?: string): string {
  const greeting = name ? `Hola ${name},` : "Hola,";
  const unsubscribeUrl = unsubscribeToken
    ? `https://capfinanzas.com/unsubscribe?token=${unsubscribeToken}`
    : "https://capfinanzas.com/unsubscribe";

  return `${greeting}

¡Gracias por suscribirte a Cap Finanzas!

Ahora formas parte de la comunidad. Recibirás consejos de finanzas personales, actualizaciones de la app y contenido exclusivo.

¿Qué puedes esperar?
- Trucos para ahorrar más cada mes
- Actualizaciones y nuevas funciones de la app
- Contenido educativo de contabilidad y finanzas
- Ofertas exclusivas para suscriptores

Visita Cap Finanzas: https://capfinanzas.com/landing

---
Si no te suscribiste tú, ignora este email.
Darte de baja: ${unsubscribeUrl}
Cap Finanzas · Tu dinero, tus reglas`;
}