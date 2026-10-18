# Comprehensive Literary Remediation Strategy: Arc 1 & Arc 2 (Episodes 07–10, 12–20)

**Author**: `iteration3_explorer_1` (teamwork_preview_explorer)  
**Date**: 2026-10-18T08:20:00Z  
**Target Work Product**: SNSHero Web Novel 40-Episode Remake (`public/book/episode_01.md`–`episode_40.md` & English counterparts)  
**Milestone Focus**: M1 (Web Novel Literary Adaptation & Integrity Restoration)  
**Status**: READ-ONLY Architectural Blueprint & Concrete Implementation Specification  

---

## Executive Summary

Following two consecutive forensic audit rejections due to mechanical text padding (Iteration 1: regex replacements & 585x boilerplate prefixing; Iteration 2: 440x new filler sentence injections, 5 static dialogue arrays copied 33x, and an English 521x facade generator), this report establishes an **authentic, commercial-grade literary authoring and expansion strategy** for the 13 non-preauthored episodes in Arc 1 and Arc 2:
$$\text{Target Episodes: } [07, 08, 09, 10, 12, 13, 14, 15, 16, 17, 18, 19, 20]$$

By conducting an anatomical dissection of the 7 genuine pre-authored gold standards (Ep 01–06, 11: 3,629–4,269 characters, 0 filler sentences, literary score > 9.2/10), we demonstrate that authentic volume and narrative immersion cannot be generated through template-splicing or generic combat stock phrases. Instead, genuine prose expansion emerges organically from **scene-grounded sensory worldbuilding** (regional food, climate, tactile textures, acoustic resonance, architectural layout), **character-specific dialogue exchanges** originating exclusively from entities physically present in the scene, and **tactical moral dilemmas**.

This report provides:
1. **Forensic Root Cause Analysis** explaining why previous automated expansions failed audit.
2. **Deconstruction of Gold Standards (Ep 01–06, 11)** showing the exact narrative mechanisms that achieve high literary quality.
3. **Episode-by-Episode Scene Architecture for Ep 07–10, 12–20**, detailing exact canonical plot events from `scripts/canon_synopses.json`, character presence lists (with strict exclusion lists), sensory worldbuilding palettes, scene-tied dialogue suites (8–14 distinct lines per episode), and core lore keyword placements (`은빛 단검`, `알렉산다르`, `발리안`, `이그니스`, `실리아`).
4. **Concrete Python Data & Script Architecture** (`scripts/author_arc1_arc2_clean.py`) that workers can execute to generate authentic, non-redundant Korean markdown chapters and paragraph-aligned English translations.

---

## 1. Forensic Root Cause Analysis & Forbidden Dead Ends

### 1.1 The Anatomy of Past Failures (Iteration 1 & Iteration 2)

| Iteration | Mechanism Employed | Observed Forensic Evidence | Integrity Violation Verdict |
|---|---|---|---|
| **Iteration 1** | Automated regex replacements (`되었다`→`펼쳐졌다`, `않았다`→`거두지 않았다`) + 585x identical boilerplate prepending (`대기를 타고 흐르는 미세한 마나의 파문이...`) | 129 ungrammatical verbs (`고르지 거두지 않았다`), 194 absurd semantics (`웃고 타올랐다`), dead characters speaking (Ignis speaking in Ep 35 after dying in Ep 28). | **INTEGRITY VIOLATION**: Artificial String Padding & Narrative Corruption |
| **Iteration 2** | Banned phrase substitution with 3 new hardcoded filler sentences (`scripts/remediate_all_novels.py:248-258`) + copy-pasting 5 static dialogue arrays across 33 episodes + 4-branch English fallback generator | 440 filler injections (295x `찰나의 순간에도...`, 79x `팽팽하게...`, 66x `옥빛...`). 10 identical dialogue lines in Ep 29–40 (Artus drops his broken sword in 12 straight episodes). Contextual hallucinations (Fenrir roars in a market soup stall in Ep 08; Cilia stands on a ship deck inside an underground cavern in Ep 18). English novel contains 521 copies of a single sentence. 33 episodes drop below 3,500 chars when stripped. Literary score 4.90/10. | **INTEGRITY VIOLATION / CHEATING DETECTED**: Facade Generation & Systematic Padding |

### 1.2 Dead End Prohibition Notice (STRICTLY FORBIDDEN)
Future remediation workers MUST NOT:
1. **Never use automated regex verb substitutions** across novel corpus.
2. **Never inject mechanical filler sentences** (such as appending static strings if `len(paragraph) < threshold` or if keywords like `전투`, `검`, `바람` match).
3. **Never copy-paste static dialogue pools** across multiple chapters. Every single dialogue line must be authored specifically for that chapter's scene, plot context, and physically present characters.
4. **Never emit facade fallback paragraphs in English chapters**. Every English paragraph must be a genuine, contextual translation of the corresponding Korean prose.
5. **Never introduce out-of-scene characters** into an episode (e.g. northern tribal lords appearing in capital market stalls, or deceased characters uttering lines post-mortem).

---

## 2. Anatomical Deconstruction of Gold Standards (Ep 01, 02, 03, 04, 05, 06, 11)

An empirical audit of the 7 gold standard episodes reveals the exact structural metrics that achieved commercial-grade scores (> 9.2/10):

| Episode | Title | Clean Characters | Paragraphs | Dialogue Lines | Distinct Characters Present | Literary Score |
|---|---|---|---|---|---|---|
| **Ep 01** | 눈보라 아래 두 서약 | 4,060 | 40 | 14 | Aleksandar, Balian, Herkul, Lucian, Issela, Elwin | 9.45 / 10 |
| **Ep 02** | 일곱 추적자의 맹세 | 3,829 | 40 | 16 | Herkul, Grimli, Eyla, Eliana, Gawain, Kaze, Rondol, Robinyard | 9.35 / 10 |
| **Ep 03** | 안개 절벽의 피 | 3,929 | 49 | 18 | Gawain, Grimli, Eyla, Eliana, Rondol, Kaze, Robinyard, Gorgo, Belphegor | 9.30 / 10 |
| **Ep 04** | 황야에서 자란 아이 | 3,629 | 47 | 20 | Kadan, Elwin, Gilgamesh, Fenrir, Titania, Gawain, Grimli, Belphegor | 9.25 / 10 |
| **Ep 05** | 폭우 속의 유령 | 3,925 | 43 | 16 | Kadan, Gawain, Grimli, Eyla, Rondol, Kaze, Eliana, Belphegor, Gorgo | 9.30 / 10 |
| **Ep 06** | 별을 호흡하는 법 | 4,055 | 41 | 16 | Kadan, Malfurion, Grimli, Gawain, Eyla, Rondol, Kaze, Elwin, Titania | 9.40 / 10 |
| **Ep 11** | 기억을 깨우는 단검 | 4,269 | 41 | 13 | Kadan, Cilia, Balian, Ignis, Six Masters, Gorgo | 9.50 / 10 |

### 2.1 The Four Pillars of Literary Success

1. **Granular Sensory Specificity (No Generic Abstractions)**:
   - *Ep 01*: Rather than writing "It was cold and tense", the text specifies: "마을 사람들은 틈새마다 두꺼운 기름 양피지를 덧대고 화로의 잿더미를 덮은 채 일찍이 등잔불을 껐다" (oil-soaked parchment on window cracks, covering ashes in fire hearths).
   - *Ep 11*: In the 7th underground labor camp, instead of saying "The mine was dark", the text describes: "지하 수로를 타고 흐르는 펄펄 끓는 용암의 붉은 열기가 숨이 막힐 듯 공기를 짓눌렀고... 화염석 벽면에 날카로운 정으로 하루하루의 날짜와 억울하게 죽어간 사람들의 이름을 뼈아프게 새겨 넣었다" (lava conduits in vents, chiseling dates and deceased names into volcanic stone).
2. **Context-Specific, Voice-Differentiated Dialogue**:
   - Each character possesses unique lexical cadences:
     - **Balian**: Dignified, stoic, deeply familial ("엄지손가락을 그렇게 치켜세우면 불꽃이 네 손목 혈관을 태운단다").
     - **Grimli**: Rough, blunt, dwarf artisan perspective ("어떤 놈이든 내 망치 앞에 걸리면 대가리가 모루에 달군 쇳덩이 꼴이 날 게다").
     - **Cilia**: Intelligent, observational, agile wind-mage perspective ("순찰 간격은 정확히 삼백 번의 호흡이에요. 환기구가 열릴 때 생기는 역풍을 타면 감시탑의 룬 렌즈를 피할 수 있어요").
     - **Kadan**: Sincere, concise, prioritizing life over pride ("너를 살리는 것은 방패가 아니라 인간의 도리다").
3. **Pacing via Paragraph Architecture**:
   - 40–45 paragraphs per chapter.
   - Narration paragraphs average 120–220 characters; dialogue lines stand in single isolated paragraphs with subtle physical attribution (e.g. `창끝을 번개처럼 뒤집어 칼날의 궤도를 쳐냈다.`, `가웨인이 쇠지팡이로 바닥을 세 번 두드렸다.`).
4. **Organic Placement of Lore Keywords**:
   - Lore keywords are woven into tactile actions: Aleksandar's silver dagger is gripped, its blade reflecting the hearth; Balian's arcane spear deflecting blades; Ignis's flame core scorching the snow.

---

## 3. Episode-by-Episode Scene Architecture for Ep 07–10, 12–20

Below is the definitive narrative blueprint for each non-preauthored chapter in Arc 1 and Arc 2, directly expanded from `scripts/canon_synopses.json`.

---

### Episode 07: 배신자들의 천막 (The Traitors' Pavilion)
- **Source**: `canon_synopses.json["7"]` (Wildlands Arc Climax)
- **Target Clean Characters**: ~4,050 characters | **Target Dialogues**: 12–14 lines
- **Cast Present**: Kadan (카단), Malfurion (말퓨온), Medusa Gorgo (메두사 고르고 - spotted at distance), Bargast (바르가스트), Fenrir (펜릴), Titania (티타니아), Gilgamesh (길가메시), Ursak (우르삭), Imperial Emissary.
- **Strictly Excluded**: Ignis, Cilia, Herkul, Walker, Rondol, Grimli, Eyla.
- **Lore Keywords Required**: `알렉산다르`, `은빛 단검`.
- **Sensory Worldbuilding**:
  - *Food/Smell*: Dried salted mutton jerky, roasted barley porridge steeped in yak butter, smoky tallow candles, bitter pine needle tea.
  - *Sound*: Wind flapping heavy horsehide tent eaves, clanking iron horse-bits, distant wolves howling across tundra ridges.
  - *Weather*: Freezing autumn twilight blizzard giving way to crystalline sub-zero dawn.
  - *Visual/Tactical*: Glinting red glass powder on saddle leather; Kadan deflecting blades with paper-thin frost barriers rather than rigid force.
- **5-Scene Breakdown**:
  - *Scene 1 (The Abandoned Mine)*: Kadan and Malfurion shadow Medusa Gorgo to an abandoned cobalt quarry; discover Bargast in secret council with Lucian's envoy.
  - *Scene 2 (The Disbelieved Warning)*: Kadan rushes to Fenrir's tribal yurt; Fenrir refuses to condemn his sworn brother of 30 years; Malfurion is bound as suspected court spy.
  - *Scene 3 (The Unyielding Proof & The Night Parley)*: Titania discovers red glass dust on the envoy's saddle. Bargast enters camp alone, returns wolf-fang necklace, urging surrender. Fenrir buries it: "전통이 무덤 수를 늘리는 핑계라면 깨부숴야지."
  - *Scene 4 (Dawn Assault & The Mercy to Ursak)*: Four imperial rune knights charge; Kadan blends star-breathing with six masters' defense. Kadan disarms and binds Bargast's wounded son Ursak, but cleans his bleeding gash and sends him back, shattering the attackers' morale.
  - *Scene 5 (The Burden of Victory & The Departure)*: Fenrir ambushes Bargast's rear camp, grants him an honorable execution. Fenrir decrees betrothal of Titania to Kadan; Titania tightens Kadan's red dagger ribbon: "나는 보물이 아니야, 카단. 돌아오면 그때 내가 너를 선택할지 다시 물어."

---

### Episode 08: 붉은 갈기의 기수 (Rider of the Crimson Mane)
- **Source**: `canon_synopses.json["8"]` (Transition to Capital & First Encounter)
- **Target Clean Characters**: ~4,000 characters | **Target Dialogues**: 14–16 lines
- **Cast Present**: Kadan (카단), Pegasus (페가수스 - wild horse), Horse Trader (경매상), Market Crowd, Beggar Girl / Cilia (실리아), Soup Stall Vendor (국밥 노점상), Thug Hunters, Wandering Knight Balbo (발보), Eliana (엘리아나), Ignis (이그니스).
- **Strictly Excluded**: Fenrir, Malfurion, Bargast, Herkul, Walker, Medusa Gorgo.
- **Lore Keywords Required**: `은빛 단검`, `이그니스`, `실리아`.
- **Sensory Worldbuilding**:
  - *Food/Smell*: Hot turnip and beef bone soup steaming in earthen bowls, toasted sesame bread, pungent sweet clover, horse sweat.
  - *Sound*: Clattering porcelain soup spoons, merchant shouts, sudden splintering of oak auction rails, wind rustling striped canvas awnings.
  - *Weather*: Mild golden autumn afternoon outside capital gates, dry chalky dust.
  - *Visual/Tactical*: Crimson mane scattering frost sparks; Cilia's soot-smudged cheeks and keen eyes; Ignis's immaculate white-silver armor and cruel white flame.
- **5-Scene Breakdown**:
  - *Scene 1 (Taming Pegasus)*: Southern plains auction corral; an untamable crimson-maned wild horse attacks handlers. Kadan enters unarmed, matches its pace until dusk when Pegasus rests muzzle on his shoulder. Horse smashes corral; crowd cheers.
  - *Scene 2 (The Soup Stall Encounter)*: Janggagu market; a beggar girl is accused of flour theft but proves the real culprit by foot powder. Kadan buys her hot soup and gives his fur mantle.
  - *Scene 3 (Dialogue over Soup)*: Girl tests soup for sleeping herbs; Kadan eats first. "낯선 사람을 너무 믿는 거 아니야?" / "배고픈 척까지 하며 수프를 구했다면 진짜 굶주린 것이겠지." She reveals her name as "실리아"; darkens at the name "이그니스".
  - *Scene 4 (Market Ambush)*: Horse thieves corner them in an alley; Cilia snaps fingers, summoning wind to drop market awnings and roll fruit crates, tripping attackers. "너 평범한 거지는 아니네."
  - *Scene 5 (The Public Duel Platform)*: Balbo holds duel for foster daughter Eliana. Ignis incinerates Eliana's vines with white fire, kicks her shoe into the crowd with contempt. Kadan ascends platform, returns shoe, challenges Ignis: "이겼다면 더 이상 증명할 게 없잖아. 왜 모욕하지?" Ignis notices the red ribbon and rune on Kadan's silver dagger.

---

### Episode 09: 거지 옷의 바람 (Wind in Beggar's Clothes)
- **Source**: `canon_synopses.json["9"]` (Capital Duel & Apothecary Infiltration)
- **Target Clean Characters**: ~4,000 characters | **Target Dialogues**: 12–14 lines
- **Cast Present**: Kadan, Ignis, Cilia (reveals elven heritage), Paladin Walker (워커), Balbo, Eliana, Six Masters (glimpsed in crowd), Apothecary Guards.
- **Strictly Excluded**: Fenrir, Titania, Malfurion, Bargast.
- **Lore Keywords Required**: `은빛 단검`, `알렉산다르`, `발리안`, `이그니스`, `실리아`.
- **Sensory Worldbuilding**:
  - *Food/Smell*: Camphor, crushed moonflower petals, dried angelica root, burning ozone, faint jasmine fragrance from Cilia's elven robes.
  - *Sound*: Cracking granite platform stones, hissing white fire, whispering wind silencing footfalls, muffled iron locks clicking under frost.
  - *Weather*: Chilly midnight, thin silvery clouds, heavy autumn dew on slate shingles.
- **5-Scene Breakdown**:
  - *Scene 1 (Duel on the Platform)*: Kadan's frost shield vs Ignis's white flame. Ignis resorts to Medusa Gorgo's life-drain claw, lacerating Kadan's shoulder.
  - *Scene 2 (Severing the Tracking Wards)*: Cilia directs subterranean wind currents to sever hidden imperial tracking runes beneath the flagstones.
  - *Scene 3 (Paladin Walker's Intervention)*: Walker erects holy blue barrier, intercepts Ignis: "누가 네게 그 손을 가르쳤지?" Walker is poisoned by Gorgo's necrotic toxin.
  - *Scene 4 (The Reveal of Cilia)*: Cilia discards beggar garments, revealing pointed elven ears and silver-blue silk: Princess of Whispering Wind Island. Kadan's honest reaction: "그 옷으로 추웠겠다."
  - *Scene 5 (Infiltrating the Imperial Apothecary)*: Cilia mutes footsteps with wind; Kadan freezes lock tumblers. They steal Moonlit Herb (달빛잎) and discover prison manifests hinting Balian survives in the 7th labor camp.

---

### Episode 10: 불꽃 궁정의 포로 (Prisoner of the Flame Court)
- **Source**: `canon_synopses.json["10"]` (Infiltrating Red Glass Court)
- **Target Clean Characters**: ~4,100 characters | **Target Dialogues**: 12–14 lines
- **Cast Present**: Kadan, Cilia, Issela (이셀라), Lucian (루시안), Ignis (watching from shadows), Flame Guards.
- **Strictly Excluded**: Fenrir, Titania, Malfurion, Bargast, Gawain, Rondol.
- **Lore Keywords Required**: `발리안`, `이그니스`, `실리아`, `은빛 단검`.
- **Sensory Worldbuilding**:
  - *Food/Smell*: Molten basalt sulfur, roasted barley tea, damp wool and flax, sweet untouched royal almond cakes.
  - *Sound*: Low hum of lava pipes behind polished red glass, creaking wooden spinning wheel, clinking porcelain teacups, crackling flame spears.
  - *Visual*: Humble thatched cottage isolated inside extravagant palace gardens; Issela spinning flax with hollow eyes.
- **5-Scene Breakdown**:
  - *Scene 1 (Subterranean Infiltration)*: Entering palace through herb drainage carts beneath ceiling lava conduits.
  - *Scene 2 (The Thatched Cottage in the Garden)*: Finding Issela spinning flax; two tea cups set every day for 18 years without knowing who she waits for.
  - *Scene 3 (Awakening the Sealed Memories)*: Kadan speaks Balian's name; Cilia unbinds dark memory seal. Issela recalls the blizzard, Balian falling from cliff, infant Ignis torn away.
  - *Scene 4 (Lucian's Threat)*: Lucian enters with elite flame guard, demanding Issela resume her facade. Kadan's frost rampart and Cilia's gale blast provide cover.
  - *Scene 5 (Ignis in the Colonnade)*: Ignis observes from high balcony; shaken by Issela's tears and the undeniable physical resemblance in her eyes. Kadan and Cilia escort Issela to safety.

---

### Episode 12: 두 무덤 사이의 봄 (Spring Between Two Graves)
- **Source**: `canon_synopses.json["12"]` (Sanctuary Defense & Cenotaph Vow)
- **Target Clean Characters**: ~4,050 characters | **Target Dialogues**: 14–16 lines
- **Cast Present**: Kadan, Balian, Issela, Herkul, Walker, Six Masters (그림리, 가웨인, 에일라, 엘리아나, 론돌, 카제), Cilia, Lucian & Imperial Enforcers, Ignis (hidden in forest).
- **Strictly Excluded**: Fenrir, Titania, Malfurion, Bargast.
- **Lore Keywords Required**: `발리안`, `알렉산다르`, `은빛 단검`, `이그니스`, `실리아`.
- **Sensory Worldbuilding**:
  - *Food/Smell*: Crushed comfrey poultice, holy water incense, thawing damp soil, fresh pine needles.
  - *Sound*: Balian's ragged breath, silver bells of Six Masters ringing in unison, clashing steel on sanctuary stairs, dripping meltwater.
  - *Visual*: Weathered cenotaph for Aleksandar; Balian's scarred hands pouring water; first snowdrop flower blooming through melting snow.
- **5-Scene Breakdown**:
  - *Scene 1 (The Besieged Sanctuary)*: Lucian surrounds ancient abandoned sanctuary to eliminate Balian. Balian's wound blackened by Gorgo's necrotic poison; Issela bandaging his chest.
  - *Scene 2 (Holding the Stairs)*: Herkul and Walker raise twin shields; Six Masters hold sanctuary stairs while Cilia opens wind evacuation path for the wounded.
  - *Scene 3 (Lucian's Ultimatums & Balian's Defiance)*: Lucian offers Balian's life if Issela returns. Balian: "내 아내의 존엄은 네놈의 더러운 주둥이에서 흥정되지 않는다."
  - *Scene 4 (Vow at Aleksandar's Cenotaph)*: In the courtyard, Balian pours holy water over Aleksandar's empty cenotaph: "형님, 약속대로 우리 아이들이 자랐소." Ignis watches in turmoil from the tree line.
  - *Scene 5 (Breakout to the East & The First Bloom)*: The party breaks through eastern pass toward the coast. Kadan spots a white snowdrop flower blooming from snow: winter ends, spring begins.

---

### Episode 13: 녹옥 지팡이의 주인 (Master of the Jade Staff)
- **Source**: `canon_synopses.json["13"]` (Coastal Mountain Journey & Leonar's Camp)
- **Target Clean Characters**: ~3,950 characters | **Target Dialogues**: 12–14 lines
- **Cast Present**: Kadan, Cilia, Leonar (레오나르 - lion-maned veteran general), Ignis (tracking from afar), Coastal Scouts.
- **Strictly Excluded**: Fenrir, Titania, Malfurion, Bargast, Herkul, Issela.
- **Lore Keywords Required**: `은빛 단검`, `이그니스`, `실리아`.
- **Sensory Worldbuilding**:
  - *Food/Smell*: Wild boar sizzling on slate stone, roasted pine nuts, crushed juniper, sharp woodsmoke.
  - *Sound*: Sizzling animal fat, Leonar's gruff chewing, emerald thud of the Jade Staff on rock, whispering sea wind.
  - *Tactical*: Leonar parrying Kadan's shield with the Jade Staff, teaching redirection over brute force.
- **5-Scene Breakdown**:
  - *Scene 1 (Smell of Smoke in the Cypress Woods)*: En route to Sevenshore harbor, Kadan and Cilia follow roasted meat aroma; find Leonar sleeping with Jade Staff as a pillow.
  - *Scene 2 (Culinary Direction)*: Leonar's boar meat is burnt outside and raw inside. Cilia takes over, uses gentle wind drafts and wild herbs to create an exquisite meal. Leonar devours it while feigning critique.
  - *Scene 3 (The Jade Staff & Ancient History)*: Leonar tests Kadan's stance with his staff, reveals history of Jade Council and how Wind Whisper Island's defenses fell to internal betrayal.
  - *Scene 4 (The Fire at the Ridge)*: Leonar detects Ignis stalking their camp; hurls a roasted skewer into the darkness: "숨어서 훔쳐보는 놈치고 배 안 고픈 놈 없다!" Ignis secretly eats.
  - *Scene 5 (Pact for the Coast)*: Leonar agrees to guide them across Mist Lake to Cloud Return Manor.

---

### Episode 14: 안개 호수의 손님들 (Guests of Mist Lake)
- **Source**: `canon_synopses.json["14"]` (72 Pillars & Cloud Return Manor)
- **Target Clean Characters**: ~4,000 characters | **Target Dialogues**: 12–14 lines
- **Cast Present**: Kadan, Cilia, Rondol (론돌 - one-legged boatman), Cloud Return Manor residents (fishermen, weavers, orphans), Water Serpents, Ignis (trailing).
- **Strictly Excluded**: Fenrir, Titania, Malfurion, Bargast, Herkul, Leonar.
- **Lore Keywords Required**: `실리아`, `이그니스`, `발리안`.
- **Sensory Worldbuilding**:
  - *Food/Smell*: Steamed lake carp with ginger and wild leeks, salted lotus root, cool river moss, moist lake mist.
  - *Sound*: Rhythm of Rondol's oar, Cilia's wind lullaby, creak of stilt pillars over deep water, splash of lake serpents.
  - *Visual*: Submerged city spires beneath emerald water; tactical mana circuit diagrams on manor walls.
- **5-Scene Breakdown**:
  - *Scene 1 (The 72 Stone Pillars)*: Mist Lake's towering basalt pillars holding low clouds over drowned ancient city ruins.
  - *Scene 2 (Song in the Fog & Rondol's Skiff)*: Cilia sings the wind lullaby; one-legged master Rondol rows out. Strained reunion: Rondol calls her "도망친 아이"; Cilia demands truth of his exile.
  - *Scene 3 (Cloud Return Manor)*: Safe haven on stilts for war orphans and fishermen. Kadan deciphers ancient defensive wall diagrams as combat deflection paths.
  - *Scene 4 (Water Serpent Attack)*: Corrupted lake serpents attack docks. Rondol creates whirlpools, Kadan lays frost bridges, Cilia fires gale arrows.
  - *Scene 5 (Ignis on the Outer Pier)*: Ignis arrives soaking wet at the dock; rejects sympathy, but Rondol silently hands him coarse dry linen and warm broth.

---

### Episode 15: 독사와 사자의 밤 (Night of the Viper and the Lion)
- **Source**: `canon_synopses.json["15"]` (Siege of Cloud Return Manor)
- **Target Clean Characters**: ~4,050 characters | **Target Dialogues**: 12–14 lines
- **Cast Present**: Kadan, Cilia, Rondol, Leonar, Ignis, Orihalcon (오리하르콘 - iron-palm elder), Manor Residents.
- **Strictly Excluded**: Fenrir, Titania, Malfurion, Bargast, Herkul, Balian.
- **Lore Keywords Required**: `이그니스`, `실리아`, `은빛 단검`.
- **Sensory Worldbuilding**:
  - *Food/Smell*: Burning pitch, brine-soaked hemp, ozone, charred reeds.
  - *Sound*: Orihalcon's iron palms shattering granite pillars, Leonar's lion roar, sizzle of ignited hemp nets on water.
  - *Visual*: Crimson-glowing iron gauntlets vs emerald Jade Staff; white flame barrier shielding civilian boats.
- **5-Scene Breakdown**:
  - *Scene 1 (The Skull Box Threat)*: Medusa Gorgo's five-finger imprinted skull box delivered, threatening massacre in three days.
  - *Scene 2 (Residents Stand Firm)*: Rondol attempts solitary sacrifice; residents refuse to abandon their home. Fishermen sharpen harpoons; weavers prepare brine nets.
  - *Scene 3 (Orihalcon's Midnight Assault)*: Martial elder Orihalcon strikes stilt pavilions with bare hands that shatter stone; Leonar intercepts with Jade Staff.
  - *Scene 4 (Cooperative Defense)*: Kadan's shield absorbs shockwaves; Cilia weaves wind traps; Ignis ignites oil-soaked nets into a blinding firewall, forcing Orihalcon to retreat.
  - *Scene 5 (Embers of Humanity)*: Ignis sits among wounded fishermen, quietly using precise flame embers to cauterize necrotic wounds; touched by their sincere gratitude.

---

### Episode 16: 폐허 앞의 형제 (Brothers Before the Ruins)
- **Source**: `canon_synopses.json["16"]` (Water Temple Parley & Lord Aeolus)
- **Target Clean Characters**: ~4,000 characters | **Target Dialogues**: 14–16 lines
- **Cast Present**: Kadan, Cilia, Lord Aeolus (에올루스), Rondol, Leonar, Ignis.
- **Strictly Excluded**: Fenrir, Titania, Malfurion, Bargast, Herkul, Balian, Lucian.
- **Lore Keywords Required**: `실리아`, `이그니스`, `알렉산다르`.
- **Sensory Worldbuilding**:
  - *Food/Smell*: Water lily fragrance, damp ancient marble, crisp dawn air.
  - *Sound*: Eerie black reed flute notes gliding over still water, whispering ripples, quiet resolute voices.
  - *Visual*: Aeolus walking upon water without parting the surface; black reed flute, long flowing emerald silk robes.
- **5-Scene Breakdown**:
  - *Scene 1 (Fog Clears at the Water Temple)*: Lord Aeolus arrives walking upon water, playing a mournful black reed flute.
  - *Scene 2 (Father-Daughter Confrontation)*: Cilia confronts Aeolus about locking the island, exiling Rondol, and his silence after mother Silphid's death.
  - *Scene 3 (The Flute Lowers)*: Aeolus touches her hair: "살아 있었구나." Yet demands surrender of the Nine Shadow Codex fragment.
  - *Scene 4 (Kadan and Ignis Intervene)*: Kadan refuses to surrender Cilia or the legacy of Aleksandar; Ignis challenges Aeolus's aristocratic hypocrisy.
  - *Scene 5 (Decree of the Three Trials)*: Aeolus challenges them to cross the barrier reef and face the Three Trials on Whispering Wind Island.

---

### Episode 17: 바람섬의 초대장 (Invitation to the Wind Island)
- **Source**: `canon_synopses.json["17"]` (Voyage on the Breeze Wing & Titania's Letter)
- **Target Clean Characters**: ~3,950 characters | **Target Dialogues**: 12–14 lines
- **Cast Present**: Kadan, Cilia, Ignis, Gryphon Messenger, Cutter Sailors on the *Breeze Wing*.
- **Strictly Excluded**: Fenrir, Titania, Malfurion, Bargast, Herkul, Balian, Aeolus.
- **Lore Keywords Required**: `실리아`, `이그니스`, `은빛 단검`.
- **Sensory Worldbuilding**:
  - *Food/Smell*: Salt spray, dried lemon peels, shipboard hardtack with honey, pitch and tar.
  - *Sound*: Groaning oak timbers, flapping canvas sails, gryphon screech, barrier storm howling in reef blowholes.
  - *Visual*: Giant white gryphon landing on mast; Titania's red letter on birch parchment; churning sea vortices.
- **5-Scene Breakdown**:
  - *Scene 1 (The Gryphon on the Rigging)*: Northern gryphon alights on the mast carrying Titania's crimson letter.
  - *Scene 2 (The Political Engagement)*: Fenrir has proclaimed Kadan's betrothal across the steppes. Kadan's conflict: childhood affection vs forced political union.
  - *Scene 3 (Deck Tension & Ignis's Rebuke)*: Cilia erases star coordinates; Ignis corrects course and delivers harsh truth: "두 사람 모두를 잃기 싫어 결정을 미루면, 결국 두 사람에게 결정의 값을 떠넘기게 된다."
  - *Scene 4 (Tempest at the Barrier Reef)*: Siren whirlpools and storm winds threaten the ship. Kadan uses star-breathing to synchronize ship motion; Cilia pacifies wind with her flute.
  - *Scene 5 (Lagoon of Wind)*: The vessel clears the outer breakers into the tranquil turquoise lagoon of Whispering Wind Island.

---

### Episode 18: 검은 성전의 비밀 (Secret of the Black Temple)
- **Source**: `canon_synopses.json["18"]` (Subterranean Archives & Truth of the Codex)
- **Target Clean Characters**: ~4,100 characters | **Target Dialogues**: 14–16 lines
- **Cast Present**: Kadan, Cilia, Ignis, Lord Aeolus, Elder Gandar (간다르 - imprisoned priest), Spirit residue of Silphid.
- **Strictly Excluded**: Fenrir, Titania, Malfurion, Bargast, Herkul, Rondol.
- **Lore Keywords Required**: `은빛 단검`, `알렉산다르`, `발리안`, `이그니스`, `실리아`.
- **Sensory Worldbuilding**:
  - *Food/Smell*: Mineral cavern air, white lotus oil incense, chilled mountain spring water.
  - *Sound*: Chimes of vibrating memory crystals, hollow water drips, Gandar's dry teasing laugh.
  - *Visual*: Obsidian walls glowing with floating runic scriptures of gold and azure; Gandar's unlocked iron cell.
- **5-Scene Breakdown**:
  - *Scene 1 (The Crystal Vault)*: Subterranean Black Temple; walls are giant memory crystals storing living runic light rather than paper books.
  - *Scene 2 (The Origin of the Nine Shadow Codex)*: Originally created for rapid cellular regeneration; inverted, it drains life from others.
  - *Scene 3 (Silphid's Sacrifice)*: Memory shows Cilia's mother attempting to heal a sick child, suffering magical backlash, forcing Aeolus to seal her away.
  - *Scene 4 (Gandar's Cell)*: Elderly Star Sanctuary priest Gandar stays in unlocked cell to torment Aeolus. Gandar inspects Kadan's silver dagger and Ignis's flame, recognizing them as heirs of the Holy Light.
  - *Scene 5 (Unifying the Vow)*: Realizing that stopping Medusa Gorgo requires restoring the original, uninverted harmony of the codex through mutual trust.

---

### Episode 19: 세 가지 시험 (Three Trials of Aeolus)
- **Source**: `canon_synopses.json["19"]` (Trials of Sound, Void, and Choice)
- **Target Clean Characters**: ~4,050 characters | **Target Dialogues**: 12–14 lines
- **Cast Present**: Kadan, Cilia, Lord Aeolus, Ignis, Island Council Elders.
- **Strictly Excluded**: Fenrir, Titania, Malfurion, Bargast, Herkul, Balian.
- **Lore Keywords Required**: `실리아`, `은빛 단검`, `이그니스`.
- **Sensory Worldbuilding**:
  - *Food/Smell*: Crushed mint leaves, ozone sparks, sweet night lily nectar.
  - *Sound*: Sonic flute blades slicing air, thunderous chasm updraft, shattering illusory glass mirrors.
  - *Visual*: Floating acoustic pillars, razor-thin crystal arch, illusory mirages of green steppes vs burning battlefield.
- **5-Scene Breakdown**:
  - *Scene 1 (Trial of Sound)*: Acoustic Granite Garden. Aeolus plays sonic blades on flute; Kadan senses ground vibrations taught by Gawain, parries blind. Aeolus weaves Cilia's childhood lullaby; Kadan harmonizes with star-breathing.
  - *Scene 2 (Trial of Void)*: Blindfolded crossing of razor-thin glass precipice over abyss. Kadan trusts thermal air currents and Cilia's gentle wind guidance.
  - *Scene 3 (Trial of Choice)*: Garden of Mirrors; illusions of a peaceful pastoral life with Titania in the steppes vs bloody continental war with Cilia.
  - *Scene 4 (Shattering the Illusion)*: Kadan smashes the mirror with his frost shield: "과거의 환영이나 안락한 도피처를 택하지 않겠다. 내 방패는 지금 곁에 있는 사람들을 지키는 데 쓰일 것이다."
  - *Scene 5 (Aeolus's Recognition)*: Aeolus yields, acknowledging Kadan's purity of purpose.

---

### Episode 20: 꽃배를 삼킨 파도 (Waves Swallowing the Flower Boat)
- **Source**: `canon_synopses.json["20"]` (Arc 2 Climax: Naval Invasion & Flower Boat Evacuation)
- **Target Clean Characters**: ~4,150 characters | **Target Dialogues**: 14–16 lines
- **Cast Present**: Kadan, Cilia, Ignis, Lord Aeolus, Island Refugees (seamstresses, elders, children), Lucian's Naval Fleet.
- **Strictly Excluded**: Fenrir, Titania, Malfurion, Bargast, Herkul, Balian.
- **Lore Keywords Required**: `이그니스`, `실리아`, `발리안`, `은빛 단검`.
- **Sensory Worldbuilding**:
  - *Food/Smell*: Burning white phosphorus naphtha, scorched flower wreaths, boiling seawater vapor, sulfur gunsmoke.
  - *Sound*: Thunderous broadsides of naval siege cannons, roaring sea surge, wind priest incantations, crackling white firewall.
  - *Visual*: Festival flower boats linked by ropes, hanging silk windbags; towering frozen sea-wall; Ignis glowing white on lead bow.
- **5-Scene Breakdown**:
  - *Scene 1 (The Flower Boat Flotilla)*: No warships on Wind Island; Cilia links festival flower boats into evacuation fleet, hanging wind-trapping silk bags beneath floral garlands.
  - *Scene 2 (Lucian's Fleet Bombardment)*: Imperial ironclads fire chemical white naphtha fire that burns across water toward refugee boats.
  - *Scene 3 (Ignis's Atonement)*: Ignis stands on the lead prow, recognizes the white flame formula created in his name, and absorbs the raging fire directly into his body to shield the boats ("내 이름으로 지은 죄는 내 손으로 태운다!").
  - *Scene 4 (Kadan's Frost Rampart & Aeolus's Tempest)*: Kadan freezes a tidal surge into a 30-meter ice rampart blocking cannon fire. Aeolus summons the Great West Wind, driving burning smoke back into imperial gunports, igniting powder magazines.
  - *Scene 5 (Dawn on the Open Ocean)*: Flotilla escapes into the sunrise as outer island towers crumble. Cilia bandages Ignis's burned arms; Kadan, Cilia, and Ignis stand united as true comrades facing Arc 3's continental war.

---

## 4. Technical Architecture: Python Data & Script Structure

To ensure that the execution worker produces pristine chapters without any possibility of artificial string padding or dialogue duplication, we define the concrete architecture of `scripts/author_arc1_arc2_clean.py`.

### 4.1 Schema Definition

```python
from dataclasses import dataclass
from typing import List, Tuple, Dict

@dataclass
class SceneBlock:
    scene_number: int
    narrative_paragraphs: List[str]  # Rich 120-240 character literary paragraphs
    dialogues: List[Tuple[str, str]]  # (Speaker attribution / action narrative, direct dialogue "...")

@dataclass
class EpisodeBlueprint:
    ep_number: int
    title_ko: str
    title_en: str
    original_range: str
    required_lore_keywords: List[str]
    scenes: List[SceneBlock]
    english_translation: List[str]  # Genuine paragraph-by-paragraph translation
```

### 4.2 Automated Quality Assertions in Script Execution

The script must execute the following validation suite before writing any file to disk:

```python
FORBIDDEN_PATTERNS = [
    "대기를 타고 흐르는 미세한 마나의 파문이 칼날처럼 팽팽한 긴장감을 자아냈다.",
    "찰나의 순간에도 긴장을 늦출 수 없는 무거운 정적 속에서, 전사들의 가슴속에 깃든 성기사의 맹세는 꺼지지 않는 별빛처럼 은은한 온기를 품고 있었다.",
    "팽팽하게 맞부딪친 무기 사이로 날카로운 쇳소리와 함께 불꽃이 허공을 수놓았고, 바닥 판석이 쩌적 갈라지며 자욱한 먼지를 일으켰다.",
    "옥빛 마나의 파문이 대기의 흐름을 타고 유려하게 퍼져 나가며, 칼날처럼 날카로운 바람의 장벽을 허공에 겹겹이 쌓아 올렸다.",
    "칠흑 같은 어둠 속에서 차가운 살기가 소리 없이 피어올랐으나, 전사들은 단 한 걸음도 물러서지 않고 서로의 등 뒤를 지켰다.",
    "거두지 않았다",
    "결박펼쳐졌다",
    "웃고 타올랐다",
    "내리고 타올랐다"
]

def validate_episode(ep_num: int, korean_text: str, english_text: str, required_kws: List[str]):
    # 1. Zero forbidden strings
    for pat in FORBIDDEN_PATTERNS:
        assert pat not in korean_text, f"Ep {ep_num} contains forbidden pattern: {pat}"
        
    # 2. Strict character count bounds
    char_count = len(korean_text)
    assert 3600 <= char_count <= 4400, f"Ep {ep_num} character count out of bounds: {char_count} (must be 3,600-4,400)"
    
    # 3. Direct dialogue lines >= 8
    dialogues = re.findall(r'[\"“][^\"”\n]+[\"”]', korean_text)
    assert len(dialogues) >= 8, f"Ep {ep_num} has insufficient dialogues: {len(dialogues)} (must be >= 8)"
    
    # 4. Lore keywords verification
    for kw in required_kws:
        assert kw in korean_text, f"Ep {ep_num} missing required lore keyword: {kw}"
        
    # 5. English chapter authenticity
    en_paras = [p.strip() for p in english_text.split('\n\n') if p.strip()]
    unique_en_paras = set(en_paras)
    dupe_ratio = 1.0 - (len(unique_en_paras) / max(1, len(en_paras)))
    assert dupe_ratio < 0.05, f"Ep {ep_num} English text has excessive paragraph duplication ({dupe_ratio:.2%})"
    assert "In the tense silence between heartbeats" not in english_text or english_text.count("In the tense silence between heartbeats") <= 1, "Facade English detected!"
```

### 4.3 English Translation Commercial Standard

The English novel files (`public/book/image_narrations/english_txt/SNSHero_Novel_Episode_{pad}_EN.txt`) and `src/content/englishNovelMapping.ts` must be generated through genuine literary translation of each Korean paragraph.
For example, for Episode 08:
- **Korean**: `남쪽 평원에 들어서자 카단은 검붉은 갈기의 야생마를 만났다. 말은 등에 사람을 태우기는커녕 가까이 온 병사의 갑옷을 걷어차 찌그러뜨렸다.`
- **Genuine English**: `Emerging onto the rolling southern plains, Kadan encountered a wild stallion with a mane the color of dried blood. Far from accepting a rider, the beast had crushed the iron breastplate of an approaching handler with a single vicious kick.`
- **Forbidden Facade**: `"In the tense silence between heartbeats, the quiet conviction of the ancient paladins breathed an enduring warmth into their spirits..."` (This was repeated 521 times in Iteration 2).

---

## 5. Implementation Roadmap for Remediation Worker

1. **Step 1: Write Data Script (`scripts/author_arc1_arc2_clean.py`)**:
   - Embed the rich, scene-tied paragraph blueprints and dialogues for all 13 target episodes (07, 08, 09, 10, 12, 13, 14, 15, 16, 17, 18, 19, 20).
   - Embed the corresponding authentic English literary translations.
2. **Step 2: Execute Generation & Validation**:
   - Run `python3 scripts/author_arc1_arc2_clean.py` to overwrite `public/book/episode_{pad}.md` and `public/book/image_narrations/english_txt/SNSHero_Novel_Episode_{pad}_EN.txt`.
   - Update `public/book/index.json` character counts and `src/content/englishNovelMapping.ts`.
3. **Step 3: Run Full Quality & Verification Suite**:
   - `python3 scripts/verify_novel_quality.py`
   - `npx tsx scripts/verify_ip_trilogy.ts`
   - `npx tsx scripts/challenger_empirical_stress.ts`
   - `npx tsc --noEmit`
   - `npm run build`
4. **Step 4: Independent Agent-as-Judge Audit**:
   - Verify that sample scores across early/mid arcs exceed the mandatory 8.5/10 threshold.

---

## Conclusion

By eliminating every synthetic shortcut, template-appender, and facade generator, and replacing them with a scene-grounded, character-coherent literary architecture, the project will restore absolute creative integrity and fulfill the authoritative requirements of the SNSHero IP Trilogy Remake.
