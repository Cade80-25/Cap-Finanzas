import { useState } from "react";
import { Plus, Edit, Trash2, Tag, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";

const categoriasData = [
  { id: 1, nombre: "Alimentación", tipo: "Gasto", icono: "🍔", color: "bg-blue-500", transacciones: 45, total: 1250 },
  { id: 2, nombre: "Transporte", tipo: "Gasto", icono: "🚗", color: "bg-green-500", transacciones: 28, total: 680 },
  { id: 3, nombre: "Vivienda", tipo: "Gasto", icono: "🏠", color: "bg-orange-500", transacciones: 12, total: 2400 },
  { id: 4, nombre: "Salario", tipo: "Ingreso", icono: "💰", color: "bg-emerald-500", transacciones: 2, total: 7000 },
  { id: 5, nombre: "Entretenimiento", tipo: "Gasto", icono: "🎮", color: "bg-purple-500", transacciones: 18, total: 450 },
  { id: 6, nombre: "Salud", tipo: "Gasto", icono: "⚕️", color: "bg-pink-500", transacciones: 8, total: 320 },
  { id: 7, nombre: "Freelance", tipo: "Ingreso", icono: "💼", color: "bg-cyan-500", transacciones: 5, total: 1800 },
  { id: 8, nombre: "Educación", tipo: "Gasto", icono: "📚", color: "bg-yellow-500", transacciones: 6, total: 540 },
];

export default function Categorias() {
  const [filterTipo, setFilterTipo] = useState<string>("todos");

  const filteredCategorias = categoriasData.filter((cat) => {
    if (filterTipo === "todos") return true;
    return cat.tipo.toLowerCase() === filterTipo;
  });

  const totalGastos = categoriasData
    .filter((c) => c.tipo === "Gasto")
    .reduce((acc, c) => acc + c.total, 0);

  const totalIngresos = categoriasData
    .filter((c) => c.tipo === "Ingreso")
    .reduce((acc, c) => acc + c.total, 0);

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Categorías
          </h1>
          <p className="text-muted-foreground mt-2">
            Organiza tus transacciones en categorías personalizadas
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="shadow-soft">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Categoría
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva Categoría</DialogTitle>
              <DialogDescription>
                Crea una nueva categoría para organizar tus transacciones
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nombre-cat">Nombre</Label>
                <Input id="nombre-cat" placeholder="Ej: Compras Online" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tipo-cat">Tipo</Label>
                <Select>
                  <SelectTrigger id="tipo-cat">
                    <SelectValue placeholder="Selecciona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ingreso">Ingreso</SelectItem>
                    <SelectItem value="gasto">Gasto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="icono-cat">Icono (Emoji)</Label>
                <Input id="icono-cat" placeholder="🛒" maxLength={2} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="color-cat">Color</Label>
                <Input id="color-cat" type="color" defaultValue="#3b82f6" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Crear Categoría</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Ingresos</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">${totalIngresos.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {categoriasData.filter((c) => c.tipo === "Ingreso").length} categorías
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
              {categoriasData.filter((c) => c.tipo === "Gasto").length} categorías
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Categorías</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categoriasData.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {categoriasData.reduce((acc, c) => acc + c.transacciones, 0)} transacciones totales
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Categorías</CardTitle>
              <CardDescription>Gestiona tus categorías de ingresos y gastos</CardDescription>
            </div>
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                <SelectItem value="ingreso">Ingresos</SelectItem>
                <SelectItem value="gasto">Gastos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCategorias.map((categoria) => (
              <Card key={categoria.id} className="hover:shadow-soft transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg ${categoria.color} flex items-center justify-center text-2xl`}>
                        {categoria.icono}
                      </div>
                      <div>
                        <h3 className="font-semibold">{categoria.nombre}</h3>
                        <Badge variant={categoria.tipo === "Ingreso" ? "default" : "secondary"} className="text-xs">
                          {categoria.tipo}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Transacciones</span>
                      <span className="font-medium">{categoria.transacciones}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total</span>
                      <span className={`font-bold ${categoria.tipo === "Ingreso" ? "text-success" : "text-destructive"}`}>
                        ${categoria.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
