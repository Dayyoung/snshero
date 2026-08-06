import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ViewType } from '../types';
import { getSeasonItem, setSeasonItem } from '../lib/webtoonProgress';
import {
  CONTEXTUAL_TUTORIAL_SNOOZE_MS,
  CONTEXTUAL_TUTORIAL_STORAGE_KEY,
  getContextualTutorialDefinition,
  type ContextualTutorialStep,
  type ContextualTutorialView,
} from '../content/contextualTutorials';

interface StoredContextualTutorialState {
  completedViews: ContextualTutorialView[];
  dismissedViews: ContextualTutorialView[];
  snoozedUntil: Partial<Record<ContextualTutorialView, number>>;
}

const defaultState = (): StoredContextualTutorialState => ({
  completedViews: [],
  dismissedViews: [],
  snoozedUntil: {},
});

const loadContextualTutorialState = (season: string): StoredContextualTutorialState => {
  const raw = getSeasonItem(CONTEXTUAL_TUTORIAL_STORAGE_KEY, season);
  if (!raw) return defaultState();

  try {
    const parsed = JSON.parse(raw) as Partial<StoredContextualTutorialState>;
    return {
      completedViews: Array.isArray(parsed.completedViews)
        ? parsed.completedViews.filter((view): view is ContextualTutorialView => typeof view === 'string')
        : [],
      dismissedViews: Array.isArray(parsed.dismissedViews)
        ? parsed.dismissedViews.filter((view): view is ContextualTutorialView => typeof view === 'string')
        : [],
      snoozedUntil:
        parsed.snoozedUntil && typeof parsed.snoozedUntil === 'object'
          ? Object.fromEntries(
              Object.entries(parsed.snoozedUntil)
                .filter((entry): entry is [ContextualTutorialView, number] => typeof entry[0] === 'string' && typeof entry[1] === 'number')
            )
          : {},
    };
  } catch {
    return defaultState();
  }
};

const saveContextualTutorialState = (season: string, state: StoredContextualTutorialState): void => {
  setSeasonItem(CONTEXTUAL_TUTORIAL_STORAGE_KEY, season, JSON.stringify(state));
};

interface UseContextualTutorialOptions {
  currentSeason: string;
  view: ViewType;
  suppressed?: boolean;
}

interface UseContextualTutorialResult {
  activeStep: ContextualTutorialStep | null;
  placement: 'top-center' | 'bottom-center' | 'bottom-right';
  stepIndex: number;
  totalSteps: number;
  visible: boolean;
  completeStep: () => void;
  snoozeTutorial: () => void;
  dismissTutorial: () => void;
}

export const useContextualTutorial = ({
  currentSeason,
  view,
  suppressed = false,
}: UseContextualTutorialOptions): UseContextualTutorialResult => {
  const definition = useMemo(() => getContextualTutorialDefinition(view), [view]);
  const [state, setState] = useState<StoredContextualTutorialState>(() => loadContextualTutorialState(currentSeason));
  const [loadedStateSeason, setLoadedStateSeason] = useState(currentSeason);
  const [activeView, setActiveView] = useState<ContextualTutorialView | null>(null);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    setState(loadContextualTutorialState(currentSeason));
    setLoadedStateSeason(currentSeason);
  }, [currentSeason]);

  useEffect(() => {
    if (loadedStateSeason !== currentSeason) return;
    saveContextualTutorialState(currentSeason, state);
  }, [currentSeason, loadedStateSeason, state]);

  useEffect(() => {
    if (!definition || suppressed) {
      setActiveView(null);
      setStepIndex(0);
      return;
    }

    const snoozedUntil = state.snoozedUntil[definition.view] ?? 0;
    const isCompleted = state.completedViews.includes(definition.view);
    const isDismissed = state.dismissedViews.includes(definition.view);
    const isSnoozed = snoozedUntil > Date.now();

    if (isCompleted || isDismissed || isSnoozed) {
      setActiveView(null);
      setStepIndex(0);
      return;
    }

    setActiveView(definition.view);
    setStepIndex(0);
  }, [definition, state.completedViews, state.dismissedViews, state.snoozedUntil, suppressed]);

  const activeDefinition = activeView ? getContextualTutorialDefinition(activeView) : null;
  const totalSteps = activeDefinition?.steps.length ?? 0;
  const activeStep = activeDefinition?.steps[stepIndex] ?? null;

  const completeStep = useCallback(() => {
    if (!activeDefinition || !activeStep) return;

    if (stepIndex < activeDefinition.steps.length - 1) {
      setStepIndex((prev) => prev + 1);
      return;
    }

    setState((prev) => ({
      ...prev,
      completedViews: prev.completedViews.includes(activeDefinition.view)
        ? prev.completedViews
        : [...prev.completedViews, activeDefinition.view],
      snoozedUntil: {
        ...prev.snoozedUntil,
        [activeDefinition.view]: 0,
      },
    }));
    setActiveView(null);
    setStepIndex(0);
  }, [activeDefinition, activeStep, stepIndex]);

  const snoozeTutorial = useCallback(() => {
    if (!activeDefinition) return;

    setState((prev) => ({
      ...prev,
      snoozedUntil: {
        ...prev.snoozedUntil,
        [activeDefinition.view]: Date.now() + CONTEXTUAL_TUTORIAL_SNOOZE_MS,
      },
    }));
    setActiveView(null);
    setStepIndex(0);
  }, [activeDefinition]);

  const dismissTutorial = useCallback(() => {
    if (!activeDefinition) return;

    setState((prev) => ({
      ...prev,
      dismissedViews: prev.dismissedViews.includes(activeDefinition.view)
        ? prev.dismissedViews
        : [...prev.dismissedViews, activeDefinition.view],
      snoozedUntil: {
        ...prev.snoozedUntil,
        [activeDefinition.view]: 0,
      },
    }));
    setActiveView(null);
    setStepIndex(0);
  }, [activeDefinition]);

  return {
    activeStep,
    placement: activeDefinition?.placement ?? 'bottom-right',
    stepIndex,
    totalSteps,
    visible: Boolean(activeDefinition && activeStep),
    completeStep,
    snoozeTutorial,
    dismissTutorial,
  };
};
