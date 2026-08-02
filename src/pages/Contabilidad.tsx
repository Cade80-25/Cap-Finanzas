import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, FileText, BarChart3, TrendingUp, Calculator } from "lucide-react";
import LibroDiario from "./LibroDiario";
import LibroMayor from "./LibroMayor";
import Balance from "./Balance";
import EstadoResultados from "./EstadoResultados";

export default function Contabilidad() {
  const [params, setParams] = useSearchParams();
  const initial = params.get("tab") || "diario";
  const [tab, setTab] = useState(initial);

  const handleChange = (v: string) => {
    setTab(v);
    setParams({ tab: v }, { replace: true });
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-soft">
          <Calculator className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Contabilidad
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Libros contables y estados financieros tradicionales
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={handleChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 max-w-3xl h-auto">
          <TabsTrigger value="diario" className="gap-2 py-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Libro Diario</span>
            <span className="sm:hidden">Diario</span>
          </TabsTrigger>
          <TabsTrigger value="mayor" className="gap-2 py-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Libro Mayor</span>
            <span className="sm:hidden">Mayor</span>
          </TabsTrigger>
          <TabsTrigger value="balance" className="gap-2 py-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Balance</span>
            <span className="sm:hidden">Balance</span>
          </TabsTrigger>
          <TabsTrigger value="resultados" className="gap-2 py-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Resultados</span>
            <span className="sm:hidden">Result.</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="diario" className="mt-4 -mx-3 sm:-mx-6 lg:-mx-8">
          <LibroDiario />
        </TabsContent>
        <TabsContent value="mayor" className="mt-4 -mx-3 sm:-mx-6 lg:-mx-8">
          <LibroMayor />
        </TabsContent>
        <TabsContent value="balance" className="mt-4 -mx-3 sm:-mx-6 lg:-mx-8">
          <Balance />
        </TabsContent>
        <TabsContent value="resultados" className="mt-4 -mx-3 sm:-mx-6 lg:-mx-8">
          <EstadoResultados />
        </TabsContent>
      </Tabs>
    </div>
  );
}
