import os
import sys
import glob
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

WIDTH = 768
HEIGHT = 432

def draw_comic_speech_bubble(
    canvas: Image.Image,
    cx: int,
    cy: int,
    tail_tip: tuple[int, int],
    is_left_speaker: bool = True,
):
    """
    Renders a crisp comic-style speech bubble with '...' inside.
    Tail points downward toward speaker.
    Zero overlap on character heads/faces.
    """
    bw, bh = 70, 34
    r = 10
    scale = 3
    L_W, L_H = canvas.width * scale, canvas.height * scale

    shape_img = Image.new("L", (L_W, L_H), 0)
    sdraw = ImageDraw.Draw(shape_img)

    lcx, lcy = cx * scale, cy * scale
    lbw, lbh = bw * scale, bh * scale
    lr = r * scale

    bx1 = lcx - lbw // 2
    by1 = lcy - lbh // 2
    bx2 = bx1 + lbw
    by2 = by1 + lbh

    ltx, lty = tail_tip[0] * scale, tail_tip[1] * scale

    if is_left_speaker:
        p1 = (bx1 + int(lbw * 0.40), by2)
        p2 = (bx1 + int(lbw * 0.70), by2)
    else:
        p1 = (bx2 - int(lbw * 0.70), by2)
        p2 = (bx2 - int(lbw * 0.40), by2)
    p3 = (ltx, lty)

    # 1. Solid body + tail
    sdraw.rounded_rectangle([bx1, by1, bx2, by2], radius=lr, fill=255)
    sdraw.polygon([p1, p2, p3], fill=255)

    # 2. Border via dilation
    stroke_radius = int(2.0 * scale)
    outer_mask = shape_img.filter(ImageFilter.MaxFilter(stroke_radius * 2 + 1))
    inner_mask = shape_img

    bubble_layer = Image.new("RGBA", (L_W, L_H), (0, 0, 0, 0))

    # Outer border in dark charcoal
    border_img = Image.new("RGBA", (L_W, L_H), (24, 28, 36, 255))
    bubble_layer.paste(border_img, (0, 0), outer_mask)

    # Inner fill in clean white
    fill_img = Image.new("RGBA", (L_W, L_H), (255, 255, 255, 255))
    bubble_layer.paste(fill_img, (0, 0), inner_mask)

    # 3. Three dots (...) inside bubble
    bdraw = ImageDraw.Draw(bubble_layer)
    dot_r = int(2.5 * scale)
    dot_gap = int(9.5 * scale)
    dot_color = (24, 28, 36, 255)
    for dx in [-dot_gap, 0, dot_gap]:
        bdraw.ellipse([lcx + dx - dot_r, lcy - dot_r, lcx + dx + dot_r, lcy + dot_r], fill=dot_color)

    # Soft subtle shadow
    shadow = Image.new("RGBA", (L_W, L_H), (0, 0, 0, 0))
    shadow_fill = Image.new("RGBA", (L_W, L_H), (0, 0, 0, 90))
    shadow.paste(shadow_fill, (0, 0), outer_mask)
    shadow = shadow.filter(ImageFilter.GaussianBlur(int(2.5 * scale)))

    down_shadow = shadow.resize((canvas.width, canvas.height), Image.Resampling.LANCZOS)
    down_bubble = bubble_layer.resize((canvas.width, canvas.height), Image.Resampling.LANCZOS)

    s_offset = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    s_offset.paste(down_shadow, (0, 2))

    canvas.alpha_composite(s_offset)
    canvas.alpha_composite(down_bubble)

# Bubble placement parameters per dialogue scene
# cx, cy, tail_tip, is_left_speaker
BUBBLE_CONFIGS_EP01 = {
    12: (170, 55, (230, 115), True),   # Balian on left, pointing down-right toward his stance
    13: (560, 55, (490, 115), False),  # Hercul on right, pointing down-left toward him
    19: (540, 55, (470, 115), False),  # Hercul leaning across table
    21: (540, 55, (470, 115), False),  # Hercul
    22: (540, 55, (470, 115), False),  # Hercul
    23: (200, 55, (260, 115), True),   # Aleksandar on left taking dagger
    24: (220, 55, (280, 115), True),   # Balian on left taking dagger
    32: (620, 55, (550, 115), False),  # Lucian sneering from ridge/horse on right
    35: (180, 55, (240, 115), True),   # Aleksandar defying Lucian on left
    39: (220, 55, (280, 115), True),   # Balian charging cavalry
    40: (190, 65, (265, 130), True),   # Balian falling into whirlpool rapids
    45: (220, 55, (280, 115), True),   # Elwin speaking to unborn child
    47: (220, 55, (280, 115), True),   # Elwin speaking
    48: (220, 55, (280, 115), True),   # Elwin speaking
}

BUBBLE_CONFIGS_EP02 = {
    4:  (200, 55, (260, 115), True),   # Hercul inspecting crest
    12: (180, 55, (240, 115), True),   # Grimli raising warhammer
    16: (580, 55, (510, 115), False),  # Aila aiming crossbow
    20: (560, 55, (490, 115), False),  # Gawain raising iron staff
    25: (384, 55, (384, 115), True),   # Orphan boy pleading in center
    30: (180, 55, (240, 115), True),   # Grimli lowering warhammer
    32: (220, 55, (280, 115), True),   # Hercul revealing truth
    33: (560, 55, (490, 115), False),  # Gawain speaking
    35: (220, 55, (280, 115), True),   # Aila promising to head north
    36: (580, 55, (510, 115), False),  # Kaze flipping coin
    37: (180, 55, (240, 115), True),   # Rondol speaking
    38: (580, 55, (510, 115), False),  # Eliana speaking
    39: (560, 55, (490, 115), False),  # Robinyard on rooftop
    41: (200, 55, (260, 115), True),   # Hercul swearing to go south
    42: (580, 55, (510, 115), False),  # Gawain proposing the 18-year pact
    43: (580, 55, (510, 115), False),  # Gawain on the reunion duel
    45: (200, 55, (260, 115), True),   # Hercul accepting the oath
}

BUBBLE_CONFIGS = BUBBLE_CONFIGS_EP01

def process_scene(src_path: str, scene_idx: int, dst_path: str, ep: int = 1):
    im = Image.open(src_path).convert("RGBA")
    im_resized = im.resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)

    configs = BUBBLE_CONFIGS_EP02 if ep == 2 else BUBBLE_CONFIGS_EP01

    if scene_idx in configs:
        cx, cy, tail_tip, is_left = configs[scene_idx]
        draw_comic_speech_bubble(im_resized, cx, cy, tail_tip, is_left)
        print(f"[EP{ep:02d}] Scene {scene_idx:02d}: Added speech bubble at ({cx}, {cy}) -> {tail_tip}")
    else:
        print(f"[EP{ep:02d}] Scene {scene_idx:02d}: Narration only (NO speech bubble)")

    final_rgb = im_resized.convert("RGB")
    final_rgb.save(dst_path, "WEBP", quality=82)
    print(f"Successfully saved {dst_path}: {os.path.getsize(dst_path)} bytes")

if __name__ == "__main__":
    if len(sys.argv) >= 4:
        src = sys.argv[1]
        s_idx = int(sys.argv[2])
        dst = sys.argv[3]
        process_scene(src, s_idx, dst)
