import { useState } from "react";
import { Search, BookOpen } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const terms = [
  // Conceptos Básicos
  {
    title: "Activo",
    category: "Conceptos Básicos",
    definition: "Son todos los bienes y derechos que posee una persona o empresa. Ejemplo: dinero en el banco, una casa, un coche, dinero que te deben. Se clasifican en activos corrientes (efectivo, cuentas por cobrar) y activos no corrientes (edificios, equipos).",
  },
  {
    title: "Pasivo",
    category: "Conceptos Básicos",
    definition: "Son las deudas y obligaciones que tiene una persona o empresa. Ejemplo: préstamos bancarios, facturas por pagar, tarjetas de crédito. Pueden ser pasivos corrientes (deudas a corto plazo) o pasivos no corrientes (deudas a largo plazo).",
  },
  {
    title: "Patrimonio",
    category: "Conceptos Básicos",
    definition: "Es la diferencia entre lo que tienes (activos) y lo que debes (pasivos). Representa tu riqueza neta. También se conoce como capital propio o patrimonio neto. Fórmula: Patrimonio = Activos - Pasivos.",
  },
  {
    title: "Ingreso",
    category: "Conceptos Básicos",
    definition: "Es el dinero que entra a tu bolsillo o cuenta. Ejemplo: salario, ventas, regalos, intereses bancarios. Los ingresos aumentan tu patrimonio y pueden ser recurrentes (salario) o eventuales (bonos).",
  },
  {
    title: "Gasto",
    category: "Conceptos Básicos",
    definition: "Es el dinero que sale de tu bolsillo o cuenta. Ejemplo: compras de comida, facturas de servicios, transporte. Los gastos disminuyen tu patrimonio y pueden ser fijos (alquiler) o variables (entretenimiento).",
  },
  {
    title: "Capital",
    category: "Conceptos Básicos",
    definition: "Es el dinero o recursos que se invierten para iniciar o mantener un negocio o actividad económica. Puede provenir de ahorros personales, préstamos o inversionistas.",
  },
  {
    title: "Liquidez",
    category: "Conceptos Básicos",
    definition: "Es la capacidad de convertir rápidamente un activo en dinero efectivo sin perder valor. El dinero en efectivo es el activo más líquido, mientras que una propiedad es menos líquida.",
  },
  {
    title: "Solvencia",
    category: "Conceptos Básicos",
    definition: "Es la capacidad de una persona o empresa para cumplir con todas sus obligaciones financieras a largo plazo. Se mide comparando los activos totales con los pasivos totales.",
  },

  // Libros Contables
  {
    title: "Libro Diario",
    category: "Libros Contables",
    definition: "Es como un diario personal, pero de finanzas. Aquí registras todas tus transacciones en orden cronológico (por fecha). Cada registro se llama 'asiento contable' y debe incluir fecha, descripción, cuentas afectadas y montos.",
  },
  {
    title: "Libro Mayor",
    category: "Libros Contables",
    definition: "Organiza todas las transacciones por categorías o cuentas. Te ayuda a ver cuánto has gastado en cada cosa. Agrupa los movimientos del Libro Diario por cuenta para facilitar el análisis y la preparación de estados financieros.",
  },
  {
    title: "Asiento Contable",
    category: "Libros Contables",
    definition: "Es el registro de una transacción en el Libro Diario. Incluye fecha, descripción, cuentas del Debe y Haber, y sus montos. La suma del Debe siempre debe ser igual a la suma del Haber (partida doble).",
  },
  {
    title: "Partida Doble",
    category: "Libros Contables",
    definition: "Principio fundamental de la contabilidad: toda transacción afecta al menos dos cuentas, una en el Debe y otra en el Haber. Esto mantiene la ecuación contable en equilibrio: Activo = Pasivo + Patrimonio.",
  },

  // Estados Financieros
  {
    title: "Balance General",
    category: "Estados Financieros",
    definition: "Es como una foto de tu situación financiera en un momento específico. Muestra qué tienes (activos), qué debes (pasivos) y cuál es tu patrimonio. También se llama Estado de Situación Financiera.",
  },
  {
    title: "Estado de Resultados",
    category: "Estados Financieros",
    definition: "Muestra si ganaste o perdiste dinero en un período. Compara tus ingresos con tus gastos. También se conoce como Estado de Pérdidas y Ganancias. Resultado Neto = Ingresos - Gastos.",
  },
  {
    title: "Estado de Flujo de Efectivo",
    category: "Estados Financieros",
    definition: "Muestra el movimiento de dinero (entradas y salidas) durante un período. Se divide en: actividades operativas, de inversión y de financiamiento. Ayuda a entender la liquidez real del negocio.",
  },
  {
    title: "Estado de Cambios en el Patrimonio",
    category: "Estados Financieros",
    definition: "Explica cómo cambió el patrimonio durante un período. Muestra aportes de capital, retiros, utilidades retenidas y otras variaciones patrimoniales.",
  },

  // Conceptos Contables
  {
    title: "Debe",
    category: "Conceptos Contables",
    definition: "Es la columna izquierda de un registro contable. Representa aumentos en activos o gastos, y disminuciones en pasivos, patrimonio o ingresos. Se anota en el lado izquierdo de la cuenta T.",
  },
  {
    title: "Haber",
    category: "Conceptos Contables",
    definition: "Es la columna derecha de un registro contable. Representa aumentos en pasivos, patrimonio o ingresos, y disminuciones en activos o gastos. Se anota en el lado derecho de la cuenta T.",
  },
  {
    title: "Cuenta Contable",
    category: "Conceptos Contables",
    definition: "Es una categoría donde agrupas transacciones similares. Ejemplo: 'Banco', 'Gastos de Alimentación', 'Salario'. Cada cuenta tiene un código único y puede tener subcuentas.",
  },
  {
    title: "Saldo",
    category: "Conceptos Contables",
    definition: "Es la diferencia entre el Debe y el Haber de una cuenta. Si el Debe es mayor, el saldo es deudor. Si el Haber es mayor, el saldo es acreedor. Representa el valor neto de la cuenta en un momento dado.",
  },
  {
    title: "Depreciación",
    category: "Conceptos Contables",
    definition: "Es la disminución del valor de un activo fijo con el tiempo debido al uso, desgaste u obsolescencia. Por ejemplo, un automóvil pierde valor cada año. Se registra como gasto y reduce el valor del activo en el balance.",
  },
  {
    title: "Amortización",
    category: "Conceptos Contables",
    definition: "Similar a la depreciación, pero se aplica a activos intangibles (como software, patentes) o a la distribución de pagos de un préstamo a lo largo del tiempo.",
  },
  {
    title: "Provisión",
    category: "Conceptos Contables",
    definition: "Es un monto que se reserva para cubrir gastos futuros probables o pérdidas esperadas. Ejemplo: provisión para vacaciones de empleados, provisión para cuentas incobrables.",
  },
  {
    title: "Costo de Ventas",
    category: "Conceptos Contables",
    definition: "Es el costo directo de producir o adquirir los bienes o servicios que vendiste. Incluye materia prima, mano de obra directa y costos de producción. Se resta de las ventas para calcular la ganancia bruta.",
  },

  // Análisis Financiero
  {
    title: "Razón Corriente",
    category: "Análisis Financiero",
    definition: "Mide la capacidad de pagar deudas a corto plazo. Se calcula: Activo Corriente / Pasivo Corriente. Un resultado mayor a 1 indica que tienes suficientes recursos para cubrir tus obligaciones inmediatas.",
  },
  {
    title: "Rentabilidad",
    category: "Análisis Financiero",
    definition: "Mide qué tan eficientemente generas ganancias. ROE (Return on Equity) = Utilidad Neta / Patrimonio × 100%. Indica cuánto ganas por cada peso invertido.",
  },
  {
    title: "Punto de Equilibrio",
    category: "Análisis Financiero",
    definition: "Es el nivel de ventas donde los ingresos son iguales a los gastos (ni ganas ni pierdes). Por encima de este punto empiezas a tener ganancias.",
  },
  {
    title: "Margen de Utilidad",
    category: "Análisis Financiero",
    definition: "Porcentaje de ganancia sobre las ventas. Margen Neto = (Utilidad Neta / Ventas) × 100%. Por ejemplo, si vendes $100 y ganas $20, tu margen es 20%.",
  },
  {
    title: "EBITDA",
    category: "Análisis Financiero",
    definition: "Ganancias antes de Intereses, Impuestos, Depreciación y Amortización. Mide la rentabilidad operativa del negocio sin considerar decisiones financieras ni contables.",
  },

  // Presupuesto y Planificación
  {
    title: "Presupuesto",
    category: "Presupuesto",
    definition: "Es un plan detallado de ingresos y gastos esperados para un período futuro. Te ayuda a controlar tus finanzas y alcanzar objetivos. Incluye presupuesto de ventas, gastos operativos e inversiones.",
  },
  {
    title: "Flujo de Caja",
    category: "Presupuesto",
    definition: "Es la proyección del dinero que entra y sale de tu cuenta. Un flujo de caja positivo significa que ingresas más de lo que gastas. Es fundamental para la planificación financiera.",
  },
  {
    title: "Fondo de Emergencia",
    category: "Presupuesto",
    definition: "Dinero reservado para gastos imprevistos o emergencias. Los expertos recomiendan tener ahorrado el equivalente a 3-6 meses de gastos básicos.",
  },
  {
    title: "Meta Financiera",
    category: "Presupuesto",
    definition: "Objetivo económico específico que quieres alcanzar en un plazo determinado. Puede ser a corto (menos de 1 año), mediano (1-5 años) o largo plazo (más de 5 años).",
  },

  // Inversiones
  {
    title: "Inversión",
    category: "Inversiones",
    definition: "Es destinar dinero o recursos con la expectativa de obtener ganancias en el futuro. Puede ser en negocios, acciones, bonos, bienes raíces, educación, etc.",
  },
  {
    title: "Interés Simple",
    category: "Inversiones",
    definition: "Interés calculado solo sobre el capital inicial. Fórmula: I = C × r × t, donde C es capital, r es tasa de interés y t es tiempo.",
  },
  {
    title: "Interés Compuesto",
    category: "Inversiones",
    definition: "Interés calculado sobre el capital inicial más los intereses acumulados. 'El interés sobre el interés'. Es más poderoso que el interés simple para hacer crecer el dinero a largo plazo.",
  },
  {
    title: "Diversificación",
    category: "Inversiones",
    definition: "Estrategia de distribuir inversiones en diferentes activos para reducir riesgos. 'No pongas todos los huevos en una canasta'. Reduce el impacto si una inversión tiene mal desempeño.",
  },
  {
    title: "Riesgo",
    category: "Inversiones",
    definition: "Probabilidad de perder dinero en una inversión. Generalmente, mayor riesgo significa potencial de mayores ganancias (pero también mayores pérdidas). Es importante evaluar tu tolerancia al riesgo.",
  },
  {
    title: "Rendimiento",
    category: "Inversiones",
    definition: "Ganancia o pérdida generada por una inversión, generalmente expresada como porcentaje. Rendimiento = (Valor Final - Valor Inicial) / Valor Inicial × 100%.",
  },

  // Impuestos y Legal
  {
    title: "Impuesto",
    category: "Impuestos",
    definition: "Pago obligatorio al gobierno. Los más comunes son impuesto sobre la renta (ganancias), IVA (consumo), impuestos a la propiedad. Se utilizan para financiar servicios públicos.",
  },
  {
    title: "Deducible",
    category: "Impuestos",
    definition: "Gasto que puedes restar de tus ingresos antes de calcular impuestos, reduciendo la cantidad de impuestos que pagas. Varía según las leyes fiscales de cada país.",
  },
  {
    title: "Factura",
    category: "Impuestos",
    definition: "Documento legal que comprueba una venta o prestación de servicio. Incluye datos del vendedor, comprador, descripción, precio e impuestos. Es necesaria para fines fiscales y contables.",
  },
  {
    title: "Retención",
    category: "Impuestos",
    definition: "Cantidad de impuesto que se descuenta directamente del pago (por ejemplo, del salario). El empleador o pagador retiene el impuesto y lo transfiere al gobierno.",
  },

  // Crédito y Deuda
  {
    title: "Crédito",
    category: "Crédito y Deuda",
    definition: "Dinero prestado que debe devolverse, generalmente con intereses. Puede ser en forma de préstamo bancario, tarjeta de crédito o línea de crédito.",
  },
  {
    title: "Tasa de Interés",
    category: "Crédito y Deuda",
    definition: "Porcentaje que se paga por usar dinero prestado o que se gana por dinero ahorrado/invertido. Puede ser fija (no cambia) o variable (cambia según el mercado).",
  },
  {
    title: "Plazo",
    category: "Crédito y Deuda",
    definition: "Tiempo acordado para devolver un préstamo. Plazos más largos significan cuotas mensuales más bajas, pero más intereses totales pagados.",
  },
  {
    title: "Garantía",
    category: "Crédito y Deuda",
    definition: "Activo que ofreces como respaldo de un préstamo. Si no pagas, el prestamista puede quedarse con la garantía (por ejemplo, tu casa en una hipoteca).",
  },
  {
    title: "Historial Crediticio",
    category: "Crédito y Deuda",
    definition: "Registro de cómo has manejado tus deudas y créditos en el pasado. Un buen historial facilita obtener préstamos con mejores tasas de interés.",
  },

  // Ahorro
  {
    title: "Ahorro",
    category: "Ahorro",
    definition: "Parte de los ingresos que no se gasta y se guarda para el futuro. La regla 50/30/20 sugiere ahorrar al menos el 20% de tus ingresos.",
  },
  {
    title: "Cuenta de Ahorro",
    category: "Ahorro",
    definition: "Cuenta bancaria que paga intereses sobre el dinero depositado. Ideal para guardar dinero de forma segura mientras genera rendimientos modestos.",
  },
  {
    title: "Inflación",
    category: "Ahorro",
    definition: "Aumento general de precios con el tiempo, que reduce el poder adquisitivo del dinero. Si la inflación es 5% anual, lo que cuesta $100 hoy costará $105 el próximo año.",
  },
];

export default function Enciclopedia() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTerms = terms.filter(
    (term) =>
      term.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      term.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
      term.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = Array.from(new Set(terms.map((term) => term.category)));

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold mb-2">Enciclopedia Financiera</h1>
        <p className="text-muted-foreground">
          Aprende términos contables de forma sencilla
        </p>
      </div>

      <Card className="shadow-soft bg-gradient-primary">
        <CardHeader>
          <CardTitle className="text-primary-foreground flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            Buscar Término
          </CardTitle>
          <CardDescription className="text-primary-foreground/80">
            Escribe cualquier palabra relacionada con finanzas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Ej: activo, ingreso, balance..."
              className="pl-10 bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {categories.map((category) => {
        const categoryTerms = filteredTerms.filter((term) => term.category === category);
        if (categoryTerms.length === 0) return null;

        return (
          <Card key={category} className="shadow-soft">
            <CardHeader>
              <CardTitle>{category}</CardTitle>
              <CardDescription>{categoryTerms.length} términos</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {categoryTerms.map((term, idx) => (
                  <AccordionItem key={idx} value={`item-${idx}`}>
                    <AccordionTrigger className="text-left font-semibold hover:text-primary">
                      {term.title}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {term.definition}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        );
      })}

      {filteredTerms.length === 0 && (
        <Card className="shadow-soft">
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">
              No se encontraron términos que coincidan con tu búsqueda.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
