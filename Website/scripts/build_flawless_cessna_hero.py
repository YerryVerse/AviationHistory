import os
import math
from PIL import Image, ImageDraw

def create_canvas():
    return Image.new('RGBA', (2048, 1024), (0, 0, 0, 0))

def save_hero_icon(img, filepath):
    # Downscale with 4x Lanczos for pixel-perfect anti-aliased edges
    final_img = img.resize((img.width // 2, img.height // 2), Image.Resampling.LANCZOS)
    bbox = final_img.getbbox()
    if bbox:
        cropped = final_img.crop((max(0, bbox[0] - 16), max(0, bbox[1] - 16), min(final_img.width, bbox[2] + 16), min(final_img.height, bbox[3] + 16)))
        cropped.save(filepath, 'PNG')
        print(f"FLAWLESS ASSET SAVED: {filepath} (Size: {cropped.size})")

def build_cessna_172():
    img = create_canvas()
    draw = ImageDraw.Draw(img)
    white = (255, 255, 255, 255)

    # Real Cessna 172 Skyhawk Geometry facing RIGHT
    # Nose spinner tip at x=1840, y=512
    # Tail rudder tip at x=120, y=520
    # Top of tail fin at x=180, y=240

    # 1. Fuselage Body Silhouette
    fuselage_pts = [
        # Nose spinner tip
        (1840, 512),
        (1820, 480),
        (1750, 450),  # Top engine cowl
        (1600, 420),  # Lower windshield
        (1400, 360),  # Upper windshield / cabin roof
        (850, 360),   # Rear cabin roof / wing root
        (450, 430),   # Dorsal tail fin root
        (180, 240),   # Top tip of vertical stabilizer fin
        (120, 240),   # Rear top corner of tail fin
        (140, 500),   # Rudder trailing edge
        (90, 500),    # Tail cone / stinger
        (120, 530),   # Lower tail boom
        (250, 540),   # Mid tail boom bottom
        (500, 550),   # Cabin rear bottom
        (900, 565),   # Cabin main gear attachment point
        (1300, 565),  # Lower cabin belly
        (1600, 555),  # Lower engine cowl
        (1750, 535),  # Bottom nose cowl
        (1840, 512),  # Back to spinner tip
    ]
    draw.polygon(fuselage_pts, fill=white)

    # 2. High-Wing Structure (Mounted atop cabin)
    wing_pts = [
        (520, 345),
        (1380, 340),
        (1360, 385),
        (500, 390)
    ]
    draw.polygon(wing_pts, fill=white)

    # Wing Support Strut (angled from lower fuselage up to wing)
    draw.line([(880, 385), (1050, 565)], fill=white, width=22)

    # 3. Horizontal Stabilizer / Elevator (Tail Left)
    elevator_pts = [
        (40, 500),
        (280, 500),
        (250, 535),
        (20, 535)
    ]
    draw.polygon(elevator_pts, fill=white)

    # 4. Tricycle Landing Gear (Fixed)
    # Main Landing Gear Leg & Wheel
    draw.line([(1000, 565), (960, 750)], fill=white, width=24)
    draw.ellipse([900, 730, 1000, 830], fill=white)

    # Nose Landing Gear Leg & Wheel
    draw.line([(1600, 555), (1580, 720)], fill=white, width=20)
    draw.ellipse([1530, 710, 1610, 790], fill=white)

    # 5. Pure Opaque Solid White Propeller Blades (NO blur, NO color shift!)
    # Spinner Cone
    draw.polygon([(1820, 512), (1860, 485), (1885, 512), (1860, 539)], fill=white)
    # Top Propeller Blade
    draw.polygon([(1850, 512), (1860, 200), (1875, 200), (1865, 512)], fill=white)
    # Bottom Propeller Blade
    draw.polygon([(1850, 512), (1860, 824), (1875, 824), (1865, 512)], fill=white)

    save_hero_icon(img, r't:\AI\Aviation History\Website\public\icons\cessna_propeller_hero.png')

if __name__ == '__main__':
    build_cessna_172()
