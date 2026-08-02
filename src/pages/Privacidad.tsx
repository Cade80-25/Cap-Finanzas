import { ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { SeoHead } from "@/components/SeoHead";

export default function Privacidad() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SeoHead
        title="Política de Privacidad — Cap Finanzas"
        description="Cap Finanzas guarda tus datos 100% locales. No hay telemetría ni servidores externos. Conoce nuestra política de privacidad."
        path="/privacidad"
      />
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
            <h2 className="text-xl font-semibold mt-8 mb-3">1. Identidad del Responsable</h2>
            <p>
              <strong>Cap Finanzas</strong> ("nosotros", "nuestro") es el responsable del tratamiento de los datos personales descritos en esta política. Cap Finanzas actúa como controlador de datos (data controller) respecto a la información que se procesa en relación con la entrega de licencias y el soporte del software.
            </p>
            <p className="mt-2">Para consultas sobre privacidad: <a href="mailto:pierresshop48@gmail.com" className="text-primary hover:underline">pierresshop48@gmail.com</a></p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">2. Datos que NO Recopilamos</h2>
            <p>Cap Finanzas opera de manera <strong>100% offline</strong>. Esto significa que:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>No recopilamos datos financieros personales</li>
              <li>No almacenamos información financiera en servidores externos</li>
              <li>No compartimos datos financieros con terceros</li>
              <li>No utilizamos cookies de rastreo dentro de la aplicación</li>
              <li>Todos tus datos financieros permanecen exclusivamente en tu dispositivo</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">3. Categorías de Datos que SÍ Procesamos</h2>
            <p>Procesamos únicamente las siguientes categorías de datos personales:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li><strong>Correo electrónico:</strong> para la compra, entrega y soporte de licencias de activación.</li>
              <li><strong>Información de pago:</strong> procesada exclusivamente por nuestro proveedor de pagos (ver sección 5). Cap Finanzas no almacena datos de tarjetas ni cuentas bancarias.</li>
              <li><strong>Códigos de licencia:</strong> para verificar la activación del software vinculada a tu correo electrónico.</li>
              <li><strong>Datos de soporte:</strong> mensajes que nos envías cuando contactas al soporte.</li>
              <li><strong>Datos técnicos básicos:</strong> dirección IP y user-agent registrados en logs de seguridad de nuestros servidores de licencias.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">4. Finalidades y Base Legal</h2>
            <p>Tratamos los datos personales con las siguientes finalidades y bases legales (RGPD art. 6):</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li><strong>Ejecución del contrato</strong> (art. 6.1.b): emisión, entrega y validación de licencias; atención de solicitudes de soporte.</li>
              <li><strong>Obligación legal</strong> (art. 6.1.c): conservación de registros fiscales y contables relacionados con las ventas.</li>
              <li><strong>Interés legítimo</strong> (art. 6.1.f): seguridad del servicio, prevención de fraude y abuso de licencias, mejora del producto.</li>
              <li><strong>Consentimiento</strong> (art. 6.1.a): envío de comunicaciones de marketing, cuando aplique, revocable en cualquier momento.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">5. Destinatarios y Encargados (incluido Paddle como MoR)</h2>
            <p>Compartimos datos personales únicamente con las siguientes categorías de destinatarios:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>
                <strong>Paddle.com Market Ltd ("Paddle") — Merchant of Record:</strong> Paddle actúa como vendedor registrado (Merchant of Record) de nuestros productos. Paddle procesa los pagos, gestiona impuestos, facturación, suscripciones, reembolsos y atención al cliente relacionada con la transacción. Para estas finalidades compartimos con Paddle datos como correo electrónico, datos de facturación e identificadores de pedido. Consulta la política de privacidad de Paddle en <a href="https://www.paddle.com/legal/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">paddle.com/legal/privacy</a>.
              </li>
              <li><strong>Proveedores de infraestructura:</strong> hosting de nuestro servicio de licencias y entrega de correos transaccionales.</li>
              <li><strong>Asesores profesionales:</strong> contables y legales, cuando sea necesario.</li>
              <li><strong>Autoridades públicas:</strong> cuando exista una obligación legal.</li>
            </ul>
            <p className="mt-3 text-sm text-muted-foreground">
              Nota histórica: en versiones previas el proveedor de pago era PayPal. Las compras nuevas se procesan a través de Paddle como Merchant of Record.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">6. Sitio Web y Analytics</h2>
            <p>Nuestro sitio web utiliza Google Analytics para recopilar información anónima sobre el tráfico (páginas visitadas, país y dispositivo agregados, fuente de tráfico). Esta información se utiliza para mejorar el sitio y no se vincula a datos financieros personales.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">7. Almacenamiento Local de Datos Financieros</h2>
            <p>Toda la información financiera que ingresas en Cap Finanzas se almacena localmente en tu dispositivo (localStorage del navegador o sistema de archivos local en la versión de escritorio). Tienes control total sobre estos datos y puedes eliminarlos en cualquier momento desde la configuración de la aplicación.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">8. Conservación de Datos</h2>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li><strong>Correo electrónico y datos de licencia:</strong> se conservan mientras la licencia esté activa y hasta 5 años después, para soporte y obligaciones fiscales.</li>
              <li><strong>Datos de facturación y pago:</strong> conservados por Paddle conforme a sus propias políticas y a la legislación fiscal aplicable (generalmente 7–10 años).</li>
              <li><strong>Logs técnicos:</strong> conservados un máximo de 12 meses.</li>
              <li><strong>Mensajes de soporte:</strong> conservados hasta 3 años tras la última interacción.</li>
            </ul>
            <p className="mt-3">Una vez finalizados estos plazos, los datos se eliminan o se anonimizan.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">9. Seguridad</h2>
            <p>Aplicamos medidas técnicas y organizativas apropiadas para proteger los datos personales: comunicaciones cifradas (HTTPS), control de acceso a sistemas, segregación de credenciales, y procesamiento de pagos por proveedores certificados PCI-DSS.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">10. Derechos del Usuario</h2>
            <p>Conforme al RGPD y normativa equivalente, tienes derecho a: acceso, rectificación, supresión, limitación del tratamiento, portabilidad, oposición, retirar el consentimiento, y presentar reclamación ante la autoridad de control competente. Responderemos en el plazo máximo de un mes.</p>
            <p className="mt-3">Para ejercer tus derechos escríbenos a <a href="mailto:pierresshop48@gmail.com" className="text-primary hover:underline">pierresshop48@gmail.com</a>. Para datos gestionados por Paddle como MoR (facturación, pagos), puedes contactar también a <a href="https://paddle.net" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">paddle.net</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">11. Transferencias Internacionales</h2>
            <p>Algunos de nuestros proveedores (incluido Paddle y servicios de hosting) pueden tratar datos fuera del Espacio Económico Europeo. En esos casos se aplican garantías adecuadas como Cláusulas Contractuales Tipo (SCC) de la Comisión Europea o decisiones de adecuación.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">12. Contacto</h2>
            <p>Cap Finanzas — <a href="mailto:pierresshop48@gmail.com" className="text-primary hover:underline">pierresshop48@gmail.com</a></p>
          </section>
        </div>
      </div>
    </div>
  );
}
