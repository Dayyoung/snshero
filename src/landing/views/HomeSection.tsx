/**
 * src/landing/views/HomeSection.tsx
 *
 * Responsive vertical scroll Home section for SNSHero Static Landing.
 * Features:
 *   - Official SNS Hero Logo (/logo-ko.png) prominently displayed in brand header
 *   - Cool Card Deck Logo & 5-card fan-folded interactive active squad showcase (-12deg to +12deg)
 *   - Deck Combat Power (CP) calculation & Win Streak flame badge
 *   - Click-to-inspect card modal with 7-head character cutout, stats & ability breakdown
 *   - 4 core media pillars (웹소설, 웹게임, 웹툰, 애니메이션)
 *   - Official external serialization links with '[절찬 연재중]' badges (네이버 웹소설, 네이버 웹툰, 문피아)
 * Pure TypeScript template string generator (Zero React runtime).
 */

import { EXTERNAL_LINKS } from '../types';
import { getCharacterAsset, FACTION_PALETTES } from '../services/assetCatalog';
import { cardNurtureStore } from '../services/cardNurtureStore';
import { CARD_DATABASE } from '../../cardDatabase';
import { renderOriginalCardHtml } from '../components/OriginalCardHtml';

let inspectedHomeCardId: number | null = null;

export function setInspectedHomeCardId(id: number | null): void {
  inspectedHomeCardId = id;
}

export function getInspectedHomeCardId(): number | null {
  return inspectedHomeCardId;
}

function getHomeCardEffectiveStats(cardId: number) {
  const db = CARD_DATABASE[cardId];
  const baseTop = db?.top || 0;
  const baseRight = db?.right || 0;
  const baseBottom = db?.bottom || 0;
  const baseLeft = db?.left || 0;
  const nurture = cardNurtureStore.cards[cardId] || {
    cardId,
    level: 1,
    exp: 0,
    expToNext: 100,
    statPoints: 0,
    bonusStats: { top: 0, right: 0, bottom: 0, left: 0 },
    totalBonus: 0,
  };
  const bonus = nurture.bonusStats || { top: 0, right: 0, bottom: 0, left: 0 };
  const top = baseTop + (bonus.top || 0);
  const right = baseRight + (bonus.right || 0);
  const bottom = baseBottom + (bonus.bottom || 0);
  const left = baseLeft + (bonus.left || 0);
  return {
    top,
    right,
    bottom,
    left,
    totalTP: top + right + bottom + left,
    level: nurture.level || 1,
    exp: nurture.exp || 0,
    expToNext: nurture.expToNext || 100,
    statPoints: nurture.statPoints || 0,
  };
}

export function renderHomeSection(): string {
  // Active 5-card squad & metrics for Cool Card Deck preview
  const deckIds = cardNurtureStore.getDeckCardIds();
  const deckTP = cardNurtureStore.getDeckTP();
  const winStreak = cardNurtureStore.getWinStreak();

  // Inspected Card Modal Data
  const inspectedId = inspectedHomeCardId;
  const inspectedAsset = inspectedId ? getCharacterAsset(inspectedId) : null;
  const inspectedStats = inspectedId ? getHomeCardEffectiveStats(inspectedId) : null;
  const inspectedDb = inspectedId ? CARD_DATABASE[inspectedId] : null;
  const inspectedFactionStyle = inspectedAsset
    ? FACTION_PALETTES[inspectedAsset.faction] || { bg: '#201d1d', text: '#ffffff', border: '#302c2c' }
    : null;

  return `
    <div class="w-full flex flex-col font-mono text-[#201d1d] select-none">
      <!-- 1. Hero Introduction Banner (SnowHero / 눈히어로 & Official Logo) -->
      <section class="w-full bg-[#fdfcfc] border-b border-[rgba(15,0,0,0.12)] py-12 md:py-20 px-4 sm:px-6 md:px-8 lg:px-12">
        <div class="w-full max-w-7xl mx-auto space-y-4">
          <!-- Official SNS Hero Graphic Logo Display -->
          <div class="w-full flex items-center justify-start pb-1">
            <a
              href="#home"
              data-nav="home"
              class="inline-flex items-center cursor-pointer bg-transparent transition-opacity hover:opacity-90 min-h-[44px]"
              aria-label="눈히어로.com 공식 로고"
            >
              <img
                src="/logo-ko.png"
                alt="눈히어로.com SNSHero Revolution 공식 로고"
                class="h-20 sm:h-28 md:h-36 w-auto max-w-full object-contain bg-transparent filter drop-shadow-none"
                loading="eager"
              />
            </a>
          </div>

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
          </p>
        </div>
      </section>

      <!-- 2. Cool Card Deck Showcase (Fan-Folded 5-Card Preview with Rotational Offsets & CP) -->
      <section id="home-deck-showcase" data-testid="cool-card-deck" class="w-full bg-[#f8f7f7] border-b border-[rgba(15,0,0,0.12)] py-12 px-4 sm:px-6 md:px-8 lg:px-12">
        <div class="w-full max-w-7xl mx-auto space-y-6">
          <!-- Squad HUD Header: Title, CP, Win Streak Badge, Edit Button -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(15,0,0,0.12)]">
            <div class="space-y-1">
              <div class="inline-flex items-center gap-2 px-2 py-0.5 bg-[#201d1d] text-[#fdfcfc] text-[10px] font-bold rounded-sm tracking-wider uppercase">
                <span>[ACTIVE SQUAD]</span>
                <span class="text-stone-400">·</span>
                <span>COOL CARD DECK</span>
              </div>
              <h2 class="text-lg sm:text-xl font-bold tracking-tight text-[#201d1d] m-0">
                대표 출격 덱 5인 스쿼드
              </h2>
              <div class="text-xs text-stone-600">
                출격 덱 종합 전투력: <strong class="text-base font-black text-[#201d1d]">${deckTP} CP</strong> (${deckTP} TP)
              </div>
            </div>

            <div class="flex items-center gap-3">
              ${winStreak > 0 ? `
                <div class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm border border-[#201d1d]" title="${winStreak}연승 질주 중!">
                  <span class="text-amber-400">🔥</span>
                  <span>${winStreak}연승 질주</span>
                </div>
              ` : `
                <div class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm border border-[#201d1d]" title="🔥 7연승 도전 중!">
                  <span class="text-amber-400">🔥</span>
                  <span>7연승 도전 중</span>
                </div>
              `}
              <a
                href="#deck"
                data-nav="deck"
                class="px-4 py-2 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm hover:opacity-90 transition-opacity min-h-[44px] flex items-center justify-center cursor-pointer no-underline"
                aria-label="마이덱 편집으로 이동"
              >
                [덱 편집]
              </a>
            </div>
          </div>

          <!-- Fan-Folded 5 Cards Display Stage (Original TCG Card Design) -->
          <div id="home-squad-fan" class="squad-fan-container relative h-72 sm:h-80 md:h-96 w-full flex items-center justify-center overflow-visible select-none my-6" role="group" aria-label="출격 덱 5장 부채꼴 미리보기">
            ${deckIds.map((cardId, index) => {
              const asset = getCharacterAsset(cardId);
              const stats = getHomeCardEffectiveStats(cardId);
              const centerOffset = index - 2; // -2, -1, 0, 1, 2
              const rotation = centerOffset * 6; // -12deg, -6deg, 0deg, 6deg, 12deg

              return `
                <div
                  role="button"
                  tabindex="0"
                  data-fan-card="true"
                  data-deck-preview-card="true"
                  data-action="inspect-home-card"
                  data-card-id="${cardId}"
                  class="fan-card fan-deck-card absolute w-32 sm:w-40 md:w-48 cursor-pointer focus:outline-none transition-transform"
                  style="
                    left: 50%;
                    --fan-x: calc(${centerOffset} * clamp(34px, 7vw, 64px));
                    --fan-y: calc(${Math.abs(centerOffset)} * clamp(4px, 1.2vw, 10px));
                    transform: translate(calc(-50% + var(--fan-x)), var(--fan-y)) rotate(${rotation}deg);
                    z-index: ${10 + index};
                  "
                  aria-label="${asset.nameKo} 카드 검사 (${index + 1}/5)"
                >
                  ${renderOriginalCardHtml(cardId, {
                    isOwned: true,
                    level: stats.level,
                    hideStats: false,
                    className: 'w-full aspect-[5/7]',
                  })}
                </div>
              `;
            }).join('')}
          </div>

          <!-- Bottom Showcase Helper Text & Core Media Shortcuts (웹소설 #book, 웹툰 #webtoon) -->
          <div class="space-y-4 pt-2">
            <div class="text-center text-xs text-stone-500">
              출격 덱 카드(-12°~+12° 부채꼴 배치). 카드를 클릭하면 7등신 풀바디 비주얼과 4방향 스탯을 상세 검사할 수 있습니다.
            </div>

            <!-- Original Style Media Shortcuts Grid -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-3xl mx-auto w-full pt-1">
              <a
                href="#book"
                data-nav="book"
                class="min-h-[44px] px-3 py-2.5 bg-[#201d1d] hover:bg-[#302c2c] text-[#fdfcfc] font-bold text-xs sm:text-sm rounded-sm border border-[#201d1d] flex items-center justify-center gap-1.5 transition-colors no-underline cursor-pointer shadow-sm"
                aria-label="공식 웹소설 바로가기"
              >
                <span>📜 공식 웹소설</span>
                <span class="text-[10px] text-amber-300 font-normal">[40화]</span>
              </a>

              <a
                href="#webtoon"
                data-nav="webtoon"
                class="min-h-[44px] px-3 py-2.5 bg-[#201d1d] hover:bg-[#302c2c] text-[#fdfcfc] font-bold text-xs sm:text-sm rounded-sm border border-[#201d1d] flex items-center justify-center gap-1.5 transition-colors no-underline cursor-pointer shadow-sm"
                aria-label="공식 웹툰 바로가기"
              >
                <span>🎨 공식 웹툰</span>
                <span class="text-[10px] text-emerald-300 font-normal">[840컷]</span>
              </a>

              <a
                href="#play"
                data-nav="play"
                class="min-h-[44px] px-3 py-2.5 bg-[#fdfcfc] hover:bg-[#f1eeee] text-[#201d1d] font-bold text-xs sm:text-sm rounded-sm border border-[rgba(15,0,0,0.12)] flex items-center justify-center gap-1.5 transition-colors no-underline cursor-pointer"
                aria-label="AI 전술 카드배틀 플레이 바로가기"
              >
                <span>⚔️ AI 카드배틀</span>
              </a>

              <a
                href="#shop"
                data-nav="shop"
                class="min-h-[44px] px-3 py-2.5 bg-[#fdfcfc] hover:bg-[#f1eeee] text-[#201d1d] font-bold text-xs sm:text-sm rounded-sm border border-[rgba(15,0,0,0.12)] flex items-center justify-center gap-1.5 transition-colors no-underline cursor-pointer"
                aria-label="카드상점 바로가기"
              >
                <span>🛒 카드 상점</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- 3. Official Web Novel & Webtoon Hub Section (눈히어로 공식 #book, #webtoon 및 외부 연재 플랫폼) -->
      <section class="w-full bg-[#fdfcfc] border-b border-[rgba(15,0,0,0.12)] py-12 px-4 sm:px-6 md:px-8 lg:px-12">
        <div class="w-full max-w-7xl mx-auto space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[rgba(15,0,0,0.12)]">
            <div>
              <span class="text-[11px] text-[#646262] font-bold uppercase tracking-wider">공식 스토리 &amp; 연재 채널</span>
              <h2 class="text-lg sm:text-xl font-bold tracking-tight text-[#201d1d] m-0">눈히어로 40부작 웹소설 &amp; 웹툰 바로가기</h2>
            </div>
            <div class="text-xs text-stone-500 font-mono">
              매주 연재 업데이트 진행 중
            </div>
          </div>

          <!-- 4 Core Showcase Cards Grid: 공식 웹소설(#book), 공식 웹툰(#webtoon), 네이버 웹소설, 네이버 웹툰 -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <!-- Card 1: Official Web Novel (#book) -->
            <div class="border-2 border-[#201d1d] bg-[#f8f7f7] p-6 rounded-none flex flex-col justify-between space-y-4 shadow-sm">
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-[#201d1d]">눈히어로 웹소설</span>
                  <span class="px-2 py-0.5 bg-amber-500 text-stone-950 text-[10px] font-black rounded-sm tracking-wider">
                    [40화 전편]
                  </span>
                </div>
                <h3 class="text-sm font-bold text-[#201d1d] m-0">눈히어로.com - 카단의 여정</h3>
                <p class="text-xs text-stone-600 leading-relaxed m-0">
                  평범한 청년 카단이 아케인 대륙 11개 종족을 모험하며 힘을 일깨우는 40부작 정통 판타지 대서사시.
                </p>
              </div>
              <a
                href="#book"
                data-nav="book"
                class="w-full py-3 px-4 bg-[#201d1d] text-[#fdfcfc] hover:bg-[#302c2c] text-center text-xs font-bold rounded-sm min-h-[44px] transition-colors no-underline flex items-center justify-center cursor-pointer"
              >
                📜 웹소설 읽으러 가기 →
              </a>
            </div>

            <!-- Card 2: Official Webtoon (#webtoon) -->
            <div class="border-2 border-[#201d1d] bg-[#f8f7f7] p-6 rounded-none flex flex-col justify-between space-y-4 shadow-sm">
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-[#201d1d]">눈히어로 웹툰</span>
                  <span class="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-black rounded-sm tracking-wider">
                    [840컷+ 뷰어]
                  </span>
                </div>
                <h3 class="text-sm font-bold text-[#201d1d] m-0">카단의 여정 비주얼 코믹스</h3>
                <p class="text-xs text-stone-600 leading-relaxed m-0">
                  840컷 이상의 고해상도 풀컬러 다크 판타지 컷씬과 캐릭터 대사, 타격 SFX가 살아있는 비주얼 웹툰.
                </p>
              </div>
              <a
                href="#webtoon"
                data-nav="webtoon"
                class="w-full py-3 px-4 bg-[#201d1d] text-[#fdfcfc] hover:bg-[#302c2c] text-center text-xs font-bold rounded-sm min-h-[44px] transition-colors no-underline flex items-center justify-center cursor-pointer"
              >
                🎨 웹툰 보러 가기 →
              </a>
            </div>

            <!-- Card 3: Naver Web Novel -->
            <div class="border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-6 rounded-none flex flex-col justify-between space-y-4">
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-[#201d1d]">네이버 웹소설</span>
                  <span class="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-sm tracking-wider">
                    [절찬 연재중]
                  </span>
                </div>
                <h3 class="text-sm font-bold text-[#201d1d] m-0">카단과 아케인 에코즈</h3>
                <p class="text-xs text-stone-600 leading-relaxed m-0">
                  네이버 챌린지 리그 공식 연재관. 눈보라 치는 설산의 맹세부터 새벽의 성채까지 이어지는 정통 웹소설.
                </p>
              </div>
              <a
                href="${EXTERNAL_LINKS.naverNovel}"
                data-url="http://novel.naver.com/challenge/list?novelId=1250635"
                target="_blank"
                rel="noopener noreferrer"
                class="w-full py-3 px-4 bg-[#fdfcfc] hover:bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-center text-xs font-bold rounded-sm min-h-[44px] transition-colors no-underline flex items-center justify-center"
              >
                네이버 웹소설 ↗
              </a>
            </div>

            <!-- Card 4: Naver Webtoon -->
            <div class="border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-6 rounded-none flex flex-col justify-between space-y-4">
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-[#201d1d]">네이버 웹툰</span>
                  <span class="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-sm tracking-wider">
                    [절찬 연재중]
                  </span>
                </div>
                <h3 class="text-sm font-bold text-[#201d1d] m-0">SNS히어로 레볼루션 웹툰</h3>
                <p class="text-xs text-stone-600 leading-relaxed m-0">
                  네이버 도전만화 공식 연재관. 다이나믹 컷씬과 타격 효과음이 살아있는 비주얼 코믹스.
                </p>
              </div>
              <a
                href="${EXTERNAL_LINKS.naverWebtoon}"
                data-url="https://comic.naver.com/challenge/list?titleId=856677"
                target="_blank"
                rel="noopener noreferrer"
                class="w-full py-3 px-4 bg-[#fdfcfc] hover:bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-center text-xs font-bold rounded-sm min-h-[44px] transition-colors no-underline flex items-center justify-center"
              >
                네이버 웹툰 ↗
              </a>
            </div>
          </div>
        </div>
      </section>


      <!-- 6. Card Inspect Modal Overlay (Opened on fan card click) -->
      ${inspectedId && inspectedAsset && inspectedStats ? `
        <div
          id="home-card-inspect-modal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 font-mono select-none"
          role="dialog"
          aria-modal="true"
        >
          <!-- Dedicated Backdrop Overlay Sibling -->
          <div
            id="home-card-inspect-backdrop"
            data-action="close-home-card-inspector"
            class="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer transition-opacity"
            aria-hidden="true"
          ></div>

          <!-- Modal Dialog Content Box -->
          <div class="relative z-10 bg-[#fdfcfc] text-[#201d1d] border border-[rgba(15,0,0,0.12)] max-w-lg w-full p-6 sm:p-8 rounded-none shadow-none space-y-6">
            <!-- Close [x] Top Right -->
            <button
              type="button"
              data-action="close-home-card-inspector"
              class="absolute top-4 right-4 min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-500 hover:text-[#201d1d] font-bold text-sm rounded-sm cursor-pointer"
              aria-label="닫기"
            >
              [x]
            </button>

            <!-- Modal Header -->
            <div class="space-y-1 pr-8">
              <span class="inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded-sm" style="background-color: ${inspectedFactionStyle?.bg}; color: ${inspectedFactionStyle?.text};">
                ${inspectedAsset.faction} · ${inspectedAsset.rarity}
              </span>
              <h3 class="text-xl font-black text-[#201d1d] m-0">
                [${inspectedAsset.code}] ${inspectedAsset.nameKo} (${inspectedAsset.nameEn})
              </h3>
            </div>

            <!-- Card Original TCG & Cutout Dual Preview -->
            <div class="flex flex-col sm:flex-row items-center gap-4">
              <div class="w-36 sm:w-44 shrink-0">
                ${renderOriginalCardHtml(inspectedId, {
                  isOwned: true,
                  level: inspectedStats.level,
                  hideStats: false,
                  className: 'w-full aspect-[5/7]',
                })}
              </div>
              <div class="w-full flex-1 h-52 sm:h-56 bg-[#f8f7f7] border border-[rgba(15,0,0,0.08)] flex items-center justify-center p-2 overflow-hidden">
                <img
                  src="${inspectedAsset.cutoutUrl}"
                  alt="${inspectedAsset.nameKo} 7등신 풀바디"
                  class="max-h-full max-w-full object-contain filter drop-shadow-none"
                  loading="eager"
                  onerror="this.src='${inspectedAsset.bustPngUrl}'; this.onerror=null;"
                />
              </div>
            </div>

            <!-- Compass Stats & Level -->
            <div class="grid grid-cols-4 gap-2 text-center text-xs">
              <div class="p-2 bg-[#f8f7f7] border border-[rgba(15,0,0,0.08)]">
                <div class="text-[10px] text-stone-500 font-bold">북 (N)</div>
                <div class="text-base font-black text-[#201d1d]">${inspectedStats.top}</div>
              </div>
              <div class="p-2 bg-[#f8f7f7] border border-[rgba(15,0,0,0.08)]">
                <div class="text-[10px] text-stone-500 font-bold">동 (E)</div>
                <div class="text-base font-black text-[#201d1d]">${inspectedStats.right}</div>
              </div>
              <div class="p-2 bg-[#f8f7f7] border border-[rgba(15,0,0,0.08)]">
                <div class="text-[10px] text-stone-500 font-bold">남 (S)</div>
                <div class="text-base font-black text-[#201d1d]">${inspectedStats.bottom}</div>
              </div>
              <div class="p-2 bg-[#f8f7f7] border border-[rgba(15,0,0,0.08)]">
                <div class="text-[10px] text-stone-500 font-bold">서 (W)</div>
                <div class="text-base font-black text-[#201d1d]">${inspectedStats.left}</div>
              </div>
            </div>

            <!-- Ability & TP Summary -->
            <div class="p-3 bg-[#f8f7f7] border border-[rgba(15,0,0,0.08)] space-y-1 text-xs">
              <div class="flex items-center justify-between">
                <span class="font-bold text-[#201d1d]">고유 스킬:</span>
                <span class="font-black text-[#201d1d]">${inspectedStats.totalTP} TP</span>
              </div>
              <div class="text-stone-600">
                ${(inspectedDb as any)?.ability?.description_ko || '기본 전술 능력: 표준 전장 배치'}
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                data-nav="card"
                class="flex-1 py-3 px-4 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm min-h-[44px] hover:opacity-90 transition-opacity flex items-center justify-center cursor-pointer"
              >
                카드 육성 바로가기 →
              </button>
              <button
                type="button"
                data-nav="deck"
                class="py-3 px-4 bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm min-h-[44px] hover:bg-[#e8e5e5] transition-colors flex items-center justify-center cursor-pointer"
              >
                마이덱 편집 →
              </button>
              <button
                type="button"
                data-action="close-home-card-inspector"
                class="py-3 px-4 bg-white text-stone-600 border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm min-h-[44px] hover:bg-stone-50 transition-colors flex items-center justify-center cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}
