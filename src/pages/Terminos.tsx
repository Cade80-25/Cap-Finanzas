import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { SeoHead } from "@/components/SeoHead";

export default function Terminos() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SeoHead
        title="Términos del Servicio — Cap Finanzas"
        description="Términos de uso y licencia de Cap Finanzas. Pago único de $10 USD, sin suscripciones."
        path="/terminos"
      />
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" /> Volver
        </Button>

        <div className="flex items-center gap-3 mb-8">
          <FileText className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Términos de Uso</h1>
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">Última actualización: {new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}</p>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">1. Identidad del Proveedor</h2>
            <p>El presente contrato se celebra entre el usuario y <strong>Cap Finanzas</strong> ("Cap Finanzas", "nosotros"), como proveedor y titular del software del mismo nombre. Para cualquier comunicación: <a href="mailto:pierresshop48@gmail.com" className="text-primary hover:underline">pierresshop48@gmail.com</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">2. Aceptación de los Términos</h2>
            <p>Al descargar, instalar o utilizar Cap Finanzas ("el Software") aceptas estos Términos de Uso. Si no estás de acuerdo, no debes utilizar el Software. El uso continuado del Software implica la aceptación de cualquier modificación futura de estos términos.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">3. Descripción del Servicio</h2>
            <p>Cap Finanzas es un software de finanzas personales y contabilidad que funciona de manera offline. Incluye herramientas para registro de ingresos y gastos, contabilidad por partida doble, reportes financieros y asistencia con inteligencia artificial.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">4. Licencia de Uso</h2>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Cap Finanzas ofrece un <strong>período de prueba gratuito de 30 días</strong> con funcionalidad limitada.</li>
              <li>El acceso completo se obtiene mediante un <strong>pago único</strong> de <strong>$10 USD</strong>.</li>
              <li>La licencia es <strong>personal, intransferible y perpetua</strong> (sin pagos recurrentes).</li>
              <li>Se concede un derecho limitado, no exclusivo y no transferible para usar el Software dentro de las condiciones de la licencia.</li>
              <li>Queda prohibido redistribuir, revender, modificar, descompilar o realizar ingeniería inversa del Software.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">5. Pagos — Paddle como Merchant of Record</h2>
            <p>
              <strong>Nuestro proceso de pedidos es gestionado por nuestro revendedor en línea Paddle.com. Paddle.com es el Merchant of Record (MoR) de todos nuestros pedidos. Paddle gestiona todas las consultas de servicio al cliente relacionadas con pagos, facturación, impuestos, suscripciones y reembolsos.</strong>
            </p>
            <p className="mt-3">
              Las condiciones de compra, facturación, impuestos y reembolso aplicables a la transacción se rigen además por los <a href="https://www.paddle.com/legal/checkout-buyer-terms" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Buyer Terms de Paddle</a>. Los precios se muestran en dólares estadounidenses (USD); los impuestos aplicables serán calculados y recaudados por Paddle según tu jurisdicción.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Pedidos históricos pueden haber sido procesados a través de PayPal antes de la migración a Paddle.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">6. Política de Reembolsos</h2>
            <p>
              Ofrecemos una <strong>garantía de devolución de 30 días</strong> a partir de la fecha de compra. Si no estás satisfecho con tu compra, puedes solicitar un reembolso completo dentro de ese plazo.
            </p>
            <p className="mt-3">
              Los reembolsos son procesados por nuestro Merchant of Record, <strong>Paddle</strong>. Para solicitar un reembolso, visita <a href="https://paddle.net" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">paddle.net</a> con tu identificador de pedido o escríbenos a <a href="mailto:pierresshop48@gmail.com" className="text-primary hover:underline">pierresshop48@gmail.com</a> y te ayudaremos a iniciar la solicitud con Paddle.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">7. Uso Aceptable</h2>
            <p>El usuario se compromete a no:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Usar el Software para fines ilegales, fraudulentos o que infrinjan derechos de terceros.</li>
              <li>Eludir mecanismos técnicos de licencia o limitación.</li>
              <li>Distribuir malware, realizar scraping, sondeos de seguridad o interferir con la integridad del Software.</li>
              <li>Compartir credenciales o claves de licencia con terceros.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">8. Suspensión y Terminación</h2>
            <p>Nos reservamos el derecho de suspender o terminar el acceso a la licencia y al Software, con o sin previo aviso, en los siguientes casos:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Incumplimiento material de estos Términos.</li>
              <li>Falta de pago, contracargo o disputa indebida del pago.</li>
              <li>Riesgo de seguridad, fraude o abuso del Software o de los sistemas de licencias.</li>
              <li>Violaciones repetidas o graves de la política de uso aceptable.</li>
            </ul>
            <p className="mt-3">El usuario podrá dejar de usar el Software en cualquier momento desinstalándolo. La terminación no genera derecho a reembolso fuera de la ventana de 30 días descrita en la sección 6.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">9. Responsabilidades del Usuario</h2>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>El usuario es responsable de la veracidad de los datos financieros que ingresa.</li>
              <li>Cap Finanzas es una herramienta de registro y organización; <strong>no constituye asesoría financiera, contable, fiscal o legal profesional</strong>.</li>
              <li>El usuario debe realizar respaldos periódicos de sus datos locales.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">10. Propiedad Intelectual</h2>
            <p>Todo el contenido, diseño, código fuente, marca y funcionalidades de Cap Finanzas son propiedad de Cap Finanzas y están protegidos por las leyes de propiedad intelectual aplicables.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">11. Limitación de Responsabilidad</h2>
            <p>El Software se proporciona "tal cual", sin garantías expresas o implícitas. En la máxima medida permitida por la ley, Cap Finanzas no será responsable por:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Pérdida de datos por fallas del dispositivo del usuario o falta de respaldo.</li>
              <li>Decisiones financieras tomadas basadas en la información del Software.</li>
              <li>Interrupciones en el servicio de activación de licencias.</li>
              <li>Daños indirectos, consecuentes, incidentales o lucro cesante.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">12. Modificaciones</h2>
            <p>Podemos modificar estos Términos en cualquier momento. Los cambios entran en vigor al publicarse. El uso continuado del Software tras la publicación implica aceptación.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">13. Contacto</h2>
            <p>Cap Finanzas — <a href="mailto:pierresshop48@gmail.com" className="text-primary hover:underline">pierresshop48@gmail.com</a></p>
          </section>
        </div>
      </div>
    </div>
  );
}
