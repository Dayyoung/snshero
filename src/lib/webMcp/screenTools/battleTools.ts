/**
 * WebMCP Screen Tools for MobileCardPlayScreen (Card Battle Gameplay)
 */

import { WebMcpToolDefinition } from '../types';

export interface BattleToolDependencies {
  onPlayCard?: (slotIndex: number) => void;
  onEndTurn?: () => void;
  onSurrender?: () => void;
  getBattleState?: () => any;
}

export function createBattleWebMcpTools(deps: BattleToolDependencies): WebMcpToolDefinition[] {
  return [
    {
      name: 'battle_play_card',
      description: 'Select and play a card from player deck slot (0 to 4) onto the battlefield to attack opponent.',
      inputSchema: {
        type: 'object',
        properties: {
          slotIndex: {
            type: 'integer',
            description: 'Deck slot index of card to play (0 to 4)',
            enum: [0, 1, 2, 3, 4]
          }
        },
        required: ['slotIndex']
      },
      annotations: {
        readOnlyHint: false,
        consequentialHint: false
      },
      screen: 'card-play',
      execute: async ({ slotIndex }) => {
        if (deps.onPlayCard) {
          deps.onPlayCard(slotIndex);
        }
        return {
          success: true,
          playedSlot: slotIndex,
          message: `Played card at slot ${slotIndex}.`
        };
      }
    },

    {
      name: 'battle_end_turn',
      description: 'Ends current player turn in card battle, allowing opponent turn and battle resolution to proceed.',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      },
      annotations: {
        readOnlyHint: false,
        consequentialHint: false
      },
      screen: 'card-play',
      execute: async () => {
        if (deps.onEndTurn) {
          deps.onEndTurn();
        }
        return {
          success: true,
          message: 'Player turn completed.'
        };
      }
    },

    {
      name: 'battle_get_field_status',
      description: 'Inspect live battlefield status: current HP, opponent HP, active turn, deck cards status, and synergy effects.',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      },
      annotations: {
        readOnlyHint: true
      },
      screen: 'card-play',
      execute: async () => {
        if (deps.getBattleState) {
          return deps.getBattleState();
        }
        return {
          message: 'Active card battle in progress.'
        };
      }
    }
  ];
}
