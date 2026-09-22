import React, { createContext, useContext, ReactNode } from 'react';
import { CardData } from '../types';

interface SnsContextType {
  sns: number;
  updateSns: (amount: number, reason?: string) => void;
  addSns: (amount: number, reason?: string) => void;
  setCurrentDeck?: React.Dispatch<React.SetStateAction<CardData[]>>;
  selectedCompanionIndex?: number;
  addCompanionXp?: (amount: number) => void;
}

const SnsContext = createContext<SnsContextType | undefined>(undefined);

interface SnsProviderProps {
  sns: number;
  updateSns: (amount: number, reason?: string) => void;
  setCurrentDeck?: React.Dispatch<React.SetStateAction<CardData[]>>;
  selectedCompanionIndex?: number;
  children: ReactNode;
}

export const SnsProvider: React.FC<SnsProviderProps> = ({
  sns,
  updateSns,
  setCurrentDeck,
  selectedCompanionIndex,
  children,
}) => {
  const addSns = (amount: number, reason?: string) => {
    updateSns(amount, reason);
  };

  const addCompanionXp = (amount: number) => {
    try {
      const season = localStorage.getItem('hero_current_season') || 'season1';
      const key = `hero_companion_xp_${season}`;
      const current = parseInt(localStorage.getItem(key) || '0', 10);
      localStorage.setItem(key, String(current + amount));
    } catch (e) {
      console.warn('Failed to update companion XP:', e);
    }
  };

  return (
    <SnsContext.Provider
      value={{
        sns,
        updateSns,
        addSns,
        setCurrentDeck,
        selectedCompanionIndex,
        addCompanionXp,
      }}
    >
      {children}
    </SnsContext.Provider>
  );
};

export const useSns = (): SnsContextType => {
  const context = useContext(SnsContext);
  if (!context) {
    return {
      sns: 0,
      updateSns: () => {},
      addSns: () => {},
      addCompanionXp: () => {},
    };
  }
  return context;
};
