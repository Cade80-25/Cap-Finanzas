# Guion — Reel CORTO (~29 s)

Aviso vertical de una pasada para el feed. Misma voz (Dalia, `+30%`), mismos
subtítulos quemados y las mismas capturas reales que el reel largo.

| # | Escena | Voz | Visual |
|---|---|---|---|
| 1 | Gancho | «¿Cuadrar tus cuentas te quita horas?» | logo búho + fondo de marca |
| 2 | Presentación | «Cap-Finanzas ordena tu dinero en un solo programa. Sin internet y sin suscripciones.» | badges Windows / macOS / Linux |
| 3 | Modo Simple | «Modo Simple: USD 20, pago único. Ingresos, gastos y presupuestos en un paso.» | captura real del modo personal + tarjeta «USD 20 · PAGO ÚNICO» |
| 4 | Modo Negocios | «Modo Negocios: USD 100, pago único. Partida doble, inventarios, personal y cuentas bancarias.» | captura real del modo empresarial + tarjeta «USD 100 · PAGO ÚNICO» + módulos |
| 5 | CTA | «Descargalo hoy en capfinanzas.com. Tu dinero, en orden.» | logo + «capfinanzas.com» |

**Duración:** 2.38 + 5.14 + 6.00 + 6.89 + 4.34 = 24.74 s de voz + 4 pausas de
1.1 s = **29.14 s**. Audio −13.5 LUFS, pico −0.46 dB, video = audio = 29.13 s.

## Archivos

- `generate_reel_corto.py` — render (5 escenas, subtítulos quemados).
- `generar_voz_corto.py` — voces `audio/vc_s01..vc_s05.wav`.
- `mezclar_corto.py` — voz normalizada + música extendida.
- `reel_capfinanzas_corto.mp4` — resultado.
- `reel_capfinanzas_v5_sinvoz.mp4` — variante del largo sin narración (solo
  música + texto; se genera con `mezclar_v5_sinvoz.py`).

## Nota de uso

Para regenerar: `python generate_reel_corto.py` y después `python mezclar_corto.py`
(con `FFMPEG_BIN` apuntando al ffmpeg de Hermes). Para la variante sin voz:
`python mezclar_v5_sinvoz.py`.
