#!/usr/bin/env python3
"""Reel Cap-Finanzas v5 (9:16) — guion explicativo sincronizado con la voz.

La sincronía es exacta: los tiempos de cada escena se derivan de la duración REAL
de cada frase de voz (audio/v5_s01.wav .. v5_s07.wav), no de tiempos supuestos.

Escenas (texto exacto en GUION_REEL_V5.md):
  1 Gancho
  2 Presentación (búho + 3 plataformas)
  3 Modo Simple    + 2 capturas + USD 20
  4 Modo Negocios + 2 capturas + USD 100
  5 ¿Cuál elegir? (comparativa de precios y lo que incluye cada plan)
  6 Beneficios    (pago único / sin internet / tus datos)
  7 CTA           (capfinanzas.com)

Uso:
    python generate_reel_v5.py [salida.mp4]
Requiere: Pillow, numpy, ffmpeg.
"""
import os
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFont

WIDTH, HEIGHT = 1080, 1920
FPS = 30
GAP = 0.12            # respiro entre escenas (s)
N_SCENES = 7

BG = (11, 15, 25)
CARD = (17, 24, 39)
LINE = (31, 41, 55)
ACCENT = (255, 121, 5)
WHITE = (255, 255, 255)
MUTED = (156, 163, 175)
GREEN = (34, 197, 94)

HERE = os.path.dirname(os.path.abspath(__file__))
FONT_PATH = os.path.join(HERE, "DMSans-Medium.ttf")
if not os.path.exists(FONT_PATH):
    FONT_PATH = os.path.join(HERE, "..", "..", "fframes-videos", "cap-finanzas", "media",
                             "DMSans-Medium.ttf")
if not os.path.exists(FONT_PATH):
    FONT_PATH = r"C:\Windows\Fonts\arial.ttf"

AUDIO_DIR = os.environ.get("REEL_AUDIO_DIR", os.path.join(HERE, "audio"))

_font_cache: dict = {}
_BUHO = None
CAPS: dict = {}


def font(size):
    if size not in _font_cache:
        _font_cache[size] = ImageFont.truetype(FONT_PATH, size)
    return _font_cache[size]


def build_buho() -> str:
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
    sw = 2 if bold else 0
    draw.text(xy, s, font=f, fill=fill, anchor=anchor, stroke_width=sw, stroke_fill=fill)


def rrect(draw, box, radius, fill=None, outline=None, width=3):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def base_layer():
    return Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))


def paste_buho(layer, cx, y, h):
    im = buho_image(h)
    layer.alpha_composite(im, (int(cx - im.size[0] / 2), int(y)))
    return y + h


def badge(ld, txt, xc, y, w=300, h=80, size=34, color=ACCENT):
    rrect(ld, (xc - w // 2, y, xc + w // 2, y + h), 40,
          fill=color + (36,), outline=color + (140,), width=3)
    text(ld, (xc, y + h // 2), txt, size, color, anchor="mm", bold=True, max_w=w - 40)


def put_alpha(layer, v):
    if v <= 0.001:
        return None
    layer.putalpha(layer.getchannel("A").point(lambda a: int(a * v)))
    return layer


def kenburns(img, p, out_w, out_h):
    """Recorte con zoom sutil (1.0 -> 1.07) para que la captura no sea un cartel."""
    z = 1.0 + 0.07 * p
    w, h = img.size
    cw, ch = int(w / z), int(h / z)
    x = int((w - cw) * (0.5 + 0.5 * p))
    y = int((h - ch) * 0.35)
    return img.crop((x, y, x + cw, y + ch)).resize((out_w, out_h), Image.LANCZOS)


def marco_redondeado(img, radius=26):
    m = Image.new("L", img.size, 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, img.size[0] - 1, img.size[1] - 1),
                                        radius=radius, fill=255)
    out = img.convert("RGBA")
    out.putalpha(m)
    return out


CAPTURAS = {
    "simple": ["capturas/limpia_01_personal_dashboard.png",
               "capturas/limpia_02_personal_transacciones.png"],
    "negocios": ["capturas/limpia_04_empresarial_dashboard.png",
                 "capturas/limpia_05_empresarial_libro_diario.png"],
}


def load_caps():
    out = {}
    for k, paths in CAPTURAS.items():
        out[k] = []
        for p in paths:
            fp = os.path.join(HERE, p)
            out[k].append(Image.open(fp).convert("RGB") if os.path.exists(fp) else None)
    return out


# ---------------- escenas ----------------
def escena_1(d, t, t0, t1):
    v = anim(t, t0, t0 + 0.4) * (1.0 - anim(t, t1 - 0.4, t1, ease_in_out))
    if v <= 0.001:
        return None
    s_in = anim(t, t0 + 0.05, t0 + 0.6)
    s_card = anim(t, t0 + 0.9, t0 + 1.7)
    s_settle = anim(t, t0 + 1.8, t0 + 3.0, ease_in_out)
    cx = WIDTH // 2
    layer = base_layer()
    ld = ImageDraw.Draw(layer)
    if s_in > 0.001:
        ld.global_alpha = int(255 * s_in)
        off = int(s_in * 60)
        text(ld, (cx, 420 + off), "¿Cuadrar tus cuentas", 84, WHITE, anchor="mm", bold=True)
        text(ld, (cx, 530 + off), "te quita horas?", 84, ACCENT, anchor="mm", bold=True)
    if s_card > 0.001:
        ld.global_alpha = int(255 * s_card)
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


def escena_2(d, t, t0, t1):
    v = anim(t, t0, t0 + 0.4) * (1.0 - anim(t, t1 - 0.4, t1, ease_in_out))
    if v <= 0.001:
        return None
    s_in = anim(t, t0 + 0.05, t0 + 0.6)
    s_rule = anim(t, t0 + 0.5, t0 + 1.0)
    s_badges = anim(t, t0 + 1.0, t0 + 2.0)
    cx = WIDTH // 2
    layer = base_layer()
    ld = ImageDraw.Draw(layer)
    if s_in > 0.001:
        ld.global_alpha = int(255 * s_in)
        paste_buho(layer, cx, 230, 250)
        text(ld, (cx, 620), "Cap-Finanzas", 116, WHITE, anchor="mm", bold=True)
    ld.global_alpha = int(255 * v)
    regla_w = max(int(WIDTH * 0.57 * s_rule), 1)
    ld.rounded_rectangle((cx - regla_w // 2, 700, cx + regla_w // 2, 715), radius=8, fill=ACCENT)
    text(ld, (cx, 790), "Sin internet · Sin suscripciones · Pago único", 44, MUTED,
         anchor="mm", max_w=WIDTH - 180)
    if s_badges > 0.001:
        ld.global_alpha = int(255 * v * s_badges)
        for txt, xc in (("Windows", 220), ("macOS", 540), ("Linux", 860)):
            badge(ld, txt, xc, 920)
    return put_alpha(layer, v)


SIMPLE_BULLETS = ["Ingresos y gastos en 1 paso", "Categorías automáticas",
                  "Presupuestos y gráficos"]
NEGOCIOS_BULLETS = ["Partida doble: Debe y Haber", "Libro Diario y Libro Mayor",
                    "Balance y Estado de Resultados"]


def escena_modo(d, t, t0, t1, titulo, precio, bullets, modo, color_titulo=WHITE):
    v = anim(t, t0, t0 + 0.35) * (1.0 - anim(t, t1 - 0.35, t1, ease_in_out))
    if v <= 0.001:
        return None
    s_in = anim(t, t0 + 0.05, t0 + 0.6)
    s_precio = anim(t, t0 + 0.3, t0 + 0.9)
    s_cap1 = anim(t, t0 + 0.9, t0 + 1.45)
    s_cap2 = anim(t, t0 + 1.45, t0 + 1.9)
    dur = t1 - t0
    mitad = t0 + 0.9 + (dur - 0.9) * 0.5
    cx = WIDTH // 2
    layer = base_layer()
    ld = ImageDraw.Draw(layer)
    if s_in > 0.001:
        ld.global_alpha = int(255 * v * s_in)
        text(ld, (cx, 190), titulo, 74, color_titulo, anchor="mm", bold=True)
    if s_precio > 0.001:
        ld.global_alpha = int(255 * v * s_precio)
        w = 560
        rrect(ld, (cx - w // 2, 290, cx + w // 2, 390), 50,
              fill=ACCENT + (46,), outline=ACCENT + (160,), width=3)
        text(ld, (cx, 340), precio, 44, ACCENT, anchor="mm", bold=True, max_w=w - 60)
    caps = CAPS[modo]
    cw, ch = 900, 430
    y0 = 440
    for i, fin_i in enumerate((mitad, t1 - 0.15)):
        ini = t0 + 0.9 if i == 0 else mitad
        if t <= ini:
            continue
        p = min((t - ini) / max(fin_i - ini, 0.1), 1.0)
        alpha = min(anim(t, ini, ini + 0.35), 1.0) * (1.0 - anim(t, fin_i, fin_i + 0.35))
        img = caps[i]
        if img is None:
            continue
        frame = marco_redondeado(kenburns(img, p, cw, ch))
        lay = base_layer()
        lay.alpha_composite(frame, (int(cx - cw / 2), y0))
        lay.putalpha(lay.getchannel("A").point(lambda a: int(a * alpha * v)))
        layer.alpha_composite(lay)
    ld2 = ImageDraw.Draw(layer)
    if s_cap1 > 0.001:
        ld2.global_alpha = int(255 * v)
        for i, b in enumerate(bullets):
            y = 960 + i * 74
            ld2.ellipse((150, y - 22, 204, y + 32), fill=ACCENT + (40,))
            text(ld2, (177, y + 5), "✓", 30, ACCENT, anchor="mm", bold=True)
            text(ld2, (240, y + 5), b, 36, WHITE, anchor="lm", max_w=WIDTH - 110 - 240 - 60)
    return put_alpha(layer, v)


def escena_3(d, t, t0, t1):
    return escena_modo(d, t, t0, t1, "Modo Simple", "USD 20 · pago único",
                       SIMPLE_BULLETS, "simple")


def escena_4(d, t, t0, t1):
    return escena_modo(d, t, t0, t1, "Modo Negocios", "USD 100 · pago único",
                       NEGOCIOS_BULLETS, "negocios", color_titulo=ACCENT)


def escena_comparativa(d, t, t0, t1):
    """Escena 5: ¿Cuál elegir? Dos tarjetas con lo que incluye cada plan."""
    v = anim(t, t0, t0 + 0.4) * (1.0 - anim(t, t1 - 0.4, t1, ease_in_out))
    if v <= 0.001:
        return None
    s_in = anim(t, t0 + 0.05, t0 + 0.6)
    s_cards = anim(t, t0 + 0.5, t0 + 1.3)
    s_cierre = anim(t, t0 + 2.6, t0 + 3.4)
    cx = WIDTH // 2
    layer = base_layer()
    ld = ImageDraw.Draw(layer)
    if s_in > 0.001:
        ld.global_alpha = int(255 * v * s_in)
        text(ld, (cx, 200), "¿Cuál elegir?", 78, WHITE, anchor="mm", bold=True)
    cols = [
        (70, 500, "SIMPLE", "USD 20", "pago único", SIMPLE_BULLETS, ACCENT),
        (580, 1010, "NEGOCIOS", "USD 100", "pago único", NEGOCIOS_BULLETS, WHITE),
    ]
    if s_cards > 0.001:
        ld.global_alpha = int(255 * v * s_cards)
        for x0, x1, nombre, precio, nota, items, color in cols:
            rrect(ld, (x0, 340, x1, 1290), 30, fill=CARD, outline=color + (120,), width=3)
            xc = (x0 + x1) // 2
            text(ld, (xc, 430), nombre, 50, color, anchor="mm", bold=True)
            text(ld, (xc, 520), precio, 52, ACCENT, anchor="mm", bold=True)
            text(ld, (xc, 585), nota, 28, MUTED, anchor="mm")
            ld.rounded_rectangle((x0 + 40, 630, x1 - 40, 638), radius=4, fill=LINE)
            for i, it in enumerate(items):
                y = 715 + i * 150
                ld.ellipse((x0 + 60, y - 12, x0 + 104, y + 32), fill=ACCENT + (40,))
                text(ld, (x0 + 82, y + 10), "✓", 28, ACCENT, anchor="mm", bold=True)
                text(ld, (x0 + 128, y + 10), it, 30, WHITE, anchor="lm",
                     max_w=(x1 - x0) - 150)
    if s_cierre > 0.001:
        ld.global_alpha = int(255 * v * s_cierre)
        text(ld, (cx, 1400), "La diferencia es el doble registro contable:", 36, MUTED,
             anchor="mm", max_w=WIDTH - 180)
        text(ld, (cx, 1465), "el Negocios anota cada operación dos veces y te da el balance.",
             36, WHITE, anchor="mm", max_w=WIDTH - 180)
    return put_alpha(layer, v)


def escena_beneficios(d, t, t0, t1):
    v = anim(t, t0, t0 + 0.4) * (1.0 - anim(t, t1 - 0.4, t1, ease_in_out))
    if v <= 0.001:
        return None
    s_in = anim(t, t0 + 0.05, t0 + 0.6)
    s_rows = anim(t, t0 + 0.6, t0 + 1.6)
    cx = WIDTH // 2
    layer = base_layer()
    ld = ImageDraw.Draw(layer)
    if s_in > 0.001:
        ld.global_alpha = int(255 * v * s_in)
        text(ld, (cx, 300), "Un solo pago", 76, WHITE, anchor="mm", bold=True)
        text(ld, (cx, 395), "y es tuyo para siempre", 44, ACCENT, anchor="mm",
             max_w=WIDTH - 200)
    if s_rows > 0.001:
        ld.global_alpha = int(255 * v * s_rows)
        rows = ["Funciona 100% sin internet", "Tus datos quedan en tu computadora",
                "Sin suscripciones ni anuncios", "Un solo pago, de por vida"]
        rrect(ld, (110, 560, WIDTH - 110, 1420), 28, fill=CARD, outline=LINE)
        for i, r in enumerate(rows):
            y = 640 + i * 200
            ld.ellipse((160, y, 214, y + 54), fill=GREEN + (40,))
            text(ld, (187, y + 27), "✓", 32, GREEN, anchor="mm", bold=True)
            text(ld, (260, y + 27), r, 40, WHITE, anchor="lm", max_w=WIDTH - 110 - 260 - 60)
    return put_alpha(layer, v)


def escena_cta(d, t, t0, t1):
    v = anim(t, t0, t0 + 0.4)
    if v <= 0.001:
        return None
    s_in = anim(t, t0 + 0.05, t0 + 0.6)
    s_rule = anim(t, t0 + 0.5, t0 + 1.0)
    s_cta = anim(t, t0 + 0.9, t0 + 1.6)
    cx = WIDTH // 2
    layer = base_layer()
    ld = ImageDraw.Draw(layer)
    if s_in > 0.001:
        ld.global_alpha = int(255 * v * s_in)
        paste_buho(layer, cx, 380, 230)
        text(ld, (cx, 700), "Cap-Finanzas", 118, WHITE, anchor="mm", bold=True)
    ld.global_alpha = int(255 * v)
    regla_w = max(int(WIDTH * 0.56 * s_rule), 1)
    ld.rounded_rectangle((cx - regla_w // 2, 770, cx + regla_w // 2, 786), radius=8, fill=ACCENT)
    if s_cta > 0.001:
        ld.global_alpha = int(255 * v * s_cta)
        text(ld, (cx, 920), "Descargalo hoy en", 44, MUTED, anchor="mm")
        text(ld, (cx, 1010), "capfinanzas.com", 66, ACCENT, anchor="mm", bold=True,
             max_w=WIDTH - 120)
        for txt, xc in (("Windows", 220), ("macOS", 540), ("Linux", 860)):
            badge(ld, txt, xc, 1200, h=76)
        text(ld, (cx, 1380), "Desde USD 20 · pago único", 40, WHITE, anchor="mm",
             max_w=WIDTH - 160)
    return put_alpha(layer, v)


SCENES = [escena_1, escena_2, escena_3, escena_4,
          escena_comparativa, escena_beneficios, escena_cta]


def dura_wav(ffprobe, path):
    p = subprocess.run([ffprobe, "-v", "error", "-show_entries", "format=duration",
                        "-of", "default=nw=1:nk=1", path], capture_output=True, text=True)
    return float(p.stdout.strip() or 0)


def main():
    global CAPS
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    out = args[0] if args else os.path.join(HERE, "reel_capfinanzas_v5_mudo.mp4")
    ffmpeg = os.environ.get("FFMPEG_BIN", "ffmpeg")
    ffprobe = os.path.join(os.path.dirname(ffmpeg), "ffprobe")
    CAPS = load_caps()

    durs = [dura_wav(ffprobe, os.path.join(AUDIO_DIR, f"v5_s{i:02d}.wav"))
            for i in range(1, N_SCENES + 1)]
    if min(durs) <= 0:
        print("FALTAN audios en", AUDIO_DIR, durs)
        sys.exit(1)
    timeline, t = [], 0.0
    for d in durs:
        timeline.append((t, t + d))
        t += d + GAP
    total = t - GAP
    print("duraciones frase:", [round(x, 2) for x in durs], "| total:", round(total, 2))

    total_frames = int(round(total * FPS))
    cmd = [ffmpeg, "-y", "-loglevel", "error",
           "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{WIDTH}x{HEIGHT}",
           "-r", str(FPS), "-i", "-",
           "-c:v", "libx264", "-preset", "medium", "-crf", "20",
           "-pix_fmt", "yuv420p", "-movflags", "+faststart", out]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for i in range(total_frames):
        ft = i / FPS
        img = Image.new("RGB", (WIDTH, HEIGHT), BG)
        base = base_layer()
        for idx, sc in enumerate(SCENES):
            t0, t1 = timeline[idx]
            if ft < t0 or ft > t1:
                continue
            lay = sc(None, ft, t0, t1)
            if lay is not None:
                base.alpha_composite(lay)
        img = Image.alpha_composite(img.convert("RGBA"), base).convert("RGB")
        d = ImageDraw.Draw(img)
        prog = max(int(WIDTH * min(ft / total, 1.0)), 1)
        d.rectangle((0, HEIGHT - 10, prog, HEIGHT), fill=ACCENT)
        proc.stdin.write(img.tobytes())
        if i % 180 == 0:
            print(f"  frame {i}/{total_frames} t={ft:.2f}", flush=True)
    proc.stdin.close()
    rc = proc.wait()
    print("ffmpeg rc:", rc, "|", out, os.path.getsize(out) if os.path.exists(out) else 0)


if __name__ == "__main__":
    main()
