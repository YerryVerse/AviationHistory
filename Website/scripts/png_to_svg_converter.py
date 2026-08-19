import os
import math
from PIL import Image

def ramer_douglas_peucker(pts, epsilon):
    """Simplifies a 2D polyline path using Ramer-Douglas-Peucker algorithm."""
    if len(pts) < 3:
        return pts

    dmax = 0.0
    index = 0
    end = len(pts) - 1

    for i in range(1, end):
        x0, y0 = pts[i]
        x1, y1 = pts[0]
        x2, y2 = pts[end]
        
        num = abs((y2 - y1) * x0 - (x2 - x1) * y0 + x2 * y1 - y2 * x1)
        den = math.sqrt((y2 - y1) ** 2 + (x2 - x1) ** 2)
        dist = num / den if den != 0 else 0

        if dist > dmax:
            index = i
            dmax = dist

    if dmax > epsilon:
        rec1 = ramer_douglas_peucker(pts[:index + 1], epsilon)
        rec2 = ramer_douglas_peucker(pts[index:], epsilon)
        return rec1[:-1] + rec2
    else:
        return [pts[0], pts[end]]

def extract_silhouette_polygon(png_path, target_w=200):
    img = Image.open(png_path).convert("RGBA")
    w, h = img.size
    target_h = int(round(target_w * (h / float(w))))
    
    # Trace top and bottom contours column by column
    top_contour = []
    bottom_contour = []
    
    for x in range(w):
        column_pixels = [y for y in range(h) if img.getpixel((x, y))[3] > 128]
        if column_pixels:
            top_contour.append((x, min(column_pixels)))
            bottom_contour.append((x, max(column_pixels)))
            
    if not top_contour:
        return "", target_w, target_h
        
    # Combine top contour (left->right) and bottom contour (right->left) into a closed loop
    full_polygon = top_contour + list(reversed(bottom_contour))
    
    # Simplify with RDP algorithm
    simplified = ramer_douglas_peucker(full_polygon, epsilon=1.5)
    
    scale_x = target_w / float(w)
    scale_y = target_h / float(h)
    
    cmds = []
    for i, (px, py) in enumerate(simplified):
        sx = round(px * scale_x, 1)
        sy = round(py * scale_y, 1)
        if i == 0:
            cmds.append(f"M {sx},{sy}")
        else:
            cmds.append(f"L {sx},{sy}")
    cmds.append("Z")
    
    return " ".join(cmds), target_w, target_h

if __name__ == '__main__':
    icons = {
        "cessna": r"t:\AI\Aviation History\Website\public\icons\cessna_propeller_hero.png",
        "jet": r"t:\AI\Aviation History\Website\public\icons\airbus_a380_jet_hero.png",
        "helicopter": r"t:\AI\Aviation History\Website\public\icons\passenger_helicopter_hero.png",
        "glider": r"t:\AI\Aviation History\Website\public\icons\modern_glider_hero.png",
    }
    
    for name, path in icons.items():
        if os.path.exists(path):
            path_d, vw, vh = extract_silhouette_polygon(path)
            print(f"=== {name.upper()} VECTOR SVG (viewBox 0 0 {vw} {vh}) ===")
            print(f"d=\"{path_d}\"")
            print()
