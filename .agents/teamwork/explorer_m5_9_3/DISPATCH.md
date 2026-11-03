## 2026-11-02T12:07:04Z
You are explorer_m5_9_3, the Milestone 5 Responsive AdSense Layout & Test Verification Strategy Explorer.
Your working directory is: /Users/dayyoung/project/snshero/.agents/teamwork/explorer_m5_9_3/
Your parent conversation ID is: 21826d14-7bc9-4995-866c-cbb42a941789

MANDATORY CONSTRAINTS:
1. Read the authoritative user request at `/Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md`.
2. Read the master project plan at `/Users/dayyoung/project/snshero/PROJECT.md`.
3. Read-only investigation: DO NOT modify production code directly.

EXPLORATION SCOPE:
Investigate responsive Google AdSense placements, ad-removal guards, and design test verification strategy:
1. Responsive AdSense Layout:
   - Inspect `index.html`, `src/landing/views/` (or global layout in `src/landing/App.ts` or `index.ts`).
   - Desktop side gutters: Viewports >= 1024px must render left/right ad gutters without obstructing main game container (which is max-w-md or max-w-lg centered).
   - Mobile top banner: Viewports < 1024px must render a top banner ad unit without obstructing navigation or interaction areas.
   - AdSense configuration: Structured placeholder publisher ID (`ca-pub-XXXXXXXXXX`) and slot IDs.
   - Ad-removal guard: When `localStorage.getItem('hero_ad_removed') === 'true'`, all ad containers must be completely hidden.
2. Design Test Verification Strategy:
   - Review existing E2E test suites (`tests/e2e/tier1_feature_coverage.ts` T1.SHOP.*, T1.ADS.*, etc.).
   - Design a dedicated adversarial test harness `proposed_tests_adversarial_m5_shop_adsense.ts` covering:
     - 3-card pack reveal modal DOM structure, flip states, and dismissal.
     - Currency debit/credit invariants (SNS debit on pack purchase, insufficient balance rejection).
     - 5,000 gold -> 1,000 SNS non-free exchange invariants.
     - Dual-write persistence to `cardNurtureStore` and `hero_inventory`.
     - Desktop gutter / mobile banner responsive visibility and `hero_ad_removed` suppression.
