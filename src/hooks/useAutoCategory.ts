/**
 * Auto-categorization for simple mode.
 * Maps keywords in transaction descriptions to category IDs.
 */

const KEYWORD_MAP: Record<string, string[]> = {
  // Income
  salario: ["salario", "sueldo", "nómina", "nomina", "pago mensual", "quincena"],
  freelance: ["freelance", "proyecto", "consultoría", "consultoria", "honorarios"],
  ventas: ["venta", "vendí", "vendi", "cobro", "factura cobrada"],
  inversiones: ["inversión", "inversion", "dividendo", "rendimiento", "intereses ganados"],
  regalo: ["regalo", "donación", "donacion", "propina", "bono"],
  "otros-ingresos": ["ingreso", "reembolso", "devolución", "devolucion"],

  // Expense
  alimentacion: ["comida", "almuerzo", "cena", "desayuno", "restaurante", "supermercado", "mercado", "tienda", "abarrotes", "grocery", "food", "pizza", "hamburguesa", "café", "cafe", "panadería", "panaderia", "carnicería", "carniceria"],
  transporte: ["gasolina", "gas", "uber", "taxi", "bus", "metro", "estacionamiento", "peaje", "transporte", "pasaje", "boleto"],
  vivienda: ["alquiler", "renta", "hipoteca", "mantenimiento", "condominio", "arriendo"],
  servicios: ["luz", "agua", "internet", "teléfono", "telefono", "celular", "electricidad", "cable", "streaming", "netflix", "spotify", "suscripción", "suscripcion"],
  salud: ["médico", "medico", "doctor", "farmacia", "medicina", "hospital", "dentista", "consulta", "lentes", "laboratorio"],
  entretenimiento: ["cine", "película", "pelicula", "juego", "videojuego", "concierto", "fiesta", "bar", "club", "diversión", "diversion", "ocio"],
  educacion: ["libro", "curso", "clase", "escuela", "universidad", "colegio", "matrícula", "matricula", "capacitación", "capacitacion", "taller"],
  ropa: ["ropa", "zapatos", "camisa", "pantalón", "pantalon", "vestido", "tienda de ropa", "zapatería", "zapateria"],
  tecnologia: ["computadora", "laptop", "celular", "teléfono", "telefono", "tablet", "software", "app", "electrónica", "electronica", "gadget"],
  "otros-gastos": [],
};

export function suggestCategory(description: string): string | null {
  if (!description || description.trim().length < 2) return null;
  
  const lower = description.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  for (const [categoryId, keywords] of Object.entries(KEYWORD_MAP)) {
    for (const keyword of keywords) {
      const normalizedKeyword = keyword.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (lower.includes(normalizedKeyword)) {
        return categoryId;
      }
    }
  }

  return null;
}
