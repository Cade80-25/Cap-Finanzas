#!/usr/bin/env python3
"""Reel CORTO de 30 s: gancho, presentacion, Simple, Negocios y CTA.

Mismo lenguaje visual que el v5 (subtitulos quemados, capturas reales, tarjetas
de precio), pero comprimido a ~30 s para rotarlo como aviso barato en el feed.
"""
import os
import subprocess
import sys

from PIL import Image, ImageDraw

import generate_reel_v5 as g

HERE = g.HERE
FPS = g.FPS
WIDTH, HEIGHT = g.WIDTH, g.HEIGHT
BG, ACCENT = g.BG, g.ACCENT
GAP = float(os.environ.get("GAP_CORTO", "1.1"))  # pausa mayor -> ritmo de aviso
N = 5
AUDIO_DIR = os.path.join(HERE, "audio")
OUT = os.environ.get("REEL_OUT", os.path.join(HERE, "reel_capfinanzas_corto_mudo.mp4"))
FFMPEG = os.environ.get("FFMPEG_BIN", "ffmpeg")
FFPROBE = os.path.join(os.path.dirname(FFMPEG), "ffprobe")


def _simple(d, t, t0, t1):
    return g.escena_modo(d, t, t0, t1, "SIMPLE", "USD 20 · PAGO ÚNICO",
                         g.SIMPLE_BULLETS, "simple")


def _negocios(d, t, t0, t1):
    return g.escena_modo(d, t, t0, t1, "NEGOCIOS", "USD 100 · PAGO ÚNICO",
                         g.NEGOCIOS_BULLETS, "negocios")


SCENES = [g.escena_1, g.escena_2, _simple, _negocios, g.escena_cta]

SUBS = [
    "¿Cuadrar tus cuentas te quita horas?",
    "Cap-Finanzas: un solo programa, sin internet.",
    "Modo Simple: USD 20, pago único.",
    "Modo Negocios: USD 100 · partida doble, inventarios, personal y banca.",
    "Descargalo hoy en capfinanzas.com",
]


def dura_wav(path):
    p = subprocess.run([FFPROBE, "-v", "error", "-show_entries", "format=duration",
                        "-of", "default=nw=1:nk=1", path], capture_output=True, text=True)
    return float(p.stdout.strip() or 0)


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    out = args[0] if args else OUT
    g.CAPS = g.load_caps()

    durs = [dura_wav(os.path.join(AUDIO_DIR, f"vc_s{i:02d}.wav")) for i in range(1, N + 1)]
    if min(durs) <= 0:
        print("FALTAN audios vc_s01..05 en", AUDIO_DIR, durs)
        sys.exit(1)
    timeline, t = [], 0.0
    for d in durs:
        timeline.append((t, t + d))
        t += d + GAP
    total = t - GAP
    print("duraciones frase:", [round(x, 2) for x in durs], "| total:", round(total, 2))

    total_frames = int(round(total * FPS))
    cmd = [FFMPEG, "-y", "-loglevel", "error",
           "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{WIDTH}x{HEIGHT}",
           "-r", str(FPS), "-i", "-",
           "-c:v", "libx264", "-preset", "medium", "-crf", "20",
           "-pix_fmt", "yuv420p", "-movflags", "+faststart", out]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for i in range(total_frames):
        ft = i / FPS
        img = Image.new("RGB", (WIDTH, HEIGHT), BG)
        base = g.base_layer()
        for idx, sc in enumerate(SCENES):
            t0, t1 = timeline[idx]
            if ft < t0 or ft > t1:
                continue
            lay = sc(None, ft, t0, t1)
            if lay is not None:
                base.alpha_composite(lay)
            g.subtitulo(base, ft, t0, t1, SUBS[idx])
        img = Image.alpha_composite(img.convert("RGBA"), base).convert("RGB")
        d = ImageDraw.Draw(img)
        prog = max(int(WIDTH * min(ft / total, 1.0)), 1)
        d.rectangle((0, HEIGHT - 10, prog, HEIGHT), fill=ACCENT)
        proc.stdin.write(img.tobytes())
        if i % 180 == 0:
            print(f"  frame {i}/{total_frames} t={ft:.2f}")
    proc.stdin.close()
    rc = proc.wait()
    print("ffmpeg rc:", rc, "|", out, os.path.getsize(out), "bytes")


if __name__ == "__main__":
    main()
