import os
from PIL import Image

def process_no_frame():
    img_path = r'C:\Users\yerry\.gemini\antigravity-ide\brain\3096edf1-97e0-4f97-81a9-5b5afc5277d8\media__1786242074816.png'
    img = Image.open(img_path).convert('RGB')
    width, height = img.size
    print(f"Loaded original image: {width}x{height}")
    
    # Create RGBA image
    rgba = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    pixels_in = img.load()
    pixels_out = rgba.load()
    
    # 1. First convert non-white pixels to white (255, 255, 255, 255)
    for y in range(height):
        for x in range(width):
            r, g, b = pixels_in[x, y]
            # Graphic content is dark grey / black (house/plane) or orange (explosion)
            # Background is white
            if not (r > 220 and g > 220 and b > 220):
                pixels_out[x, y] = (255, 255, 255, 255)
                
    # Bounding box of all graphic content (including outer square frame)
    bbox = rgba.getbbox()
    print(f"Outer bbox (with frame): {bbox}")
    
    # The outer white frame in media__1786242074816.png is a box around the artwork.
    # To remove the outer square frame:
    # We find the inner content by inseting past the 30-40px outer frame width!
    
    # Let's inspect where the outer frame lines are located.
    # The outer frame is around (50, 50, 720, 580)
    # Inside the frame is a white margin gap before the artwork starts!
    # So if we clear pixels that belong to the outer boundary box (or keep only content inside frame),
    # let's crop inside the outer frame:
    
    x1, y1, x2, y2 = bbox
    
    # Clear the outer frame border lines (approx 25px thick around perimeter of bbox)
    frame_thickness = 35
    
    no_frame = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    nf_pixels = no_frame.load()
    
    for y in range(y1 + frame_thickness, y2 - frame_thickness):
        for x in range(x1 + frame_thickness, x2 - frame_thickness):
            if pixels_out[x, y][3] > 0:
                # Also exclude bottom VectorStock text band if any
                if y > height * 0.88:
                    continue
                nf_pixels[x, y] = (255, 255, 255, 255)
                
    inner_bbox = no_frame.getbbox()
    print(f"Inner artwork bbox (no frame): {inner_bbox}")
    
    if inner_bbox:
        cropped = no_frame.crop(inner_bbox)
        
        pad = 20
        padded = Image.new('RGBA', (cropped.width + pad*2, cropped.height + pad*2), (0, 0, 0, 0))
        padded.paste(cropped, (pad, pad))
        
        output_dir = r't:\AI\Aviation History\Website\public\icons'
        os.makedirs(output_dir, exist_ok=True)
        out_path = os.path.join(output_dir, 'ground_fatality_house_crash.png')
        padded.save(out_path, 'PNG')
        print(f"FRAMELESS SUCCESS: Saved pure artwork to {out_path} (size: {padded.size})")

if __name__ == '__main__':
    process_no_frame()
