# Comprehensive Survey Report: Live-Action Cinema Reference Implementation (Ep01) & Ep02–40 Scalability Architecture

- **Author**: Explorer Survey 1
- **Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/orchestrator_7/explorer_survey_1/`
- **Parent Conversation ID**: `80e1d883-bfe3-4cb4-8345-3b1dd0b15b1d` (orchestrator_7)
- **Target Episode Range**: Episode 01 (Reference) & Episodes 02 through 40 (Batch Scaling)
- **Date**: 2026-10-19T06:39:00Z

---

## 1. Observation

### 1.1 Codebase & Script Reference Analysis (`scripts/build_ep01_acting_cinema.py`)
- **File location**: `/Users/dayyoung/project/snshero/scripts/build_ep01_acting_cinema.py` (535 lines, 22,110 bytes).
- **Core dependencies**:
  - `torch` & `torch.nn.functional`: PyTorch 2.10.0 with native Apple Silicon GPU (`mps`) acceleration (`torch.device("mps")`).
  - `PIL` (`Pillow`): `Image`, `ImageDraw`, `ImageFont`, `ImageEnhance` for frame slicing, cropping, contrast/sharpness grading, and opening title rendering.
  - `numpy`: Array manipulation, audio waveform synthesis, optical flow normalization.
  - `wave` & `tempfile`: 44.1kHz 16-bit stereo PCM audio generation and mixing in a temporary directory (`tempfile.mkdtemp(prefix="snshero_ep01_clean72_")`).
  - `subprocess`: Invokes macOS native speech synthesizer `say` and FFmpeg.
  - `ffmpeg`: FFmpeg version 8.0.1 (Apple clang 17.0.0) at `/opt/homebrew/bin/ffmpeg`.
  - macOS Native Voices: `say -v Daniel -r 170` (English UK narrator) and `say -v Yuna` (Korean narrator).
  - Fonts: `/System/Library/Fonts/Menlo.ttc` for terminal-flat typography.

### 1.2 Proportions & Card Character Fidelity Mechanism (8-Head-Tall Adult vs 2-Head Chibi)
- **Root Cause of Dwarf Distortion**:
  In earlier iterations, passing 2-head-tall chibi card portraits directly from `public/seat/*.png` into image generation produced characters with oversized heads and dwarf/chibi body proportions.
- **Solution Established in Commit `10b99300c9`**:
  1. A master reference sheet `public/images/cinema/raw_ep01_sheets/ep01_realistic_8head_cast_sheet.jpg` (`1376x768`, 717.1 KB) was constructed. It translates all featured characters into athletic adult human actors with **strict 1:8 head-to-body proportions**, while faithfully preserving 100% of the game card's distinctive armor, weapons, and color palettes:
     - *King Aleksandar*: Sapphire golden crown, royal blue cape, gold plate armor, glowing purple-blue runic broadsword.
     - *Paladin Balian*: Winged silver helm, silver plate armor, golden-cross kite shield, broadsword.
     - *Warrior Hercul*: Wild lion-mane long hair, scarred face, scarred empty palms, flame scimitar.
     - *Shieldmaiden Elwin*: Golden-blonde hair, valkyrie plate armor, iron soup ladle, barley soup bowl.
     - *Archer Lucian*: Emerald-green hair, pointed elf ears, green glowing magic recurve bow & arrow.
     - *Death Knight Artus*: Horned skull helmet, jagged obsidian plate, soul-fire greatsword.
     - *Ysela*: Long violet hair, fur travel coat, defiant posture.
     - *Story Props*: Cracked blood-stained golden Holy Knight seal, twin silver runic daggers with golden hilts, three rustic iron goblets.
  2. The sheet was cropped into 8 individual character/prop reference files: `ref_8head_aleksandar.jpg`, `ref_8head_balian.jpg`, `ref_8head_hercul.jpg`, `ref_8head_elwin.jpg`, `ref_8head_lucian.jpg`, `ref_8head_artus.jpg`, `ref_8head_ysela.jpg`, and `ref_8head_props.jpg` (`336x376` each, 33.0 KB–54.9 KB).
  3. Generating the 8 sequential action sheets (`act_seq_01.png` .. `act_seq_08.png`) using **only these 8-head-tall adult reference images** completely prevented any 2-head chibi/dwarf distortion.

### 1.3 Keyframe Slicing & Storage Layout
- Function `extract_9_flipbook_frames(sheet_path: Path) -> list[Image.Image]`:
  - Input: 3x3 grid sheet (`1376x768` JPEG).
  - Trims inner grid borders: `pad_x = int(cell_w * 0.025)`, `pad_y = int(cell_h * 0.027)`.
  - Aspect ratio conformity: Center-crops to exact 16:9 (`800 / 450 = 1.7778`).
  - Output scaling: Resizes to `800x450` using `Image.Resampling.LANCZOS`.
  - Post-processing: Enhances contrast (`1.08x`) and sharpness (`1.08x`).
  - Slicing destination: `public/images/cinema/episode_01_acting/seq_XX_frame_XX.webp` (quality=84, method=5).

### 1.4 English-Only Opening Title Card (`render_english_opening_title_frame`)
- Duration: 4.0 seconds (calculated as `max(4.0, title_tts_dur + 0.8)`).
- Background: Frame 1 of Sequence 1 (`flipbooks[1][0]`) with a continuous 6% push-in (`scale = 1.0 + progress * 0.06`).
- Dark cinematic vignette: Fill `(6, 8, 14, 155)` over the entire frame.
- Text alpha curve: Linear fade-in from 0 to 18% progress, solid hold until 85%, linear fade-out to 100%.
- Decorative framing: Double gold horizontal hairline rules `(215, 180, 110, alpha * 0.65)` spanning `cx +/- 190`.
- Text hierarchy (strictly English only, zero Korean text, zero subtitles):
  - Line 1: `SNSHERO ORIGINAL LIVE-ACTION CINEMA` (gold, Menlo 12pt, anchor `mm`)
  - Line 2: `EPISODE 01` (white, Menlo 28pt, anchor `mm`)
  - Line 3: `TWO VOWS BENEATH THE BLIZZARD` (warm gold, Menlo 20pt, anchor `mm`)
  - Line 4: `ACT I : THE FROZEN HEARTH` (cool slate-blue, Menlo 12pt, anchor `mm`)
- 2.39:1 CinemaScope black letterbox matte bars: 26px solid black rectangles top and bottom (`[0, 0, WIDTH, 26]` and `[0, HEIGHT - 26, WIDTH, HEIGHT]`).

### 1.5 Audio Generation & Dynamic Mixing Pipeline
- **Narration TTS**:
  - Command: `say -v Daniel -r 170 -o <tmp.aiff> <text>`
  - Transcode: `ffmpeg -y -i <tmp.aiff> -ar 44100 -ac 2 <tmp.wav>`
  - Title voiceover: *"Episode One. Two Vows Beneath the Blizzard."*
  - 8 sequence voiceovers: 8 rich English narrative passages (~35-45 words each).
  - Sequence duration calculation: `seq_dur = max(10.8, dur_tts + 0.8)`. Total audio duration: 140.3 seconds.
- **Procedural BGM Synthesis** (`synthesize_cinema_bgm_wav`):
  - Sample rate: 44,100 Hz stereo 16-bit PCM.
  - Low strings/brass drone: D minor fundamentals (55.0 Hz, 73.42 Hz, 110.0 Hz).
  - Arctic blizzard wind: Filtered convolution noise with a 0.12 Hz LFO breathing amplitude.
  - Cinematic war drums: Synthesized exponential pitch drop (95Hz -> 42Hz) triggered every 1.8 seconds.
  - Dark fantasy melodic motif: D minor hexachord notes (293.66, 349.23, 440.0, 523.25 Hz) triggered every 3.6 seconds.
  - Normalized to -0.99 .. +0.99 peak amplitude.
- **Master Audio Mixing**:
  - Base BGM track: Attenuated to 0.36 volume.
  - Dynamic ducking: Whenever Daniel's narration speaks, BGM volume is ducked to 0.42–0.45 while voiceover is boosted to 1.20–1.25.
  - Hard limiter: Clipped to `[-32760, 32760]` 16-bit integer range to prevent digital clipping.

### 1.6 Video Encoding with PyTorch GPU Optical Flow Warping
- **Motion Field Engine** (`compute_coarse_optical_flow`):
  - Operates on PyTorch `mps` GPU tensors (`float32` normalized to `[0, 1]`).
  - Computes spatial luminance gradients (`ix, iy`) and temporal difference (`it`).
  - Calculates coarse optical flow field `(u, v)` via least-squares average pooling and bilinear interpolation.
- **Continuous Frame Warping** (`synthesize_clean_frame_gpu`):
  - Camera breathing: Subtle periodic sinusoidal scaling (`0.965 - 0.02 * sin(...)`) and translation (`tx, ty`).
  - Cubic Hermite smoothstep blend: `smooth_a = alpha * alpha * (3.0 - 2.0 * alpha)`.
  - Grid sampling: `F.grid_sample(t1, grid_1, mode="bilinear")` and `F.grid_sample(t2, grid_2, mode="bilinear")`.
  - Clean CinemaScope framing: 26px letterbox bars drawn top and bottom.
  - Strictly **ZERO subtitles, ZERO speaker tags, ZERO HUD text overlays** on acting frames.
- **FFmpeg Pipe Streaming**:
  - Ingests raw video via pipe: `-f rawvideo -vcodec rawvideo -s 800x450 -pix_fmt rgb24 -r 24 -i -`
  - Audio input: `-i master.wav -c:a aac -b:a 128k`
  - Encoding flags: `-c:v libx264 -preset fast -crf 20 -pix_fmt yuv420p -shortest -movflags +faststart`
  - Output path: `public/videos/cinema/episode_01.mp4`.

### 1.7 Ep01 Generated Asset Verification Results
Direct inspection of files on disk revealed:
1. `public/videos/cinema/episode_01.mp4`:
   - `ffprobe` verification:
     - Video stream: `codec_name=h264`, `width=800`, `height=450`, `r_frame_rate=24/1` (24fps).
     - Audio stream: `codec_name=aac`, `sample_rate=44100`, `channels=2` (Stereo).
     - Duration: `140.291667` seconds (3,367 frames).
     - File size: `18,828,158 bytes` (~17.96 MB, `> 3 MB`).
     - Bitrate: `1,073,657 bps` (~1.07 Mbps).
2. `public/images/cinema/episode_01_acting/`:
   - Total files: 72 WebP files (`seq_01_frame_01.webp` through `seq_08_frame_09.webp`).
   - Dimensions: All 72 files are exactly `(800, 450)`.
   - File size distribution: Min = 27,568 bytes, Max = 47,812 bytes, Average = 38,736.7 bytes. All files `<= 75,000 bytes`. Total folder size: 2,723.7 KB.
   - Distinct SHA-256 hashes: 72 unique hashes out of 72 files (100% unique, zero duplicates).
3. `public/images/cinema/raw_ep01_sheets/`:
   - 8 Action sheets: `act_seq_01.png` .. `act_seq_08.png` (`1376x768`, 769.9 KB–856.9 KB).
   - 1 Cast master sheet: `ep01_realistic_8head_cast_sheet.jpg` (`1376x768`, 717.1 KB).
   - 8 Actor reference crops: `ref_8head_*.jpg` (`336x376`, 33.0 KB–54.9 KB).
4. **Execution Performance Benchmark**:
   - PyTorch MPS synthesis throughput: **193.4 fps** measured on Apple Silicon GPU.
   - Total rendering time for Ep01 (3,367 frames + audio mix): **~20.5 seconds**.

---

## 2. Logic Chain

```
[Observation: 2-head chibi card portraits produce dwarf actors when fed directly]
    │
    ▼
[Logic Step 1: Adult Proportion Pre-condition]
An intermediate adult reference sheet (epXX_realistic_8head_cast_sheet.jpg, 1:8 head-to-body)
must be established for each episode before generating action flipbooks.
    │
    ▼
[Observation: PyTorch MPS optical flow runs at 193.4 fps on local Apple Silicon GPU]
    │
    ▼
[Logic Step 2: High-Speed Zero-Cost Video Encoding]
Rendering 3,300 frames per episode takes only ~17 seconds on MPS.
macOS say -v Daniel + procedural BGM takes ~3.5 seconds.
Total runtime per episode is ~21 seconds.
    │
    ▼
[Observation: 39 episodes x 21 seconds = ~819 seconds (~13.6 minutes)]
    │
    ▼
[Logic Step 3: Feasibility of Complete 40-Episode Batch Processing]
Episodes 02 through 40 can be processed completely locally with zero cost ($0 paid APIs)
in under 15 minutes of compute time.
    │
    ▼
[Observation: Disk space available is 18 GiB; required space is ~810 MB]
    │
    ▼
[Logic Step 4: Storage Safety]
39 MP4s (~702 MB) + 2,808 WebP frames (~107 MB) = ~809 MB total.
This uses only ~4.4% of available disk space, safe for execution with immediate tempfile cleanup.
    │
    ▼
[Observation: CinemaView.tsx currently hardcodes currentEpisodeNum === 1 for MP4/poster URLs]
    │
    ▼
[Logic Step 5: Frontend Unification]
Generalizing CinemaView.tsx and LiveActionCinemaPlayer.tsx to map all episodes 1..40 to
/videos/cinema/episode_XX.mp4 and /images/cinema/episode_XX_acting/seq_XX_frame_XX.webp
unlocks the entire 40-episode Live-Action Cinema experience seamlessly.
```

---

## 3. Caveats

1. **Available Disk Space**: Current available disk space on the partition is `18 GiB` (98% capacity). While the total output of ~810 MB is well within this margin, all generation scripts must use temporary directories with automatic cleanup (`shutil.rmtree` in `finally` blocks) to prevent lingering uncompressed WAV or raw video frames from filling the disk.
2. **PyTorch MPS Memory Isolation**: When batch-processing all 39 episodes in a single long-running Python process, PyTorch MPS memory tensors must be flushed between episodes using `torch.mps.empty_cache()` to prevent memory fragmentation.
3. **macOS `say` Voice Availability**: The pipeline relies on macOS native speech synthesizer voice `Daniel` (`en_GB`). We verified `Daniel` is installed and functional. If run on a non-Mac environment in the future, a fallback TTS engine would be needed; however, the project runs locally on macOS Darwin, where `Daniel` is natively present.
4. **BGM Theme Diversity**: Episode 1 uses `arctic-blizzard`. Across Episodes 02–40, `MOVIE_EPISODES` specifies 6 distinct BGM themes (`battle-march` [11], `arcane-mystery` [8], `dark-ominous` [7], `sorrow-lament` [7], `triumph-fanfare` [5], `arctic-blizzard` [3]). The procedural BGM generator should parameterize musical scales, percussion, and instrumentation according to these 6 themes to ensure acoustic variety.

---

## 4. Conclusion

The reference implementation in `scripts/build_ep01_acting_cinema.py` is robust, production-verified, and exceptionally fast:
- **Zero Cost**: Uses 100% free local tools (`PyTorch 2.10 MPS`, `FFmpeg 8.0.1`, `macOS say -v Daniel`, `Pillow`, `NumPy`). Zero paid cloud APIs.
- **High Performance**: Renders at **193.4 fps** on Apple Silicon GPU, completing an entire 140-second 24fps episode in **~20.5 seconds**.
- **Commercial Aesthetics**: Clean 2.39:1 CinemaScope letterbox bars, 8-head-tall adult proportions, 72 continuous acting frames, 100% English-only opening title card, English TTS voiceover, zero subtitles/text overlays during acting scenes, and distinct SHA-256 hashes per frame.

### Proposed Batch Architecture for Episodes 02 through 40
We recommend implementing a unified batch generator `scripts/build_all_40_acting_cinema.py`:
1. **Episode Sequence Decomposition**:
   - Extract episode titles, key characters, and narrative scenes from `src/content/webtoonEpisodeManifest.json` and `src/content/movieEpisodeMapping.ts`.
   - Divide each episode's ~50 scenes into 8 contiguous sequence buckets.
   - Compose 8 concise English narrative voiceover paragraphs per episode.
2. **8-Head-Tall Action Keyframe Synthesis**:
   - Map featured characters to their 8-head adult proportions and card gear (`cardDatabase.ts`, `seat/*.png`, and environment plates `/tmp/webtoon_bg_plates/`).
   - Generate 8 3x3 sheets per episode (`act_seq_01.png` .. `act_seq_08.png`) in `public/images/cinema/raw_epXX_sheets/` (or stream directly to memory).
   - Slice into `public/images/cinema/episode_XX_acting/seq_01_frame_01.webp` .. `seq_08_frame_09.webp` (72 WebP frames per episode, all <= 75 KB with unique SHA-256 hashes).
3. **Thematic Audio Synthesis**:
   - Spoken English narration (`say -v Daniel -r 170`).
   - Procedural 44.1kHz BGM synthesized matching the episode's `bgmTheme` (6 themes: `battle-march`, `arcane-mystery`, `dark-ominous`, `sorrow-lament`, `triumph-fanfare`, `arctic-blizzard`).
   - Dynamic audio mixing with voiceover ducking.
4. **PyTorch MPS 24fps Video Encoding**:
   - ~4.0s English-only Opening Title Card (`SNSHERO ORIGINAL LIVE-ACTION CINEMA / EPISODE XX / <TITLE> / <ACT>`).
   - 72 acting frames continuous motion warping via `compute_coarse_optical_flow` + `synthesize_clean_frame_gpu`.
   - Zero subtitles / zero text overlays during acting frames.
   - Output to `public/videos/cinema/episode_XX.mp4` (`800x450`, 24fps, H.264/AAC, > 3 MB, duration >= 60s).
5. **Frontend Integration**:
   - Update `src/views/CinemaView.tsx` to map `mp4Url = /videos/cinema/episode_${padEp}.mp4?v=8head72en` and `posterUrl = /images/cinema/episode_${padEp}_acting/seq_01_frame_01.webp`.
   - Update `src/components/movie/LiveActionCinemaPlayer.tsx` to generalize `getActiveCinemaFrameUrl()` to cycle through all 72 frames for any episode 1..40.
   - Display `[★] 100% 실사 마스터 촬영본 (72프레임 연속 연기)` badge across all 40 episodes.

---

## 5. Verification Method

### 5.1 Programmatic Asset Verification
To independently verify the reference assets and future batch-generated assets:
```bash
# 1. Verify Video Container & Codecs (H.264 / AAC, 800x450, 24fps, duration >= 60s, size > 3MB)
ffprobe -v error -show_entries format=duration,size,bit_rate \
  -show_entries stream=index,codec_name,codec_type,width,height,r_frame_rate,sample_rate,channels \
  -of json public/videos/cinema/episode_01.mp4

# 2. Verify Frame Directory Integrity (72 frames, 800x450, distinct hashes, <= 75KB)
python3 -c "
import hashlib
from pathlib import Path
from PIL import Image

for ep in range(1, 2):  # extend to 41 for full check
    d = Path(f'public/images/cinema/episode_{ep:02d}_acting')
    files = sorted(d.glob('*.webp'))
    assert len(files) == 72, f'Expected 72 frames, got {len(files)} in {d}'
    hashes = set()
    for f in files:
        data = f.read_bytes()
        assert len(data) <= 75000, f'File too large: {f} ({len(data)}B)'
        hashes.add(hashlib.sha256(data).hexdigest())
        with Image.open(f) as im:
            assert im.size == (800, 450), f'Invalid size: {im.size}'
    assert len(hashes) == 72, f'Duplicate hashes detected in {d}'
    print(f'EP {ep:02d}: 72 frames verified 100% PASS (all distinct, 800x450, <=75KB)')
"

# 3. Verify PyTorch MPS & Audio Engine
python3 -c "
import torch
assert torch.backends.mps.is_available(), 'MPS not available'
d = torch.device('mps')
x = torch.randn(1, 3, 450, 800, device=d)
assert x.device.type == 'mps'
print('PyTorch MPS acceleration verified 100% PASS')
"

# 4. Verify TypeScript & Production Build
npx tsc --noEmit
npm run build
```

### 5.2 Invalidation Conditions
- Any episode MP4 has duration `< 60s` or file size `< 3 MB`.
- Any episode frame directory contains `< 72` frames or duplicate SHA-256 hashes.
- Any acting frame contains Korean subtitles, speech bubbles, or HUD text.
- Any episode opening title contains non-English text.
- Characters exhibit 2-head chibi / dwarf proportions instead of 8-head adult human anatomy.
