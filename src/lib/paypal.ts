// PayPal integration helpers
import { CONFIG } from "./config";

export interface PayPalOrder {
  id: string;
  amount: number;
  mode: "personal" | "empresarial";
  createdAt: string;
}

export function createOrder(amount: number, mode: "personal" | "empresarial"): PayPalOrder {
  return {
    id: `CF-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    amount,
    mode,
    createdAt: new Date().toISOString(),
  };
}

export function onApprove(order: PayPalOrder): string {
  return generateLicenseCode(order);
}

export function generateLicenseCode(order: PayPalOrder): string {
  const segments = 4;
  const charsPerSegment = 5;
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const parts: string[] = [];
  const randomValues = new Uint32Array(segments * charsPerSegment);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < segments; i++) {
    let part = "";
    for (let j = 0; j < charsPerSegment; j++) {
      part += charset[randomValues[i * charsPerSegment + j] % charset.length];
    }
    parts.push(part);
  }
  return parts.join("-");
}

export function getPayPalLink(mode: "personal" | "empresarial"): string {
  const pricing = CONFIG.PRICING[mode.toUpperCase() as "PERSONAL" | "EMPRESARIAL"];
  const clientId = CONFIG.PAYPAL_CLIENT_ID;
  if (!clientId) {
    return `https://www.paypal.com/paypalme/capfinanzas/${pricing.price}`;
  }
  return `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${clientId}&amount=${pricing.price}&currency_code=${CONFIG.PAYPAL_CURRENCY}&item_name=Cap+Finanzas+${mode}`;
}
