import os
import subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "audio")
os.makedirs(OUT, exist_ok=True)

PIPER = r"C:\Users\USUARIO\Projects\ebook2audiobook\venv\Scripts\piper.exe"
MODEL = (r"C:\Users\USUARIO\AppData\Local\hermes\profiles\codigo\cache\scratch"
         r"\piper\es_MX-claude-high\es_MX-claude-high.onnx")
FFPROBE = r"C:\Users\USUARIO\AppData\Local\hermes\tools\ffmpeg-9.0.1-win32-x64\bin\ffprobe.exe"
RATE = os.environ.get("PIPER_RATE", "1.25")

# Guion v4 (texto exacto que se escucha; coincide con GUION_REEL_V4.md)
FRASES = [
    "¿Cuadrar tus cuentas te quita horas? Entre Excel, cuadernos y papeles.",
    "Cap Finanzas: contabilidad personal y empresarial, en Windows, macOS y Linux.",
    "Modo Simple, para personas: ingresos y gastos en un paso, categorías "
    "automáticas y presupuestos claros. Veinte dólares, pago único.",
    "Modo Negocios, para empresas: partida doble, libro diario y mayor, balance "
    "y resultados. Cien dólares, pago único.",
    "Funciona sin internet y tus datos quedan en tu computadora. Sin "
    "suscripciones: un solo pago, de por vida.",
    "Descargalo hoy en capfinanzas.com.",
]

total = 0.0

for i, txt in enumerate(FRASES, 1):
    dst = os.path.join(OUT, f"s{i:02d}.wav")
    p = subprocess.run([PIPER, "--model", MODEL, "--length_scale", RATE, "-f", dst],
                       input=txt, capture_output=True, text=True, timeout=300)
    if p.returncode != 0:
        print(f"s{i:02d} ERROR:", p.stderr[-300:])
        continue
    d = subprocess.run([FFPROBE, "-v", "error", "-show_entries", "format=duration",
                        "-of", "default=nw=1:nk=1", dst], capture_output=True, text=True)
    dur = float(d.stdout.strip() or 0)
    total += dur
    print(f"s{i:02d}  {dur:6.2f} s  {txt[:52]}...")
print(f"TOTAL voz: {total:.2f} s (+ gaps)")
