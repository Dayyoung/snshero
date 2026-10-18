# Handoff Report — Explorer 1 (Storyline & Script Mapping)

## 1. Observation

Direct observations and evidence collected from code inspection:

1. **Canonical Story Source of Truth**:
   - `src/content/englishNovelMapping.ts` lines 7–46 defines the 40 canonical English titles (`ENGLISH_NOVEL_MAP`):
     - Ep 1: `"Two Vows Beneath the Blizzard"`
     - Ep 2: `"Oath of the Seven Pursuers"`
     - Ep 3: `"Blood on the Mist Cliff"`
     - Ep 4: `"The Child Raised in the Wastes"`
     - ...
     - Ep 40: `"One Who Is Not Called a Hero"`
   - `public/book/index.json` lines 765–1045 contains the 40 canonical Korean titles:
     - Ep 1: `"눈보라 아래 두 서약"`
     - Ep 2: `"일곱 추적자의 맹세"`
     - Ep 3: `"안개 절벽의 피"`
     - Ep 4: `"황야에서 자란 아이"`
     - ...
     - Ep 40: `"영웅이라 불리지 않는 자"`
   - `src/content/webtoonEpisodes.ts` lines 36–77 defines `EPISODE_HERO_MAP` mapping focus hero card IDs and character IDs for all 40 episodes.

2. **Severe Narrative Drift in RPG Novel Scripts**:
   - `src/content/kadanRpgNovelScript.ts` lines 9–239 contains 40 entries, but only entry `1` matches the canonical story.
   - Entry `2` (lines 19–26) is titled `"제 2화: 와일드랜드의 아침"` instead of `"일곱 추적자의 맹세"`.
   - Entry `3` (lines 27–34) is titled `"제 3화: 황무지의 은인과 길가메시"` instead of `"안개 절벽의 피"`.
   - Entry `8` (lines 60–65) is titled `"제 8화: 가디언즈의 희생과 맹세"` instead of `"붉은 갈기의 기수"`.
   - Entry `10` (lines 72–77) is titled `"제 10화: 장가구의 거지와 실리아"` instead of `"불꽃 궁정의 포로"`.
   - Entry `40` (lines 232–239) is titled `"제 40화: 지평선의 아케인 방랑자들"` instead of `"영웅이라 불리지 않는 자"`.

3. **Mismatched Titles in i18n**:
   - `src/lib/i18n.ts` lines 2378–2418 (KO) and 2574–2614 (EN):
     - `kadan_rpg_chapter_01: '한밤의 추격자들'` / `'Midnight Pursuers'`
     - `kadan_rpg_chapter_02: '와일드랜드의 아침'` / `'Morning in the Wildland'`
     - `kadan_rpg_chapter_03: '황무지의 은인과 길가메시'` / `'The Wasteland Benefactor and Gilgamesh'`
     - `kadan_rpg_chapter_40: '지평선의 아케인 방랑자들'` / `'Arcane Wanderers at the Horizon'`
     These do not match the official novel titles.

4. **Missing Dialogue Choice Structure**:
   - `src/content/kadanRpgNovelScript.ts` lines 1–6:
     ```typescript
     export interface KadanRpgNovelScriptLine {
       speaker: 'narrator' | 'quote' | 'kadan' | 'speaker';
       name: string;
       text: string;
       cardId?: number;
     }
     ```
     Lacks choice branches, attitude markers, follow-up lines, or bonus metadata.
   - `src/components/rpg/KadanNpcDialog.tsx` line 77:
     ```typescript
     const novelScript = language === 'ko' ? KADAN_RPG_NOVEL_SCRIPTS[event.chapterNumber] : undefined;
     ```
     Only retrieves scripts if `language === 'ko'`. Non-Korean languages fall back to generic template monologues.

5. **Current Movement & Auto-Runner Flow**:
   - `src/views/KadanRpgView.tsx` lines 231–247:
     `setHeroTile` steps toward `targetTile` every 110ms/180ms without random encounter checks.
   - `src/views/KadanRpgView.tsx` lines 387–396:
     `onAdvanceDialog` immediately clears the dialog when invoked by the auto-runner rather than waiting for dialogue or choice completion.

---

## 2. Logic Chain

1. **Premise 1**: The canonical source of truth for the SNSHero 40-episode storyline is established in `englishNovelMapping.ts`, `public/book/index.json`, `webtoonEpisodes.ts`, and `public/book/episode_01.md` through `episode_40.md`.
2. **Premise 2**: `/main` RPG mode (`kadanRpgStory.ts`, `kadanRpgNovelScript.ts`, `i18n.ts`) was previously created with legacy placeholder titles and detached mini-plots for chapters 2–40.
3. **Inference 1**: To achieve complete storyline synchronization (Requirement R1), all 40 chapters in `kadanRpgNovelScript.ts`, `kadanRpgStory.ts`, and `i18n.ts` must be updated to faithfully reflect the 40 canonical episodes, matching titles, key narrative conflicts, characters, and regions.
4. **Inference 2**: To fulfill Requirement R2 (Interactive Protagonist Choices), `KadanRpgNovelScriptLine` must be extended with `KadanRpgDialogueChoice`, providing 3 stances (`[결의/돌파]`, `[신중/통찰]`, `[성진호흡/공명]`) per chapter, accompanied by tailored follow-up dialogue, immediate bonuses, and a countdown auto-select timer (5s manual / 1.5s auto) in `KadanNpcDialog.tsx`.
5. **Inference 3**: To fulfill Requirement R3 (Random Field Encounters), a step-based encounter evaluation (12–15% probability, 3-step cooldown, 1 per chapter leg limit) must be integrated into `KadanRpgView.tsx` tile movement, offering Bandit Deck and Thief Deck battles via `MobileCardPlayScreen`.
6. **Inference 4**: To fulfill Requirement R4 (100% Hands-Free Auto-Play), `useKadanRpgAutoRunner` and `KadanNpcDialog` must coordinate so that dialogue choices auto-resolve in 1.5s, random encounters auto-play, and the player can progress from Chapter 1 to 40 without requiring any manual clicks.

---

## 3. Caveats

- **Scope Boundary**: This explorer report is an investigation and specification survey (read-only); implementation files in `src/` have not been altered in this step.
- **Card ID Mapping**: All character card IDs referenced in the survey matrix correspond to the canonical 110-card database (`CARD_DATABASE` in `src/cardDatabase.ts`).
- **Translation Strategy**: In `i18n.ts`, `kadanRpgTranslations.ko` and `kadanRpgTranslations.en` are merged into all 12 supported languages (`staticTranslations`). When updating chapter titles, both `ko` and `en` dictionaries in `i18n.ts` must be updated simultaneously.

---

## 4. Conclusion

The specification formulated in `survey_report.md` provides an exhaustive, authoritative blueprint to resolve all 5 core gaps:
1. Complete 40-chapter canonical synchronization across `kadanRpgNovelScript.ts`, `kadanRpgStory.ts`, and `i18n.ts`.
2. 40 tri-attitude interactive choice nodes with tailored reactions and bonus effects.
3. 5s manual / 1.5s auto countdown timer for choice selection in `KadanNpcDialog.tsx`.
4. 12–15% random field ambush system with Bandit and Thief deck configurations in `KadanRpgView.tsx`.
5. Seamless hands-free auto-play lifecycle across all phases.

---

## 5. Verification Method

To verify these findings independently:
1. **Title Alignment Check**:
   Compare `src/content/englishNovelMapping.ts` against `src/lib/i18n.ts` lines 2378–2418 and 2574–2614.
   Observe the difference between `ENGLISH_NOVEL_MAP` Ep 2 (`"Oath of the Seven Pursuers"`) vs `i18n.ts` (`"Morning in the Wildland"` / `"와일드랜드의 아침"`).
2. **Script Content Check**:
   View `src/content/kadanRpgNovelScript.ts` lines 19–26 and compare against `public/book/episode_02.md`.
   Observe that Chapter 2 in the script currently discusses training with a wooden sword in the snow with Mother Elwin, whereas `episode_02.md` centers on Hercul, the Seven Pursuers at Sevenbridge Harbor, and the orphan girl.
3. **Choice Data Type Check**:
   View `src/content/kadanRpgNovelScript.ts` lines 1–6 and confirm the absence of a `choices` property on `KadanRpgNovelScriptLine`.
4. **Survey Artifact Review**:
   Read `/Users/dayyoung/project/snshero/.agents/teamwork/teamwork_preview_explorer_survey_1/survey_report.md` for the full 40-chapter matrix and specifications.
