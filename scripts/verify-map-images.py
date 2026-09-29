"""Check that every game map matches the source named by the map picker."""

import ast
import re
from pathlib import Path

from PIL import Image, ImageChops, ImageStat


root = Path(__file__).resolve().parent.parent
picker = (root / "map-event-npc-picker.js").read_text(encoding="utf-8")
match = re.search(r"const maps=(\[[^\n]+\]);", picker)
if not match:
    raise SystemExit("Map picker catalog not found")
names = ast.literal_eval(match.group(1))
if len(names) != 26:
    raise SystemExit(f"Expected 26 maps, found {len(names)}")

scores = []
for index, name in enumerate(names):
    source = root / "マップ" / f"{name}.png"
    output = root / "game-assets" / "maps" / (
        "m1-game.webp" if index == 0 else f"map{index + 1}-game.webp"
    )
    with Image.open(source) as original, Image.open(output) as game:
        if game.size != (1024, 1024):
            raise SystemExit(f"Wrong dimensions: {output}")
        expected = original.convert("RGB").resize((1024, 1024), Image.Resampling.BICUBIC)
        delta = ImageChops.difference(expected, game.convert("RGB"))
        mean_error = sum(ImageStat.Stat(delta).mean) / 3
        scores.append((mean_error, name))
        if mean_error > 25:
            raise SystemExit(f"Wrong or damaged game map: {output} ({mean_error:.1f})")

worst, name = max(scores)
print(f"Verified {len(scores)} maps. Largest mean pixel difference: {worst:.1f} ({name}).")
