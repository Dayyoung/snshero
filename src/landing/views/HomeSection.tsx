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
                href="#play"
                data-nav="play"
                class="px-6 py-3 bg-[#201d1d] text-[#fdfcfc] text-sm font-bold rounded-sm hover:opacity-90 transition-opacity min-h-[44px] inline-flex items-center justify-center no-underline shadow-none"
              >
                웹게임 즉시 시작 →
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
