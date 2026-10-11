import { useMemo, useState } from "react";
import {
  Building2,
  Plus,
  Truck,
  Wrench,
  TrendingDown,
  PackageMinus,
  Trash2,
  Eye,
  DollarSign,
  MapPin,
  Calendar,
  Calculator,
  Landmark,
  Cpu,
  Hammer,
  Boxes,
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
  useActivos,
  FixedAsset,
  AssetCategory,
  DepreciationMethod,
  AssetStatus,
  MaintenanceRecord,
  AssetDisposal,
} from "@/hooks/useActivos";
import { useModuleIntegration } from "@/hooks/useModuleIntegration";

const MONEY = (n: number) =>
  `$${(Number.isFinite(n) ? n : 0).toLocaleString("es-UY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const CATEGORY_LABEL: Record<AssetCategory, string> = {
  maquinaria: "Maquinaria",
  inmueble: "Inmueble",
  vehiculo: "Vehículo",
  mobiliario: "Mobiliario",
  equipo_informatico: "Equipo informático",
  herramienta: "Herramienta",
  otro: "Otro",
};

const CATEGORY_ICON: Record<AssetCategory, typeof Boxes> = {
  maquinaria: Hammer,
  inmueble: Building2,
  vehiculo: Truck,
  mobiliario: Boxes,
  equipo_informatico: Cpu,
  herramienta: Wrench,
  otro: Boxes,
};

const METHOD_LABEL: Record<DepreciationMethod, string> = {
  lineal: "Lineal",
  saldo_decreciente: "Saldo decreciente",
  unidades_producidas: "Unidades producidas",
};

const STATUS_LABEL: Record<AssetStatus, string> = {
  activo: "Activo",
  mantenimiento: "En mantenimiento",
  baja: "Baja",
  vendido: "Vendido",
};

const STATUS_COLOR: Record<AssetStatus, string> = {
  activo: "bg-green-100 text-green-800",
  mantenimiento: "bg-amber-100 text-amber-800",
  baja: "bg-gray-100 text-gray-800",
  vendido: "bg-blue-100 text-blue-800",
};

const MAINT_TYPE: Record<MaintenanceRecord["type"], string> = {
  preventivo: "Preventivo",
  correctivo: "Correctivo",
  inspeccion: "Inspección",
  reparacion: "Reparación",
};

export default function Activos() {
  const {
    assets,
    addAsset,
    updateAsset,
    deleteAsset,
    depreciationEntries,
    calculateDepreciation,
    registerDepreciation,
    deleteDepreciation,
    maintenanceRecords,
    addMaintenance,
    deleteMaintenance,
    disposals,
    registerDisposal,
    deleteDisposal,
    assetValuations,
    assetStats,
    byCategory,
    maintenanceStats,
    disposalStats,
    assetDepreciationMap,
    assetMaintenanceMap,
  } = useActivos();
  const { postAssetAcquisition, postDepreciation, postDisposal, postMaintenance, isPosted } = useModuleIntegration();

  const [tab, setTab] = useState("activos");
  const [assetOpen, setAssetOpen] = useState(false);
  const [depOpen, setDepOpen] = useState(false);
  const [maintOpen, setMaintOpen] = useState(false);
  const [dispOpen, setDispOpen] = useState(false);
  const [detailAssetId, setDetailAssetId] = useState<string | null>(null);

  // Formulario activo
  const [fCode, setFCode] = useState("");
  const [fName, setFName] = useState("");
  const [fCategory, setFCategory] = useState<AssetCategory>("maquinaria");
  const [fLocation, setFLocation] = useState("");
  const [fAcqDate, setFAcqDate] = useState("");
  const [fAcqCost, setFAcqCost] = useState("");
  const [fResidual, setFResidual] = useState("");
  const [fLife, setFLife] = useState("");
  const [fMethod, setFMethod] = useState<DepreciationMethod>("lineal");
  const [fRate, setFRate] = useState("");
  const [fTotalUnits, setFTotalUnits] = useState("");
  const [fSerial, setFSerial] = useState("");
  const [fResponsible, setFResponsible] = useState("");
  const [fNotes, setFNotes] = useState("");

  // Formulario depreciación
  const [fDepAsset, setFDepAsset] = useState("");
  const [fDepPeriod, setFDepPeriod] = useState(new Date().toISOString().slice(0, 7));

  // Formulario mantenimiento
  const [fMntAsset, setFMntAsset] = useState("");
  const [fMntDate, setFMntDate] = useState("");
  const [fMntType, setFMntType] = useState<MaintenanceRecord["type"]>("preventivo");
  const [fMntDesc, setFMntDesc] = useState("");
  const [fMntCost, setFMntCost] = useState("");
  const [fMntProvider, setFMntProvider] = useState("");
  const [fMntNext, setFMntNext] = useState("");

  // Formulario baja
  const [fDispAsset, setFDispAsset] = useState("");
  const [fDispDate, setFDispDate] = useState("");
  const [fDispType, setFDispType] = useState<AssetDisposal["type"]>("venta");
  const [fDispSale, setFDispSale] = useState("");
  const [fDispNotes, setFDispNotes] = useState("");

  const detailAsset = useMemo(
    () => (detailAssetId ? assets.find((a) => a.id === detailAssetId) ?? null : null),
    [detailAssetId, assets]
  );

  // --- Handlers ---

  const handleAddAsset = () => {
    if (!fName.trim()) return;
    const asset = addAsset({
      code: fCode.trim() || `ACT-${Date.now().toString(36).toUpperCase()}`,
      name: fName.trim(),
      category: fCategory,
      location: fLocation.trim() || "Principal",
      acquisitionDate: fAcqDate || new Date().toISOString().slice(0, 10),
      acquisitionCost: parseFloat(fAcqCost) || 0,
      residualValue: parseFloat(fResidual) || 0,
      usefulLifeYears: parseFloat(fLife) || 5,
      depreciationMethod: fMethod,
      decliningRate: fMethod === "saldo_decreciente" ? parseFloat(fRate) || 20 : undefined,
      totalUnits: fMethod === "unidades_producidas" ? parseFloat(fTotalUnits) || 0 : undefined,
      unitsProduced: fMethod === "unidades_producidas" ? 0 : undefined,
      status: "activo",
      serialNumber: fSerial.trim() || undefined,
      responsible: fResponsible.trim() || undefined,
      notes: fNotes.trim() || undefined,
    });
    // Asiento automático: Debe Activo Fijo / Haber Banco
    if (asset && asset.acquisitionCost > 0) {
      postAssetAcquisition(asset.id, asset.name, asset.acquisitionCost, asset.acquisitionDate);
    }
    setFCode(""); setFName(""); setFCategory("maquinaria"); setFLocation("");
    setFAcqDate(""); setFAcqCost(""); setFResidual(""); setFLife("");
    setFMethod("lineal"); setFRate(""); setFTotalUnits(""); setFSerial("");
    setFResponsible(""); setFNotes("");
    setAssetOpen(false);
  };

  const handleRegisterDep = () => {
    if (!fDepAsset) return;
    const dep = registerDepreciation(fDepAsset, fDepPeriod);
    // Asiento automático: Debe Gasto Depreciación / Haber Dep. Acumulada
    if (dep && dep.amount > 0) {
      const assetName = assets.find((a) => a.id === fDepAsset)?.name ?? "Activo";
      postDepreciation(dep.id, assetName, fDepPeriod, dep.amount);
    }
    setFDepAsset("");
    setDepOpen(false);
  };

  const handleAddMaint = () => {
    if (!fMntAsset || !fMntDesc.trim()) return;
    const mnt = addMaintenance({
      assetId: fMntAsset,
      date: fMntDate || new Date().toISOString().slice(0, 10),
      type: fMntType,
      description: fMntDesc.trim(),
      cost: parseFloat(fMntCost) || 0,
      provider: fMntProvider.trim() || undefined,
      nextDueDate: fMntNext || undefined,
    });
    // Asiento automático: Debe Gastos Operativos / Haber Caja
    if (mnt && mnt.cost > 0) {
      postMaintenance(mnt.id, getAssetName(fMntAsset), mnt.description, mnt.cost, mnt.date);
    }
    setFMntAsset(""); setFMntDate(""); setFMntType("preventivo"); setFMntDesc("");
    setFMntCost(""); setFMntProvider(""); setFMntNext("");
    setMaintOpen(false);
  };

  const handleRegisterDisposal = () => {
    if (!fDispAsset) return;
    const disposal = registerDisposal(fDispAsset, {
      date: fDispDate || new Date().toISOString().slice(0, 10),
      type: fDispType,
      saleValue: parseFloat(fDispSale) || 0,
      notes: fDispNotes.trim() || undefined,
    });
    // Asiento automático: baja del activo (valor libro, cobro, ganancia/pérdida)
    if (disposal) {
      const assetName = assets.find((a) => a.id === fDispAsset)?.name ?? "Activo";
      postDisposal(disposal.id, assetName, disposal.saleValue, disposal.bookValueAtDisposal, disposal.date);
    }
    setFDispAsset(""); setFDispDate(""); setFDispType("venta"); setFDispSale(""); setFDispNotes("");
    setDispOpen(false);
  };

  const getAssetName = (id: string) => assets.find((a) => a.id === id)?.name ?? "—";

  // --- Render ---

  const renderAssetTable = () => (
    <Card>
      <CardContent className="p-0">
        {assets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[220px] text-muted-foreground gap-3">
            <Landmark className="h-10 w-10 opacity-40" />
            <p className="text-sm">Sin activos registrados</p>
            <Button variant="outline" onClick={() => setAssetOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Agregar activo
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden sm:table-cell">Categoría</TableHead>
                <TableHead className="hidden md:table-cell">Ubicación</TableHead>
                <TableHead className="text-right">Costo</TableHead>
                <TableHead className="text-right">Valor libros</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((a) => {
                const val = assetValuations.get(a.id);
                return (
                  <TableRow key={a.id} className="cursor-pointer">
                    <TableCell className="font-mono text-xs" onClick={() => setDetailAssetId(a.id)}>{a.code}</TableCell>
                    <TableCell className="font-medium" onClick={() => setDetailAssetId(a.id)}>{a.name}</TableCell>
                    <TableCell className="hidden sm:table-cell" onClick={() => setDetailAssetId(a.id)}>
                      {CATEGORY_LABEL[a.category]}
                    </TableCell>
                    <TableCell className="hidden md:table-cell" onClick={() => setDetailAssetId(a.id)}>
                      {a.location}
                    </TableCell>
                    <TableCell className="text-right" onClick={() => setDetailAssetId(a.id)}>{MONEY(a.acquisitionCost)}</TableCell>
                    <TableCell className="text-right font-bold" onClick={() => setDetailAssetId(a.id)}>
                      {MONEY(val?.bookValue ?? 0)}
                    </TableCell>
                    <TableCell onClick={() => setDetailAssetId(a.id)}>
                      <Badge className={`text-xs ${STATUS_COLOR[a.status]}`}>{STATUS_LABEL[a.status]}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setDetailAssetId(a.id)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm(`¿Eliminar ${a.name}?`)) deleteAsset(a.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
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

  const renderDepreciationTable = () => (
    <Card>
      <CardContent className="p-0">
        {depreciationEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[220px] text-muted-foreground gap-3">
            <TrendingDown className="h-10 w-10 opacity-40" />
            <p className="text-sm">Sin registros de depreciación</p>
            <Button variant="outline" onClick={() => setDepOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Registrar depreciación
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Activo</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Método</TableHead>
                <TableHead className="text-right">Cuota</TableHead>
                <TableHead className="text-right">Acumulada</TableHead>
                <TableHead className="text-right">Valor libros</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {depreciationEntries.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>{getAssetName(d.assetId)}{isPosted(`depreciation:${d.id}`) && <Badge variant="outline" className="ml-1 text-xs bg-green-50 text-green-700 border-green-200">Contab.</Badge>}</TableCell>
                  <TableCell>{d.period}</TableCell>
                  <TableCell>{METHOD_LABEL[d.method]}</TableCell>
                  <TableCell className="text-right">{MONEY(d.amount)}</TableCell>
                  <TableCell className="text-right">{MONEY(d.accumulated)}</TableCell>
                  <TableCell className="text-right font-bold">{MONEY(d.bookValue)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm("¿Eliminar registro de depreciación?")) deleteDepreciation(d.id);
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

  const renderMaintenanceTable = () => (
    <Card>
      <CardContent className="p-0">
        {maintenanceRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[220px] text-muted-foreground gap-3">
            <Wrench className="h-10 w-10 opacity-40" />
            <p className="text-sm">Sin registros de mantenimiento</p>
            <Button variant="outline" onClick={() => setMaintOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Registrar mantenimiento
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Activo</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="hidden sm:table-cell">Descripción</TableHead>
                <TableHead className="text-right">Costo</TableHead>
                <TableHead className="hidden md:table-cell">Próximo</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {maintenanceRecords.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{getAssetName(m.assetId)}{isPosted(`maintenance:${m.id}`) && <Badge variant="outline" className="ml-1 text-xs bg-green-50 text-green-700 border-green-200">Contab.</Badge>}</TableCell>
                  <TableCell>{m.date}</TableCell>
                  <TableCell>{MAINT_TYPE[m.type]}</TableCell>
                  <TableCell className="hidden sm:table-cell">{m.description}</TableCell>
                  <TableCell className="text-right">{MONEY(m.cost)}</TableCell>
                  <TableCell className="hidden md:table-cell">{m.nextDueDate ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm("¿Eliminar registro?")) deleteMaintenance(m.id);
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

  const renderDisposalTable = () => (
    <Card>
      <CardContent className="p-0">
        {disposals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[220px] text-muted-foreground gap-3">
            <PackageMinus className="h-10 w-10 opacity-40" />
            <p className="text-sm">Sin bajas o ventas registradas</p>
            <Button variant="outline" onClick={() => setDispOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Registrar baja
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Activo</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Valor venta</TableHead>
                <TableHead className="text-right">Valor libros</TableHead>
                <TableHead className="text-right">Ganancia/Pérdida</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {disposals.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>{getAssetName(d.assetId)}{isPosted(`disposal:${d.id}`) && <Badge variant="outline" className="ml-1 text-xs bg-green-50 text-green-700 border-green-200">Contab.</Badge>}</TableCell>
                  <TableCell>{d.date}</TableCell>
                  <TableCell className="capitalize">{d.type}</TableCell>
                  <TableCell className="text-right">{MONEY(d.saleValue)}</TableCell>
                  <TableCell className="text-right">{MONEY(d.bookValueAtDisposal)}</TableCell>
                  <TableCell className="text-right">
                    <span className={d.gainLoss < 0 ? "text-red-600" : "text-green-600"}>
                      {MONEY(d.gainLoss)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm("¿Eliminar registro?")) deleteDisposal(d.id);
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

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Activos y Logística
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
            Maquinaria, inmuebles, vehículos, depreciación y mantenimiento
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <Landmark className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{assetStats.count}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {assetStats.active} activos · {assetStats.inMaintenance} en mantenimiento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Valor en libros</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{MONEY(assetStats.totalBookValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Costo: {MONEY(assetStats.totalCost)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Depreciación acumulada</CardTitle>
            <TrendingDown className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{MONEY(assetStats.totalAccumulated)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Cuota anual: {MONEY(assetStats.totalAnnualDepreciation)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Mantenimiento</CardTitle>
            <Wrench className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">{MONEY(maintenanceStats.totalCost)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {maintenanceStats.preventive} prev · {maintenanceStats.corrective} corr
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="activos" className="gap-1.5">
            <Landmark className="h-4 w-4" /> Activos ({assets.length})
          </TabsTrigger>
          <TabsTrigger value="depreciacion" className="gap-1.5">
            <TrendingDown className="h-4 w-4" /> Depreciación ({depreciationEntries.length})
          </TabsTrigger>
          <TabsTrigger value="mantenimiento" className="gap-1.5">
            <Wrench className="h-4 w-4" /> Mantenimiento ({maintenanceRecords.length})
          </TabsTrigger>
          <TabsTrigger value="bajas" className="gap-1.5">
            <PackageMinus className="h-4 w-4" /> Bajas ({disposals.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activos" className="mt-4">
          <div className="mb-3">
            <Button onClick={() => setAssetOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Agregar activo
            </Button>
          </div>
          {renderAssetTable()}
        </TabsContent>

        <TabsContent value="depreciacion" className="mt-4">
          <div className="mb-3">
            <Button onClick={() => setDepOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Registrar depreciación
            </Button>
          </div>
          {renderDepreciationTable()}
        </TabsContent>

        <TabsContent value="mantenimiento" className="mt-4">
          <div className="mb-3">
            <Button onClick={() => setMaintOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Registrar mantenimiento
            </Button>
          </div>
          {renderMaintenanceTable()}
        </TabsContent>

        <TabsContent value="bajas" className="mt-4">
          <div className="mb-3">
            <Button onClick={() => setDispOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Registrar baja o venta
            </Button>
          </div>
          {renderDisposalTable()}
        </TabsContent>
      </Tabs>

      {/* Diálogo: agregar activo */}
      <Dialog open={assetOpen} onOpenChange={setAssetOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo activo fijo</DialogTitle>
            <DialogDescription>Registra un activo con su método de depreciación.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Código</Label>
                <Input value={fCode} onChange={(e) => setFCode(e.target.value)} placeholder="Auto" />
              </div>
              <div>
                <Label>Categoría</Label>
                <Select value={fCategory} onValueChange={(v) => setFCategory(v as AssetCategory)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABEL).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Nombre *</Label>
              <Input value={fName} onChange={(e) => setFName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Ubicación</Label>
                <Input value={fLocation} onChange={(e) => setFLocation(e.target.value)} />
              </div>
              <div>
                <Label>Responsable</Label>
                <Input value={fResponsible} onChange={(e) => setFResponsible(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fecha adquisición</Label>
                <Input type="date" value={fAcqDate} onChange={(e) => setFAcqDate(e.target.value)} />
              </div>
              <div>
                <Label>N° serie</Label>
                <Input value={fSerial} onChange={(e) => setFSerial(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Costo *</Label>
                <Input value={fAcqCost} onChange={(e) => setFAcqCost(e.target.value)} inputMode="decimal" />
              </div>
              <div>
                <Label>Valor residual</Label>
                <Input value={fResidual} onChange={(e) => setFResidual(e.target.value)} inputMode="decimal" />
              </div>
              <div>
                <Label>Vida útil (años)</Label>
                <Input value={fLife} onChange={(e) => setFLife(e.target.value)} inputMode="decimal" />
              </div>
            </div>
            <div>
              <Label>Método de depreciación</Label>
              <Select value={fMethod} onValueChange={(v) => setFMethod(v as DepreciationMethod)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lineal">Lineal</SelectItem>
                  <SelectItem value="saldo_decreciente">Saldo decreciente</SelectItem>
                  <SelectItem value="unidades_producidas">Unidades producidas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {fMethod === "saldo_decreciente" && (
              <div>
                <Label>Tasa anual (%)</Label>
                <Input value={fRate} onChange={(e) => setFRate(e.target.value)} inputMode="decimal" placeholder="20" />
              </div>
            )}
            {fMethod === "unidades_producidas" && (
              <div>
                <Label>Unidades totales estimadas</Label>
                <Input value={fTotalUnits} onChange={(e) => setFTotalUnits(e.target.value)} inputMode="decimal" />
              </div>
            )}
            <div>
              <Label>Notas</Label>
              <Textarea value={fNotes} onChange={(e) => setFNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssetOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddAsset} disabled={!fName.trim()}>Agregar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo: depreciación */}
      <Dialog open={depOpen} onOpenChange={setDepOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar depreciación</DialogTitle>
            <DialogDescription>
              Calcula la cuota del período según el método del activo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Activo *</Label>
              <Select value={fDepAsset} onValueChange={setFDepAsset}>
                <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                <SelectContent>
                  {assets.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name} — {METHOD_LABEL[a.depreciationMethod]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Período</Label>
              <Input type="month" value={fDepPeriod} onChange={(e) => setFDepPeriod(e.target.value)} />
            </div>
            {fDepAsset && (() => {
              const a = assets.find((x) => x.id === fDepAsset);
              if (!a) return null;
              const val = calculateDepreciation(a);
              return (
                <div className="rounded-lg border p-3 space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Acumulado actual</span><span>{MONEY(val.accumulated)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Valor en libros</span><span className="font-bold">{MONEY(val.bookValue)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Cuota anual</span><span>{MONEY(val.annualDepreciation)}</span></div>
                </div>
              );
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDepOpen(false)}>Cancelar</Button>
            <Button onClick={handleRegisterDep} disabled={!fDepAsset}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo: mantenimiento */}
      <Dialog open={maintOpen} onOpenChange={setMaintOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar mantenimiento</DialogTitle>
            <DialogDescription>Preventivo, correctivo, inspección o reparación.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Activo *</Label>
              <Select value={fMntAsset} onValueChange={setFMntAsset}>
                <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                <SelectContent>
                  {assets.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fecha</Label>
                <Input type="date" value={fMntDate} onChange={(e) => setFMntDate(e.target.value)} />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={fMntType} onValueChange={(v) => setFMntType(v as MaintenanceRecord["type"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preventivo">Preventivo</SelectItem>
                    <SelectItem value="correctivo">Correctivo</SelectItem>
                    <SelectItem value="inspeccion">Inspección</SelectItem>
                    <SelectItem value="reparacion">Reparación</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Descripción *</Label>
              <Input value={fMntDesc} onChange={(e) => setFMntDesc(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Costo</Label>
                <Input value={fMntCost} onChange={(e) => setFMntCost(e.target.value)} inputMode="decimal" />
              </div>
              <div>
                <Label>Proveedor</Label>
                <Input value={fMntProvider} onChange={(e) => setFMntProvider(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Próximo mantenimiento</Label>
              <Input type="date" value={fMntNext} onChange={(e) => setFMntNext(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMaintOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddMaint} disabled={!fMntAsset || !fMntDesc.trim()}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo: baja/venta */}
      <Dialog open={dispOpen} onOpenChange={setDispOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar baja o venta</DialogTitle>
            <DialogDescription>Da de baja o vende un activo y calcula la ganancia/pérdida.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Activo *</Label>
              <Select value={fDispAsset} onValueChange={setFDispAsset}>
                <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                <SelectContent>
                  {assets.filter((a) => a.status === "activo" || a.status === "mantenimiento").map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fecha</Label>
                <Input type="date" value={fDispDate} onChange={(e) => setFDispDate(e.target.value)} />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={fDispType} onValueChange={(v) => setFDispType(v as AssetDisposal["type"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="venta">Venta</SelectItem>
                    <SelectItem value="baja">Baja</SelectItem>
                    <SelectItem value="donacion">Donación</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Valor de venta</Label>
              <Input value={fDispSale} onChange={(e) => setFDispSale(e.target.value)} inputMode="decimal" />
            </div>
            {fDispAsset && (() => {
              const a = assets.find((x) => x.id === fDispAsset);
              if (!a) return null;
              const val = calculateDepreciation(a);
              const gainLoss = (parseFloat(fDispSale) || 0) - val.bookValue;
              return (
                <div className="rounded-lg border p-3 space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Valor en libros</span><span>{MONEY(val.bookValue)}</span></div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Resultado</span>
                    <span className={`font-bold ${gainLoss < 0 ? "text-red-600" : "text-green-600"}`}>{MONEY(gainLoss)}</span>
                  </div>
                </div>
              );
            })()}
            <div>
              <Label>Notas</Label>
              <Textarea value={fDispNotes} onChange={(e) => setFDispNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDispOpen(false)}>Cancelar</Button>
            <Button onClick={handleRegisterDisposal} disabled={!fDispAsset}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo: detalle activo */}
      <Dialog open={!!detailAssetId} onOpenChange={(o) => !o && setDetailAssetId(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {detailAsset && (() => {
            const val = calculateDepreciation(detailAsset);
            const Icon = CATEGORY_ICON[detailAsset.category];
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Icon className="h-5 w-5" /> {detailAsset.name}
                  </DialogTitle>
                  <DialogDescription>
                    {CATEGORY_LABEL[detailAsset.category]} · {detailAsset.code}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border p-3">
                      <div className="text-xs text-muted-foreground">Costo de adquisición</div>
                      <div className="font-bold text-lg">{MONEY(detailAsset.acquisitionCost)}</div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-xs text-muted-foreground">Valor en libros</div>
                      <div className="font-bold text-lg">{MONEY(val.bookValue)}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg border p-3">
                      <div className="text-xs text-muted-foreground">Deprec. acumulada</div>
                      <div className="font-bold">{MONEY(val.accumulated)}</div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-xs text-muted-foreground">Cuota anual</div>
                      <div className="font-bold">{MONEY(val.annualDepreciation)}</div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-xs text-muted-foreground">Método</div>
                      <div className="font-bold text-sm">{METHOD_LABEL[detailAsset.depreciationMethod]}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Ubicación:</span> {detailAsset.location}</div>
                    <div><span className="text-muted-foreground">Responsable:</span> {detailAsset.responsible ?? "—"}</div>
                    <div><span className="text-muted-foreground">Adquisición:</span> {detailAsset.acquisitionDate}</div>
                    <div><span className="text-muted-foreground">Vida útil:</span> {detailAsset.usefulLifeYears} años</div>
                    {detailAsset.serialNumber && (
                      <div><span className="text-muted-foreground">N° serie:</span> {detailAsset.serialNumber}</div>
                    )}
                  </div>
                  {detailAsset.notes && (
                    <div className="rounded-lg border p-3">
                      <div className="text-xs text-muted-foreground mb-1">Notas</div>
                      <p className="text-sm">{detailAsset.notes}</p>
                    </div>
                  )}
                  {/* Historial de mantenimiento */}
                  {assetMaintenanceMap.has(detailAsset.id) && (
                    <div>
                      <Label>Historial de mantenimiento</Label>
                      <div className="rounded-lg border overflow-hidden mt-1">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Fecha</TableHead>
                              <TableHead>Tipo</TableHead>
                              <TableHead>Descripción</TableHead>
                              <TableHead className="text-right">Costo</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {assetMaintenanceMap.get(detailAsset.id)!.map((m) => (
                              <TableRow key={m.id}>
                                <TableCell>{m.date}</TableCell>
                                <TableCell>{MAINT_TYPE[m.type]}</TableCell>
                                <TableCell>{m.description}</TableCell>
                                <TableCell className="text-right">{MONEY(m.cost)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDetailAssetId(null)}>Cerrar</Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
