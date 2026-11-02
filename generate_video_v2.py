import subprocess
import os

out_dir = "C:/Users/USUARIO/Projects/Cap-Finanzas-repo/public/ads/v2"
os.makedirs(out_dir, exist_ok=True)

# Create video with transitions and text overlays using ffmpeg
# 4 images, 5s each = 20s total

# Build filter complex
# Each image: 5s duration with fade in/out
# Text overlay on each

filter_complex = (
    "[0:v]scale=1080:1080,format=yuv420p,trim=duration=5,setpts=PTS-STARTPTS,fade=t=in:st=0:d=0.5,fade=t=out:st=4.5:d=0.5[v0];"
    "[1:v]scale=1080:1080,format=yuv420p,trim=duration=5,setpts=PTS-STARTPTS,fade=t=in:st=0:d=0.5,fade=t=out:st=4.5:d=0.5[v1];"
    "[2:v]scale=1080:1080,format=yuv420p,trim=duration=5,setpts=PTS-STARTPTS,fade=t=in:st=0:d=0.5,fade=t=out:st=4.5:d=0.5[v2];"
    "[3:v]scale=1080:1080,format=yuv420p,trim=duration=5,setpts=PTS-STARTPTS,fade=t=in:st=0:d=0.5,fade=t=out:st=4.5:d=0.5[v3];"
    "[v0][v1]xfade=transition=fade:duration=0.5:offset=4.5[x01];"
    "[x01][v2]xfade=transition=fade:duration=0.5:offset=9[x012];"
    "[x012][v3]xfade=transition=fade:duration=0.5:offset=13.5[x0123];"
    "[x0123]drawtext=text='¿Gastas sin control?':fontsize=56:fontcolor=white:x=(w-text_w)/2:y=60:enable='between(t,0,5)':fontfile='C\\:/Windows/Fonts/segoeuib.ttf',"
    "drawtext=text='Cap Finanzas te ayuda':fontsize=40:fontcolor=#c7d2fe:x=(w-text_w)/2:y=130:enable='between(t,0,5)':fontfile='C\\:/Windows/Fonts/segoeui.ttf',"
    "drawtext=text='Antes: Gastos sin control':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=60:enable='between(t,5,10)':fontfile='C\\:/Windows/Fonts/segoeuib.ttf',"
    "drawtext=text='Despues: Cada gasto registrado':fontsize=40:fontcolor=#c7d2fe:x=(w-text_w)/2:y=130:enable='between(t,5,10)':fontfile='C\\:/Windows/Fonts/segoeui.ttf',"
    "drawtext=text='10,000+ usuarios confian':fontsize=56:fontcolor=white:x=(w-text_w)/2:y=60:enable='between(t,10,15)':fontfile='C\\:/Windows/Fonts/segoeuib.ttf',"
    "drawtext=text='en Cap Finanzas':fontsize=40:fontcolor=#c7d2fe:x=(w-text_w)/2:y=130:enable='between(t,10,15)':fontfile='C\\:/Windows/Fonts/segoeui.ttf',"
    "drawtext=text='Descarga tu Guia GRATIS':fontsize=56:fontcolor=white:x=(w-text_w)/2:y=60:enable='between(t,15,20)':fontfile='C\\:/Windows/Fonts/segoeuib.ttf',"
    "drawtext=text='100% gratis - Sin registro':fontsize=40:fontcolor=#c7d2fe:x=(w-text_w)/2:y=130:enable='between(t,15,20)':fontfile='C\\:/Windows/Fonts/segoeui.ttf'[vout]"
)

cmd = [
    "ffmpeg", "-y",
    "-loop", "1", "-t", "5", "-i", os.path.join(out_dir, "ad_v2_01_hook.png"),
    "-loop", "1", "-t", "5", "-i", os.path.join(out_dir, "ad_v2_02_before_after.png"),
    "-loop", "1", "-t", "5", "-i", os.path.join(out_dir, "ad_v2_03_social_proof.png"),
    "-loop", "1", "-t", "5", "-i", os.path.join(out_dir, "ad_v2_04_lead_magnet.png"),
    "-filter_complex", filter_complex,
    "-map", "[vout]",
    "-c:v", "libx264", "-preset", "medium", "-crf", "23",
    "-r", "30", "-t", "20",
    os.path.join(out_dir, "cap_finanzas_ad_v2_20s.mp4")
]

result = subprocess.run(cmd, capture_output=True, text=True)
if result.returncode == 0:
    print("Video created: cap_finanzas_ad_v2_20s.mp4")
else:
    print("Error:", result.stderr[:1000])
