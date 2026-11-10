#!/usr/bin/env python3
"""
Builds Multi-Voice Webtoon Slideshow Videos (160 total):
1. Full-Length Episodes (16:9 HD 1280x720, 24fps, static rock-steady scenes):
   - Korean 40 episodes:  exports/webtoon_videos/ko/01화 ... (한국어 더빙).mp4
   - English 40 episodes: exports/webtoon_videos/en/EP01 ... (English Dub).mp4
2. YouTube Shorts Episodes (9:16 Vertical Full HD 1080x1920, 24fps, <60s highlight):
   - Korean 40 shorts:    exports/webtoon_videos/shorts_ko/01화 ... (한국어 쇼츠).mp4
   - English 40 shorts:   exports/webtoon_videos/shorts_en/EP01 ... (English Shorts).mp4

Voice Casting Rules:
- Normal narration: Lively, upbeat male voice (KO: ko-KR-InJoonNeural +18%, EN: en-US-RogerNeural +16%)
- Normal dialogue: Calm young male / young female voice matched to character gender
- Emphasis / Shout dialogue: Excited, energetic male / female voice matched to character gender
- Situational dialogue: Contextual prosody for whispers, sorrow, thoughts, elders, and villains
"""

import asyncio
import concurrent.futures
import hashlib
import json
import math
import os
import re
import shutil
import subprocess
import sys
import time
import wave
from pathlib import Path
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont
import numpy as np
import edge_tts

PROJECT_ROOT = Path("/Users/dayyoung/project/snshero")
MANIFEST_PATH = PROJECT_ROOT / "src/content/webtoonEpisodeManifest.json"
BOOK_INDEX_PATH = PROJECT_ROOT / "public/book/index.json"
TTS_CACHE_ROOT = Path("/tmp/snshero_tts_cache_v2")

# 16:9 Full Episode dimensions
VIDEO_W = 1280
VIDEO_H = 720

# 9:16 Shorts dimensions
SHORTS_W = 1080
SHORTS_H = 1920

FPS = 24
SR = 48000
SAMPLES_PER_FRAME = SR // FPS  # 2000 exact samples per 1/24s frame

FONT_KO = "/System/Library/Fonts/AppleSDGothicNeo.ttc"
FONT_EN_SANS = "/System/Library/Fonts/Avenir Next.ttc"
FONT_EN_SERIF = "/System/Library/Fonts/Palatino.ttc"

YOUNG_FEMALE_SPEAKERS = {
    "실리아", "Celia", "Cilia",
    "에일라", "Aila",
    "카제", "Kaze",
    "엘리아나", "Eliana",
    "실비아", "Sylvia",
    "티타니아", "Titania",
    "엘윈", "Elwin",
    "이셀라", "Ysela",
    "실피드", "Sylphid",
}

VILLAIN_FEMALE_SPEAKERS = {
    "메두사 고르고", "고르고", "Medusa Gorgo", "Medusa",
    "아라크네", "Arachne",
    "몽마 릴리스", "서큐버스 릴리스", "Succubus Lilith", "Lilith",
}

CHILD_SPEAKERS = {
    "피난민 아이", "Refugee Child",
    "구출된 아이", "Rescued Child",
}

ELDER_OR_VETERAN_MALE_SPEAKERS = {
    "헤르쿨", "Hercul",
    "론돌", "Rondol",
    "그림리", "Grimli",
    "가웨인", "Gawain",
    "레오나르", "Leonar",
    "펜릴", "Fenrir",
    "에올루스", "에올루스의 환영", "Aeolus",
    "말퓨온", "Malfuon", "Malfurion",
    "별빛의 현자", "Star Hermit",
    "원로원 의장", "Senate Chancellor",
    "항구 노인", "Harbor Elder",
    "어부", "Fisherman",
    "토르발트", "토르발드", "Thorvald",
}

VILLAIN_MALE_SPEAKERS = {
    "루시안", "Lucian",
    "제피르", "Zephyr",
    "데스나이트 아르투스", "아르투스", "Death Knight Artus", "Artus",
    "발타자르", "Balthazar",
    "바르가스트", "Barghest",
    "카르낙", "Karnak",
    "벨페고르", "Belphegor",
    "보가트", "고블린 왕 보가트", "Bogart",
    "우르삭", "Ursac",
    "바르토", "Barto",
    "감찰대장", "Inquisitor Captain",
    "암살자 두목", "암살 대장", "Assassin Leader",
    "황제", "Emperor",
    "경매상", "Auctioneer",
    "골목 건달 두목", "Alley Thug Leader",
}


def load_font(path: str, size: int, index: int = 0) -> ImageFont.FreeTypeFont:
    try:
        return ImageFont.truetype(path, size, index=index)
    except Exception:
        return ImageFont.load_default()


def classify_speaker_archetype(speaker: str) -> str:
    s = speaker.strip()
    if s in ("", "내레이션", "Narration"):
        return "narrator"
    if s in YOUNG_FEMALE_SPEAKERS:
        return "young_female"
    if s in VILLAIN_FEMALE_SPEAKERS:
        return "villain_female"
    if s in CHILD_SPEAKERS:
        return "child"
    if s in ELDER_OR_VETERAN_MALE_SPEAKERS:
        return "veteran_male"
    if s in VILLAIN_MALE_SPEAKERS:
        return "villain_male"
    return "young_male"


def detect_situational_mood(text: str, context_text: str, bubble_type: str) -> str:
    if bubble_type == "shout":
        return "shout"
    combined = f"{text} {context_text}".lower()
    shout_kws = (
        "소리쳤", "포효", "외쳤", "고함", "절규", "비명", "으르렁",
        "shouted", "roared", "bellowed", "screamed", "barked", "snarled", "cried out",
    )
    if "!" in text and any(k in combined for k in shout_kws):
        return "shout"
    whisper_kws = ("속삭", "낮게", "조용히", "작은 목소리", "whispered", "murmured", "hushed", "quietly")
    if any(k in combined for k in whisper_kws):
        return "whisper"
    sorrow_kws = ("떨리는", "눈물", "울먹", "흐느껴", "애처로", "아가야", "trembling", "tears", "wept", "sobbed", "sorrow")
    if any(k in combined for k in sorrow_kws):
        return "sorrow"
    if bubble_type == "thought":
        return "thought"
    return "speech"


def select_voice_and_prosody(lang: str, archetype: str, mood: str) -> tuple[str, str, str, str]:
    """
    Returns (voice_name, rate, pitch, volume) tailored to language, character gender/archetype, and emotional mood.
    """
    if lang == "ko":
        if archetype == "narrator":
            # 일반 나레이션: 쾌활하고 경쾌한 남성 목소리 + 속도감 있는 템포 (+18%)
            return ("ko-KR-InJoonNeural", "+18%", "+4Hz", "+6%")

        if archetype == "young_female":
            if mood == "shout":
                return ("ko-KR-SunHiNeural", "+23%", "+13Hz", "+18%")
            if mood == "whisper":
                return ("ko-KR-SunHiNeural", "+2%", "+0Hz", "-4%")
            if mood in ("sorrow", "thought"):
                return ("ko-KR-SunHiNeural", "+4%", "+1Hz", "+0%")
            return ("ko-KR-SunHiNeural", "+9%", "+4Hz", "+4%")

        if archetype == "villain_female":
            if mood == "shout":
                return ("ko-KR-SunHiNeural", "+21%", "+8Hz", "+18%")
            return ("ko-KR-SunHiNeural", "+5%", "-6Hz", "+5%")

        if archetype == "child":
            if mood == "shout":
                return ("ko-KR-SunHiNeural", "+20%", "+20Hz", "+14%")
            return ("ko-KR-SunHiNeural", "+10%", "+16Hz", "+4%")

        if archetype == "veteran_male":
            if mood == "shout":
                return ("ko-KR-HyunsuMultilingualNeural", "+20%", "+1Hz", "+20%")
            if mood == "whisper":
                return ("ko-KR-HyunsuMultilingualNeural", "+2%", "-11Hz", "-2%")
            if mood == "sorrow":
                return ("ko-KR-HyunsuMultilingualNeural", "+3%", "-9Hz", "+2%")
            return ("ko-KR-HyunsuMultilingualNeural", "+7%", "-9Hz", "+6%")

        if archetype == "villain_male":
            if mood == "shout":
                return ("ko-KR-InJoonNeural", "+24%", "+8Hz", "+22%")
            if mood == "whisper":
                return ("ko-KR-InJoonNeural", "+3%", "-8Hz", "+0%")
            return ("ko-KR-InJoonNeural", "+7%", "-8Hz", "+6%")

        # young_male
        if mood == "shout":
            return ("ko-KR-InJoonNeural", "+24%", "+14Hz", "+20%")
        if mood == "whisper":
            return ("ko-KR-HyunsuMultilingualNeural", "+3%", "+2Hz", "-3%")
        if mood in ("sorrow", "thought"):
            return ("ko-KR-HyunsuMultilingualNeural", "+5%", "+2Hz", "+2%")
        return ("ko-KR-HyunsuMultilingualNeural", "+9%", "+4Hz", "+4%")

    else:
        # English ('en') multi-actor neural cast
        if archetype == "narrator":
            return ("en-US-RogerNeural", "+16%", "+3Hz", "+6%")

        if archetype == "young_female":
            if mood == "shout":
                return ("en-US-AriaNeural", "+21%", "+10Hz", "+18%")
            if mood == "whisper":
                return ("en-US-JennyNeural", "+2%", "+0Hz", "-4%")
            if mood in ("sorrow", "thought"):
                return ("en-US-JennyNeural", "+4%", "+1Hz", "+0%")
            return ("en-US-AvaNeural", "+9%", "+3Hz", "+4%")

        if archetype == "villain_female":
            if mood == "shout":
                return ("en-US-AriaNeural", "+20%", "+7Hz", "+18%")
            return ("en-GB-SoniaNeural", "+5%", "-4Hz", "+5%")

        if archetype == "child":
            if mood == "shout":
                return ("en-US-AnaNeural", "+18%", "+8Hz", "+14%")
            return ("en-US-AnaNeural", "+10%", "+4Hz", "+4%")

        if archetype == "veteran_male":
            if mood == "shout":
                return ("en-US-ChristopherNeural", "+18%", "+2Hz", "+20%")
            if mood in ("whisper", "sorrow"):
                return ("en-GB-RyanNeural", "+3%", "-7Hz", "+2%")
            return ("en-GB-RyanNeural", "+7%", "-6Hz", "+6%")

        if archetype == "villain_male":
            if mood == "shout":
                return ("en-US-EricNeural", "+22%", "+8Hz", "+22%")
            return ("en-US-SteffanNeural", "+6%", "-6Hz", "+6%")

        # young_male
        if mood == "shout":
            return ("en-US-GuyNeural", "+21%", "+11Hz", "+20%")
        if mood == "whisper":
            return ("en-US-AndrewNeural", "+3%", "+0Hz", "-3%")
        if mood in ("sorrow", "thought"):
            return ("en-US-AndrewNeural", "+5%", "+1Hz", "+2%")
        return ("en-US-BrianNeural", "+9%", "+3Hz", "+4%")


def extract_scene_voice_segments(ep_num: int, title_ko: str, title_en: str, item: dict, lang: str) -> list[dict]:
    idx = item.get("index", 0)
    sc_type = item.get("type", "scene")

    if idx == 0 or sc_type == "title_card":
        if lang == "ko":
            tts_txt = f"눈히어로, 카단의 여정. 제 {ep_num} 화, {title_ko}."
        else:
            tts_txt = f"SNSHero, Kadan's Journey. Episode {ep_num}. {title_en}."
        return [{
            "role": "title",
            "speaker": "",
            "archetype": "narrator",
            "mood": "speech",
            "tts_text": tts_txt,
            "subtitle_text": "",
        }]

    if sc_type == "ending_promo":
        if lang == "ko":
            tts_txt = "웹툰 관련 카드게임 플레이를 원하시나요? 지금 에스엔에스히어로 닷컴에서 직접 플레이해 보세요."
        else:
            tts_txt = "Want to play the card game based on this webtoon? Play now at S N S Hero dot com."
        return [{
            "role": "ending",
            "speaker": "",
            "archetype": "narrator",
            "mood": "speech",
            "tts_text": tts_txt,
            "subtitle_text": "",
        }]

    dlgs = item.get("dialogues") or []
    if not dlgs:
        raw = (item.get("narrationKo") if lang == "ko" else item.get("narrationEn")) or ""
        raw = re.sub(r"\s*\(눈히어로\.com\)", "", raw).strip()
        if not raw:
            return []
        return [{
            "role": "narration",
            "speaker": "",
            "archetype": "narrator",
            "mood": "speech",
            "tts_text": raw,
            "subtitle_text": raw,
        }]

    quote_re = re.compile(r"(“[^”]+”|\"[^\"]+\")")
    out_segs: list[dict] = []

    for d in dlgs:
        sp = (d.get("speakerKo") if lang == "ko" else d.get("speakerEn")) or ""
        sp_ko = (d.get("speakerKo") or "").strip()
        btype = (d.get("bubbleType") or "speech").strip()
        raw_txt = ((d.get("textKo") if lang == "ko" else d.get("textEn")) or "").strip()
        raw_txt = re.sub(r"\s*\(눈히어로\.com\)", "", raw_txt).strip()
        if not raw_txt:
            continue

        is_narr = sp.strip() in ("", "내레이션", "Narration") or sp_ko in ("", "내레이션", "Narration")
        if is_narr:
            out_segs.append({
                "role": "narration",
                "speaker": "",
                "archetype": "narrator",
                "mood": "speech",
                "tts_text": raw_txt.replace("“", "").replace("”", "").replace('"', ""),
                "subtitle_text": raw_txt,
            })
            continue

        archetype = classify_speaker_archetype(sp_ko or sp)
        parts = quote_re.split(raw_txt)
        has_quotes = any(quote_re.fullmatch(p.strip()) for p in parts if p.strip())

        if not has_quotes:
            clean_q = raw_txt.strip("“”\"' ").strip()
            mood = detect_situational_mood(clean_q, "", btype)
            out_segs.append({
                "role": "dialogue",
                "speaker": sp.strip(),
                "archetype": archetype,
                "mood": mood,
                "tts_text": clean_q,
                "subtitle_text": f"“{clean_q}”",
            })
        else:
            unquoted_ctx = " ".join(p.strip() for p in parts if p.strip() and not quote_re.fullmatch(p.strip()))
            for p in parts:
                ps = p.strip()
                if not ps:
                    continue
                if len(re.sub(r"[\W_]+", "", ps)) == 0:
                    continue
                if quote_re.fullmatch(ps):
                    clean_q = ps.strip("“”\"' ").strip()
                    tts_q = re.sub(r",\s*$", ".", clean_q)
                    mood = detect_situational_mood(clean_q, unquoted_ctx, btype)
                    out_segs.append({
                        "role": "dialogue",
                        "speaker": sp.strip(),
                        "archetype": archetype,
                        "mood": mood,
                        "tts_text": tts_q,
                        "subtitle_text": f"“{clean_q}”",
                    })
                else:
                    clean_n = ps.lstrip(",. ").strip()
                    if clean_n:
                        if lang == "en" and clean_n[0].islower():
                            clean_n = clean_n[0].upper() + clean_n[1:]
                        out_segs.append({
                            "role": "narration",
                            "speaker": "",
                            "archetype": "narrator",
                            "mood": "speech",
                            "tts_text": clean_n,
                            "subtitle_text": clean_n,
                        })

    return out_segs


async def synthesize_tts_raw_pcm(
    tts_text: str,
    voice: str,
    rate: str,
    pitch: str,
    volume: str,
    cache_dir: Path,
    sem: asyncio.Semaphore,
) -> np.ndarray:
    """
    Synthesizes TTS via edge-tts and returns raw 48kHz stereo int16 numpy array (unpadded).
    Uses disk caching in cache_dir so repeated runs or Shorts reuse are instant.
    """
    key_str = f"{voice}|{rate}|{pitch}|{volume}|{tts_text}"
    digest = hashlib.sha1(key_str.encode("utf-8")).hexdigest()[:16]
    npy_path = cache_dir / f"tts_{digest}.npy"

    if npy_path.exists():
        try:
            return np.load(npy_path)
        except Exception:
            npy_path.unlink(missing_ok=True)

    async with sem:
        mp3_tmp = cache_dir / f"tmp_{digest}_{os.getpid()}.mp3"
        for attempt in range(8):
            try:
                comm = edge_tts.Communicate(tts_text, voice, rate=rate, pitch=pitch, volume=volume)
                await comm.save(str(mp3_tmp))
                if mp3_tmp.exists() and mp3_tmp.stat().st_size > 150:
                    break
            except Exception as e:
                if attempt == 7:
                    raise e
                await asyncio.sleep(min(10.0, 1.0 * (attempt + 1)))

        proc = subprocess.run(
            [
                "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
                "-i", str(mp3_tmp),
                "-f", "s16le", "-ac", "2", "-ar", str(SR),
                "pipe:1",
            ],
            stdout=subprocess.PIPE,
            check=True,
        )
        mp3_tmp.unlink(missing_ok=True)
        pcm = np.frombuffer(proc.stdout, dtype=np.int16).reshape(-1, 2).copy()
        np.save(npy_path, pcm)
        return pcm


def pad_and_frame_align_pcm(raw_pcm: np.ndarray, pre_pad_sec: float, post_pad_sec: float) -> tuple[np.ndarray, int, float]:
    """
    Pads raw 48kHz stereo int16 PCM with leading/trailing silence and quantizes length
    to an exact multiple of SAMPLES_PER_FRAME (2000 samples = 1/24s).
    Returns (aligned_pcm, n_frames, exact_duration_sec).
    """
    pre_samples = int(round(pre_pad_sec * SR))
    post_samples = int(round(post_pad_sec * SR))
    total_raw = pre_samples + raw_pcm.shape[0] + post_samples
    n_frames = max(12, int(math.ceil(total_raw / float(SAMPLES_PER_FRAME))))
    target_samples = n_frames * SAMPLES_PER_FRAME
    tail_samples = target_samples - pre_samples - raw_pcm.shape[0]

    aligned = np.zeros((target_samples, 2), dtype=np.int16)
    aligned[pre_samples : pre_samples + raw_pcm.shape[0]] = raw_pcm
    return aligned, n_frames, n_frames / float(FPS)


def wrap_subtitle_lines(text: str, font: ImageFont.FreeTypeFont, max_w: float) -> list[str]:
    text = re.sub(r"\s+", " ", text).strip()
    if not text:
        return []
    words = text.split(" ")
    lines: list[str] = []
    cur = ""
    for w in words:
        cand = f"{cur} {w}".strip() if cur else w
        if font.getlength(cand) <= max_w:
            cur = cand
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def render_static_16x9_frame_png(job: dict) -> Path:
    """
    Renders a crystal-clear, 100% static 1280x720 RGB PNG frame (NO shaking/zoompan)
    with lower-third subtitle box composited on top of the scene artwork.
    """
    bg_im: Image.Image = job["bg_im"]
    out_png: Path = job["out_png"]
    lang: str = job["lang"]
    role: str = job["role"]
    speaker: str = job["speaker"]
    mood: str = job["mood"]
    subtitle_text: str = job["subtitle_text"]

    if not subtitle_text:
        bg_im.save(out_png, "PNG", compress_level=1)
        return out_png

    canvas = bg_im.convert("RGBA")
    ov = Image.new("RGBA", (VIDEO_W, VIDEO_H), (0, 0, 0, 0))
    dr = ImageDraw.Draw(ov)

    if lang == "ko":
        f_sub = load_font(FONT_KO, 29 if mood == "shout" else 26, index=14 if mood == "shout" else 6)
        f_spk = load_font(FONT_KO, 20, index=14)
    else:
        f_sub = load_font(FONT_EN_SANS, 27 if mood == "shout" else 25, index=0 if mood == "shout" else 2)
        f_spk = load_font(FONT_EN_SANS, 19, index=0)

    max_text_w = VIDEO_W - 220
    lines = wrap_subtitle_lines(subtitle_text, f_sub, max_text_w)
    line_h = 38 if mood == "shout" else 35
    pad_y = 20
    box_h = len(lines) * line_h + pad_y * 2
    bx0 = 80
    bx1 = VIDEO_W - 80
    by1 = VIDEO_H - 32
    by0 = by1 - box_h
    cx = VIDEO_W / 2.0

    # Soft bottom vignette under subtitle box
    grad = np.zeros((VIDEO_H, VIDEO_W, 4), dtype=np.uint8)
    g_start = max(0, by0 - 40)
    for y in range(g_start, VIDEO_H):
        t = (y - g_start) / max(1.0, float(VIDEO_H - 1 - g_start))
        grad[y, :, 3] = int(round(140 * (t ** 1.4)))
    ov = Image.alpha_composite(ov, Image.fromarray(grad))
    dr = ImageDraw.Draw(ov)

    if role == "dialogue":
        if mood == "shout":
            box_bg = (28, 12, 16, 226)
            border_col = (239, 68, 68, 230)
            badge_bg = (185, 28, 28, 255)
            txt_col = (255, 250, 245, 255)
        else:
            box_bg = (12, 17, 28, 222)
            border_col = (148, 163, 184, 150)
            badge_bg = (30, 41, 59, 255)
            txt_col = (255, 255, 255, 255)

        dr.rounded_rectangle([bx0, by0, bx1, by1], radius=14, fill=box_bg, outline=border_col, width=2)

        if speaker:
            sw = f_spk.getlength(speaker)
            pw = int(sw + 32)
            ph = 32
            px0 = bx0 + 24
            py0 = by0 - 16
            dr.rounded_rectangle([px0, py0, px0 + pw, py0 + ph], radius=16, fill=badge_bg, outline=border_col, width=2)
            dr.text((px0 + 16, py0 + 5), speaker, font=f_spk, fill=(255, 255, 255, 255))
    else:
        box_bg = (10, 14, 23, 212)
        border_col = (56, 189, 248, 115)
        txt_col = (226, 232, 240, 255)
        dr.rounded_rectangle([bx0, by0, bx1, by1], radius=10, fill=box_bg, outline=border_col, width=1)
        dr.line([(cx - 48, by0), (cx + 48, by0)], fill=(56, 189, 248, 210), width=3)

    ty = by0 + pad_y + 2
    for ln in lines:
        lw = f_sub.getlength(ln)
        dr.text(
            (cx - lw / 2.0, ty),
            ln,
            font=f_sub,
            fill=txt_col,
            stroke_width=2,
            stroke_fill=(0, 0, 0, 230),
        )
        ty += line_h

    merged = Image.alpha_composite(canvas, ov).convert("RGB")
    merged.save(out_png, "PNG", compress_level=1)
    return out_png


def render_static_9x16_shorts_frame_png(job: dict) -> Path:
    """
    Renders a crystal-clear, 100% static 1080x1920 (9:16 Vertical Full HD) frame for YouTube Shorts:
    - Atmospheric blurred dark backdrop from current scene
    - Top episode badge & title header
    - Center uncropped 16:9 webtoon panel showcase (1036x583) with glowing border
    - Lower high-impact speech bubble / shout burst / narration card
    - Bottom SNSHero.com CTA bar
    """
    raw_im: Image.Image = job["raw_im"]
    out_png: Path = job["out_png"]
    ep_num: int = job["ep_num"]
    ep_title: str = job["ep_title"]
    lang: str = job["lang"]
    role: str = job["role"]
    speaker: str = job["speaker"]
    mood: str = job["mood"]
    subtitle_text: str = job["subtitle_text"]

    # 1. Atmospheric blurred & darkened vertical backdrop (1080x1920)
    src_w, src_h = raw_im.size
    target_ratio = SHORTS_W / float(SHORTS_H)
    crop_w = int(round(src_h * target_ratio))
    x0 = max(0, (src_w - crop_w) // 2)
    bg_crop = raw_im.crop((x0, 0, min(src_w, x0 + crop_w), src_h)).resize((SHORTS_W, SHORTS_H), Image.Resampling.BILINEAR)
    bg_blur = bg_crop.filter(ImageFilter.GaussianBlur(radius=24))
    bg_dark = ImageEnhance.Brightness(bg_blur).enhance(0.24).convert("RGBA")

    # Subtle top & bottom dark gradient vignette
    vig = np.zeros((SHORTS_H, SHORTS_W, 4), dtype=np.uint8)
    vig[:340, :, 3] = np.linspace(190, 20, 340, dtype=np.uint8)[:, None]
    vig[1180:, :, 3] = np.linspace(30, 215, SHORTS_H - 1180, dtype=np.uint8)[:, None]
    canvas = Image.alpha_composite(bg_dark, Image.fromarray(vig))
    dr = ImageDraw.Draw(canvas)
    cx = SHORTS_W / 2.0

    # 2. Top Header Zone (Episode Kicker + Title)
    if lang == "ko":
        f_kicker = load_font(FONT_KO, 22, index=14)
        kicker_txt = f"SNSHERO WEBTOON SHORTS  ·  제{ep_num:02d}화"
        f_title = load_font(FONT_KO, 38, index=14)
        f_sub = load_font(FONT_KO, 36 if mood == "shout" else 34, index=14 if mood == "shout" else 6)
        f_spk = load_font(FONT_KO, 26, index=14)
        f_cta = load_font(FONT_KO, 23, index=8)
        cta_txt = "웹툰 카드게임 플레이  :  SNSHero.com (눈히어로.com)"
    else:
        f_kicker = load_font(FONT_EN_SANS, 22, index=0)
        kicker_txt = f"SNSHERO WEBTOON SHORTS  ·  EP.{ep_num:02d}"
        f_title = load_font(FONT_EN_SERIF, 34, index=2)
        f_sub = load_font(FONT_EN_SANS, 34 if mood == "shout" else 32, index=0 if mood == "shout" else 2)
        f_spk = load_font(FONT_EN_SANS, 24, index=0)
        f_cta = load_font(FONT_EN_SANS, 22, index=0)
        cta_txt = "Play the Webtoon Card Game  :  SNSHero.com"

    kw = f_kicker.getlength(kicker_txt)
    dr.rounded_rectangle(
        [cx - kw / 2 - 24, 112, cx + kw / 2 + 24, 154],
        radius=21,
        fill=(15, 23, 42, 220),
        outline=(56, 189, 248, 180),
        width=2,
    )
    dr.text((cx - kw / 2, 120), kicker_txt, font=f_kicker, fill=(125, 211, 252, 255))

    title_lines = wrap_subtitle_lines(ep_title, f_title, SHORTS_W - 110)
    ty_hdr = 174
    for tln in title_lines[:2]:
        tw = f_title.getlength(tln)
        dr.text(
            (cx - tw / 2, ty_hdr),
            tln,
            font=f_title,
            fill=(255, 255, 255, 255),
            stroke_width=3,
            stroke_fill=(0, 0, 0, 240),
        )
        ty_hdr += 46

    # 3. Main Uncropped 16:9 Webtoon Artwork Panel (1036 x 583)
    panel_w = 1036
    panel_h = 583
    px0 = (SHORTS_W - panel_w) // 2
    py0 = 420 if role in ("title", "ending") else 320
    panel_im = raw_im.resize((panel_w, panel_h), Image.Resampling.LANCZOS).convert("RGBA")

    # Outer frame border
    frame_col = (239, 68, 68, 245) if mood == "shout" else (148, 163, 184, 210)
    if role in ("title", "ending"):
        frame_col = (250, 204, 21, 235)
    dr.rounded_rectangle(
        [px0 - 5, py0 - 5, px0 + panel_w + 5, py0 + panel_h + 5],
        radius=12,
        fill=(8, 12, 20, 255),
        outline=frame_col,
        width=4,
    )
    canvas.paste(panel_im, (px0, py0))
    dr = ImageDraw.Draw(canvas)

    # 4. Lower Speech Bubble / Narration Card (for story scenes) or Highlight Callout (for Title/Ending)
    if subtitle_text:
        max_sub_w = SHORTS_W - 160
        sub_lines = wrap_subtitle_lines(subtitle_text, f_sub, max_sub_w)
        line_h = 50 if mood == "shout" else 46
        pad_y = 34
        box_h = len(sub_lines) * line_h + pad_y * 2
        bx0 = 48
        bx1 = SHORTS_W - 48
        by0 = py0 + panel_h + 72
        by1 = by0 + box_h

        if role == "dialogue":
            if mood == "shout":
                box_bg = (36, 12, 18, 240)
                border_col = (239, 68, 68, 245)
                badge_bg = (185, 28, 28, 255)
                txt_col = (255, 248, 240, 255)
            else:
                box_bg = (14, 20, 35, 236)
                border_col = (148, 163, 184, 195)
                badge_bg = (30, 41, 59, 255)
                txt_col = (255, 255, 255, 255)

            dr.rounded_rectangle([bx0, by0, bx1, by1], radius=22, fill=box_bg, outline=border_col, width=3)

            if speaker:
                spk_label = f"{speaker} !" if mood == "shout" else speaker
                sw = f_spk.getlength(spk_label)
                pw = int(sw + 44)
                ph = 44
                spx0 = bx0 + 30
                spy0 = by0 - 22
                dr.rounded_rectangle([spx0, spy0, spx0 + pw, spy0 + ph], radius=22, fill=badge_bg, outline=border_col, width=3)
                dr.text((spx0 + 22, spy0 + 7), spk_label, font=f_spk, fill=(255, 255, 255, 255))
        else:
            box_bg = (10, 16, 28, 232)
            border_col = (56, 189, 248, 165)
            txt_col = (226, 232, 240, 255)
            dr.rounded_rectangle([bx0, by0, bx1, by1], radius=18, fill=box_bg, outline=border_col, width=2)
            dr.line([(cx - 70, by0), (cx + 70, by0)], fill=(56, 189, 248, 240), width=4)

        ty = by0 + pad_y
        for sln in sub_lines:
            lw = f_sub.getlength(sln)
            dr.text(
                (cx - lw / 2.0, ty),
                sln,
                font=f_sub,
                fill=txt_col,
                stroke_width=2,
                stroke_fill=(0, 0, 0, 235),
            )
            ty += line_h

    # 5. Bottom CTA Pill Bar
    cw = f_cta.getlength(cta_txt)
    dr.rounded_rectangle(
        [cx - cw / 2 - 28, 1765, cx + cw / 2 + 28, 1820],
        radius=27,
        fill=(15, 23, 42, 230),
        outline=(250, 204, 21, 175),
        width=2,
    )
    dr.text((cx - cw / 2, 1778), cta_txt, font=f_cta, fill=(254, 240, 138, 255))

    canvas.convert("RGB").save(out_png, "PNG", compress_level=1)
    return out_png


def synthesize_ambient_bgm_array(n_samples: int, sr: int = SR) -> np.ndarray:
    """
    Synthesizes a warm stereo orchestral ambient BGM array (shape: (n_samples, 2), float32 in [-0.82, 0.82]).
    """
    duration_sec = n_samples / float(sr)
    t = np.linspace(0.0, duration_sec, n_samples, endpoint=False, dtype=np.float32)
    chords = [
        [73.42, 110.00, 146.83, 174.61, 220.00, 329.63],
        [58.27, 87.31, 116.54, 146.83, 174.61, 220.00],
        [43.65, 65.41, 87.31, 110.00, 130.81, 164.81],
        [65.41, 98.00, 130.81, 164.81, 196.00, 293.66],
        [49.00, 73.42, 98.00, 116.54, 146.83, 174.61],
        [55.00, 82.41, 110.00, 130.81, 164.81, 196.00],
    ]
    chord_len = 8.0
    left = np.zeros(n_samples, dtype=np.float32)
    right = np.zeros(n_samples, dtype=np.float32)

    num_steps = int(math.ceil(duration_sec / chord_len)) + 1
    weights = [0.32, 0.24, 0.20, 0.16, 0.12, 0.08]
    for step in range(num_steps):
        freqs = chords[step % len(chords)]
        center_t = step * chord_len
        i0 = int(max(0.0, center_t - chord_len) * sr)
        i1 = int(min(duration_sec, center_t + chord_len) * sr)
        if i1 <= i0:
            continue
        seg_t = t[i0:i1]
        env = 0.5 * (1.0 + np.cos(math.pi * np.clip((seg_t - center_t) / chord_len, -1.0, 1.0)))
        seg_l = np.zeros_like(seg_t)
        seg_r = np.zeros_like(seg_t)
        for v_i, (f, w) in enumerate(zip(freqs, weights)):
            det = 1.0012 if (v_i % 2 == 0) else 0.9988
            ph_l = 2.0 * np.pi * f * seg_t
            ph_r = 2.0 * np.pi * (f * det) * seg_t
            seg_l += w * (np.sin(ph_l) + 0.20 * np.sin(2.0 * ph_l + 0.4))
            seg_r += w * (np.sin(ph_r + 0.3) + 0.20 * np.sin(2.0 * ph_r + 0.8))
        left[i0:i1] += env * seg_l
        right[i0:i1] += env * seg_r

    fi = min(n_samples, int(1.2 * sr))
    fo = min(n_samples, int(1.8 * sr))
    if fi > 0:
        ramp = np.linspace(0.0, 1.0, fi, dtype=np.float32)
        left[:fi] *= ramp
        right[:fi] *= ramp
    if fo > 0:
        ramp = np.linspace(1.0, 0.0, fo, dtype=np.float32)
        left[-fo:] *= ramp
        right[-fo:] *= ramp

    peak = max(float(np.max(np.abs(left))), float(np.max(np.abs(right))), 1e-6)
    out = np.empty((n_samples, 2), dtype=np.float32)
    out[:, 0] = (left / peak) * 0.82
    out[:, 1] = (right / peak) * 0.82
    return out


def encode_static_slideshow_mp4(
    frame_paths: list[Path],
    frame_durations: list[float],
    pcm_segments: list[np.ndarray],
    work_dir: Path,
    out_mp4: Path,
) -> float:
    """
    Concatenates frame-aligned PCM segments, mixes soft orchestral BGM (-19dB) in memory,
    and runs a single fast FFmpeg static-slideshow encode (-tune stillimage).
    Returns exact total duration in seconds.
    """
    voice_pcm = np.concatenate(pcm_segments, axis=0)
    total_samples = voice_pcm.shape[0]
    total_dur = total_samples / float(SR)

    bgm_f32 = synthesize_ambient_bgm_array(total_samples, sr=SR)
    mixed_f32 = voice_pcm.astype(np.float32) * 1.08 + bgm_f32 * (0.11 * 32767.0)
    mixed_i16 = np.clip(mixed_f32, -32768, 32767).astype(np.int16)

    audio_wav = work_dir / "mixed_audio.wav"
    with wave.open(str(audio_wav), "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes(mixed_i16.tobytes())

    concat_lines = []
    for fp, dur in zip(frame_paths, frame_durations):
        concat_lines.append(f"file '{fp}'\nduration {dur:.6f}")
    concat_lines.append(f"file '{frame_paths[-1]}'")
    frames_txt = work_dir / "frames_concat.txt"
    frames_txt.write_text("\n".join(concat_lines) + "\n", encoding="utf-8")

    subprocess.run(
        [
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-f", "concat", "-safe", "0", "-i", str(frames_txt),
            "-i", str(audio_wav),
            "-fps_mode", "cfr", "-r", str(FPS),
            "-c:v", "libx264", "-tune", "stillimage", "-preset", "ultrafast", "-crf", "20",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "192k", "-ar", str(SR),
            "-shortest", "-movflags", "+faststart",
            str(out_mp4),
        ],
        check=True,
    )
    return total_dur


def select_shorts_highlight_segments(flat_segs: list[dict], max_total_sec: float = 56.5) -> list[dict]:
    """
    Selects a chronological 10~13 scene highlight arc for YouTube Shorts (strictly < 60s, target 46~56.5s):
    - Always includes Title Card (flat_segs[0]) and Ending Climax Card (flat_segs[-1])
    - Divides story segments into 10 chronological story buckets and picks the most dramatic/concise
      segment per bucket (prioritizing shout/emphasis lines, character dialogues, and opening hook).
    """
    if len(flat_segs) <= 2:
        return flat_segs

    title_seg = flat_segs[0]
    ending_seg = flat_segs[-1]
    middle = flat_segs[1:-1]

    # Recompute tight Shorts durations (0.04s pre-pad, 0.10s post-pad)
    def shorts_dur(seg: dict) -> float:
        raw_len = seg["raw_pcm"].shape[0]
        total_raw = int(0.04 * SR) + raw_len + int(0.10 * SR)
        nf = max(12, int(math.ceil(total_raw / float(SAMPLES_PER_FRAME))))
        return nf / float(FPS)

    bookend_dur = shorts_dur(title_seg) + shorts_dur(ending_seg)
    budget = max(30.0, max_total_sec - bookend_dur)

    n_buckets = min(11, len(middle))
    bucket_size = len(middle) / float(n_buckets)
    candidates_by_bucket: list[list[tuple[float, int, dict]]] = []

    for b in range(n_buckets):
        i0 = int(round(b * bucket_size))
        i1 = max(i0 + 1, int(round((b + 1) * bucket_size)))
        bucket_segs = middle[i0:i1]
        scored = []
        for idx_in_b, seg in enumerate(bucket_segs):
            d = shorts_dur(seg)
            # Prefer concise 2.2s ~ 6.2s clips so visuals change dynamically
            if d > 8.0:
                score = -20.0 - d
            else:
                score = 20.0 - abs(d - 4.0) * 2.2
            if seg["mood"] == "shout":
                score += 28.0
            elif seg["role"] == "dialogue":
                score += 14.0
            if b == 0 and idx_in_b == 0:
                score += 22.0  # Opening scene hook
            scored.append((score, seg["global_idx"], seg))
        scored.sort(key=lambda x: (-x[0], x[1]))
        candidates_by_bucket.append(scored)

    chosen_map: dict[int, dict] = {}
    used_scenes: set[int] = set()
    cur_dur = 0.0

    # Pass 1: pick top candidate from each chronological bucket (1 segment per scene max)
    for b in range(n_buckets):
        for score, g_idx, seg in candidates_by_bucket[b]:
            d = shorts_dur(seg)
            if seg["sc_idx"] not in used_scenes and (cur_dur + d) <= budget:
                chosen_map[g_idx] = seg
                used_scenes.add(seg["sc_idx"])
                cur_dur += d
                break

    # Pass 2: if still under 45s total, add second-best dramatic segments from buckets
    if (bookend_dur + cur_dur) < 46.0:
        for b in range(n_buckets):
            for score, g_idx, seg in candidates_by_bucket[b]:
                if g_idx in chosen_map:
                    continue
                d = shorts_dur(seg)
                if (cur_dur + d) <= budget:
                    chosen_map[g_idx] = seg
                    cur_dur += d
                    if (bookend_dur + cur_dur) >= 51.0:
                        break
            if (bookend_dur + cur_dur) >= 51.0:
                break

    ordered_middle = [chosen_map[k] for k in sorted(chosen_map.keys())]
    return [title_seg] + ordered_middle + [ending_seg]


async def prepare_episode_segments(ep_num: int, lang: str, manifest: dict, ep_meta_map: dict) -> tuple[str, str, list[dict]]:
    """
    Extracts and synthesizes (or loads from cache) all voice segments for (ep_num, lang).
    """
    ep_data = manifest[str(ep_num)]
    ep_meta = ep_meta_map.get(ep_num, {})
    title_ko = ep_meta.get("titleKo") or ep_data.get("episodeTitleKo") or f"제{ep_num}화"
    title_en = ep_data.get("episodeTitle") or f"Episode {ep_num:02d}"

    cache_dir = TTS_CACHE_ROOT / f"ep{ep_num:02d}_{lang}"
    cache_dir.mkdir(parents=True, exist_ok=True)

    scene_bundles = []
    for item in ep_data["images"]:
        sc_idx = item["index"]
        sc_type = item.get("type", "scene")
        img_path = PROJECT_ROOT / "public" / (item.get("localArtUrl") or item.get("imageUrl")).lstrip("/")
        segs = extract_scene_voice_segments(ep_num, title_ko, title_en, item, lang)
        if not segs:
            continue
        scene_bundles.append({
            "sc_idx": sc_idx,
            "sc_type": sc_type,
            "img_path": img_path,
            "segs": segs,
        })

    sem = asyncio.Semaphore(10)
    tts_tasks = []
    flat_segs = []
    g_idx = 0

    for bundle in scene_bundles:
        n_segs = len(bundle["segs"])
        for s_i, seg in enumerate(bundle["segs"]):
            seg_id = f"s{bundle['sc_idx']:02d}_{s_i:02d}"
            voice, rate, pitch, volume = select_voice_and_prosody(lang, seg["archetype"], seg["mood"])
            if seg["role"] == "title":
                post_pad = 0.65
            elif seg["role"] == "ending":
                post_pad = 0.85
            elif s_i == n_segs - 1:
                post_pad = 0.24
            else:
                post_pad = 0.12

            rec = {
                **seg,
                "global_idx": g_idx,
                "seg_id": seg_id,
                "sc_idx": bundle["sc_idx"],
                "sc_type": bundle["sc_type"],
                "img_path": bundle["img_path"],
                "sub_idx": s_i,
                "sub_count": n_segs,
                "voice": voice,
                "post_pad": post_pad,
            }
            g_idx += 1
            flat_segs.append(rec)
            tts_tasks.append(
                synthesize_tts_raw_pcm(seg["tts_text"], voice, rate, pitch, volume, cache_dir, sem)
            )

    raw_pcms = await asyncio.gather(*tts_tasks)
    for rec, raw_pcm in zip(flat_segs, raw_pcms):
        rec["raw_pcm"] = raw_pcm

    return title_ko, title_en, flat_segs


async def build_episode_full_video(
    ep_num: int,
    lang: str,
    out_dirs: list[Path],
    manifest: dict,
    ep_meta_map: dict,
) -> tuple[Path, float, float]:
    t0 = time.time()
    title_ko, title_en, flat_segs = await prepare_episode_segments(ep_num, lang, manifest, ep_meta_map)

    work_dir = Path(f"/tmp/snshero_full_ep{ep_num:02d}_{lang}")
    if work_dir.exists():
        shutil.rmtree(work_dir)
    work_dir.mkdir(parents=True, exist_ok=True)

    bg_im_cache: dict[int, Image.Image] = {}
    frame_jobs = []
    frame_durations = []
    pcm_segments = []

    for r_i, rec in enumerate(flat_segs):
        sc_idx = rec["sc_idx"]
        if sc_idx not in bg_im_cache:
            with Image.open(rec["img_path"]) as im:
                bg_im_cache[sc_idx] = im.convert("RGB").resize((VIDEO_W, VIDEO_H), Image.Resampling.LANCZOS)

        aligned_pcm, _, exact_dur = pad_and_frame_align_pcm(rec["raw_pcm"], pre_pad_sec=0.06, post_pad_sec=rec["post_pad"])
        pcm_segments.append(aligned_pcm)
        frame_durations.append(exact_dur)

        frame_jobs.append({
            "bg_im": bg_im_cache[sc_idx],
            "out_png": work_dir / f"frame_{r_i:03d}.png",
            "lang": lang,
            "role": rec["role"],
            "speaker": rec["speaker"],
            "mood": rec["mood"],
            "subtitle_text": rec["subtitle_text"],
        })

    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        frame_paths = list(pool.map(render_static_16x9_frame_png, frame_jobs))

    clean_ko = re.sub(r"\s+", " ", re.sub(r"[^\w가-힣\s]+", " ", title_ko)).strip()
    clean_en = re.sub(r"\s+", " ", re.sub(r"[^\w\s]+", " ", title_en)).strip()
    out_name = f"{ep_num:02d}화 {clean_ko} (한국어 더빙).mp4" if lang == "ko" else f"EP{ep_num:02d} {clean_en} (English Dub).mp4"

    final_tmp = work_dir / out_name
    total_dur = encode_static_slideshow_mp4(frame_paths, frame_durations, pcm_segments, work_dir, final_tmp)

    first_dst: Path | None = None
    for od in out_dirs:
        sub_dir = od / ("ko" if lang == "ko" else "en")
        sub_dir.mkdir(parents=True, exist_ok=True)
        dst = sub_dir / out_name
        shutil.copy2(final_tmp, dst)
        if first_dst is None:
            first_dst = dst

    shutil.rmtree(work_dir, ignore_errors=True)
    assert first_dst is not None
    size_mb = round(first_dst.stat().st_size / (1024 * 1024), 2)
    elapsed = round(time.time() - t0, 1)
    print(
        f"✅ [FULL EP{ep_num:02d}-{lang.upper()}] '{out_name}' | "
        f"{total_dur:.1f}s ({int(total_dur//60)}m {int(total_dur%60):02d}s) | {size_mb} MB | {elapsed}s",
        flush=True,
    )
    return first_dst, total_dur, size_mb


async def build_episode_shorts_video(
    ep_num: int,
    lang: str,
    out_dirs: list[Path],
    manifest: dict,
    ep_meta_map: dict,
) -> tuple[Path, float, float]:
    t0 = time.time()
    title_ko, title_en, flat_segs = await prepare_episode_segments(ep_num, lang, manifest, ep_meta_map)
    shorts_segs = select_shorts_highlight_segments(flat_segs, max_total_sec=56.5)

    work_dir = Path(f"/tmp/snshero_shorts_ep{ep_num:02d}_{lang}")
    if work_dir.exists():
        shutil.rmtree(work_dir)
    work_dir.mkdir(parents=True, exist_ok=True)

    raw_im_cache: dict[int, Image.Image] = {}
    frame_jobs = []
    frame_durations = []
    pcm_segments = []

    ep_title = title_ko if lang == "ko" else title_en

    for r_i, rec in enumerate(shorts_segs):
        sc_idx = rec["sc_idx"]
        if sc_idx not in raw_im_cache:
            with Image.open(rec["img_path"]) as im:
                raw_im_cache[sc_idx] = im.convert("RGB")

        aligned_pcm, _, exact_dur = pad_and_frame_align_pcm(rec["raw_pcm"], pre_pad_sec=0.04, post_pad_sec=0.10)
        pcm_segments.append(aligned_pcm)
        frame_durations.append(exact_dur)

        frame_jobs.append({
            "raw_im": raw_im_cache[sc_idx],
            "out_png": work_dir / f"sframe_{r_i:03d}.png",
            "ep_num": ep_num,
            "ep_title": ep_title,
            "lang": lang,
            "role": rec["role"],
            "speaker": rec["speaker"],
            "mood": rec["mood"],
            "subtitle_text": rec["subtitle_text"],
        })

    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        frame_paths = list(pool.map(render_static_9x16_shorts_frame_png, frame_jobs))

    clean_ko = re.sub(r"\s+", " ", re.sub(r"[^\w가-힣\s]+", " ", title_ko)).strip()
    clean_en = re.sub(r"\s+", " ", re.sub(r"[^\w\s]+", " ", title_en)).strip()
    out_name = f"{ep_num:02d}화 {clean_ko} (한국어 쇼츠).mp4" if lang == "ko" else f"EP{ep_num:02d} {clean_en} (English Shorts).mp4"

    final_tmp = work_dir / out_name
    total_dur = encode_static_slideshow_mp4(frame_paths, frame_durations, pcm_segments, work_dir, final_tmp)

    first_dst: Path | None = None
    for od in out_dirs:
        sub_dir = od / ("shorts_ko" if lang == "ko" else "shorts_en")
        sub_dir.mkdir(parents=True, exist_ok=True)
        dst = sub_dir / out_name
        shutil.copy2(final_tmp, dst)
        if first_dst is None:
            first_dst = dst

    shutil.rmtree(work_dir, ignore_errors=True)
    assert first_dst is not None
    size_mb = round(first_dst.stat().st_size / (1024 * 1024), 2)
    elapsed = round(time.time() - t0, 1)
    print(
        f"⚡ [SHORTS EP{ep_num:02d}-{lang.upper()}] '{out_name}' | "
        f"{total_dur:.1f}s ({len(shorts_segs)} cuts) | {size_mb} MB | {elapsed}s",
        flush=True,
    )
    return first_dst, total_dur, size_mb


async def async_main():
    ep_arg = sys.argv[1] if len(sys.argv) > 1 else "all"
    lang_arg = sys.argv[2].lower() if len(sys.argv) > 2 else "both"
    mode_arg = sys.argv[3].lower() if len(sys.argv) > 3 else "all"  # 'full' | 'shorts' | 'all'

    langs = ["ko", "en"] if lang_arg == "both" else [lang_arg]
    if ep_arg == "all":
        eps = list(range(1, 41))
    elif "-" in ep_arg:
        a, b = ep_arg.split("-", 1)
        eps = list(range(int(a), int(b) + 1))
    else:
        eps = [int(ep_arg)]

    out_dirs = [
        PROJECT_ROOT / "exports/webtoon_videos",
        Path(os.path.expanduser("~/Downloads/웹툰슬라이드쇼_동영상")),
    ]
    for od in out_dirs:
        od.mkdir(parents=True, exist_ok=True)

    # Ensure dist/naver-webtoon/videos is a symlink to exports/webtoon_videos so localhost:3000 serves all 160 videos with 0 duplicate disk space
    dist_videos = PROJECT_ROOT / "dist/naver-webtoon/videos"
    dist_videos.parent.mkdir(parents=True, exist_ok=True)
    if dist_videos.exists() and not dist_videos.is_symlink():
        shutil.rmtree(dist_videos, ignore_errors=True)
    if not dist_videos.exists():
        os.symlink(str(PROJECT_ROOT / "exports/webtoon_videos"), str(dist_videos))

    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    book_idx = json.loads(BOOK_INDEX_PATH.read_text(encoding="utf-8"))
    ep_meta_map = {e["episodeNumber"]: e for e in book_idx.get("episodes", [])}

    ep_sem = asyncio.Semaphore(3)  # Process 3 episode-language pairs concurrently

    if mode_arg in ("full", "all"):
        print(f"\n=== [PHASE 1] Building Full-Length 16:9 Videos ({len(eps)} eps x {len(langs)} langs) ===", flush=True)

        async def _run_full(ep: int, lg: str):
            async with ep_sem:
                return await build_episode_full_video(ep, lg, out_dirs, manifest, ep_meta_map)

        full_tasks = [_run_full(ep, lg) for ep in eps for lg in langs]
        await asyncio.gather(*full_tasks)

    if mode_arg in ("shorts", "all"):
        print(f"\n=== [PHASE 2] Building 9:16 Vertical Shorts Videos ({len(eps)} eps x {len(langs)} langs) ===", flush=True)

        async def _run_shorts(ep: int, lg: str):
            async with ep_sem:
                return await build_episode_shorts_video(ep, lg, out_dirs, manifest, ep_meta_map)

        shorts_tasks = [_run_shorts(ep, lg) for ep in eps for lg in langs]
        await asyncio.gather(*shorts_tasks)


if __name__ == "__main__":
    asyncio.run(async_main())
