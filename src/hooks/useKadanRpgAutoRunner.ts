import { useCallback, useEffect, useRef, useState } from 'react';

export type KadanRpgAutoStep =
  | 'idle'
  | 'routeToTarget'
  | 'interact'
  | 'dialog'
  | 'battle'
  | 'reward'
  | 'unlockNext'
  | 'paused'
  | 'complete';

interface UseKadanRpgAutoRunnerOptions {
  enabled: boolean;
  isComplete: boolean;
  hasTarget: boolean;
  isAtTarget: boolean;
  hasDialog: boolean;
  hasBattle: boolean;
  hasReward: boolean;
  isBusy: boolean;
  onMoveToTarget: () => void;
  onInteractTarget: () => void;
  onAdvanceDialog: () => void;
  onStartBattle: () => void;
  onClaimReward: () => void;
  onContinue: () => void;
}

export const useKadanRpgAutoRunner = ({
  enabled,
  isComplete,
  hasTarget,
  isAtTarget,
  hasDialog,
  hasBattle,
  hasReward,
  isBusy,
  onMoveToTarget,
  onInteractTarget,
  onAdvanceDialog,
  onStartBattle,
  onClaimReward,
  onContinue,
}: UseKadanRpgAutoRunnerOptions) => {
  const [step, setStep] = useState<KadanRpgAutoStep>('idle');
  const repeatedStepCountRef = useRef(0);
  const previousStepRef = useRef<KadanRpgAutoStep>('idle');

  const setGuardedStep = useCallback((nextStep: KadanRpgAutoStep) => {
    if (previousStepRef.current === nextStep) {
      repeatedStepCountRef.current += 1;
    } else {
      repeatedStepCountRef.current = 0;
      previousStepRef.current = nextStep;
    }

    setStep(repeatedStepCountRef.current > 18 ? 'paused' : nextStep);
  }, []);

  const pause = useCallback(() => {
    repeatedStepCountRef.current = 0;
    previousStepRef.current = 'paused';
    setStep('paused');
  }, []);

  useEffect(() => {
    if (!enabled) {
      setGuardedStep('paused');
      return;
    }

    if (isComplete) {
      setGuardedStep('complete');
      return;
    }

    if (isBusy || step === 'paused') return;

    const timer = window.setTimeout(() => {
      if (hasReward) {
        setGuardedStep('reward');
        onClaimReward();
        return;
      }

      if (hasBattle) {
        setGuardedStep('battle');
        onStartBattle();
        return;
      }

      if (hasDialog) {
        setGuardedStep('dialog');
        onAdvanceDialog();
        return;
      }

      if (hasTarget && isAtTarget) {
        setGuardedStep('interact');
        onInteractTarget();
        return;
      }

      if (hasTarget) {
        setGuardedStep('routeToTarget');
        onMoveToTarget();
        return;
      }

      setGuardedStep('unlockNext');
      onContinue();
    }, step === 'dialog' ? 1300 : 650);

    return () => window.clearTimeout(timer);
  }, [
    enabled,
    hasBattle,
    hasDialog,
    hasReward,
    hasTarget,
    isAtTarget,
    isBusy,
    isComplete,
    onAdvanceDialog,
    onClaimReward,
    onContinue,
    onInteractTarget,
    onMoveToTarget,
    onStartBattle,
    setGuardedStep,
    step,
  ]);

  useEffect(() => {
    if (enabled && step === 'paused') {
      repeatedStepCountRef.current = 0;
      previousStepRef.current = 'idle';
      setStep('idle');
    }
  }, [enabled, step]);

  return {
    step,
    pause,
  };
};
