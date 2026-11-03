## 2026-11-02T11:00:22Z
You are `explorer_m3_it2_1`, M3-It2 Element Normalization Explorer.
Working directory: `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m3_it2_1/`
Parent Conversation ID: `21826d14-7bc9-4995-866c-cbb42a941789`

Mandatory Pre-Work Reading:
1. `/Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md` (Mandatory verbatim reading)
2. `/Users/dayyoung/project/snshero/PROJECT.md`
3. `/Users/dayyoung/project/snshero/.agents/teamwork/challenger_m3_9_2/handoff.md` (Contains exact defect details and test reproduction)

Your Task:
Investigate the element filter chip bug in `src/landing/views/PlaySection.tsx:902`:
- In `CARD_DATABASE`, cards 21..30 have `element: 'air'`.
- When filtering by `[바람 (Wind)]` (`key: 'wind'`), `el === selectedElement` tests `'air' === 'wind'` which evaluates to `false`.
- Design the exact drop-in fix in `PlaySection.tsx:902`:
  ```ts
  const normalizedEl = el === 'air' ? 'wind' : el;
  const elMatch = selectedElement === 'all' || normalizedEl === selectedElement;
  ```
- Write structured handoff report in `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m3_it2_1/handoff.md` and send message back to parent.
