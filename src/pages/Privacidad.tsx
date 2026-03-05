import { ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Privacidad() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" /> Volver
        </Button>

        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Política de Privacidad</h1>
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">Última actualización: {new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}</p>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">1. Información General</h2>
            <p>Cap Finanzas ("nosotros", "nuestro") es un software de finanzas personales y contabilidad diseñado con la privacidad como prioridad. Esta política describe cómo manejamos la información en relación con nuestro software.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">2. Datos que NO Recopilamos</h2>
            <p>Cap Finanzas opera de manera <strong>100% offline</strong>. Esto significa que:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>No recopilamos datos financieros personales</li>
              <li>No almacenamos información en servidores externos</li>
              <li>No compartimos datos con terceros</li>
              <li>No utilizamos cookies de rastreo dentro de la aplicación</li>
              <li>Todos tus datos financieros permanecen exclusivamente en tu dispositivo</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">3. Datos que SÍ Procesamos</h2>
            <p>Únicamente procesamos la siguiente información para fines operativos:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li><strong>Correo electrónico:</strong> Solo para la compra y entrega de licencias de activación</li>
              <li><strong>Información de pago:</strong> Procesada exclusivamente por PayPal; nosotros no almacenamos datos de tarjetas o cuentas bancarias</li>
              <li><strong>Códigos de licencia:</strong> Para verificar la activación del software</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">4. Sitio Web y Analytics</h2>
            <p>Nuestro sitio web (landing page) utiliza Google Analytics para recopilar información anónima sobre el tráfico, como:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Páginas visitadas y duración de la visita</li>
              <li>País y dispositivo (de forma agregada y anónima)</li>
              <li>Fuente de tráfico (cómo llegaste al sitio)</li>
            </ul>
            <p className="mt-3">Esta información se usa exclusivamente para mejorar nuestro sitio web y no se vincula a datos personales.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">5. Almacenamiento Local</h2>
            <p>Toda la información financiera que ingresas en Cap Finanzas se almacena localmente en tu dispositivo usando el almacenamiento del navegador (localStorage). Tú tienes control total sobre estos datos y puedes eliminarlos en cualquier momento desde la configuración de la aplicación.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">6. Seguridad</h2>
            <p>Implementamos las siguientes medidas de seguridad:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Comunicaciones cifradas (HTTPS) para la compra de licencias</li>
              <li>Procesamiento de pagos a través de PayPal (plataforma certificada PCI-DSS)</li>
              <li>Sin transmisión de datos financieros personales a servidores externos</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">7. Derechos del Usuario</h2>
            <p>Tienes derecho a:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Solicitar información sobre los datos asociados a tu licencia</li>
              <li>Solicitar la eliminación de tu correo electrónico de nuestros registros</li>
              <li>Eliminar todos tus datos financieros locales en cualquier momento</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">8. Contacto</h2>
            <p>Para consultas sobre privacidad, escríbenos a:</p>
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
