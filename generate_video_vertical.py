import subprocess
import os

out_dir = "C:/Users/USUARIO/Projects/Cap-Finanzas-repo/public/ads/v2"
os.makedirs(out_dir, exist_ok=True)

# Create vertical video (9:16) for Stories/Reels/TikTok
# Using the stories image with Ken Burns effect (slow zoom)

cmd = [
    "ffmpeg", "-y",
    "-loop", "1", "-t", "15", "-i", os.path.join(out_dir, "ad_v2_05_stories.png"),
    "-filter_complex",
    "[0:v]scale=1080:1920,format=yuv420p,zoompan=z='min(zoom+0.0015,1.5)':d=450:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)',trim=duration=15,setpts=PTS-STARTPTS[vout]",
    "-map", "[vout]",
    "-c:v", "libx264", "-preset", "medium", "-crf", "23",
    "-r", "30", "-t", "15",
    os.path.join(out_dir, "cap_finanzas_stories_15s.mp4")
]

result = subprocess.run(cmd, capture_output=True, text=True)
if result.returncode == 0:
    print("Video created: cap_finanzas_stories_15s.mp4")
else:
    print("Error:", result.stderr[-300:])
