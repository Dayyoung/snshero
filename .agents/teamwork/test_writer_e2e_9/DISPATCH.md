## 2026-11-02T07:47:41Z
You are an E2E Test Writer agent (test_writer_e2e_9) for the SNSHero project.
Working directory: /Users/dayyoung/project/snshero/.agents/teamwork/test_writer_e2e_9/

MANDATORY FIRST STEP:
Read /Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md completely.
Also read /Users/dayyoung/project/snshero/PROJECT.md.

Your Objectives:
1. Create /Users/dayyoung/project/snshero/TEST_INFRA.md following the Project Pattern TEST_INFRA.md template:
   - Test Philosophy: Opaque-box, requirement-driven, zero dependence on implementation design internals.
   - Complete feature inventory mapping (all 24 features from PROJECT.md).
   - Test architecture, runners, coverage goals across 4 tiers:
     - Tier 1: Feature Coverage (>=5 tests per feature)
     - Tier 2: Boundary Value Analysis & Corner Cases (>=5 per feature)
     - Tier 3: Cross-Feature Combinations & State transitions
     - Tier 4: Real-World Workload Scenarios
2. Extend and update tests in /Users/dayyoung/project/snshero/tests/e2e/ so all new requirements have thorough, passing or ready test assertions:
   - Hash routes (#home, #deck, #play, #card, #shop)
   - Complete replacement of legacy routes (/home, /deck, /play, /main, /shop, /card)
   - Global 15-second idle auto-play redirect to https://dayyoung-macbookpro.tail3717a4.ts.net/#play and interaction reset
   - #home SNS Hero logo and Cool Card Deck logo preview
   - #deck My Deck editing and card swapping from owned inventory
   - #play tile game screen initial start, step move triggering episode dialogue, card battle transition, and auto-play
   - #card owned-only character nurturing, removal of free EXP buttons, battle victory EXP, and repeat hunting (반복 사냥)
   - #shop card pack opening reveal modal, inventory dual-write, currency balances debit/credit, and non-free gold-to-SNS replenishment
   - Responsive Google AdSense (desktop left/right side gutters >=1024px, mobile top banner <1024px, non-obstructing layout, ad-removal check)
3. Ensure tests run with `npx tsx tests/e2e/run_all.ts` cleanly.
4. When test infrastructure and test cases are ready, publish /Users/dayyoung/project/snshero/TEST_READY.md at project root.
5. Report your findings, updated test files, and test results back to the orchestrator.
