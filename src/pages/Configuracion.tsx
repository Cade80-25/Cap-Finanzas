import { Database, Bell, Shield, Download, Upload, Palette, Zap, RefreshCw, CheckCircle, FileText, FileSpreadsheet, File, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { useState, useRef } from "react";
import { useAutoUpdater } from "@/hooks/useAutoUpdater";
import { useLocalStorage } from "@/hooks/useLocalStorage";

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

type Transaction = {
  id: number;
  date: string;
  account: string;
  description: string;
  debit: number;
  credit: number;
};

export default function Configuracion() {
  const { theme, setTheme } = useTheme();
  const [config, setConfig] = useState<ConfigData>(loadConfig);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<Transaction[]>([]);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>(
    "cap-finanzas-libro-diario-transactions",
    []
  );
  
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

  // Función para exportar datos
  const handleExport = () => {
    const allData = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      transactions,
      presupuesto: JSON.parse(localStorage.getItem("cap-finanzas-presupuesto") || "[]"),
      transacciones: JSON.parse(localStorage.getItem("cap-finanzas-transacciones") || "[]"),
    };

    let content: string;
    let filename: string;
    let mimeType: string;

    if (config.exportFormat === "csv") {
      // Exportar como CSV
      const headers = ["Fecha", "Cuenta", "Descripción", "Debe", "Haber"];
      const rows = transactions.map(t => [
        t.date,
        t.account,
        `"${t.description.replace(/"/g, '""')}"`,
        t.debit.toString(),
        t.credit.toString()
      ]);
      content = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      filename = "cap-finanzas-export.csv";
      mimeType = "text/csv";
    } else if (config.exportFormat === "qif") {
      // Exportar como QIF (Quicken Interchange Format)
      const qifLines = ["!Type:Bank"];
      transactions.forEach(t => {
        qifLines.push(`D${t.date}`);
        qifLines.push(`T${t.debit > 0 ? t.debit : -t.credit}`);
        qifLines.push(`M${t.description}`);
        qifLines.push(`L${t.account}`);
        qifLines.push("^");
      });
      content = qifLines.join("\n");
      filename = "cap-finanzas-export.qif";
      mimeType = "application/qif";
    } else {
      // Exportar como JSON (default)
      content = JSON.stringify(allData, null, 2);
      filename = "cap-finanzas-export.json";
      mimeType = "application/json";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Exportación completada", {
      description: `Datos exportados a ${filename}`,
    });
  };

  // Función para parsear diferentes formatos de archivo
  const parseFile = async (file: File): Promise<Transaction[]> => {
    const text = await file.text();
    const extension = file.name.split('.').pop()?.toLowerCase();
    const parsedTransactions: Transaction[] = [];

    try {
      if (extension === "json") {
        const data = JSON.parse(text);
        if (data.transactions && Array.isArray(data.transactions)) {
          return data.transactions;
        } else if (Array.isArray(data)) {
          return data.map((item: any, index: number) => ({
            id: Date.now() + index,
            date: item.date || item.fecha || new Date().toISOString().slice(0, 10),
            account: item.account || item.cuenta || "otros",
            description: item.description || item.descripcion || "Importado",
            debit: parseFloat(item.debit || item.debe || 0),
            credit: parseFloat(item.credit || item.haber || 0),
          }));
        }
      } else if (extension === "csv") {
        const lines = text.split("\n").filter(line => line.trim());
        const hasHeader = lines[0].toLowerCase().includes("fecha") || 
                          lines[0].toLowerCase().includes("date") ||
                          lines[0].toLowerCase().includes("descripcion");
        const dataLines = hasHeader ? lines.slice(1) : lines;

        dataLines.forEach((line, index) => {
          const values = line.split(",").map(v => v.trim().replace(/^"|"$/g, ''));
          if (values.length >= 3) {
            const amount = parseFloat(values[3] || values[2] || "0");
            parsedTransactions.push({
              id: Date.now() + index,
              date: values[0] || new Date().toISOString().slice(0, 10),
              account: detectAccount(values[1] || values[2] || ""),
              description: values[1] || values[2] || "Importado CSV",
              debit: amount > 0 ? amount : 0,
              credit: amount < 0 ? Math.abs(amount) : 0,
            });
          }
        });
      } else if (extension === "qif") {
        let currentTx: Partial<Transaction> = {};
        const lines = text.split("\n");
        let txIndex = 0;

        lines.forEach(line => {
          const code = line[0];
          const value = line.slice(1).trim();

          switch (code) {
            case 'D': currentTx.date = parseQIFDate(value); break;
            case 'T': {
              const amount = parseFloat(value);
              currentTx.debit = amount > 0 ? amount : 0;
              currentTx.credit = amount < 0 ? Math.abs(amount) : 0;
              break;
            }
            case 'M': case 'P': currentTx.description = value; break;
            case 'L': currentTx.account = detectAccount(value); break;
            case '^': {
              if (currentTx.date) {
                parsedTransactions.push({
                  id: Date.now() + txIndex++,
                  date: currentTx.date,
                  account: currentTx.account || "otros",
                  description: currentTx.description || "Importado QIF",
                  debit: currentTx.debit || 0,
                  credit: currentTx.credit || 0,
                });
              }
              currentTx = {};
              break;
            }
          }
        });
      } else if (extension === "ofx" || extension === "qfx") {
        // Parser básico para OFX/QFX
        const stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
        let match;
        let txIndex = 0;

        while ((match = stmtTrnRegex.exec(text)) !== null) {
          const txBlock = match[1];
          const dtPosted = txBlock.match(/<DTPOSTED>(\d{8})/)?.[1];
          const trnAmt = txBlock.match(/<TRNAMT>([+-]?\d+\.?\d*)/)?.[1];
          const name = txBlock.match(/<NAME>([^<]+)/)?.[1];
          const memo = txBlock.match(/<MEMO>([^<]+)/)?.[1];

          if (dtPosted && trnAmt) {
            const amount = parseFloat(trnAmt);
            const date = `${dtPosted.slice(0, 4)}-${dtPosted.slice(4, 6)}-${dtPosted.slice(6, 8)}`;
            parsedTransactions.push({
              id: Date.now() + txIndex++,
              date,
              account: detectAccount(name || memo || ""),
              description: name || memo || "Importado OFX",
              debit: amount > 0 ? amount : 0,
              credit: amount < 0 ? Math.abs(amount) : 0,
            });
          }
        }
      }

      return parsedTransactions;
    } catch (error) {
      console.error("Error parsing file:", error);
      throw new Error("No se pudo leer el archivo. Verifica el formato.");
    }
  };

  // Detectar cuenta contable basado en descripción
  const detectAccount = (text: string): string => {
    const lower = text.toLowerCase();
    if (lower.includes("salario") || lower.includes("nómina") || lower.includes("sueldo")) return "ingresos";
    if (lower.includes("alquiler") || lower.includes("renta") || lower.includes("hipoteca")) return "gastos-operativos";
    if (lower.includes("supermercado") || lower.includes("mercado") || lower.includes("comida")) return "gastos-operativos";
    if (lower.includes("banco") || lower.includes("transferencia")) return "banco";
    if (lower.includes("efectivo") || lower.includes("cajero")) return "caja";
    if (lower.includes("factura") || lower.includes("servicio")) return "cuentas-por-pagar";
    if (lower.includes("venta") || lower.includes("cobro")) return "ingresos";
    if (lower.includes("compra") || lower.includes("pago")) return "gastos-operativos";
    if (lower.includes("interés") || lower.includes("comisión")) return "gastos-financieros";
    return "gastos-operativos";
  };

  // Parsear fecha QIF
  const parseQIFDate = (dateStr: string): string => {
    // Formato MM/DD/YYYY o MM-DD-YYYY o M/D/YY
    const parts = dateStr.split(/[\/\-]/);
    if (parts.length === 3) {
      let [month, day, year] = parts;
      if (year.length === 2) {
        year = parseInt(year) > 50 ? `19${year}` : `20${year}`;
      }
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return new Date().toISOString().slice(0, 10);
  };

  // Manejar selección de archivo
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validExtensions = ['json', 'csv', 'qif', 'ofx', 'qfx'];
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (!extension || !validExtensions.includes(extension)) {
      toast.error("Formato no soportado", {
        description: "Usa archivos JSON, CSV, QIF, OFX o QFX",
      });
      return;
    }

    setImporting(true);
    try {
      const parsed = await parseFile(file);
      if (parsed.length === 0) {
        toast.error("Sin datos", {
          description: "No se encontraron transacciones en el archivo",
        });
        setImporting(false);
        return;
      }
      setImportPreview(parsed);
      setImportDialogOpen(true);
    } catch (error: any) {
      toast.error("Error al importar", {
        description: error.message || "No se pudo procesar el archivo",
      });
    }
    setImporting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Confirmar importación
  const confirmImport = () => {
    const newTransactions = [...transactions, ...importPreview].sort((a, b) => 
      a.date.localeCompare(b.date)
    );
    setTransactions(newTransactions);
    setImportDialogOpen(false);
    setImportPreview([]);
    toast.success("Importación completada", {
      description: `Se importaron ${importPreview.length} transacciones al Libro Diario`,
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

      {/* Input oculto para seleccionar archivos */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".json,.csv,.qif,.ofx,.qfx"
        className="hidden"
      />

      {/* Dialog de preview de importación */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vista Previa de Importación</DialogTitle>
            <DialogDescription>
              Se encontraron {importPreview.length} transacciones. Revisa antes de importar.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Las transacciones se agregarán al Libro Diario y se reflejarán automáticamente en 
                Libro Mayor, Balance, Estado de Resultados y demás módulos.
              </AlertDescription>
            </Alert>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-left">Fecha</th>
                    <th className="p-2 text-left">Descripción</th>
                    <th className="p-2 text-left">Cuenta</th>
                    <th className="p-2 text-right">Debe</th>
                    <th className="p-2 text-right">Haber</th>
                  </tr>
                </thead>
                <tbody>
                  {importPreview.slice(0, 10).map((tx, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="p-2">{tx.date}</td>
                      <td className="p-2">{tx.description.substring(0, 30)}</td>
                      <td className="p-2">{tx.account}</td>
                      <td className="p-2 text-right text-success">
                        {tx.debit > 0 ? `$${tx.debit.toFixed(2)}` : "-"}
                      </td>
                      <td className="p-2 text-right text-destructive">
                        {tx.credit > 0 ? `$${tx.credit.toFixed(2)}` : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {importPreview.length > 10 && (
                <div className="p-2 text-center text-sm text-muted-foreground bg-muted">
                  ...y {importPreview.length - 10} transacciones más
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmImport}>
              Importar {importPreview.length} Transacciones
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                  <SelectItem value="qif">Quicken (.qif)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex gap-2">
              <Button onClick={handleExport} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Exportar Datos
              </Button>
              <Button 
                onClick={() => fileInputRef.current?.click()} 
                variant="outline" 
                className="flex-1"
                disabled={importing}
              >
                <Upload className="h-4 w-4 mr-2" />
                {importing ? "Procesando..." : "Importar Datos"}
              </Button>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-sm font-medium">Formatos de Importación Soportados</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">JSON</p>
                    <p className="text-xs text-muted-foreground">Cap Finanzas</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                  <FileSpreadsheet className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">CSV</p>
                    <p className="text-xs text-muted-foreground">Excel, Bancos</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                  <File className="h-4 w-4 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">QIF</p>
                    <p className="text-xs text-muted-foreground">Quicken</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                  <File className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">OFX/QFX</p>
                    <p className="text-xs text-muted-foreground">Bancos USA</p>
                  </div>
                </div>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Nota:</strong> Los archivos importados se agregarán al Libro Diario. 
                La aplicación detecta automáticamente la cuenta contable según la descripción de cada transacción.
              </AlertDescription>
            </Alert>
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
                  toast.success(checked ? "Modo desarrollador activado" : "Modo desarrollador desactivado");
                }} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Registro de Datos</Label>
                  <p className="text-xs text-muted-foreground">
                    Guardar logs para depuración
                  </p>
                </div>
                <Switch checked={config.dataLogging} onCheckedChange={(checked) => {
                  updateConfig({ dataLogging: checked });
                  toast.success(checked ? "Registro activado" : "Registro desactivado");
                }} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sincronización Automática</Label>
                  <p className="text-xs text-muted-foreground">
                    Sincronizar datos en tiempo real
                  </p>
                </div>
                <Switch checked={config.autoSync} onCheckedChange={(checked) => {
                  updateConfig({ autoSync: checked });
                  toast.success(checked ? "Sincronización activada" : "Sincronización desactivada");
                }} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Funciones Beta</Label>
                  <p className="text-xs text-muted-foreground">
                    Probar nuevas funcionalidades
                  </p>
                </div>
                <Switch checked={config.devMode} onCheckedChange={(checked) => {
                  updateConfig({ devMode: checked });
                  toast.success(checked ? "Funciones beta activadas" : "Funciones beta desactivadas");
                }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
