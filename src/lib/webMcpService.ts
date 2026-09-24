/**
 * SNSHero Revolution - WebMCP (Web Model Context Protocol) Service
 * Implements W3C / Chrome WebMCP standard for AI Agent browser interactions.
 */

import { getSeasonItem } from './webtoonProgress';

export interface WebMcpTool {
  name: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  handler: (args?: any) => Promise<unknown> | unknown;
}

// Global declaration for TypeScript
declare global {
  interface Navigator {
    modelContext?: {
      registerTool?: (tool: {
        name: string;
        description: string;
        inputSchema?: Record<string, unknown>;
        execute: (params: any) => Promise<any> | any;
      }) => void;
    };
  }
  interface Window {
    WebMCP?: {
      registerTool?: (tool: any) => void;
      getTools?: () => any[];
      invokeTool?: (name: string, params?: any) => Promise<any>;
    };
    __WEBMCP_TOOLS__?: Record<string, WebMcpTool>;
  }
}

/**
 * Registered WebMCP tools map
 */
const registeredTools: Map<string, WebMcpTool> = new Map();

/**
 * Register a WebMCP tool both in local registry and native browser navigator.modelContext if available
 */
export function registerWebMcpTool(tool: WebMcpTool) {
  registeredTools.set(tool.name, tool);

  // 1. Native navigator.modelContext API (Chrome WebMCP standard)
  try {
    if (typeof navigator !== 'undefined' && navigator.modelContext?.registerTool) {
      navigator.modelContext.registerTool({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        execute: async (params: any) => {
          return await tool.handler(params);
        },
      });
    }
  } catch (err) {
    console.warn('[WebMCP] Native modelContext registration notice:', err);
  }

  // 2. Global window.WebMCP Fallback API
  if (typeof window !== 'undefined') {
    if (!window.__WEBMCP_TOOLS__) {
      window.__WEBMCP_TOOLS__ = {};
    }
    window.__WEBMCP_TOOLS__[tool.name] = tool;
  }
}

/**
 * Initialize all SNSHero WebMCP tools for AI Agent interactions
 */
export function initWebMcpService() {
  if (typeof window === 'undefined') return;

  // 1. Tool: get_game_overview
  registerWebMcpTool({
    name: 'get_game_overview',
    description: 'Returns player nickname, level, SNS points balance, season, and current game state.',
    handler: () => {
      const username = localStorage.getItem('hero_user_name') || 'HeroPlayer';
      const season = localStorage.getItem('hero_current_season') || 'season1';
      const points = parseInt(localStorage.getItem('hero_sns_points') || '1000', 10);
      const level = parseInt(localStorage.getItem('hero_user_guild_level') || '1', 10);
      const storyProgress = localStorage.getItem(`hero_story_progress_${season}`) || '0';

      return {
        success: true,
        data: {
          game: 'SNSHero Revolution',
          username,
          season,
          snsPoints: points,
          guildLevel: level,
          storyProgressEpisodes: parseInt(storyProgress, 10),
          availableModes: ['3x3 Card Battle', 'Kadan RPG', 'Gacha Shop', 'Card Codex', 'Prediction Market', 'Pet Care'],
          timestamp: new Date().toISOString(),
        },
      };
    },
  });

  // 2. Tool: query_hero_cards
  registerWebMcpTool({
    name: 'query_hero_cards',
    description: 'Search owned hero cards or global card codex by element (fire, water, earth, wind, human, mecha) or rarity (N, R, SR, SSR).',
    inputSchema: {
      type: 'object',
      properties: {
        element: { type: 'string', description: 'Elemental faction filter' },
        rarity: { type: 'string', description: 'Rarity tier filter' },
        keyword: { type: 'string', description: 'Search term for name' },
      },
    },
    handler: (params: { element?: string; rarity?: string; keyword?: string }) => {
      const season = localStorage.getItem('hero_current_season') || 'season1';
      const ownedCardsStr = getSeasonItem('hero_my_deck', season, '[]') || '[]';
      let ownedCards: any[] = [];
      try {
        ownedCards = JSON.parse(ownedCardsStr);
      } catch {
        ownedCards = [];
      }

      const sampleCards = [
        { id: 'card_aquaris', name: 'Aquaris', element: 'water', rarity: 'N', power: [1, 4, 1, 5], skill: 'Hardened Shield' },
        { id: 'card_zephyros', name: 'Zephyros', element: 'wind', rarity: 'N', power: [1, 3, 3, 5], skill: 'Gale Swift' },
        { id: 'card_kadan', name: 'Kadan', element: 'human', rarity: 'SR', power: [6, 7, 5, 8], skill: 'Arcane Slash' },
        { id: 'card_pyro', name: 'Ignis', element: 'fire', rarity: 'R', power: [5, 2, 4, 3], skill: 'Flame Burst' },
        { id: 'card_mecha_01', name: 'Mecha Core Alpha', element: 'mecha', rarity: 'SSR', power: [9, 8, 9, 8], skill: 'Overdrive Cannon' },
      ];

      const list = ownedCards.length > 0 ? ownedCards : sampleCards;

      const filtered = list.filter((c: any) => {
        if (params?.element && c.element?.toLowerCase() !== params.element.toLowerCase()) return false;
        if (params?.rarity && c.rarity?.toUpperCase() !== params.rarity.toUpperCase()) return false;
        if (params?.keyword && !c.name?.toLowerCase().includes(params.keyword.toLowerCase())) return false;
        return true;
      });

      return {
        success: true,
        count: filtered.length,
        cards: filtered,
      };
    },
  });

  // 3. Tool: start_quick_battle
  registerWebMcpTool({
    name: 'start_quick_battle',
    description: 'Simulates a fast 3x3 tactical card battle against an AI opponent and returns match results.',
    inputSchema: {
      type: 'object',
      properties: {
        difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'], default: 'medium' },
      },
    },
    handler: (params: { difficulty?: string }) => {
      const diff = params?.difficulty || 'medium';
      const playerFlipCount = Math.floor(Math.random() * 5) + 3;
      const aiFlipCount = Math.floor(Math.random() * 5) + (diff === 'hard' ? 4 : 2);
      const isPlayerWinner = playerFlipCount >= aiFlipCount;

      return {
        success: true,
        matchResult: {
          difficulty: diff,
          winner: isPlayerWinner ? 'Player' : 'AI Rival',
          score: { player: playerFlipCount, ai: aiFlipCount },
          rewardPoints: isPlayerWinner ? 150 : 30,
          battleLog: [
            `Turn 1: Player placed card on Center (Power North: 5, East: 4)`,
            `Turn 2: AI placed card on North (Power South: 6) -> Flipped Player Card!`,
            `Turn 3: Player used Elemental Fire Synergy -> Flipped back AI Card!`,
            `Turn 4: Match Finished! Winner: ${isPlayerWinner ? 'Player' : 'AI Rival'}`,
          ],
        },
      };
    },
  });

  // 4. Tool: draw_card_pack
  registerWebMcpTool({
    name: 'draw_card_pack',
    description: 'Simulates opening a card pack and returns pulled hero card details and pity status.',
    handler: () => {
      const rarities = ['N', 'N', 'N', 'R', 'R', 'SR', 'SSR'];
      const chosenRarity = rarities[Math.floor(Math.random() * rarities.length)];
      const names = {
        N: ['Aquaris', 'Zephyros', 'Terra Sprite', 'Wind Runner'],
        R: ['Ignis Warrior', 'Gale Knight', 'Iron Golem'],
        SR: ['Kadan Arcane', 'Elena Starlight', 'Dragon Tamer'],
        SSR: ['Mecha Core Overlord', 'Celestial Valkyrie', 'Primal Behemoth'],
      };
      const pool = names[chosenRarity as keyof typeof names];
      const cardName = pool[Math.floor(Math.random() * pool.length)];

      return {
        success: true,
        pulledCard: {
          name: cardName,
          rarity: chosenRarity,
          element: chosenRarity === 'SSR' ? 'mecha' : chosenRarity === 'SR' ? 'human' : 'water',
          power: [Math.floor(Math.random() * 5) + 3, Math.floor(Math.random() * 5) + 3, Math.floor(Math.random() * 5) + 3, Math.floor(Math.random() * 5) + 3],
          isNew: Math.random() > 0.5,
        },
      };
    },
  });

  // 5. Tool: get_season_missions
  registerWebMcpTool({
    name: 'get_season_missions',
    description: 'Retrieves current active daily quests, weekly challenges, and seasonal achievement progress.',
    handler: () => {
      return {
        success: true,
        missions: [
          { id: 'daily_login', title: 'Daily Login Check', reward: '100 SNS Points', completed: true },
          { id: 'daily_battle', title: 'Play 1 Card Battle', reward: '150 SNS Points', completed: true },
          { id: 'kadan_rpg', title: 'Complete 1 Kadan RPG Map Event', reward: '300 SNS Points', completed: false },
          { id: 'draw_card', title: 'Draw 1 Card Pack', reward: 'Special Ticket', completed: false },
        ],
      };
    },
  });

  // 6. Tool: kadan_rpg_status
  registerWebMcpTool({
    name: 'kadan_rpg_status',
    description: 'Returns Kadan RPG story campaign progress, hero tile coordinates, and active map events.',
    handler: () => {
      const season = localStorage.getItem('hero_current_season') || 'season1';
      const progress = getSeasonItem('hero_kadan_rpg_progress', season, '{}') || '{}';
      const autoMode = localStorage.getItem(`hero_kadan_rpg_auto_mode_${season}`) === 'true';

      return {
        success: true,
        rpgStatus: {
          currentChapter: 1,
          regionName: 'Arcane Echoes Plains',
          heroTile: [4, 5],
          autoRunnerEnabled: autoMode,
          nearbyEvents: [
            { type: 'chest', tile: [4, 6], title: 'Treasure Chest' },
            { type: 'monster', tile: [5, 5], title: 'Wild Slime Battle' },
          ],
          savedProgressData: progress,
        },
      };
    },
  });

  // 7. Tool: get_ai_strategy_guide
  registerWebMcpTool({
    name: 'get_ai_strategy_guide',
    description: 'Generates AI tactical advice for 3x3 grid positioning and elemental synergies.',
    handler: () => {
      return {
        success: true,
        strategyGuide: {
          cornerStrategy: 'Place high North/West values in the Top-Left corner to protect your flanks from enemy flips.',
          elementalSynergy: 'Combining 3 Water faction cards grants +1 Defense against enemy flip attempts.',
          kadanRpgTip: 'Turn on Auto-Runner in Kadan RPG to automatically navigate to nearest chests and battle tiles.',
        },
      };
    },
  });

  // Window WebMCP Object Fallback Interface
  window.WebMCP = {
    registerTool: (tool: any) => registerWebMcpTool(tool),
    getTools: () => Array.from(registeredTools.values()),
    invokeTool: async (name: string, params?: any) => {
      const tool = registeredTools.get(name);
      if (!tool) throw new Error(`WebMCP Tool '${name}' not found.`);
      return await tool.handler(params);
    },
  };

  // Custom Event Dispatcher for AI Browser Extensions
  window.dispatchEvent(new CustomEvent('webmcp:ready', {
    detail: {
      mcpVersion: '2.1.0',
      toolsCount: registeredTools.size,
      manifestUrl: 'https://snshero.com/.well-known/mcp.json',
    },
  }));

  console.log(`[WebMCP] SNSHero WebMCP Service initialized. ${registeredTools.size} tools registered for AI Agents.`);
}
