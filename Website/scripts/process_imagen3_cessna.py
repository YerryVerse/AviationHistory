import os
from PIL import Image

src_path = r"C:\Users\yerry\.gemini\antigravity-ide\brain\4c2589d0-e6d5-4d1d-8cd5-d6305f81bbc3\cessna_172_imagen3_hero_1786248272499.png"
dest_path = r"t:\AI\Aviation History\Website\public\icons\cessna_propeller_hero.png"

if os.path.exists(src_path):
    img = Image.open(src_path).convert("RGBA")
    
    # 1. Flip horizontally so it faces RIGHT
    flipped = img.transpose(Image.FLIP_LEFT_RIGHT)
    
    # 2. Make black background transparent and body pure white silhouette
    datas = flipped.getdata()
    newData = []
    for item in datas:
        r, g, b, a = item
        # If color is dark background, make transparent
        if r < 40 and g < 40 and b < 40:
            newData.append((0, 0, 0, 0))
        else:
            # Solid white silhouette
            newData.append((255, 255, 255, 255))
            
    flipped.putdata(newData)
    
    # 3. Crop tightly with padding
    bbox = flipped.getbbox()
    if bbox:
        cropped = flipped.crop((max(0, bbox[0] - 10), max(0, bbox[1] - 10), min(flipped.width, bbox[2] + 10), min(flipped.height, bbox[3] + 10)))
        cropped.save(dest_path, "PNG")
        print(f"IMAGEN 3 CESSNA HERO ICON SAVED: {dest_path} (Size: {cropped.size})")

