import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// License code generation (same algorithm as frontend)
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

// Map PayPal item/amount to plan type
function detectPlanType(
  amount: number,
  itemName?: string
): "simple" | "traditional" | "full" | "account" | null {
  if (itemName) {
    const lower = itemName.toLowerCase();
    if (lower.includes("completa") || lower.includes("full")) return "full";
    if (lower.includes("contabilidad") || lower.includes("traditional"))
      return "traditional";
    if (lower.includes("simple") || lower.includes("personal")) return "simple";
    if (lower.includes("cuenta") || lower.includes("account")) return "account";
  }
  // Fallback by amount
  if (amount === 12) return "full";
  if (amount === 10) return "traditional";
  if (amount === 5) return "simple";
  if (amount === 2) return "account";
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // PayPal IPN sends form-encoded data
    const body = await req.text();
    const params = new URLSearchParams(body);

    // Step 1: Verify with PayPal
    const verifyBody = `cmd=_notify-validate&${body}`;
    const verifyRes = await fetch(
      "https://ipnpb.paypal.com/cgi-bin/webscr",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: verifyBody,
      }
    );
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
    const custom = params.get("custom") || ""; // We'll put customer email here

    // Verify it's for our account
    const expectedReceiver = "pierresshop48@gmail.com";
    if (receiverEmail !== expectedReceiver) {
      console.error("Wrong receiver:", receiverEmail);
      return new Response("Wrong receiver", { status: 400 });
    }

    // Only process completed payments
    if (paymentStatus !== "Completed") {
      console.log("Payment not completed:", paymentStatus);
      return new Response("OK - not completed", { status: 200 });
    }

    // Step 3: Detect plan
    const planType = detectPlanType(mcGross, itemName);
    if (!planType) {
      console.error("Unknown plan for amount:", mcGross, itemName);
      return new Response("Unknown plan", { status: 400 });
    }

    // Customer email: from custom field, or payer email
    const customerEmail = custom || payerEmail || "";

    // Step 4: Store in database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_email: customerEmail,
        plan_type: planType,
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
    const licenseCode = generateLicenseCode(planType);

    const { error: licenseError } = await supabase.from("licenses").insert({
      order_id: order.id,
      code: licenseCode,
      license_type: planType,
      customer_email: customerEmail,
      is_delivered: false,
    });

    if (licenseError) {
      console.error("License insert error:", licenseError);
      return new Response("License error", { status: 500 });
    }

    console.log(
      `License generated: ${licenseCode} for ${customerEmail} (${planType})`
    );

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("IPN Error:", error);
    return new Response("Error", { status: 500 });
  }
});
