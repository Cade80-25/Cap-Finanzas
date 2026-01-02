import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, AlertCircle, CheckCircle, Upload } from "lucide-react";
import { toast } from "sonner";

interface ChangePinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasMasterPin: boolean;
  onVerifyPin: (pin: string) => boolean;
  onSetPin: (pin: string | null) => void;
}

export function ChangePinDialog({ 
  open, 
  onOpenChange, 
  hasMasterPin,
  onVerifyPin,
  onSetPin 
}: ChangePinDialogProps) {
  const [step, setStep] = useState<"verify" | "new" | "confirm">(hasMasterPin ? "verify" : "new");
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");

  const resetDialog = () => {
    setStep(hasMasterPin ? "verify" : "new");
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
    setError("");
  };

  const handleClose = () => {
    resetDialog();
    onOpenChange(false);
  };

  const handleVerify = () => {
    if (onVerifyPin(currentPin)) {
      setStep("new");
      setCurrentPin("");
      setError("");
    } else {
      setError("PIN actual incorrecto");
    }
  };

  const handleSetNew = () => {
    if (newPin.length < 4) {
      setError("El PIN debe tener al menos 4 dígitos");
      return;
    }
    setStep("confirm");
    setError("");
  };

  const handleConfirm = () => {
    if (newPin !== confirmPin) {
      setError("Los PIN no coinciden");
      return;
    }
    
    onSetPin(newPin);
    toast.success(hasMasterPin ? "PIN actualizado correctamente" : "PIN configurado correctamente");
    handleClose();
  };

  const handleRemovePin = () => {
    onSetPin(null);
    toast.success("PIN eliminado. La aplicación ya no requerirá desbloqueo.");
    handleClose();
  };

  const handlePinInput = (value: string, setter: (v: string) => void) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 6);
    setter(cleaned);
    setError("");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {!hasMasterPin ? "Configurar PIN de Seguridad" : 
             step === "verify" ? "Verificar PIN Actual" :
             step === "new" ? "Nuevo PIN" : "Confirmar PIN"}
          </DialogTitle>
          <DialogDescription>
            {!hasMasterPin 
              ? "Configura un PIN de 4-6 dígitos para proteger tu información financiera."
              : step === "verify" 
                ? "Ingresa tu PIN actual para continuar."
                : step === "new"
                  ? "Ingresa tu nuevo PIN de seguridad."
                  : "Confirma tu nuevo PIN."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {step === "verify" && (
            <div className="space-y-2">
              <Label htmlFor="current-pin">PIN Actual</Label>
              <div className="relative">
                <Input
                  id="current-pin"
                  type={showPin ? "text" : "password"}
                  value={currentPin}
                  onChange={(e) => handlePinInput(e.target.value, setCurrentPin)}
                  placeholder="••••••"
                  className="pr-10 text-center text-xl tracking-widest"
                  inputMode="numeric"
                  autoFocus
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowPin(!showPin)}
                >
                  {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}

          {step === "new" && (
            <div className="space-y-2">
              <Label htmlFor="new-pin">Nuevo PIN (4-6 dígitos)</Label>
              <div className="relative">
                <Input
                  id="new-pin"
                  type={showPin ? "text" : "password"}
                  value={newPin}
                  onChange={(e) => handlePinInput(e.target.value, setNewPin)}
                  placeholder="••••••"
                  className="pr-10 text-center text-xl tracking-widest"
                  inputMode="numeric"
                  autoFocus
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowPin(!showPin)}
                >
                  {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Elige un PIN que puedas recordar fácilmente pero que sea difícil de adivinar.
              </p>
            </div>
          )}

          {step === "confirm" && (
            <div className="space-y-2">
              <Label htmlFor="confirm-pin">Confirmar PIN</Label>
              <div className="relative">
                <Input
                  id="confirm-pin"
                  type={showPin ? "text" : "password"}
                  value={confirmPin}
                  onChange={(e) => handlePinInput(e.target.value, setConfirmPin)}
                  placeholder="••••••"
                  className="pr-10 text-center text-xl tracking-widest"
                  inputMode="numeric"
                  autoFocus
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowPin(!showPin)}
                >
                  {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {step === "verify" && hasMasterPin && (
            <Button variant="destructive" onClick={handleRemovePin} className="sm:mr-auto">
              Eliminar PIN
            </Button>
          )}
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          {step === "verify" && (
            <Button onClick={handleVerify} disabled={currentPin.length < 4}>
              Verificar
            </Button>
          )}
          {step === "new" && (
            <Button onClick={handleSetNew} disabled={newPin.length < 4}>
              Continuar
            </Button>
          )}
          {step === "confirm" && (
            <Button onClick={handleConfirm} disabled={confirmPin.length < 4}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirmar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface BackupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lastBackupDate: string | null;
  onExportBackup: () => void;
  onImportBackup: (file: File) => Promise<boolean>;
}

export function BackupDialog({
  open,
  onOpenChange,
  lastBackupDate,
  onExportBackup,
  onImportBackup,
}: BackupDialogProps) {
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    onExportBackup();
    toast.success("Backup exportado correctamente");
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const success = await onImportBackup(file);
      if (success) {
        toast.success("Backup restaurado correctamente", {
          description: "Recarga la página para ver los cambios.",
        });
        onOpenChange(false);
      } else {
        toast.error("Error al restaurar backup", {
          description: "El archivo no es válido o está corrupto.",
        });
      }
    } catch {
      toast.error("Error al leer el archivo");
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gestión de Backups</DialogTitle>
          <DialogDescription>
            Exporta o importa copias de seguridad de tus datos financieros.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {lastBackupDate && (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm">
                <strong>Último backup automático:</strong>
              </p>
              <p className="text-sm text-muted-foreground">
                {new Date(lastBackupDate).toLocaleString("es-ES", {
                  dateStyle: "full",
                  timeStyle: "short",
                })}
              </p>
            </div>
          )}

          <div className="grid gap-3">
            <Button onClick={handleExport} className="w-full">
              <CheckCircle className="h-4 w-4 mr-2" />
              Exportar Backup Ahora
            </Button>

            <Button 
              variant="outline" 
              onClick={handleImportClick} 
              className="w-full"
              disabled={importing}
            >
              <Upload className="h-4 w-4 mr-2" />
              {importing ? "Importando..." : "Restaurar desde Archivo"}
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Importante:</strong> Al restaurar un backup, los datos actuales serán 
              reemplazados. Asegúrate de exportar un backup actual antes de restaurar.
            </AlertDescription>
          </Alert>
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

interface TwoFactorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function TwoFactorDialog({
  open,
  onOpenChange,
  enabled,
  onToggle,
}: TwoFactorDialogProps) {
  const [code, setCode] = useState("");

  const handleEnable = () => {
    // Simulated 2FA - in a real app, this would integrate with an authenticator
    if (code.length === 6) {
      onToggle(true);
      toast.success("Verificación en dos pasos activada");
      onOpenChange(false);
      setCode("");
    }
  };

  const handleDisable = () => {
    onToggle(false);
    toast.success("Verificación en dos pasos desactivada");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Verificación en Dos Pasos</DialogTitle>
          <DialogDescription>
            {enabled 
              ? "La verificación en dos pasos está actualmente habilitada."
              : "Añade una capa extra de seguridad a tu aplicación."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!enabled ? (
            <>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Nota:</strong> Esta es una simulación de 2FA para demostración. 
                  En una implementación real, se integraría con una aplicación de autenticación 
                  como Google Authenticator o Authy.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>Código de Verificación (Simulado)</Label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Ingresa 6 dígitos"
                  className="text-center text-xl tracking-widest"
                  inputMode="numeric"
                />
                <p className="text-xs text-muted-foreground">
                  Para esta demo, ingresa cualquier código de 6 dígitos.
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Tu cuenta tiene una capa adicional de protección.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          {enabled ? (
            <Button variant="destructive" onClick={handleDisable}>
              Desactivar 2FA
            </Button>
          ) : (
            <Button onClick={handleEnable} disabled={code.length !== 6}>
              Activar 2FA
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
