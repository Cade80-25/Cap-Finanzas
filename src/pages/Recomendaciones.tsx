import { useState, useRef, useEffect } from "react";
import { Sparkles, TrendingUp, BookOpen, Target, MessageCircle, Send, LineChart, DollarSign, AlertTriangle, LucideIcon, ShieldAlert, Info } from "lucide-react";
import { RecommendationDetailDialog } from "@/components/RecommendationDetailDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Recomendaciones() {
  const [consulta, setConsulta] = useState("");
  const [respuesta, setRespuesta] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<{ type: "ahorro" | "inversion" | "educacion"; title: string; icon: LucideIcon } | null>(null);

  const recomendacionesAutomaticas = [
    {
      tipo: "Ahorro",
      icon: Target,
      titulo: "Oportunidad de Ahorro Detectada",
      descripcion: "Tus gastos en entretenimiento aumentaron 25% este mes. Considera reducir $200 para cumplir tu meta de ahorro.",
      prioridad: "alta",
      detailType: "ahorro" as const,
    },
    {
      tipo: "Inversión",
      icon: TrendingUp,
      titulo: "Momento para Invertir",
      descripcion: "Tienes $5,000 sin asignar en tu presupuesto. Considera invertir en un fondo de bajo riesgo para generar rendimientos.",
      prioridad: "media",
      detailType: "inversion" as const,
    },
    {
      tipo: "Educación",
      icon: BookOpen,
      titulo: "Aprende sobre Inversiones",
      descripcion: "Recomendación: Lee sobre 'Fondos Indexados' en la Enciclopedia para mejorar tus conocimientos financieros.",
      prioridad: "baja",
      detailType: "educacion" as const,
    }
  ];

  const preguntasSugeridas = [
    "¿Cómo puedo reducir mis gastos mensuales?",
    "¿Qué es un fondo de inversión?",
    "¿Cuánto debería ahorrar cada mes?",
    "Explícame qué es el interés compuesto",
    "¿Cómo crear un presupuesto efectivo?"
  ];

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleConsulta = async () => {
    if (!consulta.trim()) return;
    
    setLoading(true);
    setRespuesta("");
    try {
      const { data, error } = await supabase.functions.invoke("ai-financial-chat", {
        body: { 
          messages: [{ role: "user", content: consulta }],
          mode: "tutor"
        },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      setRespuesta(data.content);
    } catch (err) {
      console.error("Error:", err);
      toast.error("No se pudo obtener respuesta. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = message;
    const newMessages = [...chatMessages, { role: "user" as const, content: userMessage }];
    setChatMessages(newMessages);
    setMessage("");
    setIsLoadingChat(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-financial-chat", {
        body: { 
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          mode: "inversiones"
        },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      setChatMessages(prev => [...prev, { role: "assistant", content: data.content }]);
    } catch (err) {
      console.error("Error:", err);
      toast.error("No se pudo obtener respuesta. Intenta de nuevo.");
    } finally {
      setIsLoadingChat(false);
    }
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
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => setSelectedDetail({ type: rec.detailType, title: rec.titulo, icon: rec.icon })}
              >
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
            Guía Financiera Inteligente
          </CardTitle>
          <CardDescription>
            Aprende sobre finanzas y explora información del mercado con ayuda de IA
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
                Guía de Mercados
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
              <Alert variant="destructive" className="border-yellow-500/50 bg-yellow-500/10 text-foreground [&>svg]:text-yellow-500">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Información Educativa — No es Asesoría Financiera</AlertTitle>
                <AlertDescription>
                  La información proporcionada es generada por IA con fines educativos. Los datos provienen de modelos de lenguaje entrenados con información financiera general. <strong>No constituye asesoría financiera profesional.</strong> Toda decisión de inversión es bajo tu propio riesgo. Consulta a un asesor certificado.
                </AlertDescription>
              </Alert>

              <ScrollArea className="h-[350px] w-full rounded-md border p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <LineChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="mb-4">Pregunta sobre mercados, tipos de inversión o estrategias financieras</p>
                      
                      <div className="space-y-4 text-left">
                        <div className="p-3 rounded-lg border">
                          <div className="flex items-center gap-2 mb-2">
                            <Info className="h-4 w-4 text-primary" />
                            <h4 className="font-semibold text-sm">Ejemplos de preguntas</h4>
                          </div>
                          <p className="text-xs">• ¿Qué son los fondos indexados y cómo funcionan?</p>
                          <p className="text-xs">• ¿Cuáles son las diferencias entre renta fija y variable?</p>
                          <p className="text-xs">• ¿Qué opciones de inversión existen para principiantes?</p>
                        </div>
                        
                        <div className="p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            <h4 className="font-semibold text-sm">Fuentes de información</h4>
                          </div>
                          <p className="text-xs">Las respuestas son generadas por IA basándose en conocimiento financiero general. No representan datos en tiempo real del mercado.</p>
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
                  placeholder="¿Qué son los ETFs? ¿Cómo funciona el interés compuesto?"
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

      {selectedDetail && (
        <RecommendationDetailDialog
          open={!!selectedDetail}
          onOpenChange={(open) => !open && setSelectedDetail(null)}
          type={selectedDetail.type}
          title={selectedDetail.title}
          icon={selectedDetail.icon}
        />
      )}
    </div>
  );
}
