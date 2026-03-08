import { Bell, Check, CheckCheck, Trash2, AlertTriangle, Info, CheckCircle, AlertCircle, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Mail, Phone } from "lucide-react";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";

const getNotificationIcon = (type: Notification["type"]) => {
  switch (type) {
    case "warning":
      return <AlertTriangle className="h-5 w-5 text-warning" />;
    case "success":
      return <CheckCircle className="h-5 w-5 text-success" />;
    case "error":
      return <AlertCircle className="h-5 w-5 text-destructive" />;
    default:
      return <Info className="h-5 w-5 text-primary" />;
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

export default function Notificaciones() {
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
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div data-tutorial="notificaciones-title">
          <h1 className="text-3xl font-bold mb-2">Centro de Notificaciones</h1>
          <p className="text-muted-foreground">
            Gestiona todas tus alertas y avisos del sistema
          </p>
        </div>
        <div data-tutorial="notificaciones-actions" className="flex gap-2">
          <Button variant="outline" onClick={handleOpenSettings}>
            <Settings className="h-4 w-4 mr-2" />
            Configuración
          </Button>
          {notifications.length > 0 && (
            <>
              <Button variant="outline" onClick={markAllAsRead}>
                <CheckCheck className="h-4 w-4 mr-2" />
                Marcar todas leídas
              </Button>
              <Button variant="outline" onClick={clearAll}>
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar todas
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Resumen */}
      <div data-tutorial="notificaciones-stats" className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications.length}</div>
            <p className="text-xs text-muted-foreground">notificaciones</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sin Leer</CardTitle>
            <AlertCircle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{unreadCount}</div>
            <p className="text-xs text-muted-foreground">pendientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Leídas</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{notifications.length - unreadCount}</div>
            <p className="text-xs text-muted-foreground">revisadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de notificaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Todas las Notificaciones</CardTitle>
          <CardDescription>
            Historial completo de alertas y avisos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">No hay notificaciones</p>
              <p className="text-sm">Las alertas aparecerán aquí</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    !notification.read ? "bg-primary/5 border-primary/20" : "bg-card hover:bg-muted/50"
                  }`}
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold">{notification.title}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline">{getCategoryLabel(notification.category)}</Badge>
                            {!notification.read && (
                              <Badge variant="secondary">Nueva</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-muted-foreground mt-2">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-3">
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
        </CardContent>
      </Card>

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
    </div>
  );
}
