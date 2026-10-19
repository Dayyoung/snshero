import base64
import glob
import json
import os
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

FLOW_URL = "https://flow.google.com/project/2f9fc0dd-3554-4132-a2b1-5ca9f0d5b444/tool/971ab28e-f08f-43c2-816c-e59f79ba892b?fromViewSource=tools"
FLOW_PROFILE_DIR = Path("/tmp/flow_chrome_profile")
YT_PROFILE_DIR = Path("/tmp/yt_studio_chrome_profile6")
YT_UPLOAD_URL = "https://studio.youtube.com/channel/UCA6QmKiPstbiyBUHtnSMxyA/content?d=ud"
YT_PLAYLIST_NAME = "SNSHero.com - The Movie"

MOVIE_ROOT = Path("/Users/dayyoung/Desktop/내문서/movie")
OUT_ROOT = MOVIE_ROOT / "flow_episodes"
EPISODES_JSON = Path("/tmp/episodes_10_to_40_20scenes.json")
CHAR_MEDIA_FILE = OUT_ROOT / "character_media_ids.json"
YT_UPLOADED_FILE = OUT_ROOT / "uploaded_youtube_ids.json"
ENGLISH_TXT_DIR = Path("/Users/dayyoung/project/snshero/public/book/image_narrations/english_txt")

REALISTIC_STYLE_PROMPT = (
    "Shot on 35mm film (Kodak Vision3 500T) with anamorphic lenses, shallow depth of field (f/1.8), "
    "natural lighting with soft key light and subtle rim lighting, realistic skin textures, film grain, "
    "cinematic color grading with teal and orange undertones. Characters ignore the camera. "
    "Uncropped full frame, textless, no letterboxing."
)

CHARACTER_SHEET_APPEND = (
    "The image must feature a split composition against a plain, pure white studio background: "
    "on the left side, a close-up portrait of the character's face and shoulders; "
    "on the right side, a full-body standing shot showing the character from head to toe."
)

CHARACTER_PROFILES = {
    "Kadan": {
        "aliases": ["kadan"],
        "desc": "Young warrior in his early 20s with sharp East Asian features, intense amber eyes, short dark tousled hair, wearing a hammered bronze breastplate embossed with a wolf crest over a quilted beige tunic, dark blue sash at the waist, leather bracers, and bronze greaves."
    },
    "Celia": {
        "aliases": ["celia", "cilia"],
        "desc": "Young woman in her early 20s with warm golden-blonde hair braided into two twin braids, light freckles across her cheeks and nose, expressive hazel-amber eyes, wearing a mustard-ochre medieval tunic and a weathered olive-brown hooded traveling cloak."
    },
    "Ignis": {
        "aliases": ["ignis", "prince ignis"],
        "desc": "Tall, muscular Flame Court commander with spiky fiery red-orange hair, glowing amber eyes, sun-bronzed skin, wearing ornate white-silver and bronze plate armor."
    },
    "Balian": {
        "aliases": ["balian", "lord balian"],
        "desc": "Seasoned spear master in his 40s with sharp eyes, dark hair streaked with grey, wearing battle-worn azure knight armor."
    },
    "Ysela": {
        "aliases": ["ysela", "princess ysela", "issela", "aunt ysela", "aunt issela"],
        "desc": "Noblewoman with flowing silver-blonde hair, expressive hazel-sapphire eyes, wearing a modest weathered linen gown."
    },
    "Lucian": {
        "aliases": ["lucian", "minister lucian"],
        "desc": "Aristocratic High Minister with sleek pale blonde hair, cold emerald eyes, wearing black and gold noble court attire and carrying a gilded scepter."
    },
    "Elwin": {
        "aliases": ["elwin"],
        "desc": "Noble-hearted archer with chestnut hair, keen green eyes, wearing forest-green ranger leather armor and a feathered cloak."
    },
    "Hercul": {
        "aliases": ["hercul"],
        "desc": "Towering, broad-shouldered veteran paladin with a scarred face, thick beard, wearing heavy battle-worn steel plate armor."
    },
    "Artus": {
        "aliases": ["artus", "king artus"],
        "desc": "Majestic warrior king with golden-grey hair and beard, wearing ornate lion-crested golden plate armor and a royal crimson cape."
    },
    "Aleksandar": {
        "aliases": ["aleksandar"],
        "desc": "Fierce dual-blade master in his late 30s with dark hair streaked with silver, stern eyes, wearing dark leather and steel brigandine armor."
    },
    "Titania": {
        "aliases": ["titania", "queen titania"],
        "desc": "Ethereal fairy queen with luminous platinum hair, glowing violet eyes, wearing a gown woven from starlight and silver leaves."
    },
    "Malfuon": {
        "aliases": ["malfuon"],
        "desc": "Ancient arch-druid sage with long emerald-tinted silver hair and beard, antlered circlet, wearing robes of living bark and emerald cloth."
    },
    "Gawain": {
        "aliases": ["gawain", "gwain"],
        "desc": "Stalwart sun-knight with golden hair, wearing polished steel plate armor engraved with solar runes."
    },
    "Kaze": {
        "aliases": ["kaze"],
        "desc": "Silent shadow assassin with sharp dark eyes, black mask covering his lower face, wearing midnight-black shinobi leather armor."
    },
    "Eliana": {
        "aliases": ["eliana"],
        "desc": "Graceful priestess of light with long auburn hair, warm golden eyes, wearing white and gold ceremonial vestments."
    },
    "Gilgamesh": {
        "aliases": ["gilgamesh"],
        "desc": "Imperious ancient warlord in radiant golden armor with a crimson cloak and commanding gaze."
    },
    "Rondol": {
        "aliases": ["rondol", "rodol"],
        "desc": "Cunning strategist and martial master with a goatee, sharp calculating eyes, wearing dark brocade robes with bronze shoulder guards."
    },
    "Grimli": {
        "aliases": ["grimli"],
        "desc": "Stout dwarven master blacksmith with a braided red beard, heavy leather apron over chainmail, holding a runic forging hammer."
    },
    "Aeolus": {
        "aliases": ["aeolus"],
        "desc": "Master of the Wind Isle with wind-swept silver hair, wearing flowing sky-blue and white tempest robes."
    },
    "Medusa": {
        "aliases": ["medusa"],
        "desc": "Serpentine sorceress of the Black Sanctum with hypnotic glowing eyes, dark scales, and living serpent crown."
    }
}

# Hand-crafted 20 scenes for Episode 10 with 100% pure English, 9-11 word complete sentences ending in clear common English words
EP10_CLEAN_SCENES = [
    {
        "sceneNumber": 1,
        "title": "The Red Glass Palace",
        "dialogueEn": "Towering at the core of Lighthaven, the Red Glass Palace projected an incandescent majesty.",
        "narrationEn": "Towering at the very core of Lighthaven's inner citadel, the Red Glass Palace projected an incandescent majesty above bubbling conduits of molten magma."
    },
    {
        "sceneNumber": 2,
        "title": "Infiltrating the Masquerade",
        "dialogueEn": "Kadan and Celia slipped quietly past the palace guards.",
        "narrationEn": "High Minister Lucian convened a grand nocturnal masquerade while Kadan and Celia slipped past the palace guards disguised among the banquet attendants."
    },
    {
        "sceneNumber": 3,
        "title": "Trial of White Embers",
        "dialogueEn": "Young Ignis unleashed arcs of white fire inside the arena.",
        "narrationEn": "At the center of the hall, eighteen-year-old Ignis swung his longsword with precision, releasing arcs of pure white sanctifying fire across the circular arena."
    },
    {
        "sceneNumber": 4,
        "title": "Roar of the Nobles",
        "dialogueEn": "Behold the pure white flame of our royal crown!",
        "narrationEn": "Nobles rose to their feet in frantic adulation, praising the pure white fire inherited from Lord Balian as the immaculate blade of the crown."
    },
    {
        "sceneNumber": 5,
        "title": "Hollow Eyes of the Champion",
        "dialogueEn": "Yet only hollow sorrow gleamed within the champion's eyes.",
        "narrationEn": "Amidst the thunderous acclaim, Ignis's youthful visage remained frozen like carved marble, his amber eyes filled with a hollow desolation."
    },
    {
        "sceneNumber": 6,
        "title": "Lucian's Venomous Toast",
        "dialogueEn": "True loyalty to our kingdom requires your absolute submission.",
        "narrationEn": "Seated upon the gilded dais, High Minister Lucian raised his golden goblet with a venomous smile, demanding absolute submission to the crown."
    },
    {
        "sceneNumber": 7,
        "title": "Prisoner of the Pit",
        "dialogueEn": "Below the glass floor, Lord Balian hung in heavy chains.",
        "narrationEn": "Heavy iron winches groaned as the red glass floor slid open, revealing Lord Balian suspended in heavy runic chains above roaring sulfur vents."
    },
    {
        "sceneNumber": 8,
        "title": "A Son's Trembling Blade",
        "dialogueEn": "Why must you subject my broken father to such cruelty?",
        "narrationEn": "The tip of Ignis's longsword quivered as he asked Minister Lucian why his crippled father must suffer such relentless degradation."
    },
    {
        "sceneNumber": 9,
        "title": "The Throne Seal Demand",
        "dialogueEn": "Until he surrenders the royal seal, his torment continues.",
        "narrationEn": "Lucian leaned forward with icy satisfaction, declaring that Balian's agony would find no reprieve until he surrendered the ancient Throne Seal."
    },
    {
        "sceneNumber": 10,
        "title": "Restraining the Fury",
        "dialogueEn": "Hold fast, Kadan, or the deadly palace wards will trigger.",
        "narrationEn": "As Kadan gripped his blade in fury to charge the arena, Celia clamped her fingers around his forearm and urged him to wait until midnight."
    },
    {
        "sceneNumber": 11,
        "title": "The Thatched Cottage",
        "dialogueEn": "Behind the palace walls, Lady Ysela spun flax in silence.",
        "narrationEn": "In a sequestered garden behind the palace stood a rustic cottage encircled by thorny briar wards, where Lady Ysela steadily turned a wooden spindle."
    },
    {
        "sceneNumber": 12,
        "title": "Two Cold Teacups",
        "dialogueEn": "Every evening she poured two teacups for her forgotten family.",
        "narrationEn": "Bound beneath imperial forgetting curses, Ysela set out two clay teacups every evening for eighteen long years without recalling whom she awaited."
    },
    {
        "sceneNumber": 13,
        "title": "Unweaving the Hex",
        "dialogueEn": "I will untangle the dark hex while you restore her memory.",
        "narrationEn": "Gathering gentle emerald drafts of wind, Celia began untangling Medusa's amnesia hexes while asking Kadan to provide the anchor of memory."
    },
    {
        "sceneNumber": 14,
        "title": "The Silver Dagger of Elwin",
        "dialogueEn": "Do you remember the sacred vow sworn beneath northern snow?",
        "narrationEn": "Stepping softly into the room, Kadan laid the silver dagger upon the wooden table and spoke of the hamlet of Elwin and Balian's sacred vow."
    },
    {
        "sceneNumber": 15,
        "title": "Shattering the Amnesia",
        "dialogueEn": "With a bright chime, the dark amnesia curse finally shattered.",
        "narrationEn": "Ripples of azure light blossomed from Celia's fingertips across Ysela's brow, dissolving the dark shadow binding her soul like snapping glass."
    },
    {
        "sceneNumber": 16,
        "title": "Tears of Eighteen Years",
        "dialogueEn": "My beloved husband and my sweet child were torn away!",
        "narrationEn": "Clarity returned to Ysela's eyes as eighteen years of suppressed maternal yearning burst forth in tears for her husband Balian and her lost child."
    },
    {
        "sceneNumber": 17,
        "title": "Kadan's Sacred Oath",
        "dialogueEn": "Your son still lives, and I swear to bring him home.",
        "narrationEn": "Kadan clasped Ysela's weathered hands with steady conviction, promising that her son Ignis lived and vowing to bring him back to her side."
    },
    {
        "sceneNumber": 18,
        "title": "Ambush in the Garden",
        "dialogueEn": "Now that your memory returned, he will surrender the seal!",
        "narrationEn": "Suddenly the cottage doors splintered open as Lucian strode inside flanked by the elite Flame Guard, raising his gilded scepter with a sneer."
    },
    {
        "sceneNumber": 19,
        "title": "Shield and Gale Escape",
        "dialogueEn": "Kadan shattered the flaming spears while Celia summoned a storm.",
        "narrationEn": "Kadan planted his iron shield to shatter the guards' flaming lances while Celia unleashed a tempest wind barrier to clear their escape."
    },
    {
        "sceneNumber": 20,
        "title": "Vow Beneath the Dawn",
        "dialogueEn": "At dawn, the young heroes vowed to rescue their captive family.",
        "narrationEn": "Escaping past Ignis's moonlit balcony to the forest hills at dawn, Kadan looked toward the North Star and vowed to break Balian's chains and save Ignis."
    }
]


_WHISPER_MODEL = None


def get_whisper_model():
    global _WHISPER_MODEL
    if _WHISPER_MODEL is None:
        import whisper
        _WHISPER_MODEL = whisper.load_model("base")
    return _WHISPER_MODEL


def strip_korean(text: str) -> str:
    if not text:
        return ""
    cleaned = re.sub(r"[가-힣ㄱ-ㅎㅏ-ㅣ]+", "", text)
    return re.sub(r"\s+", " ", cleaned).strip()


def make_clean_short_sentence(candidate: str, fallback_narration: str, sn: int) -> str:
    """Ensure a single, complete English sentence of 7 to 11 words (<= 70 chars) ending in ., !, or ?."""
    text = strip_korean(candidate or "")
    text = text.replace('"', "").replace("“", "").replace("”", "").strip()
    if not text:
        text = strip_korean(fallback_narration or "")
        text = text.replace('"', "").replace("“", "").replace("”", "").strip()

    sents = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]
    chosen = sents[0] if sents else text

    words = chosen.split()
    if len(words) > 11:
        words = words[:10]
        chosen = " ".join(words).rstrip(",;:-— ") + "."
    elif not chosen.endswith((".", "!", "?")):
        chosen = chosen.rstrip(",;:-— ") + "."

    if len(words) < 4:
        chosen = f"In scene {sn}, the heroes press forward through the storm."

    return chosen


def verify_clip_audio(clip_path: Path, expected_dialogue: str) -> tuple[bool, str]:
    """
    Verify using OpenAI Whisper that:
    1. Language is strictly English ('en') with zero Korean characters.
    2. Speech is present (>= 5 words and >= 65% of expected word count).
    3. Dialogue is NOT cut off mid-sentence: at least one of the final 2 words of expected_dialogue
       must appear in the final 4 transcribed words of Whisper's output!
    """
    if not clip_path.exists() or clip_path.stat().st_size < 10000:
        return False, "missing_or_empty_file"

    try:
        model = get_whisper_model()
        res = model.transcribe(str(clip_path), fp16=False)
    except Exception as e:
        return False, f"whisper_error:{e}"

    lang = res.get("language", "")
    txt = (res.get("text") or "").strip()

    if re.search(r"[가-힣ㄱ-ㅎㅏ-ㅣ]", txt):
        return False, f"korean_detected:{txt}"

    if lang != "en":
        return False, f"non_english_lang:{lang}:{txt}"

    spoken_words = [re.sub(r"[^a-z0-9]", "", w.lower()) for w in txt.split()]
    spoken_words = [w for w in spoken_words if w]
    if len(spoken_words) < 5:
        return False, f"too_few_words({len(spoken_words)}):{txt}"

    expected_words = [re.sub(r"[^a-z0-9]", "", w.lower()) for w in expected_dialogue.split()]
    expected_words = [w for w in expected_words if w]

    if len(spoken_words) < max(5, int(len(expected_words) * 0.65)):
        return False, f"incomplete_word_count(expected={len(expected_words)}w,heard={len(spoken_words)}w:'{txt}')"

    # Strictly require that at least one of the last 2 words of expected_dialogue appears in the last 4 spoken words
    tail_targets = expected_words[-2:] if len(expected_words) >= 2 else expected_words[-1:]
    spoken_tail = spoken_words[-4:] if len(spoken_words) >= 4 else spoken_words

    tail_matched = False
    for t in tail_targets:
        for sw in spoken_tail:
            if sw == t or (len(t) >= 4 and len(sw) >= 4 and (sw.startswith(t[:4]) or t.startswith(sw[:4]))):
                tail_matched = True
                break

    if not tail_matched:
        return False, f"cutoff_or_missing_ending(expected_tail={tail_targets},heard_tail={spoken_tail},full='{txt}')"

    return True, f"ok(lang={lang},words={len(spoken_words)}/{len(expected_words)},text='{txt}')"


def load_json(path: Path, default):
    if path.exists():
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            pass
    return default


def save_json(path: Path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def build_clean_episodes_from_english_txt() -> dict:
    """Build 20-scene episode definitions from public/book/image_narrations/english_txt/."""
    episodes = load_json(EPISODES_JSON, {})
    txt_files = sorted(glob.glob(str(ENGLISH_TXT_DIR / "SNSHero_Novel_Episode_*_EN.txt")))
    for fpath in txt_files:
        p = Path(fpath)
        m = re.search(r"Episode_(\d+)_(.+)_EN\.txt$", p.name)
        if not m:
            continue
        ep_num = int(m.group(1))
        if ep_num < 10 or ep_num > 40:
            continue
        raw_lines = [strip_korean(line.strip()) for line in p.read_text(encoding="utf-8").splitlines() if line.strip()]
        title_en = m.group(2).replace("_", " ")
        if len(raw_lines) >= 2 and raw_lines[1].lower().startswith("episode"):
            parts = raw_lines[1].split(":", 1)
            if len(parts) == 2 and parts[1].strip():
                title_en = parts[1].strip()
        body_paras = raw_lines[2:] if len(raw_lines) > 2 else raw_lines

        if ep_num == 10:
            scenes = [
                {
                    "sceneNumber": s["sceneNumber"],
                    "title": s["title"],
                    "dialogueEn": s["dialogueEn"],
                    "narrationEn": s["narrationEn"],
                }
                for s in EP10_CLEAN_SCENES
            ]
        else:
            scenes = []
            n = len(body_paras)
            for i in range(20):
                start_i = int(round(i * n / 20))
                end_i = int(round((i + 1) * n / 20))
                chunk = " ".join(body_paras[start_i:max(start_i + 1, end_i)]).strip()
                if not chunk and body_paras:
                    chunk = body_paras[min(i, len(body_paras) - 1)]
                short_dlg = make_clean_short_sentence("", chunk, i + 1)
                scenes.append({
                    "sceneNumber": i + 1,
                    "dialogueEn": short_dlg,
                    "narrationEn": chunk,
                })

        episodes[str(ep_num)] = {
            "episode": ep_num,
            "titleEn": title_en,
            "scenes": scenes,
        }

    save_json(EPISODES_JSON, episodes)
    return episodes


def detect_characters_in_text(text: str):
    lower = text.lower()
    found = []
    for char_name, info in CHARACTER_PROFILES.items():
        for alias in info["aliases"]:
            if re.search(r"\b" + re.escape(alias) + r"\b", lower):
                found.append(char_name)
                break
    return found


def ensure_flow_profile(profile_dir: Path = FLOW_PROFILE_DIR):
    src_root = Path("/Users/dayyoung/Library/Application Support/Google/Chrome")
    if not profile_dir.exists() or not (profile_dir / "Default").exists():
        profile_dir.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src_root / "Local State", profile_dir / "Local State")
        shutil.copytree(
            src_root / "Default",
            profile_dir / "Default",
            symlinks=True,
            ignore=shutil.ignore_patterns("Cache*", "Code Cache*", "GPUCache*", "Service Worker*", "Singleton*")
        )


def launch_flow_browser(p, profile_dir: Path = FLOW_PROFILE_DIR):
    ensure_flow_profile(profile_dir)
    ctx = p.chromium.launch_persistent_context(
        user_data_dir=str(profile_dir),
        channel="chrome",
        headless=True,
        user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        ignore_default_args=["--use-mock-keychain", "--password-store=basic", "--site-per-process"],
        args=["--profile-directory=Default", "--disable-blink-features=AutomationControlled", "--disable-site-isolation-trials"],
        viewport={"width": 1440, "height": 900},
    )
    page = ctx.pages[0] if ctx.pages else ctx.new_page()
    page.goto(FLOW_URL, wait_until="domcontentloaded", timeout=60000)
    fl = page.frame_locator('iframe[src*="flow-applet-runner"]')
    for _ in range(30):
        time.sleep(1)
        try:
            ready = fl.locator("body").evaluate("() => !!window.FLOW_PORT")
            if ready:
                break
        except Exception:
            pass
    time.sleep(2)
    return ctx, page, fl


def ensure_character_media_ids(fl, char_names, char_media_map):
    disk_map = load_json(CHAR_MEDIA_FILE, {})
    char_media_map.update(disk_map)
    missing = [c for c in char_names if c not in char_media_map]
    if not missing:
        return char_media_map

    for char_name in missing:
        disk_map = load_json(CHAR_MEDIA_FILE, {})
        if char_name in disk_map:
            char_media_map[char_name] = disk_map[char_name]
            continue
        info = CHARACTER_PROFILES.get(char_name)
        if not info:
            continue
        print(f"  [CharRef] Generating reference image for {char_name}...", flush=True)
        prompt = f"Character Reference Sheet for {char_name}: {info['desc']} {CHARACTER_SHEET_APPEND}\n\nVisual Style: {REALISTIC_STYLE_PROMPT}"
        try:
            res = fl.locator("body").evaluate(
                """async (_el, { prompt }) => {
                    const { Flow } = await import("flow-sdk");
                    return await Flow.generate.image({
                        prompt,
                        aspectRatio: "16:9",
                        modelDisplayName: "🍌 Nano Banana 2 Lite"
                    });
                }""",
                {"prompt": prompt}
            )
            media_id = res.get("mediaId")
            if media_id:
                disk_map = load_json(CHAR_MEDIA_FILE, {})
                disk_map[char_name] = media_id
                char_media_map.update(disk_map)
                save_json(CHAR_MEDIA_FILE, char_media_map)
                ref_img_path = OUT_ROOT / "char_refs" / f"{char_name}.jpg"
                ref_img_path.parent.mkdir(parents=True, exist_ok=True)
                if res.get("base64"):
                    ref_img_path.write_bytes(base64.b64decode(res["base64"]))
                print(f"  [CharRef] Saved {char_name} -> mediaId={media_id}", flush=True)
        except Exception as e:
            print(f"  [CharRef] Warning: failed to generate ref for {char_name}: {e}", flush=True)
    return char_media_map


def build_episode_storyboard(fl, ep_num: int, ep_data: dict, ep_dir: Path):
    sb_path = ep_dir / "storyboard.json"
    if sb_path.exists():
        existing = load_json(sb_path, [])
        if len(existing) == len(ep_data["scenes"]) and all(item.get("dialogueEn") for item in existing):
            return existing

    scenes = ep_data["scenes"]
    storyboard = []

    for batch_start in range(0, len(scenes), 10):
        batch = scenes[batch_start:batch_start + 10]
        scenes_text = "\n\n".join(
            f"Scene {s['sceneNumber']}:\nContext: {s['narrationEn']}\nSuggested Short Voiceover: {s.get('dialogueEn', '')}"
            for s in batch
        )
        sys_inst = (
            "You are an expert cinematic storyboard director for a live-action dark fantasy epic movie in English. "
            "For each scene provided, output a JSON object with a 'shots' array containing EXACTLY 1 item per scene: "
            "{ \"sceneNumber\": number, \"title\": \"3-4 word English title\", "
            "\"dialogueEn\": \"A SINGLE complete, natural English sentence of 8 to 11 words (maximum 68 characters) ending with two common English words and a period or exclamation mark\", "
            "\"visualDescription\": \"3-4 vivid English sentences describing the physical setting, lighting, character positions, and cinematic action (avoid gore/explicit violence, keep it PG-13 cinematic fantasy)\", "
            "\"motionDescription\": \"1-2 English sentences describing smooth camera movement (e.g. slow push-in, sweeping tracking shot, subtle pan) and natural character movement\" }. "
            "Respond ONLY with valid JSON in English: { \"shots\": [...] }"
        )
        user_prompt = f"Create the 1-shot-per-scene English storyboard breakdown for Episode {ep_num} ({ep_data['titleEn']}):\n\n{scenes_text}"
        parsed_shots = {}
        try:
            resp = fl.locator("body").evaluate(
                """async (_el, { userPrompt, sysInst }) => {
                    const { Flow } = await import("flow-sdk");
                    return await Flow.generate.text(userPrompt, {
                        systemInstruction: sysInst,
                        modelDisplayName: "Gemini 3.0 Flash Preview",
                        thinkingLevel: "low"
                    });
                }""",
                {"userPrompt": user_prompt, "sysInst": sys_inst}
            )
            txt = resp.get("text", "")
            m = re.search(r"\{[\s\S]*\}", txt)
            if m:
                data = json.loads(m.group(0))
                for item in data.get("shots", []):
                    sn = int(item.get("sceneNumber", 0))
                    if sn > 0:
                        parsed_shots[sn] = item
        except Exception as e:
            print(f"  [EP{ep_num:02d}] Storyboard LLM batch warning: {e}", flush=True)

        for s in batch:
            sn = s["sceneNumber"]
            narration = strip_korean(s["narrationEn"])
            item = parsed_shots.get(sn, {})
            if ep_num == 10 and s.get("dialogueEn"):
                dialogue_en = strip_korean(s["dialogueEn"])
            else:
                dialogue_en = make_clean_short_sentence(
                    item.get("dialogueEn") or s.get("dialogueEn", ""),
                    narration,
                    sn
                )
            vis_desc = strip_korean(item.get("visualDescription") or f"Cinematic medieval fantasy scene: {narration}")
            mot_desc = strip_korean(item.get("motionDescription") or "Slow cinematic camera push-in with subtle atmospheric movement and dramatic lighting.")
            chars = detect_characters_in_text(narration + " " + vis_desc + " " + dialogue_en)
            storyboard.append({
                "sceneNumber": sn,
                "title": strip_korean(item.get("title") or s.get("title") or f"Scene {sn:02d}"),
                "dialogueEn": dialogue_en,
                "narrationEn": narration,
                "visualDescription": vis_desc,
                "motionDescription": mot_desc,
                "characters": chars
            })

    save_json(sb_path, storyboard)
    return storyboard


def generate_scene_batch(fl, ep_num: int, ep_title: str, batch_items: list, char_media_map: dict, reuse_existing_shots: dict = None):
    reuse_existing_shots = reuse_existing_shots or {}
    payload_items = []
    for item in batch_items:
        sn = item["sceneNumber"]
        chars = item.get("characters", [])
        char_lines = []
        ref_ids = []
        for c in chars[:3]:
            if c in CHARACTER_PROFILES:
                char_lines.append(f"- {c}: {CHARACTER_PROFILES[c]['desc']}")
            if c in char_media_map and char_media_map[c]:
                ref_ids.append(char_media_map[c])
        char_block = "\n".join(char_lines) if char_lines else "None"

        img_prompt = strip_korean(
            f"FrameDescription: {item['visualDescription']}\n"
            f"Episode Context: {ep_title}\n"
            f"Characters:\n{char_block}\n\n"
            f"Visual Style: {REALISTIC_STYLE_PROMPT}"
        )
        safe_img_prompt = strip_korean(
            f"Cinematic medieval fantasy film still from '{ep_title}', Scene {sn} ({item['title']}). "
            f"Atmospheric lighting, dramatic epic composition.\n"
            f"Characters:\n{char_block}\n\n"
            f"Visual Style: {REALISTIC_STYLE_PROMPT}"
        )

        # Single complete 8-11 word English sentence, ZERO Korean characters
        dialogue_en = strip_korean(item.get("dialogueEn") or make_clean_short_sentence("", item["narrationEn"], sn))
        dialogue_en = dialogue_en.replace('"', "'")

        vid_prompt = strip_korean(
            f"Scene Dialogue: \"{dialogue_en}\"\n"
            f"Audio: Clear, natural English voiceover speaking the entire Scene Dialogue sentence aloud within the first 6 seconds. English language only.\n\n"
            f"Visual: {item['visualDescription']}\n\n"
            f"Motion: {item['motionDescription']}"
        )
        mild_vid_prompt = strip_korean(
            f"Scene Dialogue: \"{dialogue_en}\"\n"
            f"Audio: Clear, natural English voiceover speaking the entire Scene Dialogue sentence aloud within the first 6 seconds. English language only.\n\n"
            f"Visual: Cinematic medieval fantasy scene with dramatic lighting.\n\n"
            f"Motion: Smooth cinematic camera movement."
        )

        payload_items.append({
            "sceneNumber": sn,
            "existingImgMediaId": reuse_existing_shots.get(sn),
            "imgPrompt": img_prompt[:3900],
            "safeImgPrompt": safe_img_prompt[:3900],
            "refIds": ref_ids[:3],
            "vidPrompt": vid_prompt,
            "mildVidPrompt": mild_vid_prompt,
        })

    results = fl.locator("body").evaluate(
        """async (_el, { items }) => {
            const { Flow } = await import("flow-sdk");
            return await Promise.all(items.map(async (item) => {
                try {
                    let imgRes = null;
                    if (item.existingImgMediaId) {
                        imgRes = { mediaId: item.existingImgMediaId, base64: null };
                    } else {
                        try {
                            imgRes = await Flow.generate.image({
                                prompt: item.imgPrompt,
                                aspectRatio: "16:9",
                                referenceImageMediaIds: item.refIds && item.refIds.length > 0 ? item.refIds : undefined,
                                modelDisplayName: "🍌 Nano Banana 2 Lite"
                            });
                        } catch (e1) {
                            try {
                                imgRes = await Flow.generate.image({
                                    prompt: item.imgPrompt,
                                    aspectRatio: "16:9",
                                    modelDisplayName: "🍌 Nano Banana 2 Lite"
                                });
                            } catch (e2) {
                                imgRes = await Flow.generate.image({
                                    prompt: item.safeImgPrompt,
                                    aspectRatio: "16:9",
                                    modelDisplayName: "🍌 Nano Banana 2 Lite"
                                });
                            }
                        }
                    }

                    let vidRes = null;
                    try {
                        vidRes = await Flow.generate.video({
                            prompt: item.vidPrompt,
                            firstFrameImageMediaId: imgRes.mediaId,
                            modelDisplayName: "Omni Flash",
                            aspectRatio: "16:9",
                            durationSeconds: 8
                        });
                    } catch (vErr1) {
                        try {
                            vidRes = await Flow.generate.video({
                                prompt: item.mildVidPrompt,
                                firstFrameImageMediaId: imgRes.mediaId,
                                modelDisplayName: "Omni Flash",
                                aspectRatio: "16:9",
                                durationSeconds: 8
                            });
                        } catch (vErr2) {
                            const safeImg = await Flow.generate.image({
                                prompt: item.safeImgPrompt,
                                aspectRatio: "16:9",
                                modelDisplayName: "🍌 Nano Banana 2 Lite"
                            });
                            imgRes = safeImg;
                            vidRes = await Flow.generate.video({
                                prompt: item.mildVidPrompt,
                                firstFrameImageMediaId: safeImg.mediaId,
                                modelDisplayName: "Omni Flash",
                                aspectRatio: "16:9",
                                durationSeconds: 8
                            });
                        }
                    }

                    return {
                        ok: true,
                        sceneNumber: item.sceneNumber,
                        imgMediaId: imgRes.mediaId,
                        imgBase64: imgRes.base64,
                        vidMediaId: vidRes.mediaId,
                        vidBase64: vidRes.base64
                    };
                } catch (err) {
                    return {
                        ok: false,
                        sceneNumber: item.sceneNumber,
                        error: String(err && err.message ? err.message : err)
                    };
                }
            }));
        }""",
        {"items": payload_items},
        timeout=360000
    )
    return results


def concat_episode_clips(ep_dir: Path, out_mp4: Path, scene_count: int = 20):
    concat_file = ep_dir / "concat_list.txt"
    lines = []
    for s in range(1, scene_count + 1):
        clip_path = ep_dir / f"clip_{s:02d}.mp4"
        if not clip_path.exists() or clip_path.stat().st_size < 10000:
            raise RuntimeError(f"Missing or invalid clip: {clip_path}")
        norm_tmp = ep_dir / f"clip_{s:02d}_norm.mp4"
        subprocess.run([
            "ffmpeg", "-y", "-i", str(clip_path),
            "-c", "copy", "-video_track_timescale", "12288",
            str(norm_tmp)
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        norm_tmp.replace(clip_path)
        lines.append(f"file '{clip_path.resolve()}'")
    concat_file.write_text("\n".join(lines) + "\n", encoding="utf-8")

    cmd = [
        "ffmpeg", "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", str(concat_file),
        "-c", "copy",
        str(out_mp4)
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    top_copy = MOVIE_ROOT / out_mp4.name
    shutil.copy2(out_mp4, top_copy)


def upload_episode_to_youtube(p, ep: int, title_en: str, mp4_path: Path, uploaded_map: dict) -> bool:
    if str(ep) in uploaded_map and uploaded_map[str(ep)]:
        print(f"  [YouTube EP{ep:02d}] Already uploaded ({uploaded_map[str(ep)]}), skipping.", flush=True)
        return True

    yt_title = f"SNSHero com The Movie EP{ep} {title_en}"
    yt_desc = "https://snshero.com"
    print(f"  [YouTube EP{ep:02d}] Launching YouTube Studio upload for '{yt_title}'...", flush=True)

    ctx = p.chromium.launch_persistent_context(
        user_data_dir=str(YT_PROFILE_DIR),
        channel="chrome",
        headless=True,
        user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        ignore_default_args=["--use-mock-keychain", "--password-store=basic"],
        args=["--profile-directory=Profile 6", "--disable-blink-features=AutomationControlled"],
        viewport={"width": 1440, "height": 900},
    )
    page = ctx.pages[0] if ctx.pages else ctx.new_page()
    try:
        page.goto(YT_UPLOAD_URL, wait_until="domcontentloaded", timeout=45000)
        time.sleep(4)

        file_input = page.locator("input[type=file]")
        if file_input.count() == 0:
            create_btn = page.locator("ytcp-button#create-icon, #create-icon").first
            if create_btn.count() > 0:
                create_btn.click()
                time.sleep(1.5)
                upload_item = page.locator("tp-yt-paper-item#text-item-0").first
                if upload_item.count() > 0:
                    upload_item.click()
                    time.sleep(2)

        file_input = page.locator("input[type=file]").first
        file_input.set_input_files(str(mp4_path))

        dialog = page.locator("ytcp-uploads-dialog")
        video_id = None
        limit_hit = False
        for _ in range(30):
            time.sleep(1)
            body_txt = dialog.inner_text() if dialog.count() > 0 else page.inner_text("body")
            if "일일 업로드 한도" in body_txt or "Daily upload limit" in body_txt:
                print(f"  [YouTube EP{ep:02d}] Daily upload limit reached on YouTube Studio!", flush=True)
                limit_hit = True
                break
            links = dialog.locator("a[href*='youtu.be']")
            if links.count() > 0:
                href = links.first.get_attribute("href") or ""
                if "youtu.be/" in href:
                    video_id = href.split("youtu.be/")[-1].split("?")[0].strip()
                    if video_id:
                        break

        if limit_hit or not video_id:
            ctx.close()
            return False

        print(f"  [YouTube EP{ep:02d}] Assigned video_id: {video_id}", flush=True)

        title_box = dialog.locator("#title-textarea #textbox").first
        title_box.wait_for(state="visible", timeout=15000)
        title_box.click()
        page.keyboard.press("Meta+A")
        page.keyboard.press("Backspace")
        title_box.fill(yt_title)
        time.sleep(0.5)

        desc_box = dialog.locator("#description-textarea #textbox").first
        if desc_box.count() > 0:
            desc_box.click()
            page.keyboard.press("Meta+A")
            page.keyboard.press("Backspace")
            desc_box.fill(yt_desc)
            time.sleep(0.5)

        playlist_trigger = dialog.locator("ytcp-video-metadata-playlists").first
        if playlist_trigger.count() > 0:
            playlist_trigger.scroll_into_view_if_needed()
            playlist_trigger.click()
            time.sleep(2)
            pl_item = page.locator(f'ytcp-playlist-dialog label:has-text("{YT_PLAYLIST_NAME}")').first
            if pl_item.count() > 0:
                pl_item.click()
                time.sleep(0.8)
            pl_done = page.locator(
                'ytcp-playlist-dialog ytcp-button#done-button, '
                'ytcp-playlist-dialog button:has-text("완료"), '
                'ytcp-playlist-dialog button:has-text("Done")'
            ).first
            if pl_done.count() > 0:
                pl_done.click()
                time.sleep(1)

        not_mfk = dialog.locator('tp-yt-paper-radio-button[name="VIDEO_MADE_FOR_KIDS_NOT_MFK"]').first
        not_mfk.scroll_into_view_if_needed()
        not_mfk.click()
        time.sleep(0.8)

        step3 = dialog.locator("#step-badge-3").first
        step3.click()
        time.sleep(1.5)

        pub_radio = dialog.locator('tp-yt-paper-radio-button[name="PUBLIC"]').first
        pub_radio.wait_for(state="visible", timeout=10000)
        pub_radio.click()
        time.sleep(1)

        done_btn = dialog.locator("#done-button").first
        for _ in range(90):
            disabled_attr = done_btn.get_attribute("disabled")
            aria_disabled = done_btn.get_attribute("aria-disabled")
            if disabled_attr is None and aria_disabled != "true":
                break
            time.sleep(1)

        done_btn.click()
        print(f"  🎉 [YouTube EP{ep:02d}] Published! https://youtu.be/{video_id}", flush=True)
        time.sleep(5)

        uploaded_map[str(ep)] = video_id
        save_json(YT_UPLOADED_FILE, uploaded_map)
        ctx.close()
        return True
    except Exception as e:
        print(f"  [YouTube EP{ep:02d}] Upload error: {e}", flush=True)
        try:
            ctx.close()
        except Exception:
            pass
        return False


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--start-ep", type=int, default=10)
    parser.add_argument("--end-ep", type=int, default=40)
    parser.add_argument("--profile-dir", type=str, default=str(FLOW_PROFILE_DIR))
    parser.add_argument("--skip-youtube", action="store_true")
    args = parser.parse_args()

    profile_dir = Path(args.profile_dir)
    OUT_ROOT.mkdir(parents=True, exist_ok=True)
    episodes_data = build_clean_episodes_from_english_txt()
    if not episodes_data:
        raise RuntimeError(f"Failed to build {EPISODES_JSON}")

    char_media_map = load_json(CHAR_MEDIA_FILE, {})
    uploaded_map = load_json(YT_UPLOADED_FILE, {})
    yt_quota_available = not args.skip_youtube

    with sync_playwright() as p:
        ctx, page, fl = launch_flow_browser(p, profile_dir)

        for ep in range(args.start_ep, args.end_ep + 1):
            ep_str = str(ep)
            ep_info = episodes_data[ep_str]
            title_en = ep_info["titleEn"]
            ep_dir = OUT_ROOT / f"ep{ep:02d}"
            ep_dir.mkdir(parents=True, exist_ok=True)
            final_mp4 = OUT_ROOT / f"SNSHero com The Movie EP{ep} {title_en}.mp4"

            print(f"\n==========================================", flush=True)
            print(f"🎬 Starting EP{ep:02d}/40: {title_en}", flush=True)
            print(f"==========================================", flush=True)

            if not final_mp4.exists() or final_mp4.stat().st_size < 100000:
                try:
                    storyboard = build_episode_storyboard(fl, ep, ep_info, ep_dir)
                except Exception as e:
                    print(f"  [EP{ep:02d}] Restarting Flow browser due to storyboard error: {e}", flush=True)
                    try:
                        ctx.close()
                    except Exception:
                        pass
                    ctx, page, fl = launch_flow_browser(p, profile_dir)
                    storyboard = build_episode_storyboard(fl, ep, ep_info, ep_dir)

                ep_chars = sorted({c for item in storyboard for c in item.get("characters", [])})
                if ep_chars:
                    print(f"  [EP{ep:02d}] Characters in episode: {ep_chars}", flush=True)
                    char_media_map = ensure_character_media_ids(fl, ep_chars, char_media_map)

                shot_media_cache_file = ep_dir / "shot_media_ids.json"
                shot_media_cache = load_json(shot_media_cache_file, {})

                pending = []
                for item in storyboard:
                    sn = item["sceneNumber"]
                    clip_path = ep_dir / f"clip_{sn:02d}.mp4"
                    if clip_path.exists() and clip_path.stat().st_size > 10000:
                        ok_audio, reason = verify_clip_audio(clip_path, item["dialogueEn"])
                        if ok_audio:
                            print(f"  [EP{ep:02d}] Scene {sn:02d} existing clip verified: {reason}", flush=True)
                            continue
                        else:
                            print(f"  [EP{ep:02d}] Scene {sn:02d} existing clip failed audio check ({reason}), regenerating...", flush=True)
                            clip_path.unlink(missing_ok=True)
                    pending.append(item)

                print(f"  [EP{ep:02d}] Scenes pending generation: {len(pending)}/{len(storyboard)}", flush=True)

                batch_size = 4
                for idx in range(0, len(pending), batch_size):
                    remaining_batch = [dict(x) for x in pending[idx:idx + batch_size]]
                    t0 = time.time()

                    for attempt in range(5):
                        if not remaining_batch:
                            break
                        sn_list = [b["sceneNumber"] for b in remaining_batch]
                        print(f"  [EP{ep:02d}] Generating scenes {sn_list} (attempt {attempt+1})...", flush=True)
                        try:
                            reuse_shots = {
                                b["sceneNumber"]: shot_media_cache.get(str(b["sceneNumber"]))
                                for b in remaining_batch
                                if shot_media_cache.get(str(b["sceneNumber"]))
                            }
                            results = generate_scene_batch(fl, ep, title_en, remaining_batch, char_media_map, reuse_shots)
                            failed_sns = set()
                            for r in results:
                                sn = r["sceneNumber"]
                                scene_item = next(b for b in remaining_batch if b["sceneNumber"] == sn)
                                if r.get("ok") and r.get("vidBase64"):
                                    if r.get("imgMediaId"):
                                        shot_media_cache[str(sn)] = r["imgMediaId"]
                                        save_json(shot_media_cache_file, shot_media_cache)
                                    if r.get("imgBase64"):
                                        (ep_dir / f"shot_{sn:02d}.jpg").write_bytes(base64.b64decode(r["imgBase64"]))
                                    clip_path = ep_dir / f"clip_{sn:02d}.mp4"
                                    clip_path.write_bytes(base64.b64decode(r["vidBase64"]))

                                    ok_audio, reason = verify_clip_audio(clip_path, scene_item["dialogueEn"])
                                    if ok_audio:
                                        print(f"    ✅ [EP{ep:02d} S{sn:02d}] Audio verified: {reason}", flush=True)
                                    else:
                                        print(f"    ⚠️ [EP{ep:02d} S{sn:02d}] Audio check failed ({reason}) -> retrying", flush=True)
                                        clip_path.unlink(missing_ok=True)
                                        failed_sns.add(sn)
                                else:
                                    print(f"    [EP{ep:02d}] Scene {sn} error in batch: {r.get('error')}", flush=True)
                                    failed_sns.add(sn)
                            remaining_batch = [b for b in remaining_batch if b["sceneNumber"] in failed_sns]
                            if not remaining_batch:
                                print(f"  [EP{ep:02d}] Batch completed & verified in {time.time() - t0:.1f}s!", flush=True)
                                break
                        except Exception as e:
                            print(f"  [EP{ep:02d}] Batch exception on {sn_list}: {e}", flush=True)
                            try:
                                ctx.close()
                            except Exception:
                                pass
                            time.sleep(3)
                            ctx, page, fl = launch_flow_browser(p, profile_dir)

                    for single_item in remaining_batch:
                        sn = single_item["sceneNumber"]
                        clip_path = ep_dir / f"clip_{sn:02d}.mp4"
                        if clip_path.exists() and clip_path.stat().st_size > 10000:
                            continue
                        for fb_try in range(3):
                            try:
                                safe_override = dict(single_item)
                                safe_override["visualDescription"] = (
                                    f"Epic wide cinematic landscape of a medieval fantasy kingdom during '{title_en}', "
                                    f"dramatic volumetric light rays through ancient stone architecture, atmospheric mist."
                                )
                                safe_override["motionDescription"] = "Slow majestic camera pan across the fantasy landscape."
                                safe_override["characters"] = []
                                reuse_shots = {sn: shot_media_cache.get(str(sn))} if shot_media_cache.get(str(sn)) else {}
                                results = generate_scene_batch(fl, ep, title_en, [safe_override], char_media_map, reuse_shots)
                                for r in results:
                                    if r.get("imgMediaId"):
                                        shot_media_cache[str(sn)] = r["imgMediaId"]
                                        save_json(shot_media_cache_file, shot_media_cache)
                                    if r.get("imgBase64"):
                                        (ep_dir / f"shot_{sn:02d}.jpg").write_bytes(base64.b64decode(r["imgBase64"]))
                                    if r.get("vidBase64"):
                                        clip_path.write_bytes(base64.b64decode(r["vidBase64"]))
                                ok_audio, reason = verify_clip_audio(clip_path, safe_override["dialogueEn"])
                                if ok_audio:
                                    print(f"  ✅ [EP{ep:02d} S{sn:02d}] Recovered & audio verified: {reason}", flush=True)
                                    break
                                else:
                                    print(f"  ⚠️ [EP{ep:02d} S{sn:02d}] Fallback audio check failed ({reason}), retry {fb_try+1}/3", flush=True)
                            except Exception as e2:
                                print(f"  [EP{ep:02d}] Fatal error on scene {sn}: {e2}", flush=True)

                concat_episode_clips(ep_dir, final_mp4, len(storyboard))
                print(f"  ✅ [EP{ep:02d}] Full movie saved: {final_mp4} ({final_mp4.stat().st_size / (1024*1024):.1f} MB)", flush=True)
            else:
                print(f"  ✅ [EP{ep:02d}] Movie file already exists: {final_mp4}", flush=True)

            if yt_quota_available and ep_str not in uploaded_map:
                ok = upload_episode_to_youtube(p, ep, title_en, final_mp4, uploaded_map)
                if not ok:
                    print(f"  ⚠️ [YouTube EP{ep:02d}] Upload deferred (daily limit or transient issue). Continuing generation!", flush=True)
                    yt_quota_available = False

        if not args.skip_youtube:
            for ep in range(args.start_ep, args.end_ep + 1):
                ep_str = str(ep)
                if ep_str in uploaded_map and uploaded_map[ep_str]:
                    continue
                title_en = episodes_data[ep_str]["titleEn"]
                final_mp4 = OUT_ROOT / f"SNSHero com The Movie EP{ep} {title_en}.mp4"
                if final_mp4.exists() and final_mp4.stat().st_size > 100000:
                    ok = upload_episode_to_youtube(p, ep, title_en, final_mp4, uploaded_map)
                    if not ok:
                        break

        ctx.close()


if __name__ == "__main__":
    main()
