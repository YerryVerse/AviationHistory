import os
from PIL import Image

files_config = [
    {
        "src": r"C:\Users\yerry\.gemini\antigravity-ide\brain\4c2589d0-e6d5-4d1d-8cd5-d6305f81bbc3\airbus_a380_imagen3_hero_1786248394247.png",
        "dest": r"t:\AI\Aviation History\Website\public\icons\airbus_a380_jet_hero.png",
        "flip": False,  # Already facing right
    },
    {
        "src": r"C:\Users\yerry\.gemini\antigravity-ide\brain\4c2589d0-e6d5-4d1d-8cd5-d6305f81bbc3\transport_helicopter_imagen3_hero_1786248404672.png",
        "dest": r"t:\AI\Aviation History\Website\public\icons\passenger_helicopter_hero.png",
        "flip": True,   # Facing left -> flip right
    },
    {
        "src": r"C:\Users\yerry\.gemini\antigravity-ide\brain\4c2589d0-e6d5-4d1d-8cd5-d6305f81bbc3\sailplane_glider_imagen3_hero_1786248414440.png",
        "dest": r"t:\AI\Aviation History\Website\public\icons\modern_glider_hero.png",
        "flip": True,   # Facing left -> flip right
    },
]

for cfg in files_config:
    src_path = cfg["src"]
    dest_path = cfg["dest"]
    
    if os.path.exists(src_path):
        img = Image.open(src_path).convert("RGBA")
        
        if cfg["flip"]:
            img = img.transpose(Image.FLIP_LEFT_RIGHT)
            
        datas = img.getdata()
        newData = []
        for item in datas:
            r, g, b, a = item
            if r < 40 and g < 40 and b < 40:
                newData.append((0, 0, 0, 0))
            else:
                newData.append((255, 255, 255, 255))
                
        img.putdata(newData)
        
        bbox = img.getbbox()
        if bbox:
            cropped = img.crop((max(0, bbox[0] - 10), max(0, bbox[1] - 10), min(img.width, bbox[2] + 10), min(img.height, bbox[3] + 10)))
            cropped.save(dest_path, "PNG")
            print(f"PROCESSED & SAVED: {dest_path} (Size: {cropped.size})")

print("All Imagen 3 fleet icons processed successfully!")
