import subprocess
import os

out_dir = "C:/Users/USUARIO/Projects/Cap-Finanzas-repo/public/ads/v3"
src_dir = "C:/Users/USUARIO/Desktop/CAP-FINANZAS/Promo y Marketing/capturas_estudio"
os.makedirs(out_dir, exist_ok=True)

# Professional 30s ad video with music, advanced animations, and text
main_img = os.path.join(src_dir, "01_personal_dashboard.png")
music_path = os.path.join(out_dir, "background_music.wav")

filter_complex = (
    # Input 0: Main dashboard with zoom + color grading
    "[0:v]scale=1920:1080,format=yuv420p,eq=brightness=0.05:contrast=1.1:saturation=1.2,zoompan=z='min(zoom+0.0015,1.4)':d=90:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)',trim=duration=4,setpts=PTS-STARTPTS[v0];"
    # Input 1: Transactions with pan
    "[1:v]scale=1920:1080,format=yuv420p,eq=brightness=0.05:contrast=1.1:saturation=1.2,zoompan=z='1.3':x='if(lte(on,60),0,on*3)':y='ih/2-(ih/zoom/2)',trim=duration=5,setpts=PTS-STARTPTS[v1];"
    # Input 2: Categories
    "[2:v]scale=1920:1080,format=yuv420p,eq=brightness=0.05:contrast=1.1:saturation=1.2,zoompan=z='min(zoom+0.002,1.35)':d=90:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)',trim=duration=6,setpts=PTS-STARTPTS[v2];"
    # Input 3: Empresarial
    "[3:v]scale=1920:1080,format=yuv420p,eq=brightness=0.05:contrast=1.1:saturation=1.2,zoompan=z='min(zoom+0.0015,1.4)':d=90:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)',trim=duration=6,setpts=PTS-STARTPTS[v3];"
    # Input 4: Lead magnet image
    "[4:v]scale=1920:1080,format=yuv420p,eq=brightness=0.05:contrast=1.1:saturation=1.2,zoompan=z='min(zoom+0.001,1.25)':d=90:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)',trim=duration=9,setpts=PTS-STARTPTS[v4];"
    # Concatenate
    "[v0][v1]xfade=transition=fade:duration=0.5:offset=3.5[x01];"
    "[x01][v2]xfade=transition=fade:duration=0.5:offset=8[x012];"
    "[x012][v3]xfade=transition=fade:duration=0.5:offset=13.5[x0123];"
    "[x0123][v4]xfade=transition=fade:duration=0.5:offset=19[x01234];"
    # Text overlays
    "[x01234]drawtext=text='¿Gastas sin control?':fontsize=80:fontcolor=white:x=(w-text_w)/2:y=60:enable='between(t,0,4)':fontfile='C\\:/Windows/Fonts/segoeuib.ttf',"
    "drawtext=text='No sabes a donde va tu dinero':fontsize=52:fontcolor=#fbbf24:x=(w-text_w)/2:y=150:enable='between(t,4,9)':fontfile='C\\:/Windows/Fonts/segoeui.ttf',"
    "drawtext=text='Cap Finanzas te ayuda':fontsize=72:fontcolor=#22c55e:x=(w-text_w)/2:y=60:enable='between(t,9,15)':fontfile='C\\:/Windows/Fonts/segoeuib.ttf',"
    "drawtext=text='Registra cada gasto en 5 segundos':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=150:enable='between(t,9,15)':fontfile='C\\:/Windows/Fonts/segoeui.ttf',"
    "drawtext=text='Ahorra $200/mes sin esfuerzo':fontsize=72:fontcolor=#22c55e:x=(w-text_w)/2:y=60:enable='between(t,15,21)':fontfile='C\\:/Windows/Fonts/segoeuib.ttf',"
    "drawtext=text='10,000+ usuarios ya lo hacen':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=150:enable='between(t,15,21)':fontfile='C\\:/Windows/Fonts/segoeui.ttf',"
    "drawtext=text='Descarga GRATIS ahora':fontsize=80:fontcolor=white:x=(w-text_w)/2:y=60:enable='between(t,21,30)':fontfile='C\\:/Windows/Fonts/segoeuib.ttf',"
    "drawtext=text='Tu dinero, tus reglas':fontsize=52:fontcolor=#c7d2fe:x=(w-text_w)/2:y=150:enable='between(t,21,30)':fontfile='C\\:/Windows/Fonts/segoeui.ttf'[vout]"
)

cmd = [
    "ffmpeg", "-y",
    "-loop", "1", "-t", "4", "-i", main_img,
    "-loop", "1", "-t", "5", "-i", os.path.join(src_dir, "02_personal_transacciones.png"),
    "-loop", "1", "-t", "6", "-i", os.path.join(src_dir, "03_personal_categorias.png"),
    "-loop", "1", "-t", "6", "-i", os.path.join(src_dir, "04_empresarial_dashboard.png"),
    "-loop", "1", "-t", "9", "-i", os.path.join(out_dir.replace("v3", "v2"), "ad_v2_04_lead_magnet.png"),
    "-i", music_path,
    "-filter_complex", filter_complex,
    "-map", "[vout]",
    "-map", "5:a",
    "-c:v", "libx264", "-preset", "medium", "-crf", "18",
    "-c:a", "aac", "-b:a", "128k",
    "-r", "30", "-t", "30",
    "-shortest",
    os.path.join(out_dir, "cap_finanzas_pro_ad_30s_music.mp4")
]

result = subprocess.run(cmd, capture_output=True, text=True)
if result.returncode == 0:
    print("Created: cap_finanzas_pro_ad_30s_music.mp4")
else:
    print("Error:", result.stderr[-500:])
