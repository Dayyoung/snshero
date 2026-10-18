## 2026-10-18T20:12:28Z
[Message] timestamp=2026-10-18T20:12:28Z sender=0841dceb-1ed6-4895-a369-d9b2f167a28c priority=MESSAGE_PRIORITY_HIGH content=You are Worker 1 for Milestone 1 (Storyline & Script Content Synchronization) of the SNSHero RPG mode overhaul.
Your working directory is:
/Users/dayyoung/project/snshero/.agents/teamwork/teamwork_preview_worker_m1_1/

MANDATORY: Read the original user request first:
/Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md

Reference files to read:
- /Users/dayyoung/project/snshero/PROJECT.md
- /Users/dayyoung/project/snshero/.agents/teamwork/teamwork_preview_explorer_survey_1/survey_report.md
- /Users/dayyoung/project/snshero/.agents/teamwork/teamwork_preview_explorer_survey_2/survey_report.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

File ownership:
You EXCLUSIVELY own:
1. `src/content/kadanRpgNovelScript.ts`
2. `src/content/kadanRpgStory.ts`
3. `src/lib/i18n.ts`
Do NOT modify files outside your ownership.

Your tasks:
1. In `src/content/kadanRpgNovelScript.ts`:
   - Extend `KadanRpgNovelScriptLine` and export `KadanRpgDialogueChoice` with the exact interface from `PROJECT.md § Interface Contracts`:
     ```typescript
     export interface KadanRpgDialogueChoice {
       id: string;
       attitude: '[결의/돌파]' | '[신중/통찰]' | '[성진호흡/공명]';
       attitudeEn?: '[Resolve]' | '[Insight]' | '[Resonance]';
       labelKo: string;
       labelEn: string;
       followUpTextKo: string;
       followUpTextEn: string;
       bonusType: 'sns' | 'buff' | 'item';
       bonusValue: number;
       bonusDescKo: string;
       bonusDescEn: string;
       isDefault?: boolean;
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
   - Synchronize and rewrite all 40 chapters of `KADAN_RPG_NOVEL_SCRIPTS` so each chapter dramatizes the canonical 40-episode webnovel storyline documented in Explorer 1's `survey_report.md § 2 & § 6`.
   - Every chapter must contain authentic narrative lines, correct character card IDs, and at least one interactive protagonist dialogue choice node featuring the 3 attitude choices (`[결의/돌파]`, `[신중/통찰]`, `[성진호흡/공명]`) with follow-up reaction text and micro-bonus metadata.

2. In `src/content/kadanRpgStory.ts`:
   - Synchronize all 40 chapters: canonical titles (`chapterTitles`), region alignment (`chapterRegionIds`), speaker cards (`speakerCardIds`), and `KADAN_RPG_ENCOUNTERS` to align with the 40-episode reference matrix from `PROJECT.md` and `survey_report.md § 2`.

3. In `src/lib/i18n.ts`:
   - Update all 40 chapter titles (`kadan_rpg_chapter_01` ~ `kadan_rpg_chapter_40`) and opponent names (`kadan_rpg_opp_ch01` ~ `kadan_rpg_opp_ch40`, plus ambush names `kadan_rpg_opp_bandit`, `kadan_rpg_opp_thief`) in both Korean (`ko`) and English (`en`).

4. Verification:
   - Run `npx tsc --noEmit` and `npm run build`.
   - Ensure 0 errors and successful build.

Write your report to:
/Users/dayyoung/project/snshero/.agents/teamwork/teamwork_preview_worker_m1_1/handoff.md
Send a completion message back to orchestrator_6 when finished.
