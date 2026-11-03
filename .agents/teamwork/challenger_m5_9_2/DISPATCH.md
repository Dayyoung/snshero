## 2026-11-02T12:32:03Z
[Message] timestamp=2026-11-02T12:32:03Z sender=21826d14-7bc9-4995-866c-cbb42a941789 priority=MESSAGE_PRIORITY_HIGH content=You are challenger_m5_9_2, the Milestone 5 Challenger 2 (Currency Invariants & AdSense VIP Guard).
Your working directory is: /Users/dayyoung/project/snshero/.agents/teamwork/challenger_m5_9_2/
Your parent conversation ID is: 21826d14-7bc9-4995-866c-cbb42a941789

MANDATORY CONSTRAINTS:
1. Read the authoritative user request at `/Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md`.
2. Read the master project plan at `/Users/dayyoung/project/snshero/PROJECT.md`.
3. Read the worker handoff report at `/Users/dayyoung/project/snshero/.agents/teamwork/worker_m5_9/handoff.md`.

CHALLENGE MISSION:
You are an adversarial verifier. Write and execute an independent empirical stress-test script to challenge Milestone 5:
1. Currency Debit/Credit & Faucet Elimination:
   - Verify all free faucets (`+ 코인 무료 충전`, `coin_charge` 0-cost item) are completely eliminated from `ShopSection.tsx` and `index.ts`.
   - Verify non-free gold exchange:
     - When `hero_gold >= 5000`, 5,000 gold debited and 1,000 SNS credited to both `hero_sns` and `hero_earned_sns`.
     - When `hero_gold < 5000` (e.g. 0, 4999), exchange returns failure, debits 0 gold, and credits 0 SNS.
   - Verify currency debit hierarchy on pack purchase:
     - Debits `hero_earned_sns` first, then `hero_purchased_sns`.
     - Fails gracefully if total SNS is insufficient without balance leakage.
2. Responsive Google AdSense Layout & VIP Guard:
   - Verify desktop gutters (`<aside id="adsense-desktop-left">` and `<aside id="adsense-desktop-right">`) have `hidden lg:flex` and publisher ID `ca-pub-6937094123258335`.
   - Verify mobile top banner (`<div id="adsense-mobile-top">`) has `block lg:hidden`.
   - Verify VIP Guard: When `localStorage.setItem('hero_ad_removed', 'true')`, all gutters and banners are 100% suppressed (empty strings emitted, tag push disabled).

Execute your test script using `npx tsx <your_script_path>`. Report exact numbers of assertions tested and passed.

REPORTING:
Create `handoff.md` in your working directory with the 5 required sections: Observation, Logic Chain, Caveats, Conclusion (explicitly state verdict: **APPROVE** or **REQUEST_CHANGES**), and Verification Method.
Send a message back to the parent with your verdict and findings.
