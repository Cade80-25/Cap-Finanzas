import { useState } from "react";
import { Search, BookOpen } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const terms = [
  {
    title: "Activo",
    category: "Básicos",
    definition: "Son todos los bienes y derechos que posee una persona o empresa. Ejemplo: dinero en el banco, una casa, un coche, dinero que te deben.",
  },
  {
    title: "Pasivo",
    category: "Básicos",
    definition: "Son las deudas y obligaciones que tiene una persona o empresa. Ejemplo: préstamos bancarios, facturas por pagar, tarjetas de crédito.",
  },
  {
    title: "Patrimonio",
    category: "Básicos",
    definition: "Es la diferencia entre lo que tienes (activos) y lo que debes (pasivos). Representa tu riqueza neta.",
  },
  {
    title: "Ingreso",
    category: "Básicos",
    definition: "Es el dinero que entra a tu bolsillo o cuenta. Ejemplo: salario, ventas, regalos, intereses bancarios.",
  },
  {
    title: "Gasto",
    category: "Básicos",
    definition: "Es el dinero que sale de tu bolsillo o cuenta. Ejemplo: compras de comida, facturas de servicios, transporte.",
  },
  {
    title: "Libro Diario",
    category: "Libros Contables",
    definition: "Es como un diario personal, pero de finanzas. Aquí registras todas tus transacciones en orden cronológico (por fecha).",
  },
  {
    title: "Libro Mayor",
    category: "Libros Contables",
    definition: "Organiza todas las transacciones por categorías o cuentas. Te ayuda a ver cuánto has gastado en cada cosa.",
  },
  {
    title: "Balance General",
    category: "Estados Financieros",
    definition: "Es como una foto de tu situación financiera en un momento específico. Muestra qué tienes, qué debes y cuál es tu patrimonio.",
  },
  {
    title: "Estado de Resultados",
    category: "Estados Financieros",
    definition: "Muestra si ganaste o perdiste dinero en un período. Compara tus ingresos con tus gastos.",
  },
  {
    title: "Debe",
    category: "Conceptos Contables",
    definition: "Es la columna izquierda de un registro contable. Representa aumentos en activos o disminuciones en pasivos.",
  },
  {
    title: "Haber",
    category: "Conceptos Contables",
    definition: "Es la columna derecha de un registro contable. Representa disminuciones en activos o aumentos en pasivos.",
  },
  {
    title: "Cuenta Contable",
    category: "Conceptos Contables",
    definition: "Es una categoría donde agrupas transacciones similares. Ejemplo: 'Banco', 'Gastos de Alimentación', 'Salario'.",
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
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
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
