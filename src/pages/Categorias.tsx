import { useState } from "react";
import { Plus, Tag, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAccountingData } from "@/hooks/useAccountingData";
import { useSimpleAccountingData } from "@/hooks/useSimpleAccountingData";
import { useModeFeatures } from "@/hooks/useModeFeatures";
import { useNavigate } from "react-router-dom";

// Categoría icons for simple mode
const CATEGORY_ICONS: Record<string, string> = {
  salario: "💰", freelance: "💻", ventas: "🛒", inversiones: "📈",
  regalo: "🎁", "otros-ingresos": "💵", alimentacion: "🍔",
  transporte: "🚗", vivienda: "🏠", servicios: "💡", salud: "🏥",
  entretenimiento: "🎬", educacion: "📚", ropa: "👕", tecnologia: "📱",
  "otros-gastos": "📦",
};

const CATEGORY_COLORS: Record<string, string> = {
  Ingreso: "bg-success",
  Gasto: "bg-destructive",
  Balance: "bg-secondary",
};

export default function Categorias() {
  const [filterTipo, setFilterTipo] = useState<string>("todos");
  const accountingData = useAccountingData();
  const simpleData = useSimpleAccountingData();
  const { isSimpleMode } = useModeFeatures();
  const navigate = useNavigate();

  // Unify data shape depending on mode
  const categorias = isSimpleMode
    ? simpleData.categories.map((c) => ({
        id: c.id,
        nombre: c.nombre,
        tipo: c.tipo,
        total: c.tipo === "Ingreso" ? c.ingresos : c.gastos,
        transacciones: c.transacciones,
        icono: CATEGORY_ICONS[c.id] || "📁",
        color: CATEGORY_COLORS[c.tipo] || "bg-muted",
      }))
    : accountingData.categorias;

  const totalIngresos = isSimpleMode
    ? simpleData.totals.totalIngresos
    : accountingData.estadoResultados.totalIngresos;
  const totalGastos = isSimpleMode
    ? simpleData.totals.totalGastos
    : accountingData.estadoResultados.totalGastos;

  const filteredCategorias = categorias.filter((cat) => {
    if (filterTipo === "todos") return true;
    return cat.tipo.toLowerCase() === filterTipo;
  });

  const categoriasGasto = categorias.filter((c) => c.tipo === "Gasto").length;
  const categoriasIngreso = categorias.filter((c) => c.tipo === "Ingreso").length;
  const totalTransacciones = categorias.reduce((acc, c) => acc + c.transacciones, 0);

  const actionLabel = isSimpleMode ? "Agregar Movimiento" : "Agregar en Libro Diario";
  const actionRoute = isSimpleMode ? "/transacciones" : "/libro-diario";

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div data-tutorial="categorias-title">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Categorías
          </h1>
          <p className="text-muted-foreground mt-2">
            {isSimpleMode
              ? "Categorías generadas automáticamente desde tus movimientos"
              : "Categorías generadas automáticamente desde el Libro Diario"}
          </p>
        </div>
        <Button className="shadow-soft" onClick={() => navigate(actionRoute)}>
          <Plus className="h-4 w-4 mr-2" />
          {actionLabel}
        </Button>
      </div>

      <div data-tutorial="categorias-stats" className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Ingresos</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">${totalIngresos.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {categoriasIngreso} categorías de ingreso
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Gastos</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">${totalGastos.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {categoriasGasto} categorías de gasto
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Categorías</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categorias.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalTransacciones} movimientos totales
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Categorías</CardTitle>
              <CardDescription>
                {isSimpleMode
                  ? "Categorías activas basadas en tus movimientos"
                  : "Categorías activas basadas en tus transacciones del Libro Diario"}
              </CardDescription>
            </div>
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                <SelectItem value="ingreso">Ingresos</SelectItem>
                <SelectItem value="gasto">Gastos</SelectItem>
                {!isSimpleMode && <SelectItem value="balance">Balance</SelectItem>}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCategorias.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCategorias.map((categoria) => (
                <Card key={categoria.id} className="hover:shadow-soft transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-lg ${categoria.color} flex items-center justify-center text-2xl text-white`}>
                          {categoria.icono}
                        </div>
                        <div>
                          <h3 className="font-semibold">{categoria.nombre}</h3>
                          <Badge 
                            variant={categoria.tipo === "Ingreso" ? "default" : categoria.tipo === "Gasto" ? "destructive" : "secondary"} 
                            className="text-xs"
                          >
                            {categoria.tipo}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Movimientos</span>
                        <span className="font-medium">{categoria.transacciones}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total</span>
                        <span className={`font-bold ${
                          categoria.tipo === "Ingreso" ? "text-success" : 
                          categoria.tipo === "Gasto" ? "text-destructive" : ""
                        }`}>
                          ${categoria.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
              <p>No hay categorías disponibles.</p>
              <p className="text-sm">
                {isSimpleMode
                  ? "Registra movimientos para ver las categorías."
                  : "Registra transacciones en el Libro Diario para ver las categorías."}
              </p>
              <Button variant="outline" className="mt-4" onClick={() => navigate(actionRoute)}>
                {actionLabel}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
