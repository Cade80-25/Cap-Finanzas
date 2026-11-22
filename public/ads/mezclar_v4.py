#!/usr/bin/env python3
"""Mezcla final del reel v4: voz (con las mismas pausas del timeline) + música.

Pasos:
  1. concatena audio/s01..s06.wav con pausas de 0.12 s  ->  voz_bruta.wav
  2. loudnorm en 2 pasadas (I=-16)                     ->  voz_norm.wav
  3. amix con la música (0.25) + volumen -2.2 dB + alimiter
  4. mux con el video mudo                             ->  reel_capfinanzas_v4.mp4
"""
import json
import os
import re
import subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
FFMPEG = os.environ.get(
    "FFMPEG_BIN", r"C:\Users\USUARIO\AppData\Local\hermes\tools\ffmpeg-9.0.1-win32-x64\bin\ffmpeg.exe")
FFPROBE = os.path.join(os.path.dirname(FFMPEG), "ffprobe.exe")
FFPLAY = os.path.dirname(FFMPEG)
GAP = 0.12
MUSIC = os.path.join(HERE, "v3", "background_music.wav")
MUSIC_VOL = 0.25
VIDEO = os.environ.get("REEL_VIDEO", os.path.join(HERE, "reel_capfinanzas_v4_mudo.mp4"))
OUT = os.environ.get("REEL_OUT", os.path.join(HERE, "reel_capfinanzas_v4.mp4"))


def run(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, text=True, **kw)


def dur(path):
    p = run([FFPROBE, "-v", "error", "-show_entries", "format=duration",
             "-of", "default=nw=1:nk=1", path])
    return float(p.stdout.strip() or 0)


def loudnorm_json(path):
    p = run([FFMPEG, "-hide_banner", "-i", path, "-af",
             "loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"])
    m = re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", p.stderr, re.S)
    return json.loads(m.group(0)) if m else None


def main():
    voces = [os.path.join(HERE, "audio", f"s{i:02d}.wav") for i in range(1, 7)]
    durs = [dur(v) for v in voces]
    total = sum(durs) + GAP * (len(voces) - 1)
    print("frases:", [round(d, 2) for d in durs], "-> pista", round(total, 3), "s")

    gap = os.path.join(HERE, "audio", "_gap.wav")
    run([FFMPEG, "-y", "-loglevel", "error", "-f", "lavfi",
         "-i", f"anullsrc=r=22050:cl=mono", "-t", str(GAP), "-c:a", "pcm_s16le", gap])

    voz_bruta = os.path.join(HERE, "audio", "_voz_bruta.wav")
    # intercalamos: s01 gap s02 gap ... s06  (11 pistas)
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
    ln = (f"loudnorm=I=-16:TP=-1.5:LRA=11:measured_I={med['input_i']}:"
          f"measured_TP={med['input_tp']}:measured_LRA={med['input_lra']}:"
          f"measured_thresh={med['input_thresh']}:offset={med['target_offset']}:linear=true")
    voz_norm = os.path.join(HERE, "audio", "_voz_norm.wav")
    run([FFMPEG, "-y", "-loglevel", "error", "-i", voz_bruta, "-af", ln,
         "-c:a", "pcm_s16le", voz_norm])

    mix = (f"[2:a]volume={MUSIC_VOL}[m];[m][1:a]amix=inputs=2:duration=first:normalize=0[a];"
           f"[a]volume=-2.2dB,alimiter=limit=0.98[aout]")
    r = run([FFMPEG, "-y", "-loglevel", "error",
             "-i", VIDEO, "-i", voz_norm, "-i", MUSIC,
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
