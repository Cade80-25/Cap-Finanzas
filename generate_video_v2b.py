import subprocess
import os

out_dir = "C:/Users/USUARIO/Projects/Cap-Finanzas-repo/public/ads/v2"
os.makedirs(out_dir, exist_ok=True)

# Create video with fade transitions between pre-rendered images
# Images already have text overlays from Pillow

filter_complex = (
    "[0:v]scale=1080:1080,format=yuv420p,trim=duration=5,setpts=PTS-STARTPTS[v0];"
    "[1:v]scale=1080:1080,format=yuv420p,trim=duration=5,setpts=PTS-STARTPTS[v1];"
    "[2:v]scale=1080:1080,format=yuv420p,trim=duration=5,setpts=PTS-STARTPTS[v2];"
    "[3:v]scale=1080:1080,format=yuv420p,trim=duration=5,setpts=PTS-STARTPTS[v3];"
    "[v0][v1]xfade=transition=fade:duration=0.5:offset=4.5[x01];"
    "[x01][v2]xfade=transition=fade:duration=0.5:offset=9[x012];"
    "[x012][v3]xfade=transition=fade:duration=0.5:offset=13.5[x0123]"
)

cmd = [
    "ffmpeg", "-y",
    "-loop", "1", "-t", "5", "-i", os.path.join(out_dir, "ad_v2_01_hook.png"),
    "-loop", "1", "-t", "5", "-i", os.path.join(out_dir, "ad_v2_02_before_after.png"),
    "-loop", "1", "-t", "5", "-i", os.path.join(out_dir, "ad_v2_03_social_proof.png"),
    "-loop", "1", "-t", "5", "-i", os.path.join(out_dir, "ad_v2_04_lead_magnet.png"),
    "-filter_complex", filter_complex,
    "-map", "[x0123]",
    "-c:v", "libx264", "-preset", "medium", "-crf", "23",
    "-r", "30", "-t", "18",
    os.path.join(out_dir, "cap_finanzas_ad_v2_18s.mp4")
]

result = subprocess.run(cmd, capture_output=True, text=True)
if result.returncode == 0:
    print("Video created: cap_finanzas_ad_v2_18s.mp4")
else:
    print("Error:", result.stderr[-500:])
