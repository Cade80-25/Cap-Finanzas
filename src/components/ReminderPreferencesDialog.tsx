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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReminderPreferences } from "@/hooks/useCalendarEvents";
import { Mail, Settings, Smartphone } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface ReminderPreferencesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preferences: ReminderPreferences;
  onSave: (prefs: Partial<ReminderPreferences>) => void;
}

const REMINDER_OPTIONS = [
  { value: "5", label: "5 minutos" },
  { value: "10", label: "10 minutos" },
  { value: "15", label: "15 minutos" },
  { value: "30", label: "30 minutos" },
  { value: "60", label: "1 hora" },
  { value: "1440", label: "1 día" },
];

export function ReminderPreferencesDialog({
  open,
  onOpenChange,
  preferences,
  onSave,
}: ReminderPreferencesDialogProps) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [methods, setMethods] = useState<("app" | "email" | "sms")[]>(["app"]);
  const [minutesBefore, setMinutesBefore] = useState("15");

  useEffect(() => {
    if (open) {
      setEmail(preferences.email);
      setPhone(preferences.phone);
      setMethods(preferences.defaultMethod);
      setMinutesBefore(String(preferences.defaultMinutesBefore));
    }
  }, [open, preferences]);

  const toggleMethod = (method: "app" | "email" | "sms") => {
    setMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]
    );
  };

  const handleSave = () => {
    if (methods.includes("email") && !email.trim()) {
      toast.error("Ingresa tu email para recibir recordatorios por correo");
      return;
    }
    if (methods.includes("sms") && !phone.trim()) {
      toast.error("Ingresa tu teléfono para recibir recordatorios por SMS");
      return;
    }

    onSave({
      email: email.trim(),
      phone: phone.trim(),
      defaultMethod: methods,
      defaultMinutesBefore: parseInt(minutesBefore),
    });
    toast.success("Preferencias guardadas");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Preferencias de Recordatorio
          </DialogTitle>
          <DialogDescription>
            Configura cómo y dónde recibir tus recordatorios
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Contact info */}
          <div className="space-y-2">
            <Label htmlFor="pref-email" className="flex items-center gap-1">
              <Mail className="h-3 w-3" /> Correo electrónico
            </Label>
            <Input
              id="pref-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pref-phone" className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" /> Teléfono (con código de país)
            </Label>
            <Input
              id="pref-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555 123 4567"
            />
            <p className="text-xs text-muted-foreground">
              Formato internacional: +1 para EE.UU., +52 para México, etc.
            </p>
          </div>

          {/* Default methods */}
          <div className="space-y-2">
            <Label>Métodos predeterminados</Label>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={methods.includes("app") ? "default" : "outline"}
                className="cursor-pointer gap-1"
                onClick={() => toggleMethod("app")}
              >
                <Smartphone className="h-3 w-3" />
                En la App
              </Badge>
              <Badge
                variant={methods.includes("email") ? "default" : "outline"}
                className="cursor-pointer gap-1"
                onClick={() => toggleMethod("email")}
              >
                <Mail className="h-3 w-3" />
                Email
              </Badge>
              <Badge
                variant={methods.includes("sms") ? "default" : "outline"}
                className="cursor-pointer gap-1"
                onClick={() => toggleMethod("sms")}
              >
                <MessageSquare className="h-3 w-3" />
                SMS
              </Badge>
            </div>
          </div>

          {/* Default timing */}
          <div className="space-y-2">
            <Label>Tiempo predeterminado de aviso</Label>
            <Select value={minutesBefore} onValueChange={setMinutesBefore}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REMINDER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label} antes
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
