import os
from PIL import Image

artifacts_dir = r"C:\Users\yerry\.gemini\antigravity-ide\brain\3096edf1-97e0-4f97-81a9-5b5afc5277d8"
output_dir = r"t:\AI\Aviation History\Website\public\icons"

os.makedirs(output_dir, exist_ok=True)

mappings = {
    "wright_flyer_icon_1786231291023.png": "wright_flyer.png",
    "ww1_biplane_icon_1786231305026.png": "ww1_biplane.png",
    "interwar_plane_icon_1786231318010.png": "interwar_plane.png",
    "p51_mustang_icon_1786231330078.png": "p51_mustang.png",
    "f16_falcon_icon_1786231342218.png": "f16_falcon.png",
    "boeing_747_icon_1786231355054.png": "boeing_747.png",
    "airbus_a380_icon_1786231368507.png": "airbus_a380.png",
}

for src_name, dst_name in mappings.items():
    src_path = os.path.join(artifacts_dir, src_name)
    dst_path = os.path.join(output_dir, dst_name)
    
    if os.path.exists(src_path):
        img = Image.open(src_path).convert("RGBA")
        datas = img.getdata()
        
        newData = []
        for item in datas:
            # If pixel is dark background (R,G,B all < 45), make it transparent
            if item[0] < 45 and item[1] < 45 and item[2] < 45:
                newData.append((0, 0, 0, 0))
            else:
                # White silhouette
                newData.append((255, 255, 255, 255))
        
        img.putdata(newData)
        
        # Bounding box crop
        bbox = img.getbbox()
        if bbox:
            img = img.crop(bbox)
            
        img.save(dst_path, "PNG")
        print(f"Processed {dst_name}: {img.size}")
    else:
        print(f"File not found: {src_path}")
