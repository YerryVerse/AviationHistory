import os
from PIL import Image, ImageOps

src_path = r"C:\Users\yerry\.gemini\antigravity-ide\brain\3096edf1-97e0-4f97-81a9-5b5afc5277d8\airbus_a380_icon_1786231368507.png"
dst_path = r"t:\AI\Aviation History\Website\public\icons\airbus_a380.png"

img = Image.open(src_path).convert("RGBA")

# Flip horizontally so nose points to LEFT!
flipped = ImageOps.mirror(img)

datas = flipped.getdata()
newData = []
for item in datas:
    if item[0] < 45 and item[1] < 45 and item[2] < 45:
        newData.append((0, 0, 0, 0))
    else:
        newData.append((255, 255, 255, 255))

flipped.putdata(newData)
bbox = flipped.getbbox()
if bbox:
    flipped = flipped.crop(bbox)

flipped.save(dst_path, "PNG")
print(f"Airbus A380 re-processed facing LEFT: {flipped.size}")
