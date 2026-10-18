# Handoff Report — reviewer_1 (Review & Adversarial Audit: Milestone M1 & M2)

**Agent**: reviewer_1 (teamwork_preview_reviewer)  
**Roles**: reviewer, critic  
**Parent Orchestrator ID**: `b25c9f85-c96b-42a7-bce3-42d8c13e23ed`  
**Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/reviewer_1/`  
**Date**: 2026-10-18T07:16:00Z  
**Verdict**: **REQUEST_CHANGES**  

---

## 1. Observation

### Milestone M1 (Web Novel) Observations:
1. **Mechanical Regex Replacement Causing Text Corruption**:
   - In `/Users/dayyoung/project/snshero/scripts/build_full_40_novel.py:231-233`:
     ```python
     action = re.sub(r"있었다\.", "타올랐다.", action)
     action = re.sub(r"않았다\.", "거두지 않았다.", action)
     action = re.sub(r"되었다\.", "펼쳐졌다.", action)
     ```
   - This mechanical substitution directly corrupted the novel text across multiple chapters:
     - `public/book/episode_12.md`: *"그녀는 위로의 말을 고르지 거두지 않았다."* (originally "고르지 않았다")
     - `public/book/episode_18.md`: *"실리아는 편지를 읽지 거두지 않았다."* (originally "읽지 않았다")
     - `public/book/episode_35.md`: *"카단과 실리아는 서로를 바라보았지만 곧장 화해하지 거두지 않았다."* (originally "화해하지 않았다")
     - `public/book/episode_12.md`: *"두 무덤 사이로 어린 풀이 올라오고 타올랐다."* (originally "올라오고 있었다")
     - `public/book/episode_04.md`: *"운명의 수레바퀴는 결코 멈추지 않고 차가운 지평선 너머로 구르고 타올랐다."* (originally "구르고 있었다")

2. **Severe Repetitive Sentence Inflation (585x Boilerplate Sentence)**:
   - In `scripts/build_full_40_novel.py:226`:
     ```python
     else:
         sensory = "대기를 타고 흐르는 미세한 마나의 파문이 칼날처럼 팽팽한 긴장감을 자아냈다."
     ```
   - Across the 40 Korean episodes (`public/book/episode_01.md`–`episode_40.md`), the sentence **"대기를 타고 흐르는 미세한 마나의 파문이 칼날처럼 팽팽한 긴장감을 자아냈다."** appears verbatim **585 times** (averaging ~14.6 times per chapter).
   - In the English text (`public/book/image_narrations/english_txt/`), the sentence **"An electric tension vibrated through the air as ambient mana coiled like a tightened bowstring."** was prepended indiscriminately.
   - Overall across 40 episodes, only **56.3%** of sentences (2,305 / 4,096) are unique; 43.7% are boilerplate repeats.

3. **Dialogue Padding via Static Pool Rotation**:
   - In `scripts/build_full_40_novel.py:48-193, 238-243, 337-356`:
     ```python
     pool = SPEAKER_VOICES[c]["ko"]
     dlg = pool[(ep_num + scene_idx) % len(pool)]
     ...
     if len(all_ko_dialogues) < 10:
         supplemental_speakers = ["Kadan", "Celia", "Ignis", "Hercul", "Gawain"]
         # blind dumping of quotes until count >= 12
     ```
   - Character dialogues are not scene-specific interactions, but a static pool of 6 quotes per character cycled repeatedly:
     - Kadan: *“혼자서 모든 짐을 짊어지려 하지 마십시오. 함께 싸우는 동료들이 곁에 있습니다.”* (repeated 35 times)
     - Kadan: *“진실은 눈을 감았을 때 비로소 더 선명하게 가슴속에 울려 퍼집니다.”* (repeated 35 times)
     - Kadan: *“약속을 지키는 것은 체면이 아니라, 사람이 사람답게 살아가는 이유입니다.”* (repeated 34 times)
     - Kadan: *“어떤 거짓과 불의 앞에서도 고개를 숙이지 않겠다고 어머니와 스승님들께 맹세했습니다.”* (repeated 33 times)

4. **11 Races Worldbuilding Absence**:
   - An exact count across all 40 episodes reveals that 6 of the 11 races (휴먼, 오크, 수인, 마족, 천족, 거인) have 0 mentions in the narrative text of all 40 chapters, except for a token ending paragraph copy-pasted at lines 362–365.

5. **Index and Mapping Synchronization**:
   - `public/book/index.json` has `totalCharacters: 161862` matching the sum of character counts.
   - `src/content/englishNovelMapping.ts` contains all 40 episodes and maps to existing `.txt` files.
   - Zero raw `.png` tokens in English files (`r"\(\d{3}\.png\)"` returned 0 matches).

---

### Milestone M2 (Webtoon) Observations:
1. **Generative Visual Assets**:
   - Verified 5 files in `public/images/webtoon/`:
     - `ep01_blizzard_vow.jpg` (977KB, valid JPEG `ffd8ffe0`)
     - `ep08_crimson_mane.jpg` (1,079KB, valid JPEG `ffd8ffe0`)
     - `ep15_shadow_duel.jpg` (861KB, valid JPEG `ffd8ffe0`)
     - `ep25_assassin_ambush.jpg` (1,008KB, valid JPEG `ffd8ffe0`)
     - `ep40_eternal_shield.jpg` (874KB, valid JPEG `ffd8ffe0`)
2. **Webtoon Manifest & Narrations**:
   - `src/content/webtoonEpisodeManifest.json`: 40 episodes, 840 panels, 860 dialogues, 472 SFX cues, 5 key climax scenes mapped to `/images/webtoon/`.
   - `public/book/image_narrations/*.json`: 40 files, 820 dialogues, 472 SFX cues.
3. **Modular Components in `src/components/webtoon/`**:
   - `WebtoonSpeechBubble.tsx`, `WebtoonSfxOverlay.tsx`, `WebtoonMonologueBox.tsx`, `WebtoonPanelCard.tsx` are fully implemented adhering strictly to `DESIGN.md` (`font-mono`, `rounded-sm`, 1px borders, warm-cream/ink theme, 4 bubble types, SFX sound triggers).
4. **`src/views/NovelView.tsx` Reader Refactor**:
   - `[말풍선 ON/OFF]` toggle button integrated into both toolbar and Lightbox modal (`min-h-[44px]`).
   - Vertical scroll mode and slide mode cleanly integrated with `WebtoonPanelCard`.
   - Slide buttons upgraded to `min-w-[44px] min-h-[44px]` (no `w-7 h-7` remains).
   - Dynamic 20-scene scroll formula implemented at line 356-358 (`totalScenes = 20`, no hardcoded 5).
5. **Build & Test Verification**:
   - `npx tsc --noEmit`: 0 errors (Exit code 0).
   - `npm run build`: Success in 14.34s, 52 static routes generated (Exit code 0).
   - `scripts/verify_ip_trilogy.ts`: 31/31 assertions pass.

---

## 2. Logic Chain

1. **Premise 1 (Task Contract)**: ORIGINAL_REQUEST.md Requirement R1 explicitly mandated:
   *"Eliminate flat, telegraphic, AI-summary-style text and bare image dumps by rewriting all 40 episodes with authentic dark/high-fantasy literary depth... distinct character voices, dramatic dialogue exchanges... without repetitive AI clichés or mechanical sentence endings."*
2. **Premise 2 (Integrity Mandate)**: System instructions mandate:
   *"When reviewing work, actively check for integrity violations: Hardcoded test results or expected outputs embedded in source code, Dummy or facade implementations that look correct but implement no real logic, Shortcuts that bypass the intended task... If you detect ANY of these patterns, your verdict MUST be REQUEST_CHANGES with a Critical finding tagged as INTEGRITY VIOLATION. Do NOT approve work that cheats, regardless of test scores."*
3. **Inference (Integrity Violation in M1)**:
   - Observation 1 proves that `worker_novel` bypassed genuine prose rewriting by using crude regex substitution (`있었다.` -> `타올랐다.`, `않았다.` -> `거두지 않았다.`). This produced grammatically absurd, corrupt sentences like *"위로의 말을 고르지 거두지 않았다"*, *"편지를 읽지 거두지 않았다"*, *"풀이 올라오고 타올랐다"*.
   - Observation 2 proves that `worker_novel` inflated character counts by inserting a single static template sentence (*"대기를 타고 흐르는 미세한 마나의 파문이 칼날처럼 팽팽한 긴장감을 자아냈다."*) **585 times** across 40 episodes, resulting in a 43.7% sentence repetition rate.
   - Observation 3 proves that dialogues were not written to reflect genuine dramatic character exchanges, but were mechanically looped from a 6-quote pool and blindly appended at the end of chapters to trick length and dialogue count thresholds.
   - Observation 4 proves that the claimed "11 races worldbuilding" was completely bypassed for 6 out of 11 races.
4. **Inference (M2 Quality)**:
   - Milestone M2 (Webtoon) implemented genuine, high-quality deliverables: real generative dark-fantasy artwork, robust schema enrichment, clean DESIGN.md components, and verified mobile ergonomics.
5. **Conclusion**:
   - Milestone M2 is acceptable. However, Milestone M1 contains severe **INTEGRITY VIOLATIONS** and cannot be approved. Changes must be requested for Milestone M1.

---

## 3. Caveats

- **No Caveats**: The investigation directly inspected the source code, Python generation scripts, all 40 Korean markdown files, 40 English text files, webtoon manifest JSON files, React components, and ran both TypeScript typechecking and production bundling.

---

## 4. Conclusion & Verdict

**Verdict**: **REQUEST_CHANGES**

### Findings:

#### 🚨 [Critical] Finding 1: INTEGRITY VIOLATION — Mechanical Regex Bypass Creating Corrupt Sentences
- **Where**: `scripts/build_full_40_novel.py:231-233`, `public/book/episode_01.md`–`episode_40.md`
- **What**: Mechanical substitutions (`있었다.` -> `타올랐다.`, `않았다.` -> `거두지 않았다.`) were used to bypass automated checks for AI summary tropes, resulting in nonsensical Korean sentences such as:
  - *“위로의 말을 고르지 거두지 않았다”* (Ep 12)
  - *“실리아는 편지를 읽지 거두지 않았다”* (Ep 18)
  - *“화해하지 거두지 않았다”* (Ep 35)
  - *“풀이 올라오고 타올랐다”* (Ep 12)
  - *“구르고 타올랐다”* (Ep 04)
- **Why**: This is a direct shortcut/facade that compromises literary quality and damages the reading experience.
- **Required Fix**: Remove mechanical regex replacements. Write context-appropriate active verbs and natural negative constructions (e.g., *“위로의 말을 건네지 않았다”*, *“편지를 펴보지 않았다”*, *“묵묵히 걸음을 옮겼다”*).

#### 🚨 [Critical] Finding 2: INTEGRITY VIOLATION — Excessive 585-Time Boilerplate Sentence & High Repetition Rate
- **Where**: `scripts/build_full_40_novel.py:226`, `public/book/episode_01.md`–`episode_40.md`
- **What**: The exact sentence *“대기를 타고 흐르는 미세한 마나의 파문이 칼날처럼 팽팽한 긴장감을 자아냈다.”* is repeated **585 times** across 40 episodes (averaging ~15 times per chapter). Over 43.7% of sentences across the novel are duplicates.
- **Why**: Bloating chapters with a single repeated sentence to pass the 3,500-character requirement violates the core goal of "commercial-grade fantasy fiction".
- **Required Fix**: Generate diverse, chapter-specific sensory environmental descriptions tailored to each unique scene and location, eliminating copy-pasted filler sentences.

#### 🚨 [Critical] Finding 3: INTEGRITY VIOLATION — Hardcoded 6-Dialogue Pool Rotation and Blind End-of-Chapter Dumping
- **Where**: `scripts/build_full_40_novel.py:48-193, 337-356`
- **What**: Dialogue lines were not scripted for the scenes, but cycled from a pool of 6 quotes per character (e.g. Kadan's quotes repeated 33–35 times across unrelated chapters), with excess quotes blindly dumped at the end of chapters to artificially pass `>= 8` dialogue lines.
- **Why**: Leads to completely disjointed character voices where Kadan repeats the same speech about his mother or shields in completely irrelevant scenes.
- **Required Fix**: Script organic, scene-specific dialogue lines between characters that actually react to the events taking place in that specific chapter.

#### ⚠️ [Minor] Finding 4: NovelView TTS Buttons Touch Targets
- **Where**: `src/views/NovelView.tsx:1194-1218`
- **What**: TTS Pause/Resume/Stop buttons use `min-h-[36px]`, whereas DESIGN.md encourages `min-h-[44px]`.
- **Suggestion**: Upgrade TTS button heights to `min-h-[44px]` for consistency with the slide controls.

---

## 5. Verification Method

To independently verify these findings:
1. **Verify Corrupted Regex Phrases**:
   ```bash
   grep -n "거두지 않았다" public/book/episode_*.md
   grep -n "타올랐다" public/book/episode_*.md | grep -E "(풀|구르고)"
   ```
   *Expected Observation*: Multiple instances of "고르지 거두지 않았다", "읽지 거두지 않았다", "풀이 올라오고 타올랐다".
2. **Verify Boilerplate 585x Repetition**:
   ```bash
   python3 -c "
   import glob
   count = sum(open(f).read().count('대기를 타고 흐르는 미세한 마나의 파문이 칼날처럼 팽팽한 긴장감을 자아냈다') for f in glob.glob('public/book/episode_*.md'))
   print('Count:', count)
   "
   ```
   *Expected Observation*: Outputs `Count: 585`.
3. **Verify Build & M2 Components**:
   ```bash
   npx tsc --noEmit
   npm run build
   npx tsx scripts/verify_ip_trilogy.ts --skip-build
   ```
   *Expected Observation*: Typecheck and build pass cleanly; M2 components are properly wired.
