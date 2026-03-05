import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Terminos() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
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
            <h2 className="text-xl font-semibold mt-8 mb-3">1. Aceptación de los Términos</h2>
            <p>Al descargar, instalar o utilizar Cap Finanzas ("el Software"), aceptas estos Términos de Uso. Si no estás de acuerdo, no debes utilizar el Software.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">2. Descripción del Servicio</h2>
            <p>Cap Finanzas es un software de finanzas personales y contabilidad que funciona de manera offline. Ofrece herramientas para el registro de ingresos y gastos, contabilidad por partida doble, reportes financieros y asesoría financiera con inteligencia artificial.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">3. Licencia de Uso</h2>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Cap Finanzas ofrece un <strong>período de prueba gratuito de 30 días</strong> con funcionalidad limitada</li>
              <li>Para acceso completo, se requiere la compra de una licencia mediante <strong>pago único</strong></li>
              <li>Existen tres tipos de licencia: Finanzas Simples, Contabilidad Tradicional y Licencia Completa</li>
              <li>Cada licencia es personal e intransferible</li>
              <li>La licencia es perpetua (no requiere pagos recurrentes)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">4. Pagos y Reembolsos</h2>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Los pagos se procesan a través de PayPal de manera segura</li>
              <li>Los precios están expresados en dólares estadounidenses (USD)</li>
              <li>Se aceptan solicitudes de reembolso dentro de los <strong>7 días</strong> posteriores a la compra, siempre que la licencia no haya sido activada</li>
              <li>Para solicitar un reembolso, contacta a pierresshop48@gmail.com</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">5. Responsabilidades del Usuario</h2>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>El usuario es responsable de la veracidad de los datos financieros que ingresa</li>
              <li>Cap Finanzas es una herramienta de registro y organización; <strong>no constituye asesoría financiera profesional</strong></li>
              <li>El usuario debe realizar respaldos periódicos de sus datos</li>
              <li>No está permitido redistribuir, revender o modificar el Software</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">6. Limitación de Responsabilidad</h2>
            <p>Cap Finanzas se proporciona "tal cual" sin garantías expresas o implícitas. No nos hacemos responsables de:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Pérdida de datos por fallas del dispositivo del usuario</li>
              <li>Decisiones financieras tomadas basándose en la información del Software</li>
              <li>Interrupciones en el servicio de activación de licencias</li>
              <li>Daños indirectos derivados del uso del Software</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">7. Propiedad Intelectual</h2>
            <p>Todo el contenido, diseño, código y funcionalidades de Cap Finanzas son propiedad de sus creadores y están protegidos por las leyes de propiedad intelectual aplicables.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">8. Modificaciones</h2>
            <p>Nos reservamos el derecho de modificar estos Términos de Uso en cualquier momento. Los cambios serán efectivos desde su publicación. El uso continuado del Software después de las modificaciones implica la aceptación de los nuevos términos.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">9. Contacto</h2>
            <p>Para consultas sobre estos términos, escríbenos a:</p>
            <p className="mt-2">
              <a href="mailto:pierresshop48@gmail.com" className="text-primary hover:underline">
                pierresshop48@gmail.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
