import React from 'react';
import { Language } from '../types';

interface BattleBossHUDProps {
  bossName: string;
  turnCount: number;
  maxFurySegments?: number;
  language: Language;
  bossFloor?: number;
  bossPower?: number;
  bossElement?: 'fire' | 'water' | 'earth' | 'wind' | 'light' | 'dark' | string;
  weaknessElement?: string;
  gimmickTextKo?: string;
  gimmickTextEn?: string;
}

/**
 * ID 442 & SCR-08: 시련의 탑 & PVE 보스전 보스 분노 게이지(3단계), 속성/약점 및 특수 기믹 예고 텔레그래프 HUD
 */
export const BattleBossHUD: React.FC<BattleBossHUDProps> = ({
  bossName,
  turnCount,
  maxFurySegments = 3,
  language,
  bossFloor,
  bossPower,
  bossElement = 'fire',
  weaknessElement = 'water',
  gimmickTextKo,
  gimmickTextEn,
}) => {
  const isKo = language === 'ko';
  const currentFury = (turnCount % maxFurySegments) + 1;
  const isEnraged = currentFury === maxFurySegments;

  // 속성 레이블 및 아이콘 매핑
  const elementIcons: Record<string, string> = {
    fire: '🔥',
    water: '💧',
    earth: '🌿',
    wind: '🌪️',
    light: '✨',
    dark: '🌑',
  };

  const elementNamesKo: Record<string, string> = {
    fire: '화염',
    water: '빙결/수류',
    earth: '대지/자연',
    wind: '질풍',
    light: '신성',
    dark: '암흑',
  };

  const elemIcon = elementIcons[bossElement] || '🔥';
  const weakIcon = elementIcons[weaknessElement] || '💧';
  const elemName = elementNamesKo[bossElement] || bossElement;
  const weakName = elementNamesKo[weaknessElement] || weaknessElement;

  // 기믹 예고 메시지 생성
  const defaultSkillNotice = isEnraged
    ? isKo
      ? `⚠️ [광폭화 발동!] 파멸의 전열 일격 (약점 ${weakIcon} ${weakName} 카드로 뒤집어 실드 해제 필요)`
      : `⚠️ [ENRAGED!] Cataclysmic Cleave (Flip with ${weakIcon} ${weaknessElement} to break shield)`
    : isKo
      ? (gimmickTextKo || `⚔️ [충전 중 (${currentFury}/${maxFurySegments})] 일반 타격 준비 중 (다음 턴 광폭화 대비)`)
      : (gimmickTextEn || `⚔️ [Charging (${currentFury}/${maxFurySegments})] Standard attack preparing`);

  return (
    <div className="w-full bg-[#1c0f0f]/95 border border-rose-500/50 p-2 font-mono select-none rounded-none text-xs shadow-md">
      {/* Upper row: Boss Name + Floor & Fury Segments */}
      <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-rose-400 font-black flex items-center gap-1">
            <span>{elemIcon}</span>
            <span>{bossName}</span>
          </span>
          {bossFloor && (
            <span className="px-1.5 py-0.2 bg-amber-500/20 border border-amber-400/60 text-amber-300 text-[10px] font-bold">
              [{bossFloor}F BOSS]
            </span>
          )}
          {bossPower && (
            <span className="text-[10px] text-white/50 font-bold">
              PWR {bossPower}
            </span>
          )}
        </div>

        {/* 3-Segment Fury Meter */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-rose-400 font-bold">FURY:</span>
          {Array.from({ length: maxFurySegments }).map((_, idx) => (
            <div
              key={idx}
              className={`w-4 h-2 border border-rose-500/80 transition-all ${
                idx < currentFury
                  ? isEnraged
                    ? 'bg-amber-400 animate-pulse ring-1 ring-amber-300'
                    : 'bg-rose-500'
                  : 'bg-black/50'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Weakness & Attribute Tag bar */}
      <div className="flex items-center justify-between text-[10px] text-white/70 mb-1 border-t border-rose-900/40 pt-1">
        <span className="text-white/60">
          {isKo ? `속성: ${elemIcon} ${elemName}` : `Element: ${elemIcon} ${bossElement}`}
        </span>
        <span className="text-cyan-300 font-bold">
          {isKo ? `🎯 약점 속성: ${weakIcon} ${weakName} (200% 피해)` : `🎯 Weak: ${weakIcon} ${weaknessElement} (200% DMG)`}
        </span>
      </div>

      {/* Telegraph Banner */}
      <div
        className={`text-[10px] py-1 px-1.5 border border-dashed rounded-none transition-all leading-tight ${
          isEnraged
            ? 'bg-rose-950/90 border-rose-400 text-amber-300 font-bold animate-pulse'
            : 'bg-black/40 border-rose-900/50 text-rose-200/90'
        }`}
      >
        {defaultSkillNotice}
      </div>
    </div>
  );
};

