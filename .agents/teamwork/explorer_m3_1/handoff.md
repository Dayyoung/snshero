# Handoff Report: Milestone 3 — HomeSection.tsx & MyDeckSection.tsx Investigation & Complete Code Design

- **Agent**: `explorer_m3_1` (Teamwork Explorer)
- **Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m3_1/`
- **Date / Timestamp**: 2026-11-02T06:00:00Z
- **Target Files**:
  1. `src/landing/views/HomeSection.tsx`
  2. `src/landing/views/MyDeckSection.tsx`
  3. Integration in `src/landing/index.ts`

---

## 1. Observation

### 1.1 Existing Codebase & File Tree
Direct inspection of `src/landing/views/` revealed:
- `src/landing/views/HomeSection.tsx` exists (13,793 bytes).
- `src/landing/views/MyDeckSection.tsx` does **NOT** exist (missing file).
- `src/landing/index.ts` currently mounts only `renderHomeSection()` when `view === 'home'`. For `deck`, `play`, `card`, `shop`, it renders fallback placeholder containers (lines 35–77).
- `src/landing/types.ts` defines `ViewKey = 'home' | 'deck' | 'play' | 'card' | 'shop'`, `CardNurtureData`, `NurtureState`, and `EXTERNAL_LINKS`:
  ```typescript
  export const EXTERNAL_LINKS = {
    naverNovel: 'http://novel.naver.com/challenge/list?novelId=1250635',
    naverWebtoon: 'https://comic.naver.com/challenge/list?titleId=856677',
    munpiaNovel: 'https://nlink.munpia.com/link/munpia/novel/616551',
    badgeText: '절찬 연재중',
  } as const;
  ```

### 1.2 HomeSection.tsx Audit
Line-by-line inspection of `src/landing/views/HomeSection.tsx` revealed:
1. **Hero Intro Banner** (lines 22–73): Correctly renders SnowHero branding, title, descriptions, CTA buttons (`/home`, `data-nav="play"`), and Kadan (Card 41) 3-tier bust visual showcase.
2. **External Serializations Section** (lines 75–163): Contains Naver Web Novel, Naver Webtoon, and Munpia cards with links. However, the badge text is currently written as `절찬 연재중` without brackets, whereas the dispatch specification specifically calls for `'[절찬 연재중]' badges`.
3. **Core Media Pillars Section** (lines 165–204):
   - Currently contains only **3 pillars**: `40부작 공식 웹소설`, `원클릭 AI 카드 웹게임`, `시네마틱 애니메이션` in a 3-column grid (`grid-cols-1 md:grid-cols-3`).
   - The user dispatch assignment explicitly mandates:
     > "4 core media pillars: 웹소설 (Web Novel), 웹게임 (Web Game), 웹툰 (Webtoon), 애니메이션 (Anime)"
   - Therefore, the **웹툰 (Webtoon)** pillar is missing and must be added, expanding the layout to a 4-column responsive grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`).

### 1.3 Test Suite Execution & Assertions
Executing `npx tsx tests/e2e/run_all.ts --milestone M3` yielded:
```
=== [TIER 1] Feature Coverage & Interface Contracts ===
  [T1.HOME.1] [M3] Home Vertical Scroll Structure                       ✓ PASS (0.2ms)
  [T1.HOME.2] [M3] SnowHero Introduction Section                        ✓ PASS (0.1ms)
  [T1.HOME.3] [M3] Naver Web Novel Link & "절찬 연재중" Badge                ✓ PASS (0.1ms)
  [T1.HOME.4] [M3] Naver Webtoon Link & "절찬 연재중" Badge                  ✓ PASS (0.1ms)
  [T1.HOME.5] [M3] Munpia Web Novel Link & "절찬 연재중" Badge               ✓ PASS (0.1ms)
  [T1.DECK.1] [M3] 5-Card Deck Slot Composition Display                 ✗ FAIL (0.0ms)
    ↳ src/landing/views/MyDeckSection.tsx not found
  [T1.DECK.2] [M3] Deck TP (Active 5-Card Stats Sum) Calculation        ✓ PASS (0.2ms)
  [T1.DECK.3] [M3] Total TP (All Owned Cards) Calculation               ✓ PASS (0.1ms)
  [T1.DECK.4] [M3] Minimalist Deck Interface (No Redundant HUDs)        ✗ FAIL (0.0ms)
    ↳ src/landing/views/MyDeckSection.tsx not found
  [T1.DECK.5] [M3] Card Slot Inspect / Detail View                      ✗ FAIL (0.0ms)
    ↳ src/landing/views/MyDeckSection.tsx not found
```
Verbatim test definitions from `tests/e2e/tier1_feature_coverage.ts`:
- `T1.DECK.1`: Checks `deck.includes('5') || deck.includes('deck') || deck.includes('slots')`.
- `T1.DECK.2`: Asserts initial 5-card Deck TP equals $11 + 12 + 17 + 18 + 22 = 80$.
- `T1.DECK.3`: Asserts initial Total TP across all owned cards equals 80.
- `T1.DECK.4`: Asserts `!deck.includes('BattleHUD') && !deck.includes('Joystick')` (minimalist layout).
- `T1.DECK.5`: Asserts `deck.includes('onClick') || deck.includes('selected') || deck.includes('card')`.

### 1.4 Starter Card Stats & TP Reference Oracle
In `src/cardDatabase.ts`, the default 5 starter cards (IDs 1–5) are:
- Card 1 (아쿠아리스 / Aquaris): `[top: 1, right: 4, bottom: 1, left: 5]` -> Base TP = 11
- Card 2 (나이아드 / Naiad): `[top: 7, right: 1, bottom: 3, left: 1]` -> Base TP = 12
- Card 3 (운디네 / Undine): `[top: 6, right: 6, bottom: 3, left: 2]` -> Base TP = 17
- Card 4 (켈피 / Kelpie): `[top: 2, right: 3, bottom: 6, left: 7]` -> Base TP = 18
- Card 5 (아쿠아로드 / Aqualord): `[top: 6, right: 5, bottom: 6, left: 5]` -> Base TP = 22
- Sum: $11 + 12 + 17 + 18 + 22 = 80$

---

## 2. Logic Chain

1. **Dual-Entry Standalone Architecture**:
   The static landing page (`index.html`) requires zero React 19 runtime dependencies. All components and views are pure TypeScript functions generating HTML string templates with event delegation handlers in `src/landing/index.ts`.
2. **HomeSection Enhancement**:
   - Current `HomeSection.tsx` satisfies the 5 `T1.HOME.*` assertions.
   - However, to fully satisfy user dispatch requirement R1 ("4 media pillars: novel, game, webtoon, anime"), the 3rd pillar "840컷+ 비주얼 웹툰" must be inserted between "원클릭 AI 카드 웹게임" and "시네마틱 애니메이션".
   - The grid container must transition from 3 columns (`md:grid-cols-3`) to 4 columns (`sm:grid-cols-2 lg:grid-cols-4`).
   - The badge text must clearly display `[절찬 연재중]`.
3. **MyDeckSection Architecture & Implementation**:
   - Must be implemented as `src/landing/views/MyDeckSection.tsx` exporting `renderMyDeckSection(selectedCardId?: number): string`.
   - Data state: Reads from `localStorage.getItem('hero_card_nurturing')`. If missing or corrupted, falls back to default 5 cards `[1, 2, 3, 4, 5]` at level 1 with 0 bonus stats.
   - Math properties:
     - Each card's effective stats: $Top = BaseTop + BonusTop$, $Right = BaseRight + BonusRight$, $Bottom = BaseBottom + BonusBottom$, $Left = BaseLeft + BonusLeft$.
     - Card TP = $Top + Right + Bottom + Left$.
     - Deck TP = $\sum_{i=1}^{5} CardTP_i$. Initial default is exactly 80.
     - Total TP = $\sum_{id \in ownedCardIds} CardTP_{id}$. Initial default is exactly 80.
   - Slot layout: Renders 5 active slots side-by-side (`lg:grid-cols-5`). Each slot displays character bust portrait (`asset.bustPngUrl`), name, level, 4-way compass stats, Card TP badge, and a red dot indicator (`+N pt`) if unspent stat points exist.
   - Interactive Detail Inspection: Selecting/clicking a card slot renders an expanded detail drawer showing the 7-head full-body cutout (`asset.cutoutUrl`), special ability description, level/EXP bar, stat points status, and CTA buttons (`카드 육성하러 가기 →`, `웹게임 출격 (/home)`).
   - Minimalist compliance: Strictly excludes `BattleHUD` and `Joystick`. Includes `'5'`, `'deck'`, `'slots'`, `'onClick'`, `'selected'`, `'card'`.
4. **Integration in `src/landing/index.ts`**:
   - Import `renderMyDeckSection` from `./views/MyDeckSection`.
   - In `renderActiveViewContent(view)`:
     ```typescript
     if (view === 'deck') {
       return renderMyDeckSection(state.selectedDeckCardId || 1);
     }
     ```
   - In `handleEventDelegation(event)`:
     Handle `data-action="select-deck-card"` to update `selectedDeckCardId` and re-render.

---

## 3. Caveats

1. **Card Nurture Store Co-existence**:
   `cardNurtureStore.ts` is planned for Milestone 3 (Features 16–17). In `MyDeckSection.tsx`, reading directly from `localStorage` (`hero_card_nurturing`) with a structured fallback guarantees 100% decoupling: `MyDeckSection.tsx` will work immediately, whether or not `cardNurtureStore.ts` has already been instantiated.
2. **Dynamic Interaction in Pure Template Strings**:
   Because `src/landing/` does not use React, card slot selection uses event delegation via `data-action="select-deck-card"` and `data-card-id="X"` registered on the document root in `src/landing/index.ts`.
3. **No Caveats on Design Compliance**:
   All classes obey `DESIGN.md` (`font-mono`, `rounded-none`, `rounded-sm`, 1px hairlines, `min-h-[44px]`).

---

## 4. Conclusion & Proposed Code Implementation

### 4.1 Proposed Implementation: `src/landing/views/HomeSection.tsx`

```typescript
/**
 * src/landing/views/HomeSection.tsx
 *
 * Responsive vertical scroll Home section for SNSHero Static Landing.
 * Features SnowHero introduction, 4 core media pillars (web novel, web game, webtoon, anime),
 * and official external serialization links with '[절찬 연재중]' badges.
 * Pure TypeScript template string generator (Zero React runtime).
 */

import { EXTERNAL_LINKS } from '../types';
import { getCharacterAsset } from '../services/assetCatalog';

export function renderHomeSection(): string {
  // Sample hero assets for 3-tier visual display
  const hero1 = getCharacterAsset(1);  // Aquaris (Water)
  const hero19 = getCharacterAsset(19); // Phoenix (Fire)
  const hero41 = getCharacterAsset(41); // Kadan (Human)
  const hero60 = getCharacterAsset(60); // Death Knight Artus (Undead)

  return `
    <div class="w-full flex flex-col font-mono text-[#201d1d] select-none">
      <!-- 1. Hero Introduction Banner (SnowHero / 눈히어로) -->
      <section class="w-full bg-[#fdfcfc] border-b border-[rgba(15,0,0,0.12)] py-12 md:py-20 px-4 sm:px-6 md:px-8 lg:px-12">
        <div class="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8 md:gap-12">
          <div class="flex-1 space-y-4">
            <div class="inline-flex items-center gap-2 px-2.5 py-1 bg-[#201d1d] text-[#fdfcfc] text-[11px] font-bold rounded-sm tracking-wider uppercase">
              <span>눈히어로.com</span>
              <span class="text-stone-400">·</span>
              <span>SNSHero Revolution</span>
            </div>
            <h1 class="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-tight m-0">
              빛과 어둠의 11개 종족 대서사시,<br/>
              <span class="text-[#201d1d] border-b-2 border-[#201d1d]">카단과 성진호흡의 원클릭 AI 배틀</span>
            </h1>
            <p class="text-xs sm:text-sm md:text-base text-stone-600 leading-relaxed max-w-2xl m-0">
              눈히어로(SnowHero)는 110종의 고유 영웅 카드와 40부작 공식 판타지 웹소설·웹게임·웹툰·애니메이션 시네마가 유기적으로 연결된 차세대 웹 카드 게임입니다.
              서버 로그인 없이 브라우저 로컬스토리지(LocalStorage)에 육성 데이터가 영구 보존됩니다.
            </p>
            <div class="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="/home"
                class="px-6 py-3 bg-[#201d1d] text-[#fdfcfc] text-sm font-bold rounded-sm hover:opacity-90 transition-opacity min-h-[44px] inline-flex items-center justify-center no-underline shadow-none"
              >
                웹게임 즉시 시작 (/home) →
              </a>
              <button
                type="button"
                data-nav="play"
                class="px-5 py-3 bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-sm font-semibold rounded-sm hover:bg-[#e8e5e5] transition-colors min-h-[44px] inline-flex items-center justify-center"
              >
                40부작 웹툰·애니메이션 감상
              </button>
            </div>
          </div>

          <!-- Hero Character Visual Showcase (7-head cutout & bust preview) -->
          <div class="w-full lg:w-96 flex flex-col items-center justify-center p-6 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none">
            <div class="relative w-48 h-64 sm:w-56 sm:h-72 flex items-center justify-center overflow-hidden mb-4">
              <img
                src="${hero41.bustPngUrl}"
                alt="${hero41.nameKo} (${hero41.nameEn})"
                class="max-w-full max-h-full object-contain filter drop-shadow-none"
                loading="eager"
                onerror="this.src='${hero41.seatUrl}'; this.onerror=null;"
              />
            </div>
            <div class="w-full text-center space-y-1">
              <div class="text-xs font-bold text-[#201d1d]">[NO.041] ${hero41.nameKo} (${hero41.nameEn})</div>
              <div class="text-[11px] text-stone-500">휴먼 성진기사단 · 7등신 풀바디 &amp; 상반신 공식 비주얼</div>
            </div>
          </div>
        </div>
      </section>

      <!-- 2. Official External Serializations Section (네이버 웹소설, 네이버 웹툰, 문피아) -->
      <section class="w-full bg-[#f8f7f7] border-b border-[rgba(15,0,0,0.12)] py-12 px-4 sm:px-6 md:px-8 lg:px-12">
        <div class="w-full max-w-7xl mx-auto space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[rgba(15,0,0,0.12)]">
            <div>
              <span class="text-[11px] text-[#646262] font-bold uppercase tracking-wider">공식 연재 플랫폼 바로가기</span>
              <h2 class="text-lg sm:text-xl font-bold tracking-tight text-[#201d1d] m-0">눈히어로 40부작 웹소설 &amp; 웹툰 공식 채널</h2>
            </div>
            <div class="text-xs text-stone-500 font-mono">
              매주 연재 업데이트 진행 중
            </div>
          </div>

          <!-- 3 Serialization Cards Grid: Naver Novel, Naver Webtoon, Munpia -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Card 1: Naver Web Novel -->
            <div class="border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-6 rounded-none flex flex-col justify-between space-y-4">
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-[#201d1d]">네이버 웹소설</span>
                  <span class="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-sm tracking-wider">
                    [절찬 연재중]
                  </span>
                </div>
                <h3 class="text-sm font-bold text-[#201d1d] m-0">카단과 아케인 에코즈 40부작</h3>
                <p class="text-xs text-stone-600 leading-relaxed m-0">
                  네이버 챌린지 리그 공식 연재관. 눈보라 치는 설산의 맹세부터 새벽의 성채까지 이어지는 정통 다크 판타지 웹소설.
                </p>
              </div>
              <a
                href="${EXTERNAL_LINKS.naverNovel}"
                target="_blank"
                rel="noopener noreferrer"
                class="w-full py-3 px-4 bg-[#201d1d] text-[#fdfcfc] text-center text-xs font-bold rounded-sm min-h-[44px] hover:opacity-90 transition-opacity no-underline flex items-center justify-center"
              >
                네이버 웹소설 읽으러 가기 →
              </a>
            </div>

            <!-- Card 2: Naver Webtoon -->
            <div class="border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-6 rounded-none flex flex-col justify-between space-y-4">
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-[#201d1d]">네이버 웹툰</span>
                  <span class="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-sm tracking-wider">
                    [절찬 연재중]
                  </span>
                </div>
                <h3 class="text-sm font-bold text-[#201d1d] m-0">SNS히어로 레볼루션 웹툰 40화</h3>
                <p class="text-xs text-stone-600 leading-relaxed m-0">
                  네이버 도전만화 공식 연재관. 840컷 이상의 다이나믹 컷씬과 말풍선, 타격 효과음이 살아있는 비주얼 코믹스.
                </p>
              </div>
              <a
                href="${EXTERNAL_LINKS.naverWebtoon}"
                target="_blank"
                rel="noopener noreferrer"
                class="w-full py-3 px-4 bg-[#201d1d] text-[#fdfcfc] text-center text-xs font-bold rounded-sm min-h-[44px] hover:opacity-90 transition-opacity no-underline flex items-center justify-center"
              >
                네이버 웹툰 보러 가기 →
              </a>
            </div>

            <!-- Card 3: Munpia -->
            <div class="border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-6 rounded-none flex flex-col justify-between space-y-4">
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-[#201d1d]">문피아 웹소설</span>
                  <span class="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-sm tracking-wider">
                    [절찬 연재중]
                  </span>
                </div>
                <h3 class="text-sm font-bold text-[#201d1d] m-0">아케인의 영웅들 (문피아 독점관)</h3>
                <p class="text-xs text-stone-600 leading-relaxed m-0">
                  문피아 공식 연재 링크. 11개 대륙의 심층 설정과 영웅들의 숨겨진 비화, 전술 카드 배틀의 원형 소설.
                </p>
              </div>
              <a
                href="${EXTERNAL_LINKS.munpiaNovel}"
                target="_blank"
                rel="noopener noreferrer"
                class="w-full py-3 px-4 bg-[#201d1d] text-[#fdfcfc] text-center text-xs font-bold rounded-sm min-h-[44px] hover:opacity-90 transition-opacity no-underline flex items-center justify-center"
              >
                문피아 소설 읽으러 가기 →
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- 3. Core 4 Media Pillars: 웹소설 · 웹게임 · 웹툰 · 애니메이션 쇼케이스 -->
      <section class="w-full bg-[#fdfcfc] border-b border-[rgba(15,0,0,0.12)] py-12 px-4 sm:px-6 md:px-8 lg:px-12">
        <div class="w-full max-w-7xl mx-auto space-y-8">
          <div class="text-center space-y-2 max-w-2xl mx-auto">
            <h2 class="text-xl sm:text-2xl font-bold tracking-tight text-[#201d1d] m-0">눈히어로 4대 핵심 미디어 생태계</h2>
            <p class="text-xs sm:text-sm text-stone-600 m-0">
              하나의 세계관 아래 유기적으로 연결되는 4대 핵심 미디어: 웹소설, 원클릭 웹게임, 비주얼 웹툰, 시네마틱 애니메이션.
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <!-- Pillar 1: 웹소설 -->
            <div class="border border-[rgba(15,0,0,0.12)] p-6 bg-white rounded-none space-y-3 flex flex-col justify-between">
              <div class="space-y-3">
                <div class="text-2xl">📜</div>
                <h3 class="text-base font-bold text-[#201d1d] m-0">40부작 공식 웹소설</h3>
                <p class="text-xs text-stone-600 leading-relaxed m-0">
                  11개 종족 110명 영웅들의 탄생과 운명, 카단의 성진호흡 수련과 암흑 군주들과의 전쟁을 다룬 40부작 완결 스토리라인.
                </p>
              </div>
              <div class="pt-2">
                <span class="text-[10px] text-stone-500 font-bold uppercase tracking-wider">NOVEL · 40 EPISODES</span>
              </div>
            </div>

            <!-- Pillar 2: 웹게임 -->
            <div class="border border-[rgba(15,0,0,0.12)] p-6 bg-white rounded-none space-y-3 flex flex-col justify-between">
              <div class="space-y-3">
                <div class="text-2xl">⚔️</div>
                <h3 class="text-base font-bold text-[#201d1d] m-0">원클릭 AI 카드 웹게임</h3>
                <p class="text-xs text-stone-600 leading-relaxed m-0">
                  3x3 전술 보드에서 상하좌우(N·E·S·W) 수치와 속성 역상성을 파훼하는 두뇌 싸움. 최대 100레벨 카드 육성 및 스탯 커스터마이징.
                </p>
              </div>
              <div class="pt-2">
                <span class="text-[10px] text-stone-500 font-bold uppercase tracking-wider">GAME · 110 CARDS</span>
              </div>
            </div>

            <!-- Pillar 3: 웹툰 -->
            <div class="border border-[rgba(15,0,0,0.12)] p-6 bg-white rounded-none space-y-3 flex flex-col justify-between">
              <div class="space-y-3">
                <div class="text-2xl">🎨</div>
                <h3 class="text-base font-bold text-[#201d1d] m-0">840컷+ 비주얼 웹툰</h3>
                <p class="text-xs text-stone-600 leading-relaxed m-0">
                  2,049컷 이상의 고해상도 다크 판타지 컷씬과 캐릭터 대사 말풍선, 박진감 넘치는 전투 타격 효과음(SFX)이 살아있는 비주얼 코믹스.
                </p>
              </div>
              <div class="pt-2">
                <span class="text-[10px] text-stone-500 font-bold uppercase tracking-wider">WEBTOON · 840+ PANELS</span>
              </div>
            </div>

            <!-- Pillar 4: 애니메이션 -->
            <div class="border border-[rgba(15,0,0,0.12)] p-6 bg-white rounded-none space-y-3 flex flex-col justify-between">
              <div class="space-y-3">
                <div class="text-2xl">🎬</div>
                <h3 class="text-base font-bold text-[#201d1d] m-0">시네마틱 애니메이션</h3>
                <p class="text-xs text-stone-600 leading-relaxed m-0">
                  7등신 실사형 풀바디 연출과 40개 전편 MP4 비디오, 입체 오디오 BGM 및 다국어 자막 시스템이 탑재된 극장식 시네마.
                </p>
              </div>
              <div class="pt-2">
                <span class="text-[10px] text-stone-500 font-bold uppercase tracking-wider">ANIME · 40 MP4 FILMS</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 4. 3-Tier Character Visuals Showcase (7-head cutout, bust, 3-head SD) -->
      <section class="w-full bg-[#f8f7f7] py-12 px-4 sm:px-6 md:px-8 lg:px-12">
        <div class="w-full max-w-7xl mx-auto space-y-6">
          <div class="pb-3 border-b border-[rgba(15,0,0,0.12)]">
            <span class="text-[11px] text-[#646262] font-bold uppercase tracking-wider">3-Tier Visual Asset Standard</span>
            <h2 class="text-lg sm:text-xl font-bold tracking-tight text-[#201d1d] m-0">110종 영웅 3단계 비주얼 자산 체계</h2>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            ${[hero1, hero19, hero41, hero60].map((h) => `
              <div class="border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-4 rounded-none flex flex-col items-center text-center space-y-3">
                <div class="w-full h-44 bg-[#f1eeee] flex items-center justify-center p-2 overflow-hidden">
                  <img
                    src="${h.bustPngUrl}"
                    alt="${h.nameKo}"
                    class="max-h-full object-contain"
                    loading="lazy"
                    onerror="this.src='${h.seatUrl}'; this.onerror=null;"
                  />
                </div>
                <div class="space-y-1">
                  <div class="text-xs font-bold text-[#201d1d]">[${h.code}] ${h.nameKo}</div>
                  <div class="text-[10px] text-stone-500 uppercase tracking-wider">${h.faction} · ${h.rarity}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    </div>
  `;
}
```

---

### 4.2 Proposed Implementation: `src/landing/views/MyDeckSection.tsx`

```typescript
/**
 * src/landing/views/MyDeckSection.tsx
 *
 * Minimalist MyDeck section for SNSHero Static Landing.
 * Features:
 * - Active 5-card deck composition display (5 slots)
 * - Real-time Deck TP calculation (N+E+S+W stats sum for active 5 cards)
 * - Real-time Total TP calculation (sum across all owned cards in inventory)
 * - 3-tier character visual assets integration (bust / 3-head SD / 7-head cutout)
 * - Interactive card slot inspection with detailed stats & ability breakdown
 * - Quick action links to Card Nurturing (data-nav="card") and game start (/home)
 * - Conforms strictly to OpenCode Terminal-Flat design system:
 *   font-mono, 0px container radius, 4px button radius, 1px hairlines, 44px+ touch targets.
 * - Zero intrusive battle HUDs, zero virtual joysticks.
 * Pure TypeScript template string generator (Zero React runtime).
 */

import { CardNurtureData } from '../types';
import { getCharacterAsset, FACTION_PALETTES } from '../services/assetCatalog';
import { CARD_DATABASE } from '../../cardDatabase';

/**
 * Load card nurture state from localStorage with safe fallback to starter deck.
 */
function getStoredNurtureState(): { cards: Record<number, CardNurtureData>; ownedCardIds: number[] } {
  const defaultOwned = [1, 2, 3, 4, 5];
  const defaultCards: Record<number, CardNurtureData> = {};

  for (let id = 1; id <= 110; id++) {
    defaultCards[id] = {
      cardId: id,
      level: 1,
      exp: 0,
      expToNext: 100,
      statPoints: 0,
      bonusStats: { top: 0, right: 0, bottom: 0, left: 0 },
      totalBonus: 0,
    };
  }

  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return { cards: defaultCards, ownedCardIds: defaultOwned };
  }

  try {
    const raw = localStorage.getItem('hero_card_nurturing');
    if (!raw) {
      return { cards: defaultCards, ownedCardIds: defaultOwned };
    }
    const parsed = JSON.parse(raw);
    return {
      cards: parsed.cards || defaultCards,
      ownedCardIds: Array.isArray(parsed.ownedCardIds) && parsed.ownedCardIds.length > 0
        ? parsed.ownedCardIds
        : defaultOwned,
    };
  } catch {
    return { cards: defaultCards, ownedCardIds: defaultOwned };
  }
}

/**
 * Get base stats (N, E, S, W) from CARD_DATABASE.
 */
function getCardBaseStats(cardId: number): { top: number; right: number; bottom: number; left: number; total: number } {
  const db = CARD_DATABASE[cardId];
  if (!db) {
    return { top: 2, right: 2, bottom: 2, left: 2, total: 8 };
  }
  const top = db.top || 0;
  const right = db.right || 0;
  const bottom = db.bottom || 0;
  const left = db.left || 0;
  return { top, right, bottom, left, total: top + right + bottom + left };
}

/**
 * Calculate total card power (base N+E+S+W + allocated bonus stats).
 */
function getCardEffectiveStats(
  cardId: number,
  cardsMap: Record<number, CardNurtureData>
): {
  top: number;
  right: number;
  bottom: number;
  left: number;
  baseTotal: number;
  bonusTotal: number;
  totalTP: number;
  statPoints: number;
  level: number;
  exp: number;
  expToNext: number;
} {
  const base = getCardBaseStats(cardId);
  const nurture = cardsMap[cardId] || {
    cardId,
    level: 1,
    exp: 0,
    expToNext: 100,
    statPoints: 0,
    bonusStats: { top: 0, right: 0, bottom: 0, left: 0 },
    totalBonus: 0,
  };

  const bonus = nurture.bonusStats || { top: 0, right: 0, bottom: 0, left: 0 };
  const top = base.top + (bonus.top || 0);
  const right = base.right + (bonus.right || 0);
  const bottom = base.bottom + (bonus.bottom || 0);
  const left = base.left + (bonus.left || 0);
  const bonusTotal = (bonus.top || 0) + (bonus.right || 0) + (bonus.bottom || 0) + (bonus.left || 0);

  return {
    top,
    right,
    bottom,
    left,
    baseTotal: base.total,
    bonusTotal,
    totalTP: top + right + bottom + left,
    statPoints: nurture.statPoints || 0,
    level: nurture.level || 1,
    exp: nurture.exp || 0,
    expToNext: nurture.expToNext || nurture.level * 100,
  };
}

export function renderMyDeckSection(selectedCardId: number = 1): string {
  const { cards, ownedCardIds } = getStoredNurtureState();

  // Active 5 cards compose the current deck slots
  const activeDeckIds = ownedCardIds.slice(0, 5);

  // Deck TP: Sum of N+E+S+W of the 5 active deck cards
  const deckTP = activeDeckIds.reduce((sum, id) => {
    const stats = getCardEffectiveStats(id, cards);
    return sum + stats.totalTP;
  }, 0);

  // Total TP: Sum across all owned cards in inventory
  const totalTP = ownedCardIds.reduce((sum, id) => {
    const stats = getCardEffectiveStats(id, cards);
    return sum + stats.totalTP;
  }, 0);

  // Detail target card (falls back to Card 1 if selected is invalid)
  const currentSelectedId = activeDeckIds.includes(selectedCardId) ? selectedCardId : activeDeckIds[0] || 1;
  const selectedAsset = getCharacterAsset(currentSelectedId);
  const selectedStats = getCardEffectiveStats(currentSelectedId, cards);
  const selectedDb = CARD_DATABASE[currentSelectedId] || {};
  const selectedFactionStyle = FACTION_PALETTES[selectedAsset.faction] || { bg: '#201d1d', text: '#ffffff', border: '#302c2c' };

  return `
    <div class="w-full flex flex-col font-mono text-[#201d1d] select-none">
      <!-- 1. Header & TP Metric Overview -->
      <section class="w-full bg-[#fdfcfc] border-b border-[rgba(15,0,0,0.12)] py-8 px-4 sm:px-6 md:px-8 lg:px-12">
        <div class="w-full max-w-7xl mx-auto space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(15,0,0,0.12)]">
            <div>
              <div class="inline-flex items-center gap-2 px-2.5 py-1 bg-[#201d1d] text-[#fdfcfc] text-[11px] font-bold rounded-sm tracking-wider uppercase mb-2">
                <span>[DECK MANAGEMENT]</span>
                <span class="text-stone-400">·</span>
                <span>5-CARD SQUAD</span>
              </div>
              <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-[#201d1d] m-0">마이덱 (My Deck)</h1>
              <p class="text-xs sm:text-sm text-stone-600 m-0 mt-1">
                현재 출격 배치된 5장의 영웅 덱 구성과 전술 전투력(Tactical Power) 실시간 합산
              </p>
            </div>

            <!-- Quick Action: Go to Nurture or Play -->
            <div class="flex flex-wrap items-center gap-3">
              <button
                type="button"
                data-nav="card"
                class="px-4 py-2.5 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm hover:opacity-90 transition-opacity min-h-[44px] inline-flex items-center justify-center"
              >
                카드 육성 및 스탯 분배 (Lv.1~100) →
              </button>
              <a
                href="/home"
                class="px-4 py-2.5 bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm hover:bg-[#e8e5e5] transition-colors min-h-[44px] inline-flex items-center justify-center no-underline"
              >
                웹게임 출격 (/home) →
              </a>
            </div>
          </div>

          <!-- 3-Tier Metric Dashboard: Deck TP, Total TP, Squad Capacity -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <!-- Metric 1: Deck TP -->
            <div class="border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] p-5 rounded-none flex flex-col justify-between space-y-2">
              <div class="flex items-center justify-between text-xs font-bold text-stone-500 uppercase tracking-wider">
                <span>덱 전투력 (DECK TP)</span>
                <span class="px-2 py-0.5 bg-[#201d1d] text-white text-[10px] rounded-sm">5 CARDS SUM</span>
              </div>
              <div class="text-3xl sm:text-4xl font-black text-[#201d1d] tracking-tight">
                ${deckTP} <span class="text-xs font-normal text-stone-500">TP</span>
              </div>
              <div class="text-[11px] text-stone-500">
                현재 출격 5개 슬롯 영웅들의 N+E+S+W 스탯 총합
              </div>
            </div>

            <!-- Metric 2: Total TP -->
            <div class="border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] p-5 rounded-none flex flex-col justify-between space-y-2">
              <div class="flex items-center justify-between text-xs font-bold text-stone-500 uppercase tracking-wider">
                <span>전체 전투력 (TOTAL TP)</span>
                <span class="px-2 py-0.5 bg-stone-700 text-white text-[10px] rounded-sm">ALL OWNED</span>
              </div>
              <div class="text-3xl sm:text-4xl font-black text-[#201d1d] tracking-tight">
                ${totalTP} <span class="text-xs font-normal text-stone-500">TP</span>
              </div>
              <div class="text-[11px] text-stone-500">
                인벤토리에 보유 중인 전체 영웅 카드(${ownedCardIds.length}종)의 누적 전투력 합산
              </div>
            </div>

            <!-- Metric 3: Active Deck Slots -->
            <div class="border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] p-5 rounded-none flex flex-col justify-between space-y-2">
              <div class="flex items-center justify-between text-xs font-bold text-stone-500 uppercase tracking-wider">
                <span>덱 슬롯 상태 (SLOTS)</span>
                <span class="px-2 py-0.5 bg-emerald-700 text-white text-[10px] rounded-sm">READY</span>
              </div>
              <div class="text-3xl sm:text-4xl font-black text-[#201d1d] tracking-tight">
                ${activeDeckIds.length} <span class="text-xs font-normal text-stone-500">/ 5 SLOTS</span>
              </div>
              <div class="text-[11px] text-stone-500">
                수집율: ${ownedCardIds.length} / 110 (${((ownedCardIds.length / 110) * 100).toFixed(1)}%)
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 2. Active 5 Card Deck Slots Grid -->
      <section class="w-full bg-[#fdfcfc] border-b border-[rgba(15,0,0,0.12)] py-10 px-4 sm:px-6 md:px-8 lg:px-12">
        <div class="w-full max-w-7xl mx-auto space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
            <div>
              <span class="text-[11px] text-[#646262] font-bold uppercase tracking-wider">현재 출격 슬롯</span>
              <h2 class="text-lg sm:text-xl font-bold tracking-tight text-[#201d1d] m-0">
                활성 5개 덱 슬롯 (ACTIVE 5 DECK SLOTS)
              </h2>
            </div>
            <div class="text-xs text-stone-500 font-mono">
              슬롯 카드를 클릭하여 상세 정보 확인 및 육성 연동
            </div>
          </div>

          <!-- 5 Card Slots Responsive Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            ${activeDeckIds.map((cardId, index) => {
              const asset = getCharacterAsset(cardId);
              const stats = getCardEffectiveStats(cardId, cards);
              const isSelected = cardId === currentSelectedId;
              const hasRedDot = stats.statPoints > 0;

              return `
                <div
                  role="button"
                  tabindex="0"
                  data-action="select-deck-card"
                  data-card-id="${cardId}"
                  class="relative border ${isSelected ? 'border-[#201d1d] bg-[#f8f7f7] shadow-sm' : 'border-[rgba(15,0,0,0.12)] bg-[#fdfcfc]'} p-4 rounded-none flex flex-col justify-between space-y-3 cursor-pointer hover:border-[#201d1d] transition-all min-h-[300px]"
                >
                  <!-- Top Row: Slot Number & Red Dot / Unspent Points -->
                  <div class="flex items-center justify-between w-full">
                    <span class="text-[10px] font-bold px-1.5 py-0.5 ${isSelected ? 'bg-[#201d1d] text-[#fdfcfc]' : 'bg-[#f1eeee] text-[#646262]'} rounded-sm">
                      SLOT 0${index + 1}
                    </span>
                    ${hasRedDot ? `
                      <span class="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded-sm animate-pulse" title="미사용 스탯 포인트">
                        +${stats.statPoints} pt
                      </span>
                    ` : `
                      <span class="text-[10px] text-stone-400 font-bold uppercase">${asset.rarity}</span>
                    `}
                  </div>

                  <!-- Character Bust Portrait (3-Tier Asset) -->
                  <div class="w-full h-36 bg-[#f1eeee] flex items-center justify-center p-2 overflow-hidden border border-[rgba(15,0,0,0.06)] rounded-none">
                    <img
                      src="${asset.bustPngUrl}"
                      alt="${asset.nameKo}"
                      class="max-h-full max-w-full object-contain filter drop-shadow-none"
                      loading="lazy"
                      onerror="this.src='${asset.seatUrl}'; this.onerror=null;"
                    />
                  </div>

                  <!-- Card Identification & Level -->
                  <div class="w-full space-y-1">
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-black text-[#201d1d] truncate">[${asset.code}] ${asset.nameKo}</span>
                      <span class="text-[11px] font-bold text-stone-700">Lv.${stats.level}</span>
                    </div>
                    <div class="text-[10px] text-stone-500 uppercase tracking-wider">${asset.faction} · ${asset.nameEn}</div>
                  </div>

                  <!-- 4-Way Compass Stats (N, E, S, W) & Total TP -->
                  <div class="w-full bg-[#f1eeee] border border-[rgba(15,0,0,0.08)] p-2 rounded-sm space-y-1 text-center">
                    <div class="text-[10px] font-bold text-stone-600">북(N): <span class="text-[#201d1d]">${stats.top}</span></div>
                    <div class="flex items-center justify-between text-[10px] font-bold text-stone-600 px-1">
                      <span>서(W): <span class="text-[#201d1d]">${stats.left}</span></span>
                      <span>동(E): <span class="text-[#201d1d]">${stats.right}</span></span>
                    </div>
                    <div class="text-[10px] font-bold text-stone-600">남(S): <span class="text-[#201d1d]">${stats.bottom}</span></div>
                  </div>

                  <!-- Bottom Card TP Summary Badge -->
                  <div class="w-full pt-1 flex items-center justify-between border-t border-[rgba(15,0,0,0.08)] text-[11px]">
                    <span class="text-stone-500 font-semibold">전투력 (TP)</span>
                    <span class="font-black text-[#201d1d]">${stats.totalTP} TP</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </section>

      <!-- 3. Selected Card Deep Inspection & 7-Head Cutout Showcase -->
      <section class="w-full bg-[#f8f7f7] py-12 px-4 sm:px-6 md:px-8 lg:px-12">
        <div class="w-full max-w-7xl mx-auto space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[rgba(15,0,0,0.12)]">
            <div>
              <span class="text-[11px] text-[#646262] font-bold uppercase tracking-wider">영웅 상세 분석</span>
              <h2 class="text-lg sm:text-xl font-bold tracking-tight text-[#201d1d] m-0">
                선택된 영웅 카드 상세 (SELECTED CARD DETAIL: ${selectedAsset.nameKo})
              </h2>
            </div>
            <div class="text-xs text-stone-500 font-mono">
              [NO.${selectedAsset.code}] ${selectedAsset.nameEn}
            </div>
          </div>

          <!-- 2-Column Responsive Detail Card -->
          <div class="border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-6 sm:p-8 rounded-none grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <!-- Left: 7-Head Full-Body Cutout Preview (Tier 1 Asset) -->
            <div class="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none space-y-4">
              <div class="relative w-full h-72 sm:h-80 flex items-center justify-center overflow-hidden">
                <img
                  src="${selectedAsset.cutoutUrl}"
                  alt="${selectedAsset.nameKo} 7등신 풀바디"
                  class="max-w-full max-h-full object-contain filter drop-shadow-none"
                  loading="eager"
                  onerror="this.src='${selectedAsset.bustPngUrl}'; this.onerror=null;"
                />
              </div>
              <div class="w-full text-center space-y-1">
                <span class="inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-sm" style="background-color: ${selectedFactionStyle.bg}; color: ${selectedFactionStyle.text};">
                  ${selectedAsset.faction} · ${selectedAsset.rarity}
                </span>
                <div class="text-xs text-stone-500">
                  공식 7등신 풀바디 투명 컷아웃 (Visual Tier 1)
                </div>
              </div>
            </div>

            <!-- Right: Detailed Stats, Level, EXP, Ability, and Actions -->
            <div class="lg:col-span-7 flex flex-col justify-between space-y-6">
              <div class="space-y-3">
                <div class="flex items-center gap-2">
                  <h3 class="text-xl sm:text-2xl font-black text-[#201d1d] m-0">
                    [${selectedAsset.code}] ${selectedAsset.nameKo}
                  </h3>
                  <span class="text-sm text-stone-500 font-normal">(${selectedAsset.nameEn})</span>
                </div>

                <p class="text-xs text-stone-600 leading-relaxed m-0">
                  ${(selectedDb as any).lore_ko || `${selectedAsset.faction} 속성의 강력한 정령 영웅. 3x3 보드에서 전술적 플립과 결계를 주도합니다.`}
                </p>
              </div>

              <!-- Level, EXP Bar & Stat Points Notification -->
              <div class="border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] p-4 rounded-none space-y-2">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-bold text-[#201d1d]">성장 레벨: Lv.${selectedStats.level} / 100</span>
                  <span class="text-stone-500">EXP: ${selectedStats.exp} / ${selectedStats.expToNext}</span>
                </div>
                <div class="w-full h-2 bg-stone-200 rounded-sm overflow-hidden">
                  <div
                    class="h-full bg-[#201d1d]"
                    style="width: ${Math.min(100, Math.round((selectedStats.exp / (selectedStats.expToNext || 100)) * 100))}%"
                  ></div>
                </div>
                <div class="flex items-center justify-between text-[11px] pt-1">
                  <span class="text-stone-600">
                    미사용 스탯 포인트: <strong class="${selectedStats.statPoints > 0 ? 'text-red-600' : 'text-[#201d1d]'}">${selectedStats.statPoints} pt</strong>
                  </span>
                  ${selectedStats.statPoints > 0 ? `
                    <span class="text-[10px] text-red-600 font-bold">카드 육성 메뉴에서 스탯을 배분하세요!</span>
                  ` : `
                    <span class="text-[10px] text-stone-400">모든 스탯 포인트 배분 완료</span>
                  `}
                </div>
              </div>

              <!-- 4-Way Compass Stats Breakdown Grid -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div class="border border-[rgba(15,0,0,0.12)] bg-white p-3 rounded-none">
                  <div class="text-[10px] text-stone-500 font-bold uppercase">북 (NORTH)</div>
                  <div class="text-lg font-black text-[#201d1d] mt-1">${selectedStats.top}</div>
                  <div class="text-[10px] text-stone-400">기본 ${getCardBaseStats(currentSelectedId).top} + 보너스 ${selectedStats.top - getCardBaseStats(currentSelectedId).top}</div>
                </div>
                <div class="border border-[rgba(15,0,0,0.12)] bg-white p-3 rounded-none">
                  <div class="text-[10px] text-stone-500 font-bold uppercase">동 (EAST)</div>
                  <div class="text-lg font-black text-[#201d1d] mt-1">${selectedStats.right}</div>
                  <div class="text-[10px] text-stone-400">기본 ${getCardBaseStats(currentSelectedId).right} + 보너스 ${selectedStats.right - getCardBaseStats(currentSelectedId).right}</div>
                </div>
                <div class="border border-[rgba(15,0,0,0.12)] bg-white p-3 rounded-none">
                  <div class="text-[10px] text-stone-500 font-bold uppercase">남 (SOUTH)</div>
                  <div class="text-lg font-black text-[#201d1d] mt-1">${selectedStats.bottom}</div>
                  <div class="text-[10px] text-stone-400">기본 ${getCardBaseStats(currentSelectedId).bottom} + 보너스 ${selectedStats.bottom - getCardBaseStats(currentSelectedId).bottom}</div>
                </div>
                <div class="border border-[rgba(15,0,0,0.12)] bg-white p-3 rounded-none">
                  <div class="text-[10px] text-stone-500 font-bold uppercase">서 (WEST)</div>
                  <div class="text-lg font-black text-[#201d1d] mt-1">${selectedStats.left}</div>
                  <div class="text-[10px] text-stone-400">기본 ${getCardBaseStats(currentSelectedId).left} + 보너스 ${selectedStats.left - getCardBaseStats(currentSelectedId).left}</div>
                </div>
              </div>

              <!-- Special Ability & TP Total -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] rounded-none">
                <div class="space-y-0.5">
                  <span class="text-[10px] text-stone-500 font-bold uppercase">고유 스킬 (SPECIAL ABILITY)</span>
                  <div class="text-xs font-bold text-[#201d1d]">
                    ${(selectedDb as any).ability?.description_ko || '기본 전술 능력: 표준 전장 배치'}
                  </div>
                </div>
                <div class="text-right">
                  <span class="text-[10px] text-stone-500 font-bold uppercase">영웅 총전투력</span>
                  <div class="text-xl font-black text-[#201d1d]">${selectedStats.totalTP} TP</div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  data-nav="card"
                  class="flex-1 px-5 py-3 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm hover:opacity-90 transition-opacity min-h-[44px] inline-flex items-center justify-center"
                >
                  이 카드 육성하기 (EXP &amp; 스탯 배분) →
                </button>
                <a
                  href="/home"
                  class="px-5 py-3 bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm hover:bg-[#e8e5e5] transition-colors min-h-[44px] inline-flex items-center justify-center no-underline"
                >
                  실전 배틀 출격 (/home)
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}
```

---

### 4.3 Proposed Integration in `src/landing/index.ts`

```typescript
// 1. Add import:
import { renderMyDeckSection } from './views/MyDeckSection';

// 2. Extend LandingState:
interface LandingState {
  activeView: ViewKey;
  activeModal: ModalKey;
  isSidebarOpen: boolean;
  selectedDeckCardId?: number;
}

// 3. In renderActiveViewContent(view: ViewKey):
function renderActiveViewContent(view: ViewKey): string {
  if (view === 'home') {
    return renderHomeSection();
  }
  if (view === 'deck') {
    return renderMyDeckSection(state.selectedDeckCardId || 1);
  }
  ...
}

// 4. In handleEventDelegation(event: Event):
if (action === 'select-deck-card') {
  const cardIdStr = target.getAttribute('data-card-id');
  if (cardIdStr) {
    state.selectedDeckCardId = parseInt(cardIdStr, 10);
    renderApp();
  }
}
```

---

## 5. Verification Method

### 5.1 Automated Test Execution
Run the full Milestone 3 E2E test harness:
```bash
npx tsx tests/e2e/run_all.ts --milestone M3
```
Expected result upon applying `HomeSection.tsx` and `MyDeckSection.tsx`:
- `[T1.HOME.1]` ~ `[T1.HOME.5]`: 5/5 PASS
- `[T1.DECK.1]` ~ `[T1.DECK.5]`: 5/5 PASS (All 5 Deck assertions pass)
- `[T3.C1.1]` (Deck TP Dynamic Sync): PASS
- `[T4.W1.3]` (Mathematical Deck TP Audit): PASS

### 5.2 TypeScript Compilation & Bundle Verification
```bash
# TypeScript strict check (0 errors expected)
npx tsc --noEmit

# Production Vite MPA build
npm run build
```

### 5.3 Invalidation Conditions
The conclusion/design is invalidated if:
1. `MyDeckSection.tsx` introduces any instance of `BattleHUD` or `Joystick` (violating `T1.DECK.4`).
2. Deck TP formula diverges from active 5-card $(N+E+S+W)$ sum ($80$ base).
3. The layout contains non-monospace fonts or rounded corners $> 4px$ (violating `DESIGN.md`).
