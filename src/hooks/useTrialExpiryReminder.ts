import { useEffect } from "react";
import { useLicense } from "./useLicense";
import { useNotifications } from "./useNotifications";

const SEEN_KEY = "cap-finanzas-trial-expiry-seen";

/**
 * Shows an in-app notification when the trial is in its last 5 days.
 * Deduplicates by day so it doesn't spam users on every render.
 */
export function useTrialExpiryReminder() {
  const { status, trialInfo } = useLicense();
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (status !== "trial") return;
    if (trialInfo.daysRemaining > 5 || trialInfo.daysRemaining < 0) return;

    const todayKey = `${new Date().toISOString().slice(0, 10)}::${trialInfo.daysRemaining}`;
    const seen = localStorage.getItem(SEEN_KEY);
    if (seen === todayKey) return;

    const daysLabel =
      trialInfo.daysRemaining === 0
        ? "hoy"
        : trialInfo.daysRemaining === 1
        ? "mañana"
        : `en ${trialInfo.daysRemaining} días`;

    addNotification({
      title: "Tu prueba está por terminar",
      message: `Vence ${daysLabel}. Conseguí acceso de por vida por $10 USD y seguí sin interrupciones.`,
      type: "warning",
      category: "sistema",
    });
    localStorage.setItem(SEEN_KEY, todayKey);
  }, [status, trialInfo.daysRemaining, addNotification]);
}
