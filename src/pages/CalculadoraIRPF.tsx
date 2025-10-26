import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calculator, Info, TrendingUp, FileText } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const paises = [
  { code: "UY", name: "Uruguay", brackets: [
    { min: 0, max: 684000, rate: 0 },
    { min: 684001, max: 978000, rate: 10 },
    { min: 978001, max: 1368000, rate: 15 },
    { min: 1368001, max: 2046000, rate: 24 },
    { min: 2046001, max: 3066000, rate: 25 },
    { min: 3066001, max: Infinity, rate: 27 }
  ]},
  { code: "AR", name: "Argentina", brackets: [
    { min: 0, max: 340000, rate: 5 },
    { min: 340001, max: 680000, rate: 9 },
    { min: 680001, max: 1020000, rate: 12 },
    { min: 1020001, max: 1360000, rate: 15 },
    { min: 1360001, max: 1700000, rate: 19 },
    { min: 1700001, max: 2550000, rate: 23 },
    { min: 2550001, max: Infinity, rate: 27 }
  ]},
  { code: "MX", name: "México", brackets: [
    { min: 0, max: 125900, rate: 1.92 },
    { min: 125901, max: 1000000, rate: 6.4 },
    { min: 1000001, max: 1500000, rate: 10.88 },
    { min: 1500001, max: 3000000, rate: 16 },
    { min: 3000001, max: 5000000, rate: 21.36 },
    { min: 5000001, max: Infinity, rate: 35 }
  ]},
  { code: "ES", name: "España", brackets: [
    { min: 0, max: 12450, rate: 19 },
    { min: 12451, max: 20200, rate: 24 },
    { min: 20201, max: 35200, rate: 30 },
    { min: 35201, max: 60000, rate: 37 },
    { min: 60001, max: 300000, rate: 45 },
    { min: 300001, max: Infinity, rate: 47 }
  ]},
  { code: "US", name: "Estados Unidos", brackets: [
    { min: 0, max: 11000, rate: 10 },
    { min: 11001, max: 44725, rate: 12 },
    { min: 44726, max: 95375, rate: 22 },
    { min: 95376, max: 182100, rate: 24 },
    { min: 182101, max: 231250, rate: 32 },
    { min: 231251, max: 578125, rate: 35 },
    { min: 578126, max: Infinity, rate: 37 }
  ]},
];

export default function CalculadoraIRPF() {
  const [selectedCountry, setSelectedCountry] = useState("UY");
  const [ingresoAnual, setIngresoAnual] = useState("");
  const [deducciones, setDeducciones] = useState("");
  const [resultado, setResultado] = useState<{
    impuesto: number;
    ingresosNetos: number;
    tasaEfectiva: number;
    detalleTramos: Array<{ tramo: string; base: number; tasa: number; impuesto: number }>;
  } | null>(null);

  const calcularIRPF = () => {
    const ingreso = parseFloat(ingresoAnual) || 0;
    const deduccion = parseFloat(deducciones) || 0;
    const baseImponible = ingreso - deduccion;

    if (baseImponible <= 0) {
      toast.error("El ingreso debe ser mayor que las deducciones");
      return;
    }

    const country = paises.find(p => p.code === selectedCountry);
    if (!country) return;

    let impuestoTotal = 0;
    let ingresoRestante = baseImponible;
    const detalleTramos: Array<{ tramo: string; base: number; tasa: number; impuesto: number }> = [];

    for (let i = 0; i < country.brackets.length; i++) {
      const bracket = country.brackets[i];
      const siguiente = country.brackets[i + 1];
      
      if (ingresoRestante <= 0) break;
      
      const limiteSuperior = siguiente ? bracket.max : Infinity;
      const baseTramo = Math.min(ingresoRestante, limiteSuperior - bracket.min + 1);
      
      if (baseImponible > bracket.min) {
        const impuestoTramo = (baseTramo * bracket.rate) / 100;
        impuestoTotal += impuestoTramo;
        
        detalleTramos.push({
          tramo: `${bracket.min.toLocaleString()} - ${limiteSuperior === Infinity ? '∞' : limiteSuperior.toLocaleString()}`,
          base: baseTramo,
          tasa: bracket.rate,
          impuesto: impuestoTramo
        });
        
        ingresoRestante -= baseTramo;
      }
    }

    const ingresosNetos = baseImponible - impuestoTotal;
    const tasaEfectiva = (impuestoTotal / baseImponible) * 100;

    setResultado({
      impuesto: impuestoTotal,
      ingresosNetos,
      tasaEfectiva,
      detalleTramos
    });

    toast.success("Cálculo completado exitosamente");
  };

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Calculadora de IRPF
        </h1>
        <p className="text-muted-foreground mt-2">
          Calcula tu Impuesto sobre la Renta de Personas Físicas según tu país
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Datos de Ingresos
            </CardTitle>
            <CardDescription>
              Ingresa tus datos para calcular el IRPF
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pais">País</Label>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger id="pais">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paises.map(p => (
                    <SelectItem key={p.code} value={p.code}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ingreso">Ingreso Anual Bruto</Label>
              <Input
                id="ingreso"
                type="number"
                placeholder="Ej: 1000000"
                value={ingresoAnual}
                onChange={(e) => setIngresoAnual(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deducciones">Deducciones y Exenciones</Label>
              <Input
                id="deducciones"
                type="number"
                placeholder="Ej: 50000"
                value={deducciones}
                onChange={(e) => setDeducciones(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Incluye deducciones por dependientes, seguros de salud, etc.
              </p>
            </div>

            <Separator />

            <Button onClick={calcularIRPF} className="w-full">
              <Calculator className="h-4 w-4 mr-2" />
              Calcular IRPF
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Resultado del Cálculo
            </CardTitle>
            <CardDescription>
              Desglose detallado de tu impuesto
            </CardDescription>
          </CardHeader>
          <CardContent>
            {resultado ? (
              <div className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Base Imponible: ${(parseFloat(ingresoAnual) - parseFloat(deducciones || "0")).toLocaleString()}
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <div className="flex justify-between items-center p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                    <span className="font-medium">Impuesto a Pagar:</span>
                    <span className="text-2xl font-bold text-destructive">
                      ${resultado.impuesto.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-4 rounded-lg bg-success/10 border border-success/20">
                    <span className="font-medium">Ingresos Netos:</span>
                    <span className="text-2xl font-bold text-success">
                      ${resultado.ingresosNetos.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <span className="font-medium">Tasa Efectiva:</span>
                    <span className="text-2xl font-bold text-primary">
                      {resultado.tasaEfectiva.toFixed(2)}%
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Desglose por Tramos
                  </h3>
                  <div className="space-y-2">
                    {resultado.detalleTramos.map((tramo, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-muted text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tramo: {tramo.tramo}</span>
                          <span className="font-medium">{tramo.tasa}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Base: ${tramo.base.toLocaleString()}</span>
                          <span className="font-semibold">${tramo.impuesto.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calculator className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Completa los datos y presiona calcular para ver los resultados
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Información Importante
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong>Nota:</strong> Los cálculos son aproximados y pueden variar según la legislación vigente de cada país.
          </p>
          <p>
            Las tasas y tramos se actualizan periódicamente. Te recomendamos consultar con un contador profesional para cálculos precisos.
          </p>
          <p>
            Esta calculadora considera los tramos impositivos básicos. Pueden existir deducciones adicionales según tu situación particular.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
