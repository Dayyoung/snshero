/**
 * WebMCP Screen Tools for PlayGameView (Poki 110 Arcade & Mission Games)
 */

import { WebMcpToolDefinition } from '../types';

export interface PokiGameToolDependencies {
  onSelectGame?: (gameId: number | string) => void;
  onRollRandom?: () => void;
  getGameList?: () => any[];
}

export function createPokiGameWebMcpTools(deps: PokiGameToolDependencies): WebMcpToolDefinition[] {
  return [
    {
      name: 'game_launch_by_id',
      description: 'Launch a specific mission game from the Poki 110 game roster by game index/ID (1 to 110).',
      inputSchema: {
        type: 'object',
        properties: {
          gameId: {
            type: 'integer',
            description: 'Game ID to play (1 to 110)'
          }
        },
        required: ['gameId']
      },
      annotations: {
        readOnlyHint: false,
        consequentialHint: false
      },
      screen: 'game',
      execute: async ({ gameId }) => {
        if (deps.onSelectGame) {
          deps.onSelectGame(gameId);
        }
        return {
          success: true,
          gameId,
          message: `Mission game #${gameId} launched.`
        };
      }
    },

    {
      name: 'game_roll_random_dice',
      description: 'Roll the random dice roller to pick and automatically launch a random mini-game from the 110 roster.',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      },
      annotations: {
        readOnlyHint: false,
        consequentialHint: false
      },
      screen: 'game',
      execute: async () => {
        if (deps.onRollRandom) {
          deps.onRollRandom();
        }
        return {
          success: true,
          message: 'Random game dice rolled and game launched.'
        };
      }
    },

    {
      name: 'game_get_roster_summary',
      description: 'Get total count and top featured titles among the Poki 110 mobile HTML5 2D games.',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      },
      annotations: {
        readOnlyHint: true
      },
      screen: 'game',
      execute: async () => {
        return {
          totalGames: 110,
          categories: ['Battle', 'Arcade', 'Puzzle', 'Action', 'Casual', 'Sports'],
          featuredGames: [
            { id: 1, title: 'Card Rush' },
            { id: 2, title: 'Subway Runner' },
            { id: 3, title: 'Temple Dash' },
            { id: 4, title: 'Flappy Wings' },
            { id: 5, title: 'Doodle Jumper' }
          ]
        };
      }
    }
  ];
}
