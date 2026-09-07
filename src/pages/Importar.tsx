import { useState, useCallback, useMemo } from "react";
import { Upload, FileText, CheckCircle, AlertCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useJournalTransactions } from "@/hooks/useJournalTransactions";
import { useCategories } from "@/hooks/useCategories";
import { toast } from "sonner";

interface ParsedRow {
  [key: string]: string;
}

const COMMON_HEADERS: Record<string, string[]> = {
  date: ["fecha", "date", "fcha", "data", "dia"],
  description: ["descripcion", "description", "desc", "concepto", "detalle", "glosa", "memo", "detalle"],
  amount: ["monto", "amount", "importe", "valor", "total", "suma", "cantidad"],
  type: ["tipo", "type", "clase", "clasificacion"],
  category: ["categoria", "category", "cat", "rubro", "grupo"],
  section: ["seccion", "section", "sector", "grupo"],
  notes: ["notas", "notes", "obs", "observaciones", "comentario"],
  creditor: ["acreedor", "creditor", "proveedor", "pagador", "deudor"],
};

function autoDetectColumns(headers: string[]): Record<string, number> {
  const mapping: Record<string, number> = {};
  const lowerHeaders = headers.map((h) => h.toLowerCase().trim());

  for (const [field, candidates] of Object.entries(COMMON_HEADERS)) {
    for (const candidate of candidates) {
      const idx = lowerHeaders.findIndex((h) => h === candidate || h.includes(candidate));
      if (idx !== -1) {
        if (!(field in mapping)) {
          mapping[field] = idx;
        }
        break;
      }
    }
  }

  return mapping;
}

function parseCSV(text: string): { headers: string[]; rows: ParsedRow[] } {
  // Detectar separador
  const firstLine = text.split("\n")[0] || "";
  let separator = ",";
  if (firstLine.includes(";") && !firstLine.includes(",")) separator = ";";
  else if (firstLine.includes("\t")) separator = "\t";

  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === separator && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows: ParsedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    if (values.length === headers.length) {
      const row: ParsedRow = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx];
      });
      rows.push(row);
    }
  }

  return { headers, rows };
}

function parseDate(dateStr: string): string | null {
  if (!dateStr) return null;
  const cleaned = dateStr.trim();

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned;

  // DD/MM/YYYY or DD-MM-YYYY
  const match1 = cleaned.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/);
  if (match1) {
    const [, d, m, y] = match1;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // MM/DD/YYYY (US format)
  const match2 = cleaned.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/);
  if (match2) {
    const [, m, d, y] = match2;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  return null;
}

function parseAmount(amountStr: string): number | null {
  if (!amountStr) return null;
  const cleaned = amountStr.replace(/[$,\s]/g, "").replace(/\./g, (m, offset, str) => {
    // Si hay más de un punto, tratar el último como decimal
    const dots = str.split(".").length - 1;
    return dots > 1 ? "" : m;
  });
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

export default function Importar() {
  const { setTransactions } = useJournalTransactions();
  const { categories, addCategory } = useCategories();

  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [mapping, setMapping] = useState<Record<string, number>>({});
  const [createCategories, setCreateCategories] = useState(true);
  const [imported, setImported] = useState(false);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setImported(false);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { headers: h, rows: r } = parseCSV(text);
      setHeaders(h);
      setRows(r);
      setMapping(autoDetectColumns(h));
    };
    reader.readAsText(f, "UTF-8");
  }, []);

  const handleMappingChange = (field: string, value: string) => {
    const idx = parseInt(value);
    setMapping((prev) => ({
      ...prev,
      [field]: isNaN(idx) ? -1 : idx,
    }));
  };

  const previewData = useMemo(() => {
    return rows.slice(0, 5).map((row) => {
      const values = headers.map((h) => row[h] || "");
      const dateIdx = mapping.date;
      const descIdx = mapping.description;
      const amountIdx = mapping.amount;
      const typeIdx = mapping.type;
      const catIdx = mapping.category;

      const dateVal = dateIdx >= 0 ? parseDate(values[dateIdx]) : null;
      const amountVal = amountIdx >= 0 ? parseAmount(values[amountIdx]) : null;
      const typeVal = typeIdx >= 0 ? values[typeIdx] : "";

      return {
        date: dateVal || values[dateIdx] || "",
        description: descIdx >= 0 ? values[descIdx] : "",
        amount: amountVal !== null ? `$${amountVal.toFixed(2)}` : values[amountIdx] || "",
        type: typeVal,
        category: catIdx >= 0 ? values[catIdx] : "",
        valid: dateVal !== null && amountVal !== null,
      };
    });
  }, [rows, headers, mapping]);

  const handleImport = () => {
    if (rows.length === 0) {
      toast.error("No hay datos para importar");
      return;
    }

    const dateIdx = mapping.date;
    const descIdx = mapping.description;
    const amountIdx = mapping.amount;
    const typeIdx = mapping.type;
    const catIdx = mapping.category;
    const sectionIdx = mapping.section;
    const notesIdx = mapping.notes;
    const creditorIdx = mapping.creditor;

    if (dateIdx < 0 || amountIdx < 0) {
      toast.error("Debes mapear al menos las columnas de Fecha y Monto");
      return;
    }

    let imported = 0;
    const existingCategories = new Set(categories.map((c) => c.id));

    const newTransactions = rows
      .map((row) => {
        const values = headers.map((h) => row[h] || "");
        const date = parseDate(values[dateIdx]);
        const amount = parseAmount(values[amountIdx]);

        if (!date || amount === null) return null;

        const typeRaw = typeIdx >= 0 ? values[typeIdx].toLowerCase() : "";
        let type: "income" | "expense" = "expense";
        if (typeRaw.includes("ingres") || typeRaw.includes("income") || typeRaw.includes("haber") || typeRaw.includes("credit")) {
          type = "income";
        }

        const description = descIdx >= 0 ? values[descIdx] : "(sin descripción)";
        const categoryName = catIdx >= 0 ? values[catIdx] : "";
        const sectionName = sectionIdx >= 0 ? values[sectionIdx] : "";
        const notesVal = notesIdx >= 0 ? values[notesIdx] : "";
        const creditorVal = creditorIdx >= 0 ? values[creditor] : "";

        // Crear categoría si no existe
        let categoryId = categoryName
          ? categoryName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
          : type === "income"
            ? "otros-ingresos"
            : "otros-gastos";

        if (categoryName && createCategories && !existingCategories.has(categoryId)) {
          addCategory({
            id: categoryId,
            label: categoryName,
            icon: type === "income" ? "📥" : "📤",
            type: type === "income" ? "income" : "expense",
            subcategories: [],
          });
          existingCategories.add(categoryId);
        }

        return {
          id: Date.now() + imported,
          date,
          account: categoryId,
          description,
          debit: type === "expense" ? amount : 0,
          credit: type === "income" ? amount : 0,
          section: sectionName || undefined,
          notes: notesVal || undefined,
          creditor: creditorVal || undefined,
          reconciled: false,
        };
      })
      .filter(Boolean) as any[];

    if (newTransactions.length === 0) {
      toast.error("No se pudieron procesar las filas. Verifica el mapeo de columnas.");
      return;
    }

    setTransactions((prev) => [...prev, ...newTransactions]);
    imported = newTransactions.length;
    setImported(true);
    toast.success(`${imported} transacciones importadas correctamente`);
  };

  const downloadTemplate = () => {
    const csv = "Fecha,Descripción,Monto,Tipo,Categoría,Sección,Notas,Acreedor\n2026-01-01,Salario mensual,45000,Ingreso,Salario,,Sueldo de enero,\n2026-01-05,Supermercado,3500,Gasto,Alimentación,Casa,Compras semanales,\n2026-01-10,Netflix,650,Gasto,Entretenimiento,,Plan mensual,";
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla_importacion.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Importar Datos</h1>
          <p className="text-sm text-muted-foreground">
            Importa transacciones desde un archivo CSV
          </p>
        </div>
        <Button variant="outline" onClick={downloadTemplate} className="gap-2">
          <Download className="h-4 w-4" />
          Descargar Plantilla
        </Button>
      </div>

      {/* Upload */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3 w-full">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <Input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
            </div>
            {file && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                {file.name} ({rows.length} filas)
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mapping */}
      {headers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Mapeo de Columnas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { key: "date", label: "Fecha", required: true },
                { key: "description", label: "Descripción", required: false },
                { key: "amount", label: "Monto", required: true },
                { key: "type", label: "Tipo (Ingreso/Gasto)", required: false },
                { key: "category", label: "Categoría", required: false },
                { key: "section", label: "Sección", required: false },
                { key: "notes", label: "Notas", required: false },
                { key: "creditor", label: "Acreedor/Pagador", required: false },
              ].map((field) => (
                <div key={field.key} className="space-y-1">
                  <Label className="text-xs">
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  <select
                    value={mapping[field.key] ?? -1}
                    onChange={(e) => handleMappingChange(field.key, e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value={-1}>-- Sin mapear --</option>
                    {headers.map((h, idx) => (
                      <option key={idx} value={idx}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="createCategories"
                checked={createCategories}
                onCheckedChange={(checked) => setCreateCategories(checked === true)}
              />
              <Label htmlFor="createCategories" className="cursor-pointer text-sm">
                Crear categorías automáticamente si no existen
              </Label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      {previewData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vista Previa (primeras 5 filas)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{row.date}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{row.description}</TableCell>
                      <TableCell>{row.amount}</TableCell>
                      <TableCell>{row.type || "-"}</TableCell>
                      <TableCell>{row.category || "-"}</TableCell>
                      <TableCell>
                        {row.valid ? (
                          <CheckCircle className="h-4 w-4 text-success" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import button */}
      {rows.length > 0 && (
        <div className="flex justify-end">
          <Button onClick={handleImport} className="gap-2">
            <Upload className="h-4 w-4" />
            Importar {rows.length} transacciones
          </Button>
        </div>
      )}

      {imported && (
        <Card className="border-success bg-success/5">
          <CardContent className="flex items-center gap-3 p-4">
            <CheckCircle className="h-5 w-5 text-success" />
            <span className="text-success font-medium">
              Importación completada. Las transacciones ya están disponibles.
            </span>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
