import { createClient } from 'npm:@supabase/supabase-js@2';
import { verifyWebhook, EventName, type PaddleEnv } from '../_shared/paddle.ts';

function generateLicenseCode(): string {
  const prefix = 'CF-FULL';
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let code = '';
  for (let i = 0; i < 8; i++) code += chars[bytes[i] % chars.length];
  let checksum = 0;
  for (let i = 0; i < code.length; i++) checksum += code.charCodeAt(i);
  const checksumChar = chars.charAt(checksum % chars.length);
  return `${prefix}-${code.substring(0, 4)}-${code.substring(4)}${checksumChar}`;
}

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }
  return _supabase;
}

async function sendLicenseEmail(email: string, code: string) {
  const resendKey = Deno.env.get('RESEND_API_KEY');
  if (!resendKey) {
    console.log('RESEND_API_KEY not set, skipping email');
    return false;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendKey}` },
    body: JSON.stringify({
      from: 'Cap Finanzas <noreply@capfinanzas.com>',
      to: [email],
      subject: 'Tu licencia de Cap Finanzas — Acceso Completo',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb; text-align: center;">¡Gracias por tu compra!</h1>
          <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin: 20px 0; text-align: center;">
            <p style="margin: 0 0 8px; color: #64748b;">Tu código de activación:</p>
            <p style="font-size: 28px; font-weight: bold; font-family: monospace; color: #1e293b; letter-spacing: 2px; margin: 0;">${code}</p>
            <p style="margin: 12px 0 0; color: #64748b; font-size: 14px;">Acceso Completo — Cap Finanzas</p>
          </div>
          <h2 style="color: #1e293b;">¿Cómo activar?</h2>
          <ol style="color: #475569; line-height: 1.8;">
            <li>Abre Cap Finanzas</li>
            <li>Ve a <strong>Configuración → Licencia</strong></li>
            <li>Haz clic en <strong>"Activar con código"</strong></li>
            <li>Pega tu código: <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${code}</code></li>
          </ol>
        </div>
      `,
    }),
  });
  if (!res.ok) {
    console.error('Email send failed:', await res.text());
    return false;
  }
  return true;
}

async function handleTransactionCompleted(data: any, env: PaddleEnv) {
  const txnId = data.id;
  const customerEmail = data.customData?.customerEmail || data.customerEmail || '';
  const totalRaw = data.details?.totals?.total || data.payout?.totals?.total || '0';
  const amount = parseFloat(totalRaw) / 100;
  const currency = data.currencyCode || 'USD';

  const supabase = getSupabase();

  // Dedupe
  const { data: existing } = await supabase
    .from('orders')
    .select('id')
    .eq('paddle_txn_id', txnId)
    .maybeSingle();
  if (existing) {
    console.log('Duplicate paddle txn:', txnId);
    return;
  }

  let email = customerEmail;
  if (!email && data.customerId) {
    // Fetch customer email via Paddle API
    try {
      const { gatewayFetch } = await import('../_shared/paddle.ts');
      const res = await gatewayFetch(env, `/customers/${data.customerId}`);
      const j = await res.json();
      email = j.data?.email || '';
    } catch (e) {
      console.error('Failed to fetch customer:', e);
    }
  }

  if (!email) {
    console.error('No customer email for txn', txnId);
    return;
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_email: email,
      plan_type: 'full',
      amount,
      currency: currency.toUpperCase(),
      paddle_txn_id: txnId,
      status: 'completed',
    })
    .select()
    .single();

  if (orderError || !order) {
    console.error('Order insert error:', orderError);
    return;
  }

  const licenseCode = generateLicenseCode();
  const { error: licenseError } = await supabase.from('licenses').insert({
    order_id: order.id,
    code: licenseCode,
    license_type: 'full',
    customer_email: email,
    is_delivered: false,
  });

  if (licenseError) {
    console.error('License insert error:', licenseError);
    return;
  }

  console.log(`Paddle license generated: ${licenseCode} for ${email} (env=${env})`);

  const delivered = await sendLicenseEmail(email, licenseCode);
  if (delivered) {
    await supabase.from('licenses').update({ is_delivered: true }).eq('code', licenseCode);
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const url = new URL(req.url);
  const env = (url.searchParams.get('env') || 'sandbox') as PaddleEnv;
  try {
    const event = await verifyWebhook(req, env);
    console.log('Paddle webhook event:', event.eventType, 'env:', env);
    switch (event.eventType) {
      case EventName.TransactionCompleted:
        await handleTransactionCompleted(event.data, env);
        break;
      default:
        console.log('Unhandled event:', event.eventType);
    }
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Webhook error:', e);
    return new Response('Webhook error', { status: 400 });
  }
});
