import json
import os
import glob

CHARACTER_DESCRIPTIONS = {
    "Kadan": "Kadan (카단): destined hero youth with messy windblown chestnut-brown spiky anime hair, bright glowing sapphire-cyan eyes, iconic crimson-red woolen muffler fluttering around his neck, dark grey sleeveless adventurer leather vest over a cream tunic, dark combat trousers with leather belt, brown traveler boots; wielding a standardized pair of twin straight starlight crystalline broadswords (radiant cyan-blue glowing edge, polished silver crossguards, NOT curved blades, NOT katanas)",
    "Rondol": "Rondol (론돌): broad-shouldered muscular middle-aged river boatman with short-cropped grizzled dark-brown hair (STRICT: NOT bald, NOT shaven head, has short dark hair), rugged weathered square jaw with short rough stubble, kind weathered smile, wearing an earth-brown sleeveless leather jerkin over a rolled-up cream linen boatman tunic, thick dark-leather rope belt, slate-grey work trousers, sturdy water-resistant leather boots; wielding a standardized heavy dark-oak boat oar-staff with polished bronze ring bandings (standardized boat oar-staff, NOT a wizard wand, NOT a sword)",
    "Aila": "Aila (에일라): spirited agile female vigilante with vibrant crimson-scarlet hair neatly tied into two long braided tails falling over her shoulders (scarlet twin braids), sharp focused amber-golden eyes, light freckles; wearing a fitted deep emerald-green leather scout tunic with high collar, dark-brown fitted leather bracers, charcoal travel leggings, and dark leather knee-high archer boots (STRICT: consistent emerald scout tunic, NOT a dress); aiming a sleek standardized bronze-trimmed mechanical repeating crossbow with twin limb prods",
    "Grimli": "Grimli (그림리): stout muscular dwarven blacksmith with wild bushy dark hair and a colossal braided fiery-orange beard reaching down to his belt with bronze beard rings, hearty fierce face; wearing a heavy soot-stained dark-brown leather blacksmith apron over dark iron chainmail, thick studded leather gloves, heavy iron-plated boots; wielding a standardized colossal two-handed square-headed forged steel runic warhammer with glowing orange forge runes",
    "Kaze": "Kaze (카제): handsome dashing scoundrel rogue with long dark-purple hair tied into a high sleek ponytail with kunai silver ring, sly violet eyes, charming confident smirk; wearing a tailored midnight sapphire-blue longcoat with gold-trimmed lapels over a dark silk vest and white open collar, fingerless leather gloves, slim black trousers, polished leather boots; playfully flicking three glowing silver mark coins between his knuckles with azure magical glints",
    "Gawain": "Gawain (가웨인): tall serene martial warrior monk with short golden-blonde hair beneath a pristine crisp white linen blindfold tightly covering both eyes, clean-shaven scarred jaw; wearing a navy-blue and ivory dual-layer monk travel robe with dark prayer bead necklace, cloth leg wraps, straw-leather sandals; holding a standardized tall black-iron khakkhara monk staff topped with six dangling brass rattle rings and luminous cyan spiritual runes",
    "Eliana": "Eliana (엘리아나): graceful veteran apothecary woman with long wavy strawberry-auburn hair tied with a woven floral vine band, warm gentle emerald eyes; wearing an ivory linen blouse under an olive-green and gold herbalist corset bodice, practical earthy layered skirt with leather apron, sturdy apothecary belt hanging three standardized glowing glass potion vials (sapphire blue, ruby red, jade green); holding a small carved hazelwood healing wand with a blossoming flower bud tip",
    "Hercul": "Hercul (헤르쿨): giant 7-foot holy knight with wild shaggy dark-brown mane and thick beard, fierce yet warm protective eyes; clad in ornate heavy silver and gold paladin plate armor with lion-crest pauldrons and sunlit amber-gold cape; holding a colossal golden sun-crest war mace with a heavy flanged head and radiant holy light",
    "Malfurion": "Malfurion (말퓨온): ancient serene hermit sage with long flowing moss-white hair, flowing white beard and wispy eyebrows, deep wise starlight eyes; wearing a coarse moss-green hooded wool cloak woven with dry leaves, rough hemp robe, rope sash, bare feet; leaning upon a natural crooked hazel staff with a curved knot top and tiny sprouting green leaves",
    "Robinyard": "Robinyard (로비냐드): nimble acrobatic cat burglar youth with sleek short midnight-black hair and pointed cat-like ears, sharp amber eyes; wearing a sleek form-fitting dark-navy leather vest, dark stealth trousers, soft black acrobat boots, silver bells dangling at his belt; leaping with weightless feather-light grace",
    "Medusa Gorgo": "Medusa Gorgo (메두사 고르고): sinister blind rogue sorceress with a dark violet silk blindfold, pale skin, serpentine dark-purple hair; wearing flowing dark-violet robes with torn hems, manipulating iridescent purple shadow threads from her clawed fingertips",
    "Belphegor": "Belphegor (벨페고르): massive hulking obsidian titan brute clad in crystalline jagged dark-purple obsidian plate armor, glowing red eyes, enormous stone fists",
    "Aeolus": "Aeolus (에올루스): legendary wind sage master with billowing white robes, glowing turquoise wind runes, wise flowing silver beard and glowing wind eyes; levitating slightly above the ground",
    "Aleksandar": "Aleksandar (알렉산다르): regal noble knight hero with neatly styled brown hair, well-groomed beard, golden royal circlet on brow; royal blue tunic over intricately gilded silver plate armor, embroidered navy royal cloak; wielding twin legendary forged arcane swords gleaming with pure celestial white and azure lightning",
    "Ignis": "Ignis (이그니스): fierce imperial knight youth with spiky fiery crimson-red hair flaring like wild flames, intense amber-gold eyes; clad in crimson and obsidian flame armor with dragon-wing pauldrons; wielding a colossal blazing solar greatsword with molten edges and solar flame aura",
    "Lucian": "Lucian (루시안): cold ruthless royal inquisitor commander with pale skin, long sleek raven-black hair tied back, piercing silver-grey eyes; wearing a high-collared black coat trimmed with raven feathers and polished silver filigree plate armor; wielding a slender silver rapier with a raven-wing basket hilt",
    "Elwin": "Elwin (엘윈): noble golden-haired queen mother with elegant braided blonde hair, sorrowful yet dignified sapphire eyes; wearing a weathered navy traveler cloak over a simple royal gown, holding a small embroidered velvet pouch of golden seeds",
    "Ysela": "Ysela (이셀라): majestic dragon priestess queen with flowing silver-white hair, delicate iridescent dragon horns on brow, radiant violet eyes; wearing a regal draconic white and gold silk robe with crystalline dragon scales",
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
    char_desc_list = [CHARACTER_DESCRIPTIONS[c] for c in chars if c in CHARACTER_DESCRIPTIONS]
    if not char_desc_list:
        if chars:
            char_desc_list = [f"{c}: detailed anime hero" for c in chars]
        else:
            char_desc_list = ["The heroes of SNSHero"]
    char_text = ", ".join(char_desc_list)

    prompt = (
        f"Generate a bright, vibrant 16:9 cinematic anime webtoon illustration (1280x720) for Episode {ep_num} Scene {idx} of SNSHero.\n\n"
        f"Art Style & Visual Aesthetic:\n"
        f"- Bright, luminous, colorful modern fantasy anime style (crisp vibrant colors, high-key clear lighting, Genshin Impact / Makoto Shinkai bright cinematic atmosphere, clean anime cel-shading, sparkling vivid effects, rich saturated colors, NO murky gloom, NO heavy muddy darkness).\n"
        f"- Beautiful high-clarity anime backgrounds with crisp daylight, glowing atmospheric mist, and vivid skies.\n"
        f"- Expressive, appealing anime character designs with dynamic poses, crisp silhouettes, and clean grounding.\n\n"
        f"Scene Narrative & Action:\n"
        f"{narration_ko}\n({narration_en})\n\n"
        f"Featured Characters & Elements:\n"
        f"{char_text}\n"
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
