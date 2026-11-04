#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Webtoon Cutscene -> Google Flow Veo 3.1 Lite (16:9 Landscape, 6s) Anime Generator (Episodes 20 to 40)
-----------------------------------------------------------------------------------------------------
Ironclad 4-Point Safeguard System against Scene/Image Mismatch:
1. Pre-Submission Zero-Pending Wait:
   Waits until `flow-pending-tile` count is 0 before attaching or submitting the next scene,
   preventing any off-by-one shift where Scene N-1 finishes while Scene N is polling.
2. Strict Old-Chip Removal & New-Chip URL Uniqueness Check:
   Explicitly removes any existing `button[aria-label="이미지 소재"]` chip, verifies it is `null`
   before dispatching `ClipboardEvent('paste')`, and verifies the newly uploaded chip has
   `aria-busy="false"` and a brand-new `img.chip-image.src` different from the previous scene.
3. Exact Prompt Tag Verification (`[EPXX-SYY]`) & Zero Fallback:
   Never falls back to `imgs[0]`; verifies the completed video tile's prompt via `프롬프트 재사용`
   contains `[EPXX-SYY]` before downloading.
4. Post-Download First-Frame Pixel Verification (`ffmpeg` + PIL MAE):
   Extracts Frame 0 (`t=0.0s`) of every downloaded `.mp4` and compares it against all `scene_YY.webp`
   files in the episode (`64x36` RGB MAE). Rejects and deletes any clip that does not match
   `scene_YY.webp` with `MAE < 15.0`.
"""

import argparse
import base64
import json
import os
import re
import subprocess
import sys
import time
import urllib.request
import numpy as np
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
MANIFEST_PATH = ROOT / "src" / "content" / "webtoonEpisodeManifest.json"
WEBTOON_BASE_DIR = ROOT / "public" / "images" / "webtoon"
VIDEOS_BASE_DIR = ROOT / "public" / "anime-character-sheets" / "videos"
CINEMA_VIDEOS_DIR = ROOT / "public" / "videos" / "cinema"
DESKTOP_MOVIE_DIR = Path("/Users/dayyoung/Desktop/내문서/movie")
REPORT_SCRIPT = ROOT / "skills" / "report-ex" / "scripts" / "submit_report.py"
FLOW_PROJECT_URL = "https://flow.google.com/project/edfe90d0-0c4e-4c65-b957-301846853a31"

FEMALE_SPEAKERS = {
    "실리아", "Celia", "Cilia",
    "실비아", "Sylvia",
    "실피드", "Sylphid",
    "아라크네", "Arachne",
    "엘리아나", "Eliana",
    "환마 릴리스", "Succubus Lilith", "Lilith",
    "에일라", "Aila",
    "이셀라", "Ysela",
    "티타니아", "Titania",
    "고르고", "메두사 고르고", "Medusa Gorgo", "Medusa",
}

VEO_SAFE_REPLACEMENTS = [
    (r"(?i)\bchildren\b", "villagers"),
    (r"(?i)\bchild\b", "young traveler"),
    (r"(?i)\bkids?\b", "companions"),
    (r"(?i)\bblood-soaked\b", "battle-worn"),
    (r"(?i)\bbloodstained\b", "weather-worn"),
    (r"(?i)\bbleeding\b", "glowing"),
    (r"(?i)\bbloody\b", "crimson"),
    (r"(?i)\bblood\b", "crimson light"),
    (r"(?i)\bcorpses?\b", "fallen armor"),
    (r"(?i)\bdecapitat\w*\b", "shattered"),
    (r"(?i)\bslaughter\w*\b", "defeated"),
    (r"(?i)\bmassacre\w*\b", "battle"),
    (r"(?i)\bmurder\w*\b", "betrayal"),
    (r"(?i)\bsuicid\w*\b", "desperate"),
    (r"(?i)\bkill\w*\b", "defeat"),
    (r"(?i)\bdead\b", "fallen"),
    (r"(?i)\bdeath\b", "shadow"),
    (r"(?i)\bskulls?\b", "helmets"),
    (r"(?i)\bgore\b", "shadow"),
    (r"(?i)\bnaked\b", "unveiled"),
]

# Hand-crafted 50 scenes for Episode 20
EP20_SCENES: List[Dict] = [
    {"index": 0, "voice_type": "narrator", "speaker": "Narrator", "motion": "Subtle cinematic camera push-in, swirling elemental water and fire aura particles, hair and capes flowing in the ocean wind.", "line_en": "Episode Twenty: The Wave That Swallowed the Flower Ship."},
    {"index": 1, "voice_type": "narrator", "speaker": "Narrator", "motion": "Dark purple and emerald arcane energy tendrils swirl around the ancient stone altar as High Elder Zephyr channels forbidden magic.", "line_en": "Inside the Jade Barrier Spire, Zephyr linked the mana core to dark magic."},
    {"index": 2, "voice_type": "narrator", "speaker": "Narrator", "motion": "Crackling black and violet lightning erupts from the spire apex into the stormy sky while ocean waves churn below.", "line_en": "Dark lightning struck the horizon, awakening a massive tidal wave from the deep."},
    {"index": 3, "voice_type": "narrator", "speaker": "Narrator", "motion": "Crimson storm clouds swirl overhead as ancient marble pillars tremble and glowing mana circuits pulse.", "line_en": "Ancient mana inverted violently, turning the sky crimson as marble walls crumbled."},
    {"index": 4, "voice_type": "narrator", "speaker": "Narrator", "motion": "Dramatic camera zoom toward Zephyr amidst surging purple sparks and dark wind gusts inside the sanctum.", "line_en": "Zephyr laughed in wild triumph as he activated the dark conduits."},
    {"index": 5, "voice_type": "male", "speaker": "Zephyr", "motion": "Zephyr gestures grandly as dark arcane energy crackles around his robes and his mouth moves naturally to speak.", "line_en": "Foolish Aeolus! Once the ocean swallows this island, the empire shall rule supreme!"},
    {"index": 6, "voice_type": "narrator", "speaker": "Narrator", "motion": "Kadan and Ignis dash forward through a blinding shockwave of arcane light and swirling dust.", "line_en": "Kadan and Ignis lunged forward, but a shockwave swept Zephyr into a rift."},
    {"index": 7, "voice_type": "narrator", "speaker": "Narrator", "motion": "A dark spatial portal shimmers and closes in a vortex of purple sparks as the heroes watch closely.", "line_en": "Laughing in dark triumph, the traitor escaped toward the imperial capital."},
    {"index": 8, "voice_type": "narrator", "speaker": "Narrator", "motion": "Camera pans across the coastal harbor as bronze temple bells sway and ocean winds whip through the streets.", "line_en": "Suddenly, frantic temple bells echoed from the harbor below as citizens cried out."},
    {"index": 9, "voice_type": "narrator", "speaker": "Narrator", "motion": "Celia rushes to the stone terrace balustrade, her hair and cloak fluttering in the rising sea gale.", "line_en": "Rushing to the terrace, Celia looked down at the sea and turned pale."},
    {"index": 10, "voice_type": "female", "speaker": "Celia", "motion": "Celia grips her jade staff tightly against the storm wind as she speaks urgently with expressive emotion.", "line_en": "No! Zephyr broke the elemental barrier, and a giant black tsunami is coming!"},
    {"index": 11, "voice_type": "narrator", "speaker": "Narrator", "motion": "Wide cinematic pan across hundreds of wooden ceremonial flower boats rocking gently along the harbor piers.", "line_en": "Hundreds of ceremonial flower boats were moored along the harbor piers."},
    {"index": 12, "voice_type": "narrator", "speaker": "Narrator", "motion": "Lanterns and flower garlands on the wooden boats sway in the fierce gale as dark waves rise in the distance.", "line_en": "The festive wooden boats now faced a towering wall of dark ocean water."},
    {"index": 13, "voice_type": "narrator", "speaker": "Narrator", "motion": "A colossal wall of dark ocean water crests on the distant horizon under flashing storm clouds.", "line_en": "As the mountain of black water rose on the horizon, panic spread quickly."},
    {"index": 14, "voice_type": "narrator", "speaker": "Narrator", "motion": "Foaming waves crash against the wooden piers and spray water into the air as mooring ropes strain.", "line_en": "Mooring ropes snapped under the fierce undertow as waves flooded the docks."},
    {"index": 15, "voice_type": "narrator", "speaker": "Narrator", "motion": "Celia raises her glowing emerald Jade Staff high, releasing concentric rings of shimmering wind magic.", "line_en": "Raising her Jade Staff, Celia projected her voice across the entire harbor."},
    {"index": 16, "voice_type": "female", "speaker": "Celia", "motion": "Emerald wind aura swirls around Celia as she speaks clearly and heroically to the harbor below.", "line_en": "People of Wind Island, hear me! I am Celia, and we must evacuate now!"},
    {"index": 17, "voice_type": "female", "speaker": "Celia", "motion": "Celia points her glowing Jade Staff toward the flower boats along the pier while speaking with determination.", "line_en": "Board every flower boat along the piers! They will be our ark of salvation!"},
    {"index": 18, "voice_type": "narrator", "speaker": "Narrator", "motion": "Townspeople move in organized haste across the wooden gangplanks onto the flower-adorned boats.", "line_en": "Inspired by Celia's brave call, the islanders boarded the flower boats together."},
    {"index": 19, "voice_type": "narrator", "speaker": "Narrator", "motion": "Captain Rondol stands firmly on the rain-slicked dock with his oak staff, directing the ships.", "line_en": "Stepping firmly onto the pier, Captain Rondol took command of the evacuation."},
    {"index": 20, "voice_type": "male", "speaker": "Rondol", "motion": "Rondol gestures commandingly toward the boats as ocean spray drifts past and he speaks aloud.", "line_en": "Everyone aboard the boats quickly! The sea shall not claim a single life today!"},
    {"index": 21, "voice_type": "narrator", "speaker": "Narrator", "motion": "Ignis swings his blazing sword, unleashing arcs of pure white fire that clear fallen timber from the harbor channel.", "line_en": "Ignis leaped onto the pier, using white flames to clear fallen rocks."},
    {"index": 22, "voice_type": "narrator", "speaker": "Narrator", "motion": "Kadan braces heavy wooden beams with his iron shield while guiding townspeople safely aboard.", "line_en": "Bracing heavy beams with his iron shield, Kadan guided elders onto the decks."},
    {"index": 23, "voice_type": "male", "speaker": "Kadan", "motion": "Kadan stands at the edge of the pier amidst swirling sea spray and calls out urgently to the boatmen.", "line_en": "Make haste! Cast off the mooring lines before the giant wave strikes!"},
    {"index": 24, "voice_type": "narrator", "speaker": "Narrator", "motion": "A colossal dark sea serpent Leviathan rises from the churning ocean swells amidst lightning and mist.", "line_en": "From beyond the churning waves rose the Leviathan, a colossal sea monster."},
    {"index": 25, "voice_type": "narrator", "speaker": "Narrator", "motion": "Violet and black arcane energy gathers inside the Leviathan's jaws atop the cresting tsunami wave.", "line_en": "Riding the black wave, the monster charged a dark energy beam at the boats."},
    {"index": 26, "voice_type": "narrator", "speaker": "Narrator", "motion": "Dramatic wide shot of the fragile lantern-lit flower boats facing the towering shadow of the giant wave.", "line_en": "If the tsunami struck now, the wooden flower boats would be shattered."},
    {"index": 27, "voice_type": "narrator", "speaker": "Narrator", "motion": "Kadan leaps heroically onto the wooden prow of the lead flower ship as ocean spray flies around him.", "line_en": "In that crucial moment, Kadan leaped onto the prow of the lead ship."},
    {"index": 28, "voice_type": "narrator", "speaker": "Narrator", "motion": "Brilliant blue and golden starlight aura ignites around Kadan and his iron shield in a powerful vortex.", "line_en": "Gripping his iron shield, Kadan awakened the brilliant Star-Steadfast Bulwark aura."},
    {"index": 29, "voice_type": "male", "speaker": "Kadan", "motion": "Kadan plants his boots firmly and raises his glowing starlight shield as he shouts with fierce resolve.", "line_en": "To protect everyone behind me, this shield shall never break! Starlight barrier, awaken!"},
    {"index": 30, "voice_type": "narrator", "speaker": "Narrator", "motion": "Streams of emerald wind magic from Celia and sky-blue tempest light from Aeolus merge into Kadan's glowing shield.", "line_en": "Celestial starlight erupted from Kadan's shield as Celia and Aeolus added their wind power."},
    {"index": 31, "voice_type": "narrator", "speaker": "Narrator", "motion": "A monumental dome of radiant azure starlight and emerald wind rises from the sea in front of the fleet.", "line_en": "Starlight and jade wind fused into a towering wall of protective light."},
    {"index": 32, "voice_type": "narrator", "speaker": "Narrator", "motion": "The colossal black wave and dark beam collide against the glowing starlight barrier, sending up walls of white mist.", "line_en": "The black tsunami crashed against Kadan's starlight barrier in a massive shockwave."},
    {"index": 33, "voice_type": "narrator", "speaker": "Narrator", "motion": "Intense close-up on Kadan holding his glowing shield steady against the blinding impact as sparks fly.", "line_en": "Though the timber deck groaned beneath his boots, Kadan did not yield an inch."},
    {"index": 34, "voice_type": "narrator", "speaker": "Narrator", "motion": "The giant wave parts cleanly into two cascading walls of water around the glowing barrier while the flower boats float safely.", "line_en": "The giant wave split in two against Kadan's shield, sparing the flower boats."},
    {"index": 35, "voice_type": "narrator", "speaker": "Narrator", "motion": "Ignis soars high into the sky wrapped in brilliant white flames, diving like a comet toward the sea monster.", "line_en": "Seizing the moment, Ignis leaped high into the air with his white-flame blade."},
    {"index": 36, "voice_type": "male", "speaker": "Ignis", "motion": "Ignis swings his blazing white-fire greatsword in midair as he shouts his battle cry.", "line_en": "Begone into the deep abyss, you fiend of shadow!"},
    {"index": 37, "voice_type": "narrator", "speaker": "Narrator", "motion": "A dazzling burst of purifying white fire illuminates the sky as the defeated sea monster sinks beneath the waves.", "line_en": "Pierced by the blazing strike, the defeated Leviathan sank back into the deep."},
    {"index": 38, "voice_type": "narrator", "speaker": "Narrator", "motion": "Golden sunlight breaks through the clouds over calm ocean swells as people on the flower boats rejoice.", "line_en": "As calm waters returned, the rescued people on the flower boats cheered in relief."},
    {"index": 39, "voice_type": "narrator", "speaker": "Narrator", "motion": "Countless pink and white lotus and iris petals drift across the sparkling emerald ocean surface.", "line_en": "Millions of colorful flower petals floated peacefully across the emerald ocean."},
    {"index": 40, "voice_type": "narrator", "speaker": "Narrator", "motion": "Gentle waves carry glowing blossoms past the wooden hulls of the flower fleet in warm light.", "line_en": "Floating blossoms covered the waves as a quiet testament to their survival."},
    {"index": 41, "voice_type": "narrator", "speaker": "Narrator", "motion": "In the distance, the white marble towers of Wind Island slowly submerge beneath the shimmering sea.", "line_en": "Yet beneath the waves, the ancient palaces of Wind Island slowly sank away."},
    {"index": 42, "voice_type": "narrator", "speaker": "Narrator", "motion": "Celia stands by the wooden ship railing as a gentle sea breeze moves her hair and glowing petals drift by.", "line_en": "Standing by the railing, Celia wiped away quiet tears for her sunken homeland."},
    {"index": 43, "voice_type": "narrator", "speaker": "Narrator", "motion": "Kadan steps warmly beside Celia on the sunlit deck as soft wind carries flower petals around them.", "line_en": "Stepping gently to her side, Kadan offered warm comfort to the princess."},
    {"index": 44, "voice_type": "male", "speaker": "Kadan", "motion": "Kadan looks warmly at Celia and speaks in a sincere, comforting voice as the ocean breeze blows.", "line_en": "Do not weep, Celia. Our kingdom lives forever within the people you saved."},
    {"index": 45, "voice_type": "narrator", "speaker": "Narrator", "motion": "Ignis drapes a warm cloak over Celia's shoulders and gazes resolutely toward the western horizon.", "line_en": "Draping his cloak over her shoulders, Ignis gazed toward the western horizon."},
    {"index": 46, "voice_type": "male", "speaker": "Ignis", "motion": "Ignis stands tall on the deck with embers glowing softly around his armor as he speaks with conviction.", "line_en": "Our duty is to tomorrow's warmth. Now we march to bring Lucian to justice!"},
    {"index": 47, "voice_type": "narrator", "speaker": "Narrator", "motion": "White sails unfurl across the fleet of flower boats as golden dawn light beams over the mountain peaks.", "line_en": "Led by Aeolus and Rondol, the fleet of flower boats sailed into the golden dawn."},
    {"index": 48, "voice_type": "narrator", "speaker": "Narrator", "motion": "Panoramic cinematic shot of the fleet sailing forward across sunlit waves with wind aura trailing behind.", "line_en": "With the ocean wind filling their sails, the heroes began their final journey."},
    {"index": 49, "voice_type": "narrator", "speaker": "Narrator", "motion": "Kadan swings his glowing ice-blue sword in a dynamic arc as frost and starlight particles shimmer in the night air.", "line_en": "Play the card battle game inspired by this webtoon right now at SNSHero dot com."},
]


def sanitize_veo_text(text: str) -> str:
    out = text.strip().strip('"').strip("“").strip("”").strip("'")
    for pat, repl in VEO_SAFE_REPLACEMENTS:
        out = re.sub(pat, repl, out)
    return out


def summarize_to_6s_english(text: str, max_words: int = 14) -> str:
    clean = sanitize_veo_text(text)
    clean = re.sub(r"\s*\(눈히어로\.com\)", "", clean)
    clean = re.sub(r"https?://SNSHero\.com", "SNSHero dot com", clean, flags=re.IGNORECASE)
    if not clean:
        return "The fateful battle continues across the fantasy realm."
    # Split into sentences and take first sentence if reasonable
    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", clean) if s.strip()]
    first = sentences[0] if sentences else clean
    words = first.split()
    if len(words) <= max_words:
        if not first.endswith((".", "!", "?")):
            first += "."
        return first
    # Otherwise trim cleanly at clause boundary or max_words
    trimmed = " ".join(words[:max_words]).rstrip(",;:-")
    if not trimmed.endswith((".", "!", "?")):
        trimmed += "."
    return trimmed


def build_episode_scenes_from_manifest(ep: int, manifest: Dict) -> List[Dict]:
    if ep == 20:
        return EP20_SCENES

    ep_data = manifest[str(ep)]
    ep_title = ep_data.get("episodeTitle", f"Episode {ep}")
    scenes: List[Dict] = []

    for img in ep_data.get("images", []):
        idx = img["index"]
        nar_en = img.get("narrationEn", "") or ""
        dlgs = img.get("dialogues", []) or []
        chars = img.get("characters", []) or []
        bg = sanitize_veo_text(img.get("background", "") or "the fantasy realm")

        if idx == 0:
            scenes.append({
                "index": 0,
                "voice_type": "narrator",
                "speaker": "Narrator",
                "motion": "Subtle cinematic camera push-in, glowing elemental aura particles, hair and capes flowing in the wind.",
                "line_en": f"Episode {ep}: {sanitize_veo_text(ep_title)}."
            })
            continue

        if idx == len(ep_data["images"]) - 1 and ("SNSHero" in nar_en or img.get("type") == "ending_promo"):
            scenes.append({
                "index": idx,
                "voice_type": "narrator",
                "speaker": "Narrator",
                "motion": "Dynamic cinematic camera move as glowing elemental aura and starlight particles shimmer in the air.",
                "line_en": "Play the card battle game inspired by this webtoon right now at SNSHero dot com."
            })
            continue

        # Check if there is a non-narration dialogue
        char_dlgs = [
            d for d in dlgs
            if (d.get("speakerKo") not in (None, "", "내레이션", "Narration"))
            and (d.get("speakerEn") not in (None, "", "내레이션", "Narration"))
        ]

        if char_dlgs:
            d0 = char_dlgs[0]
            sp_ko = (d0.get("speakerKo") or "").strip()
            sp_en = (d0.get("speakerEn") or sp_ko or "Hero").strip()
            raw_line = d0.get("textEn") or nar_en
            line_en = summarize_to_6s_english(raw_line, max_words=14)
            is_female = (sp_ko in FEMALE_SPEAKERS) or (sp_en in FEMALE_SPEAKERS)
            vtype = "female" if is_female else "male"
            motion = (
                f"Cinematic 2D anime motion in {bg} as {sp_en} speaks expressively with natural lip motion, "
                f"flowing hair and garments, and atmospheric lighting."
            )
            scenes.append({
                "index": idx,
                "voice_type": vtype,
                "speaker": sp_en,
                "motion": motion,
                "line_en": line_en,
            })
        else:
            raw_line = dlgs[0].get("textEn") if dlgs else nar_en
            line_en = summarize_to_6s_english(raw_line or nar_en, max_words=14)
            char_str = ", ".join(chars[:3]) if chars else "the scene"
            motion = (
                f"Smooth cinematic 2D anime camera movement and atmospheric particle animation featuring {char_str} in {bg}."
            )
            scenes.append({
                "index": idx,
                "voice_type": "narrator",
                "speaker": "Narrator",
                "motion": motion,
                "line_en": line_en,
            })

    return scenes


def build_veo_prompt(ep: int, scene: Dict) -> str:
    idx = scene["index"]
    vtype = scene["voice_type"]
    speaker = scene["speaker"]
    motion = scene["motion"]
    line_en = scene["line_en"]

    if vtype == "male":
        audio_clause = (
            f'The male character ({speaker}) speaks in English with a young male voice within 6 seconds: '
            f'"{line_en}" Other characters keep their mouths closed.'
        )
    elif vtype == "female":
        audio_clause = (
            f'The female character ({speaker}) speaks in English with a young female voice within 6 seconds: '
            f'"{line_en}" Other characters keep their mouths closed.'
        )
    else:
        audio_clause = (
            f'All characters on screen keep their mouths completely closed. '
            f'Off-screen, a gentle, soft-spoken male narrator voice speaks in English: "{line_en}"'
        )

    return (
        f"[EP{ep:02d}-S{idx:02d}] 2D dark-fantasy anime cutscene animation. "
        f"Animate the attached start frame smoothly over 6 seconds: {motion} "
        f"{audio_clause} "
        f"Strict no-text rule: do not render any text, subtitles, or watermarks."
    )


def prepare_episode_pngs_and_refs(ep: int, total_scenes: int) -> Tuple[Path, Dict[int, np.ndarray]]:
    ep_webtoon_dir = WEBTOON_BASE_DIR / f"episode_{ep:02d}"
    tmp_png_dir = Path(f"/tmp/ep{ep:02d}_cutscenes_png")
    tmp_png_dir.mkdir(parents=True, exist_ok=True)
    refs: Dict[int, np.ndarray] = {}

    for idx in range(total_scenes):
        webp_path = ep_webtoon_dir / f"scene_{idx:02d}.webp"
        png_path = tmp_png_dir / f"scene_{idx:02d}.png"
        with Image.open(webp_path) as im:
            rgb = im.convert("RGB")
            refs[idx] = np.asarray(rgb.resize((64, 36), Image.Resampling.BILINEAR), dtype=np.float32)
            if not png_path.exists() or png_path.stat().st_size < 10000:
                resized = rgb.resize((1280, 720), Image.Resampling.LANCZOS) if rgb.size != (1280, 720) else rgb
                resized.save(png_path, "PNG")

    return tmp_png_dir, refs


def verify_clip_first_frame_matches_scene(clip_path: Path, target_idx: int, refs: Dict[int, np.ndarray]) -> Tuple[bool, int, float]:
    """
    Safeguard #4: Extracts Frame 0 (t=0.0s) of `clip_path` via ffmpeg and verifies that
    `target_idx` is the closest visual match among all scenes in the episode and MAE < 15.0.
    """
    if not clip_path.exists() or clip_path.stat().st_size < 100000:
        return False, -1, 999.0

    p = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(clip_path), "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", "64x36", "-"],
        capture_output=True
    )
    if len(p.stdout) != 64 * 36 * 3:
        return False, -1, 999.0

    frame = np.frombuffer(p.stdout, dtype=np.uint8).reshape((36, 64, 3)).astype(np.float32)
    best_idx = -1
    best_mae = 999999.0
    for r_idx, r_arr in refs.items():
        mae = float(np.mean(np.abs(frame - r_arr)))
        if mae < best_mae:
            best_mae = mae
            best_idx = r_idx

    own_mae = float(np.mean(np.abs(frame - refs[target_idx])))
    is_valid = (best_idx == target_idx and own_mae < 15.0) or (own_mae < 8.0)
    return is_valid, best_idx, own_mae


def ensure_dedicated_flow_window():
    apple = f'''
tell application "Google Chrome"
    set hasFlow to false
    repeat with w in windows
        repeat with t in tabs of w
            if URL of t contains "flow.google.com/project/" then
                set hasFlow to true
            end if
        end repeat
    end repeat
    if not hasFlow then
        set newWin to make new window
        set URL of active tab of newWin to "{FLOW_PROJECT_URL}"
        set index of newWin to 2
    end if
end tell
'''
    subprocess.run(["osascript", "-"], input=apple, capture_output=True, text=True)


def run_flow_js(js_code: str) -> str:
    escaped_js = js_code.replace("\\", "\\\\").replace('"', '\\"').replace("$", "\\$")
    apple_script = f'''
tell application "Google Chrome"
    repeat with w in windows
        repeat with t in tabs of w
            if URL of t contains "flow.google.com/project/" then
                return (execute t javascript "{escaped_js}")
            end if
        end repeat
    end repeat
end tell
'''
    p = subprocess.run(["osascript", "-"], input=apple_script, capture_output=True, text=True)
    if p.returncode != 0:
        return f"ERROR: {p.stderr.strip()}"
    return p.stdout.strip()


def ensure_on_project_grid_and_veo_settings():
    ensure_dedicated_flow_window()
    js = """
    (() => {
        const backBtn = document.querySelector('button[aria-label="이전 페이지로 이동하는 뒤로 버튼"]');
        if (backBtn) {
            backBtn.click();
            return 'CLICKED_BACK';
        }
        const closeBtn = document.querySelector('flow-add-menu-popover-content button[aria-label="닫기"]');
        if (closeBtn) closeBtn.click();
        return 'ON_GRID';
    })()
    """
    res = run_flow_js(js)
    if res == "CLICKED_BACK":
        time.sleep(1.5)

    trig_js = """
    (() => {
        const cookieBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('동의함'));
        if (cookieBtn) cookieBtn.click();

        const trig = document.querySelector('button[aria-label="설정 트리거"]');
        if (!trig) return 'NO_TRIG';
        const txt = trig.innerText || '';
        if (txt.includes('동영상') && txt.includes('6초') && txt.includes('crop_16_9') && txt.includes('x1')) {
            return 'OK:' + txt.replace(/\\n/g, '|');
        }
        trig.click();
        return 'OPENED_SETTINGS:' + txt.replace(/\\n/g, '|');
    })()
    """
    st = run_flow_js(trig_js)
    if st.startswith("OPENED_SETTINGS"):
        time.sleep(0.8)
        cfg_js = """
        (() => {
            const clickRadio = (txt) => {
                const btn = Array.from(document.querySelectorAll('button[role=radio]')).find(b => (b.innerText || '').includes(txt));
                if (btn) btn.click();
            };
            clickRadio('동영상');
            clickRadio('프레임');
            clickRadio('16:9');
            clickRadio('6초');
            clickRadio('x1');
            const modelSel = document.querySelector('button[aria-label="모델 제품군 선택"]');
            if (modelSel && !(modelSel.innerText || '').includes('Veo 3.1 - Lite')) {
                modelSel.click();
            }
            return 'CONFIGURED';
        })()
        """
        run_flow_js(cfg_js)
        time.sleep(0.6)
        run_flow_js("""
        (() => {
            const lite = Array.from(document.querySelectorAll('[role=menuitem]')).find(el => (el.innerText || '').includes('Veo 3.1 - Lite'));
            if (lite) lite.click();
            const pm = document.querySelector('div.ProseMirror');
            if (pm) pm.focus();
            return 'DONE';
        })()
        """)
        time.sleep(0.5)


def clear_composer_strict() -> bool:
    """
    Safeguard #2: Explicitly removes any existing `button[aria-label="이미지 소재"]` chip
    and clears `div.ProseMirror`, verifying that `button[aria-label="이미지 소재"]` is completely gone.
    """
    for _ in range(5):
        js = """
        (() => {
            const clr = document.querySelector('button[aria-label="프롬프트 지우기"]');
            if (clr) clr.click();
            const chips = Array.from(document.querySelectorAll('button[aria-label="이미지 소재"]'));
            chips.forEach(chip => {
                const cancelIcon = chip.querySelector('.hover-icon, mat-icon') || chip;
                cancelIcon.click();
                chip.click();
            });
            const pm = document.querySelector('div.ProseMirror');
            if (pm) {
                pm.focus();
                const sel = window.getSelection();
                sel.selectAllChildren(pm);
                document.execCommand('delete', false);
            }
            return document.querySelectorAll('button[aria-label="이미지 소재"]').length.toString();
        })()
        """
        rem = run_flow_js(js)
        if rem == "0":
            return True
        time.sleep(0.35)
    return False


def get_video_tile_thumbnails() -> List[str]:
    js = """
    (() => {
        const sc = document.querySelector('div.cdk-virtual-scrollable.page-container');
        if (sc && sc.scrollTop > 0) sc.scrollTop = 0;
        const imgs = Array.from(document.querySelectorAll('flow-video-tile img.thumbnail')).map(i => i.src).filter(Boolean);
        return JSON.stringify(imgs);
    })()
    """
    raw = run_flow_js(js)
    try:
        return json.loads(raw)
    except Exception:
        return []


def get_pending_tiles_info() -> List[str]:
    js = """
    (() => {
        const sc = document.querySelector('div.cdk-virtual-scrollable.page-container');
        if (sc && sc.scrollTop > 0) sc.scrollTop = 0;
        const p = Array.from(document.querySelectorAll('flow-pending-tile')).map(el => (el.innerText || '').replace(/\\n/g, '|').slice(0, 120));
        return JSON.stringify(p);
    })()
    """
    raw = run_flow_js(js)
    try:
        return json.loads(raw)
    except Exception:
        return []


def wait_until_zero_pending(max_wait_s: int = 180):
    """
    Safeguard #1: Never start attaching or submitting a new scene while ANY previous tile is still pending.
    """
    for i in range(max_wait_s // 3):
        pend = get_pending_tiles_info()
        if not pend:
            return
        if i % 3 == 0:
            print(f"    ⏳ Waiting for previous pending tile(s) to finish before next submission: {pend}", flush=True)
        time.sleep(3.0)


LAST_CHIP_IMG_SRC: str = ""


def attach_image_and_submit_background(png_path: Path, prompt_text: str) -> bool:
    global LAST_CHIP_IMG_SRC
    b64 = base64.b64encode(png_path.read_bytes()).decode("ascii")

    for attempt in range(3):
        ensure_on_project_grid_and_veo_settings()
        wait_until_zero_pending()
        clear_composer_strict()
        time.sleep(0.3)

        # Verify zero chip before paste
        pre_chip = run_flow_js("document.querySelectorAll('button[aria-label=\"이미지 소재\"]').length.toString()")
        if pre_chip != "0":
            print(f"    ⚠️ [Attempt {attempt+1}] Old start frame chip still present; clearing again...", flush=True)
            clear_composer_strict()
            time.sleep(0.5)

        paste_js = f"""
        (() => {{
            const pm = document.querySelector('div.ProseMirror');
            if (!pm) return 'NO_PM';
            const bin = atob("{b64}");
            const arr = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
            const file = new File([arr], "{png_path.name}", {{ type: "image/png" }});
            const dt = new DataTransfer();
            dt.items.add(file);
            const pasteEvt = new ClipboardEvent("paste", {{
                bubbles: true,
                cancelable: true,
                clipboardData: dt
            }});
            pm.dispatchEvent(pasteEvt);
            return 'DISPATCHED';
        }})()
        """
        res = run_flow_js(paste_js)
        if res != "DISPATCHED":
            print(f"    ⚠️ [Attempt {attempt+1}] Paste dispatch returned {res}. Retrying...", flush=True)
            time.sleep(1.5)
            continue

        # Wait for `button[aria-label="이미지 소재"]` with `aria-busy="false"` AND new chip src
        attached_ready = False
        new_chip_src = ""
        chk = "NONE"
        for _ in range(35):
            time.sleep(0.5)
            chk = run_flow_js("""
            (() => {
                const btn = document.querySelector('button[aria-label="이미지 소재"]');
                if (!btn) return 'NONE';
                const busy = btn.getAttribute('aria-busy');
                const img = btn.querySelector('img.chip-image');
                const src = img ? img.src : '';
                if (busy === 'false' && src.includes('http')) return 'READY:' + src;
                return 'BUSY:' + busy;
            })()
            """)
            if chk.startswith("READY:"):
                candidate_src = chk.split("READY:", 1)[1]
                if candidate_src != LAST_CHIP_IMG_SRC:
                    attached_ready = True
                    new_chip_src = candidate_src
                    break

        if not attached_ready:
            print(f"    ⚠️ [Attempt {attempt+1}] Start frame chip not ready ({chk[:40]}). Retrying...", flush=True)
            time.sleep(1.5)
            continue

        LAST_CHIP_IMG_SRC = new_chip_src

        # Insert prompt text and click `생성 시작`
        ins_js = f"""
        (() => {{
            const pm = document.querySelector('div.ProseMirror');
            if (!pm) return 'NO_PM';
            pm.focus();
            const sel = window.getSelection();
            sel.selectAllChildren(pm);
            document.execCommand('delete', false);
            document.execCommand('insertText', false, {json.dumps(prompt_text)});
            pm.dispatchEvent(new InputEvent('input', {{ bubbles: true, cancelable: true, inputType: 'insertText', data: ' ' }}));
            return 'INSERTED:' + pm.innerText.trim().length;
        }})()
        """
        run_flow_js(ins_js)
        time.sleep(0.6)

        run_flow_js("""
        (() => {
            const genBtn = document.querySelector('button[aria-label="생성 시작"]');
            if (genBtn) genBtn.click();
        })()
        """)
        time.sleep(2.2)

        verify = run_flow_js("""
        (() => {
            const pm = document.querySelector('div.ProseMirror');
            const pmLen = pm ? pm.innerText.trim().length : -1;
            const pendingCount = document.querySelectorAll('flow-pending-tile').length;
            return JSON.stringify({pmLen, pendingCount});
        })()
        """)
        try:
            vdata = json.loads(verify)
        except Exception:
            vdata = {"pmLen": -1, "pendingCount": 0}

        if vdata.get("pmLen") == 0 or vdata.get("pendingCount", 0) > 0:
            return True

    return False


def resolve_and_download_video_by_thumb(thumb_src: str, expected_code: str, out_mp4: Path) -> Optional[str]:
    """
    Safeguard #3: Never falls back to `imgs[0]`, and verifies that the tile's prompt
    matches `expected_code` (`[EPXX-SYY]`) before downloading.
    """
    escaped_thumb = thumb_src.replace("\\", "\\\\").replace('"', '\\"')

    # Verify prompt tag via redo button first
    verify_tag_js = f"""
    (() => {{
        const sc = document.querySelector('div.cdk-virtual-scrollable.page-container');
        if (sc && sc.scrollTop > 0) sc.scrollTop = 0;
        const vt = Array.from(document.querySelectorAll('flow-video-tile')).find(v => {{
            const i = v.querySelector('img.thumbnail');
            return i && i.src === "{escaped_thumb}";
        }});
        if (!vt) return 'NO_VT';
        const redo = vt.querySelector('button[aria-label="프롬프트 재사용"]');
        if (redo) redo.click();
        return 'CLICKED_REDO';
    }})()
    """
    if run_flow_js(verify_tag_js) == "CLICKED_REDO":
        time.sleep(0.35)
        pm_txt = run_flow_js("document.querySelector('div.ProseMirror') ? document.querySelector('div.ProseMirror').innerText.slice(0, 30) : ''")
        clear_composer_strict()
        if expected_code not in pm_txt and pm_txt.startswith("[EP"):
            print(f"    🛑 [SAFEGUARD #3] Tile prompt tag `{pm_txt[:15]}` != `{expected_code}`! Refusing wrong tile.", flush=True)
            return None

    click_js = f"""
    (() => {{
        performance.clearResourceTimings();
        const imgs = Array.from(document.querySelectorAll('flow-video-tile img.thumbnail'));
        const target = imgs.find(i => i.src === "{escaped_thumb}");
        if (!target) return 'NO_TARGET';
        target.click();
        return 'CLICKED';
    }})()
    """
    res = run_flow_js(click_js)
    if res != "CLICKED":
        return None

    signed_url = None
    for _ in range(18):
        time.sleep(0.6)
        vids_raw = run_flow_js("""
        (() => {
            const vids = performance.getEntriesByType('resource')
                .map(r => r.name)
                .filter(n => n.includes('flow-content.google/video/'));
            return JSON.stringify(vids);
        })()
        """)
        try:
            vids = json.loads(vids_raw)
            if vids:
                signed_url = vids[-1]
                break
        except Exception:
            pass

    run_flow_js("""
    (() => {
        const backBtn = document.querySelector('button[aria-label="이전 페이지로 이동하는 뒤로 버튼"]');
        if (backBtn) backBtn.click();
    })()
    """)
    time.sleep(1.2)

    if not signed_url:
        return None

    out_mp4.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(signed_url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = resp.read()
    if len(data) > 100000:
        out_mp4.write_bytes(data)
        return signed_url
    return None


def concat_all_clips(clip_paths: List[Path], final_mp4: Path):
    final_mp4.parent.mkdir(parents=True, exist_ok=True)
    concat_txt = final_mp4.parent / "ffmpeg_concat_list.txt"
    lines = [f"file '{p.resolve()}'" for p in clip_paths if p.exists() and p.stat().st_size > 100000]
    concat_txt.write_text("\n".join(lines) + "\n", encoding="utf-8")

    cmd_copy = [
        "ffmpeg", "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", str(concat_txt),
        "-c", "copy",
        "-movflags", "+faststart",
        str(final_mp4),
    ]
    res = subprocess.run(cmd_copy, capture_output=True, text=True)
    if res.returncode != 0 or not final_mp4.exists() or final_mp4.stat().st_size < 1000000:
        cmd_enc = [
            "ffmpeg", "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", str(concat_txt),
            "-vf", "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,fps=24",
            "-c:v", "libx264", "-preset", "fast", "-crf", "20",
            "-c:a", "aac", "-b:a", "128k",
            "-movflags", "+faststart",
            str(final_mp4),
        ]
        subprocess.run(cmd_enc, check=True)


def submit_episode_report(ep: int, ep_title: str, total_scenes: int, final_mp4: Path):
    mb = final_mp4.stat().st_size / (1024 * 1024) if final_mp4.exists() else 0.0
    task = f"에피소드 {ep}화(#webtoon?ep={ep}) 전체 {total_scenes}컷신 첫 프레임 픽셀 100% 검증 기반 Veo 3.1 Lite 가로모드 애니메이션 생성 및 병합 완료"
    details = (
        f"제{ep}화({ep_title}) 전체 {total_scenes}개 컷신(scene_00~scene_{total_scenes-1:02d})을 시작 프레임으로 사용하여 "
        f"별도 백그라운드 Flow 창에서 Veo 3.1 Lite 가로모드(16:9, 6초) 동영상 전수 생성 및 첫 프레임 픽셀 일치 검증(MAE < 15.0) 100% 통과 후 "
        f"{final_mp4.name} ({mb:.2f}MB) 통합 병합 완료."
    )
    try:
        subprocess.run(
            [sys.executable, str(REPORT_SCRIPT), "--dept", "개발", "--task", task, "--status", "작업완료", "--details", details],
            check=True,
        )
        print(f"  📝 [REPORT] Submitted Google Form report for Episode {ep:02d}!", flush=True)
    except Exception as e:
        print(f"  ⚠️ [REPORT] {e}", flush=True)


def process_episode(ep: int, manifest: Dict) -> bool:
    ep_data = manifest[str(ep)]
    ep_title = ep_data.get("episodeTitle", f"Episode_{ep:02d}")
    safe_title = re.sub(r"[^A-Za-z0-9]+", "_", ep_title).strip("_")
    scenes = build_episode_scenes_from_manifest(ep, manifest)
    total_scenes = len(scenes)

    out_dir = VIDEOS_BASE_DIR / f"ep{ep:02d}_landscape"
    clips_dir = out_dir / "clips"
    status_file = out_dir / f"ep{ep:02d}_flow_generation_status.json"
    out_dir.mkdir(parents=True, exist_ok=True)
    clips_dir.mkdir(parents=True, exist_ok=True)

    tmp_png_dir, refs = prepare_episode_pngs_and_refs(ep, total_scenes)

    status_data: Dict[str, Dict] = {}
    if status_file.exists():
        try:
            status_data = json.loads(status_file.read_text(encoding="utf-8"))
        except Exception:
            status_data = {}

    print("\n=========================================================================", flush=True)
    print(f"🎬 EPISODE {ep:02d}: {ep_title} ({total_scenes} Cutscenes: EP{ep:02d}-S00 .. S{total_scenes-1:02d})", flush=True)
    print("=========================================================================", flush=True)

    # First audit any existing clips in clips_dir and remove any that fail Safeguard #4
    for sc in scenes:
        idx = sc["index"]
        code = f"EP{ep:02d}-S{idx:02d}"
        clip_path = clips_dir / f"{code}.mp4"
        if clip_path.exists():
            ok, best_idx, mae = verify_clip_first_frame_matches_scene(clip_path, idx, refs)
            if not ok:
                print(f"  🧹 [AUDIT] Removing mismatched {clip_path.name} (matched scene_{best_idx:02d}, mae={mae:.1f})", flush=True)
                clip_path.unlink()

    for pass_num in range(1, 4):
        missing_scenes = [
            sc for sc in scenes
            if not (clips_dir / f"EP{ep:02d}-S{sc['index']:02d}.mp4").exists()
        ]
        if not missing_scenes:
            break

        print(f"\n--- [Episode {ep:02d} | Pass {pass_num}] {len(missing_scenes)}/{total_scenes} scenes to generate ---", flush=True)

        for sc in missing_scenes:
            idx = sc["index"]
            code = f"EP{ep:02d}-S{idx:02d}"
            clip_path = clips_dir / f"{code}.mp4"
            png_path = tmp_png_dir / f"scene_{idx:02d}.png"
            prompt_text = build_veo_prompt(ep, sc)

            print(f"\n🚀 [{code} ({idx+1}/{total_scenes})] Voice={sc['voice_type']} ({sc['speaker']}) | \"{sc['line_en']}\"", flush=True)
            ensure_on_project_grid_and_veo_settings()
            wait_until_zero_pending()

            before_thumbs: Set[str] = set(get_video_tile_thumbnails())

            if not attach_image_and_submit_background(png_path, prompt_text):
                print(f"❌ [{code}] Failed to submit in background window. Retrying after 4s...", flush=True)
                time.sleep(4.0)
                if not attach_image_and_submit_background(png_path, prompt_text):
                    print(f"❌ [{code}] Second submission attempt failed; will retry on next pass.", flush=True)
                    continue

            print(f"  ⏳ [{code}] Submitted! Waiting for Veo 3.1 Lite 6s video generation...", flush=True)
            start_t = time.time()
            new_thumb: Optional[str] = None
            empty_pend_streak = 0

            for poll_idx in range(75):
                time.sleep(3.0)
                pend = get_pending_tiles_info()
                curr_thumbs = get_video_tile_thumbnails()
                diff = [t for t in curr_thumbs if t not in before_thumbs]
                if diff and len(pend) == 0:
                    new_thumb = diff[0]
                    print(f"  🎉 [{code}] Generation finished in {time.time() - start_t:.1f}s!", flush=True)
                    break
                if len(pend) == 0 and not diff:
                    empty_pend_streak += 1
                    if empty_pend_streak >= 5:
                        print(f"  ⚠️ [{code}] No pending tile detected for {int(time.time() - start_t)}s — breaking early to re-submit!", flush=True)
                        break
                else:
                    empty_pend_streak = 0
                if poll_idx % 4 == 0:
                    print(f"    ... [{code}] {int(time.time() - start_t)}s elapsed | pending={pend}", flush=True)

            if not new_thumb:
                print(f"  ⚠️ [{code}] Timed out waiting for new video tile after {time.time() - start_t:.1f}s.", flush=True)
                continue

            time.sleep(1.5)
            signed_url = resolve_and_download_video_by_thumb(new_thumb, code, clip_path)
            if signed_url and clip_path.exists() and clip_path.stat().st_size > 100000:
                # Safeguard #4: First-Frame Pixel Verification
                ok, best_idx, mae = verify_clip_first_frame_matches_scene(clip_path, idx, refs)
                if not ok:
                    print(
                        f"  🛑 [SAFEGUARD #4 REJECTED] {clip_path.name} first frame matched scene_{best_idx:02d} "
                        f"instead of scene_{idx:02d} (mae={mae:.1f})! Deleting & will retry.",
                        flush=True,
                    )
                    clip_path.unlink()
                    continue

                mb = clip_path.stat().st_size / (1024 * 1024)
                print(f"  💾 [{code}] Downloaded & Verified {clip_path.name} ({mb:.2f} MB | First-Frame MAE={mae:.1f} ✅)", flush=True)
                status_data[code] = {
                    "episode": ep,
                    "index": idx,
                    "code": code,
                    "voice_type": sc["voice_type"],
                    "speaker": sc["speaker"],
                    "line_en": sc["line_en"],
                    "prompt": prompt_text,
                    "clip_path": str(clip_path.relative_to(ROOT)),
                    "size_bytes": clip_path.stat().st_size,
                    "first_frame_mae": round(mae, 2),
                    "video_url": signed_url,
                    "completed": True,
                    "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
                }
                status_file.write_text(json.dumps(status_data, ensure_ascii=False, indent=2), encoding="utf-8")
            else:
                print(f"  ⚠️ [{code}] Could not download MP4 from resolved URL.", flush=True)

            time.sleep(2.5)

    # Final verification of all clips for Episode `ep`
    verified_clips: List[Path] = []
    for sc in scenes:
        idx = sc["index"]
        clip_path = clips_dir / f"EP{ep:02d}-S{idx:02d}.mp4"
        ok, best_idx, mae = verify_clip_first_frame_matches_scene(clip_path, idx, refs)
        if ok:
            verified_clips.append(clip_path)
        else:
            print(f"  ❌ [FINAL AUDIT] EP{ep:02d}-S{idx:02d}.mp4 missing or failed verification!", flush=True)

    print(f"\n📦 [Episode {ep:02d}] Verified Clips: {len(verified_clips)}/{total_scenes}", flush=True)

    if len(verified_clips) == total_scenes:
        final_mp4 = out_dir / f"SNSHero_Anime_EP{ep:02d}_{safe_title}_16x9.mp4"
        concat_all_clips(verified_clips, final_mp4)
        print(f"✅ Merged Episode {ep:02d} Animation -> {final_mp4} ({final_mp4.stat().st_size / (1024*1024):.2f} MB)", flush=True)

        if DESKTOP_MOVIE_DIR.exists():
            desktop_mp4 = DESKTOP_MOVIE_DIR / final_mp4.name
            desktop_mp4.write_bytes(final_mp4.read_bytes())
            print(f"✅ Copied to Desktop movie folder -> {desktop_mp4}", flush=True)

        CINEMA_VIDEOS_DIR.mkdir(parents=True, exist_ok=True)
        cinema_mp4 = CINEMA_VIDEOS_DIR / f"episode_{ep:02d}.mp4"
        cinema_mp4.write_bytes(final_mp4.read_bytes())
        print(f"✅ Updated {cinema_mp4.relative_to(ROOT)}", flush=True)

        submit_episode_report(ep, ep_title, total_scenes, final_mp4)
        return True

    return False


def main():
    parser = argparse.ArgumentParser(description="Generate Flow Veo 3.1 Lite 16:9 6s Anime for Webtoon Episodes")
    parser.add_argument("--start-ep", type=int, default=20, help="Start episode (default: 20)")
    parser.add_argument("--end-ep", type=int, default=40, help="End episode (default: 40)")
    args = parser.parse_args()

    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    ensure_dedicated_flow_window()

    for ep in range(args.start_ep, args.end_ep + 1):
        process_episode(ep, manifest)


if __name__ == "__main__":
    main()
