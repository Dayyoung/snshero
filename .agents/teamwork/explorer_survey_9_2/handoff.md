# Handoff Report — explorer_survey_9_2

## 1. Observation
1. **Logo Assets and Current `#home` Rendering**:
   - `public/logo-ko.png` (`1,671,604` bytes), `public/logo-en.png` (`1,635,869` bytes), `public/nunhero-logo.png` exist and decode cleanly.
   - Legacy `src/views/HomeView.tsx` lines 261–281 render `<img src={language === 'ko' ? '/logo-ko.png' : '/logo-en.png'} />`, and lines 324–358 render the Cool Card Deck logo/showcase (`LobbyInteractiveCard` fan-folded 5-card preview).
   - In `src/landing/views/HomeSection.tsx` lines 23–73, `#home` currently renders plain text `"눈히어로.com · SNSHero Revolution"` and a single character card (`[NO.041] Kadan`), missing the official graphic logo and the 5-card fan-folded deck preview.
2. **Deck Editing in Legacy vs. Landing**:
   - Legacy `src/views/MyDeckView.tsx` (3,783 lines) supports drag-and-drop and 1-click slot replacement from owned inventory, persisting to `hero_deck` and `hero_deck_${season}`.
   - Current `src/landing/views/MyDeckSection.tsx` lines 86–95 takes a fixed slice `activeDeckIds = cardNurtureStore.ownedCardIds.slice(0, 5)` with no slot replacement UI.
3. **Tile Game, Episode Trigger, and Auto-Play in Codebase**:
   - The tile game is implemented in `src/views/KadanRpgView.tsx` (1,641 lines) using `src/components/rpg/KadanWorldMap.tsx` (233 lines), `src/hooks/useKadanRpgProgress.ts` (547 lines), and `src/hooks/useKadanRpgAutoRunner.ts` (148 lines).
   - `KadanWorldMap` lines 145–180 renders the 2D tile grid. Moving step-by-step triggers chapter events. Arriving at the event tile opens `src/components/rpg/KadanNpcDialog.tsx` (dialogue choices), which upon completion transitions to `src/views/MobileCardPlayScreen.tsx` (3x3 card battle).
   - `useKadanRpgAutoRunner` lines 1–148 provides 100% hands-free looping when `hero_kadan_rpg_auto_mode` is `'true'`.
4. **Card Nurturing Flaws & Victory EXP**:
   - `src/landing/views/CardSection.tsx` lines 258–281 currently exposes free `+50 EXP` and `+500 EXP` buttons that bypass card battles entirely.
   - `src/landing/services/cardNurtureStore.ts` lines 93–134 `nurtureCard()` does not check `isCardOwned(cardId)`, permitting unowned cards to receive EXP.
   - Card battle victory is resolved in `src/views/MobileCardPlayScreen.tsx` lines 1120–1156 (`winState === 'player'`), calling `onEarnXp(50)`.
   - Match end screen in `MobileCardPlayScreen.tsx` lines 2594–2615 currently only has `재대결 (Rematch)` and lacks an explicit `[🔁 반복 사냥 (Repeat Hunting)]` auto-loop.
5. **Idle Auto-Play Requirement**:
   - ORIGINAL_REQUEST.md lines 510–512 requires navigating to `https://dayyoung-macbookpro.tail3717a4.ts.net/#play` and starting auto-play when user input is absent for 15s.

## 2. Logic Chain
1. Based on Observation 1, `#home` in `HomeSection.tsx` must be updated to include `<img src="/logo-ko.png" />` and the 5-card fan-folded Cool Card Deck preview to satisfy the requirement: *"#home: Must display the SNS Hero logo and Cool Card Deck logo while retaining all existing Home features."*
2. Based on Observation 2, `MyDeckSection.tsx` and `cardNurtureStore.ts` must allow selecting a slot and swapping in any owned card from `ownedCardIds`, updating LocalStorage (`hero_deck` and `hero_card_nurturing`), satisfying *"#deck: Must replace legacy /deck, supporting My Deck editing and retaining all existing Deck features."*
3. Based on Observation 3, `#play` must mount the tile game (`KadanWorldMap`) as its initial view. Tile navigation triggers the episode dialogue (`KadanNpcDialog`), which transitions into 3x3 tactical card play (`MobileCardPlayScreen`), and upon victory enables auto-play progression (`useKadanRpgAutoRunner`), satisfying the gameplay loop parity requirement.
4. Based on Observation 4, free EXP buttons in `CardSection.tsx` violate *"Nurturing requires EXP earned exclusively by winning card battles."* Removing these buttons and enforcing `isCardOwned()` in `cardNurtureStore.nurtureCard()` restricts nurturing to owned cards. Connecting `MobileCardPlayScreen.tsx` victory resolution (`winState === 'player'`) to `cardNurtureStore.nurtureCard()` ensures battle-only EXP. Adding `[🔁 반복 사냥]` to the match conclusion overlay enables repeat hunting.
5. Based on Observation 5, a global 15-second idle listener monitoring standard input events (`mousedown`, `keydown`, `touchstart`, etc.) that resets on user interaction and triggers `window.location.hash = '#play'` with `hero_kadan_rpg_auto_mode = true` satisfies the global idle auto-play requirement.

## 3. Caveats
- The project currently maintains a dual-entry architecture (`index.html` static landing vs `home.html` React SPA). In order to maintain test compatibility with `tests/e2e/tier1_feature_coverage.ts`, implementations inside `index.html` must remain independent of heavy direct imports of `src/main.tsx`, or the tests must be updated if the architecture is consolidated into a single React entrypoint.
- In `MobileCardPlayScreen.tsx`, repeat hunting should be disabled when the user explicitly presses `[⏹️ 중지]` or when SNS coin balance drops below battle entry cost.

## 4. Conclusion
All required mechanisms and assets exist in the codebase:
- Logos: `public/logo-ko.png`, `public/logo-en.png`, and `LobbyInteractiveCard` fan-folded deck preview.
- Tile game & Episodes: `src/components/rpg/KadanWorldMap.tsx` + `KadanNpcDialog.tsx` + `KadanRpgView.tsx`.
- Card battle & Auto-play: `src/views/MobileCardPlayScreen.tsx` + `useKadanRpgAutoRunner.ts`.
- Card Nurturing & EXP: `src/landing/services/cardNurtureStore.ts` with battle victory hook in `MobileCardPlayScreen.tsx`.
- Full detailed implementation plan and specifications are documented in `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_9_2/report.md`.

## 5. Verification Method
1. Inspect report file:
   `cat /Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_9_2/report.md`
2. Verify TypeScript type safety:
   `npm run lint` (`npx tsc --noEmit`)
3. Verify production build:
   `npm run build`
4. Invalidation conditions:
   - If `#home` lacks the graphical logo or 5-card fan-folded preview.
   - If `#deck` does not allow swapping active cards from owned inventory.
   - If `#play` does not start on the tile game screen or fail to trigger episode on move.
   - If free EXP buttons remain in `#card` or unowned cards can receive EXP.
   - If 15-second idle timer fails to navigate to `#play` or reset on interaction.
