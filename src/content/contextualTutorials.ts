import type { ViewType } from '../types';

export type ContextualTutorialView = Extract<
  ViewType,
  'mydeck' | 'wiki-card' | 'shop' | 'webtoon' | 'community' | 'play'
>;

export type ContextualTutorialPlacement = 'top-center' | 'bottom-center' | 'bottom-right';

export interface ContextualTutorialStep {
  id: string;
  titleKey: string;
  bodyKey: string;
  target: string;
  condition: string;
  completion: string;
  hasReward: boolean;
}

export interface ContextualTutorialDefinition {
  view: ContextualTutorialView;
  placement: ContextualTutorialPlacement;
  steps: ContextualTutorialStep[];
}

export const CONTEXTUAL_TUTORIAL_STORAGE_KEY = 'hero_tutorial_context';
export const CONTEXTUAL_TUTORIAL_SNOOZE_MS = 12 * 60 * 60 * 1000;

export const CONTEXTUAL_TUTORIALS: Record<ContextualTutorialView, ContextualTutorialDefinition> = {
  mydeck: {
    view: 'mydeck',
    placement: 'bottom-right',
    steps: [
      {
        id: 'mydeck-equip-core-cards',
        titleKey: 'contextual_tutorial_mydeck_step1_title',
        bodyKey: 'contextual_tutorial_mydeck_step1_body',
        target: 'deck-slots',
        condition: 'Entered My Deck before finishing the contextual deck onboarding.',
        completion: 'Move to the next coach mark after reading the deck slot guidance.',
        hasReward: false,
      },
      {
        id: 'mydeck-upgrade-growth',
        titleKey: 'contextual_tutorial_mydeck_step2_title',
        bodyKey: 'contextual_tutorial_mydeck_step2_body',
        target: 'growth-and-upgrade-actions',
        condition: 'Player needs the first growth explanation for card reinforcement.',
        completion: 'Move to the next coach mark after reviewing upgrade and synergy guidance.',
        hasReward: false,
      },
      {
        id: 'mydeck-skin-preview',
        titleKey: 'contextual_tutorial_mydeck_step3_title',
        bodyKey: 'contextual_tutorial_mydeck_step3_body',
        target: 'skin-selector',
        condition: 'Player has not seen the cosmetic skin hint for the current season.',
        completion: 'Finish the coach mark after reviewing skin customization guidance.',
        hasReward: false,
      },
    ],
  },
  'wiki-card': {
    view: 'wiki-card',
    placement: 'bottom-center',
    steps: [
      {
        id: 'wiki-card-search',
        titleKey: 'contextual_tutorial_wikicard_step1_title',
        bodyKey: 'contextual_tutorial_wikicard_step1_body',
        target: 'search-and-filter-toolbar',
        condition: 'Entered Wiki Card before finishing the contextual codex onboarding.',
        completion: 'Move to the next coach mark after reading search and filter guidance.',
        hasReward: false,
      },
      {
        id: 'wiki-card-detail',
        titleKey: 'contextual_tutorial_wikicard_step2_title',
        bodyKey: 'contextual_tutorial_wikicard_step2_body',
        target: 'card-detail-entry',
        condition: 'Player needs the first detailed card profile explanation.',
        completion: 'Finish the coach mark after reviewing card detail and comparison guidance.',
        hasReward: false,
      },
    ],
  },
  shop: {
    view: 'shop',
    placement: 'bottom-center',
    steps: [
      {
        id: 'shop-gacha-entry',
        titleKey: 'contextual_tutorial_shop_step1_title',
        bodyKey: 'contextual_tutorial_shop_step1_body',
        target: 'gacha-pack-section',
        condition: 'Entered Shop before finishing the contextual shop onboarding.',
        completion: 'Move to the next coach mark after reading the pack opening guidance.',
        hasReward: false,
      },
      {
        id: 'shop-probability-pity',
        titleKey: 'contextual_tutorial_shop_step2_title',
        bodyKey: 'contextual_tutorial_shop_step2_body',
        target: 'probability-and-pity-disclosure',
        condition: 'Player needs the first trust notice for draw probability and pity rules.',
        completion: 'Finish the coach mark after reviewing the trust and refund notice guidance.',
        hasReward: false,
      },
    ],
  },
  webtoon: {
    view: 'webtoon',
    placement: 'bottom-center',
    steps: [
      {
        id: 'webtoon-hub-start',
        titleKey: 'contextual_tutorial_webtoon_step1_title',
        bodyKey: 'contextual_tutorial_webtoon_step1_body',
        target: 'episode-hub',
        condition: 'Entered Webtoon before finishing the contextual story onboarding.',
        completion: 'Move to the next coach mark after reading the episode hub guidance.',
        hasReward: false,
      },
      {
        id: 'webtoon-reward-loop',
        titleKey: 'contextual_tutorial_webtoon_step2_title',
        bodyKey: 'contextual_tutorial_webtoon_step2_body',
        target: 'reading-reward-loop',
        condition: 'Player needs the first explanation for reading progress and reward claims.',
        completion: 'Finish the coach mark after reviewing reward and sharing guidance.',
        hasReward: false,
      },
    ],
  },
  community: {
    view: 'community',
    placement: 'bottom-right',
    steps: [
      {
        id: 'community-browse',
        titleKey: 'contextual_tutorial_community_step1_title',
        bodyKey: 'contextual_tutorial_community_step1_body',
        target: 'category-selector',
        condition: 'Entered Community before finishing the contextual community onboarding.',
        completion: 'Move to the next coach mark after reading category browsing guidance.',
        hasReward: false,
      },
      {
        id: 'community-post-safe',
        titleKey: 'contextual_tutorial_community_step2_title',
        bodyKey: 'contextual_tutorial_community_step2_body',
        target: 'post-upload-actions',
        condition: 'Player needs the first explanation for posting safely and joining events.',
        completion: 'Finish the coach mark after reviewing posting and event participation guidance.',
        hasReward: false,
      },
    ],
  },
  play: {
    view: 'play',
    placement: 'bottom-right',
    steps: [
      {
        id: 'play-win-condition',
        titleKey: 'contextual_tutorial_play_step1_title',
        bodyKey: 'contextual_tutorial_play_step1_body',
        target: 'battle-mode-entry',
        condition: 'Entered Play before finishing the contextual battle onboarding.',
        completion: 'Move to the next coach mark after reading the match goal guidance.',
        hasReward: false,
      },
      {
        id: 'play-board-control',
        titleKey: 'contextual_tutorial_play_step2_title',
        bodyKey: 'contextual_tutorial_play_step2_body',
        target: 'battle-board-controls',
        condition: 'Player needs the first explanation for board interaction and card placement.',
        completion: 'Move to the next coach mark after reviewing the board control guidance.',
        hasReward: false,
      },
      {
        id: 'play-battle-flow',
        titleKey: 'contextual_tutorial_play_step3_title',
        bodyKey: 'contextual_tutorial_play_step3_body',
        target: 'battle-result-loop',
        condition: 'Player needs the first explanation for the post-battle growth loop.',
        completion: 'Finish the coach mark after reviewing battle results and next actions.',
        hasReward: false,
      },
    ],
  },
};

export const getContextualTutorialDefinition = (
  view: ViewType,
): ContextualTutorialDefinition | null => {
  if (view in CONTEXTUAL_TUTORIALS) {
    return CONTEXTUAL_TUTORIALS[view as ContextualTutorialView];
  }

  return null;
};
