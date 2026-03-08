import { useState } from "react";
import { useWalletContext } from "@/contexts/WalletContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, Plus, Pencil, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";

export function WalletSelector() {
  const {
    wallets,
    activeWallet,
    canAddWallet,
    maxWallets,
    setActiveWallet,
    addWallet,
    renameWallet,
    deleteWallet,
    walletIcons,
  } = useWalletContext();

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("💼");
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAdd = () => {
    const result = addWallet(newName, selectedIcon);
    if (result.success) {
      toast.success(result.message);
      setAddOpen(false);
      setNewName("");
    } else {
      toast.error(result.message);
    }
  };

  const handleEdit = () => {
    if (editingId) {
      renameWallet(editingId, newName, selectedIcon);
      toast.success("Cuenta actualizada");
      setEditOpen(false);
    }
  };

  const handleDelete = () => {
    if (deleteConfirmId) {
      const result = deleteWallet(deleteConfirmId);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
      setDeleteConfirmId(null);
    }
  };

  const openEdit = (id: string) => {
    const w = wallets.find((w) => w.id === id);
    if (w) {
      setEditingId(id);
      setNewName(w.name);
      setSelectedIcon(w.icon);
      setEditOpen(true);
    }
  };

  // Only show if there's more than 1 wallet or user can add more
  if (wallets.length <= 1 && !canAddWallet) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 w-full justify-between">
            <span className="flex items-center gap-2 truncate">
              <span>{activeWallet.icon}</span>
              <span className="truncate">{activeWallet.name}</span>
            </span>
            <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {wallets.map((w) => (
            <DropdownMenuItem
              key={w.id}
              className="flex items-center justify-between"
              onClick={() => setActiveWallet(w.id)}
            >
              <span className="flex items-center gap-2">
                <span>{w.icon}</span>
                <span>{w.name}</span>
              </span>
              <span className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEdit(w.id);
                  }}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                {w.id !== "wallet-default" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmId(w.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </span>
            </DropdownMenuItem>
          ))}
          {canAddWallet && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setNewName("");
                  setSelectedIcon(walletIcons[wallets.length % walletIcons.length]);
                  setAddOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nueva Cuenta ({wallets.length}/{maxWallets})
              </DropdownMenuItem>
            </>
          )}
          {!canAddWallet && wallets.length < 5 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                <Wallet className="h-3 w-3 mr-2" />
                Activa una cuenta extra ($3) para agregar más
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Add wallet dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Cuenta</DialogTitle>
            <DialogDescription>
              Crea una cuenta separada para organizar tus finanzas
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ej: Negocio, Ahorros, Casa..."
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Ícono</Label>
              <div className="flex flex-wrap gap-2">
                {walletIcons.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    className={`h-10 w-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                      selectedIcon === icon
                        ? "bg-primary/20 ring-2 ring-primary"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                    onClick={() => setSelectedIcon(icon)}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAdd}>Crear Cuenta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit wallet dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Cuenta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Ícono</Label>
              <div className="flex flex-wrap gap-2">
                {walletIcons.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    className={`h-10 w-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                      selectedIcon === icon
                        ? "bg-primary/20 ring-2 ring-primary"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                    onClick={() => setSelectedIcon(icon)}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEdit}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta cuenta?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán todas las transacciones de esta cuenta. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
