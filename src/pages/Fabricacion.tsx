import { useMemo, useState } from "react";
import {
  Factory,
  Plus,
  Package,
  ClipboardList,
  TrendingUp,
  AlertTriangle,
  Truck,
  Trash2,
  Eye,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  DollarSign,
  Layers,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  useFabricacion,
  FinishedProduct,
  BillOfMaterial,
  ProductionOrder,
  OrderStatus,
  CostVariance,
  SubcontractOrder,
} from "@/hooks/useFabricacion";

const MONEY = (n: number) =>
  `$${(Number.isFinite(n) ? n : 0).toLocaleString("es-UY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const ORDER_STATUS: Record<OrderStatus, string> = {
  planificada: "Planificada",
  en_produccion: "En producción",
  pausada: "Pausada",
  completada: "Completada",
  cancelada: "Cancelada",
};

const ORDER_COLOR: Record<OrderStatus, string> = {
  planificada: "bg-blue-100 text-blue-800",
  en_produccion: "bg-green-100 text-green-800",
  pausada: "bg-amber-100 text-amber-800",
  completada: "bg-purple-100 text-purple-800",
  cancelada: "bg-gray-100 text-gray-800",
};

const VARIANCE_TYPE: Record<CostVariance["type"], string> = {
  material_price: "Precio material",
  material_quantity: "Cantidad material",
  labor_rate: "Tarifa mano de obra",
  labor_efficiency: "Eficiencia MO",
  overhead: "Gastos generales",
  subproduct: "Subproducto",
  subcontract: "Subcontratación",
};

const SUBCONTRACT_STATUS: Record<SubcontractOrder["status"], string> = {
  pendiente: "Pendiente",
  en_proceso: "En proceso",
  completada: "Completada",
  cancelada: "Cancelada",
};

const SUBCONTRACT_COLOR: Record<SubcontractOrder["status"], string> = {
  pendiente: "bg-amber-100 text-amber-800",
  en_proceso: "bg-blue-100 text-blue-800",
  completada: "bg-green-100 text-green-800",
  cancelada: "bg-gray-100 text-gray-800",
};

export default function Fabricacion() {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    bomEntries,
    addBomEntry,
    updateBomEntry,
    deleteBomEntry,
    getBomForProduct,
    calculateBomCost,
    orders,
    createProductionOrder,
    updateOrder,
    startProduction,
    pauseProduction,
    completeProduction,
    cancelOrder,
    deleteOrder,
    addWipEntry,
    deleteWipEntry,
    variances,
    addVariance,
    deleteVariance,
    subcontracts,
    addSubcontract,
    updateSubcontractStatus,
    deleteSubcontract,
    orderStats,
    varianceStats,
    subcontractStats,
    productMap,
    currentPeriod,
  } = useFabricacion();

  const [tab, setTab] = useState("productos");

  // Estados de diálogos
  const [prodOpen, setProdOpen] = useState(false);
  const [bomOpen, setBomOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [wipOpen, setWipOpen] = useState(false);
  const [varOpen, setVarOpen] = useState(false);
  const [subOpen, setSubOpen] = useState(false);
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);

  // Formulario producto
  const [fProdSku, setFProdSku] = useState("");
  const [fProdName, setFProdName] = useState("");
  const [fProdType, setFProdType] = useState<FinishedProduct["type"]>("terminado");
  const [fProdUnit, setFProdUnit] = useState("unidad");
  const [fProdCost, setFProdCost] = useState("");
  const [fProdPrice, setFProdPrice] = useState("");

  // Formulario BOM
  const [fBomProduct, setFBomProduct] = useState("");
  const [fBomMaterial, setFBomMaterial] = useState("");
  const [fBomQty, setFBomQty] = useState("");
  const [fBomUnit, setFBomUnit] = useState("kg");
  const [fBomCost, setFBomCost] = useState("");
  const [fBomScrap, setFBomScrap] = useState("");
  const [fBomNotes, setFBomNotes] = useState("");

  // Formulario orden
  const [fOrderProduct, setFOrderProduct] = useState("");
  const [fOrderQty, setFOrderQty] = useState("");
  const [fOrderStart, setFOrderStart] = useState("");
  const [fOrderEnd, setFOrderEnd] = useState("");
  const [fOrderNotes, setFOrderNotes] = useState("");

  // Formulario WIP
  const [fWipOrder, setFWipOrder] = useState("");
  const [fWipDate, setFWipDate] = useState("");
  const [fWipType, setFWipType] = useState<"material" | "labor" | "overhead" | "subcontract" | "transfer">("material");
  const [fWipDesc, setFWipDesc] = useState("");
  const [fWipAmount, setFWipAmount] = useState("");
  const [fWipAccount, setFWipAccount] = useState("");

  // Formulario variación
  const [fVarOrder, setFVarOrder] = useState("");
  const [fVarType, setFVarType] = useState<CostVariance["type"]>("material_price");
  const [fVarDesc, setFVarDesc] = useState("");
  const [fVarStandard, setFVarStandard] = useState("");
  const [fVarActual, setFVarActual] = useState("");
  const [fVarNotes, setFVarNotes] = useState("");

  // Formulario subcontrato
  const [fSubProvider, setFSubProvider] = useState("");
  const [fSubOrder, setFSubOrder] = useState("");
  const [fSubDesc, setFSubDesc] = useState("");
  const [fSubAmount, setFSubAmount] = useState("");
  const [fSubStart, setFSubStart] = useState("");
  const [fSubEnd, setFSubEnd] = useState("");
  const [fSubNotes, setFSubNotes] = useState("");

  const detailOrder = useMemo(
    () => (detailOrderId ? orders.find((o) => o.id === detailOrderId) ?? null : null),
    [detailOrderId, orders]
  );

  // --- Handlers ---

  const handleAddProduct = () => {
    if (!fProdName.trim()) return;
    addProduct({
      sku: fProdSku.trim() || `SKU-${Date.now().toString(36).toUpperCase()}`,
      name: fProdName.trim(),
      type: fProdType,
      unit: fProdUnit,
      standardCost: parseFloat(fProdCost) || 0,
      salePrice: parseFloat(fProdPrice) || 0,
    });
    setFProdSku("");
    setFProdName("");
    setFProdType("terminado");
    setFProdUnit("unidad");
    setFProdCost("");
    setFProdPrice("");
    setProdOpen(false);
  };

  const handleAddBom = () => {
    if (!fBomProduct || !fBomMaterial.trim()) return;
    addBomEntry({
      productId: fBomProduct,
      materialId: `mat-${Date.now()}`,
      materialName: fBomMaterial.trim(),
      quantity: parseFloat(fBomQty) || 0,
      unit: fBomUnit,
      unitCost: parseFloat(fBomCost) || 0,
      scrapPercent: parseFloat(fBomScrap) || 0,
      notes: fBomNotes.trim() || undefined,
    });
    setFBomMaterial("");
    setFBomQty("");
    setFBomUnit("kg");
    setFBomCost("");
    setFBomScrap("");
    setFBomNotes("");
    setBomOpen(false);
  };

  const handleCreateOrder = () => {
    if (!fOrderProduct || !fOrderQty) return;
    const product = productMap.get(fOrderProduct);
    if (!product) return;
    createProductionOrder({
      orderNumber: `OP-${Date.now().toString(36).toUpperCase()}`,
      productId: fOrderProduct,
      productName: product.name,
      quantity: parseFloat(fOrderQty) || 0,
      unit: product.unit,
      plannedStart: fOrderStart || todayISO(),
      plannedEnd: fOrderEnd || todayISO(),
      notes: fOrderNotes.trim() || undefined,
    });
    setFOrderProduct("");
    setFOrderQty("");
    setFOrderStart("");
    setFOrderEnd("");
    setFOrderNotes("");
    setOrderOpen(false);
  };

  const handleAddWip = () => {
    if (!fWipOrder || !fWipDesc.trim() || !fWipAmount) return;
    addWipEntry(fWipOrder, {
      date: fWipDate || todayISO(),
      type: fWipType,
      description: fWipDesc.trim(),
      amount: parseFloat(fWipAmount) || 0,
      account: fWipAccount.trim() || "WIP",
    });
    setFWipOrder("");
    setFWipDate("");
    setFWipType("material");
    setFWipDesc("");
    setFWipAmount("");
    setFWipAccount("");
    setWipOpen(false);
  };

  const handleAddVariance = () => {
    if (!fVarOrder || !fVarDesc.trim()) return;
    const standard = parseFloat(fVarStandard) || 0;
    const actual = parseFloat(fVarActual) || 0;
    addVariance(fVarOrder, {
      type: fVarType,
      description: fVarDesc.trim(),
      standardCost: standard,
      actualCost: actual,
      notes: fVarNotes.trim() || undefined,
    });
    setFVarOrder("");
    setFVarType("material_price");
    setFVarDesc("");
    setFVarStandard("");
    setFVarActual("");
    setFVarNotes("");
    setVarOpen(false);
  };

  const handleAddSubcontract = () => {
    if (!fSubProvider.trim() || !fSubDesc.trim() || !fSubAmount) return;
    addSubcontract({
      providerId: `prov-${Date.now()}`,
      providerName: fSubProvider.trim(),
      orderId: fSubOrder,
      description: fSubDesc.trim(),
      amount: parseFloat(fSubAmount) || 0,
      startDate: fSubStart || todayISO(),
      endDate: fSubEnd || todayISO(),
      notes: fSubNotes.trim() || undefined,
    });
    setFSubProvider("");
    setFSubOrder("");
    setFSubDesc("");
    setFSubAmount("");
    setFSubStart("");
    setFSubEnd("");
    setFSubNotes("");
    setSubOpen(false);
  };

  const getProductName = (id: string) => productMap.get(id)?.name ?? "—";

  // --- Render de tablas ---

  const renderProductTable = () => (
    <Card>
      <CardContent className="p-0">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[220px] text-muted-foreground gap-3">
            <Package className="h-10 w-10 opacity-40" />
            <p className="text-sm">Sin productos registrados</p>
            <Button variant="outline" onClick={() => setProdOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Agregar producto
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Costo estándar</TableHead>
                <TableHead className="text-right">Precio venta</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>
                    <Badge className="text-xs">
                      {p.type === "terminado" ? "Terminado" : p.type === "subproducto" ? "Subproducto" : "Servicio"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{MONEY(p.standardCost)}</TableCell>
                  <TableCell className="text-right">{MONEY(p.salePrice)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm(`¿Eliminar ${p.name}?`)) deleteProduct(p.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  const renderBomTable = () => (
    <Card>
      <CardContent className="p-0">
        {bomEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[220px] text-muted-foreground gap-3">
            <Layers className="h-10 w-10 opacity-40" />
            <p className="text-sm">Sin listas de materiales</p>
            <Button variant="outline" onClick={() => setBomOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Agregar material al BOM
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Material</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Costo unitario</TableHead>
                <TableHead className="text-right">Desperdicio</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bomEntries.map((b) => {
                const scrapFactor = 1 + (b.scrapPercent || 0) / 100;
                const subtotal = b.quantity * b.unitCost * scrapFactor;
                return (
                  <TableRow key={b.id}>
                    <TableCell>{getProductName(b.productId)}</TableCell>
                    <TableCell>{b.materialName}</TableCell>
                    <TableCell className="text-right">{b.quantity} {b.unit}</TableCell>
                    <TableCell className="text-right">{MONEY(b.unitCost)}</TableCell>
                    <TableCell className="text-right">{b.scrapPercent}%</TableCell>
                    <TableCell className="text-right font-bold">{MONEY(subtotal)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm("¿Eliminar material del BOM?")) deleteBomEntry(b.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  const renderOrderTable = () => (
    <Card>
      <CardContent className="p-0">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[220px] text-muted-foreground gap-3">
            <ClipboardList className="h-10 w-10 opacity-40" />
            <p className="text-sm">Sin órdenes de producción</p>
            <Button variant="outline" onClick={() => setOrderOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Crear orden
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Orden</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Costo estándar</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id} className="cursor-pointer">
                  <TableCell className="font-mono text-xs" onClick={() => setDetailOrderId(o.id)}>
                    {o.orderNumber}
                  </TableCell>
                  <TableCell onClick={() => setDetailOrderId(o.id)}>{o.productName}</TableCell>
                  <TableCell className="text-right" onClick={() => setDetailOrderId(o.id)}>
                    {o.quantity} {o.unit}
                  </TableCell>
                  <TableCell className="text-right" onClick={() => setDetailOrderId(o.id)}>
                    {MONEY(o.bomCost)}
                  </TableCell>
                  <TableCell onClick={() => setDetailOrderId(o.id)}>
                    <Badge className={`text-xs ${ORDER_COLOR[o.status]}`}>
                      {ORDER_STATUS[o.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {o.status === "planificada" && (
                        <Button size="sm" variant="outline" onClick={() => startProduction(o.id)}>
                          <Play className="h-3.5 w-3.5 mr-1" /> Iniciar
                        </Button>
                      )}
                      {o.status === "en_produccion" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => pauseProduction(o.id)}>
                            <Pause className="h-3.5 w-3.5 mr-1" /> Pausar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => completeProduction(o.id)}>
                            <CheckCircle className="h-3.5 w-3.5 mr-1" /> Completar
                          </Button>
                        </>
                      )}
                      {o.status === "pausada" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => startProduction(o.id)}>
                            <Play className="h-3.5 w-3.5 mr-1" /> Reanudar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => completeProduction(o.id)}>
                            <CheckCircle className="h-3.5 w-3.5 mr-1" /> Completar
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => setDetailOrderId(o.id)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm("¿Eliminar orden?")) deleteOrder(o.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  const renderVarianceTable = () => (
    <Card>
      <CardContent className="p-0">
        {variances.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[220px] text-muted-foreground gap-3">
            <AlertTriangle className="h-10 w-10 opacity-40" />
            <p className="text-sm">Sin variaciones de costo</p>
            <Button variant="outline" onClick={() => setVarOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Registrar variación
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Orden</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Estándar</TableHead>
                <TableHead className="text-right">Real</TableHead>
                <TableHead className="text-right">Variación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variances.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-mono text-xs">
                    {orders.find((o) => o.id === v.orderId)?.orderNumber ?? "—"}
                  </TableCell>
                  <TableCell>{VARIANCE_TYPE[v.type]}</TableCell>
                  <TableCell>{v.description}</TableCell>
                  <TableCell className="text-right">{MONEY(v.standardCost)}</TableCell>
                  <TableCell className="text-right">{MONEY(v.actualCost)}</TableCell>
                  <TableCell className="text-right">
                    <span className={v.variance < 0 ? "text-green-600" : "text-red-600"}>
                      {MONEY(v.variance)} ({v.percentVariance}%)
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm("¿Eliminar variación?")) deleteVariance(v.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  const renderSubcontractTable = () => (
    <Card>
      <CardContent className="p-0">
        {subcontracts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[220px] text-muted-foreground gap-3">
            <Truck className="h-10 w-10 opacity-40" />
            <p className="text-sm">Sin subcontratos</p>
            <Button variant="outline" onClick={() => setSubOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Crear subcontrato
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Proveedor</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subcontracts.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.providerName}</TableCell>
                  <TableCell>{s.description}</TableCell>
                  <TableCell className="text-right">{MONEY(s.amount)}</TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${SUBCONTRACT_COLOR[s.status]}`}>
                      {SUBCONTRACT_STATUS[s.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {s.status === "pendiente" && (
                        <Button size="sm" variant="outline" onClick={() => updateSubcontractStatus(s.id, "en_proceso")}>
                          Iniciar
                        </Button>
                      )}
                      {s.status === "en_proceso" && (
                        <Button size="sm" variant="outline" onClick={() => updateSubcontractStatus(s.id, "completada")}>
                          Completar
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm("¿Eliminar subcontrato?")) deleteSubcontract(s.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Fabricación
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
            BOM, órdenes de producción, WIP, costeo y variaciones
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Órdenes activas</CardTitle>
            <Factory className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{orderStats.inProduction}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {orderStats.completed} completadas · {orderStats.planned} planificadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Costo estándar total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{MONEY(orderStats.totalBomCost)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Real: {MONEY(orderStats.totalActualCost)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Variaciones</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{MONEY(varianceStats.totalVariance)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {MONEY(varianceStats.favorable)} favorable · {MONEY(varianceStats.unfavorable)} desfavorable
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Subcontratos</CardTitle>
            <Truck className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">{MONEY(subcontractStats.totalAmount)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {subcontractStats.pending} pendientes · {subcontractStats.completed} completados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="productos" className="gap-1.5">
            <Package className="h-4 w-4" /> Productos ({products.length})
          </TabsTrigger>
          <TabsTrigger value="bom" className="gap-1.5">
            <Layers className="h-4 w-4" /> BOM ({bomEntries.length})
          </TabsTrigger>
          <TabsTrigger value="ordenes" className="gap-1.5">
            <ClipboardList className="h-4 w-4" /> Órdenes ({orders.length})
          </TabsTrigger>
          <TabsTrigger value="variaciones" className="gap-1.5">
            <AlertTriangle className="h-4 w-4" /> Variaciones ({variances.length})
          </TabsTrigger>
          <TabsTrigger value="subcontratos" className="gap-1.5">
            <Truck className="h-4 w-4" /> Subcontratos ({subcontracts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="productos" className="mt-4">
          <div className="mb-3">
            <Button onClick={() => setProdOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Agregar producto
            </Button>
          </div>
          {renderProductTable()}
        </TabsContent>

        <TabsContent value="bom" className="mt-4">
          <div className="mb-3">
            <Button onClick={() => setBomOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Agregar material al BOM
            </Button>
          </div>
          {renderBomTable()}
        </TabsContent>

        <TabsContent value="ordenes" className="mt-4">
          <div className="mb-3">
            <Button onClick={() => setOrderOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Crear orden de producción
            </Button>
          </div>
          {renderOrderTable()}
        </TabsContent>

        <TabsContent value="variaciones" className="mt-4">
          <div className="mb-3">
            <Button onClick={() => setVarOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Registrar variación
            </Button>
          </div>
          {renderVarianceTable()}
        </TabsContent>

        <TabsContent value="subcontratos" className="mt-4">
          <div className="mb-3">
            <Button onClick={() => setSubOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Crear subcontrato
            </Button>
          </div>
          {renderSubcontractTable()}
        </TabsContent>
      </Tabs>

      {/* Diálogo: agregar producto */}
      <Dialog open={prodOpen} onOpenChange={setProdOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo producto</DialogTitle>
            <DialogDescription>Datos del producto terminado o subproducto.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>SKU</Label>
              <Input value={fProdSku} onChange={(e) => setFProdSku(e.target.value)} placeholder="Auto-generado" />
            </div>
            <div>
              <Label>Nombre *</Label>
              <Input value={fProdName} onChange={(e) => setFProdName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo</Label>
                <Select value={fProdType} onValueChange={(v) => setFProdType(v as FinishedProduct["type"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="terminado">Terminado</SelectItem>
                    <SelectItem value="subproducto">Subproducto</SelectItem>
                    <SelectItem value="servicio">Servicio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Unidad</Label>
                <Input value={fProdUnit} onChange={(e) => setFProdUnit(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Costo estándar</Label>
                <Input value={fProdCost} onChange={(e) => setFProdCost(e.target.value)} inputMode="decimal" />
              </div>
              <div>
                <Label>Precio venta</Label>
                <Input value={fProdPrice} onChange={(e) => setFProdPrice(e.target.value)} inputMode="decimal" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProdOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddProduct} disabled={!fProdName.trim()}>Agregar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo: BOM */}
      <Dialog open={bomOpen} onOpenChange={setBomOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Agregar material al BOM</DialogTitle>
            <DialogDescription>Define los materiales necesarios para fabricar un producto.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Producto *</Label>
              <Select value={fBomProduct} onValueChange={setFBomProduct}>
                <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Material *</Label>
              <Input value={fBomMaterial} onChange={(e) => setFBomMaterial(e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Cantidad</Label>
                <Input value={fBomQty} onChange={(e) => setFBomQty(e.target.value)} inputMode="decimal" />
              </div>
              <div>
                <Label>Unidad</Label>
                <Input value={fBomUnit} onChange={(e) => setFBomUnit(e.target.value)} />
              </div>
              <div>
                <Label>Desperdicio %</Label>
                <Input value={fBomScrap} onChange={(e) => setFBomScrap(e.target.value)} inputMode="decimal" />
              </div>
            </div>
            <div>
              <Label>Costo unitario</Label>
              <Input value={fBomCost} onChange={(e) => setFBomCost(e.target.value)} inputMode="decimal" />
            </div>
            <div>
              <Label>Notas</Label>
              <Textarea value={fBomNotes} onChange={(e) => setFBomNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBomOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddBom} disabled={!fBomProduct || !fBomMaterial.trim()}>Agregar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo: orden de producción */}
      <Dialog open={orderOpen} onOpenChange={setOrderOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear orden de producción</DialogTitle>
            <DialogDescription>Genera una orden con costo estándar calculado del BOM.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Producto *</Label>
              <Select value={fOrderProduct} onValueChange={setFOrderProduct}>
                <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cantidad *</Label>
              <Input value={fOrderQty} onChange={(e) => setFOrderQty(e.target.value)} inputMode="decimal" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Inicio planificado</Label>
                <Input type="date" value={fOrderStart} onChange={(e) => setFOrderStart(e.target.value)} />
              </div>
              <div>
                <Label>Fin planificado</Label>
                <Input type="date" value={fOrderEnd} onChange={(e) => setFOrderEnd(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Notas</Label>
              <Textarea value={fOrderNotes} onChange={(e) => setFOrderNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOrderOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateOrder} disabled={!fOrderProduct || !fOrderQty}>Crear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo: WIP */}
      <Dialog open={wipOpen} onOpenChange={setWipOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar entrada WIP</DialogTitle>
            <DialogDescription>Agrega costos reales a la orden de producción.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Orden *</Label>
              <Select value={fWipOrder} onValueChange={setFWipOrder}>
                <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                <SelectContent>
                  {orders.filter((o) => o.status !== "completada" && o.status !== "cancelada").map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.orderNumber} — {o.productName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fecha</Label>
                <Input type="date" value={fWipDate} onChange={(e) => setFWipDate(e.target.value)} />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={fWipType} onValueChange={(v) => setFWipType(v as "material" | "labor" | "overhead" | "subcontract" | "transfer")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="material">Material</SelectItem>
                    <SelectItem value="labor">Mano de obra</SelectItem>
                    <SelectItem value="overhead">Gastos generales</SelectItem>
                    <SelectItem value="subcontract">Subcontrato</SelectItem>
                    <SelectItem value="transfer">Transferencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Descripción *</Label>
              <Input value={fWipDesc} onChange={(e) => setFWipDesc(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Monto *</Label>
                <Input value={fWipAmount} onChange={(e) => setFWipAmount(e.target.value)} inputMode="decimal" />
              </div>
              <div>
                <Label>Cuenta</Label>
                <Input value={fWipAccount} onChange={(e) => setFWipAccount(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWipOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddWip} disabled={!fWipOrder || !fWipDesc.trim() || !fWipAmount}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo: variación */}
      <Dialog open={varOpen} onOpenChange={setVarOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar variación de costo</DialogTitle>
            <DialogDescription>Compara costo estándar vs real y calcula la variación.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Orden *</Label>
              <Select value={fVarOrder} onValueChange={setFVarOrder}>
                <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                <SelectContent>
                  {orders.map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.orderNumber} — {o.productName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={fVarType} onValueChange={(v) => setFVarType(v as CostVariance["type"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="material_price">Precio material</SelectItem>
                  <SelectItem value="material_quantity">Cantidad material</SelectItem>
                  <SelectItem value="labor_rate">Tarifa mano de obra</SelectItem>
                  <SelectItem value="labor_efficiency">Eficiencia MO</SelectItem>
                  <SelectItem value="overhead">Gastos generales</SelectItem>
                  <SelectItem value="subproduct">Subproducto</SelectItem>
                  <SelectItem value="subcontract">Subcontratación</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descripción *</Label>
              <Input value={fVarDesc} onChange={(e) => setFVarDesc(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Costo estándar</Label>
                <Input value={fVarStandard} onChange={(e) => setFVarStandard(e.target.value)} inputMode="decimal" />
              </div>
              <div>
                <Label>Costo real</Label>
                <Input value={fVarActual} onChange={(e) => setFVarActual(e.target.value)} inputMode="decimal" />
              </div>
            </div>
            <div>
              <Label>Notas</Label>
              <Textarea value={fVarNotes} onChange={(e) => setFVarNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVarOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddVariance} disabled={!fVarOrder || !fVarDesc.trim()}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo: subcontrato */}
      <Dialog open={subOpen} onOpenChange={setSubOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear subcontrato</DialogTitle>
            <DialogDescription>Contrata servicios externos para una orden de producción.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Proveedor *</Label>
              <Input value={fSubProvider} onChange={(e) => setFSubProvider(e.target.value)} />
            </div>
            <div>
              <Label>Orden relacionada</Label>
              <Select value={fSubOrder} onValueChange={setFSubOrder}>
                <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                <SelectContent>
                  {orders.map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.orderNumber} — {o.productName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descripción *</Label>
              <Input value={fSubDesc} onChange={(e) => setFSubDesc(e.target.value)} />
            </div>
            <div>
              <Label>Monto *</Label>
              <Input value={fSubAmount} onChange={(e) => setFSubAmount(e.target.value)} inputMode="decimal" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Inicio</Label>
                <Input type="date" value={fSubStart} onChange={(e) => setFSubStart(e.target.value)} />
              </div>
              <div>
                <Label>Fin</Label>
                <Input type="date" value={fSubEnd} onChange={(e) => setFSubEnd(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Notas</Label>
              <Textarea value={fSubNotes} onChange={(e) => setFSubNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddSubcontract} disabled={!fSubProvider.trim() || !fSubDesc.trim() || !fSubAmount}>Crear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo: detalle orden */}
      <Dialog open={!!detailOrderId} onOpenChange={(o) => !o && setDetailOrderId(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {detailOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Factory className="h-5 w-5" /> {detailOrder.orderNumber}
                </DialogTitle>
                <DialogDescription>
                  {detailOrder.productName} · {detailOrder.quantity} {detailOrder.unit}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">Costo estándar (BOM)</div>
                    <div className="font-bold text-lg">{MONEY(detailOrder.bomCost)}</div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">Costo real (WIP)</div>
                    <div className="font-bold text-lg">{MONEY(detailOrder.actualCost)}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">Gastos generales</div>
                    <div className="font-bold text-lg">{MONEY(detailOrder.overheadApplied)}</div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">Variación total</div>
                    <div className={`font-bold text-lg ${detailOrder.actualCost - detailOrder.bomCost < 0 ? "text-green-600" : "text-red-600"}`}>
                      {MONEY(detailOrder.actualCost - detailOrder.bomCost)}
                    </div>
                  </div>
                </div>
                {detailOrder.notes && (
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground mb-1">Notas</div>
                    <p className="text-sm">{detailOrder.notes}</p>
                  </div>
                )}
                {/* WIP entries */}
                {detailOrder.wipEntries.length > 0 && (
                  <div>
                    <Label>Entradas WIP</Label>
                    <div className="rounded-lg border overflow-hidden mt-1">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead className="text-right">Monto</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {detailOrder.wipEntries.map((w) => (
                            <TableRow key={w.id}>
                              <TableCell>{w.date}</TableCell>
                              <TableCell className="capitalize">{w.type}</TableCell>
                              <TableCell>{w.description}</TableCell>
                              <TableCell className="text-right">{MONEY(w.amount)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailOrderId(null)}>Cerrar</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function todayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
