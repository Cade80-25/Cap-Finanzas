import subprocess
import os

out_dir = "C:/Users/USUARIO/Projects/Cap-Finanzas-repo/public/ads/v2"
src_dir = "C:/Users/USUARIO/Desktop/CAP-FINANZAS/Promo y Marketing/capturas_estudio"
os.makedirs(out_dir, exist_ok=True)

# Personal mode demo video
# 3 images: dashboard, transacciones, categorias
personal_images = [
    ("01_personal_dashboard.png", "Dashboard Personal", "Ve todos tus gastos e ingresos"),
    ("02_personal_transacciones.png", "Transacciones", "Registra cada movimiento"),
    ("03_personal_categorias.png", "Categorias", "Organiza por tipo de gasto"),
]

# Build filter complex for personal demo
inputs = []
filter_parts = []
for i, (img, title, subtitle) in enumerate(personal_images):
    inputs.extend(["-loop", "1", "-t", "4", "-i", os.path.join(src_dir, img)])
    filter_parts.append(f"[{i}:v]scale=1080:1080,format=yuv420p,trim=duration=4,setpts=PTS-STARTPTS[v{i}]")

# Concatenate with fade
concat = f"[v0][v1]xfade=transition=fade:duration=0.5:offset=3.5[x01];[x01][v2]xfade=transition=fade:duration=0.5:offset=7[x012]"
filter_complex = ";".join(filter_parts) + ";" + concat

cmd = [
    "ffmpeg", "-y"
] + inputs + [
    "-filter_complex", filter_complex,
    "-map", "[x012]",
    "-c:v", "libx264", "-preset", "medium", "-crf", "23",
    "-r", "30", "-t", "10.5",
    os.path.join(out_dir, "cap_finanzas_demo_personal_10s.mp4")
]

result = subprocess.run(cmd, capture_output=True, text=True)
if result.returncode == 0:
    print("Created: cap_finanzas_demo_personal_10s.mp4")
else:
    print("Error:", result.stderr[-300:])

# Empresarial mode demo video
# 5 images: dashboard, libro diario, balance, mayor, resultados
empresarial_images = [
    ("04_empresarial_dashboard.png", "Dashboard Empresarial", "Control total de tu negocio"),
    ("05_empresarial_libro_diario.png", "Libro Diario", "Asientos contables"),
    ("06_empresarial_balance.png", "Balance General", "Estado financiero"),
    ("07_empresarial_libro_mayor.png", "Libro Mayor", "Cuentas detalladas"),
    ("08_empresarial_resultados.png", "Estado de Resultados", "Ganancias y perdidas"),
]

inputs = []
filter_parts = []
for i, (img, title, subtitle) in enumerate(empresarial_images):
    inputs.extend(["-loop", "1", "-t", "3.5", "-i", os.path.join(src_dir, img)])
    filter_parts.append(f"[{i}:v]scale=1080:1080,format=yuv420p,trim=duration=3.5,setpts=PTS-STARTPTS[v{i}]")

# Concatenate with fade
concat = "[v0][v1]xfade=transition=fade:duration=0.5:offset=3[x01]"
for i in range(2, len(empresarial_images)):
    concat += f";[x0{i-2}][v{i}]xfade=transition=fade:duration=0.5:offset={3 + (i-1)*3}[x0{i}]"
filter_complex = ";".join(filter_parts) + ";" + concat

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
