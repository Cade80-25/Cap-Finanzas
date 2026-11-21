// ExcelJS se carga bajo demanda (247 KB) para no pesar en el landing.
export interface ImportedTransaction {
  fecha: string;
  descripcion: string;
  categoria: string;
  tipo: "income" | "expense";
  monto: number;
  precioUnitario?: number;
  cantidad?: number;
  precioTotal?: number;
  notas?: string;
}

function parseNumber(v: any): number {
  if (v == null || v === "") return 0;
  if (typeof v === "number") return v;
  const s = String(v).replace(/\s/g, "").replace(",", ".");
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function normTipo(v: any): "income" | "expense" {
  const s = String(v || "").toLowerCase();
  if (s.includes("ingreso") || s.includes("income") || s === "in") return "income";
  return "expense";
}

export async function importFromCSV(text: string): Promise<ImportedTransaction[]> {
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== "");
  if (lines.length < 2) return [];
  const header = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/"/g, ""));
  const idx = (name: string) => header.findIndex(h => h.includes(name));
  const iFecha = idx("fecha") >= 0 ? idx("fecha") : idx("date");
  const iDesc = idx("descrip") >= 0 ? idx("descrip") : idx("description");
  const iCat = idx("categ");
  const iTipo = idx("tipo") >= 0 ? idx("tipo") : idx("type");
  const iMonto = idx("monto") >= 0 ? idx("monto") : idx("amount");
  const iPrecio = idx("precio unit") >= 0 ? idx("precio unit") : idx("unit");
  const iCant = idx("cantidad") >= 0 ? idx("cantidad") : idx("qty");
  const iTotal = idx("precio total") >= 0 ? idx("precio total") : idx("total");
  const iNotas = idx("nota");
  const out: ImportedTransaction[] = [];
  for (let r = 1; r < lines.length; r++) {
    const cols = lines[r].split(",").map(c => c.replace(/^"|"$/g, "").trim());
    const fecha = cols[iFecha >= 0 ? iFecha : 0] || "";
    const descripcion = cols[iDesc >= 0 ? iDesc : 1] || "";
    const categoria = cols[iCat >= 0 ? iCat : 2] || "otros";
    const tipo = normTipo(cols[iTipo >= 0 ? iTipo : 3]);
    const monto = parseNumber(cols[iMonto >= 0 ? iMonto : 4]);
    if (!fecha && !descripcion) continue;
    out.push({
      fecha: fecha || new Date().toISOString().slice(0, 10),
      descripcion,
      categoria,
      tipo,
      monto,
      precioUnitario: iPrecio >= 0 ? parseNumber(cols[iPrecio]) : undefined,
      cantidad: iCant >= 0 ? parseNumber(cols[iCant]) : undefined,
      precioTotal: iTotal >= 0 ? parseNumber(cols[iTotal]) : undefined,
      notas: iNotas >= 0 ? cols[iNotas] : undefined,
    });
  }
  return out;
}

export async function importFromExcel(buffer: ArrayBuffer): Promise<ImportedTransaction[]> {
  const { default: ExcelJS } = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws = wb.worksheets[0];
  if (!ws) return [];
  const headerRow = ws.getRow(1);
  const header: string[] = [];
  headerRow.eachCell((c, col) => { header[col] = String(c.value || "").toLowerCase(); });
  const findCol = (name: string) => header.findIndex(h => h && h.includes(name));
  const iFecha = findCol("fecha") >= 0 ? findCol("fecha") : findCol("date");
  const iDesc = findCol("descrip") >= 0 ? findCol("descrip") : findCol("description");
  const iCat = findCol("categ");
  const iTipo = findCol("tipo") >= 0 ? findCol("tipo") : findCol("type");
  const iMonto = findCol("monto") >= 0 ? findCol("monto") : findCol("amount");
  const iPrecio = findCol("precio unit") >= 0 ? findCol("precio unit") : findCol("unit");
  const iCant = findCol("cantidad") >= 0 ? findCol("cantidad") : findCol("qty");
  const iTotal = findCol("precio total") >= 0 ? findCol("precio total") : findCol("total");
  const iNotas = findCol("nota");
  const out: ImportedTransaction[] = [];
  ws.eachRow((row, rowNum) => {
    if (rowNum === 1) return;
    const get = (i: number) => (i >= 0 ? row.getCell(i + 1).value : undefined);
    const fecha = String(get(iFecha >= 0 ? iFecha : 0) || "");
    const descripcion = String(get(iDesc >= 0 ? iDesc : 1) || "");
    const categoria = String(get(iCat >= 0 ? iCat : 2) || "otros");
    const tipo = normTipo(get(iTipo >= 0 ? iTipo : 3));
    const monto = parseNumber(get(iMonto >= 0 ? iMonto : 4));
    if (!fecha && !descripcion) return;
    out.push({
      fecha: fecha || new Date().toISOString().slice(0, 10),
      descripcion,
      categoria,
      tipo,
      monto,
      precioUnitario: iPrecio >= 0 ? parseNumber(get(iPrecio)) : undefined,
      cantidad: iCant >= 0 ? parseNumber(get(iCant)) : undefined,
      precioTotal: iTotal >= 0 ? parseNumber(get(iTotal)) : undefined,
      notas: iNotas >= 0 ? String(get(iNotas) || "") : undefined,
    });
  });
  return out;
}
