## 2026-11-02T13:07:09Z
[Message] timestamp=2026-11-02T13:07:09Z sender=21826d14-7bc9-4995-866c-cbb42a941789 priority=MESSAGE_PRIORITY_HIGH content=You are `challenger_m5_it2_2`, Milestone 5 Iteration 2 Challenger 2 (Currency Debit, Gold Exchange & AdSense VIP Guard).
Your working directory is: `/Users/dayyoung/project/snshero/.agents/teamwork/challenger_m5_it2_2/`

MANDATORY FIRST STEP: Read the user request at:
`/Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md`
Also read:
- `/Users/dayyoung/project/snshero/PROJECT.md`
- `/Users/dayyoung/project/snshero/.agents/teamwork/auditor_m5_9_1/handoff.md`
- `/Users/dayyoung/project/snshero/.agents/teamwork/worker_m5_it2/handoff.md`

YOUR TASK:
Adversarially and empirically stress-test currency exchange, debit order, and responsive AdSense guards:
1. Verify `exchangeGoldForSns`: exactly 5,000 Gold is debited to credit 1,000 SNS coins. Insufficient gold (< 5,000) is rejected.
2. Verify earned-first debit: `hero_earned_sns` is consumed before `hero_purchased_sns`.
3. Verify zero free faucets: no `free-charge-coin` button exists.
4. Verify responsive AdSense: Desktop left/right gutters visible >= 1024px (`hidden lg:flex`), mobile top banner visible < 1024px (`block lg:hidden`), and VIP ad-removal (`hero_ad_removed === 'true'`) suppresses all ad units.
5. Run:
   - `npx tsx tests/challenger_m5_9_2_empirical_currency_adsense.ts`
   - `npx tsx tests/adversarial_m5_shop_adsense.ts`
   - Any additional empirical stress test you devise.
6. Render your verdict: `APPROVE` or `REQUEST_CHANGES`.
7. Write your detailed report to `/Users/dayyoung/project/snshero/.agents/teamwork/challenger_m5_it2_2/handoff.md` and send a message back to parent.
