from PIL import Image, ImageDraw, ImageFont
import os

src_dir = "C:/Users/USUARIO/Desktop/CAP-FINANZAS/Promo y Marketing/capturas_estudio"
out_dir = "C:/Users/USUARIO/Projects/Cap-Finanzas-repo/public/ads/v2"
os.makedirs(out_dir, exist_ok=True)

font_paths = [
    "C:/Windows/Fonts/segoeuib.ttf",
    "C:/Windows/Fonts/segoeui.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
    "C:/Windows/Fonts/arial.ttf",
]
font_bold = None
font_regular = None
for fp in font_paths:
    if os.path.exists(fp):
        if "b" in fp.lower() or "bold" in fp.lower():
            if font_bold is None:
                font_bold = fp
        else:
            if font_regular is None:
                font_regular = fp
if font_bold is None:
    font_bold = font_paths[0] if os.path.exists(font_paths[0]) else None
if font_regular is None:
    font_regular = font_paths[1] if os.path.exists(font_paths[1]) else None

def create_ad_image(width, height, bg_color, headline, subheadline, cta_text, screenshot_path=None, social_proof=None):
    img = Image.new("RGB", (width, height), bg_color)
    draw = ImageDraw.Draw(img)
    
    # If screenshot provided, paste it
    if screenshot_path and os.path.exists(screenshot_path):
        scr = Image.open(screenshot_path).convert("RGB")
        # Resize screenshot to fit
        scr_w = int(width * 0.85)
        scr_h = int(scr.height * scr_w / scr.width)
        if scr_h > height * 0.55:
            scr_h = int(height * 0.55)
            scr_w = int(scr.width * scr_h / scr.height)
        scr = scr.resize((scr_w, scr_h), Image.LANCZOS)
        # Center horizontally, place in upper 60%
        x = (width - scr_w) // 2
        y = int(height * 0.08)
        img.paste(scr, (x, y))
        # Add rounded corners effect (simple border)
        draw.rectangle([x-2, y-2, x+scr_w+2, y+scr_h+2], outline="#4f46e5", width=3)
    
    # Bottom section with text
    bottom_y = int(height * 0.68)
    
    # Headline
    font_head = ImageFont.truetype(font_bold, 42) if font_bold else ImageFont.load_default()
    font_sub = ImageFont.truetype(font_regular, 26) if font_regular else ImageFont.load_default()
    font_cta = ImageFont.truetype(font_bold, 24) if font_bold else ImageFont.load_default()
    font_small = ImageFont.truetype(font_regular, 20) if font_regular else ImageFont.load_default()
    
    # Draw headline
    draw.text((width//2, bottom_y), headline, font=font_head, fill="white", anchor="mm")
    draw.text((width//2, bottom_y + 55), subheadline, font=font_sub, fill="#c7d2fe", anchor="mm")
    
    # CTA button
    btn_w, btn_h = 320, 56
    btn_x = (width - btn_w) // 2
    btn_y = bottom_y + 110
    draw.rounded_rectangle([btn_x, btn_y, btn_x + btn_w, btn_y + btn_h], radius=28, fill="#22c55e")
    draw.text((width//2, btn_y + btn_h//2), cta_text, font=font_cta, fill="white", anchor="mm")
    
    # Social proof
    if social_proof:
        draw.text((width//2, btn_y + btn_h + 40), social_proof, font=font_small, fill="#94a3b8", anchor="mm")
    
    # Brand
    draw.text((width//2, height - 30), "Cap Finanzas · Tu dinero, tus reglas", font=font_small, fill="#64748b", anchor="mm")
    
    return img

# 1. Hook ad - "¿Gastas sin control?"
img = create_ad_image(
    1080, 1080, (30, 41, 59),
    "¿Gastas sin control?",
    "Cap Finanzas te ayuda a tomar el control",
    "Descargar gratis",
    os.path.join(src_dir, "01_personal_dashboard.png"),
    "⭐ 4.8/5 · 10,000+ usuarios"
)
img.save(os.path.join(out_dir, "ad_v2_01_hook.png"))
print("Created: ad_v2_01_hook.png")

# 2. Before/After
img = Image.new("RGB", (1080, 1080), (30, 41, 59))
draw = ImageDraw.Draw(img)
font_head = ImageFont.truetype(font_bold, 48) if font_bold else ImageFont.load_default()
font_sub = ImageFont.truetype(font_regular, 28) if font_regular else ImageFont.load_default()
# Split screen
draw.rectangle([0, 0, 540, 1080], fill=(239, 68, 68))
draw.rectangle([540, 0, 1080, 1080], fill=(34, 197, 94))
draw.text((270, 200), "ANTES", font=font_head, fill="white", anchor="mm")
draw.text((810, 200), "DESPUÉS", font=font_head, fill="white", anchor="mm")
draw.text((270, 400), "Gastos sin control", font=font_sub, fill="white", anchor="mm")
draw.text((270, 450), "Sin presupuesto", font=font_sub, fill="white", anchor="mm")
draw.text((270, 500), "Sin ahorro", font=font_sub, fill="white", anchor="mm")
draw.text((810, 400), "Cada gasto registrado", font=font_sub, fill="white", anchor="mm")
draw.text((810, 450), "Presupuesto por categoría", font=font_sub, fill="white", anchor="mm")
draw.text((810, 500), "Ahorro automático", font=font_sub, fill="white", anchor="mm")
draw.text((540, 700), "Cap Finanzas", font=font_head, fill="white", anchor="mm")
draw.text((540, 760), "Tu dinero, tus reglas", font=font_sub, fill="#c7d2fe", anchor="mm")
btn_w, btn_h = 320, 56
draw.rounded_rectangle([(1080-btn_w)//2, 820, (1080-btn_w)//2+btn_w, 820+btn_h], radius=28, fill="#4f46e5")
draw.text((540, 848), "Probar gratis", font=ImageFont.truetype(font_bold, 24) if font_bold else ImageFont.load_default(), fill="white", anchor="mm")
draw.text((540, 950), "Cap Finanzas · Tu dinero, tus reglas", font=font_sub, fill="#94a3b8", anchor="mm")
img.save(os.path.join(out_dir, "ad_v2_02_before_after.png"))
print("Created: ad_v2_02_before_after.png")

# 3. Social proof
img = create_ad_image(
    1080, 1080, (30, 41, 59),
    "10,000+ usuarios confían",
    "en Cap Finanzas para controlar su dinero",
    "Únete gratis",
    os.path.join(src_dir, "04_empresarial_dashboard.png"),
    "⭐ 4.8/5 en la tienda de apps"
)
img.save(os.path.join(out_dir, "ad_v2_03_social_proof.png"))
print("Created: ad_v2_03_social_proof.png")

# 4. Lead magnet improved
img = Image.new("RGB", (1080, 1080), (79, 70, 229))
draw = ImageDraw.Draw(img)
font_big = ImageFont.truetype(font_bold, 60) if font_bold else ImageFont.load_default()
font_med = ImageFont.truetype(font_regular, 32) if font_regular else ImageFont.load_default()
font_cta = ImageFont.truetype(font_bold, 28) if font_bold else ImageFont.load_default()
draw.text((540, 200), "GUÍA GRATUITA", font=font_big, fill="white", anchor="mm")
draw.text((540, 290), "Finanzas Personales", font=font_big, fill="#c7d2fe", anchor="mm")
# Bullet points
bullets = ["✓ Regla 50/30/20", "✓ Fondo de emergencia", "✓ Presupuesto mensual", "✓ Manejo de deudas"]
for i, b in enumerate(bullets):
    draw.text((540, 420 + i*60), b, font=font_med, fill="white", anchor="mm")
# CTA button
btn_w, btn_h = 400, 64
draw.rounded_rectangle([(1080-btn_w)//2, 720, (1080-btn_w)//2+btn_w, 720+btn_h], radius=32, fill="#22c55e")
draw.text((540, 752), "Descargar ahora", font=font_cta, fill="white", anchor="mm")
draw.text((540, 830), "Sin registro · 100% gratis", font=font_med, fill="#a5b4fc", anchor="mm")
draw.text((540, 950), "Cap Finanzas · Tu dinero, tus reglas", font=font_med, fill="#64748b", anchor="mm")
img.save(os.path.join(out_dir, "ad_v2_04_lead_magnet.png"))
print("Created: ad_v2_04_lead_magnet.png")

# 5. Stories format (1080x1920)
img = Image.new("RGB", (1080, 1920), (30, 41, 59))
draw = ImageDraw.Draw(img)
font_head = ImageFont.truetype(font_bold, 56) if font_bold else ImageFont.load_default()
font_sub = ImageFont.truetype(font_regular, 32) if font_regular else ImageFont.load_default()
font_cta = ImageFont.truetype(font_bold, 32) if font_bold else ImageFont.load_default()
# Screenshot
scr = Image.open(os.path.join(src_dir, "01_personal_dashboard.png")).convert("RGB")
scr_w = 900
scr_h = int(scr.height * scr_w / scr.width)
scr = scr.resize((scr_w, scr_h), Image.LANCZOS)
img.paste(scr, ((1080-scr_w)//2, 200))
draw.text((540, 100), "¿Gastas sin control?", font=font_head, fill="white", anchor="mm")
draw.text((540, scr_h + 280), "Cap Finanzas", font=font_head, fill="#4f46e5", anchor="mm")
draw.text((540, scr_h + 340), "Tu dinero, tus reglas", font=font_sub, fill="#c7d2fe", anchor="mm")
btn_w, btn_h = 400, 64
draw.rounded_rectangle([(1080-btn_w)//2, scr_h + 420, (1080-btn_w)//2+btn_w, scr_h + 420 + btn_h], radius=32, fill="#22c55e")
draw.text((540, scr_h + 452), "Descargar gratis", font=font_cta, fill="white", anchor="mm")
draw.text((540, 1850), "Cap Finanzas", font=font_sub, fill="#64748b", anchor="mm")
img.save(os.path.join(out_dir, "ad_v2_05_stories.png"))
print("Created: ad_v2_05_stories.png")

# 6. Banner 1200x628
img = Image.new("RGB", (1200, 628), (30, 41, 59))
draw = ImageDraw.Draw(img)
font_head = ImageFont.truetype(font_bold, 44) if font_bold else ImageFont.load_default()
font_sub = ImageFont.truetype(font_regular, 24) if font_regular else ImageFont.load_default()
font_cta = ImageFont.truetype(font_bold, 22) if font_bold else ImageFont.load_default()
# Screenshot on right
scr = Image.open(os.path.join(src_dir, "01_personal_dashboard.png")).convert("RGB")
scr_h = 500
scr_w = int(scr.width * scr_h / scr.height)
scr = scr.resize((scr_w, scr_h), Image.LANCZOS)
img.paste(scr, (700, 64))
draw.text((300, 180), "¿Gastas sin control?", font=font_head, fill="white", anchor="mm")
draw.text((300, 240), "Cap Finanzas te ayuda", font=font_sub, fill="#c7d2fe", anchor="mm")
draw.text((300, 280), "a tomar el control", font=font_sub, fill="#c7d2fe", anchor="mm")
btn_w, btn_h = 240, 48
draw.rounded_rectangle([(300-btn_w//2), 360, (300-btn_w//2)+btn_w, 360+btn_h], radius=24, fill="#22c55e")
draw.text((300, 384), "Descargar gratis", font=font_cta, fill="white", anchor="mm")
draw.text((300, 480), "⭐ 4.8/5 · 10,000+ usuarios", font=font_sub, fill="#94a3b8", anchor="mm")
img.save(os.path.join(out_dir, "ad_v2_06_banner.png"))
print("Created: ad_v2_06_banner.png")

print("All v2 ad images created successfully")
