// Built-in financial knowledge library
// Provides actionable, easy-to-understand financial advice

export interface FinancialTip {
  title: string;
  content: string;
  actionSteps: string[];
  keyTerms?: { term: string; definition: string }[];
}

export interface RecommendationDetail {
  summary: string;
  tips: FinancialTip[];
  resources: string[];
}

export const financialLibrary: Record<string, RecommendationDetail> = {
  ahorro: {
    summary:
      "El ahorro es la base de cualquier plan financiero sólido. No se trata de privarte de todo, sino de ser intencional con tu dinero.",
    tips: [
      {
        title: "La Regla 50/30/20",
        content:
          "Divide tus ingresos en tres categorías: 50% para necesidades (vivienda, alimentación, transporte), 30% para deseos (entretenimiento, restaurantes, compras) y 20% para ahorro e inversión. Si tus gastos en entretenimiento aumentaron, revisa si excediste ese 30%.",
        actionSteps: [
          "Calcula tu ingreso neto mensual",
          "Lista todos tus gastos fijos (necesidades)",
          "Revisa cuánto gastas en entretenimiento y compras no esenciales",
          "Establece un monto automático para ahorro cada mes",
        ],
        keyTerms: [
          { term: "Ingreso neto", definition: "Lo que recibes después de impuestos y deducciones" },
          { term: "Gasto fijo", definition: "Pagos recurrentes que no puedes evitar (renta, servicios)" },
          { term: "Gasto variable", definition: "Gastos que cambian mes a mes y puedes controlar" },
        ],
      },
      {
        title: "Fondo de Emergencia",
        content:
          "Antes de cualquier inversión, construye un fondo de emergencia equivalente a 3-6 meses de gastos. Este dinero debe estar en una cuenta accesible, no en inversiones de riesgo.",
        actionSteps: [
          "Calcula cuánto gastas en promedio por mes",
          "Multiplica por 3 para empezar (meta mínima)",
          "Abre una cuenta de ahorro separada solo para emergencias",
          "Deposita un monto fijo cada quincena o mes",
        ],
      },
      {
        title: "Técnica del Redondeo",
        content:
          "Cada vez que hagas una compra, redondea al próximo número entero y ahorra la diferencia. Si gastas $47.30, redondea a $48 y ahorra $0.70. Parece poco, pero al final del mes puede sumar $50-100 extra.",
        actionSteps: [
          "Configura una cuenta de ahorro para el redondeo",
          "Registra cada compra y calcula el redondeo",
          "Transfiere la diferencia acumulada semanalmente",
        ],
      },
    ],
    resources: [
      "Revisa tu sección de Presupuesto para ver tus categorías de gasto",
      "Consulta el Estado de Resultados para identificar tendencias mensuales",
      "Usa la Enciclopedia para aprender más sobre métodos de ahorro",
    ],
  },

  inversion: {
    summary:
      "Invertir es poner tu dinero a trabajar para ti. No necesitas ser experto para empezar — lo importante es entender los conceptos básicos y empezar con poco.",
    tips: [
      {
        title: "¿Por qué invertir?",
        content:
          "El dinero en una cuenta de ahorro pierde valor con el tiempo debido a la inflación (aproximadamente 3-5% anual). Si tu cuenta paga 1% de interés pero la inflación es del 4%, en realidad estás perdiendo 3% de poder adquisitivo cada año. Invertir te ayuda a superar la inflación.",
        actionSteps: [
          "Primero asegura tener tu fondo de emergencia (3-6 meses de gastos)",
          "Define cuánto puedes invertir sin afectar tus gastos esenciales",
          "Empieza con montos pequeños — incluso $50-100 mensuales",
          "No inviertas dinero que vayas a necesitar en los próximos 2 años",
        ],
        keyTerms: [
          { term: "Inflación", definition: "El aumento general de precios que reduce lo que puedes comprar con la misma cantidad de dinero" },
          { term: "Rendimiento", definition: "La ganancia que obtienes de una inversión, expresada como porcentaje" },
          { term: "Diversificación", definition: "No poner todos los huevos en la misma canasta — repartir tu dinero en diferentes tipos de inversión" },
        ],
      },
      {
        title: "Tipos de inversión para principiantes",
        content:
          "• **Fondos Indexados**: Replican un índice como el S&P 500. Son de bajo costo y han dado ~10% anual históricamente. Ideales para empezar.\n\n• **Certificados de Depósito (CD)**: Tu banco te paga interés fijo por dejar tu dinero un tiempo determinado. Bajo riesgo.\n\n• **Bonos**: Prestas dinero a un gobierno o empresa y te pagan interés. Menos riesgosos que acciones.\n\n• **Acciones individuales**: Compras una parte de una empresa. Mayor riesgo pero potencialmente mayor ganancia.",
        actionSteps: [
          "Investiga fondos indexados disponibles en tu país",
          "Compara las comisiones de diferentes plataformas de inversión",
          "Empieza con un fondo indexado diversificado",
          "Configura inversiones automáticas mensuales (dollar-cost averaging)",
        ],
        keyTerms: [
          { term: "Fondo indexado", definition: "Un fondo que compra automáticamente todas las acciones de un índice como el S&P 500" },
          { term: "Dollar-cost averaging", definition: "Invertir la misma cantidad regularmente sin importar si el precio sube o baja" },
          { term: "ETF", definition: "Exchange-Traded Fund — un fondo que se compra y vende como una acción" },
        ],
      },
      {
        title: "Errores comunes al invertir",
        content:
          "1. **Invertir sin fondo de emergencia**: Si surge un imprevisto, tendrás que vender tus inversiones (posiblemente con pérdida).\n\n2. **Seguir modas**: Las criptomonedas y acciones \"de moda\" son muy volátiles. No inviertas más del 5% en activos especulativos.\n\n3. **Vender en pánico**: Los mercados bajan periódicamente. Si tienes una estrategia a largo plazo, las caídas son oportunidades, no amenazas.\n\n4. **No diversificar**: Nunca pongas todo tu dinero en una sola inversión.",
        actionSteps: [
          "Define tu horizonte de inversión (¿cuándo necesitarás el dinero?)",
          "Establece un portafolio diversificado según tu tolerancia al riesgo",
          "Revisa tus inversiones trimestralmente, no diariamente",
          "Ignora las noticias alarmistas del mercado a corto plazo",
        ],
      },
    ],
    resources: [
      "Consulta la Enciclopedia para definiciones de términos financieros",
      "Usa el Balance General para evaluar tu patrimonio antes de invertir",
      "Revisa tu Presupuesto para determinar cuánto puedes destinar a inversiones",
    ],
  },

  educacion: {
    summary:
      "La educación financiera es la inversión más rentable que puedes hacer. Entender cómo funciona el dinero te da el poder de tomar mejores decisiones.",
    tips: [
      {
        title: "Conceptos esenciales que todos deberían saber",
        content:
          "• **Interés compuesto**: Albert Einstein lo llamó 'la octava maravilla del mundo'. Si inviertes $1,000 al 10% anual, en 10 años tendrás $2,594 — no $2,000. Tu dinero gana interés sobre el interés.\n\n• **Costo de oportunidad**: Cada vez que gastas en algo, pierdes la oportunidad de usar ese dinero en otra cosa. Un café de $5 diario son $1,825 al año.\n\n• **Activos vs. Pasivos**: Los activos ponen dinero en tu bolsillo (inversiones, negocios). Los pasivos lo sacan (deudas, préstamos de consumo).",
        actionSteps: [
          "Calcula cuánto ganas realmente por hora después de impuestos",
          "Antes de comprar algo, piensa: '¿Cuántas horas de trabajo cuesta esto?'",
          "Identifica tus activos y pasivos en el Balance General de la app",
          "Lee un artículo de la Enciclopedia cada semana",
        ],
        keyTerms: [
          { term: "Interés compuesto", definition: "Ganar interés sobre tu capital más los intereses acumulados anteriores" },
          { term: "Costo de oportunidad", definition: "Lo que dejas de ganar al elegir una opción sobre otra" },
          { term: "Activo", definition: "Algo que te genera ingresos o aumenta de valor con el tiempo" },
          { term: "Pasivo", definition: "Algo que te genera gastos o pierde valor con el tiempo" },
        ],
      },
      {
        title: "Cómo manejar deudas inteligentemente",
        content:
          "No todas las deudas son malas. Una hipoteca a buen interés es una deuda 'buena' porque tu casa tiende a aumentar de valor. Una deuda de tarjeta de crédito al 25% anual es una deuda 'mala'.\n\n**Método Avalancha**: Paga primero la deuda con la tasa de interés más alta. Ahorras más dinero.\n\n**Método Bola de Nieve**: Paga primero la deuda más pequeña. Te da motivación al ver resultados rápidos.",
        actionSteps: [
          "Lista todas tus deudas con montos y tasas de interés",
          "Elige el método Avalancha o Bola de Nieve",
          "Paga el mínimo en todas excepto la que estás atacando",
          "Nunca uses más del 30% de tu límite de crédito",
        ],
      },
      {
        title: "Planificación financiera por etapa de vida",
        content:
          "• **18-25 años**: Construye hábitos de ahorro. Fondo de emergencia. Evita deudas de consumo.\n\n• **25-35 años**: Invierte consistentemente. Planifica grandes metas (casa, familia). Aumenta tu ingreso.\n\n• **35-50 años**: Maximiza inversiones. Diversifica portafolio. Planifica retiro.\n\n• **50+ años**: Protege patrimonio. Reduce riesgo gradualmente. Planifica herencia.",
        actionSteps: [
          "Identifica en qué etapa estás",
          "Establece 3 metas financieras para los próximos 5 años",
          "Revisa y ajusta tu plan cada 6 meses",
          "Busca aumentar tus fuentes de ingreso",
        ],
      },
    ],
    resources: [
      "Explora la Enciclopedia para profundizar en cualquier término",
      "Usa el módulo de Categorías para clasificar mejor tus gastos",
      "Consulta el Calendario para planificar pagos y metas",
    ],
  },
};
