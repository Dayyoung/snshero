# Handoff Report: Milestone 3 — Core Sections & Card Nurturing System Implementation

- **Agent**: `worker_m3_1` (Teamwork Implementer / QA / Specialist)
- **Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/worker_m3_1/`
- **Date / Timestamp**: 2026-11-02T06:16:00Z
- **Target Milestone**: Milestone 3: Core Sections & Card Nurturing System (Features 12–17)
- **Local Git Commit**: `75fc970c0` ("feat(landing): implement Milestone 3 core sections and card nurturing system")

---

## 1. Observation

1. **Initial Baseline State**:
   - `npx tsx tests/e2e/run_all.ts --milestone M3 --allow-fail` reported 27 PASS, 16 FAIL (62.8% pass rate).
   - Missing target files:
     - `src/landing/views/MyDeckSection.tsx` (missing)
     - `src/landing/views/PlaySection.tsx` (missing)
     - `src/landing/views/CardSection.tsx` (missing)
     - `src/landing/views/ShopSection.tsx` (missing)
     - `src/landing/services/cardNurtureStore.ts` (missing)
     - `src/landing/services/webtoonCatalog.ts` (missing)
   - `HomeSection.tsx` had only 3 media pillars in a 3-column layout instead of the mandated 4 pillars (웹소설, 웹게임, 웹툰, 애니메이션) in 4 columns.

2. **Source Code Implementation**:
   - Created `src/landing/services/cardNurtureStore.ts`:
     - 1~100Lv EXP curve: `expToNext = level * 100`, cap at Lv.100.
     - 1 stat point per level gained.
     - 4-way stat allocation: top (N), right (E), bottom (S), left (W).
     - Red dot indicator: `hasUnspentPoints(cardId)` (`statPoints > 0`).
     - Deck TP: active 5 cards' $(N+E+S+W)$ power sum. Default starter cards 1..5 base sum = $11 + 12 + 17 + 18 + 22 = 80$ TP.
     - Total TP: sum across all owned cards (default 80 TP).
     - LocalStorage persistence under key `hero_card_nurturing` with graceful corrupted JSON recovery and clean missing key initialization.
   - Created `src/landing/services/webtoonCatalog.ts`:
     - Metadata for all 40 canonical webtoon episodes (47..61 scenes per episode).
     - Scene path resolvers: `/images/webtoon/episode_XX/scene_YY.webp`.
     - Lead narration text and speaker tags for both Korean and English.
   - Updated `src/landing/views/HomeSection.tsx`:
     - Added the 4th media pillar (`840컷+ 비주얼 웹툰`) between 웹게임 and 애니메이션.
     - Changed grid layout to `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`.
     - Verified literal links: `http://novel.naver.com/challenge/list?novelId=1250635`, `https://comic.naver.com/challenge/list?titleId=856677`, `https://nlink.munpia.com/link/munpia/novel/616551`.
     - Included `[절찬 연재중]` badges.
   - Created `src/landing/views/MyDeckSection.tsx`:
     - 5 active card slots responsive grid.
     - Real-time Deck TP (80 TP) and Total TP (80 TP) metric dashboard.
     - 3-tier visual integration (bust, 7-head cutout, SD).
     - Slot inspection with detailed stats breakdown, EXP bar, lore snippet, and actions (`data-nav="card"`, `/home`).
     - Minimalist layout: strictly zero `BattleHUD`, zero `Joystick`.
   - Created `src/landing/views/PlaySection.tsx`:
     - Exact 5 buttons in control bar: `['닫기', '이전', '다음', '나레이션', 'TTS']`.
     - Strict TTS contract: default `isTtsActive: false`, speech triggered ONLY on explicit user click.
     - Stepping (`prevScene`, `nextScene`) preserves TTS OFF state.
     - 40-episode webtoon scene viewer with stage, narration overlay, scrubber, and 40-episode carousel.
   - Created `src/landing/views/CardSection.tsx`:
     - Section title: '카드' (renamed from '미션').
     - Collection rate: `수집율: XX / 110 (XX.X%)` with progress bar.
     - 110-card comprehensive grid with 3-tier visual assets.
     - Flat red dot indicator for unspent points (`rounded-full w-2.5 h-2.5 bg-red-600`, zero `animate-ping`).
     - Card Nurture & 4-way stat allocation inspector with `+ 상단(N) 강화`, `+ 우측(E) 강화`, `+ 하단(S) 강화`, `+ 좌측(W) 강화` buttons.
   - Created `src/landing/views/ShopSection.tsx`:
     - Exact 8 fixed items: `'일반 카드팩'`, `'매직 카드팩'`, `'희귀 카드팩'`, `'아이템 팩'`, `'광고 제거'`, `'공식 소설'`, `'공식 동영상'`, `'코인 충전'`.
     - Zero prohibited clutter items (no `'행운의 룰렛'`, `'VIP 패스'`, `'보물상자'`).
     - Card pack purchases unlock cards into `cardNurtureStore` and immediately sync collection rate and Total TP.
     - LocalStorage `hero_sns` coin balance with `+ 코인 무료 충전`.
   - Updated `src/landing/index.ts`:
     - Unified routing for `home`, `deck`, `play`, `card`, `shop`.
     - Document-level event delegation handling all view actions.
     - Auto-cancels TTS when navigating away from play view or closing modal.
     - Listens to change and input events for scrubber and episode dropdown.
   - Updated `src/landing/types.ts`:
     - Exported `SHOP_8_ITEMS` and added optional `expGain?: number` to `NurtureState.nurtureCard`.

3. **Verification Command Results**:
   - `npx tsc --noEmit`: Exited with code 0 (zero errors).
   - `npm run build`: Exited with code 0. `dist/index.html` size: 43 KB (< 50 KB limit). `dist/assets/index-edg35rn6.js` size: 1.1 KB (zero React runtime in static landing).
   - `npx tsx tests/e2e/run_all.ts --milestone M3`: **43 / 43 assertions PASS (100.0%)**.
   - `npx tsx tests/e2e/run_all.ts --milestone M1`: **9 / 9 assertions PASS (100.0%)**.
   - `npx tsx tests/e2e/run_all.ts --milestone M2`: **13 / 13 assertions PASS (100.0%)**.
   - `npx tsx tests/e2e/run_all.ts` (Full suite): **69 / 69 assertions PASS (100.0%)**.
   - Google Form Submission: `python3 skills/report-ex/scripts/submit_report.py --dept "개발" --task "[M3 구현] 핵심 5대 화면 및 카드 육성 시스템 완성" --status "작업완료"` -> Returned: `Successfully submitted task: [개발] [M3 구현] 핵심 5대 화면 및 카드 육성 시스템 완성 -> 작업완료`.

---

## 2. Logic Chain

1. **Decoupled Architecture with Zero React Runtime**:
   The static landing page (`index.html`) requires complete independence from the React 19 SPA (`/home`). All 5 views and services in `src/landing/` generate pure HTML string templates and manage state via document event delegation. This guarantees bundle size remains lightweight (43 KB) while fulfilling all rich interactivity requirements.
2. **Card Nurturing Math & LocalStorage Synchronization**:
   Starter cards 1..5 have base $(N+E+S+W)$ sums of 11, 12, 17, 18, and 22, yielding an initial Deck TP of exactly 80. As cards gain EXP, level up (granting 1 point per level up to 100), and receive directional bonuses, `getDeckTP()` and `getTotalTP()` update reactively. Any shop card pack purchase unlocks new cards in `cardNurtureStore`, immediately syncing collection rate and Total TP, fulfilling cross-feature synergy tests `T3.C1.1` and `T3.C1.2`.
3. **Play Section 5 Buttons & Invariant TTS Contract**:
   `PlaySection.tsx` exposes exactly 5 buttons (`닫기`, `이전`, `다음`, `나레이션`, `TTS`). Initial load state is strictly `isTtsActive: false`. Scene and episode steppers (`prevScene`, `nextScene`) never auto-enable TTS, satisfying `T3.C1.3` and user request specifications. Navigating away from `play` invokes `stopPlayTts()`, preventing audio leakage.
4. **Shop Section Fixed 8 Items Compliance**:
   `ShopSection.tsx` renders exclusively the 8 mandated items and strictly excludes legacy clutter. Purchasing card packs drives genuine card additions to `cardNurtureStore` and persists to `hero_card_nurturing`.
5. **OpenCode Terminal-Flat Design Enforcement**:
   Monospace typography (`font-mono`), 0px container/card border radius, max 4px button radius, 1px hairlines (`border border-[rgba(15,0,0,0.12)]`), and minimum 44px mobile touch targets (`min-h-[44px]`) are strictly adhered to across all views.

---

## 3. Caveats

- In headless test runner environments without audio hardware, `window.speechSynthesis` is safely guarded with existence checks to prevent runtime errors.
- No modifications were made to the React 19 SPA (`/home`) source files, ensuring zero risk of regression to existing game battle features.

---

## 4. Conclusion

Milestone 3 (Core Sections & Card Nurturing System, Features 12–17) is 100% genuinely implemented, fully integrated, and verified:
- All 8 target files are complete and operational.
- All 43 Milestone 3 assertions pass (100.0%).
- All Milestone 1 (9/9) and Milestone 2 (13/13) assertions pass with zero regression.
- Static landing bundle size is 43 KB (< 50 KB ceiling).
- Mandatory Google Form report submitted successfully.
- Local git commit created (`75fc970c0`).

---

## 5. Verification Method

To independently verify this milestone:

```bash
# 1. Verify TypeScript compilation (0 errors expected)
npx tsc --noEmit

# 2. Run Milestone 3 E2E test harness (43/43 PASS expected)
npx tsx tests/e2e/run_all.ts --milestone M3

# 3. Run regression check on prior milestones (100% PASS expected)
npx tsx tests/e2e/run_all.ts --milestone M1
npx tsx tests/e2e/run_all.ts --milestone M2

# 4. Run full test suite across all milestones (69/69 PASS expected)
npx tsx tests/e2e/run_all.ts

# 5. Production build and bundle size verification (< 50 KB)
npm run build
ls -lh dist/index.html dist/assets/*index*
```

### Invalidation Conditions
- Any failure in `tests/e2e/run_all.ts --milestone M3`.
- Any introduction of React or heavy dependencies into `src/landing/` causing `dist/index.html` to exceed 50 KB.
- Any discrepancy in Deck TP calculation from starter 5-card sum (80 TP).
- Any violation of initial `isTtsActive: false` or missing control buttons in `PlaySection.tsx`.
- Any prohibited items appearing in `ShopSection.tsx`.
