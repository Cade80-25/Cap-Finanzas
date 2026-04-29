import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PieChart, Layers } from "lucide-react";
import { useModeFeatures } from "@/hooks/useModeFeatures";
import ResumenPersonal from "./ResumenPersonal";
import ResumenConsolidado from "./ResumenConsolidado";

export default function Resumen() {
  const [params, setParams] = useSearchParams();
  const { isSimpleMode } = useModeFeatures();
  const initial = params.get("tab") || "personal";
  const [tab, setTab] = useState(initial);

  const handleChange = (v: string) => {
    setTab(v);
    setParams({ tab: v }, { replace: true });
  };

  // En modo simple no hay consolidado: muestra solo personal
  if (isSimpleMode) {
    return <ResumenPersonal />;
  }

  return (
    <div className="p-3 sm:p-6 lg:p-8 pb-0 animate-fade-in">
      <Tabs value={tab} onValueChange={handleChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="personal" className="gap-2">
            <PieChart className="h-4 w-4" />
            Personal
          </TabsTrigger>
          <TabsTrigger value="consolidado" className="gap-2">
            <Layers className="h-4 w-4" />
            Consolidado
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="mt-0 -mx-3 sm:-mx-6 lg:-mx-8">
          <ResumenPersonal />
        </TabsContent>
        <TabsContent value="consolidado" className="mt-0 -mx-3 sm:-mx-6 lg:-mx-8">
          <ResumenConsolidado />
        </TabsContent>
      </Tabs>
    </div>
  );
}
