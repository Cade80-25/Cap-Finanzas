import { useState } from "react";
import { Bell, Check, CheckCheck, Trash2, X, AlertTriangle, Info, CheckCircle, AlertCircle, Mail, Phone, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const getNotificationIcon = (type: Notification["type"]) => {
  switch (type) {
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-warning" />;
    case "success":
      return <CheckCircle className="h-4 w-4 text-success" />;
    case "error":
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    default:
      return <Info className="h-4 w-4 text-primary" />;
  }
};

const getCategoryLabel = (category: Notification["category"]) => {
  switch (category) {
    case "presupuesto":
      return "Presupuesto";
    case "pago":
      return "Pago";
    case "resumen":
      return "Resumen";
    default:
      return "Sistema";
  }
};

export function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    settings,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    updateSettings,
  } = useNotifications();

  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState(settings);

  const handleOpenSettings = () => {
    setLocalSettings(settings);
    setSettingsOpen(true);
  };

  const handleSaveSettings = () => {
    updateSettings(localSettings);
    toast.success("Configuración de notificaciones guardada");
    setSettingsOpen(false);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0" align="end">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <h3 className="font-semibold">Notificaciones</h3>
              {unreadCount > 0 && (
                <Badge variant="secondary">{unreadCount} nuevas</Badge>
              )}
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleOpenSettings}
                title="Configuración"
              >
                <Settings className="h-4 w-4" />
              </Button>
              {notifications.length > 0 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={markAllAsRead}
                    title="Marcar todas como leídas"
                  >
                    <CheckCheck className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={clearAll}
                    title="Eliminar todas"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          <ScrollArea className="max-h-[400px]">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
                <Bell className="h-12 w-12 mb-2 opacity-50" />
                <p>No hay notificaciones</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-muted/50 transition-colors ${
                      !notification.read ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-sm">
                              {notification.title}
                            </p>
                            <Badge variant="outline" className="text-xs mt-1">
                              {getCategoryLabel(notification.category)}
                            </Badge>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => markAsRead(notification.id)}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => deleteNotification(notification.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {notifications.length > 0 && (
            <div className="p-2 border-t">
              <p className="text-xs text-center text-muted-foreground">
                Mostrando {notifications.length} notificaciones
              </p>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Dialog de configuración */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configuración de Notificaciones</DialogTitle>
            <DialogDescription>
              Configura cómo y dónde recibir notificaciones
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Notificaciones en la App */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-primary" />
                <div>
                  <Label>Notificaciones en la App</Label>
                  <p className="text-xs text-muted-foreground">
                    Mostrar notificaciones dentro del programa
                  </p>
                </div>
              </div>
              <Switch
                checked={localSettings.enableInApp}
                onCheckedChange={(checked) =>
                  setLocalSettings((prev) => ({ ...prev, enableInApp: checked }))
                }
              />
            </div>

            <Separator />

            {/* Notificaciones por Email */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <Label>Notificaciones por Email</Label>
                    <p className="text-xs text-muted-foreground">
                      Recibir alertas en tu correo electrónico
                    </p>
                  </div>
                </div>
                <Switch
                  checked={localSettings.enableEmail}
                  onCheckedChange={(checked) =>
                    setLocalSettings((prev) => ({ ...prev, enableEmail: checked }))
                  }
                />
              </div>
              {localSettings.enableEmail && (
                <div className="ml-8">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={localSettings.email}
                    onChange={(e) =>
                      setLocalSettings((prev) => ({ ...prev, email: e.target.value }))
                    }
                  />
                </div>
              )}
            </div>

            <Separator />

            {/* Notificaciones por SMS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary" />
                  <div>
                    <Label>Notificaciones por SMS</Label>
                    <p className="text-xs text-muted-foreground">
                      Recibir mensajes de texto importantes
                    </p>
                  </div>
                </div>
                <Switch
                  checked={localSettings.enableSMS}
                  onCheckedChange={(checked) =>
                    setLocalSettings((prev) => ({ ...prev, enableSMS: checked }))
                  }
                />
              </div>
              {localSettings.enableSMS && (
                <div className="ml-8">
                  <Label htmlFor="phone">Número de Celular</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1234567890"
                    value={localSettings.phone}
                    onChange={(e) =>
                      setLocalSettings((prev) => ({ ...prev, phone: e.target.value }))
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Incluye el código de país (ej: +54 para Argentina)
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveSettings}>Guardar Configuración</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
