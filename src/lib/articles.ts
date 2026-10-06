export interface Article {
  slug: string;
  title: string;
  description: string;
  keywords: string;
  publishedAt: string; // ISO
  readingMinutes: number;
  intro: string;
  // Each section is markdown-lite: paragraphs separated by \n\n; list bullets start with "- "
  sections: { heading: string; body: string }[];
  related?: string[]; // slugs
}

export const ARTICLES: Article[] = [
  {
    slug: "contabilidad-personal-sin-excel",
    title: "Cómo llevar contabilidad personal sin Excel",
    description:
      "Aprende a llevar tu contabilidad personal sin depender de Excel: categorías, registro diario y errores comunes. Guía paso a paso para empezar hoy.",
    keywords:
      "contabilidad personal, sin Excel, finanzas personales, gastos, presupuesto, app finanzas offline",
    publishedAt: "2026-05-29",
    readingMinutes: 6,
    intro:
      "Excel es la herramienta más usada para llevar finanzas personales, pero también la más frágil: fórmulas que se rompen, archivos perdidos, formato manual interminable. Si querés un control real sin pelearte con celdas, esta guía te muestra cómo organizar tu contabilidad personal usando un enfoque más simple y duradero.",
    sections: [
      {
        heading: "Por qué Excel se queda corto",
        body: "Las hojas de cálculo son geniales para empezar, pero a los seis meses la mayoría de las personas abandona. Las causas se repiten:\n\n- Hay que abrir el archivo y formatear cada movimiento a mano.\n- No hay categorías por defecto: cada quien inventa las suyas y las pierde.\n- Es difícil ver tendencias mensuales sin tablas dinámicas complejas.\n- Un cierre accidental sin guardar puede borrar semanas de trabajo.\n\nUna app dedicada resuelve esto porque guarda automáticamente, valida lo que escribís y te muestra reportes sin que tengas que aprender fórmulas.",
      },
      {
        heading: "Los 3 elementos mínimos de toda contabilidad personal",
        body: "No importa la herramienta: una contabilidad personal útil necesita estos tres pilares.\n\n- Registro diario: anotar cada ingreso y gasto en menos de 30 segundos.\n- Categorías estables: un puñado fijo (Alimentación, Transporte, Vivienda, Ocio, Ingresos) que no cambies cada mes.\n- Resumen mensual: ver al final del mes cuánto entró, cuánto salió y dónde se fue.\n\nSi tu sistema cumple estos tres puntos, ya supera al 80% de las personas que llevan finanzas en Excel.",
      },
      {
        heading: "Paso a paso para empezar hoy",
        body: "- Elegí 5 a 7 categorías de gasto que reflejen tu vida real.\n- Definí 1 o 2 categorías de ingreso (sueldo, freelance, otros).\n- Cargá los últimos 30 días desde tu cuenta bancaria o ticket por ticket.\n- Revisá el primer resumen mensual y ajustá categorías si alguna queda vacía o desbordada.\n- Repetí el ciclo cada semana: 5 minutos los domingos alcanzan.\n\nLo importante no es la perfección, es la constancia. Un sistema imperfecto pero usado cada semana vale más que el Excel perfecto que nunca abrís.",
      },
      {
        heading: "Errores comunes que arruinan el hábito",
        body: "- Demasiadas categorías: si tenés 25, vas a abandonar. Empezá con 6.\n- Esperar fin de mes para cargar todo: olvidás detalles y se vuelve tedioso.\n- Mezclar finanzas personales con las de un emprendimiento.\n- No diferenciar gastos fijos de variables, lo que impide ver dónde recortar.\n- Buscar la app perfecta antes de empezar. La mejor app es la que ya estás usando.",
      },
      {
        heading: "Conclusión",
        body: "Llevar contabilidad personal sin Excel no es solo posible: es más sostenible. Una app dedicada como Cap Finanzas te permite registrar en segundos, ver reportes automáticos y mantener tus datos 100% locales y privados. Empezá esta semana con 5 categorías y mediciones simples; el sistema crece con vos.",
      },
    ],
    related: ["partida-doble-explicada-simple", "finanzas-vs-contabilidad"],
  },
  {
    slug: "partida-doble-explicada-simple",
    title: "Partida doble explicada simple: la regla que ordena toda la contabilidad",
    description:
      "Entendé la partida doble en 5 minutos: qué es, por qué cada movimiento tiene dos lados y ejemplos prácticos con cuentas reales. Sin jerga.",
    keywords:
      "partida doble, contabilidad, debe haber, libro diario, contabilidad para principiantes",
    publishedAt: "2026-05-29",
    readingMinutes: 5,
    intro:
      "La partida doble es la base de toda la contabilidad moderna desde hace más de 500 años. Suena complicada, pero la idea central es muy simple: nada aparece de la nada. Si tu dinero se mueve, hay un origen y un destino.",
    sections: [
      {
        heading: "La idea en una frase",
        body: "Cada operación afecta al menos dos cuentas: una recibe (Debe) y otra entrega (Haber). Y los totales siempre tienen que cuadrar.\n\nSi pagás $1.000 de luz con dinero de tu caja, la cuenta 'Servicios' recibe $1.000 (sube tu gasto) y la cuenta 'Caja' entrega $1.000 (baja tu efectivo). El sistema queda en equilibrio.",
      },
      {
        heading: "Por qué se usa hace 500 años",
        body: "Porque te obliga a registrar bien. Si los lados no cuadran, sabés que algo está mal antes de cerrar el mes. Ese chequeo automático elimina el 90% de los errores típicos de quien lleva una libreta o una planilla suelta.",
      },
      {
        heading: "Tres ejemplos prácticos",
        body: "- Cobrás $50.000 de sueldo en efectivo: Caja recibe $50.000 (Debe) / Ingresos por sueldo entrega $50.000 (Haber).\n- Comprás un teléfono por $30.000 con tarjeta: Bienes recibe $30.000 (Debe) / Tarjeta de crédito entrega $30.000 (Haber, porque ahora debés esa plata).\n- Pagás $5.000 de internet: Servicios recibe $5.000 (Debe) / Caja entrega $5.000 (Haber).\n\nSi sumás todos los Debe del mes y todos los Haber del mes, los totales tienen que ser idénticos. Si no, hay un error que tenés que encontrar.",
      },
      {
        heading: "Debe y Haber no significan bueno y malo",
        body: "Es un error común. Debe no es deuda y Haber no es 'lo que te corresponde'. Son simplemente los nombres tradicionales de los dos lados de cada asiento. Lo que importa es que cada movimiento tenga ambos.",
      },
      {
        heading: "¿Necesito usarla para mis finanzas personales?",
        body: "Si solo querés saber cuánto gastás en café, no. Pero si manejás varias cuentas, tarjetas, préstamos o un pequeño emprendimiento, la partida doble te ahorra muchísimos dolores de cabeza. Por eso Cap Finanzas tiene un modo Tradicional con libro diario, mayor, balance y estado de resultados completos.",
      },
    ],
    related: ["contabilidad-personal-sin-excel", "finanzas-vs-contabilidad"],
  },
  {
    slug: "finanzas-vs-contabilidad",
    title: "Finanzas personales vs contabilidad: ¿cuál necesitás vos?",
    description:
      "Finanzas personales y contabilidad no son lo mismo. Te explicamos las diferencias, cuándo usar cada una y cómo combinarlas sin volverte loco.",
    keywords:
      "finanzas vs contabilidad, finanzas personales, contabilidad, diferencia, qué es",
    publishedAt: "2026-05-29",
    readingMinutes: 5,
    intro:
      "Mucha gente usa los términos 'finanzas personales' y 'contabilidad' como sinónimos. No lo son. Entender la diferencia te ayuda a elegir la herramienta adecuada y a no complicarte la vida con métodos que no necesitás.",
    sections: [
      {
        heading: "Finanzas personales: la mirada del día a día",
        body: "Las finanzas personales responden a preguntas operativas:\n\n- ¿Cuánto entró y cuánto salió este mes?\n- ¿Me alcanza hasta el próximo cobro?\n- ¿Puedo ahorrar para las vacaciones?\n\nNo necesitan reglas formales: alcanza con un registro claro y categorías simples.",
      },
      {
        heading: "Contabilidad: el sistema completo",
        body: "La contabilidad va más allá: clasifica cada movimiento dentro de un plan de cuentas, aplica partida doble y produce informes formales (balance, estado de resultados). Sirve para tomar decisiones a mediano plazo, mostrar tu situación a un banco o llevar un emprendimiento serio.",
      },
      {
        heading: "Cuándo te alcanza con finanzas personales",
        body: "- Sos asalariado y querés controlar gastos.\n- Manejás una sola cuenta o dos.\n- No tenés préstamos complejos ni un negocio.\n- Querés cumplir un presupuesto mensual.\n\nSi te identificás con esto, el modo Simple de Cap Finanzas es suficiente y mucho más rápido.",
      },
      {
        heading: "Cuándo necesitás contabilidad",
        body: "- Tenés un emprendimiento, freelance o renta extra.\n- Manejás cuentas bancarias, tarjetas, préstamos y caja al mismo tiempo.\n- Querés ver patrimonio, no solo flujo.\n- Estudiás contabilidad o tenés que rendir cuentas a terceros.\n\nEl modo Tradicional de Cap Finanzas incluye libro diario, mayor, balance y estado de resultados con partida doble completa.",
      },
      {
        heading: "Lo mejor de los dos mundos",
        body: "Cap Finanzas te deja cambiar entre Simple y Tradicional cuando quieras, sin perder datos. Empezás simple para crear el hábito y, cuando lo necesitás, activás contabilidad completa. Los mismos movimientos sirven para ambos.",
      },
    ],
    related: ["contabilidad-personal-sin-excel", "partida-doble-explicada-simple"],
  },
];

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}
