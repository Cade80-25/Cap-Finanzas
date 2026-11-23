"""Reintenta solo las frases de voz v5 que quedaron vacías."""
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
AUDIO = os.path.join(HERE, "audio")
EDGE_PY = ("C:/Users/USUARIO/AppData/Local/hermes/profiles/codigo/cache/scratch/"
           "venv_etts/Scripts/python.exe")
FRASES = {
    4: "El Negocios es contabilidad completa. Cada operación registra dos "
       "partidas: el debe y el haber. Libro diario, libro mayor y balance de "
       "resultados. Facturas, stock, cuentas corrientes y tu equipo, en el "
       "mismo lugar.",
    6: "Sin mensualidades: pagás una vez y es tuyo. Sin internet: tus datos "
       "quedan en tu computadora, no en la nube de nadie. Instalalo y usalo "
       "para siempre.",
}
RATE = os.environ.get("VOZ_RATE", "+30%")
VOICE = os.environ.get("VOZ_NOMBRE", "es-MX-DaliaNeural")

for i, texto in FRASES.items():
    wav = os.path.join(AUDIO, f"v5_s{i:02d}.wav")
    for intento in range(1, 6):
        r = subprocess.run([EDGE_PY, "-m", "edge_tts", "--voice", VOICE,
                            "--rate", RATE, "--text", texto,
                            "--write-media", wav],
                           capture_output=True, text=True, timeout=300)
        ok = os.path.exists(wav) and os.path.getsize(wav) > 1000
        print(f"s{i:02d} intento {intento}: rc={r.returncode} "
              f"bytes={os.path.getsize(wav) if os.path.exists(wav) else 0} "
              f"{'OK' if ok else 'FALLO'}")
        if ok:
            break
