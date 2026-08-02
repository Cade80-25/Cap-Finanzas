import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  AlertCircle, 
  Trash2, 
  Download, 
  RefreshCw,
  Info,
  AlertTriangle,
  XCircle,
  MousePointer,
  Filter
} from "lucide-react";
import { toast } from "sonner";

interface LogEntry {
  id: string;
  timestamp: string;
  type: "info" | "warn" | "error" | "action";
  category: string;
  message: string;
  data?: any;
}

interface LogsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  logs: LogEntry[];
  onClearLogs: () => void;
  onExportLogs: () => void;
  stats: {
    totalLogs: number;
    errorCount: number;
    warnCount: number;
    actionCount: number;
    categories: string[];
  };
}

export function LogsDialog({
  open,
  onOpenChange,
  logs,
  onClearLogs,
  onExportLogs,
  stats,
}: LogsDialogProps) {
  const [filter, setFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const filteredLogs = logs.filter(log => {
    if (filter !== "all" && log.type !== filter) return false;
    if (categoryFilter !== "all" && log.category !== categoryFilter) return false;
    return true;
  });

  const getTypeIcon = (type: LogEntry["type"]) => {
    switch (type) {
      case "info": return <Info className="h-3 w-3 text-blue-500" />;
      case "warn": return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
      case "error": return <XCircle className="h-3 w-3 text-red-500" />;
      case "action": return <MousePointer className="h-3 w-3 text-green-500" />;
    }
  };

  const getTypeBadge = (type: LogEntry["type"]) => {
    const variants: Record<LogEntry["type"], string> = {
      info: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      warn: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
      error: "bg-red-500/10 text-red-600 border-red-500/20",
      action: "bg-green-500/10 text-green-600 border-green-500/20",
    };
    return variants[type];
  };

  const handleClear = () => {
    onClearLogs();
    toast.success("Logs eliminados");
  };

  const handleExport = () => {
    onExportLogs();
    toast.success("Logs exportados");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Registro de Actividad</DialogTitle>
          <DialogDescription>
            Historial de acciones y eventos del sistema
          </DialogDescription>
        </DialogHeader>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="rounded-lg bg-muted p-2">
            <p className="text-lg font-bold">{stats.totalLogs}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="rounded-lg bg-red-500/10 p-2">
            <p className="text-lg font-bold text-red-600">{stats.errorCount}</p>
            <p className="text-xs text-muted-foreground">Errores</p>
          </div>
          <div className="rounded-lg bg-yellow-500/10 p-2">
            <p className="text-lg font-bold text-yellow-600">{stats.warnCount}</p>
            <p className="text-xs text-muted-foreground">Avisos</p>
          </div>
          <div className="rounded-lg bg-green-500/10 p-2">
            <p className="text-lg font-bold text-green-600">{stats.actionCount}</p>
            <p className="text-xs text-muted-foreground">Acciones</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="h-8">
                <Filter className="h-3 w-3 mr-2" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warn">Avisos</SelectItem>
                <SelectItem value="error">Errores</SelectItem>
                <SelectItem value="action">Acciones</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {stats.categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Logs */}
        <ScrollArea className="h-[300px] rounded-md border">
          {filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              No hay registros disponibles
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredLogs.map((log) => (
                <div 
                  key={log.id} 
                  className="text-xs p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    {getTypeIcon(log.type)}
                    <Badge 
                      variant="outline" 
                      className={`text-[10px] px-1 py-0 ${getTypeBadge(log.type)}`}
                    >
                      {log.type.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] px-1 py-0">
                      {log.category}
                    </Badge>
                    <span className="text-muted-foreground ml-auto">
                      {new Date(log.timestamp).toLocaleString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                  </div>
                  <p className="text-foreground">{log.message}</p>
                  {log.data && (
                    <pre className="mt-1 text-[10px] text-muted-foreground bg-background/50 p-1 rounded overflow-x-auto">
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="destructive" size="sm" onClick={handleClear} className="sm:mr-auto">
            <Trash2 className="h-4 w-4 mr-2" />
            Limpiar Logs
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface SyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  syncStatus: "idle" | "syncing" | "success" | "error";
  lastSyncTime: string | null;
  syncInterval: number;
  autoSync: boolean;
  onSync: () => Promise<boolean>;
  onSetSyncInterval: (seconds: number) => void;
}

export function SyncDialog({
  open,
  onOpenChange,
  syncStatus,
  lastSyncTime,
  syncInterval,
  autoSync,
  onSync,
  onSetSyncInterval,
}: SyncDialogProps) {
  const handleSync = async () => {
    const success = await onSync();
    if (success) {
      toast.success("Sincronización completada");
    } else {
      toast.error("Error al sincronizar");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sincronización de Datos</DialogTitle>
          <DialogDescription>
            Gestiona la sincronización de tus datos locales
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Sync Status */}
          <div className="rounded-lg bg-muted p-4 text-center">
            {syncStatus === "idle" && (
              <>
                <RefreshCw className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">Listo para sincronizar</p>
              </>
            )}
            {syncStatus === "syncing" && (
              <>
                <RefreshCw className="h-8 w-8 mx-auto mb-2 text-primary animate-spin" />
                <p className="text-sm font-medium">Sincronizando...</p>
              </>
            )}
            {syncStatus === "success" && (
              <>
                <div className="h-8 w-8 mx-auto mb-2 rounded-full bg-green-500/20 flex items-center justify-center">
                  <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-green-600">¡Sincronización exitosa!</p>
              </>
            )}
            {syncStatus === "error" && (
              <>
                <XCircle className="h-8 w-8 mx-auto mb-2 text-red-500" />
                <p className="text-sm font-medium text-red-600">Error al sincronizar</p>
              </>
            )}
          </div>

          {lastSyncTime && (
            <div className="text-center text-sm text-muted-foreground">
              Última sincronización: {new Date(lastSyncTime).toLocaleString("es-ES", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </div>
          )}

          <Separator />

          {/* Sync Interval */}
          <div className="space-y-2">
            <Label>Intervalo de sincronización automática</Label>
            <Select 
              value={String(syncInterval)} 
              onValueChange={(v) => onSetSyncInterval(parseInt(v))}
              disabled={!autoSync}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">Cada 15 segundos</SelectItem>
                <SelectItem value="30">Cada 30 segundos</SelectItem>
                <SelectItem value="60">Cada 1 minuto</SelectItem>
                <SelectItem value="300">Cada 5 minutos</SelectItem>
                <SelectItem value="600">Cada 10 minutos</SelectItem>
              </SelectContent>
            </Select>
            {!autoSync && (
              <p className="text-xs text-muted-foreground">
                Activa la sincronización automática para configurar el intervalo
              </p>
            )}
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Nota:</strong> La sincronización guarda tus datos localmente. 
              Para respaldo en la nube, usa la función de backup en Seguridad y Privacidad.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button onClick={handleSync} disabled={syncStatus === "syncing"}>
            <RefreshCw className={`h-4 w-4 mr-2 ${syncStatus === "syncing" ? "animate-spin" : ""}`} />
            Sincronizar Ahora
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ResetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReset: () => void;
}

export function ResetDialog({
  open,
  onOpenChange,
  onReset,
}: ResetDialogProps) {
  const [confirmText, setConfirmText] = useState("");

  const handleReset = () => {
    if (confirmText === "ELIMINAR") {
      onReset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) setConfirmText("");
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-red-600">⚠️ Restablecer Aplicación</DialogTitle>
          <DialogDescription>
            Esta acción eliminará TODOS tus datos permanentemente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>¡ADVERTENCIA!</strong> Esta acción no se puede deshacer. 
              Todos tus datos, transacciones, configuraciones y backups serán eliminados permanentemente.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label>Escribe ELIMINAR para confirmar:</Label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="ELIMINAR"
              className="w-full px-3 py-2 border rounded-md text-center font-mono uppercase"
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="sm:mr-auto">
            Cancelar
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleReset}
            disabled={confirmText !== "ELIMINAR"}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar Todo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
