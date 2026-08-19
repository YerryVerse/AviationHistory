import os
from PIL import Image

src_path = r"C:\Users\yerry\.gemini\antigravity-ide\brain\4c2589d0-e6d5-4d1d-8cd5-d6305f81bbc3\civilian_passenger_helicopter_imagen3_hero_1786248929123.png"
dest_path = r"t:\AI\Aviation History\Website\public\icons\passenger_helicopter_hero.png"

if os.path.exists(src_path):
    img = Image.open(src_path).convert("RGBA")
    
    # 1. Flip horizontally so it faces RIGHT
    flipped = img.transpose(Image.FLIP_LEFT_RIGHT)
    
    # 2. Make black background transparent
    datas = flipped.getdata()
    newData = []
    for item in datas:
        r, g, b, a = item
        if r < 40 and g < 40 and b < 40:
            newData.append((0, 0, 0, 0))
        else:
            newData.append((255, 255, 255, 255))
            
    flipped.putdata(newData)
    
    # 3. Crop tightly with padding
    bbox = flipped.getbbox()
    if bbox:
        cropped = flipped.crop((max(0, bbox[0] - 10), max(0, bbox[1] - 10), min(flipped.width, bbox[2] + 10), min(flipped.height, bbox[3] + 10)))
        cropped.save(dest_path, "PNG")
        print(f"CIVILIAN HELICOPTER HERO ICON SAVED: {dest_path} (Size: {cropped.size})")
