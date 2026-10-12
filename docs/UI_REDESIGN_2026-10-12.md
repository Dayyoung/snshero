# SNSHero UI Redesign

## Card Style Follow-Up

User feedback requested a Pokemon TCG-inspired collectible frame rather than
the initial editorial card. CardItem now uses a yellow rim, element-tinted body,
name/power header, framed artwork and bottom stat/ability/collector information,
while retaining original SNSHero characters and assets.

Placed cards use blue `#2563eb` for the player and red `#dc2626` for the opponent.
The full frame, ownership footer and lightly tinted art surface update with live
ownership, including recaptures. Mobile slot borders/scores and the shared battle
momentum track use the same colors. Matgo's special ownership handling remains.

Chromium component checks verified red-blue-red updates and sprite containment
in normal, low-spec and reduced-motion modes. Nine mobile battle viewports and
three completed battle/reward callbacks passed after the change. Typecheck,
production build and whitespace checks passed; existing bundle warnings remain.

## Direction

Make the collectible artwork and tactical decisions the visual focus, rather
than adding more competing decoration. Preserve DESIGN.md's warm cream, ink,
monospace typography, hairline separators, square panels and 4px controls.
Use restrained rarity/ownership accents and short event-driven feedback.

## Implemented Scope

- Shared shell, navigation, page headers, panels, buttons and keyboard focus.
- Explicit light-theme scoping instead of ancestor selectors that also matched
  dark themes; flat metal surfaces and theme-aware chrome.
- Artwork-first shared CardItem, serial/rarity strip, directional stat plates,
  ownership/selection markers, skin and image fallback support.
- Home deck carousel, stronger play action, Quick Hub, daily/media disclosure,
  accessible popover positioning and focus restoration.
- Auto matchmaking is opt-in. Milestone, offline reward and installation panels
  open from user actions instead of a mandatory popup queue. The season notice
  waits for the primary tutorial to finish. Reward eligibility/storage remain
  in their existing services; closing a panel does not claim a reward.
- Deck power summary, expandable presets and advanced filters, larger swipeable
  active-deck cards and removal of redundant miniature stat overlays.
- Shop balance, pack portraits, price-first actions, quantity controls and a
  readable fixed summon dock. Floating chat/rank controls clear this dock.
- Game hub filters, game list, lobby and main board presentation.
- Fullscreen mobile battle score strip, central board, bottom skill dock,
  landscape layout, hand selection, usable slot feedback and short captures.
- Shared combo, skill and flip feedback; low-spec and OS reduced-motion guards.
- Theme-aware, flat contextual guides with scroll containment and 44px controls.
- Technical WebMCP status is restricted to simulation/internal screens, without
  disabling the registered tools.

No new localStorage keys were introduced. Inventory, decks, currency, AI rules,
capture evaluation, skill effects and reward amounts were not redesigned.
Existing artwork was retained; this is not a new illustration/asset pipeline.

## Verification

- `npx tsc --noEmit`: passed.
- `npm run build`: passed, with existing large-chunk warnings.
- `npm run lint`: exits successfully but is a no-op in this repository; it is
  not evidence of a real lint/type check.
- `git diff --check`: passed.
- Integrated Chromium checks: home, deck, shop, game hub and card battle across
  390x844, 320x568 and 1440x1000 layouts; light, dark and metal themes; KO/EN.
- All 25 final screen/layout combinations rendered without document horizontal
  overflow, untranslated new keys or uncaught JavaScript exceptions.
- Earlier mobile battle component checks covered nine viewports, including
  320x480, 480x320 and 568x280; normal/low-spec/reduced-motion battles completed
  with shield placement and the existing win callback.
- Integrated manual card selection/placement and opponent turn were checked on
  mobile and desktop. Quick Hub keyboard/viewport behavior was also checked.

Screenshots and browser harnesses are in the approved temporary directory:
`/var/folders/2k/rj7_qk_d7fxgqzt6gvh7xbfw0000gn/T/opencode/`.
Final screenshot names follow `redesign-{layout}-{view}.png`.

## Boundaries And Remaining Risks

- This pass changes shared presentation across the app and directly redesigns
  the main acquisition/play loop. It does not individually redesign or visually
  certify all 110 minigames, every media reader, trade screen or legacy dialog.
- Physical-device Safari, paid transactions, every battle ability and exhaustive
  persistence regression coverage were not run.
- Earlier direct `/card-play` navigation returned 404 without service-worker
  fallback. Query entry and in-app navigation worked. Hosting SPA fallback is
  a separate deployment concern.
- External Mixkit battle audio returned 403 in some checks.
- Existing bundle size, legacy bilingual-copy inconsistencies and some secondary
  controls remain follow-up work. No remote deployment or push was performed.
