import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, ArrowRight, Calculator } from "lucide-react";

const URL = "https://capfinanzas.com/comparativa";

const COMPETITORS: { key: CompKey; name: string; highlight?: boolean }[] = [
  { key: "cap", name: "Cap Finanzas", highlight: true },
  { key: "fintonic", name: "Fintonic" },
  { key: "mobills", name: "Mobills" },
  { key: "monefy", name: "Monefy" },
  { key: "excel", name: "Excel / Hojas de cálculo" },
];

type CompKey = "cap" | "fintonic" | "mobills" | "monefy" | "excel";

type CompKey = (typeof COMPETITORS)[number]["key"];

const ROWS: { label: string; values: Record<CompKey, string | boolean> }[] = [
  {
    label: "Precio",
    values: {
      cap: "$10 USD único",
      fintonic: "Suscripción mensual",
      mobills: "Suscripción mensual",
      monefy: "Gratis con anuncios / Pro pago",
      excel: "Variable",
    },
  },
  {
    label: "Funciona 100% offline",
    values: { cap: true, fintonic: false, mobills: false, monefy: true, excel: true },
  },
  {
    label: "Datos guardados en tu dispositivo",
    values: { cap: true, fintonic: false, mobills: false, monefy: true, excel: true },
  },
  {
    label: "Contabilidad de partida doble",
    values: { cap: true, fintonic: false, mobills: false, monefy: false, excel: "Manual" },
  },
  {
    label: "Libro diario, mayor, balance, estado de resultados",
    values: { cap: true, fintonic: false, mobills: false, monefy: false, excel: "Manual" },
  },
  {
    label: "Multimoneda con tasas en vivo",
    values: { cap: true, fintonic: false, mobills: true, monefy: false, excel: "Manual" },
  },
  {
    label: "Tutor financiero con IA",
    values: { cap: true, fintonic: false, mobills: false, monefy: false, excel: false },
  },
  {
    label: "App de escritorio (Windows)",
    values: { cap: true, fintonic: false, mobills: false, monefy: false, excel: true },
  },
  {
    label: "PWA instalable en móvil",
    values: { cap: true, fintonic: true, mobills: true, monefy: true, excel: false },
  },
  {
    label: "Sin telemetría, sin anuncios",
    values: { cap: true, fintonic: false, mobills: false, monefy: false, excel: true },
  },
];

const FAQ = [
  {
    q: "¿Cap Finanzas es realmente más barato que Fintonic o Mobills?",
    a: "Sí. Cap Finanzas es un pago único de $10 USD de por vida. Fintonic y Mobills requieren suscripción mensual o anual: en menos de un año ya pagaste más que Cap Finanzas para siempre.",
  },
  {
    q: "¿Qué pasa con mis datos si la empresa cierra?",
    a: "Con Cap Finanzas no pasa nada: tus datos están en tu dispositivo. Con Fintonic, Mobills o cualquier app en la nube, si el servicio cierra perdés acceso a tu información.",
  },
  {
    q: "¿Cuál es mejor para llevar contabilidad de un emprendimiento?",
    a: "Cap Finanzas es el único de la comparativa que incluye contabilidad de partida doble completa con libro diario, mayor, balance y estado de resultados. Los demás solo manejan finanzas personales básicas.",
  },
  {
    q: "¿Y Monefy? También es offline.",
    a: "Monefy es muy simple y solo funciona como un control de gastos. Cap Finanzas hace lo mismo en su Modo Simple y suma contabilidad profesional, multimoneda, tutor IA y reportes avanzados cuando los necesitás.",
  },
];

function Cell({ value }: { value: string | boolean }) {
  if (value === true) return <Check className="h-5 w-5 text-emerald-600 mx-auto" />;
  if (value === false) return <X className="h-5 w-5 text-muted-foreground/50 mx-auto" />;
  return <span className="text-sm text-foreground">{value}</span>;
}

export default function Comparativa() {
  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Cap Finanzas",
    description:
      "Software de finanzas personales y contabilidad 100% offline. Pago único de $10 USD.",
    brand: { "@type": "Brand", name: "Cap Finanzas" },
    offers: {
      "@type": "Offer",
      price: "10",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: URL,
    },
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "https://capfinanzas.com/" },
      { "@type": "ListItem", position: 2, name: "Comparativa", item: URL },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Cap Finanzas vs Fintonic, Mobills, Monefy y Excel — Comparativa</title>
        <meta
          name="description"
          content="Comparativa honesta de Cap Finanzas frente a Fintonic, Mobills, Monefy y Excel. Precio, offline, contabilidad de partida doble, privacidad y más."
        />
        <link rel="canonical" href={URL} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={URL} />
        <meta
          property="og:title"
          content="Comparativa: Cap Finanzas vs Fintonic, Mobills, Monefy y Excel"
        />
        <meta
          property="og:description"
          content="¿Qué app de finanzas conviene más? Comparativa cara a cara: precio, offline, contabilidad y privacidad."
        />
        <script type="application/ld+json">{JSON.stringify(productLd)}</script>
        <script type="application/ld+json">{JSON.stringify(faqLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
      </Helmet>

      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/landing" className="flex items-center gap-2 font-semibold">
            <Calculator className="h-5 w-5 text-primary" />
            Cap Finanzas
          </Link>
          <Button asChild size="sm">
            <Link to="/landing#precios">
              Ver precios <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </header>

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-4">
              Comparativa
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Cap Finanzas vs Fintonic, Mobills, Monefy y Excel
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Comparativa honesta de las apps más buscadas para finanzas personales y
              contabilidad. Sin marketing: solo lo que importa para decidir.
            </p>
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-3 font-semibold">Característica</th>
                    {COMPETITORS.map((c) => (
                      <th
                        key={c.key}
                        className={`p-3 text-center font-semibold ${
                          c.highlight ? "text-primary" : ""
                        }`}
                      >
                        {c.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((row, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-3 font-medium">{row.label}</td>
                      {COMPETITORS.map((c) => (
                        <td
                          key={c.key}
                          className={`p-3 text-center ${
                            c.highlight ? "bg-primary/5" : ""
                          }`}
                        >
                          <Cell value={row.values[c.key]} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <p className="text-xs text-muted-foreground mt-3 text-center">
            Información basada en planes públicos al momento de publicación. Verificá
            siempre en la web oficial de cada producto.
          </p>

          <div className="text-center mt-12 mb-16">
            <Button size="lg" asChild>
              <Link to="/landing#precios">
                Probar Cap Finanzas gratis 30 días <ArrowRight className="h-5 w-5 ml-1" />
              </Link>
            </Button>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">
            Preguntas frecuentes
          </h2>
          <div className="space-y-3 max-w-3xl mx-auto">
            {FAQ.map((f, i) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle className="text-base">{f.q}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{f.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <Link to="/landing" className="hover:text-foreground">
          Volver al inicio
        </Link>
        <span className="mx-2">·</span>
        <Link to="/aprender" className="hover:text-foreground">
          Aprender
        </Link>
        <span className="mx-2">·</span>
        <Link to="/privacidad" className="hover:text-foreground">
          Privacidad
        </Link>
      </footer>
    </div>
  );
}
