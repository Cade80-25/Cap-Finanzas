import { useState } from "react";
import { Plus, Search, Filter, Download, Upload, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ReceiptScanner from "@/components/ReceiptScanner";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const transaccionesData: Array<{ id: number; fecha: string; descripcion: string; categoria: string; tipo: string; monto: number; estado: string }> = [];

export default function Transacciones() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState("todos");
  const [scannedAmount, setScannedAmount] = useState<number | null>(null);

  const filteredTransacciones = transaccionesData.filter((t) => {
    const matchesSearch = t.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.categoria.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterTipo === "todos" || t.tipo.toLowerCase() === filterTipo;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Transacciones
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestiona todas tus transacciones financieras
          </p>
        </div>
        <div className="flex gap-2">
          <ReceiptScanner 
            onDataScanned={(data) => {
              setScannedAmount(data.amount);
            }} 
          />
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Upload className="h-4 w-4" />
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="shadow-soft">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Transacción
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva Transacción</DialogTitle>
                <DialogDescription>
                  Registra una nueva transacción en el sistema
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="fecha">Fecha</Label>
                  <Input id="fecha" type="date" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Input id="descripcion" placeholder="Ej: Compra supermercado" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ingreso">Ingreso</SelectItem>
                      <SelectItem value="gasto">Gasto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="monto">Monto</Label>
                  <Input 
                    id="monto" 
                    type="number" 
                    placeholder="0.00" 
                    value={scannedAmount || ""}
                    onChange={(e) => setScannedAmount(parseFloat(e.target.value) || null)}
                  />
                  {scannedAmount && (
                    <p className="text-xs text-muted-foreground">
                      ✓ Monto escaneado de factura
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="categoria">Categoría</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alimentacion">Alimentación</SelectItem>
                      <SelectItem value="transporte">Transporte</SelectItem>
                      <SelectItem value="vivienda">Vivienda</SelectItem>
                      <SelectItem value="ingresos">Ingresos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Guardar Transacción</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Transacciones</CardTitle>
              <CardDescription>Busca y filtra tus transacciones</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="ingreso">Ingresos</SelectItem>
                  <SelectItem value="gasto">Gastos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTransacciones.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransacciones.map((transaccion) => (
                  <TableRow key={transaccion.id}>
                    <TableCell>{transaccion.fecha}</TableCell>
                    <TableCell className="font-medium">{transaccion.descripcion}</TableCell>
                    <TableCell>{transaccion.categoria}</TableCell>
                    <TableCell>
                      <Badge variant={transaccion.tipo === "Ingreso" ? "default" : "secondary"}>
                        {transaccion.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-semibold ${transaccion.monto > 0 ? "text-success" : "text-destructive"}`}>
                      ${Math.abs(transaccion.monto).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={transaccion.estado === "Completado" ? "outline" : "secondary"}>
                        {transaccion.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground">
              No hay transacciones registradas. Agrega tu primera transacción.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
