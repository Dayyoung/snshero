/**
 * SnsContext — 전역 SNS 코인 상태 (잔액, 추가, 동반자 카드 XP)
 * 
 * App.tsx / PlayGameView.tsx 분할 (P4-2):
 * 3단계: SNS 상태 Context 추출 → DailyMissions prop drilling 제거
 */
import React, { createContext, useContext, useCallback, useMemo, useRef } from 'react';
import { CardData } from '../types';

interface SnsContextValue {
  sns: number;
  addSns: (amount: number, reason?: string, typeOrTarget?: string, targetName?: string) => void;
  addCompanionXp: (xp: number) => void;
}

const SnsContext = createContext<SnsContextValue | null>(null);

interface SnsProviderProps {
  children: React.ReactNode;
  sns: number;
  updateSns: (amount: number, reason?: string, typeOrTarget?: string, targetName?: string) => Promise<void>;
  setCurrentDeck: React.Dispatch<React.SetStateAction<CardData[]>>;
  selectedCompanionIndex: number;
}

export function SnsProvider({
  children,
  sns,
  updateSns,
  setCurrentDeck,
  selectedCompanionIndex,
}: SnsProviderProps) {
  const companionRef = useRef(selectedCompanionIndex);
  companionRef.current = selectedCompanionIndex;

  const addSns = useCallback((amount: number, reason?: string, typeOrTarget?: string, targetName?: string) => {
    updateSns(amount, reason, typeOrTarget, targetName);
  }, [updateSns]);

  const addCompanionXp = useCallback((xp: number) => {
    if (xp <= 0) return;
    setCurrentDeck(prev => {
      const newDeck = [...prev];
      const idx = companionRef.current;
      if (newDeck[idx]) {
        newDeck[idx] = {
          ...newDeck[idx],
          xp: (newDeck[idx].xp || 0) + xp
        };
      }
      return newDeck;
    });
  }, [setCurrentDeck]);

  const value = useMemo(() => ({
    sns,
    addSns,
    addCompanionXp,
  }), [sns, addSns, addCompanionXp]);

  return (
    <SnsContext.Provider value={value}>
      {children}
    </SnsContext.Provider>
  );
}

export function useSns(): SnsContextValue {
  const ctx = useContext(SnsContext);
  if (!ctx) {
    throw new Error('useSns must be used within SnsProvider');
  }
  return ctx;
}
