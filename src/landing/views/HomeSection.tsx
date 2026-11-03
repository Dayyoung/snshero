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
import { t, tr, getCurrentLanguage } from '../services/i18n';

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
              aria-label="${getCurrentLanguage() === 'ko' ? '눈히어로.com 공식 로고' : 'SNSHero.com Official Logo'}"
            >
              <img
                src="${t('logo_src', '/logo-ko.png')}"
                alt="${getCurrentLanguage() === 'ko' ? '눈히어로.com SNSHero Revolution 공식 로고' : 'SNSHero.com SNSHero Revolution Official Logo'}"
                class="h-20 sm:h-28 md:h-36 w-auto max-w-full object-contain bg-transparent filter drop-shadow-none"
                loading="eager"
              />
            </a>
          </div>

          <div class="inline-flex items-center gap-2 px-2.5 py-1 bg-[#201d1d] text-[#fdfcfc] text-[11px] font-bold rounded-sm tracking-wider uppercase">
            <span>${getCurrentLanguage() === 'ko' ? '눈히어로.com' : 'SNSHero.com'}</span>
            <span class="text-stone-400">·</span>
            <span>SNSHero Revolution</span>
          </div>
          <h1 class="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-tight m-0">
            ${tr('빛과 어둠의 11개 종족 대서사시,', 'Epic Saga of 11 Factions of Light and Darkness,', '光と闇の11種族が織りなす大叙事詩、')}<br/>
            <span class="text-[#201d1d] border-b-2 border-[#201d1d]">${tr('카단과 성진호흡의 원클릭 AI 배틀', 'One-Click AI Battles of Kadan &amp; Star Breathing', 'カダンと星辰呼吸のワンクリックAIバトル')}</span>
          </h1>
          <p class="text-xs sm:text-sm md:text-base text-stone-600 leading-relaxed max-w-2xl m-0">
            ${tr(
              '눈히어로(SnowHero)는 110종의 고유 영웅 카드와 40부작 공식 판타지 웹소설·웹게임·웹툰·애니메이션 시네마가 유기적으로 연결된 차세대 웹 카드 게임입니다.',
              'SNSHero is a next-gen web card game seamlessly connecting 110 unique hero cards with a 40-episode official fantasy web novel, web game, webtoon, and anime cinema.',
              'SNSHeroは、110種の固有英雄カードと全40話の公式ファンタジーWeb小説・Webゲーム・Webtoon・アニメシネマが有機的に連動する次世代Webカードゲームです。'
            )}
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
                ${t('home_squad_title', '대표 출격 덱 5인 스쿼드')}
              </h2>
              <div class="text-xs text-stone-600">
                ${t('home_squad_cp', '출격 덱 종합 전투력:')} <strong class="text-base font-black text-[#201d1d]">${deckTP} CP</strong> (${deckTP} TP)
              </div>
            </div>

            <div class="flex items-center gap-3">
              ${winStreak > 0 ? `
                <div class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm border border-[#201d1d]" title="${winStreak} ${tr('연승 질주 중!', 'Win Streak!', '連勝中！')}">
                  <span class="text-amber-400">🔥</span>
                  <span>${winStreak}${tr('연승 질주', ' Win Streak', '連勝中')}</span>
                </div>
              ` : `
                <div class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm border border-[#201d1d]" title="🔥 ${tr('7연승 도전 중!', '7-Win Streak Challenge!', '7連勝挑戦中！')}">
                  <span class="text-amber-400">🔥</span>
                  <span>${tr('7연승 도전 중', '7-Win Challenge', '7連勝挑戦中')}</span>
                </div>
              `}
              <a
                href="#deck"
                data-nav="deck"
                class="px-4 py-2 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm hover:opacity-90 transition-opacity min-h-[44px] flex items-center justify-center cursor-pointer no-underline"
                aria-label="${t('home_edit_deck', '[덱 편집]')}"
              >
                ${t('home_edit_deck', '[덱 편집]')}
              </a>
            </div>
          </div>

          <!-- Fan-Folded 5 Cards Display Stage (Original TCG Card Design) -->
          <div id="home-squad-fan" class="squad-fan-container relative h-72 sm:h-80 md:h-96 w-full flex items-center justify-center overflow-visible select-none my-6" role="group" aria-label="${tr('출격 덱 5장 부채꼴 미리보기', '5-Card Squad Fan Preview', '出撃デッキ5枚プレビュー')}">
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
                  aria-label="${asset.nameKo} (${index + 1}/5)"
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
              ${tr(
                '출격 덱 카드(-12°~+12° 부채꼴 배치). 카드를 클릭하면 7등신 풀바디 비주얼과 4방향 스탯을 상세 검사할 수 있습니다.',
                'Active squad cards (-12° to +12° fan layout). Click any card to inspect its 7-head full-body artwork and 4-way directional stats.',
                '出撃デッキカード（-12°〜+12°扇形配置）。カードをクリックすると7頭身全身イラストと4方向ステータスを詳細確認できます。'
              )}
            </div>

            <!-- Original Style Media Shortcuts Grid -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-3xl mx-auto w-full pt-1">
              <a
                href="#book"
                data-nav="book"
                class="min-h-[44px] px-3 py-2.5 bg-[#201d1d] hover:bg-[#302c2c] text-[#fdfcfc] font-bold text-xs sm:text-sm rounded-sm border border-[#201d1d] flex items-center justify-center gap-1.5 transition-colors no-underline cursor-pointer shadow-sm"
                aria-label="${tr('공식 웹소설 바로가기', 'Official Web Novel', '公式Web小説')}"
              >
                <span>📜 ${tr('공식 웹소설', 'Web Novel', '公式Web小説')}</span>
                <span class="text-[10px] text-amber-300 font-normal">[${tr('40화', '40 Eps', '全40話')}]</span>
              </a>

              <a
                href="#webtoon"
                data-nav="webtoon"
                class="min-h-[44px] px-3 py-2.5 bg-[#201d1d] hover:bg-[#302c2c] text-[#fdfcfc] font-bold text-xs sm:text-sm rounded-sm border border-[#201d1d] flex items-center justify-center gap-1.5 transition-colors no-underline cursor-pointer shadow-sm"
                aria-label="${tr('공식 웹툰 바로가기', 'Official Webtoon', '公式Webtoon')}"
              >
                <span>🎨 ${tr('공식 웹툰', 'Webtoon', '公式Webtoon')}</span>
                <span class="text-[10px] text-emerald-300 font-normal">[${tr('840컷', '840 Cuts', '840カット')}]</span>
              </a>

              <a
                href="#play"
                data-nav="play"
                class="min-h-[44px] px-3 py-2.5 bg-[#fdfcfc] hover:bg-[#f1eeee] text-[#201d1d] font-bold text-xs sm:text-sm rounded-sm border border-[rgba(15,0,0,0.12)] flex items-center justify-center gap-1.5 transition-colors no-underline cursor-pointer"
                aria-label="${tr('AI 전술 카드배틀 플레이 바로가기', 'AI Tactical Card Battle', 'AI戦術カードバトル')}"
              >
                <span>⚔️ ${tr('AI 카드배틀', 'AI Card Battle', 'AIカードバトル')}</span>
              </a>

              <a
                href="#shop"
                data-nav="shop"
                class="min-h-[44px] px-3 py-2.5 bg-[#fdfcfc] hover:bg-[#f1eeee] text-[#201d1d] font-bold text-xs sm:text-sm rounded-sm border border-[rgba(15,0,0,0.12)] flex items-center justify-center gap-1.5 transition-colors no-underline cursor-pointer"
                aria-label="${tr('카드상점 바로가기', 'Card Shop', 'カードショップ')}"
              >
                <span>🛒 ${tr('카드 상점', 'Card Shop', 'カードショップ')}</span>
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
              <span class="text-[11px] text-[#646262] font-bold uppercase tracking-wider">${tr('공식 스토리 &amp; 연재 채널', 'Official Story &amp; Serialization Channels', '公式ストーリー＆連載チャンネル')}</span>
              <h2 class="text-lg sm:text-xl font-bold tracking-tight text-[#201d1d] m-0">${tr('눈히어로 40부작 웹소설 &amp; 웹툰 바로가기', 'SNSHero 40-Episode Web Novel &amp; Webtoon Hub', 'SNSHero 全40話 Web小説＆Webtoon')}</h2>
            </div>
            <div class="text-xs text-stone-500 font-mono">
              ${tr('매주 연재 업데이트 진행 중', 'Weekly Serialization Updates', '毎週連載アップデート中')}
            </div>
          </div>

          <!-- 4 Core Showcase Cards Grid: 공식 웹소설(#book), 공식 웹툰(#webtoon), 네이버 웹소설, 네이버 웹툰 -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <!-- Card 1: Official Web Novel (#book) -->
            <div class="border-2 border-[#201d1d] bg-[#f8f7f7] p-6 rounded-none flex flex-col justify-between space-y-4 shadow-sm">
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-[#201d1d]">${tr('눈히어로 웹소설', 'SNSHero Web Novel', 'SNSHero Web小説')}</span>
                  <span class="px-2 py-0.5 bg-amber-500 text-stone-950 text-[10px] font-black rounded-sm tracking-wider">
                    [${tr('40화 전편', 'All 40 Eps', '全40話収録')}]
                  </span>
                </div>
                <h3 class="text-sm font-bold text-[#201d1d] m-0">${tr('눈히어로.com - 카단의 여정', "SNSHero.com - Kadan's Journey", 'SNSHero.com - カダンの旅')}</h3>
                <p class="text-xs text-stone-600 leading-relaxed m-0">
                  ${tr(
                    '평범한 청년 카단이 아케인 대륙 11개 종족을 모험하며 힘을 일깨우는 40부작 정통 판타지 대서사시.',
                    'A 40-episode authentic fantasy epic following young Kadan as he journeys across the 11 factions of the Arcane Continent.',
                    '青年カダンがアルケイン大陸の11種族を巡り、真の力を覚醒させる全40話の本格ファンタジー大叙事詩。'
                  )}
                </p>
              </div>
              <a
                href="#book"
                data-nav="book"
                class="w-full py-3 px-4 bg-[#201d1d] text-[#fdfcfc] hover:bg-[#302c2c] text-center text-xs font-bold rounded-sm min-h-[44px] transition-colors no-underline flex items-center justify-center cursor-pointer"
              >
                📜 ${tr('웹소설 읽으러 가기 →', 'Read Web Novel →', 'Web小説を読む →')}
              </a>
            </div>

            <!-- Card 2: Official Webtoon (#webtoon) -->
            <div class="border-2 border-[#201d1d] bg-[#f8f7f7] p-6 rounded-none flex flex-col justify-between space-y-4 shadow-sm">
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-[#201d1d]">${tr('눈히어로 웹툰', 'SNSHero Webtoon', 'SNSHero Webtoon')}</span>
                  <span class="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-black rounded-sm tracking-wider">
                    [${tr('840컷+ 뷰어', '840+ Cuts', '840カット+')}]
                  </span>
                </div>
                <h3 class="text-sm font-bold text-[#201d1d] m-0">${tr('카단의 여정 비주얼 코믹스', "Kadan's Journey Visual Comics", 'カダンの旅 ビジュアルコミックス')}</h3>
                <p class="text-xs text-stone-600 leading-relaxed m-0">
                  ${tr(
                    '840컷 이상의 고해상도 풀컬러 다크 판타지 컷씬과 캐릭터 대사, 타격 SFX가 살아있는 비주얼 웹툰.',
                    'Visual webtoon featuring 840+ high-res full-color dark fantasy panels, character dialogues, and dynamic combat SFX.',
                    '840カット以上の高解像度フルカラー・ダークファンタジー演出とセリフ、迫力の効果音が蘇るビジュアルWebtoon。'
                  )}
                </p>
              </div>
              <a
                href="#webtoon"
                data-nav="webtoon"
                class="w-full py-3 px-4 bg-[#201d1d] text-[#fdfcfc] hover:bg-[#302c2c] text-center text-xs font-bold rounded-sm min-h-[44px] transition-colors no-underline flex items-center justify-center cursor-pointer"
              >
                🎨 ${tr('웹툰 보러 가기 →', 'Read Webtoon →', 'Webtoonを見る →')}
              </a>
            </div>

            <!-- Card 3: Naver Web Novel -->
            <div class="border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-6 rounded-none flex flex-col justify-between space-y-4">
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-[#201d1d]">${tr('네이버 웹소설', 'Naver Web Novel', 'NAVER Web小説')}</span>
                  <span class="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-sm tracking-wider">
                    [${tr('절찬 연재중', 'Serializing', '好評連載中')}]
                  </span>
                </div>
                <h3 class="text-sm font-bold text-[#201d1d] m-0">${tr('카단과 아케인 에코즈', 'Kadan &amp; Arcane Echoes', 'カダンとアルケイン・エコーズ')}</h3>
                <p class="text-xs text-stone-600 leading-relaxed m-0">
                  ${tr(
                    '네이버 챌린지 리그 공식 연재관. 눈보라 치는 설산의 맹세부터 새벽의 성채까지 이어지는 정통 웹소설.',
                    'Official Naver Challenge League series. From the vows beneath the blizzard to the Citadel of Dawn.',
                    'NAVERチャレンジリーグ公式連載。吹雪の誓いから夜明けの城砦へと続く本格ファンタジー小説。'
                  )}
                </p>
              </div>
              <a
                href="${EXTERNAL_LINKS.naverNovel}"
                data-url="http://novel.naver.com/challenge/list?novelId=1250635"
                target="_blank"
                rel="noopener noreferrer"
                class="w-full py-3 px-4 bg-[#fdfcfc] hover:bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-center text-xs font-bold rounded-sm min-h-[44px] transition-colors no-underline flex items-center justify-center"
              >
                ${tr('네이버 웹소설 ↗', 'Naver Web Novel ↗', 'NAVER Web小説 ↗')}
              </a>
            </div>

            <!-- Card 4: Naver Webtoon -->
            <div class="border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-6 rounded-none flex flex-col justify-between space-y-4">
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-[#201d1d]">${tr('네이버 웹툰', 'Naver Webtoon', 'NAVER Webtoon')}</span>
                  <span class="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-sm tracking-wider">
                    [${tr('절찬 연재중', 'Serializing', '好評連載中')}]
                  </span>
                </div>
                <h3 class="text-sm font-bold text-[#201d1d] m-0">${tr('SNS히어로 레볼루션 웹툰', 'SNSHero Revolution Webtoon', 'SNSHero レボリューション Webtoon')}</h3>
                <p class="text-xs text-stone-600 leading-relaxed m-0">
                  ${tr(
                    '네이버 도전만화 공식 연재관. 다이나믹 컷씬과 타격 효과음이 살아있는 비주얼 코믹스.',
                    'Official Naver Challenge Comics series featuring dynamic cutscenes and striking visual effects.',
                    'NAVERチャレンジ漫画公式連載。ダイナミックなカットシーンと迫力の効果音が魅力のコミックス。'
                  )}
                </p>
              </div>
              <a
                href="${EXTERNAL_LINKS.naverWebtoon}"
                data-url="https://comic.naver.com/challenge/list?titleId=856677"
                target="_blank"
                rel="noopener noreferrer"
                class="w-full py-3 px-4 bg-[#fdfcfc] hover:bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-center text-xs font-bold rounded-sm min-h-[44px] transition-colors no-underline flex items-center justify-center"
              >
                ${tr('네이버 웹툰 ↗', 'Naver Webtoon ↗', 'NAVER Webtoon ↗')}
              </a>
            </div>
          </div>
        </div>
      </section>


      <!-- 6. Card Inspect Modal Overlay (Opened on fan card click) -->
      ${inspectedId && inspectedAsset && inspectedStats ? `
        <div
          id="home-card-inspect-modal"
          class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 font-mono select-none"
          role="dialog"
          aria-modal="true"
          aria-labelledby="home-card-inspect-title"
        >
          <!-- Dedicated Backdrop Overlay Sibling -->
          <div
            id="home-card-inspect-backdrop"
            data-action="close-home-card-inspect"
            class="fixed inset-0 bg-black/70 backdrop-blur-xs cursor-pointer transition-opacity"
            aria-hidden="true"
          ></div>

          <!-- Modal Dialog Content Box (Fixed max-h, flex column, overflow-hidden) -->
          <div class="relative z-10 w-full max-w-lg bg-[#fdfcfc] text-[#201d1d] border border-[#201d1d] shadow-2xl rounded-none flex flex-col max-h-[90dvh] overflow-hidden">
            <!-- Fixed Modal Header -->
            <div class="flex items-center justify-between p-4 sm:p-5 border-b border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] shrink-0">
              <div class="pr-2 space-y-1">
                <span class="inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded-sm" style="background-color: ${inspectedFactionStyle?.bg}; color: ${inspectedFactionStyle?.text};">
                  ${inspectedAsset.faction} · ${inspectedAsset.rarity}
                </span>
                <h3 id="home-card-inspect-title" class="text-base sm:text-lg font-black text-[#201d1d] m-0">
                  [${inspectedAsset.code}] ${inspectedAsset.nameKo} <span class="text-xs font-normal text-stone-500">(${inspectedAsset.nameEn})</span>
                </h3>
              </div>

              <!-- Close [x] Button (Always visible at top-right) -->
              <button
                type="button"
                data-action="close-home-card-inspect"
                class="min-h-[44px] min-w-[44px] px-3 py-2 flex items-center justify-center bg-[#201d1d] text-[#fdfcfc] hover:bg-stone-800 text-xs font-bold rounded-sm cursor-pointer shrink-0 transition-colors"
                aria-label="${tr('닫기', 'Close', '閉じる')}"
              >
                [x] ${tr('닫기', 'Close', '閉じる')}
              </button>
            </div>

            <!-- Scrollable Content Body (Smooth scroll on mobile viewports) -->
            <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <!-- Card Original TCG & Cutout Dual Preview -->
              <div class="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                <div class="w-32 sm:w-44 shrink-0 mx-auto">
                  ${renderOriginalCardHtml(inspectedId, {
                    isOwned: true,
                    level: inspectedStats.level,
                    hideStats: false,
                    className: 'w-full aspect-[5/7]',
                    visualTier: '7head',
                  })}
                </div>
                <div class="w-full flex-1 h-44 sm:h-56 bg-[#f8f7f7] border border-[rgba(15,0,0,0.08)] flex items-center justify-center p-2 overflow-hidden">
                  <img
                    src="${inspectedAsset.cutoutUrl}"
                    alt="${inspectedAsset.nameKo}"
                    class="max-h-full max-w-full object-contain filter drop-shadow-none"
                    loading="eager"
                    onerror="this.src='${inspectedAsset.bustPngUrl}'; this.onerror=null;"
                  />
                </div>
              </div>

              <!-- Compass Stats & Level -->
              <div class="grid grid-cols-4 gap-2 text-center text-xs">
                <div class="p-2 bg-[#f8f7f7] border border-[rgba(15,0,0,0.08)]">
                  <div class="text-[10px] text-stone-500 font-bold">${tr('북 (N)', 'North (N)', '北 (N)')}</div>
                  <div class="text-base font-black text-[#201d1d]">${inspectedStats.top}</div>
                </div>
                <div class="p-2 bg-[#f8f7f7] border border-[rgba(15,0,0,0.08)]">
                  <div class="text-[10px] text-stone-500 font-bold">${tr('동 (E)', 'East (E)', '東 (E)')}</div>
                  <div class="text-base font-black text-[#201d1d]">${inspectedStats.right}</div>
                </div>
                <div class="p-2 bg-[#f8f7f7] border border-[rgba(15,0,0,0.08)]">
                  <div class="text-[10px] text-stone-500 font-bold">${tr('남 (S)', 'South (S)', '南 (S)')}</div>
                  <div class="text-base font-black text-[#201d1d]">${inspectedStats.bottom}</div>
                </div>
                <div class="p-2 bg-[#f8f7f7] border border-[rgba(15,0,0,0.08)]">
                  <div class="text-[10px] text-stone-500 font-bold">${tr('서 (W)', 'West (W)', '西 (W)')}</div>
                  <div class="text-base font-black text-[#201d1d]">${inspectedStats.left}</div>
                </div>
              </div>

              <!-- Ability & TP Summary -->
              <div class="p-3 bg-[#f8f7f7] border border-[rgba(15,0,0,0.08)] space-y-1 text-xs">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-[#201d1d]">${tr('고유 스킬:', 'Special Skill:', '固有スキル:')}</span>
                  <span class="font-black text-[#201d1d]">${inspectedStats.totalTP} TP</span>
                </div>
                <div class="text-stone-600">
                  ${
                    getCurrentLanguage() === 'ko'
                      ? (inspectedDb as any)?.ability?.description_ko || '기본 전술 능력: 표준 전장 배치'
                      : (inspectedDb as any)?.ability?.description_en ||
                        tr('기본 전술 능력: 표준 전장 배치', 'Standard Tactical Deployment', '基本戦術能力：標準戦場配置')
                  }
                </div>
              </div>
            </div>

            <!-- Fixed Modal Footer (Always visible at bottom) -->
            <div class="p-3 sm:p-4 bg-[#f8f7f7] border-t border-[rgba(15,0,0,0.12)] shrink-0 flex flex-wrap items-center gap-2">
              <button
                type="button"
                data-nav="card"
                class="flex-1 py-3 px-4 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm min-h-[44px] hover:opacity-90 transition-opacity flex items-center justify-center cursor-pointer"
              >
                ${tr('카드 육성 바로가기 →', 'Go to Card Nurture →', 'カード育成へ移動 →')}
              </button>
              <button
                type="button"
                data-nav="deck"
                class="py-3 px-4 bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm min-h-[44px] hover:bg-[#e8e5e5] transition-colors flex items-center justify-center cursor-pointer"
              >
                ${tr('마이덱 편집 →', 'Edit My Deck →', 'マイデッキ編集 →')}
              </button>
              <button
                type="button"
                data-action="close-home-card-inspect"
                class="py-3 px-4 bg-white text-stone-700 border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm min-h-[44px] hover:bg-stone-100 transition-colors flex items-center justify-center cursor-pointer"
              >
                ${tr('닫기', 'Close', '閉じる')}
              </button>
            </div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}
