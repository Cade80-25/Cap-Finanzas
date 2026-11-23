#!/usr/bin/env python3
"""Mezcla de audio del reel CORTO: voz (vc_s01..05) + musica, a -13/-14 LUFS."""
import os
import subprocess

from mezclar_v5 import FFMPEG, FFPROBE, HERE, MUSIC, dur, extender_musica, loudnorm_json, run

GAP = float(os.environ.get("GAP_CORTO", "1.1"))
N = 5
OUT = os.environ.get("REEL_OUT", os.path.join(HERE, "reel_capfinanzas_corto.mp4"))
VIDEO = os.path.join(HERE, "reel_capfinanzas_corto_mudo.mp4")
AUDIO_DIR = os.path.join(HERE, "audio")


def main():
    wavs = [os.path.join(AUDIO_DIR, f"vc_s{i:02d}.wav") for i in range(1, N + 1)]
    if not all(os.path.exists(w) for w in wavs):
        raise SystemExit("faltan voces vc_s01..05")
    durs = [dur(w) for w in wavs]
    total_voz = sum(durs) + GAP * (N - 1)
    raw = os.path.join(AUDIO_DIR, "_voz_bruta_c.wav")
    norm = os.path.join(AUDIO_DIR, "_voz_norm_c.wav")
    lista = os.path.join(AUDIO_DIR, "_lista_c.txt")
    gap = os.path.join(AUDIO_DIR, "_gap.wav")
    if not os.path.exists(gap):
        run([FFMPEG, "-y", "-loglevel", "error", "-f", "lavfi", "-i",
             "anullsrc=r=44100:cl=stereo", "-t", str(GAP), "-c:a", "pcm_s16le", gap])

    with open(lista, "w", encoding="utf-8") as f:
        for w in wavs:
            f.write(f"file '{w.replace(os.sep, '/')}'\n")
        for _ in range(N - 1):
            f.write(f"file '{gap.replace(os.sep, '/')}'\n")

    cmd = ([FFMPEG, "-y", "-loglevel", "error", "-f", "concat", "-safe", "0",
            "-i", lista, "-c:a", "pcm_s16le", "-ar", "44100", raw])
    r = run(cmd)
    if r.returncode != 0:
        raise SystemExit("fallo el concat de voz")

    m = loudnorm_json(raw)   # devuelve los valores medidos de la pista cruda
    if not m:
        raise SystemExit("no se pudo medir la voz")
    print("medicion voz:", m)

    norm = os.path.join(AUDIO_DIR, "_voz_norm_c.wav")
    r = run([FFMPEG, "-y", "-loglevel", "error", "-i", raw,
             "-af", (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:"
                   f"measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:"
                   f"measured_thresh={m['input_thresh']}:offset={m['target_offset']}:"
                   f"linear=true"), "-ar", "44100", "-c:a", "pcm_s16le", norm])
    if r.returncode != 0:
        raise SystemExit("fallo loudnorm voz")

    musica = extender_musica(dur(VIDEO)) or MUSIC
    cmd = [FFMPEG, "-y", "-loglevel", "error", "-i", VIDEO, "-i", norm, "-i", musica,
           "-filter_complex",
           "[2:a]volume=0.25[m];[1:a][m]amix=inputs=2:duration=longest:normalize=0[a];"
           "[a]alimiter=limit=0.92[aout]",
           "-map", "0:v", "-map", "[aout]",
           "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "44100",
           "-movflags", "+faststart", OUT]
    r = subprocess.run(cmd, capture_output=True, text=True)
    print("mux rc:", r.returncode, r.stderr[-200:] if r.returncode else "")

    v = subprocess.run([FFMPEG, "-hide_banner", "-i", OUT, "-af",
                        "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json",
                        "-f", "null", "-"], capture_output=True, text=True)
    m = loudnorm_json(v.stderr)
    print("final:", {k: m[k] for k in ("input_i", "input_tp")} if m else None)
    for line in v.stderr.splitlines():
        if "mean_volume" in line or "max_volume" in line:
            print("  ", line.strip())
    d = subprocess.run([FFPROBE, "-v", "error", "-show_entries", "format=duration",
                        "-of", "default=nw=1:nk=1", OUT], capture_output=True, text=True)
    print("duracion:", d.stdout.strip(), "s |", OUT)


if __name__ == "__main__":
    main()
