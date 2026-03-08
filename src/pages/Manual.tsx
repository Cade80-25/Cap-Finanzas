import { Book, ChevronRight, Home, Receipt, Calendar, Target, Globe, Tag, PieChart, BookOpen, FileText, BarChart3, TrendingUp, HelpCircle, Sparkles, User, Settings, Bell, Search, Play, CheckCircle2, RotateCcw, GraduationCap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useTutorial } from "@/hooks/useTutorial";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const secciones = [
  {
    id: "inicio",
    titulo: "Primeros Pasos",
    icono: Home,
    contenido: [
      {
        subtitulo: "¿Qué es Cap Finanzas?",
        texto: "Cap Finanzas es una aplicación de finanzas personales diseñada para ayudarte a controlar tus ingresos, gastos y patrimonio de forma sencilla. Está pensada para personas de todas las edades que quieran aprender sobre contabilidad básica y mejorar su salud financiera."
      },
      {
        subtitulo: "Panel Principal",
        texto: "Al abrir la aplicación verás el Panel Principal con un resumen de tu situación financiera: balance total, ingresos y gastos del mes, ahorros, gráficos comparativos y transacciones recientes. Todos estos datos se generan automáticamente desde el Libro Diario."
      }
    ]
  },
  {
    id: "libro-diario",
    titulo: "Libro Diario",
    icono: BookOpen,
    contenido: [
      {
        subtitulo: "¿Qué es el Libro Diario?",
        texto: "El Libro Diario es el registro cronológico de todas tus transacciones contables. Es la base de todo el sistema: cada movimiento que registres aquí se reflejará automáticamente en el resto de la aplicación."
      },
      {
        subtitulo: "Cómo agregar una transacción",
        texto: "1. Haz clic en 'Nueva Transacción'\n2. Selecciona la fecha\n3. Elige la cuenta (Ingresos, Gastos Operativos, Banco, etc.)\n4. Escribe una descripción\n5. Ingresa el monto en 'Debe' para gastos/activos o en 'Haber' para ingresos/pasivos\n6. Guarda la transacción"
      },
      {
        subtitulo: "Sugerencias inteligentes",
        texto: "El sistema detecta automáticamente si estás registrando un ingreso o gasto basándose en palabras clave y te sugiere correcciones si algo parece incorrecto."
      }
    ]
  },
  {
    id: "transacciones",
    titulo: "Transacciones",
    icono: Receipt,
    contenido: [
      {
        subtitulo: "Vista de transacciones",
        texto: "Esta sección muestra todas las transacciones registradas con filtros para buscar por fecha, tipo o categoría. Puedes ver el historial completo de movimientos."
      }
    ]
  },
  {
    id: "calendario",
    titulo: "Calendario Financiero",
    icono: Calendar,
    contenido: [
      {
        subtitulo: "Visualización temporal",
        texto: "El calendario te permite ver tus transacciones organizadas por fecha. Puedes seleccionar cualquier día para ver los movimientos de esa fecha."
      },
      {
        subtitulo: "Próximos eventos",
        texto: "En esta sección puedes programar pagos recurrentes o eventos financieros futuros para no olvidarte de fechas importantes."
      }
    ]
  },
  {
    id: "presupuesto",
    titulo: "Presupuesto",
    icono: Target,
    contenido: [
      {
        subtitulo: "Crear un presupuesto",
        texto: "1. Haz clic en 'Nuevo Presupuesto'\n2. Define una categoría (ej: Alquiler, Comida, Transporte)\n3. Establece el monto máximo a gastar\n4. Opcionalmente, indica cuánto ya has gastado"
      },
      {
        subtitulo: "Seguimiento",
        texto: "El sistema compara automáticamente tus gastos reales con el presupuesto y te alerta cuando estás cerca o has excedido el límite."
      }
    ]
  },
  {
    id: "categorias",
    titulo: "Categorías",
    icono: Tag,
    contenido: [
      {
        subtitulo: "Gestión de categorías",
        texto: "Las categorías se crean automáticamente desde las cuentas que usas en el Libro Diario. Aquí puedes ver un resumen de cuánto has gastado o ganado por cada categoría."
      }
    ]
  },
  {
    id: "resumen",
    titulo: "Resumen",
    icono: PieChart,
    contenido: [
      {
        subtitulo: "Vista general",
        texto: "El Resumen te muestra gráficos de tus finanzas: tendencias mensuales de ingresos y gastos, distribución por categorías y comparativas visuales para entender mejor tu situación."
      }
    ]
  },
  {
    id: "libro-mayor",
    titulo: "Libro Mayor",
    icono: FileText,
    contenido: [
      {
        subtitulo: "¿Qué es el Libro Mayor?",
        texto: "El Libro Mayor agrupa todas las transacciones por cuenta. Así puedes ver el historial y balance de cada cuenta individual (Banco, Ingresos, Gastos, etc.)."
      }
    ]
  },
  {
    id: "balance",
    titulo: "Balance General",
    icono: BarChart3,
    contenido: [
      {
        subtitulo: "Estado patrimonial",
        texto: "El Balance General muestra tu situación financiera en un momento dado: todos tus Activos (lo que tienes), Pasivos (lo que debes) y el Patrimonio Neto resultante."
      },
      {
        subtitulo: "Ratios financieros",
        texto: "Incluye indicadores como ratio de liquidez, ratio de endeudamiento y ratio de patrimonio para evaluar tu salud financiera."
      }
    ]
  },
  {
    id: "resultados",
    titulo: "Estado de Resultados",
    icono: TrendingUp,
    contenido: [
      {
        subtitulo: "Pérdidas y ganancias",
        texto: "El Estado de Resultados muestra cuánto has ganado y gastado en un período, calculando el resultado neto (ganancia o pérdida). Incluye gráficos de tendencias y estadísticas detalladas."
      }
    ]
  },
  {
    id: "monedas",
    titulo: "Conversor de Monedas",
    icono: Globe,
    contenido: [
      {
        subtitulo: "Conversión en tiempo real",
        texto: "Convierte montos entre diferentes monedas del mundo usando tasas de cambio actualizadas."
      }
    ]
  },
  {
    id: "enciclopedia",
    titulo: "Enciclopedia",
    icono: HelpCircle,
    contenido: [
      {
        subtitulo: "Conceptos financieros",
        texto: "Consulta definiciones y explicaciones de términos contables y financieros. Ideal para aprender mientras usas la aplicación."
      }
    ]
  },
  {
    id: "recomendaciones",
    titulo: "Recomendaciones",
    icono: Sparkles,
    contenido: [
      {
        subtitulo: "Tutor Educativo",
        texto: "Disponible en todos los planes. Haz preguntas sobre finanzas personales y recibe respuestas educativas generadas por IA. Ideal para aprender conceptos como ahorro, presupuesto e interés compuesto."
      },
      {
        subtitulo: "Chat Financiero",
        texto: "Disponible con Contabilidad Tradicional ($11) o Licencia Completa ($13). Conversa con la IA sobre mercados, inversiones y estrategias financieras avanzadas."
      },
      {
        subtitulo: "Bolsas en Vivo",
        texto: "Exclusivo de la Licencia Completa ($13). Accede a datos del mercado en tiempo real con widgets de bolsas internacionales como NYSE, NASDAQ, BMV y más."
      }
    ]
  },
  {
    id: "notificaciones",
    titulo: "Notificaciones",
    icono: Bell,
    contenido: [
      {
        subtitulo: "Alertas del sistema",
        texto: "Recibe avisos sobre presupuestos excedidos, resúmenes mensuales y otras alertas importantes. Puedes configurar cómo recibir las notificaciones."
      }
    ]
  },
  {
    id: "configuracion",
    titulo: "Configuración",
    icono: Settings,
    contenido: [
      {
        subtitulo: "Personalización",
        texto: "Ajusta el tema (claro/oscuro), configura la seguridad con PIN, importa o exporta tus datos, y personaliza otros aspectos de la aplicación."
      },
      {
        subtitulo: "Respaldo de datos",
        texto: "Puedes exportar todos tus datos en formato JSON o CSV para guardarlos externamente, e importarlos en otra instalación si es necesario."
      }
    ]
  }
];

const preguntasFrecuentes = [
  {
    pregunta: "¿Cómo empiezo a usar Cap Finanzas?",
    respuesta: "Ve al Libro Diario y comienza a registrar tus transacciones. Cada vez que recibas dinero (salario, ventas, etc.) o gastes (compras, servicios, etc.), créalo como una transacción. El resto de la aplicación se actualizará automáticamente."
  },
  {
    pregunta: "¿Qué es 'Debe' y 'Haber'?",
    respuesta: "En contabilidad, 'Debe' registra los aumentos de activos y gastos, mientras que 'Haber' registra los aumentos de pasivos, patrimonio e ingresos. Para simplificar: usa 'Haber' para ingresos y 'Debe' para gastos."
  },
  {
    pregunta: "¿Mis datos se guardan en la nube?",
    respuesta: "No, todos tus datos se guardan localmente en tu dispositivo. Esto garantiza tu privacidad. Puedes exportarlos manualmente desde Configuración si deseas hacer un respaldo."
  },
  {
    pregunta: "¿Puedo usar la aplicación sin internet?",
    respuesta: "Sí, Cap Finanzas funciona completamente offline. Solo necesitas internet para el conversor de monedas (tasas actualizadas) y para buscar actualizaciones."
  },
  {
    pregunta: "¿Cómo protejo mis datos con PIN?",
    respuesta: "Ve a Configuración > Seguridad y activa el 'PIN de Seguridad'. Podrás establecer un PIN que se solicitará cada vez que abras la aplicación."
  }
];

export default function Manual() {
  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold mb-2">Manual de Usuario</h1>
        <p className="text-muted-foreground">
          Guía completa para aprovechar al máximo Cap Finanzas
        </p>
      </div>

      {/* Índice rápido */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Book className="h-5 w-5" />
            Índice de Contenidos
          </CardTitle>
          <CardDescription>
            Navega rápidamente a cualquier sección del manual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {secciones.map((seccion) => (
              <a
                key={seccion.id}
                href={`#${seccion.id}`}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <seccion.icono className="h-4 w-4 text-primary" />
                <span className="text-sm">{seccion.titulo}</span>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Secciones del manual */}
      <div className="space-y-6">
        {secciones.map((seccion) => (
          <Card key={seccion.id} id={seccion.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <seccion.icono className="h-5 w-5 text-primary" />
                {seccion.titulo}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {seccion.contenido.map((item, index) => (
                <div key={index}>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-primary" />
                    {item.subtitulo}
                  </h4>
                  <p className="text-muted-foreground whitespace-pre-line pl-6">
                    {item.texto}
                  </p>
                  {index < seccion.contenido.length - 1 && (
                    <Separator className="mt-4" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Preguntas frecuentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            Preguntas Frecuentes
          </CardTitle>
          <CardDescription>
            Respuestas a las dudas más comunes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {preguntasFrecuentes.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.pregunta}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.respuesta}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Consejos finales */}
      <Card className="bg-gradient-primary">
        <CardHeader>
          <CardTitle className="text-primary-foreground">
            💡 Consejo del Día
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-primary-foreground/90">
            Registra tus transacciones el mismo día que ocurren. Esto te ayudará a mantener un control preciso de tus finanzas y a no olvidar ningún movimiento importante.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
