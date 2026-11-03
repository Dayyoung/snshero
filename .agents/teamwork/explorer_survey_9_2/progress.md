# Progress Heartbeat — explorer_survey_9_2

- Last visited: 2026-11-02T07:44:00Z
- Status: Investigation Complete, Writing Survey Report
- Completed Steps:
  1. Analyzed ORIGINAL_REQUEST.md completely (especially lines 435-537, Approved Task Prompt 2026-11-02T07:32:49Z).
  2. Discovered architecture: dual-entry (`index.html` static landing orchestrator vs `home.html` React SPA), Vite multi-entry build (`vite.config.ts`), and hash routing migration requirements (`#home`, `#deck`, `#play`, `#card`, `#shop`).
  3. Surveyed `#home`: Logo assets (`public/logo-ko.png`, `public/logo-en.png`, `public/nunhero-logo.png`), Cool Card Deck 5-card fan-folded preview (`LobbyInteractiveCard`), 4 media pillars, and official external links.
  4. Surveyed `#deck`: Legacy `/deck` (`MyDeckView.tsx`) vs landing `MyDeckSection.tsx`. Identified missing deck editing/swapping mechanism and LocalStorage persistence (`hero_deck`, `hero_deck_${season}`).
  5. Surveyed `#play`: Located tile game engine in `KadanRpgView.tsx` + `KadanWorldMap.tsx` + `useKadanRpgProgress.ts`. Traced step movement -> episode trigger (`KadanNpcDialog.tsx`) -> 3x3 card battle (`MobileCardPlayScreen.tsx`) -> auto-play loop (`useKadanRpgAutoRunner.ts`) + legacy Play features.
  6. Surveyed Global 15s Idle Timer: Analyzed global DOM event listeners, 15000ms idle timer, auto-navigate to `#play` (`https://dayyoung-macbookpro.tail3717a4.ts.net/#play`), and auto-play initiation.
  7. Surveyed `#card` Nurturing & Victory EXP: Identified flaw in `CardSection.tsx` (free +50/+500 EXP buttons, unowned card inspection) and `cardNurtureStore.ts` (lacked `isCardOwned` check). Traced card battle victory resolution in `MobileCardPlayScreen.tsx` (line 1126-1136) and `VictoryRewardModal.tsx`. Designed Repeat Hunting (`반복 사냥`) auto-loop.
- Current Step: Writing comprehensive survey report to `report.md`.
