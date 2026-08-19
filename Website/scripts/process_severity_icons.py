import os
from PIL import Image

artifacts_dir = r"C:\Users\yerry\.gemini\antigravity-ide\brain\3096edf1-97e0-4f97-81a9-5b5afc5277d8"
output_dir = r"t:\AI\Aviation History\Website\public\icons"
os.makedirs(output_dir, exist_ok=True)

files = [
    ("survivor_hero_1786240890080.png", "survivor_hero.png"),
    ("airplane_seat_hero_1786240914691.png", "airplane_seat_hero.png"),
]

for src_name, dst_name in files:
    src_path = os.path.join(artifacts_dir, src_name)
    dst_path = os.path.join(output_dir, dst_name)
    
    if os.path.exists(src_path):
        img = Image.open(src_path).convert("RGBA")
        datas = img.getdata()
        newData = []
        for item in datas:
            # Turn dark background pixels transparent, keep white graphics
            if item[0] < 45 and item[1] < 45 and item[2] < 45:
                newData.append((0, 0, 0, 0))
            else:
                newData.append((255, 255, 255, 255))
        
        img.putdata(newData)
        bbox = img.getbbox()
        if bbox:
            img = img.crop(bbox)
        img.save(dst_path, "PNG")
        print(f"Processed {dst_name} successfully: {img.size}")
    else:
        print(f"File not found: {src_path}")
