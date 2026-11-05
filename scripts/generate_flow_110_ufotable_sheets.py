#!/usr/bin/env python3
"""
Generate all 110 Character Cutouts (transparent RGBA PNGs) and Studio Sheets,
plus all 20 Canonical Background Location Sheets in Google Flow (🍌 Nano Banana 2.1)
using Demon Slayer (ufotable) 2D dark-fantasy anime style and novel lore fidelity.
"""

import json
import os
import re
import subprocess
import sys
import time
import urllib.request
from pathlib import Path
from PIL import Image
import numpy as np

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
from build_locations_and_props_sheets import (
    LOCATIONS,
    get_font,
    hex_to_rgb,
    draw_wrapped_text,
)
from PIL import ImageDraw, ImageEnhance

CARDS_BY_ID = parse_110_cards()

RAW_SOLO_DIR = ROOT / "public" / "anime-character-sheets" / "raw_ufotable_solo"
CUTOUTS_DIR = ROOT / "public" / "anime-character-sheets" / "cutouts"
SHEETS_DIR = ROOT / "public" / "anime-character-sheets" / "sheets"
LOC_ART_DIR = ROOT / "public" / "anime-character-sheets" / "locations" / "art"
LOC_SHEETS_DIR = ROOT / "public" / "anime-character-sheets" / "locations" / "sheets"

for d in (RAW_SOLO_DIR, CUTOUTS_DIR, SHEETS_DIR, LOC_ART_DIR, LOC_SHEETS_DIR):
    d.mkdir(parents=True, exist_ok=True)


# Novel-accurate overrides for main and recurring novel characters so their appearance,
# costume, and props match the novel story 100% in ufotable dark-fantasy anime style.
NOVEL_LORE_OVERRIDES = {
    41: (
        "Kadan, 19-year-old male human swordsman hero and inheritor of the Star-Breathing technique. "
        "Athletic 7.5-head-tall anime warrior physique, tousled dark chestnut-brown hair with sharp bangs framing his forehead, "
        "piercing bright cyan-blue eyes, determined heroic expression. "
        "Wearing his iconic tattered deep-crimson cloth muffler wrapped around his neck, sleeveless dark-charcoal leather battle vest over a fitted black tunic, "
        "reinforced leather bracers on both forearms, dark charcoal tactical trousers with leather straps, and heavy steel-toed combat boots. "
        "In his left hand he holds the round dark-iron Dragon Breaker Shield (드래곤 브레이커 쉴드) engraved with a crisp cyan snow-crystal emblem at its center; "
        "in his right hand he holds a silver-steel broadsword."
    ),
    62: (
        "Celia, 18-year-old female spirit mage and wind-wood sorceress heroine of the novel. "
        "Slender graceful 7.5-head-tall anime heroine, waist-length silky emerald-mint green hair worn half-up with delicate pink cherry-blossom hairpins, "
        "warm amber-gold eyes, gentle yet resolute expression. "
        "Wearing an ornate dark-teal and ivory layered kimono-inspired mage battle robe with gold floral embroidery, wide emerald silk obi sash, "
        "detached white-and-teal sleeveruff cuffs, pleated dark-emerald skirt, and strapped mage boots. "
        "Holding her signature wooden Jade Staff (녹옥 지팡이) topped with a faceted glowing emerald crystal orb in both hands."
    ),
    11: (
        "Ignis, 24-year-old male crimson fire dragon-knight and rival swordsman from the novel. "
        "Tall muscular 7.5-head-tall anime warrior, wild spiky flame-red hair with golden-orange tips, "
        "fierce molten-gold slit-pupil eyes, confident battle smirk. "
        "Wearing blackened volcanic dragon-scale plate armor with glowing magma-orange filigree along the pauldrons and chestplate, "
        "a tattered scorched black-and-crimson half-cape over one shoulder, clawed gauntlets, and armored greaves. "
        "Wielding his massive obsidian-and-ruby Flame Greatsword (염화대검) held firmly at his side."
    ),
    46: (
        "Rondol, 22-year-old male frontline shield-vanguard and loyal companion from the novel. "
        "Broad-shouldered muscular 7.5-head-tall anime warrior, short-cropped dark-brown hair, thick eyebrows, "
        "a small faded scar over his left brow, warm brown eyes, dependable grin. "
        "Wearing a sleeveless brown leather battle jerkin over a beige linen shirt, heavy iron shoulder guards, "
        "sturdy leather belt with supply pouches, olive-drab cargo trousers, and iron-shod boots. "
        "In his right hand he carries his heavy dark-oak boat oar-staff (거대한 참나무 배 노) used as a polearm, "
        "and on his left arm a weathered iron-rimmed kite shield."
    ),
    70: (
        "Aila, 19-year-old female priestess of light and sanctuary healer from the novel. "
        "Graceful 7.5-head-tall anime priestess, long wavy golden-blonde hair reaching her waist, "
        "serene sky-blue eyes, golden winged sun-circlet resting on her brow. "
        "Wearing a pure white and royal-gold high-collared cleric vestment with gold-embroidered sun motifs, "
        "long flowing bishop sleeves with blue silk lining, a golden rosary belt, and white-and-goldheeled greaves. "
        "Holding a tall golden sun-crest Bishop Crosier staff in her right hand and a gold-bound Holy Scripture tome in her left hand."
    ),
    44: (
        "Kaze, 20-year-old male shadow-wind shinobi assassin from the novel. "
        "Lean agile 7.5-head-tall anime ninja, jagged silver-white hair swept over one eye, "
        "sharp icy-teal eyes, a dark-navy cloth mask pulled down around his neck. "
        "Wearing a fitted midnight-blue and charcoal shinobi battle suit with segmented black leather armor over the chest and shoulders, "
        "forearm kunai bracers, bandages wrapped around his shins, and split-toe combat boots. "
        "Wielding twin reverse-grip wind-etched Ninjato short blades."
    ),
    63: (
        "Eliana, 20-year-old female high-elf wind-bow ranger and forest sentinel from the novel. "
        "Slender tall 7.5-head-tall anime elf archer, long braided platinum-blonde hair adorned with green leaf clasps, "
        "long pointed elven ears, sharp emerald-green eyes. "
        "Wearing an emerald-green and russet-brown leather ranger tunic with silver leaf-filigree shoulder guards, "
        "a hooded forest-green cloak fastened with a silver brooch, archer's bracer on her left arm, and knee-high leather boots. "
        "Holding a carved silver-yew Elven Longbow in her left hand and a feathered arrow in her right hand."
    ),
    89: (
        "Medusa Gorgo, cursed Gorgon queen of the petrified ruins from the novel. "
        "Tall regal 7.5-head-tall anime dark-fantasy villainess, pale alabaster skin, hypnotic glowing purple-gold serpentine eyes, "
        "hair composed of dark-emerald venomous vipers with glowing yellow eyes coiling around her crown. "
        "Wearing an ornate black-and-gold Greek-inspired scale bustier and slit dark-violet silk dress with bronze serpent Pauldrons and golden armlets; "
        "fully human legs in bronze serpent-scale greaves standing upright on two feet. "
        "Holding a twin-serpent bronze ritual staff with a purple jewel."
    ),
    42: (
        "Elwin, Kadan's mother and Aleksandar's wife, graceful and courageous northern swordswoman from Elwin Village in the novel. "
        "Graceful 7.5-head-tall anime heroine and northern warrior-mother, royal golden Valkyrie crown-braided hair with soft side ringlets, "
        "warm sapphire-blue eyes, gentle yet resolute maternal expression. "
        "Wearing a silver-and-royal-blue Holy Knight armored bodice under a warm dark-navy frontier wool cloak trimmed with white winter fur, "
        "a long navy battle skirt, and leather boots. "
        "Holding a glowing Silver Runic Dagger close to her heart in one hand and a frost-runed Arcane Holy Knight longsword at her side."
    ),
    107: (
        "Ysela, Ignis's mother and Balian's wife, noble Starlight Dragon-Priestess from the novel. "
        "Ethereal 7.5-head-tall anime dragon-priestess heroine, floor-length luminous sapphire-lavender hair adorned with starlight hairpins, "
        "graceful curved pearl-gold dragon horns rising from her temples, luminous golden-violet eyes. "
        "Wearing a regal starlight-indigo and silver-white northern ceremonial gown with silver dragon-scale shoulder armor and a warm celestial winter shawl. "
        "Cradling a glowing crystal Star-Orb in her hands."
    ),
    74: (
        "Grimli, master dwarf runesmith and forge-warrior from the Iron Citadel in the novel. "
        "Stocky powerful muscular dwarf smith, thick braided copper-red beard reaching his belt with iron rune-rings, "
        "fierce amber eyes beneath bushy brows. "
        "Wearing heavy blackened-iron dwarven rune-plate armor over a scorched leather blacksmith apron, "
        "thick riveted gauntlets, and iron-plated boots. "
        "Hoisting a massive rune-etched Dwarven Forge Warhammer over his right shoulder and holding forged iron tongs in his left hand."
    ),
    49: (
        "Hercul, towering surviving paladin of the Arcane Holy Knights and master of the Seven Pursuers from the novel. "
        "Towering heavily muscled 8-head-tall anime veteran warrior-paladin, wild mane of dark chestnut-brown long hair and thick full beard, "
        "fierce yet warm amber-brown eyes, battle scars across his muscular chest. "
        "Wearing a weathered leather bandolier and tattered Holy Knight pilgrim cloak over his broad shoulders, "
        "a cracked golden Holy Knights seal at his war-belt, radiant golden-mana gauntlets on his forearms, and iron-plated boots. "
        "Holding twin glowing Silver Runic Daggers in his right hand and a massive golden-runed crescent greatsword in his left hand."
    ),
    45: (
        "Gawain, blind ascetic warrior-monk of the Silent Temple from the novel. "
        "Tall lean muscular 7.5-head-tall anime martial monk, short spiky ash-grey hair, "
        "eyes covered by a clean white linen blindfold tied behind his head, serene stoic expression. "
        "Wearing a sleeveless dark-indigo monastic martial arts robe tied with a frayed hemp rope belt, "
        "prayer beads draped around his neck, cloth wraps around his forearms and fists, baggy martial trousers, and monk sandals. "
        "Holding a tall bronze six-ringed Khakkhara monk staff (석장) vertically in his right hand."
    ),
    50: (
        "Aleksandar, Kadan's father and Elwin's husband, descendant of the fallen Order of Arcane Holy Knights and legendary northern twin-blade hunter from the novel. "
        "Commanding 7.5-head-tall muscular anime northern warrior-knight, neat chestnut-brown hair and trimmed beard crowned with a slender golden circlet, "
        "piercing steel-blue eyes, resolute noble expression. "
        "Wearing a royal-blue and gold-trimmed Arcane Holy Knight armored coat over a dark frontier tunic, grey winter wolf-fur shoulder mantle, "
        "reinforced leather bracers, and armored riding boots. "
        "Wielding his masterwork Twin Arcane Longswords (벼린 아케인 쌍검)—one glowing silver-blue runic longsword in each hand."
    ),
    61: (
        "Lucian, ambitious highborn nobleman of the Red Glass Court who raided Elwin Village in the novel. "
        "Tall slender 7.5-head-tall anime highborn nobleman, silky long emerald-green hair, pointed noble elf ears, "
        "cold crimson-gold eyes, arrogant aristocratic sneer. "
        "Wearing an ornate dark-emerald and black-gold Red Glass Court noble uniform coat, "
        "a luxurious white ermine fur cloak fastened with a golden serpentine crest brooch, black leather gloves, and tall buckled riding boots. "
        "Holding an ornate emerald-and-gold Arcane Greatbow with a glowing green mana arrow in his left hand and a rune-etched noble sword at his hip."
    ),
    66: (
        "Malfuon, arch-druid elder of the World Tree from the novel. "
        "Tall majestic 7.5-head-tall anime forest sage, long emerald-green hair and flowing beard, "
        "great branching wooden stag antlers growing naturally from his brow, glowing amber eyes. "
        "Wearing living bark-and-gold druidic ceremonial armor woven with autumn leaves and emerald gems, "
        "a feathered mantle across his shoulders, and root-woven boots. "
        "Holding a gnarled Great Oak World-Tree Staff with a glowing green heartstone."
    ),
    48: (
        "Robinyard, legendary outlaw marksman of the Sherwood Frontier from the novel. "
        "Athletic 7.5-head-tall anime rogue-archer, tousled auburn-brown hair under a jaunty forest-green feathered cap, "
        "sharp hazel eyes, roguish grin with a neat goatee. "
        "Wearing a dark-green leather brigandine vest over a russet tunic, leather quiver strapped across his back, "
        "fingerless archery gloves, dark brown breeches, and cuffed leather boots. "
        "Holding a masterwork yew Recurve Longbow in his left hand."
    ),
    13: (
        "Belphegor, demonic arch-lord of the Abyssal Forge from the novel. "
        "Imposing 7.5-head-tall anime demon warlord, ashen-grey skin, swept-back black obsidian horns, "
        "wild silver-black hair, burning orange-red eyes. "
        "Wearing heavy blackened hell-iron plate armor etched with glowing crimson runes, spiked pauldrons, "
        "a tattered dark-crimson cape, and clawed iron sabatons. "
        "Wielding a massive double-bitted Hellfire Battleaxe."
    ),
    25: (
        "Aeolus, sovereign wind-lord of the Floating Sky Citadel from the novel. "
        "Graceful 7.5-head-tall anime sky-noble, flowing sky-blue and silver hair, luminous cyan eyes, "
        "small feathered wing-crests on his silver circlet. "
        "Wearing white-and-cerulean tempest silk robes layered with lightweight silver wind-plate armor, "
        "flowing ribbon sashes, and winged silver greaves. "
        "Holding a twin-bladed silver Wind-Halberd."
    ),
    43: (
        "Balian, Ignis's father and Ysela's husband, veteran Arcane Spearman of the fallen Order of Arcane Holy Knights from the novel. "
        "Tall rugged 7.5-head-tall anime paladin-spearman, short golden-blond hair with a silver winged knight circlet on his brow, "
        "steely cyan-blue eyes, square jaw with light stubble. "
        "Wearing polished silver-and-white Arcane Holy Knight plate armor emblazoned with a golden cross tabard, "
        "heavy pauldrons, a deep crimson winter cape, and steel sabatons. "
        "Wielding his signature glowing cyan-runed Arcane Spear (아케인 창) in his right hand and a weathered iron cross-shield on his left arm."
    ),
    86: (
        "Leonar, proud Lion-Beastkin warrior king of the Savanna Clans from the novel. "
        "Tall muscular 7.5-head-tall humanoid lion-man warrior with a majestic golden-amber lion head and thickflowing dark-gold mane, "
        "fierce golden eyes, a battle scar across his muzzle. "
        "Wearing regal bronze-and-crimson tribal king plate armor over a muscular torso, leather war-kilt with gold medallions, "
        "spiked gauntlets, and armored greaves. "
        "Wielding twin heavy curved Lion-Fang Greatswords."
    ),
    21: (
        "Zephyros, swift west-wind blade dancer and aerial duelist from the novel. "
        "Lithesome 7.5-head-tall anime swordsman, windswept mint-silver hair, bright turquoise eyes. "
        "Wearing an aerodynamic white-and-teal leather coat with silver wing-motifs, light pauldrons, "
        "fitted trousers, and buckled wind-runner boots. "
        "Holding dual slender curved Wind-Sabers."
    ),
    81: (
        "Fenrir, humanoid Dire-Wolf berserker lord of the Frozen North from the novel. "
        "Tall ferocious 7.5-head-tall humanoid wolf-warrior with Frost-grey and midnight-black wolf fur, "
        "snarling lupine muzzle, glowing ice-blue eyes, jagged broken iron chain links hanging from his wrists and collar. "
        "Wearing Nordic dark-iron and frost-fur gladiator shoulder armor, rune-carved belt, and leather war-kilts. "
        "Clawed hands brandishing a frost-iron Great Cleaver."
    ),
    60: (
        "Death Knight Artus, fallen cursed paladin commander of the Undead Legion from the novel. "
        "Towering 7.5-head-tall anime dark knight, long ghostly-white hair cascading from beneath a horned black-iron skull-crown helm, "
        "glowing spectral cyan eyes inside shadowed sockets, pale undead visage. "
        "Wearing jagged frost-blackened gothic full plate armor with skull pauldrons, a tattered midnight-blue cape, and spiked gauntlets. "
        "Two-handing his cursed rune-etched Frost-Mourne Greatsword."
    ),
    87: (
        "Barghest, shadowy demon-hound hunter in dark humanoid monster-knight form from the novel. "
        "Muscular 7.5-head-tall humanoid black-hound fiend with pitch-black fur, pointed ears, glowing blood-red eyes, "
        "iron spiked collar and dark-steel brigandine armor with cursed iron chains wrapped around his forearms. "
        "Wielding a jagged black-iron Chain-Glaive."
    ),
    54: (
        "Arachne, dark-weaver assassin queen of the Silk Cavern from the novel. "
        "Slender 7.5-head-tall anime dark-fantasy female assassin standing upright on two human legs, "
        "pale porcelain skin, long raven-black hair with a spider-lily hairpin, six small ruby-red eyes on her brow above her main crimson eyes. "
        "Wearing a gothic black-and-crimson silk corset armor with eight articulated mechanical-chitin spider-legs folded neatly like a cape behind her back, "
        "and high-laced black boots. Holding twin razor-wire Stiletto daggers."
    ),
    23: (
        "Sylphid, high wind-spirit valkyrie maiden from the novel. "
        "Graceful 7.5-head-tall anime spirit maiden, flowing pastel-emerald hair, luminous jade eyes, "
        "four translucent dragonfly-feather spirit wings folded behind her back. "
        "Wearing a white-and-mint Grecian battle tunic with silver wind-filigree armor and knee-high winged sandals. "
        "Holding a slender silver Wind-Lance."
    ),
    64: (
        "Titania, Sovereign Fairy Queen of the Moonlit Avalon Forest from the novel. "
        "Regal 7.5-head-tall anime fae queen, floor-length rose-gold hair crowned with a living diamond-flower tiara, "
        "iridescent butterfly wings folded gracefully behind her back, luminous violet eyes. "
        "Wearing an ornate emerald-and-gold royal fae gown with armored petal pauldrons. "
        "Holding a starlight Floral Royal Scepter."
    ),
    99: (
        "Magitech Golem, ancient Imperial Clockwork-Rune War Automaton from the novel. "
        "Towering 7.5-head-tall humanoid mechanical knight constructed of polished brass, dark meteoric iron, and glowing cyan mana-core crystal in its chest, "
        "single glowing cyan visor eye in an armored knightly head, heavy articulated gear-driven pauldrons and gauntlets, "
        "carrying a massive Magitech siege shield and rune-hammer."
    ),
}


def build_ufotable_solo_prompt(cid: int, card: dict) -> str:
    spec = ANIME_CHAR_SPECS.get(cid)
    solo_entry = ALL_110_SOLO_PROMPTS.get(cid, "")
    solo_base = solo_entry[1] if isinstance(solo_entry, tuple) else str(solo_entry)

    if cid in NOVEL_LORE_OVERRIDES:
        char_desc = NOVEL_LORE_OVERRIDES[cid]
    else:
        # Clean solo_base to extract the pure character/costume/prop description
        cleaned = re.sub(r"^SOLO SINGLE CHARACTER MODEL SHEET of\s*", "", solo_base, flags=re.I)
        cleaned = re.sub(r"Pure solid flat white background.*$", "", cleaned, flags=re.I).strip()
        if spec:
            _gender_type, role_title, hair_head, body_desc, item_desc = spec
            char_desc = (
                f"{cleaned} "
                f"Role: {role_title}. Head/Hair details: {hair_head}. "
                f"Outfit/Silhouette: {body_desc}. Signature weapon/item: {item_desc}."
            )
        else:
            char_desc = cleaned

    prompt = (
        f"Masterpiece 2D dark-fantasy anime solo single full-body character illustration in Demon Slayer: Kimetsu no Yaiba (ufotable) studio style. "
        f"Strictly ONE single full-body standing figure of {char_desc} "
        f"Full-body standing pose from head to toe, complete head hair and crown fully inside top margin, both feet/boots fully visible inside bottom margin, centered vertically. "
        f"Bold variable-width black ink lineart, dramatic high-contrast ufotable anime cel shading, crisp fabric folds and metallic highlights. "
        f"Pure solid flat white background (#FFFFFF) with nothing else included. "
        f"STRICTLY ONE FIGURE ONLY: no multiple angles, no turnaround views, no extra head portraits, no back view, no floating weapon diagrams, "
        f"no floating aura particles, no ground effects, no wind swirls around feet, no background scenery, no text, no labels, no watermarks."
    )
    return prompt


def build_ufotable_location_prompt(loc: dict) -> str:
    return (
        f"Masterpiece 2D dark-fantasy anime environment background art in Demon Slayer: Kimetsu no Yaiba (ufotable) and Makoto Shinkai studio style. "
        f"16:9 widescreen cinematic anime establishing shot of {loc['nameEn']} ({loc['regionEn']}): {loc['promptEn']} "
        f"Dramatic ufotable volumetric lighting, crisp hand-painted anime architectural and natural details, rich atmospheric depth. "
        f"PURE ENVIRONMENT BACKGROUND ONLY: strictly zero characters, zero people, zero monsters, zero text, zero UI, zero watermarks, no borders."
    )


def render_location_sheet_from_art(loc: dict, art_im: Image.Image) -> Image.Image:
    wide_art = art_im.resize((1280, 720), Image.Resampling.LANCZOS)
    sheet = Image.new("RGB", (1600, 1000), (251, 249, 245))
    draw = ImageDraw.Draw(sheet)
    accent = hex_to_rgb(loc["color"])

    f_badge = get_font(18, bold=True)
    f_title_en = get_font(32, bold=True)
    f_title_ko = get_font(24, bold=True)
    f_sec = get_font(16, bold=True)
    f_body = get_font(17, bold=False)
    f_mono = get_font(15, bold=False)

    draw.rectangle([0, 0, 1600, 88], fill=(20, 18, 18))
    draw.rectangle([0, 84, 1600, 88], fill=accent)
    draw.rectangle([28, 18, 165, 66], fill=accent)
    draw.text((44, 30), loc["code"], font=f_badge, fill=(255, 255, 255))
    draw.text((185, 16), f"{loc['nameEn']}  —  {loc['nameKo']}", font=f_title_en, fill=(255, 255, 255))
    ep_str = "EPs: " + ", ".join(f"EP{e:02d}" for e in loc["episodes"][:10])
    if len(loc["episodes"]) > 10:
        ep_str += f" (+{len(loc['episodes'])-10})"
    draw.text((185, 54), f"REGION: {loc['regionEn']} ({loc['regionKo']})   |   {ep_str}", font=f_mono, fill=(210, 210, 210))

    draw.rectangle([28, 108, 968, 690], fill=(255, 255, 255), outline=(40, 36, 36), width=2)
    draw.rectangle([28, 108, 968, 142], fill=(32, 29, 29))
    draw.text((42, 116), "01 WIDE ESTABLISHING SHOT (16:9 UFOTABLE FLOW ENVIRONMENT ART)", font=f_sec, fill=(255, 255, 255))
    main_img = wide_art.resize((924, 520), Image.Resampling.LANCZOS)
    sheet.paste(main_img, (36, 152))

    draw.rectangle([28, 706, 968, 972], fill=(255, 255, 255), outline=(40, 36, 36), width=2)
    draw.rectangle([28, 706, 968, 740], fill=(32, 29, 29))
    draw.text((42, 714), "02 LANDMARK FOCUS & LIGHTING / TEXTURE CLOSE-UP", font=f_sec, fill=(255, 255, 255))

    pw, ph = wide_art.size
    crop1 = wide_art.crop((int(pw * 0.12), int(ph * 0.10), int(pw * 0.58), int(ph * 0.75))).resize((445, 212), Image.Resampling.LANCZOS)
    crop2 = wide_art.crop((int(pw * 0.42), int(ph * 0.22), int(pw * 0.88), int(ph * 0.88))).resize((445, 212), Image.Resampling.LANCZOS)
    sheet.paste(crop1, (40, 748))
    sheet.paste(crop2, (508, 748))
    draw.rectangle([40, 748, 485, 960], outline=accent, width=2)
    draw.rectangle([508, 748, 953, 960], outline=accent, width=2)

    draw.rectangle([988, 108, 1572, 600], fill=(255, 255, 255), outline=(40, 36, 36), width=2)
    draw.rectangle([988, 108, 1572, 142], fill=accent)
    draw.text((1004, 116), "03 ENGLISH NOVEL NAMING & ENVIRONMENT SPECIFICATION", font=f_sec, fill=(255, 255, 255))

    cy = 160
    draw.text((1008, cy), f"• Canonical English Name: {loc['nameEn']}", font=f_title_ko, fill=(20, 18, 18))
    cy += 38
    draw.text((1008, cy), f"• 한국어 소설 공식 명칭: {loc['nameKo']}", font=f_body, fill=(60, 56, 56))
    cy += 32
    draw.text((1008, cy), f"• 등장 회차 (Episodes): {', '.join(str(e) for e in loc['episodes'])}화", font=f_body, fill=accent)
    cy += 38

    draw.line([1008, cy, 1552, cy], fill=(220, 215, 210), width=1)
    cy += 14
    draw.text((1008, cy), "[소설 배경 설정 및 서사적 역할]", font=f_sec, fill=(20, 18, 18))
    cy += 26
    cy = draw_wrapped_text(draw, loc["summaryKo"], 1008, cy, 540, f_body, (45, 42, 42), 25)
    cy += 14

    draw.text((1008, cy), "[건축 양식 및 지형지물 특징]", font=f_sec, fill=(20, 18, 18))
    cy += 26
    cy = draw_wrapped_text(draw, loc["architectureKo"], 1008, cy, 540, f_body, (45, 42, 42), 25)
    cy += 14

    draw.text((1008, cy), "[조명·기후·시간대 연출 지침]", font=f_sec, fill=(20, 18, 18))
    cy += 26
    cy = draw_wrapped_text(draw, loc["atmosphereKo"], 1008, cy, 540, f_body, (45, 42, 42), 25)

    draw.rectangle([988, 616, 1572, 972], fill=(255, 255, 255), outline=(40, 36, 36), width=2)
    draw.rectangle([988, 616, 1572, 650], fill=(32, 29, 29))
    draw.text((1004, 624), "04 5-COLOR SWATCH & ENGLISH CUTSCENE / VIDEO PROMPT", font=f_sec, fill=(255, 255, 255))

    for i, hex_c in enumerate(loc["palette"]):
        sx = 1008 + i * 108
        sy = 666
        draw.rectangle([sx, sy, sx + 96, sy + 48], fill=hex_to_rgb(hex_c), outline=(32, 29, 29), width=1)
        draw.text((sx + 10, sy + 54), hex_c.upper(), font=f_mono, fill=(60, 56, 56))

    draw.text((1008, 746), "[Unified English Prompt for Cutscene & Video Generation]", font=f_sec, fill=accent)
    draw_wrapped_text(draw, loc["promptEn"], 1008, 774, 544, f_mono, (40, 38, 38), 22)
    return sheet


def run_chrome_js(js_code: str, timeout: int = 20) -> str:
    osa = '''
    on run argv
        set jsCode to item 1 of argv
        tell application "Google Chrome"
            repeat with w in windows
                repeat with t in tabs of w
                    if URL of t contains "flow.google.com/project/" then
                        return execute t javascript jsCode
                    end if
                end repeat
            end repeat
            return "TAB_NOT_FOUND"
        end tell
    end run
    '''
    res = subprocess.run(["osascript", "-e", osa, js_code], capture_output=True, text=True, timeout=timeout)
    return res.stdout.strip()


def ensure_flow_ready_and_patched(aspect_icon: str = "crop_portrait"):
    """
    Ensures we are on the All Media grid view, Nano Banana 2.1 + desired aspect ratio (crop_portrait or crop_16_9) + x1,
    and that XY.prototype.submit / c8.prototype.submit are patched with isTrusted:true in the main world.
    """
    # 1. If in asset detail view, click back
    run_chrome_js("""
    (() => {
        const backBtn = [...document.querySelectorAll('button')].find(b => (b.innerText || '').includes('arrow_back') || (b.getAttribute('aria-label') || '').includes('뒤로'));
        if (backBtn && document.body.innerText.includes('프롬프트 재사용')) {
            backBtn.click();
            return 'CLICKED_BACK';
        }
        return 'ON_GRID';
    })()
    """)
    time.sleep(0.5)

    # 2. Patch submit(a) -> submit({isTrusted:true}) in main world via TrustedTypes nonce script
    patch_res = run_chrome_js("""
    (() => {
        const s = document.querySelector('script[nonce]');
        const nonce = s ? (s.nonce || s.getAttribute('nonce')) : '';
        let pol = window.__ttPol;
        if (!pol && window.trustedTypes && window.trustedTypes.createPolicy) {
            try {
                pol = window.trustedTypes.createPolicy('flowPatchPol_' + Math.random().toString(36).slice(2), { createScript: x => x });
                window.__ttPol = pol;
            } catch(e) {}
        }
        const code = `
            (() => {
                const m = window.default_AiSandboxAngularFrontend;
                if (!m) return;
                for (const k of ['XY', 'c8']) {
                    const cls = m[k];
                    if (cls && cls.prototype && cls.prototype.submit && !cls.prototype.submit.__patched) {
                        const orig = cls.prototype.submit;
                        const wrapped = function(ev) {
                            return orig.call(this, { isTrusted: true, preventDefault: () => {}, stopPropagation: () => {} });
                        };
                        wrapped.__patched = true;
                        cls.prototype.submit = wrapped;
                    }
                }
                document.body.setAttribute('data-submit-patched', '1');
            })();
        `;
        const el = document.createElement('script');
        if (nonce) el.setAttribute('nonce', nonce);
        el.text = pol ? pol.createScript(code) : code;
        document.head.appendChild(el);
        el.remove();
        return document.body.getAttribute('data-submit-patched') || '0';
    })()
    """)

    # 3. Check pill settings: must have Nano Banana 2.1, aspect_icon, x1
    target_ratio_tab = "3:4" if aspect_icon == "crop_portrait" else "16:9"
    pill_state = run_chrome_js(f"""
    (() => {{
        const pill = [...document.querySelectorAll('button')].find(b => {{
            const t = (b.innerText || '');
            return (t.includes('Nano Banana') || t.includes('Veo')) && t.includes('x');
        }});
        if (!pill) return 'NO_PILL';
        const txt = pill.innerText.replace(/\\s+/g, ' ').trim();
        if (txt.includes('Nano Banana') && txt.includes('{aspect_icon}') && txt.includes('x1')) {{
            return 'OK:' + txt;
        }}
        pill.dispatchEvent(new MouseEvent('mousedown', {{ bubbles: true }}));
        pill.dispatchEvent(new MouseEvent('mouseup', {{ bubbles: true }}));
        pill.click();
        return 'OPENED_MENU:' + txt;
    }})()
    """)
    if pill_state.startswith("OPENED_MENU"):
        time.sleep(0.8)
        run_chrome_js(f"""
        (() => {{
            const btns = [...document.querySelectorAll('button, [role="tab"], [role="option"]')];
            const clickBtn = (label) => {{
                const t = btns.find(b => (b.innerText || '').includes(label));
                if (t) t.click();
            }};
            clickBtn('이미지');
            clickBtn('{target_ratio_tab}');
            clickBtn('x1');
            document.body.click();
            return 'SET';
        }})()
        """)
        time.sleep(0.6)


def get_grid_image_urls() -> list[str]:
    raw = run_chrome_js("""
    (() => {
        const imgs = [...document.querySelectorAll('flow-image-tile img.image')];
        return JSON.stringify(imgs.map(i => i.src || '').filter(s => s.startsWith('https://flow-content.google/image/')));
    })()
    """)
    try:
        return json.loads(raw)
    except Exception:
        return []


from concurrent.futures import ThreadPoolExecutor

def generate_parallel_batch_flow_images(
    batch_items: list[tuple[str, str]],
    aspect_icon: str = "crop_portrait",
    max_retries: int = 3,
) -> dict[str, str]:
    """
    Submits a batch of (tag_id, prompt) items concurrently in Google Flow (Nano Banana 2.1)
    and returns {tag_id: image_url} for all completed items in the batch.
    """
    results: dict[str, str] = {}
    remaining = list(batch_items)

    for attempt in range(1, max_retries + 1):
        if not remaining:
            break
        ensure_flow_ready_and_patched(aspect_icon=aspect_icon)

        # Wait if any existing pending tile is still running
        for _ in range(35):
            pend = run_chrome_js("String(document.querySelectorAll('flow-pending-tile').length)")
            if pend == "0":
                break
            time.sleep(1.2)

        # Scroll grid to top
        run_chrome_js("""
        (() => {
            const scrollers = [...document.querySelectorAll('*')].filter(el => el.scrollHeight > el.clientHeight + 100);
            scrollers.forEach(el => { el.scrollTop = 0; });
        })()
        """)
        time.sleep(0.25)
        before_urls = set(get_grid_image_urls())

        # Submit all items in `remaining` in rapid succession
        submitted_tags: list[str] = []
        for tag_id, raw_prompt in remaining:
            tagged_prompt = f"[{tag_id}] {raw_prompt}"
            ins_res = run_chrome_js(f"""
            (() => {{
                const pm = document.querySelector('.ProseMirror');
                if (!pm) return 'NO_PM';
                pm.focus();
                document.execCommand('selectAll', false, null);
                document.execCommand('insertText', false, {json.dumps(tagged_prompt)});
                pm.dispatchEvent(new Event('input', {{ bubbles: true }}));
                return 'INSERTED';
            }})()
            """)
            time.sleep(0.28)
            sub_res = run_chrome_js(f"""
            (() => {{
                const btn = document.querySelector('button[aria-label="생성 시작"]') || [...document.querySelectorAll('button')].find(b => (b.innerText || '').includes('arrow_forward'));
                if (!btn) return 'NO_BTN';
                btn.click();
                return 'SUBMITTED';
            }})()
            """)
            time.sleep(0.75)
            # Stamp data-batch-tag onto any flow-grid-tile-container whose aria-label has [tag_id]
            run_chrome_js("""
            (() => {
                const containers = document.querySelectorAll('flow-grid-tile-container');
                containers.forEach(c => {
                    const aria = c.getAttribute('aria-label') || '';
                    const m = aria.match(/^\\[(TAG_[A-Za-z0-9_\\-]+)\\]/);
                    if (m) c.setAttribute('data-batch-tag', m[1]);
                });
            })()
            """)
            submitted_tags.append(tag_id)
            print(f"    [Batch Submit] {tag_id}: {ins_res} -> {sub_res}", flush=True)

        # Poll until all pending tiles finish and populate img.src
        start_t = time.time()
        while time.time() - start_t < 95:
            time.sleep(1.6)
            state_raw = run_chrome_js(f"""
            (() => {{
                const scrollers = [...document.querySelectorAll('*')].filter(el => el.scrollHeight > el.clientHeight + 100 && el.className.includes('virtual-scroll'));
                scrollers.forEach(el => {{ el.scrollTop = 0; }});
                const containers = [...document.querySelectorAll('flow-grid-tile-container')].slice(0, 12);
                containers.forEach(c => {{
                    const aria = c.getAttribute('aria-label') || '';
                    const m = aria.match(/^\\[(TAG_[A-Za-z0-9_\\-]+)\\]/);
                    if (m) c.setAttribute('data-batch-tag', m[1]);
                }});
                const pend = document.querySelectorAll('flow-pending-tile').length;
                const tiles = containers.map((c, idx) => ({{
                    idx,
                    tag: c.getAttribute('data-batch-tag') || '',
                    isPend: Boolean(c.querySelector('flow-pending-tile')),
                    src: (c.querySelector('img.image')?.src || '')
                }}));
                const bodyTxt = document.body.innerText || '';
                const err = bodyTxt.includes('비정상적인 활동') || bodyTxt.includes('문제가 발생') || bodyTxt.includes('생성할 수 없');
                return JSON.stringify({{ pend, tiles, err }});
            }})()
            """)
            try:
                st = json.loads(state_raw)
            except Exception:
                continue

            # Map any tile that has a valid new URL and a known tag
            for t in st["tiles"]:
                u = t["src"]
                tag = t["tag"]
                if u.startswith("https://flow-content.google/image/") and u not in before_urls:
                    if tag and tag not in results:
                        results[tag] = u

            # Fallback positional mapping when pend == 0 if any newly generated tile lost its data-batch-tag due to virtual scroll recycle
            if st["pend"] == 0:
                new_tiles = [
                    t for t in st["tiles"]
                    if t["src"].startswith("https://flow-content.google/image/") and t["src"] not in before_urls
                ]
                if len(new_tiles) == len(submitted_tags):
                    # Top of grid is reverse submission order: index 0 is last submitted
                    for rev_idx, tag_id in enumerate(reversed(submitted_tags)):
                        if tag_id not in results and rev_idx < len(new_tiles):
                            results[tag_id] = new_tiles[rev_idx]["src"]
                if all(tag_id in results for tag_id, _ in remaining):
                    break
                # If pend == 0 and at least 12s elapsed, break to retry any missing
                if time.time() - start_t > 12:
                    break

            if st.get("err") and st["pend"] == 0:
                print("    [Warn] Error toast detected; reloading Flow tab...", flush=True)
                run_chrome_js("location.reload(); 'RELOADING'")
                time.sleep(6.5)
                break

        remaining = [(t, p) for (t, p) in remaining if t not in results]
        if remaining:
            print(f"    [Retry] {len(remaining)} items remaining in batch: {[t for t, _ in remaining]}", flush=True)

    return results


def download_url_to_file(url: str, dest: Path):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=45) as resp:
        data = resp.read()
    dest.write_bytes(data)


def generate_all_110_characters(start_id: int = 1, end_id: int = 110, force: bool = False, batch_size: int = 5):
    marker_dir = RAW_SOLO_DIR / ".done_ufotable_v1"
    marker_dir.mkdir(parents=True, exist_ok=True)

    # First, if we already have the verified 041_Kadan in /tmp/test_041_Kadan_solo.jpg, save it so 041 is preserved!
    tmp_kadan = Path("/tmp/test_041_Kadan_solo.jpg")
    if tmp_kadan.exists() and not (marker_dir / "041_Kadan.done").exists():
        raw_p = RAW_SOLO_DIR / "041_Kadan.jpg"
        cut_p = CUTOUTS_DIR / "041_Kadan.png"
        raw_p.write_bytes(tmp_kadan.read_bytes())
        im = Image.open(raw_p).convert("RGB")
        rgba = clean_cutout_specks(remove_white_bg_clean(im), keep_only_main=False)
        rgba.save(cut_p, "PNG", optimize=True)
        (marker_dir / "041_Kadan.done").write_text("ok")
        print("[041/110] Saved verified 041_Kadan transparent RGBA cutout!", flush=True)

    todo_cards: list[tuple[int, str, dict, str]] = []
    for cid in range(start_id, end_id + 1):
        card = CARDS_BY_ID[cid]
        slug_base = card["seat_filename"].replace(".png", "")
        slug = f"{cid:03d}_{slug_base}"
        done_flag = marker_dir / f"{slug}.done"
        raw_p = RAW_SOLO_DIR / f"{slug}.jpg"
        cut_p = CUTOUTS_DIR / f"{slug}.png"

        if not force and done_flag.exists() and cut_p.exists() and raw_p.exists():
            print(f"[{cid:03d}/110] {slug} already completed, skipping.", flush=True)
            continue
        prompt = build_ufotable_solo_prompt(cid, card)
        todo_cards.append((cid, slug, card, prompt))

    def _save_char_result(item: tuple[int, str, dict, str], img_url: str):
        cid, slug, _card, _prompt = item
        raw_p = RAW_SOLO_DIR / f"{slug}.jpg"
        cut_p = CUTOUTS_DIR / f"{slug}.png"
        done_flag = marker_dir / f"{slug}.done"
        download_url_to_file(img_url, raw_p)
        im = Image.open(raw_p).convert("RGB")
        rgba = clean_cutout_specks(remove_white_bg_clean(im), keep_only_main=False)
        rgba.save(cut_p, "PNG", optimize=True)
        arr = np.array(rgba)
        trans_pct = float((arr[:, :, 3] == 0).sum()) / float(arr.shape[0] * arr.shape[1]) * 100.0
        done_flag.write_text(f"{img_url}\ntransparent_pct={trans_pct:.1f}%\n")
        print(f"  -> [{cid:03d}/110] Saved {cut_p.name} ({rgba.size[0]}x{rgba.size[1]} RGBA, {trans_pct:.1f}% transparent bg)", flush=True)

    for b_start in range(0, len(todo_cards), batch_size):
        chunk = todo_cards[b_start : b_start + batch_size]
        batch_req = [(f"TAG_CHAR_{cid:03d}", prompt) for (cid, _slug, _card, prompt) in chunk]
        slug_list = [slug for (_cid, slug, _card, _prompt) in chunk]
        print(f"\n=== [Parallel Batch {b_start//batch_size + 1}] Generating {len(chunk)} Characters concurrently: {slug_list} ===", flush=True)
        t0 = time.time()
        url_map = generate_parallel_batch_flow_images(batch_req, aspect_icon="crop_portrait", max_retries=4)
        with ThreadPoolExecutor(max_workers=batch_size) as ex:
            futs = []
            for item in chunk:
                tag_id = f"TAG_CHAR_{item[0]:03d}"
                if tag_id in url_map:
                    futs.append(ex.submit(_save_char_result, item, url_map[tag_id]))
            for f in futs:
                f.result()
        dt = time.time() - t0
        print(f"=== Batch completed in {dt:.1f}s ({dt/max(1, len(chunk)):.1f}s / character avg) ===", flush=True)

    # If all 110 are done (or end_id == 110), rebuild all studio character sheets, faction sheets, poster, and manifest
    if end_id == 110:
        print("\nRebuilding all 110 Studio Character Sheets, Faction Sheets, Overview Poster & Manifest...", flush=True)
        rebuild_all_character_sheets()


def generate_all_20_locations(force: bool = False, batch_size: int = 5):
    marker_dir = LOC_ART_DIR / ".done_ufotable_v1"
    marker_dir.mkdir(parents=True, exist_ok=True)

    todo_locs: list[tuple[int, str, dict, str]] = []
    for idx, loc in enumerate(LOCATIONS, 1):
        lid = loc["code"].replace("-", "_")
        slug = f"{lid}_{loc['slug']}"
        done_flag = marker_dir / f"{slug}.done"
        art_p = LOC_ART_DIR / f"{slug}.jpg"
        sheet_p = LOC_SHEETS_DIR / f"{slug}_sheet.jpg"

        if not force and done_flag.exists() and art_p.exists() and sheet_p.exists():
            print(f"[{idx:02d}/20] {slug} already completed, skipping.", flush=True)
            continue
        prompt = build_ufotable_location_prompt(loc)
        todo_locs.append((idx, slug, loc, prompt))

    def _save_loc_result(item: tuple[int, str, dict, str], img_url: str):
        idx, slug, loc, _prompt = item
        art_p = LOC_ART_DIR / f"{slug}.jpg"
        sheet_p = LOC_SHEETS_DIR / f"{slug}_sheet.jpg"
        done_flag = marker_dir / f"{slug}.done"
        download_url_to_file(img_url, art_p)
        art_im = Image.open(art_p).convert("RGB")
        sheet_im = render_location_sheet_from_art(loc, art_im)
        sheet_im.save(sheet_p, "JPEG", quality=92, optimize=True)
        done_flag.write_text(f"{img_url}\n")
        print(f"  -> [{idx:02d}/20] Saved {art_p.name} ({art_im.size[0]}x{art_im.size[1]}) & {sheet_p.name}", flush=True)

    for b_start in range(0, len(todo_locs), batch_size):
        chunk = todo_locs[b_start : b_start + batch_size]
        batch_req = [(f"TAG_LOC_{idx:02d}", prompt) for (idx, _slug, _loc, prompt) in chunk]
        slug_list = [slug for (_idx, slug, _loc, _prompt) in chunk]
        print(f"\n=== [Parallel Location Batch] Generating {len(chunk)} Locations concurrently: {slug_list} ===", flush=True)
        t0 = time.time()
        url_map = generate_parallel_batch_flow_images(batch_req, aspect_icon="crop_16_9", max_retries=4)
        with ThreadPoolExecutor(max_workers=batch_size) as ex:
            futs = []
            for item in chunk:
                tag_id = f"TAG_LOC_{item[0]:02d}"
                if tag_id in url_map:
                    futs.append(ex.submit(_save_loc_result, item, url_map[tag_id]))
            for f in futs:
                f.result()
        dt = time.time() - t0
        print(f"=== Location Batch completed in {dt:.1f}s ({dt/max(1, len(chunk)):.1f}s / location avg) ===", flush=True)


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["chars", "locs", "all"], default="all")
    parser.add_argument("--start", type=int, default=1)
    parser.add_argument("--end", type=int, default=110)
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()

    if args.mode in ("chars", "all"):
        generate_all_110_characters(start_id=args.start, end_id=args.end, force=args.force)
    if args.mode in ("locs", "all"):
        generate_all_20_locations(force=args.force)
