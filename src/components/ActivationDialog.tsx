import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Key, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useLicense } from "@/hooks/useLicense";

interface ActivationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ActivationDialog({ open, onOpenChange, onSuccess }: ActivationDialogProps) {
  const { activateLicense } = useLicense();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code.trim()) {
      setResult({ success: false, message: "Por favor ingresa un código de licencia" });
      return;
    }

    setIsLoading(true);
    setResult(null);

    await new Promise((resolve) => setTimeout(resolve, 300));

    const activationResult = await activateLicense(code);
    setResult(activationResult);
    setIsLoading(false);

    if (activationResult.success) {
      setTimeout(() => {
        setCode("");
        setResult(null);
        onOpenChange(false);
        onSuccess?.();
      }, 2000);
    }
  };

  const handleCodeChange = (value: string) => {
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9-]/g, "");
    setCode(cleaned);
    setResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Key className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">Activar Licencia</DialogTitle>
          <DialogDescription className="text-center">
            Ingresa el código de licencia que recibiste por correo electrónico
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="license-code">Código de Licencia</Label>
            <Input
              id="license-code"
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              placeholder="CF-FULL-XXXX-XXXXX"
              className="font-mono text-center tracking-wider"
              disabled={isLoading}
              autoFocus
            />
            <p className="text-xs text-muted-foreground text-center">
              Ejemplo: CF-FULL-A1B2-C3D4E
            </p>
          </div>

          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              {result.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || !code.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Verificando...
              </>
            ) : (
              "Activar Licencia"
            )}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">
            Cap Finanzas ahora es completamente gratis. Ya no necesitas código para acceder.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
