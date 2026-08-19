import os
from PIL import Image

def process_ground_crash():
    img_path = r'C:\Users\yerry\.gemini\antigravity-ide\brain\3096edf1-97e0-4f97-81a9-5b5afc5277d8\.tempmediaStorage\media_3096edf1-97e0-4f97-81a9-5b5afc5277d8_1786242096750.png'
    img = Image.open(img_path).convert('RGB')
    width, height = img.size
    print(f"Loaded image: {img_path}, size: {width}x{height}")
    
    rgba = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    pixels_in = img.load()
    pixels_out = rgba.load()
    
    # We want to extract the vector artwork in the center of the image.
    # The house/plane are dark grey/black, the explosion is orange, and background is white.
    for y in range(height):
        for x in range(width):
            r, g, b = pixels_in[x, y]
            
            # Exclude top and bottom chrome (VectorStock header/footer)
            if y < height * 0.08 or y > height * 0.90:
                continue
                
            is_graphic = False
            # Dark grey / black house & plane (r < 90, g < 90, b < 90)
            if r < 100 and g < 100 and b < 100:
                is_graphic = True
            # Orange explosion burst (r > 190, 40 < g < 160, b < 70)
            elif r > 180 and 40 < g < 160 and b < 80:
                is_graphic = True
                
            if is_graphic:
                pixels_out[x, y] = (255, 255, 255, 255)
                
    bbox = rgba.getbbox()
    print(f"Bounding box: {bbox}")
    if bbox:
        cropped = rgba.crop(bbox)
        
        pad = 30
        padded = Image.new('RGBA', (cropped.width + pad*2, cropped.height + pad*2), (0, 0, 0, 0))
        padded.paste(cropped, (pad, pad))
        
        output_dir = r't:\AI\Aviation History\Website\public\icons'
        os.makedirs(output_dir, exist_ok=True)
        out_path = os.path.join(output_dir, 'ground_fatality_house_crash.png')
        padded.save(out_path, 'PNG')
        print(f"Saved clean ground fatality house crash icon to {out_path} (size: {padded.size})")

if __name__ == '__main__':
    process_ground_crash()
