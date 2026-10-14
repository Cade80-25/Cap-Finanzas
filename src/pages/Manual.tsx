import { Book, ChevronRight, Home, Receipt, Calendar, Target, Globe, Tag, PieChart, BookOpen, FileText, BarChart3, TrendingUp, HelpCircle, Sparkles, User, Users, Boxes, Landmark, Briefcase, Rocket, ShoppingCart, Wrench, Shield, ClipboardCheck, HardDriveDownload, Settings, Bell, Search, Play, CheckCircle2, RotateCcw, GraduationCap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useTutorial } from "@/hooks/useTutorial";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const secciones = [
  {
    id: "inicio",
    titulo: "Primeros Pasos",
    icono: Home,
    contenido: [
      {
        subtitulo: "¿Qué es Cap Finanzas?",
        texto: "Cap Finanzas es una aplicación de finanzas personales y empresariales que funciona sin internet y guarda tus datos solo en tu PC. Sirve tanto para controlar gastos personales (Modo Simple) como para llevar la contabilidad completa de un negocio (Modo Empresarial), con módulos para facturación, inventario, RRHH y más."
      },
      {
        subtitulo: "Elige tu modo al empezar",
        texto: "Al abrir la aplicación por primera vez eliges entre:\n• Modo Simple (personas): registro de ingresos y gastos, presupuesto, calendario y resúmenes. Pensado para uso diario sin conocimientos de contabilidad.\n• Modo Empresarial (negocios): todo lo anterior más contabilidad doble entrada, facturación, RRHH, inventario, banca, tesorería y 30 módulos operativos.\nPuedes cambiar de modo cuando quieras desde Ajustes → Cuenta."
      },
      {
        subtitulo: "Panel Principal",
        texto: "Al entrar verás el resumen de tu situación: balance total, ingresos y gastos del mes, ahorros, gráficos comparativos y últimas transacciones. Todo se calcula automáticamente desde el Libro Diario: no hay que cargar nada dos veces."
      },
      {
        subtitulo: "Primer respaldo (recomendado)",
        texto: "Andá a Ajustes → Configuración → 'Respaldo completo de la aplicación' (primera tarjeta, arriba) y hacé clic en 'Crear respaldo'. Genera un único archivo con TODO (cuentas, movimientos, módulos y licencia). Guardalo en un pendrive o en la nube. Podés restaurarlo en cualquier PC con 'Restaurar respaldo'."
      }
    ]
  },
  {
    id: "transacciones",
    titulo: "Transacciones",
    icono: Receipt,
    contenido: [
      {
        subtitulo: "Vista de transacciones",
        texto: "Es la pantalla de uso diario: listado completo de ingresos y gastos con búsqueda por texto, filtros por categoría, cuenta y fecha, y ordenamiento. En modo Simple los registros se crean acá y se convierten en asientos del Libro Diario automáticamente."
      },
      {
        subtitulo: "Cómo registrar un gasto rápido",
        texto: "1. Clic en el botón '+' (gasto rápido) abajo a la derecha.\n2. Elegí la categoría (ej. 'Alimentación') y la fecha.\n3. Escribí el monto y una descripción breve.\n4. Guardá. El gasto aparece en el listado, en el presupuesto y en los resúmenes al instante."
      },
      {
        subtitulo: "Edición y borrado",
        texto: "Cada fila tiene íconos de lápiz (editar) y tacho (borrar). Al editar corregís monto, categoría o descripción; al borrar, el sistema pide confirmación y quita también los asientos contables asociados."
      },
      {
        subtitulo: "Gastos (vista rápida)",
        texto: "Pantalla simplificada solo de gastos: una lista directa de todo lo que salió, con filtros por categoría y mes. Es un atajo para revisar gastos sin entrar al libro diario."
      },
      {
        subtitulo: "Categorías",
        texto: "Administrás las categorías de ingresos y gastos: crear nuevas, renombrar, elegir icono y color, y organizarlas en subcategorías anidadas. Una buena lista de categorías hace que los resúmenes y el presupuesto sean útiles."
      }
    ]
  },
  {
    id: "calendario",
    titulo: "Calendario Financiero",
    icono: Calendar,
    contenido: [
      {
        subtitulo: "Visualización temporal",
        texto: "Ves todos los ingresos y gastos sobre un calendario mensual. Los días con movimientos se resaltan; al hacer clic en un día se despliegan sus transacciones. Ideal para detectar de un vistazo los días de mayor gasto."
      },
      {
        subtitulo: "Eventos programados",
        texto: "Configurá ingresos y gastos recurrentes (salario, alquiler, cuotas) para que aparezcan como próximos eventos y no se te pasen. Cada evento programado puede convertirse en transacción real con un clic."
      }
    ]
  },
  {
    id: "presupuesto",
    titulo: "Presupuesto",
    icono: Target,
    contenido: [
      {
        subtitulo: "Crear un presupuesto",
        texto: "Definí un monto máximo por categoría (ej. 'Restaurantes: $3.000/mes'). El sistema compara lo presupuestado contra lo realmente gastado según tus transacciones."
      },
      {
        subtitulo: "Seguimiento en vivo",
        texto: "Barras de progreso muestran el consumo de cada categoría: verde (holgado), ámbar (cerca del límite), rojo (excedido). El Panel Principal te avisa cuántas categorías ya pasaron el límite este mes."
      }
    ]
  },
  {
    id: "monedas",
    titulo: "Monedas",
    icono: Globe,
    contenido: [
      {
        subtitulo: "Multi-moneda",
        texto: "Cada transacción puede registrarse en su moneda original (UYU, USD, EUR, ARS, etc.) y el sistema las convierte a tu moneda base para los totales."
      },
      {
        subtitulo: "Actualización de tasas",
        texto: "El conversor descarga tasas actualizadas cuando hay internet; sin internet usa la última tasa guardada. También podés fijar una tasa manualmente desde esta pantalla."
      }
    ]
  },
  {
    id: "resumen",
    titulo: "Resumen y Consolidado",
    icono: PieChart,
    contenido: [
      {
        subtitulo: "Vista general",
        texto: "Resúmenes mensuales y anuales: total de ingresos, gastos, ahorro del período, comparativa vs. mes anterior, y desglose por categoría con gráficos de torta."
      },
      {
        subtitulo: "Consolidado (Empresarial)",
        texto: "Combina todas las cuentas y perfiles en un solo estado. Útil cuando manejás varios negocios o frelancers: ves la posición global sin exportar nada."
      }
    ]
  },
  {
    id: "libro-diario",
    titulo: "Libro Diario (Contabilidad)",
    icono: BookOpen,
    contenido: [
      {
        subtitulo: "¿Qué es el Libro Diario?",
        texto: "Es el registro cronológico de asientos contables con la regla de oro: cada asiento lleva 'Debe' y 'Haber' y SIEMPRE deben sumar lo mismo (asiento balanceado). Es la base de todos los estados financieros de la app."
      },
      {
        subtitulo: "Cómo agregar un asiento manual",
        texto: "1. Contabilidad → Libro Diario → 'Nueva Transacción'.\n2. Fecha y descripción.\n3. Elegí la cuenta que se carga en 'Debe' (ej. Gastos Operativos) y su monto.\n4. Elegí la cuenta que se abona en 'Haber' (ej. Banco) con el MISMO monto.\n5. Guardá. Si Debe ≠ Haber, el sistema no te deja guardar: es una protección contra errores."
      },
      {
        subtitulo: "Asientos automáticos de los módulos",
        texto: "No hace falta contabilizar a mano lo que ya registrás en los módulos: cada módulo tiene su botón 'Contabilizar' (ej. Facturación → 'Contabilizar factura', RRHH → 'Contabilizar nómina') que genera el asiento balanceado por vos y marca el documento para no duplicarlo."
      },
      {
        subtitulo: "Descuadre = alerta",
        texto: "La pantalla Recomendaciones revisa tu libro diario y te avisa si la suma del Debe difiere del Haber (ej. '106.881 de diferencia'). Revisá los asientos del período o restaurá un respaldo anterior si el error viene de lejos."
      }
    ]
  },
  {
    id: "libro-mayor",
    titulo: "Libro Mayor, Balance y Resultados",
    icono: FileText,
    contenido: [
      {
        subtitulo: "Libro Mayor",
        texto: "Agrupa todos los asientos por cuenta y muestra el saldo de cada una. Es la vista clásica del contador: '¿cuánto hay en Banco?' o '¿cuánto gasté en Alquileres este año?'."
      },
      {
        subtitulo: "Balance General",
        texto: "Estado de situación patrimonial: Activos (lo que tenés), Pasivos (lo que debés) y Patrimonio (la diferencia). Se arma solo desde el Libro Mayor."
      },
      {
        subtitulo: "Estado de Resultados",
        texto: "Ingresos menos gastos del período = ganancia o pérdida. Incluye desglose por tipo de ingreso y gasto. Es el informe para saber si el negocio (o tu bolsillo) ganó o perdió plata en el mes."
      }
    ]
  },
  {
    id: "facturacion",
    titulo: "Facturación",
    icono: FileText,
    contenido: [
      {
        subtitulo: "Facturas de venta",
        texto: "Creamos facturas con numeración automática, cliente, líneas de producto/servicio, e impuestos. Al 'Contabilizar factura' se genera el asiento: Debe Clientes / Haber Ingresos por Ventas (+ impuestos si corresponde)."
      },
      {
        subtitulo: "Cuentas corrientes de clientes",
        texto: "Las facturas pendientes alimentan la pantalla Cuentas Corrientes: ahí ves quién te debe, desde cuándo, y registrás los cobros. Cada cobro genera su asiento (Debe Banco / Haber Clientes)."
      }
    ]
  },
  {
    id: "rrhh",
    titulo: "RRHH — Nómina",
    icono: Users,
    contenido: [
      {
        subtitulo: "Empleados y nómina",
        texto: "Cargá empleados con su sueldo nominal. Cada mes generá la nómina: el sistema calcula aportes y deducciones configurables y, con 'Contabilizar nómina', crea el asiento completo (Debe Sueldos y Gastos / Haber Banco y Pasivos por aportes)."
      },
      {
        subtitulo: "Registro histórico",
        texto: "Cada nómina queda guardada con su período, así podés ver la evolución del costo laboral mes a mes sin planillas externas."
      }
    ]
  },
  {
    id: "inventario",
    titulo: "Inventario",
    icono: Boxes,
    contenido: [
      {
        subtitulo: "Artículos y stock",
        texto: "Cargá artículos con su costo unitario, stock actual y mínimo de alerta. Los movimientos de entrada/salida actualizan el stock y el valor del inventario en tiempo real."
      },
      {
        subtitulo: "Valoración y alertas",
        texto: "El valor del inventario usa el método elegido por artículo (promedio ponderado o ajuste). Cuando un artículo cae por debajo del mínimo, aparece en la lista de 'stock bajo' y en notificaciones."
      }
    ]
  },
  {
    id: "tesoreria",
    titulo: "Tesorería y Banca",
    icono: Landmark,
    contenido: [
      {
        subtitulo: "Tesorería",
        texto: "Flujo de caja proyectado: cobros y pagos programados vs. realizados. Ves si los próximos 30/60/90 días cierran en positivo o si vas a necesitar financiarse."
      },
      {
        subtitulo: "Banca",
        texto: "Conciliación bancaria: cargás los movimientos del resumen del banco y los comparás con los que ya tenés registrados; los que coinciden se marcan conciliados, los que faltan quedan pendientes de revisar."
      }
    ]
  },
  {
    id: "activos",
    titulo: "Activos y Logística",
    icono: Briefcase,
    contenido: [
      {
        subtitulo: "Activos fijos",
        texto: "Registrá equipos, vehículos e inmuebles con su valor y vida útil. El módulo calcula la depreciación mensual y, con 'Contabilizar depreciación', genera el asiento (Debe Gasto por Depreciación / Haber Depreciación Acumulada)."
      },
      {
        subtitulo: "Vida útil y venta de activos",
        texto: "Al vender o dar de baja un activo, el sistema calcula la ganancia/pérdida por la venta comparando precio vs. valor en libros, y arma el asiento de baja."
      }
    ]
  },
  {
    id: "proyectos",
    titulo: "Proyectos y Startups",
    icono: Rocket,
    contenido: [
      {
        subtitulo: "Proyectos",
        texto: "Asigná ingresos y costos a proyectos para saber si cada uno gana o pierde dinero. Cada proyecto muestra su rentabilidad acumulada sin exportar nada a Excel."
      },
      {
        subtitulo: "Startups",
        texto: "Seguí rondas de inversión, MRR (ingreso recurrente mensual) y runway. El botón 'Contabilizar MRR del mes' pasa el ingreso recurrente al libro diario."
      }
    ]
  },
  {
    id: "tpv",
    titulo: "TPV — Punto de Venta",
    icono: ShoppingCart,
    contenido: [
      {
        subtitulo: "Venta rápida",
        texto: "Pantalla de mostrador: buscás el producto, sumás líneas, cobrás. Cada venta descuenta stock del inventario y genera el asiento de venta (Debe Caja/Banco / Haber Ingresos)."
      },
      {
        subtitulo: "Cierre de caja",
        texto: "Al final del día, el cierre compara lo vendido contra lo cobrado en caja. Si hay diferencias, quedan registradas para revisión."
      }
    ]
  },
  {
    id: "crm",
    titulo: "CRM y Ventas",
    icono: Users,
    contenido: [
      {
        subtitulo: "Clientes y oportunidades",
        texto: "Listado de clientes con sus datos y estado (activo, inactivo). Las oportunidades de venta siguen etapas (contacto, propuesta, negociación, cerrada) para saber qué tenés en carpeta."
      },
      {
        subtitulo: "Marketing",
        texto: "Campañas con presupuesto, alcance y resultado. Al 'Finalizar y contabilizar' una campaña, su costo pasa al libro diario como gasto de marketing."
      }
    ]
  },
  {
    id: "operaciones",
    titulo: "Operaciones: Fabricación, Flota, Alquiler, Contratos",
    icono: Wrench,
    contenido: [
      {
        subtitulo: "Fabricación",
        texto: "Órdenes de producción con lista de materiales (BOM): consumís materia prima del inventario y registrás mano de obra. El módulo calcula costo estándar vs. real y las variaciones (desvíos) de cada orden."
      },
      {
        subtitulo: "Flota",
        texto: "Vehículos con kilometraje, combustible y mantenimiento. Cada viaje puede imputarse a un proyecto o cliente para conocer el costo real de reparto."
      },
      {
        subtitulo: "Alquiler (inmobiliario)",
        texto: "Propiedades con contrato, inquilino y mensualidad. Registrás los cobros de renta y los pagos vencidos se marcan solos. Cobrar una renta genera: Debe Banco / Haber Ingresos por Alquileres."
      },
      {
        subtitulo: "Contratos",
        texto: "Contratos de servicio con vigencia, montos y facturación periódica. Llegada la fecha, el sistema propone la factura a emitir."
      }
    ]
  },
  {
    id: "compliance",
    titulo: "Auditoría, Calidad y Riesgos",
    icono: Shield,
    contenido: [
      {
        subtitulo: "Auditoría",
        texto: "Hallazgos de auditoría con severidad (baja/media/alta). El botón 'Provisionar' calcula la provisión contable del hallazgo y la pasa al libro diario."
      },
      {
        subtitulo: "Calidad",
        texto: "Controles de calidad con estado (aprobado/rechazado) sobre producción o compras. Los rechazos alimentan el módulo de costos de no calidad."
      },
      {
        subtitulo: "Riesgos",
        texto: "Matriz de riesgos con probabilidad e impacto; el sistema los prioriza solo. Los riesgos 'alto' aparecen en el Panel Principal."
      }
    ]
  },
  {
    id: "aprobaciones",
    titulo: "Aprobaciones y Finanzas",
    icono: ClipboardCheck,
    contenido: [
      {
        subtitulo: "Aprobaciones",
        texto: "Flujo de aprobación de gastos: un pedido de gasto entra 'pendiente', un aprobador lo acepta o rechaza, y solo lo aprobado se contabiliza. Evita que cualquier gasto llegue al libro sin control."
      },
      {
        subtitulo: "Financiamiento",
        texto: "Préstamos con capital, tasa e intereses. El sistema calcula la cuota y cada pago genera su asiento separando capital e interés."
      },
      {
        subtitulo: "Trading",
        texto: "Journal de trading para registrar operaciones de compra/venta de activos financieros con precio de entrada, salida y resultado (P&L) por operación."
      }
    ]
  },
  {
    id: "analisis",
    titulo: "Análisis y BI",
    icono: BarChart3,
    contenido: [
      {
        subtitulo: "Análisis Financiero",
        texto: "Ratios calculados solos: liquidez, endeudamiento, margen, ROE. Con tus saldos del balance, sin planillas."
      },
      {
        subtitulo: "Contabilidad Analítica",
        texto: "Asigna costos por centro o departamento para saber cuánto cuesta cada área del negocio."
      },
      {
        subtitulo: "Business Intelligence (BI)",
        texto: "Indicadores combinados de todos los módulos en un tablero: ventas, cobros, stock, nómina. La vista de mando para el dueño."
      }
    ]
  },
  {
    id: "recomendaciones",
    titulo: "Recomendaciones del Asesor",
    icono: Sparkles,
    contenido: [
      {
        subtitulo: "Asesor contable automático",
        texto: "En Aprender → Recomendaciones, el asesor revisa TU libro diario y Tus módulos y genera alertas con números reales: descuadres Debe/Haber, meses con pérdida, gastos concentrados en una sola cuenta, presupuesto excedido. Cada recomendación cita el monto exacto para que puedas verificarla."
      },
      {
        subtitulo: "Cómo usar las alertas",
        texto: "1. Abrí Aprender → Recomendaciones.\n2. Leé cada tarjeta: título, severidad (alta/media/baja) y el número involucrado.\n3. Andá al módulo mencionado y corregí el origen (un asiento mal cargado, una factura sin cobro, un gasto duplicado).\n4. Volvé a Recomendaciones: si corregiste bien, la alerta desaparece."
      }
    ]
  },
  {
    id: "respaldo",
    titulo: "Respaldo Completo y Datos",
    icono: HardDriveDownload,
    contenido: [
      {
        subtitulo: "Respaldo completo (NUEVO)",
        texto: "Ajustes → Configuración → 'Respaldo completo de la aplicación' (primera tarjeta). Un clic en 'Crear respaldo' genera un archivo único con TODOS tus datos: cuentas, libro diario, todos los módulos, perfiles y licencia. 'Restaurar respaldo' revive todo en la misma PC o en otra."
      },
      {
        subtitulo: "Exportación por módulo",
        texto: "Además del respaldo completo, cada módulo y el tab Configuración → Gestión de Datos permiten exportar en JSON o CSV solo lo de ese módulo (ej. solo el libro diario). Ideal para llevar a tu contador."
      },
      {
        subtitulo: "Importar",
        texto: "'Importar' lee un JSON exportado por la misma aplicación. Ojo: importar reemplaza el contenido del módulo correspondiente; si dudás, hacé primero un respaldo completo."
      }
    ]
  },
  {
    id: "cuenta",
    titulo: "Cuenta, Perfiles y Licencia",
    icono: User,
    contenido: [
      {
        subtitulo: "Perfiles",
        texto: "Un perfil es una 'bolsa de datos' separada: uno para tu casa, otro para el negocio, otro para un familiar. Cada perfil tiene sus propias cuentas, transacciones y módulos. Cambiás de perfil desde Ajustes → Cuenta sin mezclar datos."
      },
      {
        subtitulo: "Licencias",
        texto: "La app funciona en prueba con todas las funciones por 30 días. Para activarla de por vida: Ajustes → Licencia → ingresá el código de compra. Licencia Simple (personas, USD 20) o Empresarial (USD 100). Sin suscripciones ni pagos recurrentes."
      },
      {
        subtitulo: "Seguridad con PIN",
        texto: "Configuración → Seguridad → activá 'PIN de Seguridad' para que la app lo pida al abrir. Sin PIN, cualquiera que use tu PC puede ver tus datos."
      }
    ]
  },
  {
    id: "aprender",
    titulo: "Aprender y Enciclopedia",
    icono: GraduationCap,
    contenido: [
      {
        subtitulo: "Aprender",
        texto: "Artículos cortos sobre finanzas personales: ahorro, intereses, presupuesto, deuda. Escritos en español simple, sin jerga."
      },
      {
        subtitulo: "Enciclopedia contable",
        texto: "Diccionario de términos contables (activo, pasivo, amortización, provisión...) con ejemplos. Para cuando un término del balance no te suene."
      }
    ]
  },
  {
    id: "atajos",
    titulo: "Atajos y Consejos",
    icono: Play,
    contenido: [
      {
        subtitulo: "Atajos de teclado",
        texto: "Ctrl+K abre la búsqueda global (saltá a cualquier módulo escribiendo su nombre). Los tutoriales interactivos (arriba de esta página) te guían pantalla por pantalla la primera vez."
      },
      {
        subtitulo: "Flujo recomendado para un negocio",
        texto: "1. Cargá tus cuentas en Contabilidad.\n2. Facturá lo vendido (Facturación o TPV).\n3. Registrá compras y gastos.\n4. Cobrá y pagá desde Cuentas Corrientes/Tesorería.\n5. Fin de mes: contabilizá nómina, depreciación e inventario.\n6. Revisá Recomendaciones y creá tu respaldo completo."
      }
    ]
  },
  {
    id: "seguros-mantenimiento",
    titulo: "Seguros y Mantenimiento",
    icono: Shield,
    contenido: [
      {
        subtitulo: "Seguros",
        texto: "Llevá el registro de todas tus pólizas: seguro del auto, del local, de vida, del comercio. Cargás la aseguradora, el monto de la prima, el vencimiento y qué cubre. La app te avisa antes de que venza cada póliza para que no te quedes descubierto, y con 'Contabilizar' pasás la prima al libro diario como gasto del período."
      },
      {
        subtitulo: "Mantenimiento",
        texto: "Registrá los mantenimientos de equipos, vehículos y propiedades: fecha, qué se hizo, costo y quién lo hizo. El historial queda asociado al activo, así sabés cuánto te cuesta mantener cada cosa y cuándo le toca el próximo servicio. Cada mantenimiento puede contabilizarse como gasto."
      }
    ]
  },
  {
    id: "automatizacion-notificaciones",
    titulo: "Automatización y Notificaciones",
    icono: Bell,
    contenido: [
      {
        subtitulo: "Reglas automáticas",
        texto: "Definí reglas del estilo 'si X sucede, entonces Y': por ejemplo, 'si el gasto de una categoría supera $X al mes, avisame' o 'si el stock baja del mínimo, marcar alerta'. Las reglas corren solas sobre tus datos; no tenés que revisar nada a mano. Cada regla tiene una severidad (crítica, alta, media o baja) que decide cómo se muestra la alerta."
      },
      {
        subtitulo: "Centro de notificaciones",
        texto: "Todas las alertas de todos los módulos caen acá: vencimientos de pólizas, stock bajo, presupuesto excedido, descuadres contables, alertas de reglas. La campana del menú superior muestra el contador de alertas sin leer; desde el panel las marcás como leídas o resueltas."
      }
    ]
  },
  {
    id: "comercio-documentos-bolsas",
    titulo: "Comercio Exterior, Documentos y Bolsas",
    icono: Globe,
    contenido: [
      {
        subtitulo: "Comercio Exterior",
        texto: "Importaciones y exportaciones: registrás cada operación con divisa, aranceles, flete y agente. El módulo calcula el costo total desembarcado y con 'Contabilizar' genera el asiento de la operación completa. Ideal si comprás o vendés afuera y necesitás el costo real en tu moneda."
      },
      {
        subtitulo: "Gestión documental",
        texto: "Guardá y organizá los documentos del negocio: facturas de proveedores, contratos escaneados, pólizas, recibos. Cada documento tiene categoría y vencimiento. Es el archivador digital de la app: encontrás cualquier papel en segundos sin depender de carpetas de Windows."
      },
      {
        subtitulo: "Bolsas en vivo",
        texto: "Seguí tus inversiones: cotizaciones en vivo de tus activos financieros, valor de tu cartera y ganancia/pérdida flotante. Cargás tus tenencias y la pantalla calcula el resto sola."
      }
    ]
  }
];

const preguntasFrecuentes = [
  {
    pregunta: "¿Cómo empiezo a usar Cap Finanzas?",
    respuesta: "Ve al Libro Diario y comienza a registrar tus transacciones. Cada vez que recibas dinero (salario, ventas, etc.) o gastes (compras, servicios, etc.), créalo como una transacción. El resto de la aplicación se actualizará automáticamente."
  },
  {
    pregunta: "¿Qué es 'Debe' y 'Haber'?",
    respuesta: "En contabilidad, 'Debe' registra los aumentos de activos y gastos, mientras que 'Haber' registra los aumentos de pasivos, patrimonio e ingresos. Para simplificar: usa 'Haber' para ingresos y 'Debe' para gastos."
  },
  {
    pregunta: "¿Mis datos se guardan en la nube?",
    respuesta: "No, todos tus datos se guardan localmente en tu dispositivo. Esto garantiza tu privacidad. Puedes exportarlos manualmente desde Configuración si deseas hacer un respaldo."
  },
  {
    pregunta: "¿Puedo usar la aplicación sin internet?",
    respuesta: "Sí, Cap Finanzas funciona completamente offline. Solo necesitas internet para el conversor de monedas (tasas actualizadas) y para buscar actualizaciones."
  },
  {
    pregunta: "¿Cómo protejo mis datos con PIN?",
    respuesta: "Ve a Configuración > Seguridad y activa el 'PIN de Seguridad'. Podrás establecer un PIN que se solicitará cada vez que abras la aplicación."
  }
];

const SECTION_ROUTES: Record<string, string> = {
  "dashboard": "/",
  "inicio": "/",
  "transacciones": "/transacciones",
  "calendario": "/calendario",
  "presupuesto": "/presupuesto",
  "monedas": "/monedas",
  "categorias": "/categorias",
  "resumen": "/resumen",
  "libro-diario": "/libro-diario",
  "libro-mayor": "/libro-mayor",
  "balance": "/balance",
  "estado-resultados": "/resultados",
  "recomendaciones": "/recomendaciones",
  "notificaciones": "/notificaciones",
  "configuracion": "/configuracion",
  "respaldo": "/configuracion?tab=configuracion",
  "facturacion": "/facturacion",
  "rrhh": "/rrhh",
  "inventario": "/inventario",
  "tesoreria": "/tesoreria",
  "activos": "/activos",
  "proyectos": "/proyectos",
  "tpv": "/tpv",
  "crm": "/crm",
  "aprobaciones": "/aprobaciones",
  "analisis": "/analisis",
  "seguros-mantenimiento": "/seguros",
  "automatizacion-notificaciones": "/automatizacion",
  "comercio-documentos-bolsas": "/comercio",
};

export default function Manual() {
  const navigate = useNavigate();
  const { allSections, isSectionCompleted, startTutorial, resetTutorial, completedSections } = useTutorial();

  const completedCount = completedSections.length;
  const totalCount = allSections.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleStartTutorial = (sectionId: string) => {
    const route = SECTION_ROUTES[sectionId];
    if (route) {
      navigate(route);
      // Small delay to let the page render before starting tutorial
      setTimeout(() => startTutorial(sectionId), 300);
    }
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold mb-2">Tutoriales y Manual de Usuario</h1>
        <p className="text-muted-foreground">
          Guía completa para aprovechar al máximo Cap Finanzas
        </p>
      </div>

      {/* Tutoriales Interactivos */}
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                Tutoriales Interactivos
              </CardTitle>
              <CardDescription className="mt-1">
                Aprende a usar cada sección con guías paso a paso
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={resetTutorial} className="gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" />
              Reiniciar
            </Button>
          </div>
          {/* Progress */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progreso general</span>
              <span className="font-medium">{completedCount}/{totalCount} completados</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {allSections.map((section) => {
              const completed = isSectionCompleted(section.id);
              const hasRoute = !!SECTION_ROUTES[section.id];
              return (
                <button
                  key={section.id}
                  onClick={() => handleStartTutorial(section.id)}
                  disabled={!hasRoute}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                    completed
                      ? "bg-primary/5 border-primary/20 hover:bg-primary/10"
                      : "bg-card hover:bg-muted border-border",
                    !hasRoute && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className={cn(
                    "flex items-center justify-center h-9 w-9 rounded-lg shrink-0",
                    completed ? "bg-primary/10" : "bg-muted"
                  )}>
                    {completed ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <Play className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className={cn("text-sm font-medium truncate", completed && "text-primary")}>
                      {section.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {section.steps.length} pasos {completed && "· ✓ Completado"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Índice rápido */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Book className="h-5 w-5" />
            Índice de Contenidos
          </CardTitle>
          <CardDescription>
            Navega rápidamente a cualquier sección del manual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {secciones.map((seccion) => (
              <a
                key={seccion.id}
                href={`#${seccion.id}`}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <seccion.icono className="h-4 w-4 text-primary" />
                <span className="text-sm">{seccion.titulo}</span>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Secciones del manual */}
      <div className="space-y-6">
        {secciones.map((seccion) => (
          <Card key={seccion.id} id={seccion.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <seccion.icono className="h-5 w-5 text-primary" />
                {seccion.titulo}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {seccion.contenido.map((item, index) => (
                <div key={index}>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-primary" />
                    {item.subtitulo}
                  </h4>
                  <p className="text-muted-foreground whitespace-pre-line pl-6">
                    {item.texto}
                  </p>
                  {index < seccion.contenido.length - 1 && (
                    <Separator className="mt-4" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Preguntas frecuentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            Preguntas Frecuentes
          </CardTitle>
          <CardDescription>
            Respuestas a las dudas más comunes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {preguntasFrecuentes.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.pregunta}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.respuesta}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Consejos finales */}
      <Card className="bg-gradient-primary">
        <CardHeader>
          <CardTitle className="text-primary-foreground">
            💡 Consejo del Día
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-primary-foreground/90">
            Registra tus transacciones el mismo día que ocurren. Esto te ayudará a mantener un control preciso de tus finanzas y a no olvidar ningún movimiento importante.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
