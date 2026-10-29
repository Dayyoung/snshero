import json
import os

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
    "Kadan": "Kadan (카단): destined hero youth with glowing sapphire eyes and twin swords of starlight"
}

def build_prompt(img):
    idx = img["index"]
    narration_ko = img.get("narrationKo", "")
    narration_en = img.get("narrationEn", "")
    chars = img.get("characters", [])
    dlgs = [d for d in img.get("dialogues", []) if d.get("speakerKo") not in ("내레이션", "Narration", None, "")]
    has_speech = len(dlgs) > 0
    speaker = dlgs[0]["speakerKo"] if has_speech else None

    # Character text
    char_desc_list = [CHARACTER_DESCRIPTIONS[c] for c in chars if c in CHARACTER_DESCRIPTIONS]
    char_text = ", ".join(char_desc_list) if char_desc_list else "The heroes of SNSHero"

    prompt = (
        f"Generate a bright, vibrant 16:9 cinematic anime webtoon illustration (1280x720) for Episode 3 Scene {idx} of SNSHero.\n\n"
        f"Art Style & Visual Aesthetic:\n"
        f"- Bright, luminous, colorful modern fantasy anime style (crisp vibrant colors, high-key clear lighting, Genshin Impact / Makoto Shinkai bright cinematic atmosphere, clean anime cel-shading, sparkling vivid effects, rich saturated colors, NO murky gloom, NO heavy muddy darkness).\n"
        f"- Beautiful high-clarity anime backgrounds with crisp daylight, glowing atmospheric mist, and vivid skies.\n"
        f"- Expressive, appealing anime character designs with dynamic poses, crisp silhouettes, and clean grounding.\n\n"
        f"Scene Narrative & Action:\n"
        f"{narration_ko}\n({narration_en})\n\n"
        f"Featured Characters & Elements:\n"
        f"{char_text}\n"
    )

    if has_speech:
        prompt += (
            f"\nComposition Note: Dialogue scene with {speaker}. "
            f"Reserve clear, open negative space in the upper background (bright sky or high ceiling) for comic speech bubble placement. "
            f"Do NOT overlap speech bubbles onto the characters' faces or bodies.\n"
        )
    else:
        prompt += "\nComposition Note: Pure narrative cinematic shot. Balanced panoramic framing.\n"

    prompt += "\nStrict Quality Constraint: Absolutely NO text, NO speech bubbles, NO subtitles, NO watermarks, NO UI elements."

    return {
        "index": idx,
        "fileName": img.get("fileName", f"scene_{idx:02d}.webp"),
        "hasSpeech": has_speech,
        "speakerName": speaker,
        "narrationKo": narration_ko,
        "narrationEn": narration_en,
        "prompt": prompt
    }

def main():
    with open("src/content/webtoonEpisodeManifest.json") as f:
        data = json.load(f)
    ep3_images = data["3"]["images"]
    prompts = [build_prompt(img) for img in ep3_images]

    with open("scripts/ep03_scene_prompts.json", "w", encoding="utf-8") as f:
        json.dump(prompts, f, ensure_ascii=False, indent=2)

    print(f"Generated {len(prompts)} prompts in scripts/ep03_scene_prompts.json")

    # Now create the 9 batch files
    os.makedirs("scripts/batch_prompts_ep03", exist_ok=True)
    batches = [
        (1, 0, 5),
        (2, 6, 11),
        (3, 12, 17),
        (4, 18, 23),
        (5, 24, 29),
        (6, 30, 35),
        (7, 36, 41),
        (8, 42, 47),
        (9, 48, 53)
    ]

    for b_num, start_idx, end_idx in batches:
        lines = [f"Generate {end_idx - start_idx + 1} bright, vibrant 16:9 cinematic anime illustrations for Episode 3 (Scenes {start_idx:02d} to {end_idx:02d}) of SNSHero."]
        lines.append("Aesthetic requirement: Bright, luminous, colorful modern anime style (Genshin Impact / Makoto Shinkai vibrant high-key aesthetic, clear daylight, crisp vivid colors, zero murky darkness).")
        lines.append("For each scene, call generate_image with AspectRatio: \"16:9\" and ImageName: \"ep03_scene_XX\":\n")
        for i in range(start_idx, end_idx + 1):
            p = prompts[i]
            text = p["prompt"].replace("\n", " ").strip()
            lines.append(f"{i - start_idx + 1}. Scene {i:02d} (ImageName: \"ep03_scene_{i:02d}\"):")
            lines.append(f"Prompt: \"{text}\"\n")
        lines.append("When all images have been generated, send a summary message back to the parent conversation.")

        with open(f"scripts/batch_prompts_ep03/batch_{b_num:02d}.txt", "w", encoding="utf-8") as bf:
            bf.write("\n".join(lines))

    print("Successfully generated 9 batch prompt files for Episode 3.")

if __name__ == "__main__":
    main()
