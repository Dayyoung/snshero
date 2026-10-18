# Explorer Survey 1 Dispatch

## 2026-10-18T01:36:37Z
Target: Map CARD_DATABASE (IDs 1-110), 11 Factions, Tiers, Visual Motifs, and Lore
Sender: f84aca46-e09f-4967-b5d1-281f855a924e
Working directory: /Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_1/
Mission:
Investigate and map the full specification of all 110 hero characters in SNSHero:
1. Examine src/cardDatabase.ts (IDs 1–110) and src/content/characterIp.ts.
2. Group all 110 cards by their 11 elemental/racial factions (Water: 1–10, Fire: 11–20, Wind: 21–30, Earth: 31–40, Human: 41–50, Undead: 51–60, Elf: 61–70, Dwarf/Hobbit: 71–80, Beast/Monster: 81–90, Mecha/Robot: 91–100, Dragon: 101–110).
3. Document for each card and faction:
   - Card ID, Korean Name, English Name
   - Rarity/Tier (Bronze, Silver, Gold, Boss at multiples of 10)
   - Visual motifs, elemental affinities, weapon/armor, key color palettes, and lore/character silhouette identity.
4. Check src/components/CardItem.tsx and src/content/characterAssetManifest.ts for how card portraits and frames are decorated or rendered in the game UI.
5. Write a comprehensive, structured handoff report to: /Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_1/handoff.md
6. Notify your caller using send_message with a summary and the path to your handoff report.
