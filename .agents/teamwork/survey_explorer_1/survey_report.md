# SNSHero Web Novel Comprehensive Survey Report

**Explorer**: `survey_explorer_1` (teamwork_preview_explorer)  
**Date**: 2026-10-18 (KST)  
**Target Milestone**: Web Novel Full Literary Adaptation (R1)  
**Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/survey_explorer_1/`  
**Reference Document**: `/Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md`

---

## Executive Summary

A comprehensive read-only survey of the 40-episode Web Novel implementation in SNSHero was conducted. The current novel repository is structurally intact and fully integrated into the React application (`NovelView.tsx`), but suffers from severe literary and volumetric deficiencies:

1. **Volume Deficit (100% Failure Rate)**: All 40 Korean episodes in `public/book/episode_01.md`–`episode_40.md` fail the R1 acceptance criterion of ≥ 3,500 characters. The average total length is **1,999.5 characters** (only **1,410.5 Hangul characters**), with the shortest being Episode 33 at 1,740 characters (~50% of the target volume).
2. **Dialogue Deficit (90% Failure Rate)**: 36 out of 40 episodes have fewer than 8 lines of direct dialogue. The 40 episodes average only **4.2 dialogue lines**, with Episodes 29 and 33 containing merely a single spoken line.
3. **Expository Summary Tone**: The text reads like an outline or chapter synopsis rather than dramatic fantasy fiction. Sentences ending in `~있었다` (7.2%) and `~않았다` (5.4%) dominate (~16% of total sentences), accompanied by frequent time-skips ("며칠 뒤", "그날 밤", "동이 틀 무렵") instead of real-time scene building.
4. **Degraded English Translations**: The 40 English `.txt` files in `public/book/image_narrations/english_txt/` are literal machine translations containing raw card asset tokens like `(042.png)`, gender pronoun glitches (referring to female characters as "he" or "its"), and only 2.6 dialogue lines on average.
5. **System Readiness**: The frontend viewer (`NovelView.tsx`), LocalStorage persistence, TTS audio reader, chapter navigation, and interactive lore clues (`TacticalLoreDock` / `AncientRuneAnnotation`) are fully functional and ready to accept expanded literary prose without code modifications.

---

## 1. Quantitative Inventory of Korean Episodes (`public/book/`)

The 40 episodes correspond to the 40 canonical chapters of the "Kadan & Arcane Echoes" epic (눈히어로), adapted from the Jin Yong *Legend of the Condor Heroes* narrative framework into a high/dark-fantasy setting across the 11 races of the Arcane continent.

### 1.1 Complete Metric Table (All 40 Episodes)

| Episode | Lines | Total Chars | Non-WS Chars | Hangul Chars | Dialogue Lines | Title |
|:---:|:---:|:---:|:---:|:---:|:---:|:---|
| Ep 01 | 47 | 2,421 | 1,806 | 1,710 | 5 | 눈보라 아래 두 서약 |
| Ep 02 | 43 | 2,281 | 1,700 | 1,598 | 5 | 일곱 추적자의 맹세 |
| Ep 03 | 41 | 1,976 | 1,477 | 1,391 | 3 | 안개 절벽의 피 |
| Ep 04 | 47 | 1,875 | 1,396 | 1,308 | 8 | 황야에서 자란 아이 |
| Ep 05 | 43 | 2,112 | 1,581 | 1,484 | 4 | 폭우 속의 유령 |
| Ep 06 | 43 | 2,306 | 1,715 | 1,613 | 7 | 별을 호흡하는 법 |
| Ep 07 | 43 | 2,288 | 1,720 | 1,630 | 4 | 배신자들의 천막 |
| Ep 08 | 51 | 2,184 | 1,627 | 1,524 | 8 | 붉은 갈기의 기수 |
| Ep 09 | 51 | 2,319 | 1,736 | 1,642 | 4 | 거지 옷의 바람 |
| Ep 10 | 53 | 2,411 | 1,805 | 1,694 | 7 | 불꽃 궁정의 포로 |
| Ep 11 | 43 | 2,174 | 1,630 | 1,531 | 6 | 기억을 깨우는 단검 |
| Ep 12 | 41 | 2,053 | 1,529 | 1,447 | 3 | 두 무덤 사이의 봄 |
| Ep 13 | 39 | 1,864 | 1,388 | 1,302 | 4 | 녹옥 지팡이의 주인 |
| Ep 14 | 39 | 1,934 | 1,445 | 1,358 | 6 | 안개 호수의 손님들 |
| Ep 15 | 37 | 1,999 | 1,508 | 1,424 | 2 | 독사와 사자의 밤 |
| Ep 16 | 45 | 2,057 | 1,544 | 1,439 | 8 | 폐허 앞의 형제 |
| Ep 17 | 39 | 1,912 | 1,431 | 1,346 | 3 | 바람섬의 초대장 |
| Ep 18 | 39 | 2,044 | 1,524 | 1,432 | 5 | 검은 성전의 비밀 |
| Ep 19 | 37 | 1,844 | 1,377 | 1,296 | 3 | 세 가지 시험 |
| Ep 20 | 39 | 1,919 | 1,439 | 1,349 | 5 | 꽃배를 삼킨 파도 |
| Ep 21 | 37 | 1,932 | 1,450 | 1,366 | 4 | 불타는 배의 배신 |
| Ep 22 | 39 | 1,887 | 1,416 | 1,334 | 3 | 무인도의 네 사람 |
| Ep 23 | 35 | 1,963 | 1,481 | 1,403 | 3 | 동굴 속 잠든 기록 |
| Ep 24 | 37 | 1,960 | 1,470 | 1,383 | 3 | 봉인실의 일곱 밤 |
| Ep 25 | 39 | 1,895 | 1,423 | 1,343 | 3 | 거짓 혼례의 밤 |
| Ep 26 | 35 | 1,802 | 1,370 | 1,294 | 2 | 열린 문, 닫힌 마음 |
| Ep 27 | 45 | 1,967 | 1,477 | 1,387 | 7 | 두 약속 사이 |
| Ep 28 | 45 | 2,035 | 1,525 | 1,433 | 4 | 녹옥 의회의 반란 |
| Ep 29 | 37 | 1,743 | 1,308 | 1,239 | 1 | 바람의 여왕 |
| Ep 30 | 35 | 1,861 | 1,378 | 1,303 | 4 | 네 관문의 독 |
| Ep 31 | 37 | 1,807 | 1,360 | 1,284 | 3 | 모든 것을 건 손 |
| Ep 32 | 35 | 1,869 | 1,411 | 1,337 | 2 | 첫사랑의 잔향 |
| Ep 33 | 35 | 1,740 | 1,315 | 1,245 | 1 | 검은 늪의 원한 |
| Ep 34 | 41 | 1,795 | 1,344 | 1,261 | 4 | 무너진 바람섬 |
| Ep 35 | 41 | 1,872 | 1,404 | 1,323 | 3 | 안개 속의 오인 |
| Ep 36 | 39 | 1,780 | 1,334 | 1,262 | 3 | 십자 성흔의 지도 |
| Ep 37 | 39 | 1,821 | 1,359 | 1,288 | 3 | 정복왕의 전쟁 |
| Ep 38 | 43 | 2,025 | 1,517 | 1,424 | 3 | 세 개의 비단 봉인 |
| Ep 39 | 39 | 1,967 | 1,482 | 1,399 | 2 | 지켜야 할 세계 |
| Ep 40 | 53 | 2,287 | 1,713 | 1,592 | 9 | 영웅이라 불리지 않는 자 |

### 1.2 Breakdown by Story Arc

| Arc Range | Episode Count | Avg Total Chars | Avg Hangul Chars | Avg Dialogue Lines | Dialogue Compliance (≥8) | Char Compliance (≥3500) |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Early Arc** (Ep 01–10) | 10 | 2,217.3 | 1,559.4 | 5.5 | 2 / 10 (20%) | 0 / 10 (0%) |
| **Mid Arc** (Ep 11–25) | 15 | 1,962.5 | 1,383.5 | 4.1 | 1 / 15 (6.7%) | 0 / 15 (0%) |
| **Late Arc** (Ep 26–40) | 15 | 1,891.4 | 1,338.1 | 3.4 | 1 / 15 (6.7%) | 0 / 15 (0%) |
| **Overall Series** (Ep 01–40) | **40** | **1,999.5** | **1,410.5** | **4.2** | **4 / 40 (10.0%)** | **0 / 40 (0.0%)** |

**Observation**: As the narrative progresses from Early to Late arcs, the prose suffers from increasing compression and dialogue starvation. Late-arc chapters drop to an average of just 3.4 dialogue lines, leaving climactic story turns (such as the fall of the Wind Isle and the final confrontation with the Conqueror King Fenrir) described in dry summary paragraphs.

---

## 2. Literary Style & Narrative Quality Analysis

### 2.1 Narrative Distance & "Tell vs. Show"
The legacy text operates from an extreme high-altitude omniscient perspective. Rather than placing the reader inside the immediate sensory reality of the characters, key events and character interactions are compressed into fast summaries:
- *Example from Episode 1*: `오해가 풀린 뒤 세 사람은 새벽까지 왕국의 형편을 논했다.` (Tells the reader they talked, omitting the philosophical and political clash between Hercul, Aleksandar, and Balian).
- *Example from Episode 1*: `루시안이 알렉산다르의 아내 엘윈을 만났다. 그는 다친 여행객처럼 꾸미고 있었지만... 엘윈이 내민 따뜻한 수프 한 그릇과 친절한 말 몇 마디는 루시안의 욕망을 일깨웠다. 그는 그녀를 차지하려고 마을 전체를 반역자의 소굴로 꾸몄다.` (In two sentences, an entire deception and political betrayal is summarized without dialogue or psychological tension).
- *Example from Episode 20*: `이그니스는 처음으로 두려움을 숨기지 않았다. 부모의 죽음, 루시안의 목소리, 왕좌를 잃는 공포를 하나씩 입 밖에 냈다.` (Summarizes what should be an emotional emotional breakdown between brothers).

### 2.2 Stylistic Tropes & Repetitive Endings
Analysis of all 2,447 sentences across the 40 episodes revealed heavy syntactic repetition:
- `~있었다` (176 occurrences, 7.2% of all sentences)
- `~않았다` (133 occurrences, 5.4% of all sentences)
- `~못했다` (41 occurrences, 1.7% of all sentences)
- `~없었다` (36 occurrences, 1.5% of all sentences)
Combined, these four passive/declarative endings account for **15.8% of all sentences**.

Additionally, scene transitions rely heavily on robotic formulaic phrases:
- `그날 밤` (12 times), `다음 날` (10 times), `동이 틀 무렵` (2 times), `며칠 뒤` (1 time).

### 2.3 Worldbuilding & Sensory Texture
The Arcane continent contains 11 distinct races and element-based kingdoms (Water, Fire, Air, Earth, Human, Undead, Elf, Dwarf, Monster, Robot, Dragon). However, in the legacy summaries:
- Sensory descriptions (the metallic tang of ozone in a blizzard, the scent of burning resin, the guttural cadence of dwarven war chants, the cold blue glow of magitech conduits) are almost completely absent.
- Combat is described in brief mechanical assertions (`창끝이 그의 목에 닿았다`, `다리의 밧줄 하나를 끊었다`) with zero choreography, stance tension, or tactical mana expenditure.

---

## 3. Metadata & Cross-System Synchronization (`public/book/index.json`)

### 3.1 Structure of `public/book/index.json`
- `seriesId`: `"nunhero-book-v1"`
- `titleKo`: `"눈히어로"`
- `episodeCount`: `40`
- `totalCharacters`: `79981` (Exact sum of all 40 legacy markdown files)
- `protagonists`:
  - Kadan (#41, Human)
  - Silia (#62, Elf)
  - Ignis (#11, Fire)
- `characters`: Array of 34 major characters with `cardId`, `cardName`, `image`, `episodeNumbers`, and `mentionCount`.
  - Highest mention count: Kadan (434 mentions across all 40 episodes).
  - Silia (265 mentions across 34 episodes).
  - Ignis (188 mentions across 28 episodes).
  - Aeolus (78 mentions across 19 episodes).
  - Lucian (72 mentions across 27 episodes).
  - Medusa Gorgo (57 mentions across 15 episodes).
  - Hercul (45 mentions across 12 episodes).
  - Fenrir (47 mentions across 10 episodes).
- `episodes`: Array of 40 objects with `episodeNumber`, `titleKo`, `sourceRange`, `file`, and `characterCount`.

### 3.2 Synchronization Verification
- Automated cross-check confirmed **100% alignment** between `episode_XX.md` `# 눈히어로 XX화 - [제목]` headers and `index.json` `titleKo` attributes.
- `characterCount` in `index.json` matches byte-for-byte with the current file lengths.
- **Required Action Upon Expansion**: When episodes are rewritten to ≥ 3,500 characters, `index.json` must be updated with the new `characterCount` values, the new `totalCharacters` total (~140,000–165,000+ characters), and updated `mentionCount` tallies for all 34 indexed characters.

---

## 4. English Novel Implementation (`englishNovelMapping.ts` & `english_txt/`)

### 4.1 Structure and Mapping
- `src/content/englishNovelMapping.ts` contains `ENGLISH_NOVEL_MAP: Record<number, EnglishEpisodeInfo>` with keys `1` to `40`.
- Each entry defines `fileName` (pointing to `public/book/image_narrations/english_txt/SNSHero_Novel_Episode_XX_..._EN.txt`) and `titleEn`.
- All 40 English titles match 1:1 with `webtoonEpisodeManifest.json` and `movieEpisodeMapping.ts`.

### 4.2 English Translation Quality Assessment
The existing English `.txt` files were analyzed:
- Average word count: **789.9 words**.
- Average characters: **4,879.9 characters**.
- Average dialogue lines: **2.6 lines** (episodes like Ep 07 contain 0 lines of dialogue).
- **Embedded Asset Artifacts**: Every English file contains raw card image tags injected directly into sentences (e.g. `Elwin(042.png)`, `Aleksandar(050.png)`, `[Aleksandar(050.png), Balian(043.png)]`).
  - While `NovelView.tsx` has regexes to strip these (`clean.replace(/\(\d{3}\.png\)/g, '')`), having raw image tokens in literary source files degrades source integrity.
- **Machine Translation Glitches**:
  - First-person slip in third-person narrative: *"The wounds on my shoulders and thighs increased as I was doing things that would have been quick to cut."* (Episode 01, Line 28).
  - Dehumanizing pronouns for main characters: *"Ysela(107.png) crawled under the carriage, covering its stomach, but Lucian(061.png) personally grabbed the reins and stopped it."* (Episode 01, Line 34).
  - Gender inversion: *"He put the broken sword sheath... and buried the wheat seeds..."* referring to mother Elwin (Episode 01, Line 40).
- **Required Action**: The English episodes must be thoroughly adapted in parallel with the Korean expansion into authentic commercial-grade fantasy fiction, with proper character pronouns, natural dialogue cadence, and zero raw `(XXX.png)` image tokens.

---

## 5. Web Application Integration (`src/views/NovelView.tsx`)

### 5.1 Architecture & Parsing Pipeline
- **Asynchronous Fetching**: `NovelView.tsx` dynamically loads markdown files on demand (`/book/episode_${epPad}.md` for Korean, `/book/image_narrations/english_txt/${enInfo.fileName}` for English).
- **Zero Truncation Guarantee**:
  - The markdown parser (`parsedContent` memo, lines 470–541) reads the full file string. It extracts the `# ` line as `title`, the `> ` line as `sourceRange`, and maps all remaining blocks separated by empty newlines into `bodyParagraphs: string[]`.
  - There are no character limits, line caps, or slicing arrays in the rendering pipeline. The view will naturally render 3,500+, 6,000+, or 10,000+ characters with identical performance.
- **TTS Compatibility**:
  - TTS reads paragraph by paragraph via `SpeechSynthesisUtterance`.
  - In Korean web novel formatting, direct character dialogues (`“...”`) should each sit in their own paragraph separated by a blank line. This allows the reader to click directly on a piece of dialogue to hear it voiced.

### 5.2 Critical In-Game Lore Hooks
`NovelView.tsx` and related stores contain interactive gameplay mechanisms tied directly to novel text:
1. **Tactical Lore Dock / Ancient Rune Annotation (`TacticalLoreAnnotation.tsx` & `loreRecruitmentStore.ts`)**:
   - The system scans the novel narrative for 5 ancient relic keywords:
     - `은빛 단검` (Silver Dagger given by Hercul to Kadan & Ignis)
     - `알렉산다르` (Aleksandar's broken sheath and wheat seeds)
     - `발리안` (Balian's arcane spear fragment)
     - `이그니스` (Ignis's flame core)
     - `실리아` (Silia's protective locket)
   - When 3 clues are discovered, the player permanently unlocks **#041 [SSR] 카단 (Kadan)** into their card deck.
   - **Constraint**: During the literary rewrite, these exact key artifacts and character names MUST remain clearly woven into the prose.
2. **Secret Artifact Decryption Modal (`SecretArtifactDecryptionModal.tsx`)**:
   - Triggered when the user scrolls past 95% of an episode.
3. **Mount Taming Widget (`CrimsonManeTamingWidget.tsx`)**:
   - Connected with Episode 08 ("붉은 갈기의 기수") to tame the Crimson Mane steed and award a permanent +1 initiative buff.
4. **Card Wiki Integration (`WikiCardDetailModal.tsx`)**:
   - Featured characters in the episode header link directly to their in-game card wiki profiles.

---

## 6. Gap Analysis Against R1 Acceptance Criteria

| Acceptance Criterion | Required Benchmark | Current Status | Deficit / Evaluation |
|---|---|---|---|
| **Episode Length** | Every Korean episode ≥ 3,500 characters | Average: 1,999.5 chars (Min: 1,740, Max: 2,421) | **100% Deficient (0/40 pass)**. Current episodes are ~50% of minimum required volume. |
| **Dialogue Frequency** | Every Korean episode ≥ 8 lines of direct dialogue (`“...”`) | Average: 4.2 lines (Min: 1, Max: 9) | **90% Deficient (4/40 pass)**. 36 episodes fail. Ep 29 & Ep 33 have only 1 dialogue line. |
| **Literary Depth & Prose Quality** | Immersive dark/high fantasy fiction, sensory worldbuilding across 11 races, emotional stakes | Dry third-person summary, heavy fast-forwarding, ~16% repetitive sentence endings | **Major Deficit**. Needs complete creative rewrite from plot outline into rich literature. |
| **English Translation** | Natural commercial-grade English fantasy, synced with Korean | Machine translation, embedded `(042.png)` tokens, pronoun glitches | **Major Deficit**. Requires rewriting and literary polish. |
| **Metadata Synchronization** | `index.json`, `englishNovelMapping.ts` synchronized | Titles match; `characterCount` (79,981) reflects legacy counts | **Action Required**. Must run automated sync script upon completion of rewrite. |
| **File Integrity & Truncation** | 0 corrupted, 0 truncated files | All 40 Korean and 40 English files exist and parse cleanly | **PASS**. Clean baseline structure with no file corruption. |
| **Interactive Clue Preservation** | Lore recruitment keywords (`은빛 단검`, etc.) present | Present in legacy files | **PASS / WATCHPOINT**. Must be strictly maintained in rewritten text. |

---

## 7. Concrete Technical Recommendations & Architecture for Stream

### 7.1 Authoring & Generation Stream Architecture
To execute the rewrite of all 40 episodes while maintaining absolute narrative consistency, stylistic cohesion, and game lore synchronization, the work should be structured in structured batches:

1. **Batch 1: Early Arc (Episodes 01–10)**:
   - Origins of the dual vows in the blizzard, the fall of Elwin village, the vow of the 7 pursuers, Kadan raised in the Wildlands among Fenrir's clans, learning the Art of Breathing Stars, and Ignis captive in the Flame Court.
2. **Batch 2: Mid Arc (Episodes 11–25)**:
   - The memory-awakening dagger, encounter with Silia of the Wind Isle, the trial of the jade staff, the duel on the burning ship, the deserted island survival, and the false wedding.
3. **Batch 3: Late Arc (Episodes 26–40)**:
   - The rebellion of the Jade Council, the four poisons, the clash with Death Knight Artus, Conqueror King Fenrir's grand campaign, the three silk seals, and the final philosophical resolution ("One Who Is Not Called a Hero").

### 7.2 Strict Literary Standards per Episode
Every rewritten Korean episode must strictly satisfy:
- **Length**: Minimum **3,500 to 4,200+ Korean characters** (including whitespace; ~2,600+ Hangul characters without spaces).
- **Dialogue**: Minimum **8 to 15+ lines of authentic dialogue**, formatted with standard Korean quotation marks (`“...”`), giving each character a distinct voice (Hercul's stern chivalric cadence, Grimli's blunt dwarven humor, Silia's sharp wit, Kadan's understated honesty, Ignis's burning conflict).
- **Sensory Worldbuilding**: At least 3 vivid sensory anchors per episode (smell of burning frost-fir, sound of obsidian crossbow ratchets, taste of ash-steeped tea, visual radiance of elemental mana).
- **Combat Choreography**: Detailed exchange of techniques and tactical counters (reflecting card attributes like SHIELD, WALL, COUNTER, PIERCE).
- **Paragraph Cadence**: Varied sentence structures; elimination of repetitive `~있었다 / ~것이었다 / ~뿐이었다` sentence chains.

### 7.3 Automated Verification Script (`scripts/verify_novel_quality.py`)
A dedicated Python verification script should be provided to ensure zero regressions:
```bash
python3 scripts/verify_novel_quality.py
```
Checks performed:
1. `public/book/episode_01.md` through `episode_40.md` exist and contain ≥ 3,500 characters.
2. Direct dialogue lines (`“...”` or `"..."`) ≥ 8 in each file.
3. No raw card tags (`(XXX.png)`) or broken markdown headers.
4. Essential lore keywords (`은빛 단검`, `알렉산다르`, `발리안`, `이그니스`, `실리아`) verified present.
5. `public/book/index.json` character counts and total characters re-calculated and verified.
6. English files in `public/book/image_narrations/english_txt/` verified present, non-empty, and synchronized.

### 7.4 English Parallel Stream
Following or alongside each Korean batch:
- Adapt the expanded Korean episode into polished, publication-ready English prose.
- Clean out all legacy `(XXX.png)` image tags.
- Verify natural pronouns, idiomatic fantasy vocabulary, and character dialogue cadence.
- Keep titles in `englishNovelMapping.ts` strictly synchronized.

---

## 8. Conclusion

The SNSHero web novel infrastructure in `src/views/NovelView.tsx` is robust, responsive, and beautifully integrated with game progression and audio TTS. However, the literary content itself is fundamentally incomplete — consisting of 40 short synopses (~2,000 chars, ~4 dialogues) rather than genuine web novel episodes.

Conducting a complete literary expansion to ≥ 3,500 characters and ≥ 8 dialogues per episode across all 40 episodes will elevate the SNSHero IP trilogy to commercial-grade storytelling, dramatically improving user engagement, session duration, and worldbuilding depth.
