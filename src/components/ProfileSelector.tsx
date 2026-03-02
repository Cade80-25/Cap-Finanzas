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
import { ChevronDown, Plus, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

export function ProfileSelector() {
  const {
    profiles,
    activeProfile,
    canAddProfile,
    maxProfiles,
    setActiveProfile,
    addProfile,
    renameProfile,
    deleteProfile,
    profileAvatars,
  } = useWalletContext();

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("👤");
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAdd = () => {
    const result = addProfile(newName, selectedAvatar);
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
      renameProfile(editingId, newName, selectedAvatar);
      toast.success("Perfil actualizado");
      setEditOpen(false);
    }
  };

  const handleDelete = () => {
    if (deleteConfirmId) {
      const result = deleteProfile(deleteConfirmId);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
      setDeleteConfirmId(null);
    }
  };

  const openEdit = (id: string) => {
    const p = profiles.find((p) => p.id === id);
    if (p) {
      setEditingId(id);
      setNewName(p.name);
      setSelectedAvatar(p.avatar);
      setEditOpen(true);
    }
  };

  // Only show if there's more than 1 profile or user can add more
  if (profiles.length <= 1 && !canAddProfile) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2 w-full justify-between text-xs">
            <span className="flex items-center gap-2 truncate">
              <span className="text-base">{activeProfile.avatar}</span>
              <span className="truncate">{activeProfile.name}</span>
            </span>
            <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {profiles.map((p) => (
            <DropdownMenuItem
              key={p.id}
              className="flex items-center justify-between"
              onClick={() => setActiveProfile(p.id)}
            >
              <span className="flex items-center gap-2">
                <span className="text-base">{p.avatar}</span>
                <span>{p.name}</span>
              </span>
              <span className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEdit(p.id);
                  }}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                {p.id !== "profile-default" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmId(p.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </span>
            </DropdownMenuItem>
          ))}
          {canAddProfile && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setNewName("");
                  setSelectedAvatar(profileAvatars[profiles.length % profileAvatars.length]);
                  setAddOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Perfil ({profiles.length}/{maxProfiles})
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Add profile dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Perfil</DialogTitle>
            <DialogDescription>
              Crea un perfil para otra persona que use esta instalación
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ej: María, Carlos, Hijo..."
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Avatar</Label>
              <div className="flex flex-wrap gap-2">
                {profileAvatars.map((avatar) => (
                  <button
                    key={avatar}
                    type="button"
                    className={`h-10 w-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                      selectedAvatar === avatar
                        ? "bg-primary/20 ring-2 ring-primary"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                    onClick={() => setSelectedAvatar(avatar)}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAdd}>Crear Perfil</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit profile dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
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
              <Label>Avatar</Label>
              <div className="flex flex-wrap gap-2">
                {profileAvatars.map((avatar) => (
                  <button
                    key={avatar}
                    type="button"
                    className={`h-10 w-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                      selectedAvatar === avatar
                        ? "bg-primary/20 ring-2 ring-primary"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                    onClick={() => setSelectedAvatar(avatar)}
                  >
                    {avatar}
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
            <AlertDialogTitle>¿Eliminar este perfil?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán todas las cuentas y transacciones de este perfil. Esta acción no se puede deshacer.
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
