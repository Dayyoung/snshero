import json
import os
import glob

CHARACTER_DESCRIPTIONS = {
    "Kadan": "Kadan (카단): destined hero youth with windblown chestnut-brown spiky anime hair, bright glowing sapphire-cyan eyes, iconic crimson-red woolen muffler around his neck; chiseled athletic muscular warrior build with ripped muscular arms and broad shoulders revealed by an open sleeveless dark leather adventurer vest over a fitted cream tunic, dark combat trousers; prominently brandishing a standardized pair of twin straight starlight crystalline broadswords glowing intensely with radiant cyan-blue celestial energy and polished silver crossguards (prominent twin glowing starlight blades, NOT katanas)",
    "Rondol": "Rondol (론돌): colossal muscular middle-aged warrior with short-cropped grizzled dark-brown hair (STRICT: NOT bald, NOT shaven head, has short dark hair), rugged square jaw with rough stubble, weathered kind smile; massive hyper-muscular physique with bulging chest and thick vascular biceps bursting out of an earth-brown sleeveless open leather jerkin over a rolled-up cream linen tunic, thick rope belt, dark trousers, heavy boots; prominently wielding an enormous dark-oak boat oar-staff banded with heavy bronze rings and a colossal golden-crested heavy tower shield (prominent standardized heavy weapon, NOT a wand)",
    "Aila": "Aila (에일라): spirited agile female vigilante with vibrant crimson-scarlet hair neatly tied into long braided tails falling over her shoulders (scarlet twin braids), sharp alluring amber-golden eyes, light freckles; glamorous hourglass figure wearing a seductive deep emerald-green slit dress and low-cut bodice showing alluring cleavage and bare shoulders, a high thigh slit revealing her shapely legs, polished leather bracers, and high leather archer boots; aiming a sleek standardized bronze-trimmed mechanical repeating crossbow with twin limb prods prominently",
    "Kaze": "Kaze (카제): seductive female shadow ninja rogue with long dark-purple hair tied into a high sleek ponytail with a silver kunai ring, sharp alluring violet eyes, charming confident smirk; stunning glamorous S-line body clad in a skin-tight dark-purple sheer mesh shinobi bodysuit with low-cut neckline showing ample cleavage, exposed midriff, and fitted thigh-high ninja boots; brandishing twin purple shadow assassination daggers prominently with gleaming silver mark coins flicking between fingers",
    "Eliana": "Eliana (엘리아나): gorgeous veteran apothecary beauty with long wavy strawberry-auburn hair tied with a woven floral vine band, warm gentle emerald eyes; glamorous busty figure wearing a revealing pastel pink and ivory floral petal corset dress with deep sweetheart neckline accentuating her cleavage, bare shoulders, and feminine curves, leather belt holding three glowing glass potion vials (sapphire blue, ruby red, jade green); holding an elegant carved hazelwood healing wand with a blossoming flower bud tip",
    "Medusa Gorgo": "Medusa Gorgo (메두사 고르고): sinister and breathtakingly sensual blind rogue sorceress with a dark violet silk blindfold, serpentine purple hair; voluptuous glamorous figure clad in a revealing golden-scaled bikini top showing generous cleavage and exposed midriff, draped in translucent violet silk skirts with high double slits; manipulating iridescent purple shadow threads from her sharp fingernails",
    "Elwin": "Elwin (엘윈): stunning regal queen mother with elegant braided blonde hair, sorrowful yet dignified sapphire eyes; voluptuous graceful figure wearing an off-shoulder midnight-blue royal gown revealing her elegant collarbones and shoulders, holding a velvet pouch of golden seeds",
    "Ysela": "Ysela (이셀라): majestic and alluring dragon priestess queen with flowing silver-white hair, delicate iridescent dragon horns on brow, radiant violet eyes; voluptuous figure in a revealing draconic white and gold silk slit robe accentuating her neckline, curves, and legs",
    "Grimli": "Grimli (그림리): stout hyper-muscular dwarven blacksmith with wild bushy dark hair and a colossal braided fiery-orange beard reaching down to his belt with bronze beard rings, hearty fierce face; massive tree-trunk bulging muscular arms and broad chest clad in studded leather armor and soot-stained apron; prominently hoisting a colossal two-handed square-headed forged steel runic warhammer radiating fiery molten sparks and glowing orange runes",
    "Hercul": "Hercul (헤르쿨): giant 7-foot legendary holy knight with a wild shaggy dark-brown mane and thick beard, fierce protective eyes; ripped muscular bare torso and chiseled eight-pack abs with only a leather sword harness across his massive chest; prominently gripping an enormous golden sun-crest war mace with a heavy radiant flanged head blazing with divine golden starlight",
    "Gawain": "Gawain (가웨인): tall muscular martial warrior monk with short golden-blonde hair beneath a pristine crisp white linen blindfold tightly covering his eyes, chiseled jaw; powerful athletic physique clad in a sleeveless navy-blue and ivory monastic travel robe revealing toned muscular arms; firmly planting a tall black-iron khakkhara staff with six dangling brass rings and glowing cyan runes",
    "Aleksandar": "Aleksandar (알렉산다르): noble legendary knight commander with perfectly chiseled warrior muscular build, neatly styled brown hair, golden royal circlet; clad in form-fitting royal blue and gilded silver plate armor; prominently crossing twin legendary forged arcane swords that flare with celestial white and azure lightning",
    "Ignis": "Ignis (이그니스): fierce athletic imperial knight youth with spiky fiery crimson-red hair, intense amber-gold eyes; ripped muscular build with exposed abdominal muscles beneath crimson dragon-scale armor; prominently raising a colossal blazing solar greatsword with molten steel edges roaring with vibrant fire",
    "Lucian": "Lucian (루시안): cold ruthless royal inquisitor commander with pale skin, long sleek raven-black hair tied back, piercing silver-grey eyes; tall lean muscular build in a high-collared dark coat with silver plate pauldrons; prominently drawing a gleaming silver rapier with a raven-wing basket hilt and shadow mist",
    "Malfurion": "Malfurion (말퓨온): ancient serene hermit sage with long flowing moss-white hair, flowing white beard and wispy eyebrows, deep wise starlight eyes; wearing a coarse moss-green hooded wool cloak woven with dry leaves, rough hemp robe, rope sash, bare feet; leaning upon a natural crooked hazel staff with a curved knot top and tiny sprouting green leaves",
    "Robinyard": "Robinyard (로비냐드): nimble acrobatic cat burglar youth with sleek short midnight-black hair and pointed cat-like ears, sharp amber eyes; wearing a sleek form-fitting dark-navy leather vest, dark stealth trousers, soft black acrobat boots, silver bells dangling at his belt; leaping with weightless feather-light grace",
    "Belphegor": "Belphegor (벨페고르): massive hulking obsidian titan brute clad in crystalline jagged dark-purple obsidian plate armor, glowing red eyes, enormous stone fists",
    "Aeolus": "Aeolus (에올루스): legendary wind sage master with billowing white robes, glowing turquoise wind runes, wise flowing silver beard and glowing wind eyes; levitating slightly above the ground",
    "Balian": "Balian (발리안): heroic paladin knight with silver winged knight helmet, weathered kind eyes; clad in radiant silver-white plate armor with crimson cape; wielding an arcane glowing cyan spear and heavy silver cross shield",
    "Celia": "Celia (실리아): gentle yet resolute wind priestess princess with long flowing soft emerald-mint hair, compassionate aquamarine eyes; graceful slender figure in a flowing white and teal wind-silk priestess gown with gold embroidery; holding the glowing emerald-jade wind staff (녹옥 지팡이) radiating swirling teal wind aura",
    "Leonar": "Leonar (레오나르): towering muscular retired imperial lion general with a wild mane of thick silver-white hair and a full lion-like white beard, fierce yet hearty golden-brown eyes; broad barrel chest clad in weathered bronze-and-fur commander armor over a travel tunic; wielding the legendary glowing turquoise Jade Staff (녹옥 지팡이)",
    "Zephyr": "Zephyr (제피르): treacherous corrupt wind council arch-elder with sharp gaunt features, slick silver-grey hair, cold sinister violet eyes; wearing dark ceremonial purple and tarnished-gold wind-council robes; channeling corrupted dark-violet abyssal wind magic from the Nine Shadow Codex",
    "Fenrir": "Fenrir (펜릴): colossal muscular Northern Wolf King with wild braided frost-grey hair and thick beard, fierce lupine amber eyes, wolf-pelt cloak draped over heavy northern iron plate armor; wielding a massive frost-forged northern greatsword",
    "Bogart": "Bogart (보가트): cunning greedy Goblin King of the underground gambling den with sharp pointed ears, sly grinning green-skinned face, wearing an extravagant jewel-encrusted velvet coat, heavy gold chains, and ruby rings; tossing loaded magnetic dice",
    "Artus": "Death Knight Artus (데스나이트 아르투스): towering cursed abyssal death knight clad in jagged black-iron skull pauldrons and dark necrotic plate armor with glowing crimson eye-slits inside a horned helm; wielding a massive cursed runeblade wreathed in black-violet shadow flames",
    "Death Knight Artus": "Death Knight Artus (데스나이트 아르투스): towering cursed abyssal death knight clad in jagged black-iron skull pauldrons and dark necrotic plate armor with glowing crimson eye-slits inside a horned helm; wielding a massive cursed runeblade wreathed in black-violet shadow flames",
    "Balthazar": "Balthazar (발타자르): fallen imperial count mutated by dark alchemy, pale gaunt face with glowing purple veins, ornate corrupted crimson-and-black court nobleman armor, wielding a dark blood-magic rapier",
    "Karnak": "Karnak (카르낙): ferocious muscular blood-cult berserker general in spiked crimson plate armor, glowing blood-red eyes, wielding a colossal serrated crimson executioner greatsword",
    "Barghest": "Barghest (바르가스트): hulking treacherous northern warlord with a scarred face, dark fur-lined iron armor, wielding a heavy toxic-flame war axe",
    "Arachne": "Arachne (아라크네): sinister spider-sorceress assassin in dark venomous silk robes with glowing green poison runes andarachnid magic threads",
    "Barto": "Barto (바르토): burly ruthless imperial inquisitor enforcer in heavy dark-iron plate armor, swinging a massive spiked iron war club",
    "Sylphid": "Sylphid (실피드): ethereal late Queen of Whispering Wind Island with luminous silver-mint hair, serene turquoise eyes, wearing a regal white-and-emerald feathered royal gown",
    "Sylvia": "Sylvia (실비아): noble young imperial lady with golden-blonde curls, tearful sapphire eyes, wearing an ornate white ceremonial bridal gown with dark mana shackles on her wrists",
    "Titania": "Titania (티타니아): fierce spirited northern warrior princess with braided auburn-red hair, bright amber eyes, wearing fur-trimmed northern huntress armor",
    "Succubus Lilith": "Succubus Lilith (서큐버스 릴리스): alluring dark-magic illusionist demoness with curved obsidian horns, bat-like shadow wings, glowing magenta eyes, wearing an enchanting dark-violet gothic corset gown",
    "Emperor": "Corrupted Emperor (황제): aging imperial monarch seated upon the golden throne, pale hollowed face with dark-purple abyssal corruption veins beneath a heavy golden imperial crown and royal purple mantle"
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
}

PERSON_KEYWORDS_KO = [
    "카단", "실리아", "이그니스", "레오나르", "론돌", "그림리", "가웨인", "에일라", "카제", "엘리아나",
    "루시안", "제피르", "에올루스", "고르고", "실피드", "알렉산다르", "발리안", "이셀라", "펜릴",
    "보가트", "아르투스", "바르토", "실비아", "발타자르", "아라크네", "바르가스트", "카르낙", "황제",
    "어부", "아이", "장교", "대장", "의장", "일행", "그들", "청년", "소녀", "노장", "사내", "노인",
    "병사", "근위", "기사", "선원", "왕녀", "장군", "스승", "형제", "사람", "백성", "난민", "주민",
    "사공", "도박꾼", "부랑배", "전사", "마법사", "장로", "거한", "노파", "여인", "아기", "소년",
    "소매", "손끝", "발걸음", "눈빛", "목소리", "어깨", "가슴", "얼굴", "입술", "손", "눈물"
]

def build_scene_prompt(ep_num: int, img: dict) -> dict:
    idx = img["index"]
    narration_ko = img.get("narrationKo", "")
    narration_en = img.get("narrationEn", "")
    chars = img.get("characters", [])
    bg = img.get("background", "")
    dlgs = [d for d in img.get("dialogues", []) if d.get("speakerKo") not in ("내레이션", "Narration", None, "")]
    has_speech = len(dlgs) > 0
    speaker = dlgs[0]["speakerKo"] if has_speech else None

    if has_speech and speaker:
        sp_key = SPEAKER_KO_TO_CHAR_KEY.get(speaker)
        if sp_key and sp_key not in chars:
            chars = [sp_key] + list(chars)
        elif not sp_key and speaker not in chars:
            chars = [speaker] + list(chars)

    # Pure scenic landscape check: if no person/character word in narration and no speech (excluding scene 00 title and final promo card)
    if idx > 0 and not has_speech and "SNSHero.com" not in narration_ko:
        if not any(kw in narration_ko for kw in PERSON_KEYWORDS_KO):
            chars = []

    # Character text
    if not chars:
        char_section = (
            "Featured Elements:\n"
            "Pure majestic architectural and environmental landscape scenery. "
            "ABSOLUTELY NO CHARACTERS, NO PEOPLE, NO ACTORS, NO HUMANS in frame. "
            "Empty scenic panoramic environment view.\n"
        )
        aesthetic_chars = "- Pure landscape concept art: breathtaking architectural scale, dramatic atmospheric lighting, immaculate environmental detailing."
    else:
        char_desc_list = [CHARACTER_DESCRIPTIONS[c] for c in chars if c in CHARACTER_DESCRIPTIONS]
        if not char_desc_list:
            char_desc_list = [f"{c}: detailed anime hero" for c in chars]
        char_text = ", ".join(char_desc_list)
        char_section = f"Featured Characters & Elements:\n{char_text}\n"
        aesthetic_chars = "- Expressive, appealing anime character designs with dynamic poses, crisp silhouettes, and clean grounding."

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
        prompt += f"Environment & Setting: {bg}\n"

    if has_speech:
        prompt += (
            f"\nComposition Note: Dialogue scene with {speaker}. "
            f"Frame the speaker character with natural headroom above their head for clean composition. "
            f"Distinct, appealing anime character framing.\n"
        )
    else:
        prompt += "\nComposition Note: Pure narrative cinematic shot. Balanced panoramic framing.\n"

    prompt += "\nStrict Quality Constraint: Absolutely NO text, NO speech bubbles, NO subtitles, NO watermarks, NO UI elements."

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

    # Batch files in groups of 6
    batch_dir = f"scripts/batches/ep_{ep_num:02d}"
    os.makedirs(batch_dir, exist_ok=True)
    batch_size = 6
    for b_idx in range(0, len(prompts), batch_size):
        b_num = (b_idx // batch_size) + 1
        batch_prompts = prompts[b_idx:b_idx + batch_size]
        start_idx = batch_prompts[0]["index"]
        end_idx = batch_prompts[-1]["index"]

        lines = [
            f"Generate {len(batch_prompts)} bright, vibrant 16:9 cinematic anime illustrations for Episode {ep_num:02d} (Scenes {start_idx:02d} to {end_idx:02d}) of SNSHero.",
            "Aesthetic requirement: Bright, luminous, colorful modern anime style (Genshin Impact / Makoto Shinkai vibrant high-key aesthetic, clear daylight, crisp vivid colors, zero murky darkness).",
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

    # Also write 4 consolidated part files (part_1a, part_1b, part_2a, part_2b) for fast 4-subagent parallel execution
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
            f"Generate {len(part_prompts)} bright, vibrant 16:9 cinematic anime illustrations for Episode {ep_num:02d} (Scenes {s_start:02d} to {s_end:02d}) of SNSHero.",
            "Aesthetic requirement: Bright, luminous, colorful modern anime style (Genshin Impact / Makoto Shinkai vibrant high-key aesthetic, clear daylight, crisp vivid colors, zero murky darkness).",
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
    for ep_num in range(1, 41):
        count = process_episode(manifest, ep_num)
        if count > 0:
            total_scenes += count
            episodes_processed += 1
            print(f"Processed EP{ep_num:02d}: {count} scenes")

    print(f"\nAll episodes 1 to 40 processed! Total episodes: {episodes_processed}, Total scenes: {total_scenes}")

if __name__ == "__main__":
    main()
