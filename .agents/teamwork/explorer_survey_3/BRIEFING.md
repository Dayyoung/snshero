# BRIEFING — 2026-11-02T03:25:00Z

## Mission
Investigate R4 (Core Screen Sections & Card Nurturing System Transition) across the codebase for the new standalone static landing web service: Home, MyDeck, Play, Card (former Mission with 100-lv nurturing & stat upgrades), and Shop (exact 8 items). Deliver comprehensive survey report and handoff.

## 🔒 My Identity
- Archetype: explorer
- Roles: Asset Inventory & Compression Tooling Explorer
- Working directory: /Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_3
- Original parent: f84aca46-e09f-4967-b5d1-281f855a924e
- Milestone: Explorer Phase - Asset & Compression Survey
- Role (2026-10-18T10:12:47Z): Survey Explorer 3 (Progression, Systems, Codex & App Chrome)
- Current Milestone: UI/UX Terminal-Flat Visual Unification Survey
- Role (2026-11-02T03:22:13Z): Explorer Survey 3 (R4 Core Screens & Card Nurturing System Transition)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Do NOT edit or write source files outside .agents/teamwork/explorer_survey_3/
- Strict budgets: public/seat/*.png <= 35KB (4KB–35KB), Master sheets <= 800KB, Faction sheets <= 300KB
- Design compliance: Strict DESIGN.md terminal-flat rules (`font-mono`, `rounded-none` containers, `rounded-sm` buttons, 0 multi-stop gradients, 0 drop shadows, 0 animate-ping/bounce, min-h-[44px] touch targets)
- Data integrity: 100% localStorage (`hero_*` keys), i18n support, safeLazy glob imports in App.tsx
- Language constraint: Always reply to user in Korean

## Current Parent
- Conversation ID: 7b342c7a-1d74-43d7-a388-5ffc926b3969
- Updated: 2026-11-02T03:22:13Z

## Investigation State
- **Explored paths**:
  - `src/views/HomeView.tsx` (1165 lines): SnowHero intro, external serial links (Naver Web Novel: novelId=1250635, Naver Webtoon: titleId=856677, Munpia: novel/616551), media lounge shortcuts, logo assets.
  - `src/views/MyDeckView.tsx` (3783 lines): Active deck 5 cards, `deckPower` (sum of 5 active card powers), `globalTotalPower` (total user power), `getCardPower` formula.
  - `src/views/NovelView.tsx` (2583 lines) & `src/components/movie/CinematicMoviePlayer.tsx` (1006 lines): TTS speech synthesis, webtoon 40-episode cutscenes (`public/images/webtoon/episode_XX/scene_XX.webp`), narration overlay toggles.
  - `src/views/PlayGameView.tsx` (18644 lines): Legacy 110 mission games, `hero_card_enhancements` (Lv+1 gacha enhancement), 110 cards collection tracking.
  - `src/views/ShopView.tsx` (6782 lines): Legacy heavy shop with merchandise, PayPal, crypto, claw machine, and gacha; isolation of exact 8 items needed for R4.
  - `src/cardDatabase.ts` (148 lines): 110 hero cards across 11 elemental/racial factions, base stats `[top, right, bottom, left]`, rarity tiers.
  - `src/types.ts` (694 lines): `CardData`, `InventoryRecord`, `OwnedCard`, `Item`, `CardElement`.
  - `src/constants.ts` (419 lines): `getCardPower` ($n+e+s+w$), `getCardStatWithBonus`.
  - `src/content/webtoonEpisodeManifest.json`: 40 episodes x 21 cutscenes = 840 scene images.
- **Key findings**:
  - **Home**: Official serial links for Naver Webtoon, Naver Web Novel, and Munpia are verified with exact URLs; required '절찬 연재중' badge specified.
  - **MyDeck**: Clean view specification defined — 5-slot card grid, Deck TP ($5 \text{ cards}$ sum), Total TP ($\sum \text{inventory}$), eliminating all legacy modal bloat.
  - **Play**: Streamlined to 5 buttons only (`[닫기]`, `[이전]`, `[다음]`, `[나레이션]`, `[TTS]`); webtoon image viewer; TTS default OFF (`isTtsEnabled = false`).
  - **Card (Former Mission)**: Transitioned from game battle to 1-click Nurturing System up to Max Lv 100 ($L \times 100$ EXP formula), granting $+3\text{P}$ stat points per level, Red Dot indicator on unspent points, 4-direction stat allocation ($[+]$ buttons), persisted in `hero_card_nurturing`.
  - **Shop**: Restricted to EXACT 8 items (일반 카드팩, 매직 카드팩, 희귀 카드팩, 아이템 팩, 광고 제거, 공식 소설, 공식 동영상, 코인 충전), eliminating all other clutter.
- **Unexplored areas**: None within R4 scope.

## Key Decisions Made
- Designed `hero_card_nurturing` schema with full backward-compatibility with `hero_inventory` and `hero_card_enhancements`.
- Formulated deterministic level-up EXP progression ($\text{EXP}(L) = L \times 100$) and stat allocation mechanism.
- Created concrete specifications for the 5-button minimal Play screen and exact-8-item Shop.
- Mapped all 3 external webnovel/webtoon serialization platforms with active '절찬 연재중' badge styling.

## Artifact Index
- `DISPATCH.md` — Incoming mission dispatch
- `BRIEFING.md` — Persistent working memory
- `progress.md` — Task progress & liveness heartbeat
- `survey_report.md` — Comprehensive R4 survey and architectural specification report
- `handoff.md` — 5-Component Handoff Protocol report for orchestrator and implementers
