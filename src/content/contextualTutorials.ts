import type { ViewType } from '../types';

export const CONTEXTUAL_TUTORIAL_SNOOZE_MS = 24 * 60 * 60 * 1000;
export const CONTEXTUAL_TUTORIAL_STORAGE_KEY = 'hero_tutorial_context';

export type ContextualTutorialPlacement = 'top-center' | 'bottom-center' | 'bottom-right';
export type ContextualTutorialView = ViewType;

export interface ContextualTutorialStep {
  id: string;
  titleKey: string;
  bodyKey: string;
}

export interface ContextualTutorialDefinition {
  view: ContextualTutorialView;
  placement: ContextualTutorialPlacement;
  steps: ContextualTutorialStep[];
}

export const CONTEXTUAL_TUTORIAL_DEFINITIONS: Partial<Record<ViewType, ContextualTutorialDefinition>> = {
  mydeck: {
    view: 'mydeck',
    placement: 'bottom-center',
    steps: [
      {
        id: 'deck-intro',
        titleKey: 'mydeck',
        bodyKey: 'tutorial_start_game',
      },
    ],
  },
  play: {
    view: 'play',
    placement: 'bottom-center',
    steps: [
      {
        id: 'play-intro',
        titleKey: 'play',
        bodyKey: 'tutorial_start_game',
      },
    ],
  },
  shop: {
    view: 'shop',
    placement: 'bottom-center',
    steps: [
      {
        id: 'shop-intro',
        titleKey: 'shop',
        bodyKey: 'tutorial_start_game',
      },
    ],
  },
};

export function getContextualTutorialDefinition(view: ViewType): ContextualTutorialDefinition | null {
  return CONTEXTUAL_TUTORIAL_DEFINITIONS[view] || null;
}
