import { useState } from "react";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useAccounts, type Account } from "@/hooks/useAccounts";
import { toast } from "sonner";

interface CustomAccountsManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const accountTypeLabels: Record<Account["type"], string> = {
  activo: "Activo",
  pasivo: "Pasivo",
  patrimonio: "Patrimonio",
  ingreso: "Ingreso",
  gasto: "Gasto",
};

const accountIcons = ["💰", "🏠", "📋", "📜", "🏦", "💵", "🏢", "📦", "📁", "🏛️"];

export function CustomAccountsManager({ open, onOpenChange }: CustomAccountsManagerProps) {
  const { customAccounts, addCustomAccount, editCustomAccount, deleteCustomAccount } = useAccounts();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<Account["type"]>("activo");
  const [newIcon, setNewIcon] = useState("📁");

  const resetForm = () => {
    setNewCode("");
    setNewName("");
    setNewType("activo");
    setNewIcon("📁");
    setShowAddForm(false);
    setEditingCode(null);
  };

  const handleAdd = () => {
    if (!newName.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    const code = newCode.trim() || `custom-${Date.now()}`;
    if (customAccounts.some((a) => a.code === code)) {
      toast.error("Ya existe una cuenta con ese código");
      return;
    }
    addCustomAccount({ code, name: newName.trim(), type: newType, icon: newIcon });
    toast.success("Cuenta creada exitosamente");
    resetForm();
  };

  const handleEdit = (code: string) => {
    const account = customAccounts.find((a) => a.code === code);
    if (!account) return;
    setEditingCode(code);
    setNewCode(account.code);
    setNewName(account.name);
    setNewType(account.type);
    setNewIcon(account.icon || "📁");
    setShowAddForm(true);
  };

  const handleUpdate = () => {
    if (!editingCode || !newName.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    editCustomAccount(editingCode, { name: newName.trim(), type: newType, icon: newIcon });
    toast.success("Cuenta actualizada");
    resetForm();
  };

  const handleDelete = (code: string) => {
    deleteCustomAccount(code);
    toast.success("Cuenta eliminada");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Plan de Cuentas Personalizado</DialogTitle>
          <DialogDescription>
            Gestiona tus cuentas contables personalizadas. Estas cuentas estarán disponibles
            en los selectores de cuenta junto con las cuentas del sistema.
          </DialogDialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Formulario de agregar/editar */}
          {showAddForm ? (
            <div className="rounded-md border p-4 space-y-3 bg-muted/30">
              <h4 className="font-medium">
                {editingCode ? "Editar Cuenta" : "Nueva Cuenta"}
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1">
                  <Label className="text-xs">Código</Label>
                  <Input
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="custom-001"
                    disabled={!!editingCode}
                  />
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs">Nombre</Label>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Mi cuenta"
                  />
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs">Tipo</Label>
                  <Select value={newType} onValueChange={(v) => setNewType(v as Account["type"])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(accountTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs">Icono</Label>
                  <Select value={newIcon} onValueChange={setNewIcon}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {accountIcons.map((icon) => (
                        <SelectItem key={icon} value={icon}>
                          <span className="mr-1">{icon}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={resetForm}>
                  <X className="h-3 w-3 mr-1" />
                  Cancelar
                </Button>
                <Button size="sm" onClick={editingCode ? handleUpdate : handleAdd}>
                  <Check className="h-3 w-3 mr-1" />
                  {editingCode ? "Actualizar" : "Crear"}
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Nueva Cuenta
            </Button>
          )}

          {/* Lista de cuentas personalizadas */}
          {customAccounts.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="w-[80px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customAccounts.map((account) => (
                    <TableRow key={account.code}>
                      <TableCell className="font-mono text-sm">
                        {account.icon && <span className="mr-1">{account.icon}</span>}
                        {account.code}
                      </TableCell>
                      <TableCell>{account.name}</TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {accountTypeLabels[account.type]}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleEdit(account.code)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(account.code)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No hay cuentas personalizadas. Crea una para empezar.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
