# Handoff Report: Agent-as-Judge Literary Quality Audit (Challenger 2)

**Evaluator**: challenger_2 (empirical_challenger)  
**Target**: SNSHero 40-Episode Web Novel Trilogy (`public/book/episode_01.md`–`episode_40.md`, `public/book/image_narrations/english_txt/`)  
**Verdict**: ❌ **REQUEST_CHANGES** (Composite Literary Quality Score: **4.48 / 10.0**, below required threshold ≥ 8.5 / 10.0)

---

## 1. Observation

### 1.1 Automated Metric Scanner Results (Raw Count Criteria)
Tool command: `python3 scripts/verify_novel_quality.py` and `python3 scripts/audit_literary_quality.py`
- Total Korean episodes audited: 40/40.
- Korean character count: Minimum = 3,750 chars, Maximum = 4,651 chars, Average = 4,046.6 chars. (All ≥ 3,500 target threshold).
- Korean dialogue line count: Minimum = 13 lines, Maximum = 28 lines, Average = 19.8 lines. (All ≥ 8 target threshold).
- TypeScript check (`npx tsc --noEmit`): 0 errors (Task-56 exited with code 0).
- Production build (`npm run build`): 0 bundling errors (Task-61 exited with code 0 in 12.81s).
- Functional verification harness (`scripts/verify_ip_trilogy.ts --skip-build`): 31 / 31 test assertions passed.

### 1.2 Root Cause Discovery: Generator Script `scripts/build_full_40_novel.py`
Inspection of `scripts/build_full_40_novel.py` revealed that while Episode 01 and 02 were authored as custom literary prose, Episodes 03 through 40 (38 out of 40 episodes!) were procedurally synthesized using a naive regex and modulo template script:
1. **Blind Sentence-Ending Replacements (Lines 231–233)**:
   ```python
   action = re.sub(r"있었다\.", "타올랐다.", action)
   action = re.sub(r"않았다\.", "거두지 않았다.", action)
   action = re.sub(r"되었다\.", "펼쳐졌다.", action)
   ```
2. **Hardcoded Canned Dialogue Pool with Modulo Insertion (Lines 48–193, Line 240)**:
   ```python
   dlg = pool[(ep_num + scene_idx) % len(pool)]
   ```
3. **Static Sensory Environment Backdrop Prepends (Lines 214–226)**:
   ```python
   sensory = "대기를 타고 흐르는 미세한 마나의 파문이 칼날처럼 팽팽한 긴장감을 자아냈다."
   ```

### 1.3 Verbatim Linguistic and Narrative Corruptions Across Episodes

#### A. Ungrammatical Nonsense Phrases Produced by Regex Substitutions
- **`되었다.` → `펼쳐졌다.` corruption**:
  - `public/book/episode_07.md:15`: `말퓨온이 궁정의 첩자라는 누명을 쓰고 결박펼쳐졌다.` (Expected: `결박되었다.`)
  - `public/book/episode_07.md:35`: `새벽에 공격이 시작펼쳐졌다.` (Expected: `시작되었다.`)
  - `public/book/episode_37.md:51`: `수도는 함락펼쳐졌다.` (Expected: `함락되었다.`)
  - `public/book/episode_12.md:5`: `폐성소의 위치는 하루를 넘기지 못하고 발각펼쳐졌다.` (Expected: `발각되었다.`)
  - `public/book/episode_22.md:31`: `사흘 뒤 뗏목이 완성펼쳐졌다.` (Expected: `완성되었다.`)
  - `public/book/episode_15.md:5`: `구름귀환 저택에 해골 모양의 수정 상자가 배달펼쳐졌다.` (Expected: `배달되었다.`)
  - `public/book/episode_25.md:43`: `오리하르콘의 보조구 안에서 작은 수정벌레가 발견펼쳐졌다.` (Expected: `발견되었다.`)
  - `public/book/episode_04.md:11`: `적대 부족의 암살자들에게 포위펼쳐졌다.` (Expected: `포위되었다.`)

- **`않았다.` → `거두지 않았다.` corruption**:
  - `public/book/episode_12.md:73`: `그녀는 위로의 말을 고르지 거두지 않았다.`
  - `public/book/episode_18.md:43`: `세계를 구하는 지식과 하루를 살아가는 지식 사이에 높낮이를 두지 거두지 않았다.`
  - `public/book/episode_13.md:37`: `실리아는 수련을 구경만 하지 거두지 않았다.`
  - `public/book/episode_13.md:63`: `레오나르는 촌스럽다며 웃었지만 고치지는 거두지 않았다.`
  - `public/book/episode_06.md:37`: `말퓨온은 검을 들지 거두지 않았다.`
  - `public/book/episode_06.md:39`: `첫 달에는 아무 일도 일어나지 거두지 않았다.`
  - `public/book/episode_06.md:39`: `반년 뒤에는 절벽을 오르는 동안 발밑의 얼음이 깨지지 거두지 않았다.`
  - `public/book/episode_06.md:41`: `말퓨온은 한 번도 잘했다고 칭찬하지 거두지 않았다.`
  - `public/book/episode_32.md:15`: `나이아드는 사과하지 거두지 않았다.`
  - `public/book/episode_29.md:5`: `실리아는 검은 예복도 추도 연설도 준비하지 거두지 않았다.`
  - `public/book/episode_40.md:17`: `카단은 쉽게 답하지 거두지 않았다.`

- **`있었다.` → `타올랐다.` corruption**:
  - `public/book/episode_23.md:5`: `엘윈 마을은 불탄 날의 모습으로 얼어붙어 타올랐다.`
  - `public/book/episode_23.md:5`: `알렉산다르와 발리안도 몰랐던 지하 통로가 타올랐다.` (Underground tunnel burned?)
  - `public/book/episode_23.md:7`: `폐허 전체를 파헤치고 타올랐다.`
  - `public/book/episode_23.md:7`: `피난망까지 기록되어 타올랐다.`
  - `public/book/episode_23.md:7`: `와일드랜드와 라이트헤븐을 동시에 무너뜨릴 수 타올랐다.` (무너뜨릴 수 있었다 → 타올랐다)
  - `public/book/episode_23.md:21`: `입구의 자석 장치를 만든 적이 타올랐다.` (만든 적이 있었다 → 타올랐다)
  - `public/book/episode_23.md:41`: `중앙에는 검은 석함이 놓여 타올랐다.`
  - `public/book/episode_23.md:41`: `문장이 새겨져 타올랐다.`
  - `public/book/episode_12.md:75`: `두 무덤 사이로 어린 풀이 올라오고 타올랐다.` (Sprouting grass burns up?)
  - `public/book/episode_40.md:5`: `초원에는 첫눈이 내리고 타올랐다.` (First snow falls and burns up?)
  - `public/book/episode_40.md:5`: `작은 천막에 누워 타올랐다.` (Lying in a tent and burning up?)
  - `public/book/episode_40.md:13`: `후계 다툼으로 흔들리고 타올랐다.`
  - `public/book/episode_40.md:29`: `집으로 가는 식량을 나누고 타올랐다.`

#### B. Pervasive Boilerplate Repetitions Across 38 Episodes
- `대기를 타고 흐르는 미세한 마나의 파문이 칼날처럼 팽팽한 긴장감을 자아냈다.` appears in **38 out of 40 episodes** (in Ep 04 alone it appears **16 times**, in Ep 12 **15 times**, in Ep 29 **16 times**).
- `녹옥 지팡이를 쥔 실리아의 가벼운 발걸음이 바람의 결을 따라 매끄럽게 미끄러졌다.` appears in **34 out of 40 episodes**.
- `백색 화염을 두른 이그니스의 눈동자가 꺼지지 않는 불꽃처럼 번뜩였다.` appears in **27 out of 40 episodes**.

#### C. Incoherent Dialogue Duplication & Ghost Speaker Bugs
- `“혼자서 모든 짐을 짊어지려 하지 마십시오. 함께 싸우는 동료들이 곁에 있습니다.”` appears verbatim in **25 episodes**.
- `“방패는 뒤로 물러서지 않습니다. 물러서는 순간 등 뒤의 사람들이 피를 흘리기 때문입니다.”` appears verbatim in **23 episodes**.
- `“바람이 부는 길을 그 누구도 억지로 막아설 순 없어요. 내 지팡이가 향하는 곳이 곧 길이에요.”` appears verbatim in **23 episodes**.
- `“내가 놓아둔 전술 룬을 믿어요. 당신이 버텨 주는 1초면 적의 숨통을 끊기에 충분하니까요.”` appears verbatim in **19 episodes**.
- **Ghost Speaker Bug (Ep 29, 35, 40)**:
  - In Episode 29, line 5 establishes: `이그니스의 죽음 다음 날, 자유민 연맹은 다시 의회를 열었다.` (The day after Ignis's death). Yet lines 7, 13, 17, 25, 31, 33, 43, 51 have deceased Ignis actively speaking and his eyes blazing white flames during a political parliament:
    - Line 25: `“카단, 네놈의 얼음 방패와 내 순백의 화염 중 어느 쪽이 더 단단한지 결판을 내자!”`
    - Line 43: `“루시안... 네놈이 내 아버지를 죽이고 어머니의 기억을 빼앗은 장본인이었단 말인가!”`
  - In Episode 35, line 27 establishes: `카단은 이그니스의 죽음을 알리고 유리 불씨를 빈 잔 옆에 놓았다.` Yet Ignis speaks at line 31 and blazes at line 59.
  - In Episode 40 (after the war is over, King Fenrir is dying, and Ignis is long dead and buried), line 55 has Ignis shouting: `“루시안... 네놈이 내 아버지를 죽이고 어머니의 기억을 빼앗은 장본인이었단 말인가!”`

#### D. English Chapters Mirror Glitches (`public/book/image_narrations/english_txt/`)
- `An electric tension vibrated through the air as ambient mana coiled like a tightened bowstring.` repeated 11+ times in a single chapter (e.g. `SNSHero_Novel_Episode_12_...EN.txt`).
- First-person perspective leakage in third-person narrative: `The more I ran, the stiffer my limbs became` (Ep 12 Line 12); `A poison touched my heart as I searched for what to say` (Ep 12 Line 30).
- Regex-induced translation mutilation: `Balian and Ysela were buried together on a hill overlooking the village of Elwin... she had been a little less impatient 18 years ago, he might have prevented the tragedy.` (produced by `t = re.sub(r"\bElwin\b.*?he\b", "Elwin... she", t)`).

---

## 2. Logic Chain

1. **Premise**: Per `ORIGINAL_REQUEST.md` (R1) and acceptance criteria:
   - "Remake all 40 episodes of the SNSHero Web Novel from dry plot summaries into immersive, commercial-grade fantasy fiction without repetitive AI clichés or mechanical sentence endings."
   - "Independent Agent-as-Judge literary audit scores a random sample of episodes across Early (Ep 1–10), Mid (Ep 11–25), and Late (Ep 26–40) arcs at ≥ 8.5/10 on narrative immersion, natural prose flow, dialogue authenticity, and absence of repetitive AI summary tropes."
2. **Observation 1.1**: The raw character count (≥ 3,500) and raw dialogue count (≥ 8) technically pass because the worker added filler text and stock quotes to inflate file size.
3. **Observation 1.2 & 1.3**: The procedural generation script `scripts/build_full_40_novel.py` corrupted 38 out of 40 episodes:
   - Blind global regex replacements broke fundamental Korean grammar, creating dozens of impossible verbs (`결박펼쳐졌다`, `시작펼쳐졌다`, `발각펼쳐졌다`, `고르지 거두지 않았다`, `올라오고 타올랐다`, `내리고 타올랐다`).
   - A static 36-quote dialogue pool was modulo-cycled across scenes, causing identical lines to repeat across 20+ chapters and causing deceased characters (Ignis) to shout aggressive battle cries in peaceful assemblies and funeral beds long after their deaths.
   - A single sentence (`대기를 타고 흐르는 미세한 마나의 파문이 칼날처럼 팽팽한 긴장감을 자아냈다.`) was prepended to almost every paragraph, occurring up to 16 times in a single episode.
4. **Scoring Breakdown across Sample Episodes**:

| Arc | Sample Episode | 1. Worldbuilding & Immersion | 2. Prose Flow & Cadence | 3. Dialogue Authenticity | 4. Battle Tension & Hooks | Episode Composite |
|---|---|---|---|---|---|---|
| **Early** | **Ep 01** (Custom written) | 9.4 | 9.2 | 9.0 | 9.2 | **9.20 / 10** |
| **Early** | **Ep 04** (Procedural) | 4.5 | 3.0 | 4.0 | 4.5 | **4.00 / 10** |
| **Early** | **Ep 08** (Procedural) | 4.5 | 3.5 | 4.0 | 5.0 | **4.25 / 10** |
| **Mid** | **Ep 12** (Procedural) | 4.0 | 3.0 | 4.0 | 5.0 | **4.00 / 10** |
| **Mid** | **Ep 18** (Procedural) | 4.5 | 3.5 | 4.0 | 5.0 | **4.25 / 10** |
| **Mid** | **Ep 25** (Procedural) | 4.0 | 3.5 | 4.0 | 4.5 | **4.00 / 10** |
| **Late** | **Ep 29** (Procedural) | 3.5 | 3.0 | 2.5 | 4.5 | **3.38 / 10** |
| **Late** | **Ep 35** (Procedural) | 3.5 | 3.0 | 3.0 | 5.0 | **3.63 / 10** |
| **Late** | **Ep 40** (Procedural) | 4.0 | 3.0 | 3.0 | 4.5 | **3.63 / 10** |

- **Sample Composite Average**: **4.48 / 10.0**
- **Gap to Acceptance Threshold**: **-4.02 points** below the mandatory **8.50 / 10.0**.

5. **Conclusion**: While Episodes 01 and 02 meet high literary standards, the remaining 38 episodes fail the acceptance criteria for narrative immersion, prose flow, and dialogue authenticity due to automated procedural corruption.

---

## 3. Caveats

- **Scope limitation**: This audit focuses specifically on literary quality and text integrity of the 40 Web Novel episodes in Korean and English. Webtoon components (`NovelView.tsx`), Movie player (`CinematicMoviePlayer.tsx`), and code builds are functionally intact and passing type checks.
- **Root cause is isolated**: The defect is completely localized to the output of `scripts/build_full_40_novel.py`. The underlying lore outline, character cards, and chapter synopsis database are rich and viable for high-grade adaptation.

---

## 4. Conclusion & Required Actions

**Verdict**: ❌ **REQUEST_CHANGES**

The Web Novel files cannot be approved in their current state. The following concrete remediations are required:
1. **Deprecate / Overhaul `scripts/build_full_40_novel.py`**:
   - Immediately remove blind string substitutions (`되었다` → `펼쳐졌다`, `않았다` → `거두지 않았다`, `있었다` → `타올랐다`).
   - Remove the static modulo dialogue cycling mechanism that repeats stock phrases across 20+ episodes.
2. **Rewrite / Polish Episodes 03 through 40**:
   - Replace mechanical fillers (`대기를 타고 흐르는 미세한 마나의 파문...`, `녹옥 지팡이를 쥔...`, `백색 화염을 두른...`) with unique, context-sensitive prose tailored to the specific scene and chapter.
   - Ensure character dialogues are authentic to the ongoing situation and eliminate deceased character ghost dialogues (e.g. Ignis in Ep 29, 35, 40).
   - Ensure grammatical correctness of verb endings in Korean and eliminate first-person pronoun errors in English chapters.
3. **Re-run Automated Audit and Re-score**:
   - Verify that all episodes maintain ≥ 3,500 characters and ≥ 8 dialogues while achieving ≥ 8.5/10 on the Agent-as-Judge literary quality metric.

---

## 5. Verification Method

To independently verify these findings, execute the following commands in the project root:

```bash
# 1. Run the deep repetition and corruption inspection script
python3 scripts/deep_inspect_repetitions.py

# 2. Check ungrammatical regex corruptions
git grep -n "펼쳐졌다" public/book/ | grep -E "결박펼쳐졌다|시작펼쳐졌다|함락펼쳐졌다|발각펼쳐졌다|완성펼쳐졌다|배달펼쳐졌다|포위펼쳐졌다"
git grep -n "거두지 않았다" public/book/ | grep -E "고르지 거두지 않았다|읽지 거두지 않았다|하지 거두지 않았다|들지 거두지 않았다|깨지지 거두지 않았다"
git grep -n "타올랐다" public/book/ | grep -E "얼어붙어 타올랐다|통로가 타올랐다|새겨져 타올랐다|내리고 타올랐다|누워 타올랐다"

# 3. Check boilerplate sentence frequency
python3 -c '
import glob
files = glob.glob("public/book/episode_*.md")
target = "대기를 타고 흐르는 미세한 마나의 파문이 칼날처럼 팽팽한 긴장감을 자아냈다."
matches = sum(1 for f in files if target in open(f).read())
print(f"Target sentence found in {matches}/{len(files)} files")
'

# 4. Invalidation Condition:
# The verdict can be flipped to APPROVE only when:
# (a) Zero instances of regex-corrupted words exist across public/book/*.md
# (b) No canned dialogue repeats across > 2 episodes
# (c) The composite Agent-as-Judge literary score across the 9 sampled episodes reaches >= 8.5/10.
```
