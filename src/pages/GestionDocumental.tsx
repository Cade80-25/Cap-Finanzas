import { useMemo, useState } from "react";
import { Plus, Trash2, Eye, FileText, Archive, Tag, FolderOpen } from "lucide-react";
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
import { useGestionDocumental, DocCategory, DocStatus } from "@/hooks/useGestionDocumental";

const categoryLabel: Record<DocCategory, string> = { factura: "Factura", recibo: "Recibo", contrato: "Contrato", asiento: "Asiento", otro: "Otro" };
const statusLabel: Record<DocStatus, string> = { pendiente: "Pendiente", clasificado: "Clasificado", archivado: "Archivado" };
const statusColor: Record<DocStatus, string> = { pendiente: "bg-amber-100 text-amber-800", clasificado: "bg-blue-100 text-blue-800", archivado: "bg-green-100 text-green-800" };

export default function GestionDocumental() {
  const { documents, addDocument, updateDocument, deleteDocument, stats, byCategory } = useGestionDocumental();
  const [tab, setTab] = useState("documentos");
  const [docOpen, setDocOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const [fName, setFName] = useState(""); const [fCategory, setFCategory] = useState<DocCategory>("factura"); const [fTags, setFTags] = useState("");
  const [fRelatedTo, setFRelatedTo] = useState(""); const [fNotes, setFNotes] = useState("");

  const detail = useMemo(() => detailId ? documents.find(d => d.id === detailId) ?? null : null, [detailId, documents]);

  const saveDoc = () => { if (!fName) return; addDocument({ name: fName, category: fCategory, status: "pendiente", tags: fTags.split(",").map(t => t.trim()).filter(Boolean), relatedTo: fRelatedTo || undefined, notes: fNotes || undefined }); setFName(""); setFTags(""); setFRelatedTo(""); setFNotes(""); setDocOpen(false); };

  return <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 animate-fade-in">
    <div><h1 className="text-2xl sm:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">Gestión Documental</h1><p className="text-sm text-muted-foreground mt-1">Adjuntos, clasificación, búsqueda, archivo</p></div>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Documentos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.count}</div></CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Pendientes</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-amber-500">{stats.pending}</div></CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Clasificados</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-blue-500">{stats.classified}</div></CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Archivados</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-500">{stats.archived}</div></CardContent></Card>
    </div>
    <Tabs value={tab} onValueChange={setTab}><TabsList><TabsTrigger value="documentos"><FileText className="h-4 w-4 mr-1.5"/>Documentos ({documents.length})</TabsTrigger><TabsTrigger value="categorias"><FolderOpen className="h-4 w-4 mr-1.5"/>Por categoría</TabsTrigger></TabsList>
      <TabsContent value="documentos" className="mt-4"><div className="mb-3"><Button onClick={() => setDocOpen(true)}><Plus className="h-4 w-4 mr-2"/>Documento</Button></div><Card><CardContent className="p-0">{documents.length === 0 ? <div className="py-16 text-center text-muted-foreground">Sin documentos</div> : <Table><TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Categoría</TableHead><TableHead>Tags</TableHead><TableHead>Estado</TableHead><TableHead></TableHead></TableRow></TableHeader><TableBody>{documents.slice().reverse().map(d => <TableRow key={d.id} className="cursor-pointer" onClick={() => setDetailId(d.id)}><TableCell className="font-medium">{d.name}</TableCell><TableCell><Badge variant="outline">{categoryLabel[d.category]}</Badge></TableCell><TableCell>{d.tags.map(t => <Badge key={t} variant="secondary" className="mr-1">{t}</Badge>)}</TableCell><TableCell><Badge className={statusColor[d.status]}>{statusLabel[d.status]}</Badge></TableCell><TableCell><div className="flex gap-1"><Button size="sm" variant="ghost" onClick={() => setDetailId(d.id)}><Eye className="h-3.5 w-3.5"/></Button><Button size="sm" variant="ghost" onClick={() => deleteDocument(d.id)}><Trash2 className="h-3.5 w-3.5 text-destructive"/></Button></div></TableCell></TableRow>)}</TableBody></Table>}</CardContent></Card></TabsContent>
      <TabsContent value="categorias" className="mt-4"><Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Categoría</TableHead><TableHead className="text-right">Cantidad</TableHead></TableRow></TableHeader><TableBody>{Array.from(byCategory.entries()).map(([cat, count]) => <TableRow key={cat}><TableCell>{categoryLabel[cat as DocCategory]}</TableCell><TableCell className="text-right">{count}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card></TabsContent>
    </Tabs>
    <Dialog open={docOpen} onOpenChange={setDocOpen}><DialogContent className="max-w-md max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Nuevo documento</DialogTitle><DialogDescription>Documento con clasificación y tags.</DialogDescription></DialogHeader><div className="space-y-3"><div><Label>Nombre *</Label><Input value={fName} onChange={e => setFName(e.target.value)}/></div><div><Label>Categoría</Label><Select value={fCategory} onValueChange={v => setFCategory(v as DocCategory)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="factura">Factura</SelectItem><SelectItem value="recibo">Recibo</SelectItem><SelectItem value="contrato">Contrato</SelectItem><SelectItem value="asiento">Asiento</SelectItem><SelectItem value="otro">Otro</SelectItem></SelectContent></Select></div><div><Label>Tags (separados por coma)</Label><Input value={fTags} onChange={e => setFTags(e.target.value)} placeholder="ej: 2026, venta, cliente-x"/></div><div><Label>Relacionado a</Label><Input value={fRelatedTo} onChange={e => setFRelatedTo(e.target.value)} placeholder="ej: Factura #001"/></div><div><Label>Notas</Label><Textarea value={fNotes} onChange={e => setFNotes(e.target.value)} rows={2}/></div></div><DialogFooter><Button variant="outline" onClick={() => setDocOpen(false)}>Cancelar</Button><Button onClick={saveDoc} disabled={!fName}>Agregar</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={!!detailId} onOpenChange={(o) => !o && setDetailId(null)}><DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">{detail && <><DialogHeader><DialogTitle>{detail.name}</DialogTitle><DialogDescription>{categoryLabel[detail.category]}</DialogDescription></DialogHeader><div className="space-y-4"><div className="grid grid-cols-2 gap-3"><div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">Estado</div><Badge className={statusColor[detail.status]}>{statusLabel[detail.status]}</Badge></div><div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">Relacionado a</div><div className="font-bold">{detail.relatedTo || "—"}</div></div></div>{detail.tags.length > 0 && <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">Tags</div><div className="flex flex-wrap gap-1 mt-1">{detail.tags.map(t => <Badge key={t} variant="secondary">{t}</Badge>)}</div></div>}{detail.notes && <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">Notas</div><p className="text-sm mt-1">{detail.notes}</p></div>}</div><DialogFooter><Button variant="outline" onClick={() => setDetailId(null)}>Cerrar</Button></DialogFooter></>}</DialogContent></Dialog>
  </div>;
}
