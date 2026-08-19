import os, re
import xml.etree.ElementTree as ET

maps = {
    'USA': ('public/assets/maps/us.svg', '0 0 1000 650'),
    'UK': ('public/assets/maps/gb.svg', '0 0 1000 1200'),
    'Germany': ('public/assets/maps/de.svg', '0 0 1000 1000'),
    'France': ('public/assets/maps/fr.svg', '0 0 1000 1000'),
    'World': ('public/assets/maps/world.svg', '0 0 1000 500'),
}

output_code = ['"use client";\nimport React from "react";\n']

for name, (filepath, fallback_vb) in maps.items():
    content = open(filepath, 'r', encoding='utf-8').read()
    paths = re.findall(r'<path[^>]+d="([^"]+)"', content)
    polygons = re.findall(r'<polygon[^>]+points="([^"]+)"', content)
    
    #Extract viewBox
    vb_match = re.search(r'viewBox="([^"]+)"', content)
    vb = vb_match.group(1) if vb_match else fallback_vb
    
    output_code.append(f'export function {name}MapSvg({{ color = "#ffffff", opacity = 0.85, strokeColor = "rgba(255,255,255,0.4)" }}: {{ color?: string; opacity?: number; strokeColor?: string }}) {{')
    output_code.append(f'  return (')
    output_code.append(f'    <svg viewBox="{vb}" width="100%" height="100%" style={{{{ display: "block" }}}}>')
    output_code.append(f'      <g fill={{color}} fillOpacity={{opacity}} stroke={{strokeColor}} strokeWidth="1.5">')
    for p in paths:
        output_code.append(f'        <path d="{p}" />')
    for poly in polygons:
        output_code.append(f'        <polygon points="{poly}" />')
    output_code.append(f'      </g>')
    output_code.append(f'    </svg>')
    output_code.append(f'  );')
    output_code.append(f'}}\n')

with open('components/CountryMaps.tsx', 'w', encoding='utf-8') as f:
    f.write('\n'.join(output_code))

print("Successfully generated components/CountryMaps.tsx with 100% inline JSX maps!")
