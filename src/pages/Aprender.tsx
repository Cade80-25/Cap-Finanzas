import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, BookOpen, Sparkles, Book, FileText, ArrowRight } from "lucide-react";
import Enciclopedia from "./Enciclopedia";
import Manual from "./Manual";
import Recomendaciones from "./Recomendaciones";
import { SeoHead } from "@/components/SeoHead";
import { ARTICLES } from "@/lib/articles";

export default function Aprender() {
  const [params, setParams] = useSearchParams();
  const initial = params.get("tab") || "manual";
  const [tab, setTab] = useState(initial);

  const handleChange = (v: string) => {
    setTab(v);
    setParams({ tab: v }, { replace: true });
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 animate-fade-in">
      <SeoHead
        title="Aprender — Tutor financiero IA, manual y enciclopedia"
        description="Aprende finanzas con el tutor IA, manual de uso y enciclopedia financiera de Cap Finanzas."
        path="/aprender"
      />
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-soft">
          <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Aprender
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manual, recomendaciones y enciclopedia financiera en un solo lugar
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={handleChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl">
          <TabsTrigger value="manual" className="gap-2">
            <Book className="h-4 w-4" />
            <span className="hidden sm:inline">Manual</span>
          </TabsTrigger>
          <TabsTrigger value="recomendaciones" className="gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Recomendaciones</span>
          </TabsTrigger>
          <TabsTrigger value="enciclopedia" className="gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Enciclopedia</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="mt-4 -mx-3 sm:-mx-6 lg:-mx-8">
          <Manual />
        </TabsContent>
        <TabsContent value="recomendaciones" className="mt-4 -mx-3 sm:-mx-6 lg:-mx-8">
          <Recomendaciones />
        <TabsContent value="enciclopedia" className="mt-4 -mx-3 sm:-mx-6 lg:-mx-8">
          <Enciclopedia />
        </TabsContent>
      </Tabs>

      <section className="mt-10 space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="text-xl sm:text-2xl font-semibold">Artículos</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Guías rápidas para llevar tus finanzas y entender conceptos contables clave.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ARTICLES.map((a) => (
            <Link key={a.slug} to={`/aprender/articulos/${a.slug}`} className="group">
              <Card className="h-full transition-all hover:shadow-md hover:border-primary/40">
                <CardHeader>
                  <CardTitle className="text-base group-hover:text-primary transition-colors">
                    {a.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-3">{a.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground flex items-center gap-2">
                  <span>{a.readingMinutes} min de lectura</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-auto group-hover:translate-x-1 transition-transform" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

}
