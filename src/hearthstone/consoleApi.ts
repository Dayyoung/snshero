import { CLASSIC_PRESET_DECKS, CLASSIC_RANK_NAMES, cardDb } from './cardDb';
import { hsStorage } from './storage';
import { CLASSIC_HEROES, HERO_CLASS_ORDER, HeroClass } from './types';

export interface SnsHeroConsoleApi {
  help: () => string;
  unlockAll: () => { unlockedCards: number; gold: number; arcaneDust: number; packs: number };
  addGold: (amount?: number) => number;
  addDust: (amount?: number) => number;
  addPacks: (count?: number) => number;
  setRank: (rank?: number, stars?: number) => { rank: number; rankTitle: string; stars: number };
  completeQuests: () => { goldEarned: number };
  verifyRoster: () => {
    totalCollectible: number;
    classBreakdown: Record<string, { factionKo: string; heroKo: string; cardCount: number; uniqueChars: number }>;
    neutralTotal: number;
    neutralUniqueChars: number;
    neutralExtraRobot: number;
    neutralExtraDragon: number;
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
        '  snshero.unlockAll()         : 382종 전체 카드 해금 + 1,000골드 + 1,600가루 + 10팩 지급',
        '  snshero.addGold(1000)       : 골드 지급 (기본 1,000)',
        '  snshero.addDust(1600)       : 영웅 가루 지급 (기본 1,600)',
        '  snshero.addPacks(10)        : 눈히어로 카드 팩 지급 (기본 10팩)',
        '  snshero.setRank(0, 1)       : 등급 변경 (25~1등급, 0 = 전설의 눈히어로)',
        '  snshero.completeQuests()    : 오늘의 의뢰 전체 완료 및 보상 지급',
        '  snshero.verifyRoster()      : 382종 카드 ↔ 110종족/로봇/용 배정 및 9개 기본 덱 무결성 검증',
        '  snshero.engineInfo()        : 전투 엔진 상수 및 로컬스토리지 상태 조회',
        '  snshero.reset()             : 프로필·도감·덱·의뢰 데이터 초기화',
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
        `%c[눈히어로 콘솔] 382종 전체 카드 해금 완료! (보유 골드: ${p.gold}, 가루: ${p.arcaneDust}, 개봉 대기 팩: ${p.packs})`,
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
        { factionKo: string; heroKo: string; cardCount: number; uniqueChars: number }
      > = {};

      for (const cls of HERO_CLASS_ORDER) {
        const hero = CLASSIC_HEROES[cls as HeroClass];
        const cards = all.filter((c) => c.cardClass === cls);
        const uniq = new Set(cards.map((c) => c.snsCharId)).size;
        classBreakdown[cls] = {
          factionKo: hero.classNameKo,
          heroKo: hero.nameKo,
          cardCount: cards.length,
          uniqueChars: uniq,
        };
      }

      const neutral = all.filter((c) => c.cardClass === 'NEUTRAL');
      const charCounts = new Map<number, number>();
      for (const c of neutral) {
        const cid = c.snsCharId || 0;
        charCounts.set(cid, (charCounts.get(cid) || 0) + 1);
      }
      let extraRobot = 0;
      let extraDragon = 0;
      for (let cid = 91; cid <= 100; cid += 1) {
        extraRobot += Math.max(0, (charCounts.get(cid) || 0) - 1);
      }
      for (let cid = 101; cid <= 110; cid += 1) {
        extraDragon += Math.max(0, (charCounts.get(cid) || 0) - 1);
      }

      const presetDecks = hsStorage.getDecks().map((d) => d.name);
      console.table(classBreakdown);
      console.info('[눈히어로 콘솔] 중립 카드 배정:', {
        neutralTotal: neutral.length,
        neutralUniqueChars: charCounts.size,
        neutralExtraRobot: extraRobot,
        neutralExtraDragon: extraDragon,
        presetDecks,
      });

      return {
        totalCollectible: all.length,
        classBreakdown,
        neutralTotal: neutral.length,
        neutralUniqueChars: charCounts.size,
        neutralExtraRobot: extraRobot,
        neutralExtraDragon: extraDragon,
        presetDecks,
      };
    },

    engineInfo() {
      const profile = hsStorage.getProfile();
      const ownedUnique = Object.keys(hsStorage.getCollection()).filter(
        (k) => (hsStorage.getCollection()[k] || 0) > 0,
      ).length;
      const info = {
        edition: '2.0.0-SNSHERO-KADAN-koKR',
        collectibleCards: cardDb.getAllCollectible().length,
        ownedUniqueCards: ownedUnique,
        presetDeckCount: CLASSIC_PRESET_DECKS.length,
        turnDurationSeconds: 75,
        ropeFuseSeconds: 15,
        maxHandSize: 10,
        maxBoardMinions: 7,
        maxManaCrystals: 10,
        deckSize: 30,
        profile,
      };
      console.info('[눈히어로 콘솔] 엔진 및 저장소 상태:', info);
      return info;
    },

    reset() {
      hsStorage.resetAllData();
      console.info('%c[눈히어로 콘솔] 로컬스토리지 데이터가 초기 상태로 리셋되었습니다.', 'color:#f87171;font-weight:bold;');
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
