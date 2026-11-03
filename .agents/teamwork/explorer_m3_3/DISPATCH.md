# Dispatch Assignment: explorer_m3_3

## Mission
Investigate and design complete specifications and code for Milestone 3:
1. `src/landing/views/CardSection.tsx` & `src/landing/services/cardNurtureStore.ts`:
   - Section heading named '카드' (renamed from '미션').
   - Collection rate indicator display: `수집율: XX / 110 (XX.X%)`.
   - 110 Card Grid displaying all cards with 3-tier visual assets, level badge, and unspent stat point red dot indicator.
   - Card Nurturing Engine (`cardNurtureStore.ts`):
     - Level range 1 to 100 with progressive EXP thresholds.
     - Nurturing action grants EXP; leveling up grants unspent stat points.
     - Unspent stat points trigger a persistent red dot indicator on the card and stat tabs.
     - 4-way directional stat enhancement: Top ($N$), Right ($E$), Bottom ($S$), Left ($W$).
     - Permanent LocalStorage persistence under key `hero_card_nurturing`.
     - Data schema matching `CardNurtureData` and `NurtureState` interface contracts in `PROJECT.md`.
2. `src/landing/views/ShopSection.tsx`:
   - Clean simple grid with exact 8 specified items:
     1. 일반 카드팩
     2. 매직 카드팩
     3. 희귀 카드팩
     4. 아이템 팩
     5. 광고 제거
     6. 공식 소설
     7. 공식 동영상
     8. 코인 충전
   - Purchase / preview simulation with LocalStorage coin balance and instant feedback.
   - All buttons `min-h-[44px]`.

## Authoritative Inputs
- `/Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md` (lines 65–72, R4)
- `/Users/dayyoung/project/snshero/PROJECT.md` (§ Feature Inventory Features 15–18, § Interface Contracts)
- `/Users/dayyoung/project/snshero/TEST_INFRA.md` (T1.SEC.4, T1.SEC.5, T2.B2.1, T2.B2.2, T3.C2.3, T4.W1.2, T4.W1.3)

## Output Requirements
Write your handoff report to:
`/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m3_3/handoff.md`
Report back via send_message.


## 2026-11-02T05:49:19Z
[Message] sender=7b342c7a-1d74-43d7-a388-5ffc926b3969 priority=MESSAGE_PRIORITY_HIGH
Task:
Investigate and design complete specifications and code for Milestone 3:
1. `src/landing/views/CardSection.tsx` & `src/landing/services/cardNurtureStore.ts`:
   - '카드' section naming, collection rate display (XX/110).
   - 110 card grid.
   - 1~100Lv EXP curve, stat point grant on level-up, red dot indicators for unspent points, 4-way stat allocation (top, right, bottom, left).
   - LocalStorage key `hero_card_nurturing` schema and permanent auto-persistence.
2. `src/landing/views/ShopSection.tsx`:
   - Exact 8 fixed items: 일반 카드팩, 매직 카드팩, 희귀 카드팩, 아이템 팩, 광고 제거, 공식 소설, 공식 동영상, 코인 충전.
   - 44px+ touch targets and Terminal-Flat layout.

Write your report to:
/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m3_3/handoff.md
Send a completion message when finished.
