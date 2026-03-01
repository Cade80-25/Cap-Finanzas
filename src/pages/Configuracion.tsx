import { Database, Bell, Shield, Download, Upload, Palette, Zap, RefreshCw, CheckCircle, FileText, FileSpreadsheet, File, AlertCircle, Table, Lock, Key, CloudUpload, Terminal, ScrollText, Trash2 } from "lucide-react";
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
import ExcelJS from "exceljs";
import { useJournalTransactions } from "@/hooks/useJournalTransactions";
import { useBudgets } from "@/hooks/useBudgets";
import { useSecurity } from "@/hooks/useSecurity";
import { useAdvancedFeatures } from "@/hooks/useAdvancedFeatures";
import { ChangePinDialog, BackupDialog, TwoFactorDialog } from "@/components/SecurityDialogs";
import { LogsDialog, SyncDialog, ResetDialog } from "@/components/AdvancedFeaturesDialogs";
import { LicenseSettings } from "@/components/LicenseSettings";

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
  
  // Security dialogs state
  const [changePinOpen, setChangePinOpen] = useState(false);
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);
  const [twoFactorDialogOpen, setTwoFactorDialogOpen] = useState(false);
  
  // Advanced features dialogs state
  const [logsDialogOpen, setLogsDialogOpen] = useState(false);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  
  const { budgets } = useBudgets();
  const { transactions, setTransactions } = useJournalTransactions();
  
  // Security hook
  const security = useSecurity();
  
  // Advanced features hook
  const advanced = useAdvancedFeatures();
  
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
       presupuesto: budgets,
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

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  // Función para parsear diferentes formatos de archivo
  const parseFile = async (file: File): Promise<Transaction[]> => {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error("El archivo excede el tamaño máximo permitido de 10MB.");
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    const parsedTransactions: Transaction[] = [];

    try {
      // Archivos de hojas de cálculo (Excel, ODS)
      if (extension === "xlsx" || extension === "xls" || extension === "ods") {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(arrayBuffer);
        const firstSheet = workbook.worksheets[0];
        
        if (!firstSheet) return parsedTransactions;
        
        const rows: any[][] = [];
        firstSheet.eachRow((row) => {
          rows.push(row.values as any[]);
        });
        
        // Detectar si tiene encabezado
        const firstRow = rows[0] as any[];
        const hasHeader = firstRow?.some((cell: any) => 
          typeof cell === 'string' && (
            cell.toLowerCase().includes("fecha") || 
            cell.toLowerCase().includes("date") ||
            cell.toLowerCase().includes("descripcion") ||
            cell.toLowerCase().includes("monto") ||
            cell.toLowerCase().includes("amount")
          )
        );
        
        const dataRows = hasHeader ? rows.slice(1) : rows;
        
        dataRows.forEach((row: any[], index: number) => {
          if (row.length >= 2) {
            // ExcelJS row.values tiene índice 1-based, el primer elemento es undefined
            const cells = row.slice(1);
            let dateVal = cells[0];
            let descVal = cells[1] || "";
            let amountVal = cells[2] || cells[3] || 0;
            
            // Convertir fecha
            let dateStr = "";
            if (dateVal instanceof Date) {
              dateStr = dateVal.toISOString().slice(0, 10);
            } else if (typeof dateVal === "number") {
              // Excel serial date
              const date = new Date((dateVal - 25569) * 86400 * 1000);
              dateStr = date.toISOString().slice(0, 10);
            } else if (typeof dateVal === "string") {
              dateStr = parseDateString(dateVal);
            } else {
              dateStr = new Date().toISOString().slice(0, 10);
            }
            
            const amount = parseFloat(String(amountVal).replace(/[^0-9.-]/g, '')) || 0;
            
            if (dateStr && (descVal || amount !== 0)) {
              parsedTransactions.push({
                id: Date.now() + index,
                date: dateStr,
                account: detectAccount(String(descVal)),
                description: String(descVal) || "Importado Excel",
                debit: amount > 0 ? amount : 0,
                credit: amount < 0 ? Math.abs(amount) : 0,
              });
            }
          }
        });
        
        return parsedTransactions;
      }
      
      // Archivos de texto
      const text = await file.text();

      if (extension === "json") {
        let data: any;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error("El archivo JSON tiene un formato inválido.");
        }
        if (data.transactions && Array.isArray(data.transactions)) {
          return data.transactions.map((item: any, index: number) => ({
            id: Date.now() + index,
            date: String(item.date || "").slice(0, 10) || new Date().toISOString().slice(0, 10),
            account: String(item.account || "otros").slice(0, 100),
            description: String(item.description || "Importado").slice(0, 500),
            debit: Math.max(0, parseFloat(item.debit) || 0),
            credit: Math.max(0, parseFloat(item.credit) || 0),
          }));
        } else if (Array.isArray(data)) {
          return data.slice(0, 10000).map((item: any, index: number) => ({
            id: Date.now() + index,
            date: String(item.date || item.fecha || "").slice(0, 10) || new Date().toISOString().slice(0, 10),
            account: String(item.account || item.cuenta || "otros").slice(0, 100),
            description: String(item.description || item.descripcion || "Importado").slice(0, 500),
            debit: Math.max(0, parseFloat(item.debit || item.debe || 0)),
            credit: Math.max(0, parseFloat(item.credit || item.haber || 0)),
          }));
        }
      } else if (extension === "pfd") {
        // Personal Finances (Alzex Finance) - formato binario SQLite
        // El archivo .pfd de Alzex es una base de datos SQLite, no se puede leer directamente en el navegador
        // Verificar si es binario
        const isBinary = text.split('').some((char, i) => {
          if (i > 200) return false;
          const code = char.charCodeAt(0);
          return code < 32 && code !== 9 && code !== 10 && code !== 13;
        });
        
        if (isBinary) {
          // Archivo binario - mostrar mensaje explicativo
          toast.error("Formato PFD binario detectado", {
            description: "El archivo .pfd de Alzex Personal Finances es una base de datos SQLite. Por favor, exporta tus datos desde Personal Finances como CSV o Excel y luego impórtalos aquí.",
            duration: 10000,
          });
          return [];
        }
        
        // Si no es binario, intentar parsear como texto/XML
        if (text.includes("<?xml") || (text.includes("<") && text.includes(">"))) {
          // Formato XML
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(text, "text/xml");
          
          const selectors = [
            "Transaction", "transaction", "record", "entry", "item",
            "Row", "row", "Data", "data", "Movimiento", "movimiento"
          ];
          
          let txNodes: Element[] = [];
          for (const selector of selectors) {
            const nodes = xmlDoc.querySelectorAll(selector);
            if (nodes.length > 0) {
              txNodes = Array.from(nodes);
              break;
            }
          }
          
          txNodes.forEach((node, txIndex) => {
            const dateFields = ["Date", "date", "Fecha", "fecha"];
            let date = "";
            for (const field of dateFields) {
              date = node.querySelector(field)?.textContent || node.getAttribute(field.toLowerCase()) || "";
              if (date) break;
            }
            
            const descFields = ["Description", "description", "Memo", "memo", "Descripcion", "descripcion", "Concepto", "concepto"];
            let desc = "";
            for (const field of descFields) {
              desc = node.querySelector(field)?.textContent || node.getAttribute(field.toLowerCase()) || "";
              if (desc) break;
            }
            
            const amountFields = ["Amount", "amount", "Monto", "monto", "Importe", "importe", "Valor", "value"];
            let amountStr = "";
            for (const field of amountFields) {
              amountStr = node.querySelector(field)?.textContent || node.getAttribute(field.toLowerCase()) || "";
              if (amountStr) break;
            }
            
            const catFields = ["Category", "category", "Categoria", "categoria", "Account", "account", "Cuenta", "cuenta"];
            let category = "";
            for (const field of catFields) {
              category = node.querySelector(field)?.textContent || node.getAttribute(field.toLowerCase()) || "";
              if (category) break;
            }
            
            const amount = parseFloat(String(amountStr).replace(/[^0-9.,-]/g, '').replace(',', '.')) || 0;
            
            if (date || desc || amount !== 0) {
              parsedTransactions.push({
                id: Date.now() + txIndex,
                date: parseDateString(date) || new Date().toISOString().slice(0, 10),
                account: detectAccount(category || desc),
                description: desc || category || "Importado",
                debit: amount > 0 ? amount : 0,
                credit: amount < 0 ? Math.abs(amount) : 0,
              });
            }
          });
        } else {
          // Formato texto delimitado
          const lines = text.split(/[\r\n]+/).filter(line => line.trim());
          
          let delimiter = ',';
          const sample = lines.slice(0, 5).join('');
          if (sample.includes('\t')) delimiter = '\t';
          else if (sample.includes(';')) delimiter = ';';
          else if (sample.includes('|')) delimiter = '|';
          
          const firstLine = lines[0]?.toLowerCase() || '';
          const hasHeader = firstLine.includes("date") || firstLine.includes("fecha") || 
                           firstLine.includes("amount") || firstLine.includes("monto");
          
          const dataLines = hasHeader ? lines.slice(1) : lines;
          
          dataLines.forEach((line, index) => {
            const values = line.split(delimiter).map(v => v.trim().replace(/^["']|["']$/g, ''));
            
            if (values.length >= 2) {
              let dateVal = '', descVal = '', amountVal = '';
              
              values.forEach((val) => {
                if (!dateVal && /^\d{1,4}[\/-]\d{1,2}[\/-]\d{1,4}/.test(val)) {
                  dateVal = val;
                } else if (!amountVal && /^[+-]?\$?[\d,.]+$/.test(val.replace(/\s/g, ''))) {
                  amountVal = val;
                } else if (!descVal && val.length > 2) {
                  descVal = val;
                }
              });
              
              if (!dateVal) dateVal = values[0];
              if (!descVal) descVal = values[1] || values[0];
              if (!amountVal) amountVal = values[2] || values[3] || "0";
              
              const amount = parseFloat(String(amountVal).replace(/[^0-9.,-]/g, '').replace(',', '.')) || 0;
              
              if (dateVal || descVal || amount !== 0) {
                parsedTransactions.push({
                  id: Date.now() + index,
                  date: parseDateString(dateVal) || new Date().toISOString().slice(0, 10),
                  account: detectAccount(descVal),
                  description: descVal || "Importado",
                  debit: amount > 0 ? amount : 0,
                  credit: amount < 0 ? Math.abs(amount) : 0,
                });
              }
            }
          });
        }
      } else if (extension === "csv" || extension === "tsv" || extension === "txt") {
        const delimiter = extension === "tsv" ? "\t" : ",";
        const lines = text.split("\n").filter(line => line.trim());
        const hasHeader = lines[0].toLowerCase().includes("fecha") || 
                          lines[0].toLowerCase().includes("date") ||
                          lines[0].toLowerCase().includes("descripcion");
        const dataLines = hasHeader ? lines.slice(1) : lines;

        dataLines.forEach((line, index) => {
          const values = line.split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''));
          if (values.length >= 2) {
            const amount = parseFloat(values[3] || values[2] || "0");
            parsedTransactions.push({
              id: Date.now() + index,
              date: parseDateString(values[0]) || new Date().toISOString().slice(0, 10),
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
      throw new Error(error instanceof Error ? error.message : "No se pudo leer el archivo. Verifica el formato.");
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

  // Parsear fecha genérica
  const parseDateString = (dateStr: string): string => {
    if (!dateStr) return "";
    
    // Limpiar la cadena
    const clean = dateStr.trim();
    
    // Formato ISO: YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
      return clean.slice(0, 10);
    }
    
    // Formato DD/MM/YYYY o DD-MM-YYYY
    const dmyMatch = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    if (dmyMatch) {
      let [, day, month, year] = dmyMatch;
      if (year.length === 2) {
        year = parseInt(year) > 50 ? `19${year}` : `20${year}`;
      }
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Formato MM/DD/YYYY (US)
    const mdyMatch = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (mdyMatch) {
      const [, month, day, year] = mdyMatch;
      // Si el primer número > 12, es DD/MM/YYYY
      if (parseInt(month) > 12) {
        return `${year}-${day.padStart(2, '0')}-${month.padStart(2, '0')}`;
      }
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Intentar parsear con Date
    try {
      const date = new Date(clean);
      if (!isNaN(date.getTime())) {
        return date.toISOString().slice(0, 10);
      }
    } catch {}
    
    return "";
  };

  // Parsear fecha QIF
  const parseQIFDate = (dateStr: string): string => {
    return parseDateString(dateStr) || new Date().toISOString().slice(0, 10);
  };

  // Manejar selección de archivo
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Archivo demasiado grande", {
        description: "El tamaño máximo permitido es 10MB",
      });
      return;
    }

    const validExtensions = ['json', 'csv', 'tsv', 'txt', 'qif', 'ofx', 'qfx', 'pfd', 'xlsx', 'xls', 'ods'];
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (!extension || !validExtensions.includes(extension)) {
      toast.error("Formato no soportado", {
        description: "Usa archivos PFD, Excel, CSV, JSON, QIF u OFX",
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
        accept=".json,.csv,.tsv,.txt,.qif,.ofx,.qfx,.pfd,.xlsx,.xls,.ods"
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

      {/* License Settings Section */}
      <LicenseSettings />

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
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                  <File className="h-4 w-4 text-indigo-500" />
                  <div>
                    <p className="text-sm font-medium">PFD</p>
                    <p className="text-xs text-muted-foreground">Personal Finances</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                  <Table className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">XLSX/XLS</p>
                    <p className="text-xs text-muted-foreground">Microsoft Excel</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                  <FileSpreadsheet className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">ODS</p>
                    <p className="text-xs text-muted-foreground">LibreOffice</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                  <FileSpreadsheet className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">CSV/TSV</p>
                    <p className="text-xs text-muted-foreground">Texto delimitado</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">JSON</p>
                    <p className="text-xs text-muted-foreground">Cap Finanzas</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                  <File className="h-4 w-4 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">QIF/OFX</p>
                    <p className="text-xs text-muted-foreground">Quicken, Bancos</p>
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
            {/* PIN Status */}
            <div className="rounded-lg bg-muted/50 p-3 flex items-center gap-3">
              <div className={`p-2 rounded-full ${security.hasMasterPin ? 'bg-green-500/20' : 'bg-yellow-500/20'}`}>
                {security.hasMasterPin ? (
                  <Lock className="h-4 w-4 text-green-600" />
                ) : (
                  <Key className="h-4 w-4 text-yellow-600" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {security.hasMasterPin ? "PIN de seguridad configurado" : "Sin PIN de seguridad"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {security.hasMasterPin 
                    ? "Tu aplicación está protegida" 
                    : "Configura un PIN para proteger tus datos"}
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Bloqueo Automático</Label>
                <p className="text-xs text-muted-foreground">
                  Bloquear después de {security.autoLockMinutes} minutos de inactividad
                </p>
              </div>
              <Switch 
                checked={security.autoLockEnabled} 
                onCheckedChange={(checked) => {
                  security.setAutoLock(checked);
                  updateConfig({ autoLock: checked });
                  toast.success(checked ? "Bloqueo automático activado" : "Bloqueo automático desactivado");
                }} 
                disabled={!security.hasMasterPin}
              />
            </div>

            {security.autoLockEnabled && security.hasMasterPin && (
              <div className="pl-4 space-y-2">
                <Label className="text-xs">Tiempo de inactividad</Label>
                <Select 
                  value={String(security.autoLockMinutes)} 
                  onValueChange={(value) => {
                    security.setAutoLockMinutes(parseInt(value));
                    toast.success(`Bloqueo configurado a ${value} minutos`);
                  }}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 minuto</SelectItem>
                    <SelectItem value="3">3 minutos</SelectItem>
                    <SelectItem value="5">5 minutos</SelectItem>
                    <SelectItem value="10">10 minutos</SelectItem>
                    <SelectItem value="15">15 minutos</SelectItem>
                    <SelectItem value="30">30 minutos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Verificación en Dos Pasos</Label>
                <p className="text-xs text-muted-foreground">
                  Seguridad adicional al iniciar sesión
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setTwoFactorDialogOpen(true)}
              >
                {security.twoFactorEnabled ? "Configurado" : "Configurar"}
              </Button>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Backup Automático</Label>
                <p className="text-xs text-muted-foreground">
                  Copia de seguridad local diaria
                </p>
              </div>
              <Switch 
                checked={security.autoBackupEnabled} 
                onCheckedChange={(checked) => {
                  security.setAutoBackup(checked);
                  updateConfig({ autoBackup: checked });
                  toast.success(checked ? "Backup automático activado" : "Backup automático desactivado");
                }} 
              />
            </div>

            {security.lastBackupDate && (
              <div className="pl-4 text-xs text-muted-foreground">
                Último backup: {new Date(security.lastBackupDate).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </div>
            )}

            <Separator />

            <div className="grid gap-2">
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2"
                onClick={() => setChangePinOpen(true)}
              >
                <Key className="h-4 w-4" />
                {security.hasMasterPin ? "Cambiar PIN de Seguridad" : "Configurar PIN de Seguridad"}
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2"
                onClick={() => setBackupDialogOpen(true)}
              >
                <CloudUpload className="h-4 w-4" />
                Gestionar Backups
              </Button>

              {security.hasMasterPin && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    security.lock();
                    toast.success("Aplicación bloqueada");
                  }}
                >
                  <Lock className="h-4 w-4" />
                  Bloquear Ahora
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Security Dialogs */}
        <ChangePinDialog
          open={changePinOpen}
          onOpenChange={setChangePinOpen}
          hasMasterPin={security.hasMasterPin}
          onVerifyPin={security.verifyPin}
          onSetPin={security.setMasterPin}
        />
        
        <BackupDialog
          open={backupDialogOpen}
          onOpenChange={setBackupDialogOpen}
          lastBackupDate={security.lastBackupDate}
          onExportBackup={security.exportBackup}
          onImportBackup={security.importBackup}
        />
        
        <TwoFactorDialog
          open={twoFactorDialogOpen}
          onOpenChange={setTwoFactorDialogOpen}
          enabled={security.twoFactorEnabled}
          onToggle={security.setTwoFactor}
        />

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
                    Habilitar opciones avanzadas de depuración
                  </p>
                </div>
                <Switch 
                  checked={advanced.devMode} 
                  onCheckedChange={(checked) => {
                    advanced.setDevMode(checked);
                    updateConfig({ devMode: checked });
                    toast.success(checked ? "Modo desarrollador activado" : "Modo desarrollador desactivado");
                  }} 
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Registro de Datos</Label>
                  <p className="text-xs text-muted-foreground">
                    Guardar logs para depuración ({advanced.logs.length} registros)
                  </p>
                </div>
                <Switch 
                  checked={advanced.dataLogging} 
                  onCheckedChange={(checked) => {
                    advanced.setDataLogging(checked);
                    updateConfig({ dataLogging: checked });
                    toast.success(checked ? "Registro activado" : "Registro desactivado");
                  }} 
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    Sincronización Automática
                    {advanced.syncStatus === "syncing" && (
                      <RefreshCw className="h-3 w-3 animate-spin text-primary" />
                    )}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {advanced.autoSync 
                      ? `Cada ${advanced.syncInterval}s` 
                      : "Sincronizar datos periódicamente"}
                  </p>
                </div>
                <Switch 
                  checked={advanced.autoSync} 
                  onCheckedChange={(checked) => {
                    advanced.setAutoSync(checked);
                    updateConfig({ autoSync: checked });
                    toast.success(checked ? "Sincronización activada" : "Sincronización desactivada");
                  }} 
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Funciones Beta</Label>
                  <p className="text-xs text-muted-foreground">
                    Probar nuevas funcionalidades experimentales
                  </p>
                </div>
                <Switch 
                  checked={advanced.betaFeatures} 
                  onCheckedChange={(checked) => {
                    advanced.setBetaFeatures(checked);
                    updateConfig({ betaFeatures: checked });
                    toast.success(checked ? "Funciones beta activadas" : "Funciones beta desactivadas");
                  }} 
                />
              </div>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Button 
                variant="outline" 
                className="justify-start gap-2"
                onClick={() => setLogsDialogOpen(true)}
                disabled={!advanced.dataLogging && advanced.logs.length === 0}
              >
                <ScrollText className="h-4 w-4" />
                Ver Registros
                {advanced.logs.length > 0 && (
                  <span className="ml-auto text-xs bg-primary/10 text-primary px-1.5 rounded">
                    {advanced.logs.length}
                  </span>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                className="justify-start gap-2"
                onClick={() => setSyncDialogOpen(true)}
              >
                <RefreshCw className={`h-4 w-4 ${advanced.syncStatus === "syncing" ? "animate-spin" : ""}`} />
                Configurar Sincronización
              </Button>
              
              <Button 
                variant="outline" 
                className="justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => setResetDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                Restablecer Todo
              </Button>
            </div>

            {/* Dev Mode Features */}
            {advanced.devMode && (
              <>
                <Separator />
                <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Terminal className="h-4 w-4 text-yellow-600" />
                    <Label className="text-yellow-700">Modo Desarrollador Activo</Label>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Tienes acceso a funciones adicionales de depuración y diagnóstico.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        console.log("=== Cap Finanzas Debug Info ===");
                        console.log("LocalStorage keys:", Object.keys(localStorage).filter(k => k.startsWith("cap-finanzas")));
                        console.log("Logs:", advanced.logs);
                        console.log("Config:", config);
                        toast.success("Info de debug enviada a la consola");
                      }}
                    >
                      Log Debug Info
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        advanced.addLog("info", "Test", "Entrada de prueba manual", { test: true });
                        toast.success("Log de prueba creado");
                      }}
                      disabled={!advanced.dataLogging}
                    >
                      Crear Log de Prueba
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const stats = advanced.getStats();
                        console.log("Stats:", stats);
                        toast.info(`Total: ${stats.totalLogs} logs, ${stats.errorCount} errores`);
                      }}
                    >
                      Ver Estadísticas
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Last Sync Info */}
            {advanced.lastSyncTime && (
              <p className="text-xs text-muted-foreground text-center">
                Última sincronización: {new Date(advanced.lastSyncTime).toLocaleString("es-ES", {
                  dateStyle: "short",
                  timeStyle: "short"
                })}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Advanced Features Dialogs */}
        <LogsDialog
          open={logsDialogOpen}
          onOpenChange={setLogsDialogOpen}
          logs={advanced.logs}
          onClearLogs={advanced.clearLogs}
          onExportLogs={advanced.exportLogs}
          stats={advanced.getStats()}
        />
        
        <SyncDialog
          open={syncDialogOpen}
          onOpenChange={setSyncDialogOpen}
          syncStatus={advanced.syncStatus}
          lastSyncTime={advanced.lastSyncTime}
          syncInterval={advanced.syncInterval}
          autoSync={advanced.autoSync}
          onSync={advanced.syncData}
          onSetSyncInterval={advanced.setSyncInterval}
        />
        
        <ResetDialog
          open={resetDialogOpen}
          onOpenChange={setResetDialogOpen}
          onReset={advanced.resetAllData}
        />
      </div>
    </div>
  );
}
