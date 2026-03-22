import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CalendarEvent, ReminderPreferences } from "@/hooks/useCalendarEvents";
import { Bell, Mail, Smartphone } from "lucide-react";

interface CalendarEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (event: Omit<CalendarEvent, "id" | "createdAt">) => void;
  onDelete?: () => void;
  initialDate?: string;
  editEvent?: CalendarEvent | null;
  eventColors: string[];
  preferences: ReminderPreferences;
}

const REMINDER_OPTIONS = [
  { value: "5", label: "5 minutos antes" },
  { value: "10", label: "10 minutos antes" },
  { value: "15", label: "15 minutos antes" },
  { value: "30", label: "30 minutos antes" },
  { value: "60", label: "1 hora antes" },
  { value: "120", label: "2 horas antes" },
  { value: "1440", label: "1 día antes" },
];

export function CalendarEventDialog({
  open,
  onOpenChange,
  onSave,
  onDelete,
  initialDate,
  editEvent,
  eventColors,
  preferences,
}: CalendarEventDialogProps) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(eventColors[0]);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [minutesBefore, setMinutesBefore] = useState("15");
  const [methods, setMethods] = useState<("app" | "email")[]>(["app"]);

  useEffect(() => {
    if (editEvent) {
      setTitle(editEvent.title);
      setDate(editEvent.date);
      setTime(editEvent.time);
      setDescription(editEvent.description);
      setColor(editEvent.color);
      setReminderEnabled(editEvent.reminder.enabled);
      setMinutesBefore(String(editEvent.reminder.minutesBefore));
      setMethods(editEvent.reminder.methods);
    } else {
      setTitle("");
      setDate(initialDate || new Date().toISOString().slice(0, 10));
      setTime("09:00");
      setDescription("");
      setColor(eventColors[0]);
      setReminderEnabled(preferences.defaultMethod.length > 0);
      setMinutesBefore(String(preferences.defaultMinutesBefore));
      setMethods(preferences.defaultMethod.length > 0 ? preferences.defaultMethod : ["app"]);
    }
  }, [open, editEvent, initialDate, eventColors, preferences]);

  const toggleMethod = (method: "app" | "email" | "sms") => {
    setMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]
    );
  };

  const handleSave = () => {
    if (!title.trim() || !date) return;

    // Validate email/phone if those methods are selected
    if (methods.includes("email") && !preferences.email) {
      return;
    }
    if (methods.includes("sms") && !preferences.phone) {
      return;
    }

    onSave({
      title: title.trim(),
      date,
      time,
      description: description.trim(),
      color,
      reminder: {
        enabled: reminderEnabled,
        minutesBefore: parseInt(minutesBefore),
        methods: reminderEnabled ? methods : [],
      },
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editEvent ? "Editar Evento" : "Nuevo Evento"}</DialogTitle>
          <DialogDescription>
            {editEvent
              ? "Modifica los detalles de tu evento"
              : "Crea un evento con recordatorio personalizado"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="event-title">Título *</Label>
            <Input
              id="event-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Pagar renta, Reunión..."
              autoFocus
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="event-date">Fecha *</Label>
              <Input
                id="event-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-time">Hora</Label>
              <Input
                id="event-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="event-desc">Descripción</Label>
            <Textarea
              id="event-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles adicionales..."
              rows={2}
            />
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2">
              {eventColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`h-8 w-8 rounded-full transition-all ${
                    color === c ? "ring-2 ring-offset-2 ring-primary scale-110" : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          {/* Reminder */}
          <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <Label htmlFor="reminder-toggle" className="font-semibold cursor-pointer">
                  Recordatorio
                </Label>
              </div>
              <Switch
                id="reminder-toggle"
                checked={reminderEnabled}
                onCheckedChange={setReminderEnabled}
              />
            </div>

            {reminderEnabled && (
              <div className="space-y-3 animate-fade-in">
                {/* When */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">¿Cuándo avisar?</Label>
                  <Select value={minutesBefore} onValueChange={setMinutesBefore}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REMINDER_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Methods */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">¿Cómo notificarte?</Label>
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
                  </div>

                  {methods.includes("email") && !preferences.email && (
                    <p className="text-xs text-destructive">
                      ⚠️ Configura tu email en Preferencias de Recordatorio
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {editEvent && onDelete && (
            <Button variant="destructive" onClick={onDelete} className="sm:mr-auto">
              Eliminar
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!title.trim() || !date}>
            {editEvent ? "Guardar" : "Crear Evento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
