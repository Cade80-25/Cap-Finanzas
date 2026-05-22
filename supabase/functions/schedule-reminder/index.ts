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

// Strip HTML tags / dangerous characters from plain-text fields stored in DB.
// This is the primary defense against phishing payloads being persisted.
function sanitizePlainText(input: string): string {
  return input
    .replace(/<[^>]*>/g, "") // strip tags
    .replace(/[\u0000-\u001F\u007F]/g, " ") // strip control chars
    .replace(/\s+/g, " ")
    .trim();
}

// ---- License token verification (HMAC-SHA256) ----
function b64urlDecode(s: string): Uint8Array {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function verifyLicenseToken(
  token: string,
  installationId: string,
  secret: string,
): Promise<boolean> {
  try {
    const [data, sig] = token.split(".");
    if (!data || !sig) return false;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const ok = await crypto.subtle.verify(
      "HMAC",
      key,
      b64urlDecode(sig),
      new TextEncoder().encode(data),
    );
    if (!ok) return false;
    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(data))) as {
      exp?: number;
      installation_id?: string;
    };
    const nowSec = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== "number" || payload.exp < nowSec) return false;
    if (payload.installation_id !== installationId) return false;
    return true;
  } catch {
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      eventId,
      title,
      description,
      eventDate,
      eventTime,
      reminderAt,
      methods,
      email,
      phone,
      licenseToken,
      installationId,
    } = body;

    // ---- Require a valid signed license token bound to an installation ----
    // This closes the open-relay vector: only paying users can dispatch
    // emails/SMS through the app's trusted sender identity.
    const signingSecret = Deno.env.get("LICENSE_SIGNING_SECRET");
    if (!signingSecret) {
      return new Response(JSON.stringify({ error: "server_misconfigured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (
      typeof licenseToken !== "string" ||
      typeof installationId !== "string" ||
      installationId.length < 8 ||
      installationId.length > 128
    ) {
      return new Response(JSON.stringify({ error: "auth_required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const tokenOk = await verifyLicenseToken(licenseToken, installationId, signingSecret);
    if (!tokenOk) {
      return new Response(JSON.stringify({ error: "invalid_license_token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

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

    // Sanitize user-supplied text fields to plain text (no HTML) before persisting
    const safeTitle = sanitizePlainText(title).slice(0, 200);
    const safeDescription = description ? sanitizePlainText(description).slice(0, 1000) : "";
    if (!safeTitle) {
      return new Response(JSON.stringify({ error: "title vacío tras sanitizar" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Scope delete to caller's own reminders only — prevents one user wiping another's reminders.
    await supabase
      .from("calendar_reminders")
      .delete()
      .eq("event_id", eventId)
      .eq("installation_id", installationId);

    const { data, error } = await supabase.from("calendar_reminders").insert({
      event_id: eventId,
      title: safeTitle,
      description: safeDescription,
      event_date: eventDate,
      event_time: eventTime,
      reminder_at: reminderAt,
      methods,
      email: methods.includes("email") ? email : null,
      phone: methods.includes("sms") ? phone : null,
      installation_id: installationId,
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
