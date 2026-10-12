/**
 * WebMCP Screen Tools for RankingView
 */

import { WebMcpToolDefinition } from '../types';

export interface RankingToolDependencies {
  onStartBattle?: () => void;
  onNavigate?: (view: any) => void;
  isAutoBattle?: boolean;
  setIsAutoBattle?: (enabled: boolean) => void;
}

export function createRankingWebMcpTools(deps: RankingToolDependencies): WebMcpToolDefinition[] {
  return [
    {
      name: 'ranking_start_pvp_battle',
      description: 'Initiate a PVP Ranked match against an opponent. Switches to battle view and starts card duel.',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      },
      annotations: {
        readOnlyHint: false,
        consequentialHint: true
      },
      screen: 'ranking',
      execute: async () => {
        if (deps.onStartBattle) {
          deps.onStartBattle();
        } else if (deps.onNavigate) {
          deps.onNavigate('card-play');
        }
        return {
          success: true,
          message: 'PVP ranked match started successfully.'
        };
      }
    },

    {
      name: 'ranking_toggle_auto_battle',
      description: 'Toggle auto-battle AI assistant mode on or off for PVP battles.',
      inputSchema: {
        type: 'object',
        properties: {
          enabled: {
            type: 'boolean',
            description: 'Whether auto-battle should be turned on or off'
          }
        },
        required: ['enabled']
      },
      annotations: {
        readOnlyHint: false,
        consequentialHint: false
      },
      screen: 'ranking',
      execute: async ({ enabled }) => {
        localStorage.setItem('hero_auto_battle_setting', enabled ? 'true' : 'false');
        if (deps.setIsAutoBattle) {
          deps.setIsAutoBattle(enabled);
        }
        return {
          success: true,
          isAutoBattle: enabled,
          message: `Auto battle has been ${enabled ? 'enabled' : 'disabled'}.`
        };
      }
    },

    {
      name: 'ranking_get_player_stats',
      description: 'Fetch player ranked match history, win rate, current win streak, and rank tier.',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      },
      annotations: {
        readOnlyHint: true
      },
      screen: 'ranking',
      execute: async () => {
        let history: any[] = [];
        try {
          const raw = localStorage.getItem('hero_match_history');
          if (raw) history = JSON.parse(raw);
        } catch (e) {
          // ignore
        }

        const wins = history.filter(h => h.result === 'win').length;
        const losses = history.filter(h => h.result === 'loss').length;
        const total = history.length;
        const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : '0.0';

        return {
          totalMatches: total,
          wins,
          losses,
          winRate: `${winRate}%`,
          recentMatches: history.slice(0, 5)
        };
      }
    }
  ];
}
