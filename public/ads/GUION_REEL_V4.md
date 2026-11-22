# Guion del reel Cap-Finanzas v4 (30 s, 9:16) — voz + capturas reales

Objetivo: que **lo que se escucha coincida con lo que se ve** en cada instante, y que cada modo
muestre **dos capturas reales del programa abierto** mientras la voz lo describe.

## Voces y material
- **Voz:** Piper local (`es_MX-claude-high`), neuronal y $0. Si se prefiere otra, el texto es el mismo.
- **Capturas (programa abierto, sandbox demo, sin datos de Fernando):**
  `Desktop\CAP-FINANZAS\Promo y Marketing\capturas_estudio\`
  | Modo | Captura 1 | Captura 2 |
  |---|---|---|
  | Simple (personas) | `01_personal_dashboard.png` | `02_personal_transacciones.png` |
  | Negocios (empresas) | `04_empresarial_dashboard.png` | `05_empresarial_libro_diario.png` |
- **Búho:** `public/ads/buho.png` (recorte de `public/icon-final.png`).
- **Música:** `public/ads/v3/background_music.wav` (volumen 0.25).

## Estructura y sincronía (tiempo exacto)

| # | Tiempo (real) | Imagen en pantalla | Voz (texto exacto grabado) |
|---|---|---|---|
| 1 | 0.00–3.47 s | Fondo oscuro. Titular: **“¿Cuadrar tus cuentas te quita horas?”** y debajo “Excel · cuadernos · papeles sueltos”. | «¿Cuadrar tus cuentas te quita horas? Entre Excel, cuadernos y papeles.» |
| 2 | 3.59–8.74 s | **Búho** sobre “Cap-Finanzas”, subtítulo “Contabilidad personal y empresarial” y badges **Windows · macOS · Linux**. | «Cap Finanzas: contabilidad personal y empresarial, en Windows, macOS y Linux.» |
| 3 | 8.86–16.24 s | **Modo Simple**. Título + badge **“USD 20 · pago único”**. A los 1 s entra `limpia_01_personal_dashboard.png`; a los 4 s cambia a `limpia_02_personal_transacciones.png`. | «Modo Simple, para personas: ingresos y gastos en un paso, categorías automáticas y presupuestos claros. Veinte dólares, pago único.» |
| 4 | 16.36–23.41 s | **Modo Negocios**. Título + badge **“USD 100 · pago único”**. A los 1 s entra `limpia_04_empresarial_dashboard.png`; a los 4 s cambia a `limpia_05_empresarial_libro_diario.png`. | «Modo Negocios, para empresas: partida doble, libro diario y mayor, balance y resultados. Cien dólares, pago único.» |
| 5 | 23.53–29.37 s | “Un programa, dos modos” + cuatro filas: sin internet · tus datos en tu PC · sin suscripciones ni anuncios · un solo pago. | «Funciona sin internet y tus datos quedan en tu computadora. Sin suscripciones: un solo pago, de por vida.» |
| 6 | 29.49–31.66 s | **Búho** + “Cap-Finanzas”, “Descargalo hoy en **capfinanzas.com**”, badges y “Desde USD 20 · pago único”. | «Descargalo hoy en capfinanzas.com.» |

**Duración total: 31.66 s** (voz 31.07 s + 5 pausas de 0.12 s). Los tiempos salen de la
duración real de cada `audio/s0N.wav` (Piper `es_MX-claude-high`, `length_scale=0.72`).

## Reglas de producción
- **Sincronía:** la voz se graba primero con su duración real; las escenas 3 y 4 duran lo que dura
  su frase (si la voz es más corta, las capturas se quedan más rato; si es más larga, se alarga
  la escena y se recorta la 5). Nunca se corta una frase.
- **Capturas:** entran con fade (0.4 s) y con un paneo/zoom sutil (Ken Burns) para que no parezcan
  un cartel estático; van enmarcadas con borde redondeado y ocupan el ancho útil (1080 px).
- **Defasaje voz-imagen:** la frase de cada modo **empieza** cuando aparece el título del modo y
  nombra cada captura antes de que esta entre en pantalla (“cargás ingresos y gastos en un paso”
  → entra el dashboard de movimientos).
- **Audio final:** voz normalizada a −16 LUFS (loudnorm en 2 pasadas) + música a 0.25,
  `amix normalize=0`, `volume −2.2 dB` y `alimiter`. Objetivo: integrado ≈ −18 LUFS, pico < −1.5 dBTP.
- **Fuente del audio:** Piper local (sin key, sin costo). Si Fernando prefiere su voz ElevenLabs
  (“Bruno”), se regenera con la misma texto.
