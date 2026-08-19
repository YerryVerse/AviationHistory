from PIL import Image, ImageOps

img_path = r"t:\AI\Aviation History\Website\public\icons\airbus_a380.png"
img = Image.open(img_path)

# Flip image horizontally (Left <-> Right)
flipped_img = ImageOps.mirror(img)

# Crop tight bounding box
bbox = flipped_img.getbbox()
if bbox:
    flipped_img = flipped_img.crop(bbox)

flipped_img.save(img_path, "PNG")
print("Airbus A380 flipped horizontally to face LEFT successfully!")
