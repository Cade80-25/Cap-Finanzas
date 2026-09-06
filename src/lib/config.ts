// Configuración central de Cap-Finanzas
export const CONFIG = {
  ADMIN_EMAIL: "administracion@capfinanzas.com",
  SUPPORT_EMAIL: "soporte@capfinanzas.com",
  PAYPAL_CLIENT_ID: "AdorOwXpcBRoo3tVyMZthzamgkieoJTMnRfi0GpbTzpG0vN4xq8mjC0CIBduyR1z1LLziQ1n4nRTiuJ1", // Client ID de producción
  PAYPAL_CURRENCY: "USD",
  TRIAL_DAYS: 30,
  PRICING: {
    PERSONAL: { price: 20, interval: "once" },
    EMPRESARIAL: { price: 100, interval: "semester" },
  },
};
