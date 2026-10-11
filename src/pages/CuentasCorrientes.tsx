import { useMemo, useState } from "react";
import {
  Users,
  Truck,
  Plus,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowLeft,
  Trash2,
  FileText,
  DollarSign,
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
import { useCuentasCorrientes, ContactType, CCMovementKind, AgingBuckets } from "@/hooks/useCuentasCorrientes";
import { useModuleIntegration } from "@/hooks/useModuleIntegration";
import { CheckCircle2 } from "lucide-react";

const MONEY = (n: number) =>
  `$${(Number.isFinite(n) ? n : 0).toLocaleString("es-UY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const KIND_LABEL: Record<CCMovementKind, string> = {
  factura: "Factura",
  "nota-debito": "Nota de débito",
  "nota-credito": "Nota de crédito",
  cobro: "Cobro",
  pago: "Pago",
};

const KIND_KINDS_BY_TYPE: Record<ContactType, CCMovementKind[]> = {
  cliente: ["factura", "nota-debito", "nota-credito", "cobro"],
  proveedor: ["factura", "nota-debito", "nota-credito", "pago"],
};

function AgingTable({ title, aging }: { title: string; aging: AgingBuckets }) {
  const cols: Array<[string, number, string]> = [
    ["Corriente", aging.corriente, "text-muted-foreground"],
    ["1-30 días", aging.d1_30, "text-amber-500"],
    ["31-60 días", aging.d31_60, "text-orange-500"],
    ["61-90 días", aging.d61_90, "text-orange-600"],
    ["+90 días", aging.d90mas, "text-destructive"],
  ];
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {cols.map(([label, value, color]) => (
            <div key={label} className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">{label}</div>
              <div className={`text-sm font-bold mt-1 ${color}`}>{MONEY(value)}</div>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center mt-4 pt-3 border-t">
          <span className="text-sm font-medium">Total</span>
          <span className="text-lg font-bold">{MONEY(aging.total)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CuentasCorrientes() {
  const {
    contacts,
    addContact,
    deleteContact,
    addMovement,
    balances,
    stats,
    movements,
  } = useCuentasCorrientes();
  const { postCollection, postPayment, isPosted } = useModuleIntegration();

  const [tab, setTab] = useState<"clientes" | "proveedores" | "antiguedad">("clientes");
  const [contactOpen, setContactOpen] = useState(false);
  const [movementOpen, setMovementOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  // Alta de contacto
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<ContactType>("cliente");
  const [newTaxId, setNewTaxId] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newNotes, setNewNotes] = useState("");

  // Alta de movimiento
  const [mvContactId, setMvContactId] = useState("");
  const [mvKind, setMvKind] = useState<CCMovementKind>("factura");
  const [mvDate, setMvDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [mvDue, setMvDue] = useState("");
  const [mvAmount, setMvAmount] = useState("");
  const [mvDesc, setMvDesc] = useState("");

  const clientes = useMemo(
    () => balances.filter((b) => b.contact.type === "cliente"),
    [balances]
  );
  const proveedores = useMemo(
    () => balances.filter((b) => b.contact.type === "proveedor"),
    [balances]
  );

  const detailBalance = useMemo(
    () => (detailId ? balances.find((b) => b.contact.id === detailId) ?? null : null),
    [detailId, balances]
  );

  const detailMovements = useMemo(
    () =>
      detailId
        ? movements
            .filter((m) => m.contactId === detailId)
            .sort((a, b) => b.date.localeCompare(a.date))
        : [],
    [detailId, movements]
  );

  const handleCreateContact = () => {
    if (!newName.trim()) return;
    addContact({
      name: newName.trim(),
      type: newType,
      taxId: newTaxId.trim() || undefined,
      phone: newPhone.trim() || undefined,
      email: newEmail.trim() || undefined,
      notes: newNotes.trim() || undefined,
    });
    setNewName("");
    setNewTaxId("");
    setNewPhone("");
    setNewEmail("");
    setNewNotes("");
    setContactOpen(false);
  };

  const handleCreateMovement = () => {
    const amount = parseFloat(mvAmount.replace(",", "."));
    if (!mvContactId || !Number.isFinite(amount) || amount <= 0) return;
    const contact = contacts.find((c) => c.id === mvContactId);
    const contactName = contact?.name || "Contacto";
    const movement = addMovement({
      contactId: mvContactId,
      date: mvDate,
      dueDate: mvDue || undefined,
      kind: mvKind,
      amount,
      description: mvDesc.trim() || KIND_LABEL[mvKind],
    });
    // Generar asiento contable automático para cobros y pagos
    if (mvKind === "cobro") {
      postCollection(`ccm:${movement.id}`, contactName, amount, mvDate);
    } else if (mvKind === "pago") {
      postPayment(`ccm:${movement.id}`, contactName, amount, mvDate);
    }
    setMvAmount("");
    setMvDesc("");
    setMvDue("");
    setMovementOpen(false);
  };

  const openMovementFor = (contactId: string, type: ContactType) => {
    setMvContactId(contactId);
    setMvKind(KIND_KINDS_BY_TYPE[type][0]);
    setMovementOpen(true);
  };

  const selectedContactType =
    contacts.find((c) => c.id === mvContactId)?.type ?? "cliente";

  const renderList = (list: typeof balances, emptyText: string) => (
    <Card>
      <CardContent className="p-0">
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[220px] text-muted-foreground gap-3">
            <Users className="h-10 w-10 opacity-40" />
            <p className="text-sm">{emptyText}</p>
            <Button variant="outline" onClick={() => setContactOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Agregar contacto
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Vencido</TableHead>
                <TableHead className="text-right hidden md:table-cell">Movs.</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((b) => (
                <TableRow key={b.contact.id} className="cursor-pointer">
                  <TableCell
                    className="font-medium"
                    onClick={() => setDetailId(b.contact.id)}
                  >
                    {b.contact.name}
                    {b.contact.taxId && (
                      <span className="block text-xs text-muted-foreground">
                        {b.contact.taxId}
                      </span>
                    )}
                  </TableCell>
                  <TableCell
                    className={`text-right font-bold ${
                      b.saldo > 0 ? "text-destructive" : b.saldo < 0 ? "text-success" : ""
                    }`}
                    onClick={() => setDetailId(b.contact.id)}
                  >
                    {MONEY(b.saldo)}
                  </TableCell>
                  <TableCell
                    className="text-right hidden sm:table-cell"
                    onClick={() => setDetailId(b.contact.id)}
                  >
                    {b.vencido > 0 ? (
                      <Badge variant="destructive" className="text-xs">
                        {MONEY(b.vencido)}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell
                    className="text-right hidden md:table-cell text-muted-foreground"
                    onClick={() => setDetailId(b.contact.id)}
                  >
                    {b.movimientos}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openMovementFor(b.contact.id, b.contact.type)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (
                            confirm(
                              `¿Eliminar a "${b.contact.name}" y todos sus movimientos?`
                            )
                          )
                            deleteContact(b.contact.id);
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
            Cuentas Corrientes
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
            Deudores y acreedores con antigüedad de saldos 30/60/90
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setMovementOpen(true)}>
            <DollarSign className="h-4 w-4 mr-2" /> Registrar movimiento
          </Button>
          <Button className="shadow-soft" onClick={() => setContactOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Nuevo contacto
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Por cobrar</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {MONEY(stats.totalPorCobrar)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.clientesConSaldo} clientes con saldo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Por pagar</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {MONEY(stats.totalPorPagar)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.proveedoresConSaldo} proveedores con saldo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cartera vencida</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {MONEY(
                stats.agingCobrar.d1_30 +
                  stats.agingCobrar.d31_60 +
                  stats.agingCobrar.d61_90 +
                  stats.agingCobrar.d90mas
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">a cobrar vencido</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Posición neta</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                stats.totalPorCobrar - stats.totalPorPagar >= 0
                  ? "text-success"
                  : "text-destructive"
              }`}
            >
              {MONEY(stats.totalPorCobrar - stats.totalPorPagar)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">cobrar − pagar</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="clientes" className="gap-1.5">
            <Users className="h-4 w-4" /> Clientes
          </TabsTrigger>
          <TabsTrigger value="proveedores" className="gap-1.5">
            <Truck className="h-4 w-4" /> Proveedores
          </TabsTrigger>
          <TabsTrigger value="antiguedad" className="gap-1.5">
            <AlertTriangle className="h-4 w-4" /> Antigüedad
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clientes" className="mt-4">
          {renderList(
            clientes,
            "Aún no tienes clientes. Agrega uno para controlar quién te debe."
          )}
        </TabsContent>

        <TabsContent value="proveedores" className="mt-4">
          {renderList(
            proveedores,
            "Aún no tienes proveedores. Agrega uno para controlar a quién le debes."
          )}
        </TabsContent>

        <TabsContent value="antiguedad" className="mt-4 space-y-4">
          <AgingTable title="Antigüedad de cartera (por cobrar)" aging={stats.agingCobrar} />
          <AgingTable title="Antigüedad de deuda (por pagar)" aging={stats.agingPagar} />
        </TabsContent>
      </Tabs>

      {/* Alta de contacto */}
      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo contacto</DialogTitle>
            <DialogDescription>
              Registra un cliente (deudor) o proveedor (acreedor).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Tipo</Label>
              <Select value={newType} onValueChange={(v) => setNewType(v as ContactType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cliente">Cliente (me debe)</SelectItem>
                  <SelectItem value="proveedor">Proveedor (le debo)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nombre *</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nombre o razón social"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>RUT / NIF / CUIT</Label>
                <Input value={newTaxId} onChange={(e) => setNewTaxId(e.target.value)} />
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            <div>
              <Label>Notas</Label>
              <Textarea
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContactOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateContact} disabled={!newName.trim()}>
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alta de movimiento */}
      <Dialog open={movementOpen} onOpenChange={setMovementOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar movimiento</DialogTitle>
            <DialogDescription>
              Factura, nota o cobro/pago que afecta la cuenta corriente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Contacto *</Label>
              <Select value={mvContactId} onValueChange={setMvContactId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un contacto" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.length === 0 && (
                    <SelectItem value="__none" disabled>
                      Sin contactos — crea uno primero
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
            <div>
              <Label>Tipo de movimiento</Label>
              <Select value={mvKind} onValueChange={(v) => setMvKind(v as CCMovementKind)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KIND_KINDS_BY_TYPE[selectedContactType].map((k) => (
                    <SelectItem key={k} value={k}>
                      {KIND_LABEL[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fecha *</Label>
                <Input type="date" value={mvDate} onChange={(e) => setMvDate(e.target.value)} />
              </div>
              <div>
                <Label>Vencimiento</Label>
                <Input type="date" value={mvDue} onChange={(e) => setMvDue(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Importe *</Label>
              <Input
                inputMode="decimal"
                value={mvAmount}
                onChange={(e) => setMvAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label>Descripción</Label>
              <Input
                value={mvDesc}
                onChange={(e) => setMvDesc(e.target.value)}
                placeholder="Ej: Factura A-0001"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMovementOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateMovement}
              disabled={!mvContactId || !(parseFloat(mvAmount.replace(",", ".")) > 0)}
            >
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detalle de contacto */}
      <Dialog open={!!detailId} onOpenChange={(o) => !o && setDetailId(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {detailBalance && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {detailBalance.contact.type === "cliente" ? (
                    <Users className="h-5 w-5" />
                  ) : (
                    <Truck className="h-5 w-5" />
                  )}
                  {detailBalance.contact.name}
                </DialogTitle>
                <DialogDescription>
                  {detailBalance.contact.type === "cliente" ? "Cliente" : "Proveedor"}
                  {detailBalance.contact.taxId ? ` · ${detailBalance.contact.taxId}` : ""}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Saldo</div>
                  <div
                    className={`text-lg font-bold ${
                      detailBalance.saldo > 0
                        ? "text-destructive"
                        : detailBalance.saldo < 0
                        ? "text-success"
                        : ""
                    }`}
                  >
                    {MONEY(detailBalance.saldo)}
                  </div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Vencido</div>
                  <div className="text-lg font-bold text-orange-500">
                    {MONEY(detailBalance.vencido)}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-sm">Movimientos</h3>
                <Button
                  size="sm"
                  onClick={() =>
                    openMovementFor(detailBalance.contact.id, detailBalance.contact.type)
                  }
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Agregar
                </Button>
              </div>

              {detailMovements.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Sin movimientos todavía.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="hidden sm:table-cell">Detalle</TableHead>
                      <TableHead className="text-right">Importe</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailMovements.map((m) => {
                      const isIncrease = m.kind === "factura" || m.kind === "nota-debito";
                      return (
                        <TableRow key={m.id}>
                          <TableCell className="text-sm">{m.date}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1 items-start">
                              <Badge variant={isIncrease ? "destructive" : "secondary"} className="text-xs">
                                {KIND_LABEL[m.kind]}
                              </Badge>
                              {(m.kind === "cobro" && isPosted(`collection:ccm:${m.id}`)) ||
                              (m.kind === "pago" && isPosted(`payment:ccm:${m.id}`)) ? (
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                  <CheckCircle2 className="h-3 w-3 mr-1" /> Contabilizado
                                </Badge>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                            {m.description}
                          </TableCell>
                          <TableCell
                            className={`text-right font-medium ${
                              isIncrease ? "text-destructive" : "text-success"
                            }`}
                          >
                            {isIncrease ? "+" : "−"}
                            {MONEY(m.amount)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => deleteMovement(m.id)}
                              title="Eliminar movimiento"
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
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
