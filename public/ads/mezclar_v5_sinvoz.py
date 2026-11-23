#!/usr/bin/env python3
"""Variante SIN VOZ del reel v5: mismo video (subtitulos quemados) + solo musica.

Util para quienes consumen reels en silencio y para rotar contenido sin repetir
la narracion. La musica sube a 0.5 porque no tiene que competir con la voz.
"""
import os
import subprocess

from mezclar_v5 import FFMPEG, HERE, MUSIC, VIDEO, dur, extender_musica

OUT = os.environ.get("REEL_OUT", os.path.join(HERE, "reel_capfinanzas_v5_sinvoz.mp4"))
MUSIC_VOL = float(os.environ.get("MUSIC_VOL", "0.5"))


def main():
    total = dur(VIDEO)
    print("video:", round(total, 2), "s")
    musica = extender_musica(total, vol=MUSIC_VOL) or MUSIC
    cmd = [FFMPEG, "-y", "-loglevel", "error",
           "-i", VIDEO, "-i", musica,
           "-filter_complex", "[1:a]alimiter=limit=0.9[aout]",
           "-map", "0:v", "-map", "[aout]",
           "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "44100",
           "-movflags", "+faststart", OUT]
    r = subprocess.run(cmd, capture_output=True, text=True)
    print("mux rc:", r.returncode, r.stderr[-200:] if r.returncode else "")
    v = subprocess.run([FFMPEG, "-hide_banner", "-i", OUT, "-af", "volumedetect",
                        "-f", "null", "-"], capture_output=True, text=True)
    for line in v.stderr.splitlines():
        if "mean_volume" in line or "max_volume" in line:
            print("  ", line.strip())
    d = subprocess.run([FFMPEG.replace("ffmpeg.exe", "ffprobe.exe"), "-v", "error",
                        "-show_entries", "format=duration", "-of", "default=nw=1:nk=1",
                        OUT], capture_output=True, text=True)
    print("  duracion:", d.stdout.strip(), "s |", OUT,
          os.path.getsize(OUT) if os.path.exists(OUT) else 0, "bytes")


if __name__ == "__main__":
    main()
