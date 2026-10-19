#!/usr/bin/env python3
"""
scripts/build_ep01_acting_cinema.py
SNSHero Live-Action Continuous Acting & PyTorch Motion-Warped Cinema Engine

Transforms Episode 1 into a continuous-action live-action movie where consistent
actors handle consistent props (Cracked Golden Seal, Twin Runic Silver Daggers,
Three Iron Goblets, Twin Broadswords) across 72 sequential acting keyframes:
1. Extracts 72 sequential acting frames (8 sequences x 9 continuous poses) from
   `public/images/cinema/raw_ep01_sheets/act_seq_01..08.png`.
2. Every single narrative beat traverses 3 to 5 sequential acting poses (0.8s per pose)
   using PyTorch GPU (`mps`/`cpu`) Bidirectional Dense Optical-Flow Warping (`grid_sample`)
   so limbs, weapons, and props continuously move throughout every second of video.
3. Real-time Audio-Reactive Facial/Jaw Lip-Sync & Head Nodding deformation driven by
   the 44.1kHz voiceover waveform envelope + continuous thoracic breathing mesh warp.
4. Outputs:
   - `public/images/cinema/episode_01_acting/seq_01..08_frame_01..09.webp` (72 frames)
   - `public/videos/cinema/episode_01.mp4` (24fps Continuous Acting Movie)
"""

import os
import re
import json
import wave
import math
import shutil
import tempfile
import textwrap
import subprocess
from pathlib import Path
import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image, ImageDraw, ImageFont, ImageEnhance

PROJECT_ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = PROJECT_ROOT / "src" / "content" / "webtoonEpisodeManifest.json"
RAW_DIR = PROJECT_ROOT / "public" / "images" / "cinema" / "raw_ep01_sheets"
ACTING_DIR = PROJECT_ROOT / "public" / "images" / "cinema" / "episode_01_acting"
EP01_DIR = PROJECT_ROOT / "public" / "images" / "cinema" / "episode_01"
VIDEO_OUT = PROJECT_ROOT / "public" / "videos" / "cinema" / "episode_01.mp4"

FFMPEG_BIN = shutil.which("ffmpeg") or "/opt/homebrew/bin/ffmpeg"

FPS = 24
WIDTH = 800
HEIGHT = 450
LETTERBOX_H = 26

FONT_KO = "/System/Library/Fonts/AppleSDGothicNeo.ttc"
FONT_MONO = "/System/Library/Fonts/Menlo.ttc"

DEVICE = torch.device("mps" if torch.backends.mps.is_available() else "cpu")


def extract_9_flipbook_frames(sheet_path: Path) -> list[Image.Image]:
    """Extracts 9 sequential acting keyframes (16:9, 800x450) from a 3x3 flipbook sheet."""
    im = Image.open(sheet_path).convert("RGB")
    sw, sh = im.size
    cell_w = sw / 3.0
    cell_h = sh / 3.0

    pad_x = int(cell_w * 0.025)
    pad_y = int(cell_h * 0.027)

    frames = []
    for row in range(3):
        for col in range(3):
            x0 = int(col * cell_w) + pad_x
            y0 = int(row * cell_h) + pad_y
            x1 = int((col + 1) * cell_w) - pad_x
            y1 = int((row + 1) * cell_h) - pad_y
            crop = im.crop((x0, y0, x1, y1))

            cw, ch = crop.size
            target_ratio = WIDTH / HEIGHT
            curr_ratio = cw / ch
            if curr_ratio > target_ratio:
                new_w = int(ch * target_ratio)
                off_x = (cw - new_w) // 2
                crop = crop.crop((off_x, 0, off_x + new_w, ch))
            elif curr_ratio < target_ratio:
                new_h = int(cw / target_ratio)
                off_y = (ch - new_h) // 2
                crop = crop.crop((0, off_y, cw, off_y + new_h))

            panel = crop.resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)
            panel = ImageEnhance.Contrast(panel).enhance(1.08)
            panel = ImageEnhance.Sharpness(panel).enhance(1.08)
            frames.append(panel)
    return frames


def pil_to_tensor(img: Image.Image) -> torch.Tensor:
    arr = np.asarray(img, dtype=np.float32) / 255.0
    return torch.from_numpy(arr).permute(2, 0, 1).unsqueeze(0).to(DEVICE)


def compute_coarse_optical_flow(t1: torch.Tensor, t2: torch.Tensor) -> torch.Tensor:
    """
    Computes a smooth pyramid spatial motion field (dx, dy) between keyframe t1 and t2
    on GPU so moving arms, weapons, and props warp organically between sequential poses.
    """
    _, _, h, w = t1.shape
    g1 = 0.299 * t1[:, 0:1] + 0.587 * t1[:, 1:2] + 0.114 * t1[:, 2:3]
    g2 = 0.299 * t2[:, 0:1] + 0.587 * t2[:, 1:2] + 0.114 * t2[:, 2:3]

    s1 = F.avg_pool2d(g1, kernel_size=8, stride=8)
    s2 = F.avg_pool2d(g2, kernel_size=8, stride=8)

    ix = F.pad(s1[:, :, :, 2:] - s1[:, :, :, :-2], (1, 1, 0, 0)) * 0.5
    iy = F.pad(s1[:, :, 2:, :] - s1[:, :, :-2, :], (0, 0, 1, 1)) * 0.5
    it = s2 - s1

    ix2 = F.avg_pool2d(ix * ix, kernel_size=5, stride=1, padding=2) + 1e-3
    iy2 = F.avg_pool2d(iy * iy, kernel_size=5, stride=1, padding=2) + 1e-3
    ixy = F.avg_pool2d(ix * iy, kernel_size=5, stride=1, padding=2)
    ixt = F.avg_pool2d(ix * it, kernel_size=5, stride=1, padding=2)
    iyt = F.avg_pool2d(iy * it, kernel_size=5, stride=1, padding=2)

    det = ix2 * iy2 - ixy * ixy + 1e-4
    u = -(iy2 * ixt - ixy * iyt) / det
    v = -(ix2 * iyt - ixy * ixt) / det

    u = torch.clamp(u, -2.0, 2.0) * 0.055
    v = torch.clamp(v, -2.0, 2.0) * 0.055

    flow_low = torch.cat([u, v], dim=1)
    flow_low = F.avg_pool2d(flow_low, kernel_size=5, stride=1, padding=2)
    flow_hi = F.interpolate(flow_low, size=(h, w), mode="bilinear", align_corners=False)
    return flow_hi.permute(0, 2, 3, 1)


def synthesize_acting_frame_gpu(
    base_grid: torch.Tensor,
    t1: torch.Tensor,
    t2: torch.Tensor,
    flow_12: torch.Tensor,
    alpha: float,
    global_frame: int,
    voice_amp: float,
    is_combat: bool,
) -> Image.Image:
    time_sec = global_frame / float(FPS)
    gx = base_grid[..., 0]
    gy = base_grid[..., 1]

    # 1. Continuous Actor Thoracic Breathing & Arm/Shoulder Micro-Motion
    breath_phase = math.sin(time_sec * 2.4)
    chest_mask = torch.exp(-((gx / 0.70) ** 2 + ((gy - 0.22) / 0.48) ** 2))
    dy_breath = -0.011 * breath_phase * chest_mask
    dx_breath = 0.006 * math.cos(time_sec * 1.8) * chest_mask * torch.sign(gx)

    # 2. Audio-Reactive Lip/Jaw Articulation & Head Gesture when speaking
    if voice_amp > 0.03:
        jaw_mask = torch.exp(-((gx / 0.55) ** 2 + ((gy + 0.10) / 0.24) ** 2))
        head_mask = torch.exp(-((gx / 0.65) ** 2 + ((gy + 0.22) / 0.38) ** 2))
        syllable_wave = abs(math.sin(time_sec * 26.0)) * min(1.0, voice_amp * 1.6)
        dy_jaw = -0.018 * syllable_wave * jaw_mask
        dx_head = 0.009 * math.sin(time_sec * 6.0) * voice_amp * head_mask
        dy_head = -0.007 * math.cos(time_sec * 4.8) * voice_amp * head_mask
    else:
        dy_jaw = 0.0
        dx_head = 0.0
        dy_head = 0.0

    # 3. Dynamic Handheld Cinema Camera + Combat Impact
    cam_scale = 0.95 - 0.03 * math.sin(time_sec * 0.5)
    cam_tx = 0.018 * math.sin(time_sec * 0.65)
    cam_ty = 0.012 * math.cos(time_sec * 0.55)
    if is_combat:
        cam_tx += 0.012 * math.sin(time_sec * 16.0)
        cam_ty += 0.009 * math.cos(time_sec * 19.0)

    actor_warp_x = (gx * cam_scale + cam_tx) + dx_breath + dx_head
    actor_warp_y = (gy * cam_scale + cam_ty) + dy_breath + dy_jaw + dy_head
    actor_grid = torch.stack([actor_warp_x, actor_warp_y], dim=-1)

    # 4. Bidirectional Optical Flow Morphing between Pose Keyframe 1 and Pose Keyframe 2
    smooth_a = alpha * alpha * (3.0 - 2.0 * alpha)
    grid_1 = torch.clamp(actor_grid - smooth_a * flow_12, -0.999, 0.999)
    grid_2 = torch.clamp(actor_grid + (1.0 - smooth_a) * flow_12, -0.999, 0.999)

    warped_1 = F.grid_sample(t1, grid_1, mode="bilinear", padding_mode="zeros", align_corners=False)
    warped_2 = F.grid_sample(t2, grid_2, mode="bilinear", padding_mode="zeros", align_corners=False)

    blended = (1.0 - smooth_a) * warped_1 + smooth_a * warped_2
    blended = torch.clamp((blended - 0.5) * 1.06 + 0.5, 0.0, 1.0)

    out_np = (blended.squeeze(0).permute(1, 2, 0).cpu().numpy() * 255.0).astype(np.uint8)
    return Image.fromarray(out_np)


def synthesize_cinema_bgm_wav(duration_sec: float, out_wav_path: str):
    sample_rate = 44100
    n_samples = max(sample_rate, int(sample_rate * duration_sec))
    t = np.linspace(0, duration_sec, n_samples, endpoint=False)

    left = np.zeros(n_samples, dtype=np.float32)
    right = np.zeros(n_samples, dtype=np.float32)

    left += 0.20 * np.sin(2 * np.pi * 55.0 * t) + 0.14 * np.sin(2 * np.pi * 73.42 * t)
    right += 0.19 * np.sin(2 * np.pi * 55.0 * t + 0.4) + 0.15 * np.sin(2 * np.pi * 110.0 * t)

    rng = np.random.default_rng(42)
    noise = rng.uniform(-0.10, 0.10, n_samples).astype(np.float32)
    kernel = np.ones(45, dtype=np.float32) / 45.0
    wind = np.convolve(noise, kernel, mode="same") * (0.75 + 0.35 * np.sin(2 * np.pi * 0.12 * t))
    left += wind * 0.9
    right += wind * 1.1

    for beat in range(int(duration_sec / 1.8)):
        st = beat * 1.8
        mask = (t >= st) & (t < st + 0.6)
        dt = t[mask] - st
        pitch = 95.0 * np.exp(-10.0 * dt) + 42.0
        drum = 0.28 * np.sin(2 * np.pi * pitch * dt) * np.exp(-5.0 * dt)
        left[mask] += drum
        right[mask] += drum

    motif = [293.66, 349.23, 440.0, 523.25, 440.0, 349.23]
    for step in range(int(duration_sec / 3.6)):
        base_t = step * 3.6 + 0.3
        for ni, freq in enumerate(motif):
            st = base_t + ni * 0.42
            if st < duration_sec:
                mask = (t >= st) & (t < st + 1.8)
                dt = t[mask] - st
                env = np.minimum(dt * 20.0, 1.0) * np.exp(-2.2 * dt)
                sig = 0.11 * (np.sin(2 * np.pi * freq * dt) + 0.25 * np.sin(4 * np.pi * freq * dt)) * env
                left[mask] += sig
                right[mask] += sig * 0.85

    max_val = max(float(np.max(np.abs(left))), float(np.max(np.abs(right))), 1e-6)
    gain = 0.85 / max_val
    left = np.clip(left * gain, -0.99, 0.99)
    right = np.clip(right * gain, -0.99, 0.99)

    stereo = np.empty((n_samples * 2,), dtype=np.int16)
    stereo[0::2] = (left * 32767).astype(np.int16)
    stereo[1::2] = (right * 32767).astype(np.int16)

    with wave.open(out_wav_path, "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(stereo.tobytes())


def generate_tts_clip_with_envelope(text: str, out_wav: Path) -> tuple[float, np.ndarray]:
    clean = re.sub(r"[^a-zA-Z0-9.,!?'\" -]+", " ", text).strip()
    if not clean:
        clean = "Episode one."
    aiff_path = out_wav.with_suffix(".aiff")
    try:
        subprocess.run(
            ["say", "-v", "Daniel", "-r", "180", "-o", str(aiff_path), clean],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            timeout=15,
        )
        subprocess.run(
            [FFMPEG_BIN, "-y", "-i", str(aiff_path), "-ar", "44100", "-ac", "2", str(out_wav)],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            timeout=15,
        )
        aiff_path.unlink(missing_ok=True)
        with wave.open(str(out_wav), "rb") as wf:
            sr = wf.getframerate()
            n_f = wf.getnframes()
            raw = wf.readframes(n_f)
        dur = n_f / float(sr)
        samples = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
        mono = samples[0::2]
        # Compute 24fps RMS envelope
        n_video_frames = max(1, int(math.ceil(dur * FPS)))
        env = np.zeros(n_video_frames, dtype=np.float32)
        spf = max(1, int(sr / FPS))
        for fi in range(n_video_frames):
            chunk = mono[fi * spf : (fi + 1) * spf]
            if len(chunk) > 0:
                env[fi] = float(np.sqrt(np.mean(chunk * chunk))) * 3.5
        return dur, np.clip(env, 0.0, 1.0)
    except Exception:
        aiff_path.unlink(missing_ok=True)
        return 0.0, np.zeros(1, dtype=np.float32)


def main():
    ACTING_DIR.mkdir(parents=True, exist_ok=True)
    VIDEO_OUT.parent.mkdir(parents=True, exist_ok=True)

    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)
    ep1_data = manifest["1"]
    scenes = ep1_data["images"]

    # 1. Extract all 8 Continuous Action Flipbook Sequences (72 keyframes total)
    flipbooks: dict[int, list[Image.Image]] = {}
    for seq_i in range(1, 9):
        sp = RAW_DIR / f"act_seq_{seq_i:02d}.png"
        if not sp.exists():
            raise FileNotFoundError(f"Missing action flipbook sheet: {sp}")
        frames = extract_9_flipbook_frames(sp)
        flipbooks[seq_i] = frames
        for f_i, frm in enumerate(frames, start=1):
            out_webp = ACTING_DIR / f"seq_{seq_i:02d}_frame_{f_i:02d}.webp"
            frm.save(out_webp, "WEBP", quality=84, method=5)

    print(f"Extracted 72 sequential acting keyframes to {ACTING_DIR} using device={DEVICE}")

    # 2. Build 16 Narrative Acting Sequences covering Episode 1's full story arc
    # Each sequence plays through 4 to 5 continuous acting poses (~0.75s per pose transition)
    # so the actors & props are constantly moving on screen!
    acting_beats = [
        {
            "seq": 1,
            "frames": [0, 1, 2, 3, 4],
            "scene_ref": 1,
            "speaker_ko": "내레이션",
            "speaker_en": "NARRATOR",
            "sub_ko": "라이트헤븐 남부 변방, 맹렬한 눈보라가 통나무 선술집을 덮친 밤. 피투성이 노전사 헤르쿨이 문을 박차고 들어선다.",
            "sub_en": "On a night of howling blizzard at the Lighthaven frontier, the bloodied warrior Hercul bursts through the tavern door.",
            "is_combat": False,
            "is_tavern": True,
        },
        {
            "seq": 1,
            "frames": [4, 5, 6, 7, 8],
            "scene_ref": 9,
            "speaker_ko": "알렉산다르 & 발리안",
            "speaker_en": "ALEKSANDAR & BALIAN",
            "sub_ko": "\"그림자 왕국의 사냥개라면 이름을 말하는 순간 목이 떨어질 것이다!\" 알렉산다르의 쌍검과 발리안의 창이 허공을 가른다.",
            "sub_en": "\"If you are a hound of the Shadow Realm, speaking your name will hasten your demise!\" Twin blades and spear flash.",
            "is_combat": True,
            "is_tavern": True,
        },
        {
            "seq": 2,
            "frames": [0, 1, 2, 3, 4],
            "scene_ref": 13,
            "speaker_ko": "헤르쿨 (Hercul)",
            "speaker_en": "HERCUL",
            "sub_ko": "\"진정하시오, 형제들이여!\" 헤르쿨이 빈 두 손을 들어 올리자 황금빛 수호 결계가 선술집 전체로 퍼져 나간다.",
            "sub_en": "\"Stand down, brothers!\" Hercul raises his palms as a golden protective aegis ripples across the tavern.",
            "is_combat": False,
            "is_tavern": True,
        },
        {
            "seq": 2,
            "frames": [4, 5, 6, 7, 8],
            "scene_ref": 15,
            "speaker_ko": "헤르쿨 (Hercul)",
            "speaker_en": "HERCUL",
            "sub_ko": "헤르쿨이 품 속에서 피 묻고 갈라진 황금 성기사 흉갑 인장을 꺼내어 참나무 식탁 위에 내려놓는다.",
            "sub_en": "Reaching into his tunic, Hercul places the cracked, blood-stained golden Holy Knight insignia upon the oak table.",
            "is_combat": False,
            "is_tavern": True,
        },
        {
            "seq": 3,
            "frames": [0, 1, 2, 3, 4],
            "scene_ref": 20,
            "speaker_ko": "헤르쿨 (Hercul)",
            "speaker_en": "HERCUL",
            "sub_ko": "헤르쿨이 기름 먹인 사슴 가죽을 펼치자, 푸른 고대 룬 문양이 맥동하는 두 자루의 은빛 단검이 모습을 드러낸다.",
            "sub_en": "Hercul unwraps oiled doe-skin on the table, revealing twin masterwork silver daggers pulsing with blue runes.",
            "is_combat": False,
            "is_tavern": True,
        },
        {
            "seq": 3,
            "frames": [4, 5, 6, 7, 8],
            "scene_ref": 24,
            "speaker_ko": "알렉산다르 & 발리안",
            "speaker_en": "ALEKSANDAR & BALIAN",
            "sub_ko": "\"내 아들의 이름은 부서지지 않는 방패, 카단(Kadan)!\" \"내 아들은 시련 속의 불꽃, 이그니스(Ignis)라 부르리라!\"",
            "sub_en": "\"My son shall be named Kadan, the unbreakable shield!\" \"And mine shall be Ignis, the undying flame!\"",
            "is_combat": False,
            "is_tavern": True,
        },
        {
            "seq": 4,
            "frames": [0, 1, 2, 3, 4],
            "scene_ref": 25,
            "speaker_ko": "세 성기사의 맹세",
            "speaker_en": "OATH OF THE THREE KNIGHTS",
            "sub_ko": "빛나는 두 자루의 은빛 단검 위에서, 세 전사가 눈 녹인 물을 채운 철제 잔을 높이 들어 힘차게 부딪친다!",
            "sub_en": "Above the twin glowing silver daggers, the three warriors raise their iron goblets and strike them together!",
            "is_combat": False,
            "is_tavern": True,
        },
        {
            "seq": 4,
            "frames": [4, 5, 6, 7, 8],
            "scene_ref": 26,
            "speaker_ko": "알렉산다르 · 발리안 · 헤르쿨",
            "speaker_en": "ALEKSANDAR · BALIAN · HERCUL",
            "sub_ko": "세 전사는 태어날 아이들의 운명과 진실을 지키기 위해 성스러운 눈 녹인 물을 단숨에 들이켠다.",
            "sub_en": "The three warriors drink the consecrated snow water together, sealing their eternal blood vow.",
            "is_combat": False,
            "is_tavern": True,
        },
        {
            "seq": 5,
            "frames": [0, 1, 2, 3, 4],
            "scene_ref": 28,
            "speaker_ko": "엘윈 & 루시안",
            "speaker_en": "ELWIN & LUCIAN",
            "sub_ko": "사흘 뒤 설원, 만삭의 엘윈이 부상당한 귀족 청년 루시안에게 따뜻한 보리 수프를 건네지만, 그의 눈엔 뒤틀린 집착이 번뜩인다.",
            "sub_en": "Three days later, pregnant Elwin offers warm barley soup to Lucian, whose eyes glint with dark obsession.",
            "is_combat": False,
            "is_tavern": False,
        },
        {
            "seq": 5,
            "frames": [4, 5, 6, 7, 8],
            "scene_ref": 30,
            "speaker_ko": "루시안 (Lucian)",
            "speaker_en": "LUCIAN",
            "sub_ko": "엘윈을 차지하기 위해 거짓 반역 영장에 붉은 인장을 찍은 루시안! 밤하늘 아래 횃불 군단이 마을 지붕을 불태운다.",
            "sub_en": "Sealing a forged treason warrant in red wax, Lucian leads torch-bearing soldiers to set the village ablaze.",
            "is_combat": True,
            "is_tavern": False,
        },
        {
            "seq": 6,
            "frames": [0, 1, 2, 3, 4],
            "scene_ref": 34,
            "speaker_ko": "알렉산다르 (Aleksandar)",
            "speaker_en": "ALEKSANDAR",
            "sub_ko": "\"내 아내의 목숨은 반역자의 혀끝에서 흥정할 대상이 아니다!\" 협곡 출렁다리 위에서 알렉산다르의 쌍검이 불꽃을 튀긴다.",
            "sub_en": "\"My wife's life is not a favor to be bartered from a traitor's tongue!\" Aleksandar clashes blades on the bridge.",
            "is_combat": True,
            "is_tavern": False,
        },
        {
            "seq": 6,
            "frames": [4, 5, 6, 7, 8],
            "scene_ref": 36,
            "speaker_ko": "알렉산다르 (Aleksandar)",
            "speaker_en": "ALEKSANDAR",
            "sub_ko": "우레 같은 포효와 함께 알렉산다르가 룬 대검을 내려쳐 출렁다리의 굵은 밧줄을 단칼에 베어내고 적들을 심연으로 수장시킨다!",
            "sub_en": "With a thunderous roar, Aleksandar slashes through the bridge cables, plunging the pursuing legionnaires into the abyss!",
            "is_combat": True,
            "is_tavern": False,
        },
        {
            "seq": 7,
            "frames": [0, 1, 2, 3, 4],
            "scene_ref": 38,
            "speaker_ko": "이셀라 & 발리안",
            "speaker_en": "YSELA & BALIAN",
            "sub_ko": "\"내 몸에 손대지 마라, 괴물아!\" 전복된 수레 옆에서 이셀라가 얼어붙은 눈진흙을 움켜쥐어 루시안의 얼굴에 집어던진다!",
            "sub_en": "\"Lay no hand upon me, monster!\" Ysela hurls frozen slush into Lucian's face as Balian snaps his silver spear.",
            "is_combat": True,
            "is_tavern": False,
        },
        {
            "seq": 7,
            "frames": [4, 5, 6, 7, 8],
            "scene_ref": 41,
            "speaker_ko": "발리안 (Balian)",
            "speaker_en": "BALIAN",
            "sub_ko": "\"살아라, 이셀라! 기어이 살아남아야 한다!\" 발리안은 적 기병들을 끌어안고 안개 자욱한 협곡 절벽 아래로 몸을 던진다.",
            "sub_en": "\"Live, Ysela! You must live!\" Balian tackles the mounted foes over the icy cliff edge into the raging gorge.",
            "is_combat": True,
            "is_tavern": False,
        },
        {
            "seq": 8,
            "frames": [0, 1, 2, 3, 4],
            "scene_ref": 46,
            "speaker_ko": "엘윈 (Elwin)",
            "speaker_en": "ELWIN",
            "sub_ko": "은빛 단검과 남편의 부러진 검집을 품에 안고 탈출한 엘윈. 무릎을 꿇고 맨손으로 눈을 파헤쳐 얼어붙은 검은 흙을 드러낸다.",
            "sub_en": "Clutching the silver dagger and broken scabbard, Elwin kneels in the snow and digs into the frozen earth with bare hands.",
            "is_combat": False,
            "is_tavern": False,
        },
        {
            "seq": 8,
            "frames": [4, 5, 6, 7, 8],
            "scene_ref": 49,
            "speaker_ko": "엘윈 (Elwin)",
            "speaker_en": "ELWIN",
            "sub_ko": "\"아가야, 거짓 앞에 고개 숙이지 않겠다고만 약속해 다오.\" 황금빛 밀 씨앗을 심은 엘윈이 여명이 밝아오는 설원 산맥으로 걸어 나간다.",
            "sub_en": "\"My child, only promise me you will never bow before a lie.\" Planting golden wheat seeds, Elwin walks into the dawn.",
            "is_combat": False,
            "is_tavern": False,
        },
    ]

    font_ko_sub = ImageFont.truetype(FONT_KO, 15)
    font_en_sub = ImageFont.truetype(FONT_MONO, 11)
    font_speaker = ImageFont.truetype(FONT_MONO, 11)
    font_hud = ImageFont.truetype(FONT_MONO, 10)

    # Pre-create normalized base coordinate grid [-1, 1] on GPU
    ys = torch.linspace(-1.0, 1.0, HEIGHT, device=DEVICE)
    xs = torch.linspace(-1.0, 1.0, WIDTH, device=DEVICE)
    grid_y, grid_x = torch.meshgrid(ys, xs, indexing="ij")
    base_grid = torch.stack([grid_x, grid_y], dim=-1).unsqueeze(0)

    tmp_dir = Path(tempfile.mkdtemp(prefix="snshero_acting_ep01_"))
    try:
        total_time = 0.0
        for idx, beat in enumerate(acting_beats):
            tts_wav = tmp_dir / f"beat_{idx:02d}.wav"
            dur_tts, env = generate_tts_clip_with_envelope(beat["sub_en"], tts_wav)
            dur = max(4.2, min(6.5, dur_tts + 0.5))
            beat["tts_wav"] = tts_wav if tts_wav.exists() else None
            beat["voice_env"] = env
            beat["start_sec"] = total_time
            beat["dur_sec"] = dur
            total_time += dur

        # Synthesize BGM & mix with voiceovers
        bgm_wav = tmp_dir / "bgm.wav"
        synthesize_cinema_bgm_wav(total_time + 1.0, str(bgm_wav))

        with wave.open(str(bgm_wav), "rb") as wf:
            sr = wf.getframerate()
            bgm_bytes = wf.readframes(wf.getnframes())
        master_audio = np.frombuffer(bgm_bytes, dtype=np.int16).astype(np.float32) * 0.40

        for beat in acting_beats:
            if beat["tts_wav"] and beat["tts_wav"].exists():
                try:
                    with wave.open(str(beat["tts_wav"]), "rb") as twf:
                        t_bytes = twf.readframes(twf.getnframes())
                    t_arr = np.frombuffer(t_bytes, dtype=np.int16).astype(np.float32)
                    s_idx = int((beat["start_sec"] + 0.15) * sr) * 2
                    e_idx = min(len(master_audio), s_idx + len(t_arr))
                    if e_idx > s_idx:
                        master_audio[s_idx:e_idx] = (
                            master_audio[s_idx:e_idx] * 0.50 + t_arr[: e_idx - s_idx] * 1.18
                        )
                except Exception:
                    pass

        master_audio = np.clip(master_audio, -32760, 32760).astype(np.int16)
        master_wav = tmp_dir / "master.wav"
        with wave.open(str(master_wav), "wb") as mwf:
            mwf.setnchannels(2)
            mwf.setsampwidth(2)
            mwf.setframerate(sr)
            mwf.writeframes(master_audio.tobytes())

        cmd = [
            FFMPEG_BIN,
            "-y",
            "-f",
            "rawvideo",
            "-vcodec",
            "rawvideo",
            "-s",
            f"{WIDTH}x{HEIGHT}",
            "-pix_fmt",
            "rgb24",
            "-r",
            str(FPS),
            "-i",
            "-",
            "-i",
            str(master_wav),
            "-c:v",
            "libx264",
            "-preset",
            "fast",
            "-crf",
            "20",
            "-pix_fmt",
            "yuv420p",
            "-c:a",
            "aac",
            "-b:a",
            "128k",
            "-shortest",
            "-movflags",
            "+faststart",
            str(VIDEO_OUT),
        ]

        proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        rng = np.random.default_rng(999)
        particles = [
            {
                "x": float(rng.uniform(0, WIDTH)),
                "y": float(rng.uniform(LETTERBOX_H, HEIGHT - LETTERBOX_H)),
                "vx": float(rng.uniform(-2.6, -0.8)),
                "vy": float(rng.uniform(1.0, 2.8)),
                "r": float(rng.uniform(1.2, 2.8)),
            }
            for _ in range(42)
        ]

        global_frame = 0
        for b_idx, beat in enumerate(acting_beats):
            seq_frames = [flipbooks[beat["seq"]][fi] for fi in beat["frames"]]
            seq_tensors = [pil_to_tensor(im) for im in seq_frames]
            n_transitions = len(seq_tensors) - 1
            flows = [
                compute_coarse_optical_flow(seq_tensors[i], seq_tensors[i + 1])
                for i in range(n_transitions)
            ]

            n_frames = max(n_transitions * 6, int(round(beat["dur_sec"] * FPS)))
            ko_lines = textwrap.wrap(beat["sub_ko"], width=36)[:2]
            en_lines = textwrap.wrap(beat["sub_en"], width=58)[:2]
            env_arr = beat["voice_env"]

            for f_i in range(n_frames):
                # Continuous pose progression across the 5 sequential keyframes
                pos = (f_i / float(max(1, n_frames - 1))) * n_transitions
                seg_idx = min(n_transitions - 1, int(math.floor(pos)))
                alpha = pos - seg_idx

                v_amp = float(env_arr[f_i]) if f_i < len(env_arr) else 0.0

                warped_pil = synthesize_acting_frame_gpu(
                    base_grid,
                    seq_tensors[seg_idx],
                    seq_tensors[seg_idx + 1],
                    flows[seg_idx],
                    alpha,
                    global_frame,
                    v_amp,
                    beat["is_combat"],
                ).convert("RGBA")

                overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
                odraw = ImageDraw.Draw(overlay)

                for pt in particles:
                    if beat["is_tavern"]:
                        pt["x"] = (pt["x"] + math.sin(global_frame * 0.06 + pt["y"]) * 0.9) % WIDTH
                        pt["y"] -= pt["vy"] * 0.7
                        if pt["y"] < LETTERBOX_H:
                            pt["y"] = HEIGHT - LETTERBOX_H - 2
                        color = (255, 185, 80, 155)
                    else:
                        pt["x"] = (pt["x"] + pt["vx"] * 1.5) % WIDTH
                        pt["y"] += pt["vy"] * 1.3
                        if pt["y"] > HEIGHT - LETTERBOX_H:
                            pt["y"] = LETTERBOX_H + 2
                        color = (225, 240, 255, 160)
                    r = pt["r"]
                    odraw.ellipse([pt["x"] - r, pt["y"] - r, pt["x"] + r, pt["y"] + r], fill=color)

                # Dynamic sword/magic slash flash during combat pose transitions
                if beat["is_combat"] and 0.35 < alpha < 0.65 and seg_idx in (1, 2):
                    odraw.line(
                        [(int(WIDTH * 0.18), int(HEIGHT * 0.68)), (int(WIDTH * 0.82), int(HEIGHT * 0.22))],
                        fill=(185, 230, 255, 115),
                        width=4,
                    )

                # Theatrical subtitle bar
                odraw.rectangle(
                    [36, HEIGHT - LETTERBOX_H - 74, WIDTH - 36, HEIGHT - LETTERBOX_H - 4],
                    fill=(6, 7, 10, 182),
                    outline=(215, 190, 140, 105),
                    width=1,
                )
                spk_label = f"[ {beat['speaker_ko']} · ACTING SEQ {beat['seq']:02d} POSE {seg_idx + 1}/5 ]"
                odraw.text((WIDTH // 2, HEIGHT - LETTERBOX_H - 62), spk_label, fill=(245, 205, 115, 250), font=font_speaker, anchor="mm")

                if ko_lines:
                    ko_str = " ".join(ko_lines)
                    odraw.text((WIDTH // 2 + 1, HEIGHT - LETTERBOX_H - 41 + 1), ko_str, fill=(0, 0, 0, 235), font=font_ko_sub, anchor="mm")
                    odraw.text((WIDTH // 2, HEIGHT - LETTERBOX_H - 41), ko_str, fill=(255, 255, 255, 255), font=font_ko_sub, anchor="mm")
                if en_lines:
                    en_str = " ".join(en_lines)
                    odraw.text((WIDTH // 2, HEIGHT - LETTERBOX_H - 18), en_str[:76], fill=(185, 215, 245, 230), font=font_en_sub, anchor="mm")

                # 2.39:1 CinemaScope Top & Bottom Letterbox Bars
                odraw.rectangle([0, 0, WIDTH, LETTERBOX_H], fill=(5, 5, 7, 255))
                odraw.rectangle([0, HEIGHT - LETTERBOX_H, WIDTH, HEIGHT], fill=(5, 5, 7, 255))
                odraw.line([(0, LETTERBOX_H), (WIDTH, LETTERBOX_H)], fill=(210, 185, 135, 115), width=1)
                odraw.line([(0, HEIGHT - LETTERBOX_H), (WIDTH, HEIGHT - LETTERBOX_H)], fill=(210, 185, 135, 115), width=1)

                cur_sec = int(global_frame / FPS)
                tc_str = f"EP.01 CONTINUOUS ACTING · SEQ {b_idx + 1:02d}/16 · POSE {seg_idx + 1}->{seg_idx + 2} · {cur_sec // 60:02d}:{cur_sec % 60:02d}:{global_frame % FPS:02d}"
                odraw.text((14, LETTERBOX_H // 2), "SNSHERO 70MM LIVE-ACTION · PYTORCH MOTION WARP", fill=(215, 195, 150, 220), font=font_hud, anchor="lm")
                odraw.text((WIDTH - 14, LETTERBOX_H // 2), tc_str, fill=(175, 205, 235, 220), font=font_hud, anchor="rm")

                comp_rgb = Image.alpha_composite(warped_pil, overlay).convert("RGB")
                proc.stdin.write(comp_rgb.tobytes())
                global_frame += 1

        proc.stdin.close()
        proc.wait()
        sz_mb = VIDEO_OUT.stat().st_size / (1024 * 1024)
        print(f"Successfully rendered 24fps Continuous Acting Movie: {VIDEO_OUT} ({sz_mb:.2f} MB, {global_frame} frames)")
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


if __name__ == "__main__":
    main()
