import { useState } from "react";
import { Plus, Trash2, ChevronRight, Search, Pencil, FolderPlus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCategories, type Category, type SubCategory } from "@/hooks/useCategories";

interface CategorySelectorProps {
  type: "income" | "expense";
  value: string;
  subcategoryValue?: string;
  onSelect: (categoryId: string, subcategoryId?: string) => void;
}

interface EditState {
  kind: "category" | "subcategory";
  categoryId: string;
  subId?: string;
  label: string;
  icon: string;
}

export function CategorySelector({ type, value, subcategoryValue, onSelect }: CategorySelectorProps) {
  const {
    incomeCategories, expenseCategories,
    addCategory, addSubcategory, deleteCategory, removeSubcategory,
    updateCategory, updateSubcategory,
  } = useCategories();
  const [search, setSearch] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addSubOpen, setAddSubOpen] = useState<string | null>(null);
  const [newCatLabel, setNewCatLabel] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("📁");
  const [newSubLabel, setNewSubLabel] = useState("");
  const [newSubIcon, setNewSubIcon] = useState("📌");
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ categoryId: string; sub: SubCategory } | null>(null);

  const categories = type === "income" ? incomeCategories : expenseCategories;
  const filtered = search
    ? categories.filter(c =>
        c.label.toLowerCase().includes(search.toLowerCase()) ||
        c.subcategories.some(s => s.label.toLowerCase().includes(search.toLowerCase()))
      )
    : categories;

  const handleAddCategory = () => {
    if (!newCatLabel.trim()) return;
    const id = `${newCatLabel.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}-${Date.now().toString(36)}`;
    addCategory({ id, label: newCatLabel.trim(), icon: newCatIcon, type, subcategories: [] });
    setNewCatLabel(""); setNewCatIcon("📁"); setAddDialogOpen(false);
  };

  const handleAddSubcategory = (catId: string) => {
    if (!newSubLabel.trim()) return;
    const subId = `${newSubLabel.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}-${Date.now().toString(36)}`;
    addSubcategory(catId, { id: subId, label: newSubLabel.trim(), icon: newSubIcon });
    setNewSubLabel(""); setNewSubIcon("📌"); setAddSubOpen(null);
  };

  const handleSaveEdit = () => {
    if (!editing || !editing.label.trim()) return;
    if (editing.kind === "category") {
      updateCategory(editing.categoryId, { label: editing.label.trim(), icon: editing.icon });
    } else if (editing.subId) {
      updateSubcategory(editing.categoryId, editing.subId, { label: editing.label.trim(), icon: editing.icon });
    }
    setEditing(null);
  };

  const startEditCategory = (c: Category) => setEditing({ kind: "category", categoryId: c.id, label: c.label, icon: c.icon });
  const startEditSub = (catId: string, s: SubCategory) =>
    setEditing({ kind: "subcategory", categoryId: catId, subId: s.id, label: s.label, icon: s.icon || "📌" });

  const selectedCat = categories.find(c => c.id === value);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Categoría</Label>
        <Button type="button" variant="ghost" size="sm" onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-3 w-3 mr-1" /> Nueva
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Buscar categoría..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-8 h-8 text-sm"
        />
      </div>

      <ScrollArea className="h-[220px] border rounded-md">
        <div className="p-1">
          {filtered.map(cat => (
            <div key={cat.id} className="group/cat">
              <div
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors",
                  value === cat.id && !subcategoryValue
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
                onClick={() => {
                  if (cat.subcategories.length > 0) {
                    setExpandedCat(expandedCat === cat.id ? null : cat.id);
                  }
                  onSelect(cat.id, undefined);
                }}
              >
                <span className="text-base">{cat.icon}</span>
                <span className="flex-1 truncate">{cat.label}</span>
                {cat.subcategories.length > 0 && (
                  <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", expandedCat === cat.id && "rotate-90")} />
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 opacity-0 group-hover/cat:opacity-100"
                  onClick={e => { e.stopPropagation(); startEditCategory(cat); }}
                  title="Editar categoría"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                {cat.isCustom && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 opacity-0 group-hover/cat:opacity-100"
                    onClick={e => { e.stopPropagation(); deleteCategory(cat.id); }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
              {expandedCat === cat.id && (
                <div className="ml-6 border-l pl-2 my-1 space-y-0.5">
                  {cat.subcategories.map(sub => (
                    <div
                      key={sub.id}
                      className={cn(
                        "group/sub flex items-center gap-2 px-2 py-1 rounded text-sm cursor-pointer",
                        value === cat.id && subcategoryValue === sub.id
                          ? "bg-primary/80 text-primary-foreground"
                          : "hover:bg-muted"
                      )}
                      onClick={() => onSelect(cat.id, sub.id)}
                    >
                      <span className="text-base">{sub.icon || "📌"}</span>
                      <span className="flex-1 truncate">{sub.label}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 opacity-0 group-hover/sub:opacity-100"
                        onClick={e => { e.stopPropagation(); startEditSub(cat.id, sub); }}
                        title="Editar subcategoría"
                      >
                        <Pencil className="h-2.5 w-2.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 opacity-0 group-hover/sub:opacity-100"
                        onClick={e => { e.stopPropagation(); removeSubcategory(cat.id, sub.id); }}
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </Button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => { setAddSubOpen(cat.id); setNewSubLabel(""); setNewSubIcon("📌"); }}
                  >
                    <Plus className="h-3 w-3" /> Agregar sub
                  </button>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">No se encontraron categorías</p>
          )}
        </div>
      </ScrollArea>

      {selectedCat && (
        <p className="text-xs text-muted-foreground">
          Seleccionada: {selectedCat.icon} {selectedCat.label}
          {subcategoryValue && ` > ${selectedCat.subcategories.find(s => s.id === subcategoryValue)?.label || subcategoryValue}`}
        </p>
      )}

      {/* Add category */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nueva Categoría</DialogTitle>
            <DialogDescription>Crea una categoría personalizada</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nombre</Label>
              <Input value={newCatLabel} onChange={e => setNewCatLabel(e.target.value)} placeholder="Ej: Gimnasio" />
            </div>
            <div>
              <Label>Icono (emoji)</Label>
              <Input value={newCatIcon} onChange={e => setNewCatIcon(e.target.value)} className="w-20 text-center text-xl" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddCategory}>Crear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add subcategory */}
      <Dialog open={!!addSubOpen} onOpenChange={open => { if (!open) setAddSubOpen(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nueva Subcategoría</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nombre</Label>
              <Input value={newSubLabel} onChange={e => setNewSubLabel(e.target.value)} placeholder="Ej: Nafta Premium" />
            </div>
            <div>
              <Label>Icono (emoji)</Label>
              <Input value={newSubIcon} onChange={e => setNewSubIcon(e.target.value)} className="w-20 text-center text-xl" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddSubOpen(null)}>Cancelar</Button>
            <Button onClick={() => addSubOpen && handleAddSubcategory(addSubOpen)}>Crear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={open => { if (!open) setEditing(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Editar {editing?.kind === "category" ? "categoría" : "subcategoría"}
            </DialogTitle>
            <DialogDescription>Cambia el nombre y el ícono</DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <Label>Nombre</Label>
                <Input
                  value={editing.label}
                  onChange={e => setEditing({ ...editing, label: e.target.value })}
                />
              </div>
              <div>
                <Label>Icono (emoji)</Label>
                <Input
                  value={editing.icon}
                  onChange={e => setEditing({ ...editing, icon: e.target.value })}
                  className="w-20 text-center text-xl"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={handleSaveEdit}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
