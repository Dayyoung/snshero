import type { ViewType } from '../types';

export const CONTEXTUAL_TUTORIAL_STORAGE_KEY = 'hero_tutorial_context';
export const CONTEXTUAL_TUTORIAL_SNOOZE_MS = 24 * 60 * 60 * 1000; // 24 hours

export type ContextualTutorialView =
  | 'home'
  | 'play'
  | 'ranking'
  | 'guild'
  | 'shop'
  | 'deck'
  | 'setting'
  | 'season_hub'
  | 'novel'
  | 'anime'
  | 'codex'
  | 'marketplace'
  | 'prediction'
  | string;

export interface ContextualTutorialStep {
  id: string;
  titleKey: string;
  descKey: string;
  targetSelector?: string;
}

export interface ContextualTutorialDefinition {
  view: ContextualTutorialView;
  placement?: 'top-center' | 'bottom-center' | 'bottom-right';
  steps: ContextualTutorialStep[];
}

export const CONTEXTUAL_TUTORIALS: Record<string, ContextualTutorialDefinition> = {
  home: {
    view: 'home',
    placement: 'bottom-center',
    steps: [
      {
        id: 'home_intro',
        titleKey: 'tutorial_home_title',
        descKey: 'tutorial_home_desc',
      },
    ],
  },
  deck: {
    view: 'deck',
    placement: 'bottom-center',
    steps: [
      {
        id: 'deck_builder',
        titleKey: 'tutorial_deck_title',
        descKey: 'tutorial_deck_desc',
      },
    ],
  },
  play: {
    view: 'play',
    placement: 'bottom-center',
    steps: [
      {
        id: 'play_battle',
        titleKey: 'tutorial_play_title',
        descKey: 'tutorial_play_desc',
      },
    ],
  },
  shop: {
    view: 'shop',
    placement: 'bottom-center',
    steps: [
      {
        id: 'shop_summon',
        titleKey: 'tutorial_shop_title',
        descKey: 'tutorial_shop_desc',
      },
    ],
  },
};

export function getContextualTutorialDefinition(view: ViewType): ContextualTutorialDefinition | undefined {
  return CONTEXTUAL_TUTORIALS[view];
}

export default CONTEXTUAL_TUTORIALS;
