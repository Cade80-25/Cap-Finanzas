import { useState } from "react";
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
} from "lucide-react";
import { PurchaseDialog } from "@/components/PurchaseDialog";
import { ActivationDialog } from "@/components/ActivationDialog";

const features = [
  {
    icon: DollarSign,
    title: "Control Total de Gastos",
    description: "Registra todos tus ingresos y gastos con categorías personalizables",
  },
  {
    icon: BarChart3,
    title: "Gráficos y Reportes",
    description: "Visualiza tu situación financiera con gráficos intuitivos",
  },
  {
    icon: Shield,
    title: "100% Offline y Privado",
    description: "Tus datos nunca salen de tu computadora. Sin servidores externos",
  },
  {
    icon: Calculator,
    title: "Contabilidad Profesional",
    description: "Libro Diario, Mayor, Balance y Estado de Resultados",
  },
  {
    icon: BookOpen,
    title: "Enciclopedia Contable",
    description: "Aprende contabilidad con nuestra guía integrada",
  },
  {
    icon: Zap,
    title: "Rápido y Ligero",
    description: "Instalación en segundos, funciona en cualquier PC con Windows",
  },
];

const faqs = [
  {
    question: "¿Necesito conexión a internet?",
    answer: "No. Cap Finanzas funciona 100% offline. Una vez instalado, no necesitas internet para nada.",
  },
  {
    question: "¿Dónde se guardan mis datos?",
    answer: "Todos tus datos se guardan localmente en tu computadora. Nunca se envían a servidores externos.",
  },
  {
    question: "¿Qué incluye la prueba gratuita?",
    answer: "La prueba de 30 días incluye acceso completo a todas las funciones. Sin límites ni restricciones.",
  },
  {
    question: "¿Cómo recibo mi código de licencia?",
    answer: "Después de completar tu pago por PayPal, recibirás tu código por correo electrónico en menos de 24 horas.",
  },
  {
    question: "¿Hay pagos mensuales o anuales?",
    answer: "No. Es un pago único de por vida. Sin suscripciones ni costos ocultos.",
  },
];

export default function LandingPage() {
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [activationOpen, setActivationOpen] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const downloadUrl = "https://github.com/Cade80-25/cap-finanzas/releases/latest/download/Cap-Finanzas-Setup.exe";

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="container mx-auto px-4 py-16 md:py-24 relative">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-4">
              <Star className="h-3 w-3 mr-1" />
              30 días de prueba gratis
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Cap Finanzas
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8">
              El software de contabilidad personal más simple y privado.
              <br />
              <span className="text-foreground font-medium">100% offline. Tus datos, solo tuyos.</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button size="lg" className="gap-2" asChild>
                <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="h-5 w-5" />
                  Descargar Gratis
                </a>
              </Button>
              <Button size="lg" variant="outline" className="gap-2" onClick={() => setPurchaseOpen(true)}>
                <DollarSign className="h-5 w-5" />
                Ver Precios
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              Para Windows 10/11 • Sin instalación de dependencias • 50 MB
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Todo lo que necesitas para tus finanzas
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                    <feature.icon className="h-6 w-6 text-primary" />
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

      {/* Pricing Section */}
      <section className="py-16" id="precios">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Precios Simples</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Pago único, licencia de por vida. Sin suscripciones ni costos ocultos.
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Plan Simple */}
            <Card className="relative">
              <CardHeader>
                <CardTitle className="text-xl">Finanzas Personales</CardTitle>
                <CardDescription>Ideal para controlar tus gastos del día a día</CardDescription>
                <div className="text-4xl font-bold mt-4">
                  $5 <span className="text-lg font-normal text-muted-foreground">USD</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {[
                    "Registro de ingresos y gastos",
                    "Categorías personalizables",
                    "Resumen mensual con gráficos",
                    "Presupuestos y metas",
                    "Calendario financiero",
                    "Múltiples monedas",
                    "Actualizaciones gratuitas",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-accent" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button className="w-full" variant="outline" onClick={() => setPurchaseOpen(true)}>
                  Seleccionar Plan
                </Button>
              </CardContent>
            </Card>

            {/* Plan Completo */}
            <Card className="relative border-primary shadow-lg">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                Más Popular
              </Badge>
              <CardHeader>
                <CardTitle className="text-xl">Contabilidad Completa</CardTitle>
                <CardDescription>Sistema profesional de partida doble</CardDescription>
                <div className="text-4xl font-bold mt-4">
                  $10 <span className="text-lg font-normal text-muted-foreground">USD</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {[
                    "Todo de Finanzas Personales",
                    "Libro Diario con partida doble",
                    "Libro Mayor por cuenta",
                    "Balance General automático",
                    "Estado de Resultados",
                    "Plan de cuentas profesional",
                    "Enciclopedia contable integrada",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-accent" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button className="w-full" onClick={() => setPurchaseOpen(true)}>
                  Seleccionar Plan
                </Button>
              </CardContent>
            </Card>
          </div>

          <p className="text-center mt-8 text-sm text-muted-foreground">
            ¿Ya tienes un código de licencia?{" "}
            <button
              className="text-primary hover:underline"
              onClick={() => setActivationOpen(true)}
            >
              Activar aquí
            </button>
          </p>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Privacidad Total</h3>
              <p className="text-sm text-muted-foreground">
                Sin cuentas, sin registro, sin telemetría. Tu información financiera es solo tuya.
              </p>
            </div>
            <div>
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Smartphone className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Funciona Offline</h3>
              <p className="text-sm text-muted-foreground">
                No necesitas internet para usar Cap Finanzas. Funciona incluso sin conexión.
              </p>
            </div>
            <div>
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
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
      <section className="py-16" id="faq">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-12">Preguntas Frecuentes</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card
                key={index}
                className="cursor-pointer"
                onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium">{faq.question}</CardTitle>
                    <ChevronDown
                      className={`h-5 w-5 text-muted-foreground transition-transform ${
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
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">¿Listo para organizar tus finanzas?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Descarga Cap Finanzas gratis y comienza tu prueba de 30 días hoy mismo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="gap-2" asChild>
              <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                <Download className="h-5 w-5" />
                Descargar para Windows
              </a>
            </Button>
            <Button size="lg" variant="outline" className="gap-2" asChild>
              <a href="https://github.com/Cade80-25/cap-finanzas" target="_blank" rel="noopener noreferrer">
                <Github className="h-5 w-5" />
                Ver en GitHub
              </a>
            </Button>
          </div>
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
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#precios" className="hover:text-foreground">
                Precios
              </a>
              <a href="#faq" className="hover:text-foreground">
                FAQ
              </a>
              <a href="mailto:soporte@capfinanzas.com" className="hover:text-foreground flex items-center gap-1">
                <Mail className="h-4 w-4" />
                Soporte
              </a>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Cap Finanzas. Todos los derechos reservados.
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
