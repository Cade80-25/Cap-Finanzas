import { useState, useEffect } from "react";
import { SeoHead } from "@/components/SeoHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Check,
  Shield,
  DollarSign,
  BarChart3,
  Calculator,
  Star,
  ArrowRight,
  ChevronDown,
  Lock,
  Zap,
  Sparkles,
  RefreshCcw,
  Building2,
  Heart,
  Clock,
} from "lucide-react";
import { PurchaseDialog } from "@/components/PurchaseDialog";
import { ActivationDialog } from "@/components/ActivationDialog";
import { useNavigate, Link } from "react-router-dom";

const features = [
  { icon: DollarSign, title: "Control Total de Gastos", description: "Ingresos, gastos, categorías y presupuestos. Todo en una interfaz simple.", gradient: "from-emerald-500/20 to-emerald-600/5", iconColor: "text-emerald-600" },
  { icon: Calculator, title: "Contabilidad Profesional", description: "Partida doble, asientos compuestos, Libro Diario, Mayor, Balance y Estado de Resultados.", gradient: "from-amber-500/20 to-amber-600/5", iconColor: "text-amber-600" },
  { icon: BarChart3, title: "Conciliación Bancaria", description: "Marca transacciones conciliadas, cuadra tus cuentas con un clic.", gradient: "from-blue-500/20 to-blue-600/5", iconColor: "text-blue-600" },
  { icon: Shield, title: "100% Offline y Privado", description: "Tus datos nunca salen de tu dispositivo. Cifrado AES-GCM para información sensible.", gradient: "from-violet-500/20 to-violet-600/5", iconColor: "text-violet-600" },
  { icon: RefreshCcw, title: "IVA Regional Automático", description: "Configurá tu país y la app ajusta impuestos, moneda y formato automáticamente.", gradient: "from-rose-500/20 to-rose-600/5", iconColor: "text-rose-600" },
  { icon: Zap, title: "Gasto Rápido", description: "Registrá un gasto en un solo paso. Sin formularios largos, sin fricción.", gradient: "from-cyan-500/20 to-cyan-600/5", iconColor: "text-cyan-600" },
];

const personalFeatures = [
  "Registro de ingresos y gastos",
  "Categorías y presupuestos mensuales",
  "Gráficos y reportes simples",
  "Calendario financiero",
  "Gasto rápido en 1 paso",
  "Exportación a Excel y PDF",
  "Soporte para múltiples monedas",
  "30 días de prueba gratis",
  "Pago único, actualizaciones de por vida",
];

const enterpriseFeatures = [
  "Todo lo de Personal, más:",
  "Asientos contables compuestos (partida doble)",
  "Conciliación bancaria",
  "IVA regional configurable por país",
  "Plan de cuentas expansible",
  "Libro Diario, Mayor y Balance",
  "Estado de Resultados",
  "Cifrado AES-GCM de datos sensibles",
  "30 días de prueba gratis",
  "Soporte prioritario semestral",
];

const faqs = [
  {
    question: "¿Cuál es la diferencia entre Personal y Empresarial?",
    answer: "Personal es para finanzas del día a día (ingresos, gastos, presupuestos). Empresarial incluye todo lo de Personal más libros contables completos: asientos compuestos, conciliación bancaria, IVA regional y plan de cuentas expansible.",
  },
  {
    question: "¿Qué significa 'pago único' y 'pago semestral'?",
    answer: "Personal: pagás $20 una vez y es tuyo para siempre, con actualizaciones gratuitas. Empresarial: pagás $100 cada 6 meses, incluyendo soporte y actualizaciones.",
  },
  {
    question: "¿Hay prueba gratuita?",
    answer: "Sí. Tenés 30 días de prueba gratuita con acceso completo a todas las funciones. No te pedimos tarjeta de crédito.",
  },
  {
    question: "¿Qué pasa después de los 30 días?",
    answer: "Si te gusta, comprás la licencia y todo sigue igual. Si no, podés seguir usando el modo básico sin costo, o exportar tus datos y desinstalar.",
  },
  {
    question: "¿Necesito conexión a internet?",
    answer: "No. Cap Finanzas funciona 100% offline. Solo necesitás internet para activar la licencia la primera vez.",
  },
  {
    question: "¿Dónde se guardan mis datos?",
    answer: "Todos tus datos se guardan localmente en tu dispositivo, cifrados con AES-GCM. Nunca se envían a servidores externos.",
  },
  {
    question: "¿Puedo cambiar de Personal a Empresarial después?",
    answer: "Sí. Si empezás con Personal y después necesitás las funciones empresariales, solo pagás la diferencia y se desbloquean todas las herramientas.",
  },
  {
    question: "¿En qué plataformas funciona?",
    answer: "Windows, macOS y Linux. Una sola compra incluye todas las plataformas.",
  },
];

const testimonios = [
  { nombre: "María G.", rol: "Freelancer", texto: "Probé apps que cobraban $10/mes. Cap Finanzas me costó $20 una sola vez y hace exactamente lo que necesito.", estrellas: 5 },
  { nombre: "Carlos R.", rol: "Microempresario", texto: "La conciliación bancaria y los asientos compuestos me ahorran horas cada mes. Vale cada centavo.", estrellas: 5 },
  { nombre: "Ana P.", rol: "Ama de casa", texto: "El modo Personal es perfecto para organizar los gastos del hogar. Simple y sin complicaciones.", estrellas: 5 },
];

function useAnimatedNumber(target: number, duration = 2000) {
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);
  useEffect(() => {
    if (!started) return;
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => { start += increment; if (start >= target) { setValue(target); clearInterval(timer); } else { setValue(Math.floor(start)); } }, 16);
    return () => clearInterval(timer);
  }, [started, target, duration]);
  return { value, start: () => setStarted(true) };
}

export default function LandingPage() {
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [activationOpen, setActivationOpen] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<"personal" | "empresarial">("personal");
  const navigate = useNavigate();
  const downloadUrl = "https://github.com/Cade80-25/Cap-Finanzas/releases/latest/download/Cap-Finanzas-Setup-1.1.10.exe";
  const users = useAnimatedNumber(120, 1500);
  const countries = useAnimatedNumber(7, 1800);
  const trialDays = useAnimatedNumber(30, 1500);
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => { if (entries[0].isIntersecting) { users.start(); countries.start(); trialDays.start(); } }, { threshold: 0.3 });
    const el = document.getElementById("stats-section");
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const faqJsonLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })) };

  return (
    <div className="min-h-screen bg-background">
      <SeoHead title="Cap Finanzas — Prueba gratis 30 días" description="App de finanzas 100% offline. Probala gratis 30 días. Personal $20 pago único. Empresarial $100 semestral." path="/landing" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* Hero */}
      <section className="relative overflow-hidden min-h-[85vh] flex items-center">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-accent/8" />
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        </div>
        <div className="container mx-auto px-4 py-16 relative">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm animate-fade-in">
              <Clock className="h-3.5 w-3.5 mr-1.5" />
              30 días gratis — Sin tarjeta de crédito
            </Badge>
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight">
              <span className="bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
                Tu dinero, tus reglas
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-2xl mx-auto leading-relaxed">
              App de finanzas 100% offline. Probala gratis 30 días. Personal $20. Empresarial $100 semestral.
            </p>
            <p className="text-lg text-foreground/80 font-medium mb-10">
              Sin suscripciones · Sin nube obligatoria · Sin sorpresas
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Button size="lg" className="gap-2 text-base h-14 px-8 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all" asChild>
                <a href={downloadUrl} target="_blank" rel="noopener noreferrer"><Download className="h-5 w-5" />Descargar y probar gratis</a>
              </Button>
              <Button size="lg" variant="outline" className="gap-2 text-base h-14 px-8" onClick={() => navigate("/?demo=1")}>Ver cómo funciona</Button>
            </div>
            <p className="text-sm text-muted-foreground mb-12">Windows · macOS · Linux</p>
            <div id="stats-section" className="grid grid-cols-3 gap-6 max-w-lg mx-auto">
              <div className="text-center"><p className="text-3xl md:text-4xl font-bold text-primary">{trialDays.value}</p><p className="text-xs text-muted-foreground mt-1">Días gratis</p></div>
              <div className="text-center"><p className="text-3xl md:text-4xl font-bold text-primary">{users.value}+</p><p className="text-xs text-muted-foreground mt-1">Usuarios</p></div>
              <div className="text-center"><p className="text-3xl md:text-4xl font-bold text-primary">{countries.value}</p><p className="text-xs text-muted-foreground mt-1">Países</p></div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce"><ChevronDown className="h-6 w-6 text-muted-foreground" aria-hidden="true" /></div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14"><Badge variant="outline" className="mb-4">Características</Badge><h2 className="text-3xl md:text-4xl font-bold mb-4">Todo lo que necesitás para tus finanzas</h2><p className="text-muted-foreground max-w-xl mx-auto">Desde control de gastos hasta contabilidad profesional con partida doble</p></div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                <CardHeader className="pb-2"><div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}><feature.icon className={`h-7 w-7 ${feature.iconColor}`} /></div><CardTitle className="text-lg">{feature.title}</CardTitle></CardHeader>
                <CardContent><CardDescription className="text-base">{feature.description}</CardDescription></CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20" id="precios">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14"><Badge variant="outline" className="mb-4">Precios</Badge><h2 className="text-3xl md:text-4xl font-bold mb-4">Probá gratis, comprá si te gusta</h2><p className="text-muted-foreground max-w-2xl mx-auto">30 días gratis. Sin tarjeta de crédito. Sin compromiso.</p></div>
          <div className="flex justify-center mb-10">
            <div className="inline-flex rounded-lg border p-1 bg-muted/50">
              <button className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${selectedPlan === "personal" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"}`} onClick={() => setSelectedPlan("personal")}><Heart className="inline h-4 w-4 mr-1" /> Personal</button>
              <button className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${selectedPlan === "empresarial" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"}`} onClick={() => setSelectedPlan("empresarial")}><Building2 className="inline h-4 w-4 mr-1" /> Empresarial</button>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className={`relative border-2 transition-all ${selectedPlan === "personal" ? "border-primary shadow-lg" : "border-border"}`}>
              <CardHeader className="text-center pb-4"><CardTitle className="text-xl flex items-center justify-center gap-2"><Heart className="h-5 w-5 text-primary" /> Personal</CardTitle><CardDescription>Finanzas del día a día</CardDescription><div className="text-5xl font-bold mt-4 text-primary">$20</div><p className="text-sm text-muted-foreground mt-1">Pago único — Tuyo para siempre</p></CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">{personalFeatures.map((item, i) => (<li key={i} className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-primary flex-shrink-0" />{item}</li>))}</ul>
                <Button className="w-full" size="lg" variant={selectedPlan === "personal" ? "default" : "outline"} onClick={() => setPurchaseOpen(true)}>Empezar prueba gratis <ArrowRight className="h-4 w-4 ml-1" /></Button>
              </CardContent>
            </Card>
            <Card className={`relative border-2 transition-all ${selectedPlan === "empresarial" ? "border-primary shadow-lg" : "border-border"}`}>
              {selectedPlan === "empresarial" && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2"><Star className="h-3 w-3 mr-1" /> Recomendado</Badge>}
              <CardHeader className="text-center pb-4"><CardTitle className="text-xl flex items-center justify-center gap-2"><Building2 className="h-5 w-5 text-primary" /> Empresarial</CardTitle><CardDescription>Contabilidad completa para empresas</CardDescription><div className="text-5xl font-bold mt-4 text-primary">$100</div><p className="text-sm text-muted-foreground mt-1">Cada 6 meses — Soporte incluido</p></CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">{enterpriseFeatures.map((item, i) => (<li key={i} className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-primary flex-shrink-0" />{item}</li>))}</ul>
                <Button className="w-full" size="lg" variant={selectedPlan === "empresarial" ? "default" : "outline"} onClick={() => setPurchaseOpen(true)}>Empezar prueba gratis <ArrowRight className="h-4 w-4 ml-1" /></Button>
              </CardContent>
            </Card>
          </div>
          <p className="text-center mt-8 text-sm text-muted-foreground">¿Ya tenés un código de licencia?{" "}<button className="text-primary hover:underline font-medium" onClick={() => setActivationOpen(true)}>Activar aquí</button></p>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14"><Badge variant="outline" className="mb-4">Testimonios</Badge><h2 className="text-3xl md:text-4xl font-bold mb-4">Lo que dicen nuestros usuarios</h2></div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonios.map((t, idx) => (
              <Card key={idx} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-3">{Array.from({ length: t.estrellas }).map((_, i) => (<Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />))}</div>
                  <p className="text-sm text-muted-foreground mb-4 italic leading-relaxed">"{t.texto}"</p>
                  <div className="flex items-center gap-3"><div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"><span className="text-sm font-bold text-primary">{t.nombre[0]}</span></div><div><p className="font-semibold text-sm">{t.nombre}</p><p className="text-xs text-muted-foreground">{t.rol}</p></div></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center max-w-4xl mx-auto">
            <div className="group"><div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors"><Lock className="h-8 w-8 text-primary" /></div><h3 className="font-semibold mb-2">Privacidad Total</h3><p className="text-sm text-muted-foreground">Sin cuentas, sin registro, sin telemetría. Cifrado AES-GCM.</p></div>
            <div className="group"><div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors"><Zap className="h-8 w-8 text-primary" /></div><h3 className="font-semibold mb-2">Funciona Offline</h3><p className="text-sm text-muted-foreground">No necesitas internet para usar Cap Finanzas.</p></div>
            <div className="group"><div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors"><Clock className="h-8 w-8 text-primary" /></div><h3 className="font-semibold mb-2">30 Días Gratis</h3><p className="text-sm text-muted-foreground">Sin tarjeta de crédito. Sin compromiso. Probá todo.</p></div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20" id="faq">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-14"><Badge variant="outline" className="mb-4">FAQ</Badge><h2 className="text-3xl md:text-4xl font-bold mb-4">Preguntas Frecuentes</h2></div>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}>
                <CardHeader className="pb-2"><div className="flex items-center justify-between"><CardTitle className="text-base font-medium">{faq.question}</CardTitle><ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${expandedFaq === index ? "rotate-180" : ""}`} /></div>
                  {expandedFaq === index && <CardDescription className="text-sm pt-2">{faq.answer}</CardDescription>}
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Empezá tu prueba gratis</h2>
          <p className="text-muted-foreground mb-8">30 días gratis. Sin tarjeta. Sin compromiso. Comprá solo si te gusta.</p>
          <Button size="lg" className="gap-2 text-base h-14 px-8" asChild><a href={downloadUrl} target="_blank" rel="noopener noreferrer"><Download className="h-5 w-5" />Descargar Cap Finanzas</a></Button>
          <p className="text-sm text-muted-foreground mt-4">Windows · macOS · Linux</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Cap Finanzas — Tu dinero, tus reglas.</p>
          <div className="flex justify-center gap-4 mt-2"><Link to="/privacidad" className="hover:text-primary">Privacidad</Link><Link to="/terminos" className="hover:text-primary">Términos</Link><Link to="/comparativa" className="hover:text-primary">Comparativa</Link></div>
        </div>
      </footer>

      <PurchaseDialog open={purchaseOpen} onOpenChange={setPurchaseOpen} />
      <ActivationDialog open={activationOpen} onOpenChange={setActivationOpen} />
    </div>
  );
}
