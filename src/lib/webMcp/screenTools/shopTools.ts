/**
 * WebMCP Screen Tools for ShopView
 */

import { WebMcpToolDefinition } from '../types';

export interface ShopToolDependencies {
  onSummonPack?: (packType: string, isTenPull: boolean) => void;
  onInitiateCrypto?: (ccy: string, packLabel: string) => void;
  getShopState?: () => any;
}

export function createShopWebMcpTools(deps: ShopToolDependencies): WebMcpToolDefinition[] {
  return [
    {
      name: 'shop_summon_gacha_pack',
      description: 'Summon cards from gacha packs (bronze, silver, gold, diamond, pickup). Can perform single pull or 10-consecutive pulls.',
      inputSchema: {
        type: 'object',
        properties: {
          packType: {
            type: 'string',
            description: 'Pack type to summon',
            enum: ['bronze', 'silver', 'gold', 'diamond', 'pickup']
          },
          isTenPull: {
            type: 'boolean',
            description: 'True for 10-pull, false for single pull',
            default: false
          }
        },
        required: ['packType']
      },
      annotations: {
        readOnlyHint: false,
        consequentialHint: true
      },
      screen: 'shop',
      execute: async ({ packType, isTenPull = false }) => {
        if (deps.onSummonPack) {
          deps.onSummonPack(packType, isTenPull);
        }
        return {
          success: true,
          packType,
          isTenPull,
          message: `Summoned ${isTenPull ? '10x' : '1x'} [${packType}] pack.`
        };
      }
    },

    {
      name: 'shop_get_pity_and_catalog',
      description: 'Check current gacha pity gauge, free daily pull status, and available shop packages.',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      },
      annotations: {
        readOnlyHint: true
      },
      screen: 'shop',
      execute: async () => {
        if (deps.getShopState) {
          return deps.getShopState();
        }

        const season = localStorage.getItem('hero_current_season') || 'season1';
        let pity = 0;
        try {
          const raw = localStorage.getItem(`hero_gacha_pity_${season}`);
          if (raw) pity = JSON.parse(raw)?.pullCount || 0;
        } catch (e) {
          // ignore
        }

        return {
          season,
          pityPullCount: pity,
          pityCeiling: 80,
          remainingForGuaranteedSSR: Math.max(0, 80 - (pity % 80)),
          packages: [
            { id: 'bronze', cost: 100, label: 'Bronze Pack' },
            { id: 'silver', cost: 300, label: 'Silver Pack' },
            { id: 'gold', cost: 700, label: 'Gold Pack' },
            { id: 'diamond', cost: 1500, label: 'Diamond Pack' }
          ]
        };
      }
    },

    {
      name: 'shop_pay_with_crypto',
      description: 'Open crypto payment modal with chosen cryptocurrency (USDT, BTC, ETH, SOL, USDC) for recharge package or goods.',
      inputSchema: {
        type: 'object',
        properties: {
          ccy: {
            type: 'string',
            description: 'Cryptocurrency symbol',
            enum: ['USDT', 'BTC', 'ETH', 'SOL', 'USDC', 'TON', 'DOGE']
          },
          packagePrice: {
            type: 'string',
            description: 'Price in USD (e.g. 10, 30, 50, 100)',
            default: '10'
          }
        },
        required: ['ccy']
      },
      annotations: {
        readOnlyHint: false,
        consequentialHint: true
      },
      screen: 'shop',
      execute: async ({ ccy, packagePrice = '10' }) => {
        if (deps.onInitiateCrypto) {
          deps.onInitiateCrypto(ccy, `$${packagePrice}`);
        }
        return {
          success: true,
          ccy,
          price: packagePrice,
          message: `Crypto payment flow initiated for ${ccy}.`
        };
      }
    }
  ];
}
