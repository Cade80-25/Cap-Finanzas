import { useMemo, useState } from "react";
import { Plus, Trash2, Eye, BarChart3, Calendar, Play, CheckCircle, XCircle } from "lucide-react";
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
import { useBusinessIntelligence, BIReportType, BIReportStatus } from "@/hooks/useBusinessIntelligence";

const typeLabel: Record<BIReportType, string> = { ventas: "Ventas", gastos: "Gastos", flujo: "Flujo de caja", margen: "Margen", rentabilidad: "Rentabilidad", custom: "Personalizado" };
const statusLabel: Record<BIReportStatus, string> = { programado: "Programado", ejecutado: "Ejecutado", fallido: "Fallido" };
const statusColor: Record<BIReportStatus, string> = { programado: "bg-blue-100 text-blue-800", ejecutado: "bg-green-100 text-green-800", fallido: "bg-red-100 text-red-800" };
const freqLabel: Record<string, string> = { diario: "Diario", semanal: "Semanal", mensual: "Mensual", trimestral: "Trimestral" };

export default function BusinessIntelligence() {
  const { reports, addReport, updateReport, deleteReport, stats, byType } = useBusinessIntelligence();
  const [tab, setTab] = useState("reportes");
  const [biOpen, setBiOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const [fName, setFName] = useState(""); const [fType, setFType] = useState<BIReportType>("ventas"); const [fFreq, setFFreq] = useState<"diario" | "semanal" | "mensual" | "trimestral">("mensual");
  const [fConfig, setFConfig] = useState(""); const [fNotes, setFNotes] = useState("");

  const detail = useMemo(() => detailId ? reports.find(r => r.id === detailId) ?? null : null, [detailId, reports]);

  const saveBi = () => { if (!fName) return; addReport({ name: fName, type: fType, status: "programado", frequency: fFreq, config: fConfig, notes: fNotes || undefined }); setFName(""); setFConfig(""); setFNotes(""); setBiOpen(false); };

  return <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 animate-fade-in">
    <div><h1 className="text-2xl sm:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">Business Intelligence</h1><p className="text-sm text-muted-foreground mt-1">Dashboards, KPIs, reportes programados, alertas</p></div>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Reportes</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.count}</div></CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Programados</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-blue-500">{stats.scheduled}</div></CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Ejecutados</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-500">{stats.executed}</div></CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Fallidos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-500">{stats.failed}</div></CardContent></Card>
    </div>
    <Tabs value={tab} onValueChange={setTab}><TabsList><TabsTrigger value="reportes"><BarChart3 className="h-4 w-4 mr-1.5"/>Reportes ({reports.length})</TabsTrigger><TabsTrigger value="tipos"><Calendar className="h-4 w-4 mr-1.5"/>Por tipo</TabsTrigger></TabsList>
      <TabsContent value="reportes" className="mt-4"><div className="mb-3"><Button onClick={() => setBiOpen(true)}><Plus className="h-4 w-4 mr-2"/>Reporte</Button></div><Card><CardContent className="p-0">{reports.length === 0 ? <div className="py-16 text-center text-muted-foreground">Sin reportes</div> : <Table><TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Tipo</TableHead><TableHead>Frecuencia</TableHead><TableHead>Estado</TableHead><TableHead></TableHead></TableRow></TableHeader><TableBody>{reports.slice().reverse().map(r => <TableRow key={r.id} className="cursor-pointer" onClick={() => setDetailId(r.id)}><TableCell className="font-medium">{r.name}</TableCell><TableCell><Badge variant="outline">{typeLabel[r.type]}</Badge></TableCell><TableCell>{freqLabel[r.frequency]}</TableCell><TableCell><Badge className={statusColor[r.status]}>{statusLabel[r.status]}</Badge></TableCell><TableCell><div className="flex gap-1"><Button size="sm" variant="ghost" onClick={() => setDetailId(r.id)}><Eye className="h-3.5 w-3.5"/></Button><Button size="sm" variant="ghost" onClick={() => deleteReport(r.id)}><Trash2 className="h-3.5 w-3.5 text-destructive"/></Button></div></TableCell></TableRow>)}</TableBody></Table>}</CardContent></Card></TabsContent>
      <TabsContent value="tipos" className="mt-4"><Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Tipo</TableHead><TableHead className="text-right">Cantidad</TableHead></TableRow></TableHeader><TableBody>{Array.from(byType.entries()).map(([type, count]) => <TableRow key={type}><TableCell>{typeLabel[type as BIReportType]}</TableCell><TableCell className="text-right">{count}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card></TabsContent>
    </Tabs>
    <Dialog open={biOpen} onOpenChange={setBiOpen}><DialogContent className="max-w-md max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Nuevo reporte</DialogTitle><DialogDescription>Reporte programado con KPIs.</DialogDescription></DialogHeader><div className="space-y-3"><div><Label>Nombre *</Label><Input value={fName} onChange={e => setFName(e.target.value)}/></div><div><Label>Tipo</Label><Select value={fType} onValueChange={v => setFType(v as BIReportType)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="ventas">Ventas</SelectItem><SelectItem value="gastos">Gastos</SelectItem><SelectItem value="flujo">Flujo de caja</SelectItem><SelectItem value="margen">Margen</SelectItem><SelectItem value="rentabilidad">Rentabilidad</SelectItem><SelectItem value="custom">Personalizado</SelectItem></SelectContent></Select></div><div><Label>Frecuencia</Label><Select value={fFreq} onValueChange={v => setFFreq(v as "diario" | "semanal" | "mensual" | "trimestral")}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="diario">Diario</SelectItem><SelectItem value="semanal">Semanal</SelectItem><SelectItem value="mensual">Mensual</SelectItem><SelectItem value="trimestral">Trimestral</SelectItem></SelectContent></Select></div><div><Label>Configuración (JSON)</Label><Textarea value={fConfig} onChange={e => setFConfig(e.target.value)} rows={3} placeholder='{"kpi": "ventas", "period": "mensual"}'/></div><div><Label>Notas</Label><Textarea value={fNotes} onChange={e => setFNotes(e.target.value)} rows={2}/></div></div><DialogFooter><Button variant="outline" onClick={() => setBiOpen(false)}>Cancelar</Button><Button onClick={saveBi} disabled={!fName}>Agregar</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={!!detailId} onOpenChange={(o) => !o && setDetailId(null)}><DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">{detail && <><DialogHeader><DialogTitle>{detail.name}</DialogTitle><DialogDescription>{typeLabel[detail.type]} · {freqLabel[detail.frequency]}</DialogDescription></DialogHeader><div className="space-y-4"><div className="grid grid-cols-2 gap-3"><div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">Estado</div><Badge className={statusColor[detail.status]}>{statusLabel[detail.status]}</Badge></div><div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">Frecuencia</div><div className="font-bold">{freqLabel[detail.frequency]}</div></div></div>{detail.config && <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">Configuración</div><pre className="text-xs mt-1 bg-muted p-2 rounded overflow-x-auto">{detail.config}</pre></div>}{detail.notes && <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">Notas</div><p className="text-sm mt-1">{detail.notes}</p></div>}</div><DialogFooter><Button variant="outline" onClick={() => setDetailId(null)}>Cerrar</Button></DialogFooter></>}</DialogContent></Dialog>
  </div>;
}
