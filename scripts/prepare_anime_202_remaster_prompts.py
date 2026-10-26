#!/usr/bin/env python3
"""
scripts/prepare_anime_202_remaster_prompts.py
Builds all 201 narrative 3x3 2D Anime Master Storyboard Sheet prompts (`ep01_sheet_01..06`, `ep02_sheet_01..ep40_sheet_05`)
using the exact same strict 1:1 9-panel breakdown and unified reference conditioning rule as `prepare_liveaction_202_prompts.py`:
- Passes ONLY two verified pure 2D cel-shaded anime reference sheets in `image_paths` so style and character proportions never drift.
- Enforces crisp 16:9 3x3 grid layout with thin solid black borders and strictly zero text, captions, or speech bubbles.
- Preserves exact 1:1 panel-by-panel parity (`Panel 1..9`) with the Live-Action sheets.
"""

import json
import re
from pathlib import Path

ROOT = Path("/Users/dayyoung/project/snshero")
ANIME_PROMPTS_PATH = ROOT / "scripts/anime_sheet_prompts_extracted.json"
OUT_JSON_PATH = ROOT / "scripts/anime_202_remaster_prompts.json"
ANIME_FULL_DIR = ROOT / "public/images/storybook/raw_full_sheets"

PURE_ANIME_REFS = [
    str(ANIME_FULL_DIR / "ep02_sheet_03.png"),
    str(ANIME_FULL_DIR / "ep04_sheet_01_s01_09.png"),
]


def extract_9panel_body(raw_prompt: str) -> str:
    idx = -1
    for marker in ["Row 1 Panel 1", "Panel 1 (top-left)", "Panel 1 (Top-Left)", "Panel 1:", "Panel 1 ("]:
        pos = raw_prompt.find(marker)
        if pos != -1 and (idx == -1 or pos < idx):
            idx = pos
    return (raw_prompt[idx:] if idx != -1 else raw_prompt).strip()


def main():
    raw_data = json.loads(ANIME_PROMPTS_PATH.read_text(encoding="utf-8"))
    ANIME_FULL_DIR.mkdir(parents=True, exist_ok=True)
    out = {}

    for key in sorted(raw_data.keys()):
        m = re.match(r"ep(\d+)_sheet_(\d+)", key)
        if not m:
            continue
        ep_num = int(m.group(1))
        sh_num = int(m.group(2))

        body = extract_9panel_body(raw_data[key])
        target_name = (
            f"ep{ep_num:02d}_sheet_01_s01_09.png"
            if (ep_num > 1 and sh_num == 1)
            else f"ep{ep_num:02d}_sheet_{sh_num:02d}.png"
        )
        target_path = ANIME_FULL_DIR / target_name

        anime_prompt = (
            f"A single 16:9 widescreen 3x3 grid sheet containing 9 equal-sized rectangular 2D anime storyboard panels "
            f"(3 rows of 3 panels) separated by thin, crisp solid black grid borders.\n"
            f"CRITICAL VISUAL STYLE: 100% PURE HIGH-BUDGET 2D CEL-SHADED FANTASY ANIME ART (Ufotable / Wit Studio / MAPPA theatrical feature film quality). "
            f"Clean hand-drawn anime lineart, expressive anime character designs, vibrant painterly fantasy backgrounds, dramatic rim lighting, and luminous magical VFX. "
            f"ABSOLUTELY NO photorealistic live-action photography, NO 3D CGI rendering, NO text, NO captions, NO letters, NO numbers, NO speech bubbles, NO watermarks.\n\n"
            f"STRICT CHARACTER & PROP CONTINUITY (Match 1:1 across all 40 episodes):\n"
            f"  * Gawain: grey linen blindfold tied over his eyes, silver-gold paladin armor & iron resonant staff\n"
            f"  * Eliana: blonde hair with floral wreath headband, pink-and-cream floral gown & glowing glass reagent vials\n"
            f"  * Grimli: stout bearded dwarf smith with braided beard & heavy square iron warhammer\n"
            f"  * Kaze: dark-purple hair, black shinobi face mask, dark-indigo ninja garb & three silver coins / twin daggers\n"
            f"  * Rondol: dark-blue-and-gold full visored knight helm, iron pegleg, wave-carved staff & lion/cross shield\n"
            f"  * Robinyard: red hood, green forest ranger cloak, yew longbow & silver bell\n"
            f"  * Aila: purple hair, dark purple hooded cloak & brass repeating crossbow\n"
            f"  * Medusa (Gorgo): grey cloth blindfold, living green viper snake hair & dark serpent scales\n"
            f"  * Belphegor: towering horned black-obsidian demon giant glowing with molten orange magma fissures\n"
            f"  * Kadan: young hero with chestnut-brown hair, crimson-red wool scarf, dark leather/knight armor, round iron / golden Dragon Breaker shield & silver rune dagger\n"
            f"  * Celia: young woman with emerald-green/blonde hair with pink blossom flowers, emerald-green dress & glowing green Jade Staff\n"
            f"  * Ignis: warrior with spiky flame-red hair & crimson/silver-white flame armor\n"
            f"  * Aleksandar: bearded king with golden crown, ornate golden plate armor & glowing rune greatsword\n"
            f"  * Balian: crusader paladin with winged silver great-helm & white-and-gold cross shield\n"
            f"  * Artus: dread knight in horned black skull helm & cyan soul-fire greatsword\n"
            f"  * Lucian: green-haired high minister in dark-crimson and gold robes\n\n"
            f"EXACT 9-PANEL SCENE BREAKDOWN (Episode {ep_num:02d}, Sheet {sh_num:02d}):\n"
            f"{body}"
        )

        out[key] = {
            "ep_num": ep_num,
            "sheet_num": sh_num,
            "target_path": str(target_path),
            "media_name": f"anime_{key}_v2",
            "image_paths": PURE_ANIME_REFS,
            "prompt": anime_prompt,
        }

    OUT_JSON_PATH.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Prepared {len(out)} pure 2D Anime remaster sheet prompts -> {OUT_JSON_PATH}")


if __name__ == "__main__":
    main()
