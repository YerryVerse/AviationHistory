import os
from PIL import Image

def process_exact_user_image():
    img_path = r'C:\Users\yerry\.gemini\antigravity-ide\brain\3096edf1-97e0-4f97-81a9-5b5afc5277d8\media__1786242074816.png'
    
    img = Image.open(img_path).convert('RGB')
    width, height = img.size
    
    rgba = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    pixels_in = img.load()
    pixels_out = rgba.load()
    
    # Ignore 10px border around the entire image to avoid outer frame borders
    border_inset = 10
    
    for y in range(border_inset, height - border_inset):
        for x in range(border_inset, width - border_inset):
            r, g, b = pixels_in[x, y]
            
            # Non-white pixels (the graphic artwork)
            if not (r > 230 and g > 230 and b > 230):
                pixels_out[x, y] = (255, 255, 255, 255)
                
    bbox = rgba.getbbox()
    print(f"Graphic bounding box: {bbox}")
    if bbox:
        # Inset bbox slightly to trim any remaining border lines
        cropped = rgba.crop((bbox[0] + 4, bbox[1] + 4, bbox[2] - 4, bbox[3] - 4))
        
        pad = 20
        padded = Image.new('RGBA', (cropped.width + pad*2, cropped.height + pad*2), (0, 0, 0, 0))
        padded.paste(cropped, (pad, pad))
        
        output_dir = r't:\AI\Aviation History\Website\public\icons'
        os.makedirs(output_dir, exist_ok=True)
        out_path = os.path.join(output_dir, 'ground_fatality_house_crash.png')
        padded.save(out_path, 'PNG')
        print(f"CLEAN SUCCESS: Saved trimmed house crash icon to {out_path} (size: {padded.size})")

if __name__ == '__main__':
    process_exact_user_image()
