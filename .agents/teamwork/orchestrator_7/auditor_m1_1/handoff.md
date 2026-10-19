# Forensic Audit Report: Milestone 1 Cinema Pipeline & Episode 02

- **Auditor**: Forensic Auditor M1 (`884a1a59-ccd4-474b-80cf-4cedb6a81e72`)
- **Target**: Milestone 1 (M1) — `scripts/build_cinema_episodes.py`, `tests/verify_cinema_40_episodes.py`, `public/videos/cinema/episode_02.mp4`, `public/images/cinema/episode_02_acting/` (72 frames)
- **Integrity Mode**: Development
- **Verdict**: **CLEAN**

---

## 1. Observation

All observations were collected through direct empirical execution and binary/code inspection:

### 1.1 Source Code Analysis (`scripts/build_cinema_episodes.py` & `tests/verify_cinema_40_episodes.py`)
1. **Inspection of `tests/verify_cinema_40_episodes.py`**:
   - The test harness does **not** contain any hardcoded pass flags, dummy returns, or mock assertions.
   - It performs real inspection using `ffprobe` (`FFPROBE_BIN -show_entries ... -of json`) verifying:
     - Video codec: `h264`, dimensions: `800x450`, frame rate: `24fps` (`24/1`)
     - Audio codec: `aac`, sample rate: `44100 Hz`, channels: `2` (stereo)
     - Minimum duration: `>= 60.0s`, minimum file size: `> 3,000,000 bytes`
   - It iterates through all 72 WebP files in `public/images/cinema/episode_XX_acting/`, opening each with Pillow to verify dimensions `(800, 450)`, size bounds `[4096, 75000]` bytes, and calculates SHA-256 hashes to guarantee `len(hashes) == 72` (0 duplicates).
   - **Test Sensitivity Verification**: When executed on an ungenerated episode (`--episodes 3`), the harness exited with code 1 and reported: `[FAIL] EP 03 MP4 FAIL: File does not exist: .../episode_03.mp4`.

2. **Inspection of `scripts/build_cinema_episodes.py`**:
   - Real character proportion translation: `generate_8head_cast_sheet` generates an 8-head-tall cast sheet (`1376x768`) and individual character crops (`ref_8head_*.jpg`). It draws athletic adult proportions (head: 38–48px, torso: 80px, legs: 110px) to prevent chibi/dwarf distortion.
   - Real 3x3 keyframe sheets: `generate_8_action_sheets` generates 8 3x3 sheets (`1376x768`) incorporating scene backgrounds, dynamic lighting, atmospheric particle simulation (`np.random.default_rng`), and camera push-in.
   - Real PyTorch optical flow: `compute_coarse_optical_flow` implements Lucas-Kanade coarse optical flow with `F.avg_pool2d`, gradient padding, matrix determinant, and bilinear interpolation on Apple Silicon GPU (`mps`). `synthesize_clean_frame_gpu` warps tensors `t1` and `t2` via `F.grid_sample` with smooth alpha blending.
   - Real procedural soundtrack: `synthesize_cinema_bgm_wav` generates 44.1kHz stereo waveforms across 6 themes (`battle-march`, `arctic-blizzard`, `arcane-mystery`, `dark-ominous`, `sorrow-lament`, `triumph-fanfare`) with drums, drones, and melodic motifs.
   - Real narration and ducking: Uses macOS `say -v Daniel -r 170` to generate spoken English narration and applies dynamic numpy audio ducking over the BGM track.
   - Real FFmpeg encoding: Streams raw video frames and mixed master audio through FFmpeg pipe into `libx264` (`yuv420p`, `800x450`, `24fps`) + `aac` stereo.

### 1.2 Asset Verification (`episode_02.mp4`)
1. **ffprobe Container & Stream Output**:
   ```json
   {
     "streams": [
       {"index": 0, "codec_name": "h264", "codec_type": "video", "width": 800, "height": 450, "r_frame_rate": "24/1"},
       {"index": 1, "codec_name": "aac", "codec_type": "audio", "sample_rate": "44100", "channels": 2}
     ],
     "format": {"duration": "118.958333", "size": "16393563", "bit_rate": "1102474"}
   }
   ```
2. **Audio Track Analysis**:
   - Duration: 118.96s (exactly matches video duration)
   - Sample rate: 44,100 Hz stereo (2 channels)
   - RMS amplitude: 3,419.1 (rich sound presence, non-silent)
   - Max amplitude: 28,051 (clean headroom, no digital clipping)
3. **Visual Frame Content & Letterboxing**:
   - Letterbox bars (rows 0–24 and 426–450): Max pixel value `<= 4` (pure black 2.39:1 CinemaScope matte bars).
   - Opening Title Card (0s–4s): Frame extracted at 2.0s contains English text only (`SNSHERO ORIGINAL LIVE-ACTION CINEMA`, `EPISODE 02`, `OATH OF THE SEVEN PURSUERS`, `ACT I`). Zero Korean characters present.
   - Acting Frames (4s–119s): Frames extracted at 10s, 30s, 60s, 90s, 110s exhibit zero burned-in subtitle boxes, zero speech bubbles, and zero HUD text overlays.
4. **Hash Differentiation**:
   - `episode_01.mp4`: `fc8e6e648a8a67553fdbef830f01fe98b214ed6cfe67b517d2f087550b24f195`
   - `episode_02.mp4`: `42ca0e2df90248cd09a7cc343b2dc8fe5924b91a7e6d47ff83a20e8d25409217`
   - Zero duplication with episode 01.

### 1.3 Acting Frames Verification (`public/images/cinema/episode_02_acting/`)
1. **File count**: Exactly 72 files (`seq_01_frame_01.webp` through `seq_08_frame_09.webp`).
2. **Dimensions**: All 72 files are strictly `(800, 450)`.
3. **File sizes**:
   - Minimum: 33,822 bytes
   - Maximum: 70,426 bytes
   - Mean: 51,788.4 bytes (all strictly within `[4096, 75000]` byte budget).
4. **SHA-256 Uniqueness**:
   - Exactly 72 distinct SHA-256 hashes (100% unique, 0 duplicate frames).
   - Overlap with episode 01 frames: 0 (completely unique assets).
5. **Image Content Metrics**:
   - Brightness mean: range `75.8` to `154.8` (no black or empty frames).
   - Contrast standard deviation: range `55.6` to `91.1` (active visual variance).

### 1.4 Raw Sheets & Casting Reference (`public/images/cinema/raw_ep02_sheets/`)
- `ep02_realistic_8head_cast_sheet.jpg` (`1376x768`, RGB)
- 8 individual character crops: `ref_8head_aila.jpg`, `ref_8head_aleksandar.jpg`, `ref_8head_eliana.jpg`, `ref_8head_gawain.jpg`, `ref_8head_grimli.jpg`, `ref_8head_hercul.jpg`, `ref_8head_kaze.jpg`, `ref_8head_rondol.jpg`.
- 8 action flipbook sheets: `act_seq_01.png` through `act_seq_08.png` (`1376x768`, RGB).

### 1.5 Type Safety & Build Verification
- `npx tsc --noEmit`: 0 errors (Exit code 0).
- `npm run build`: Exit code 0, 52 static routes generated, bundle verified.

---

## 2. Logic Chain

1. **Integrity Rule 1 (No Hardcoded Test Results)**: `tests/verify_cinema_40_episodes.py` relies solely on dynamic runtime probes (`ffprobe`, PIL, hashlib). When run on non-existent or modified inputs, it actively fails. No static pass values are embedded.
2. **Integrity Rule 2 (No Facade Implementations)**: `scripts/build_cinema_episodes.py` contains genuine mathematical and deep learning routines (PyTorch coarse optical flow on Apple Silicon MPS via `F.grid_sample`, audio waveform synthesis, Pillow image manipulation, FFmpeg pipe). The resulting video is 118.96s long and 15.63 MB, containing 2,855 rendered frames with smooth motion and synthesized audio.
3. **Integrity Rule 3 (No Fabricated Outputs / Duplications)**: All 72 WebP frames in `public/images/cinema/episode_02_acting/` have distinct SHA-256 hashes and non-zero contrast, and differ completely from episode 01. The MP4 video has a unique hash and genuine timeline content matching Episode 02's scenario ("Oath of the Seven Pursuers").
4. **Zero-Cost Constraint**: Execution consumed $0 in external cloud APIs, running entirely on local macOS Darwin tools (Apple Silicon MPS, FFmpeg, macOS `say`, and Pillow).

---

## 3. Caveats

- Narration synthesis depends on macOS `say` voice `Daniel`. On environments without `say`, a fallback TTS or pre-rendered voice track would be required. In this macOS workspace, `say -v Daniel` executes flawlessly.
- Milestone 1 covers the parametric engine and Episode 02 verification. Batch generation of the remaining episodes (03–40) is scheduled for subsequent milestones (M2 and M3).

---

## 4. Conclusion

- **Verdict**: **CLEAN**
- No integrity violations, shortcuts, facade implementations, or mock test results were detected.
- Milestone 1 is verified as authentic, robust, and compliant with all project constraints.

---

## 5. Verification Method

To independently reproduce the forensic checks:

```bash
# 1. Run the automated cinema test harness on Episodes 01 and 02
python3 tests/verify_cinema_40_episodes.py --episodes 1,2

# 2. Test harness sensitivity on an unbuilt episode (must FAIL)
python3 tests/verify_cinema_40_episodes.py --episodes 3

# 3. Verify ffprobe metrics for Episode 02 MP4
ffprobe -v error -show_entries format=duration,size,bit_rate -show_entries stream=codec_name,width,height,r_frame_rate,sample_rate,channels -of json public/videos/cinema/episode_02.mp4

# 4. Verify 72-frame SHA-256 uniqueness and size compliance
python3 -c "
import hashlib
from pathlib import Path
files = sorted(Path('public/images/cinema/episode_02_acting').glob('*.webp'))
assert len(files) == 72
hashes = {hashlib.sha256(f.read_bytes()).hexdigest() for f in files}
assert len(hashes) == 72
sizes = [f.stat().st_size for f in files]
assert all(4096 <= s <= 75000 for s in sizes)
print('All 72 frames verified unique and within budget.')
"

# 5. Type safety and production build
npx tsc --noEmit
npm run build
```
