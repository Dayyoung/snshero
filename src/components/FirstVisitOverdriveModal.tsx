import React from 'react';
import { Language } from '../types';

export interface FirstVisitOverdriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnterDeck: () => void;
  language?: Language;
}

export const FirstVisitOverdriveModal: React.FC<FirstVisitOverdriveModalProps> = () => {
  return null;
};

export default FirstVisitOverdriveModal;
export const SoulBurstModal = FirstVisitOverdriveModal;
export const FateRerollModal = FirstVisitOverdriveModal;
