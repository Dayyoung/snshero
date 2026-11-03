# Dispatch Instructions

## 2026-11-02T07:34:04Z
Replace legacy standalone page routes (`/home`, `/deck`, `/play`, `/main`, `/shop`, `/card`) with fully functional hash-based single-page sections (`#home`, `#deck`, `#play`, `#card`, `#shop`) on the main application for production deployment. The system must support core game loop parity, character nurturing gated by owned cards and battle victory EXP with repeat hunting, a 15-second idle auto-play redirect, restored shop mechanics, and responsive Google AdSense placements.

Working directory: /Users/dayyoung/project/snshero
Integrity mode: development

## Requirements

### R1. Hash Route Migration and Feature Parity
- `#home` replaces the legacy `/home` screen, displaying the SNS Hero logo and Cool Card Deck logo while retaining all existing Home features.
- `#deck` replaces the legacy `/deck` screen, supporting My Deck editing and retaining all existing Deck features.
- `#play` replaces the legacy `/play` screen. The initial screen must start on the existing tile game screen. Navigating/moving initiates an episode. Once the episode finishes, proceed to card play as before, and enable auto-play after completion. Existing Play features must remain functional.
- `#card` replaces the legacy `/card` screen. Character nurturing is restricted strictly to owned characters. Nurturing requires EXP earned exclusively by winning card battles. After a match ends, enable repeat hunting (`반복 사냥`). Existing Card features must remain functional.
- `#shop` replaces the legacy `/shop` screen. Fix card pack purchase and currency recharge functionality using in-game currency balances and LocalStorage, ensuring card packs can be opened and currencies are properly credited and debited.
- Complete replacement: Ensure `#home`, `#deck`, `#play`, `#card`, and `#shop` provide full functional parity so legacy routes (`/home`, `/deck`, `/play`, `/main`, `/shop`, `/card`) can be completely removed.

### R2. Global 15-Second Idle Auto-Play Transition
- On any screen, if user input is absent for 15 seconds or more, automatically navigate to `#play` (`https://dayyoung-macbookpro.tail3717a4.ts.net/#play`) and initiate auto-play. User interaction must reset the timer.

### R3. Responsive Google AdSense Integration
- Implement responsive Google AdSense ad units across all screens:
  - PC / Desktop: Display Google ad units in the left and right side gutters/margins without obstructing game interface elements.
  - Tablet & Mobile: Display a mobile banner ad unit at the top of the viewport.
- Structure ad containers and standard placeholder script tags so publisher and slot IDs can be configured for production.

## Acceptance Criteria

### Navigation & Core Functional Parity
- [ ] Navigating to `#home` displays the SNS Hero logo and Cool Card Deck logo, with all existing Home screen features operational.
- [ ] Navigating to `#deck` allows selecting and saving My Deck configurations, with all existing Deck screen features operational.
- [ ] Navigating to `#play` starts on the tile game screen, triggers an episode upon movement, transitions to card play when the episode ends, and supports auto-play upon completion.
- [ ] Navigating to `#card` restricts nurturing strictly to owned characters, awards EXP only when winning card battles, and displays a repeat hunting option upon match completion.
- [ ] Navigating to `#shop` supports card pack purchases and non-free currency replenishment using in-game LocalStorage currency balances.
- [ ] All primary workflows on `#home`, `#deck`, `#play`, `#card`, and `#shop` operate on `index.html` hash navigation without depending on the legacy standalone routes.

### Idle Auto-Play Transition
- [ ] Remaining idle on any screen without user input for 15 seconds triggers automatic navigation to `#play` and starts auto-play.
- [ ] Any user interaction (click, keypress, touch) resets the 15-second idle timer.

### Responsive Ad Layout
- [ ] On desktop viewports (width >= 1024px), Google AdSense ad units appear in the left and right margins/gutters.
- [ ] On tablet and mobile viewports (width < 1024px), an ad banner unit appears at the top of the screen.
- [ ] Ad placements do not obscure game boards, cards, touch controls, or navigation elements.
