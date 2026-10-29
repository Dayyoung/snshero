import json
import os
import glob

CHARACTER_DESCRIPTIONS = {
    "Hercul": "Hercul (헤르쿨): giant holy knight in bright polished silver and gold plate armor, sunlit amber cape, holding a radiant golden war mace",
    "Grimli": "Grimli (그림리): stout muscular dwarf blacksmith with braided fiery-orange beard, stout leather apron, wielding a gleaming polished steel warhammer with warm forge sparks",
    "Aila": "Aila (에일라): spirited agile female vigilante scout leader in a crisp vibrant emerald-green hooded tunic, polished leather bracers, aiming a sleek mechanical repeating crossbow",
    "Gawain": "Gawain (가웨인): serene blind martial warrior monk with a crisp white linen blindfold, scarred jaw, wielding an ornate ringed iron staff with luminous cyan spiritual runes",
    "Eliana": "Eliana (엘리아나): graceful veteran apothecary woman with silver-streaked auburn hair, belt hung with glowing pastel potion vials (sapphire blue, emerald green) and healing herb pouches",
    "Kaze": "Kaze (카제): handsome dashing scoundrel rogue in a tailored sapphire-blue trenchcoat with gold trim, charming confident smile, playfully flipping gleaming silver coins with azure magical glints",
    "Rondol": "Rondol (론돌): broad-shouldered muscular river ferryman with rolled-up sleeves, rope belts, weathered kind smile, wielding a polished river staff that summons sparkling azure water currents",
    "Robinyard": "Robinyard (로비냐드): nimble acrobatic cat burglar with sharp cat-like eyes, sleek dark-navy leather vest, silver bells dangling at his belt, leaping with weightless feather-light grace",
    "Medusa Gorgo": "Medusa Gorgo (메두사 고르고): sinister blind rogue sorceress with a dark violet silk blindfold, flowing dark robes, manipulating iridescent purple shadow threads from her fingertips",
    "Belphegor": "Belphegor (벨페고르): massive hulking obsidian titan brute clad in crystalline jagged dark-purple obsidian plate armor, glowing red eyes, enormous stone fists",
    "Aeolus": "Aeolus (에올루스): legendary wind sage master with billowing white robes, glowing turquoise wind runes, wise flowing silver beard",
    "Aleksandar": "Aleksandar (알렉산다르): noble legendary knight hero with azure twin swords glowing with celestial lightning",
    "Kadan": "Kadan (카단): destined hero youth with glowing sapphire eyes and twin swords of starlight",
    "Ignis": "Ignis (이그니스): fierce red-haired imperial knight youth clad in crimson flame armor wielding a blazing solar greatsword",
    "Lucian": "Lucian (루시안): cold ruthless royal inquisitor commander in raven-black feathered mantle and ornate silver armor",
    "Elwin": "Elwin (엘윈): noble golden-haired queen mother in weathered traveler cloaks holding a small pouch of golden seeds",
    "Ysela": "Ysela (이셀라): majestic dragon priestess queen with flowing silver-white hair and draconic crest",
    "Balian": "Balian (발리안): heroic paladin knight with cross shield and thunder spear of divine light"
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
