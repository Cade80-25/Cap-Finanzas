import { useState } from "react";
import { Sparkles, TrendingUp, BookOpen, Target, MessageCircle, Send } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Recomendaciones() {
  const [consulta, setConsulta] = useState("");
  const [respuesta, setRespuesta] = useState("");
  const [loading, setLoading] = useState(false);

  const recomendacionesAutomaticas = [
    {
      tipo: "Ahorro",
      icon: Target,
      titulo: "Oportunidad de Ahorro Detectada",
      descripcion: "Tus gastos en entretenimiento aumentaron 25% este mes. Considera reducir $200 para cumplir tu meta de ahorro.",
      prioridad: "alta"
    },
    {
      tipo: "Inversión",
      icon: TrendingUp,
      titulo: "Momento para Invertir",
      descripcion: "Tienes $5,000 sin asignar en tu presupuesto. Considera invertir en un fondo de bajo riesgo para generar rendimientos.",
      prioridad: "media"
    },
    {
      tipo: "Educación",
      icon: BookOpen,
      titulo: "Aprende sobre Inversiones",
      descripcion: "Recomendación: Lee sobre 'Fondos Indexados' en la Enciclopedia para mejorar tus conocimientos financieros.",
      prioridad: "baja"
    }
  ];

  const preguntasSugeridas = [
    "¿Cómo puedo reducir mis gastos mensuales?",
    "¿Qué es un fondo de inversión?",
    "¿Cuánto debería ahorrar cada mes?",
    "Explícame qué es el interés compuesto",
    "¿Cómo crear un presupuesto efectivo?"
  ];

  const handleConsulta = async () => {
    if (!consulta.trim()) return;
    
    setLoading(true);
    // Simulación de respuesta de IA
    setTimeout(() => {
      setRespuesta(`📚 **Respuesta educativa sobre: "${consulta}"**\n\nComo tu tutor financiero, te recomiendo lo siguiente:\n\n1. **Análisis de tu situación**: Basándome en tus datos actuales, veo que estás construyendo buenos hábitos financieros.\n\n2. **Recomendación específica**: Para ${consulta.toLowerCase()}, te sugiero comenzar por revisar la sección de Enciclopedia donde encontrarás términos relacionados.\n\n3. **Acción práctica**: Establece metas pequeñas y medibles. Usa la sección de Presupuesto para planificar tus objetivos.\n\n4. **Recursos adicionales**: Consulta el Estado de Resultados para analizar tus patrones de ingresos y gastos.\n\n💡 *Tip del día*: La clave del éxito financiero es la consistencia, no la perfección.`);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
          Recomendaciones Inteligentes
        </h1>
        <p className="text-muted-foreground">
          Tu tutor financiero personal con IA
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {recomendacionesAutomaticas.map((rec, idx) => (
          <Card key={idx} className="shadow-soft hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <rec.icon className="h-8 w-8 text-primary mb-2" />
                <Badge variant={rec.prioridad === "alta" ? "destructive" : rec.prioridad === "media" ? "default" : "secondary"}>
                  {rec.prioridad === "alta" ? "Alta Prioridad" : rec.prioridad === "media" ? "Prioridad Media" : "Sugerencia"}
                </Badge>
              </div>
              <CardTitle className="text-lg">{rec.titulo}</CardTitle>
              <CardDescription>{rec.tipo}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{rec.descripcion}</p>
              <Button variant="outline" size="sm" className="w-full">
                Ver Detalles
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-primary" />
            Consulta a tu Tutor IA
          </CardTitle>
          <CardDescription>
            Haz cualquier pregunta sobre finanzas personales, contabilidad o economía
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertTitle>Modo Educativo Activado</AlertTitle>
            <AlertDescription>
              Las respuestas están diseñadas para enseñarte conceptos financieros de forma clara y práctica.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tu pregunta</label>
            <Textarea
              placeholder="Escribe tu pregunta aquí... Por ejemplo: ¿Cómo puedo mejorar mis finanzas personales?"
              value={consulta}
              onChange={(e) => setConsulta(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Preguntas sugeridas:</label>
            <div className="flex flex-wrap gap-2">
              {preguntasSugeridas.map((pregunta, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => setConsulta(pregunta)}
                >
                  {pregunta}
                </Badge>
              ))}
            </div>
          </div>

          <Button
            onClick={handleConsulta}
            disabled={loading || !consulta.trim()}
            className="w-full"
          >
            {loading ? (
              <>
                <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                Pensando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar Consulta
              </>
            )}
          </Button>

          {respuesta && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="whitespace-pre-line text-sm">
                  {respuesta}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Progreso de Aprendizaje</CardTitle>
          <CardDescription>
            Temas que has explorado recientemente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {["Balance General", "Estado de Resultados", "Presupuesto", "Inversiones Básicas"].map((tema, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span className="font-medium">{tema}</span>
                </div>
                <Badge variant="secondary">{100 - (idx * 15)}% completado</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
