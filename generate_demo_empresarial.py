import subprocess
import os

out_dir = "C:/Users/USUARIO/Projects/Cap-Finanzas-repo/public/ads/v2"
src_dir = "C:/Users/USUARIO/Desktop/CAP-FINANZAS/Promo y Marketing/capturas_estudio"

empresarial_images = [
    "04_empresarial_dashboard.png",
    "05_empresarial_libro_diario.png",
    "06_empresarial_balance.png",
    "07_empresarial_libro_mayor.png",
    "08_empresarial_resultados.png",
]

# Build filter complex step by step
filter_parts = []
for i in range(len(empresarial_images)):
    filter_parts.append(f"[{i}:v]scale=1080:1080,format=yuv420p,trim=duration=3.5,setpts=PTS-STARTPTS[v{i}]")

# xfade chain
xfade = "[v0][v1]xfade=transition=fade:duration=0.5:offset=3[x01]"
for i in range(2, len(empresarial_images)):
    prev = f"x0{i-1}" if i > 2 else "x01"
    offset = 3 + (i-1) * 3
    xfade += f";[{prev}][v{i}]xfade=transition=fade:duration=0.5:offset={offset}[x0{i}]"

filter_complex = ";".join(filter_parts) + ";" + xfade

inputs = []
for img in empresarial_images:
    inputs.extend(["-loop", "1", "-t", "3.5", "-i", os.path.join(src_dir, img)])

cmd = [
    "ffmpeg", "-y"
] + inputs + [
    "-filter_complex", filter_complex,
    "-map", f"[x0{len(empresarial_images)-1}]",
    "-c:v", "libx264", "-preset", "medium", "-crf", "23",
    "-r", "30", "-t", "15",
    os.path.join(out_dir, "cap_finanzas_demo_empresarial_15s.mp4")
]

result = subprocess.run(cmd, capture_output=True, text=True)
if result.returncode == 0:
    print("Created: cap_finanzas_demo_empresarial_15s.mp4")
else:
    print("Error:", result.stderr[-300:])
