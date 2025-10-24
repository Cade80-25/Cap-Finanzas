import { useState } from "react";
import { DollarSign, TrendingUp, ArrowUpDown, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

const monedasData = [
  { codigo: "USD", nombre: "Dólar Estadounidense", simbolo: "$", tasaCambio: 1.0, cambio24h: 0 },
  { codigo: "EUR", nombre: "Euro", simbolo: "€", tasaCambio: 0.92, cambio24h: 0.5 },
  { codigo: "GBP", nombre: "Libra Esterlina", simbolo: "£", tasaCambio: 0.79, cambio24h: -0.3 },
  { codigo: "JPY", nombre: "Yen Japonés", simbolo: "¥", tasaCambio: 149.82, cambio24h: 1.2 },
  { codigo: "ARS", nombre: "Peso Argentino", simbolo: "$", tasaCambio: 850.50, cambio24h: 2.1 },
  { codigo: "MXN", nombre: "Peso Mexicano", simbolo: "$", tasaCambio: 17.15, cambio24h: -0.8 },
];

export default function Monedas() {
  const [cantidad, setCantidad] = useState("1");
  const [monedaOrigen, setMonedaOrigen] = useState("USD");
  const [monedaDestino, setMonedaDestino] = useState("EUR");

  const calcularConversion = () => {
    const origen = monedasData.find((m) => m.codigo === monedaOrigen);
    const destino = monedasData.find((m) => m.codigo === monedaDestino);
    if (!origen || !destino) return 0;
    
    const cantidadNum = parseFloat(cantidad) || 0;
    return (cantidadNum / origen.tasaCambio) * destino.tasaCambio;
  };

  const resultado = calcularConversion();

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Monedas y Conversiones
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestiona múltiples monedas y realiza conversiones
          </p>
        </div>
        <Button variant="outline" className="shadow-soft">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar Tasas
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
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
                  {monedasData.find((m) => m.codigo === monedaDestino)?.simbolo}{resultado.toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {cantidad} {monedaOrigen} = {resultado.toFixed(2)} {monedaDestino}
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

        <Card>
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
                      {moneda.tasaCambio.toFixed(4)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={moneda.cambio24h >= 0 ? "text-success" : "text-destructive"}>
                        {moneda.cambio24h >= 0 ? "+" : ""}
                        {moneda.cambio24h.toFixed(2)}%
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
