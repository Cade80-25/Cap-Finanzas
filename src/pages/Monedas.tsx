import { useState, useCallback, useEffect } from "react";
import { ArrowUpDown, RefreshCw, Loader2 } from "lucide-react";
import { useNumberFormat } from "@/hooks/useNumberFormat";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const monedasBase = [
  { codigo: "USD", nombre: "Dólar Estadounidense", simbolo: "$", tasaCambio: 1.0, cambio24h: 0, region: "América del Norte" },
  { codigo: "CAD", nombre: "Dólar Canadiense", simbolo: "$", tasaCambio: 1.35, cambio24h: 0.3, region: "América del Norte" },
  { codigo: "MXN", nombre: "Peso Mexicano", simbolo: "$", tasaCambio: 17.15, cambio24h: -0.8, region: "América del Norte" },
  { codigo: "ARS", nombre: "Peso Argentino", simbolo: "$", tasaCambio: 850.50, cambio24h: 2.1, region: "América del Sur" },
  { codigo: "BRL", nombre: "Real Brasileño", simbolo: "R$", tasaCambio: 5.02, cambio24h: 1.4, region: "América del Sur" },
  { codigo: "CLP", nombre: "Peso Chileno", simbolo: "$", tasaCambio: 890.25, cambio24h: 0.9, region: "América del Sur" },
  { codigo: "COP", nombre: "Peso Colombiano", simbolo: "$", tasaCambio: 3950.00, cambio24h: -0.5, region: "América del Sur" },
  { codigo: "PEN", nombre: "Sol Peruano", simbolo: "S/", tasaCambio: 3.72, cambio24h: 0.2, region: "América del Sur" },
  { codigo: "UYU", nombre: "Peso Uruguayo", simbolo: "$", tasaCambio: 39.50, cambio24h: 0.6, region: "América del Sur" },
  { codigo: "EUR", nombre: "Euro", simbolo: "€", tasaCambio: 0.92, cambio24h: 0.5, region: "Europa" },
  { codigo: "GBP", nombre: "Libra Esterlina", simbolo: "£", tasaCambio: 0.79, cambio24h: -0.3, region: "Europa" },
  { codigo: "CHF", nombre: "Franco Suizo", simbolo: "Fr", tasaCambio: 0.88, cambio24h: 0.1, region: "Europa" },
  { codigo: "SEK", nombre: "Corona Sueca", simbolo: "kr", tasaCambio: 10.35, cambio24h: 0.4, region: "Europa" },
  { codigo: "NOK", nombre: "Corona Noruega", simbolo: "kr", tasaCambio: 10.62, cambio24h: -0.2, region: "Europa" },
  { codigo: "DKK", nombre: "Corona Danesa", simbolo: "kr", tasaCambio: 6.85, cambio24h: 0.3, region: "Europa" },
  { codigo: "PLN", nombre: "Zloty Polaco", simbolo: "zł", tasaCambio: 4.02, cambio24h: 0.7, region: "Europa" },
  { codigo: "CZK", nombre: "Corona Checa", simbolo: "Kč", tasaCambio: 22.45, cambio24h: -0.1, region: "Europa" },
  { codigo: "HUF", nombre: "Forinto Húngaro", simbolo: "Ft", tasaCambio: 355.20, cambio24h: 1.1, region: "Europa" },
  { codigo: "RON", nombre: "Leu Rumano", simbolo: "lei", tasaCambio: 4.55, cambio24h: 0.2, region: "Europa" },
  { codigo: "RUB", nombre: "Rublo Ruso", simbolo: "₽", tasaCambio: 92.50, cambio24h: 1.8, region: "Europa" },
  { codigo: "TRY", nombre: "Lira Turca", simbolo: "₺", tasaCambio: 32.15, cambio24h: 2.5, region: "Europa" },
  { codigo: "JPY", nombre: "Yen Japonés", simbolo: "¥", tasaCambio: 149.82, cambio24h: 1.2, region: "Asia" },
  { codigo: "CNY", nombre: "Yuan Chino", simbolo: "¥", tasaCambio: 7.24, cambio24h: 0.3, region: "Asia" },
  { codigo: "KRW", nombre: "Won Surcoreano", simbolo: "₩", tasaCambio: 1320.50, cambio24h: 0.8, region: "Asia" },
  { codigo: "INR", nombre: "Rupia India", simbolo: "₹", tasaCambio: 83.12, cambio24h: 0.4, region: "Asia" },
  { codigo: "SGD", nombre: "Dólar de Singapur", simbolo: "$", tasaCambio: 1.34, cambio24h: 0.2, region: "Asia" },
  { codigo: "HKD", nombre: "Dólar de Hong Kong", simbolo: "$", tasaCambio: 7.82, cambio24h: 0.1, region: "Asia" },
  { codigo: "THB", nombre: "Baht Tailandés", simbolo: "฿", tasaCambio: 34.50, cambio24h: 0.6, region: "Asia" },
  { codigo: "MYR", nombre: "Ringgit Malayo", simbolo: "RM", tasaCambio: 4.45, cambio24h: 0.3, region: "Asia" },
  { codigo: "IDR", nombre: "Rupia Indonesia", simbolo: "Rp", tasaCambio: 15680.00, cambio24h: 0.9, region: "Asia" },
  { codigo: "PHP", nombre: "Peso Filipino", simbolo: "₱", tasaCambio: 55.80, cambio24h: 0.5, region: "Asia" },
  { codigo: "VND", nombre: "Dong Vietnamita", simbolo: "₫", tasaCambio: 24350.00, cambio24h: 0.2, region: "Asia" },
  { codigo: "PKR", nombre: "Rupia Pakistaní", simbolo: "₨", tasaCambio: 278.50, cambio24h: 1.1, region: "Asia" },
  { codigo: "BDT", nombre: "Taka Bangladesí", simbolo: "৳", tasaCambio: 109.50, cambio24h: 0.4, region: "Asia" },
  { codigo: "AUD", nombre: "Dólar Australiano", simbolo: "$", tasaCambio: 1.52, cambio24h: 0.6, region: "Oceanía" },
  { codigo: "NZD", nombre: "Dólar Neozelandés", simbolo: "$", tasaCambio: 1.65, cambio24h: 0.4, region: "Oceanía" },
  { codigo: "ZAR", nombre: "Rand Sudafricano", simbolo: "R", tasaCambio: 18.75, cambio24h: 1.2, region: "África" },
  { codigo: "EGP", nombre: "Libra Egipcia", simbolo: "£", tasaCambio: 30.90, cambio24h: 0.8, region: "África" },
  { codigo: "NGN", nombre: "Naira Nigeriana", simbolo: "₦", tasaCambio: 1450.00, cambio24h: 1.5, region: "África" },
  { codigo: "KES", nombre: "Chelín Keniano", simbolo: "KSh", tasaCambio: 129.50, cambio24h: 0.7, region: "África" },
  { codigo: "MAD", nombre: "Dirham Marroquí", simbolo: "د.م.", tasaCambio: 9.95, cambio24h: 0.3, region: "África" },
  { codigo: "AED", nombre: "Dirham de EAU", simbolo: "د.إ", tasaCambio: 3.67, cambio24h: 0.0, region: "Medio Oriente" },
  { codigo: "SAR", nombre: "Riyal Saudí", simbolo: "﷼", tasaCambio: 3.75, cambio24h: 0.0, region: "Medio Oriente" },
  { codigo: "ILS", nombre: "Nuevo Shekel Israelí", simbolo: "₪", tasaCambio: 3.65, cambio24h: 0.5, region: "Medio Oriente" },
  { codigo: "QAR", nombre: "Riyal Catarí", simbolo: "﷼", tasaCambio: 3.64, cambio24h: 0.0, region: "Medio Oriente" },
  { codigo: "KWD", nombre: "Dinar Kuwaití", simbolo: "د.ك", tasaCambio: 0.31, cambio24h: 0.1, region: "Medio Oriente" },
];

export default function Monedas() {
  const [cantidad, setCantidad] = useState("1");
  const [monedaOrigen, setMonedaOrigen] = useState("USD");
  const [monedaDestino, setMonedaDestino] = useState("EUR");
  const [monedasData, setMonedasData] = useState(monedasBase);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { formatNumber } = useNumberFormat();
  // Auto-fetch on mount and every 5 minutes
  useEffect(() => {
    actualizarTasasSilencioso();
    const interval = setInterval(actualizarTasasSilencioso, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const actualizarTasasSilencioso = async () => {
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/USD");
      const data = await res.json();
      if (data.result === "success" && data.rates) {
        setMonedasData(prev => prev.map(moneda => {
          const nuevaTasa = data.rates[moneda.codigo];
          if (nuevaTasa !== undefined) {
            const cambio = moneda.tasaCambio > 0 
              ? ((nuevaTasa - moneda.tasaCambio) / moneda.tasaCambio) * 100 
              : 0;
            return { ...moneda, tasaCambio: nuevaTasa, cambio24h: parseFloat(cambio.toFixed(2)) };
          }
          return moneda;
        }));
      }
    } catch {
      // Silent fail for auto-updates
    }
  };

  const actualizarTasas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/USD");
      const data = await res.json();
      if (data.result === "success" && data.rates) {
        setMonedasData(prev => prev.map(moneda => {
          const nuevaTasa = data.rates[moneda.codigo];
          if (nuevaTasa !== undefined) {
            const cambio = moneda.tasaCambio > 0 
              ? ((nuevaTasa - moneda.tasaCambio) / moneda.tasaCambio) * 100 
              : 0;
            return { ...moneda, tasaCambio: nuevaTasa, cambio24h: parseFloat(cambio.toFixed(2)) };
          }
          return moneda;
        }));
        toast({ title: "✅ Tasas actualizadas", description: "Se obtuvieron las tasas de cambio más recientes." });
      } else {
        throw new Error("API error");
      }
    } catch {
      toast({ title: "Error", description: "No se pudieron actualizar las tasas. Intenta más tarde.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const calcularConversion = () => {
    const origen = monedasData.find((m) => m.codigo === monedaOrigen);
    const destino = monedasData.find((m) => m.codigo === monedaDestino);
    if (!origen || !destino) return 0;
    
    const cantidadNum = parseFloat(cantidad) || 0;
    return (cantidadNum / origen.tasaCambio) * destino.tasaCambio;
  };

  const resultado = calcularConversion();

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div data-tutorial="monedas-title">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Monedas y Conversiones
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
            Gestiona múltiples monedas y realiza conversiones
          </p>
        </div>
        <Button variant="outline" className="shadow-soft" onClick={actualizarTasas} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          {loading ? "Actualizando..." : "Actualizar Tasas"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-tutorial="monedas-conversor">
          <CardHeader>
            <CardTitle>Conversor de Monedas</CardTitle>
            <CardDescription>
              Convierte entre diferentes monedas en tiempo real
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cantidad">Cantidad</Label>
              <Input
                id="cantidad"
                type="number"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                placeholder="Ingresa la cantidad"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="origen">De</Label>
                <Select value={monedaOrigen} onValueChange={setMonedaOrigen}>
                  <SelectTrigger id="origen">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monedasData.map((moneda) => (
                      <SelectItem key={moneda.codigo} value={moneda.codigo}>
                        {moneda.simbolo} {moneda.codigo} - {moneda.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="destino">A</Label>
                <Select value={monedaDestino} onValueChange={setMonedaDestino}>
                  <SelectTrigger id="destino">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monedasData.map((moneda) => (
                      <SelectItem key={moneda.codigo} value={moneda.codigo}>
                        {moneda.simbolo} {moneda.codigo} - {moneda.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-6 bg-primary/5 rounded-lg border-2 border-primary/20 mt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Resultado</p>
                <p className="text-3xl font-bold text-primary">
                  {monedasData.find((m) => m.codigo === monedaDestino)?.simbolo}{formatNumber(resultado)}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {cantidad} {monedaOrigen} = {formatNumber(resultado)} {monedaDestino}
                </p>
              </div>
            </div>

            <Button className="w-full" onClick={() => {
              const temp = monedaOrigen;
              setMonedaOrigen(monedaDestino);
              setMonedaDestino(temp);
            }}>
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Invertir Monedas
            </Button>
          </CardContent>
        </Card>

        <Card data-tutorial="monedas-tasas">
          <CardHeader>
            <CardTitle>Tasas de Cambio</CardTitle>
            <CardDescription>
              Tasas actuales respecto al USD
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Moneda</TableHead>
                  <TableHead className="text-right">Tasa</TableHead>
                  <TableHead className="text-right">Cambio 24h</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monedasData.map((moneda) => (
                  <TableRow key={moneda.codigo}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold">
                          {moneda.simbolo}
                        </div>
                        <div>
                          <p className="font-medium">{moneda.codigo}</p>
                          <p className="text-xs text-muted-foreground">{moneda.nombre}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatNumber(moneda.tasaCambio, 4)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={moneda.cambio24h >= 0 ? "text-success" : "text-destructive"}>
                        {moneda.cambio24h >= 0 ? "+" : ""}
                        {formatNumber(moneda.cambio24h)}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
