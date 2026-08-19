import os

maps_dir = 'public/assets/maps'
viewboxes = {
    'us.svg': '0 0 1000 650',
    'gb.svg': '0 0 1000 1200',
    'de.svg': '0 0 1000 1000',
    'fr.svg': '0 0 1000 1000',
    'world.svg': '0 0 1000 500'
}

for filename in os.listdir(maps_dir):
    if not filename.endswith('.svg'):
        continue
    filepath = os.path.join(maps_dir, filename)
    with open(filepath, 'r', encoding='utf-8-sig') as f:
        content = f.read()

    vb = viewboxes.get(filename, '0 0 1000 700')
    if 'viewBox' not in content:
        content = content.replace('<svg ', f'<svg viewBox="{vb}" ')

    style_override = '<style>path, polygon, g { fill: #ffffff !important; fill-opacity: 0.7 !important; stroke: #ffffff !important; stroke-width: 1.5px !important; stroke-opacity: 0.9 !important; }</style>'
    if '<defs>' in content:
        content = content.replace('<defs>', f'<defs>{style_override}')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Enhanced {filename} with viewBox and high-contrast white vector styling')
