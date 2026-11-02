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
 *   - 110-card 3-tier visual asset system showcase
 * Pure TypeScript template string generator (Zero React runtime).
 */

import { EXTERNAL_LINKS } from '../types';
import { getCharacterAsset, FACTION_PALETTES } from '../services/assetCatalog';
import { cardNurtureStore } from '../services/cardNurtureStore';
import { CARD_DATABASE } from '../../cardDatabase';

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
  // Sample hero assets for 3-tier visual display
  const hero1 = getCharacterAsset(1);   // Aquaris (Water)
  const hero19 = getCharacterAsset(19); // Phoenix (Fire)
  const hero41 = getCharacterAsset(41); // Kadan (Human)
  const hero60 = getCharacterAsset(60); // Death Knight Artus (Undead)

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
        <div class="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8 md:gap-12">
          <div class="flex-1 space-y-4">
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
              서버 로그인 없이 브라우저 로컬스토리지(LocalStorage)에 육성 데이터가 영구 보존됩니다.
            </p>
            <div class="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="#play"
                data-nav="play"
                class="px-6 py-3 bg-[#201d1d] text-[#fdfcfc] text-sm font-bold rounded-sm hover:opacity-90 transition-opacity min-h-[44px] inline-flex items-center justify-center no-underline shadow-none"
              >
                웹게임 즉시 시작 →
              </a>
              <button
                type="button"
                data-nav="play"
                class="px-5 py-3 bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-sm font-semibold rounded-sm hover:bg-[#e8e5e5] transition-colors min-h-[44px] inline-flex items-center justify-center cursor-pointer"
              >
                40부작 웹툰·애니메이션 감상
              </button>
              <a
                href="#deck"
                data-nav="deck"
                class="px-5 py-3 bg-white text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-sm font-semibold rounded-sm hover:bg-[#f8f7f7] transition-colors min-h-[44px] inline-flex items-center justify-center no-underline cursor-pointer"
              >
                마이덱 확인 →
              </a>
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

          <!-- Fan-Folded 5 Cards Display Stage -->
          <div id="home-squad-fan" class="squad-fan-container relative h-64 sm:h-72 md:h-84 w-full flex items-center justify-center overflow-visible select-none my-6" role="group" aria-label="출격 덱 5장 부채꼴 미리보기">
            ${deckIds.map((cardId, index) => {
              const asset = getCharacterAsset(cardId);
              const stats = getHomeCardEffectiveStats(cardId);
              const centerOffset = index - 2; // -2, -1, 0, 1, 2
              const rotation = centerOffset * 6; // -12deg, -6deg, 0deg, 6deg, 12deg
              const rarityGlowClass = asset.rarity === 'gold'
                ? 'rarity-glow-gold border-yellow-400'
                : asset.rarity === 'silver'
                ? 'rarity-glow-silver border-slate-300'
                : 'rarity-glow-bronze border-amber-700/80';

              return `
                <div
                  role="button"
                  tabindex="0"
                  data-fan-card="true"
                  data-deck-preview-card="true"
                  data-action="inspect-home-card"
                  data-card-id="${cardId}"
                  class="fan-card fan-deck-card absolute w-28 sm:w-36 md:w-44 h-44 sm:h-56 md:h-68 bg-[#fdfcfc] border-2 ${rarityGlowClass} p-2 rounded-none flex flex-col justify-between shadow-none cursor-pointer focus:outline-none"
                  style="
                    left: 50%;
                    --fan-x: calc(${centerOffset} * clamp(30px, 6vw, 56px));
                    --fan-y: calc(${Math.abs(centerOffset)} * clamp(4px, 1.2vw, 10px));
                    transform: translate(calc(-50% + var(--fan-x)), var(--fan-y)) rotate(${rotation}deg);
                    z-index: ${10 + index};
                  "
                  aria-label="${asset.nameKo} 카드 검사 (${index + 1}/5)"
                >
                  <!-- Card Top Bar: Slot & Level -->
                  <div class="flex items-center justify-between text-[10px] w-full pb-1 border-b border-[rgba(15,0,0,0.08)]">
                    <span class="font-bold text-[#201d1d]">SLOT 0${index + 1}</span>
                    <span class="font-bold text-stone-600">Lv.${stats.level}</span>
                  </div>

                  <!-- Character Bust Portrait -->
                  <div class="w-full flex-1 flex items-center justify-center overflow-hidden my-1 bg-[#f8f7f7]">
                    <img
                      src="${asset.bustPngUrl}"
                      alt="${asset.nameKo}"
                      class="max-h-full max-w-full object-contain filter drop-shadow-none pointer-events-none"
                      loading="lazy"
                      onerror="this.src='${asset.seatUrl}'; this.onerror=null;"
                    />
                  </div>

                  <!-- Card Bottom Info: Name & Compass Stats -->
                  <div class="w-full text-center space-y-0.5 pt-1 border-t border-[rgba(15,0,0,0.08)]">
                    <div class="text-[11px] font-black text-[#201d1d] truncate">
                      [${asset.code}] ${asset.nameKo}
                    </div>
                    <div class="text-[9px] text-stone-500 font-mono">
                      N:${stats.top} E:${stats.right} S:${stats.bottom} W:${stats.left}
                    </div>
                    <div class="text-[10px] font-bold text-[#201d1d]">
                      ${stats.totalTP} TP
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Bottom Showcase Helper Text -->
          <div class="text-center text-xs text-stone-500 pt-2">
            출격 덱 카드(-12°~+12° 부채꼴 배치). 카드를 클릭하면 7등신 풀바디 비주얼과 4방향 스탯을 상세 검사할 수 있습니다.
          </div>
        </div>
      </section>

      <!-- 3. Official External Serializations Section (네이버 웹소설, 네이버 웹툰, 문피아) -->
      <section class="w-full bg-[#fdfcfc] border-b border-[rgba(15,0,0,0.12)] py-12 px-4 sm:px-6 md:px-8 lg:px-12">
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
                data-url="http://novel.naver.com/challenge/list?novelId=1250635"
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
                data-url="https://comic.naver.com/challenge/list?titleId=856677"
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
                data-url="https://nlink.munpia.com/link/munpia/novel/616551"
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

      <!-- 4. Core 4 Media Pillars: 웹소설 · 웹게임 · 웹툰 · 애니메이션 쇼케이스 -->
      <section class="w-full bg-[#f8f7f7] border-b border-[rgba(15,0,0,0.12)] py-12 px-4 sm:px-6 md:px-8 lg:px-12">
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

      <!-- 5. 3-Tier Character Visuals Showcase (7-head cutout, bust, 3-head SD) -->
      <section class="w-full bg-[#fdfcfc] py-12 px-4 sm:px-6 md:px-8 lg:px-12">
        <div class="w-full max-w-7xl mx-auto space-y-6">
          <div class="pb-3 border-b border-[rgba(15,0,0,0.12)]">
            <span class="text-[11px] text-[#646262] font-bold uppercase tracking-wider">3-Tier Visual Asset Standard</span>
            <h2 class="text-lg sm:text-xl font-bold tracking-tight text-[#201d1d] m-0">110종 영웅 3단계 비주얼 자산 체계</h2>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            ${[hero1, hero19, hero41, hero60].map((h) => `
              <div class="border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] p-4 rounded-none flex flex-col items-center text-center space-y-3">
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

            <!-- 7-Head Full-Body Cutout Preview -->
            <div class="w-full h-56 bg-[#f8f7f7] border border-[rgba(15,0,0,0.08)] flex items-center justify-center p-3 overflow-hidden">
              <img
                src="${inspectedAsset.cutoutUrl}"
                alt="${inspectedAsset.nameKo} 7등신 풀바디"
                class="max-h-full max-w-full object-contain filter drop-shadow-none"
                loading="eager"
                onerror="this.src='${inspectedAsset.bustPngUrl}'; this.onerror=null;"
              />
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
