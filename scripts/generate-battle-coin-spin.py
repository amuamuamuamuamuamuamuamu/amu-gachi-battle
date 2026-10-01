from pathlib import Path

from PIL import Image, ImageDraw


ASSET_DIR = Path(__file__).resolve().parents[1] / "game-assets" / "battle"
SIZE = 128


def make_edge() -> Image.Image:
    frame = Image.new("RGBA", (SIZE, SIZE))
    draw = ImageDraw.Draw(frame)
    draw.rounded_rectangle((45, 6, 83, 122), radius=16, fill="#c37a08", outline="#5d3500", width=3)
    draw.rounded_rectangle((49, 9, 79, 119), radius=13, fill="#f6c63e", outline="#9a5800", width=2)
    for x in (54, 60, 66, 72, 78):
        draw.line((x, 13, x, 115), fill="#9a5800", width=2)
    draw.line((51, 13, 51, 115), fill="#fff09a", width=2)
    return frame


def make_angled(face: Image.Image, direction: int) -> Image.Image:
    """Keep the entire face inside the frame, with a ridged back rim for depth."""
    narrow_face = face.resize((92, 118), Image.Resampling.LANCZOS)
    alpha = narrow_face.getchannel("A")
    back = Image.new("RGBA", narrow_face.size, "#b46805")
    back.putalpha(alpha)
    back_draw = ImageDraw.Draw(back)
    for x in range(7, 91, 7):
        back_draw.line((x, 10, x, 108), fill="#774000", width=2)
    back.putalpha(alpha)

    frame = Image.new("RGBA", (SIZE, SIZE))
    face_x = 13 if direction > 0 else 23
    back_x = face_x + (9 * direction)
    frame.alpha_composite(back, (back_x, 5))
    frame.alpha_composite(narrow_face, (face_x, 5))
    return frame


heads = Image.open(ASSET_DIR / "coin-heads.webp").convert("RGBA").resize((SIZE, SIZE), Image.Resampling.LANCZOS)
tails = Image.open(ASSET_DIR / "coin-tails.webp").convert("RGBA").resize((SIZE, SIZE), Image.Resampling.LANCZOS)
edge = make_edge()
frames = [edge, make_angled(heads, 1), heads, make_angled(heads, -1), edge, make_angled(tails, 1), tails, make_angled(tails, -1)]

sheet = Image.new("RGBA", (SIZE * len(frames), SIZE))
for index, frame in enumerate(frames):
    sheet.alpha_composite(frame, (index * SIZE, 0))

sheet.save(ASSET_DIR / "coin-spin.webp", "WEBP", lossless=False, quality=88, method=6)
