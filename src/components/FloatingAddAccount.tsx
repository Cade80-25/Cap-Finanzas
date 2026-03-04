import { useState, forwardRef } from "react";
import { Plus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWalletContext } from "@/contexts/WalletContext";
import { useLicense } from "@/hooks/useLicense";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const FloatingAddAccount = forwardRef<HTMLDivElement>(function FloatingAddAccount(_, ref) {
  const { wallets, canAddWallet, maxWallets, addWallet, walletIcons } = useWalletContext();
  const { status } = useLicense();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("💼");

  // Don't show if user already has max wallets and can't add more
  if (wallets.length >= 5 && !canAddWallet) return null;

  const handleAdd = () => {
    const result = addWallet(name, icon);
    if (result.success) {
      toast.success(result.message);
      setOpen(false);
      setName("");
    } else {
      toast.error(result.message);
    }
  };

  const handleClick = () => {
    if (canAddWallet) {
      setName("");
      setIcon(walletIcons[wallets.length % walletIcons.length]);
      setOpen(true);
    } else {
      toast.info(
        status === "trial"
          ? `En modo prueba puedes tener hasta ${maxWallets} cuentas.`
          : "Activa una cuenta adicional ($2 USD) para agregar más.",
        { duration: 4000 }
      );
    }
  };

  return (
    <div ref={ref}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleClick}
              size="icon"
              className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all bg-primary hover:bg-primary/90"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Nueva Cuenta ({wallets.length}/{maxWallets})
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Cuenta</DialogTitle>
            <DialogDescription>
              Crea una cuenta separada para organizar tus finanzas (ej: Hogar, Negocio, Ahorros)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Negocio, Ahorros, Casa..."
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
            </div>
            <div className="space-y-2">
              <Label>Ícono</Label>
              <div className="flex flex-wrap gap-2">
                {walletIcons.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    className={`h-10 w-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                      icon === ic
                        ? "bg-primary/20 ring-2 ring-primary"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                    onClick={() => setIcon(ic)}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAdd}>Crear Cuenta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});
