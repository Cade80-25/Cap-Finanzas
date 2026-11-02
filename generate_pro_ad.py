import subprocess
import os

out_dir = "C:/Users/USUARIO/Projects/Cap-Finanzas-repo/public/ads/v3"
src_dir = "C:/Users/USUARIO/Desktop/CAP-FINANZAS/Promo y Marketing/capturas_estudio"
os.makedirs(out_dir, exist_ok=True)

# Create a professional 30s ad video with advanced animations
# Structure: Hook(0-3s) -> Problem(3-8s) -> Solution(8-18s) -> Benefit(18-24s) -> CTA(24-30s)

# Use the personal dashboard as the main visual with zoom/pan effects
main_img = os.path.join(src_dir, "01_personal_dashboard.png")

# Build a complex filter with multiple effects
filter_complex = (
    # Input 0: Main dashboard image with Ken Burns zoom
    "[0:v]scale=1920:1080,format=yuv420p,zoompan=z='min(zoom+0.002,1.3)':d=90:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)',trim=duration=3,setpts=PTS-STARTPTS[v_hook];"
    # Input 1: Transactions with pan effect
    "[1:v]scale=1920:1080,format=yuv420p,zoompan=z='1.2':x='if(lte(on,30),0,on*5)':y='ih/2-(ih/zoom/2)',trim=duration=5,setpts=PTS-STARTPTS[v_problem];"
    # Input 2: Categories with zoom
    "[2:v]scale=1920:1080,format=yuv420p,zoompan=z='min(zoom+0.0015,1.25)':d=90:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)',trim=duration=5,setpts=PTS-STARTPTS[v_solution];"
    # Input 3: Empresarial dashboard with zoom
    "[3:v]scale=1920:1080,format=yuv420p,zoompan=z='min(zoom+0.002,1.3)':d=90:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)',trim=duration=6,setpts=PTS-STARTPTS[v_benefit];"
    # Input 4: Lead magnet with zoom
    "[4:v]scale=1920:1080,format=yuv420p,zoompan=z='min(zoom+0.001,1.2)':d=90:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)',trim=duration=6,setpts=PTS-STARTPTS[v_cta];"
    # Concatenate all segments
    "[v_hook][v_problem]xfade=transition=fade:duration=0.5:offset=2.5[x01];"
    "[x01][v_solution]xfade=transition=fade:duration=0.5:offset=7[x012];"
    "[x012][v_benefit]xfade=transition=fade:duration=0.5:offset=11.5[x0123];"
    "[x0123][v_cta]xfade=transition=fade:duration=0.5:offset=17[x01234];"
    # Add text overlays with timing
    "[x01234]drawtext=text='¿Gastas sin control?':fontsize=72:fontcolor=white:x=(w-text_w)/2:y=80:enable='between(t,0,3)':fontfile='C\\:/Windows/Fonts/segoeuib.ttf',"
    "drawtext=text='No sabes a donde va tu dinero':fontsize=48:fontcolor=#fbbf24:x=(w-text_w)/2:y=160:enable='between(t,3,8)':fontfile='C\\:/Windows/Fonts/segoeui.ttf',"
    "drawtext=text='Cap Finanzas te ayuda':fontsize=64:fontcolor=#22c55e:x=(w-text_w)/2:y=80:enable='between(t,8,18)':fontfile='C\\:/Windows/Fonts/segoeuib.ttf',"
    "drawtext=text='Registra cada gasto en 5 segundos':fontsize=44:fontcolor=white:x=(w-text_w)/2:y=160:enable='between(t,8,18)':fontfile='C\\:/Windows/Fonts/segoeui.ttf',"
    "drawtext=text='Ahorra $200/mes sin esfuerzo':fontsize=64:fontcolor=#22c55e:x=(w-text_w)/2:y=80:enable='between(t,18,24)':fontfile='C\\:/Windows/Fonts/segoeuib.ttf',"
    "drawtext=text='10,000+ usuarios ya lo hacen':fontsize=44:fontcolor=white:x=(w-text_w)/2:y=160:enable='between(t,18,24)':fontfile='C\\:/Windows/Fonts/segoeui.ttf',"
    "drawtext=text='Descarga GRATIS ahora':fontsize=72:fontcolor=white:x=(w-text_w)/2:y=80:enable='between(t,24,30)':fontfile='C\\:/Windows/Fonts/segoeuib.ttf',"
    "drawtext=text='Tu dinero, tus reglas':fontsize=48:fontcolor=#c7d2fe:x=(w-text_w)/2:y=160:enable='between(t,24,30)':fontfile='C\\:/Windows/Fonts/segoeui.ttf'[vout]"
)

cmd = [
    "ffmpeg", "-y",
    "-loop", "1", "-t", "3", "-i", main_img,
    "-loop", "1", "-t", "5", "-i", os.path.join(src_dir, "02_personal_transacciones.png"),
    "-loop", "1", "-t", "5", "-i", os.path.join(src_dir, "03_personal_categorias.png"),
    "-loop", "1", "-t", "6", "-i", os.path.join(src_dir, "04_empresarial_dashboard.png"),
    "-loop", "1", "-t", "6", "-i", os.path.join(out_dir.replace("v3", "v2"), "ad_v2_04_lead_magnet.png"),
    "-filter_complex", filter_complex,
    "-map", "[vout]",
    "-c:v", "libx264", "-preset", "medium", "-crf", "20",
    "-r", "30", "-t", "30",
    os.path.join(out_dir, "cap_finanzas_pro_ad_30s.mp4")
]

result = subprocess.run(cmd, capture_output=True, text=True)
if result.returncode == 0:
    print("Created: cap_finanzas_pro_ad_30s.mp4")
else:
    print("Error:", result.stderr[-500:])
