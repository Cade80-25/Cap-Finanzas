#!/usr/bin/env python3
"""Reel de Cap-Finanzas (9:16, 30s) generado por codigo, SIN grabar pantalla.

Estructura (30 s):
  1. 0.0-5.5   Problema
  2. 5.5-11.5  Presentacion (búho + nombre + 3 plataformas)
  3. 11.5-16.5 Modo Simple (personas) + precio USD 20
  4. 16.5-21.5 Modo Negocios (empresas) + precio USD 100
  5. 21.5-25.5 Diferencial transversal
  6. 25.5-30.0 CTA -> capfinanzas.com (sin GitHub)

Uso:
    python generate_reel_v3.py [salida.mp4]

Requiere: Pillow, ffmpeg en el PATH (o FFMPEG_BIN) y numpy (para recortar el búho).
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
GREEN = (34, 197, 94)

HERE = os.path.dirname(os.path.abspath(__file__))
FONT_PATH = os.path.join(HERE, "DMSans-Medium.ttf")
if not os.path.exists(FONT_PATH):
    FONT_PATH = os.path.join(HERE, "..", "..", "fframes-videos", "cap-finanzas", "media",
                             "DMSans-Medium.ttf")
if not os.path.exists(FONT_PATH):
    FONT_PATH = r"C:\Windows\Fonts\arial.ttf"

_font_cache: dict = {}
_MEASURE = ImageDraw.Draw(Image.new("RGB", (10, 10)))
_BUHO = None


def _alpha(draw, value):
    setattr(draw, "global_alpha", max(0, min(255, int(value))))


def font(size):
    if size not in _font_cache:
        _font_cache[size] = ImageFont.truetype(FONT_PATH, size)
    return _font_cache[size]


def build_buho() -> str:
    """Recorta icon-final.png a transparente (clavea el fondo oscuro)."""
    global _BUHO
    if _BUHO and os.path.exists(_BUHO):
        return _BUHO
    dst = os.path.join(HERE, "buho.png")
    src = os.path.join(HERE, "..", "icon-final.png")
    if not os.path.exists(dst):
        import numpy as np
        im = Image.open(src).convert("RGB")
        arr = np.asarray(im).astype(np.int16)
        d = np.abs(arr - np.array([17, 28, 44])).max(axis=2)
        a = np.clip((d - 25) * 255 // 25, 0, 255).astype(np.uint8)
        out = Image.fromarray(np.dstack([np.asarray(im), a]), "RGBA")
        bbox = out.getchannel("A").point(lambda v: 255 if v >= 128 else 0).getbbox()
        out.crop(bbox).save(dst)
    _BUHO = dst
    return dst


def buho_image(h):
    im = Image.open(build_buho()).convert("RGBA")
    w = int(im.size[0] * h / im.size[1])
    return im.resize((w, h), Image.LANCZOS)


# ---------------- helpers ----------------
def ease_out(t):
    return 1.0 - (1.0 - t) ** 3


def ease_in_out(t):
    return t * t * (3 - 2 * t)


def anim(t, start, end, ease=ease_out):
    if t <= start:
        return 0.0
    if t >= end:
        return 1.0
    return ease((t - start) / (end - start))


def fit_font(draw, text, max_w, size, min_size=20):
    s = size
    while s > min_size:
        if draw.textlength(text, font=font(s)) <= max_w:
            return font(s)
        s -= 1
    return font(min_size)


def text(draw, xy, s, size, fill, anchor="la", bold=False, max_w=None, min_size=20):
    f = fit_font(draw, s, max_w, size, min_size) if max_w else font(size)
    stroke = 2 if bold else 0
    draw.text(xy, s, font=f, fill=fill, anchor=anchor, stroke_width=stroke, stroke_fill=fill)


def rrect(draw, box, radius, fill=None, outline=None, width=3):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def base_layer():
    return Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))


def paste_buho(layer, cx, y, h):
    im = buho_image(h)
    layer.alpha_composite(im, (int(cx - im.size[0] / 2), int(y)))
    return y + h


def badge_so(ld, txt, xc, y, w=300, h=80, size=34):
    rrect(ld, (xc - w // 2, y, xc + w // 2, y + h), 40,
          fill=ACCENT + (36,), outline=ACCENT + (140,), width=3)
    text(ld, (xc, y + h // 2), txt, size, ACCENT, anchor="mm", bold=True, max_w=w - 40)


def put_alpha(layer, v):
    if v <= 0.001:
        return None
    layer.putalpha(layer.getchannel("A").point(lambda a: int(a * v)))
    return layer


# ---------------- escenas ----------------
def escena_1(d, t):
    v = anim(t, 0.0, 0.55) * (1.0 - anim(t, 5.0, 5.5, ease_in_out))
    if v <= 0.001:
        return None
    s_in = anim(t, 0.25, 1.0)
    s_card = anim(t, 1.1, 1.9)
    s_settle = anim(t, 2.0, 3.4, ease_in_out)
    cx = WIDTH // 2
    layer = base_layer()
    ld = ImageDraw.Draw(layer)
    if s_in > 0.001:
        _alpha(ld, 255 * s_in)
        off = int(s_in * 60)
        text(ld, (cx, 420 + off), "¿Cuadrar tus cuentas", 84, WHITE, anchor="mm", bold=True)
        text(ld, (cx, 530 + off), "te quita horas?", 84, ACCENT, anchor="mm", bold=True)
    if s_card > 0.001:
        _alpha(ld, 255 * s_card)
        rrect(ld, (110, 700, WIDTH - 110, 1340), 26, fill=CARD, outline=LINE)
        for i, y in enumerate(range(772, 1207, 62)):
            grow = 120.0 * s_settle if i % 2 == 0 else 0.0
            color = ACCENT if i % 2 == 0 else WHITE
            a = (0.25 + 0.6 * s_settle) if i % 2 == 0 else 0.35
            ld.rounded_rectangle((166, y, 166 + int(300 + grow), y + 14), radius=7,
                                 fill=color + (int(255 * a),))
        text(ld, (cx, 1420), "Excel · cuadernos · papeles sueltos", 38, MUTED, anchor="mm",
             max_w=WIDTH - 260)
    return put_alpha(layer, v)


def escena_2(d, t):
    v = anim(t, 5.0, 5.5, ease_in_out) * (1.0 - anim(t, 11.0, 11.5, ease_in_out))
    if v <= 0.001:
        return None
    s_in = anim(t, 5.7, 6.5)
    s_rule = anim(t, 6.2, 6.7)
    s_badges = anim(t, 7.2, 8.4)
    cx = WIDTH // 2
    layer = base_layer()
    ld = ImageDraw.Draw(layer)
    if s_in > 0.001:
        _alpha(ld, 255 * s_in)
        paste_buho(layer, cx, 230, 250)
        text(ld, (cx, 620), "Cap-Finanzas", 116, WHITE, anchor="mm", bold=True)
    _alpha(ld, 255 * v)
    regla_w = max(int(WIDTH * 0.57 * s_rule), 1)
    ld.rounded_rectangle((cx - regla_w // 2, 700, cx + regla_w // 2, 715), radius=8, fill=ACCENT)
    text(ld, (cx, 790), "Contabilidad personal y empresarial", 48, MUTED, anchor="mm",
         max_w=WIDTH - 180)
    if s_badges > 0.001:
        _alpha(ld, 255 * v * s_badges)
        for txt, xc in (("Windows", 220), ("macOS", 540), ("Linux", 860)):
            badge_so(ld, txt, xc, 920)
    return put_alpha(layer, v)


SIMPLE_ITEMS = ["Ingresos y gastos en 1 paso", "Categorías automáticas con iconos",
                "Presupuestos y gráficos", "Calendario y recordatorios", "Multimoneda"]
NEGOCIOS_ITEMS = ["Partida doble: Debe y Haber", "Libro Diario y Libro Mayor",
                  "Balance y Estado de Resultados", "Facturación, RRHH e inventario",
                  "30 módulos operativos"]


def escena_modo(d, t, t0, titulo, precio, items, color_titulo=WHITE):
    fin = t0 + 5.0
    v = anim(t, t0 - 0.5, t0, ease_in_out) * (1.0 - anim(t, fin - 0.5, fin, ease_in_out))
    if v <= 0.001:
        return None
    s_in = anim(t, t0 + 0.15, t0 + 0.85)
    s_precio = anim(t, t0 + 0.5, t0 + 1.1)
    s_items = anim(t, t0 + 0.9, t0 + 1.8, ease_in_out)
    cx = WIDTH // 2
    layer = base_layer()
    ld = ImageDraw.Draw(layer)
    if s_in > 0.001:
        _alpha(ld, 255 * v * s_in)
        text(ld, (cx, 250), titulo, 76, color_titulo, anchor="mm", bold=True)
    if s_precio > 0.001:
        _alpha(ld, 255 * v * s_precio)
        w = 560
        rrect(ld, (cx - w // 2, 380, cx + w // 2, 480), 50,
              fill=ACCENT + (46,), outline=ACCENT + (160,), width=3)
        text(ld, (cx, 430), precio, 44, ACCENT, anchor="mm", bold=True, max_w=w - 60)
    if s_items > 0.001:
        _alpha(ld, 255 * v * s_items)
        rrect(ld, (110, 580, WIDTH - 110, 1560), 28, fill=CARD, outline=LINE)
        n = len(items)
        step = (1560 - 580 - 80) / n
        for i, it in enumerate(items):
            y = 620 + int(i * step)
            ld.ellipse((160, y, 214, y + 54), fill=ACCENT + (40,))
            text(ld, (187, y + 27), "✓", 32, ACCENT, anchor="mm", bold=True)
            text(ld, (260, y + 27), it, 38, WHITE, anchor="lm", max_w=WIDTH - 110 - 260 - 60)
    return put_alpha(layer, v)


def escena_3(d, t):
    return escena_modo(d, t, 11.5, "Modo Simple", "USD 20 · pago único", SIMPLE_ITEMS)


def escena_4(d, t):
    return escena_modo(d, t, 16.5, "Modo Negocios", "USD 100 · pago único", NEGOCIOS_ITEMS,
                       color_titulo=ACCENT)


def escena_5(d, t):
    v = anim(t, 21.0, 21.5, ease_in_out) * (1.0 - anim(t, 25.0, 25.5, ease_in_out))
    if v <= 0.001:
        return None
    s_in = anim(t, 21.2, 21.9)
    s_rows = anim(t, 22.0, 23.2)
    cx = WIDTH // 2
    layer = base_layer()
    ld = ImageDraw.Draw(layer)
    if s_in > 0.001:
        _alpha(ld, 255 * v * s_in)
        text(ld, (cx, 300), "Un programa, dos modos", 72, WHITE, anchor="mm", bold=True)
        text(ld, (cx, 390), "lo mismo te sirve a vos y a tu empresa", 40, MUTED, anchor="mm",
             max_w=WIDTH - 200)
    if s_rows > 0.001:
        _alpha(ld, 255 * v * s_rows)
        rows = ["Funciona 100% sin internet", "Tus datos quedan en tu computadora",
                "Sin suscripciones ni anuncios", "Un solo pago, de por vida"]
        rrect(ld, (110, 560, WIDTH - 110, 1420), 28, fill=CARD, outline=LINE)
        for i, r in enumerate(rows):
            y = 640 + i * 200
            ld.ellipse((160, y, 214, y + 54), fill=GREEN + (40,))
            text(ld, (187, y + 27), "✓", 32, GREEN, anchor="mm", bold=True)
            text(ld, (260, y + 27), r, 40, WHITE, anchor="lm", max_w=WIDTH - 110 - 260 - 60)
    return put_alpha(layer, v)


def escena_6(d, t):
    v = anim(t, 25.0, 25.5, ease_in_out)
    if v <= 0.001:
        return None
    s_in = anim(t, 25.5, 26.2)
    s_rule = anim(t, 26.0, 26.6)
    s_cta = anim(t, 26.8, 27.6)
    cx = WIDTH // 2
    layer = base_layer()
    ld = ImageDraw.Draw(layer)
    if s_in > 0.001:
        _alpha(ld, 255 * v * s_in)
        paste_buho(layer, cx, 380, 230)
        text(ld, (cx, 700), "Cap-Finanzas", 118, WHITE, anchor="mm", bold=True)
    _alpha(ld, 255 * v)
    regla_w = max(int(WIDTH * 0.56 * s_rule), 1)
    ld.rounded_rectangle((cx - regla_w // 2, 770, cx + regla_w // 2, 786), radius=8, fill=ACCENT)
    if s_cta > 0.001:
        _alpha(ld, 255 * v * s_cta)
        text(ld, (cx, 920), "Descargalo hoy en", 44, MUTED, anchor="mm")
        text(ld, (cx, 1010), "capfinanzas.com", 66, ACCENT, anchor="mm", bold=True,
             max_w=WIDTH - 120)
        for txt, xc in (("Windows", 220), ("macOS", 540), ("Linux", 860)):
            badge_so(ld, txt, xc, 1200, h=76)
        text(ld, (cx, 1380), "Desde USD 20 · pago único", 40, WHITE, anchor="mm",
             max_w=WIDTH - 160)
    return put_alpha(layer, v)


SCENES = [escena_1, escena_2, escena_3, escena_4, escena_5, escena_6]


def render_frame(t):
    img = Image.new("RGB", (WIDTH, HEIGHT), BG)
    base = base_layer()
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
    out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "reel_capfinanzas_v3.mp4")
    ffmpeg = os.environ.get("FFMPEG_BIN", "ffmpeg")
    total = int(FPS * DURATION)
    cmd = [ffmpeg, "-y", "-loglevel", "error",
           "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{WIDTH}x{HEIGHT}",
           "-r", str(FPS), "-i", "-",
           "-c:v", "libx264", "-preset", "medium", "-crf", "20",
           "-pix_fmt", "yuv420p", "-movflags", "+faststart", out]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for i in range(total):
        proc.stdin.write(render_frame(i / FPS).tobytes())
        if i % 150 == 0:
            print(f"  frame {i}/{total}", flush=True)
    proc.stdin.close()
    rc = proc.wait()
    print("ffmpeg rc:", rc, "|", out, os.path.getsize(out) if os.path.exists(out) else 0,
          "bytes")


if __name__ == "__main__":
    main()
