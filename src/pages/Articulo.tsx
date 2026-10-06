import { Helmet } from "react-helmet-async";
import { Link, useParams, Navigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { ARTICLES, getArticle } from "@/lib/articles";

const BASE = "https://capfinanzas.com";

function renderBody(body: string) {
  const blocks = body.split("\n\n");
  return blocks.map((block, idx) => {
    if (block.trim().startsWith("- ")) {
      const items = block
        .split("\n")
        .filter((l) => l.trim().startsWith("- "))
        .map((l) => l.replace(/^-\s+/, ""));
      return (
        <ul key={idx} className="list-disc pl-5 space-y-1.5 my-3 text-muted-foreground">
          {items.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ul>
      );
    }
    return (
      <p key={idx} className="my-3 text-muted-foreground leading-relaxed">
        {block}
      </p>
    );
  });
}

export default function Articulo() {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? getArticle(slug) : undefined;
  if (!article) return <Navigate to="/aprender" replace />;

  const url = `${BASE}/aprender/articulos/${article.slug}`;

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.publishedAt,
    dateModified: article.publishedAt,
    author: { "@type": "Organization", name: "Cap Finanzas" },
    publisher: {
      "@type": "Organization",
      name: "Cap Finanzas",
      logo: { "@type": "ImageObject", url: `${BASE}/icon-192.png` },
    },
    mainEntityOfPage: url,
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: `${BASE}/` },
      { "@type": "ListItem", position: 2, name: "Aprender", item: `${BASE}/aprender` },
      { "@type": "ListItem", position: 3, name: article.title, item: url },
    ],
  };

  const related = (article.related || [])
    .map((s) => ARTICLES.find((a) => a.slug === s))
    .filter(Boolean) as typeof ARTICLES;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{article.title} — Cap Finanzas</title>
        <meta name="description" content={article.description} />
        <meta name="keywords" content={article.keywords} />
        <link rel="canonical" href={url} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={url} />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.description} />
        <script type="application/ld+json">{JSON.stringify(articleLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
      </Helmet>

      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/landing" className="flex items-center gap-2 font-semibold">
            <Calculator className="h-5 w-5 text-primary" />
            Cap Finanzas
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link to="/aprender">
              <ArrowLeft className="h-4 w-4 mr-1" /> Aprender
            </Link>
          </Button>
        </div>
      </header>

      <article className="container mx-auto px-4 py-12 max-w-3xl">
        <nav className="text-xs text-muted-foreground mb-4">
          <Link to="/" className="hover:text-foreground">
            Inicio
          </Link>
          <span className="mx-1.5">/</span>
          <Link to="/aprender" className="hover:text-foreground">
            Aprender
          </Link>
        </nav>

        <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
          {article.title}
        </h1>
        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-8">
          <time dateTime={article.publishedAt}>
            {new Date(article.publishedAt).toLocaleDateString("es-ES", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
          <span>·</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {article.readingMinutes} min de lectura
          </span>
        </div>

        <p className="text-lg text-foreground/90 leading-relaxed mb-8">{article.intro}</p>

        {article.sections.map((s, i) => (
          <section key={i} className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-3">{s.heading}</h2>
            {renderBody(s.body)}
          </section>
        ))}

        <Card className="mt-12 bg-primary/5 border-primary/30">
          <CardContent className="pt-6 text-center">
            <p className="font-semibold mb-3">¿Te sirvió este artículo?</p>
            <p className="text-sm text-muted-foreground mb-4">
              Probá Cap Finanzas gratis durante 30 días. Sin tarjeta, sin registro.
            </p>
            <Button asChild>
              <Link to="/landing#precios">
                Empezar ahora <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold mb-4">Seguí leyendo</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  to={`/aprender/articulos/${r.slug}`}
                  className="block p-4 rounded-lg border hover:border-primary hover:bg-primary/5 transition"
                >
                  <p className="font-semibold mb-1">{r.title}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {r.description}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
