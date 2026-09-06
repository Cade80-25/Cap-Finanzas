// Configuración central de Cap-Finanzas
export const CONFIG = {
  ADMIN_EMAIL: "administracion@capfinanzas.com",
  SUPPORT_EMAIL: "soporte@capfinanzas.com",
  PAYPAL_CLIENT_ID: "", // Configurar con Client ID real de producción
  PAYPAL_CURRENCY: "USD",
  TRIAL_DAYS: 30,
  PRICING: {
    PERSONAL: { price: 20, interval: "once" },
    EMPRESARIAL: { price: 100, interval: "semester" },
  },
};
