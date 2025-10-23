import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const balanceData = {
  activos: [
    { name: "Banco", value: 5200 },
    { name: "Caja Chica", value: 500 },
    { name: "Cuentas por Cobrar", value: 1200 },
  ],
  pasivos: [
    { name: "Préstamo Bancario", value: 3000 },
    { name: "Cuentas por Pagar", value: 850 },
  ],
};

const totalActivos = balanceData.activos.reduce((sum, item) => sum + item.value, 0);
const totalPasivos = balanceData.pasivos.reduce((sum, item) => sum + item.value, 0);
const patrimonio = totalActivos - totalPasivos;

export default function Balance() {
  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold mb-2">Balance General</h1>
        <p className="text-muted-foreground">
          Estado de la situación financiera
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-soft border-success/20">
          <CardHeader>
            <CardTitle className="text-success">Activos</CardTitle>
            <CardDescription>Recursos y bienes que posees</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cuenta</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {balanceData.activos.map((item) => (
                  <TableRow key={item.name} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">${item.value.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-success/10 font-bold">
                  <TableCell>Total Activos</TableCell>
                  <TableCell className="text-right text-success">${totalActivos.toFixed(2)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-destructive/20">
          <CardHeader>
            <CardTitle className="text-destructive">Pasivos</CardTitle>
            <CardDescription>Deudas y obligaciones</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cuenta</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {balanceData.pasivos.map((item) => (
                  <TableRow key={item.name} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">${item.value.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-destructive/10 font-bold">
                  <TableCell>Total Pasivos</TableCell>
                  <TableCell className="text-right text-destructive">${totalPasivos.toFixed(2)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-medium border-primary">
        <CardHeader>
          <CardTitle className="text-primary">Patrimonio Neto</CardTitle>
          <CardDescription>
            Diferencia entre activos y pasivos (Activos - Pasivos)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center p-6">
            <p className="text-5xl font-bold text-primary mb-2">
              ${patrimonio.toFixed(2)}
            </p>
            <p className="text-muted-foreground">
              Ecuación contable: Activos ({totalActivos}) = Pasivos ({totalPasivos}) + Patrimonio ({patrimonio})
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
