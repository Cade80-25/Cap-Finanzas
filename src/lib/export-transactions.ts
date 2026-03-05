import ExcelJS from "exceljs";

export interface ExportTransaction {
  fecha: string;
  descripcion: string;
  categoria: string;
  tipo: string;
  monto: number;
}

// ── CSV ──
export function exportToCSV(transactions: ExportTransaction[], filename?: string) {
  if (transactions.length === 0) return;
  const headers = ["Fecha", "Descripción", "Categoría", "Tipo", "Monto"];
  const rows = transactions.map((t) => [
    t.fecha,
    `"${t.descripcion.replace(/"/g, '""')}"`,
    `"${t.categoria.replace(/"/g, '""')}"`,
    t.tipo,
    t.monto.toFixed(2),
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  downloadBlob(
    new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }),
    filename ?? `transacciones_${dateStamp()}.csv`
  );
}

// ── Excel ──
export async function exportToExcel(transactions: ExportTransaction[], filename?: string) {
  if (transactions.length === 0) return;

  const wb = new ExcelJS.Workbook();
  wb.creator = "Cap Finanzas";
  wb.created = new Date();

  const ws = wb.addWorksheet("Transacciones");

  // Title row
  ws.mergeCells("A1:E1");
  const titleCell = ws.getCell("A1");
  titleCell.value = "Reporte de Transacciones";
  titleCell.font = { bold: true, size: 16, color: { argb: "FF1A1A2E" } };
  titleCell.alignment = { horizontal: "center" };

  // Date row
  ws.mergeCells("A2:E2");
  const dateCell = ws.getCell("A2");
  dateCell.value = `Generado el ${new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}`;
  dateCell.font = { size: 10, color: { argb: "FF666666" } };
  dateCell.alignment = { horizontal: "center" };

  // Empty row
  ws.addRow([]);

  // Header row
  const headerRow = ws.addRow(["Fecha", "Descripción", "Categoría", "Tipo", "Monto"]);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1A1A2E" } };
    cell.alignment = { horizontal: "center" };
    cell.border = {
      bottom: { style: "thin", color: { argb: "FF333333" } },
    };
  });

  // Data rows
  let totalIngresos = 0;
  let totalGastos = 0;

  transactions.forEach((t) => {
    const row = ws.addRow([t.fecha, t.descripcion, t.categoria, t.tipo, t.monto]);
    const montoCell = row.getCell(5);
    montoCell.numFmt = '#,##0.00';

    if (t.tipo === "Ingreso") {
      montoCell.font = { color: { argb: "FF16A34A" } };
      totalIngresos += t.monto;
    } else if (t.tipo === "Gasto") {
      montoCell.font = { color: { argb: "FFDC2626" } };
      totalGastos += Math.abs(t.monto);
    }

    // Zebra striping
    if (ws.rowCount % 2 === 0) {
      row.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8F9FA" } };
      });
    }
  });

  // Summary rows
  ws.addRow([]);
  const summaryHeader = ws.addRow(["", "", "", "Resumen", ""]);
  summaryHeader.getCell(4).font = { bold: true, size: 12 };

  const ingresosRow = ws.addRow(["", "", "", "Total Ingresos", totalIngresos]);
  ingresosRow.getCell(5).numFmt = '#,##0.00';
  ingresosRow.getCell(5).font = { bold: true, color: { argb: "FF16A34A" } };

  const gastosRow = ws.addRow(["", "", "", "Total Gastos", totalGastos]);
  gastosRow.getCell(5).numFmt = '#,##0.00';
  gastosRow.getCell(5).font = { bold: true, color: { argb: "FFDC2626" } };

  const balanceRow = ws.addRow(["", "", "", "Balance", totalIngresos - totalGastos]);
  balanceRow.getCell(5).numFmt = '#,##0.00';
  balanceRow.getCell(4).font = { bold: true, size: 12 };
  balanceRow.getCell(5).font = { bold: true, size: 12, color: { argb: totalIngresos - totalGastos >= 0 ? "FF16A34A" : "FFDC2626" } };

  // Column widths
  ws.columns = [
    { width: 14 },
    { width: 35 },
    { width: 20 },
    { width: 12 },
    { width: 15 },
  ];

  const buffer = await wb.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    filename ?? `transacciones_${dateStamp()}.xlsx`
  );
}

// ── PDF (HTML-based) ──
export function exportToPDF(transactions: ExportTransaction[], filename?: string) {
  if (transactions.length === 0) return;

  let totalIngresos = 0;
  let totalGastos = 0;
  transactions.forEach((t) => {
    if (t.tipo === "Ingreso") totalIngresos += t.monto;
    else if (t.tipo === "Gasto") totalGastos += Math.abs(t.monto);
  });
  const balance = totalIngresos - totalGastos;

  const rows = transactions
    .map(
      (t, i) => `
    <tr style="background:${i % 2 === 0 ? "#fff" : "#f8f9fa"}">
      <td style="padding:8px;border-bottom:1px solid #eee">${t.fecha}</td>
      <td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(t.descripcion)}</td>
      <td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(t.categoria)}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">
        <span style="padding:2px 8px;border-radius:12px;font-size:12px;background:${t.tipo === "Ingreso" ? "#dcfce7" : t.tipo === "Gasto" ? "#fee2e2" : "#f3f4f6"};color:${t.tipo === "Ingreso" ? "#16a34a" : t.tipo === "Gasto" ? "#dc2626" : "#333"}">${t.tipo}</span>
      </td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;font-weight:600;color:${t.monto >= 0 ? "#16a34a" : "#dc2626"}">${t.monto >= 0 ? "+" : ""}$${Math.abs(t.monto).toFixed(2)}</td>
    </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Reporte de Transacciones</title>
<style>
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin:40px; color:#1a1a2e; }
  h1 { font-size:24px; margin-bottom:4px; }
  .subtitle { color:#666; font-size:13px; margin-bottom:24px; }
  table { width:100%; border-collapse:collapse; margin-bottom:32px; }
  th { background:#1a1a2e; color:#fff; padding:10px 8px; text-align:left; font-size:13px; }
  th:last-child { text-align:right; }
  .summary { display:flex; gap:24px; }
  .summary-card { flex:1; padding:16px; border-radius:12px; text-align:center; }
  .summary-card h3 { font-size:13px; margin:0 0 4px; }
  .summary-card p { font-size:22px; font-weight:700; margin:0; }
</style></head><body>
<h1>📊 Reporte de Transacciones</h1>
<p class="subtitle">Generado el ${new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })} — ${transactions.length} movimientos</p>
<div class="summary">
  <div class="summary-card" style="background:#dcfce7"><h3>Ingresos</h3><p style="color:#16a34a">+$${totalIngresos.toFixed(2)}</p></div>
  <div class="summary-card" style="background:#fee2e2"><h3>Gastos</h3><p style="color:#dc2626">-$${totalGastos.toFixed(2)}</p></div>
  <div class="summary-card" style="background:${balance >= 0 ? "#dbeafe" : "#fee2e2"}"><h3>Balance</h3><p style="color:${balance >= 0 ? "#2563eb" : "#dc2626"}">$${balance.toFixed(2)}</p></div>
</div>
<table><thead><tr><th>Fecha</th><th>Descripción</th><th>Categoría</th><th style="text-align:center">Tipo</th><th style="text-align:right">Monto</th></tr></thead><tbody>${rows}</tbody></table>
<p style="text-align:center;color:#999;font-size:11px">Cap Finanzas — Reporte generado automáticamente</p>
</body></html>`;

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.print();
  };
}

// ── Helpers ──
function dateStamp() {
  return new Date().toISOString().split("T")[0];
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(str: string) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
