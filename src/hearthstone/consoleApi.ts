import { hsAudio } from './audio';
import { CLASSIC_PRESET_DECKS, CLASSIC_RANK_NAMES, cardDb } from './cardDb';
import { getJourneyCardMultiplier, hsStorage } from './storage';
import { CLASSIC_HEROES, HERO_CLASS_ORDER, HeroClass } from './types';

export interface SnsHeroConsoleApi {
  help: () => string;
  unlockAll: () => { unlockedCards: number; gold: number; arcaneDust: number; packs: number };
  addGold: (amount?: number) => number;
  addDust: (amount?: number) => number;
  addPacks: (count?: number) => number;
  setRank: (rank?: number, stars?: number) => { rank: number; rankTitle: string; stars: number };
  setJourney: (
    episode?: number,
    reincarnation?: number,
  ) => { journeyEpisode: number; journeyReincarnation: number };
  addCardCopies: (
    cardId: string,
    copies?: number,
  ) => { cardId: string; cardName: string; owned: number; journeyMultiplier: number };
  completeQuests: () => { goldEarned: number };
  verifyRoster: () => {
    totalCollectible: number;
    uniqueArtUrls: number;
    uniqueCharacters: number;
    classBreakdown: Record<
      string,
      { factionKo: string; heroKo: string; cardCount: number; uniqueChars: number; uniqueArts: number }
    >;
    neutralTotal: number;
    neutralUniqueChars: number;
    neutralUniqueArts: number;
    presetDecks: string[];
  };
  engineInfo: () => Record<string, unknown>;
  reset: () => string;
}

declare global {
  interface Window {
    snshero?: SnsHeroConsoleApi;
    noonhero?: SnsHeroConsoleApi;
  }
}

let initialized = false;

export function initSnsHeroConsoleApi(): void {
  if (typeof window === 'undefined' || initialized) return;
  initialized = true;

  const api: SnsHeroConsoleApi = {
    help() {
      const guide = [
        '================ [눈히어로: 카단의 여정 — DevTools Console 테스트 명령어] ================',
        '  snshero.unlockAll()              : 382종 전체 카드 각 3장(3배 각성) 해금 + 1,000G + 1,600가루 + 10팩',
        '  snshero.addGold(1000)            : 골드 지급 (기본 1,000G)',
        '  snshero.addDust(1600)            : 영웅 가루 지급 (기본 1,600)',
        '  snshero.addPacks(10)             : 눈히어로 카드 팩 지급 (기본 10팩)',
        '  snshero.setJourney(15, 1)        : 카단의 여정 에피소드(1~40화) 및 환생 회차(0~) 즉시 이동',
        '  snshero.addCardCopies("CS2_189", 2): 특정 카드 보유 장수 추가 및 카단의 여정 배율(3장=3배) 확인',
        '  snshero.setRank(0, 1)            : 등급 변경 (25~1등급, 0 = 전설의 눈히어로)',
        '  snshero.completeQuests()         : 오늘의 의뢰 전체 완료 및 보상 지급',
        '  snshero.verifyRoster()           : 382종 카드 전수 고유 캐릭터·아트워크(종족별 25명 + 중립 157종) 무결성 검증',
        '  snshero.engineInfo()             : 전투 엔진 상수 및 로컬스토리지 상태 조회',
        '  snshero.reset()                  : 프로필·도감·덱·의뢰 데이터 초기화 (초기 3팩 & 첫 방문 가이드 복원)',
        '=========================================================================================',
      ].join('\n');
      console.info(`%c${guide}`, 'color:#38bdf8;font-weight:bold;line-height:1.5;');
      return '콘솔 명령어 안내가 출력되었습니다.';
    },

    unlockAll() {
      hsStorage.unlockMasterCollection();
      const p = hsStorage.getProfile();
      const total = cardDb.getAllCollectible().length;
      console.info(
        `%c[눈히어로 콘솔] 382종 전체 카드(각 3장·여정 3배 각성) 해금 완료! (보유 골드: ${p.gold}, 가루: ${p.arcaneDust}, 개봉 대기 팩: ${p.packs})`,
        'color:#fbbf24;font-weight:bold;',
      );
      return {
        unlockedCards: total,
        gold: p.gold,
        arcaneDust: p.arcaneDust,
        packs: p.packs,
      };
    },

    addGold(amount = 1000) {
      const p = hsStorage.getProfile();
      p.gold = Math.max(0, p.gold + Math.floor(amount));
      hsStorage.saveProfile(p);
      console.info(`%c[눈히어로 콘솔] 골드 변경 -> ${p.gold}G`, 'color:#fde047;font-weight:bold;');
      return p.gold;
    },

    addDust(amount = 1600) {
      const p = hsStorage.getProfile();
      p.arcaneDust = Math.max(0, p.arcaneDust + Math.floor(amount));
      hsStorage.saveProfile(p);
      console.info(`%c[눈히어로 콘솔] 영웅 가루 변경 -> ${p.arcaneDust}`, 'color:#67e8f9;font-weight:bold;');
      return p.arcaneDust;
    },

    addPacks(count = 10) {
      const p = hsStorage.getProfile();
      p.packs = Math.max(0, p.packs + Math.floor(count));
      hsStorage.saveProfile(p);
      console.info(`%c[눈히어로 콘솔] 보유 카드 팩 변경 -> ${p.packs}팩`, 'color:#c084fc;font-weight:bold;');
      return p.packs;
    },

    setRank(rank = 0, stars = 1) {
      const clampedRank = Math.max(0, Math.min(25, Math.floor(rank)));
      const p = hsStorage.getProfile();
      p.rank = clampedRank;
      p.stars = Math.max(0, Math.floor(stars));
      hsStorage.saveProfile(p);
      const rankTitle = CLASSIC_RANK_NAMES[clampedRank] || '엘윈마을 도전자';
      console.info(
        `%c[눈히어로 콘솔] 등급 변경 -> ${clampedRank === 0 ? rankTitle : `${clampedRank}등급 (${rankTitle})`}`,
        'color:#4ade80;font-weight:bold;',
      );
      return { rank: clampedRank, rankTitle, stars: p.stars };
    },

    setJourney(episode = 1, reincarnation = 0) {
      hsStorage.setJourneyProgress(episode, reincarnation);
      const p = hsStorage.getProfile();
      console.info(
        `%c[눈히어로 콘솔] 카단의 여정 진행도 변경 -> 환생 ${p.journeyReincarnation}회차 · 제${p.journeyEpisode}화`,
        'color:#34d399;font-weight:bold;',
      );
      return {
        journeyEpisode: p.journeyEpisode,
        journeyReincarnation: p.journeyReincarnation,
      };
    },

    addCardCopies(cardId: string, copies = 1) {
      const def = cardDb.getCard(cardId);
      if (!def) {
        console.warn(`[눈히어로 콘솔] 존재하지 않는 카드 ID입니다: ${cardId}`);
        return { cardId, cardName: '알 수 없음', owned: 0, journeyMultiplier: 1 };
      }
      hsStorage.addCardCopies(cardId, copies);
      const owned = hsStorage.getCollection()[cardId] || 0;
      const journeyMultiplier = getJourneyCardMultiplier(def, owned);
      console.info(
        `%c[눈히어로 콘솔] [${def.name}] 보유 장수 -> ${owned}장 (카단의 여정 전용 배율: ×${journeyMultiplier}배)`,
        'color:#34d399;font-weight:bold;',
      );
      return {
        cardId,
        cardName: def.name,
        owned,
        journeyMultiplier,
      };
    },

    completeQuests() {
      const g1 = hsStorage.recordQuestProgress('WIN', 99);
      const g2 = hsStorage.recordQuestProgress('MINION', 99);
      const g3 = hsStorage.recordQuestProgress('SPELL', 99);
      const total = g1 + g2 + g3;
      console.info(`%c[눈히어로 콘솔] 일일 의뢰 전체 완료! (+${total}G)`, 'color:#fbbf24;font-weight:bold;');
      return { goldEarned: total };
    },

    verifyRoster() {
      const all = cardDb.getAllCollectible();
      const classBreakdown: Record<
        string,
        { factionKo: string; heroKo: string; cardCount: number; uniqueChars: number; uniqueArts: number }
      > = {};

      for (const cls of HERO_CLASS_ORDER) {
        const hero = CLASSIC_HEROES[cls as HeroClass];
        const cards = all.filter((c) => c.cardClass === cls);
        const uniq = new Set(cards.map((c) => c.snsCharId)).size;
        const uniqArts = new Set(cards.map((c) => c.artUrl)).size;
        classBreakdown[cls] = {
          factionKo: hero.classNameKo,
          heroKo: hero.nameKo,
          cardCount: cards.length,
          uniqueChars: uniq,
          uniqueArts: uniqArts,
        };
      }

      const neutral = all.filter((c) => c.cardClass === 'NEUTRAL');
      const neutralUniqueChars = new Set(neutral.map((c) => c.snsCharId)).size;
      const neutralUniqueArts = new Set(neutral.map((c) => c.artUrl)).size;
      const uniqueArtUrls = new Set(all.map((c) => c.artUrl)).size;
      const uniqueCharacters = new Set(all.map((c) => c.snsCharId)).size;

      const presetDecks = hsStorage.getDecks().map((d) => d.name);
      console.table(classBreakdown);
      console.info('[눈히어로 콘솔] 382종 전수 고유 로스터 & 아트워크 배정:', {
        totalCollectible: all.length,
        uniqueArtUrls,
        uniqueCharacters,
        neutralTotal: neutral.length,
        neutralUniqueChars,
        neutralUniqueArts,
        presetDecks,
      });

      return {
        totalCollectible: all.length,
        uniqueArtUrls,
        uniqueCharacters,
        classBreakdown,
        neutralTotal: neutral.length,
        neutralUniqueChars,
        neutralUniqueArts,
        presetDecks,
      };
    },

    engineInfo() {
      const profile = hsStorage.getProfile();
      const ownedUnique = Object.keys(hsStorage.getCollection()).filter(
        (k) => (hsStorage.getCollection()[k] || 0) > 0,
      ).length;
      const info = {
        edition: '2.1.0-SNSHERO-KADAN-JOURNEY-koKR',
        collectibleCards: cardDb.getAllCollectible().length,
        ownedUniqueCards: ownedUnique,
        presetDeckCount: CLASSIC_PRESET_DECKS.length,
        turnDurationSeconds: 75,
        ropeFuseSeconds: 15,
        maxHandSize: 10,
        maxBoardMinions: 7,
        maxManaCrystals: 10,
        deckSize: 30,
        vibrateEnabled: hsAudio.getSettings().vibrateEnabled,
        vibrationSupport: hsAudio.getVibrationSupportInfo(),
        profile,
      };
      console.info('[눈히어로 콘솔] 엔진 및 저장소 상태:', info);
      return info;
    },

    reset() {
      hsStorage.resetAllData();
      console.info(
        '%c[눈히어로 콘솔] 로컬스토리지 데이터가 초기 상태(초기 3팩, 첫 방문 카단의 여정 손가락 가이드)로 리셋되었습니다.',
        'color:#f87171;font-weight:bold;',
      );
      return '초기화 완료';
    },
  };

  window.snshero = api;
  window.noonhero = api;
  console.info(
    '%c[눈히어로: 카단의 여정] 개발자 테스트 콘솔이 활성화되었습니다. 콘솔에 snshero.help() 또는 snshero.unlockAll() 을 입력하세요.',
    'color:#38bdf8;font-weight:bold;',
  );
}
