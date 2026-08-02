import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Settings as SettingsIcon, Cog } from "lucide-react";
import Cuenta from "./Cuenta";
import Configuracion from "./Configuracion";

export default function Ajustes() {
  const [params, setParams] = useSearchParams();
  const initial = params.get("tab") || "cuenta";
  const [tab, setTab] = useState(initial);

  const handleChange = (v: string) => {
    setTab(v);
    setParams({ tab: v }, { replace: true });
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-soft">
          <Cog className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Ajustes
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Tu cuenta, preferencias, seguridad y licencia
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={handleChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="cuenta" className="gap-2">
            <User className="h-4 w-4" />
            Cuenta
          </TabsTrigger>
          <TabsTrigger value="configuracion" className="gap-2">
            <SettingsIcon className="h-4 w-4" />
            Configuración
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cuenta" className="mt-4 -mx-3 sm:-mx-6 lg:-mx-8">
          <Cuenta />
        </TabsContent>
        <TabsContent value="configuracion" className="mt-4 -mx-3 sm:-mx-6 lg:-mx-8">
          <Configuracion />
        </TabsContent>
      </Tabs>
    </div>
  );
}
