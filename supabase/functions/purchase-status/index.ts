import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders });

  try {
    const { email } = await req.json();
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string' || email.length > 255 || !EMAIL_RE.test(email)) {
      return new Response(JSON.stringify({ error: 'invalid_email' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(); // 30 días
    const normalized = email.trim().toLowerCase();

    const { data: orders } = await supabase
      .from('orders')
      .select('id, status, failure_reason, last_delivery_error, created_at, paddle_txn_id')
      .eq('customer_email', normalized)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: licenses } = await supabase
      .from('licenses')
      .select('code, is_delivered, created_at')
      .eq('customer_email', normalized)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(10);

    const issues: Array<{ type: string; title: string; message: string; createdAt: string }> = [];

    for (const o of orders || []) {
      if (o.status === 'failed' && o.failure_reason) {
        issues.push({
          type: 'payment_failed',
          title: 'Tu pago no se completó',
          message: o.failure_reason,
          createdAt: o.created_at as string,
        });
      }
      if (o.status === 'completed' && o.last_delivery_error) {
        issues.push({
          type: 'delivery_failed',
          title: 'No pudimos enviarte la licencia por email',
          message: 'Revisá tu bandeja de entrada y spam. Si no llegó, contactanos.',
          createdAt: o.created_at as string,
        });
      }
    }

    const undelivered = (licenses || []).filter((l: any) => !l.is_delivered);

    return new Response(JSON.stringify({
      issues,
      undeliveredLicenses: undelivered.length,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('purchase-status error:', e);
    return new Response(JSON.stringify({ error: 'internal_error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
