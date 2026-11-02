# Project: SNSHero Hash-Based SPA Migration & Full Feature Parity

## Architecture
- **Single-Page Application (SPA) Hash Navigation**:
  - Main application entrypoint (`index.html`) serves as the production single-page application.
  - URL sections operate via hash navigation: `#home`, `#deck`, `#play`, `#card`, `#shop`.
  - Complete elimination of standalone page routes (`/home`, `/deck`, `/play`, `/main`, `/shop`, `/card`): all legacy paths automatically redirect/normalize to their hash counterparts (`/#home`, `/#deck`, etc.).
  - Zero standalone route dependencies on `index.html`.

- **Component & Module Structure**:
  - `src/landing/index.ts`: Application orchestrator, hash router, global event listeners (hashchange, idle timer, responsive layout).
  - `src/landing/components/`:
    - `Header.tsx`: Top navigation with `#home`, `#deck`, `#play`, `#card`, `#shop` links.
    - `Sidebar.tsx`: Side navigation with hash-based section links.
    - `Modals.tsx`: Pack reveal modal (`PackRevealModal`), gold-to-SNS currency exchange modal, login/community modals.
    - `Footer.tsx`: Footer with hash navigation.
    - `AdSenseBanners.tsx`: Responsive Google AdSense units (Desktop side gutters & Mobile top banner).
  - `src/landing/views/`:
    - `HomeSection.tsx` (`#home`): SNS Hero logo (`/logo-ko.png`), Cool Card Deck fan-folded 5-card preview (`LobbyInteractiveCard`), deck combat power, win streak flame badge, 4 core media pillars, external serialization links (Naver Webtoon, Naver Novel, Munpia) with "절찬 연재중" badges, 3-tier character visuals.
    - `MyDeckSection.tsx` (`#deck`): 5-slot deck representation, interactive slot selection & swapping from owned inventory, real-time Deck TP & Total TP calculation, LocalStorage sync (`hero_deck`, `hero_deck_${season}`, `hero_card_nurturing`).
    - `PlaySection.tsx` (`#play`): Starts on the 2D tile game screen (`KadanWorldMap`), step movement triggers chapter episode dialogue (`KadanNpcDialog`), episode conclusion proceeds into 3x3 tactical card battle (`MobileCardPlayScreen`), battle victory awards EXP and enables auto-play loop (`useKadanRpgAutoRunner`), plus access to minigames arcade tab and classic battle arena.
    - `CardSection.tsx` (`#card`): 110 card collection grid, character nurturing restricted strictly to owned cards, zero free EXP buttons, EXP earned exclusively from battle victories, 1~100Lv level up and 4-way stat allocation with unspent stat point red dot indicators.
    - `ShopSection.tsx` (`#shop`): 8 fixed shop items, card pack purchase opening modal with 3 revealed cards, dual-write to `cardNurtureStore` and `hero_inventory`, currency debit/credit (`hero_sns`, `hero_earned_sns`, `hero_purchased_sns`), non-free currency replenishment (in-game `hero_gold` to `hero_sns` exchange).
  - `src/landing/services/`:
    - `cardNurtureStore.ts`: 1~100Lv EXP logic, stat points, `isCardOwned` guard, active deck management, LocalStorage `hero_card_nurturing` persistence.
    - `idleAutoPlayManager.ts`: Global 15-second user inactivity detector navigating to `#play` (`https://dayyoung-macbookpro.tail3717a4.ts.net/#play`) and initiating auto-play, resetting on user interaction.
    - `adsenseManager.ts`: Configuration and injection for desktop side gutters and mobile top banner with ad-removal check (`hero_ad_removed`).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Hash Route Navigation Core | Full client-side hash routing (`#home`, `#deck`, `#play`, `#card`, `#shop`) on `index.html` with `hashchange` listeners | M1 | R1 |
| 2 | Legacy Standalone Route Elimination | Complete elimination & client redirect of `/home`, `/deck`, `/play`, `/main`, `/shop`, `/card` to hash routes | M1 | R1 |
| 3 | Global 15-Second Idle Auto-Play | Inactivity for 15s redirects to `#play` (`https://dayyoung-macbookpro.tail3717a4.ts.net/#play`) and starts auto-play; interaction resets | M1 | R2 |
| 4 | Internal Link Migration | Update all internal links across navigation, views, and landing from `/...` to `#...` | M1 | R1 |
| 5 | `#home` SNS Hero Logo | Display official full-color graphic logo (`/logo-ko.png`) prominently | M2 | R1 |
| 6 | `#home` Cool Card Deck Logo & Features | 5-card fan-folded deck preview, deck CP, win streak badge, 4 media pillars, serialization links with "절찬 연재중" | M2 | R1 |
| 7 | `#deck` My Deck Editing Parity | Slot selection, owned card replacement, real-time Deck TP & Total TP update, LocalStorage persistence | M2 | R1 |
| 8 | `#play` Tile Game Initial Screen | Initial screen loads 2D tile adventure map (`KadanWorldMap` tile grid with hero & event coordinates) | M3 | R1 |
| 9 | `#play` Movement Episode Trigger | Navigating/moving on tiles triggers chapter episode dialogue (`KadanNpcDialog`) | M3 | R1 |
| 10 | `#play` Card Battle Transition | Concluding episode transitions into 3x3 tactical card play (`MobileCardPlayScreen`) | M3 | R1 |
| 11 | `#play` Auto-Play Upon Completion | Auto-play loop (`useKadanRpgAutoRunner`) progresses tiles, episodes, and battles hands-free | M3 | R1 |
| 12 | `#play` Existing Play Features Retention | Retain access to 110 2D Canvas minigames arcade, PVP challenges, and episode viewer | M3 | R1 |
| 13 | `#card` Owned-Only Nurturing Restriction | Eliminate free EXP buttons; strictly restrict leveling and stat points to owned characters | M4 | R1 |
| 14 | `#card` Battle Victory EXP Gating | EXP earned exclusively by winning card battles; syncs battle victory EXP to `cardNurtureStore` | M4 | R1 |
| 15 | `#card` Repeat Hunting (`반복 사냥`) | Enable repeat hunting auto-loop on match completion overlay to repeat battles hands-free | M4 | R1 |
| 16 | `#shop` Card Pack Purchase & Reveal Modal | Open card packs with animated reveal modal showing 3 unlocked cards with artwork, rarity, and stats | M5 | R1 |
| 17 | `#shop` Inventory Dual-Write Sync | Purchased cards sync to both `cardNurtureStore` (`hero_card_nurturing`) and `hero_inventory` | M5 | R1 |
| 18 | `#shop` Currency Balance Debit/Credit | Accurately debit and credit `hero_sns`, `hero_earned_sns`, and `hero_purchased_sns` | M5 | R1 |
| 19 | `#shop` Non-Free Currency Replenishment | Exchange in-game LocalStorage currency (`hero_gold`) for `hero_sns` via structured exchange modal | M5 | R1 |
| 20 | Responsive AdSense Desktop Side Gutters | Display Google ad units in left/right gutters on viewports >= 1024px without obstructing game UI | M5 | R3 |
| 21 | Responsive AdSense Mobile Top Banner | Display mobile banner ad unit at top of viewport on screens < 1024px without obstructing game UI | M5 | R3 |
| 22 | AdSense Configuration & Ad-Removal Guard | Structured placeholder publisher/slot IDs; hide all ads when `hero_ad_removed` is set | M5 | R3 |
| 23 | E2E Test Suite 100% Pass & Hardening | Full 4-tier E2E test verification, adversarial edge cases, and build validation | M6 | Acceptance |
| 24 | Forensic Integrity Audit | Systematic audit verifying authentic implementation with zero mock strings or cheating | M6 | Policy |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Hash Routing & Idle Auto-Play | Hash route core (`#home`, `#deck`, `#play`, `#card`, `#shop`), legacy route elimination/redirects, 15s global idle timer | none | DONE |
| M2 | `#home` Logos & `#deck` Editing | SNS Hero logo, Cool Card Deck fan-fold preview, Home feature retention, My Deck slot editing & card swapping | M1 | DONE |
| M3 | `#play` Tile Game & Battle Loop | Tile game initial screen, movement episode trigger, card play transition, auto-play progression, play features | M1 | DONE |
| M4 | `#card` Nurturing & Repeat Hunting | Owned-only nurturing restriction, removal of free EXP buttons, battle victory EXP hook, repeat hunting loop | M1 | PLANNED |
| M5 | `#shop` Restoration & AdSense | Card pack opening reveal modal, inventory dual-write, currency debit/credit, gold exchange, responsive AdSense | M1 | PLANNED |
| M6 | E2E Verification & Forensic Audit | Pass 100% E2E test suite (Tiers 1-4), adversarial hardening (Tier 5), forensic integrity audit, build verification | M2, M3, M4, M5 | PLANNED |

## Interface Contracts
### `idleAutoPlayManager` ↔ App Shell
- `initIdleAutoPlay(options?: { timeoutMs?: number; targetUrl?: string })`: Registers input listeners on window/document.
- `resetIdleTimer()`: Resets the 15,000ms idle countdown timer.
- Trigger action: Sets `localStorage.setItem('hero_kadan_rpg_auto_mode', 'true')` and executes `window.location.href = 'https://dayyoung-macbookpro.tail3717a4.ts.net/#play'`.

### `cardNurtureStore` ↔ Card Battle Engine (`MobileCardPlayScreen.tsx`)
- `cardNurtureStore.isCardOwned(cardId: number): boolean`
- `cardNurtureStore.nurtureCard(cardId: number, expGain: number): { expGained: number; leveledUp: boolean; newLevel: number }` (guarded by `isCardOwned`)
- `cardNurtureStore.addCard(cardId: number): void` (dual-writes to `hero_inventory`)
- `cardNurtureStore.setDeckCard(slotIndex: number, cardId: number): boolean`
- Battle victory hook: On `winState === 'player'`, awards `50` EXP to each card in player active deck.

### `ShopSection` ↔ Inventory & Currencies
- Card Pack Purchase: Deducts SNS coins, rolls 3 cards based on pack tier, calls `cardNurtureStore.addCard(id)` and `syncToHeroInventory(id)`, opens `PackRevealModal`.
- Non-Free Currency Recharge: Consumes `hero_gold` (e.g. 5,000 gold -> 1,000 SNS) and credits `hero_sns`, updating balances synchronously.

### `AdSenseManager` ↔ Viewport Layout
- Desktop (>= 1024px): Renders `<aside id="adsense-desktop-left" class="adsense-gutter">` and `<aside id="adsense-desktop-right" class="adsense-gutter">`.
- Mobile (< 1024px): Renders `<div id="adsense-mobile-top" class="adsense-banner-top">`.
- VIP Ad-Removal Check: If `localStorage.getItem('hero_ad_removed') === 'true'`, renders null/empty string.

## Code Layout
- `index.html`: Production SPA entrypoint loading `src/landing/index.ts`.
- `src/landing/`: Main hash-based SPA implementation.
  - `src/landing/index.ts`: Application bootstrap, routing, idle timer, and layout wrapper.
  - `src/landing/components/`: Navigation, Modals, AdSense containers.
  - `src/landing/views/`: Individual hash section views (`HomeSection`, `MyDeckSection`, `PlaySection`, `CardSection`, `ShopSection`).
  - `src/landing/services/`: Store logic (`cardNurtureStore.ts`, `idleAutoPlayManager.ts`, `adsenseManager.ts`).
  - `src/landing/styles/landing.css`: OpenCode Terminal Flat styling rules.
- `src/views/`: Game engine views (`KadanRpgView`, `MobileCardPlayScreen`, `PlayGameView`, `ShopView`).
- `tests/e2e/`: Automated 4-tier E2E test suite.
