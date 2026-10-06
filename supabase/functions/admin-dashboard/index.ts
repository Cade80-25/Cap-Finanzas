import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Planes validos: mismo CHECK que la tabla public.licenses.
const LICENSE_TYPES = ["simple", "traditional", "full", "account"] as const;
type LicenseType = (typeof LICENSE_TYPES)[number];

const CODE_PREFIX: Record<LicenseType, string> = {
  simple: "SIMPLE",
  traditional: "TRAD",
  full: "FULL",
  account: "ACCT",
};

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Codigo con el formato historico CF-<PLAN>-XXXX-XXXXX (ultimo char = checksum). */
function generateLicenseCode(type: LicenseType): string {
  let raw = "";
  for (let i = 0; i < 8; i++) {
    raw += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
  }
  let checksum = 0;
  for (let i = 0; i < raw.length; i++) checksum += raw.charCodeAt(i);
  const checksumChar = CODE_CHARS.charAt(checksum % CODE_CHARS.length);
  return `CF-${CODE_PREFIX[type]}-${raw.substring(0, 4)}-${raw.substring(4)}${checksumChar}`;
}

function clean(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const json = (payload: unknown, status = 200) =>
    new Response(JSON.stringify(payload), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const body = await req.json();
    const { password, action } = body ?? {};

    const adminPassword = Deno.env.get("ADMIN_PASSWORD");
    if (!adminPassword || password !== adminPassword) {
      return json({ error: "Acceso no autorizado" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (action === "stats") {
      const { data: orders } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      const { data: licenses } = await supabase
        .from("licenses")
        .select("*")
        .order("created_at", { ascending: false });

      const totalRevenue = (orders || [])
        .filter((o) => o.status === "completed")
        .reduce((sum, o) => sum + Number(o.amount), 0);

      const refundedAmount = (orders || [])
        .filter((o) => o.status === "refunded" || o.status === "reversed")
        .reduce((sum, o) => sum + Math.abs(Number(o.amount)), 0);

      return json({
        orders: orders || [],
        licenses: licenses || [],
        stats: {
          totalOrders: (orders || []).filter((o) => o.status === "completed").length,
          totalRevenue,
          refundedAmount,
          netRevenue: totalRevenue - refundedAmount,
          totalLicenses: (licenses || []).length,
          usedLicenses: (licenses || []).filter((l) => l.is_used).length,
          deliveredLicenses: (licenses || []).filter((l) => l.is_delivered).length,
        },
      });
    }

    // Historial real: el generador ya no guarda nada solo en el navegador.
    if (action === "list-licenses") {
      const { data, error } = await supabase
        .from("licenses")
        .select("id, code, license_type, customer_email, customer_name, customer_ref, is_used, is_delivered, revoked, created_at, activated_at")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) return json({ error: "No se pudieron leer las licencias" }, 500);
      return json({ licenses: data || [] });
    }

    // Creacion real de licencias en la base. Esto es lo que faltaba: el
    // generador antiguo creaba codigos en el navegador (localStorage) y el
    // servidor los rechazaba con code_not_found al activarlos.
    if (action === "create-licenses") {
      const quantity = Math.min(Math.max(parseInt(body.quantity, 10) || 1, 1), 100);
      const licenseType: LicenseType = LICENSE_TYPES.includes(body.licenseType)
        ? body.licenseType
        : "full";
      const email = clean(body.email, 255)?.toLowerCase() ?? null;
      const name = clean(body.name, 120);
      const ref = clean(body.ref, 120);

      const created: unknown[] = [];
      const failed: string[] = [];

      for (let i = 0; i < quantity; i++) {
        // Reintenta si el codigo choca con el indice unico.
        let inserted = false;
        for (let attempt = 0; attempt < 5 && !inserted; attempt++) {
          const code = generateLicenseCode(licenseType);
          const { data, error } = await supabase
            .from("licenses")
            .insert({
              code,
              license_type: licenseType,
              customer_email: email,
              customer_name: name,
              customer_ref: ref,
              is_delivered: false,
            })
            .select("id, code, license_type, customer_email, customer_name, customer_ref, created_at")
            .single();

          if (!error && data) {
            created.push(data);
            inserted = true;
          } else if (error && error.code !== "23505") {
            failed.push(error.message);
            break;
          }
        }
      }

      if (created.length === 0) {
        return json({ error: "No se pudo crear ninguna licencia", details: failed }, 500);
      }
      return json({ created, createdCount: created.length, requested: quantity, failed });
    }

    // Revocar / reactivar una licencia (reemplaza al viejo "eliminar" local).
    if (action === "set-license-revoked") {
      const { code, revoked } = body;
      if (typeof code !== "string" || !code.trim()) {
        return json({ error: "Falta el codigo" }, 400);
      }
      const { data, error } = await supabase
        .from("licenses")
        .update({ revoked: Boolean(revoked) })
        .eq("code", code.trim().toUpperCase())
        .select("id, code, revoked")
        .maybeSingle();
      if (error) return json({ error: "No se pudo actualizar" }, 500);
      if (!data) return json({ error: "code_not_found" }, 404);
      return json({ license: data });
    }

    return json({ error: "Acción no válida" }, 400);
  } catch (error) {
    console.error("Admin error:", error);
    return json({ error: "Error interno" }, 500);
  }
});
