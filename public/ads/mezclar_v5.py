#!/usr/bin/env python3
"""Mezcla final del reel v5: voz (con las mismas pausas del timeline) + música.

Pasos:
  1. concatena audio/v5_s01..v5_s07.wav con pausas de 0.12 s  ->  _voz_bruta.wav
  2. loudnorm en 2 pasadas (I=-16)                            ->  _voz_norm.wav
  3. amix con la música (0.25) + volumen -2.2 dB + alimiter
  4. mux con el video mudo                                    ->  reel_capfinanzas_v5.mp4
"""
import json
import os
import re
import subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
FFMPEG = os.environ.get(
    "FFMPEG_BIN", r"C:\Users\USUARIO\AppData\Local\hermes\tools\ffmpeg-9.0.1-win32-x64\bin\ffmpeg.exe")
FFPROBE = os.path.join(os.path.dirname(FFMPEG), "ffprobe.exe")
GAP = 0.12
N = 7
MUSIC = os.path.join(HERE, "v3", "background_music.wav")
MUSIC_VOL = 0.25
VIDEO = os.environ.get("REEL_VIDEO", os.path.join(HERE, "reel_capfinanzas_v5_mudo.mp4"))
OUT = os.environ.get("REEL_OUT", os.path.join(HERE, "reel_capfinanzas_v5.mp4"))


def run(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, text=True, **kw)


def dur(path):
    p = run([FFPROBE, "-v", "error", "-show_entries", "format=duration",
             "-of", "default=nw=1:nk=1", path])
    return float(p.stdout.strip() or 0)


def loudnorm_json(path):
    p = run([FFMPEG, "-hide_banner", "-i", path, "-af",
             "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"])
    m = re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", p.stderr, re.S)
    return json.loads(m.group(0)) if m else None


def extender_musica(total, crossfade=2.0):
    """La pista base dura 30 s: la repite con crossfade y la recorta al total.

    Sin esto, `amix=duration=first` toma la duracion de la musica (30 s) y corta
    la voz a la mitad del reel (bug real del v3/v4/v5).
    """
    salida = os.path.join(HERE, "audio", "_musica_ext.wav")
    if not os.path.exists(MUSIC):
        return None
    n = max(3, int(total / 28) + 1)
    cmd = [FFMPEG, "-y", "-loglevel", "error"]
    for _ in range(n):
        cmd += ["-i", MUSIC]
    cadena = f"[0:a][1:a]acrossfade=d={crossfade}:c1=tri:c2=tri[a0]"
    prev = "a0"
    for i in range(2, n):
        cur = f"a{i}"
        cadena += (f";[{prev}][{i}:a]acrossfade=d={crossfade}:c1=tri:c2=tri[{cur}]")
        prev = cur
    out = prev
    cadena += (f";[{out}]atrim=duration={total:.3f},volume={MUSIC_VOL},"
               f"afade=t=out:st={max(total - 2.5, 0):.3f}:d=2.5[m]")
    cmd += ["-filter_complex", cadena, "-map", "[m]", "-c:a", "pcm_s16le", salida]
    r = run(cmd)
    if r.returncode != 0:
        print("fallo extender musica:", r.stderr[-300:])
        return None
    return salida


def main():
    voces = [os.path.join(HERE, "audio", f"v5_s{i:02d}.wav") for i in range(1, N + 1)]
    durs = [dur(v) for v in voces]
    total = sum(durs) + GAP * (len(voces) - 1)
    print("frases:", [round(d, 2) for d in durs], "-> pista", round(total, 3), "s")

    gap = os.path.join(HERE, "audio", "_gap.wav")
    run([FFMPEG, "-y", "-loglevel", "error", "-f", "lavfi",
         "-i", f"anullsrc=r=22050:cl=mono", "-t", str(GAP), "-c:a", "pcm_s16le", gap])

    voz_bruta = os.path.join(HERE, "audio", "_voz_bruta.wav")
    orden = []
    for i, v in enumerate(voces):
        orden.append(v)
        if i < len(voces) - 1:
            orden.append(gap)
    cmd = [FFMPEG, "-y", "-loglevel", "error"]
    for p in orden:
        cmd += ["-i", p]
    cmd += ["-filter_complex", "".join(f"[{i}:a]" for i in range(len(orden)))
            + f"concat=n={len(orden)}:v=0:a=1[v]", "-map", "[v]",
            "-c:a", "pcm_s16le", voz_bruta]
    r = run(cmd)
    print("concat rc:", r.returncode, r.stderr[-300:] if r.returncode else "")
    print("dur _voz_bruta:", round(dur(voz_bruta), 3))

    med = loudnorm_json(voz_bruta)
    print("medicion:", {k: med[k] for k in ("input_i", "input_tp", "input_lra", "input_thresh", "target_offset")} if med else None)
    ln = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={med['input_i']}:"
          f"measured_TP={med['input_tp']}:measured_LRA={med['input_lra']}:"
          f"measured_thresh={med['input_thresh']}:offset={med['target_offset']}:linear=true")
    voz_norm = os.path.join(HERE, "audio", "_voz_norm.wav")
    run([FFMPEG, "-y", "-loglevel", "error", "-i", voz_bruta, "-af", ln,
         "-c:a", "pcm_s16le", voz_norm])

    musica = extender_musica(total) or MUSIC
    print("musica:", round(dur(musica), 3), "s |", musica)
    mix = (f"[1:a][2:a]amix=inputs=2:duration=longest:normalize=0[a];"
           f"[a]alimiter=limit=0.92[aout]")
    r = run([FFMPEG, "-y", "-loglevel", "error",
             "-i", VIDEO, "-i", voz_norm, "-i", musica,
             "-filter_complex", mix,
             "-map", "0:v", "-map", "[aout]",
             "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "44100",
             "-movflags", "+faststart", OUT])
    print("mux rc:", r.returncode, r.stderr[-200:] if r.returncode else "")

    v = run([FFMPEG, "-hide_banner", "-i", OUT, "-af", "volumedetect", "-f", "null", "-"])
    for line in v.stderr.splitlines():
        if "mean_volume" in line or "max_volume" in line:
            print("  ", line.strip())
    s = run([FFMPEG, "-hide_banner", "-i", OUT, "-af",
             "loudnorm=I=-16:TP=-1.5:LRA=11:print_format=summary", "-f", "null", "-"])
    for line in s.stderr.splitlines():
        if "Input Integrated" in line or "Input True Peak" in line:
            print("  ", line.strip())
    d = run([FFPROBE, "-v", "error", "-show_entries", "format=duration",
             "-of", "default=nw=1:nk=1", OUT])
    print("  duracion:", d.stdout.strip(), "s |", OUT,
          os.path.getsize(OUT) if os.path.exists(OUT) else 0, "bytes")


if __name__ == "__main__":
    main()
