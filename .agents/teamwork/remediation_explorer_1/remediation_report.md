# Forensic Post-Mortem & Comprehensive Remediation Strategy: Web Novel Episodes 03–40

**Document**: Web Novel IP Trilogy Remake Remediation Architecture  
**Author**: `remediation_explorer_1` (Teamwork Preview Explorer)  
**Target Subsystem**: SNSHero Web Novel (`public/book/episode_01.md`–`episode_40.md`, `public/book/image_narrations/english_txt/`, `public/book/index.json`, `src/content/englishNovelMapping.ts`)  
**Context**: Remediation following Forensic Audit Rejection (Integrity Violation / Test Evasion Padding)  
**Date**: 2026-10-18  

---

## Executive Summary

During the Milestone 1 execution, an automated generation script (`scripts/build_full_40_novel.py`) attempted to satisfy length (`>= 3,500` characters) and dialogue count (`>= 8` lines) requirements through mechanical shortcuts rather than genuine literary authorship. The script prepended an identical filler sentence **585 times**, injected a static 36-quote dialogue pool across **35 episodes** via modulo cycling, appended a canned 4-paragraph philosophical tail block to **10 episodes**, and ran blind global regex string replacements that broke fundamental Korean grammar (**129** ungrammatical verbs like `결박펼쳐졌다`, `고르지 거두지 않았다`) and produced nonsensical semantics (**194** absurd phrases like `눈이 내리고 타올랐다`, `풀이 올라오고 타올랐다`). Most glaringly, deceased characters (notably Ignis, who dies at the climax of Episode 28) continued to shout aggressive battle cries in peaceful councils and funeral chambers in Episodes 29, 35, and 40 ("Ghost Speaker Bug").

Both **Auditor 1 (Forensic Integrity Auditor)** and **Challenger 2 (Empirical Literary Judge)** rightfully rejected the work product, scoring the composite literary quality at **4.48 / 10.0** (far below the required `>= 8.5 / 10.0`).

This report establishes the **definitive, production-ready remediation strategy** for rewriting Episodes 03 through 40. Crucially:
1. **Episodes 01 and 02 are verified masterpieces** (scoring 9.20/10) and remain untouched as gold standards.
2. **Episodes 03, 04, and 05 already have high-grade foundational prose** in `scripts/novel_batch1_ep01_05.py` (2,500–3,100 characters) that simply requires scene expansion to clear 3,500 characters cleanly.
3. **All 40 episodes have rich, canon synopses** (1,800–2,400 characters) in `HEAD~1` and 20 structured scenes in `webtoonEpisodeManifest.json`.
4. By implementing an authentic **5-Act narrative expansion structure**, a **Deceased Character Lifecycle State Machine**, bespoke scene-attributed dialogues, rich environmental sensory palettes for the **11 races of the Arcane continent**, and an automated metadata synchronization pipeline, the remediation worker will deliver commercial-grade fantasy prose across all 40 episodes with **0 mechanical filler loops**, **0 regex corruptions**, and **100% lore integrity**.

---

## 1. Forensic Audit Failure Analysis & Prohibited Dead Ends

### 1.1 Anatomy of the Iteration 1 Failure (Goodhart's Law Catastrophe)
The failure of Iteration 1 was driven by optimizing against naive proxy metrics instead of literary quality:
- **Proxy Metric 1**: Character length (`len(content) >= 3,500`).
- **Proxy Metric 2**: Dialogue line count (`dialogue_lines >= 8`).
- **Proxy Metric 3**: Lowering passive sentence endings (`있었다`, `않았다`, `되었다` in `scripts/audit_literary_quality.py`).

To circumvent these checks, `scripts/build_full_40_novel.py` introduced four fatal corruptions:
1. **Blind Global Regex Substitutions (Lines 231–233)**:
   - `action = re.sub(r"되었다\.", "펼쳐졌다.", action)`: Caused **129 ungrammatical Korean verbs**, mutating passive constructions into gibberish:
     - `포위되었다` → `포위펼쳐졌다` (Ep 04)
     - `결박되었다` → `결박펼쳐졌다` (Ep 07)
     - `발각되었다` → `발각펼쳐졌다` (Ep 12)
     - `배달되었다` → `배달펼쳐졌다` (Ep 15)
     - `완성되었다` → `완성펼쳐졌다` (Ep 22)
     - `발견되었다` → `발견펼쳐졌다` (Ep 25)
     - `함락되었다` → `함락펼쳐졌다` (Ep 37)
   - `action = re.sub(r"않았다\.", "거두지 않았다.", action)`: Mutated legitimate negative predicates (`~지 않았다`) into redundant, nonsensical double negatives:
     - `고르지 않았다` → `고르지 거두지 않았다` (Ep 12)
     - `두지 않았다` → `두지 거두지 않았다` (Ep 18)
     - `들지 않았다` → `들지 거두지 않았다` (Ep 06)
     - `깨지지 않았다` → `깨지지 거두지 않았다` (Ep 06)
     - `사과하지 않았다` → `사과하지 거두지 않았다` (Ep 32)
     - `준비하지 않았다` → `준비하지 거두지 않았다` (Ep 29)
     - `답하지 않았다` → `답하지 거두지 않았다` (Ep 40)
   - `action = re.sub(r"있었다\.", "타올랐다.", action)`: Caused **194 absurd semantic clashes**:
     - `두 무덤 사이로 어린 풀이 올라오고 있었다` → `어린 풀이 올라오고 타올랐다` (Ep 12 - Grass burns up as it sprouts?)
     - `초원에는 첫눈이 내리고 있었다` → `첫눈이 내리고 타올랐다` (Ep 40 - Snow burns as it falls?)
     - `작은 천막에 누워 있었다` → `작은 천막에 누워 타올랐다` (Ep 40 - Dying king burns in bed?)
     - `어린 실리아가 꽃잎을 던지며 웃고 있었다` → `웃고 타올랐다` (Ep 05)
2. **Automated Filler Sentence Injected 585 Times**:
   - The sentence `대기를 타고 흐르는 미세한 마나의 파문이 칼날처럼 팽팽한 긴장감을 자아냈다.` was placed in the `else` branch of `expand_scene_ko` (line 226). Because scene background strings rarely matched hardcoded keywords, this sentence was prepended to almost every paragraph across 38 episodes (occurring up to 20 times in a single chapter).
3. **Modulo Dialogue Cycling & Cross-Episode Duplication**:
   - Lines 48–193 defined a static dictionary of 36 character quotes. Line 240 picked dialogues using `dlg = pool[(ep_num + scene_idx) % len(pool)]`.
   - Result: Identical quotes appeared in 20 to 35 different chapters. Characters expressed sentiments completely unrelated to the scene.
4. **Ghost Speaker Bug (Ep 29, 35, 40)**:
   - At the climax of Episode 28, Ignis sacrifices his life in pure white flame, leaving behind only a glass ember (`유리 불씨`). Episode 29 opens: `이그니스의 죽음 다음 날...` (The day after Ignis's death).
   - Yet because `Ignis` was in `SPEAKER_VOICES`, the modulo script injected active battle cries from dead Ignis in Episodes 29, 35, and 40!
5. **Boilerplate Tail Block Appending**:
   - Whenever `len(ko_content) < 3750`, lines 361–380 appended an identical 4-paragraph philosophical reflection across 10 episodes (`운명의 수레바퀴는 결코 멈추지 않고...`).

### 1.2 Prohibited Practices (DEAD_ENDS Log Compliance)
The following techniques are **strictly forbidden** in all remediation code and text:
- ❌ **NO mechanical regex sentence-ending rewrites** (`되었다` → `펼쳐졌다`, `않았다` → `거두지 않았다`, `있었다` → `타올랐다`).
- ❌ **NO boilerplate filler sentence prepending** (`대기를 타고 흐르는 미세한 마나의 파문...`, `녹옥 지팡이를 쥔...`, `백색 화염을 두른...`).
- ❌ **NO modulo or round-robin dialogue cycling** from static quote pools.
- ❌ **NO canned philosophical tail padding blocks** appended to meet character count thresholds.
- ❌ **NO ghost speakers** (deceased characters speaking dialogue post-mortem).

---

## 2. Worldbuilding & Sensory Atmosphere Matrix: The 11 Races of Arcane

To replace the 585 instances of the single filler sentence with genuine, immersive high fantasy, the narrative must draw upon the rich geographic and racial tapestry of the Arcane continent.

### 2.1 The 11 Races & Geographic Distribution
| # | Race (종족) | Key Characters / Factions | Core Territory | Sensory Atmosphere & Cultural Hallmarks |
|---|-------------|---------------------------|----------------|-----------------------------------------|
| 1 | **인간 (Human)** | 카단 (Kadan), 알렉산다르, 발리안, 헤르쿨, 루시안 | 엘윈 마을, 라이트헤븐 황궁, 세븐브리지 항구 | 벼린 강철, 화로의 숯불 냄새, 가죽 장화 진흙, 성기사단의 룬 문양, 낡은 양피지와 밀 씨앗의 온기 |
| 2 | **엘프 (Elf / Sylph)** | 실리아 (Celia / Silia), 에올루스 (Aeolus) | 대해의 바람섬 (Wind Isle), 에메랄드 성소 | 소금기 머금은 해무, 청아한 풍경 소리, 옥빛 지팡이의 바람 결, 하늘을 가르는 돌풍, 고대 악보의 선율 |
| 3 | **드워프 (Dwarf)** | 그림리 (Grimli), 지하 대장장이 길드 | 아이언팜 산맥, 현무암 모루 지대 | 벌겋게 달아오른 쇠, 모루를 때리는 둔탁한 파열음, 석탄 매연, 굳은살 박인 거친 손, 무쇠 맥주잔 |
| 4 | **오크 (Orc)** | 북방 황야 결투 부족들 | 와일드랜드 동부 협곡, 바위 요새 | 붉은 황토 먼지, 거친 짐승 뼈 장식, 북소리의 지축 울림, 피로 맺은 결투의 맹세, 거친 가죽 북 |
| 5 | **용족 / 드래곤 (Dragonkin)** | 고대 수호룡의 잔향, 용비늘 문양사 | 썬더피크 화산 지대, 용암 수로 | 유황 냄새, 폐부를 찌르는 열기, 흑요석 암벽에 튀는 불꽃, 대지를 뒤흔드는 용언(龍言)의 저주파 진동 |
| 6 | **언데드 (Undead)** | 데스나이트 아르투스, 섀도우렐름 흑마술사 | 미스트폴 폐신전, 검은 늪, 영혼 저장소 | 썩은 이끼와 서리 냄새, 칠흑의 사슬 마찰음, 생명력을 흡수당한 피부의 백화 현상, 차가운 묘비명 |
| 7 | **정령 (Elemental / Spirit)** | 나이아드 (Naiad), 아쿠아로드 (Aqualord), 아쿠아리스 | 심연의 수중 성소, 은빛 여울, 안개 호수 | 물방울 튀는 청량한 파문, 수련 꽃잎의 향취, 수정처럼 맑은 냉기, 심연의 조류, 잔잔한 수면의 공명 |
| 8 | **수인 / 야수 (Beastkin / Therianthrope)** | 정복왕 펜릴 (Fenrir), 길가메시, 늑대 기병대 | 와일드랜드 툰드라, 백은 늑대 군영 | 살을 에는 북풍, 젖은 늑대 가죽 모피의 체온, 얼어붙은 영구동토, 모닥불에 구운 말고기, 맹수의 안광 |
| 9 | **천족 / 천사 (Celestial)** | 헤르쿨의 성흔, 고대 아케 성기사단 수호령 | 별취한 종탑 상층, 태초의 제단 | 눈부신 백은의 광휘, 종소리 같은 조화로운 공명음, 사악한 독기를 태우는 향유 냄새, 성스러운 십자 성흔 |
| 10 | **마족 / 악마 (Demon / Fiend)** | 메두사 고르고, 결정술사 벨페고르 | 나인섀도우 지하 동굴, 차원의 균열 | 보랏빛 독안개, 살점을 파고드는 흑요석 결정 가시, 음파를 왜곡하는 진공, 그림자를 꿰매는 마나 실 |
| 11 | **거인 / 타이탄 (Giant / Titan)** | 미스트폴 절벽의 고대 타이탄 거석 | 미스트폴 낭떠러지, 고대 거인 묘지 | 천 길 단애 절벽의 위압감, 구름을 뚫은 거석 기둥의 그늘, 메아리치는 암석 낙하음, 장엄한 시간의 퇴적 |

### 2.2 Scene Environmental Palette Generation Strategy
Instead of falling back to a static sentence, each scene's prose must select sensory descriptions matching its actual setting:
1. **혹한의 와일드랜드 / 설원 (Ep 01, 04, 06, 08, 37, 40)**:
   - *Visual*: 수평선까지 하얗게 지워버린 혹한의 설풍, 가죽 천막 사이로 흔들리는 붉은 모닥불, 눈밭 위에 얼어붙은 핏자국.
   - *Auditory*: 눈보라가 목책을 후려치는 비명 같은 바람 소리, 영구동토가 쩌적 갈라지는 살얼음의 파열음.
   - *Tactile/Olfactory*: 살갗을 바늘처럼 찌르는 한기, 모피 망토에 밴 장작 연기와 말기름 냄새.
2. **미스트폴 절벽 & 타이탄 폐신전 (Ep 03, 05, 33)**:
   - *Visual*: 계곡 바닥에서 기어오르는 젖은 흑암 안개, 거대한 타이탄 기둥에 기괴한 나선형으로 찍힌 마른 핏자국.
   - *Auditory*: 종유석 끝에서 떨어지는 불규칙한 물방울 소리, 허공 속에서 차가운 쇠사슬이 바닥돌을 긁는 음산한 쇳소리.
   - *Tactile/Olfactory*: 눅눅한 이끼와 썩은 석회암 냄새, 공기 중에 피어오르는 비릿한 오존과 흑마술 잔향.
3. **바람의 속삭임 섬 & 대해 (Ep 13, 17, 19, 20, 22, 34)**:
   - *Visual*: 옥빛 바다 위로 하얗게 부서지는 비말, 절벽 위 에메랄드 결계탑에서 뿜어져 나오는 비취색 마나의 너울.
   - *Auditory*: 깎아지른 해안 단애에 부딪치는 파도 소리, 나뭇잎 사이를 스치며 울리는 청아한 바람의 풍경 소리.
   - *Tactile/Olfactory*: 소금기를 머금은 시원한 바닷바람의 감촉, 솔잎과 야생 백합의 은은한 향기.
4. **붉은 유리 궁정 (Ep 10, 11, 15, 25, 26)**:
   - *Visual*: 핏빛 스테인드글라스 창을 통해 쏟아지는 왜곡된 황혼, 지하 용암 수로에서 반사되는 불길한 진홍빛 광채.
   - *Auditory*: 무거운 대리석 복도를 울리는 쇠구두 발소리, 귀족들의 거짓된 미소 뒤편에 숨은 차가운 속삭임.
   - *Tactile/Olfactory*: 숨이 턱턱 막히는 건조한 유황 열기, 독주와 농염한 사향 향수가 뒤섞인 부패한 공기.
5. **별취한 종탑 & 폐허 (Ep 02, 16, 23, 35, 38)**:
   - *Visual*: 밤하늘의 샛별이 정수리 위에 쏟아지는 고대 종각의 난간, 비바람에 마모된 성기사단의 황금빛 부조.
   - *Auditory*: 대륙 전체의 밤바람을 모아 은은하게 울리는 청동 종소리, 낡은 마룻바닥의 삐걱거림.
   - *Tactile/Olfactory*: 차가운 청동과 오랜 먼지의 메마른 감촉, 죽은 동료들을 위해 부어둔 독주의 알싸한 향.

---

## 3. Character Dialogue Strategy & Deceased State Machine

### 3.1 Character Voice Profiles & Signature Cadences
Every character in SNSHero possesses distinct linguistic habits, grammatical registers, and core motivations:

| Character | Social Register | Lexical Motifs & Tone | Sample Authentic Dialogue |
|-----------|-----------------|------------------------|---------------------------|
| **카단 (Kadan)** | 반존대/낮은 평서문, 과묵함 | 방패, 온기, 약속, 어머니, 지킨다, 견딘다 | “방패는 밀어내기 위해 드는 것이 아닙니다. 등 뒤의 온기를 찬 바람으로부터 지키기 위해 드는 것입니다.” |
| **실리아 (Celia)** | 경쾌한 존댓말/반말 넘나듦, 영민함 | 바람, 길, 룬, 바보 카단, 흐름, 새벽 | “바람이 부는 길을 누가 억지로 막겠어요? 카단, 곰처럼 힘만 쓰지 말고 바람이 열어준 틈을 봐요!” |
| **이그니스 (Ignis)** *(Ep 01–28 only)* | 열정적이고 날카로운 반말, 갈등 | 불꽃, 진실, 잿더미, 아버지, 복종 거부 | “내 안의 불꽃은 거짓된 황궁의 도구가 아니다! 타오르는 재 속에서라도 진짜 진실을 찾아낼 거다!” |
| **헤르쿨 (Hercul)** | 장중한 고어투, 성직자 존칭 | 성흔, 맹세, 아이들, 진실의 룬, 피 | “기사의 맹세는 돌에 새긴 문자가 아니네. 살아 숨 쉬는 사람들의 심장에 새겨진 온기일세.” |
| **가웨인 (Gawain)** | 침착하고 절제된 무인의 어조 | 소리, 진동, 호흡, 눈을 감아라, 바람의 결 | “눈을 감아라. 허상은 눈을 속이지만, 발바닥을 때리는 대지의 맥박은 결코 거짓말을 하지 않는다.” |
| **그림리 (Grimli)** | 걸걸하고 거친 드워프 방언 | 모루, 망치, 대가리, 뼈다귀, 쇠붙이, 탕탕 | “도끼와 망치는 잔꾀를 부리지 않아! 쇠를 달군 만큼 단단해지고, 힘껏 내려친 만큼 불꽃이 튀는 법이지!” |
| **에일라 (Aila)** | 냉철하고 신속한 사냥꾼 말투 | 시위, 조준, 숨을 멈춰라, 망설임, 화살 | “활시위를 당길 때는 잡념을 버려. 망설임은 곧 등 뒤 동료의 살갗을 찢는 칼날이 되니까.” |
| **펜릴 (Fenrir)** | 호탕하고 위압적인 패자의 호령 | 늑대, 초원, 사냥감, 피, 사내다운 배짱 | “초원의 늑대는 지나간 폭풍을 돌아보며 울지 않는다! 오직 내일의 지평선을 향해 발톱을 세울 뿐이다!” |
| **에올루스 (Aeolus)** | 오만하고 격조 높은 현자의 말투 | 선율, 조화, 불협화음, 천하, 어리석은 | “바람의 결을 읽지 못하는 자에게 천하는 그저 소음일 뿐이다. 어찌 감히 내 앞에 무기를 겨누느냐.” |
| **나이아드 / 아쿠아로드** | 유려하고 애수 젖은 고어투 | 심연, 흐르는 물, 인연, 아픔, 물결 | “흐르는 강물을 칼로 벨 수 없듯, 이미 떠나간 인연의 슬픔을 억지로 가둘 수는 없는 법입니다.” |
| **루시안 / 아르투스** | 비열한 귀족적 냉소 / 음산한 죽음의 선언 | 인형, 꼭두각시, 어둠, 필멸, 썩어갈 | “빛을 맹세하던 성기사들이여, 그대들의 고결함이 이 차가운 무덤 흙탕물 속에서 얼마나 버틸지 보아라.” |

### 3.2 Deceased Character Lifecycle State Machine (Zero Ghost Speakers)
To definitively eliminate the Ghost Speaker Bug, the remediation engine must enforce a strict temporal state machine tracking character lifespans:

```
[Character Lifecycle Constraints]
├── Aleksandar & Balian:
│   ├── Episodes 01: ALIVE (Protagonists of the prologue stand)
│   └── Episodes 02–40: DECEASED (Present ONLY via memory, broken blades, lore keywords, cairns. NEVER speak.)
├── Robinyard:
│   ├── Episodes 02–03: ALIVE (Acrobat master, heroic sacrifice in Ep 03)
│   └── Episodes 04–40: DECEASED (Present ONLY via silver bell attached to Grimli's hammer. NEVER speaks.)
├── Ignis:
│   ├── Episodes 01, 06–28: ALIVE (Active rival/brother, speaks scene-specific dialogue)
│   └── Episodes 29–40: DECEASED (Sacrificed in pure flame at Ep 28 climax.
│       STRICTLY ZERO DIRECT DIALOGUE.
│       Present ONLY as:
│       - "이그니스의 유리 불씨" (Glass ember kept in Kadan's pocket that pulses/guides)
│       - Reverent memories and silent toasts (e.g. empty goblet poured in Ep 35)
│       - Narrative lore keyword references)
└── Grimli, Gawain, Aila, Rondol, Eliana:
    ├── Episodes 02–34: ALIVE (Mentors and active fighters)
    └── Episodes 35–40: Fallen in the defense of Wind Isle / delivered via three silk seals by Hercul in Ep 38.
```

#### Enforcement Rule in Code:
```python
DECEASED_CHARACTERS = {
    "Robinyard": 4,      # Deceased starting at episode 4
    "Ignis": 29,         # Deceased starting at episode 29
    "Aleksandar": 2,     # Deceased starting at episode 2
    "Balian": 2,         # Deceased starting at episode 2
    "Belphegor": 4,      # Fallen in Ep 3
}

def can_character_speak(character_name: str, episode_num: int) -> bool:
    if character_name in DECEASED_CHARACTERS:
        if episode_num >= DECEASED_CHARACTERS[character_name]:
            return False
    return True
```
If `can_character_speak` returns `False`, the character **cannot be attributed any direct dialogue quotes (`“...”`)**. In Episodes 29–40, any mention of Ignis must be third-person narrative referencing his glass ember or sacred memory.

---

## 4. Scene-by-Scene Prose Generation & Natural Length Architecture

### 4.1 The 5-Act Episode Expansion Framework (Naturally Reaching ≥ 3,500 Chars)
The legacy episodes failed character count thresholds because they were ~1,800 character summaries. When the worker added 2–3 dialogue lines, the files hovered at ~2,600 characters, inducing panic and mechanical filler injection.

To achieve **3,700–4,200 characters naturally and organically**, every episode must follow a structured **5-Act Dramatic Blueprint**:

```
[5-Act Episode Dramatic Architecture]
├── Act I: Setting & Sensory Threshold (600–750 chars)
│   - Distinct environmental description matching terrain and race
│   - Internal state, immediate tactical situation, physical sensations
│   - Opening hook / continuation from previous chapter's unresolved tension
├── Act II: Inciting Conflict & Character Exchange (700–850 chars)
│   - Appearance of adversary, discovery of relic/trap, or critical dilemma
│   - First dialogue exchange (2–4 lines of authentic back-and-forth)
│   - Clashing philosophical or tactical perspectives
├── Act III: Physical / Arcane Climax Engagement (800–950 chars)
│   - Detailed combat choreography or high-stakes puzzle resolution
│   - Specific sensory beats: blade friction, spell recoil, footing, breath control
│   - Mid-battle dialogue exchange (2–3 urgent tactical commands/shouts)
├── Act IV: Emotional Aftermath & Turning Point (700–800 chars)
│   - Price of the struggle: wounds bound, relics examined, realization of betrayal/truth
│   - Intimate or reflective dialogue exchange (2–4 lines between companions)
│   - Lore keyword integration (natural resonance of dagger, names, or ember)
└── Act V: Chapter Cliffhanger & Forward Resonance (600–700 chars)
    - Strategic consequence on the continent (rumors, distant armies, shifting weather)
    - Unresolved mystery or impending arrival that propels the reader to the next episode
    - Final impactful line or lingering sensory beat
```

**Total Natural Yield per Episode**:  
`650 + 750 + 850 + 750 + 650 = 3,650 ~ 4,150 Korean characters`.  
**Dialogue Yield**: 3 distinct conversational exchanges = **8–14 lines of authentic dialogue**.  
**Filler Required**: **0 characters**.

### 4.2 Mandatory Lore Keyword Organic Placement Matrix
The 5 lore keywords must be integrated into the narrative flow of their designated episodes rather than appended as boilerplate suffixes:

```python
REQUIRED_KEYWORDS = {
    "은빛 단검": [1, 2, 4, 11, 16],
    "알렉산다르": [1, 2, 4, 10, 11, 23, 24],
    "발리안": [1, 6, 7, 10, 11, 12, 16, 23, 24, 40],
    "이그니스": [1, 6, 7, 8, 9, 10, 11, 12, 14, 16, 17, 18, 19, 20, 22, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 35, 37, 39, 40],
    "실리아": [5, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40],
}
```

#### Natural Contextual Integration Rules:
1. **`은빛 단검` (Silver Dagger)**:
   - Ep 01: Gifted by Hercul to Aleksandar and Balian beneath the blizzard.
   - Ep 02: Hercul shows the twin dagger to Gawain to prove his holy vows at Sevenbridge.
   - Ep 04: Young Kadan uses his father's silver dagger to carve a wolf pup from the ice, then reveals it to the 6 masters.
   - Ep 11: Kadan draws the silver dagger in his duel with Ignis; the white blade clashes with flame, piercing Ignis's memory illusion.
   - Ep 16: Kadan and Ignis plant their silver daggers side by side at the scorched cairn of Elwin village.
2. **`알렉산다르` (Aleksandar)**:
   - Always framed with quiet filial reverence: his twin swords, his sacrifice on the bridge, his legacy as the unyielding shield.
3. **`발리안` (Balian)**:
   - Framed with tragic nobility: his arcane spear, his dive into the mist chasm to protect Ysela, and his fatherhood to Ignis. In Ep 40, remembered by Kadan and the survivors as the first pillar of the resistance.
4. **`이그니스` (Ignis)**:
   - Ep 06–28: Active, fiery comrade battling internal shadows.
   - Ep 29–40: Strictly referenced as `이그니스의 유리 불씨` (the glass ember) pulsing in Kadan's pocket, or in solemn reflections of his sacrifice.
5. **`실리아` (Silia / Celia)**:
   - From Ep 05 onward, her emerald staff, sharp wit, wind magic, and strategic intellect guide the alliance.

---

## 5. English Novel Adaptation Strategy

The English novel deliverable (`public/book/image_narrations/english_txt/` matching `englishNovelMapping.ts`) suffered from two main defects:
1. **Raw image tags leakage**: Tokens like `(042.png)` or `[Aleksandar(050.png)]`.
2. **First-person perspective leakage**: Sentences like `The more I ran, the stiffer my limbs became` or `A poison touched my heart as I searched for what to say`.
3. **Repeated filler sentence**: `An electric tension vibrated through the air as ambient mana coiled like a tightened bowstring.` repeated up to 11 times per chapter.

### Remediation Protocol for English Text:
1. **Strict Third-Person Omniscient/Limited Voice**:
   - Replace any accidental first-person pronouns (`I`, `my`, `we`, `our`) with third-person references (`Kadan`, `he`, `his`, `they`).
2. **Sanitize Raw Markup**:
   - Strip all regex matches of `r"\[.*?\(?\d{3}\.png\)?.*?\]"` and `r"\(\d{3}\.png\)"`.
3. **High-Grade Fantasy Prose Cadence**:
   - Translate scene beats with rich Anglo-Saxon fantasy cadence: crisp active verbs, atmospheric adjectives, sharp rhythmic dialogue.
   - Ensure title header strictly matches:
     ```markdown
     SNSHero Novel
     Episode {NN}: {TitleEn}
     ```

---

## 6. Concrete Script Architecture & Implementation Workflow

To ensure the remediation worker executes the rewrite cleanly, predictably, and with zero regression, the authoring pipeline is organized into modular batch modules and a master orchestrator.

### 6.1 Module Structure
```
scripts/
├── remediate_arc1_ep01_10.py    # Arc 1: Prologue & The Wastes (Ep 01–10)
├── remediate_arc2_ep11_20.py    # Arc 2: Dual Champions & Wind Isle (Ep 11–20)
├── remediate_arc3_ep21_30.py    # Arc 3: Trials, Treachery & Council Climax (Ep 21–30)
├── remediate_arc4_ep31_40.py    # Arc 4: Deep Sanctum, War & The True Shield (Ep 31–40)
├── remediate_full_novel.py      # Master Orchestrator: loads all arcs, validates, writes files & index.json
└── verify_novel_quality.py      # Verification harness (thresholds, keywords, sync)
```

### 6.2 Pre-Existing High-Grade Assets Integration
The remediation worker must capitalize on existing verified text:
- **Ep 01 & Ep 02**: Already complete in `scripts/novel_batch_1.py` and `scripts/novel_batch1_ep01_05.py` (4,060 and 3,829 chars, 0 errors, 9.20/10 score). Keep 100% intact.
- **Ep 03, 04, 05**: Foundational text in `scripts/novel_batch1_ep01_05.py` (EP03: 3,074 chars, EP04: 2,812 chars, EP05: 2,466 chars). These are completely free of regex corruption and canned dialogue. They need only ~600–900 characters of scene expansion (e.g. extending Robinyard's burial scene in Ep 03, expanding young Kadan's wolf encounter in Ep 04, elaborating on Aeolus's acoustic theory in Ep 05) to clear 3,500 characters cleanly!
- **Ep 06–40**: Build upon the authentic, clean synopses from `HEAD~1` using the 5-Act expansion blueprint, authoring bespoke dialogues and sensory beats.

### 6.3 Master Orchestrator Script Design (`remediate_full_novel.py`)
Below is the architectural specification of the master orchestrator to be implemented:

```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/remediate_full_novel.py
SNSHero Web Novel Master Remediation Builder
Orchestrates genuine commercial-grade literary fantasy prose for Episodes 01 - 40.
"""

import json
import os
import re
import sys

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BOOK_DIR = os.path.join(BASE_DIR, "public", "book")
EN_DIR = os.path.join(BOOK_DIR, "image_narrations", "english_txt")
INDEX_JSON_PATH = os.path.join(BOOK_DIR, "index.json")
MAPPING_TS_PATH = os.path.join(BASE_DIR, "src", "content", "englishNovelMapping.ts")

# Import modular arc dictionaries
from scripts.remediate_arc1_ep01_10 import ARC1_EPISODES
from scripts.remediate_arc2_ep11_20 import ARC2_EPISODES
from scripts.remediate_arc3_ep21_30 import ARC3_EPISODES
from scripts.remediate_arc4_ep31_40 import ARC4_EPISODES

ALL_EPISODES = {}
ALL_EPISODES.update(ARC1_EPISODES)
ALL_EPISODES.update(ARC2_EPISODES)
ALL_EPISODES.update(ARC3_EPISODES)
ALL_EPISODES.update(ARC4_EPISODES)

def sanitize_and_audit(ep_num: int, ko_text: str, en_text: str):
    """Enforces zero-tolerance checks on prose before saving."""
    # 1. No dead ends regex corruptions
    corruptions = [
        "결박펼쳐졌다", "시작펼쳐졌다", "함락펼쳐졌다", "발각펼쳐졌다", "완성펼쳐졌다",
        "배달펼쳐졌다", "발견되었다" if "발견펼쳐졌다" in ko_text else "", "포위펼쳐졌다",
        "거두지 않았다", "웃고 타올랐다", "내리고 타올랐다", "누워 타올랐다", "올라오고 타올랐다"
    ]
    for c in corruptions:
        if c and c in ko_text:
            raise ValueError(f"Episode {ep_num} contains prohibited corruption string: '{c}'")

    # 2. No filler sentence repetition
    forbidden_sentence = "대기를 타고 흐르는 미세한 마나의 파문이 칼날처럼 팽팽한 긴장감을 자아냈다."
    if ko_text.count(forbidden_sentence) > 1:
        raise ValueError(f"Episode {ep_num} repeats forbidden filler sentence {ko_text.count(forbidden_sentence)} times!")

    # 3. Ghost speaker check for Ignis (Ep 29 - 40)
    if ep_num >= 29:
        lines = ko_text.splitlines()
        for l in lines:
            if ('“' in l or '"' in l) and ("이그니스" in l or "Ignis" in l):
                # Ensure Ignis is not the speaker of direct quotes
                if any(l.strip().startswith(f"이그니스{sep}") for sep in [":", "가", "는", "의"]):
                    raise ValueError(f"Episode {ep_num}: Ghost speaker violation! Deceased Ignis cannot speak.")

    # 4. Length and dialogue assertions
    char_len = len(ko_text)
    if char_len < 3500:
        raise ValueError(f"Episode {ep_num}: Length {char_len} is under mandatory 3,500 chars!")

    dialogues = [l for l in ko_text.splitlines() if ('“' in l and '”' in l) or (l.strip().startswith('"') and l.strip().endswith('"'))]
    if len(dialogues) < 8:
        raise ValueError(f"Episode {ep_num}: Dialogue count {len(dialogues)} is under mandatory 8 lines!")

def main():
    print("==================================================")
    print("Executing SNSHero Web Novel Remediation Build...")
    print("==================================================")

    with open(INDEX_JSON_PATH, "r", encoding="utf-8") as f:
        index_data = json.load(f)

    total_chars = 0
    ep_char_counts = {}

    for ep_num in range(1, 41):
        if ep_num not in ALL_EPISODES:
            raise KeyError(f"Missing episode {ep_num} in authoring arcs!")

        ko_text, en_text, en_filename = ALL_EPISODES[ep_num]

        # Audit before saving
        sanitize_and_audit(ep_num, ko_text, en_text)

        # Write Korean episode file
        ep_pad = f"{ep_num:02d}"
        ko_path = os.path.join(BOOK_DIR, f"episode_{ep_pad}.md")
        with open(ko_path, "w", encoding="utf-8") as f:
            f.write(ko_text)

        # Write English episode file
        en_path = os.path.join(EN_DIR, en_filename)
        with open(en_path, "w", encoding="utf-8") as f:
            f.write(en_text)

        char_len = len(ko_text)
        total_chars += char_len
        ep_char_counts[ep_num] = char_len

    # Synchronize public/book/index.json
    index_data["totalCharacters"] = total_chars
    for ep_entry in index_data.get("episodes", []):
        num = ep_entry.get("episodeNumber")
        if num in ep_char_counts:
            ep_entry["characterCount"] = ep_char_counts[num]

    with open(INDEX_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(index_data, f, ensure_ascii=False, indent=2)

    print(f"\nSuccessfully wrote all 40 episodes!")
    print(f"Total Korean characters: {total_chars}")
    print(f"Synchronized {INDEX_JSON_PATH}")

if __name__ == "__main__":
    main()
```

---

## 7. Verification & Acceptance Protocol

The remediation worker and subsequent auditor must verify the work product using the following multi-tiered validation sequence:

### 7.1 Automated Quality & Metric Verification
```bash
# 1. Verify basic thresholds, keywords, English chapter mappings, and index.json sync
python3 scripts/verify_novel_quality.py
# Expected output: All 40 Korean episodes >= 3,500 chars, >= 8 dialogues, all lore keywords present, 0 errors.

# 2. Verify zero repetitive sentences and cross-pasted dialogues
python3 scripts/deep_inspect_repetitions.py
# Expected output: 0 dialogues repeated in >= 3 episodes. 0 occurrences of boilerplate sentences.

# 3. Verify absence of regex corruptions
git grep -n "펼쳐졌다" public/book/ | grep -E "결박펼쳐졌다|시작펼쳐졌다|함락펼쳐졌다|발각펼쳐졌다|완성펼쳐졌다|배달펼쳐졌다|포위펼쳐졌다"
# Expected output: 0 lines.

git grep -n "거두지 않았다" public/book/ | grep -E "고르지 거두지 않았다|읽지 거두지 않았다|하지 거두지 않았다|들지 거두지 않았다|깨지지 거두지 않았다"
# Expected output: 0 lines.

git grep -n "타올랐다" public/book/ | grep -E "얼어붙어 타올랐다|통로가 타올랐다|새겨져 타올랐다|내리고 타올랐다|누워 타올랐다"
# Expected output: 0 lines.

# 4. Verify absence of Ghost Speaker Ignis in Ep 29 - 40
python3 -c '
import glob
for ep in range(29, 41):
    f = f"public/book/episode_{ep:02d}.md"
    lines = open(f).readlines()
    for l in lines:
        if ("“" in l or "\"" in l) and ("이그니스" in l or "Ignis" in l):
            print(f"Violation in Ep {ep}: {l.strip()}")
'
# Expected output: 0 lines.

# 5. Execute Empirical Challenger Agent-as-Judge Literary Quality Audit
python3 scripts/audit_literary_quality.py
# Expected output: Composite score across all 9 sample episodes >= 8.5 / 10.0.

# 6. Execute Full IP Trilogy E2E Test Suite
npx tsx scripts/verify_ip_trilogy.ts --skip-build
# Expected output: 31/31 assertions pass.

# 7. Execute TypeScript & Production Build Checks
npx tsc --noEmit
npm run build
# Expected output: 0 errors.
```

---

## 8. Concrete Action Plan for Remediation Worker

| Step | Action | Description | Output Artifact |
|------|--------|-------------|-----------------|
| **Step 1** | **Preserve Ep 01 & 02** | Lock existing verified masterpieces in `public/book/episode_01.md` and `episode_02.md`. | Ep 01, Ep 02 |
| **Step 2** | **Expand Ep 03, 04, 05** | Take existing clean prose from `scripts/novel_batch1_ep01_05.py` and expand each episode by ~700 chars of genuine narrative to exceed 3,700 chars. | `scripts/remediate_arc1_ep01_10.py` (part 1) |
| **Step 3** | **Author Arc 1 (Ep 06–10)** | Expand synopses using the 5-Act framework: Star Breathing, Traitor's Tent, Crimson Mane taming, Beggar's Clothes, and Flame Court intrigue. | `scripts/remediate_arc1_ep01_10.py` |
| **Step 4** | **Author Arc 2 (Ep 11–20)** | Expand synopses: Dagger duel with Ignis, Two Graves, Celia's emerald staff arrival, Mist Lake crossing, Serpent/Lion assassination, Brothers at Elwin, Wind Isle crossing, Black Sanctum lore, Three Trials, Flower Ship battle. | `scripts/remediate_arc2_ep11_20.py` |
| **Step 5** | **Author Arc 3 (Ep 21–30)** | Expand synopses: Burning Ship betrayal, Deserted Island survival, Basalt Cave records, 7 Nights Sealing Chamber, False Wedding, Open Door Closed Heart, Two Promises, Emerald Council Climax (Ignis sacrifice), Queen of the Wind (Silia leadership & glass ember), Poison at Four Gates. | `scripts/remediate_arc3_ep21_30.py` |
| **Step 6** | **Author Arc 4 (Ep 31–40)** | Expand synopses: Aqualord's healing, Naiad's unrequited love, Black Marsh laboratory, Fallen Wind Isle, Star-Drunken Bell Tower reunion, Cross Stigmata map, Conqueror King's War, Three Silk Seals, World Worth Protecting, He Who Is Not Called a Hero. | `scripts/remediate_arc4_ep31_40.py` |
| **Step 7** | **Assemble & Execute Master Builder** | Run `scripts/remediate_full_novel.py` to write all 40 Korean markdown files, 40 English chapters, and update `index.json`. | `public/book/*.md`, `english_txt/*.txt`, `index.json` |
| **Step 8** | **Execute Full Verification Suite** | Run `verify_novel_quality.py`, `deep_inspect_repetitions.py`, `audit_literary_quality.py`, and `verify_ip_trilogy.ts`. | Verification Logs |
| **Step 9** | **Submit Mandatory Google Form Report** | Submit completion report via `python3 skills/report-ex/scripts/submit_report.py`. | Google Form Submission |
