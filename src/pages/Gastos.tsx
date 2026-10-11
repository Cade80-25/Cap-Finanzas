import { useMemo, useState } from "react";
import { Plus, Trash2, Eye, CheckCircle, XCircle, DollarSign, Users, PieChart } from "lucide-react";
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
import { useGastos, ExpenseStatus, ExpenseCategory } from "@/hooks/useGastos";
import { useModuleIntegration } from "@/hooks/useModuleIntegration";

const money = (n: number) => `$${n.toLocaleString("es-UY", { minimumFractionDigits: 2 })}`;
const catLabel: Record<ExpenseCategory, string> = { viaticos: "Viáticos", materiales: "Materiales", servicios: "Servicios", viajes: "Viajes", alojamiento: "Alojamiento", comidas: "Comidas", combustible: "Combustible", mantenimiento: "Mantenimiento", oficina: "Oficina", otro: "Otro" };
const statusLabel: Record<ExpenseStatus, string> = { pendiente: "Pendiente", aprobado: "Aprobado", rechazado: "Rechazado", reembolsado: "Reembolsado", contabilizado: "Contabilizado" };
const statusColor: Record<ExpenseStatus, string> = { pendiente: "bg-amber-100 text-amber-800", aprobado: "bg-green-100 text-green-800", rechazado: "bg-red-100 text-red-800", reembolsado: "bg-blue-100 text-blue-800", contabilizado: "bg-purple-100 text-purple-800" };

export default function Gastos() {
  const { expenses, addExpense, updateExpense, deleteExpense, approveExpense, rejectExpense, stats, byCategory, byEmployee } = useGastos();
  const { postExpenseApproval, postExpenseReimbursement, isPosted } = useModuleIntegration();

  // Aprobación contable: Debe Gastos / Haber Cuentas por Pagar
  const handleApprove = (e: (typeof expenses)[number]) => {
    approveExpense(e.id, "auto");
    if (!isPosted(`expappr:${e.id}`)) {
      postExpenseApproval(e.id, e.employee, e.description, e.amount, e.date);
    }
  };

  // Reembolso: Debe Cuentas por Pagar / Haber Caja
  const handleReimburse = (e: (typeof expenses)[number]) => {
    updateExpense(e.id, { status: "reembolsado" });
    if (!isPosted(`expreimb:${e.id}`)) {
      postExpenseReimbursement(e.id, e.employee, e.description, e.amount, e.date);
    }
  };
  const [tab, setTab] = useState("gastos");
  const [expOpen, setExpOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const [fDate, setFDate] = useState(new Date().toISOString().slice(0, 10)); const [fDesc, setFDesc] = useState("");
  const [fCat, setFCat] = useState<ExpenseCategory>("viaticos"); const [fAmount, setFAmount] = useState("");
  const [fEmployee, setFEmployee] = useState(""); const [fProject, setFProject] = useState(""); const [fNotes, setFNotes] = useState("");

  const detail = useMemo(() => detailId ? expenses.find(e => e.id === detailId) ?? null : null, [detailId, expenses]);

  const saveExp = () => { if (!fDesc || !fAmount || !fEmployee) return; addExpense({ date: fDate, description: fDesc, category: fCat, amount: Number(fAmount), currency: "UYU", employee: fEmployee, project: fProject || undefined, status: "pendiente", notes: fNotes.trim() || undefined }); setFDesc(""); setFAmount(""); setFEmployee(""); setFProject(""); setFNotes(""); setExpOpen(false); };

  return <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 animate-fade-in">
    <div><h1 className="text-2xl sm:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">Gastos</h1><p className="text-sm text-muted-foreground mt-1">Reportes, aprobaciones, reembolsos y políticas</p></div>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{money(stats.total)}</div></CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Pendiente</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-amber-500">{money(stats.pending)}</div></CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Aprobado</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-500">{money(stats.approved)}</div></CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Reembolsado</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-blue-500">{money(stats.reimbursed)}</div></CardContent></Card>
    </div>
    <Tabs value={tab} onValueChange={setTab}><TabsList><TabsTrigger value="gastos"><DollarSign className="h-4 w-4 mr-1.5"/>Gastos ({expenses.length})</TabsTrigger><TabsTrigger value="empleados"><Users className="h-4 w-4 mr-1.5"/>Por empleado</TabsTrigger><TabsTrigger value="categorias"><PieChart className="h-4 w-4 mr-1.5"/>Por categoría</TabsTrigger></TabsList>
      <TabsContent value="gastos" className="mt-4"><div className="mb-3"><Button onClick={() => setExpOpen(true)}><Plus className="h-4 w-4 mr-2"/>Gasto</Button></div><Card><CardContent className="p-0">{expenses.length === 0 ? <div className="py-16 text-center text-muted-foreground">Sin gastos</div> : <Table><TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Descripción</TableHead><TableHead className="hidden sm:table-cell">Empleado</TableHead><TableHead className="text-right">Monto</TableHead><TableHead>Estado</TableHead><TableHead></TableHead></TableRow></TableHeader><TableBody>{expenses.slice().reverse().map(e => <TableRow key={e.id} className="cursor-pointer" onClick={() => setDetailId(e.id)}><TableCell>{e.date}</TableCell><TableCell>{e.description}</TableCell><TableCell className="hidden sm:table-cell">{e.employee}</TableCell><TableCell className="text-right font-bold">{money(e.amount)}</TableCell><TableCell><Badge className={statusColor[e.status]}>{statusLabel[e.status]}</Badge></TableCell><TableCell><div className="flex gap-1"><Button size="sm" variant="ghost" onClick={() => setDetailId(e.id)}><Eye className="h-3.5 w-3.5"/></Button>{e.status === "pendiente" && <><Button size="sm" variant="ghost" onClick={() => handleApprove(e)}><CheckCircle className="h-3.5 w-3.5 text-green-600"/></Button><Button size="sm" variant="ghost" onClick={() => rejectExpense(e.id, "auto")}><XCircle className="h-3.5 w-3.5 text-red-600"/></Button></>}{e.status === "aprobado" && <Button size="sm" variant="ghost" title="Reembolsar y contabilizar" onClick={() => handleReimburse(e)}><DollarSign className="h-3.5 w-3.5 text-blue-600"/></Button>}<Button size="sm" variant="ghost" onClick={() => deleteExpense(e.id)}><Trash2 className="h-3.5 w-3.5 text-destructive"/></Button></div></TableCell></TableRow>)}</TableBody></Table>}</CardContent></Card></TabsContent>
      <TabsContent value="empleados" className="mt-4"><Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Empleado</TableHead><TableHead className="text-right">Gastos</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader><TableBody>{Array.from(byEmployee.entries()).map(([name, s]) => <TableRow key={name}><TableCell>{name}</TableCell><TableCell className="text-right">{s.count}</TableCell><TableCell className="text-right font-bold">{money(s.total)}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card></TabsContent>
      <TabsContent value="categorias" className="mt-4"><Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Categoría</TableHead><TableHead className="text-right">Gastos</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader><TableBody>{Array.from(byCategory.entries()).map(([cat, s]) => <TableRow key={cat}><TableCell>{catLabel[cat as ExpenseCategory] ?? cat}</TableCell><TableCell className="text-right">{s.count}</TableCell><TableCell className="text-right font-bold">{money(s.total)}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card></TabsContent>
    </Tabs>
    <Dialog open={expOpen} onOpenChange={setExpOpen}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>Nuevo gasto</DialogTitle><DialogDescription>Reporta un gasto para aprobación.</DialogDescription></DialogHeader><div className="space-y-3"><div className="grid grid-cols-2 gap-3"><div><Label>Fecha</Label><Input type="date" value={fDate} onChange={e => setFDate(e.target.value)}/></div><div><Label>Categoría</Label><Select value={fCat} onValueChange={v => setFCat(v as ExpenseCategory)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="viaticos">Viáticos</SelectItem><SelectItem value="materiales">Materiales</SelectItem><SelectItem value="servicios">Servicios</SelectItem><SelectItem value="viajes">Viajes</SelectItem><SelectItem value="alojamiento">Alojamiento</SelectItem><SelectItem value="comidas">Comidas</SelectItem><SelectItem value="combustible">Combustible</SelectItem><SelectItem value="mantenimiento">Mantenimiento</SelectItem><SelectItem value="oficina">Oficina</SelectItem><SelectItem value="otro">Otro</SelectItem></SelectContent></Select></div></div><div><Label>Descripción *</Label><Input value={fDesc} onChange={e => setFDesc(e.target.value)}/></div><div className="grid grid-cols-2 gap-3"><div><Label>Monto *</Label><Input type="number" value={fAmount} onChange={e => setFAmount(e.target.value)}/></div><div><Label>Empleado *</Label><Input value={fEmployee} onChange={e => setFEmployee(e.target.value)}/></div></div><div><Label>Proyecto</Label><Input value={fProject} onChange={e => setFProject(e.target.value)}/></div><div><Label>Notas</Label><Textarea value={fNotes} onChange={e => setFNotes(e.target.value)} rows={2}/></div></div><DialogFooter><Button variant="outline" onClick={() => setExpOpen(false)}>Cancelar</Button><Button onClick={saveExp} disabled={!fDesc || !fAmount || !fEmployee}>Agregar</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={!!detailId} onOpenChange={(o) => !o && setDetailId(null)}><DialogContent className="max-w-md">{detail && <><DialogHeader><DialogTitle>{detail.description}</DialogTitle><DialogDescription>{catLabel[detail.category]} · {detail.date}</DialogDescription></DialogHeader><div className="space-y-3"><div className="grid grid-cols-2 gap-3"><div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">Monto</div><div className="font-bold text-lg">{money(detail.amount)}</div></div><div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">Empleado</div><div className="font-bold text-lg">{detail.employee}</div></div></div>{detail.project && <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">Proyecto</div><div className="font-bold">{detail.project}</div></div>}{detail.notes && <div><Label>Notas</Label><p className="text-sm text-muted-foreground mt-1">{detail.notes}</p></div>}</div><DialogFooter><Button variant="outline" onClick={() => setDetailId(null)}>Cerrar</Button></DialogFooter></>}</DialogContent></Dialog>
  </div>;
}
