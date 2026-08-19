import os
import shutil
from PIL import Image

src_dir = r"C:\Users\yerry\.gemini\antigravity-ide\brain\3096edf1-97e0-4f97-81a9-5b5afc5277d8"
dest_dir = r"t:\AI\Aviation History\Website\public\icons"
os.makedirs(dest_dir, exist_ok=True)

files = {
    "accident_crash_icon_1786229127425.png": "accident_crash.png",
    "incident_smoke_icon_1786229145089.png": "incident_smoke.png",
    "military_shotdown_no_missile_icon_1786229227816.png": "military_shotdown.png",
}

for src_name, dest_name in files.items():
    src_path = os.path.join(src_dir, src_name)
    dest_path = os.path.join(dest_dir, dest_name)
    
    if os.path.exists(src_path):
        # Open image and convert black background to transparent
        img = Image.open(src_path).convert("RGBA")
        datas = img.getdata()
        
        newData = []
        for item in datas:
            # If color is dark background (R<40, G<40, B<40), make transparent
            if item[0] < 45 and item[1] < 45 and item[2] < 45:
                newData.append((0, 0, 0, 0))
            else:
                # Keep bright white parts pure white (255, 255, 255, 255)
                newData.append((255, 255, 255, item[3]))
        
        img.putdata(newData)
        img.save(dest_path, "PNG")
        print(f"Processed and saved: {dest_path}")

print("Done processing icons!")
