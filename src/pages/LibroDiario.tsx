import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const transactions = [
  { id: 1, date: "2025-10-20", account: "Banco", description: "Salario Mensual", debit: 5000, credit: 0 },
  { id: 2, date: "2025-10-19", account: "Gastos Varios", description: "Supermercado", debit: 0, credit: 350 },
  { id: 3, date: "2025-10-18", account: "Servicios", description: "Factura de Luz", debit: 0, credit: 120 },
  { id: 4, date: "2025-10-17", account: "Banco", description: "Venta de Artículo", debit: 200, credit: 0 },
];

export default function LibroDiario() {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Libro Diario</h1>
          <p className="text-muted-foreground">
            Registro cronológico de todas las transacciones
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary shadow-soft">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Transacción
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Transacción</DialogTitle>
              <DialogDescription>
                Ingresa los detalles de la nueva transacción contable
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="date">Fecha</Label>
                <Input id="date" type="date" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="account">Cuenta</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una cuenta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo-corriente">Activo Corriente</SelectItem>
                    <SelectItem value="activo-no-corriente">Activo No Corriente</SelectItem>
                    <SelectItem value="pasivo-corriente">Pasivo Corriente</SelectItem>
                    <SelectItem value="pasivo-no-corriente">Pasivo No Corriente</SelectItem>
                    <SelectItem value="patrimonio">Patrimonio</SelectItem>
                    <SelectItem value="ingresos">Ingresos</SelectItem>
                    <SelectItem value="gastos-operativos">Gastos Operativos</SelectItem>
                    <SelectItem value="gastos-financieros">Gastos Financieros</SelectItem>
                    <SelectItem value="costo-ventas">Costo de Ventas</SelectItem>
                    <SelectItem value="banco">Banco</SelectItem>
                    <SelectItem value="caja">Caja</SelectItem>
                    <SelectItem value="cuentas-por-cobrar">Cuentas por Cobrar</SelectItem>
                    <SelectItem value="cuentas-por-pagar">Cuentas por Pagar</SelectItem>
                    <SelectItem value="inventarios">Inventarios</SelectItem>
                    <SelectItem value="depreciacion">Depreciación</SelectItem>
                    <SelectItem value="amortizacion">Amortización</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Descripción (o escribe tu propia categoría)</Label>
                <Input id="description" placeholder="Ej: Pago de renta, Ingreso por ventas, etc." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="debit">Debe ($)</Label>
                  <Input id="debit" type="number" placeholder="0.00" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="credit">Haber ($)</Label>
                  <Input id="credit" type="number" placeholder="0.00" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setOpen(false)}>Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Asientos Contables</CardTitle>
          <CardDescription>
            Todas las operaciones registradas en orden cronológico
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Cuenta</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Debe</TableHead>
                <TableHead className="text-right">Haber</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{transaction.date}</TableCell>
                  <TableCell>{transaction.account}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell className="text-right font-medium text-success">
                    {transaction.debit > 0 ? `$${transaction.debit.toFixed(2)}` : "-"}
                  </TableCell>
                  <TableCell className="text-right font-medium text-destructive">
                    {transaction.credit > 0 ? `$${transaction.credit.toFixed(2)}` : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
