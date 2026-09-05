import { useState } from "react";
import { Search, Filter, Download, ArrowUpRight, FileSpreadsheet, FileText, ArrowUpDown, Plus, BookOpen } from "lucide-react";
import { Label } from "@/components/ui/label";
import { sanitizeNumericInput } from "@/lib/numeric-input";
import { parseFlexibleNumber } from "@/lib/parse-flexible-number";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAccountingData } from "@/hooks/useAccountingData";
import { useJournalTransactions, getTransactionBalance, isCompoundTransaction, getCompoundAccounts } from "@/hooks/useJournalTransactions";
import { useModeFeatures } from "@/hooks/useModeFeatures";
import { SimpleTransactionsView } from "@/components/SimpleTransactionsView";
import { CompoundEntryModal } from "@/components/CompoundEntryModal";
import { CustomAccountsManager } from "@/components/CustomAccountsManager";
import { useNavigate } from "react-router-dom";
import { exportToCSV, exportToExcel, exportToPDF, type ExportTransaction } from "@/lib/export-transactions";
import { toast } from "sonner";

// Traditional view component
function TraditionalTransactionsView() {
  const navigate = useNavigate();
  const { ACCOUNT_CATEGORIES } = useAccountingData();
  const { transactions, setTransactions } = useJournalTransactions();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState("todos");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [sortMode, setSortMode] = useState<"fecha-desc" | "fecha-asc" | "total-desc" | "total-asc">("fecha-desc");
  const [compoundModalOpen, setCompoundModalOpen] = useState(false);
  const [customAccountsModalOpen, setCustomAccountsModalOpen] = useState(false);

  // Transformar transacciones del libro diario al formato de visualización
  const transaccionesFormateadas = transactions.map((tx) => {
    const category = ACCOUNT_CATEGORIES[tx.account];
    const compound = isCompoundTransaction(tx);
    const accounts = getCompoundAccounts(tx);
    const balance = getTransactionBalance(tx);
    
    let tipo = "Otro";
    let monto = 0;
    let categoria = category?.label || tx.account;
    let cuentasResumen = "";

    if (compound) {
      tipo = "Compuesto";
      monto = balance.balance;
      categoria = tx.description || "Asiento compuesto";
      cuentasResumen = accounts.join(", ");
    } else if (category?.type === "ingreso") {
      tipo = "Ingreso";
      monto = tx.credit - tx.debit;
    } else if (category?.type === "gasto") {
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
      descripcion: compound ? tx.description : tx.description,
      categoria,
      cuentasResumen,
      tipo,
      monto,
      cuenta: tx.account,
      cantidad: tx.quantity,
      precio: tx.price,
      reconciled: tx.reconciled === true,
      isCompound: compound,
      lines: tx.lines,
    };
  });

  const handleToggleReconciled = (id: number) => {
    setTransactions((prev) =>
      prev.map((tx) =>
        tx.id === id ? { ...tx, reconciled: !(tx.reconciled === true) } : tx
      )
    );
  };

  const totalConciliados = transaccionesFormateadas.filter((t) => t.reconciled).length;

  const min = minAmount.trim() ? parseFlexibleNumber(minAmount, Number.NEGATIVE_INFINITY) : Number.NEGATIVE_INFINITY;
  const max = maxAmount.trim() ? parseFlexibleNumber(maxAmount, Number.POSITIVE_INFINITY) : Number.POSITIVE_INFINITY;

  const filteredTransacciones = transaccionesFormateadas.filter((t) => {
    const matchesSearch = t.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (t.cuentasResumen && t.cuentasResumen.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterTipo === "todos" || 
      (filterTipo === "ingreso" && t.tipo === "Ingreso") ||
      (filterTipo === "gasto" && t.tipo === "Gasto") ||
      (filterTipo === "compuesto" && t.isCompound);
    const abs = Math.abs(t.monto);
    const matchesAmount = abs >= min && abs <= max;
    return matchesSearch && matchesFilter && matchesAmount;
  }).sort((a, b) => {
    switch (sortMode) {
      case "fecha-asc": return a.fecha.localeCompare(b.fecha);
      case "total-desc": return Math.abs(b.monto) - Math.abs(a.monto);
      case "total-asc": return Math.abs(a.monto) - Math.abs(b.monto);
      case "fecha-desc":
      default: return b.fecha.localeCompare(a.fecha);
    }
  });

  // Calcular totales
  const totalIngresos = transaccionesFormateadas
    .filter(t => t.tipo === "Ingreso")
    .reduce((sum, t) => sum + t.monto, 0);
  
  const totalGastos = transaccionesFormateadas
    .filter(t => t.tipo === "Gasto")
    .reduce((sum, t) => sum + Math.abs(t.monto), 0);

  const totalCompuestos = transaccionesFormateadas.filter(t => t.isCompound).length;

  const exportData: ExportTransaction[] = transaccionesFormateadas.map((t) => ({
    fecha: t.fecha,
    descripcion: t.isCompound ? `[Compuesto] ${t.descripcion} (${t.cuentasResumen})` : t.descripcion,
    categoria: t.categoria,
    tipo: t.tipo,
    monto: t.monto,
  }));

  const handleExport = (format: "csv" | "excel" | "pdf") => {
    if (exportData.length === 0) {
      toast.error("No hay transacciones para exportar");
      return;
    }
    if (format === "csv") exportToCSV(exportData);
    else if (format === "excel") exportToExcel(exportData);
    else exportToPDF(exportData);
    toast.success(`Exportando como ${format.toUpperCase()}...`);
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div data-tutorial="transacciones-title">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Transacciones
          </h1>
          <p className="text-muted-foreground mt-2">
            Vista de todas las transacciones del Libro Diario
          </p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button data-tutorial="transacciones-export" variant="outline" size="icon" title="Exportar">
                <Download className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport("csv")}>
                <FileText className="h-4 w-4 mr-2" />
                Exportar CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("excel")}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Exportar Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("pdf")}>
                <FileText className="h-4 w-4 mr-2" />
                Exportar PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" onClick={() => setCustomAccountsModalOpen(true)}>
            <BookOpen className="h-4 w-4 mr-1" />
            Plan de Cuentas
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCompoundModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Asiento Compuesto
          </Button>
          <Button className="shadow-soft" onClick={() => navigate("/libro-diario")}>
            <ArrowUpRight className="h-4 w-4 mr-2" />
            Ir al Libro Diario
          </Button>
        </div>
      </div>

      {/* Resumen */}
      <div data-tutorial="transacciones-resumen" className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Asientos Compuestos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCompuestos}</div>
          </CardContent>
        </Card>
      </div>

      <Card data-tutorial="transacciones-tabla">
        <CardHeader>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle>Lista de Transacciones</CardTitle>
                <CardDescription>Datos sincronizados con el Libro Diario</CardDescription>
              </div>
              <div className="flex gap-2 flex-wrap">
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
                    <SelectItem value="compuesto">Compuestos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <div className="grid gap-1">
                <Label htmlFor="minMonto" className="text-xs">Monto mín. ($)</Label>
                <Input id="minMonto" type="text" inputMode="decimal" className="w-32"
                  placeholder="0.00" value={minAmount}
                  onChange={(e) => setMinAmount(sanitizeNumericInput(e.target.value))} />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="maxMonto" className="text-xs">Monto máx. ($)</Label>
                <Input id="maxMonto" type="text" inputMode="decimal" className="w-32"
                  placeholder="Sin límite" value={maxAmount}
                  onChange={(e) => setMaxAmount(sanitizeNumericInput(e.target.value))} />
              </div>
              <div className="grid gap-1">
                <Label className="text-xs">Ordenar por</Label>
                <Select value={sortMode} onValueChange={(v: typeof sortMode) => setSortMode(v)}>
                  <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fecha-desc">Fecha (recientes)</SelectItem>
                    <SelectItem value="fecha-asc">Fecha (antiguas)</SelectItem>
                    <SelectItem value="total-desc">Monto (mayor)</SelectItem>
                    <SelectItem value="total-asc">Monto (menor)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(minAmount || maxAmount) && (
                <Button variant="ghost" size="sm" onClick={() => { setMinAmount(""); setMaxAmount(""); }}>
                  Limpiar
                </Button>
              )}
              <div className="ml-auto text-xs text-muted-foreground self-center">
                Mostrando {filteredTransacciones.length} de {transaccionesFormateadas.length} · <span className="font-medium">Conciliados: {totalConciliados}</span>
              </div>
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
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cuenta</TableHead>
                  <TableHead className="text-right">Cant.</TableHead>
                  <TableHead className="text-right">P. Unit.</TableHead>
                  <TableHead className="text-right">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                      onClick={() => setSortMode(sortMode === "total-desc" ? "total-asc" : "total-desc")}
                      aria-label="Ordenar por Monto"
                    >
                      Monto
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-center">Conciliado</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredTransacciones.map((transaccion) => (
                  <TableRow key={transaccion.id}>
                    <TableCell>{transaccion.fecha}</TableCell>
                    <TableCell className="font-medium">
                      {transaccion.descripcion}
                      {transaccion.isCompound && transaccion.cuentasResumen && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {transaccion.cuentasResumen}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {transaccion.isCompound ? (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                          Compuesto
                        </Badge>
                      ) : (
                        <Badge variant={transaccion.tipo === "Ingreso" ? "default" : transaccion.tipo === "Gasto" ? "secondary" : "outline"}>
                          {transaccion.tipo}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {transaccion.isCompound ? (
                        <div className="flex flex-wrap gap-1">
                          {transaccion.lines?.map((line, idx) => (
                            <Badge key={idx} variant="outline" className="text-[10px]">
                              {line.account}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        transaccion.cuenta
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{transaccion.cantidad ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{transaccion.precio != null ? `$${transaccion.precio.toFixed(2)}` : "—"}</TableCell>
                    <TableCell className={`text-right font-semibold ${transaccion.monto > 0 ? "text-success" : "text-destructive"}`}>
                      {transaccion.monto > 0 ? "+" : ""}${Math.abs(transaccion.monto).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      <input
                        type="checkbox"
                        aria-label={`Conciliar ${transaccion.descripcion}`}
                        checked={transaccion.reconciled}
                        onChange={() => handleToggleReconciled(transaccion.id)}
                        className="h-4 w-4 cursor-pointer accent-primary"
                      />
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

      {/* Modal de Asiento Compuesto */}
      <CompoundEntryModal
        open={compoundModalOpen}
        onOpenChange={setCompoundModalOpen}
      />

      {/* Modal de Plan de Cuentas */}
      <CustomAccountsManager
        open={customAccountsModalOpen}
        onOpenChange={setCustomAccountsModalOpen}
      />
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
