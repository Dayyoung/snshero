import json
from pathlib import Path

# Load manifest
with open("src/content/webtoonEpisodeManifest.json", "r", encoding="utf-8") as f:
    manifest = json.load(f)

ep2 = manifest["2"]
images = ep2["images"]

# Character descriptions
HERCUL = "Hercul (헤르쿨): giant grizzled holy knight in blood-stained traveler robes over heavy plate armor, bearing a heavy war mace and broken golden holy seal"
GRIMLI = "Grimli (그림리): stout muscular dwarf blacksmith with braided fiery-orange beard, leather smithing apron, wielding a massive forged iron warhammer"
AILA = "Aila (에일라): fierce female vigilante scout leader in a hooded dark-green leather tunic, leather bracers, aiming a heavy steel crossbow"
GAWAIN = "Gawain (가웨인): blind martial warrior monk with a clean white linen blindfold, scarred jaw, wielding a heavy ringed iron staff"
ELIANA = "Eliana (엘리아나): veteran apothecary woman with silver-streaked auburn hair, potion vials and dried herbs hanging from her belt apron"
KAZE = "Kaze (카제): suave handsome scoundrel rogue in a dark tailored trenchcoat, sly smirk, flipping glowing silver coins between his fingers"
RONDOL = "Rondol (론돌): broad-shouldered muscular river ferryman with rolled-up sleeves, rope belts, weathered fisherman visage"
ROBINYARD = "Robinyard (로비냐드): nimble acrobatic cat burglar perched on tavern shingles, tight dark leathers, feather-light balance"

def build_prompt_for_scene(im):
    idx = im["index"]
    fname = im["fileName"]
    t = im.get("type", "scene")
    narr_ko = im.get("narrationKo", "")
    narr_en = im.get("narrationEn", "")
    dialogues = [d for d in im.get("dialogues", []) if d.get("speakerKo") not in ["내레이션", "Narration", ""]]
    has_sp = len(dialogues) > 0
    spk = dialogues[0]["speakerKo"] if has_sp else None

    # Cover
    if idx == 0:
        setting = "Panoramic dramatic dark fantasy composition: The seven vigilante outlaws and paladin Hercul standing in a mist-shrouded harbor dock."
        subject = f"The dramatic ensemble of Episode 2: {HERCUL} in the center, flanked by {GRIMLI}, {AILA}, {GAWAIN}, {ELIANA}, {KAZE}, {RONDOL}, and {ROBINYARD} on roof."
        action = "Dramatic cover art: A solemn oath of brotherhood and mentorship forged beneath rain and sea mist."
    # Ruins of Elwin
    elif idx == 1:
        setting = "LOC 001 Elwin Village Ruins: Snowbound burnt ruins, charred timber posts and smoking embers under heavy grey dawn blizzard."
        subject = f"{HERCUL} standing alone in the knee-deep snow, surveying the desolate smoking remains of the burnt village in shock and sorrow."
        action = "Hercul arrives on horseback to find Elwin village completely razed and smoking in the snow, horse breathing heavy steam."
    elif idx == 2:
        setting = "Snow-slicked muddy mountain path leading down from the burnt village."
        subject = f"{HERCUL} dismounted, boots covered in frost and mud, kneeling to inspect trampled horse tracks and blood stains in the slush."
        action = "Tracking the perpetrators through the blizzard, his face grim with dark realization."
    elif idx == 3:
        setting = "Icy river rapids beneath the collapsed stone bridge of Elwin."
        subject = f"{HERCUL} pulling a shattered weapon from the frozen riverbank."
        action = "Hercul retrieves the broken blade of Aleksandar's arcane twin swords and a trampled imperial royal guard crest from the frost."
    elif idx == 4:
        setting = "Close-up on Hercul's gauntleted hands."
        subject = "Hercul holding the broken sword blade and an imperial royal inquisitor crest marked with the Black Raven."
        action = "Hercul examining the imperial crest with trembling fury, realizing the purge came from the capital."
    elif idx == 5:
        setting = "The scorched village square of Elwin."
        subject = f"{HERCUL} standing by the burnt village hall, jaw tight with fury, wrapping the broken sword in a cloth."
        action = "Swearing a vow of vengeance and rescue over the ashes."
    elif idx == 6:
        setting = "Foggy coastal road leading to the harbor town of Sevenbridge."
        subject = f"{HERCUL} riding his warhorse at full gallop along the sea cliff road under dense swirling sea fog."
        action = "Rushing toward the port city tracking the retreating tracks."
    # Port / Harbor / Fish Market
    elif idx == 7:
        setting = "LOC 002 Drunken Bell Harbor: A bustling, gritty port fish market shrouded in dense sea mist, wooden piers, lanterns."
        subject = "Weathered merchants, sailors, and refugees moving through the foggy cobbled alleys among wooden fish crates."
        action = "Hercul walking through the crowded market, his golden holy armor drawing suspicious glares."
    elif idx == 8:
        setting = "Dark narrow back alley behind the fish market warehouses, smelling of brine, wet nets, and rotting wood."
        subject = f"{HERCUL} walking cautiously into the shadowy dead-end alley with his war mace ready."
        action = "Sensing an ambush in the narrow alley between timber warehouses."
    elif idx == 9:
        setting = "The shadowy dock alley."
        subject = f"{GRIMLI} and {AILA} stepping out from the shadows."
        action = "Grimli resting a massive forged iron warhammer on his shoulder, while Aila raises her loaded heavy crossbow with cold hostility."
    elif idx == 10:
        setting = "The dock alleyway."
        subject = f"{ELIANA}, {GAWAIN}, and {KAZE} blocking the flank."
        action = "Eliana clutching venom flasks, Gawain planting his heavy iron staff on the cobblestones, Kaze flipping a silver coin with a smirk."
    elif idx == 11:
        setting = "The alleyway looking up toward the tiled warehouse roof."
        subject = f"{RONDOL} blocking the rear with a boat hook, and {ROBINYARD} crouched like a panther on the warehouse roof shingles above."
        action = "The complete Seven Pursuers surrounding the lone holy knight."
    elif idx == 12:
        setting = "Gritty dock alley."
        subject = f"{GRIMLI} barking fiercely at Hercul."
        action = "Grimli spitting on the stone paving, raising his heavy hammer in challenge, shouting at Hercul. Open space above Grimli."
    elif idx == 13:
        setting = "Close-up of Grimli's fierce battle-ready face."
        subject = f"{GRIMLI} gritting his teeth, muscles coiled to strike, hammer glowing faintly with forge heat."
        action = "Grimli preparing to smash the intruder."
    elif idx == 14:
        setting = "Hercul facing the seven warriors."
        subject = f"{HERCUL} gripping his war mace, misunderstanding their purpose."
        action = "Hercul assuming they are the ruthless child traffickers who raid frontier villages, eyes hardening."
    elif idx == 15:
        setting = "The tense confrontation in the alley."
        subject = "The seven outlaws eyeing Hercul's golden paladin cape, suspecting him of being an assassin sent by the Red Glass Palace."
        action = "Mutual suspicion boiling over into combat."
    elif idx == 16:
        setting = "Aila raising her repeating crossbow."
        subject = f"{AILA} shouting fiercely with righteous fury, finger on the crossbow trigger. Open space in upper right."
        action = "Aila ordering the imperial dog to back off from the refugee children."
    elif idx == 17:
        setting = "Dynamic clash in the foggy alleyway!"
        subject = f"{AILA} firing a steel crossbow bolt, and {HERCUL} deflecting it with his golden holy barrier."
        action = "Aila's bolt ricocheting off Hercul's divine ward in a shower of golden sparks."
    elif idx == 18:
        setting = "Explosive melee impact in the alley!"
        subject = f"{GRIMLI} smashing his warhammer down against {HERCUL}'s heavy mace."
        action = "Shockwave shattering fish crates and tearing canvas market awnings, sending splinters and mist flying."
    elif idx == 19:
        setting = "Gawain sensing the flow of battle."
        subject = f"{GAWAIN}, the blind warrior monk, listening intently with his iron staff planted firmly."
        action = "Gawain realizing Hercul's footwork carries no murderous malice or cruelty."
    elif idx == 20:
        setting = "Gawain intervening."
        subject = f"{GAWAIN} sweeping his iron staff forward between Grimli and Hercul, shouting for a halt. Open space above Gawain."
        action = "Gawain attempting to stop the deadly brawl."
    elif idx == 21:
        setting = "Swirling chaos of battle."
        subject = "Combat continuing as shouts drown out the warning, dust and mist swirling."
        action = "Grimli and Hercul trading heavy defensive blows."
    elif idx == 22:
        setting = "Dynamic action in the alley."
        subject = f"{KAZE} throwing seven silver coins that strike Hercul's barrier, while {RONDOL} sweeps with his staff."
        action = "Kaze and Rondol testing the paladin's defense with synchronized coordination."
    elif idx == 23:
        setting = "Alleyway clash."
        subject = f"{HERCUL} flaring radiant golden mana to break ice and webs, while {ELIANA} tosses a choking smoke vial."
        action = "Dense aromatic herbal smoke and golden light clashing in the mist."
    elif idx == 24:
        setting = "Dramatic pause in the combat!"
        subject = "A young frightened refugee orphan boy running out from behind Aila's cloak, throwing his small body between the weapons."
        action = "The boy weeping and crying out for them to stop, arms spread wide."
    elif idx == 25:
        setting = "Close-up of the young boy and Hercul."
        subject = f"The brave boy pleading with {HERCUL}, shouting that the Seven are their protectors, not slavers! Open space above the boy."
        action = "The boy's words freezing the warriors in their tracks."
    elif idx == 26:
        setting = "The alleyway falling dead silent."
        subject = f"{HERCUL}'s heavy mace frozen inches from striking, the Seven Pursuers lowering their weapons in shock."
        action = "Weapons halted mid-air, mutual realization dawning across their faces."
    elif idx == 27:
        setting = "Inside a weathered wooden boathouse by the docks."
        subject = f"{HERCUL} laying out a blood-stained royal ledger and imperial purge decree on a wooden barrel."
        action = "Hercul showing the secret documents signed by royal inquisitor Lucian."
    elif idx == 28:
        setting = "Around the wooden barrel in the lantern-lit boathouse."
        subject = f"{HERCUL}, {GRIMLI}, {AILA}, and {GAWAIN} examining the royal seal with grim shock."
        action = "Realizing they are all fighting the same corrupt empire."
    elif idx == 29:
        setting = "Grimli setting his heavy hammer on the stone floor."
        subject = f"{GRIMLI} clearing his throat with a gruff, sheepish expression, scratching his fiery beard."
        action = "Grimli putting away his weapon in respect."
    elif idx == 30:
        setting = "The boathouse."
        subject = f"{GRIMLI} looking up at Hercul, speaking with rough dwarven respect. Open space above Grimli."
        action = "Grimli apologizing for mistaking a true holy knight for an imperial hound."
    elif idx == 31:
        setting = "Center of the boathouse."
        subject = f"{HERCUL} raising the broken blade of Aleksandar's arcane sword in one hand and Balian's spear shaft fragment in the other."
        action = "Hercul recounting the tragic sacrifice of the two holy knights at Elwin village."
    elif idx == 32:
        setting = "Hercul speaking with deep sorrow and passion."
        subject = f"{HERCUL} recounting how Elwin fled pregnant into the frozen north, while Ysela was captured to the Red Glass Palace. Open space above Hercul."
        action = "Hercul pleading for their help to protect the surviving lineages."
    elif idx == 33:
        setting = "Gawain leaning on his heavy iron staff."
        subject = f"{GAWAIN} nodding solemnly with serene wisdom, speaking on behalf of the outlaws. Open space above Gawain."
        action = "Gawain declaring their readiness to protect the innocent."
    elif idx == 34:
        setting = "Aila slinging her heavy crossbow over her shoulder."
        subject = f"{AILA} with resolute determination in her eyes, agreeing with the mission."
        action = "Aila stepping forward to take the oath."
    elif idx == 35:
        setting = "Aila speaking to Hercul."
        subject = f"{AILA} swearing that the Seven will scour the northern nomadic tents to find and protect Aleksandar's unborn child. Open space above Aila."
        action = "Aila pledging the Seven's full devotion to the northern child (Kadan)."
    elif idx == 36:
        setting = "Kaze smiling charismatically."
        subject = f"{KAZE} catching his glowing silver coin, grinning with mischievous confidence, speaking his pledge. Open space above Kaze."
        action = "Kaze vowing to teach the boy cunning and street wisdom."
    elif idx == 37:
        setting = "Rondol by the doorway."
        subject = f"{RONDOL} tightening his rope belt, speaking with hearty sailor pride. Open space above Rondol."
        action = "Rondol vowing to teach the boy seamanship and resilience in storms."
    elif idx == 38:
        setting = "Eliana organizing her medicine satchel."
        subject = f"{ELIANA} holding up a healing potion vial, speaking gentle maternal wisdom. Open space above Eliana."
        action = "Eliana promising to teach herbalism, poison lore, and healing."
    elif idx == 39:
        setting = "Robinyard dropping down from the wooden rafters."
        subject = f"{ROBINYARD} landing silently on his boots with a feline smile, speaking his pledge. Open space above Robinyard."
        action = "Robinyard vowing to teach stealth, parkour, and lockpicking."
    elif idx == 40:
        setting = "Hercul standing among the Seven Pursuers."
        subject = f"{HERCUL} placing his hand over his armored heart, deeply moved with gratitude."
        action = "Hercul feeling hope restored for the fallen kingdom."
    elif idx == 41:
        setting = "Hercul speaking his vow."
        subject = f"{HERCUL} pointing toward the southern horizon, declaring he will infiltrate the Red Glass Palace to save Balian's child. Open space above Hercul."
        action = "Hercul's resolve to venture into the belly of the beast alone."
    elif idx == 42:
        setting = "Gawain smiling warmly."
        subject = f"{GAWAIN} proposing a grand sacred duel of destiny between the two future children. Open space above Gawain."
        action = "Gawain proposing the ultimate pact."
    elif idx == 43:
        setting = "Gawain speaking the terms of the oath."
        subject = f"{GAWAIN} declaring that years later, the child of the north and the child of the south will meet to test whose will is stronger. Open space above Gawain."
        action = "Establishing the core rivalry and brotherhood of SNSHero."
    elif idx == 44:
        setting = "Close-up of weapons crossing."
        subject = f"{HERCUL}'s silver starlight dagger striking against {GAWAIN}'s iron staff, with {GRIMLI}'s hammer and {AILA}'s dagger joining in."
        action = "Sparks flying as eight weapons meet in a circle of eternal pact."
    elif idx == 45:
        setting = "Hercul roaring his approval."
        subject = f"{HERCUL} with eyes shining with holy fire, speaking his oath of eternal brotherhood. Open space above Hercul."
        action = "Sealing the sacred compact."
    elif idx == 46:
        setting = "Panoramic wide shot of the harbor docks at dawn."
        subject = "The Seven Pursuers boarding an armored northern cutter boat, while Hercul mounts his black warhorse heading south."
        action = "The legendary Oath of the Seven Pursuers fulfilled, departing in opposite directions."
    elif idx == 47:
        setting = "Dramatic epic landscape: A split horizon between the frozen snowy northern mountains and the crimson-skied southern imperial towers."
        subject = "Two divergent paths of destiny: Footprints and wagon tracks heading north, a lone rider galloping south."
        action = "The two hero lines—Kadan in the north, Ignis in the south—set on their collision course with destiny."
    else: # 48
        setting = "SNSHero Epic Card Battle Promo: Majestic arena card battlefield."
        subject = "Heroic fantasy card battle showcase with Kadan and Ignis card avatars glowing with divine celestial power."
        action = "Promo card visual inviting players to battle."

    prompt = f"""Generate a cinematic 16:9 theatrical dark-fantasy anime webtoon illustration (1280x720) for Episode 2 Scene {idx} of SNSHero.

Setting & Environment:
{setting}
Atmosphere: High-end theatrical anime cinematic lighting (Ufotable, Demon Slayer, Fate/Stay Night, Castlevania), atmospheric mist, rich color grading.

Subject & Action:
{action}
Key details: {subject}

Visual Aesthetic:
- High-end theatrical anime key visual.
- Natural character grounding, dynamic silhouettes, cast shadows.
- Distinct character separation without excessive clutter.
- Absolutely NO text, NO speech bubbles, NO subtitles, NO watermarks, NO UI elements."""

    return {
        "index": idx,
        "fileName": fname,
        "prompt": prompt.strip(),
        "hasSpeech": has_sp,
        "speakerName": spk,
        "narrationKo": narr_ko,
        "narrationEn": narr_en,
    }

scene_prompts = [build_prompt_for_scene(im) for im in images]

with open("scripts/ep02_scene_prompts.json", "w", encoding="utf-8") as f:
    json.dump(scene_prompts, f, ensure_ascii=False, indent=2)

print(f"Generated scripts/ep02_scene_prompts.json with {len(scene_prompts)} scenes!")
