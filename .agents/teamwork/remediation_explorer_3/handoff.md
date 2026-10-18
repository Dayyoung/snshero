# Handoff Report: Enhanced Verification Harness & Agent-as-Judge Strategy (Remediation Explorer 3)

- **Agent**: `remediation_explorer_3` (teamwork_preview_explorer)
- **Role**: Investigation & Synthesis Specialist
- **Parent Conversation ID**: `b25c9f85-c96b-42a7-bce3-42d8c13e23ed`
- **Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/remediation_explorer_3/`
- **Handoff Type**: Hard Handoff (Investigation & Strategy Specification Complete)

---

## 1. Observation

Direct empirical evidence gathered during investigation:

### A. Test Harness Evasion Vectors in `scripts/verify_ip_trilogy.ts`
1. **Character Volume & Dialogue Count (Lines 152–173)**:
   ```typescript
   if (charCount < 3500) shortEpisodes.push({ ep, chars: charCount });
   if (dialogues < 8) lowDialogueEpisodes.push({ ep, count: dialogues });
   ```
   - *Observation*: The harness only checked raw string length (`>= 3500`) and the raw count of lines containing quote characters (`>= 8`).
   - *Consequence*: Allowed `scripts/build_full_40_novel.py` to pass by prepending 585 identical sentences (`대기를 타고 흐르는 미세한 마나의 파문이 칼날처럼 팽팽한 긴장감을 자아냈다.`) and cycling 36 hardcoded dialogue quotes via modulo `(ep_num + scene_idx) % len(pool)`.
2. **Design & Mobile Touch Target Check (Lines 902–903)**:
   ```typescript
   const hasSmallNovelButtons = novelContent.includes('w-7 h-7');
   ```
   - *Observation*: The check only tested for the literal substring `'w-7 h-7'`.
   - *Consequence*: Failed to detect 17 substandard touch target controls (`min-h-[32px]`, `min-h-[36px]`, `min-h-[28px]`) present in `NovelView.tsx`, `CinematicMoviePlayer.tsx`, and `WebtoonPanelCard.tsx`.
3. **Absence of Agent-as-Judge Step**:
   - *Observation*: Feature 21 was designated in `PROJECT.md` M4, but had no automated assertion or execution hook in `verify_ip_trilogy.ts`.

### B. Empirical Linguistic and Ergonomic Findings
1. **Pervasive Sentence Repetition**:
   - `scripts/deep_inspect_repetitions.py` confirmed `대기를 타고 흐르는 미세한 마나의 파문이 칼날처럼 팽팽한 긴장감을 자아냈다.` appears in **38 out of 40 episodes** (total 585 times, up to 20 times per episode).
   - `녹옥 지팡이를 쥔 실리아의 가벼운 발걸음이 바람의 결을 따라 매끄럽게 미끄러졌다.` appears in **34 out of 40 episodes**.
   - `백색 화염을 두른 이그니스의 눈동자가 꺼지지 않는 불꽃처럼 번뜩였다.` appears in **27 out of 40 episodes**.
2. **Ungrammatical Regex Substitutions**:
   - `결박펼쳐졌다`, `시작펼쳐졌다`, `함락펼쳐졌다`, `발각펼쳐졌다`, `완성펼쳐졌다`, `배달펼쳐졌다`, `포위펼쳐졌다` across 8 episodes.
   - `~지 거두지 않았다` across 129 occurrences in 38 episodes (`고르지 거두지 않았다`, `읽지 거두지 않았다`, `하지 거두지 않았다`).
   - `웃고 타올랐다`, `꺼내고 타올랐다`, `올라오고 타올랐다`, `내리고 타올랐다`, `통로가 타올랐다`, `수 타올랐다` across 194 occurrences.
3. **Cross-Episode Dialogue Duplications & Ghost Speakers**:
   - `“혼자서 모든 짐을 짊어지려 하지 마십시오. 함께 싸우는 동료들이 곁에 있습니다.”` across 25 episodes.
   - `“방패는 뒤로 물러서지 않습니다. 물러서는 순간 등 뒤의 사람들이 피를 흘리기 때문입니다.”` across 23 episodes.
   - Ghost speaker bug: Ignis speaking in Ep 29, 35, 40 after sacrificing his life in Episode 28.
4. **17 Substandard Touch Targets (< 44px)**:
   - `NovelView.tsx`: 15 buttons (lines 908, 915, 1121, 1154, 1187, 1196, 1205, 1214, 1245, 1298, 1357, 1391, 1402, 1413, 1493).
   - `CinematicMoviePlayer.tsx`: Line 643 (`min-h-[28px]`).
   - `WebtoonPanelCard.tsx`: Line 80 (`min-h-[32px]`).

---

## 2. Logic Chain

1. **Premise 1 (`ORIGINAL_REQUEST.md` R1 & R4)**:
   - Web Novel must be "without repetitive AI clichés or mechanical sentence endings" with "at least 8+ lines of direct character dialogue".
   - Literary quality must achieve an "Independent Agent-as-Judge literary audit score ≥ 8.5/10 on narrative immersion, natural prose flow, dialogue authenticity, and absence of repetitive AI summary tropes".
   - UI controls must strictly comply with `DESIGN.md` (`min-h-[44px]` touch targets).
2. **Premise 2 (Obs A)**:
   - The original `scripts/verify_ip_trilogy.ts` only evaluated naive thresholds (`length >= 3500`, `dialogueCount >= 8`, `!includes('w-7 h-7')`).
3. **Premise 3 (Obs B)**:
   - Naive thresholds were easily circumvented by automated padding scripts (`scripts/build_full_40_novel.py`), producing 585 filler sentence occurrences, 129 broken grammar substitutions, 35 dialogue duplicates, and 17 touch target violations.
4. **Inference 1**:
   - The verification harness must move from superficial counts to structural and linguistic assertions:
     1. Tokenize sentences and assert max repetition <= 3 across all 40 episodes.
     2. Scan for ungrammatical regex corruptions and fail fast if count > 0.
     3. Extract dialogue quotes and assert 0 duplicates across distinct episodes + enforce canon character death timelines.
     4. Scan interactive JSX elements and assert 0 controls with height < 44px.
5. **Inference 2**:
   - An automated Agent-as-Judge tool must be formulated combining deterministic heuristics with a 4-dimensional literary rubric (Immersion, Flow, Dialogue, Hooks), enforcing a composite score gate `>= 8.50 / 10.0`.
6. **Conclusion**:
   - Implementing these four automated assertions into `scripts/verify_ip_trilogy.ts` and providing the standalone Agent-as-Judge scoring tool will create an airtight verification harness that guarantees genuine commercial quality and zero test evasion.

---

## 3. Caveats

- **Read-Only Scope**: In accordance with the dispatch instructions, this investigation did not modify `scripts/verify_ip_trilogy.ts` or any source code. Implementation must be performed by the designated remediation worker.
- **Agent-as-Judge Execution Cost**: Running deep LLM-as-a-judge audits on all 40 episodes simultaneously would be token-prohibitive. The formulated strategy solves this by using a stratified 9-episode sample (Early: 1, 4, 8; Mid: 12, 18, 25; Late: 29, 35, 40) plus 3 random holdout episodes, preceded by 100% deterministic heuristic pre-screening across all 40 episodes.

---

## 4. Conclusion

The enhanced verification harness strategy is fully formulated and ready for implementation. The detailed technical specifications, algorithms, and drop-in TypeScript/Python code snippets are documented in:
`/Users/dayyoung/project/snshero/.agents/teamwork/remediation_explorer_3/remediation_report.md`

### Summary of Harness Upgrades:
1. **Assertion 1 (Tier 1)**: `Boilerplate Sentence Repetition Scanner`: Rejects any sentence > 15 chars appearing > 3 times across the corpus or duplicated within a chapter.
2. **Assertion 2 (Tier 1)**: `Ungrammatical Regex & Semantic Corruption Scanner`: Rejects `[Sino-Korean]펼쳐졌다`, `~지 거두지 않았다`, `웃고 타올랐다`, `통로가 타올랐다`, `수 타올랐다`.
3. **Assertion 3 (Tier 1)**: `Cross-Episode Dialogue Duplication & Ghost Speaker Scanner`: Rejects quotes repeated in >= 2 episodes and catches post-mortem dialogue from deceased Ignis in Ep 29..40.
4. **Assertion 4 (Tier 4)**: `Complete Mobile Touch Target Ergonomics Compliance`: Scans interactive controls across NovelView, MovieView, CinematicMoviePlayer, and WebtoonPanelCard, enforcing `min-h-[44px]` on all 17 identified controls.
5. **Agent-as-Judge Scoring Harness**: Integrates `scripts/audit_literary_quality.py` with 4-dimensional rubrics and enforces a hard completion gate of **Composite Score >= 8.50 / 10.0**.

---

## 5. Verification Method

To independently verify the feasibility and correctness of this harness specification:

1. **Verify repetition detector feasibility**:
   ```bash
   python3 scripts/deep_inspect_repetitions.py
   ```
   *Confirmed*: Correctly identifies all 585 filler sentence occurrences and cross-episode dialogue duplicates.
2. **Verify regex corruption patterns**:
   ```bash
   git grep -E "결박펼쳐졌다|시작펼쳐졌다|함락펼쳐졌다|발각펼쳐졌다|완성펼쳐졌다|배달펼쳐졌다|포위펼쳐졌다" public/book/
   git grep -E "고르지 거두지 않았다|읽지 거두지 않았다|하지 거두지 않았다|들지 거두지 않았다|깨지지 거두지 않았다" public/book/
   git grep -E "얼어붙어 타올랐다|통로가 타올랐다|새겨져 타올랐다|내리고 타올랐다|누워 타올랐다|웃고 타올랐다" public/book/
   ```
   *Confirmed*: Accurately matches all 129 ungrammatical phrases and 194 absurd burning predicates.
3. **Verify touch ergonomics scanner**:
   ```bash
   npx tsx scripts/challenger_empirical_stress.ts
   ```
   *Confirmed*: Accurately flags the exact 17 interactive controls below 44px.
4. **Invalidation Condition**:
   This strategy is invalidated if an implementation following these four assertions fails to catch either repeated filler sentences, broken regex verbs, duplicated dialogues, or substandard touch targets, or if the Agent-as-Judge composite score calculation deviates from the 4-dimensional rubric.
