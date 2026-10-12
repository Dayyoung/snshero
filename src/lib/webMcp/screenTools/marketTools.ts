/**
 * WebMCP Screen Tools for CardMarketplaceView
 */

import { WebMcpToolDefinition } from '../types';

export interface MarketToolDependencies {
  onBuyCard?: (listingId: string) => void;
  onListCard?: (cardId: number, priceSns: number) => void;
  getMarketplaceData?: () => any;
}

export function createMarketWebMcpTools(deps: MarketToolDependencies): WebMcpToolDefinition[] {
  return [
    {
      name: 'market_buy_card_listing',
      description: 'Purchase a card listed on the P2P card marketplace using SNS points.',
      inputSchema: {
        type: 'object',
        properties: {
          listingId: {
            type: 'string',
            description: 'Unique listing identifier on marketplace'
          }
        },
        required: ['listingId']
      },
      annotations: {
        readOnlyHint: false,
        consequentialHint: true
      },
      screen: 'card-marketplace',
      execute: async ({ listingId }) => {
        if (deps.onBuyCard) {
          deps.onBuyCard(listingId);
        }
        return {
          success: true,
          listingId,
          message: `Attempted purchase of listing [${listingId}].`
        };
      }
    },

    {
      name: 'market_list_card_for_sale',
      description: 'List an owned card from inventory onto marketplace for a specified SNS point price.',
      inputSchema: {
        type: 'object',
        properties: {
          cardId: {
            type: 'integer',
            description: 'Card database ID to sell'
          },
          priceSns: {
            type: 'integer',
            description: 'Selling price in SNS points (min 50)'
          }
        },
        required: ['cardId', 'priceSns']
      },
      annotations: {
        readOnlyHint: false,
        consequentialHint: true
      },
      screen: 'card-marketplace',
      execute: async ({ cardId, priceSns }) => {
        if (deps.onListCard) {
          deps.onListCard(cardId, priceSns);
        }
        return {
          success: true,
          cardId,
          priceSns,
          message: `Card #${cardId} listed on marketplace for ${priceSns} SNS.`
        };
      }
    },

    {
      name: 'market_get_listings',
      description: 'Fetch all active cards available for purchase on the P2P marketplace.',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      },
      annotations: {
        readOnlyHint: true
      },
      screen: 'card-marketplace',
      execute: async () => {
        if (deps.getMarketplaceData) {
          return deps.getMarketplaceData();
        }
        return {
          message: 'Marketplace listings active.'
        };
      }
    }
  ];
}
