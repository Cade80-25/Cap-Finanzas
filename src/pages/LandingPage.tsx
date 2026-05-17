import { useState, useEffect } from "react";
import { SeoHead } from "@/components/SeoHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Check,
  Shield,
  Smartphone,
  DollarSign,
  BarChart3,
  BookOpen,
  Calculator,
  Star,
  ArrowRight,
  ChevronDown,
  Github,
  Mail,
  Lock,
  Zap,
  Users,
  X,
  Sparkles,
  TrendingUp,
  LineChart,
  Play,
  Calendar,
  PiggyBank,
  Eye,
} from "lucide-react";
import { PurchaseDialog } from "@/components/PurchaseDialog";
import { ActivationDialog } from "@/components/ActivationDialog";
import { useNavigate } from "react-router-dom";

const features = [
  {
    icon: DollarSign,
    title: "Control Total de Gastos",
    description: "Registra todos tus ingresos y gastos con categorías personalizables",
    gradient: "from-emerald-500/20 to-emerald-600/5",
    iconColor: "text-emerald-600",
  },
  {
    icon: BarChart3,
    title: "Gráficos y Reportes",
    description: "Visualiza tu situación financiera con gráficos intuitivos y exporta a Excel/PDF",
    gradient: "from-blue-500/20 to-blue-600/5",
    iconColor: "text-blue-600",
  },
  {
    icon: Shield,
    title: "100% Offline y Privado",
    description: "Tus datos nunca salen de tu dispositivo. Sin servidores externos",
    gradient: "from-violet-500/20 to-violet-600/5",
    iconColor: "text-violet-600",
  },
  {
    icon: Calculator,
    title: "Contabilidad Profesional",
    description: "Libro Diario, Mayor, Balance y Estado de Resultados con partida doble",
    gradient: "from-amber-500/20 to-amber-600/5",
    iconColor: "text-amber-600",
  },
  {
    icon: Calendar,
    title: "Calendario Financiero",
    description: "Programa eventos y recordatorios para nunca olvidar un pago importante",
    gradient: "from-rose-500/20 to-rose-600/5",
    iconColor: "text-rose-600",
  },
  {
    icon: Sparkles,
    title: "Tutor con IA",
    description: "Aprende contabilidad y finanzas con un tutor inteligente integrado",
    gradient: "from-cyan-500/20 to-cyan-600/5",
    iconColor: "text-cyan-600",
  },
];

const testimonios = [
  {
    nombre: "María G.",
    rol: "Estudiante de Contabilidad",
    texto: "Cap Finanzas me ayudó a entender la partida doble de una forma práctica. Lo uso todos los días para mis finanzas y para estudiar.",
    estrellas: 5,
  },
  {
    nombre: "Carlos R.",
    rol: "Emprendedor",
    texto: "Probé varias apps pero todas pedían suscripción mensual. Cap Finanzas es pago único y funciona offline. Exactamente lo que necesitaba.",
    estrellas: 5,
  },
  {
    nombre: "Ana P.",
    rol: "Ama de casa",
    texto: "Muy fácil de usar. El modo simple me permite llevar mis gastos del hogar sin complicaciones. El tutor educativo es genial.",
    estrellas: 5,
  },
];

const faqs = [
  {
    question: "¿Necesito conexión a internet?",
    answer: "No. Cap Finanzas funciona 100% offline. Solo se requiere internet para el Tutor Educativo con IA, Chat Financiero y las Bolsas en Vivo.",
  },
  {
    question: "¿Dónde se guardan mis datos?",
    answer: "Todos tus datos se guardan localmente en tu dispositivo. Nunca se envían a servidores externos.",
  },
  {
    question: "¿Qué incluye la prueba gratuita?",
    answer: "La prueba de 30 días incluye acceso completo a todas las funciones: ambos modos, Tutor Educativo, Chat Financiero y Bolsas en Vivo.",
  },
  {
    question: "¿Cómo recibo mi código de licencia?",
    answer: "Después de completar tu pago de $10 USD por PayPal, recibirás tu código automáticamente por correo. También puedes recuperarlo desde la app.",
  },
  {
    question: "¿Hay pagos mensuales o anuales?",
    answer: "No. Es un pago único de $10 USD de por vida. Sin suscripciones ni costos ocultos.",
  },
  {
    question: "¿Qué incluye la licencia?",
    answer: "Todo: Finanzas Simples, Contabilidad Tradicional con partida doble, Tutor IA, Chat Financiero, Bolsas en Vivo, hasta 5 cuentas base (+extras por referidos), hasta 50 perfiles y actualizaciones de por vida.",
  },
];

const allFeatures = [
  "Registro de ingresos y gastos",
  "Categorías y presupuestos",
  "Calendario financiero con recordatorios",
  "Resumen con gráficos y exportación",
  "Múltiples monedas",
  "Tutor Educativo (IA)",
  "Contabilidad de partida doble",
  "Libro Diario, Mayor, Balance y Estado de Resultados",
  "Enciclopedia contable",
  "Chat Financiero (IA)",
  "Bolsas en Vivo",
  "Cambio libre entre modos",
  "Hasta 5 cuentas base (+extras por referidos)",
  "Hasta 50 perfiles por instalación",
  "Actualizaciones gratuitas de por vida",
];

// Animated counter hook
function useAnimatedNumber(target: number, duration = 2000) {
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setValue(target);
        clearInterval(timer);
      } else {
        setValue(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [started, target, duration]);

  return { value, start: () => setStarted(true) };
}

export default function LandingPage() {
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [activationOpen, setActivationOpen] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const navigate = useNavigate();

  const downloadUrl = "https://github.com/Cade80-25/Cap-Finanzas/releases/latest/download/Cap-Finanzas-Setup-1.1.0.exe";

  // Animated stats
  const users = useAnimatedNumber(500, 1500);
  const savings = useAnimatedNumber(30, 1800);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          users.start();
          savings.start();
        }
      },
      { threshold: 0.3 }
    );
    const el = document.getElementById("stats-section");
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SeoHead
        title="Cap Finanzas — Contabilidad personal offline y privada"
        description="Software de finanzas personales y contabilidad 100% offline. Gastos, libros contables y tutor IA. Pago único $10 USD. Prueba gratis 30 días."
        path="/landing"
      />
      {/* Hero Section - Bold & Engaging */}
      <section className="relative overflow-hidden min-h-[85vh] flex items-center">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-accent/8" />
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        </div>

        <div className="container mx-auto px-4 py-16 relative">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm animate-fade-in">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              30 días de prueba gratis — Acceso completo
            </Badge>

            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight">
              <span className="bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
                Cap Finanzas
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-2xl mx-auto leading-relaxed">
              Toma el control de tu dinero con la app de finanzas más simple y privada.
            </p>
            <p className="text-lg text-foreground/80 font-medium mb-10">
              100% offline · Pago único · Tus datos, solo tuyos
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Button size="lg" className="gap-2 text-base h-14 px-8 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all" asChild>
                <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="h-5 w-5" />
                  Descargar Gratis para Windows
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="gap-2 text-base h-14 px-8"
                onClick={() => navigate("/dashboard")}
              >
                <Eye className="h-5 w-5" />
                Probar en el Navegador
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mb-12">
              Windows 10/11 · Sin dependencias · También disponible como webapp
            </p>

            {/* Social proof stats */}
            <div id="stats-section" className="grid grid-cols-3 gap-6 max-w-lg mx-auto">
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-primary">{users.value}+</p>
                <p className="text-xs text-muted-foreground mt-1">Usuarios activos</p>
              </div>
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-primary">4.9</p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-0.5">
                  <Star className="h-3 w-3 fill-primary text-primary" /> Valoración
                </p>
              </div>
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-primary">{savings.value}%</p>
                <p className="text-xs text-muted-foreground mt-1">Ahorro promedio</p>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        </div>
      </section>

      {/* Features Grid - Modernized */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4">Características</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Todo lo que necesitas para tus finanzas
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Desde el control básico de gastos hasta contabilidad profesional con partida doble
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
              >
                <CardHeader className="pb-2">
                  <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <feature.icon className={`h-7 w-7 ${feature.iconColor}`} />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works - NEW section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4">Fácil de usar</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Empieza en 3 pasos</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "1", title: "Descarga e instala", desc: "Solo descarga el archivo .exe y ábrelo. No necesitas instalar nada más.", icon: Download },
              { step: "2", title: "Registra tus movimientos", desc: "Agrega tus ingresos y gastos con categorías. El tour guiado te ayuda desde el inicio.", icon: PiggyBank },
              { step: "3", title: "Visualiza tu progreso", desc: "Gráficos, resúmenes y reportes te muestran exactamente cómo va tu dinero.", icon: TrendingUp },
            ].map((item) => (
              <div key={item.step} className="text-center group">
                <div className="relative mx-auto mb-6">
                  <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors">
                    <item.icon className="h-9 w-9 text-primary" />
                  </div>
                  <span className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    {item.step}
                  </span>
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-muted/30" id="precios">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4">Precios</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Pago Único, Tuyo Para Siempre</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Sin suscripciones ni costos ocultos. Incluye actualizaciones gratuitas de por vida.
            </p>
          </div>

          {/* Single Plan Card */}
          <div className="max-w-md mx-auto">
            <Card className="relative border-primary shadow-lg shadow-primary/10 hover:shadow-xl transition-all">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Star className="h-3 w-3 mr-1" /> Acceso Completo
              </Badge>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Cap Finanzas</CardTitle>
                <CardDescription>Finanzas personales + Contabilidad profesional</CardDescription>
                <div className="text-5xl font-bold mt-4 text-primary">
                  $10 <span className="text-lg font-normal text-muted-foreground">USD</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Pago único · Para siempre</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {allFeatures.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button className="w-full" size="lg" onClick={() => setPurchaseOpen(true)}>
                  Comprar por $10 USD <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </div>

          <p className="text-center mt-8 text-sm text-muted-foreground">
            ¿Ya tienes un código de licencia?{" "}
            <button className="text-primary hover:underline font-medium" onClick={() => setActivationOpen(true)}>
              Activar aquí
            </button>
          </p>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4">Testimonios</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Lo que dicen nuestros usuarios</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonios.map((t, idx) => (
              <Card key={idx} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-3">
                    {Array.from({ length: t.estrellas }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 italic leading-relaxed">"{t.texto}"</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">{t.nombre[0]}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{t.nombre}</p>
                      <p className="text-xs text-muted-foreground">{t.rol}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center max-w-4xl mx-auto">
            <div className="group">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Privacidad Total</h3>
              <p className="text-sm text-muted-foreground">
                Sin cuentas, sin registro, sin telemetría. Tu información financiera es solo tuya.
              </p>
            </div>
            <div className="group">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <Smartphone className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Funciona Offline</h3>
              <p className="text-sm text-muted-foreground">
                No necesitas internet para usar Cap Finanzas. Funciona incluso sin conexión.
              </p>
            </div>
            <div className="group">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Soporte Humano</h3>
              <p className="text-sm text-muted-foreground">
                Respuestas reales de personas reales. Escríbenos y te ayudamos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20" id="faq">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4">FAQ</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Preguntas Frecuentes</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <Card
                key={index}
                className="cursor-pointer hover:shadow-sm transition-shadow"
                onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium">{faq.question}</CardTitle>
                    <ChevronDown
                      className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
                        expandedFaq === index ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </CardHeader>
                {expandedFaq === index && (
                  <CardContent className="pt-0">
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-accent/5" />
        <div className="container mx-auto px-4 text-center relative">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">¿Listo para organizar tus finanzas?</h2>
          <p className="text-muted-foreground mb-10 max-w-xl mx-auto text-lg">
            Descarga Cap Finanzas gratis y comienza tu prueba de 30 días con acceso completo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="gap-2 h-14 px-8 shadow-lg shadow-primary/20" asChild>
              <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                <Download className="h-5 w-5" />
                Descargar para Windows
              </a>
            </Button>
            <Button size="lg" variant="outline" className="gap-2 h-14 px-8" asChild>
              <a href="https://github.com/Cade80-25/cap-finanzas" target="_blank" rel="noopener noreferrer">
                <Github className="h-5 w-5" />
                Ver en GitHub
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 bg-muted/30" id="soporte">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">¿Necesitas ayuda?</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Estamos aquí para ayudarte. Escríbenos y te responderemos lo antes posible.
          </p>
          <Button size="lg" variant="outline" className="gap-2" asChild>
            <a href="mailto:pierresshop48@gmail.com">
              <Mail className="h-5 w-5" />
              pierresshop48@gmail.com
            </a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              <span className="font-semibold">Cap Finanzas</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <a href="#precios" className="hover:text-foreground transition-colors">Precios</a>
              <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
              <a href="/privacidad" className="hover:text-foreground transition-colors">Privacidad</a>
              <a href="/terminos" className="hover:text-foreground transition-colors">Términos</a>
              <a href="mailto:pierresshop48@gmail.com" className="hover:text-foreground transition-colors flex items-center gap-1">
                <Mail className="h-4 w-4" /> Soporte
              </a>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Cap Finanzas. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>

      <PurchaseDialog
        open={purchaseOpen}
        onOpenChange={setPurchaseOpen}
        onActivate={() => {
          setPurchaseOpen(false);
          setActivationOpen(true);
        }}
      />
      <ActivationDialog open={activationOpen} onOpenChange={setActivationOpen} />
    </div>
  );
}
