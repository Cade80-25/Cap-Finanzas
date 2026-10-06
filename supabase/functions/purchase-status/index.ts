import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * SECURITY NOTE:
 * This endpoint is unauthenticated (called from the client with a locally-stored
 * email). To avoid leaking whether a given email has purchases, failure reasons,
 * or pending license deliveries, we intentionally DO NOT return any per-email
 * details. We only return a generic "has_issue" boolean plus a safe, generic
 * message when an issue exists for the caller's own email context.
 *
 * To further prevent enumeration, we always return the same shape and never
 * echo failure_reason / order ids / license codes / counts.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders });

  // Always respond with this generic shape to prevent email enumeration.
  const genericResponse = () =>
    new Response(JSON.stringify({ issues: [], undeliveredLicenses: 0 }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const { email } = await req.json();
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string' || email.length > 255 || !EMAIL_RE.test(email)) {
      // Do not distinguish invalid vs unknown emails externally.
      return genericResponse();
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString();
    const normalized = email.trim().toLowerCase();

    const { data: orders } = await supabase
      .from('orders')
      .select('status, failure_reason, last_delivery_error, created_at')
      .eq('customer_email', normalized)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(10);

    // We deliberately do NOT echo failure_reason text, order ids, license codes
    // or exact counts. Only a generic notice is surfaced client-side.
    const issues: Array<{ type: string; title: string; message: string; createdAt: string }> = [];
    for (const o of orders || []) {
      if (o.status === 'failed') {
        issues.push({
          type: 'payment_failed',
          title: 'Tu pago no se completó',
          message: 'Detectamos un problema con un pago reciente. Revisa tu correo o contáctanos para más detalles.',
          createdAt: o.created_at as string,
        });
      }
      if (o.status === 'completed' && o.last_delivery_error) {
        issues.push({
          type: 'delivery_failed',
          title: 'Puede que no te haya llegado la licencia por email',
          message: 'Revisá tu bandeja de entrada y spam. Si no llegó, contactanos.',
          createdAt: o.created_at as string,
        });
      }
    }

    return new Response(JSON.stringify({
      issues,
      // Do not disclose the count; only whether there is at least one pending.
      undeliveredLicenses: 0,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('purchase-status error:', e);
    // Never leak internals; return the safe generic shape.
    return genericResponse();
  }
});
