/**
 * WebMCP Screen Tools for StockMarketView
 */

import { WebMcpToolDefinition } from '../types';

export interface StockToolDependencies {
  onBuyStock?: (ticker: string, quantity: number) => void;
  onSellStock?: (ticker: string, quantity: number) => void;
  getStockData?: () => any;
}

export function createStockWebMcpTools(deps: StockToolDependencies): WebMcpToolDefinition[] {
  return [
    {
      name: 'stock_buy_shares',
      description: 'Buy shares of a virtual hero stock ticker with SNS points.',
      inputSchema: {
        type: 'object',
        properties: {
          ticker: {
            type: 'string',
            description: 'Stock ticker code (e.g. HERO, DRAGON, TITAN, PHOENIX)'
          },
          quantity: {
            type: 'integer',
            description: 'Number of shares to purchase',
            default: 1
          }
        },
        required: ['ticker', 'quantity']
      },
      annotations: {
        readOnlyHint: false,
        consequentialHint: true
      },
      screen: 'stock-market',
      execute: async ({ ticker, quantity = 1 }) => {
        if (deps.onBuyStock) {
          deps.onBuyStock(ticker, quantity);
        }
        return {
          success: true,
          ticker,
          quantity,
          message: `Purchased ${quantity} share(s) of [${ticker}].`
        };
      }
    },

    {
      name: 'stock_sell_shares',
      description: 'Sell owned shares of a virtual stock ticker to realize gains.',
      inputSchema: {
        type: 'object',
        properties: {
          ticker: {
            type: 'string',
            description: 'Stock ticker code to sell'
          },
          quantity: {
            type: 'integer',
            description: 'Number of shares to sell',
            default: 1
          }
        },
        required: ['ticker', 'quantity']
      },
      annotations: {
        readOnlyHint: false,
        consequentialHint: true
      },
      screen: 'stock-market',
      execute: async ({ ticker, quantity = 1 }) => {
        if (deps.onSellStock) {
          deps.onSellStock(ticker, quantity);
        }
        return {
          success: true,
          ticker,
          quantity,
          message: `Sold ${quantity} share(s) of [${ticker}].`
        };
      }
    },

    {
      name: 'stock_get_portfolio_and_tickers',
      description: 'Fetch current stock market price board and player owned portfolio.',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      },
      annotations: {
        readOnlyHint: true
      },
      screen: 'stock-market',
      execute: async () => {
        if (deps.getStockData) {
          return deps.getStockData();
        }
        return {
          tickers: [
            { code: 'HERO', name: 'SNSHero Corp', price: 125, change: '+4.2%' },
            { code: 'DRAGON', name: 'Dragon Guild Inc', price: 340, change: '+1.8%' },
            { code: 'TITAN', name: 'Titan Heavy Industries', price: 88, change: '-0.5%' }
          ]
        };
      }
    }
  ];
}
