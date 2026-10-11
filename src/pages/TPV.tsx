import { useMemo, useState } from "react";
import { Plus, Trash2, Eye, ShoppingCart, DollarSign, CreditCard, Banknote, QrCode, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useTPV, TPVStatus, TPVPayment } from "@/hooks/useTPV";
import { useInventario } from "@/hooks/useInventario";
import { useModuleIntegration } from "@/hooks/useModuleIntegration";

const money = (n: number) => `$${n.toLocaleString("es-UY", { minimumFractionDigits: 2 })}`;
const round2 = (n: number) => Math.round(n * 100) / 100;
const statusLabel: Record<TPVStatus, string> = { abierta: "Abierta", cerrada: "Cerrada", anulada: "Anulada" };
const statusColor: Record<TPVStatus, string> = { abierta: "bg-green-100 text-green-800", cerrada: "bg-blue-100 text-blue-800", anulada: "bg-gray-100 text-gray-800" };
const paymentLabel: Record<TPVPayment, string> = { efectivo: "Efectivo", tarjeta: "Tarjeta", transferencia: "Transferencia", qr: "QR" };
const paymentIcon: Record<TPVPayment, typeof Banknote> = { efectivo: Banknote, tarjeta: CreditCard, transferencia: DollarSign, qr: QrCode };

export default function TPV() {
  const { transactions, addTransaction, updateTransaction, deleteTransaction, stats, byPayment } = useTPV();
  const { postSale, postCostOfSales, isPosted } = useModuleIntegration();
  const { items: invItems, addMovement: addStockMovement } = useInventario();
  const [tab, setTab] = useState("ventas");
  const [tpvOpen, setTpvOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const [fItems, setFItems] = useState([{ name: "", qty: 1, price: 0 }]);
  const [fPayment, setFPayment] = useState<TPVPayment>("efectivo"); const [fCashier, setFCashier] = useState(""); const [fNotes, setFNotes] = useState("");

  const detail = useMemo(() => detailId ? transactions.find(t => t.id === detailId) ?? null : null, [detailId, transactions]);

  const subtotal = fItems.reduce((s, i) => s + i.qty * i.price, 0);
  const tax = subtotal * 0.22;
  const total = subtotal + tax;

  const saveTpv = () => {
    const items = fItems.filter(i => i.name && i.qty > 0 && i.price > 0);
    if (items.length === 0) return;
    const tx = addTransaction({ date: new Date().toISOString().slice(0, 10), items, subtotal, tax, total, payment: fPayment, status: "cerrada", cashier: fCashier || undefined, notes: fNotes || undefined });
    // Asiento contable automático: Debe Caja/Banco / Haber Ingresos + IVA
    postSale({ saleId: tx.id, subtotal: round2(subtotal), tax: round2(tax), total: round2(total), payment: fPayment });
    // Cierre de ciclo: descuento stock + asiento de costo de ventas por cada item vendido
    for (const line of items) {
      const inv = invItems.find(i => i.name.toLowerCase() === line.name.toLowerCase());
      if (inv && inv.quantity >= line.qty) {
        const mv = addStockMovement({ itemId: inv.id, date: tx.date, type: "salida", quantity: line.qty, unitCost: inv.unitCost, reference: tx.id, notes: `Venta TPV ${tx.id}` });
        if (mv) {
          postCostOfSales(`Venta TPV ${tx.id}`, line.name, round2(mv.quantity * mv.unitCost), tx.date, mv.id);
        }
      }
    }
    setFItems([{ name: "", qty: 1, price: 0 }]); setFCashier(""); setFNotes(""); setTpvOpen(false);
  };

  const addItem = () => setFItems(v => [...v, { name: "", qty: 1, price: 0 }]);
  const removeItem = (idx: number) => setFItems(v => v.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: string, value: string | number) => setFItems(v => v.map((item, i) => i === idx ? { ...item, [field]: value } : item));

  return <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 animate-fade-in">
    <div><h1 className="text-2xl sm:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">Punto de Venta (TPV)</h1><p className="text-sm text-muted-foreground mt-1">Ventas diarias, cierre de caja, métodos de pago</p></div>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Ventas hoy</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-500">{money(stats.todaySales)}</div></CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total ventas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{money(stats.totalSales)}</div></CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">IVA recaudado</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{money(stats.totalTax)}</div></CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Transacciones</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.count}</div></CardContent></Card>
    </div>
    <Tabs value={tab} onValueChange={setTab}><TabsList><TabsTrigger value="ventas"><ShoppingCart className="h-4 w-4 mr-1.5"/>Ventas ({transactions.length})</TabsTrigger><TabsTrigger value="pagos"><CreditCard className="h-4 w-4 mr-1.5"/>Por pago</TabsTrigger></TabsList>
      <TabsContent value="ventas" className="mt-4"><div className="mb-3"><Button onClick={() => setTpvOpen(true)}><Plus className="h-4 w-4 mr-2"/>Venta</Button></div><Card><CardContent className="p-0">{transactions.length === 0 ? <div className="py-16 text-center text-muted-foreground">Sin ventas</div> : <Table><TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Items</TableHead><TableHead>Pago</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Total</TableHead><TableHead></TableHead></TableRow></TableHeader><TableBody>{transactions.slice().reverse().map(t => <TableRow key={t.id} className="cursor-pointer" onClick={() => setDetailId(t.id)}><TableCell>{t.date}</TableCell><TableCell>{t.items.length} items</TableCell><TableCell>{paymentLabel[t.payment]}</TableCell><TableCell><Badge className={statusColor[t.status]}>{statusLabel[t.status]}</Badge>{isPosted(`sale:${t.id}`) && <Badge variant="outline" className="ml-1 text-xs bg-green-50 text-green-700 border-green-200"><CheckCircle2 className="h-3 w-3 mr-1" />Contab.</Badge>}</TableCell><TableCell className="text-right font-bold">{money(t.total)}</TableCell><TableCell><div className="flex gap-1"><Button size="sm" variant="ghost" onClick={() => setDetailId(t.id)}><Eye className="h-3.5 w-3.5"/></Button><Button size="sm" variant="ghost" onClick={() => deleteTransaction(t.id)}><Trash2 className="h-3.5 w-3.5 text-destructive"/></Button></div></TableCell></TableRow>)}</TableBody></Table>}</CardContent></Card></TabsContent>
      <TabsContent value="pagos" className="mt-4"><Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Método</TableHead><TableHead className="text-right">Cantidad</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader><TableBody>{Array.from(byPayment.entries()).map(([payment, s]) => { const Icon = paymentIcon[payment as TPVPayment] || Banknote; return <TableRow key={payment}><TableCell><div className="flex items-center gap-2"><Icon className="h-4 w-4"/>{paymentLabel[payment as TPVPayment]}</div></TableCell><TableCell className="text-right">{s.count}</TableCell><TableCell className="text-right font-bold">{money(s.total)}</TableCell></TableRow>; })}</TableBody></Table></CardContent></Card></TabsContent>
    </Tabs>
    <Dialog open={tpvOpen} onOpenChange={setTpvOpen}><DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Nueva venta</DialogTitle><DialogDescription>Venta con items y método de pago.</DialogDescription></DialogHeader><div className="space-y-3">
      {fItems.map((item, idx) => <div key={idx} className="flex gap-2 items-end"><div className="flex-1"><Label>Producto</Label><Input value={item.name} onChange={e => updateItem(idx, "name", e.target.value)}/></div><div className="w-20"><Label>Cant.</Label><Input type="number" min="1" value={item.qty} onChange={e => updateItem(idx, "qty", Number(e.target.value))}/></div><div className="w-28"><Label>Precio</Label><Input type="number" min="0" value={item.price} onChange={e => updateItem(idx, "price", Number(e.target.value))}/></div><Button size="sm" variant="ghost" onClick={() => removeItem(idx)}><Trash2 className="h-4 w-4 text-destructive"/></Button></div>)}
      <Button size="sm" variant="outline" onClick={addItem}><Plus className="h-4 w-4 mr-2"/>Agregar item</Button>
      <div className="grid grid-cols-2 gap-3"><div><Label>Método de pago</Label><Select value={fPayment} onValueChange={v => setFPayment(v as TPVPayment)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="efectivo">Efectivo</SelectItem><SelectItem value="tarjeta">Tarjeta</SelectItem><SelectItem value="transferencia">Transferencia</SelectItem><SelectItem value="qr">QR</SelectItem></SelectContent></Select></div><div><Label>Cajero</Label><Input value={fCashier} onChange={e => setFCashier(e.target.value)}/></div></div>
      <div className="rounded-lg border p-3 space-y-1"><div className="flex justify-between text-sm"><span>Subtotal</span><span>{money(subtotal)}</span></div><div className="flex justify-between text-sm"><span>IVA (22%)</span><span>{money(tax)}</span></div><div className="flex justify-between font-bold"><span>Total</span><span>{money(total)}</span></div></div>
    </div><DialogFooter><Button variant="outline" onClick={() => setTpvOpen(false)}>Cancelar</Button><Button onClick={saveTpv} disabled={fItems.filter(i => i.name && i.qty > 0 && i.price > 0).length === 0}>Registrar venta</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={!!detailId} onOpenChange={(o) => !o && setDetailId(null)}><DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">{detail && <><DialogHeader><DialogTitle>Venta {detail.date}</DialogTitle><DialogDescription>{paymentLabel[detail.payment]}</DialogDescription></DialogHeader><div className="space-y-4"><Table><TableHeader><TableRow><TableHead>Producto</TableHead><TableHead className="text-right">Cant.</TableHead><TableHead className="text-right">Precio</TableHead><TableHead className="text-right">Subtotal</TableHead></TableRow></TableHeader><TableBody>{detail.items.map((item, idx) => <TableRow key={idx}><TableCell>{item.name}</TableCell><TableCell className="text-right">{item.qty}</TableCell><TableCell className="text-right">{money(item.price)}</TableCell><TableCell className="text-right font-bold">{money(item.qty * item.price)}</TableCell></TableRow>)}<TableRow><TableCell colSpan={3} className="text-right font-bold">Total</TableCell><TableCell className="text-right font-bold">{money(detail.total)}</TableCell></TableRow></TableBody></Table></div><DialogFooter><Button variant="outline" onClick={() => setDetailId(null)}>Cerrar</Button></DialogFooter></>}</DialogContent></Dialog>
  </div>;
}
