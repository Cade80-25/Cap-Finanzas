import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNotifications } from "./useNotifications";
import { useLocalStorage } from "./useLocalStorage";

const CHECK_INTERVAL_MS = 1000 * 60 * 15; // cada 15 min como máximo

interface PurchaseIssue {
  type: string;
  title: string;
  message: string;
  createdAt: string;
}

/**
 * Si el usuario guardó su email de compra (en ajustes de notificaciones u otro),
 * consulta el backend en busca de fallos de pago o problemas de entrega de licencia
 * y los inserta como notificaciones in-app.
 */
export function usePurchaseIssueNotifications() {
  const { addNotification, notifications, settings } = useNotifications();
  const [lastCheck, setLastCheck] = useLocalStorage<string>(
    "cap-finanzas-purchase-check",
    ""
  );
  const [seenIssues, setSeenIssues] = useLocalStorage<string[]>(
    "cap-finanzas-seen-purchase-issues",
    []
  );
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    const email = settings.email?.trim();
    if (!email || !email.includes("@")) return;

    const last = lastCheck ? Date.parse(lastCheck) : 0;
    if (Date.now() - last < CHECK_INTERVAL_MS) return;
    ranRef.current = true;

    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("purchase-status", {
          body: { email },
        });
        if (error || !data?.issues) return;

        setLastCheck(new Date().toISOString());

        const fresh: string[] = [];
        for (const issue of data.issues as PurchaseIssue[]) {
          const key = `${issue.type}:${issue.createdAt}`;
          if (seenIssues.includes(key)) continue;
          // Evitar duplicados con notificaciones ya presentes
          if (notifications.some((n) => n.message === issue.message && n.title === issue.title)) {
            fresh.push(key);
            continue;
          }
          addNotification({
            title: issue.title,
            message: issue.message,
            type: issue.type === "payment_failed" ? "error" : "warning",
            category: "pago",
          });
          fresh.push(key);
        }
        if (fresh.length) {
          setSeenIssues([...seenIssues, ...fresh].slice(-50));
        }
      } catch (e) {
        console.warn("purchase-status check failed", e);
      }
    })();
  }, [settings.email, lastCheck, seenIssues, notifications, addNotification, setLastCheck, setSeenIssues]);
}
