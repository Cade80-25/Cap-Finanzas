import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const estadoData = {
  ingresos: [
    { name: "Salario", value: 5000 },
    { name: "Ventas", value: 200 },
    { name: "Intereses Bancarios", value: 50 },
  ],
  gastos: [
    { name: "Alimentación", value: 350 },
    { name: "Servicios", value: 120 },
    { name: "Transporte", value: 200 },
    { name: "Otros", value: 150 },
  ],
};

const totalIngresos = estadoData.ingresos.reduce((sum, item) => sum + item.value, 0);
const totalGastos = estadoData.gastos.reduce((sum, item) => sum + item.value, 0);
const resultadoNeto = totalIngresos - totalGastos;

export default function EstadoResultados() {
  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold mb-2">Estado de Resultados</h1>
        <p className="text-muted-foreground">
          Resumen de ingresos y gastos del período
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-soft border-success/20">
          <CardHeader>
            <CardTitle className="text-success">Ingresos</CardTitle>
            <CardDescription>Dinero que entra</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Concepto</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {estadoData.ingresos.map((item) => (
                  <TableRow key={item.name} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">${item.value.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-success/10 font-bold">
                  <TableCell>Total Ingresos</TableCell>
                  <TableCell className="text-right text-success">${totalIngresos.toFixed(2)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-destructive/20">
          <CardHeader>
            <CardTitle className="text-destructive">Gastos</CardTitle>
            <CardDescription>Dinero que sale</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Concepto</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {estadoData.gastos.map((item) => (
                  <TableRow key={item.name} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">${item.value.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-destructive/10 font-bold">
                  <TableCell>Total Gastos</TableCell>
                  <TableCell className="text-right text-destructive">${totalGastos.toFixed(2)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-medium border-primary bg-gradient-primary/10">
        <CardHeader>
          <CardTitle className="text-primary">Resultado Neto del Período</CardTitle>
          <CardDescription>
            Diferencia entre ingresos y gastos (Ingresos - Gastos)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center p-6">
            <p className={`text-5xl font-bold mb-2 ${resultadoNeto >= 0 ? 'text-success' : 'text-destructive'}`}>
              {resultadoNeto >= 0 ? '+' : ''}${resultadoNeto.toFixed(2)}
            </p>
            <p className="text-muted-foreground">
              {resultadoNeto >= 0 ? 'Utilidad (ganancia)' : 'Pérdida'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
