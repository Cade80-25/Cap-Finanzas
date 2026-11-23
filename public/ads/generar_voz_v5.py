"""Genera la voz del reel v5 (7 escenas) con edge-tts o Piper.

Uso:
  VOZ_MOTOR=edge VOZ_NOMBRE=es-UY-LuciaNeural VOZ_RATE=+4% \
    python generar_voz_v5.py

Variables:
  VOZ_MOTOR   edge | piper        (default: edge)
  VOZ_NOMBRE  hablante edge o ruta de modelo piper
  VOZ_RATE    rate edge (default +4%)
  VOZ_LENGTH  length_scale piper (default 0.72)
"""
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "audio")
FFPROBE = os.environ.get(
    "FFPROBE_BIN",
    "C:/Users/USUARIO/AppData/Local/hermes/tools/ffmpeg-9.0.1-win32-x64/bin/ffprobe.exe",
)

# Las 7 frases del guion v5, en orden de escena.
FRASES = [
    "¿Cuadrar tus cuentas te quita horas? Entre Excel, cuadernos y papeles.",
    "Cap Finanzas ordena tu dinero en un solo programa. Sin internet y sin "
    "suscripciones. Funciona en Windows, Mac y Linux.",
    "Viene en dos modos. El Simple: cargás ingresos y gastos en un paso. "
    "Categorías automáticas, presupuestos claros y un panel que te muestra "
    "en qué se va tu plata.",
    "El Negocios es contabilidad completa. Cada operación registra dos "
    "partidas: el debe y el haber. Libro diario, libro mayor y balance. "
    "Además maneja inventarios, personal y cuentas bancarias, todo en el "
    "mismo lugar.",
    "¿Y por qué dos precios? Porque el Negocios hace el doble registro "
    "contable: anota cada operación dos veces y te devuelve el balance. Si "
    "controlás tus finanzas personales, el Simple. Si llevás la contabilidad "
    "de un negocio, el Negocios.",
    "Sin mensualidades: pagás una vez y es tuyo. Sin internet: tus datos "
    "quedan en tu computadora, no en la nube de nadie. Instalalo y usalo "
    "para siempre.",
    "Descargalo hoy en capfinanzas.com. Cap Finanzas: tu dinero, en orden.",
]

EDGE_PY = (
    "C:/Users/USUARIO/AppData/Local/hermes/profiles/codigo/cache/scratch/"
    "venv_etts/Scripts/python.exe"
)
PIPER = "C:/Users/USUARIO/Projects/ebook2audiobook/venv/Scripts/piper.exe"
PIPER_MODEL = (
    "C:/Users/USUARIO/AppData/Local/hermes/profiles/codigo/cache/scratch/"
    "piper/es_MX-claude-high/es_MX-claude-high.onnx"
)


def dur(path):
    try:
        r = subprocess.run(
            [FFPROBE, "-v", "error", "-show_entries", "format=duration",
             "-of", "default=nw=1:nk=1", path],
            capture_output=True, text=True, timeout=60,
        )
        return round(float(r.stdout.strip()), 3)
    except Exception:
        return 0.0


def main():
    motor = os.environ.get("VOZ_MOTOR", "edge").lower()
    nombre = os.environ.get("VOZ_NOMBRE", "es-UY-LuciaNeural")
    rate = os.environ.get("VOZ_RATE", "+4%")
    length = os.environ.get("VOZ_LENGTH", "0.72")
    os.makedirs(OUT, exist_ok=True)
    rutas = []
    for i, texto in enumerate(FRASES, 1):
        wav = os.path.join(OUT, f"v5_s{i:02d}.wav")
        if motor == "piper":
            cmd = [PIPER, "--model", os.path.join(PIPER_MODEL, "es_MX-claude-high.onnx"),
                   "--length_scale", length, "-f", wav]
            p = subprocess.run(cmd, input=texto.encode("utf-8"),
                               capture_output=True, timeout=300)
        else:
            py = EDGE_PY if os.path.exists(EDGE_PY) else sys.executable
            cmd = [py, "-m", "edge_tts", "--voice", nombre, "--rate", rate,
                   "--text", texto, "--write-media", wav]
            p = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        if p.returncode != 0 or not os.path.exists(wav):
            print(f"  s{i:02d} FALLO rc={p.returncode} {(p.stderr or '')[:200]}")
            continue
        rutas.append(wav)
        print(f"  s{i:02d}  {dur(wav):6.3f}s")
    total = sum(dur(r) for r in rutas)
    print(f"motor={motor} voz={nombre} rate/length={rate if motor!='piper' else length}")
    print("duraciones:", [dur(r) for r in rutas], "| total:", round(total, 3))


if __name__ == "__main__":
    main()
