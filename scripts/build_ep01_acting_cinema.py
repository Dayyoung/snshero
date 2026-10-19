#!/usr/bin/env python3
"""
scripts/build_ep01_acting_cinema.py
SNSHero Episode 1 Live-Action Cinema Generator (72 Sequential Frames + Narration Only)

Requirements implemented per user specification:
1. Opening Title Card displays ONLY English text ("EPISODE 01: TWO VOWS BENEATH THE BLIZZARD").
2. Plays all 72 sequential live-action frames (`seq_01_frame_01` .. `seq_08_frame_09`)
   continuously in order (1 -> 72) with smooth frame-to-frame motion & cross-dissolve.
3. NO subtitles, NO text boxes, and NO HUD text over the 72 acting frames.
4. Full spoken narration + atmospheric dark-fantasy soundtrack mixed at 44.1kHz stereo.
"""

import os
import re
import wave
import math
import shutil
import tempfile
import subprocess
from pathlib import Path
import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image, ImageDraw, ImageFont, ImageEnhance

PROJECT_ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = PROJECT_ROOT / "public" / "images" / "cinema" / "raw_ep01_sheets"
ACTING_DIR = PROJECT_ROOT / "public" / "images" / "cinema" / "episode_01_acting"
VIDEO_OUT = PROJECT_ROOT / "public" / "videos" / "cinema" / "episode_01.mp4"

FFMPEG_BIN = shutil.which("ffmpeg") or "/opt/homebrew/bin/ffmpeg"

FPS = 24
WIDTH = 800
HEIGHT = 450
LETTERBOX_H = 26

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
    """Computes a smooth spatial motion field between sequential poses t1 and t2."""
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

    u = torch.clamp(u, -2.0, 2.0) * 0.045
    v = torch.clamp(v, -2.0, 2.0) * 0.045

    flow_low = torch.cat([u, v], dim=1)
    flow_low = F.avg_pool2d(flow_low, kernel_size=5, stride=1, padding=2)
    flow_hi = F.interpolate(flow_low, size=(h, w), mode="bilinear", align_corners=False)
    return flow_hi.permute(0, 2, 3, 1)


def synthesize_clean_frame_gpu(
    base_grid: torch.Tensor,
    t1: torch.Tensor,
    t2: torch.Tensor,
    flow_12: torch.Tensor,
    alpha: float,
    global_frame: int,
) -> Image.Image:
    """Blends and warps smoothly between sequential frames t1 -> t2 without text overlays."""
    time_sec = global_frame / float(FPS)
    gx = base_grid[..., 0]
    gy = base_grid[..., 1]

    # Subtle cinematic camera breathing & dolly motion
    cam_scale = 0.965 - 0.02 * math.sin(time_sec * 0.45)
    cam_tx = 0.012 * math.sin(time_sec * 0.55)
    cam_ty = 0.008 * math.cos(time_sec * 0.48)

    warp_x = gx * cam_scale + cam_tx
    warp_y = gy * cam_scale + cam_ty
    actor_grid = torch.stack([warp_x, warp_y], dim=-1)

    smooth_a = alpha * alpha * (3.0 - 2.0 * alpha)
    grid_1 = torch.clamp(actor_grid - smooth_a * flow_12, -0.999, 0.999)
    grid_2 = torch.clamp(actor_grid + (1.0 - smooth_a) * flow_12, -0.999, 0.999)

    warped_1 = F.grid_sample(t1, grid_1, mode="bilinear", padding_mode="zeros", align_corners=False)
    warped_2 = F.grid_sample(t2, grid_2, mode="bilinear", padding_mode="zeros", align_corners=False)

    blended = (1.0 - smooth_a) * warped_1 + smooth_a * warped_2
    blended = torch.clamp((blended - 0.5) * 1.05 + 0.5, 0.0, 1.0)

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
        drum = 0.26 * np.sin(2 * np.pi * pitch * dt) * np.exp(-5.0 * dt)
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
                sig = 0.10 * (np.sin(2 * np.pi * freq * dt) + 0.25 * np.sin(4 * np.pi * freq * dt)) * env
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


def generate_narration_wav(text: str, out_wav: Path, lang: str = "ko") -> float:
    """Generates spoken narration WAV (Korean Yuna or English Daniel) via macOS say."""
    aiff_path = out_wav.with_suffix(".aiff")
    try:
        voice = "Yuna" if lang == "ko" else "Daniel"
        rate = "175" if lang == "ko" else "170"
        subprocess.run(
            ["say", "-v", voice, "-r", rate, "-o", str(aiff_path), text],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            timeout=20,
        )
        subprocess.run(
            [FFMPEG_BIN, "-y", "-i", str(aiff_path), "-ar", "44100", "-ac", "2", str(out_wav)],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            timeout=20,
        )
        aiff_path.unlink(missing_ok=True)
        with wave.open(str(out_wav), "rb") as wf:
            return wf.getnframes() / float(wf.getframerate())
    except Exception:
        aiff_path.unlink(missing_ok=True)
        return 0.0


def render_english_opening_title_frame(bg_img: Image.Image, progress: float, fonts: dict) -> Image.Image:
    """
    Renders the Opening Title Card with ONLY English text (zero Korean text, zero subtitles).
    """
    # Slow zoom-in on background
    scale = 1.0 + progress * 0.06
    nw, nh = int(WIDTH * scale), int(HEIGHT * scale)
    resized = bg_img.resize((nw, nh), Image.Resampling.BILINEAR)
    ox = (nw - WIDTH) // 2
    oy = (nh - HEIGHT) // 2
    frame = resized.crop((ox, oy, ox + WIDTH, oy + HEIGHT)).convert("RGBA")

    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    # Dark theatrical vignette overlay
    draw.rectangle([0, 0, WIDTH, HEIGHT], fill=(6, 8, 14, 155))

    # Fade-in / Fade-out alpha for the English title text
    if progress < 0.18:
        alpha = int(255 * (progress / 0.18))
    elif progress > 0.85:
        alpha = int(255 * ((1.0 - progress) / 0.15))
    else:
        alpha = 255
    alpha = max(0, min(255, alpha))

    # Central horizontal gold hairline rules
    cx, cy = WIDTH // 2, HEIGHT // 2
    draw.line([(cx - 190, cy - 64), (cx + 190, cy - 64)], fill=(215, 180, 110, int(alpha * 0.65)), width=1)
    draw.line([(cx - 190, cy + 68), (cx + 190, cy + 68)], fill=(215, 180, 110, int(alpha * 0.65)), width=1)

    draw.text(
        (cx, cy - 44),
        "SNSHERO ORIGINAL LIVE-ACTION CINEMA",
        fill=(215, 185, 120, alpha),
        font=fonts["sub"],
        anchor="mm",
    )
    draw.text(
        (cx, cy - 12),
        "EPISODE 01",
        fill=(255, 255, 255, alpha),
        font=fonts["ep"],
        anchor="mm",
    )
    draw.text(
        (cx, cy + 24),
        "TWO VOWS BENEATH THE BLIZZARD",
        fill=(245, 215, 145, alpha),
        font=fonts["title"],
        anchor="mm",
    )
    draw.text(
        (cx, cy + 50),
        "ACT I : THE FROZEN HEARTH",
        fill=(175, 205, 235, int(alpha * 0.9)),
        font=fonts["sub"],
        anchor="mm",
    )

    # Clean 2.39:1 CinemaScope black bars (no text)
    draw.rectangle([0, 0, WIDTH, LETTERBOX_H], fill=(0, 0, 0, 255))
    draw.rectangle([0, HEIGHT - LETTERBOX_H, WIDTH, HEIGHT], fill=(0, 0, 0, 255))

    return Image.alpha_composite(frame, overlay).convert("RGB")


def main():
    ACTING_DIR.mkdir(parents=True, exist_ok=True)
    VIDEO_OUT.parent.mkdir(parents=True, exist_ok=True)

    # 1. Extract all 8 Continuous Action Flipbook Sequences = 72 frames in sequential order
    all_72_frames: list[Image.Image] = []
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
            all_72_frames.append(frm)

    print(f"Prepared all {len(all_72_frames)} sequential frames (seq_01_frame_01 .. seq_08_frame_09)")

    # 2. Define the 8 sequences (each has 9 consecutive frames = 72 frames total) with Narration ONLY
    sequence_narrations = [
        {
            "seq": 1,
            "is_tavern": True,
            "narration_ko": "라이트헤븐 남부 변방, 매서운 눈보라가 몰아치던 밤. 피투성이가 된 노전사 헤르쿨이 통나무 선술집 문을 박차고 들어선다. 알렉산다르와 발리안은 즉시 쌍검과 은빛 창을 뽑아 들고 경계하지만, 헤르쿨은 빈 두 손을 들어 올리며 형제들을 진정시킨다.",
        },
        {
            "seq": 2,
            "is_tavern": True,
            "narration_ko": "헤르쿨이 손끝으로 황금빛 수호 결계를 펼쳐 선술집의 소리를 바깥 폭풍으로부터 차단한다. 그리고 품 속에서 처참히 갈라진 황금 성기사 흉갑 인장을 꺼내어 참나무 식탁 위에 내려놓으며 왕국의 비극을 전한다.",
        },
        {
            "seq": 3,
            "is_tavern": True,
            "narration_ko": "헤르쿨이 기름 먹인 사슴 가죽을 펼치자 푸른 고대 룬 문양이 새겨진 두 자루의 은빛 단검이 빛을 발한다. 알렉산다르와 발리안은 단검을 가슴에 품고, 태어날 아이들의 이름을 각각 카단과 이그니스라 부르기로 맹세한다.",
        },
        {
            "seq": 4,
            "is_tavern": True,
            "narration_ko": "두 자루의 은빛 단검 위에서 알렉산다르, 발리안, 헤르쿨 세 기사는 눈 녹인 물을 채운 철제 잔을 높이 들어 힘차게 부딪친다. 세 전사는 잔을 단숨에 들이켜며 태어날 아이들의 운명과 진실을 지킬 피의 서약을 맺는다.",
        },
        {
            "seq": 5,
            "is_tavern": False,
            "narration_ko": "사흘 뒤 안개 낀 설원. 만삭의 엘윈은 부상당한 귀족 청년 루시안에게 따뜻한 보리 수프를 건네고 상처를 감싸준다. 그러나 엘윈에게 뒤틀린 집착을 품은 루시안은 그날 밤 거짓 반역 영장에 붉은 인장을 찍고 횃불 군단을 이끌어 마을을 기습한다.",
        },
        {
            "seq": 6,
            "is_tavern": False,
            "narration_ko": "화염에 휩싸인 마을에서 가족들을 대피시킨 알렉산다르는 홀로 협곡 출렁다리 위를 지킨다. 밀려드는 제국군을 쌍검으로 막아낸 알렉산다르는 우레 같은 포효와 함께 룬 대검을 내려쳐 다리의 굵은 밧줄을 단칼에 베어낸다.",
        },
        {
            "seq": 7,
            "is_tavern": False,
            "narration_ko": "수레가 전복된 눈길에서 이셀라는 얼어붙은 진흙을 움켜쥐어 루시안의 얼굴에 던지며 저항한다. 아내의 외침을 들은 발리안은 창대를 부러뜨린 뒤, 이셀라에게 반드시 살아남으라 외치며 적 기병들을 끌어안고 절벽 아래로 몸을 던진다.",
        },
        {
            "seq": 8,
            "is_tavern": False,
            "narration_ko": "남편의 부러진 검집과 은빛 룬 단검을 품에 안고 탈출한 엘윈은 새벽 설원에 무릎을 꿇는다. 언 땅을 맨손으로 파헤쳐 황금빛 밀 씨앗을 심은 그녀는, 아이에게 거짓 앞에 고개 숙이지 말라는 맹세를 남기며 여명이 밝아오는 산맥으로 걸어 나간다.",
        },
    ]

    fonts = {
        "ep": ImageFont.truetype(FONT_MONO, 28),
        "title": ImageFont.truetype(FONT_MONO, 20),
        "sub": ImageFont.truetype(FONT_MONO, 12),
    }

    ys = torch.linspace(-1.0, 1.0, HEIGHT, device=DEVICE)
    xs = torch.linspace(-1.0, 1.0, WIDTH, device=DEVICE)
    grid_y, grid_x = torch.meshgrid(ys, xs, indexing="ij")
    base_grid = torch.stack([grid_x, grid_y], dim=-1).unsqueeze(0)

    tmp_dir = Path(tempfile.mkdtemp(prefix="snshero_ep01_clean72_"))
    try:
        # Opening Title Narration (English title card, 4.0 seconds)
        title_wav = tmp_dir / "title.wav"
        title_tts_dur = generate_narration_wav(
            "Episode One. Two Vows Beneath the Blizzard.", title_wav, lang="en"
        )
        title_dur = max(4.0, title_tts_dur + 0.8)

        total_time = title_dur
        for idx, seq_item in enumerate(sequence_narrations):
            n_wav = tmp_dir / f"seq_{idx + 1:02d}.wav"
            dur_tts = generate_narration_wav(seq_item["narration_ko"], n_wav, lang="ko")
            # Ensure all 9 frames in this sequence have comfortable viewing time (~1.2s-1.6s per frame)
            seq_dur = max(10.8, dur_tts + 0.8)
            seq_item["wav"] = n_wav if n_wav.exists() else None
            seq_item["start_sec"] = total_time
            seq_item["dur_sec"] = seq_dur
            total_time += seq_dur

        # Synthesize BGM & mix with narration
        bgm_wav = tmp_dir / "bgm.wav"
        synthesize_cinema_bgm_wav(total_time + 1.0, str(bgm_wav))

        with wave.open(str(bgm_wav), "rb") as wf:
            sr = wf.getframerate()
            bgm_bytes = wf.readframes(wf.getnframes())
        master_audio = np.frombuffer(bgm_bytes, dtype=np.int16).astype(np.float32) * 0.36

        # Mix title narration
        if title_wav.exists():
            with wave.open(str(title_wav), "rb") as twf:
                t_arr = np.frombuffer(twf.readframes(twf.getnframes()), dtype=np.int16).astype(np.float32)
            s_idx = int(0.4 * sr) * 2
            e_idx = min(len(master_audio), s_idx + len(t_arr))
            if e_idx > s_idx:
                master_audio[s_idx:e_idx] = master_audio[s_idx:e_idx] * 0.45 + t_arr[: e_idx - s_idx] * 1.20

        # Mix sequence narrations
        for seq_item in sequence_narrations:
            if seq_item["wav"] and seq_item["wav"].exists():
                with wave.open(str(seq_item["wav"]), "rb") as swf:
                    s_arr = np.frombuffer(swf.readframes(swf.getnframes()), dtype=np.int16).astype(np.float32)
                s_idx = int((seq_item["start_sec"] + 0.25) * sr) * 2
                e_idx = min(len(master_audio), s_idx + len(s_arr))
                if e_idx > s_idx:
                    master_audio[s_idx:e_idx] = master_audio[s_idx:e_idx] * 0.42 + s_arr[: e_idx - s_idx] * 1.25

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

        global_frame = 0

        # Part A: Render English-Only Opening Title Card
        title_frames = int(round(title_dur * FPS))
        title_bg = flipbooks[1][0]
        for tf_i in range(title_frames):
            prog = tf_i / float(max(1, title_frames - 1))
            t_img = render_english_opening_title_frame(title_bg, prog, fonts)
            proc.stdin.write(t_img.tobytes())
            global_frame += 1

        # Part B: Render all 72 frames continuously in sequential order (seq 1..8, frame 1..9)
        # NO subtitles, NO text boxes, NO HUD text!
        for seq_idx, seq_item in enumerate(sequence_narrations):
            seq_num = seq_item["seq"]
            frames_9 = flipbooks[seq_num]  # 9 sequential frames
            tensors_9 = [pil_to_tensor(im) for im in frames_9]
            n_transitions = len(tensors_9) - 1  # 8 transitions across 9 frames
            flows = [
                compute_coarse_optical_flow(tensors_9[i], tensors_9[i + 1])
                for i in range(n_transitions)
            ]

            seq_total_video_frames = max(n_transitions * 10, int(round(seq_item["dur_sec"] * FPS)))

            for f_i in range(seq_total_video_frames):
                # Progress smoothly from frame 0 -> frame 8 (all 9 frames of this sequence)
                pos = (f_i / float(max(1, seq_total_video_frames - 1))) * n_transitions
                seg_idx = min(n_transitions - 1, int(math.floor(pos)))
                alpha = pos - seg_idx

                clean_pil = synthesize_clean_frame_gpu(
                    base_grid,
                    tensors_9[seg_idx],
                    tensors_9[seg_idx + 1],
                    flows[seg_idx],
                    alpha,
                    global_frame,
                )

                # Clean 2.39:1 CinemaScope black letterbox matte bars ONLY (Zero subtitles, Zero text)
                draw = ImageDraw.Draw(clean_pil)
                draw.rectangle([0, 0, WIDTH, LETTERBOX_H], fill=(0, 0, 0))
                draw.rectangle([0, HEIGHT - LETTERBOX_H, WIDTH, HEIGHT], fill=(0, 0, 0))

                proc.stdin.write(clean_pil.tobytes())
                global_frame += 1

        proc.stdin.close()
        proc.wait()
        sz_mb = VIDEO_OUT.stat().st_size / (1024 * 1024)
        print(
            f"Successfully rendered Episode 1 (English Title Only + 72 Sequential Frames + Narration Only, Zero Subtitles): "
            f"{VIDEO_OUT} ({sz_mb:.2f} MB, {global_frame} frames, {global_frame / FPS:.1f}s)"
        )
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


if __name__ == "__main__":
    main()
