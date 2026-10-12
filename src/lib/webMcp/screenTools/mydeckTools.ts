/**
 * WebMCP Screen Tools for MyDeckView
 */

import { WebMcpToolDefinition } from '../types';

export interface MyDeckToolDependencies {
  onOptimizeDeck?: () => void;
  onSwapCard?: (slotIndex: number, cardId: number) => void;
  onLevelUpCard?: (cardId: number) => void;
  getDeckInfo?: () => any;
}

export function createMyDeckWebMcpTools(deps: MyDeckToolDependencies): WebMcpToolDefinition[] {
  return [
    {
      name: 'deck_optimize_best_cards',
      description: 'Automatically analyzes entire card inventory and equips the top 5 highest-power cards into deck slots for maximum Total Power (TP).',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      },
      annotations: {
        readOnlyHint: false,
        consequentialHint: true
      },
      screen: 'mydeck',
      execute: async () => {
        if (deps.onOptimizeDeck) {
          deps.onOptimizeDeck();
        }
        return {
          success: true,
          message: 'Deck automatically optimized with highest power cards.'
        };
      }
    },

    {
      name: 'deck_get_inventory_and_slots',
      description: 'Get current 5-slot deck configuration and all owned inventory cards with levels, rarities, and power stats.',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      },
      annotations: {
        readOnlyHint: true
      },
      screen: 'mydeck',
      execute: async () => {
        if (deps.getDeckInfo) {
          return deps.getDeckInfo();
        }

        const season = localStorage.getItem('hero_current_season') || 'season1';
        let currentDeck: any[] = [];
        let inventory: any = {};

        try {
          const rawDeck = localStorage.getItem(`hero_current_deck_${season}`);
          if (rawDeck) currentDeck = JSON.parse(rawDeck);
          const rawInv = localStorage.getItem(`hero_card_inventory_${season}`);
          if (rawInv) inventory = JSON.parse(rawInv);
        } catch (e) {
          // ignore
        }

        return {
          currentDeck,
          inventoryCards: Object.values(inventory),
          deckPower: currentDeck.reduce((acc, c) => acc + (c?.power || 0), 0)
        };
      }
    },

    {
      name: 'deck_swap_card',
      description: 'Equip an inventory card into a specific deck slot (0 to 4).',
      inputSchema: {
        type: 'object',
        properties: {
          slotIndex: {
            type: 'integer',
            description: 'Deck slot index (0 to 4)',
            enum: [0, 1, 2, 3, 4]
          },
          cardId: {
            type: 'integer',
            description: 'Database ID of the card to equip'
          }
        },
        required: ['slotIndex', 'cardId']
      },
      annotations: {
        readOnlyHint: false,
        consequentialHint: true
      },
      screen: 'mydeck',
      execute: async ({ slotIndex, cardId }) => {
        if (deps.onSwapCard) {
          deps.onSwapCard(slotIndex, cardId);
        }
        return {
          success: true,
          slotIndex,
          cardId,
          message: `Card #${cardId} equipped into slot #${slotIndex}.`
        };
      }
    }
  ];
}
