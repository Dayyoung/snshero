import json
import os
import re

CHARACTER_DESCRIPTIONS = {
    "Kadan": (
        "[FIXED MODEL SHEET LOCK - KADAN (카단) — 100% ORIGINAL CHARACTER, DO NOT ALTER HAIR/EYES/OUTFIT, NO FOREHEAD SCAR]: "
        "18-year-old original heroic fantasy anime protagonist rendered with ufotable vivid sumi-e ink cel-shading; "
        "FACE & HAIR: well-lit warm peach-ivory skin, 100% CLEAN SMOOTH UNBLEMISHED FOREHEAD WITH ZERO SCARS AND ZERO BIRTHMARKS "
        "(STRICT: NEVER draw any forehead scar, NEVER draw any flame mark or birthmark on forehead, NEVER draw earrings), "
        "sharp determined jawline, intense glowing cyan-sapphire eyes with bold black ink eyelashes, "
        "windblown spiky dark chestnut-brown hair (STRICT: NEVER blonde, NEVER silver, NEVER red/burgundy hair); "
        "SIGNATURE ACCESSORY: iconic vibrant crimson-vermilion woolen muffler wrapped around his neck; "
        "SIGNATURE OUTFIT: sleeveless deep-indigo and charcoal fantasy adventurer vest over a slate-blue short-sleeve tunic revealing toned muscular warrior arms, "
        "silver-trimmed forearm bracers, combat trousers and shin guards (STRICT: NEVER Japanese haori, NEVER checkered kimono, NEVER full plate armor); "
        "SIGNATURE WEAPONS: round northern iron shield with a crisp white snow-crystal emblem on his left arm, "
        "and twin straight starlight-cyan crystalline broadswords emitting vivid ukiyo-e turquoise-blue and white starlight wave arcs"
    ),
    "Celia": (
        "[FIXED MODEL SHEET LOCK - CELIA (실리아) — 100% ORIGINAL CHARACTER, DO NOT ALTER HAIR/EYES/OUTFIT]: "
        "17-year-old original fantasy wind priestess princess heroine rendered with ufotable vivid sumi-e ink cel-shading; "
        "FACE & HAIR: well-lit delicate expressive anime face, clean smooth forehead with zero marks, clear luminous aquamarine-emerald eyes, "
        "long waist-length vibrant emerald-mint green hair with twin braided side-locks pinned by sakura-pink blossom hairpins (STRICT: NEVER blonde, NEVER silver-white, NEVER purple hair); "
        "SIGNATURE OUTFIT: vivid turquoise-teal and warm ivory fantasy priestess battle tunic and flowing robe with bright gold wind-cloud embroidery, fitted waist sash, and rich indigo pleated slit skirt; "
        "SIGNATURE WEAPON: ornate glowing emerald-jade wind staff (녹옥 지팡이) trailing vivid ukiyo-e turquoise-emerald wind currents"
    ),
    "Ignis": (
        "[FIXED MODEL SHEET LOCK - IGNIS (이그니스) — 100% ORIGINAL CHARACTER, DO NOT ALTER HAIR/EYES/OUTFIT]: "
        "19-year-old original fantasy flame knight youth rendered with ufotable vivid sumi-e ink cel-shading; "
        "FACE & HAIR: well-lit face with clean smooth forehead, fierce sharp eyes with glowing golden-amber irises, wild spiky blazing vermilion-crimson hair (STRICT: NEVER brown, NEVER blonde hair); "
        "SIGNATURE OUTFIT: crimson-and-gold dragon-scale fantasy chest armor over a sleeveless black combat vest revealing muscular arms, vibrant crimson battle cloak; "
        "SIGNATURE WEAPON: colossal solar greatsword engulfed in vivid ukiyo-e roaring vermilion-orange and golden-yellow flame arcs"
    ),
    "Rondol": (
        "[FIXED MODEL SHEET LOCK - RONDOL (론돌) — DO NOT ALTER HAIR/EYES/OUTFIT]: "
        "42-year-old colossal muscular vanguard fantasy warrior rendered with ufotable vivid sumi-e ink cel-shading; "
        "FACE & HAIR: short-cropped grizzled dark-brown hair (STRICT: NOT bald, NOT shaven head), rugged square jaw with thick dark stubble, fierce protective brown eyes; "
        "SIGNATURE OUTFIT: heavy dark-brown sleeveless open leather battle jerkin over a charcoal linen tunic, thick rope belt, dark trousers, bronze-ringed bracers; "
        "SIGNATURE WEAPON: enormous dark-oak boat oar-staff banded with heavy bronze rings and a colossal golden-crested heavy tower shield"
    ),
    "Aila": (
        "[FIXED MODEL SHEET LOCK - AILA (에일라) — DO NOT ALTER HAIR/EYES/OUTFIT]: "
        "19-year-old agile female fantasy marksman vigilante rendered with ufotable vivid sumi-e ink cel-shading; "
        "FACE & HAIR: sharp alluring amber-golden eyes, light freckles, vibrant crimson-scarlet hair neatly tied into two long thick twin braids falling over her shoulders; "
        "SIGNATURE OUTFIT: fitted deep forest-emerald leather corset battle dress with dark-gold trim, high thigh slit, polished leather bracers, and black thigh-high archer boots; "
        "SIGNATURE WEAPON: sleek bronze-trimmed mechanical repeating crossbow with twin limb prods"
    ),
    "Kaze": (
        "[FIXED MODEL SHEET LOCK - KAZE (카제) — DO NOT ALTER HAIR/EYES/OUTFIT]: "
        "20-year-old female shadow assassin rogue rendered with ufotable vivid sumi-e ink cel-shading; "
        "FACE & HAIR: sharp alluring violet eyes, confident smirk, long dark-purple hair tied into a high sleek ponytail with a silver ring; "
        "SIGNATURE OUTFIT: form-fitting midnight-purple and black stealth battle bodysuit with dark leather harness and thigh-high boots; "
        "SIGNATURE WEAPON: twin cursed purple shadow assassination daggers trailing dark ukiyo-e shadow mist and gleaming silver mark coins"
    ),
    "Eliana": (
        "[FIXED MODEL SHEET LOCK - ELIANA (엘리아나) — DO NOT ALTER HAIR/EYES/OUTFIT]: "
        "21-year-old veteran apothecary healer beauty rendered with ufotable vivid sumi-e ink cel-shading; "
        "FACE & HAIR: warm gentle emerald-green eyes, long wavy strawberry-auburn hair tied with a woven floral vine band; "
        "SIGNATURE OUTFIT: dark-rose and ivory floral corset apothecary dress with leather belt holding three glowing glass potion vials (sapphire blue, ruby red, jade green); "
        "SIGNATURE WEAPON: carved hazelwood healing wand with a glowing blossom tip"
    ),
    "Medusa Gorgo": (
        "[FIXED MODEL SHEET LOCK - MEDUSA GORGO (메두사 고르고)]: "
        "sinister blind rogue fantasy sorceress rendered with ufotable vivid sumi-e ink cel-shading; dark violet silk blindfold over eyes, serpentine purple hair; "
        "clad in dark golden-scaled corset armor and translucent violet-black silk skirts; manipulating iridescent purple shadow threads from sharp fingernails"
    ),
    "Elwin": (
        "[FIXED MODEL SHEET LOCK - ELWIN (엘윈)]: "
        "regal fantasy queen mother rendered with ufotable vivid sumi-e ink cel-shading; braided golden-blonde hair, sorrowful dignified sapphire eyes; "
        "wearing a midnight-blue and silver royal gown, holding a velvet pouch of golden seeds"
    ),
    "Ysela": (
        "[FIXED MODEL SHEET LOCK - YSELA (이셀라)]: "
        "majestic dragon priestess queen rendered with ufotable vivid sumi-e ink cel-shading; flowing silver-white hair, delicate iridescent dragon horns on brow, radiant violet eyes; "
        "wearing a dark-ivory and gold draconic silk ceremonial robe"
    ),
    "Grimli": (
        "[FIXED MODEL SHEET LOCK - GRIMLI (그림리) — DO NOT ALTER HAIR/EYES/OUTFIT]: "
        "stout hyper-muscular dwarven master blacksmith rendered with ufotable vivid sumi-e ink cel-shading; "
        "FACE & BEARD: wild bushy dark hair and a colossal braided fiery-orange beard reaching down to his belt with bronze rings, fierce hearty face; "
        "SIGNATURE OUTFIT: blackened-iron studded leather armor and soot-stained forge apron over massive muscular arms; "
        "SIGNATURE WEAPON: colossal two-handed square-headed forged steel runic warhammer radiating molten sparks and flame embers"
    ),
    "Hercul": (
        "[FIXED MODEL SHEET LOCK - HERCUL (헤르쿨)]: "
        "giant 7-foot muscular holy knight rendered with ufotable vivid sumi-e ink cel-shading; wild shaggy dark-brown mane and thick beard, fierce protective eyes; "
        "scarred muscular torso with heavy leather harness; gripping an enormous golden sun-crest war mace blazing with divine starlight"
    ),
    "Gawain": (
        "[FIXED MODEL SHEET LOCK - GAWAIN (가웨인) — DO NOT ALTER HAIR/EYES/OUTFIT]: "
        "tall muscular blindfolded martial warrior monk rendered with ufotable vivid sumi-e ink cel-shading; "
        "FACE & HAIR: short golden-blonde hair beneath a crisp white linen blindfold tightly covering both eyes, stern chiseled jaw; "
        "SIGNATURE OUTFIT: sleeveless dark-indigo and charcoal monastic travel robe revealing toned muscular arms and heavy prayer beads; "
        "SIGNATURE WEAPON: tall black-iron khakkhara monk staff with six dangling brass rings and glowing cyan runes"
    ),
    "Aleksandar": (
        "[FIXED MODEL SHEET LOCK - ALEKSANDAR (알렉산다르)]: "
        "noble legendary knight commander rendered with ufotable vivid sumi-e ink cel-shading; neatly styled brown hair, golden royal circlet, chiseled warrior build; "
        "clad in dark royal-blue and tarnished-silver plate armor; crossing twin legendary forged arcane swords flaring with azure lightning"
    ),
    "Lucian": (
        "[FIXED MODEL SHEET LOCK - LUCIAN (루시안) — DO NOT ALTER HAIR/EYES/OUTFIT]: "
        "cold ruthless imperial chancellor inquisitor rendered with ufotable vivid sumi-e ink cel-shading; "
        "FACE & HAIR: pale skin, long sleek raven-black hair tied back, piercing silver-grey eyes; "
        "SIGNATURE OUTFIT: high-collared jet-black imperial inquisitor coat with dark-silver plate pauldrons; "
        "SIGNATURE WEAPON: gleaming silver rapier with a raven-wing basket hilt wreathed in crimson-black shadow mist"
    ),
    "Malfurion": (
        "[FIXED MODEL SHEET LOCK - MALFURION (말퓨온)]: "
        "ancient serene hermit sage rendered with ufotable vivid sumi-e ink cel-shading; long flowing moss-white hair and beard, deep starlight eyes; "
        "wearing a dark moss-green hooded cloak woven with dry leaves, leaning upon a crooked hazel staff"
    ),
    "Robinyard": (
        "[FIXED MODEL SHEET LOCK - ROBINYARD (로비냐드)]: "
        "nimble acrobatic cat-burglar youth rendered with ufotable vivid sumi-e ink cel-shading; sleek short midnight-black hair, sharp amber eyes; "
        "wearing a dark-navy stealth leather vest, black acrobat boots, silver bells at belt"
    ),
    "Belphegor": (
        "[FIXED MODEL SHEET LOCK - BELPHEGOR (벨페고르)]: "
        "massive hulking obsidian titan brute in dark-fantasy anime style; jagged dark-purple obsidian plate armor, glowing blood-red eyes, enormous stone fists"
    ),
    "Aeolus": (
        "[FIXED MODEL SHEET LOCK - AEOLUS (에올루스)]: "
        "legendary wind sage king rendered with ufotable vivid sumi-e ink cel-shading; billowing dark-trimmed white robes, glowing turquoise wind runes, long silver beard and glowing cyan wind eyes"
    ),
    "Balian": (
        "[FIXED MODEL SHEET LOCK - BALIAN (발리안)]: "
        "heroic paladin knight rendered with ufotable vivid sumi-e ink cel-shading; silver winged knight helmet, weathered kind eyes, dark-silver plate armor with tattered crimson cape; "
        "wielding a glowing cyan arcane spear and heavy silver cross shield"
    ),
    "Leonar": (
        "[FIXED MODEL SHEET LOCK - LEONAR (레오나르) — DO NOT ALTER HAIR/EYES/OUTFIT]: "
        "towering muscular retired imperial lion general rendered with ufotable vivid sumi-e ink cel-shading; "
        "wild mane of thick silver-white hair and full lion-like white beard, fierce golden-brown eyes; "
        "clad in weathered dark-bronze and wolf-fur commander armor; wielding a heavy broadsword"
    ),
    "Zephyr": (
        "[FIXED MODEL SHEET LOCK - ZEPHYR (제피르)]: "
        "treacherous corrupt wind council arch-elder in dark-fantasy anime style; sharp gaunt features, slick silver-grey hair, sinister violet eyes; "
        "wearing dark ceremonial purple-and-black robes; channeling corrupted dark-violet abyssal wind magic from the Nine Shadow Codex"
    ),
    "Fenrir": (
        "[FIXED MODEL SHEET LOCK - FENRIR (펜릴) — DO NOT ALTER HAIR/EYES/OUTFIT]: "
        "colossal muscular Northern Wolf King rendered with ufotable vivid sumi-e ink cel-shading; wild braided frost-grey hair and thick beard, fierce lupine amber eyes, "
        "dark wolf-pelt cloak draped over heavy northern black-iron plate armor; wielding a massive frost-forged northern greatsword trailing ice mist"
    ),
    "Bogart": (
        "[FIXED MODEL SHEET LOCK - BOGART (보가트)]: "
        "cunning Goblin King of the underground gambling den in dark-fantasy anime style; sharp pointed ears, sly grinning green-skinned face, "
        "extravagant dark-velvet jewel-encrusted coat, heavy gold chains, tossing loaded magnetic dice"
    ),
    "Artus": (
        "[FIXED MODEL SHEET LOCK - DEATH KNIGHT ARTUS (데스나이트 아르투스)]: "
        "towering cursed abyssal death knight in dark-fantasy anime style; jagged black-iron skull pauldrons and dark necrotic plate armor "
        "with glowing crimson eye-slits inside a horned helm; wielding a massive cursed runeblade wreathed in black-violet shadow flames"
    ),
    "Death Knight Artus": (
        "[FIXED MODEL SHEET LOCK - DEATH KNIGHT ARTUS (데스나이트 아르투스)]: "
        "towering cursed abyssal death knight in dark-fantasy anime style; jagged black-iron skull pauldrons and dark necrotic plate armor "
        "with glowing crimson eye-slits inside a horned helm; wielding a massive cursed runeblade wreathed in black-violet shadow flames"
    ),
    "Balthazar": (
        "[FIXED MODEL SHEET LOCK - BALTHAZAR (발타자르)]: "
        "fallen imperial count mutated by dark alchemy in dark-fantasy anime style; pale gaunt face with glowing purple veins, "
        "corrupted crimson-and-black nobleman armor, wielding a dark blood-magic rapier"
    ),
    "Karnak": (
        "[FIXED MODEL SHEET LOCK - KARNAK (카르낙)]: "
        "ferocious muscular blood-cult berserker general in dark-fantasy anime style; spiked crimson-and-black plate armor, glowing blood-red eyes, "
        "wielding a colossal serrated crimson executioner greatsword"
    ),
    "Barghest": (
        "[FIXED MODEL SHEET LOCK - BARGHEST (바르가스트)]: "
        "hulking treacherous northern warlord in dark-fantasy anime style; scarred face, dark fur-lined iron armor, wielding a heavy toxic-flame war axe"
    ),
    "Arachne": (
        "[FIXED MODEL SHEET LOCK - ARACHNE (아라크네)]: "
        "sinister spider-sorceress assassin in dark-fantasy anime style; pale skin, dark venomous silk robes with glowing green poison runes and razor magic threads"
    ),
    "Barto": (
        "[FIXED MODEL SHEET LOCK - BARTO (바르토)]: "
        "burly ruthless imperial inquisitor enforcer in dark-fantasy anime style; heavy black-iron plate armor, swinging a massive spiked iron war club"
    ),
    "Sylphid": (
        "[FIXED MODEL SHEET LOCK - SYLPHID (실피드)]: "
        "ethereal late Queen of Whispering Wind Island rendered with ufotable vivid sumi-e ink cel-shading; luminous silver-mint hair, serene turquoise eyes, regal white-and-emerald feathered gown"
    ),
    "Sylvia": (
        "[FIXED MODEL SHEET LOCK - SYLVIA (실비아)]: "
        "noble young imperial lady rendered with ufotable vivid sumi-e ink cel-shading; golden-blonde curls, tearful sapphire eyes, ornate white ceremonial gown with dark mana shackles on wrists"
    ),
    "Titania": (
        "[FIXED MODEL SHEET LOCK - TITANIA (티타니아)]: "
        "fierce spirited northern warrior princess rendered with ufotable vivid sumi-e ink cel-shading; braided auburn-red hair, bright amber eyes, fur-trimmed northern huntress armor"
    ),
    "Succubus Lilith": (
        "[FIXED MODEL SHEET LOCK - SUCCUBUS LILITH (서큐버스 릴리스)]: "
        "alluring dark-magic demoness in dark-fantasy anime style; curved obsidian horns, shadow wings, glowing magenta eyes, dark-violet gothic corset gown"
    ),
    "Emperor": (
        "[FIXED MODEL SHEET LOCK - CORRUPTED EMPEROR (황제)]: "
        "aging imperial monarch on the golden throne in dark-fantasy anime style; pale hollowed face with dark-purple abyssal veins beneath a heavy golden crown and dark royal mantle"
    ),
    "Thorvald": (
        "[FIXED MODEL SHEET LOCK - THORVALD (토르발드)]: "
        "grizzled northern frost-warrior chieftain rendered with ufotable vivid sumi-e ink cel-shading; thick braided grey beard, heavy bear-pelt cloak over iron chainmail, wielding a runescribed frost battleaxe"
    ),
    "Inquisitor Captain": (
        "[FIXED MODEL SHEET LOCK - INQUISITOR CAPTAIN (감찰대장)]: "
        "ruthless imperial inquisitor captain in dark-fantasy anime style; black steel half-mask helm, crimson inquisitor cloak, wielding a dark-steel executioner blade"
    ),
    "Senate Chancellor": (
        "[FIXED MODEL SHEET LOCK - SENATE CHANCELLOR (원로원 의장)]: "
        "elderly dignified imperial senate chancellor rendered with ufotable vivid sumi-e ink cel-shading; white hair and neatly trimmed beard, wearing deep-burgundy and gold ceremonial senate robes"
    ),
    "Magitech Golem": (
        "[FIXED MODEL SHEET LOCK - MAGITECH GOLEM (마공학 골렘)]: "
        "colossal obsidian-and-bronze dark magitech golem construct pulsing with glowing violet-crimson runes and heavy crushing stone fists"
    ),
}

SPEAKER_KO_TO_CHAR_KEY = {
    "카단": "Kadan",
    "실리아": "Celia",
    "론돌": "Rondol",
    "에일라": "Aila",
    "카제": "Kaze",
    "엘리아나": "Eliana",
    "고르고": "Medusa Gorgo",
    "메두사 고르고": "Medusa Gorgo",
    "엘윈": "Elwin",
    "이셀라": "Ysela",
    "그림리": "Grimli",
    "헤르쿨": "Hercul",
    "가웨인": "Gawain",
    "알렉산다르": "Aleksandar",
    "이그니스": "Ignis",
    "루시안": "Lucian",
    "말퓨온": "Malfurion",
    "로비냐드": "Robinyard",
    "벨페고르": "Belphegor",
    "에올루스": "Aeolus",
    "에올루스의 환영": "Aeolus",
    "발리안": "Balian",
    "레오나르": "Leonar",
    "제피르": "Zephyr",
    "펜릴": "Fenrir",
    "보가트": "Bogart",
    "고블린 왕 보가트": "Bogart",
    "아르투스": "Death Knight Artus",
    "데스나이트 아르투스": "Death Knight Artus",
    "발타자르": "Balthazar",
    "카르낙": "Karnak",
    "바르가스트": "Barghest",
    "아라크네": "Arachne",
    "바르토": "Barto",
    "실피드": "Sylphid",
    "실비아": "Sylvia",
    "티타니아": "Titania",
    "서큐버스 릴리스": "Succubus Lilith",
    "황제": "Emperor",
    "토르발드": "Thorvald",
    "감찰대장": "Inquisitor Captain",
    "원로원 의장": "Senate Chancellor",
}

FLASHBACK_ONLY_CHARS = {"Aleksandar", "Balian", "Sylphid", "Elwin"}

PERSON_KEYWORDS_KO = [
    "카단", "실리아", "이그니스", "레오나르", "론돌", "그림리", "가웨인", "에일라", "카제", "엘리아나",
    "루시안", "제피르", "에올루스", "고르고", "실피드", "알렉산다르", "발리안", "이셀라", "펜릴",
    "보가트", "아르투스", "바르토", "실비아", "발타자르", "아라크네", "바르가스트", "카르낙", "황제",
    "토르발드", "어부", "아이", "장교", "대장", "의장", "일행", "그들", "청년", "소녀", "노장", "사내", "노인",
    "병사", "근위", "기사", "선원", "왕녀", "장군", "스승", "형제", "사람", "백성", "난민", "주민",
    "사공", "도박꾼", "부랑배", "전사", "마법사", "장로", "거한", "노파", "여인", "아기", "소년",
    "소매", "손끝", "발걸음", "눈빛", "목소리", "어깨", "가슴", "얼굴", "입술", "손", "눈물"
]


def extract_accurate_scene_chars(idx: int, narration_ko: str, has_speech: bool, speaker: str | None, manifest_chars: list[str]) -> list[str]:
    if idx == 0:
        # Title cover: keep top 4 core protagonists/antagonists of the episode for clean composition
        return manifest_chars[:4]

    if "SNSHero.com" in narration_ko:
        return ["Kadan"]

    # Pure scenic landscape check
    if not has_speech and not any(kw in narration_ko for kw in PERSON_KEYWORDS_KO):
        return []

    # Strip quoted speech so mentioned names inside dialogue (e.g. "알렉산다르 스승님께서...", "제피르가...") don't spawn phantom characters
    unquoted = re.sub(r"“[^”]*”|\"[^\"]*\"|'[^']*'", "", narration_ko)

    found: list[str] = []
    if has_speech and speaker:
        sp_key = SPEAKER_KO_TO_CHAR_KEY.get(speaker)
        if sp_key:
            found.append(sp_key)

    # Find characters explicitly acting in unquoted narration in order of appearance
    pos_list: list[tuple[int, str]] = []
    for ko_name, en_key in SPEAKER_KO_TO_CHAR_KEY.items():
        p = unquoted.find(ko_name)
        if p != -1:
            pos_list.append((p, en_key))
    pos_list.sort(key=lambda x: x[0])

    for _, en_key in pos_list:
        if en_key not in found:
            # Exclude deceased flashback-only characters unless the narration explicitly shows a phantom/memory vision
            if en_key in FLASHBACK_ONLY_CHARS and not any(w in unquoted for w in ("환영", "기억", "영혼", "생전", "과거")):
                continue
            found.append(en_key)

    if not found:
        # Fallback to manifest characters excluding flashback bleed
        cleaned_manifest = [c for c in manifest_chars if c not in FLASHBACK_ONLY_CHARS]
        found = cleaned_manifest if cleaned_manifest else manifest_chars[:1]

    # Cap to at most 2 focal characters per scene so facial/costume consistency stays 100% locked
    return found[:2]


def build_scene_prompt(ep_num: int, img: dict) -> dict:
    idx = img["index"]
    narration_ko = img.get("narrationKo", "")
    narration_en = img.get("narrationEn", "")
    raw_chars = img.get("characters", [])
    bg = img.get("background", "")
    dlgs = [d for d in img.get("dialogues", []) if d.get("speakerKo") not in ("내레이션", "Narration", None, "")]
    has_speech = len(dlgs) > 0
    speaker = dlgs[0]["speakerKo"] if has_speech else None

    if ep_num >= 20:
        chars = extract_accurate_scene_chars(idx, narration_ko, has_speech, speaker, raw_chars)
    else:
        chars = list(raw_chars)
        if has_speech and speaker:
            sp_key = SPEAKER_KO_TO_CHAR_KEY.get(speaker)
            if sp_key and sp_key not in chars:
                chars = [sp_key] + list(chars)
            elif not sp_key and speaker not in chars:
                chars = [speaker] + list(chars)
        if idx > 0 and not has_speech and "SNSHero.com" not in narration_ko:
            if not any(kw in narration_ko for kw in PERSON_KEYWORDS_KO):
                chars = []

    if not chars:
        char_section = (
            "Featured Elements:\n"
            "High-saturation ufotable sumi-e ink anime architectural and environmental fantasy landscape scenery with vivid, rich, luminous colors. "
            "ABSOLUTELY NO CHARACTERS, NO PEOPLE, NO ACTORS, NO HUMANS in frame. "
            "Empty scenic panoramic environment view.\n"
        )
        aesthetic_chars = (
            "- Vivid ufotable sumi-e ink anime environment concept art: rich, vibrant high-saturation color palette, "
            "warm glowing lantern/sunlight/moonlight illumination, luminous elemental particles, and crystal-clear visibility (NEVER overly dark or gloomy)."
        )
    else:
        char_desc_list = [CHARACTER_DESCRIPTIONS[c] for c in chars if c in CHARACTER_DESCRIPTIONS]
        if not char_desc_list:
            char_desc_list = [f"{c}: original fantasy anime warrior rendered with ufotable vivid sumi-e ink cel-shading" for c in chars]
        char_text = " | ".join(char_desc_list)
        char_section = (
            f"Featured Characters & Elements (STRICT MODEL SHEET CONSISTENCY — MAX {len(chars)} FOCAL CHARACTER(S)):\n"
            f"{char_text}\n"
            f"Character Consistency & Originality Rule: Maintain 100% exact adherence to each character's [FIXED MODEL SHEET LOCK] above "
            f"(exact hair color, hairstyle, eye color, outfit colors, and signature weapon). "
            f"Apply ONLY the art style and color palette — NEVER copy Demon Slayer characters, NEVER draw any forehead scar or birthmark on Kadan (Kadan's forehead MUST be 100% clean and smooth), and NEVER draw hanafuda earrings or checkered haori.\n"
        )
        aesthetic_chars = (
            "- Original SNSHero fantasy character designs rendered with bold variable-weight black sumi-e ink brush outlines, "
            "bright well-lit faces and warm skin tones (100% clean smooth forehead on Kadan with ZERO scars), vivid saturated outfit colors, intense expressive anime eyes, and 100% consistent model-sheet facial/hair/costume proportions."
        )

    if ep_num >= 20:
        prompt = (
            f"Generate a vivid, richly colored 16:9 cinematic anime webtoon illustration (1280x720) for Episode {ep_num} Scene {idx} of SNSHero "
            f"applying ONLY the visual rendering style and vibrant color palette of ufotable / Demon Slayer anime art (while keeping 100% original SNSHero fantasy characters — NEVER copy Demon Slayer character designs or forehead scars).\n\n"
            f"Art Style & Color Palette (ufotable Sumi-e Ink & Vivid High-Saturation Color Aesthetic — Art Style Only, Original Characters):\n"
            f"- Vivid high-saturation anime color palette (귀멸의 칼날 원화풍 색감과 화풍만 적용): "
            f"vivid, rich, luminous, high-saturation colors — vibrant turquoise-cyan, blazing vermilion-crimson, warm golden-amber, "
            f"luminous emerald-jade, rich wisteria-violet, and warm glowing lantern/sunlight/moonlight illumination.\n"
            f"- Bright, crystal-clear character & background visibility (NEVER overly dark, NEVER gloomy, NEVER underexposed or muddy grey-black): "
            f"characters' faces, warm peach-ivory skin tones, vivid hair colors, and colorful fantasy outfits are clearly and vibrantly illuminated with crisp cel-shading.\n"
            f"- Signature sumi-e ink linework and elemental effects: bold calligraphic black sumi-e ink brush outlines framing bright, saturated colors, "
            f"paired with dazzling colorful ukiyo-e woodblock-wave elemental slashes (vivid turquoise-blue star waves with crisp white foam, blazing golden-vermilion flames, luminous emerald wind currents).\n"
            f"{aesthetic_chars}\n\n"
            f"Scene Narrative & Action:\n"
            f"{narration_ko}\n({narration_en})\n\n"
            f"{char_section}"
        )
    else:
        prompt = (
            f"Generate a bright, vibrant 16:9 cinematic anime webtoon illustration (1280x720) for Episode {ep_num} Scene {idx} of SNSHero.\n\n"
            f"Art Style & Visual Aesthetic:\n"
            f"- Bright, luminous, colorful modern fantasy anime style (crisp vibrant colors, high-key clear lighting, Genshin Impact / Makoto Shinkai bright cinematic atmosphere, clean anime cel-shading, sparkling vivid effects, rich saturated colors, NO murky gloom, NO heavy muddy darkness).\n"
            f"- Beautiful high-clarity anime backgrounds with crisp daylight, glowing atmospheric mist, and vivid skies.\n"
            f"{aesthetic_chars}\n\n"
            f"Scene Narrative & Action:\n"
            f"{narration_ko}\n({narration_en})\n\n"
            f"{char_section}"
        )

    if bg:
        prompt += f"Environment & Setting: {bg} (rendered with vivid high-saturation anime color palette, warm glowing illumination, and rich saturated colors — NEVER overly dark)\n"

    if has_speech:
        prompt += (
            f"\nComposition Note: Dialogue scene featuring {speaker}. "
            f"Frame {speaker} prominently with bright, clear facial illumination and natural headroom above their head for clean composition and strict model-sheet facial clarity.\n"
        )
    else:
        prompt += "\nComposition Note: Vivid, richly colored ufotable-style cinematic anime shot with clear, well-lit exposure.\n"

    prompt += "\nStrict Quality Constraint: Absolutely NO text, NO speech bubbles, NO subtitles, NO watermarks, NO UI elements. NEVER draw any forehead scar or birthmark on Kadan."

    return {
        "episode": ep_num,
        "index": idx,
        "fileName": img.get("fileName", f"scene_{idx:02d}.webp"),
        "hasSpeech": has_speech,
        "speakerName": speaker,
        "narrationKo": narration_ko,
        "narrationEn": narration_en,
        "prompt": prompt
    }


def process_episode(manifest: dict, ep_num: int):
    ep_data = manifest.get(str(ep_num))
    if not ep_data:
        return 0

    images = ep_data.get("images", [])
    prompts = [build_scene_prompt(ep_num, img) for img in images]

    out_dir = f"scripts/prompts/ep_{ep_num:02d}"
    os.makedirs(out_dir, exist_ok=True)
    with open(f"{out_dir}/prompts.json", "w", encoding="utf-8") as f:
        json.dump(prompts, f, ensure_ascii=False, indent=2)

    batch_dir = f"scripts/batches/ep_{ep_num:02d}"
    os.makedirs(batch_dir, exist_ok=True)
    batch_size = 6

    if ep_num >= 20:
        header_line_1_tpl = "Generate {count} vivid, richly colored 16:9 cinematic anime illustrations for Episode {ep:02d} (Scenes {s_start:02d} to {s_end:02d}) of SNSHero applying ONLY the sumi-e ink & high-saturation color art style of ufotable anime (with 100% original SNSHero fantasy characters — NO Demon Slayer character clones, NO forehead scar on Kadan)."
        header_line_2 = (
            "Aesthetic & Consistency Requirement: Apply ONLY the vivid high-saturation anime color palette & bold black sumi-e ink brush linework — "
            "crystal-clear well-lit character visibility (NEVER overly dark or gloomy), ukiyo-e elemental wave/flame/wind effects, "
            "and 100% strict adherence to each character's [FIXED MODEL SHEET LOCK] (Kadan MUST have a 100% clean smooth forehead with ZERO scars or birthmarks; never copy Tanjiro or Demon Slayer characters)."
        )
    else:
        header_line_1_tpl = "Generate {count} bright, vibrant 16:9 cinematic anime illustrations for Episode {ep:02d} (Scenes {s_start:02d} to {s_end:02d}) of SNSHero."
        header_line_2 = "Aesthetic requirement: Bright, luminous, colorful modern anime style (Genshin Impact / Makoto Shinkai vibrant high-key aesthetic, clear daylight, crisp vivid colors, zero murky darkness)."

    for b_idx in range(0, len(prompts), batch_size):
        b_num = (b_idx // batch_size) + 1
        batch_prompts = prompts[b_idx:b_idx + batch_size]
        start_idx = batch_prompts[0]["index"]
        end_idx = batch_prompts[-1]["index"]

        lines = [
            header_line_1_tpl.format(count=len(batch_prompts), ep=ep_num, s_start=start_idx, s_end=end_idx),
            header_line_2,
            f"For each scene, call generate_image with AspectRatio: \"16:9\" and ImageName: \"ep{ep_num:02d}_scene_XX\":\n"
        ]
        for p in batch_prompts:
            s_idx = p["index"]
            clean_text = p["prompt"].replace("\n", " ").strip()
            lines.append(f"Scene {s_idx:02d} (ImageName: \"ep{ep_num:02d}_scene_{s_idx:02d}\"):")
            lines.append(f"Prompt: \"{clean_text}\"\n")
        lines.append("When all images have been generated, send a summary message back to the parent conversation.")

        with open(f"{batch_dir}/batch_{b_num:02d}.txt", "w", encoding="utf-8") as bf:
            bf.write("\n".join(lines))

    # 4 consolidated part files (part_1a, part_1b, part_2a, part_2b) for fast 4-subagent parallel execution
    n = len(prompts)
    q1 = n // 4
    q2 = n // 2
    q3 = (3 * n) // 4
    parts = [
        ("part_1a", prompts[0:q1]),
        ("part_1b", prompts[q1:q2]),
        ("part_2a", prompts[q2:q3]),
        ("part_2b", prompts[q3:n]),
    ]
    for part_name, part_prompts in parts:
        if not part_prompts:
            continue
        s_start = part_prompts[0]["index"]
        s_end = part_prompts[-1]["index"]
        p_lines = [
            header_line_1_tpl.format(count=len(part_prompts), ep=ep_num, s_start=s_start, s_end=s_end),
            header_line_2,
            f"For each scene, call generate_image with AspectRatio: \"16:9\" and ImageName: \"ep{ep_num:02d}_scene_XX\":\n"
        ]
        for p in part_prompts:
            s_idx = p["index"]
            clean_text = p["prompt"].replace("\n", " ").strip()
            p_lines.append(f"Scene {s_idx:02d} (ImageName: \"ep{ep_num:02d}_scene_{s_idx:02d}\"):")
            p_lines.append(f"Prompt: \"{clean_text}\"\n")
        p_lines.append("When all images have been generated, send a summary message back to the parent conversation.")
        with open(f"{batch_dir}/{part_name}.txt", "w", encoding="utf-8") as pf:
            pf.write("\n".join(p_lines))

    return len(prompts)


def main():
    with open("src/content/webtoonEpisodeManifest.json") as f:
        manifest = json.load(f)

    total_scenes = 0
    episodes_processed = 0
    for ep_num in range(20, 41):
        count = process_episode(manifest, ep_num)
        if count > 0:
            total_scenes += count
            episodes_processed += 1
            print(f"Processed EP{ep_num:02d} (Demon Slayer ufotable style + Fixed Character Sheet Lock): {count} scenes")

    print(f"\nAll episodes 20 to 40 updated! Total episodes: {episodes_processed}, Total scenes: {total_scenes}")


if __name__ == "__main__":
    main()
