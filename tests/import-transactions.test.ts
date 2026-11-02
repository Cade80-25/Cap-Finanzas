import { describe, it, expect } from "vitest";
import { importFromCSV } from "../src/lib/import-transactions";

describe("importFromCSV", () => {
  it("parses rows with unit price", async () => {
    const csv = "fecha,descripcion,categoria,tipo,monto,cantidad,precio unitario,precio total\n2026-01-01,Cafe,alimentos,Gasto,10,2,5,10";
    const rows = await importFromCSV(csv);
    expect(rows.length).toBe(1);
    expect(rows[0].descripcion).toBe("Cafe");
    expect(rows[0].precioUnitario).toBe(5);
    expect(rows[0].cantidad).toBe(2);
    expect(rows[0].precioTotal).toBe(10);
  });
});
