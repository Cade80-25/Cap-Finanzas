import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Calculator, Info, TrendingUp, FileText, Users, Heart, Home, GraduationCap, Download, RefreshCw, PieChart, BarChart3 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

// Configuración de países con brackets y deducciones
const paises = [
  { 
    code: "UY", 
    name: "Uruguay", 
    currency: "UYU",
    symbol: "$",
    brackets: [
      { min: 0, max: 684000, rate: 0 },
      { min: 684001, max: 978000, rate: 10 },
      { min: 978001, max: 1368000, rate: 15 },
      { min: 1368001, max: 2046000, rate: 24 },
      { min: 2046001, max: 3066000, rate: 25 },
      { min: 3066001, max: Infinity, rate: 27 }
    ],
    deducciones: {
      porHijo: 52000,
      seguroSalud: 0.08, // 8% del ingreso
      aportesJubilatorios: 0.15, // 15%
      vivienda: 36000, // anual
    }
  },
  { 
    code: "AR", 
    name: "Argentina", 
    currency: "ARS",
    symbol: "$",
    brackets: [
      { min: 0, max: 340000, rate: 5 },
      { min: 340001, max: 680000, rate: 9 },
      { min: 680001, max: 1020000, rate: 12 },
      { min: 1020001, max: 1360000, rate: 15 },
      { min: 1360001, max: 1700000, rate: 19 },
      { min: 1700001, max: 2550000, rate: 23 },
      { min: 2550001, max: Infinity, rate: 27 }
    ],
    deducciones: {
      porHijo: 156000,
      seguroSalud: 0.05,
      aportesJubilatorios: 0.11,
      vivienda: 80000,
    }
  },
  { 
    code: "MX", 
    name: "México", 
    currency: "MXN",
    symbol: "$",
    brackets: [
      { min: 0, max: 125900, rate: 1.92 },
      { min: 125901, max: 1000000, rate: 6.4 },
      { min: 1000001, max: 1500000, rate: 10.88 },
      { min: 1500001, max: 3000000, rate: 16 },
      { min: 3000001, max: 5000000, rate: 21.36 },
      { min: 5000001, max: Infinity, rate: 35 }
    ],
    deducciones: {
      porHijo: 45000,
      seguroSalud: 0.03,
      aportesJubilatorios: 0.065,
      vivienda: 50000,
    }
  },
  { 
    code: "ES", 
    name: "España", 
    currency: "EUR",
    symbol: "€",
    brackets: [
      { min: 0, max: 12450, rate: 19 },
      { min: 12451, max: 20200, rate: 24 },
      { min: 20201, max: 35200, rate: 30 },
      { min: 35201, max: 60000, rate: 37 },
      { min: 60001, max: 300000, rate: 45 },
      { min: 300001, max: Infinity, rate: 47 }
    ],
    deducciones: {
      porHijo: 2400,
      seguroSalud: 0,
      aportesJubilatorios: 0.047,
      vivienda: 9040,
    }
  },
  { 
    code: "US", 
    name: "Estados Unidos", 
    currency: "USD",
    symbol: "$",
    brackets: [
      { min: 0, max: 11000, rate: 10 },
      { min: 11001, max: 44725, rate: 12 },
      { min: 44726, max: 95375, rate: 22 },
      { min: 95376, max: 182100, rate: 24 },
      { min: 182101, max: 231250, rate: 32 },
      { min: 231251, max: 578125, rate: 35 },
      { min: 578126, max: Infinity, rate: 37 }
    ],
    deducciones: {
      porHijo: 2000,
      seguroSalud: 0,
      aportesJubilatorios: 0.062,
      vivienda: 10000,
    }
  },
  { 
    code: "CO", 
    name: "Colombia", 
    currency: "COP",
    symbol: "$",
    brackets: [
      { min: 0, max: 13500000, rate: 0 },
      { min: 13500001, max: 21000000, rate: 19 },
      { min: 21000001, max: 35000000, rate: 28 },
      { min: 35000001, max: 56000000, rate: 33 },
      { min: 56000001, max: Infinity, rate: 35 }
    ],
    deducciones: {
      porHijo: 1200000,
      seguroSalud: 0.04,
      aportesJubilatorios: 0.04,
      vivienda: 2400000,
    }
  },
  { 
    code: "CL", 
    name: "Chile", 
    currency: "CLP",
    symbol: "$",
    brackets: [
      { min: 0, max: 8775000, rate: 0 },
      { min: 8775001, max: 19500000, rate: 4 },
      { min: 19500001, max: 32500000, rate: 8 },
      { min: 32500001, max: 45500000, rate: 13.5 },
      { min: 45500001, max: 58500000, rate: 23 },
      { min: 58500001, max: 78000000, rate: 30.4 },
      { min: 78000001, max: Infinity, rate: 40 }
    ],
    deducciones: {
      porHijo: 500000,
      seguroSalud: 0.07,
      aportesJubilatorios: 0.10,
      vivienda: 600000,
    }
  },
];

interface DeduccionesPersonalizadas {
  hijos: number;
  incluyeSeguroSalud: boolean;
  incluyeAportesJubilatorios: boolean;
  incluyeVivienda: boolean;
  otrasDeduccionesAnuales: number;
  educacion: number;
  donaciones: number;
}

interface ResultadoCalculo {
  impuesto: number;
  ingresosNetos: number;
  tasaEfectiva: number;
  tasaMarginal: number;
  detalleTramos: Array<{ tramo: string; base: number; tasa: number; impuesto: number }>;
  totalDeducciones: number;
  baseImponible: number;
  impuestoMensual: number;
  ingresoNetoMensual: number;
}

export default function CalculadoraIRPF() {
  const [selectedCountry, setSelectedCountry] = useState("UY");
  const [ingresoAnual, setIngresoAnual] = useState("");
  const [periodoIngreso, setPeriodoIngreso] = useState<"anual" | "mensual">("mensual");
  const [calculoAutomatico, setCalculoAutomatico] = useState(true);
  const [deducciones, setDeducciones] = useState<DeduccionesPersonalizadas>({
    hijos: 0,
    incluyeSeguroSalud: true,
    incluyeAportesJubilatorios: true,
    incluyeVivienda: false,
    otrasDeduccionesAnuales: 0,
    educacion: 0,
    donaciones: 0,
  });

  const country = useMemo(() => paises.find(p => p.code === selectedCountry)!, [selectedCountry]);

  // Calcular ingreso anual basado en el período seleccionado
  const ingresoAnualCalculado = useMemo(() => {
    const valor = parseFloat(ingresoAnual) || 0;
    return periodoIngreso === "mensual" ? valor * 12 : valor;
  }, [ingresoAnual, periodoIngreso]);

  // Calcular deducciones totales
  const totalDeducciones = useMemo(() => {
    let total = 0;
    total += deducciones.hijos * country.deducciones.porHijo;
    if (deducciones.incluyeSeguroSalud) {
      total += ingresoAnualCalculado * country.deducciones.seguroSalud;
    }
    if (deducciones.incluyeAportesJubilatorios) {
      total += ingresoAnualCalculado * country.deducciones.aportesJubilatorios;
    }
    if (deducciones.incluyeVivienda) {
      total += country.deducciones.vivienda;
    }
    total += deducciones.otrasDeduccionesAnuales;
    total += deducciones.educacion;
    total += deducciones.donaciones;
    return total;
  }, [deducciones, country, ingresoAnualCalculado]);

  // Función de cálculo
  const calcularIRPF = useMemo((): ResultadoCalculo | null => {
    if (ingresoAnualCalculado <= 0) return null;

    const baseImponible = Math.max(0, ingresoAnualCalculado - totalDeducciones);
    
    if (baseImponible <= 0) return null;

    let impuestoTotal = 0;
    let ingresoRestante = baseImponible;
    const detalleTramos: Array<{ tramo: string; base: number; tasa: number; impuesto: number }> = [];
    let tasaMarginal = 0;

    for (let i = 0; i < country.brackets.length; i++) {
      const bracket = country.brackets[i];
      
      if (baseImponible > bracket.min) {
        const limiteSuperior = bracket.max === Infinity ? baseImponible : bracket.max;
        const limiteInferior = bracket.min;
        
        // Calcular la porción del ingreso que cae en este tramo
        const ingresoEnTramo = Math.min(baseImponible, limiteSuperior) - limiteInferior;
        
        if (ingresoEnTramo > 0) {
          const impuestoTramo = (ingresoEnTramo * bracket.rate) / 100;
          impuestoTotal += impuestoTramo;
          tasaMarginal = bracket.rate;
          
          detalleTramos.push({
            tramo: `${country.symbol}${limiteInferior.toLocaleString()} - ${bracket.max === Infinity ? '∞' : country.symbol + limiteSuperior.toLocaleString()}`,
            base: ingresoEnTramo,
            tasa: bracket.rate,
            impuesto: impuestoTramo
          });
        }
      }
    }

    const ingresosNetos = baseImponible - impuestoTotal;
    const tasaEfectiva = baseImponible > 0 ? (impuestoTotal / baseImponible) * 100 : 0;

    return {
      impuesto: impuestoTotal,
      ingresosNetos,
      tasaEfectiva,
      tasaMarginal,
      detalleTramos,
      totalDeducciones,
      baseImponible,
      impuestoMensual: impuestoTotal / 12,
      ingresoNetoMensual: ingresosNetos / 12,
    };
  }, [ingresoAnualCalculado, totalDeducciones, country]);

  const resultado = calculoAutomatico ? calcularIRPF : null;

  const handleCalcular = () => {
    if (!calcularIRPF) {
      toast.error("Ingresa un valor de ingresos válido");
      return;
    }
    toast.success("Cálculo completado exitosamente");
  };

  const handleExportarResultado = () => {
    if (!resultado) {
      toast.error("No hay resultados para exportar");
      return;
    }

    const contenido = `
CÁLCULO DE IRPF - ${country.name}
================================
Fecha: ${new Date().toLocaleDateString("es-ES")}

DATOS DE ENTRADA
----------------
Ingreso Anual Bruto: ${country.symbol}${ingresoAnualCalculado.toLocaleString()}
Total Deducciones: ${country.symbol}${resultado.totalDeducciones.toLocaleString()}
Base Imponible: ${country.symbol}${resultado.baseImponible.toLocaleString()}

RESULTADO
---------
Impuesto Anual: ${country.symbol}${resultado.impuesto.toLocaleString(undefined, { minimumFractionDigits: 2 })}
Impuesto Mensual: ${country.symbol}${resultado.impuestoMensual.toLocaleString(undefined, { minimumFractionDigits: 2 })}
Ingreso Neto Anual: ${country.symbol}${resultado.ingresosNetos.toLocaleString(undefined, { minimumFractionDigits: 2 })}
Ingreso Neto Mensual: ${country.symbol}${resultado.ingresoNetoMensual.toLocaleString(undefined, { minimumFractionDigits: 2 })}
Tasa Efectiva: ${resultado.tasaEfectiva.toFixed(2)}%
Tasa Marginal: ${resultado.tasaMarginal}%

DESGLOSE POR TRAMOS
-------------------
${resultado.detalleTramos.map(t => `${t.tramo}: ${t.tasa}% = ${country.symbol}${t.impuesto.toLocaleString(undefined, { minimumFractionDigits: 2 })}`).join('\n')}

DEDUCCIONES APLICADAS
---------------------
Hijos dependientes: ${deducciones.hijos}
Seguro de salud: ${deducciones.incluyeSeguroSalud ? 'Sí' : 'No'}
Aportes jubilatorios: ${deducciones.incluyeAportesJubilatorios ? 'Sí' : 'No'}
Deducción vivienda: ${deducciones.incluyeVivienda ? 'Sí' : 'No'}
Educación: ${country.symbol}${deducciones.educacion.toLocaleString()}
Donaciones: ${country.symbol}${deducciones.donaciones.toLocaleString()}
Otras deducciones: ${country.symbol}${deducciones.otrasDeduccionesAnuales.toLocaleString()}

---
Generado por Cap Finanzas
Nota: Este cálculo es aproximado y puede variar según la legislación vigente.
    `.trim();

    const blob = new Blob([contenido], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `calculo-irpf-${country.code}-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Resultado exportado correctamente");
  };

  const limpiarFormulario = () => {
    setIngresoAnual("");
    setDeducciones({
      hijos: 0,
      incluyeSeguroSalud: true,
      incluyeAportesJubilatorios: true,
      incluyeVivienda: false,
      otrasDeduccionesAnuales: 0,
      educacion: 0,
      donaciones: 0,
    });
    toast.success("Formulario limpiado");
  };

  // Calcular porcentaje de impuesto vs ingreso neto para visualización
  const porcentajeImpuesto = resultado ? (resultado.impuesto / resultado.baseImponible) * 100 : 0;

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Calculadora de IRPF
          </h1>
          <p className="text-muted-foreground mt-2">
            Calcula tu Impuesto sobre la Renta de Personas Físicas según tu país
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="auto-calc" className="text-sm">Cálculo automático</Label>
          <Switch 
            id="auto-calc"
            checked={calculoAutomatico} 
            onCheckedChange={setCalculoAutomatico} 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel de entrada de datos */}
        <div className="lg:col-span-1 space-y-6">
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
                      <SelectItem key={p.code} value={p.code}>
                        {p.name} ({p.currency})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="periodo">Período de Ingreso</Label>
                <Select value={periodoIngreso} onValueChange={(v) => setPeriodoIngreso(v as "anual" | "mensual")}>
                  <SelectTrigger id="periodo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensual">Mensual</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ingreso">
                  Ingreso Bruto {periodoIngreso === "mensual" ? "Mensual" : "Anual"}
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {country.symbol}
                  </span>
                  <Input
                    id="ingreso"
                    type="number"
                    placeholder="Ej: 100000"
                    value={ingresoAnual}
                    onChange={(e) => setIngresoAnual(e.target.value)}
                    className="pl-8"
                  />
                </div>
                {periodoIngreso === "mensual" && ingresoAnual && (
                  <p className="text-xs text-muted-foreground">
                    = {country.symbol}{ingresoAnualCalculado.toLocaleString()} anuales
                  </p>
                )}
              </div>

              {!calculoAutomatico && (
                <>
                  <Separator />
                  <Button onClick={handleCalcular} className="w-full">
                    <Calculator className="h-4 w-4 mr-2" />
                    Calcular IRPF
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Panel de deducciones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-5 w-5" />
                Deducciones
              </CardTitle>
              <CardDescription>
                Configura tus deducciones fiscales
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hijos" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Hijos dependientes
                </Label>
                <Select 
                  value={String(deducciones.hijos)} 
                  onValueChange={(v) => setDeducciones(prev => ({ ...prev, hijos: parseInt(v) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4, 5, 6].map(n => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {deducciones.hijos > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Deducción: {country.symbol}{(deducciones.hijos * country.deducciones.porHijo).toLocaleString()}
                  </p>
                )}
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Seguro de salud
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {(country.deducciones.seguroSalud * 100).toFixed(1)}% del ingreso
                  </p>
                </div>
                <Switch 
                  checked={deducciones.incluyeSeguroSalud} 
                  onCheckedChange={(v) => setDeducciones(prev => ({ ...prev, incluyeSeguroSalud: v }))}
                  disabled={country.deducciones.seguroSalud === 0}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Aportes jubilatorios
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {(country.deducciones.aportesJubilatorios * 100).toFixed(1)}% del ingreso
                  </p>
                </div>
                <Switch 
                  checked={deducciones.incluyeAportesJubilatorios} 
                  onCheckedChange={(v) => setDeducciones(prev => ({ ...prev, incluyeAportesJubilatorios: v }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Deducción vivienda
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {country.symbol}{country.deducciones.vivienda.toLocaleString()} anuales
                  </p>
                </div>
                <Switch 
                  checked={deducciones.incluyeVivienda} 
                  onCheckedChange={(v) => setDeducciones(prev => ({ ...prev, incluyeVivienda: v }))}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="educacion" className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Gastos de educación (anual)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    {country.symbol}
                  </span>
                  <Input
                    id="educacion"
                    type="number"
                    placeholder="0"
                    value={deducciones.educacion || ""}
                    onChange={(e) => setDeducciones(prev => ({ ...prev, educacion: parseFloat(e.target.value) || 0 }))}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="donaciones">Donaciones deducibles (anual)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    {country.symbol}
                  </span>
                  <Input
                    id="donaciones"
                    type="number"
                    placeholder="0"
                    value={deducciones.donaciones || ""}
                    onChange={(e) => setDeducciones(prev => ({ ...prev, donaciones: parseFloat(e.target.value) || 0 }))}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="otras">Otras deducciones (anual)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    {country.symbol}
                  </span>
                  <Input
                    id="otras"
                    type="number"
                    placeholder="0"
                    value={deducciones.otrasDeduccionesAnuales || ""}
                    onChange={(e) => setDeducciones(prev => ({ ...prev, otrasDeduccionesAnuales: parseFloat(e.target.value) || 0 }))}
                    className="pl-8"
                  />
                </div>
              </div>

              <Separator />

              <div className="p-3 rounded-lg bg-muted">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Deducciones:</span>
                  <span className="font-bold text-primary">
                    {country.symbol}{totalDeducciones.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>

              <Button variant="outline" onClick={limpiarFormulario} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Limpiar Formulario
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Panel de resultados */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Resultado del Cálculo
              </CardTitle>
              <CardDescription>
                Desglose detallado de tu impuesto en {country.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {resultado ? (
                <Tabs defaultValue="resumen" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="resumen">Resumen</TabsTrigger>
                    <TabsTrigger value="tramos">Tramos</TabsTrigger>
                    <TabsTrigger value="visual">Visual</TabsTrigger>
                  </TabsList>

                  <TabsContent value="resumen" className="space-y-4 mt-4">
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Base Imponible:</strong> {country.symbol}{resultado.baseImponible.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        <span className="text-muted-foreground ml-2">
                          (Ingreso {country.symbol}{ingresoAnualCalculado.toLocaleString()} - Deducciones {country.symbol}{totalDeducciones.toLocaleString(undefined, { maximumFractionDigits: 0 })})
                        </span>
                      </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                        <p className="text-sm text-muted-foreground mb-1">Impuesto Anual</p>
                        <p className="text-2xl font-bold text-destructive">
                          {country.symbol}{resultado.impuesto.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {country.symbol}{resultado.impuestoMensual.toLocaleString(undefined, { minimumFractionDigits: 2 })} mensual
                        </p>
                      </div>

                      <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                        <p className="text-sm text-muted-foreground mb-1">Ingreso Neto Anual</p>
                        <p className="text-2xl font-bold text-green-600">
                          {country.symbol}{resultado.ingresosNetos.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {country.symbol}{resultado.ingresoNetoMensual.toLocaleString(undefined, { minimumFractionDigits: 2 })} mensual
                        </p>
                      </div>

                      <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                        <p className="text-sm text-muted-foreground mb-1">Tasa Efectiva</p>
                        <p className="text-2xl font-bold text-primary">
                          {resultado.tasaEfectiva.toFixed(2)}%
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Porcentaje real sobre base imponible
                        </p>
                      </div>

                      <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                        <p className="text-sm text-muted-foreground mb-1">Tasa Marginal</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {resultado.tasaMarginal}%
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Tasa del último tramo aplicado
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleExportarResultado} variant="outline" className="flex-1">
                        <Download className="h-4 w-4 mr-2" />
                        Exportar Resultado
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="tramos" className="mt-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold flex items-center gap-2 mb-3">
                        <BarChart3 className="h-4 w-4" />
                        Desglose por Tramos Impositivos
                      </h3>
                      {resultado.detalleTramos.length > 0 ? (
                        <div className="space-y-2">
                          {resultado.detalleTramos.map((tramo, idx) => (
                            <div key={idx} className="p-3 rounded-lg bg-muted">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium">Tramo {idx + 1}: {tramo.tramo}</span>
                                <span className="font-bold text-primary">{tramo.tasa}%</span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">
                                  Base gravable: {country.symbol}{tramo.base.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </span>
                                <span className="font-semibold">
                                  {country.symbol}{tramo.impuesto.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                              <Progress 
                                value={(tramo.impuesto / resultado.impuesto) * 100} 
                                className="h-1.5 mt-2" 
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Tu ingreso está en el tramo exento (0% de impuesto).
                        </p>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="visual" className="mt-4">
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-semibold mb-3">Distribución del Ingreso</h3>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Ingreso Neto</span>
                              <span className="text-green-600 font-medium">
                                {(100 - porcentajeImpuesto).toFixed(1)}%
                              </span>
                            </div>
                            <Progress value={100 - porcentajeImpuesto} className="h-4 bg-destructive/20" />
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Impuesto IRPF</span>
                              <span className="text-destructive font-medium">
                                {porcentajeImpuesto.toFixed(1)}%
                              </span>
                            </div>
                            <div className="h-4 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-destructive rounded-full transition-all duration-500"
                                style={{ width: `${porcentajeImpuesto}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h3 className="font-semibold mb-3">Comparación Mensual</h3>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div className="p-3 rounded-lg bg-muted">
                            <p className="text-xs text-muted-foreground">Bruto</p>
                            <p className="font-bold">{country.symbol}{(ingresoAnualCalculado / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-destructive/10">
                            <p className="text-xs text-muted-foreground">Impuesto</p>
                            <p className="font-bold text-destructive">-{country.symbol}{resultado.impuestoMensual.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-green-500/10">
                            <p className="text-xs text-muted-foreground">Neto</p>
                            <p className="font-bold text-green-600">{country.symbol}{resultado.ingresoNetoMensual.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h3 className="font-semibold mb-3">Escala de Tramos ({country.name})</h3>
                        <div className="space-y-1">
                          {country.brackets.map((bracket, idx) => (
                            <div 
                              key={idx} 
                              className={`flex justify-between items-center p-2 rounded text-sm ${
                                resultado.baseImponible > bracket.min ? 'bg-primary/10' : 'bg-muted/50'
                              }`}
                            >
                              <span className="text-muted-foreground">
                                {country.symbol}{bracket.min.toLocaleString()} - {bracket.max === Infinity ? '∞' : country.symbol + bracket.max.toLocaleString()}
                              </span>
                              <span className="font-medium">{bracket.rate}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Calculator className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {ingresoAnual ? "El ingreso debe ser mayor que las deducciones" : "Ingresa tus datos para ver los resultados"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

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
                Esta calculadora considera los tramos impositivos básicos y deducciones estándar. Pueden existir deducciones adicionales según tu situación particular.
              </p>
              <div className="mt-4 p-3 rounded-lg bg-muted">
                <p className="font-medium text-foreground mb-2">Países disponibles:</p>
                <div className="flex flex-wrap gap-2">
                  {paises.map(p => (
                    <span key={p.code} className="text-xs px-2 py-1 rounded bg-background">
                      {p.name}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
