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

import { isHapticEnabled, setHapticEnabled as saveHapticSetting } from '../lib/haptic';

export type ThemeMode = 'light' | 'dark' | 'metal';
export type TargetFps = '30' | '60';

interface GameSettings {
  language: Language;
  setLanguage: (lang: Language) => void;
  lowSpecMode: boolean;
  setLowSpecMode: (mode: boolean) => void;
  theme: ThemeMode;
  setTheme: (val: ThemeMode) => void;
  cardSkinTheme: CardSkinThemeId;
  setCardSkinTheme: (val: CardSkinThemeId) => void;
  targetFps: TargetFps;
  setTargetFps: (fps: TargetFps) => void;
  batterySaver: boolean;
  setBatterySaver: (val: boolean) => void;
  hapticEnabled: boolean;
  setHapticEnabled: (val: boolean) => void;
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

  const [targetFps, setTargetFpsState] = useState<TargetFps>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hero_target_fps');
      if (saved === '30' || saved === '60') return saved;
    }
    return '60';
  });

  const [batterySaver, setBatterySaverState] = useState<boolean>(() => {
    return typeof window !== 'undefined'
      ? localStorage.getItem('hero_battery_saver') === 'true'
      : false;
  });

  const [hapticEnabled, setHapticEnabledState] = useState<boolean>(() => {
    return isHapticEnabled();
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

  const handleSetTargetFps = useCallback((fps: TargetFps) => {
    localStorage.setItem('hero_target_fps', fps);
    setTargetFpsState(fps);
  }, []);

  const handleSetBatterySaver = useCallback((val: boolean) => {
    localStorage.setItem('hero_battery_saver', String(val));
    setBatterySaverState(val);
  }, []);

  const handleSetHapticEnabled = useCallback((val: boolean) => {
    saveHapticSetting(val);
    setHapticEnabledState(val);
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
    targetFps,
    setTargetFps: handleSetTargetFps,
    batterySaver,
    setBatterySaver: handleSetBatterySaver,
    hapticEnabled,
    setHapticEnabled: handleSetHapticEnabled,
  }), [language, lowSpecMode, theme, cardSkinTheme, targetFps, batterySaver, hapticEnabled, handleSetLanguage, handleSetLowSpecMode, handleSetTheme, handleSetCardSkinTheme, handleSetTargetFps, handleSetBatterySaver, handleSetHapticEnabled]);

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
