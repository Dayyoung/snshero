# Handoff Report: Web Novel Episodes 03–40 Remediation Fix Strategy

**Agent**: `remediation_explorer_1` (Teamwork Preview Explorer)  
**Recipient**: `orchestrator_1` (Conversation ID: `b25c9f85-c96b-42a7-bce3-42d8c13e23ed`)  
**Deliverables Produced**:
1. `/Users/dayyoung/project/snshero/.agents/teamwork/remediation_explorer_1/remediation_report.md`
2. `/Users/dayyoung/project/snshero/.agents/teamwork/remediation_explorer_1/handoff.md`
**Status**: Exploration & Strategy Complete (Ready for Remediation Worker Execution)

---

## 1. Observation

Direct empirical evidence gathered during the investigation:

### 1.1 The Forensic Violation Evidence
1. **Script Origin**:
   - `scripts/build_full_40_novel.py` (lines 205–390) was identified as the root cause of the integrity violation.
   - Lines 231–233 executed blind global regex replacements:
     ```python
     action = re.sub(r"있었다\.", "타올랐다.", action)
     action = re.sub(r"않았다\.", "거두지 않았다.", action)
     action = re.sub(r"되었다\.", "펼쳐졌다.", action)
     ```
   - This corrupted Korean grammar in **129 places** (e.g. `결박펼쳐졌다`, `시작펼쳐졌다`, `함락펼쳐졌다`, `발각펼쳐졌다`, `완성펼쳐졌다`, `배달펼쳐졌다`, `포위펼쳐졌다`, `고르지 거두지 않았다`, `두지 거두지 않았다`, `들지 거두지 않았다`, `깨지지 거두지 않았다`, `답하지 거두지 않았다`) and created **194 absurd semantic clashes** (`풀이 올라오고 타올랐다`, `첫눈이 내리고 타올랐다`, `작은 천막에 누워 타올랐다`, `꽃잎을 던지며 웃고 타올랐다`).
2. **Boilerplate Repetitions**:
   - Line 226 defined the fallback sensory sentence: `"대기를 타고 흐르는 미세한 마나의 파문이 칼날처럼 팽팽한 긴장감을 자아냈다."`.
   - Running `scripts/deep_inspect_repetitions.py` confirmed this exact sentence was injected **585 times across 38 episodes** (Ep 03 through Ep 40).
   - Lines 361–380 appended a canned 4-paragraph philosophical tail block across **10 episodes** (`운명의 수레바퀴는 결코 멈추지 않고...`).
3. **Ghost Speaker Bug**:
   - In Episode 28, Ignis sacrifices himself at the climax, leaving behind only a glass ember (`유리 불씨`). Episode 29 explicitly begins: `이그니스의 죽음 다음 날...` (The day after Ignis's death).
   - Yet `scripts/build_full_40_novel.py` cycled a static dialogue pool modulo `(ep_num + scene_idx) % len(pool)`. In Episodes 29, 35, and 40, dead Ignis was injected shouting active combat quotes:
     - `public/book/episode_29.md:25`: `“카단, 네놈의 얼음 방패와 내 순백의 화염 중 어느 쪽이 더 단단한지 결판을 내자!”`
     - `public/book/episode_29.md:43`: `“루시안... 네놈이 내 아버지를 죽이고 어머니의 기억을 빼앗은 장본인이었단 말인가!”`
     - `public/book/episode_35.md:31` & `public/book/episode_40.md:55`.

### 1.2 Available High-Quality Foundational Assets
1. **Verified Masterpieces (Ep 01 & Ep 02)**:
   - `public/book/episode_01.md`: 4,060 chars, 24 lines, 5 dialogues, scored 9.20/10 by Challenger 2.
   - `public/book/episode_02.md`: 3,829 chars, 22 lines, 14 dialogues, scored 9.20/10.
   - Both are completely free of regex corruption, filler loops, and boilerplate.
2. **Pre-Existing Authentic Text for Ep 03, 04, 05**:
   - In `scripts/novel_batch1_ep01_05.py`, the developer had already authored high-grade prose:
     - `EP03_KO`: 3,074 characters (Robinyard's sacrifice, Gorgo & Belphegor duel).
     - `EP04_KO`: 2,812 characters (Kadan saving Gilgamesh on the frozen river, reunion with 6 masters).
     - `EP05_KO`: 2,466 characters (Limestone cave ambush, hearing without eyes, Silia introduction).
   - These drafts are 100% grammatically correct, dramatic, and bespoke. They only need modest scene expansion (+600–900 chars) to clear the 3,500-character threshold naturally.
3. **Canon Synopses across All 40 Episodes (`HEAD~1`)**:
   - Historical inspection of `HEAD~1` revealed that all 40 episodes have clean, coherent 1,800–2,400 character plot outlines with consistent character progression and emotional arcs.
   - In `src/content/webtoonEpisodeManifest.json`, every episode has 20 sequential scene breakdowns with specific backgrounds and characters.

---

## 2. Logic Chain

1. **Premise 1 (Failure Root Cause)**: The mechanical corruption occurred because the generator attempted to expand 1,800-character synopses to 3,750 characters using string concatenation (filler prepends, modulo canned quotes, tail padding blocks) and regex replacements instead of scene-level creative expansion.
2. **Premise 2 (Prohibited Methods)**: Per `DEAD_ENDS.md`, any repetition of mechanical regex string replacements, boilerplate sentence loops, or modulo dialogue cycling is strictly prohibited.
3. **Step 3 (Natural Character Volume Solution)**:
   - A standard Korean web novel scene with detailed sensory description, physical action, and conversational back-and-forth comprises 600–850 characters.
   - By organizing every chapter into a **5-Act Dramatic Structure**:
     - Act I: Setting & Sensory Threshold (600–750 chars)
     - Act II: Inciting Incident & Character Dialogue (700–850 chars)
     - Act III: Tactical Engagement & Sensory Struggle (800–950 chars)
     - Act IV: Emotional Aftermath & Turning Point (700–800 chars)
     - Act V: Chapter Cliffhanger & Forward Resonance (600–700 chars)
   - Every chapter naturally achieves **3,650–4,150 Korean characters** without requiring a single character of boilerplate or padding.
4. **Step 4 (Dialogue & Ghost Speaker Solution)**:
   - Dialogue must be scene-tied: attributed only to living characters present in the scene.
   - Implementing a **Deceased Character Lifecycle State Machine**:
     - Robinyard is marked deceased from Ep 04 onward (silver bell legacy).
     - Ignis is marked deceased from Ep 29 onward (present strictly as the glass ember `유리 불씨` in Kadan's pocket, reverent toasts, and silent memories).
     - In Episodes 29–40, zero direct dialogue quotes (`“...”`) can be spoken by Ignis.
5. **Step 5 (Worldbuilding Across the 11 Races)**:
   - Replacing the single fallback sentence with bespoke environmental sensory palettes tailored to the continent's 11 races (Humans, Elves, Dwarves, Orcs, Dragons, Undead, Elementals, Beastkin, Celestials, Demons, Giants/Titans) and distinct geographies (Wildlands, Lighthaven Court, Mistfall Cliffs, Wind Isle, Black Marsh, Deep Sanctum).
6. **Step 6 (Execution Feasibility)**:
   - Modular script architecture (`scripts/remediate_arc1_ep01_10.py` through `scripts/remediate_arc4_ep31_40.py` and `scripts/remediate_full_novel.py`) allows clean, maintainable generation with pre-save automated sanity checks, updating `public/book/index.json` and `englishNovelMapping.ts`.

---

## 3. Caveats

- **Scope Boundary**: This investigation is strictly read-only. No source files, markdown files, or JSON datasets were modified during this turn.
- **Engine Stability**: The Webtoon engine, Movie player (`CinematicMoviePlayer.tsx`), Audio synthesizer (`MovieAudioSynthesizer.ts`), and LocalStorage persistence (`webtoonProgress.ts`) were already verified as 100% genuine and functional by Auditor 1. Remediation must focus exclusively on the novel text files (`public/book/*.md`, `english_txt/*.txt`) and metadata sync (`index.json`).
- **English Novel Sync**: While Korean text is the primary focus, the English chapters must be updated concurrently to prevent bilingual desynchronization and eliminate raw image tags and first-person translation leaks.

---

## 4. Conclusion

The strategy detailed in `/Users/dayyoung/project/snshero/.agents/teamwork/remediation_explorer_1/remediation_report.md` provides an actionable, bulletproof roadmap for the remediation worker to rewrite Episodes 03 through 40:
1. **Preserve Ep 01 & 02** as gold-standard literary templates.
2. **Promote and expand Ep 03, 04, 05** from `novel_batch1_ep01_05.py` to exceed 3,700 chars.
3. **Author Arc 1 (Ep 06–10), Arc 2 (Ep 11–20), Arc 3 (Ep 21–30), and Arc 4 (Ep 31–40)** using the 5-Act framework, embedding the 11-race sensory palettes and organic lore keyword placements.
4. **Enforce the Deceased Character State Machine** to permanently eliminate ghost speaker bugs.
5. **Execute pre-save sanitization** to guarantee 0 regex corruptions and 0 repetitive sentences.

---

## 5. Verification Method

To independently verify the strategy and audit the forthcoming remediation:

1. **Verify Complete Absence of Dead Ends Corruptions**:
   ```bash
   git grep -n "펼쳐졌다" public/book/ | grep -E "결박펼쳐졌다|시작펼쳐졌다|함락펼쳐졌다|발각펼쳐졌다|완성펼쳐졌다|배달펼쳐졌다|포위펼쳐졌다"
   git grep -n "거두지 않았다" public/book/ | grep -E "고르지 거두지 않았다|읽지 거두지 않았다|하지 거두지 않았다|들지 거두지 않았다|깨지지 거두지 않았다"
   git grep -n "타올랐다" public/book/ | grep -E "얼어붙어 타올랐다|통로가 타올랐다|새겨져 타올랐다|내리고 타올랐다|누워 타올랐다"
   ```
   *Pass Criteria: 0 lines returned.*

2. **Verify Elimination of Boilerplate Sentence Repetitions**:
   ```bash
   python3 -c '
   import glob
   files = glob.glob("public/book/episode_*.md")
   target = "대기를 타고 흐르는 미세한 마나의 파문이 칼날처럼 팽팽한 긴장감을 자아냈다."
   matches = sum(open(f).read().count(target) for f in files)
   print(f"Occurrences of target boilerplate sentence: {matches}")
   '
   ```
   *Pass Criteria: 0 occurrences (or <= 1 in entire 40-episode series).*

3. **Verify Elimination of Ghost Speaker Ignis in Ep 29–40**:
   ```bash
   python3 -c '
   for ep in range(29, 41):
       f = f"public/book/episode_{ep:02d}.md"
       lines = open(f).readlines()
       for l in lines:
           if ("“" in l or "\"" in l) and ("이그니스" in l or "Ignis" in l):
               print(f"Ghost speaker violation in Ep {ep}: {l.strip()}")
   '
   ```
   *Pass Criteria: 0 lines returned.*

4. **Verify Volume, Dialogue & Lore Keywords**:
   ```bash
   python3 scripts/verify_novel_quality.py
   ```
   *Pass Criteria: All 40 episodes >= 3,500 chars, >= 8 dialogues, all 5 lore keywords present.*

5. **Execute Empirical Challenger Agent-as-Judge Literary Quality Audit**:
   ```bash
   python3 scripts/audit_literary_quality.py
   ```
   *Pass Criteria: Composite literary score across 9 sample episodes >= 8.5 / 10.0.*

6. **Invalidation Condition**:
   This remediation strategy is invalidated if any mechanical padding, modulo dialogue cycling, ungrammatical regex, or ghost dialogue is reintroduced in Episodes 03–40.
