# SNSHero Hash-Based SPA Migration & Full Feature Parity E2E Test Infrastructure (TEST_INFRA.md)

## 1. Test Philosophy & Design Principles

This document establishes the test architecture, methodology, verification hierarchy, and coverage standards for the **SNSHero Hash-Based SPA Migration & Full Feature Parity Project** (`index.html`, `src/landing/`, `src/views/`, `src/components/`, `tests/e2e/`).

### Core Principles:
1. **Opaque-Box Requirement-Driven Testing**: Tests interact strictly with public contracts, observable DOM outputs, hash routing transitions, LocalStorage single-source-of-truth mutations, and user interaction event lifecycles. Zero tests depend on private implementation variables, internal closures, or transient render quirks.
2. **Deterministic Authoritative Output Derivation**: Expected outputs are derived authoritatively from `ORIGINAL_REQUEST.md` and `PROJECT.md`:
   - Exact 5 hash routes (`#home`, `#deck`, `#play`, `#card`, `#shop`).
   - Exact 15,000ms idle timer countdown with `https://dayyoung-macbookpro.tail3717a4.ts.net/#play` destination.
   - Exact 50 EXP awarded exclusively to active deck cards upon battle victory.
   - Strict `isCardOwned` guard preventing free EXP or unowned nurturing.
   - Dual-write synchronization between `cardNurtureStore` and `hero_inventory`.
   - Responsive AdSense viewports (>= 1024px desktop side gutters, < 1024px mobile top banner) with VIP ad-removal suppression.
3. **Progressive Milestone Testability**: The harness provides clean milestone isolation (`--milestone M1` through `M6` and `ALL`), allowing each milestone to be verified autonomously with only its completed dependencies.
4. **Adversarial & Forensic Verification**: Rigorous edge cases (timer sub-millisecond boundaries, extreme screen viewports, JSON storage corruption, zero-balance rejection, anti-cheating zero-mock checks) prevent façade tests.

```
+---------------------------------------------------------------------------------------------------+
|         SNSHero Hash-Based SPA Migration & Full Feature Parity 4-Tier Test Harness                |
+---------------------------------------------------------------------------------------------------+
|  Tier 1: Feature Coverage & Interface Contracts (51 Assertions across 10 Feature Groups)          |
|  - Group 1 (Hash Routing & Legacy Elimination, F1, F2, F4, M1): #home, #deck, #play, #card, #shop |
|    hash router canonical set, client hashchange listeners, legacy route redirects (/home, /deck). |
|  - Group 2 (Global 15s Idle Auto-Play, F3, M1): 15,000ms inactivity timer, tailscale redirect url,|
|    hero_kadan_rpg_auto_mode flag persistence, interaction event reset (click, key, touch, scroll).|
|  - Group 3 (#home Branding & Preview, F5, F6, M2): SNS Hero logo (/logo-ko.png), 5-card fan preview|
|    deck CP calculation, win streak flame badge, 4 media pillars, external serial links & badges.  |
|  - Group 4 (#deck Editing Parity, F7, M2): 5-slot composition, owned card slot swapping, real-time|
|    Deck TP sum, Total TP inventory power sum, hero_deck LocalStorage sync.                        |
|  - Group 5 (#play Game Loop Parity, F8-F12, M3): 2D tile game screen (KadanWorldMap), step move   |
|    dialogue trigger (KadanNpcDialog), 3x3 battle (MobileCardPlayScreen), auto-play runner parity.  |
|  - Group 6 (#card Nurture, EXP Gating & Repeat Hunting, F13-F15, M4): Owned-only restriction,     |
|    elimination of free EXP buttons, battle victory 50 EXP hook, repeat hunting (반복 사냥) loop.  |
|  - Group 7 (#shop Restoration & Dual-Write, F16-F19, M5): 8 fixed shop items, 3-card pack reveal  |
|    modal, dual-write to cardNurtureStore and hero_inventory, non-free gold exchange (5,000->1,000)|
|  - Group 8 (Responsive Google AdSense, F20-F22, M5): Desktop >=1024px gutters, mobile <1024px     |
|    banner, non-obstructing layout, hero_ad_removed VIP suppression, publisher/slot attributes.    |
|  - Group 9 (E2E Test Harness Integrity, F23, M6): 4-tier CLI flags, milestone filtering, JSON.   |
|  - Group 10 (Forensic Audit & Anti-Cheating, F24, M6): 110 authentic heroes in cardDatabase,      |
|    LocalStorage single source of truth, 0px/4px radii, 44px+ touch targets, safe imports.         |
+---------------------------------------------------------------------------------------------------+
|  Tier 2: Boundary Value Analysis & Corner Cases (12 Assertions across Core Boundaries)            |
|  - Boundary 1 (Max Level 100 Cap): Card reaching Lv 100 caps EXP at max, prevents Lv 101 overflow.|
|  - Boundary 2 (Level 1 Baseline State): Fresh un-nurtured card starts at Lv 1, 0 EXP, 0 bonus.    |
|  - Boundary 3 (Owned Gating): Unowned card nurture attempt strictly rejected with 0 EXP leakage.  |
|  - Boundary 4 (Idle Inactivity 14,999ms vs 15,000ms): Exact threshold trigger distinction.        |
|  - Boundary 5 (Last-Second Idle Interaction Reset): Activity at 14,900ms resets countdown cleanly.|
|  - Boundary 6 (Shop Underflow): Insufficient SNS balance safely rejected without mutating funds.  |
|  - Boundary 7 (Gold Exchange Boundary): Zero and insufficient gold amounts safely rejected.       |
|  - Boundary 8 (AdSense Breakpoint 1023px vs 1024px): Exact transition from mobile top to desktop. |
|  - Boundary 9 (VIP Ad Removal Full Width): Suppresses ads across all widths (320px..3840px).      |
|  - Boundary 10 (Route Fallbacks): Undefined or malformed hash routes safely fallback to #home.    |
|  - Boundary 11 (Storage Corruption): Malformed JSON string in hero_card_nurturing recovers.       |
|  - Boundary 12 (Zero Stat Points Allocation): Allocating stat when statPoints === 0 safely fails. |
+---------------------------------------------------------------------------------------------------+
|  Tier 3: Pairwise Combinations & State Machine (7 Assertions across Cross-Feature Synergies)       |
|  - Combination 1 (Hash Navigation & Idle Reset): Hash navigation resets 15s idle timer seamlessly.|
|  - Combination 2 (Battle Victory -> EXP -> Deck TP): Winning battle awards EXP, triggers level-up,|
|    allocates point, dynamically increments Deck TP.                                               |
|  - Combination 3 (Shop Purchase -> Dual-Write -> Nurture Gate): Buying pack dual-writes card and   |
|    immediately unlocks nurturing for newly acquired card.                                         |
|  - Combination 4 (Gold Exchange -> Balance -> Pack Purchase): Exchanging Gold for SNS replenishes |
|    balance and allows purchasing card pack.                                                       |
|  - Combination 5 (Repeat Hunting Consecutive Loop): Repeat hunting activates automated battles    |
|    and accumulates continuous victory EXP across rounds.                                          |
|  - Combination 6 (Responsive AdSense Dynamic Resizing): Resizing 1440px <-> 375px swaps gutters  |
|    for mobile banner, respecting VIP ad-removal state.                                            |
|  - Combination 7 (Legacy Route Direct Access): Direct entry to legacy route normalizes to hash.   |
+---------------------------------------------------------------------------------------------------+
|  Tier 4: Real-World Workload Scenarios (6 Assertions across Realistic End-to-End User Journeys)   |
|  - Scenario 1 (First-Time Visitor Journey): Landing on #home, verifying logos, badges, deck preview|
|  - Scenario 2 (15-Second Idle Workload): User inactivity triggers auto-play redirect to #play.    |
|  - Scenario 3 (Core RPG Gameplay Loop): Tile move -> dialog -> 3x3 battle -> victory EXP -> hunt. |
|  - Scenario 4 (Deck Strategy & Owned Card Nurturing): Editing deck, swapping owned cards, TP sync.|
|  - Scenario 5 (Commercial Economy Workload): Gold exchange -> pack reveal modal -> dual-write.    |
|  - Scenario 6 (Responsive Multi-Device Workload): Desktop gutters (1440px), mobile banner (375px).|
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Complete 24-Feature Inventory Mapping

Every feature from `PROJECT.md` is mapped across the 4-tier testing hierarchy:

| Feature ID | Feature Name | Description | Target Milestone | Primary Test IDs |
|---|---|---|---|---|
| **F1** | Hash Route Navigation Core | Client-side hash routing (`#home`, `#deck`, `#play`, `#card`, `#shop`) on `index.html` with `hashchange` listeners | M1 | `T1.HASH.1`, `T1.HASH.2`, `T2.B6.1`, `T3.C1.1` |
| **F2** | Legacy Standalone Route Elimination | Complete client redirect of `/home`, `/deck`, `/play`, `/main`, `/shop`, `/card` to hash routes | M1 | `T1.HASH.3`, `T1.HASH.4`, `T3.C1.7` |
| **F3** | Global 15-Second Idle Auto-Play | 15s inactivity redirects to `https://dayyoung-macbookpro.tail3717a4.ts.net/#play`, sets auto flag; interaction resets | M1 | `T1.IDLE.1` ~ `T1.IDLE.5`, `T2.B3.1`, `T2.B3.2`, `T4.W1.2` |
| **F4** | Internal Link Migration | Update all internal navigation links from `/...` to `#...` | M1 | `T1.HASH.5` |
| **F5** | `#home` SNS Hero Logo | Prominently display official full-color graphic logo (`/logo-ko.png`) | M2 | `T1.HOME.1`, `T4.W1.1` |
| **F6** | `#home` Cool Card Deck Logo & Features | 5-card fan-folded preview, deck CP, win streak badge, 4 media pillars, external serialization links | M2 | `T1.HOME.2` ~ `T1.HOME.5`, `T4.W1.1` |
| **F7** | `#deck` My Deck Editing Parity | Slot selection, owned card swapping, real-time Deck TP & Total TP calculation, `hero_deck` sync | M2 | `T1.DECK.1` ~ `T1.DECK.5`, `T4.W1.4` |
| **F8** | `#play` Tile Game Initial Screen | 2D tile adventure map (`KadanWorldMap` tile grid with hero & event coordinates) initial view | M3 | `T1.PLAY.1`, `T4.W1.3` |
| **F9** | `#play` Movement Episode Trigger | Navigating/moving on tiles triggers chapter episode dialogue (`KadanNpcDialog`) | M3 | `T1.PLAY.2`, `T4.W1.3` |
| **F10** | `#play` Card Battle Transition | Concluding episode transitions into 3x3 tactical card play (`MobileCardPlayScreen`) | M3 | `T1.PLAY.3`, `T4.W1.3` |
| **F11** | `#play` Auto-Play Upon Completion | Auto-play loop (`useKadanRpgAutoRunner`) progresses tiles, episodes, and battles hands-free | M3 | `T1.PLAY.4`, `T4.W1.3` |
| **F12** | `#play` Existing Play Features Retention | Retain access to 110 2D Canvas minigames arcade, PVP challenges, and episode viewer | M3 | `T1.PLAY.5` |
| **F13** | `#card` Owned-Only Nurturing Restriction | Eliminate free EXP buttons; strictly restrict leveling and stat points to owned characters (`isCardOwned`) | M4 | `T1.CARD.2`, `T1.CARD.3`, `T2.B2.1`, `T3.C1.3` |
| **F14** | `#card` Battle Victory EXP Gating | EXP earned exclusively by winning card battles (50 EXP per victory synced to `cardNurtureStore`) | M4 | `T1.CARD.4`, `T3.C1.2`, `T4.W1.3` |
| **F15** | `#card` Repeat Hunting (`반복 사냥`) | Enable repeat hunting auto-loop on match completion overlay to repeat battles hands-free | M4 | `T1.CARD.5`, `T3.C1.5`, `T4.W1.3` |
| **F16** | `#shop` Card Pack Purchase & Reveal Modal | Open card packs with animated reveal modal showing 3 unlocked cards with artwork, rarity, and stats | M5 | `T1.SHOP.2`, `T4.W1.5` |
| **F17** | `#shop` Inventory Dual-Write Sync | Purchased cards sync to both `cardNurtureStore` (`hero_card_nurturing`) and `hero_inventory` | M5 | `T1.SHOP.3`, `T3.C1.3`, `T4.W1.5` |
| **F18** | `#shop` Currency Balance Debit/Credit | Accurately debit and credit `hero_sns`, `hero_earned_sns`, and `hero_purchased_sns` | M5 | `T1.SHOP.4`, `T2.B4.1`, `T3.C1.4` |
| **F19** | `#shop` Non-Free Currency Replenishment | Exchange in-game LocalStorage currency (`hero_gold`) for `hero_sns` via structured exchange modal | M5 | `T1.SHOP.5`, `T2.B4.2`, `T3.C1.4`, `T4.W1.5` |
| **F20** | Responsive AdSense Desktop Side Gutters | Display Google ad units in left/right gutters on viewports >= 1024px without obstructing game UI | M5 | `T1.ADS.1`, `T1.ADS.3`, `T2.B5.1`, `T4.W1.6` |
| **F21** | Responsive AdSense Mobile Top Banner | Display mobile banner ad unit at top of viewport on screens < 1024px without obstructing game UI | M5 | `T1.ADS.2`, `T1.ADS.3`, `T2.B5.1`, `T4.W1.6` |
| **F22** | AdSense Configuration & Ad-Removal Guard | Structured placeholder publisher/slot IDs; hide all ads when `hero_ad_removed` is set | M5 | `T1.ADS.4`, `T1.ADS.5`, `T2.B5.2`, `T3.C1.6` |
| **F23** | E2E Test Suite 100% Pass & Hardening | Full 4-tier E2E test verification, adversarial edge cases, and build validation | M6 | `T1.E2E.1` ~ `T1.E2E.5` |
| **F24** | Forensic Integrity Audit | Systematic audit verifying authentic implementation with zero mock strings or cheating | M6 | `T1.AUDIT.1` ~ `T1.AUDIT.5` |

---

## 3. 4-Tier Test Suite Specification

### Tier 1: Feature Coverage & Interface Contracts (51 Tests)
1. **Group 1: Hash Route Navigation Core & Legacy Route Elimination**
   - `T1.HASH.1` Validates canonical set: `#home`, `#deck`, `#play`, `#card`, `#shop`.
   - `T1.HASH.2` Validates hash router event listeners and state delegation.
   - `T1.HASH.3` Validates legacy `/home` and `/main` redirect to `#home` and `#play`.
   - `T1.HASH.4` Validates legacy routes `/deck`, `/play`, `/shop`, `/card` redirection.
   - `T1.HASH.5` Validates navigation components link migration to `#...`.
2. **Group 2: Global 15-Second Idle Auto-Play Transition**
   - `T1.IDLE.1` Validates 15,000ms idle threshold countdown.
   - `T1.IDLE.2` Validates destination `https://dayyoung-macbookpro.tail3717a4.ts.net/#play`.
   - `T1.IDLE.3` Validates persistence of `hero_kadan_rpg_auto_mode = 'true'`.
   - `T1.IDLE.4` Validates interaction timer reset on user input.
   - `T1.IDLE.5` Validates event listener coverage (`click`, `keydown`, `touchstart`, `mousemove`, `scroll`).
3. **Group 3: `#home` SNS Hero Logo & Cool Card Deck Preview**
   - `T1.HOME.1` Validates official full-color logo asset `/logo-ko.png`.
   - `T1.HOME.2` Validates 5-card fan-folded preview deck composition.
   - `T1.HOME.3` Validates Deck Combat Power (CP) calculation.
   - `T1.HOME.4` Validates win streak flame badge and 4 media pillars.
   - `T1.HOME.5` Validates external serialization links with "[절찬 연재중]" badges.
4. **Group 4: `#deck` My Deck Editing Parity**
   - `T1.DECK.1` Validates 5-slot active deck composition display.
   - `T1.DECK.2` Validates slot selection and swapping from owned inventory.
   - `T1.DECK.3` Validates real-time Deck TP dynamic recalculation.
   - `T1.DECK.4` Validates Total TP inventory calculation.
   - `T1.DECK.5` Validates LocalStorage `hero_deck` persistence.
5. **Group 5: `#play` Tile Game, Episode Trigger & Battle Loop**
   - `T1.PLAY.1` Validates initial screen loads 2D tile map (`KadanWorldMap`).
   - `T1.PLAY.2` Validates step move episode dialogue trigger (`KadanNpcDialog`).
   - `T1.PLAY.3` Validates tactical 3x3 card battle transition (`MobileCardPlayScreen`).
   - `T1.PLAY.4` Validates auto-play loop progression (`useKadanRpgAutoRunner`).
   - `T1.PLAY.5` Validates retention of 110 2D canvas minigames arcade.
6. **Group 6: `#card` Owned-Only Nurturing, Victory EXP & Repeat Hunting**
   - `T1.CARD.1` Validates '카드' section naming and 110-card catalog.
   - `T1.CARD.2` Validates `isCardOwned` guard strictly preventing unowned leveling.
   - `T1.CARD.3` Validates complete elimination of free EXP grant buttons.
   - `T1.CARD.4` Validates battle victory hook (50 EXP awarded exclusively to active deck).
   - `T1.CARD.5` Validates repeat hunting (`반복 사냥`) auto-loop match overlay flag.
   - `T1.CARD.6` Validates 1~100Lv progression and 4-way stat point allocation.
7. **Group 7: `#shop` Pack Opening, Dual-Write & Non-Free Recharge**
   - `T1.SHOP.1` Validates exact 8 fixed shop items structure.
   - `T1.SHOP.2` Validates card pack purchase and 3-card reveal modal interface.
   - `T1.SHOP.3` Validates dual-write to `cardNurtureStore` and `hero_inventory`.
   - `T1.SHOP.4` Validates currency balance debit/credit calculations.
   - `T1.SHOP.5` Validates non-free gold exchange (5,000 gold -> 1,000 SNS).
8. **Group 8: Responsive Google AdSense Gutters & Mobile Banner**
   - `T1.ADS.1` Validates desktop side gutters for width >= 1024px.
   - `T1.ADS.2` Validates mobile top banner for width < 1024px.
   - `T1.ADS.3` Validates non-obstructing layout geometry.
   - `T1.ADS.4` Validates VIP ad-removal suppression (`hero_ad_removed = 'true'`).
   - `T1.ADS.5` Validates AdSense client script in `index.html`.
9. **Group 9: E2E Test Suite Integrity & Hardening**
   - `T1.E2E.1` Validates CLI runner options (`--tier`, `--milestone`).
   - `T1.E2E.2` Validates standalone zero-server execution portability.
   - `T1.E2E.3` Validates multi-milestone progressive filtering.
   - `T1.E2E.4` Validates JSON reporting formatting.
   - `T1.E2E.5` Validates production bundle build script readiness.
10. **Group 10: Forensic Integrity & Zero-Mock Anti-Cheating Verification**
    - `T1.AUDIT.1` Validates zero mock string shortcuts in core logic.
    - `T1.AUDIT.2` Validates LocalStorage single source of truth.
    - `T1.AUDIT.3` Validates OpenCode terminal-flat design standards (0px/4px).
    - `T1.AUDIT.4` Validates 44px+ mobile touch targets.
    - `T1.AUDIT.5` Validates safe import and single entrypoint rules.

### Tier 2: Boundary Value Analysis & Corner Cases (12 Tests)
- `T2.B1.1` **Max Level 100 Cap**: Level caps strictly at 100 with zero overflow points.
- `T2.B1.2` **Level 1 Clean Baseline**: Fresh cards start with 0 EXP and 0 bonus points.
- `T2.B2.1` **Unowned Card Nurturing Rejection**: Attempting to level an unowned card yields 0 EXP.
- `T2.B3.1` **Idle 14,999ms vs 15,000ms Transition Boundary**: Exact threshold validation.
- `T2.B3.2` **Last-Second Idle Interaction Reset**: User activity at 14,900ms resets countdown.
- `T2.B4.1` **Insufficient Balance Pack Purchase Safe Rejection**: Funds preserved.
- `T2.B4.2` **Zero and Insufficient Gold Exchange Safe Rejection**: Invalid inputs rejected.
- `T2.B5.1` **AdSense 1023px vs 1024px Breakpoint**: Top banner vs desktop gutters.
- `T2.B5.2` **VIP Ad-Removal Full Screen Width Coverage**: Suppressed at 320px..3840px.
- `T2.B6.1` **Unknown Hash Route Fallback to #home**: Graceful error recovery.
- `T2.B7.1` **LocalStorage Corrupted JSON Recovery**: Corrupted payload falls back cleanly.
- `T2.B7.2` **Zero Stat Points Allocation Safe Rejection**: Point expenditure rejected if empty.

### Tier 3: Pairwise Combinations & State Machine (7 Tests)
- `T3.C1.1` **Hash Navigation + Idle Timer Reset**: Route navigation resets idle timer.
- `T3.C1.2` **Battle Victory EXP -> Stat Point -> Deck TP Dynamic Sync**: Dynamic recalculation.
- `T3.C1.3` **Shop Pack Purchase -> Dual-Write -> Owned Nurturing Gate Unlocked**: Acquisition unlocks leveling.
- `T3.C1.4` **Gold Exchange -> Balance -> Pack Purchase Unlocking**: Currency exchange enables purchase.
- `T3.C1.5` **Repeat Hunting Consecutive Battle Loop**: Sequential battles and EXP accrual.
- `T3.C1.6` **Responsive AdSense Dynamic Viewport Transition**: Window resize switches ad formats.
- `T3.C1.7` **Legacy Route Direct URL Entry -> Redirection & View Sync**: Slash route redirects to hash.

### Tier 4: Real-World Workload Scenarios (6 Tests)
- `T4.W1.1` **First-Time Visitor Journey**: Hash navigation, logo inspection, fan-fold deck preview.
- `T4.W1.2` **15-Second Idle Inactivity Workload**: Auto-play redirect to `#play` and auto flag set.
- `T4.W1.3` **Core RPG Gameplay Loop**: Map tiles -> dialogue -> 3x3 battle -> victory EXP -> repeat hunting.
- `T4.W1.4` **Deck Strategy & Owned Card Nurturing**: Slot swapping, Deck TP update, stat allocation.
- `T4.W1.5` **Commercial Economy & Monetization**: Gold-to-SNS exchange, pack reveal modal, dual-write.
- `T4.W1.6` **Responsive Multi-Device Workload**: Desktop gutters (1440px), mobile banner (375px), VIP removal.

---

## 4. Test Execution & CLI Guide

```bash
# 1. Run all 4 tiers across all features (76 assertions)
npx tsx tests/e2e/run_all.ts

# 2. Run specific tiers
npx tsx tests/e2e/run_all.ts --tier 1   # Tier 1: Feature Coverage (51 assertions)
npx tsx tests/e2e/run_all.ts --tier 2   # Tier 2: Boundary & Corner Cases (12 assertions)
npx tsx tests/e2e/run_all.ts --tier 3   # Tier 3: Cross-Feature State Machine (7 assertions)
npx tsx tests/e2e/run_all.ts --tier 4   # Tier 4: Real-World Workload Scenarios (6 assertions)

# 3. Progressive milestone execution
npx tsx tests/e2e/run_all.ts --milestone M1   # Milestone 1: Hash Routes & Idle Auto-Play
npx tsx tests/e2e/run_all.ts --milestone M2   # Milestone 2: Home Logos & Deck Editing
npx tsx tests/e2e/run_all.ts --milestone M3   # Milestone 3: Play Tile Game & Battle Loop
npx tsx tests/e2e/run_all.ts --milestone M4   # Milestone 4: Card Nurturing & Repeat Hunting
npx tsx tests/e2e/run_all.ts --milestone M5   # Milestone 5: Shop Restoration & AdSense
npx tsx tests/e2e/run_all.ts --milestone M6   # Milestone 6: E2E Verification & Forensic Audit
npx tsx tests/e2e/run_all.ts --milestone ALL  # All Milestones

# 4. JSON & Automation Flags
npx tsx tests/e2e/run_all.ts --json         # Machine-readable JSON summary and assertion list
npx tsx tests/e2e/run_all.ts --verbose      # Detailed assertion logging and timings
npx tsx tests/e2e/run_all.ts --allow-fail   # Non-zero exit code suppression for CI pipelines
```

---

## 5. Quality Gate Pass Criteria

1. **Pass Rate**: 100.0% (76 / 76 assertions passing cleanly with 0 failures).
2. **Execution Speed**: Full test suite completes in under 0.10s.
3. **Zero Server Dependency**: Operates in standalone, headless node environment with zero network API requirements.
4. **Build & Lint Verification**: `npx tsc --noEmit` exits with code 0; `npm run build` exits with code 0.
