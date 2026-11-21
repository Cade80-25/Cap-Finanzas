#!/usr/bin/env python3
"""Reel de Cap-Finanzas (9:16, 30s) generado por codigo, SIN grabar pantalla.

Reimplementa el diseno de fframes (src/lib.rs) en Python+PIL+ffmpeg:
  - 5 escenas: problema / que es / como funciona / la prueba / CTA
  - textos con auto-ajuste: nunca sobresalen del recuadro
  - CTA aclara las 3 plataformas (Windows - macOS - Linux)

Uso:
    python generate_reel_fframes.py [salida.mp4]

Requiere: Pillow, ffmpeg en el PATH (o FFMPEG_BIN).
"""
import os
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFont

# ---------------- marca / lienzo ----------------
WIDTH, HEIGHT = 1080, 1920
FPS = 30
DURATION = 30.0

BG = (11, 15, 25)          # #0B0F19
CARD = (17, 24, 39)        # #111827
LINE = (31, 41, 55)        # #1F2937
ACCENT = (255, 121, 5)     # #FF7905
WHITE = (255, 255, 255)
MUTED = (156, 163, 175)    # #9CA3AF

HERE = os.path.dirname(os.path.abspath(__file__))
FONT_PATH = os.path.join(HERE, "DMSans-Medium.ttf")
if not os.path.exists(FONT_PATH):
    FONT_PATH = r"C:\Users\USUARIO\Projects\fframes-videos\cap-finanzas\media\DMSans-Medium.ttf"
if not os.path.exists(FONT_PATH):
    FONT_PATH = r"C:\Windows\Fonts\arial.ttf"

_font_cache: dict[int, ImageFont.FreeTypeFont] = {}
_MEASURE = ImageDraw.Draw(Image.new("RGB", (10, 10)))


def _alpha(draw, value: float) -> None:
    # PIL soporta global_alpha en runtime; setattr evita el warning del LSP.
    setattr(draw, "global_alpha", max(0, min(255, int(value))))


def font(size: int) -> ImageFont.FreeTypeFont:
    if size not in _font_cache:
        _font_cache[size] = ImageFont.truetype(FONT_PATH, size)
    return _font_cache[size]


# ---------------- helpers de dibujo ----------------
def ease_out(t: float) -> float:
    return 1.0 - (1.0 - t) ** 3


def ease_in_out(t: float) -> float:
    return 0.5 - 0.5 * (3.14159265 * t) if False else (t * t * (3 - 2 * t))


def anim(t: float, start: float, end: float, ease=ease_out) -> float:
    """Progreso 0..1 de la ventana [start, end] en segundos."""
    if t <= start:
        return 0.0
    if t >= end:
        return 1.0
    return ease((t - start) / (end - start))


def fit_font(draw: ImageDraw.ImageDraw, text: str, max_w: int, size: int,
             min_size: int = 20, bold: bool = False) -> ImageFont.FreeTypeFont:
    """Devuelve la fuente mas grande que hace entrar 'text' en max_w."""
    s = size
    while s > min_size:
        f = font(s)
        w = draw.textlength(text, font=f)
        if w <= max_w:
            return f
        s -= 1
    return font(min_size)


def text(draw, xy, s, size, fill, anchor="la", bold=False, max_w=None, min_size=20):
    f = fit_font(draw, s, max_w, size, min_size) if max_w else font(size)
    stroke = 2 if bold else 0
    draw.text(xy, s, font=f, fill=fill, anchor=anchor,
              stroke_width=stroke, stroke_fill=fill)


def rrect(draw, box, radius, fill=None, outline=None, width=3):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


# ---------------- escenas ----------------
def escena_1(d: ImageDraw.ImageDraw, t: float):
    v1 = anim(t, 0.0, 0.55) * (1.0 - anim(t, 5.45, 6.0, ease_in_out))
    if v1 <= 0.001:
        return
    s1_in = anim(t, 0.25, 1.0)
    s1_rise = anim(t, 0.25, 1.0)
    s1_card = anim(t, 1.1, 1.9)
    s1_settle = anim(t, 2.0, 3.4, ease_in_out)

    cx = WIDTH // 2
    layer = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer)

    # titular
    if s1_in > 0.001:
        off = int(s1_rise * 60)
        _alpha(ld, int(255 * s1_in))
        text(ld, (cx, 420 + off), "¿Cuadrar tus cuentas", 84, WHITE, anchor="mm", bold=True)
        text(ld, (cx, 530 + off), "te quita horas?", 84, ACCENT, anchor="mm", bold=True)
        _alpha(ld, 255)

    # tarjeta de filas
    if s1_card > 0.001:
        _alpha(ld, int(255 * s1_card))
        rrect(ld, (110, 700, WIDTH - 110, 1340), 26, fill=CARD, outline=LINE)
        for i, y in enumerate(range(772, 1207, 62)):
            grow = 120.0 * s1_settle if i % 2 == 0 else 0.0
            color = ACCENT if i % 2 == 0 else WHITE
            alpha = (0.25 + 0.6 * s1_settle) if i % 2 == 0 else 0.35
            ld.rounded_rectangle((166, y, 166 + int(300 + grow), y + 14), radius=7,
                                 fill=color + (int(255 * alpha),))
        text(ld, (cx, 1420), "Excel · cuadernos · papeles sueltos", 38, MUTED, anchor="mm",
             max_w=WIDTH - 260)
        _alpha(ld, 255)

    layer.putalpha(layer.getchannel("A").point(lambda a: int(a * v1)))
    return layer


def escena_2(d: ImageDraw.ImageDraw, t: float):
    v2 = anim(t, 5.45, 6.0, ease_in_out) * (1.0 - anim(t, 11.45, 12.0, ease_in_out))
    if v2 <= 0.001:
        return
    s2_in = anim(t, 6.15, 6.95)
    s2_rule = anim(t, 6.6, 7.4)
    s2_badges = anim(t, 7.6, 8.9)

    cx = WIDTH // 2
    layer = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer)
    _alpha(ld, int(255 * v2))

    if s2_in > 0.001:
        text(ld, (cx, 640), "Cap-Finanzas", 116, WHITE, anchor="mm", bold=True)
    regla_w = max(int(WIDTH * 0.57 * s2_rule), 1)
    ld.rounded_rectangle((cx - regla_w // 2, 716, cx + regla_w // 2, 731), radius=8, fill=ACCENT)
    text(ld, (cx, 820), "Contabilidad personal y empresarial", 50, MUTED, anchor="mm",
         max_w=WIDTH - 200)

    # badges de modos
    if s2_badges > 0.001:
        _alpha(ld, int(255 * v2 * s2_badges))
        for (txt, w, xc) in [("Modo Simple", 260, 330), ("Partida Doble", 300, 745)]:
            rrect(ld, (xc - w // 2, 900, xc + w // 2, 970), 35,
                  fill=ACCENT + (36,), outline=ACCENT + (140,), width=3)
            text(ld, (xc, 935), txt, 34, ACCENT, anchor="mm", bold=True, max_w=w - 40)
        # badges de plataformas (3 SO)
        for (txt, xc) in [("Windows", 220), ("macOS", 540), ("Linux", 860)]:
            rrect(ld, (xc - 150, 1020, xc + 150, 1100), 40,
                  fill=ACCENT + (36,), outline=ACCENT + (140,), width=3)
            text(ld, (xc, 1060), txt, 34, ACCENT, anchor="mm", bold=True, max_w=300 - 40)
        _alpha(ld, int(255 * v2))

    layer.putalpha(layer.getchannel("A").point(lambda a: int(a * v2)))
    return layer


def escena_3(d: ImageDraw.ImageDraw, t: float):
    v3 = anim(t, 11.45, 12.0, ease_in_out) * (1.0 - anim(t, 19.45, 20.0, ease_in_out))
    if v3 <= 0.001:
        return
    s3_in = anim(t, 12.1, 12.9)
    s3_steps = anim(t, 13.0, 15.6, ease_in_out)

    layer = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer)
    _alpha(ld, int(255 * v3))

    if s3_in > 0.001:
        _alpha(ld, int(255 * v3 * s3_in))
        text(ld, (WIDTH // 2, 330), "Cómo funciona", 72, WHITE, anchor="mm", bold=True)
        _alpha(ld, int(255 * v3))

    steps = [
        ("1", "Registra", "Anota cada movimiento en segundos", 520, False),
        ("2", "Clasifica", "Categorías con iconos, sin planillas", 900, True),
        ("3", "Analiza", "Balance y libro diario al instante", 1280, False),
    ]
    if s3_steps > 0.001:
        _alpha(ld, int(255 * v3 * s3_steps))
        for num, titulo, sub, y, hi in steps:
            rrect(ld, (110, y, WIDTH - 110, y + 300), 28,
                  fill=CARD, outline=(ACCENT if hi else LINE), width=3)
            ld.ellipse((158, y + 88, 282, y + 212), fill=ACCENT)
            text(ld, (220, y + 150), num, 62, BG, anchor="mm", bold=True)
            text(ld, (330, y + 130), titulo, 60, WHITE, anchor="lm", bold=True)
            text(ld, (330, y + 200), sub, 40, MUTED, anchor="lm", max_w=WIDTH - 110 - 330 - 60)
        _alpha(ld, int(255 * v3))

    layer.putalpha(layer.getchannel("A").point(lambda a: int(a * v3)))
    return layer


def escena_4(d: ImageDraw.ImageDraw, t: float):
    v4 = anim(t, 19.45, 20.0, ease_in_out) * (1.0 - anim(t, 25.45, 26.0, ease_in_out))
    if v4 <= 0.001:
        return
    s4_in = anim(t, 20.1, 20.8)
    s4_count = anim(t, 20.6, 22.4)
    s4_rows = anim(t, 21.5, 23.2)

    layer = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer)
    _alpha(ld, int(255 * v4))

    if s4_in > 0.001:
        text(ld, (WIDTH // 2, 420), "Datos reales del sistema", 44, MUTED, anchor="mm")

    balance = s4_count * 113272.08
    s = f"{balance:,.2f}"
    s = s.replace(",", "X").replace(".", ",").replace("X", ".")
    text(ld, (WIDTH // 2, 620), s, 126, ACCENT, anchor="mm", bold=True, max_w=WIDTH - 160)

    rows = [("191", "transacciones registradas"), ("22", "categorías con iconos"),
            ("2", "modos: simple y doble")]
    if s4_rows > 0.001:
        _alpha(ld, int(255 * v4 * s4_rows))
        for i, (num, label) in enumerate(rows):
            y = 900 + i * 230
            rrect(ld, (110, y, WIDTH - 110, y + 180), 24, fill=WHITE + (14,))
            text(ld, (170, y + 90), num, 82, WHITE, anchor="lm", bold=True)
            text(ld, (400, y + 92), label, 42, MUTED, anchor="lm", max_w=WIDTH - 110 - 400 - 50)
        _alpha(ld, int(255 * v4))

    layer.putalpha(layer.getchannel("A").point(lambda a: int(a * v4)))
    return layer


def escena_5(d: ImageDraw.ImageDraw, t: float):
    v5 = anim(t, 25.45, 26.0, ease_in_out)
    if v5 <= 0.001:
        return
    s5_in = anim(t, 26.0, 26.6)
    s5_rule = anim(t, 26.3, 26.9)
    s5_repo = anim(t, 27.3, 28.0)
    s5_cta = anim(t, 27.9, 28.6)

    cx = WIDTH // 2
    layer = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer)
    _alpha(ld, int(255 * v5))

    if s5_in > 0.001:
        _alpha(ld, int(255 * v5 * s5_in))
        text(ld, (cx, 720), "Cap-Finanzas", 120, WHITE, anchor="mm", bold=True)
        _alpha(ld, int(255 * v5))
    regla_w = max(int(WIDTH * 0.56 * s5_rule), 1)
    ld.rounded_rectangle((cx - regla_w // 2, 790, cx + regla_w // 2, 806), radius=8, fill=ACCENT)

    if s5_repo > 0.001:
        _alpha(ld, int(255 * v5 * s5_repo))
        rrect(ld, (150, 1080, WIDTH - 150, 1260), 30,
              fill=ACCENT + (36,), outline=ACCENT + (153,), width=3)
        text(ld, (cx, 1170), "github.com/Cade80-25/Cap-Finanzas", 48, ACCENT, anchor="mm",
             bold=True, max_w=WIDTH - 300 - 80)
        _alpha(ld, int(255 * v5))

    if s5_cta > 0.001:
        _alpha(ld, int(255 * v5 * s5_cta))
        text(ld, (cx, 1420), "Descargalo hoy · Windows, macOS y Linux", 44, WHITE, anchor="mm",
             max_w=WIDTH - 120)
        _alpha(ld, int(255 * v5))

    layer.putalpha(layer.getchannel("A").point(lambda a: int(a * v5)))
    return layer


SCENES = [escena_1, escena_2, escena_3, escena_4, escena_5]


def render_frame(t: float) -> Image.Image:
    img = Image.new("RGB", (WIDTH, HEIGHT), BG)
    base = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    for sc in SCENES:
        layer = sc(None, t)
        if layer is not None:
            base.alpha_composite(layer)
    img = Image.alpha_composite(img.convert("RGBA"), base).convert("RGB")
    d = ImageDraw.Draw(img)
    progress = max(int(WIDTH * min(max(t / DURATION, 0.0), 1.0)), 1)
    d.rectangle((0, HEIGHT - 10, progress, HEIGHT), fill=ACCENT)
    return img


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "reel_capfinanzas_v2.mp4")
    ffmpeg = os.environ.get("FFMPEG_BIN", "ffmpeg")
    total = int(FPS * DURATION)
    cmd = [ffmpeg, "-y", "-loglevel", "error",
           "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{WIDTH}x{HEIGHT}",
           "-r", str(FPS), "-i", "-",
           "-c:v", "libx264", "-preset", "medium", "-crf", "20",
           "-pix_fmt", "yuv420p", "-movflags", "+faststart", out]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for i in range(total):
        frame = render_frame(i / FPS)
        proc.stdin.write(frame.tobytes())
        if i % 150 == 0:
            print(f"  frame {i}/{total}", flush=True)
    proc.stdin.close()
    rc = proc.wait()
    print("ffmpeg rc:", rc, "| salida:", out, os.path.getsize(out) if os.path.exists(out) else 0, "bytes")


if __name__ == "__main__":
    main()
