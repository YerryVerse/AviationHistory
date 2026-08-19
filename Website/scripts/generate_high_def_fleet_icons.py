import os
import math
from PIL import Image, ImageDraw

def create_high_res_canvas(width=2048, height=1024):
    return Image.new('RGBA', (width, height), (0, 0, 0, 0))

def catmull_rom_spline(pts, num_samples=30):
    """Generate smooth interpolated curve points from control points."""
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
        print(f"HIGH-DEF ASSET SAVED: {filepath} (Size: {cropped.size})")

def generate_cessna_propeller_icon():
    img = create_high_res_canvas(2048, 1024)
    draw = ImageDraw.Draw(img)
    white = (255, 255, 255, 255)
    
    # Realistic Cessna 172 Side Profile Facing Right
    # 1. Propeller spinning disk & blades at nose (x=1860)
    draw.ellipse([1850, 160, 1890, 860], fill=(255, 255, 255, 170))
    draw.polygon([(1820, 512), (1890, 200), (1870, 512), (1890, 824)], fill=(255, 255, 255, 220))
    # Spinner cone
    draw.polygon([(1780, 512), (1860, 465), (1885, 512), (1860, 559)], fill=white)
    
    # 2. Cessna 172 Fuselage Silhouette (smooth curve contour)
    fuselage_ctrl = [
        (1860, 512), (1800, 450), (1650, 410), (1450, 390),
        (1200, 320), (950, 310), (700, 310), (450, 420),
        (220, 460), (150, 240), (80, 240), (110, 490),
        (30, 510), (30, 550), (110, 570), (220, 600),
        (450, 590), (700, 580), (1100, 580), (1500, 580),
        (1750, 560), (1860, 512)
    ]
    smooth_fuselage = catmull_rom_spline(fuselage_ctrl, num_samples=25)
    draw.polygon(smooth_fuselage, fill=white)
    
    # 3. High Wing Mounted Above Cabin
    wing_pts = [
        (550, 300), (1350, 290), (1310, 350), (520, 360)
    ]
    draw.polygon(wing_pts, fill=white)
    
    # Wing Strut angled down to fuselage
    draw.line([(880, 350), (1020, 580)], fill=white, width=24)
    
    # 4. Tail Horizontal Stabilizer Elevator
    draw.polygon([(40, 490), (290, 490), (260, 545), (20, 545)], fill=white)
    
    # 5. Fixed Tricycle Landing Gear
    # Main Gear Strut & Wheel
    draw.line([(1000, 580), (970, 750)], fill=white, width=28)
    draw.ellipse([910, 730, 1020, 840], fill=white)
    
    # Nose Wheel Strut & Wheel
    draw.line([(1600, 570), (1580, 730)], fill=white, width=24)
    draw.ellipse([1540, 720, 1630, 810], fill=white)
    
    downscale_and_save(img, r't:\AI\Aviation History\Website\public\icons\cessna_propeller_hero.png')

def generate_airbus_a380_jet_icon():
    img = create_high_res_canvas(2048, 1024)
    draw = ImageDraw.Draw(img)
    white = (255, 255, 255, 255)
    
    # Airbus A380 Passenger Jet Facing Right
    fuselage_ctrl = [
        (1960, 512), (1920, 400), (1800, 320), (1500, 320),
        (1000, 320), (500, 320), (280, 320), (280, 80),
        (120, 80), (180, 320), (60, 320), (10, 410),
        (10, 480), (80, 490), (280, 490), (600, 490),
        (1000, 490), (1500, 500), (1820, 520), (1960, 512)
    ]
    smooth_fuselage = catmull_rom_spline(fuselage_ctrl, num_samples=25)
    draw.polygon(smooth_fuselage, fill=white)
    
    # Swept Main Wings
    wing_pts = [
        (700, 480), (1250, 480), (950, 780), (620, 750)
    ]
    draw.polygon(wing_pts, fill=white)
    
    # Underwing Jet Engines
    draw.ellipse([1050, 680, 1180, 740], fill=white)
    draw.line([(1080, 620), (1110, 480)], fill=white, width=32)
    
    draw.ellipse([880, 710, 990, 760], fill=white)
    draw.line([(900, 650), (930, 480)], fill=white, width=28)
    
    # Horizontal Tail Stabilizer
    draw.polygon([(30, 440), (260, 440), (180, 500), (0, 500)], fill=white)
    
    downscale_and_save(img, r't:\AI\Aviation History\Website\public\icons\airbus_a380_jet_hero.png')

def generate_passenger_helicopter_icon():
    img = create_high_res_canvas(2048, 1024)
    draw = ImageDraw.Draw(img)
    white = (255, 255, 255, 255)
    
    # Eurocopter Passenger Helicopter Facing Right
    # Main Rotor Disc & Mast
    draw.rectangle([1040, 90, 1120, 240], fill=white)
    draw.line([(80, 90), (1960, 90)], fill=white, width=36)
    
    fuselage_ctrl = [
        (1780, 512), (1750, 340), (1480, 230), (1180, 230),
        (950, 230), (300, 390), (150, 240), (80, 240),
        (110, 470), (40, 470), (40, 560), (150, 560),
        (950, 560), (1180, 560), (1480, 600), (1720, 570), (1780, 512)
    ]
    smooth_fuselage = catmull_rom_spline(fuselage_ctrl, num_samples=25)
    draw.polygon(smooth_fuselage, fill=white)
    
    # Tail Fenestron Rotor Ring
    draw.ellipse([60, 340, 220, 500], outline=white, width=24)
    draw.line([(140, 240), (140, 510)], fill=white, width=28)
    
    # Tubular Skids
    draw.line([(550, 750), (1620, 750)], fill=white, width=44)
    draw.line([(1620, 750), (1760, 640)], fill=white, width=44)
    draw.line([(760, 560), (720, 750)], fill=white, width=32)
    draw.line([(1320, 560), (1280, 750)], fill=white, width=32)
    
    downscale_and_save(img, r't:\AI\Aviation History\Website\public\icons\passenger_helicopter_hero.png')

def generate_modern_glider_icon():
    img = create_high_res_canvas(2048, 1024)
    draw = ImageDraw.Draw(img)
    white = (255, 255, 255, 255)
    
    # Sailplane Glider Facing Right
    fuselage_ctrl = [
        (1970, 512), (1920, 420), (1750, 380), (1480, 380),
        (580, 450), (190, 220), (100, 220), (140, 450),
        (50, 470), (50, 510), (140, 520), (580, 510),
        (1000, 510), (1600, 520), (1880, 520), (1970, 512)
    ]
    smooth_fuselage = catmull_rom_spline(fuselage_ctrl, num_samples=25)
    draw.polygon(smooth_fuselage, fill=white)
    
    # High-Aspect Ratio Wings
    wing_pts = [
        (1050, 380), (1420, 380), (1150, 660), (920, 620)
    ]
    draw.polygon(wing_pts, fill=white)
    
    # T-Tail Stabilizer
    draw.polygon([(30, 220), (280, 220), (230, 260), (10, 260)], fill=white)
    
    downscale_and_save(img, r't:\AI\Aviation History\Website\public\icons\modern_glider_hero.png')

if __name__ == '__main__':
    generate_cessna_propeller_icon()
    generate_airbus_a380_jet_icon()
    generate_passenger_helicopter_icon()
    generate_modern_glider_icon()

