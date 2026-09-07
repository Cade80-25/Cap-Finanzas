import { useState } from "react";
import { Shield, Lock, Clock, Save, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSecurity } from "@/hooks/useSecurity";
import { hashPinPBKDF2 } from "@/lib/crypto";
import { toast } from "sonner";

export default function Seguridad() {
  const { settings, setSettings, lock } = useSecurity();

  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [saving, setSaving] = useState(false);

  const hasPin = !!settings.masterPin;

  const handleSetPin = async () => {
    if (hasPin && !currentPin) {
      toast.error("Ingresa tu PIN actual");
      return;
    }
    if (newPin.length < 4) {
      toast.error("El PIN debe tener al menos 4 dígitos");
      return;
    }
    if (newPin !== confirmPin) {
      toast.error("Los PINs no coinciden");
      return;
    }

    setSaving(true);
    try {
      const hashed = await hashPinPBKDF2(newPin);
      setSettings((prev) => ({ ...prev, masterPin: hashed }));
      toast.success(hasPin ? "PIN actualizado correctamente" : "PIN configurado correctamente");
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
    } catch {
      toast.error("Error al guardar el PIN");
    }
    setSaving(false);
  };

  const handleRemovePin = () => {
    setSettings((prev) => ({ ...prev, masterPin: null }));
    toast.success("PIN eliminado");
  };

  const handleLockNow = () => {
    if (hasPin) {
      lock();
    }
  };

  return (
    <div className="space-y-4">
      {/* Configurar PIN */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            {hasPin ? "Cambiar PIN" : "Configurar PIN"}
          </CardTitle>
          <CardDescription>
            Protege el acceso a tu aplicación con un PIN de 4+ dígitos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasPin && (
            <div className="space-y-2">
              <Label htmlFor="currentPin">PIN actual</Label>
              <div className="relative">
                <Input
                  id="currentPin"
                  type={showCurrentPin ? "text" : "password"}
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Ingresa tu PIN actual"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPin(!showCurrentPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showCurrentPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="newPin">{hasPin ? "Nuevo PIN" : "PIN"}</Label>
            <div className="relative">
              <Input
                id="newPin"
                type={showNewPin ? "text" : "password"}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Mínimo 4 dígitos"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPin(!showNewPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showNewPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPin">Confirmar PIN</Label>
            <Input
              id="confirmPin"
              type={showNewPin ? "text" : "password"}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="Repite el PIN"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSetPin} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              {hasPin ? "Actualizar PIN" : "Guardar PIN"}
            </Button>
            {hasPin && (
              <Button variant="destructive" onClick={handleRemovePin}>
                Eliminar PIN
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Auto-lock */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Bloqueo Automático
          </CardTitle>
          <CardDescription>
            Bloquea la app automáticamente después de un período de inactividad
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="autoLock">Activar bloqueo automático</Label>
            <Switch
              id="autoLock"
              checked={settings.autoLockEnabled}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, autoLockEnabled: checked }))
              }
            />
          </div>
          {settings.autoLockEnabled && (
            <div className="space-y-2">
              <Label>Tiempo de inactividad</Label>
              <div className="flex gap-2">
                {[1, 5, 10, 15, 30].map((min) => (
                  <Button
                    key={min}
                    variant={settings.autoLockMinutes === min ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      setSettings((prev) => ({ ...prev, autoLockMinutes: min }))
                    }
                  >
                    {min} min
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Acciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Acciones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {hasPin ? (
            <Alert>
              <CheckCircle className="h-4 w-4 text-success" />
              <AlertDescription>
                La protección por PIN está activa. La app se bloqueará al iniciar o después de {settings.autoLockMinutes} minutos de inactividad.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Sin PIN. Tu app no está protegida.
              </AlertDescription>
            </Alert>
          )}
          {hasPin && (
            <Button variant="outline" onClick={handleLockNow} className="gap-2">
              <Lock className="h-4 w-4" />
              Bloquear ahora
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
