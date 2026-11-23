#!/usr/bin/env python3
"""Voz del reel CORTO (~30 s): 5 frases, misma voz Dalia que el v5."""
import os
import subprocess
import sys

FFPROBE = "C:/Users/USUARIO/AppData/Local/hermes/tools/ffmpeg-9.0.1-win32-x64/bin/ffprobe.exe"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "audio")
EDGE_PY = (
    "C:/Users/USUARIO/AppData/Local/hermes/profiles/codigo/cache/scratch/"
    "venv_etts/Scripts/python.exe"
)

FRASES = [
    "¿Cuadrar tus cuentas te quita horas?",
    "Cap-Finanzas ordena tu dinero en un solo programa. Sin internet y sin "
    "suscripciones.",
    "Modo Simple: USD 20, pago único. Ingresos, gastos y presupuestos en un paso.",
    "Modo Negocios: USD 100, pago único. Partida doble, inventarios, personal y "
    "cuentas bancarias.",
    "Descargalo hoy en capfinanzas.com. Tu dinero, en orden.",
]


def dur(path):
    try:
        r = subprocess.run([FFPROBE, "-v", "error", "-show_entries",
                            "format=duration", "-of", "default=nw=1:nk=1", path],
                           capture_output=True, text=True, timeout=60)
        return round(float(r.stdout.strip()), 3)
    except Exception:
        return 0.0


def main():
    nombre = os.environ.get("VOZ_NOMBRE", "es-MX-DaliaNeural")
    rate = os.environ.get("VOZ_RATE", "+30%")
    os.makedirs(OUT, exist_ok=True)
    for i, texto in enumerate(FRASES, 1):
        wav = os.path.join(OUT, f"vc_s{i:02d}.wav")
        py = EDGE_PY if os.path.exists(EDGE_PY) else sys.executable
        cmd = [py, "-m", "edge_tts", "--voice", nombre, "--rate", rate,
               "--text", texto, "--write-media", wav]
        p = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        if p.returncode != 0 or not os.path.exists(wav):
            print(f"  vc_s{i:02d} FALLO rc={p.returncode} {(p.stderr or '')[:200]}")
            continue
        print(f"  vc_s{i:02d}  {dur(wav):6.3f}s")
    print(f"voz={nombre} rate={rate}")
    print("total:", round(sum(dur(os.path.join(OUT, f'vc_s{i:02d}.wav'))
                             for i in range(1, len(FRASES) + 1)), 3))


if __name__ == "__main__":
    main()
