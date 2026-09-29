from pathlib import Path

import numpy as np
from PIL import Image

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
    pixels[:, :, 3] = np.where(near_white, 0, alpha)
    return Image.fromarray(pixels, 'RGBA')

for source in SOURCE.glob('*.png'):
    image = clean_background(Image.open(source))
    image.thumbnail((512, 512), Image.Resampling.LANCZOS)
    image.save(OUTPUT / f'{source.stem}.webp', 'WEBP', quality=82, method=6)
