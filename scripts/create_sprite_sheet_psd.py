from pathlib import Path
import struct
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DESIGN = ROOT / 'キャラクターデザイン'
SHEETS = [
    ('プレイヤー_待機スプライト_4x4.png', 'プレイヤー_待機_4方向4コマ_2000px.psd', 'Idle'),
    ('プレイヤー_歩行スプライト_4x4.png', 'プレイヤー_歩行_4方向4コマ_2000px.psd', 'Walk'),
]
DIRECTIONS = ('Front', 'Right', 'Back', 'Left')
CELL = 500
CANVAS = CELL * 4


def pascal_name(name: str) -> bytes:
    raw = name.encode('ascii')
    value = bytes([len(raw)]) + raw
    return value + b'\0' * ((4 - len(value) % 4) % 4)


def plane(image: Image.Image, channel: int) -> bytes:
    return image.getchannel(channel).tobytes()


def layer_record(name: str, x: int, y: int, image: Image.Image):
    width, height = image.size
    channel_data = []
    channel_specs = []
    for channel_id, index in ((0, 0), (1, 1), (2, 2), (-1, 3)):
        raw = plane(image, index)
        data = struct.pack('>H', 0) + raw
        channel_specs.append((channel_id, len(data)))
        channel_data.append(data)
    record = struct.pack('>iiiiH', y, x, y + height, x + width, len(channel_specs))
    for channel_id, length in channel_specs:
        record += struct.pack('>hI', channel_id, length)
    extra = struct.pack('>II', 0, 0) + pascal_name(name)
    record += b'8BIMnorm' + bytes((255, 0, 0, 0)) + struct.pack('>I', len(extra)) + extra
    return record, b''.join(channel_data)


def write_psd(path: Path, layers, composite: Image.Image):
    records, data = zip(*(layer_record(*layer) for layer in layers))
    layer_info = struct.pack('>h', len(layers)) + b''.join(records) + b''.join(data)
    layer_mask = struct.pack('>I', len(layer_info)) + layer_info + struct.pack('>I', 0)
    header = b'8BPS' + struct.pack('>H', 1) + b'\0' * 6 + struct.pack('>HIIHH', 4, CANVAS, CANVAS, 8, 3)
    merged = struct.pack('>H', 0) + b''.join(plane(composite, index) for index in range(4))
    path.write_bytes(header + struct.pack('>I', 0) + struct.pack('>I', 0) + struct.pack('>I', len(layer_mask)) + layer_mask + merged)


def make_psd(source_name: str, output_name: str, prefix: str):
    source = Image.open(DESIGN / source_name).convert('RGBA')
    layers = []
    composite = Image.new('RGBA', (CANVAS, CANVAS), 'white')
    for row, direction in enumerate(DIRECTIONS):
        for column in range(4):
            left, top = round(column * source.width / 4), round(row * source.height / 4)
            right, bottom = round((column + 1) * source.width / 4), round((row + 1) * source.height / 4)
            frame = source.crop((left, top, right, bottom)).resize((CELL, CELL), Image.Resampling.LANCZOS)
            x, y = column * CELL, row * CELL
            name = f'{prefix}_{direction}_{column + 1:02d}'
            # Photoshop displays the first record as the top layer.  Each sprite sits above its own white cell.
            layers.append((name, x, y, frame))
            layers.append((f'{name}_White_BG', x, y, Image.new('RGBA', (CELL, CELL), 'white')))
            composite.alpha_composite(frame, (x, y))
    write_psd(DESIGN / output_name, layers, composite)


for source, output, prefix in SHEETS:
    make_psd(source, output, prefix)
    print(DESIGN / output)
