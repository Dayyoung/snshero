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
    "Balian": "Balian (발리안): heroic paladin knight with silver winged knight helmet, weathered kind eyes; clad in radiant silver-white plate armor with crimson cape; wielding an arcane glowing cyan spear and heavy silver cross shield"
}

def build_scene_prompt(ep_num: int, img: dict) -> dict:
    idx = img["index"]
    narration_ko = img.get("narrationKo", "")
    narration_en = img.get("narrationEn", "")
    chars = img.get("characters", [])
    bg = img.get("background", "")
    dlgs = [d for d in img.get("dialogues", []) if d.get("speakerKo") not in ("내레이션", "Narration", None, "")]
    has_speech = len(dlgs) > 0
    speaker = dlgs[0]["speakerKo"] if has_speech else None

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
