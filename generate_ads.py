from PIL import Image, ImageDraw, ImageFont
import os

src_dir = "C:/Users/USUARIO/Desktop/CAP-FINANZAS/Promo y Marketing/capturas_estudio"
out_dir = "C:/Users/USUARIO/Projects/Cap-Finanzas-repo/public/ads"
os.makedirs(out_dir, exist_ok=True)

# Try to find a font
font_paths = [
    "C:/Windows/Fonts/segoeui.ttf",
    "C:/Windows/Fonts/arial.ttf",
    "C:/Windows/Fonts/calibri.ttf",
]
font_path = None
for fp in font_paths:
    if os.path.exists(fp):
        font_path = fp
        break

def add_overlay(img_path, title, subtitle, output_name):
    img = Image.open(img_path).convert("RGB")
    # Resize to 1080x1080
    img = img.resize((1080, 1080), Image.LANCZOS)
    draw = ImageDraw.Draw(img)
    
    # Dark overlay at bottom
    overlay = Image.new("RGBA", (1080, 300), (0, 0, 0, 180))
    img.paste(overlay, (0, 780), overlay)
    
    # Text
    font_title = ImageFont.truetype(font_path, 48) if font_path else ImageFont.load_default()
    font_sub = ImageFont.truetype(font_path, 28) if font_path else ImageFont.load_default()
    
    draw.text((540, 820), title, font=font_title, fill="white", anchor="mm")
    draw.text((540, 880), subtitle, font=font_sub, fill="#c7d2fe", anchor="mm")
    
    # Brand
    draw.text((540, 980), "Cap Finanzas · Tu dinero, tus reglas", font=font_sub, fill="#94a3b8", anchor="mm")
    
    img.save(os.path.join(out_dir, output_name))
    print(f"Created: {output_name}")

# Create ad images
add_overlay(
    os.path.join(src_dir, "01_personal_dashboard.png"),
    "Tu dinero, tus reglas",
    "Controla tus finanzas personales",
    "ad_01_dashboard.png"
)

add_overlay(
    os.path.join(src_dir, "04_empresarial_dashboard.png"),
    "Contabilidad profesional",
    "Para tu negocio o empresa",
    "ad_02_empresarial.png"
)

add_overlay(
    os.path.join(src_dir, "02_personal_transacciones.png"),
    "Registra cada gasto",
    "Sin complicaciones",
    "ad_03_transacciones.png"
)

# Lead magnet image
img = Image.new("RGB", (1080, 1080), (79, 70, 229))
draw = ImageDraw.Draw(img)
font_big = ImageFont.truetype(font_path, 56) if font_path else ImageFont.load_default()
font_med = ImageFont.truetype(font_path, 36) if font_path else ImageFont.load_default()
draw.text((540, 300), "GUÍA GRATUITA", font=font_big, fill="white", anchor="mm")
draw.text((540, 400), "Finanzas Personales", font=font_big, fill="#c7d2fe", anchor="mm")
draw.text((540, 520), "Aprende a ahorrar, invertir y", font=font_med, fill="white", anchor="mm")
draw.text((540, 570), "planificar tu futuro financiero", font=font_med, fill="white", anchor="mm")
draw.text((540, 750), "Descarga ahora en capfinanzas.com", font=font_med, fill="#94a3b8", anchor="mm")
img.save(os.path.join(out_dir, "ad_04_lead_magnet.png"))
print("Created: ad_04_lead_magnet.png")

print("All ad images created successfully")
