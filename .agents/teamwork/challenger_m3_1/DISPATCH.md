## 2026-11-02T06:17:00Z
# Dispatch Assignment: challenger_m3_1

## Mission
Perform empirical adversarial challenge and verification for Milestone 3: Core Sections & Card Nurturing System implemented by `worker_m3_1` in commit `75fc970c0`.

## Reference Documents
- `/Users/dayyoung/project/snshero/.agents/teamwork/worker_m3_1/handoff.md`
- `/Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md`
- `/Users/dayyoung/project/snshero/PROJECT.md`
- `/Users/dayyoung/project/snshero/TEST_INFRA.md`

## Challenge Tasks & Stress Tests
1. **Deck TP & Stat Calculation Oracle**:
   - Verify mathematically that starter 5 cards (1..5) sum to exactly 80 TP:
     - Card 1: 1+4+1+5 = 11
     - Card 2: 7+1+3+1 = 12
     - Card 3: 6+6+3+2 = 17
     - Card 4: 2+3+6+7 = 18
     - Card 5: 6+5+6+5 = 22
     - Sum: 11+12+17+18+22 = 80
   - Test level up from 1 to 100: EXP curve `level * 100`, cap at Lv.100, exactly 99 stat points granted.
   - Test 4-way stat allocation: allocate to Top, Right, Bottom, Left; verify Deck TP updates accordingly.
   - Test red dot indicator: `hasUnspentPoints` true when points > 0, false when 0.
2. **Corrupted LocalStorage Recovery**:
   - Write invalid/corrupted JSON string to `hero_card_nurturing`.
   - Call `loadFromStorage()`. Verify clean recovery without crash and fallback to default 5 cards.
3. **Play Section 5 Buttons & Invariant TTS Contract**:
   - Check that exact 5 buttons exist: `['닫기', '이전', '다음', '나레이션', 'TTS']`.
   - Check that initial `isTtsActive` is strictly `false`.
   - Check that stepping through scenes (`prevScene`, `nextScene`) never auto-enables TTS.

## Deliverable
Write your empirical challenge harness, execution results, and verdict (`APPROVE` or `REJECT`) in `/Users/dayyoung/project/snshero/.agents/teamwork/challenger_m3_1/handoff.md` and message parent.
