import React from 'react';

interface ElementalCounterStrikeTutorialProps {
 isOpen: boolean;
 onComplete: (rewardGold: number) => void;
 onSkip: () => void;
}

export const isFtueBattleCleared = (): boolean => true;

export const markFtueBattleCleared = (): void => {};

export const ElementalCounterStrikeTutorial: React.FC<ElementalCounterStrikeTutorialProps> = () => {
 return null;
};

export default ElementalCounterStrikeTutorial;
