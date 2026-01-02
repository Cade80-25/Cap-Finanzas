import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LockScreenProps {
  onUnlock: (pin: string) => boolean;
}

export function LockScreen({ onUnlock }: LockScreenProps) {
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (onUnlock(pin)) {
      setPin("");
      setError(false);
      setAttempts(0);
    } else {
      setError(true);
      setAttempts(prev => prev + 1);
      setPin("");
    }
  };

  const handlePinChange = (value: string) => {
    // Only allow numbers, max 6 digits
    const cleaned = value.replace(/\D/g, "").slice(0, 6);
    setPin(cleaned);
    setError(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Cap Finanzas Bloqueado</CardTitle>
          <CardDescription>
            Ingresa tu PIN para desbloquear la aplicación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pin">PIN de Seguridad</Label>
              <div className="relative">
                <Input
                  id="pin"
                  type={showPin ? "text" : "password"}
                  value={pin}
                  onChange={(e) => handlePinChange(e.target.value)}
                  placeholder="Ingresa tu PIN de 4-6 dígitos"
                  className="pr-10 text-center text-2xl tracking-widest"
                  autoFocus
                  inputMode="numeric"
                  pattern="[0-9]*"
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

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  PIN incorrecto. {attempts >= 3 && "Intenta recordar tu PIN cuidadosamente."}
                </AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={pin.length < 4}
            >
              Desbloquear
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Si olvidaste tu PIN, deberás restablecer la aplicación desde la configuración del sistema.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
