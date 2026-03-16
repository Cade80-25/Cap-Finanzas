import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
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

          const emailRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Cap Finanzas <noreply@capfinanzas.com>",
              to: [reminder.email],
              subject: `⏰ Recordatorio: ${reminder.title}`,
              html: `
                <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #3b82f6;">⏰ Recordatorio</h2>
                  <h3>${reminder.title}</h3>
                  <p><strong>📅 Fecha:</strong> ${dateStr}</p>
                  <p><strong>🕐 Hora:</strong> ${reminder.event_time}</p>
                  ${reminder.description ? `<p><strong>📝 Nota:</strong> ${reminder.description}</p>` : ""}
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
            const smsBody = `⏰ Recordatorio Cap Finanzas: "${reminder.title}" - ${reminder.event_date} a las ${reminder.event_time}`;

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
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
