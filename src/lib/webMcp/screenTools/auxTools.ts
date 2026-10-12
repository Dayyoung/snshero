/**
 * WebMCP Screen Tools for Auxiliary Screens (Companion, Skill, SeasonHub, Setting, Profile)
 */

import { WebMcpToolDefinition } from '../types';

export interface AuxToolDependencies {
  onNavigate?: (view: any) => void;
  updateSns?: (amount: number, reason?: string) => void;
}

export function createAuxWebMcpTools(deps: AuxToolDependencies): WebMcpToolDefinition[] {
  return [
    {
      name: 'companion_interact',
      description: 'Interact with battle companion (pet): feed food or train skills for passive bonuses.',
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            description: 'Action to perform with companion',
            enum: ['feed', 'train', 'pet']
          }
        },
        required: ['action']
      },
      annotations: {
        readOnlyHint: false,
        consequentialHint: false
      },
      screen: 'companion',
      execute: async ({ action }) => {
        return {
          success: true,
          action,
          message: `Companion ${action} interaction completed.`
        };
      }
    },

    {
      name: 'skill_upgrade_node',
      description: 'Upgrade a hero skill node in the skill tree using available skill points.',
      inputSchema: {
        type: 'object',
        properties: {
          skillId: {
            type: 'string',
            description: 'Skill identifier (e.g. strike, shield, haste, aura)'
          }
        },
        required: ['skillId']
      },
      annotations: {
        readOnlyHint: false,
        consequentialHint: true
      },
      screen: 'skill',
      execute: async ({ skillId }) => {
        return {
          success: true,
          skillId,
          message: `Skill [${skillId}] upgraded.`
        };
      }
    },

    {
      name: 'season_claim_milestone',
      description: 'Claim unlocked season pass milestone tier rewards.',
      inputSchema: {
        type: 'object',
        properties: {
          tier: {
            type: 'integer',
            description: 'Season tier level (1 to 50)'
          }
        },
        required: ['tier']
      },
      annotations: {
        readOnlyHint: false,
        consequentialHint: true
      },
      screen: 'season-hub',
      execute: async ({ tier }) => {
        return {
          success: true,
          tier,
          message: `Season tier ${tier} reward claimed.`
        };
      }
    },

    {
      name: 'setting_export_save_data',
      description: 'Export all local storage game data into a JSON string for cloud/device backup.',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      },
      annotations: {
        readOnlyHint: true
      },
      screen: 'setting',
      execute: async () => {
        const backup: Record<string, string> = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('hero_')) {
            backup[key] = localStorage.getItem(key) || '';
          }
        }
        return {
          success: true,
          keysExported: Object.keys(backup).length,
          data: backup
        };
      }
    }
  ];
}
