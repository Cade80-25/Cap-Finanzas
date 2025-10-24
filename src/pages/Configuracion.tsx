import { Settings, Database, Bell, Shield, Download, Upload, Palette, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function Configuracion() {
  const handleExport = () => {
    toast.success("Exportación iniciada", {
      description: "Tus datos se están exportando...",
    });
  };

  const handleImport = () => {
    toast.success("Importación iniciada", {
      description: "Se abrirá el diálogo de selección de archivo...",
    });
  };

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Configuración
        </h1>
        <p className="text-muted-foreground mt-2">
          Personaliza la aplicación según tus preferencias
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Gestión de Datos
            </CardTitle>
            <CardDescription>
              Importa y exporta tus datos financieros
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label>Formato de Exportación</Label>
              <Select defaultValue="json">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON (FinanzApp)</SelectItem>
                  <SelectItem value="csv">CSV (Excel)</SelectItem>
                  <SelectItem value="pf">Personal Finances (.pf)</SelectItem>
                  <SelectItem value="qif">Quicken (.qif)</SelectItem>
                  <SelectItem value="ofx">OFX/QFX (Banco)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex gap-2">
              <Button onClick={handleExport} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Exportar Datos
              </Button>
              <Button onClick={handleImport} variant="outline" className="flex-1">
                <Upload className="h-4 w-4 mr-2" />
                Importar Datos
              </Button>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Formatos compatibles:</strong> FinanzApp JSON, Personal Finances, 
                CSV, QIF, OFX/QFX
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificaciones
            </CardTitle>
            <CardDescription>
              Configura tus preferencias de notificaciones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificaciones Push</Label>
                <p className="text-xs text-muted-foreground">
                  Recibir notificaciones en tiempo real
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Alertas de Presupuesto</Label>
                <p className="text-xs text-muted-foreground">
                  Avisar cuando excedas el 80% del límite
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Recordatorios de Pago</Label>
                <p className="text-xs text-muted-foreground">
                  Recordar pagos pendientes
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Resumen Mensual</Label>
                <p className="text-xs text-muted-foreground">
                  Enviar resumen al final del mes
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Apariencia
            </CardTitle>
            <CardDescription>
              Personaliza la interfaz de la aplicación
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label>Tema</Label>
              <Select defaultValue="light">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Claro</SelectItem>
                  <SelectItem value="dark">Oscuro</SelectItem>
                  <SelectItem value="system">Sistema</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Tamaño de Fuente</Label>
              <Select defaultValue="medium">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Pequeño</SelectItem>
                  <SelectItem value="medium">Mediano</SelectItem>
                  <SelectItem value="large">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Animaciones</Label>
                <p className="text-xs text-muted-foreground">
                  Habilitar efectos de animación
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Seguridad y Privacidad
            </CardTitle>
            <CardDescription>
              Protege tu información financiera
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Bloqueo Automático</Label>
                <p className="text-xs text-muted-foreground">
                  Bloquear después de 5 minutos de inactividad
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Verificación en Dos Pasos</Label>
                <p className="text-xs text-muted-foreground">
                  Seguridad adicional al iniciar sesión
                </p>
              </div>
              <Switch />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Backup Automático</Label>
                <p className="text-xs text-muted-foreground">
                  Copia de seguridad diaria en la nube
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <Separator />

            <Button variant="outline" className="w-full">
              Cambiar Contraseña Maestra
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Funciones Avanzadas
            </CardTitle>
            <CardDescription>
              Opciones para usuarios experimentados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Modo Desarrollador</Label>
                  <p className="text-xs text-muted-foreground">
                    Habilitar opciones avanzadas
                  </p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Logging de Datos</Label>
                  <p className="text-xs text-muted-foreground">
                    Registrar actividad para debugging
                  </p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sincronización Automática</Label>
                  <p className="text-xs text-muted-foreground">
                    Sincronizar con servicios externos
                  </p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Beta Features</Label>
                  <p className="text-xs text-muted-foreground">
                    Acceder a funciones experimentales
                  </p>
                </div>
                <Switch />
              </div>
            </div>

            <Separator />

            <div className="flex gap-2">
              <Button variant="outline">Restaurar Configuración</Button>
              <Button variant="outline" className="text-destructive">
                Borrar Todos los Datos
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
