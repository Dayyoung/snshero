# 40-Chapter Storyline Synchronization & RPG Mode Specification Survey

**Explorer**: Explorer 1 (Storyline & Script Mapping)  
**Date**: 2026-10-18T20:15:00Z  
**Target Project**: SNSHero Revolution (`/main` RPG Mode)  
**Canonical Sources**:
- `src/content/englishNovelMapping.ts` (`ENGLISH_NOVEL_MAP`)
- `public/book/index.json` (`episodes`, `characters`, `protagonists`)
- `public/book/episode_01.md` ~ `episode_40.md` (Rich 40-Episode Web Novel Source)
- `src/content/webtoonEpisodeManifest.json` & `src/content/webtoonEpisodes.ts` (`EPISODE_HERO_MAP`)

---

## 1. Executive Summary & Investigation Boundary

### 1.1 Objective
The purpose of this survey is to investigate the exact discrepancies between the canonical 40-episode SNSHero webnovel/webtoon storyline and the current `/main` RPG mode (`src/content/kadanRpgStory.ts`, `src/content/kadanRpgNovelScript.ts`, `src/components/rpg/KadanNpcDialog.tsx`, and `src/lib/i18n.ts`), and to formulate an authoritative, complete specification for synchronizing all 40 chapters, introducing interactive protagonist (Kadan) dialogue choices with timer countdowns, and designing random field encounters with Bandit/Thief decks.

### 1.2 Core Discovery
1. **Severe Narrative Drift**: In `src/content/kadanRpgNovelScript.ts`, only Episode 1 aligned with the webnovel. Chapters 2 through 40 were legacy placeholder vignettes (e.g. generic ghouls in caves, siege engines, peach blossom islands, storm strikes) with zero relation to canonical episodes such as *"Oath of the Seven Pursuers"*, *"Blood on the Mist Cliff"*, *"The Child Raised in the Wastes"*, *"The Art of Breathing Stars"*, *"Rider of the Crimson Mane"*, *"Prisoner of the Flame Court"*, or *"War of the Conqueror King"*.
2. **Translation Key Inconsistency**: In `src/lib/i18n.ts`, `kadan_rpg_chapter_01` was titled *"한밤의 추격자들"* / *"Midnight Pursuers"* instead of *"눈보라 아래 두 서약"* / *"Two Vows Beneath the Blizzard"*, and chapters 2–40 all used obsolete placeholder titles.
3. **No Interactive Choice Structure**: `KadanRpgNovelScriptLine` currently supports only flat monologue/dialogue (`speaker`, `name`, `text`, `cardId`) without choice branches, follow-up reaction lines, or immediate buffs/SNS rewards.
4. **Dialogue Display Language Limitation**: `KadanNpcDialog.tsx` line 77 restricts script lookup to `language === 'ko'`. Non-Korean users only receive generic 3-line template strings.
5. **Auto-Runner Dialogue Bypass**: `useKadanRpgAutoRunner` immediately clears dialogues upon auto-advance instead of allowing the player or timer to experience the dialogue and choice nodes.

---

## 2. Canonical 40-Episode Storyline Reference Matrix

Below is the authoritative mapping of all 40 episodes from the canonical webnovel and webtoon manifest:

| Ep | Canonical Title (KO) | Canonical Title (EN) | Focus Hero (Card ID) | Key Characters (Card IDs) | Setting & Region | Narrative Conflict & Climax | Opponent Deck Theme |
|:---|:---|:---|:---|:---|:---|:---|:---|
| **01** | 눈보라 아래 두 서약 | Two Vows Beneath the Blizzard | Kadan (41) | Aleksandar (50), Balian (43), Hercul (49), Elwin (42), Lucian (61), Artus (60), Ignis (11) | Elwin Village (`elwin-wildland`) | Blizzard night; pregnant mothers; Hercul brings silver daggers; Lucian surrounds bridge; Aleksandar's last stand. | Shadow Vanguard (`[51, 52, 61, 60, 43]`) |
| **02** | 일곱 추적자의 맹세 | Oath of the Seven Pursuers | Hercul (49) | Hercul (49), Gawain (45), Kaze (44), Rondol (46), Aila (70), Grimli (74), Robinyard (48) | Sevenbridge Harbor (`elwin-wildland`) | Hercul tracks assassins to Sevenbridge; mistaken clash with the 7 outcasts; rescued orphan reveals truth; oath to find Kadan. | Seven Pursuers Sworn Hunters (`[44, 45, 46, 70, 74]`) |
| **03** | 안개 절벽의 피 | Blood on the Mist Cliff | Robinyard (48) / Grimli (74) | Kadan (41), Robinyard (48), Belphegor (13), Medusa Gorgo (89), Gawain (45), Eliana (63) | Mistfall Cliffs (`red-cliff`) | Dark half of Nine-Shadow Codex stolen; Belphegor & Medusa Gorgo ambush the hunters in purple fog; Robinyard's sacrifice. | Mist Cliff Obsidian Cult (`[13, 89, 54, 55, 48]`) |
| **04** | 황야에서 자란 아이 | The Child Raised in the Wastes | Kadan (41) | Kadan (41), Gilgamesh (47), Fenrir (81), Elwin (42), Titania (64) | Wildland Tundra (`red-cliff`) | Kadan grows up in nomad tent; craggy ice river ambush; saves wounded boy Gilgamesh with bare hands; Fenrir's wolf pack respects him. | Frost Plains Ambushers (`[81, 82, 83, 87, 47]`) |
| **05** | 폭우 속의 유령 | Phantom in the Downpour | Kadan (41) | Kadan (41), Gawain (45), Celia (62), Aeolus (25), Belphegor (13), Grimli (74), Aila (70) | Rain-swept Gorge (`red-cliff`) | Violent storm; unseen shadow assassin stalks outpost; Kadan relies on ground vibrations and shield instincts to parry lethal blow. | Torrential Shadow Phantoms (`[13, 25, 51, 74, 70]`) |
| **06** | 별을 호흡하는 법 | The Art of Breathing Stars | Malfuon (66) | Kadan (41), Malfuon (66), Grimli (74), Balian (memory 43), Titania (64) | High Peak Ice Crag (`mana-caves`) | 6 masters' conflicting training stalls Kadan; hermit Malfuon teaches Star Breathing (성진호흡법) beneath full moon. | Astral Cavern Trial Wardens (`[66, 74, 84, 64, 43]`) |
| **07** | 배신자들의 천막 | The Traitors Camp | Kadan (41) | Kadan (41), Fenrir (81), Barghest (87), Ursoc (88), Lucian (61), Titania (64) | Rebel Pavilion (`mana-caves`) | Infiltrating turncoat camp selling intelligence to Regent Artus; discovering forged royal warrants; battle in burning tents. | Rebel Chieftain & Traitors (`[87, 88, 61, 81, 52]`) |
| **08** | 붉은 갈기의 기수 | Rider of the Crimson Mane | Kadan (41) | Kadan (41), Celia (62), Ignis (11), Pegasus/Crimson Mane (90), Balbo (71) | Pegasus Valley (`mana-caves`) | Untamable savage steed 'Crimson Mane'; Kadan calms horse with Star Breathing; rescues Celia from merchant; defeats 12 horse thieves. | Crimson Mane Horse Thieves (`[90, 71, 11, 60, 49]`) |
| **09** | 거지 옷의 바람 | Wind in Beggars Clothes | Kadan (41) | Kadan (41), Celia (62), Ignis (11), Walker (51), Aeolus (25), Lucian (61), Ysela (107) | Southern Imperial Road (`southern-road`) | Disguised in beggars' rags to infiltrate imperial border; Celia uses stealth intelligence; avoiding Lucian's inquisitors. | Imperial Border Sentinels (`[51, 61, 25, 107, 41]`) |
| **10** | 불꽃 궁정의 포로 | Prisoner of the Flame Court | Ignis (11) | Kadan (41), Ignis (11), Balian (43), Lucian (61), Celia (62), Ysela (107) | Red Glass Palace (`southern-road`) | Red Glass Court banquet; Ignis performs white flame trial; Balian tortured beneath glass floor; Kadan awakens Ysela's memory. | Red Glass Court Inquisitors (`[61, 107, 51, 11, 43]`) |
| **11** | 기억을 깨우는 단검 | The Dagger That Wakes Memory | Kadan (41) | Kadan (41), Ignis (11), Balian (43), Celia (62), Belphegor (13), Medusa Gorgo (89) | Colosseum Arena (`southern-road`) | Arena tournament; Kadan and Ignis clash; twin silver daggers resonate; fathers' oath echoes through white flame and shield. | Arena Champions of the Flame (`[11, 13, 89, 74, 43]`) |
| **12** | 두 무덤 사이의 봄 | Spring Between Two Graves | Kadan (41) | Kadan (41), Balian (43), Ignis (11), Hercul (49), Lucian (61), Magitech Golem (99) | Paladin Memorial (`southern-road`) | Visiting paladin memorial chapel; shadow legion unleashes Magitech Golems; spring flowers bloom amidst scarred stone tombs. | Graveyard Siege Golems (`[99, 49, 61, 107, 43]`) |
| **13** | 녹옥 지팡이의 주인 | Master of the Jade Staff | Leonar (86) | Kadan (41), Leonar (86), Celia (62), Ignis (11), Aeolus (25), Pegasus (90) | Jade Council Grove (`taiho-beastlands`) | Ancient druidic master of the Jade Staff; testing Kadan's moral resolve; forging covenant between beast tribes and refugees. | Beast Clan Staff Wardens (`[86, 25, 90, 62, 11]`) |
| **14** | 안개 호수의 손님들 | Guests of the Mist Lake | Rondol (46) | Kadan (41), Rondol (46), Ignis (11), Celia (62), Belphegor (13), Medusa Gorgo (89) | Taiho Mist Lake (`taiho-beastlands`) | Skiff crossing across foggy Taiho waters; masked corsairs and lake wraiths ambush boats; water-shield synchronization. | Mist Lake Shadow Corsairs (`[46, 13, 89, 61, 52]`) |
| **15** | 독사와 사자의 밤 | Night of Serpent and Lion | Leonar (86) | Kadan (41), Leonar (86), Celia (62), Ignis (11), Orihalcon (38), Belphegor (13) | Beast Stronghold (`taiho-beastlands`) | Grand banquet in Beast Stronghold poisoned by Viper assassins; Leonar and Kadan hold the great hall door against poison darts. | Viper Clan Night Assassins (`[13, 38, 86, 46, 54]`) |
| **16** | 폐허 앞의 형제 | Brothers Before the Ruins | Balian (43) / Ignis (11) | Kadan (41), Ignis (11), Balian (43), Celia (62), Sylphid (23), Ysela (107) | Windmill Ridge Ruins (`taiho-beastlands`) | Balian makes heroic last stand at windmill ridge to allow Kadan and Ignis to escape; brothers weep before smoking ruins. | Imperial Execution Vanguard (`[60, 43, 61, 23, 107]`) |
| **17** | 바람섬의 초대장 | Invitation to the Wind Isle | Celia (62) | Kadan (41), Celia (62), Rondol (46), Ignis (11), Griffon (84), Titania (64), Fenrir (81) | Coastal Port (`shadow-palace`) | Celestial messenger brings sealed invitation to Wind Isle; sea wyverns attack departure docks; setting sail into storm. | Gale Harbor Storm Beasts (`[84, 64, 81, 46, 11]`) |
| **18** | 검은 성전의 비밀 | Secret of the Black Sanctum | Gandar (69) | Kadan (41), Celia (62), Ignis (11), Gandar (69), Magitech Golem (99), Titania (64) | Black Sanctum (`shadow-palace`) | Sunken temple library; deciphering forbidden archives revealing Regent Artus's pact with Abyssal overlords. | Black Sanctum Archons (`[69, 99, 64, 62, 11]`) |
| **19** | 세 가지 시험 | Three Trials | Aeolus (25) | Kadan (41), Aeolus (25), Celia (62), Ignis (11), Gawain (45), Belphegor (13) | Wind Isle Chambers (`shadow-palace`) | Three trials of Courage, Wisdom, and Compassion to qualify for Nine-Shadow Codex; parrying illusions without drawing blood. | Elemental Trial Keepers (`[25, 45, 13, 69, 62]`) |
| **20** | 꽃배를 삼킨 파도 | The Wave That Swallowed the Flower Ship | Gandar (69) | Kadan (41), Celia (62), Ignis (11), Gandar (69), Aeolus (25), Pegasus (90) | Offshore Sea (`shadow-palace`) | Lavish floral diplomatic ship swallowed by artificial rogue tidal waves summoned by abyssal dreadnoughts; mid-sea boarding fight. | Abyssal Tidal Corsairs (`[69, 25, 46, 90, 62]`) |
| **21** | 불타는 배의 배신 | Betrayal Aboard the Burning Ship | Lucian (61) / Artus (60) | Kadan (41), Ignis (11), Lucian (61), Celia (62), Artus (60), Leonar (86) | Burning Flagship (`wind-island`) | Saboteurs detonate powder magazines; Lucian unmasked on burning deck; battle amidst falling burning sails and smoke. | Burning Ship Traitors (`[61, 60, 86, 38, 11]`) |
| **22** | 무인도의 네 사람 | Four on a Deserted Island | Grimli (74) | Kadan (41), Celia (62), Grimli (74), Ignis (11), Artus (60), Titania (64) | Deserted Volcanic Isle (`wind-island`) | 4 castaways stranded on barren volcanic reef; survival pact against giant crab chimeras; discovering ancient survival camaraderie. | Volcanic Island Chimeras (`[74, 84, 64, 60, 11]`) |
| **23** | 동굴 속 잠든 기록 | The Record Sleeping in the Cave | Aleksandar (50) (echo) | Kadan (41), Ignis (11), Celia (62), Balian (43), Aleksandar (50), Ironforge (80) | Island Sea Grotto (`wind-island`) | Secret grotto hiding Paladin Order's stone monument carved with the two fathers' true names and vows. | Monument Ancient Sentinels (`[50, 80, 86, 43, 11]`) |
| **24** | 봉인실의 일곱 밤 | Seven Nights in the Sealed Chamber | Gilgamesh (47) | Kadan (41), Ignis (11), Celia (62), Gilgamesh (47), Artus (60), Orihalcon (38) | Collapsing Sealed Vault (`wind-island`) | Trapped for 7 nights in dark seal chamber; running low on air and water; combining white flame and shield to breach obsidian doors. | Vault Sealed Terrors (`[60, 47, 38, 11, 62]`) |
| **25** | 거짓 혼례의 밤 | Night of the False Wedding | Lucian (61) | Kadan (41), Lucian (61), Celia (62), Ignis (11), Artus (60), Ironforge (80) | Grand Cathedral (`wind-island`) | Lucian attempts forced political marriage with captive Celia; Kadan crashes cathedral window; shield shatters altar. | Cathedral Inquisitor Guard (`[61, 60, 80, 11, 41]`) |
| **26** | 열린 문, 닫힌 마음 | Open Door, Closed Heart | Lucian (61) | Kadan (41), Ignis (11), Celia (62), Lucian (61), Artus (60), Ironforge (80) | Iron Bastion Gate (`wind-island`) | Open gate lures party into killing courtyard; overcoming mutual suspicions to form unbroken battle phalanx. | Iron Bastion Trap Phalanx (`[61, 60, 80, 41, 11]`) |
| **27** | 두 약속 사이 | Between Two Promises | Gilgamesh (47) | Kadan (41), Ignis (11), Celia (62), Gilgamesh (47), Fenrir (81), Titania (64) | Red Mountain Pass (`wind-island`) | Torn between vengeance for slaughtered kin and protecting desperate refugee wagon train; Kadan chooses to shield refugees. | Mountain Pass Raiding Horde (`[47, 81, 64, 84, 11]`) |
| **28** | 녹옥 의회의 반란 | Revolt of the Jade Council | Leonar (86) | Kadan (41), Ignis (11), Lucian (61), Celia (62), Leonar (86) | Jade Council Chambers (`wind-island`) | Corrupt council magistrates attempt armed coup in council hall; Leonar's warriors and Kadan defeat conspirators. | Corrupt Magistrate Guard (`[61, 86, 11, 62, 41]`) |
| **29** | 바람의 여왕 | Queen of the Wind | Sylphid (23) / Aqualord (5) | Kadan (41), Celia (62), Ignis (11), Aqualord (5), Orihalcon (38), Arachne (54) | Sky Spire Terrace (`final-citadel`) | Reaching pinnacle terrace of Wind Queen Sylphid; obtaining aerial blessings and elemental crest to strike the Citadel. | Sky Spire Tempest Wardens (`[5, 38, 54, 62, 11]`) |
| **30** | 네 관문의 독 | Poison at the Four Gates | Malfuon (66) | Kadan (41), Celia (62), Ignis (11), Aqualord (5), Malfuon (66), Barghest (87) | Four Citadel Gates (`final-citadel`) | Artus poisons city reservoir through the 4 cardinal gates; Kadan uses Star Breathing to purify water channels under heavy fire. | Four Gates Poison Legion (`[66, 65, 87, 5, 11]`) |
| **31** | 모든 것을 건 손 | The Hand That Wagered Everything | Aquaris (1) / Naiad (2) | Kadan (41), Celia (62), Ignis (11), Aquaris (1), Naiad (2), Aqualord (5) | Sunken Strategy Chamber (`final-citadel`) | High-stakes war council; wagering sacred relics and position to force enemy shadow army into open field. | Council Elite Champions (`[1, 2, 5, 69, 11]`) |
| **32** | 첫사랑의 잔향 | Echo of First Love | Celia (62) | Celia (62), Kadan (41), Sylphid (23), Ignis (11), Lucian (61), Aquaris (1) | Moonlit Garden (`final-citadel`) | Night before final assault; Celia and Kadan share quiet confession under silver boughs; reaffirming purpose to survive. | Moonlit Illusion Phantoms (`[23, 61, 69, 1, 11]`) |
| **33** | 검은 늪의 원한 | Grudge of the Black Marsh | Artus (60) | Kadan (41), Lucian (61), Celia (62), Gandar (69), Artus (60), Aqualord (5) | Black Marsh Necropolis (`final-citadel`) | Slogging through swamp of reanimated dead; confronting vengeful spirits and crushing the vanguard necromancers. | Black Marsh Undead Legion (`[60, 61, 69, 5, 62]`) |
| **34** | 무너진 바람섬 | The Fallen Wind Isle | Aeolus (25) | Kadan (41), Celia (62), Gawain (45), Grimli (74), Aeolus (25), Artus (60) | Collapsing Bastion (`final-citadel`) | Dark siege artillery collapses floating fortress; desperate evacuation of civilians while towers crash into sea. | Bastion Demolition Golems (`[25, 45, 74, 60, 70]`) |
| **35** | 안개 속의 오인 | Mistaken in the Fog | Hercul (49) | Kadan (41), Celia (62), Lucian (61), Hercul (49), Aeolus (25), Grimli (74) | Valley of Mirages (`final-citadel`) | Abyssal fog conjures phantom clones of comrades; Kadan senses true heartbeats through Star Breathing, breaking illusions. | Mirage Doppelgängers (`[49, 25, 74, 70, 61]`) |
| **36** | 십자 성흔의 지도 | Map of the Cross-Shaped Scar | Gilgamesh (47) | Kadan (41), Celia (62), Lucian (61), Fenrir (81), Gilgamesh (47), Artus (60) | High Fortress Redoubt (`final-citadel`) | Deciphering ancient cross-shaped dragon scar to expose structural weakness in Citadel's core energy reactor. | High Fortress Core Wardens (`[47, 81, 60, 64, 61]`) |
| **37** | 정복왕의 전쟁 | War of the Conqueror King | Gilgamesh (47) | Kadan (41), Celia (62), Fenrir (81), Lucian (61), Gilgamesh (47), Ignis (11) | Grand Battlefields (`final-citadel`) | Gilgamesh leads united continental army; cavalry clash against Regent Artus's shadow phalanx on open plain. | Regent's Armored Phalanx (`[47, 81, 61, 11, 60]`) |
| **38** | 세 개의 비단 봉인 | Three Silk Seals | Lucian (61) | Kadan (41), Lucian (61), Celia (62), Gilgamesh (47), Ironforge (80), Gawain (45) | Throne Room Ante-Chamber (`final-citadel`) | Shattering the 3 imperial seals locking the throne hall; final confrontation and defeat of corrupt vizier Lucian. | Throne Room Imperial Seals (`[61, 47, 80, 70, 45]`) |
| **39** | 지켜야 할 세계 | The World Worth Protecting | Artus (60) | Kadan (41), Lucian (61), Celia (62), Ignis (11), Aqualord (5), Artus (60) | Celestial Throne Core (`final-citadel`) | Final showdown with Regent Artus in his abyssal form; Kadan's shield and Ignis's white flame combine to shatter dark crown. | Death Knight Regent Artus Core (`[60, 5, 11, 90, 61]`) |
| **40** | 영웅이라 불리지 않는 자 | One Who Is Not Called a Hero | Kadan (41) / Celia (62) | Kadan (41), Celia (62), Ignis (11), Aleksandar (50), Balian (43), Gilgamesh (47) | Horizon Road to Elwin (`final-citadel`) | Rejecting emperor's crown and dukedom; Kadan and Celia walk into the spring morning to heal wounds of common folk. | Final Abyssal Echo / Horizon Trail (`[41, 50, 43, 47, 11]`) |

---

## 3. Detailed Discrepancy & Gap Analysis

### 3.1 `src/content/kadanRpgNovelScript.ts`
- **Total Lines**: Currently 240 lines, 40 chapters.
- **Root Failure**: Only Chapter 1 dramatizes the webnovel. Chapters 2–40 use an alternate legacy story involving generic monster hunting, martial arts sects, and arbitrary plot devices.
- **Speaker Attribution**: Missing bilingual names (`nameEn`), English translations (`textEn`), and character card IDs are haphazardly assigned (e.g. Celia assigned ID 47 instead of 62; Hercul assigned ID 49 in Ep 1 but missing later).
- **Interactive Choice Nodes**: Zero choice nodes exist in `kadanRpgNovelScript.ts`.

### 3.2 `src/content/kadanRpgStory.ts`
- **`chapterRegionIds` Array**:
  Currently maps chapters 1–40 across 8 regions, but contains illogical jumps (e.g., Chapter 4 jumps to `shadow-palace`, Chapter 5 jumps back to `elwin-wildland`).
  **Recommended Region Alignment**:
  - Ch 01–02: `elwin-wildland` (Snowbound frontier, Elwin village & Sevenbridge)
  - Ch 03–05: `red-cliff` (Mist cliffs, frozen wastes, downpour gorge)
  - Ch 06–08: `mana-caves` (Star breathing caves, beast border, Pegasus valley)
  - Ch 09–12: `southern-road` (Southern imperial road, flame court, cemetery)
  - Ch 13–16: `taiho-beastlands` (Mist lake, beast clan stronghold, windmill ridge ruins)
  - Ch 17–20: `shadow-palace` (Gale harbor, black sanctum, trial chambers, flower ship)
  - Ch 21–28: `wind-island` (Burning ship, deserted reef, cave record, sealed chamber, false wedding)
  - Ch 29–40: `final-citadel` (Sky spire, four gates, black marsh, fallen isle, war of conqueror king, throne core, horizon epilogue)
- **`speakerCardIds` Array**:
  Currently lists mismatched IDs (e.g., Ep 8 lists 49 instead of 62/90; Ep 10 lists 63 instead of 11/61; Ep 29 lists 107 instead of 23/5; Ep 37 lists 60 instead of 47).
- **`KADAN_RPG_ENCOUNTERS` Array**:
  All 40 encounter opponent names and card deck configurations reflect old placeholder titles and must be overhauled to match the canonical chapter conflicts.

### 3.3 `src/lib/i18n.ts`
- **Missing / Incorrect Chapter Titles**:
  - `kadan_rpg_chapter_01` = `'한밤의 추격자들'` / `'Midnight Pursuers'` (MUST BE `'눈보라 아래 두 서약'` / `'Two Vows Beneath the Blizzard'`)
  - `kadan_rpg_chapter_02` = `'와일드랜드의 아침'` / `'Morning in the Wildland'` (MUST BE `'일곱 추적자의 맹세'` / `'Oath of the Seven Pursuers'`)
  - `kadan_rpg_chapter_03` = `'황무지의 은인과 길가메시'` (MUST BE `'안개 절벽의 피'` / `'Blood on the Mist Cliff'`)
  - `kadan_rpg_chapter_04` ~ `kadan_rpg_chapter_40` are all obsolete and need complete replacement.
- **Opponent Titles**:
  - `kadan_rpg_opp_ch01` ~ `kadan_rpg_opp_ch40` must be updated to match the canonical enemy names in Korean and English.

---

## 4. Interactive Protagonist Dialogue Choice Architecture (R2 Specification)

### 4.1 TypeScript Data Structure
To cleanly support choices without breaking backwards compatibility, enhance `KadanRpgNovelScriptLine` and introduce `KadanRpgDialogueChoice`:

```typescript
export interface KadanRpgDialogueChoice {
  id: string;
  attitude: '[결의/돌파]' | '[신중/통찰]' | '[성진호흡/공명]';
  attitudeEn: '[Resolve]' | '[Insight]' | '[Resonance]';
  labelKo: string;
  labelEn: string;
  followUpTextKo: string;
  followUpTextEn: string;
  bonusType: 'sns' | 'buff' | 'item';
  bonusValue: number;
  bonusDescKo: string;
  bonusDescEn: string;
}

export interface KadanRpgNovelScriptLine {
  speaker: 'narrator' | 'quote' | 'kadan' | 'speaker' | 'choice';
  name: string;
  nameEn?: string;
  text: string;
  textEn?: string;
  cardId?: number;
  choices?: KadanRpgDialogueChoice[];
}
```

### 4.2 Tri-Attitude Choice Philosophy
Every chapter (1 to 40) contains exactly one strategic decision point featuring 3 distinct stances:
1. **`[결의/돌파]` (Resolve / Breakthrough)**:
   - Frontal shield defense, courageous charge, unyielding paladin virtue.
   - Bonus: SNS coins (+15~25) or `[수호 방패: 전투 개시 시 공격력 +15%]`.
2. **`[신중/통찰]` (Insight / Tactician)**:
   - Careful reading of surroundings, tactical terrain use, traps avoidance.
   - Bonus: SNS coins (+15~25) or `[약점 포착: 첫 턴 데미지 25% 경감]`.
3. **`[성진호흡/공명]` (Resonance / Star Breathing)**:
   - Astral mana synchronization, empathetic communication, ancestral memory awakening.
   - Bonus: SNS coins (+20~30) or `[성진 가속: 선공권 보너스]`.

### 4.3 Countdown Timer & Auto-Select UI
- **Countdown Duration**:
  - **Manual Mode**: **5.0 seconds** (visual progress bar depleting from 100% to 0%).
  - **Auto-Play Mode (`autoMode`)**: **1.5 seconds** (high-speed auto-selection).
- **Default Selection**: When the timer runs out, Choice 1 (`choices[0]`) is automatically activated.
- **Feedback**:
  - Instantly displays Kadan's follow-up dialogue line (`followUpTextKo` / `followUpTextEn`).
  - Emits a brief toast/banner showing the reward (e.g. `SNS +20 획득` or `선제 방호진 활성화`).
  - Calls `updateSns` or stores temporary tactical combat buff into state.

---

## 5. Random Field Encounter System (R3 Specification)

### 5.1 Step Movement Trigger Logic
During map tile movement in `KadanRpgView.tsx`:
- Trigger point: Evaluated in `stepToward` execution when Kadan arrives at a new intermediate tile before reaching the destination objective.
- **Probability**: `12% ~ 15%` (`Math.random() < 0.14`).
- **Guardrails / Anti-Spam Protection**:
  1. `stepsSinceLastAmbush >= 3` (minimum 3 clear steps between random ambushes).
  2. `ambushesInCurrentChapter === 0` (strictly at most 1 random ambush per chapter leg).
  3. Destination immunity: Cannot trigger if the next tile is the chapter node (`sameTile(nextTile, targetTile)`).
  4. State immunity: Cannot trigger if already in dialogue, battle, or reward modal.

### 5.2 Themed Encounter Variants
Two distinct deck themes that dynamically scale based on region and rebirth level:
1. **Bandit Deck (황야 산적단 덱)**:
   - Name: `kadan_rpg_opp_bandit` (황야 산적단 / Wasteland Bandits)
   - Archetype: Beast / Outlaw physical assault.
   - Card Deck: `[81, 82, 83, 87, 88]` (Fenrir, Barghest, Ursoc, Beast hunters), scaled to chapter.
   - Banner: `[기습 매복!] 황야 산적단이 길목을 가로막았습니다!`
2. **Thief Deck (그림자 도둑단 덱)**:
   - Name: `kadan_rpg_opp_thief` (그림자 도둑단 / Shadow Rogues)
   - Archetype: Shadow / Speed ambush.
   - Card Deck: `[51, 52, 53, 54, 55]` (Walker, Ghoul, Assassin, Arachne), scaled to chapter.
   - Banner: `[기습 경보!] 그림자 도둑단이 어둠 속에서 칼을 뽑았습니다!`

### 5.3 Battle & Reward Loop
- Opens `MobileCardPlayScreen` with the selected Bandit or Thief deck.
- **Victory Reward**: SNS Points (`+30 ~ +60 SNS`) + 50% chance of a bonus card pack or item drop.
- **Defeat Handling**: Defeat does NOT block movement or reset progress; Kadan retreats to the previous step with a brief recovery dialog and may continue to the chapter objective.
- **Auto-Play Integration**: In `autoMode`, the card battle runs seamlessly via `autoPlay={true}`, and upon battle end, automatically collects spoils and resumes tile movement.

---

## 6. Complete 40-Chapter Interactive Choice & Script Specification

Below is the concrete specification for every chapter's narrative dramatization and interactive dialogue choice node:

### Chapter 01: 눈보라 아래 두 서약 (Two Vows Beneath the Blizzard)
- **Setting**: Elwin Village, Lighthaven southern frontier under violent blizzard.
- **Script Characters**: Narrator, Aleksandar (50), Balian (43), Hercul (49), Lucian (61), Mother Elwin (42).
- **Core Dialogue**: Hercul gives the twin silver daggers; Lucian's shadow knights surround the bridge; Aleksandar resolves to hold the bridge so pregnant Elwin can flee.
- **Interactive Choice Node**:
  - `[결의/돌파]`: "아버지의 방패는 결코 물러서지 않았다. 내가 다리 위를 지키겠다!" (Follow-up: "방패를 굳게 쥐자 칼바람조차 비껴가는 기운이 솟구친다.", Bonus: SNS +20)
  - `[신중/통찰]`: "적 기병들의 말발굽 소리를 헤아려야 한다. 우측 수로로 우회하자." (Follow-up: "침착하게 지형을 살피자 숨겨진 우회로가 드러났다.", Bonus: Buff: 첫 턴 데미지 25% 경감)
  - `[성진호흡/공명]`: "눈보라 속에 깃든 서약을 기억하자. 단검의 룬에 숨결을 맞춘다." (Follow-up: "단검의 백은빛 룬이 온기를 품고 공명하기 시작했다.", Bonus: SNS +25)

### Chapter 02: 일곱 추적자의 맹세 (Oath of the Seven Pursuers)
- **Setting**: Sevenbridge Harbor warehouse docks.
- **Script Characters**: Narrator, Hercul (49), Grimli (74), Aila (70), Gawain (45), Rescued Orphan Girl.
- **Core Dialogue**: Hercul discovers royal command stamps on broken swords; mistaken clash with 7 outcasts; rescued girl stops fight; hunters swear oath to find Aleksandar's child.
- **Interactive Choice Node**:
  - `[결의/돌파]`: "불의 앞에서는 황실의 칼날이라도 두려워하지 않겠다!" (Bonus: SNS +20)
  - `[신중/통찰]`: "무기를 거두고 비밀 장부를 대조해 진실을 밝히자." (Bonus: Buff: 약점 포착)
  - `[성진호흡/공명]`: "의인들의 심장 고동은 거짓을 말하지 않는다." (Bonus: SNS +25)

### Chapter 03: 안개 절벽의 피 (Blood on the Mist Cliff)
- **Setting**: Mistfall Cliffs ancient titan temple.
- **Script Characters**: Narrator, Gawain (45), Belphegor (13), Medusa Gorgo (89), Robinyard (48), Grimli (74).
- **Core Dialogue**: Belphegor and Gorgo stole Nine-Shadow Codex; purple mist blinds hunters; Robinyard uses wire tricks to distract monsters, falling into abyss to save comrades.
- **Interactive Choice Node**:
  - `[결의/돌파]`: "절벽 난간을 방패로 막아 동료들의 퇴로를 열겠다!" (Bonus: Buff: 수호 방호진)
  - `[신중/통찰]`: "음파의 떨림을 읽는 고르고의 사각지대를 노리자." (Bonus: SNS +20)
  - `[성진호흡/공명]`: "로비냐드의 희생을 헛되이 하지 않겠다. 안개 속 기운을 감지한다." (Bonus: SNS +25)

### Chapter 04: 황야에서 자란 아이 (The Child Raised in the Wastes)
- **Setting**: Wildland tundra, frozen river ice.
- **Script Characters**: Narrator, Kadan (41), Mother Elwin (42), Gilgamesh (47), Chieftain Fenrir (81).
- **Core Dialogue**: Kadan grows up doing hard labor; assassins ambush Gilgamesh on cracking river; Kadan slides across ice on his back carrying Gilgamesh; Fenrir's respect.
- **Interactive Choice Node**:
  - `[결의/돌파]`: "피 흘리는 아이를 두고 도망치는 것은 부끄러운 일이다!" (Bonus: SNS +25)
  - `[신중/통찰]`: "얼음판의 균열을 피해 무게중심을 낮추고 미끄러지자." (Bonus: Buff: 균형 유지)
  - `[성진호흡/공명]`: "북풍의 맥박을 느끼며 설원 늑대처럼 달린다." (Bonus: SNS +20)

### Chapter 05: 폭우 속의 유령 (Phantom in the Downpour)
- **Setting**: Shadowed gorge outpost under rainstorm.
- **Script Characters**: Narrator, Kadan (41), Gawain (45), Phantom Assassin (51), Grimli (74).
- **Core Dialogue**: Heavy rain extinguishes torches; ghostly shadow stalks the mud; Kadan feels footstep vibrations in the mire and parries blind strike.
- **Interactive Choice Node**:
  - `[결의/돌파]`: "빗속이라도 내 방패의 각도는 흔들리지 않는다!" (Bonus: Buff: 빗길 방어)
  - `[신중/통찰]`: "빗방울이 튀는 궤적을 보고 투명한 적의 위치를 파악한다." (Bonus: SNS +25)
  - `[성진호흡/공명]`: "폭우의 리듬과 호흡을 일치시켜 살기를 흘려보낸다." (Bonus: SNS +20)

### Chapter 06: 별을 호흡하는 법 (The Art of Breathing Stars)
- **Setting**: High peak ice pinnacle beneath full moon.
- **Script Characters**: Narrator, Kadan (41), Malfuon (66), Grimli (74).
- **Core Dialogue**: Conflicting teachings of 6 masters cause Kadan's forms to clash; Malfuon guides him to climb pinnacle and breathe with the stars.
- **Interactive Choice Node**:
  - `[결의/돌파]`: "피투성이가 되더라도 이 절벽을 오르고야 말겠다!" (Bonus: SNS +20)
  - `[신중/통찰]`: "스승들의 가르침은 대립이 아니라 계절의 순환이었다." (Bonus: SNS +25)
  - `[성진호흡/공명]`: "밤하늘의 샛별을 들이쉬고, 대지로 눈송이를 돌려보낸다." (Bonus: Buff: 성진 공명 +20%)

### Chapter 07: 배신자들의 천막 (The Traitors Camp)
- **Setting**: Rebel nomad pavilion on southern border.
- **Script Characters**: Narrator, Kadan (41), Fenrir (81), Rebel Chieftain (87), Lucian's Envoy (61).
- **Core Dialogue**: Infiltrating turncoats selling slaves and weapons to Artus; discovering forged royal warrants; battle amidst burning pavilions.
- **Interactive Choice Node**:
  - `[결의/돌파]`: "배신자들의 불의를 좌시할 수 없다. 정면으로 천막을 부순다!" (Bonus: SNS +20)
  - `[신중/통찰]`: "루시안의 밀서를 먼저 확보해 퇴로를 차단하자." (Bonus: Buff: 기습 간파)
  - `[성진호흡/공명]`: "바람을 일으켜 불길을 역풍으로 되돌린다." (Bonus: SNS +25)

### Chapter 08: 붉은 갈기의 기수 (Rider of the Crimson Mane)
- **Setting**: Pegasus Valley marketplace & corral.
- **Script Characters**: Narrator, Kadan (41), Crimson Mane (90), Celia (62), Grain Merchant, Horse Thieves.
- **Core Dialogue**: Taming untamable red-maned steed; rescuing Celia from unfair accusation; sharing hot turnip soup; defeating 12 horse thieves.
- **Interactive Choice Node**:
  - `[결의/돌파]`: "쇠사슬을 끊어라! 자유롭게 달릴 자격이 있는 말이다." (Bonus: Buff: 적갈기 돌격)
  - `[신중/통찰]`: "소녀의 짚신 자국과 도둑의 나막신 자국을 비교해 보시오." (Bonus: SNS +20)
  - `[성진호흡/공명]`: "군마의 심장박동에 내 숨결을 포갠다." (Bonus: SNS +30)

### Chapter 09: 거지 옷의 바람 (Wind in Beggars Clothes)
- **Setting**: Southern imperial checkpoint & outskirts.
- **Script Characters**: Narrator, Kadan (41), Celia (62), Walker (51), Border Guard.
- **Core Dialogue**: Disguised in rags; Celia teaches streetwise stealth; passing through brutal checkpoint without drawing royal attention.
- **Interactive Choice Node**:
  - `[결의/돌파]`: "억울하게 끌려가는 농민을 보면 방패를 꺼낼 수밖에 없다." (Bonus: SNS +20)
  - `[신중/통찰]`: "거지 옷의 냄새와 비틀거리는 걸음으로 의심을 피하자." (Bonus: Buff: 은밀 잠입)
  - `[성진호흡/공명]`: "바람 마나로 위병들의 귓가에 헛소문을 흘려보낸다." (Bonus: SNS +25)

### Chapter 10: 불꽃 궁정의 포로 (Prisoner of the Flame Court)
- **Setting**: Red Glass Court banquet & garden cottage.
- **Script Characters**: Narrator, Ignis (11), Lucian (61), Balian (43), Kadan (41), Celia (62), Ysela (107).
- **Core Dialogue**: Ignis's white flame trial; Balian tortured beneath glass; Kadan visits amnesiac Ysela with silver dagger; memory restored in tears.
- **Interactive Choice Node**:
  - `[결의/돌파]`: "지금 당장 저 유리 바닥을 깨고 숙부님을 구해야 한다!" (Bonus: Buff: 분노의 일격)
  - `[신중/통찰]`: "실리아의 말대로 환기구 구조를 먼저 파악해야 한다." (Bonus: SNS +25)
  - `[성진호흡/공명]`: "아주머니, 눈보라 치던 밤의 서약을 기억하십니까." (Bonus: SNS +30)

### Chapter 11: 기억을 깨우는 단검 (The Dagger That Wakes Memory)
- **Setting**: Imperial Colosseum arena.
- **Script Characters**: Narrator, Kadan (41), Ignis (11), Lucian (61), Arena Herald.
- **Core Dialogue**: Arena battle; Ignis's white flame clashes against Kadan's shield; twin daggers ignite resonance; Ignis realizes who Kadan is.
- **Interactive Choice Node**:
  - `[결의/돌파]`: "이그니스! 네 불꽃은 파괴가 아니라 생명을 지키기 위한 것이다!" (Bonus: Buff: 결의의 방벽)
  - `[신중/통찰]`: "검날이 교차하는 순간 단검의 룬 각인을 보여주겠다." (Bonus: SNS +25)
  - `[성진호흡/공명]`: "백색 화염과 아케인 방패의 공명 파문을 일으킨다." (Bonus: SNS +30)

### Chapter 12: 두 무덤 사이의 봄 (Spring Between Two Graves)
- **Setting**: Fallen Paladins' memorial chapel cemetery.
- **Script Characters**: Narrator, Kadan (41), Balian (43), Hercul (49), Magitech Golem (99).
- **Core Dialogue**: Mourning at the graves of heroes; surprise attack by Magitech Golems; spring flowers bloom through battle debris.
- **Interactive Choice Node**:
  - `[결의/돌파]`: "영웅들의 묘비를 더럽히게 두지 않겠다!" (Bonus: Buff: 성지 수호)
  - `[신중/통찰]`: "골렘의 마나 동력핵 위치를 집중 타격하자." (Bonus: SNS +25)
  - `[성진호흡/공명]`: "선열들의 잔향이 깃든 대지에서 기도를 올린다." (Bonus: SNS +20)

### Chapter 13: 녹옥 지팡이의 주인 (Master of the Jade Staff)
- **Setting**: Southern Jade Council grove & lake trails.
- **Script Characters**: Narrator, Kadan (41), Leonar (86), Celia (62), Elder Druid.
- **Core Dialogue**: Meeting the grand master of the Jade Staff; ancient trials of virtue; Leonar joins hands with northern wanderers.
- **Interactive Choice Node**:
  - `[결의/돌파]`: "종족의 편견을 넘어 정의의 연합을 이루겠다!" (Bonus: SNS +25)
  - `[신중/통찰]`: "녹옥 지팡이에 얽힌 고대 결계의 균열을 분석하자." (Bonus: Buff: 마법 간파)
  - `[성진호흡/공명]`: "비스트 숲의 정령들과 조화로운 교감을 나눈다." (Bonus: SNS +30)

### Chapter 14: 안개 호수의 손님들 (Guests of the Mist Lake)
- **Setting**: Mist Lake Taiho water skiff convoy.
- **Script Characters**: Narrator, Kadan (41), Rondol (46), Celia (62), Masked Corsair (89).
- **Core Dialogue**: Lake crossing in heavy mist; water-skiff ambush by lake raiders; Rondol manipulates tides while Kadan forms shield wall.
- **Interactive Choice Node**:
  - `[결의/돌파]`: "물살을 가르며 적 기함으로 뛰어올라 제압한다!" (Bonus: Buff: 승선 돌격)
  - `[신중/통찰]`: "안개 속 노 젓는 소리로 적선의 위치를 산출하자." (Bonus: SNS +25)
  - `[성진호흡/공명]`: "론돌의 물결 파도에 맞춰 방패의 반발력을 싣는다." (Bonus: SNS +20)

### Chapter 15: 독사와 사자의 밤 (Night of Serpent and Lion)
- **Setting**: Beast Clan stronghold grand banquet.
- **Script Characters**: Narrator, Kadan (41), Leonar (86), Celia (62), Belphegor (13).
- **Core Dialogue**: Poisoned feast; viper assassins strike from rafters; Leonar and Kadan defend the doorway back-to-back.
- **Interactive Choice Node**:
  - `[결의/돌파]`: "사자왕의 뒤는 내가 지킨다! 독침은 방패로 막아내라!" (Bonus: Buff: 사자의 포효)
  - `[신중/통찰]`: "연회장 기둥에 걸린 해독초 주머니를 먼저 확보하자." (Bonus: SNS +25)
  - `[성진호흡/공명]`: "체내에 스며든 독기를 별 호흡으로 밀어낸다." (Bonus: SNS +30)

### Chapter 16: 폐허 앞의 형제 (Brothers Before the Ruins)
- **Setting**: Windmill Ridge northern gate ruins.
- **Script Characters**: Narrator, Kadan (41), Ignis (11), Balian (43), Lucian (61), Artus (60).
- **Core Dialogue**: Balian holds the ridge with his lance so Kadan and Ignis can escape; sorrow and brotherhood sealed in tears before ruins.
- **Interactive Choice Node**:
  - `[결의/돌파]`: "숙부님을 혼자 둘 수 없습니다! 함께 싸우겠습니다!" (Bonus: Buff: 아케인 창의 맹세)
  - `[신중/통찰]`: "숙부님의 희생을 헛되이 하지 않으려면 살아남아야 한다." (Bonus: SNS +25)
  - `[성진호흡/공명]`: "두 아버지의 서약은 우리 가슴속에서 영원히 타오를 것이다." (Bonus: SNS +30)

### Chapter 17: 바람섬의 초대장 (Invitation to the Wind Isle)
- **Setting**: Coastal port docks before tempest.
- **Script Characters**: Narrator, Kadan (41), Celia (62), Rondol (46), Sky Messenger.
- **Core Dialogue**: Sealed celestial parchment invites party to Wind Isle; sea wyverns attack coastal docks; hoisting sails into the squall.
- **Interactive Choice Node**:
  - `[결의/돌파]`: "풍랑이 거칠수록 닻을 올리고 폭풍 속으로 나아간다!" (Bonus: SNS +25)
  - `[신중/통찰]`: "바람의 각도를 계산해 돛대를 조정하자." (Bonus: Buff: 순풍 가속)
  - `[성진호흡/공명]`: "바다의 호흡과 교감하여 거친 파도를 다스린다." (Bonus: SNS +30)

### Chapter 18: 검은 성전의 비밀 (Secret of the Black Sanctum)
- **Setting**: Sunken temple of the Black Sanctum.
- **Script Characters**: Narrator, Kadan (41), Celia (62), Gandar (69), Magitech Golem (99).
- **Core Dialogue**: Hidden temple library; uncovering Artus's covenant with the dark void; ancient golem sentries test intruders.
- **Interactive Choice Node**:
  - `[결의/돌파]`: "어둠의 서판을 부수고 진실의 기록만을 취하겠다!" (Bonus: SNS +20)
  - `[신중/통찰]`: "고대 룬어의 문맥을 정확히 해독해야 함정을 피한다." (Bonus: Buff: 룬 해독 통찰)
  - `[성진호흡/공명]`: "간다르의 옛 지혜와 감응하여 사원의 결계를 해제한다." (Bonus: SNS +30)

### Chapter 19: 세 가지 시험 (Three Trials)
- **Setting**: Wind Isle elemental trial chambers.
- **Script Characters**: Narrator, Kadan (41), Aeolus (25), Celia (62), Gawain (45).
- **Core Dialogue**: Facing trials of Courage, Wisdom, and Compassion; proving readiness to inherit the Nine-Shadow Codex without cruelty.
- **Interactive Choice Node**:
  - `[결의/돌파]`: "가장 거센 바람이라도 내 의지를 꺾을 수 없다!" (Bonus: Buff: 시험 통과 위압)
  - `[신중/통찰]`: "미궁의 반사벽을 이용해 바람의 역류를 짚어낸다." (Bonus: SNS +25)
  - `[성진호흡/공명]`: "시험관의 영혼을 상하게 하지 않고 마나만 부드럽게 흘린다." (Bonus: SNS +30)

### Chapter 20: 꽃배를 삼킨 파도 (The Wave That Swallowed the Flower Ship)
- **Setting**: Offshore archipelago aboard floral diplomatic yacht.
- **Script Characters**: Narrator, Kadan (41), Celia (62), Gandar (69), Pegasus (90).
- **Core Dialogue**: Luxurious flower ship swallowed by artificial tidal surge; abyssal boarders swarm decks; Kadan anchors companions.
- **Interactive Choice Node**:
  - `[결의/돌파]`: "선수 갑판에 방패를 박아 침몰을 막아내겠다!" (Bonus: Buff: 강철 고정)
  - `[신중/통찰]`: "물길 유입구를 차단하고 비상 구명정을 확보하자." (Bonus: SNS +25)
  - `[성진호흡/공명]`: "바람을 일으켜 꽃배의 선체를 수면 위로 띄운다." (Bonus: SNS +30)

### Chapter 21: 불타는 배의 배신 (Betrayal Aboard the Burning Ship)
- **Setting**: Burning flagship deck at night.
- **Script Characters**: Narrator, Kadan (41), Ignis (11), Lucian (61), Artus's Infiltrators.
- **Core Dialogue**: Powder kegs detonate; Lucian's treachery revealed amidst fire; fighting on burning rigging while ship sinks.
- **Interactive Choice Node**:
  - `[결의/돌파]`: "불타는 돛대를 베어내고 적 지휘관을 직접 친다!" (Bonus: Buff: 화염 돌파)
  - `[신중/통찰]`: "침수 구역의 균형을 맞춰 폭발 연쇄를 막아낸다." (Bonus: SNS +25)
  - `[성진호흡/공명]`: "이그니스의 불길과 내 방패를 합쳐 탈출로를 연다." (Bonus: SNS +30)

### Chapter 22: 무인도의 네 사람 (Four on a Deserted Island)
- **Setting**: Uncharted volcanic reef island.
- **Script Characters**: Narrator, Kadan (41), Celia (62), Grimli (74), Ignis (11).
- **Core Dialogue**: 4 survivors washed ashore; building shelter against sea beasts; temporary truce turns into genuine mutual trust.
- **Interactive Choice Node**:
  - `[결의/돌파]`: "밤안개 속에서 습격해 오는 거대 게 괴수를 방패로 내리친다!" (Bonus: SNS +25)
  - `[신중/통찰]`: "동굴 안쪽의 담수를 찾고 불씨를 지킨다." (Bonus: Buff: 생존 본능)
  - `[성진호흡/공명]`: "달빛 아래서 네 사람의 호흡을 하나로 모은다." (Bonus: SNS +30)

### Chapter 23: 동굴 속 잠든 기록 (The Record Sleeping in the Cave)
- **Setting**: Island cavern sanctuary.
- **Script Characters**: Narrator, Kadan (41), Ignis (11), Aleksandar (echo 50), Balian (echo 43).
- **Core Dialogue**: Ancient stone stele engraved with true paladin oath; discovering both fathers died protecting the continent, not for glory.
- **Interactive Choice Node**:
  - `[결의/돌파]`: "아버지들의 맹세를 내 방패에 영원히 새기겠다!" (Bonus: Buff: 영웅의 서약)
  - `[신중/통찰]`: "석판 뒷면에 새겨진 나인섀도우 코덱스 비전을 사경한다." (Bonus: SNS +25)
  - `[성진호흡/공명]`: "부모님들의 영혼과 마주하며 눈물을 닦는다." (Bonus: SNS +30)

### Chapter 24: 봉인실의 일곱 밤 (Seven Nights in the Sealed Chamber)
- **Setting**: Deep vault sealed by dark obsidian door.
- **Script Characters**: Narrator, Kadan (41), Ignis (11), Celia (62), Gilgamesh (47).
- **Core Dialogue**: Trapped for 7 nights with depleting air; enduring hunger and hallucinations; harmonizing white flame and shield to breach seal.
- **Interactive Choice Node**:
  - `[결의/돌파]`: "마지막 마나를 짜내어 문짝을 걷어찬다!" (Bonus: SNS +25)
  - `[신중/통찰]`: "호흡을 최소화하여 칠흑의 어둠 속에서 빛을 기다린다." (Bonus: Buff: 인내의 심장)
  - `[성진호흡/공명]`: "성진호흡의 정수로 공기 중의 희박한 마나를 정화한다." (Bonus: SNS +30)

### Chapter 25: 거짓 혼례의 밤 (Night of the False Wedding)
- **Setting**: Imperial cathedral high altar.
- **Script Characters**: Narrator, Kadan (41), Lucian (61), Celia (62), Ignis (11).
- **Core Dialogue**: Lucian forces Celia to alter vows; Kadan crashes stained glass window; shield smashes wedding crown; rescue battle.
- **Interactive Choice Node**:
  - `[결의/돌파]`: "거짓된 혼례는 끝났다! 실리아, 내 손을 잡아라!" (Bonus: Buff: 질풍의 돌격)
  - `[신중/통찰]`: "성당 바닥의 룬 마법진을 먼저 파괴해 결계를 푼다." (Bonus: SNS +25)
  - `[성진호흡/공명]`: "바람의 갈대 피리 소리에 공명하여 호위병들을 혼란시킨다." (Bonus: SNS +30)

### Chapter 26: 열린 문, 닫힌 마음 (Open Door, Closed Heart)
- **Setting**: Iron Bastion courtyard trap.
- **Script Characters**: Narrator, Kadan (41), Ignis (11), Lucian (61), Celia (62).
- **Core Dialogue**: Open gates reveal trap courtyard; bitter mistrust and past trauma threaten unity; Kadan stands between allies to restore faith.
- **Interactive Choice Node**:
  - `[결의/돌파]`: "닫힌 문이라도 내가 앞장서서 부수고 나아가겠다!" (Bonus: SNS +25)
  - `[신중/통찰]`: "매복병들의 화살 사선을 피해 성벽 위로 이동하자." (Bonus: Buff: 사선 회피)
  - `[성진호흡/공명]`: "상처 입은 동료의 마음에 먼저 방패를 내어준다." (Bonus: SNS +30)

### Chapter 27: 두 약속 사이 (Between Two Promises)
- **Setting**: Red Mountain pass crossroads.
- **Script Characters**: Narrator, Kadan (41), Ignis (11), Gilgamesh (47), Fenrir (81).
- **Core Dialogue**: Torn between striking Artus's supply lines vs protecting fleeing refugees from raiders; Kadan chooses to protect innocent lives.
- **Interactive Choice Node**:
  - `[결의/돌파]`: "눈앞의 백성을 구하는 것이 성기사의 유일한 길이다!" (Bonus: Buff: 수호의 의지)
  - `[신중/통찰]`: "적의 추격로에 돌무더기 트랩을 설치해 발을 묶자." (Bonus: SNS +25)
  - `[성진호흡/공명]`: "피난민들의 공포를 가라앉히는 온기의 마나를 방출한다." (Bonus: SNS +30)

### Chapter 28: 녹옥 의회의 반란 (Revolt of the Jade Council)
- **Setting**: Jade Council grand chamber.
- **Script Characters**: Narrator, Kadan (41), Leonar (86), Lucian (61), Celia (62).
- **Core Dialogue**: Corrupt noble magistrates declare martial law in league with Artus; Leonar's beast warriors storm chamber; coup crushed.
- **Interactive Choice Node**:
  - `[결의/돌파]`: "부패한 귀족들의 검극 따위에 정의는 꺾이지 않는다!" (Bonus: SNS +25)
  - `[신중/통찰]`: "의회의 법령 인장을 회수해 반란의 정당성을 무력화하자." (Bonus: Buff: 권능 박탈)
  - `[성진호흡/공명]`: "대지 정령들의 분노를 일깨워 회의실 바닥을 진동시킨다." (Bonus: SNS +30)

### Chapter 29: 바람의 여왕 (Queen of the Wind)
- **Setting**: Sky Spire tempest pinnacle.
- **Script Characters**: Narrator, Kadan (41), Sylphid (23), Celia (62), Aqualord (5).
- **Core Dialogue**: Climbing to sky terrace; Queen Sylphid tests Kadan's purity; granting celestial feather crest for final siege.
- **Interactive Choice Node**:
  - `[결의/돌파]`: "폭풍우 속에서도 눈을 부릅뜨고 여왕의 시험을 받아내겠다!" (Bonus: Buff: 천공의 가호)
  - `[신중/통찰]`: "하늘새들의 날개짓을 관찰해 돌풍의 눈으로 진입하자." (Bonus: SNS +25)
  - `[성진호흡/공명]`: "바람의 여왕과 영혼의 화음을 맞추어 깃털을 받는다." (Bonus: SNS +30)

### Chapter 30: 네 관문의 독 (Poison at the Four Gates)
- **Setting**: Four cardinal city gates of Lighthaven.
- **Script Characters**: Narrator, Kadan (41), Malfuon (66), Aqualord (5), Celia (62).
- **Core Dialogue**: Artus poisons city aqueducts; citizens dying; party splits to 4 gates; Kadan uses Star Breathing to cleanse reservoirs.
- **Interactive Choice Node**:
  - `[결의/돌파]`: "독구름을 뚫고 수문을 향해 몸을 던진다!" (Bonus: SNS +25)
  - `[신중/통찰]`: "정화 약초를 수로의 수원지에 집중 투하하자." (Bonus: Buff: 정화의 샘)
  - `[성진호흡/공명]`: "대지의 수맥을 호흡으로 감싸 독기를 중화시킨다." (Bonus: SNS +30)

### Chapter 31: 모든 것을 건 손 (The Hand That Wagered Everything)
- **Setting**: Sunken war room strategy table.
- **Script Characters**: Narrator, Kadan (41), Aquaris (1), Naiad (2), Ignis (11), Gandar (69).
- **Core Dialogue**: Strategic council; wagering all remaining reserves and sacred relics to lure Artus's dreadnought into shallow reef trap.
- **Interactive Choice Node**:
  - `[결의/돌파]`: "우리가 미끼가 되겠다. 적의 총공세를 정면으로 유인하자!" (Bonus: Buff: 불패의 미끼)
  - `[신중/통찰]`: "조수 간만의 차를 이용해 적 기함을 갯벌에 좌초시킨다." (Bonus: SNS +25)
  - `[성진호흡/공명]`: "물의 요정들과 결속하여 바다 안개를 일으킨다." (Bonus: SNS +30)

### Chapter 32: 첫사랑의 잔향 (Echo of First Love)
- **Setting**: Moonlight terrace whispered bower.
- **Script Characters**: Narrator, Celia (62), Kadan (41), Sylphid (23), Ignis (11).
- **Core Dialogue**: The night before the final assault; quiet reflections under silver leaves; Celia binds wildflower to Kadan's shield strap; vows to survive.
- **Interactive Choice Node**:
  - `[결의/돌파]`: "내일 전투가 끝나면 반드시 함께 살아서 고향으로 돌아가자." (Bonus: SNS +30)
  - `[신중/통찰]`: "너를 지키는 방패가 되겠다는 약속은 결코 잊지 않아." (Bonus: Buff: 들꽃의 맹세)
  - `[성진호흡/공명]`: "은은한 바람결 속에 서로의 심장 박동을 포갠다." (Bonus: SNS +25)

### Chapter 33: 검은 늪의 원한 (Grudge of the Black Marsh)
- **Setting**: Black Marsh necropolis outside Citadel.
- **Script Characters**: Narrator, Kadan (41), Artus (60), Lucian (61), Gandar (69).
- **Core Dialogue**: Marsh filled with vengeful wraiths and fallen knights; Artus taunts Kadan; shield of light pierces necrotic fog.
- **Interactive Choice Node**:
  - `[결의/돌파]`: "원혼들아, 성기사의 빛 아래서 편히 잠들라!" (Bonus: Buff: 파사의 빛)
  - `[신중/통찰]`: "늪지대 바닥의 침강 함정을 피해 단단한 암반으로 유도하자." (Bonus: SNS +25)
  - `[성진호흡/공명]`: "어둠의 사슬을 자비의 호흡으로 끊어낸다." (Bonus: SNS +30)

### Chapter 34: 무너진 바람섬 (The Fallen Wind Isle)
- **Setting**: Collapsing aerial citadel fragments.
- **Script Characters**: Narrator, Kadan (41), Aeolus (25), Grimli (74), Gawain (45).
- **Core Dialogue**: Floating bastions shatter under abyssal cannonade; evacuating civilian airships while stones tumble into abyss.
- **Interactive Choice Node**:
  - `[결의/돌파]`: "추락하는 파편을 방패로 쳐내어 피난선을 보호한다!" (Bonus: Buff: 하늘의 방패)
  - `[신중/통찰]`: "부유석의 남은 마나를 활성화해 탈출 궤적을 확보하자." (Bonus: SNS +25)
  - `[성진호흡/공명]`: "추락하는 바람의 흐름을 날개처럼 펼쳐 안착시킨다." (Bonus: SNS +30)

### Chapter 35: 안개 속의 오인 (Mistaken in the Fog)
- **Setting**: Valley of Mirages misty labyrinth.
- **Script Characters**: Narrator, Kadan (41), Hercul (49), Celia (62), Lucian (61).
- **Core Dialogue**: Illusory mists project phantom duplicates turning allies against one another; Kadan closes eyes and uses Star Breathing to hear genuine heartbeats.
- **Interactive Choice Node**:
  - `[결의/돌파]`: "눈을 감아라! 귀와 심장으로 진짜 동료를 느낀다!" (Bonus: Buff: 심안의 방패)
  - `[신중/통찰]`: "허상의 그림자는 발소리를 내지 못한다. 바닥을 확인해라." (Bonus: SNS +25)
  - `[성진호흡/공명]`: "별 호흡의 파동을 방출해 환영 마법을 한 번에 깨뜨린다." (Bonus: SNS +30)

### Chapter 36: 십자 성흔의 지도 (Map of the Cross-Shaped Scar)
- **Setting**: High fortress inner command redoubt.
- **Script Characters**: Narrator, Kadan (41), Gilgamesh (47), Fenrir (81), Celia (62).
- **Core Dialogue**: Deciphering cross-shaped scar on dragon seal; pinpointing flaw in Artus's obsidian barrier; tactical deployment.
- **Interactive Choice Node**:
  - `[결의/돌파]`: "약점이 드러났다! 내가 가장 선봉에서 관문을 뚫겠다!" (Bonus: Buff: 성흔의 돌파)
  - `[신중/통찰]`: "동서남북 4개 타격대를 동시에 진입시켜 방어선을 분산하자." (Bonus: SNS +25)
  - `[성진호흡/공명]`: "용의 성흔과 내 마나를 공명시켜 결계를 붕괴시킨다." (Bonus: SNS +30)

### Chapter 37: 정복왕의 전쟁 (War of the Conqueror King)
- **Setting**: Grand plains before the Imperial Citadel.
- **Script Characters**: Narrator, Gilgamesh (47), Kadan (41), Fenrir (81), Ignis (11).
- **Core Dialogue**: Gilgamesh leads the grand charge of continental united armies; iron phalanx clash; cavalry thunders across plain.
- **Interactive Choice Node**:
  - `[결의/돌파]`: "연합군 전열의 중앙을 맡겠다! 방패는 뚫리지 않는다!" (Bonus: Buff: 불멸의 방진)
  - `[신중/통찰]`: "적 기갑병의 측면 관절부를 노려 포위망을 좁힌다." (Bonus: SNS +25)
  - `[성진호흡/공명]`: "전장의 수만 군사들에게 수호의 마나를 불어넣는다." (Bonus: SNS +30)

### Chapter 38: 세 개의 비단 봉인 (Three Silk Seals)
- **Setting**: Throne room ante-chamber.
- **Script Characters**: Narrator, Kadan (41), Lucian (61), Ignis (11), Celia (62).
- **Core Dialogue**: Shattering the 3 imperial seals locking throne; Lucian's final stand; unmasking the vizier's cowardice; justice served.
- **Interactive Choice Node**:
  - `[결의/돌파]`: "루시안! 네 탐욕의 거짓 옥좌는 오늘로 끝이다!" (Bonus: SNS +30)
  - `[신중/통찰]`: "세 비단 봉인의 룬 매듭을 역순으로 풀어 마나를 무력화한다." (Bonus: Buff: 봉인 해제)
  - `[성진호흡/공명]`: "더 이상의 살육은 무의미하다. 항복하고 죄를 자백하라." (Bonus: SNS +25)

### Chapter 39: 지켜야 할 세계 (The World Worth Protecting)
- **Setting**: Celestial Citadel Throne Core.
- **Script Characters**: Narrator, Kadan (41), Ignis (11), Artus (60), Celia (62).
- **Core Dialogue**: Final battle against Regent Artus in his demonic abyssal armor; Kadan's shield parries dark blade; Ignis's white flame incinerates dark core; continent freed.
- **Interactive Choice Node**:
  - `[결의/돌파]`: "내 방패는 아버지와 어머니, 그리고 대륙의 모든 백성들의 것이다!" (Bonus: Buff: 최후의 아케인 에코)
  - `[신중/통찰]`: "아르투스의 심장핵이 열리는 찰나를 노려 창끝을 유도한다!" (Bonus: SNS +30)
  - `[성진호흡/공명]`: "백색 화염과 성진호흡의 합일! 어둠을 태양의 빛으로 씻어낸다!" (Bonus: SNS +35)

### Chapter 40: 영웅이라 불리지 않는 자 (One Who Is Not Called a Hero)
- **Setting**: Lighthaven grand plaza & north road to Elwin.
- **Script Characters**: Narrator, Emperor, Kadan (41), Celia (62), Ignis (11), Chieftain Fenrir (81), Rondol (46).
- **Core Dialogue**: Refusing emperor's grand marshal crown and dukedom; Celia refuses empress crown; farewell beer with comrades; walking north into spring dawn with shield and reed flute.
- **Interactive Choice Node**:
  - `[결의/돌파]`: "저는 영웅이 아닙니다. 약한 사람들의 곁에 서는 방패일 뿐입니다." (Bonus: SNS +50)
  - `[신중/통찰]`: "권력은 다시 부패를 낳습니다. 평화는 흙과 땀 속에 있습니다." (Bonus: Buff: 방랑자의 깨달음)
  - `[성진호흡/공명]`: "실리아, 약속을 지켰구나. 정말로 봄이 왔다." (Bonus: SNS +50)

---

## 7. Implementation Blueprint & File Touch Matrix

Below is the concrete roadmap for orchestrators and builders implementing the overhaul:

| File Path | Nature of Changes Required | Key Changes |
|:---|:---|:---|
| `src/content/kadanRpgNovelScript.ts` | Complete Overhaul | Rewrite all 40 chapters using canonical webnovel narrative and characters; introduce `KadanRpgDialogueChoice` with 3 choices per chapter, tailored follow-ups, and rewards. |
| `src/content/kadanRpgStory.ts` | Alignment & Modernization | Realign `chapterRegionIds`, `speakerCardIds`, `KADAN_RPG_ENCOUNTERS` (names & decks), and `KADAN_RPG_REWARDS` to match canonical 40 chapters. |
| `src/lib/i18n.ts` | Translation Synchronization | Replace obsolete `kadan_rpg_chapter_01`~`40` and `kadan_rpg_opp_ch01`~`40` with accurate Korean and English names. |
| `src/components/rpg/KadanNpcDialog.tsx` | Interactive Choice & Timer UI | Render choice buttons with 5s manual / 1.5s auto countdown timer; handle choice selection, apply bonus, and display follow-up lines. |
| `src/views/KadanRpgView.tsx` | Random Encounters & Auto-Play | Implement 12–15% step encounter check with cooldown (min 3 steps, max 1/leg), render Bandit/Thief alert, trigger card battle, and ensure 100% hands-free auto-play flow. |

---

## 8. Verification & Acceptance Criteria Checklist

- [x] All 40 canonical titles mapped verbatim from `ENGLISH_NOVEL_MAP` and `public/book/index.json`.
- [x] Every chapter (1–40) equipped with a canonical narrative conflict and 3-choice protagonist decision node (`[결의/돌파]`, `[신중/통찰]`, `[성진호흡/공명]`).
- [x] Precise countdown timer logic formulated (5s manual, 1.5s auto) with auto-selection of recommended choice.
- [x] Random ambush parameters specified (12–15%, 3-step cooldown, 1/chapter leg limit, Bandit & Thief deck compositions).
- [x] 100% hands-free Auto-Play progression state model documented without manual blockage.
