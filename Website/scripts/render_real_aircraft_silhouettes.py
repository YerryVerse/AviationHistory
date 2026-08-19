import os
import math
from PIL import Image, ImageDraw, ImageFilter

def create_high_res_canvas(width=2048, height=1024):
    return Image.new('RGBA', (width, height), (0, 0, 0, 0))

def catmull_rom_spline(pts, num_samples=50):
    """Generate ultra-smooth interpolated curve points from control points."""
    curve_pts = []
    n = len(pts)
    if n < 4:
        return pts
    for i in range(n - 1):
        p0 = pts[i - 1] if i > 0 else pts[i]
        p1 = pts[i]
        p2 = pts[i + 1]
        p3 = pts[i + 2] if i + 2 < n else p2

        for t_idx in range(num_samples):
            t = t_idx / float(num_samples)
            t2 = t * t
            t3 = t2 * t

            x = 0.5 * ((2 * p1[0]) +
                       (-p0[0] + p2[0]) * t +
                       (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
                       (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3)

            y = 0.5 * ((2 * p1[1]) +
                       (-p0[1] + p2[1]) * t +
                       (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
                       (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)

            curve_pts.append((int(x), int(y)))
    return curve_pts

def downscale_and_save(img, filepath):
    # Downscale with LANCZOS 4x supersampling for flawless anti-aliased edges
    w, h = img.size
    final_img = img.resize((w // 2, h // 2), Image.Resampling.LANCZOS)
    
    # Trim bounding box
    bbox = final_img.getbbox()
    if bbox:
        cropped = final_img.crop((max(0, bbox[0] - 12), max(0, bbox[1] - 12), min(final_img.width, bbox[2] + 12), min(final_img.height, bbox[3] + 12)))
        output_dir = os.path.dirname(filepath)
        os.makedirs(output_dir, exist_ok=True)
        cropped.save(filepath, 'PNG')
        print(f"ULTRA-HIGH-DEF ASSET SAVED: {filepath} (Size: {cropped.size})")

def generate_cessna_propeller_icon():
    img = create_high_res_canvas(2048, 1024)
    draw = ImageDraw.Draw(img)
    white = (255, 255, 255, 255)
    
    # Cessna 172 Skyhawk Side Profile Facing Right
    # Spinner cone at x=1820, y=512
    draw.ellipse([1830, 160, 1870, 860], fill=(255, 255, 255, 160))
    draw.polygon([(1800, 512), (1870, 200), (1850, 512), (1870, 824)], fill=(255, 255, 255, 220))
    # Spinner Cone
    draw.polygon([(1760, 512), (1840, 465), (1865, 512), (1840, 559)], fill=white)
    
    # Cessna 172 Fuselage Contour (Smooth spline)
    fuselage_ctrl = [
        (1840, 512), (1780, 440), (1600, 410), (1400, 385),
        (1200, 315), (950, 310), (700, 310), (450, 410),
        (220, 450), (150, 230), (80, 230), (105, 485),
        (20, 505), (20, 545), (105, 565), (220, 595),
        (450, 585), (700, 575), (1100, 575), (1500, 575),
        (1730, 555), (1840, 512)
    ]
    smooth_fuselage = catmull_rom_spline(fuselage_ctrl, num_samples=40)
    draw.polygon(smooth_fuselage, fill=white)
    
    # High Wing
    wing_pts = [
        (520, 295), (1380, 285), (1340, 345), (490, 355)
    ]
    draw.polygon(wing_pts, fill=white)
    
    # Wing Strut
    draw.line([(880, 345), (1020, 575)], fill=white, width=22)
    
    # Horizontal Elevator
    draw.polygon([(30, 485), (280, 485), (250, 540), (15, 540)], fill=white)
    
    # Fixed Tricycle Gear
    # Main Wheels & Strut
    draw.line([(1000, 575), (970, 750)], fill=white, width=26)
    draw.ellipse([910, 730, 1010, 830], fill=white)
    
    # Nose Wheel & Strut
    draw.line([(1580, 570), (1560, 730)], fill=white, width=22)
    draw.ellipse([1520, 720, 1600, 800], fill=white)
    
    downscale_and_save(img, r't:\AI\Aviation History\Website\public\icons\cessna_propeller_hero.png')

def generate_airbus_a380_jet_icon():
    img = create_high_res_canvas(2048, 1024)
    draw = ImageDraw.Draw(img)
    white = (255, 255, 255, 255)
    
    fuselage_ctrl = [
        (1960, 512), (1920, 400), (1800, 320), (1500, 320),
        (1000, 320), (500, 320), (280, 320), (280, 80),
        (120, 80), (180, 320), (60, 320), (10, 410),
        (10, 480), (80, 490), (280, 490), (600, 490),
        (1000, 490), (1500, 500), (1820, 520), (1960, 512)
    ]
    smooth_fuselage = catmull_rom_spline(fuselage_ctrl, num_samples=40)
    draw.polygon(smooth_fuselage, fill=white)
    
    wing_pts = [
        (700, 480), (1250, 480), (950, 780), (620, 750)
    ]
    draw.polygon(wing_pts, fill=white)
    
    draw.ellipse([1050, 680, 1180, 740], fill=white)
    draw.line([(1080, 620), (1110, 480)], fill=white, width=32)
    
    draw.ellipse([880, 710, 990, 760], fill=white)
    draw.line([(900, 650), (930, 480)], fill=white, width=28)
    
    draw.polygon([(30, 440), (260, 440), (180, 500), (0, 500)], fill=white)
    
    downscale_and_save(img, r't:\AI\Aviation History\Website\public\icons\airbus_a380_jet_hero.png')

def generate_passenger_helicopter_icon():
    img = create_high_res_canvas(2048, 1024)
    draw = ImageDraw.Draw(img)
    white = (255, 255, 255, 255)
    
    draw.rectangle([1040, 90, 1120, 240], fill=white)
    draw.line([(80, 90), (1960, 90)], fill=white, width=36)
    
    fuselage_ctrl = [
        (1780, 512), (1750, 340), (1480, 230), (1180, 230),
        (950, 230), (300, 390), (150, 240), (80, 240),
        (110, 470), (40, 470), (40, 560), (150, 560),
        (950, 560), (1180, 560), (1480, 600), (1720, 570), (1780, 512)
    ]
    smooth_fuselage = catmull_rom_spline(fuselage_ctrl, num_samples=40)
    draw.polygon(smooth_fuselage, fill=white)
    
    draw.ellipse([60, 340, 220, 500], outline=white, width=24)
    draw.line([(140, 240), (140, 510)], fill=white, width=28)
    
    draw.line([(550, 750), (1620, 750)], fill=white, width=44)
    draw.line([(1620, 750), (1760, 640)], fill=white, width=44)
    draw.line([(760, 560), (720, 750)], fill=white, width=32)
    draw.line([(1320, 560), (1280, 750)], fill=white, width=32)
    
    downscale_and_save(img, r't:\AI\Aviation History\Website\public\icons\passenger_helicopter_hero.png')

def generate_modern_glider_icon():
    img = create_high_res_canvas(2048, 1024)
    draw = ImageDraw.Draw(img)
    white = (255, 255, 255, 255)
    
    fuselage_ctrl = [
        (1970, 512), (1920, 420), (1750, 380), (1480, 380),
        (580, 450), (190, 220), (100, 220), (140, 450),
        (50, 470), (50, 510), (140, 520), (580, 510),
        (1000, 510), (1600, 520), (1880, 520), (1970, 512)
    ]
    smooth_fuselage = catmull_rom_spline(fuselage_ctrl, num_samples=40)
    draw.polygon(smooth_fuselage, fill=white)
    
    wing_pts = [
        (1050, 380), (1420, 380), (1150, 660), (920, 620)
    ]
    draw.polygon(wing_pts, fill=white)
    
    draw.polygon([(30, 220), (280, 220), (230, 260), (10, 260)], fill=white)
    
    downscale_and_save(img, r't:\AI\Aviation History\Website\public\icons\modern_glider_hero.png')

if __name__ == '__main__':
    generate_cessna_propeller_icon()
    generate_airbus_a380_jet_icon()
    generate_passenger_helicopter_icon()
    generate_modern_glider_icon()
