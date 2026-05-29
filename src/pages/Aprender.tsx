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
        </TabsContent>
        <TabsContent value="enciclopedia" className="mt-4 -mx-3 sm:-mx-6 lg:-mx-8">
          <Enciclopedia />
        </TabsContent>
      </Tabs>
    </div>
  );
}
