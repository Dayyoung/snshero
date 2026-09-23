import React, { createContext, useContext, useState, useEffect } from 'react';
import { PlayerProfile, OwnedCard, CardItem } from '../types';
import { ALL_CARDS, CARDS_BY_ID, STARTER_CARD_IDS } from '../data/cards';
import { sound } from '../utils/audio';

interface GameContextType {
  profile: PlayerProfile;
  activeDeckCards: { owned: OwnedCard; card: CardItem }[];
  allOwnedCardsDetailed: { owned: OwnedCard; card: CardItem }[];
  drawGacha: (count: number, useTicket?: boolean) => CardItem[];
  setDeck: (instanceIds: string[]) => void;
  upgradeCard: (instanceId: string) => boolean;
  claimDailyReward: () => boolean;
  recordBattleResult: (won: boolean, pointsReward: number, expReward: number) => void;
  resetAccount: () => void;
  toggleSound: () => void;
  setLanguage: (lang: 'ko' | 'en' | 'ja' | 'zh-CN') => void;
  simulateCryptoPayment: (currency: 'btc' | 'eth' | 'usdc', amount: number, pointsBonus: number) => void;
}

const STORAGE_KEY = 'snshero_revolution_profile_v2';

const createDefaultProfile = (): PlayerProfile => {
  const initialCards: OwnedCard[] = STARTER_CARD_IDS.map((cardId, idx) => ({
    instanceId: `inst_${Date.now()}_${idx}`,
    cardId: cardId,
    level: 1,
    exp: 0,
    skillLevel: 1,
    stars: 1,
    obtainedAt: Date.now(),
  }));

  return {
    id: `hero_user_${Math.random().toString(36).substring(2, 9)}`,
    username: 'SNS 마스터',
    level: 1,
    exp: 0,
    points: 1000, // 1,000 SNS Points starting reward as described
    gachaTickets: 100, // 100 Free Draw benefit
    cryptoBalances: {
      btc: 0.05,
      eth: 0.8,
      usdc: 150,
    },
    battleRating: 1000,
    wins: 0,
    losses: 0,
    deckCardIds: initialCards.slice(0, 5).map(c => c.instanceId),
    ownedCards: initialCards,
    dailyRewardClaimedDate: '',
    soundEnabled: true,
    sfxVolume: 0.6,
    bgmVolume: 0.5,
    language: 'ko',
  };
};

const GameContext = createContext<GameContextType | null>(null);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<PlayerProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.ownedCards) && parsed.ownedCards.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return createDefaultProfile();
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // Ignore
    }
  }, [profile]);

  useEffect(() => {
    sound.setEnabled(profile.soundEnabled);
    sound.setVolume(profile.sfxVolume);
  }, [profile.soundEnabled, profile.sfxVolume]);

  // Compute active deck cards
  const activeDeckCards = profile.deckCardIds
    .map(instId => {
      const owned = profile.ownedCards.find(c => c.instanceId === instId);
      if (!owned) return null;
      const card = CARDS_BY_ID[owned.cardId];
      if (!card) return null;
      return { owned, card };
    })
    .filter((item): item is { owned: OwnedCard; card: CardItem } => item !== null);

  // Compute all owned cards with full details
  const allOwnedCardsDetailed = profile.ownedCards
    .map(owned => {
      const card = CARDS_BY_ID[owned.cardId];
      return card ? { owned, card } : null;
    })
    .filter((item): item is { owned: OwnedCard; card: CardItem } => item !== null);

  const drawGacha = (count: number, useTicket: boolean = true): CardItem[] => {
    const cost = 100 * count; // 100 points per draw

    if (useTicket) {
      if (profile.gachaTickets < count) {
        if (profile.points < cost) return [];
      }
    } else {
      if (profile.points < cost) return [];
    }

    const drawnCards: CardItem[] = [];
    const newOwned: OwnedCard[] = [];

    for (let i = 0; i < count; i++) {
      // Weighted random pick for gacha
      const roll = Math.random() * 100;
      let targetGrade = 'N';
      if (roll < 3) targetGrade = 'UR';
      else if (roll < 12) targetGrade = 'SSR';
      else if (roll < 30) targetGrade = 'SR';
      else if (roll < 65) targetGrade = 'R';
      else targetGrade = 'N';

      const pool = ALL_CARDS.filter(c => c.grade === targetGrade);
      const chosen = pool.length > 0
        ? pool[Math.floor(Math.random() * pool.length)]
        : ALL_CARDS[Math.floor(Math.random() * ALL_CARDS.length)];

      drawnCards.push(chosen);
      newOwned.push({
        instanceId: `inst_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${i}`,
        cardId: chosen.id,
        level: 1,
        exp: 0,
        skillLevel: 1,
        stars: chosen.grade === 'UR' ? 3 : chosen.grade === 'SSR' ? 2 : 1,
        obtainedAt: Date.now(),
      });
    }

    setProfile(prev => {
      let nextTickets = prev.gachaTickets;
      let nextPoints = prev.points;

      if (useTicket && prev.gachaTickets >= count) {
        nextTickets -= count;
      } else {
        nextPoints -= cost;
      }

      return {
        ...prev,
        points: Math.max(0, nextPoints),
        gachaTickets: Math.max(0, nextTickets),
        ownedCards: [...prev.ownedCards, ...newOwned],
      };
    });

    sound.playGachaOpen();
    return drawnCards;
  };

  const setDeck = (instanceIds: string[]) => {
    setProfile(prev => ({
      ...prev,
      deckCardIds: instanceIds.slice(0, 5),
    }));
    sound.playClick();
  };

  const upgradeCard = (instanceId: string): boolean => {
    const target = profile.ownedCards.find(c => c.instanceId === instanceId);
    if (!target) return false;

    const upgradeCost = target.level * 150;
    if (profile.points < upgradeCost) return false;

    setProfile(prev => ({
      ...prev,
      points: prev.points - upgradeCost,
      ownedCards: prev.ownedCards.map(c => {
        if (c.instanceId === instanceId) {
          return {
            ...c,
            level: c.level + 1,
            skillLevel: (c.level + 1) % 5 === 0 ? c.skillLevel + 1 : c.skillLevel,
          };
        }
        return c;
      }),
    }));

    sound.playSkill();
    return true;
  };

  const claimDailyReward = (): boolean => {
    const today = new Date().toISOString().split('T')[0];
    if (profile.dailyRewardClaimedDate === today) {
      return false;
    }

    setProfile(prev => ({
      ...prev,
      points: prev.points + 500,
      gachaTickets: prev.gachaTickets + 5,
      dailyRewardClaimedDate: today,
    }));

    sound.playVictory();
    return true;
  };

  const recordBattleResult = (won: boolean, pointsReward: number, expReward: number) => {
    setProfile(prev => {
      const nextExp = prev.exp + expReward;
      const neededExp = prev.level * 100;
      const leveledUp = nextExp >= neededExp;
      const newLevel = leveledUp ? prev.level + 1 : prev.level;
      const finalExp = leveledUp ? nextExp - neededExp : nextExp;

      return {
        ...prev,
        level: newLevel,
        exp: finalExp,
        points: prev.points + pointsReward,
        battleRating: won ? prev.battleRating + 25 : Math.max(500, prev.battleRating - 15),
        wins: won ? prev.wins + 1 : prev.wins,
        losses: won ? prev.losses : prev.losses + 1,
      };
    });
  };

  const resetAccount = () => {
    localStorage.removeItem(STORAGE_KEY);
    setProfile(createDefaultProfile());
    sound.playClick();
  };

  const toggleSound = () => {
    setProfile(prev => ({
      ...prev,
      soundEnabled: !prev.soundEnabled,
    }));
  };

  const setLanguage = (lang: 'ko' | 'en' | 'ja' | 'zh-CN') => {
    setProfile(prev => ({
      ...prev,
      language: lang,
    }));
  };

  const simulateCryptoPayment = (currency: 'btc' | 'eth' | 'usdc', amount: number, pointsBonus: number) => {
    setProfile(prev => {
      const balance = prev.cryptoBalances[currency];
      if (balance < amount) return prev;
      return {
        ...prev,
        points: prev.points + pointsBonus,
        cryptoBalances: {
          ...prev.cryptoBalances,
          [currency]: +(balance - amount).toFixed(4),
        },
      };
    });
    sound.playVictory();
  };

  return (
    <GameContext.Provider
      value={{
        profile,
        activeDeckCards,
        allOwnedCardsDetailed,
        drawGacha,
        setDeck,
        upgradeCard,
        claimDailyReward,
        recordBattleResult,
        resetAccount,
        toggleSound,
        setLanguage,
        simulateCryptoPayment,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
};
