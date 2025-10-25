import { useState } from "react";
import { Sparkles, TrendingUp, BookOpen, Target, MessageCircle, Send, LineChart, DollarSign, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Recomendaciones() {
  const [consulta, setConsulta] = useState("");
  const [respuesta, setRespuesta] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [isLoadingChat, setIsLoadingChat] = useState(false);

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

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const userMessage = message;
    setChatMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setMessage("");
    setIsLoadingChat(true);

    // Simulación de respuesta de asesor de inversiones
    setTimeout(() => {
      const responses = [
        "📈 **Análisis de Mercado Actual**\n\nBasándome en las tendencias del mercado:\n\n• **Acciones de Tecnología**: El sector tecnológico muestra una tendencia alcista con un crecimiento promedio del 12% en el último trimestre. Empresas como Microsoft, Apple y NVIDIA lideran el sector.\n\n• **Bonos del Tesoro**: Con tasas de interés actuales del 4.5%, los bonos representan una opción segura para diversificar tu portafolio.\n\n• **Fondos Indexados**: Recomiendo el S&P 500, con un rendimiento histórico del 10% anual.\n\n💡 **Recomendación**: Diversifica un 60% en fondos indexados, 30% en bonos y 10% en acciones individuales.",
        "🎯 **Estrategia de Inversión Personalizada**\n\nPara optimizar tus inversiones:\n\n1. **Corto Plazo (1-2 años)**: Mantén liquidez en cuentas de ahorro de alto rendimiento (3-4% anual).\n\n2. **Medio Plazo (3-5 años)**: Invierte en ETFs diversificados y bonos corporativos.\n\n3. **Largo Plazo (5+ años)**: Considera fondos de índice bursátil y bienes raíces.\n\n⚠️ **Advertencia**: Todo portafolio debe incluir un fondo de emergencia equivalente a 6 meses de gastos.",
        "💰 **Oportunidades de Inversión Actuales**\n\n• **Energías Renovables**: Sector en crecimiento con incentivos gubernamentales. ROI proyectado: 15-20% anual.\n\n• **Biotecnología**: Empresas farmacéuticas muestran innovación constante. Riesgo medio-alto.\n\n• **Real Estate Crowdfunding**: Inversión inmobiliaria accesible desde $500. Rendimiento: 8-12% anual.\n\n• **Criptomonedas**: Alta volatilidad. Solo para inversores con alta tolerancia al riesgo. Máximo 5% del portafolio.",
        "📊 **Análisis de Riesgo y Rendimiento**\n\nSegún tu perfil:\n\n**Riesgo Bajo** (70% probabilidad de ganancia):\n- Bonos gubernamentales: 4-5% anual\n- Cuentas de ahorro: 3-4% anual\n\n**Riesgo Medio** (80% probabilidad de ganancia):\n- Fondos indexados: 8-12% anual\n- ETFs diversificados: 6-10% anual\n\n**Riesgo Alto** (60% probabilidad de ganancia):\n- Acciones individuales: 15-25% anual (o pérdidas)\n- Criptomonedas: Altamente volátil\n\n✅ **Mejor momento para invertir**: Los mercados muestran estabilidad. Considera dollar-cost averaging.",
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      setChatMessages(prev => [...prev, { role: "assistant", content: randomResponse }]);
      setIsLoadingChat(false);
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
            <LineChart className="h-6 w-6 text-primary" />
            Asesor Financiero con IA
          </CardTitle>
          <CardDescription>
            Consulta educativa y asesoramiento de inversiones en tiempo real
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="tutor">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tutor">
                <BookOpen className="h-4 w-4 mr-2" />
                Tutor Educativo
              </TabsTrigger>
              <TabsTrigger value="inversiones">
                <TrendingUp className="h-4 w-4 mr-2" />
                Asesor de Inversiones
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="tutor" className="space-y-4 mt-4">
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
            </TabsContent>
            
            <TabsContent value="inversiones" className="space-y-4 mt-4">
              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertTitle>Asesoramiento en Tiempo Real</AlertTitle>
                <AlertDescription>
                  Obtén recomendaciones personalizadas sobre inversiones basadas en análisis de mercado actual
                </AlertDescription>
              </Alert>

              <ScrollArea className="h-[350px] w-full rounded-md border p-4">
                <div className="space-y-4">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <LineChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="mb-4">Pregunta sobre inversiones, mercados o estrategias financieras</p>
                      
                      <div className="space-y-4 text-left">
                        <div className="p-3 rounded-lg border">
                          <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="h-4 w-4 text-green-500" />
                            <h4 className="font-semibold text-sm">Oportunidades Actuales</h4>
                          </div>
                          <p className="text-xs">• Fondos indexados S&P 500: 10% anual promedio</p>
                          <p className="text-xs">• ETFs de tecnología en tendencia alcista</p>
                          <p className="text-xs">• Bonos del Tesoro: 4-5% anual, bajo riesgo</p>
                        </div>
                        
                        <div className="p-3 rounded-lg border">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            <h4 className="font-semibold text-sm">Alertas de Mercado</h4>
                          </div>
                          <p className="text-xs">⚠️ Alta volatilidad en criptomonedas</p>
                          <p className="text-xs">✅ Sector inmobiliario en recuperación</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`rounded-lg px-4 py-2 max-w-[85%] ${
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-line">{msg.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                  {isLoadingChat && (
                    <div className="flex justify-start">
                      <div className="rounded-lg px-4 py-2 bg-muted">
                        <p className="text-sm flex items-center gap-2">
                          <Sparkles className="h-4 w-4 animate-spin" />
                          Analizando mercados...
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              
              <div className="flex gap-2">
                <Input
                  placeholder="¿Cuál es el mejor momento para invertir? ¿Dónde debería invertir?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                />
                <Button onClick={handleSendMessage} disabled={isLoadingChat}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>
          </Tabs>
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
