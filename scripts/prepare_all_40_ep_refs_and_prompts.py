#!/usr/bin/env python3
"""
prepare_all_40_ep_refs_and_prompts.py
Generates per-episode Character Reference Sheets (ep01_char_ref.png .. ep40_char_ref.png)
from public/seat/*.png and builds 9-panel 3x3 storyboard prompts for Episodes 2..40
directly from webtoonEpisodeManifest.json.
"""

import json
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

PROJECT_ROOT = Path("/Users/dayyoung/project/snshero")
MANIFEST_PATH = PROJECT_ROOT / "src/content/webtoonEpisodeManifest.json"
SEAT_DIR = PROJECT_ROOT / "public/seat"
REF_OUT_DIR = PROJECT_ROOT / "public/images/webtoon/raw_ep_sheets"
PROMPTS_JSON = Path("/tmp/ep02_40_sheet_prompts.json")

CHAR_VISUAL_SPECS = {
    "Aeolus": ("Aeolus.png", "Teal-haired wind mage in emerald-gold robes surrounded by swirling cyan wind currents"),
    "Aila": ("Aila.png", "Long purple-haired elf shadow mage with golden ear-wings, purple/gold robe, and dark cosmic vortex orbs"),
    "Aleksandar": ("Aleksandar.png", "Brown-haired king wearing a golden crown with blue gems, ornate gold plate armor, blue cape, and glowing purple runic greatsword"),
    "Balbo": ("Balbo.png", "Red-haired, thick-bearded stocky dwarf warrior in heavy bronze-and-gold plate armor"),
    "Balian": ("Balian.png", "Paladin wearing a silver winged helmet with gold trim, white-and-gold cross armor, red cape, silver sword, and large silver cross shield"),
    "Barghest": ("Barghest.png", "Dark-blue shadow wolf beast wreathed in glowing cyan-blue spirit flames"),
    "Belphegor": ("Belphegor.png", "Red-skinned muscular demon lord with massive curved dark horns and blazing orange fire aura"),
    "Celia": ("Celia.png", "Bright green-haired elf maiden with pink flower hair ornament, green leafy dress, and floating cherry blossoms"),
    "Death Knight Artus": ("Death_Knight_Artus.png", "Undead regent in dark steel horned skull helmet with glowing white eyes, dark plate armor, and blazing cyan-blue soulfire greatsword"),
    "Eliana": ("Eliana.png", "Blonde fairy princess wearing a pink floral crown, petal-pink dress, and floating pink flower petals"),
    "Elwin": ("Elwin.png", "Golden-blonde female knight with blue eyes, silver-and-gold armor, red-and-blue cape, and gold-hilted broadsword"),
    "Fenrir": ("Fenrir.png", "Ice-blue frost wolf with floating crystal ice shards around its back and tail"),
    "Gawain": ("Gawain.png", "Blonde paladin knight in silver-and-gold plate armor holding a massive silver-and-gold greatsword"),
    "Gilgamesh": ("Gilgamesh.png", "Spiky red-haired warrior in crimson-and-gold armor wielding a blazing golden flame sword"),
    "Griffon": ("Griffon.png", "Majestic golden-winged eagle-lion griffon with sharp golden beak and talons"),
    "Grimli": ("Grimli.png", "Dark-brown-haired, long-bearded stocky dwarf brawler wearing leather armor and iron gauntlets"),
    "Hercul": ("Hercul.png", "Wild long spiky brown-haired, thick-bearded warrior in leather armor wielding a blazing yellow flame scimitar"),
    "Ignis": ("Ignis.png", "Spiky flame-red/orange-haired young fire warrior with pointed ears, fiery eyes, and blazing fire fists"),
    "Kadan": ("Kadan.png", "Spiky chestnut-brown-haired young hero wearing a flowing red scarf, blue/brown leather armor, and silver dagger"),
    "Kaze": ("Kaze.png", "Dark-purple-haired ninja assassin in black shinobi outfit and face mask, dual-wielding daggers"),
    "Leonar": ("Leonar.png", "Silver-armored lion beast with a glowing crystal-blue ice mane"),
    "Lucian": ("Lucian.png", "Green-haired elf archer with long pointed ears, green ranger armor, quiver, and wooden bow with glowing green wind arrows"),
    "Magitech Golem": ("Magitech_Golem.png", "Massive dark-iron rock golem with glowing purple crystal core and shoulders"),
    "Malfuon": ("Malfuon.png", "Teal-haired elf archmage with glowing cyan water/wind tendrils and green-and-gold robes"),
    "Medusa Gorgo": ("Medusa_Gorgo.png", "Green-haired gorgon sorceress with living green snake hair and coiled emerald serpent lower body"),
    "Pegasus": ("Pegasus.png", "White winged pegasus steed with flowing purple mane, golden armor barding, and horn"),
    "Robinyard": ("Robinyard.png", "Brown-haired ranger archer wearing a red hood and green cloak, drawing a wooden bow"),
    "Rondol": ("Rondol.png", "Full-helmed dark-blue-and-gold heavy knight holding a glowing blue sword and golden-rimmed shield"),
    "Sylphid": ("Sylphid.png", "Light-green-haired wind fairy with translucent glowing cyan fairy wings and white-green dress"),
    "Titania": ("Titania.png", "Blonde fairy queen wearing a yellow-and-blue flower crown and blue/white gown surrounded by flowers"),
    "Ursoc": ("Ursoc.png", "Majestic golden-maned lion beast"),
    "Walker": ("Walker.png", "Undead skeleton warrior with glowing purple soul-flames on its shoulders, holding a sword and skull shield"),
    "Ysela": ("Ysela.png", "Cute starry blue cosmic dragon whelp with golden horns, golden wing frames, and starry nebula wings"),
}


def build_episode_ref_sheet(ep_num: int, char_names: list[str]) -> Path:
    REF_OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = REF_OUT_DIR / f"ep{ep_num:02d}_char_ref.png"

    valid_chars = [c for c in char_names if c in CHAR_VISUAL_SPECS]
    n = len(valid_chars)
    cols = min(4, max(3, math.ceil(math.sqrt(n))))
    rows = math.ceil(n / cols)

    cw, ch = 280, 340
    W, H = cols * cw, rows * ch
    sheet = Image.new("RGB", (W, H), (24, 22, 26))
    draw = ImageDraw.Draw(sheet)
    font_name = ImageFont.truetype("/System/Library/Fonts/Menlo.ttc", 15)
    font_desc = ImageFont.truetype("/System/Library/Fonts/Menlo.ttc", 10)

    for idx, cname in enumerate(valid_chars):
        r, c = divmod(idx, cols)
        x0, y0 = c * cw, r * ch
        draw.rectangle([x0 + 4, y0 + 4, x0 + cw - 4, y0 + ch - 4], fill=(36, 34, 40), outline=(95, 90, 108), width=2)
        fn, desc = CHAR_VISUAL_SPECS[cname]
        im = Image.open(SEAT_DIR / fn).convert("RGBA")
        im.thumbnail((220, 250), Image.Resampling.LANCZOS)
        ix = x0 + (cw - im.width) // 2
        iy = y0 + 12
        sheet.paste(im, (ix, iy), im)
        draw.text((x0 + cw // 2, y0 + ch - 42), cname.upper(), fill=(255, 230, 150), font=font_name, anchor="mm")
        draw.text((x0 + cw // 2, y0 + ch - 20), desc[:38], fill=(200, 200, 210), font=font_desc, anchor="mm")

    sheet.save(out_path)
    return out_path


def build_episode_prompt(ep_num: int, ep_data: dict, ref_path: Path) -> str:
    title_en = ep_data["episodeTitle"]
    images = [img for img in ep_data["images"] if img["index"] > 0]
    total_scenes = len(images)

    # Collect unique characters in this episode
    ep_chars = []
    for img in ep_data["images"]:
        for c in img.get("characters", []):
            if c in CHAR_VISUAL_SPECS and c not in ep_chars:
                ep_chars.append(c)

    char_lines = []
    for c in ep_chars:
        _, desc = CHAR_VISUAL_SPECS[c]
        char_lines.append(f"- **{c.upper()}**: {desc}")

    # Pick 9 evenly spaced representative scenes across the episode (panels 1..9)
    panel_lines = []
    positions = [
        "Panel 1 (Top-Left)",
        "Panel 2 (Top-Center)",
        "Panel 3 (Top-Right)",
        "Panel 4 (Middle-Left)",
        "Panel 5 (Middle-Center)",
        "Panel 6 (Middle-Right)",
        "Panel 7 (Bottom-Left)",
        "Panel 8 (Bottom-Center)",
        "Panel 9 (Bottom-Right)",
    ]
    for p_idx in range(9):
        s_idx = min(total_scenes - 1, int(round(p_idx * (total_scenes - 1) / 8.0)))
        sc = images[s_idx]
        chars_in_sc = [c for c in sc.get("characters", []) if c in CHAR_VISUAL_SPECS]
        bg = sc.get("background") or "dramatic dark-fantasy environment matching the story"
        nar_en = (sc.get("narrationEn") or "").strip()
        if len(nar_en) > 190:
            nar_en = nar_en[:187] + "..."
        char_str = ", ".join(c.upper() for c in chars_in_sc) if chars_in_sc else ", ".join(c.upper() for c in ep_chars[:2])
        panel_lines.append(
            f"- {positions[p_idx]}: Location: {bg}. Featured characters: {char_str}. "
            f"Action, gesture & props: {nar_en}"
        )

    prompt = (
        f"First view the character reference sheet at `{ref_path}` and MUST pass `{ref_path}` in `image_paths` when calling `generate_image`.\n\n"
        f"Generate a high-resolution 16:9 image arranged as a clean 3x3 grid (9 distinct horizontal 16:9 webtoon panels separated by thin crisp black borders, NO text, NO letters, and NO speech bubbles inside any panel).\n"
        f"CRITICAL REQUIREMENT: Every character appearing in the panels MUST match their exact card character design, proportions, hair color, helmet/crown, armor, and weapons from `{ref_path}`:\n"
        + "\n".join(char_lines)
        + f"\n\nThe 9 panels (reading left-to-right, top-to-bottom) must depict Episode {ep_num} ('{title_en}') with expressive character gestures/poses, rich fantasy locations, and detailed story props:\n"
        + "\n".join(panel_lines)
    )
    return prompt


def main():
    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    prompts_out = {}
    for ep_num in range(1, 41):
        ep_data = manifest[str(ep_num)]
        ep_chars = []
        for img in ep_data["images"]:
            for c in img.get("characters", []):
                if c in CHAR_VISUAL_SPECS and c not in ep_chars:
                    ep_chars.append(c)
        ref_path = build_episode_ref_sheet(ep_num, ep_chars)
        if ep_num >= 2:
            prompts_out[str(ep_num)] = {
                "episodeNumber": ep_num,
                "episodeTitle": ep_data["episodeTitle"],
                "refPath": str(ref_path),
                "prompt": build_episode_prompt(ep_num, ep_data, ref_path),
            }

    with open(PROMPTS_JSON, "w", encoding="utf-8") as f:
        json.dump(prompts_out, f, indent=2, ensure_ascii=False)

    print(f"Generated 40 episode character reference sheets in {REF_OUT_DIR}")
    print(f"Saved 39 episode storyboard prompts (EP 02..40) to {PROMPTS_JSON}")


if __name__ == "__main__":
    main()
