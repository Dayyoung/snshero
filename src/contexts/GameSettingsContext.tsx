/**
 * GameSettingsContext — 전역 게임 설정 상태 (language, lowSpecMode, theme)
 * 
 * App.tsx / PlayGameView.tsx 분할 (P4-2):
 * 1단계: language + lowSpecMode Context 추출
 * 2단계: theme Context 통합
 */
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Language } from '../types';
import { getBrowserLanguage } from '../lib/i18n';
import { CARD_SKIN_THEME_STORAGE_KEY, normalizeCardSkinTheme, type CardSkinThemeId } from '../content/cardSkinThemes';

export type ThemeMode = 'light' | 'dark' | 'metal';

interface GameSettings {
  language: Language;
  setLanguage: (lang: Language) => void;
  lowSpecMode: boolean;
  setLowSpecMode: (mode: boolean) => void;
  theme: ThemeMode;
  setTheme: (val: ThemeMode) => void;
  cardSkinTheme: CardSkinThemeId;
  setCardSkinTheme: (val: CardSkinThemeId) => void;
}

const GameSettingsContext = createContext<GameSettings | null>(null);

export function GameSettingsProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hero_language') as Language;
      if (saved) return saved;
    }
    return getBrowserLanguage();
  });

  const [lowSpecMode, setLowSpecModeState] = useState(() => {
    return typeof window !== 'undefined'
      ? localStorage.getItem('hero_low_spec') === 'true'
      : false;
  });

  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hero_theme');
      if (saved === 'ranking' || saved === 'dark') return 'dark';
      if (saved === 'metal') return 'metal';
      return 'light';
    }
    return 'light';
  });

  const [cardSkinTheme, setCardSkinThemeState] = useState<CardSkinThemeId>(() => {
    if (typeof window !== 'undefined') {
      return normalizeCardSkinTheme(localStorage.getItem(CARD_SKIN_THEME_STORAGE_KEY));
    }

    return 'original_mecha';
  });

  const handleSetLanguage = useCallback((lang: Language) => {
    localStorage.setItem('hero_language', lang);
    setLanguage(lang);
  }, []);

  const handleSetLowSpecMode = useCallback((mode: boolean) => {
    localStorage.setItem('hero_low_spec', String(mode));
    setLowSpecModeState(mode);
  }, []);

  const handleSetTheme = useCallback((val: ThemeMode) => {
    localStorage.setItem('hero_theme', val);
    setThemeState(val);
  }, []);

  const handleSetCardSkinTheme = useCallback((val: CardSkinThemeId) => {
    localStorage.setItem(CARD_SKIN_THEME_STORAGE_KEY, val);
    setCardSkinThemeState(val);
  }, []);

  const value = useMemo(() => ({
    language,
    setLanguage: handleSetLanguage,
    lowSpecMode,
    setLowSpecMode: handleSetLowSpecMode,
    theme,
    setTheme: handleSetTheme,
    cardSkinTheme,
    setCardSkinTheme: handleSetCardSkinTheme,
  }), [language, lowSpecMode, theme, cardSkinTheme, handleSetLanguage, handleSetLowSpecMode, handleSetTheme, handleSetCardSkinTheme]);

  return (
    <GameSettingsContext.Provider value={value}>
      {children}
    </GameSettingsContext.Provider>
  );
}

export function useGameSettings(): GameSettings {
  const ctx = useContext(GameSettingsContext);
  if (!ctx) {
    throw new Error('useGameSettings must be used within GameSettingsProvider');
  }
  return ctx;
}
