/**
 * Global WebMCP Tools for SNSHero
 * Available on all screens at all times.
 * Enables AI agents to navigate and query the game universe effortlessly.
 */

import { WebMcpToolDefinition } from './types';
import { CARD_DATABASE } from '../../cardDatabase';
import { ViewType } from '../../types';

export interface GlobalToolDependencies {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  language: string;
  setLanguage?: (lang: any) => void;
  lowSpecMode?: boolean;
  setLowSpecMode?: (enabled: boolean) => void;
  sns?: number;
  updateSns?: (amount: number, reason?: string) => void;
}

export function createGlobalWebMcpTools(deps: GlobalToolDependencies): WebMcpToolDefinition[] {
  const tools: WebMcpToolDefinition[] = [
    {
      name: 'navigate_to_screen',
      description: 'Navigate to any screen in SNSHero web game (e.g. home, ranking, card-play, mydeck, shop, game, stock-market, card-marketplace, community, prediction-market, companion, novel, setting, profile, etc.) without human interaction.',
      inputSchema: {
        type: 'object',
        properties: {
          screen: {
            type: 'string',
            description: 'Target screen identifier',
            enum: [
              'home',
              'ranking',
              'card-play',
              'mydeck',
              'shop',
              'game',
              'community',
              'reddit',
              'stock-market',
              'card-marketplace',
              'prediction-market',
              'companion',
              'skill',
              'status',
              'profile',
              'season-hub',
              'novel',
              'webtoon',
              'anime',
              'movie',
              'setting',
              'wiki',
              'world-codex',
              'guild-list',
              'guild-detail',
              'modoo',
              'policy-center'
            ]
          },
          reason: {
            type: 'string',
            description: 'Reason or agent intention for navigating to this screen'
          }
        },
        required: ['screen']
      },
      annotations: {
        readOnlyHint: false,
        consequentialHint: false
      },
      category: 'Navigation',
      execute: async ({ screen, reason }) => {
        const target = screen as ViewType;
        deps.onNavigate(target);
        return {
          success: true,
          previousScreen: deps.currentView,
          currentScreen: target,
          message: `Successfully navigated to screen [${target}]${reason ? ` for: ${reason}` : ''}.`
        };
      }
    },

    {
      name: 'get_game_state',
      description: 'Fetch complete real-time game state: current active screen, player SNS coins, active season, current deck stats, inventory summary, and profile info.',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      },
      annotations: {
        readOnlyHint: true
      },
      category: 'State',
      execute: async () => {
        let currentDeck: any[] = [];
        let cardInventoryCount = 0;
        let userName = 'HERO';
        let season = 'season1';

        try {
          userName = localStorage.getItem('hero_user_name') || 'HERO';
          season = localStorage.getItem('hero_current_season') || 'season1';
          const savedDeck = localStorage.getItem(`hero_current_deck_${season}`);
          if (savedDeck) {
            currentDeck = JSON.parse(savedDeck);
          }
          const savedInv = localStorage.getItem(`hero_card_inventory_${season}`);
          if (savedInv) {
            const parsed = JSON.parse(savedInv);
            cardInventoryCount = Object.keys(parsed).length;
          }
        } catch (e) {
          // ignore localstorage errors
        }

        const totalDeckPower = Array.isArray(currentDeck)
          ? currentDeck.reduce((acc, c) => acc + (c?.power || 0), 0)
          : 0;

        return {
          userName,
          currentScreen: deps.currentView,
          season,
          snsPoints: deps.sns ?? 0,
          deckCardCount: currentDeck.length,
          totalDeckPower,
          inventoryCardCount: cardInventoryCount,
          language: deps.language,
          lowSpecMode: Boolean(deps.lowSpecMode),
          timestamp: new Date().toISOString()
        };
      }
    },

    {
      name: 'get_available_screens',
      description: 'Retrieve a complete map of all SNSHero screens, their primary purpose, and recommended AI agent tasks so the agent can operate the game without manual user instructions.',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      },
      annotations: {
        readOnlyHint: true
      },
      category: 'Documentation',
      execute: async () => {
        return {
          currentScreen: deps.currentView,
          screens: [
            {
              id: 'home',
              title: 'Home Dashboard',
              purpose: 'Daily quest collection, tree of diligence sync, growth rewards, quick battle launch.'
            },
            {
              id: 'ranking',
              title: 'PVP Ranking Battle Arena',
              purpose: 'PVP matchmaking, rank point battle, leaderboard observation, auto-battle toggle.'
            },
            {
              id: 'card-play',
              title: 'Mobile Card Battle Gameplay',
              purpose: 'Active card play, attack execution, synergy triggers, turn completion.'
            },
            {
              id: 'mydeck',
              title: 'My Deck & Card Collection',
              purpose: 'Optimize deck arrangement (5 slots), level up cards, synthesize duplicates, customize deck synergy.'
            },
            {
              id: 'shop',
              title: 'Card Summon Shop & Economy Hub',
              purpose: 'Card packs gacha (Bronze, Silver, Gold, Diamond, Pick-Up), SNS coin recharge, merchandise, crypto payments.'
            },
            {
              id: 'game',
              title: 'Poki 110 Arcade & Mission Games',
              purpose: 'Play 110 arcade/puzzle/battle mini-games, dice random game roller, unlock bonus card rewards.'
            },
            {
              id: 'stock-market',
              title: 'Virtual Stock Exchange',
              purpose: 'Buy/sell virtual creator stocks, monitor portfolio returns, earn daily dividends.'
            },
            {
              id: 'card-marketplace',
              title: 'P2P Card Trading Marketplace',
              purpose: 'Browse player card listings, purchase high-rarity cards, sell duplicate cards for SNS points.'
            },
            {
              id: 'prediction-market',
              title: 'Prediction Betting Market',
              purpose: 'Place predictions on esports/sports matches, claim winning bet yields.'
            },
            {
              id: 'community',
              title: 'Hero Community Lounge',
              purpose: 'Create discussion posts, upvote hero decks, leave comments, share battle logs.'
            },
            {
              id: 'companion',
              title: 'Companion Pet Growth Center',
              purpose: 'Feed, train, and level up battle companion pet for passive combat buffs.'
            },
            {
              id: 'skill',
              title: 'Hero Skill Tree',
              purpose: 'Invest skill points into attack, defense, critical, and utility passive masteries.'
            },
            {
              id: 'season-hub',
              title: 'Season Pass & Missions',
              purpose: 'Track season journey, claim tier milestones, complete daily/weekly season quests.'
            },
            {
              id: 'novel',
              title: 'Web Novel Archive',
              purpose: 'Read episodic stories of hero characters, unlock lore-based card bonuses.'
            },
            {
              id: 'setting',
              title: 'Settings & Data Backup',
              purpose: 'Configure language, audio volume, low-spec graphics mode, and export/import game save files.'
            }
          ]
        };
      }
    },

    {
      name: 'change_language',
      description: 'Change the game display language to any supported locale (ko, en, ja, zh-CN, zh-TW, de, es, fr, id, ru, th, vi).',
      inputSchema: {
        type: 'object',
        properties: {
          lang: {
            type: 'string',
            description: 'Target language code',
            enum: ['ko', 'en', 'ja', 'zh-CN', 'zh-TW', 'de', 'es', 'fr', 'id', 'ru', 'th', 'vi']
          }
        },
        required: ['lang']
      },
      annotations: {
        readOnlyHint: false,
        consequentialHint: false
      },
      category: 'Settings',
      execute: async ({ lang }) => {
        if (deps.setLanguage) {
          deps.setLanguage(lang);
        }
        return {
          success: true,
          language: lang,
          message: `Game language changed to [${lang}].`
        };
      }
    },

    {
      name: 'search_card_database',
      description: 'Search the full SNSHero card database by name, rarity, element, or character ID to inspect stats and abilities.',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search keyword (card name, hero name, or skill)'
          },
          rarity: {
            type: 'string',
            description: 'Filter by rarity',
            enum: ['N', 'R', 'SR', 'SSR', 'UR', 'ALL']
          }
        },
        required: []
      },
      annotations: {
        readOnlyHint: true
      },
      category: 'Database',
      execute: async ({ query = '', rarity = 'ALL' }) => {
        const q = (query || '').toLowerCase().trim();
        const results = Object.values(CARD_DATABASE)
          .filter((card: any) => {
            if (!card) return false;
            if (rarity !== 'ALL' && card.rarity !== rarity) return false;
            if (!q) return true;
            const name = (card.name || '').toLowerCase();
            const desc = (card.description || '').toLowerCase();
            return name.includes(q) || desc.includes(q);
          })
          .slice(0, 15)
          .map((card: any) => ({
            id: card.id,
            name: card.name,
            rarity: card.rarity,
            basePower: card.basePower || card.power,
            element: card.element,
            skills: card.skills || []
          }));

        return {
          totalMatches: results.length,
          cards: results
        };
      }
    }
  ];

  return tools;
}
