/**
 * WebMCP Screen Tools for HomeView
 */

import { WebMcpToolDefinition } from '../types';

export interface HomeToolDependencies {
  onNavigate: (view: any) => void;
  updateSns?: (amount: number, reason?: string) => void;
  playSfx?: (url: string) => void;
}

export function createHomeWebMcpTools(deps: HomeToolDependencies): WebMcpToolDefinition[] {
  return [
    {
      name: 'home_claim_diligence_steps',
      description: 'Claims steps reward from Tree of Diligence on Home screen and awards SNS points.',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      },
      annotations: {
        readOnlyHint: false,
        consequentialHint: true
      },
      screen: 'home',
      execute: async () => {
        const currentSteps = parseInt(localStorage.getItem('hero_current_steps') || '3500', 10);
        const claimedSteps = parseInt(localStorage.getItem('hero_today_claimed_steps') || '0', 10);
        const available = Math.max(0, currentSteps - claimedSteps);

        if (available <= 0) {
          return {
            success: false,
            message: 'All daily steps have already been claimed.',
            claimedPoints: 0,
            remainingSteps: 0
          };
        }

        const rewardSns = Math.floor(available / 100);
        localStorage.setItem('hero_today_claimed_steps', currentSteps.toString());
        localStorage.setItem('hero_last_diligence_time', Date.now().toString());

        if (deps.updateSns && rewardSns > 0) {
          deps.updateSns(rewardSns, 'diligence_steps');
        }

        return {
          success: true,
          stepsClaimed: available,
          rewardSns,
          message: `Successfully claimed ${available} steps for +${rewardSns} SNS points!`
        };
      }
    },

    {
      name: 'home_get_dashboard_summary',
      description: 'Get comprehensive overview of Home screen widgets: active quests, story progress, steps, and fast-launch options.',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      },
      annotations: {
        readOnlyHint: true
      },
      screen: 'home',
      execute: async () => {
        const season = localStorage.getItem('hero_current_season') || 'season1';
        const storyProgress = parseInt(localStorage.getItem(`hero_story_progress_${season}`) || '0', 10);
        const currentSteps = parseInt(localStorage.getItem('hero_current_steps') || '3500', 10);
        const claimedSteps = parseInt(localStorage.getItem('hero_today_claimed_steps') || '0', 10);

        return {
          season,
          storyProgress: `${storyProgress} episodes completed`,
          currentSteps,
          claimedSteps,
          unclaimedSteps: Math.max(0, currentSteps - claimedSteps),
          recommendations: [
            { action: 'Start PVP Match', targetScreen: 'ranking' },
            { action: 'Gacha Summon in Shop', targetScreen: 'shop' },
            { action: 'Deck Card Optimization', targetScreen: 'mydeck' },
            { action: 'Play Arcade Mini Games', targetScreen: 'game' }
          ]
        };
      }
    },

    {
      name: 'home_fast_play_random_game',
      description: 'Rolls the dice and launches a random arcade game from Poki 110 games pool.',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      },
      annotations: {
        readOnlyHint: false,
        consequentialHint: false
      },
      screen: 'home',
      execute: async () => {
        deps.onNavigate('game');
        return {
          success: true,
          message: 'Redirected to Game Arena for instant random play.'
        };
      }
    }
  ];
}
