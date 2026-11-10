#!/usr/bin/env python3
"""
Builds the 110 Demon Slayer (ufotable) Webtoon-Matched Character Prompts
and processes generated `webtoon_char_{001..110}_*.jpg` images from the conversation
brain directory into:
  - public/anime-character-sheets/cutouts/{001..110}_{Slug}.png
  - public/anime-character-sheets/busts/{001..110}_bust.png & .jpg
  - public/anime-character-sheets/sheets/{001..110}_{Slug}_sheet.jpg
  - public/anime-character-sheets/factions/{01..11}_{faction}_master_sheet.jpg
  - public/anime-character-sheets/all_110_cast_poster.jpg
"""

import glob
import json
import os
import re
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

from generate_110_attack_motions import parse_110_cards
from anime_character_specs import ANIME_CHAR_SPECS
from solo_prompts_110 import ALL_110_SOLO_PROMPTS
from build_110_anime_character_sheets import (
    remove_white_bg_clean,
    clean_cutout_specks,
    main as rebuild_all_character_sheets,
)

BRAIN_ROOT = Path("/Users/dayyoung/.gemini/antigravity/brain")
CUTOUT_DIR = ROOT / "public" / "anime-character-sheets" / "cutouts"
RAW_SOLO_DIR = ROOT / "public" / "anime-character-sheets" / "raw_ufotable_solo"
PROMPTS_JSON = ROOT / "scripts" / "webtoon_110_char_prompts.json"

# Webtoon-exact & glamorous/sexy Demon Slayer (ufotable) character overrides
WEBTOON_GLAMOUR_OVERRIDES: dict[int, str] = {
    1: (
        "Aquaris (아쿠아리스), glamorous 19-year-old female Water Spirit Nymph in Demon Slayer (ufotable) anime style; "
        "sky-blue twin-bun hair with floating water-droplet hairpins and cute side bangs, big luminous sapphire anime eyes, seductive smile; "
        "curvy hourglass S-line figure with ample bust, slim waist, and wide hips in a form-fitting translucent aqua-blue water-silk bikini top and high-slit sheer pareo skirt revealing long bare toned legs; "
        "holding a glowing crystal water-teardrop orb floating above her palm"
    ),
    2: (
        "Naiad (나이아드), seductive 20-year-old female Ocean Siren Priestess in Demon Slayer (ufotable) anime style; "
        "long wavy cerulean-blue hair reaching her hips crowned with a pearl-seashell tiara, alluring aquamarine eyes; "
        "voluptuous hourglass S-line figure wearing a jewel-encrusted royal-blue seashell bikini bra top, bare toned midriff, and translucent high-slit chiffon skirt showing her long bare legs; "
        "holding a tall silver-pearl Siren Staff topped with a glowing ocean orb"
    ),
    3: (
        "Undine (운디네), charismatic 19-year-old female Tidal Blade Dancer in Demon Slayer (ufotable) anime style; "
        "high twin-tails of vibrant cyan-blue hair, sparkling turquoise eyes, confident playful wink; "
        "curvy athletic hourglass S-line body in a sleek navy-and-gold scale bikini armor top, bare midriff, and asymmetric high-slit silk wrap skirt revealing long sculpted legs; "
        "wielding twin swirling ufotable water-breathingchakram rings around her hands"
    ),
    8: (
        "Cascade (캐스케이드), glamorous 21-year-old female Waterfall Oracle Goddess in Demon Slayer (ufotable) anime style; "
        "swept-up sapphire-blue updo hair with a floating water-halo ring behind her head, serene yet seductive blue eyes; "
        "voluptuous hourglass S-line figure in a plunging deep-V white-and-gold halterneck high-slit silk dress revealing ample cleavage and long bare legs; "
        "surrounded by three small floating crystal water spheres near her hands"
    ),
    11: (
        "Ignis (이그니스), 19-year-old male Flame Dragon Knight youth in Demon Slayer (ufotable Rengoku-inspired) style; "
        "fierce sharp eyes with glowing amber-gold irises, wild spiky flame-crimson red hair with black-shaded tips; "
        "blackened-steel and dark-crimson dragon-scale chest armor over a sleeveless black combat vest revealing scarred muscular arms, tattered dark-crimson battle cloak; "
        "wielding a colossal blackened-steel solar greatsword with glowing magma runes"
    ),
    14: (
        "Pyro (파이로), seductive 20-year-old female Flame Empress Sorceress in Demon Slayer (ufotable) anime style; "
        "crimson-red twin-bun hair with flickering flame hair-ornaments, fiery golden-amber eyes, alluring smirk; "
        "voluptuous hourglass S-line figure in a sweetheart-neckline crimson-and-gold dragon-scale corset bustier and high-slit scarlet silk skirt revealing her long shapely legs in high-heeled greaves; "
        "holding a tall golden Phoenix Lantern Staff glowing with warm flame"
    ),
    22: (
        "Sylph (실프), alluring 19-year-old female Wind Muse Spirit in Demon Slayer (ufotable) anime style; "
        "silver-white braided twin-loops hair with a floating wind-halo, dreamy emerald-mint eyes; "
        "curvy hourglass S-line figure in a sheer mint-and-white off-shoulder silk corset bodysuit with flowing translucent wind ribbons and long bare legs; "
        "holding an ornate jade-and-silver Celestial Lyre harp"
    ),
    23: (
        "Sylphid (실피드), glamorous 20-year-old female Whispering Wind Fairy Queen in Demon Slayer (ufotable) anime style; "
        "golden-blonde wavy twin-tails crowned with a star tiara, luminous turquoise eyes, iridescent fairy wings folded behind her back; "
        "voluptuous hourglass S-line figure in a strapless emerald-leaf sweetheart corset mini-dress showing bare shoulders, cleavage, and long bare legs; "
        "holding a glowing star-tipped wind wand"
    ),
    24: (
        "Harpy (하피), fierce and sexy 20-year-old female Storm Wing Huntress in Demon Slayer (ufotable) anime style; "
        "wild bronze-gold high ponytail, sharp golden eyes, large brown-and-gold feathered wings folded behind her shoulders; "
        "curvy athletic hourglass S-line body in a bronze-and-feather tribal bikini armor top, bare toned midriff, and short feathered mini-skirt with long bare legs and talon greaves"
    ),
    28: (
        "Zeusphere (제우스피어), glamorous 21-year-old female Thunder Valkyrie Goddess in Demon Slayer (ufotable) anime style; "
        "long electric-blue high ponytail with silver wing hairpins, piercing sapphire eyes; "
        "voluptuous hourglass S-line figure in silver-and-cobalt bikini plate armor showing bare toned midriff and bare thighs above silver knee-high greaves; "
        "holding twin crackling blue lightning javelins"
    ),
    31: (
        "Gaia (가이아), cute and sexy 19-year-old female Earth Blossom Dryad in Demon Slayer (ufotable) anime style; "
        "chestnut-brown twin braided buns adorned with pink cherry blossoms, pointed elf ears, bright emerald eyes; "
        "curvy hourglass S-line figure in a tight emerald-green sweetheart corset bodice and short pink flower-petal mini-skirt revealing long bare legs; "
        "holding a glowing green nature lantern at her waist"
    ),
    33: (
        "Terra (테라), seductive 21-year-old female Ancient Forest Mother Goddess in Demon Slayer (ufotable) anime style; "
        "long wavy chestnut-brown hair reaching her hips with delicate golden deer antlers and a floral crown, warm green eyes; "
        "voluptuous hourglass S-line figure in a plunging emerald-and-gold halterneck high-slit dress showing ample cleavage and long bare legs; "
        "cradling a glowing emerald life-seed orb between her hands"
    ),
    34: (
        "Gorgon (고르곤), alluring 21-year-old female Venom Serpent Sorceress in Demon Slayer (ufotable Upper-Moon aesthetic) style; "
        "hair of living emerald-green vipers, hypnotic golden-green eyes, seductive smirk; "
        "voluptuous hourglass S-line figure standing on two human legs in an emerald-and-gold serpent-scale bikini bra top, bare midriff, and high-slit green silk skirt showing long bare legs; "
        "holding a golden winged mirror staff"
    ),
    41: (
        "Kadan (카단), 18-year-old male dark-fantasy anime protagonist in Demon Slayer: Kimetsu no Yaiba (ufotable) style; "
        "clean smooth unblemished forehead with ZERO scars, sharp determined jawline, intense glowing cyan-sapphire eyes, windblown spiky dark chestnut-brown hair with black ink-shaded tips; "
        "iconic tattered crimson-red woolen muffler wrapped around his neck, sleeveless charcoal-black leather adventurer vest over a dark-slate tunic revealing toned muscular warrior arms, dark iron bracers, dark combat trousers and boots; "
        "carrying the round dark-iron northern shield with a white snow-crystal emblem and wielding a glowing starlight-cyan crystalline broadsword"
    ),
    42: (
        "Elwin (엘윈), glamorous 22-year-old female Northern Valkyrie Swordswoman Queen in Demon Slayer (ufotable) anime style; "
        "golden-blonde crown-braided hair, luminous sapphire-blue eyes, noble alluring expression; "
        "curvy hourglass S-line figure in form-fitting silver-and-royal-blue valkyrie chest corset armor and high-slit royal-blue battle skirt revealing her shapely thighs above silver greaves; "
        "wielding twin glowing frost-cyan runic longswords in her hands"
    ),
    44: (
        "Kaze (카제), seductive 20-year-old female Shadow Kunoichi Ninja in Demon Slayer (ufotable) anime style; "
        "sharp alluring violet eyes, confident smirk, long dark-purple hair tied into a high sleek ponytail with a silver kunai ring; "
        "voluptuous hourglass S-line figure in a form-fitting midnight-purple and black sheer-mesh shinobi bodysuit with sweetheart leather bustier, thigh holsters, and thigh-high ninja boots; "
        "wielding twin glowing purple shadow assassination daggers in reverse grip"
    ),
    45: (
        "Gawain (가웨인), tall muscular blindfolded martial warrior monk in Demon Slayer (ufotable Gyomei-inspired) style; "
        "short golden-blonde hair beneath a crisp white linen blindfold tightly covering both eyes, stern chiseled jaw; "
        "sleeveless dark-indigo and charcoal monastic travel robe revealing toned muscular arms and heavy prayer beads around neck; "
        "holding a tall black-iron khakkhara monk staff with six brass rings"
    ),
    46: (
        "Rondol (론돌), 42-year-old colossal muscular vanguard warrior in Demon Slayer (ufotable) style; "
        "short-cropped grizzled dark-brown hair, rugged square jaw with thick stubble, fierce brown eyes with a scar over left brow; "
        "heavy dark-brown sleeveless open leather battle jerkin revealing muscular arms, thick rope belt, dark trousers, bronze bracers; "
        "carrying an enormous dark-oak boat oar-staff banded with bronze rings in his right hand and a heavy golden-crested tower shield on his left arm"
    ),
    48: (
        "Robinyard (로비냐드), glamorous and agile 20-year-old female Crimson Hood Forest Ranger in Demon Slayer (ufotable) anime style; "
        "auburn-red hair beneath a stylish crimson-red ranger hood, sharp amber eyes, confident wink; "
        "curvy hourglass S-line figure in a form-fitting forest-green and brown leather corset vest, short ranger skirt, and thigh-high leather boots showing bare thighs (zettai ryouiki); "
        "holding an ornate golden-carved recurve longbow"
    ),
    54: (
        "Arachne (아라크네), seductive 21-year-old female Spider-Demon Queen in Demon Slayer (ufotable Upper-Moon Daki aesthetic) style; "
        "pale porcelain skin, long raven-black twin-updo hair with a red spider-lily ornament, alluring crimson eyes; "
        "voluptuous hourglass S-line figure standing on two long human legs in a plunging gothic black-and-crimson silk corset dress with high thigh slit and eight glossy black spider legs fanning out from her back like a dark halo"
    ),
    56: (
        "Cardis (카디스), seductive 20-year-old female Abyssal Flame Witch in Demon Slayer (ufotable) anime style; "
        "long wavy magenta-rose hair beneath a pointed dark-violet witch hat with a golden crescent buckle, alluring violet eyes; "
        "voluptuous hourglass S-line figure in a plunging off-shoulder dark-purple and gold corset gown with a high front slit revealing her long bare legs; "
        "channeling two small purple abyssal flame orbs above her palms"
    ),
    62: (
        "Celia (실리아), glamorous 18-year-old female Wind Priestess Princess Heroine in Demon Slayer (ufotable) anime style; "
        "long waist-length emerald-mint green wavy hair with twin braided side-locks pinned by pink cherry-blossom hairpins, pointed elf ears, luminous aquamarine-emerald eyes; "
        "voluptuous hourglass S-line figure in a form-fitting emerald-green and gold sweetheart-neckline high-slit dress revealing ample cleavage and long bare sculpted legs; "
        "holding her ornate glowing emerald-jade blossom wind staff (녹옥 지팡이) in her right hand"
    ),
    63: (
        "Eliana (엘리아나), glamorous 20-year-old female Apothecary Healer Beauty in Demon Slayer (ufotable) anime style; "
        "wavy strawberry-pink blonde twin-tails crowned with a pink rose flower wreath, pointed elf ears, warm golden-rose eyes; "
        "voluptuous hourglass S-line figure in a plunging sweetheart-neckline pink-and-gold flower-petal corset mini-dress showing ample cleavage and long bare legs; "
        "holding a glowing golden elixir potion vial in her right hand and a blooming flower healing wand in her left hand"
    ),
    64: (
        "Titania (티타니아), sexy 20-year-old female Northern Huntress Princess in Demon Slayer (ufotable) anime style; "
        "long thick twin-braided golden-blonde hair tied with white fur ribbons and a golden headband, bright blue eyes; "
        "voluptuous hourglass S-line figure in a white-fur-trimmed brown leather corset crop-top, bare toned midriff, short pleated leather mini-skirt, and fur-trimmed thigh-high boots; "
        "holding a carved horn recurve bow"
    ),
    65: (
        "Sylvania (실바니아), sexy 19-year-old female Sylvan Leaf Blade Dancer Elf in Demon Slayer (ufotable) anime style; "
        "high vibrant emerald-green twin-tails wrapped with vine ribbons, pointed elf ears, sharp emerald eyes; "
        "voluptuous hourglass S-line figure in a leaf-and-gold bikini armor top and high-cut leaf bikini bottom revealing her toned midriff and long bare legs with emerald shin greaves; "
        "wielding twin glowing green crystal leaf daggers"
    ),
    67: (
        "Vezax (베작스), seductive 21-year-old female Void Star Sorceress Elf in Demon Slayer (ufotable) anime style; "
        "long royal-purple hime-cut twin-tails with golden wing hairpins, pointed elf ears, hypnotic violet eyes; "
        "voluptuous hourglass S-line figure in a plunging deep-V purple-and-gold corset high-slit gown revealing ample cleavage and long bare legs; "
        "flanked by two small dark-violet galaxy orbs floating near her hands"
    ),
    68: (
        "Kaeltor (캘토르), glamorous 21-year-old female Silver Valkyrie Lancer Elf in Demon Slayer (ufotable) anime style; "
        "long braided golden-blonde hair crowned with a silver winged valkyrie tiara, pointed elf ears, piercing blue eyes; "
        "curvy hourglass S-line figure in a form-fitting silver-and-sapphire breastplate corset, short armored battle skirt revealing bare thighs (zettai ryouiki), silver thigh-high greaves, and royal blue cape; "
        "holding a gleaming silver lunar lance"
    ),
    70: (
        "Aila (에일라), seductive 20-year-old female Starlight Moon Assassin Mage in Demon Slayer (ufotable) anime style; "
        "long midnight-blue hair styled in twin odango buns with a glowing crescent-moon mark on her forehead, pointed elf ears, captivating sapphire eyes; "
        "voluptuous hourglass S-line figure in a form-fitting midnight-blue starry keyhole-halterneck high-slit dress revealing a diamond chest cutout and long bare sculpted legs; "
        "wielding twin silver crescent-moon chakram blades"
    ),
    74: (
        "Grimli (그림리), stout hyper-muscular dwarven master blacksmith in Demon Slayer (ufotable) style; "
        "wild bushy dark hair and a colossal braided fiery-orange beard reaching down to his belt with bronze rings, fierce hearty face; "
        "blackened-iron studded leather armor and soot-stained forge apron over massive muscular arms; "
        "hoisting a colossal two-handed square-headed forged steel runic warhammer over his shoulder"
    ),
    89: (
        "Medusa Gorgo (메두사 고르고), seductive 22-year-old female Abyssal Serpent Queen in Demon Slayer (ufotable Upper-Moon demon aesthetic) style; "
        "crown of dark-emerald and violet venomous snakes for hair, hypnotic glowing magenta-gold eyes, pale porcelain skin; "
        "voluptuous hourglass S-line figure standing upright on two long human legs, wearing an ornate black-and-gold scale bikini bustier, bare toned midriff, and translucent dark-violet high-slit silk skirt showing her bare legs; "
        "holding a twin-serpent amethyst staff"
    ),
    107: (
        "Ysela (이셀라), glamorous 22-year-old female Starlight Dragon Priestess Queen in Demon Slayer (ufotable) anime style; "
        "flowing royal-sapphire blue hair with curved golden dragon horns rising from her crown, luminous golden-violet eyes, majestic starry-blue dragon wings spread gracefully behind her back; "
        "voluptuous hourglass S-line figure in a plunging royal-blue and gold dragon-scale corset gown with a high thigh slit revealing her long bare legs; "
        "radiating regal draconic charisma"
    ),
}


def build_110_prompts() -> dict[str, dict]:
    cards = parse_110_cards()
    out: dict[str, dict] = {}
    for cid in range(1, 111):
        card = cards[cid]
        slug = card["seat_filename"].replace(".png", "")
        gender_type, role_title, hair_head, body_desc, item_desc = ANIME_CHAR_SPECS[cid]
        solo_entry = ALL_110_SOLO_PROMPTS.get(cid, "")
        solo_base = solo_entry[1] if isinstance(solo_entry, tuple) else str(solo_entry)
        cleaned = re.sub(r"^SOLO SINGLE CHARACTER MODEL SHEET of\s*", "", solo_base, flags=re.I)
        cleaned = re.sub(r"Pure solid flat white background.*$", "", cleaned, flags=re.I).strip()

        if cid in WEBTOON_GLAMOUR_OVERRIDES:
            core_desc = WEBTOON_GLAMOUR_OVERRIDES[cid]
        elif gender_type == "female":
            core_desc = (
                f"{card['title_en']} ({card['title_ko']}), glamorous and seductive anime heroine in Demon Slayer: Kimetsu no Yaiba (ufotable) style. "
                f"{cleaned} Voluptuous curvy hourglass S-line figure, form-fitting alluring outfit, expressive sparkling anime eyes. "
                f"Hair/Head: {hair_head}. Body/Outfit: {body_desc}. Signature weapon/item: {item_desc}."
            )
        else:
            core_desc = (
                f"{card['title_en']} ({card['title_ko']}) in Demon Slayer: Kimetsu no Yaiba (ufotable) style. "
                f"{cleaned} Powerful charismatic proportions, razor-sharp details. "
                f"Head/Trait: {hair_head}. Silhouette: {body_desc}. Signature weapon/item: {item_desc}."
            )

        prompt = (
            f"Masterpiece 2D fantasy anime solo single full-body character illustration in the exact visual style of Demon Slayer: Kimetsu no Yaiba by ufotable. "
            f"Strictly ONE single full-body standing figure of {core_desc} "
            f"Full-body standing pose from head to toe, complete head hair/horns/crown fully inside top margin, both feet/boots fully visible inside bottom margin, centered vertically with generous white margin on all 4 sides. "
            f"Bold dynamic sumi-e black ink outlines, vibrant high-contrast ufotable cel-shading, dramatic rim lighting on character only, expressive anime eyes, rich fabric and metallic detail. "
            f"Pure solid flat white background (#FFFFFF) with nothing else included. "
            f"STRICTLY ONE FIGURE ONLY: no multiple angles, no turnaround views, no inset portraits, no floating background scenery, no ground shadow puddles, ZERO text, ZERO labels, ZERO watermarks."
        )
        out[str(cid)] = {
            "id": cid,
            "slug": f"{cid:03d}_{slug}",
            "imageName": f"webtoon_char_{cid:03d}",
            "genderType": gender_type,
            "isPriorityGlamour": (cid in WEBTOON_GLAMOUR_OVERRIDES or gender_type == "female"),
            "prompt": prompt,
        }
    PROMPTS_JSON.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    return out


def sync_generated_brain_images_to_cutouts() -> list[int]:
    prompts_data = build_110_prompts()
    updated_ids: list[int] = []

    for cid_str, meta in prompts_data.items():
        cid = int(cid_str)
        img_prefix = meta["imageName"]
        slug = meta["slug"]
        matches = sorted(
            glob.glob(str(BRAIN_ROOT / "*" / f"{img_prefix}_*.jpg"))
            + glob.glob(str(BRAIN_ROOT / "*" / f"{img_prefix}_*.png")),
            key=os.path.getmtime,
        )
        if not matches:
            continue
        latest_file = Path(matches[-1])
        cut_path = CUTOUT_DIR / f"{slug}.png"
        raw_path = RAW_SOLO_DIR / f"{slug}.jpg"

        if cut_path.exists() and cut_path.stat().st_mtime >= latest_file.stat().st_mtime:
            continue

        im_rgb = Image.open(latest_file).convert("RGB")
        im_rgb.save(raw_path, "JPEG", quality=94, optimize=True)
        rgba = clean_cutout_specks(remove_white_bg_clean(im_rgb), keep_only_main=False)
        rgba.save(cut_path, "PNG", optimize=True)
        updated_ids.append(cid)
        print(f"[SYNC] #{cid:03d} ({slug}) <- {latest_file.name} ({rgba.size[0]}x{rgba.size[1]} RGBA)")

    if updated_ids:
        print(f"Rebuilding character sheets & busts for {len(updated_ids)} newly generated characters...")
        rebuild_all_character_sheets()
    else:
        print("No new webtoon_char_* images found to sync.")
    return updated_ids


if __name__ == "__main__":
    sync_generated_brain_images_to_cutouts()
