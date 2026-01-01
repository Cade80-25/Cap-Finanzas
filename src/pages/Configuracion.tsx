import { Database, Bell, Shield, Download, Upload, Palette, Zap, RefreshCw, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { useAutoUpdater } from "@/hooks/useAutoUpdater";

const STORAGE_KEY = "cap-finanzas-config";

interface ConfigData {
  fontSize: string;
  animations: boolean;
  pushNotifications: boolean;
  budgetAlerts: boolean;
  paymentReminders: boolean;
  monthlySummary: boolean;
  autoLock: boolean;
  twoFactor: boolean;
  autoBackup: boolean;
  devMode: boolean;
  dataLogging: boolean;
  autoSync: boolean;
  betaFeatures: boolean;
  autoUpdates: boolean;
  exportFormat: string;
}

const defaultConfig: ConfigData = {
  fontSize: "medium",
  animations: true,
  pushNotifications: true,
  budgetAlerts: true,
  paymentReminders: true,
  monthlySummary: false,
  autoLock: true,
  twoFactor: false,
  autoBackup: true,
  devMode: false,
  dataLogging: false,
  autoSync: false,
  betaFeatures: false,
  autoUpdates: true,
  exportFormat: "json",
};

const loadConfig = (): ConfigData => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...defaultConfig, ...JSON.parse(saved) } : defaultConfig;
  } catch {
    return defaultConfig;
  }
};

export default function Configuracion() {
  const { theme, setTheme } = useTheme();
  const [config, setConfig] = useState<ConfigData>(loadConfig);
  
  const updateConfig = (updates: Partial<ConfigData>) => {
    setConfig(prev => {
      const newConfig = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
      return newConfig;
    });
  };
  
  const {
    updateAvailable,
    updateInfo,
    downloading,
    downloadProgress,
    updateReady,
    checkForUpdates,
    downloadUpdate,
    installUpdate,
  } = useAutoUpdater();

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
              <Select value={config.exportFormat} onValueChange={(value) => updateConfig({ exportFormat: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON (Cap Finanzas)</SelectItem>
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
                <strong>Formatos compatibles:</strong> Cap Finanzas JSON, Personal Finances, 
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
              <Switch checked={config.pushNotifications} onCheckedChange={(checked) => {
                updateConfig({ pushNotifications: checked });
                toast.success(checked ? "Notificaciones activadas" : "Notificaciones desactivadas");
              }} />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Alertas de Presupuesto</Label>
                <p className="text-xs text-muted-foreground">
                  Avisar cuando excedas el 80% del límite
                </p>
              </div>
              <Switch checked={config.budgetAlerts} onCheckedChange={(checked) => {
                updateConfig({ budgetAlerts: checked });
                toast.success(checked ? "Alertas activadas" : "Alertas desactivadas");
              }} />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Recordatorios de Pago</Label>
                <p className="text-xs text-muted-foreground">
                  Recordar pagos pendientes
                </p>
              </div>
              <Switch checked={config.paymentReminders} onCheckedChange={(checked) => {
                updateConfig({ paymentReminders: checked });
                toast.success(checked ? "Recordatorios activados" : "Recordatorios desactivados");
              }} />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Resumen Mensual</Label>
                <p className="text-xs text-muted-foreground">
                  Enviar resumen al final del mes
                </p>
              </div>
              <Switch checked={config.monthlySummary} onCheckedChange={(checked) => {
                updateConfig({ monthlySummary: checked });
                toast.success(checked ? "Resumen mensual activado" : "Resumen mensual desactivado");
              }} />
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
              <Select value={theme} onValueChange={setTheme}>
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
              <Select value={config.fontSize} onValueChange={(value) => {
                updateConfig({ fontSize: value });
                toast.success("Tamaño de fuente actualizado");
              }}>
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
              <Switch checked={config.animations} onCheckedChange={(checked) => {
                updateConfig({ animations: checked });
                toast.success(checked ? "Animaciones habilitadas" : "Animaciones deshabilitadas");
              }} />
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
              <Switch checked={config.autoLock} onCheckedChange={(checked) => {
                updateConfig({ autoLock: checked });
                toast.success(checked ? "Bloqueo automático activado" : "Bloqueo automático desactivado");
              }} />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Verificación en Dos Pasos</Label>
                <p className="text-xs text-muted-foreground">
                  Seguridad adicional al iniciar sesión
                </p>
              </div>
              <Switch checked={config.twoFactor} onCheckedChange={(checked) => {
                updateConfig({ twoFactor: checked });
                toast.success(checked ? "Verificación activada" : "Verificación desactivada");
              }} />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Backup Automático</Label>
                <p className="text-xs text-muted-foreground">
                  Copia de seguridad diaria en la nube
                </p>
              </div>
              <Switch checked={config.autoBackup} onCheckedChange={(checked) => {
                updateConfig({ autoBackup: checked });
                toast.success(checked ? "Backup automático activado" : "Backup automático desactivado");
              }} />
            </div>

            <Separator />

            <Button variant="outline" className="w-full">
              Cambiar Contraseña Maestra
            </Button>
          </CardContent>
        </Card>

        {/* Sección de Actualizaciones - Solo visible en Electron */}
        {typeof window !== 'undefined' && window.electron && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Actualizaciones
              </CardTitle>
              <CardDescription>
                Gestiona las actualizaciones de la aplicación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!updateAvailable && !updateReady && (
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Versión actual</Label>
                    <p className="text-xs text-muted-foreground">
                      La aplicación está actualizada
                    </p>
                  </div>
                  <Button onClick={checkForUpdates} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Buscar actualizaciones
                  </Button>
                </div>
              )}

              {updateAvailable && !downloading && !updateReady && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-primary">¡Nueva versión disponible!</Label>
                      <p className="text-xs text-muted-foreground">
                        Versión {updateInfo?.version} lista para descargar
                      </p>
                    </div>
                    <Button onClick={downloadUpdate} size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Descargar
                    </Button>
                  </div>
                </div>
              )}

              {downloading && (
                <div className="space-y-3">
                  <div className="space-y-0.5">
                    <Label>Descargando actualización...</Label>
                    <p className="text-xs text-muted-foreground">
                      {downloadProgress}% completado
                    </p>
                  </div>
                  <Progress value={downloadProgress} className="h-2" />
                </div>
              )}

              {updateReady && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        Actualización lista
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        La versión {updateInfo?.version} está lista para instalar
                      </p>
                    </div>
                    <Button onClick={installUpdate} size="sm">
                      Instalar y reiniciar
                    </Button>
                  </div>
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Actualizaciones automáticas</Label>
                  <p className="text-xs text-muted-foreground">
                    Buscar actualizaciones al iniciar
                  </p>
                </div>
              <Switch checked={config.autoUpdates} onCheckedChange={(checked) => {
                updateConfig({ autoUpdates: checked });
                toast.success(checked ? "Actualizaciones automáticas activadas" : "Actualizaciones automáticas desactivadas");
              }} />
              </div>
            </CardContent>
          </Card>
        )}

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
                <Switch checked={config.betaFeatures} onCheckedChange={(checked) => {
                  updateConfig({ betaFeatures: checked });
                  toast.success(checked ? "Beta features activadas" : "Beta features desactivadas");
                }} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Logging de Datos</Label>
                  <p className="text-xs text-muted-foreground">
                    Registrar actividad para debugging
                  </p>
                </div>
                <Switch checked={config.autoSync} onCheckedChange={(checked) => {
                  updateConfig({ autoSync: checked });
                  toast.success(checked ? "Sincronización activada" : "Sincronización desactivada");
                }} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sincronización Automática</Label>
                  <p className="text-xs text-muted-foreground">
                    Sincronizar con servicios externos
                  </p>
                </div>
                <Switch checked={config.devMode} onCheckedChange={(checked) => {
                  updateConfig({ devMode: checked });
                  toast.success(checked ? "Modo desarrollador activado" : "Modo desarrollador desactivado");
                }} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Beta Features</Label>
                  <p className="text-xs text-muted-foreground">
                    Acceder a funciones experimentales
                  </p>
                </div>
                <Switch checked={config.dataLogging} onCheckedChange={(checked) => {
                  updateConfig({ dataLogging: checked });
                  toast.success(checked ? "Logging activado" : "Logging desactivado");
                }} />
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
