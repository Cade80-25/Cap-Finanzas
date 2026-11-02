import { createClient } from "npm:@supabase/supabase-js@2";
import { enqueueEmail } from "../_shared/email-queue.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const templates: Record<number, { subject: string; html: string; text: string }> = {
  2: {
    subject: "3 trucos para ahorrar más cada mes 💰",
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body style="margin:0;padding:32px 12px;background:#e8eaf0;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
<div style="max-width:560px;margin:0 auto;background:#f3f4f8;border-radius:16px;overflow:hidden;border:1px solid #dce1e8">
  <div style="background:linear-gradient(135deg,#4f46e5 0%,#818cf8 100%);padding:28px;text-align:center">
    <h1 style="color:#fff;font-size:16px;font-weight:700;margin:0">Cap Finanzas</h1>
  </div>
  <div style="padding:32px">
    <h2 style="font-size:20px;font-weight:700;color:#1e2433;margin:0 0 16px">3 trucos para ahorrar más</h2>
    <p style="font-size:15px;color:#5a6a7e;line-height:1.6;margin:0 0 18px">Hola,</p>
    <p style="font-size:15px;color:#5a6a7e;line-height:1.6;margin:0 0 18px">Aquí tienes 3 trucos simples para ahorrar más cada mes:</p>
    <ul style="font-size:15px;color:#5a6a7e;line-height:1.8;margin:0 0 24px;padding-left:20px">
      <li><strong>Regla de las 24 horas:</strong> Antes de comprar algo no esencial, espera 24 horas. Si aún lo quieres, cómpralo.</li>
      <li><strong>Automatiza tu ahorro:</strong> Configura una transferencia automática a tu cuenta de ahorro el día que cobras.</li>
      <li><strong>Revisa tus suscripciones:</strong> Cancela las que no uses. Puedes ahorrar $50-$200/mes.</li>
    </ul>
    <div style="text-align:center;margin:8px 0 24px">
      <a href="https://capfinanzas.com" style="background:#4f46e5;color:#fff;font-size:15px;font-weight:700;border-radius:12px;padding:14px 28px;text-decoration:none;display:inline-block">Visita Cap Finanzas</a>
    </div>
  </div>
</div></body></html>`,
    text: "3 trucos para ahorrar más cada mes\n\n1. Regla de las 24 horas: espera antes de comprar algo no esencial.\n2. Automatiza tu ahorro: transferencia automática el día que cobras.\n3. Revisa tus suscripciones: cancela las que no uses.\n\nVisita Cap Finanzas: https://capfinanzas.com",
  },
  3: {
    subject: "Cómo crear tu presupuesto en 5 pasos 📊",
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body style="margin:0;padding:32px 12px;background:#e8eaf0;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
<div style="max-width:560px;margin:0 auto;background:#f3f4f8;border-radius:16px;overflow:hidden;border:1px solid #dce1e8">
  <div style="background:linear-gradient(135deg,#4f46e5 0%,#818cf8 100%);padding:28px;text-align:center">
    <h1 style="color:#fff;font-size:16px;font-weight:700;margin:0">Cap Finanzas</h1>
  </div>
  <div style="padding:32px">
    <h2 style="font-size:20px;font-weight:700;color:#1e2433;margin:0 0 16px">Presupuesto en 5 pasos</h2>
    <p style="font-size:15px;color:#5a6a7e;line-height:1.6;margin:0 0 18px">Hola,</p>
    <p style="font-size:15px;color:#5a6a7e;line-height:1.6;margin:0 0 18px">Un presupuesto es tu plan de gastos. Sin él, tu dinero desaparece.</p>
    <ol style="font-size:15px;color:#5a6a7e;line-height:1.8;margin:0 0 24px;padding-left:20px">
      <li>Lista todos tus ingresos.</li>
      <li>Lista todos tus gastos fijos y variables.</li>
      <li>Resta gastos de ingresos.</li>
      <li>Asigna el sobrante a ahorro o inversión.</li>
      <li>Revisa y ajusta cada mes.</li>
    </ol>
    <div style="text-align:center;margin:8px 0 24px">
      <a href="https://capfinanzas.com" style="background:#4f46e5;color:#fff;font-size:15px;font-weight:700;border-radius:12px;padding:14px 28px;text-decoration:none;display:inline-block">Visita Cap Finanzas</a>
    </div>
  </div>
</div></body></html>`,
    text: "Presupuesto en 5 pasos\n\n1. Lista todos tus ingresos.\n2. Lista todos tus gastos fijos y variables.\n3. Resta gastos de ingresos.\n4. Asigna el sobrante a ahorro o inversión.\n5. Revisa y ajusta cada mes.\n\nVisita Cap Finanzas: https://capfinanzas.com",
  },
  4: {
    subject: "¿Listo para llevar tus finanzas al siguiente nivel? 🚀",
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body style="margin:0;padding:32px 12px;background:#e8eaf0;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
<div style="max-width:560px;margin:0 auto;background:#f3f4f8;border-radius:16px;overflow:hidden;border:1px solid #dce1e8">
  <div style="background:linear-gradient(135deg,#4f46e5 0%,#818cf8 100%);padding:28px;text-align:center">
    <h1 style="color:#fff;font-size:16px;font-weight:700;margin:0">Cap Finanzas</h1>
  </div>
  <div style="padding:32px">
    <h2 style="font-size:20px;font-weight:700;color:#1e2433;margin:0 0 16px">Lleva tus finanzas al siguiente nivel</h2>
    <p style="font-size:15px;color:#5a6a7e;line-height:1.6;margin:0 0 18px">Hola,</p>
    <p style="font-size:15px;color:#5a6a7e;line-height:1.6;margin:0 0 18px">Si quieres tomar el control total de tu dinero, Cap Finanzas es para ti.</p>
    <ul style="font-size:15px;color:#5a6a7e;line-height:1.8;margin:0 0 24px;padding-left:20px">
      <li>Registro de gastos e ingresos</li>
      <li>Presupuestos por categoría</li>
      <li>Reportes y gráficos</li>
      <li>Metas de ahorro</li>
    </ul>
    <div style="text-align:center;margin:8px 0 24px">
      <a href="https://capfinanzas.com" style="background:#4f46e5;color:#fff;font-size:15px;font-weight:700;border-radius:12px;padding:14px 28px;text-decoration:none;display:inline-block">Probar Cap Finanzas</a>
    </div>
  </div>
</div></body></html>`,
    text: "Lleva tus finanzas al siguiente nivel\n\nCap Finanzas te ayuda a:\n- Registro de gastos e ingresos\n- Presupuestos por categoría\n- Reportes y gráficos\n- Metas de ahorro\n\nProbar Cap Finanzas: https://capfinanzas.com",
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Read pending sequences due today
  const { data: sequences, error } = await supabase
    .from("email_sequences")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_at", new Date().toISOString());

  if (error) {
    console.error("Error reading sequences:", error);
    return new Response(JSON.stringify({ error: "db_error" }), { status: 500, headers: corsHeaders });
  }

  let processed = 0;
  for (const seq of sequences || []) {
    const template = templates[seq.step];
    if (!template) continue;

    const messageId = crypto.randomUUID();
    const payload = {
      message_id: messageId,
      run_id: `seq-${seq.id}-step${seq.step}`,
      to: seq.email,
      from: "onboarding@resend.dev",
      sender_domain: "capfinanzas.com",
      subject: template.subject,
      label: `sequence_step_${seq.step}`,
      purpose: "transactional" as const,
      idempotency_key: `seq-${seq.id}-step${seq.step}`,
      html: template.html,
      text: template.text,
      queued_at: new Date().toISOString(),
    };

    const result = await enqueueEmail(supabase, "transactional_emails", payload);
    if (result) {
      await supabase
        .from("email_sequences")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", seq.id);
      processed++;
    } else {
      await supabase
        .from("email_sequences")
        .update({ status: "failed" })
        .eq("id", seq.id);
    }
  }

  return new Response(JSON.stringify({ processed }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
