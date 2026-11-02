// Shared email queue helper for edge functions
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface EmailPayload {
  message_id: string;
  run_id: string;
  to: string;
  from: string;
  sender_domain: string;
  subject: string;
  label: string;
  purpose: "auth" | "transactional";
  idempotency_key: string;
  unsubscribe_token?: string;
  html: string;
  text: string;
  queued_at?: string;
}

export async function enqueueEmail(
  supabase: ReturnType<typeof createClient>,
  queueName: "auth_emails" | "transactional_emails",
  payload: EmailPayload,
): Promise<{ msg_id: number } | null> {
  const { data, error } = await supabase.rpc("enqueue_email", {
    queue_name: queueName,
    payload,
  });

  if (error) {
    console.error("Enqueue email error:", { queueName, error, payload: { message_id: payload.message_id, to: payload.to } });
    return null;
  }

  return { msg_id: data };
}