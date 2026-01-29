import { useState } from "react";
import { Search, Filter, Download, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAccountingData } from "@/hooks/useAccountingData";
import { useModeFeatures } from "@/hooks/useModeFeatures";
import { SimpleTransactionsView } from "@/components/SimpleTransactionsView";
import { useNavigate } from "react-router-dom";

// Traditional view component
function TraditionalTransactionsView() {
  const navigate = useNavigate();
  const { transactions, ACCOUNT_CATEGORIES } = useAccountingData();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState("todos");

  // Transformar transacciones del libro diario al formato de visualización
  const transaccionesFormateadas = transactions.map((tx) => {
    const category = ACCOUNT_CATEGORIES[tx.account];
    const isIngreso = category?.type === "ingreso";
    const isGasto = category?.type === "gasto";
    
    let tipo = "Otro";
    let monto = 0;
    
    if (isIngreso) {
      tipo = "Ingreso";
      monto = tx.credit - tx.debit;
    } else if (isGasto) {
      tipo = "Gasto";
      monto = -(tx.debit - tx.credit);
    } else {
      // Para activos, pasivos, patrimonio
      monto = tx.debit - tx.credit;
      tipo = tx.debit > 0 ? "Débito" : "Crédito";
    }

    return {
      id: tx.id,
      fecha: tx.date,
      descripcion: tx.description,
      categoria: category?.label || tx.account,
      tipo,
      monto,
      cuenta: tx.account,
    };
  });

  const filteredTransacciones = transaccionesFormateadas.filter((t) => {
    const matchesSearch = t.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.categoria.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterTipo === "todos" || 
      (filterTipo === "ingreso" && t.tipo === "Ingreso") ||
      (filterTipo === "gasto" && t.tipo === "Gasto");
    return matchesSearch && matchesFilter;
  }).sort((a, b) => b.fecha.localeCompare(a.fecha));

  // Calcular totales
  const totalIngresos = transaccionesFormateadas
    .filter(t => t.tipo === "Ingreso")
    .reduce((sum, t) => sum + t.monto, 0);
  
  const totalGastos = transaccionesFormateadas
    .filter(t => t.tipo === "Gasto")
    .reduce((sum, t) => sum + Math.abs(t.monto), 0);

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Transacciones
          </h1>
          <p className="text-muted-foreground mt-2">
            Vista de todas las transacciones del Libro Diario
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
          <Button className="shadow-soft" onClick={() => navigate("/libro-diario")}>
            <ArrowUpRight className="h-4 w-4 mr-2" />
            Ir al Libro Diario
          </Button>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Transacciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Ingresos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">${totalIngresos.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Gastos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">${totalGastos.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Transacciones</CardTitle>
              <CardDescription>Datos sincronizados con el Libro Diario</CardDescription>
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
                  <TableHead>Cuenta</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransacciones.map((transaccion) => (
                  <TableRow key={transaccion.id}>
                    <TableCell>{transaccion.fecha}</TableCell>
                    <TableCell className="font-medium">{transaccion.descripcion}</TableCell>
                    <TableCell>{transaccion.categoria}</TableCell>
                    <TableCell>
                      <Badge variant={transaccion.tipo === "Ingreso" ? "default" : transaccion.tipo === "Gasto" ? "secondary" : "outline"}>
                        {transaccion.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-semibold ${transaccion.monto > 0 ? "text-success" : "text-destructive"}`}>
                      {transaccion.monto > 0 ? "+" : ""}${Math.abs(transaccion.monto).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
              <p>No hay transacciones registradas</p>
              <Button variant="link" onClick={() => navigate("/libro-diario")}>
                Agregar transacciones en el Libro Diario
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function Transacciones() {
  const { isSimpleMode } = useModeFeatures();
  
  // Show simplified view for simple mode
  if (isSimpleMode) {
    return <SimpleTransactionsView />;
  }
  
  // Show traditional view for accounting mode
  return <TraditionalTransactionsView />;
}
