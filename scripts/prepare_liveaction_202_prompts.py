#!/usr/bin/env python3
import json
import re
from pathlib import Path

ROOT = Path("/Users/dayyoung/project/snshero")
ANIME_PROMPTS_PATH = ROOT / "scripts/anime_sheet_prompts_extracted.json"
OUT_JSON_PATH = ROOT / "scripts/liveaction_202_sheet_prompts.json"
CINEMA_FULL_DIR = ROOT / "public/images/cinema/raw_full_sheets"

# Pure 100% photorealistic 70mm IMAX live-action 3x3 reference sheets (verified zero 2D anime contamination)
PURE_LA_REFS = [
    str(CINEMA_FULL_DIR / "ep02_sheet_03.png"),
    str(CINEMA_FULL_DIR / "ep04_sheet_01_s01_09.png"),
]


def clean_for_liveaction(raw_prompt: str) -> str:
    idx = -1
    for marker in ["Row 1 Panel 1", "Panel 1 (top-left)", "Panel 1 (Top-Left)", "Panel 1:", "Panel 1 ("]:
        pos = raw_prompt.find(marker)
        if pos != -1 and (idx == -1 or pos < idx):
            idx = pos
    body = raw_prompt[idx:] if idx != -1 else raw_prompt

    replacements = [
        (r"\bsemi-chibi\b", "8-head-tall photorealistic live-action"),
        (r"\bchibi-proportions\b", "8-head-tall realistic adult proportions"),
        (r"\bchibi\b", "realistic 8-head-tall"),
        (r"\b2D cel-shaded anime\b", "70mm IMAX photorealistic live-action"),
        (r"\bcel-shaded anime\b", "70mm IMAX photorealistic live-action"),
        (r"\bcel-shaded\b", "photorealistic"),
        (r"\banime\b", "photorealistic live-action cinema"),
        (r"\bstorybook\b", "70mm cinema"),
        (r"\bpicture-book\b", "theatrical film"),
        (r"\bwebtoon\b", "cinema"),
        (r"\bcomic\b", "cinema"),
        (r"\billustration\b", "photorealistic film still"),
        (r"\bpainterly\b", "photorealistic"),
        (r"\blineart\b", "cinematic lighting"),
        (r"\b3-4 head high\b", "8-head-tall realistic adult"),
        (r"\buftable\b", "ARRI Alexa 65 IMAX"),
        (r"\bUfotable\b", "ARRI Alexa 65 IMAX"),
        (r"\bMAPPA\b", "Weta Digital"),
        (r"\bWit Studio\b", "Rodeo FX"),
        (r"\bsemi-realistic\b", "100% photorealistic"),
        (r"\bstylized\b", "photorealistic"),
    ]
    for pat, rep in replacements:
        body = re.sub(pat, rep, body, flags=re.I)
    return body.strip()


def main():
    raw_data = json.loads(ANIME_PROMPTS_PATH.read_text(encoding="utf-8"))
    CINEMA_FULL_DIR.mkdir(parents=True, exist_ok=True)
    out = {}

    for key in sorted(raw_data.keys()):
        m = re.match(r"ep(\d+)_sheet_(\d+)", key)
        if not m:
            continue
        ep_num = int(m.group(1))
        sh_num = int(m.group(2))

        cleaned_body = clean_for_liveaction(raw_data[key])
        target_name = (
            f"ep{ep_num:02d}_sheet_01_s01_09.png"
            if (ep_num > 1 and sh_num == 1)
            else f"ep{ep_num:02d}_sheet_{sh_num:02d}.png"
        )
        target_path = CINEMA_FULL_DIR / target_name

        la_prompt = (
            f"A masterwork 16:9 widescreen 3x3 photorealistic live-action cinema grid sheet containing exactly 9 distinct movie stills "
            f"(3 rows x 3 columns) separated by thin crisp solid black grid lines. Strictly ZERO text, ZERO letters, ZERO numbers, ZERO captions, "
            f"ZERO speech bubbles, and ZERO watermarks anywhere.\n\n"
            f"MANDATORY VISUAL STYLE — 100% PURE PHOTOREALISTIC 70MM IMAX LIVE-ACTION CINEMA:\n"
            f"- Shot on ARRI Alexa 65 70mm IMAX anamorphic lens ('The Lord of the Rings', 'House of the Dragon', 'The Witcher', 'Kingdom of Heaven' theatrical live-action cinematography).\n"
            f"- Every single panel (Panel 1 through Panel 9) MUST feature real live-action human actors with realistic skin pores, sweat, dirt, real forged steel/bronze armor, weathered linen/wool/leather medieval garments, physical props, natural atmospheric lighting, and Weta-Digital photorealistic VFX creatures.\n"
            f"- STRICTLY FORBIDDEN: NO 2D anime, NO cartoon, NO cel-shading, NO comic ink outlines, NO painted illustration.\n"
            f"- STRICT CHARACTER & PROP CONTINUITY: Preserve every character's iconic hair color, headgear, costume, and signature props:\n"
            f"  * Gawain: grey linen blindfold tied over his eyes, silver-gold paladin armor & iron resonant staff\n"
            f"  * Eliana: blonde hair with floral wreath headband, pink-and-cream floral gown & glowing glass reagent vials\n"
            f"  * Grimli: stout bearded dwarf smith with braided red beard & heavy square iron warhammer\n"
            f"  * Kaze: dark-purple hair, black shinobi face mask, dark-indigo ninja garb & three silver coins / twin daggers\n"
            f"  * Rondol: dark-blue-and-gold full visored knight helm, wave-carved wooden staff & lion/cross shield\n"
            f"  * Robinyard: red hood, green forest ranger cloak, yew longbow & silver bell\n"
            f"  * Aila: purple hair, dark purple hooded cloak & brass repeating crossbow\n"
            f"  * Medusa (Gorgo): grey cloth blindfold, living green viper snake hair & dark serpent scales\n"
            f"  * Belphegor: towering horned black-obsidian demon giant glowing with molten orange magma fissures\n"
            f"  * Kadan: young man with tousled brown hair (or silver-white hair in northern arc), crimson-red wool scarf, dark leather armor & glowing blue-silver rune dagger\n"
            f"  * Celia: young woman with blonde hair, emerald-green dress & glowing jade wind staff\n"
            f"  * Ignis: warrior with fiery red hair & black-and-crimson or white-and-gold flame-motif armor\n"
            f"  * Aleksandar: blond king with golden crown, ornate golden plate armor & glowing purple rune greatsword\n"
            f"  * Balian: crusader knight with winged silver great-helm & white-and-gold cross shield\n"
            f"  * Hercul: muscular bronze-skinned warrior in leather harness with blazing golden flame scimitar\n"
            f"  * Artus: dread knight in horned black skull helm & cyan soul-fire greatsword\n"
            f"  * Lucian: elven archer with emerald-green hair, pointed elf ears & green leather armor\n\n"
            f"EXACT 9-PANEL SCENE BREAKDOWN (Episode {ep_num:02d}, Sheet {sh_num:02d}):\n"
            f"{cleaned_body}"
        )

        out[key] = {
            "episode": ep_num,
            "sheet": sh_num,
            "image_name": f"la_{key}_real",
            "image_paths": PURE_LA_REFS,
            "target_path": str(target_path),
            "prompt": la_prompt,
        }

    OUT_JSON_PATH.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Prepared {len(out)} pure 1:1 live-action sheet prompts in {OUT_JSON_PATH}")


if __name__ == "__main__":
    main()
