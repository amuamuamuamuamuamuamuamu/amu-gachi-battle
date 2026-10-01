from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'アイテム'
OUTPUT = ROOT / 'game-assets' / 'items'
OUTPUT.mkdir(parents=True, exist_ok=True)

def clean_background(image):
    image = image.convert('RGBA')
    pixels = np.array(image)
    rgb = pixels[:, :, :3]
    alpha = pixels[:, :, 3]
    near_white = (rgb.min(axis=2) >= 242) & ((rgb.max(axis=2) - rgb.min(axis=2)) <= 18)

    # Close hairline gaps in dark outlines for the purpose of finding the
    # outside canvas.  Without this, the flood fill can escape through a tiny
    # gap in an outline and erase the pale fill inside an item.
    foreground = Image.fromarray((~near_white * 255).astype(np.uint8), 'L')
    sealed_outline = np.array(
        foreground.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5))
    ) > 0

    # Only remove the white background connected to the edge of the canvas.
    # Removing every near-white pixel made enclosed white details in the artwork
    # transparent, leaving white-looking holes inside black outlines in-game.
    height, width = near_white.shape
    background = np.zeros((height, width), dtype=bool)
    queue = deque()

    def add_if_background(y, x):
        if near_white[y, x] and not sealed_outline[y, x] and not background[y, x]:
            background[y, x] = True
            queue.append((y, x))

    for x in range(width):
        add_if_background(0, x)
        add_if_background(height - 1, x)
    for y in range(height):
        add_if_background(y, 0)
        add_if_background(y, width - 1)

    while queue:
        y, x = queue.popleft()
        for next_y, next_x in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= next_y < height and 0 <= next_x < width:
                add_if_background(next_y, next_x)

    pixels[:, :, 3] = np.where(background, 0, alpha)
    # Transparent pixels can still carry their original white RGB values.
    # Clear those values before resizing so they cannot bleed into the outline.
    pixels[background, :3] = 0
    return Image.fromarray(pixels, 'RGBA')

for source in SOURCE.glob('*.png'):
    destination = OUTPUT / f'{source.stem}.webp'
    if destination.exists() and destination.stat().st_mtime >= source.stat().st_mtime:
        continue
    image = clean_background(Image.open(source))
    image.thumbnail((512, 512), Image.Resampling.LANCZOS)
    # Item icons are small enough that retaining the original edge pixels is
    # more important than lossy compression artifacts around dark outlines.
    image.save(destination, 'WEBP', lossless=True, method=6)
