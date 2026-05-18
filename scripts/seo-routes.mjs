// Single source of truth for per-route SEO metadata.
// Used by the prerender Vite plugin AND the OG checker script.
// Keep titles/descriptions in sync with src/components/SeoHead.tsx usage.

export const BASE_URL = "https://capfinanzas.com";
export const DEFAULT_IMAGE = `${BASE_URL}/og-image.jpg`;

export const ROUTES = [
  {
    path: "/landing",
    title: "Cap Finanzas — Software de Contabilidad Personal Offline",
    description:
      "Control total de tus finanzas personales. 100% offline y privado. Pago único $10 USD. Prueba gratis 30 días.",
    image: DEFAULT_IMAGE,
    type: "website",
  },
  {
    path: "/instalar",
    title: "Instalar Cap Finanzas — Windows, Mac, Linux y Web",
    description:
      "Descarga e instala Cap Finanzas en tu dispositivo. Versiones para Windows, Mac, Linux y PWA web.",
    image: DEFAULT_IMAGE,
    type: "website",
  },
  {
    path: "/aprender",
    title: "Aprender — Tutor financiero IA, manual y enciclopedia",
    description:
      "Aprende finanzas con el tutor IA, manual de uso y enciclopedia financiera de Cap Finanzas.",
    image: DEFAULT_IMAGE,
    type: "website",
  },
  {
    path: "/privacidad",
    title: "Política de Privacidad — Cap Finanzas",
    description:
      "Cap Finanzas guarda tus datos 100% locales. No hay telemetría ni servidores externos. Conoce nuestra política de privacidad.",
    image: DEFAULT_IMAGE,
    type: "website",
  },
  {
    path: "/terminos",
    title: "Términos del Servicio — Cap Finanzas",
    description:
      "Términos de uso y licencia de Cap Finanzas. Pago único de $10 USD, sin suscripciones.",
    image: DEFAULT_IMAGE,
    type: "website",
  },
];
