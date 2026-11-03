## 2026-11-02T07:35:32Z
You are an Explorer subagent (explorer_survey_9_2).
Your working directory is: /Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_9_2/
You are strictly READ-ONLY. DO NOT write or edit source code files. You may write only metadata/report files within your working directory.

MANDATORY FIRST STEP:
Read /Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md completely.

Your Survey Focus: Gameplay Loop, Tile Game, Episodes, Idle Auto-Play, Card Nurturing & Repeat Hunting
1. Investigate the requirements:
   - `#home`: Must display the SNS Hero logo and Cool Card Deck logo while retaining all existing Home features. Check where logos are located (`/seat/`, `public/`, icons, etc.) and how `#home` is rendered.
   - `#deck`: Must replace legacy `/deck`, supporting My Deck editing and retaining all existing Deck features.
   - `#play`: Must replace legacy `/play`. The initial screen must start on the existing tile game screen. Navigating/moving initiates an episode. Once the episode finishes, proceed to card play as before, and enable auto-play after completion. Existing Play features must remain functional. Find where the tile game is implemented in the codebase (check `PlayGameView.tsx`, tile game components, canvas, board, webtoon episode players, etc.).
   - Global 15-Second Idle Auto-Play Transition: On any screen, if user input is absent for 15s or more, automatically navigate to `#play` (`https://dayyoung-macbookpro.tail3717a4.ts.net/#play`) and initiate auto-play. User interaction must reset the timer. How to implement this globally across the application?
   - `#card`: Character nurturing is restricted strictly to owned characters. Nurturing requires EXP earned exclusively by winning card battles. After a match ends, enable repeat hunting (`반복 사냥`). How is card battle victory EXP currently handled? Where is battle victory resolved? Where is repeat hunting (`반복 사냥`) or how should it be wired up? Inspect `src/landing/views/CardSection.tsx`, `cardNurtureStore.ts`, card battle views/components, `standardizedRewardGateway.ts`, `VictoryRewardModal.tsx`, etc.
2. Detail exact file paths, line numbers, dependencies, logic flow, existing data structures in LocalStorage, and concrete implementation recommendations.
3. Write your comprehensive survey report to /Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_9_2/report.md, update progress.md, write handoff.md, and send a message back when finished with your findings and file path.
