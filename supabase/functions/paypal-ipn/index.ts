import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// License code generation
function generateLicenseCode(
  type: "simple" | "traditional" | "full" | "account"
): string {
  const prefix =
    type === "simple"
      ? "CF-SIMP"
      : type === "full"
      ? "CF-FULL"
      : type === "account"
      ? "CF-ACCT"
      : "CF-TRAD";
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  let checksum = 0;
  for (let i = 0; i < code.length; i++) {
    checksum += code.charCodeAt(i);
  }
  const checksumChar = chars.charAt(checksum % chars.length);
  return `${prefix}-${code.substring(0, 4)}-${code.substring(4)}${checksumChar}`;
}

// Detect if this is an upgrade payment and what the target license type is
interface PlanDetection {
  type: "simple" | "traditional" | "full" | "account";
  isUpgrade: boolean;
  upgradeFrom?: "simple" | "traditional";
}

function detectPlan(amount: number, itemName?: string): PlanDetection | null {
  if (itemName) {
    const lower = itemName.toLowerCase();

    // Upgrade: Tradicional → Completa
    if ((lower.includes("tradicional") || lower.includes("traditional")) && 
        (lower.includes("completa") || lower.includes("full")) &&
        (lower.includes("→") || lower.includes("->") || lower.includes("upgrade") || lower.includes("mejora"))) {
      return { type: "full", isUpgrade: true, upgradeFrom: "traditional" };
    }
    // Upgrade: Simple → Completa
    if ((lower.includes("simple") || lower.includes("personal")) && 
        (lower.includes("completa") || lower.includes("full"))) {
      return { type: "full", isUpgrade: true, upgradeFrom: "simple" };
    }
    // Upgrade: Simple → Tradicional
    if ((lower.includes("simple") || lower.includes("personal")) && 
        (lower.includes("tradicional") || lower.includes("traditional"))) {
      return { type: "traditional", isUpgrade: true, upgradeFrom: "simple" };
    }
    // Direct purchases
    if (lower.includes("completa") || lower.includes("full")) return { type: "full", isUpgrade: false };
    if (lower.includes("contabilidad") || lower.includes("traditional")) return { type: "traditional", isUpgrade: false };
    if (lower.includes("simple") || lower.includes("personal")) return { type: "simple", isUpgrade: false };
    if (lower.includes("cuenta") || lower.includes("account")) return { type: "account", isUpgrade: false };
  }

  // Fallback by amount
  if (amount === 13) return { type: "full", isUpgrade: false };
  if (amount === 11) return { type: "traditional", isUpgrade: false };
  if (amount === 8) return { type: "simple", isUpgrade: false };
  if (amount === 6) return { type: "full", isUpgrade: true, upgradeFrom: "simple" };
  if (amount === 4) return { type: "traditional", isUpgrade: true, upgradeFrom: "simple" };
  if (amount === 3) return { type: "account", isUpgrade: false };
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    const params = new URLSearchParams(body);

    // Detect sandbox vs production
    const testIpn = params.get("test_ipn");
    const isSandbox = testIpn === "1";
    const verifyUrl = isSandbox
      ? "https://ipnpb.sandbox.paypal.com/cgi-bin/webscr"
      : "https://ipnpb.paypal.com/cgi-bin/webscr";

    console.log(`IPN mode: ${isSandbox ? "SANDBOX" : "PRODUCTION"}`);

    // Step 1: Verify with PayPal
    const verifyBody = `cmd=_notify-validate&${body}`;
    const verifyRes = await fetch(verifyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: verifyBody,
    });
    const verifyText = await verifyRes.text();

    if (verifyText !== "VERIFIED") {
      console.error("PayPal IPN not verified:", verifyText);
      return new Response("Not verified", { status: 400 });
    }

    // Step 2: Extract payment info
    const paymentStatus = params.get("payment_status");
    const txnId = params.get("txn_id");
    const payerEmail = params.get("payer_email");
    const receiverEmail = params.get("receiver_email");
    const mcGross = parseFloat(params.get("mc_gross") || "0");
    const mcCurrency = params.get("mc_currency") || "USD";
    const itemName = params.get("item_name") || "";
    const custom = params.get("custom") || "";
    const parentTxnId = params.get("parent_txn_id") || "";

    // Verify it's for our account
    const expectedReceiver = "pierresshop48@gmail.com";
    if (receiverEmail !== expectedReceiver) {
      console.error("Wrong receiver:", receiverEmail);
      return new Response("Wrong receiver", { status: 400 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ===== HANDLE REFUNDS / REVERSALS =====
    if (paymentStatus === "Refunded" || paymentStatus === "Reversed") {
      console.log(`Processing ${paymentStatus} for parent txn: ${parentTxnId}`);
      
      if (parentTxnId) {
        // Find the original order
        const { data: originalOrder } = await supabase
          .from("orders")
          .select("id")
          .eq("paypal_txn_id", parentTxnId)
          .maybeSingle();

        if (originalOrder) {
          // Mark order as refunded
          await supabase
            .from("orders")
            .update({ status: paymentStatus.toLowerCase() })
            .eq("id", originalOrder.id);

          // Invalidate associated licenses
          await supabase
            .from("licenses")
            .update({ is_used: true, is_delivered: true })
            .eq("order_id", originalOrder.id);

          console.log(`Refund processed: order ${originalOrder.id} invalidated`);
        }
      }

      // Log the refund as a separate order entry
      await supabase.from("orders").insert({
        customer_email: payerEmail || "",
        plan_type: "refund",
        amount: mcGross,
        currency: mcCurrency,
        paypal_txn_id: txnId,
        paypal_payer_email: payerEmail,
        status: paymentStatus.toLowerCase(),
      });

      return new Response("OK - refund processed", { status: 200 });
    }

    // Only process completed payments
    if (paymentStatus !== "Completed") {
      console.log("Payment not completed:", paymentStatus);
      return new Response("OK - not completed", { status: 200 });
    }

    // Step 3: Detect plan
    const plan = detectPlan(mcGross, itemName);
    if (!plan) {
      console.error("Unknown plan for amount:", mcGross, itemName);
      return new Response("Unknown plan", { status: 400 });
    }

    const customerEmail = custom || payerEmail || "";

    // Check duplicate txn
    const { data: existing } = await supabase
      .from("orders")
      .select("id")
      .eq("paypal_txn_id", txnId)
      .maybeSingle();

    if (existing) {
      console.log("Duplicate txn:", txnId);
      return new Response("OK - duplicate", { status: 200 });
    }

    // ===== VALIDATE UPGRADES =====
    if (plan.isUpgrade && plan.upgradeFrom) {
      const requiredType = plan.upgradeFrom;
      const { data: priorLicenses } = await supabase
        .from("licenses")
        .select("id, license_type")
        .eq("customer_email", customerEmail)
        .in("license_type", [requiredType, "full"]);

      const hasPrior = priorLicenses && priorLicenses.length > 0;
      
      if (!hasPrior) {
        // Also check by payer email
        const { data: priorByPayer } = await supabase
          .from("licenses")
          .select("id, license_type")
          .eq("customer_email", payerEmail || "")
          .in("license_type", [requiredType, "full"]);

        if (!priorByPayer || priorByPayer.length === 0) {
          console.warn(
            `Upgrade validation warning: No prior ${requiredType} license found for ${customerEmail}. Generating anyway to avoid blocking payment.`
          );
          // We still generate the license — log a warning but don't block
          // This avoids issues if the customer used a different email
        }
      }
    }

    // Step 4: Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_email: customerEmail,
        plan_type: plan.isUpgrade ? `upgrade_${plan.upgradeFrom}_to_${plan.type}` : plan.type,
        amount: mcGross,
        currency: mcCurrency,
        paypal_txn_id: txnId,
        paypal_payer_email: payerEmail,
        status: "completed",
      })
      .select()
      .single();

    if (orderError) {
      console.error("Order insert error:", orderError);
      return new Response("DB error", { status: 500 });
    }

    // Generate license code
    const licenseCode = generateLicenseCode(plan.type);

    const { error: licenseError } = await supabase.from("licenses").insert({
      order_id: order.id,
      code: licenseCode,
      license_type: plan.type,
      customer_email: customerEmail,
      is_delivered: false,
    });

    if (licenseError) {
      console.error("License insert error:", licenseError);
      return new Response("License error", { status: 500 });
    }

    console.log(
      `License generated: ${licenseCode} for ${customerEmail} (${plan.type}, upgrade: ${plan.isUpgrade})`
    );

    // ===== SEND EMAIL =====
    try {
      const resendKey = Deno.env.get("RESEND_API_KEY");
      if (resendKey) {
        const planNames: Record<string, string> = {
          simple: "Finanzas Simples",
          traditional: "Contabilidad Tradicional",
          full: "Licencia Completa",
          account: "Cuenta Adicional",
        };

        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: "Cap Finanzas <noreply@capfinanzas.com>",
            to: [customerEmail],
            subject: `Tu licencia de Cap Finanzas — ${planNames[plan.type] || plan.type}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #2563eb; text-align: center;">¡Gracias por tu compra!</h1>
                <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin: 20px 0; text-align: center;">
                  <p style="margin: 0 0 8px; color: #64748b;">Tu código de activación:</p>
                  <p style="font-size: 28px; font-weight: bold; font-family: monospace; color: #1e293b; letter-spacing: 2px; margin: 0;">
                    ${licenseCode}
                  </p>
                  <p style="margin: 12px 0 0; color: #64748b; font-size: 14px;">
                    ${planNames[plan.type] || plan.type}
                  </p>
                </div>
                <h2 style="color: #1e293b;">¿Cómo activar?</h2>
                <ol style="color: #475569; line-height: 1.8;">
                  <li>Abre Cap Finanzas</li>
                  <li>Ve a <strong>Configuración → Licencia</strong></li>
                  <li>Haz clic en <strong>"Activar con código"</strong></li>
                  <li>Pega tu código: <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${licenseCode}</code></li>
                </ol>
                <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 32px;">
                  Si tienes dudas, responde a este correo. ¡Disfruta Cap Finanzas!
                </p>
              </div>
            `,
          }),
        });

        if (emailRes.ok) {
          console.log(`Email sent to ${customerEmail}`);
          await supabase
            .from("licenses")
            .update({ is_delivered: true })
            .eq("code", licenseCode);
        } else {
          console.error("Email send failed:", await emailRes.text());
        }
      } else {
        console.log("RESEND_API_KEY not set, skipping email");
      }
    } catch (emailErr) {
      console.error("Email error (non-blocking):", emailErr);
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("IPN Error:", error);
    return new Response("Error", { status: 500 });
  }
});
