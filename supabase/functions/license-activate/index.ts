import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BodySchema = z.object({
  code: z.string().min(8).max(64),
  installation_id: z.string().min(8).max(128),
});

// Vigencia del token segun el plan (ver PLAN.md en la raiz del repo).
// - simple:      permanente (100 anios, efectivamente sin vencimiento)
// - traditional/full/account: semestral (180 dias), renovable
const PERPETUAL_DAYS = 36500;
const SEMESTRAL_DAYS = 180;

function ttlDaysFor(licenseType: string | null | undefined): number {
  const t = (licenseType ?? "").toLowerCase();
  if (t === "simple") return PERPETUAL_DAYS;
  // traditional, full, account y cualquier otro: semestral
  return SEMESTRAL_DAYS;
}

function b64url(bytes: Uint8Array): string {
  let s = btoa(String.fromCharCode(...bytes));
  return s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlStr(str: string): string {
  return b64url(new TextEncoder().encode(str));
}

async function signToken(payload: Record<string, unknown>, secret: string) {
  const payloadStr = JSON.stringify(payload);
  const data = b64urlStr(payloadStr);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return `${data}.${b64url(new Uint8Array(sig))}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "invalid_input", details: parsed.error.flatten() }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const code = parsed.data.code.trim().toUpperCase();
    const installation_id = parsed.data.installation_id.trim();

    const secret = Deno.env.get("LICENSE_SIGNING_SECRET");
    if (!secret) {
      return new Response(JSON.stringify({ error: "server_misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: license, error } = await supabase
      .from("licenses")
      .select("id, code, is_used, revoked, installation_id, activated_at, license_type")
      .eq("code", code)
      .maybeSingle();

    if (error) {
      console.error("DB error:", error);
      return new Response(JSON.stringify({ error: "db_error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!license) {
      return new Response(JSON.stringify({ error: "code_not_found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (license.revoked) {
      return new Response(JSON.stringify({ error: "code_revoked" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (license.is_used && license.installation_id && license.installation_id !== installation_id) {
      return new Response(JSON.stringify({ error: "code_used_elsewhere" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const nowIso = new Date().toISOString();
    const activated_at = license.activated_at ?? nowIso;

    const { error: updateErr } = await supabase
      .from("licenses")
      .update({
        is_used: true,
        installation_id,
        activated_at,
        last_seen_at: nowIso,
      })
      .eq("id", license.id);

    if (updateErr) {
      console.error("Update error:", updateErr);
      return new Response(JSON.stringify({ error: "db_update_error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const iat = Math.floor(Date.now() / 1000);
    // La vigencia depende del plan, no de un TTL fijo.
    const ttlDays = ttlDaysFor(license.license_type);
    const exp = iat + ttlDays * 24 * 60 * 60;
    const token = await signToken(
      { code, installation_id, activated_at, iat, exp, license_type: license.license_type ?? null },
      secret,
    );

    return new Response(
      JSON.stringify({ token, exp, activated_at }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("Unexpected error:", e);
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
