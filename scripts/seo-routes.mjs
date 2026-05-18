// Single source of truth for per-route SEO metadata.
// Used by the prerender Vite plugin AND the OG checker script.
// Keep titles/descriptions in sync with src/components/SeoHead.tsx usage.

export const BASE_URL = "https://capfinanzas.com";
export const DEFAULT_IMAGE = `${BASE_URL}/og-image.jpg`;

export const ROUTES = [
  {
    path: "/landing",
    title: "Cap Finanzas — Contabilidad personal offline y privada",
    description:
      "Software de finanzas personales y contabilidad 100% offline. Gastos, libros contables y tutor IA. Pago único $10 USD. Prueba gratis 30 días.",
    image: DEFAULT_IMAGE,
    type: "website",
  },
  {
    path: "/instalar",
    title: "Descargar Cap Finanzas — App de escritorio y PWA",
    description:
      "Descarga Cap Finanzas para Windows o instálala como PWA en móvil y escritorio. 100% offline, pago único $10 USD.",
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
