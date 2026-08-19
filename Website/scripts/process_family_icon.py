import os
from PIL import Image

src_path = r"C:\Users\yerry\.gemini\antigravity-ide\brain\3096edf1-97e0-4f97-81a9-5b5afc5277d8\media__1786241381587.png"
output_dir = r"t:\AI\Aviation History\Website\public\icons"
dst_path = os.path.join(output_dir, "family_survivors_hero.png")

img = Image.open(src_path).convert("RGBA")
width, height = img.size

# The image has black family figures on white background.
# We want the family figures to be WHITE (255, 255, 255, 255)
# and the white background to be TRANSPARENT (0, 0, 0, 0).
# The white outline around the children should stay transparent gap or white graphic.

# Let's inspect pixel colors and convert dark pixels to white graphic, light background pixels to transparent!
new_data = []
for item in img.getdata():
    r, g, b, a = item
    # If pixel is dark (part of the family silhouette)
    if r < 100 and g < 100 and b < 100:
        new_data.append((255, 255, 255, 255))  # White family silhouette
    else:
        new_data.append((0, 0, 0, 0))  # Transparent background & gap

img.putdata(new_data)
bbox = img.getbbox()
if bbox:
    img = img.crop(bbox)

img.save(dst_path, "PNG")
print(f"Successfully created family_survivors_hero.png! Size: {img.size}")
