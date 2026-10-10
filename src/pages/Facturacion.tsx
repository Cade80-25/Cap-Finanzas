import { useMemo, useState } from "react";
import {
  FileText,
  Plus,
  TrendingUp,
  Clock,
  AlertCircle,
  Trash2,
  Eye,
  Settings,
  Receipt,
  FileX2,
  FilePlus2,
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
import { useFacturacion, InvoiceItem, InvoiceType, InvoiceStatus } from "@/hooks/useFacturacion";
import { useCuentasCorrientes } from "@/hooks/useCuentasCorrientes";

const MONEY = (n: number) =>
  `$${(Number.isFinite(n) ? n : 0).toLocaleString("es-UY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const TYPE_LABEL: Record<InvoiceType, string> = {
  factura: "Factura",
  "nota-credito": "Nota de Crédito",
  "nota-debito": "Nota de Débito",
};

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  pendiente: "Pendiente",
  pagada: "Pagada",
  anulada: "Anulada",
};

const STATUS_COLOR: Record<InvoiceStatus, string> = {
  pendiente: "bg-amber-100 text-amber-800",
  pagada: "bg-green-100 text-green-800",
  anulada: "bg-gray-100 text-gray-800",
};

interface ItemRow {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
  vatRate: string;
}

function emptyItem(): ItemRow {
  return {
    id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    description: "",
    quantity: "1",
    unitPrice: "",
    vatRate: "",
  };
}

export default function Facturacion() {
  const {
    invoices,
    vatConfig,
    updateVatConfig,
    createInvoice,
    updateInvoiceStatus,
    deleteInvoice,
    stats,
  } = useFacturacion();
  const { contacts } = useCuentasCorrientes();

  const [tab, setTab] = useState<string>("facturas");
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [configOpen, setConfigOpen] = useState(false);

  // Formulario
  const [formType, setFormType] = useState<InvoiceType>("factura");
  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formDue, setFormDue] = useState("");
  const [formContactId, setFormContactId] = useState("");
  const [formItems, setFormItems] = useState<ItemRow[]>([emptyItem()]);
  const [formNotes, setFormNotes] = useState("");
  const [formRelatedId, setFormRelatedId] = useState("");

  // Config IVA
  const [cfgDefaultRate, setCfgDefaultRate] = useState(String(vatConfig.defaultRate));
  const [cfgRates, setCfgRates] = useState(vatConfig.availableRates.join(", "));
  const [cfgInvPrefix, setCfgInvPrefix] = useState(vatConfig.invoicePrefix);
  const [cfgNCPrefix, setCfgNCPrefix] = useState(vatConfig.creditNotePrefix);
  const [cfgNDPrefix, setCfgNDPrefix] = useState(vatConfig.debitNotePrefix);
  const [cfgTaxName, setCfgTaxName] = useState(vatConfig.taxName);

  const facturas = useMemo(
    () => invoices.filter((i) => i.type === "factura"),
    [invoices]
  );
  const notasCredito = useMemo(
    () => invoices.filter((i) => i.type === "nota-credito"),
    [invoices]
  );
  const notasDebito = useMemo(
    () => invoices.filter((i) => i.type === "nota-debito"),
    [invoices]
  );

  const detailInvoice = useMemo(
    () => (detailId ? invoices.find((i) => i.id === detailId) ?? null : null),
    [detailId, invoices]
  );

  const facturasPendientes = useMemo(
    () => facturas.filter((f) => f.status === "pendiente"),
    [facturas]
  );

  // --- Helpers de formulario ---

  const updateItem = (id: string, patch: Partial<ItemRow>) => {
    setFormItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  const addItem = () => setFormItems((prev) => [...prev, emptyItem()]);

  const removeItem = (id: string) => {
    setFormItems((prev) => prev.filter((it) => it.id !== id));
  };

  const calcTotals = () => {
    let subtotal = 0;
    let vat = 0;
    for (const it of formItems) {
      const qty = parseFloat(it.quantity.replace(",", ".")) || 0;
      const price = parseFloat(it.unitPrice.replace(",", ".")) || 0;
      const rate = parseFloat(it.vatRate.replace(",", ".")) || 0;
      const line = qty * price;
      subtotal += line;
      vat += (line * rate) / 100;
    }
    return { subtotal: Math.round(subtotal * 100) / 100, vat: Math.round(vat * 100) / 100, total: Math.round((subtotal + vat) * 100) / 100 };
  };

  const handleCreate = () => {
    const items: Omit<InvoiceItem, "id">[] = formItems
      .filter((it) => it.description.trim() && parseFloat(it.unitPrice.replace(",", ".")) > 0)
      .map((it) => ({
        description: it.description.trim(),
        quantity: parseFloat(it.quantity.replace(",", ".")) || 1,
        unitPrice: parseFloat(it.unitPrice.replace(",", ".")) || 0,
        vatRate: parseFloat(it.vatRate.replace(",", ".")) || 0,
      }));

    if (!formContactId || items.length === 0) return;

    createInvoice({
      type: formType,
      date: formDate,
      dueDate: formDue || undefined,
      contactId: formContactId,
      items,
      notes: formNotes.trim() || undefined,
      relatedInvoiceId: formRelatedId || undefined,
    });

    // Reset
    setFormItems([emptyItem()]);
    setFormNotes("");
    setFormDue("");
    setFormContactId("");
    setFormRelatedId("");
    setCreateOpen(false);
  };

  const handleSaveConfig = () => {
    const rates = cfgRates
      .split(",")
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n) && n >= 0);
    updateVatConfig({
      defaultRate: parseFloat(cfgDefaultRate) || 0,
      availableRates: rates.length > 0 ? rates : [0],
      invoicePrefix: cfgInvPrefix.trim() || "FAC-",
      creditNotePrefix: cfgNCPrefix.trim() || "NC-",
      debitNotePrefix: cfgNDPrefix.trim() || "ND-",
      taxName: cfgTaxName.trim() || "IVA",
    });
    setConfigOpen(false);
  };

  const totals = calcTotals();

  // --- Render de tabla ---

  const renderTable = (list: typeof invoices, emptyText: string) => (
    <Card>
      <CardContent className="p-0">
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[220px] text-muted-foreground gap-3">
            <FileText className="h-10 w-10 opacity-40" />
            <p className="text-sm">{emptyText}</p>
            <Button
              variant="outline"
              onClick={() => {
                setFormType("factura");
                setCreateOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" /> Crear factura
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="hidden sm:table-cell">Contacto</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead className="text-right">{vatConfig.taxName}</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((inv) => (
                <TableRow key={inv.id} className="cursor-pointer">
                  <TableCell className="font-mono text-sm font-medium" onClick={() => setDetailId(inv.id)}>
                    {inv.number}
                  </TableCell>
                  <TableCell className="text-sm" onClick={() => setDetailId(inv.id)}>
                    {inv.date}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm" onClick={() => setDetailId(inv.id)}>
                    {inv.contactName || "—"}
                  </TableCell>
                  <TableCell className="text-right text-sm" onClick={() => setDetailId(inv.id)}>
                    {MONEY(inv.subtotal)}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground" onClick={() => setDetailId(inv.id)}>
                    {MONEY(inv.vatAmount)}
                  </TableCell>
                  <TableCell className="text-right font-bold" onClick={() => setDetailId(inv.id)}>
                    {MONEY(inv.total)}
                  </TableCell>
                  <TableCell onClick={() => setDetailId(inv.id)}>
                    <Badge className={`text-xs ${STATUS_COLOR[inv.status]}`}>
                      {STATUS_LABEL[inv.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setDetailId(inv.id)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      {inv.status === "pendiente" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateInvoiceStatus(inv.id, "pagada")}
                        >
                          Marcar pagada
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm(`¿Eliminar ${inv.number}?`)) deleteInvoice(inv.id);
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
            Facturación
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
            Facturas, notas de crédito/débito, {vatConfig.taxName} configurable
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setConfigOpen(true)}>
            <Settings className="h-4 w-4 mr-2" /> Configurar
          </Button>
          <Button className="shadow-soft" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Nueva factura
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total facturado</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{MONEY(stats.totalFacturado)}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.countTotal} documentos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendiente de cobro</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{MONEY(stats.totalPendiente)}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.countPendientes} facturas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{vatConfig.taxName} recaudado</CardTitle>
            <Receipt className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{MONEY(stats.totalIVA)}</div>
            <p className="text-xs text-muted-foreground mt-1">a declarar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tasa {vatConfig.taxName}</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vatConfig.defaultRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {vatConfig.availableRates.length} tasas disponibles
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="facturas" className="gap-1.5">
            <FileText className="h-4 w-4" /> Facturas ({facturas.length})
          </TabsTrigger>
          <TabsTrigger value="notas-credito" className="gap-1.5">
            <FileX2 className="h-4 w-4" /> Notas de Crédito ({notasCredito.length})
          </TabsTrigger>
          <TabsTrigger value="notas-debito" className="gap-1.5">
            <FilePlus2 className="h-4 w-4" /> Notas de Débito ({notasDebito.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="facturas" className="mt-4">
          {renderTable(
            facturas,
            "Aún no tienes facturas. Crea una para empezar a facturar."
          )}
        </TabsContent>

        <TabsContent value="notas-credito" className="mt-4">
          {renderTable(
            notasCredito,
            "Sin notas de crédito. Anulan o descuentan facturas."
          )}
        </TabsContent>

        <TabsContent value="notas-debito" className="mt-4">
          {renderTable(
            notasDebito,
            "Sin notas de débito. Aumentan el saldo de una factura."
          )}
        </TabsContent>
      </Tabs>

      {/* Diálogo: crear factura/nota */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {formType === "factura"
                ? "Nueva factura"
                : formType === "nota-credito"
                ? "Nota de crédito"
                : "Nota de débito"}
            </DialogTitle>
            <DialogDescription>
              {formType === "factura"
                ? "Facturar a un cliente. Se registra en Cuentas Corrientes."
                : formType === "nota-credito"
                ? "Anular o descontar una factura existente."
                : "Aumentar el saldo de una factura."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Tipo */}
            <div>
              <Label>Tipo de documento</Label>
              <Select
                value={formType}
                onValueChange={(v) => setFormType(v as InvoiceType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="factura">Factura</SelectItem>
                  <SelectItem value="nota-credito">Nota de Crédito</SelectItem>
                  <SelectItem value="nota-debito">Nota de Débito</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Contacto */}
            <div>
              <Label>Contacto *</Label>
              <Select value={formContactId} onValueChange={setFormContactId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un contacto" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.length === 0 && (
                    <SelectItem value="__none" disabled>
                      Sin contactos — crea uno en Cuentas Corrientes
                    </SelectItem>
                  )}
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({c.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Factura relacionada (para notas) */}
            {formType !== "factura" && (
              <div>
                <Label>Factura relacionada</Label>
                <Select value={formRelatedId} onValueChange={setFormRelatedId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona la factura a modificar" />
                  </SelectTrigger>
                  <SelectContent>
                    {facturasPendientes.length === 0 && (
                      <SelectItem value="__none" disabled>
                        Sin facturas pendientes
                      </SelectItem>
                    )}
                    {facturasPendientes.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.number} — {MONEY(f.total)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Fechas */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fecha *</Label>
                <Input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Vencimiento</Label>
                <Input
                  type="date"
                  value={formDue}
                  onChange={(e) => setFormDue(e.target.value)}
                />
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Ítems *</Label>
                <Button size="sm" variant="outline" onClick={addItem}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Agregar ítem
                </Button>
              </div>

              <div className="rounded-lg border overflow-hidden">
                <div className="grid grid-cols-12 gap-2 p-2 bg-muted/50 text-xs font-medium">
                  <div className="col-span-5">Descripción</div>
                  <div className="col-span-2">Cant.</div>
                  <div className="col-span-2">Precio</div>
                  <div className="col-span-2">{vatConfig.taxName} %</div>
                  <div className="col-span-1"></div>
                </div>
                {formItems.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 p-2 border-t">
                    <div className="col-span-5">
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(item.id, { description: e.target.value })}
                        placeholder="Descripción"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, { quantity: e.target.value })}
                        inputMode="decimal"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, { unitPrice: e.target.value })}
                        inputMode="decimal"
                        placeholder="0.00"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <Select
                        value={item.vatRate}
                        onValueChange={(v) => updateItem(item.id, { vatRate: v })}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder={String(vatConfig.defaultRate)} />
                        </SelectTrigger>
                        <SelectContent>
                          {vatConfig.availableRates.map((r) => (
                            <SelectItem key={r} value={String(r)}>
                              {r}%
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-1 flex items-center">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => removeItem(item.id)}
                        disabled={formItems.length === 1}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totales */}
            <div className="rounded-lg border p-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{MONEY(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{vatConfig.taxName}</span>
                <span>{MONEY(totals.vat)}</span>
              </div>
              <div className="flex justify-between font-bold pt-1 border-t">
                <span>Total</span>
                <span className="text-lg">{MONEY(totals.total)}</span>
              </div>
            </div>

            {/* Notas */}
            <div>
              <Label>Notas</Label>
              <Textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={2}
                placeholder="Notas internas o para el cliente"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formContactId || formItems.filter((i) => i.description.trim()).length === 0}
            >
              Crear {TYPE_LABEL[formType].toLowerCase()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo: detalle */}
      <Dialog open={!!detailId} onOpenChange={(o) => !o && setDetailId(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {detailInvoice && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {detailInvoice.number}
                </DialogTitle>
                <DialogDescription>
                  {TYPE_LABEL[detailInvoice.type]} · {detailInvoice.date}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">Contacto</div>
                    <div className="font-medium">{detailInvoice.contactName || "—"}</div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">Estado</div>
                    <Badge className={`mt-1 ${STATUS_COLOR[detailInvoice.status]}`}>
                      {STATUS_LABEL[detailInvoice.status]}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label>Ítems</Label>
                  <div className="rounded-lg border overflow-hidden mt-1">
                    <div className="grid grid-cols-12 gap-2 p-2 bg-muted/50 text-xs font-medium">
                      <div className="col-span-5">Descripción</div>
                      <div className="col-span-2 text-right">Cant.</div>
                      <div className="col-span-2 text-right">Precio</div>
                      <div className="col-span-3 text-right">Total</div>
                    </div>
                    {detailInvoice.items.map((item) => {
                      const lineTotal = item.quantity * item.unitPrice;
                      const lineVat = (lineTotal * item.vatRate) / 100;
                      return (
                        <div key={item.id} className="grid grid-cols-12 gap-2 p-2 border-t text-sm">
                          <div className="col-span-5">{item.description}</div>
                          <div className="col-span-2 text-right">{item.quantity}</div>
                          <div className="col-span-2 text-right">{MONEY(item.unitPrice)}</div>
                          <div className="col-span-3 text-right">
                            {MONEY(lineTotal + lineVat)}
                            <span className="block text-xs text-muted-foreground">
                              +{item.vatRate}% {vatConfig.taxName}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-lg border p-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{MONEY(detailInvoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{vatConfig.taxName}</span>
                    <span>{MONEY(detailInvoice.vatAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-1 border-t">
                    <span>Total</span>
                    <span className="text-lg">{MONEY(detailInvoice.total)}</span>
                  </div>
                </div>

                {detailInvoice.notes && (
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground mb-1">Notas</div>
                    <p className="text-sm">{detailInvoice.notes}</p>
                  </div>
                )}

                {detailInvoice.dueDate && (
                  <div className="text-sm text-muted-foreground">
                    Vencimiento: {detailInvoice.dueDate}
                  </div>
                )}
              </div>

              <DialogFooter>
                {detailInvoice.status === "pendiente" && (
                  <Button
                    onClick={() => {
                      updateInvoiceStatus(detailInvoice.id, "pagada");
                      setDetailId(null);
                    }}
                  >
                    Marcar como pagada
                  </Button>
                )}
                <Button variant="outline" onClick={() => setDetailId(null)}>
                  Cerrar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo: configuración IVA */}
      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configurar {vatConfig.taxName}</DialogTitle>
            <DialogDescription>
              Tasas de impuesto, numeración y nombre del impuesto.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label>Nombre del impuesto</Label>
              <Input value={cfgTaxName} onChange={(e) => setCfgTaxName(e.target.value)} />
            </div>
            <div>
              <Label>Tasa por defecto (%)</Label>
              <Input
                value={cfgDefaultRate}
                onChange={(e) => setCfgDefaultRate(e.target.value)}
                inputMode="decimal"
              />
            </div>
            <div>
              <Label>Tasas disponibles (separadas por coma)</Label>
              <Input
                value={cfgRates}
                onChange={(e) => setCfgRates(e.target.value)}
                placeholder="0, 5, 10, 22"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Ej: 0, 5, 10, 22 para IVA Uruguay
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Prefijo factura</Label>
                <Input value={cfgInvPrefix} onChange={(e) => setCfgInvPrefix(e.target.value)} />
              </div>
              <div>
                <Label>Prefijo NC</Label>
                <Input value={cfgNCPrefix} onChange={(e) => setCfgNCPrefix(e.target.value)} />
              </div>
              <div>
                <Label>Prefijo ND</Label>
                <Input value={cfgNDPrefix} onChange={(e) => setCfgNDPrefix(e.target.value)} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveConfig}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
