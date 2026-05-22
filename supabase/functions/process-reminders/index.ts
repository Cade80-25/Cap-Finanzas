import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function escapeHtml(input: unknown): string {
  const s = String(input ?? "");
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const cronSecret = Deno.env.get("CRON_SECRET");

    // Require a shared secret to prevent unauthenticated abuse.
    // Accept either CRON_SECRET or the service role key as Bearer token.
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    const isAuthorized =
      (cronSecret && token === cronSecret) ||
      (supabaseServiceKey && token === supabaseServiceKey);

    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);


    // Get pending reminders that should fire now
    const now = new Date().toISOString();
    const { data: reminders, error } = await supabase
      .from("calendar_reminders")
      .select("*")
      .eq("status", "pending")
      .lte("reminder_at", now)
      .order("reminder_at", { ascending: true })
      .limit(50);

    if (error) throw error;
    if (!reminders || reminders.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let processed = 0;
    let emailsSent = 0;
    let smsSent = 0;

    for (const reminder of reminders) {
      try {
        const methods: string[] = reminder.methods || [];

        // Send email
        if (methods.includes("email") && reminder.email && resendApiKey) {
          const eventDate = new Date(reminder.event_date + "T12:00:00");
          const dateStr = eventDate.toLocaleDateString("es-ES", {
            weekday: "long",
            day: "numeric",
            month: "long",
          });

          // Escape all user-supplied fields before HTML interpolation
          const safeTitle = escapeHtml(reminder.title);
          const safeDate = escapeHtml(dateStr);
          const safeTime = escapeHtml(reminder.event_time);
          const safeDescription = reminder.description
            ? escapeHtml(reminder.description)
            : "";

          const emailRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Cap Finanzas <noreply@capfinanzas.com>",
              to: [reminder.email],
              subject: `⏰ Recordatorio: ${safeTitle}`,
              html: `
                <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #3b82f6;">⏰ Recordatorio</h2>
                  <h3>${safeTitle}</h3>
                  <p><strong>📅 Fecha:</strong> ${safeDate}</p>
                  <p><strong>🕐 Hora:</strong> ${safeTime}</p>
                  ${safeDescription ? `<p><strong>📝 Nota:</strong> ${safeDescription}</p>` : ""}
                  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                  <p style="color: #6b7280; font-size: 12px;">
                    Este recordatorio fue programado desde Cap Finanzas.
                  </p>
                </div>
              `,
            }),
          });

          if (emailRes.ok) emailsSent++;
        }

        // Send SMS (via Twilio if configured)
        if (methods.includes("sms") && reminder.phone) {
          const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
          const twilioAuth = Deno.env.get("TWILIO_AUTH_TOKEN");
          const twilioFrom = Deno.env.get("TWILIO_PHONE_NUMBER");

          if (twilioSid && twilioAuth && twilioFrom) {
            // Plain-text SMS: strip any HTML tags from title for safety
            const safeTitleSms = String(reminder.title ?? "").replace(/<[^>]*>/g, "");
            const smsBody = `⏰ Recordatorio Cap Finanzas: "${safeTitleSms}" - ${reminder.event_date} a las ${reminder.event_time}`;

            const smsRes = await fetch(
              `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
              {
                method: "POST",
                headers: {
                  Authorization: `Basic ${btoa(`${twilioSid}:${twilioAuth}`)}`,
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                  To: reminder.phone,
                  From: twilioFrom,
                  Body: smsBody,
                }),
              }
            );

            if (smsRes.ok) smsSent++;
          }
        }

        // Mark as processed
        await supabase
          .from("calendar_reminders")
          .update({ status: "sent", processed_at: new Date().toISOString() })
          .eq("id", reminder.id);

        processed++;
      } catch (err) {
        console.error(`Error processing reminder ${reminder.id}:`, err);
        await supabase
          .from("calendar_reminders")
          .update({ status: "failed", processed_at: new Date().toISOString() })
          .eq("id", reminder.id);
      }
    }

    return new Response(
      JSON.stringify({ processed, emailsSent, smsSent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing reminders:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
