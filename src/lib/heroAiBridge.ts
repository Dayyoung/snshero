/**
 * SNSHero Revolution - AI Agent Global Bridge (`window.HeroAI` / `window.SNSHero`)
 * Exposes a standardized, headless-friendly programmatic interface for AI agents
 * (e.g. Browser Use, Puppeteer, Playwright, LLM Web Crawlers) to inspect game state and execute actions.
 */

import { CARD_DATABASE } from '../cardDatabase';

export interface HeroAiState {
  currentView: string;
  snsBalance: number;
  currentDeck: any[];
  totalPower: number;
  inventoryCount: number;
  winRate: string;
  season: string;
  language: string;
}

export function initHeroAiBridge() {
  if (typeof window === 'undefined') return;

  const bridge = {
    version: '2.1.0',
    spec: 'https://snshero.com/llms.txt',
    fullDoc: 'https://snshero.com/llms-full.txt',

    /**
     * Inspect entire game state from localStorage
     */
    getState: (): HeroAiState => {
      let sns = 0;
      let deck: any[] = [];
      let currentView = 'home';
      let stats = { wins: 0, losses: 0, draws: 0 };
      let inventory = {};
      let season = 'season1';
      let lang = 'ko';

      try {
        sns = Number(localStorage.getItem('hero_sns') || 0);
        const rawDeck = localStorage.getItem('hero_deck');
        if (rawDeck) deck = JSON.parse(rawDeck);
        const rawStats = localStorage.getItem('hero_stats');
        if (rawStats) stats = JSON.parse(rawStats);
        const rawInv = localStorage.getItem('hero_inventory');
        if (rawInv) inventory = JSON.parse(rawInv);
        season = localStorage.getItem('hero_current_season') || 'season1';
        lang = localStorage.getItem('hero_language') || 'ko';
      } catch {}

      const totalMatches = (stats.wins || 0) + (stats.losses || 0);
      const winRate = totalMatches > 0 ? `${Math.round(((stats.wins || 0) / totalMatches) * 100)}%` : '0%';
      const totalPower = deck.reduce((acc, c) => acc + (c.power || 0), 0);

      return {
        currentView,
        snsBalance: sns,
        currentDeck: deck,
        totalPower,
        inventoryCount: Object.keys(inventory).length,
        winRate,
        season,
        language: lang
      };
    },

    /**
     * Navigate to a target view (e.g. 'home', 'ranking', 'card-play', 'mydeck', 'shop', 'play', 'novel')
     */
    navigate: (viewName: string) => {
      window.dispatchEvent(new CustomEvent('snshero_navigate', { detail: viewName }));
      return { success: true, targetView: viewName };
    },

    /**
     * Query card database by filter
     */
    queryCards: (filter?: { element?: string; rarity?: string; search?: string }) => {
      return Object.values(CARD_DATABASE).filter(c => {
        if (!c) return false;
        if (filter?.element && c.element?.toLowerCase() !== filter.element.toLowerCase()) return false;
        if (filter?.rarity && c.rarity?.toLowerCase() !== filter.rarity.toLowerCase()) return false;
        if (filter?.search) {
          const s = filter.search.toLowerCase();
          const matchTitle = (c.title || '').toLowerCase().includes(s);
          const matchEn = (c.title_en || '').toLowerCase().includes(s);
          if (!matchTitle && !matchEn) return false;
        }
        return true;
      });
    },

    /**
     * Trigger quick ranking match
     */
    startRankBattle: () => {
      window.dispatchEvent(new CustomEvent('snshero_navigate', { detail: 'card-play' }));
      return { success: true, mode: 'card-play' };
    },

    /**
     * Trigger card summon in shop
     */
    triggerShopSummon: () => {
      try {
        localStorage.setItem('hero_auto_loop_mode', 'gacha_start');
      } catch {}
      window.dispatchEvent(new CustomEvent('snshero_navigate', { detail: 'shop' }));
      return { success: true, status: 'gacha_start' };
    }
  };

  // Mount on global window object
  (window as any).HeroAI = bridge;
  (window as any).SNSHero = bridge;
}
