# Movie Theater 40-Episode Cutscene Asset & Character Mapping Exploration Report

**Explorer**: `explorer_movie_1`  
**Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_movie_1/`  
**Date**: 2026-10-18  
**Scope**: Read-only exploration of all 40-episode cutscenes, manifest schema, character portraits, audio/TTS engines, and video integration paths for the SNSHero Movie Theater upgrade.

---

## 1. Observation

### 1.1 Cutscene Count & Disk File Verification (Key Question 1)
- **Manifest File**: `src/content/webtoonEpisodeManifest.json`
  - Total episodes: Exactly 40 episodes (`"1"` through `"40"`).
  - Every episode contains an `images` array starting with `index: 0` (`scene_00.webp`, type: `"title_card"`) followed by `scene_01.webp` through `scene_XX.webp` (type: `"scene"`).
  - **Total cutscenes declared in manifest across all 40 episodes: 2,049 cutscenes** (40 title cards + 2,009 story scenes).
- **Disk File Verification**: `public/images/webtoon/episode_01/` through `episode_40/`
  - Total image files found on disk: **2,049 files** (100% matched, **0 missing files**, **0 zero-byte files**).
  - No orphan files or extra files exist in those directories.
  - **Image Format**: 100% WebP format (`.webp`).
  - **Resolution**: 100% of the 2,049 images have exact dimensions **800 x 450 px** (16:9 widescreen webtoon ratio).
  - **File Size Distribution**:
    - Min file size: 15,620 bytes (15.25 KB) (>= 4 KB budget)
    - Max file size: 74,998 bytes (73.24 KB) (<= 75 KB budget)
    - Average file size: 54,509 bytes (53.23 KB)
    - Total size of all 2,049 images: 106.52 MB (average 2.66 MB per episode).

#### Detailed Per-Episode Cutscene & Asset Breakdown Table
| Episode | English Title | Korean Title | Cutscenes (Manifest) | Disk Files | Dialogues | SFX Cues | Cast Size | Disk MB |
|:---:|:---|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| **01** | Two Vows Beneath the Blizzard | 눈보라 아래 두 서약 | 50 | 50 | 50 | 67 | 9 | 2.63 MB |
| **02** | Oath of the Seven Pursuers | 일곱 추적자의 맹세 | 48 | 48 | 48 | 55 | 11 | 2.36 MB |
| **03** | Blood on the Mist Cliff | 안개 절벽의 피 | 53 | 53 | 53 | 70 | 11 | 2.66 MB |
| **04** | The Child Raised in the Wastes | 황야에서 자란 아이 | 47 | 47 | 47 | 54 | 11 | 2.36 MB |
| **05** | Phantom in the Downpour | 폭우 속의 유령 | 52 | 52 | 52 | 66 | 14 | 2.68 MB |
| **06** | The Art of Breathing Stars | 별을 호흡하는 법 | 53 | 53 | 53 | 62 | 11 | 2.69 MB |
| **07** | The Traitors Camp | 배신자의 막사 | 52 | 52 | 52 | 60 | 12 | 2.68 MB |
| **08** | Rider of the Crimson Mane | 붉은 갈기의 기수 | 47 | 47 | 47 | 55 | 8 | 2.40 MB |
| **09** | Wind in Beggars Clothes | 누더기를 걸친 바람 | 50 | 50 | 50 | 68 | 9 | 2.48 MB |
| **10** | Prisoner of the Flame Court | 화염 법정의 죄수 | 51 | 51 | 51 | 66 | 9 | 2.68 MB |
| **11** | The Dagger That Wakes Memory | 기억을 깨우는 단검 | 54 | 54 | 54 | 67 | 15 | 2.97 MB |
| **12** | Spring Between Two Graves | 두 무덤 사이의 샘 | 48 | 48 | 48 | 63 | 14 | 2.53 MB |
| **13** | Master of the Jade Staff | 비취 지팡이의 주인 | 47 | 47 | 47 | 60 | 9 | 2.58 MB |
| **14** | Guests of the Mist Lake | 안개 호수의 손님 | 48 | 48 | 48 | 58 | 9 | 2.35 MB |
| **15** | Night of Serpent and Lion | 뱀과 사자의 밤 | 49 | 49 | 49 | 58 | 9 | 2.36 MB |
| **16** | Brothers Before the Ruins | 폐허 앞의 형제들 | 49 | 49 | 49 | 61 | 7 | 2.36 MB |
| **17** | Invitation to the Wind Isle | 바람섬에서의 초대 | 46 | 46 | 46 | 61 | 10 | 2.55 MB |
| **18** | Secret of the Black Sanctum | 흑성소의 비밀 | 56 | 56 | 56 | 70 | 10 | 2.95 MB |
| **19** | Three Trials | 세 가지 시험 | 51 | 51 | 51 | 73 | 7 | 2.89 MB |
| **20** | The Wave That Swallowed the Flower Ship | 화선을 삼킨 파도 | 49 | 49 | 49 | 67 | 9 | 2.86 MB |
| **21** | Betrayal Aboard the Burning Ship | 불타는 배의 배신 | 47 | 47 | 47 | 56 | 7 | 2.54 MB |
| **22** | Four on a Deserted Island | 무인도의 네 사람 | 57 | 57 | 57 | 72 | 8 | 3.00 MB |
| **23** | The Record Sleeping in the Cave | 동굴 속 잠든 기록 | 54 | 54 | 54 | 63 | 10 | 2.74 MB |
| **24** | Seven Nights in the Sealed Chamber | 봉인실의 일곱 밤 | 51 | 51 | 51 | 67 | 8 | 2.74 MB |
| **25** | Night of the False Wedding | 거짓 혼례의 밤 | 53 | 53 | 54 | 68 | 6 | 3.06 MB |
| **26** | Open Door, Closed Heart | 열린 문, 닫힌 마음 | 56 | 56 | 56 | 71 | 8 | 3.18 MB |
| **27** | Between Two Promises | 두 약속 사이 | 51 | 51 | 51 | 56 | 6 | 2.87 MB |
| **28** | Revolt of the Jade Council | 녹옥 의회의 반란 | 55 | 55 | 55 | 72 | 9 | 3.04 MB |
| **29** | Queen of the Wind | 바람의 여왕 | 53 | 53 | 54 | 65 | 10 | 2.39 MB |
| **30** | Poison at the Four Gates | 네 관문의 독 | 50 | 50 | 50 | 70 | 11 | 2.15 MB |
| **31** | The Hand That Wagered Everything | 모든 것을 건 손 | 60 | 60 | 60 | 63 | 8 | 3.05 MB |
| **32** | Echo of First Love | 첫사랑의 잔향 | 51 | 51 | 52 | 63 | 10 | 2.70 MB |
| **33** | Grudge of the Black Marsh | 검은 늪의 원한 | 51 | 51 | 51 | 75 | 10 | 2.51 MB |
| **34** | The Fallen Wind Isle | 무너진 바람섬 | 52 | 52 | 52 | 65 | 13 | 2.67 MB |
| **35** | Mistaken in the Fog | 안개 속의 오인 | 53 | 53 | 53 | 74 | 10 | 2.73 MB |
| **36** | Map of the Cross-Shaped Scar | 십자 성흔의 지도 | 48 | 48 | 49 | 66 | 8 | 2.44 MB |
| **37** | War of the Conqueror King | 정복왕의 전쟁 | 49 | 49 | 49 | 68 | 7 | 2.50 MB |
| **38** | Three Silk Seals | 세 개의 비단 봉인 | 52 | 52 | 52 | 73 | 7 | 2.55 MB |
| **39** | The World Worth Protecting | 지켜야 할 세계 | 54 | 54 | 54 | 68 | 9 | 2.87 MB |
| **40** | One Who Is Not Called a Hero | 영웅이라 불리지 않는 자 | 52 | 52 | 52 | 53 | 9 | 2.78 MB |
| **TOTAL** | **40 Episodes** | — | **2,049** | **2,049** | **2,053** | **2,589** | — | **106.52 MB** |

---

### 1.2 Cutscene Data Schema Verification (Key Question 2)

Each cutscene item in `webtoonEpisodeManifest.json` has the following validated structure:

```typescript
interface CutsceneImage {
  index: number;              // 0 for title card, 1..N for story cutscenes (100% present)
  fileName: string;           // "scene_00.webp" ~ "scene_XX.webp" (100% present)
  imageUrl: string;           // "/images/webtoon/episode_XX/scene_YY.webp" (100% present)
  localArtUrl: string;        // matches imageUrl (100% present)
  type: 'title_card' | 'scene'; // 40 title_cards, 2,009 scenes (100% present)
  narrationKo: string;        // Korean narration text (100% present, 0 empty)
  narrationEn: string;        // English narration text (100% present, 0 empty)
  characters: string[];       // Array of character English names (100% present)
  background?: string;        // Environment prompt/setting (present in all 2,009 story scenes)
  dialogues: Array<{
    speakerKo: string;        // e.g., "카단", "실리아", "내레이션" (100% present)
    speakerEn: string;        // e.g., "Kadan", "Celia", "Narration" (100% present)
    textKo: string;           // Korean dialogue / thought text (100% present)
    textEn: string;           // English dialogue / thought text (100% present)
    bubbleType: 'thought' | 'speech' | 'shout'; // 1,448 thought, 357 speech, 248 shout
    position: 'bottom-left' | 'top-left' | 'bottom-right' | 'top-right' | 'center';
    characterCardId?: number; // 2,013 present (100% of story dialogues; omitted only for 40 title cards)
  }>;
  sfxCues: Array<{
    textKo: string;           // e.g. "콰아아앙!", "챙-!", "서걱-!", "파지지직!"
    textEn: string;           // e.g. "BOOM!", "CLANG!", "SLASH!", "CRACKLE!", "RUMBLE!"
    style: 'slash' | 'magic' | 'impact' | 'rumble'; // 1,166 slash, 548 magic, 541 impact, 334 rumble
    position: 'center' | 'top-right' | 'top-left' | 'bottom-left' | 'bottom-right';
  }>;
  isKeyClimax?: boolean;      // 5 climax scenes flagged
}
```

- **Comparison with `public/book/image_narrations/*.json`**:
  - `public/book/image_narrations/episode_01_narrations.json` through `episode_40_narrations.json` contain exactly the **2,009 story scenes** (scenes 1..N).
  - They omit `scene_00.webp` (title cards), which are exclusively registered in `webtoonEpisodeManifest.json`.
  - Therefore, `webtoonEpisodeManifest.json` is the **single authoritative source of truth** containing all 2,049 cutscenes.

---

### 1.3 Character Portrait Mapping Verification (Key Question 3)

#### Hero Character Database & Portrait Assets
- **Database**: `src/cardDatabase.ts` (`CARD_DATABASE`)
  - Exactly 110 cards (IDs 1 through 110).
  - All cards have non-empty `title` (Korean) and `title_en` (English).
- **Portraits on Disk**: `public/seat/*.png`
  - Exactly **111 PNG files** exist.
  - Every single one of the 110 cards maps to a file in `public/seat/*.png` (110 matched + 1 alias `Aila_the_Demon_Hunter.png`).
  - Image specs: `256 x 296 px`, file sizes `<= 35 KB` (mean ~28 KB), sharp dark-fantasy TCG portraits.

#### Story Character Breakdown & Mapping Table
- **Characters appearing in dialogues/cutscenes**: Exactly **33 distinct hero characters** appear across all 40 episodes.
- **`characterCardId` availability**:
  - Available in **2,013 out of 2,053 dialogues** (100% of story dialogues).
  - The only 40 dialogues without `characterCardId` are the 40 title cards (`index: 0`), where the speaker is `"Narration"` / `"내레이션"`.
  - For all 675 named character dialogues (`speakerEn !== 'Narration'`), `characterCardId` is 100% present and **matches `CARD_DATABASE[characterCardId].title_en` with zero mismatches**.
- **Dialogue Speaker Types**:
  - Direct character speech/shouts/thoughts: **675 dialogues** (Kadan 220, Celia 162, Ignis 75, Grimli 29, Rondol 25, Lucian 22, Gawain 16, Leonar 15, Aila 10, Balian 9, Hercul 9, Eliana 9, Fenrir 9, Elwin 8, Robinyard 8, Aeolus 8, Medusa Gorgo 7, Aleksandar 6, Death Knight Artus 6, Malfuon 5, Barghest 4, Walker 4, Kaze 3, Gilgamesh 2, Sylphid 2, Belphegor 1, Ysela 1).
  - Novel narrative voiceover (`speakerEn: "Narration"`): **1,378 dialogues** (in story scenes, `characterCardId` points to the viewpoint/focal protagonist of that panel).

#### All 33 Story Character Mapping Table
| Character Name (Manifest) | Card ID | Korean Name | Faction | Seat Portrait Asset Path | Resolved File Exists |
|:---|:---:|:---|:---|:---|:---:|
| **Kadan** | 41 | 카단 | human | `/seat/Kadan.png` | YES |
| **Celia** | 62 | 실리아 | elf | `/seat/Celia.png` | YES |
| **Ignis** | 11 | 이그니스 | fire | `/seat/Ignis.png` | YES |
| **Lucian** | 61 | 루시안 | elf | `/seat/Lucian.png` | YES |
| **Rondol** | 46 | 론돌 | human | `/seat/Rondol.png` | YES |
| **Grimli** | 74 | 그림리 | hobbit | `/seat/Grimli.png` | YES |
| **Balian** | 43 | 발리안 | human | `/seat/Balian.png` | YES |
| **Medusa Gorgo** | 89 | 메두사 고르고 | beast | `/seat/Medusa_Gorgo.png` | YES |
| **Leonar** | 86 | 레오나르 | beast | `/seat/Leonar.png` | YES |
| **Gawain** | 45 | 가웨인 | human | `/seat/Gawain.png` | YES |
| **Aleksandar** | 50 | 알렉산다르 | human | `/seat/Aleksandar.png` | YES |
| **Death Knight Artus** | 60 | 데스나이트 아르투스 | undead | `/seat/Death_Knight_Artus.png` | YES |
| **Fenrir** | 81 | 펜릴 | beast | `/seat/Fenrir.png` | YES |
| **Hercul** | 49 | 헤르쿨 | human | `/seat/Hercul.png` | YES |
| **Aeolus** | 25 | 에올루스 | wind | `/seat/Aeolus.png` | YES |
| **Elwin** | 42 | 엘윈 | human | `/seat/Elwin.png` | YES |
| **Eliana** | 63 | 엘리아나 | elf | `/seat/Eliana.png` | YES |
| **Aila** | 70 | 에일라 | elf | `/seat/Aila.png` | YES |
| **Robinyard** | 48 | 로비냐드 | human | `/seat/Robinyard.png` | YES |
| **Malfuon** | 66 | 말퓨온 | elf | `/seat/Malfuon.png` | YES |
| **Barghest** | 87 | 바르가스트 | beast | `/seat/Barghest.png` | YES |
| **Walker** | 51 | 워커 | undead | `/seat/Walker.png` | YES |
| **Kaze** | 44 | 카제 | human | `/seat/Kaze.png` | YES |
| **Gilgamesh** | 47 | 길가메시 | human | `/seat/Gilgamesh.png` | YES |
| **Sylphid** | 23 | 실피드 | wind | `/seat/Sylphid.png` | YES |
| **Belphegor** | 13 | 벨페고르 | fire | `/seat/Belphegor.png` | YES |
| **Ysela** | 107 | 이셀라 | dragon | `/seat/Ysela.png` | YES |
| **Balbo** | 71 | 발보 | hobbit | `/seat/Balbo.png` | YES |
| **Griffon** | 84 | 그리폰 | beast | `/seat/Griffon.png` | YES |
| **Magitech Golem** | 99 | 마기테크 골렘 | mecha | `/seat/Magitech_Golem.png` | YES |
| **Pegasus** | 90 | 페가수스 | beast | `/seat/Pegasus.png` | YES |
| **Titania** | 64 | 티타니아 | elf | `/seat/Titania.png` | YES |
| **Ursoc** | 88 | 우르삭 | beast | `/seat/Ursoc.png` | YES |

---

### 1.4 Current State of `MovieView.tsx` & `CinematicMoviePlayer.tsx`

1. **`CinematicMoviePlayer.tsx` scene loading**:
   - Lines 111–112: `const sceneImages = epData.images.filter((img) => img.index > 0);`
   - Currently skips `scene_00.webp` (title cards), and assumes an obsolete legacy limit of 20 scenes per episode.
   - Segmented scrubber bar and completion modal texts refer to "20-Scene" (`20씬 40부작 전편`, `20-Scene Segmented Progress Bar`).
2. **Audio & TTS Voiceover**:
   - `CinematicMoviePlayer.tsx` lines 256–259: currently selects `language === 'en' ? currentScene.narrationEn : currentScene.narrationKo`.
   - Under Requirement R2, English TTS (`en-US`/`en-GB`) must **always speak the English cutscene text (`narrationEn` and English dialogues)** regardless of the user's selected UI language.
   - `MovieAudioSynthesizer.ts` has full Web Audio procedural BGM engines (`arctic-blizzard`, `battle-march`, `arcane-mystery`, `triumph-fanfare`, `dark-ominous`, `sorrow-lament`) and SpeechSynthesis TTS.
3. **Dialogue Overlay & Speaking Character Portrait Highlight**:
   - Currently, `CinematicMoviePlayer.tsx` only renders a plain text tag `[ speaker ]` inside the subtitle box at the bottom.
   - It does NOT render the speaking character's portrait from `public/seat/*.png` nor an active glowing frame or aura pulse.
4. **Combat Onomatopoeia (SFX) Visuals**:
   - Currently, `CinematicMoviePlayer.tsx` does NOT render visual SFX text overlays on the movie canvas (it only plays procedural audio sound effects).
   - `src/components/webtoon/WebtoonSfxOverlay.tsx` exists with high-impact comic styling (`slash`, `impact`, `magic`, `rumble`), but is not hooked up into `CinematicMoviePlayer.tsx`.
5. **Video (MP4) Assets & Playback Support**:
   - `public/videos/episodes/` does not yet exist.
   - System tool `/opt/homebrew/bin/ffmpeg` (FFmpeg 8.0.1) is installed and available with `libx264` and `aac`.

---

## 2. Logic Chain

1. **Premise 1**: The new Movie Theater requirement (R1) calls for all 40 episodes to play through all newly generated webtoon cutscenes (`scene_00.webp` through `scene_XX.webp`).
   - *Observation*: `webtoonEpisodeManifest.json` has 2,049 cutscenes, each starting with `index: 0` (`scene_00.webp`) as the title card + `index: 1..N` story scenes. Disk contains all 2,049 `.webp` files.
   - *Inference*: `CinematicMoviePlayer.tsx` must remove the filter `img.index > 0` and load all scenes (index 0..N), dynamically scaling the scrubber dock to support 46–60 scenes per episode.
2. **Premise 2**: Requirement R2 mandates an **English-base presentation**:
   - *English TTS Voiceover*: Must speak `currentScene.narrationEn` (and character English dialogue lines) in English (`en-US`), even if UI language is Korean or Japanese.
   - *Dialogue Overlay*: Spoken lines must appear in English (`textEn`, `speakerEn`) on the stage.
   - *Speaking Character Highlight*: When a named character speaks (`speakerEn !== 'Narration'`), their portrait from `public/seat/{name}.png` should be rendered in an illuminated gold badge/frame with glowing aura pulse (`animate-pulse` or radial aura), dimming non-speaking elements.
   - *SFX Cues*: Animated comic SFX typography from `currentScene.sfxCues` (`SLASH!`, `BOOM!`, `CLANG!`) must appear directly on the movie canvas.
3. **Premise 3**: Requirement R4 mandates a **Multi-Language Subtitle System with ON/OFF Toggle (`CC`)**:
   - When language is `'en'`, display English subtitles (`narrationEn` / `textEn`).
   - When language is `'ko'`, display Korean subtitles (`narrationKo` / `textKo`).
   - When language is other supported languages (`ja`, `zh-CN`, `es`, etc.), display localized subtitles if available, falling back to English.
   - Provide a 44px+ `[CC / 자막 ON·OFF]` toggle button that cleanly toggles subtitle visibility without interrupting playback.
4. **Premise 4**: Character portrait path resolution must be 100% deterministic and zero-error:
   - For any dialogue with `characterCardId`:
     `portraitUrl = /seat/${CARD_DATABASE[characterCardId].title_en.replace(/ /g, '_')}.png`
   - Fallback lookup by `speakerEn`:
     `portraitUrl = /seat/${speakerEn.replace(/ /g, '_')}.png`
   - Since all 33 story characters and all 110 cards match files in `public/seat/`, this mapping is 100% covered.

---

## 3. Caveats

1. **`public/book/image_narrations/*.json` vs `src/content/webtoonEpisodeManifest.json`**:
   - `image_narrations` contains 2,009 items (story scenes only, indices 1..N).
   - `webtoonEpisodeManifest.json` contains 2,049 items (title cards index 0 + story scenes 1..N).
   - Downstream components should read directly from `webtoonEpisodeManifest.json` for full 2,049-scene coverage.
2. **Korean Episode Titles**:
   - `movieEpisodeMapping.ts` and `public/book/index.json` use the newly remastered literary Korean titles for episodes 21–40 (e.g. Ep 40: "영웅이라 불리지 않는 자"), whereas `webtoonEpisodeManifest.json` retains draft titles (e.g. Ep 40: "영웅이 아닌 사람").
   - Recommendation: Use `MOVIE_EPISODES[epNum].titleKo` and `titleEn` for all UI titles, headers, and completion modals.
3. **Multi-Dialogue Climax Scenes**:
   - 4 climax scenes (Ep 25 Scene 52, Ep 29 Scene 52, Ep 32 Scene 50, Ep 36 Scene 47) contain 2 dialogues in the same scene.
   - Downstream UI should iterate through or stack the dialogues rather than only displaying `dialogues[0]`.
4. **MP4 Video Files**:
   - Standalone video files (`public/videos/episodes/episode_01.mp4` ~ `episode_40.mp4`) are not yet created on disk. Explorer investigation confirms FFmpeg 8.0.1 is available at `/opt/homebrew/bin/ffmpeg`. Generation is an implementer task.

---

## 4. Conclusion & Actionable Recommendations

### Summary of Answers to Key Questions
1. **Cutscene Counts**: Exactly **2,049 cutscenes** across 40 episodes in `webtoonEpisodeManifest.json` (40 title cards + 2,009 story scenes). **0 missing images** in `public/images/webtoon/`. All images are 800x450 WebP, 15–73 KB.
2. **Data Schema**: Complete and verified across all 2,049 scenes. 100% populated `narrationKo`, `narrationEn`, `characters`, `dialogues`, `sfxCues`. 2,053 dialogues and 2,589 SFX cues.
3. **Character Portrait Mapping**: 100% of the 33 story characters map directly to `public/seat/*.png` via `characterCardId` and `CARD_DATABASE[id].title_en`. All 110 hero cards in `CARD_DATABASE` have matching portraits in `public/seat/`.
4. **Data Integration Roadmap**: Concrete specifications detailed below.

### Concrete Implementation Blueprint for Downstream Implementer

#### 1. Portrait Resolution Utility (`src/lib/movieCharacterMapping.ts`)
Create a lightweight, zero-dependency helper:
```typescript
import { CARD_DATABASE } from '../cardDatabase';

export function getCharacterPortraitUrl(cardId?: number, speakerEn?: string): string {
  if (cardId && CARD_DATABASE[cardId]) {
    const rawName = CARD_DATABASE[cardId].title_en;
    return `/seat/${rawName.replace(/ /g, '_')}.png`;
  }
  if (speakerEn && speakerEn !== 'Narration') {
    return `/seat/${speakerEn.replace(/ /g, '_')}.png`;
  }
  return '/seat/Kadan.png';
}
```

#### 2. `CinematicMoviePlayer.tsx` Updates
- **Load All Cutscenes**: Include `scene_00.webp` (title cards):
  ```typescript
  // Load ALL cutscenes (index 0..N) from manifest
  const epData = manifest[String(epNum)];
  const scenes = epData.images.map((img, idx) => ({ ... }));
  ```
- **English-Base Cutscene Presentation & English TTS**:
  ```typescript
  // Always speak English narration & dialogue in English TTS
  if (isTtsEnabled && isPlaying && !isMuted) {
    const speechText = currentScene.dialogues?.length
      ? `${currentScene.dialogues.map(d => `${d.speakerEn}: ${d.textEn}`).join('. ')}. ${currentScene.narrationEn}`
      : currentScene.narrationEn;
    movieAudio.speakNarration(speechText, 'en');
  }
  ```
- **Highlighted Character Dialogue Overlay**:
  Render floating speech box with active speaker portrait:
  ```tsx
  {currentScene?.dialogues?.map((d, i) => {
    const isNamedSpeaker = d.speakerEn && d.speakerEn !== 'Narration';
    const portraitUrl = getCharacterPortraitUrl(d.characterCardId, d.speakerEn);
    return (
      <div key={i} className="absolute top-16 left-4 z-20 flex items-center gap-3 bg-black/85 p-3 border border-amber-500/60 rounded-sm">
        {isNamedSpeaker && (
          <div className="relative w-14 h-16 shrink-0 border-2 border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.6)] animate-pulse">
            <img src={portraitUrl} alt={d.speakerEn} className="w-full h-full object-cover" />
            <span className="absolute -bottom-2 inset-x-0 bg-amber-500 text-black text-[9px] font-bold text-center uppercase">
              {d.speakerEn}
            </span>
          </div>
        )}
        <div className="flex flex-col">
          <span className="text-xs font-bold text-amber-400">{d.speakerEn}</span>
          <p className="text-sm font-semibold text-white">{d.textEn}</p>
        </div>
      </div>
    );
  })}
  ```
- **Onomatopoeia (SFX) Visuals**:
  Render animated SFX cues:
  ```tsx
  {currentScene?.sfxCues?.map((sfx, idx) => (
    <WebtoonSfxOverlay key={idx} sfx={sfx} language="en" />
  ))}
  ```
- **Multi-Language Subtitles & CC Toggle**:
  Render subtitles in user's UI language (`ko` -> `narrationKo`, `en` -> `narrationEn`), togglable via `CC` button.

#### 3. Continuous BGM Assurance
In `MovieAudioSynthesizer.ts`, ensure `startBgm` seamlessly keeps playing across scene switches when the theme is unchanged, and initialize audio on the first user Play interaction.

#### 4. MP4 Video Generation Pipeline
Use `/opt/homebrew/bin/ffmpeg` to stitch `scene_00.webp`..`scene_XX.webp` with procedural BGM audio into `public/videos/episodes/episode_01.mp4`..`episode_40.mp4`.

---

## 5. Verification Method

### 5.1 Verification Commands
Run the following commands in the workspace root to independently verify all findings:

1. **Verify 2,049 cutscene files and disk consistency**:
   ```bash
   python3 -c "
   import json, os
   with open('src/content/webtoonEpisodeManifest.json', 'r', encoding='utf-8') as f:
       m = json.load(f)
   tot = sum(len(m[str(i)]['images']) for i in range(1, 41))
   disk = sum(len([f for f in os.listdir(f'public/images/webtoon/episode_{i:02d}') if f.endswith('.webp')]) for i in range(1, 41))
   print(f'Manifest: {tot}, Disk: {disk}, Match: {tot == disk == 2049}')
   "
   ```
2. **Verify 110 hero card portrait mapping**:
   ```bash
   python3 -c "
   import re, os
   with open('src/cardDatabase.ts', 'r', encoding='utf-8') as f:
       txt = f.read()
   cards = re.findall(r'id:\s*(\d+).*?title_en:\s*[\'\"]([^\'\"]+)[\'\"]', txt, re.DOTALL)
   seats = set(os.listdir('public/seat'))
   mapped = sum(1 for cid, te in cards if f'{te.replace(\" \", \"_\")}.png' in seats or f'{te}.png' in seats)
   print(f'Total cards: {len(cards)}, Mapped to seat: {mapped}/110')
   "
   ```
3. **Verify Project TypeScript & Build Integrity**:
   ```bash
   npm run lint
   npm run build
   ```

### 5.2 Invalidation Conditions
- Any file deleted from `public/images/webtoon/episode_XX/`.
- Renaming or deletion of any portrait in `public/seat/*.png`.
- Modification of `webtoonEpisodeManifest.json` schema without updating `CinematicMoviePlayer.tsx`.
