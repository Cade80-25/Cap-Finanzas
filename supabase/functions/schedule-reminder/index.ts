import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9\s\-()]{7,20}$/;
const ALLOWED_METHODS = new Set(["email", "sms", "push"]);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { eventId, title, description, eventDate, eventTime, reminderAt, methods, email, phone } = body;

    // Strict input validation
    if (!eventId || typeof eventId !== "string" || eventId.length > 100) {
      return new Response(JSON.stringify({ error: "eventId inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!title || typeof title !== "string" || title.length > 200) {
      return new Response(JSON.stringify({ error: "title inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (description && (typeof description !== "string" || description.length > 1000)) {
      return new Response(JSON.stringify({ error: "description inválida" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!eventDate || !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
      return new Response(JSON.stringify({ error: "eventDate inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!eventTime || !/^\d{2}:\d{2}(:\d{2})?$/.test(eventTime)) {
      return new Response(JSON.stringify({ error: "eventTime inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const reminderDate = new Date(reminderAt);
    if (!reminderAt || isNaN(reminderDate.getTime())) {
      return new Response(JSON.stringify({ error: "reminderAt inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    // reminderAt must be within the next year and in the future
    const now = Date.now();
    const oneYear = 365 * 24 * 60 * 60 * 1000;
    if (reminderDate.getTime() < now - 60_000 || reminderDate.getTime() > now + oneYear) {
      return new Response(JSON.stringify({ error: "reminderAt fuera de rango" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!Array.isArray(methods) || methods.length === 0 || methods.length > 3 ||
        !methods.every((m) => typeof m === "string" && ALLOWED_METHODS.has(m))) {
      return new Response(JSON.stringify({ error: "methods inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (methods.includes("email")) {
      if (!email || typeof email !== "string" || !EMAIL_RE.test(email) || email.length > 255) {
        return new Response(JSON.stringify({ error: "email inválido" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }
    if (methods.includes("sms")) {
      if (!phone || typeof phone !== "string" || !PHONE_RE.test(phone)) {
        return new Response(JSON.stringify({ error: "phone inválido" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    await supabase.from("calendar_reminders").delete().eq("event_id", eventId);

    const { data, error } = await supabase.from("calendar_reminders").insert({
      event_id: eventId,
      title,
      description: description || "",
      event_date: eventDate,
      event_time: eventTime,
      reminder_at: reminderAt,
      methods,
      email: methods.includes("email") ? email : null,
      phone: methods.includes("sms") ? phone : null,
      status: "pending",
    }).select().single();

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error scheduling reminder:", error);
    return new Response(
      JSON.stringify({ error: "Error interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
