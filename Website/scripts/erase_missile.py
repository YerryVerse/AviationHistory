import os
from PIL import Image

img_path = r"C:\Users\yerry\.gemini\antigravity-ide\brain\3096edf1-97e0-4f97-81a9-5b5afc5277d8\military_shotdown_icon_1786229160368.png"
dest_path = r"t:\AI\Aviation History\Website\public\icons\military_shotdown.png"

img = Image.open(img_path).convert("RGBA")
width, height = img.size

# Convert image to numpy array or pixel edit
pixels = img.load()

# Erase missile in bottom-left region:
# The missile extends from x: 150 to 350, y: 560 to 750 (where there is white disconnected from main jet body)
# Let's erase all white pixels in the bottom left region below the starburst!
for y in range(int(height * 0.52), height):
    for x in range(0, int(width * 0.35)):
        pixels[x, y] = (0, 0, 0, 255)

# Now convert dark pixels to transparent and white pixels to white RGBA
newData = []
for item in img.getdata():
    if item[0] < 45 and item[1] < 45 and item[2] < 45:
        newData.append((0, 0, 0, 0))
    else:
        newData.append((255, 255, 255, item[3]))

img.putdata(newData)
img.save(dest_path, "PNG")
print(f"Successfully erased missile and saved transparent F-16 icon to {dest_path}")
