import { createClient } from 'npm:@supabase/supabase-js@2';
import { verifyWebhook, EventName, type PaddleEnv, gatewayFetch } from '../_shared/paddle.ts';

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

// Map raw Paddle / internal errors to short, user-friendly Spanish reasons.
function summarizeFailure(rawCode?: string | null, rawReason?: string | null): string {
  const code = (rawCode || '').toLowerCase();
  const reason = (rawReason || '').toLowerCase();
  const text = `${code} ${reason}`;

  if (text.includes('insufficient') || text.includes('funds')) return 'Fondos insuficientes en la tarjeta.';
  if (text.includes('declined') || text.includes('do_not_honor')) return 'Tu banco rechazó el pago.';
  if (text.includes('expired')) return 'La tarjeta está vencida.';
  if (text.includes('cvc') || text.includes('cvv')) return 'Código de seguridad (CVV) incorrecto.';
  if (text.includes('3d') || text.includes('authentication')) return 'No se pudo verificar el pago (autenticación 3D Secure).';
  if (text.includes('fraud') || text.includes('suspected')) return 'El banco bloqueó la transacción por seguridad.';
  if (text.includes('limit')) return 'Se superó el límite de tu tarjeta.';
  if (text.includes('network') || text.includes('timeout')) return 'Hubo un problema de conexión con el procesador de pagos.';
  if (rawReason) return rawReason.length > 200 ? rawReason.slice(0, 200) + '…' : rawReason;
  return 'No pudimos procesar el pago. Intentá nuevamente o usá otra tarjeta.';
}

async function sendEmail(opts: { to: string; subject: string; html: string }): Promise<{ ok: boolean; error?: string }> {
  const resendKey = Deno.env.get('RESEND_API_KEY');
  if (!resendKey) return { ok: false, error: 'RESEND_API_KEY no configurada' };
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendKey}` },
      body: JSON.stringify({
        from: 'Cap Finanzas <noreply@capfinanzas.com>',
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
      }),
    });
    if (!res.ok) {
      const txt = await res.text();
      return { ok: false, error: `Resend ${res.status}: ${txt.slice(0, 300)}` };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Error desconocido al enviar email' };
  }
}

const wrap = (title: string, bodyHtml: string, accent = '#4f46e5') => `
  <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color:#1e293b;">
    <div style="background:#f3f4f8; border-radius:12px; padding:28px;">
      <h1 style="color:${accent}; margin:0 0 12px; font-size:22px;">${title}</h1>
      ${bodyHtml}
      <hr style="border:none; border-top:1px solid #e2e8f0; margin:24px 0;" />
      <p style="color:#64748b; font-size:13px; margin:0;">Cap Finanzas — soporte@capfinanzas.com</p>
    </div>
  </div>`;

async function sendLicenseEmail(email: string, code: string) {
  return sendEmail({
    to: email,
    subject: 'Tu licencia de Cap Finanzas — Acceso Completo',
    html: wrap('¡Gracias por tu compra!', `
      <p>Tu código de activación:</p>
      <p style="font-size:26px; font-weight:bold; font-family:monospace; letter-spacing:2px; background:#fff; padding:14px; border-radius:8px; text-align:center;">${code}</p>
      <p>Para activarlo: abrí la app → <strong>Configuración → Licencia → Activar con código</strong>.</p>
    `),
  });
}

async function sendPaymentFailedEmail(email: string, reason: string) {
  return sendEmail({
    to: email,
    subject: 'No pudimos procesar tu pago — Cap Finanzas',
    html: wrap('Tu pago no se completó', `
      <p>Intentamos procesar tu compra en Cap Finanzas y no fue posible completarla.</p>
      <p><strong>Motivo:</strong> ${reason}</p>
      <p>No te preocupes: <strong>no se realizó ningún cargo</strong>. Podés intentarlo nuevamente desde la app o con otro medio de pago.</p>
      <p>Si el problema persiste, respondé este correo y te ayudamos.</p>
    `, '#dc2626'),
  });
}

async function sendLicenseDeliveryIssueEmail(email: string, code: string, errorSummary: string) {
  return sendEmail({
    to: email,
    subject: 'Tu pago se acreditó — recuperá aquí tu licencia',
    html: wrap('Tu compra fue exitosa', `
      <p>Recibimos tu pago correctamente, pero tuvimos un inconveniente al enviarte el correo con la licencia (${errorSummary}).</p>
      <p>Este es tu código de activación:</p>
      <p style="font-size:26px; font-weight:bold; font-family:monospace; letter-spacing:2px; background:#fff; padding:14px; border-radius:8px; text-align:center;">${code}</p>
      <p>Si no podés activarla, contactanos respondiendo a este email.</p>
    `, '#f59e0b'),
  });
}

async function resolveCustomerEmail(data: any, env: PaddleEnv): Promise<string> {
  let email = data.customData?.customerEmail || data.customerEmail || '';
  if (!email && data.customerId) {
    try {
      const res = await gatewayFetch(env, `/customers/${data.customerId}`);
      const j = await res.json();
      email = j.data?.email || '';
    } catch (e) {
      console.error('Failed to fetch customer:', e);
    }
  }
  return email;
}

async function handleTransactionCompleted(data: any, env: PaddleEnv) {
  const txnId = data.id;
  const totalRaw = data.details?.totals?.total || data.payout?.totals?.total || '0';
  const amount = parseFloat(totalRaw) / 100;
  const currency = (data.currencyCode || 'USD').toUpperCase();
  const supabase = getSupabase();

  const { data: existing } = await supabase.from('orders').select('id').eq('paddle_txn_id', txnId).maybeSingle();
  if (existing) { console.log('Duplicate paddle txn:', txnId); return; }

  const email = await resolveCustomerEmail(data, env);
  if (!email) { console.error('No customer email for txn', txnId); return; }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_email: email,
      plan_type: 'full',
      amount,
      currency,
      paddle_txn_id: txnId,
      status: 'completed',
    })
    .select()
    .single();
  if (orderError || !order) { console.error('Order insert error:', orderError); return; }

  const licenseCode = generateLicenseCode();
  const { error: licenseError } = await supabase.from('licenses').insert({
    order_id: order.id,
    code: licenseCode,
    license_type: 'full',
    customer_email: email,
    is_delivered: false,
  });
  if (licenseError) { console.error('License insert error:', licenseError); return; }

  console.log(`Paddle license generated: ${licenseCode} for ${email} (env=${env})`);

  const delivery = await sendLicenseEmail(email, licenseCode);
  await supabase.from('orders').update({
    delivery_attempts: 1,
    last_delivery_error: delivery.ok ? null : delivery.error,
  }).eq('id', order.id);

  if (delivery.ok) {
    await supabase.from('licenses').update({ is_delivered: true }).eq('code', licenseCode);
  } else {
    console.error('License email failed:', delivery.error);
    // Best-effort: try a recovery email explaining the issue + showing the code.
    const reasonSummary = (delivery.error || 'error de envío').slice(0, 120);
    const recovery = await sendLicenseDeliveryIssueEmail(email, licenseCode, reasonSummary);
    if (recovery.ok) {
      await supabase.from('licenses').update({ is_delivered: true }).eq('code', licenseCode);
      await supabase.from('orders').update({ failure_notified_at: new Date().toISOString() }).eq('id', order.id);
    }
  }
}

async function handleTransactionPaymentFailed(data: any, env: PaddleEnv) {
  const txnId = data.id;
  const totalRaw = data.details?.totals?.total || '0';
  const amount = parseFloat(totalRaw) / 100;
  const currency = (data.currencyCode || 'USD').toUpperCase();
  const supabase = getSupabase();

  const email = await resolveCustomerEmail(data, env);
  if (!email) { console.error('No customer email for failed txn', txnId); return; }

  // Try to extract decline reason from Paddle payload
  const lastPayment = Array.isArray(data.payments) ? data.payments[data.payments.length - 1] : null;
  const errorObj = lastPayment?.errorCode || lastPayment?.error || data.error || {};
  const rawCode = typeof errorObj === 'string' ? errorObj : errorObj?.code;
  const rawReason = typeof errorObj === 'string' ? errorObj : (errorObj?.detail || errorObj?.message || lastPayment?.status);
  const reason = summarizeFailure(rawCode, rawReason);

  // Upsert order as failed (idempotent on paddle_txn_id)
  const { data: existing } = await supabase.from('orders').select('id').eq('paddle_txn_id', txnId).maybeSingle();
  if (existing) {
    await supabase.from('orders').update({
      status: 'failed',
      failure_reason: reason,
    }).eq('id', existing.id);
  } else {
    await supabase.from('orders').insert({
      customer_email: email,
      plan_type: 'full',
      amount,
      currency,
      paddle_txn_id: txnId,
      status: 'failed',
      failure_reason: reason,
    });
  }

  const sent = await sendPaymentFailedEmail(email, reason);
  if (sent.ok) {
    await supabase.from('orders').update({ failure_notified_at: new Date().toISOString() }).eq('paddle_txn_id', txnId);
  } else {
    console.error('Failure email could not be sent:', sent.error);
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
      case EventName.TransactionPaymentFailed:
        await handleTransactionPaymentFailed(event.data, env);
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
