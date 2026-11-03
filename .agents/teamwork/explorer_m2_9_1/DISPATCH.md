# Dispatch: Explorer M2-9-1 (Home Section Logos & Deck Preview Explorer)

## Objective
Investigate `#home` section (`src/landing/views/HomeSection.tsx`, `src/landing/index.ts`, `src/landing/components/`) to plan:
1. Prominently displaying the official SNS Hero graphic logo (`/logo-ko.png`).
2. Implementing the Cool Card Deck logo/display: a fan-folded 5-card interactive preview of active squad cards (`cardNurtureStore.getDeckCardIds()` / `hero_deck`), with rotational offsets (-10deg ~ +10deg), rarity styling, stats, deck CP, and win streak badge.
3. Retaining 4 media pillars, serialization links with "[절찬 연재중]", and 3-tier character visuals.

Read:
- `/Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md`
- `/Users/dayyoung/project/snshero/PROJECT.md`
- `src/landing/views/HomeSection.tsx`
- `src/components/LobbyInteractiveCard.tsx`
- `src/landing/services/cardNurtureStore.ts`

Deliver `handoff.md` with: Observation, Logic Chain, Caveats, Conclusion (with exact code diffs), Verification Method.


## 2026-11-02T09:00:31Z
You are explorer_m2_9_1 (Home Section Logos & Deck Preview Explorer).
Your working directory is /Users/dayyoung/project/snshero/.agents/teamwork/explorer_m2_9_1/.

MANDATORY INSTRUCTIONS:
1. First, read /Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md verbatim.
2. Read /Users/dayyoung/project/snshero/PROJECT.md and /Users/dayyoung/project/snshero/.agents/teamwork/explorer_m2_9_1/DISPATCH.md.
3. Investigate `src/landing/views/HomeSection.tsx`, `src/landing/index.ts`, `src/landing/components/`, `src/components/LobbyInteractiveCard.tsx`, and `src/landing/services/cardNurtureStore.ts`.
4. Formulate an exact, drop-in implementation plan for:
   - Prominently displaying the official SNS Hero logo (`/logo-ko.png`) in `#home`.
   - Implementing the Cool Card Deck logo/display: a fan-folded 5-card preview of the user's active squad (cards from `cardNurtureStore.getDeckCardIds()` / `hero_deck`), with slight rotational offsets (-12deg to +12deg), glowing rarity borders, card stats, inspect modal on click, deck CP calculation, and win streak badge.
   - Preserving 4 media pillars (웹소설, 웹툰, 영화, 게임), serialization links with "[절찬 연재중]", and 3-tier character visuals.
5. Write your findings and drop-in code recommendations to `handoff.md` in your working directory.
6. Send a message to the orchestrator when finished.

DO NOT write source code or modify production files directly — you are a read-only exploration agent. Formulate exact code blocks in handoff.md for the Worker.
