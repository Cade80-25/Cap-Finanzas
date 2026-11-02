import subprocess
import os

out_dir = "C:/Users/USUARIO/Projects/Cap-Finanzas-repo/public/ads"
os.makedirs(out_dir, exist_ok=True)

# Create video from images with ffmpeg
# 4 images, 3.75s each = 15s total
images = [
    "ad_01_dashboard.png",
    "ad_02_empresarial.png",
    "ad_03_transacciones.png",
    "ad_04_lead_magnet.png",
]

# Create a concat file
concat_path = os.path.join(out_dir, "concat.txt")
with open(concat_path, "w") as f:
    for img in images:
        f.write(f"file '{os.path.join(out_dir, img)}'\n")
        f.write("duration 3.75\n")
    f.write(f"file '{os.path.join(out_dir, images[-1])}'\n")

# Run ffmpeg
cmd = [
    "ffmpeg", "-y",
    "-f", "concat", "-safe", "0",
    "-i", concat_path,
    "-vf", "scale=1080:1080,format=yuv420p",
    "-c:v", "libx264", "-preset", "medium", "-crf", "23",
    "-r", "30",
    os.path.join(out_dir, "cap_finanzas_ad_15s.mp4")
]

result = subprocess.run(cmd, capture_output=True, text=True)
if result.returncode == 0:
    print("Video created: cap_finanzas_ad_15s.mp4")
else:
    print("Error:", result.stderr[:500])

# Clean up concat file
os.remove(concat_path)
