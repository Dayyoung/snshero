/**
 * MissionQuickPreviewCard.tsx
 * 미션 로비 및 모드 선택 시 '1분 핵심 룰 퀵 프리뷰 & 모바일 제스처 가이드 카드'
 * (design.md Monospace 플랫 가이드 준수)
 * (구글 스프레드시트 Row 997 / ID 577 요구사항 구현)
 */

import React from 'react';
import { Play, Sparkles, HandMetal, Award, Clock } from 'lucide-react';
import { Language } from '../types';

export interface MissionPreviewMetadata {
  id: string;
  titleKo: string;
  titleEn: string;
  genreKo: string;
  genreEn: string;
  objectiveKo: string;
  objectiveEn: string;
  gestureGuideKo: string[];
  gestureGuideEn: string[];
  estimatedDurationMin: number;
  baseRewardSns: number;
  skillBonusMaxPct: number;
}

interface MissionQuickPreviewCardProps {
  mission: MissionPreviewMetadata;
  language?: Language;
  onLaunch: (missionId: string) => void;
  onClose?: () => void;
}

export const MissionQuickPreviewCard: React.FC<MissionQuickPreviewCardProps> = ({
  mission,
  language = 'ko',
  onLaunch,
  onClose,
}) => {
  const isKo = language === 'ko';

  return (
    <div className="w-full max-w-sm bg-[#fdfcfc] dark:bg-[#181616] border border-[#201d1d] dark:border-white rounded-none p-4 font-mono select-none text-[#201d1d] dark:text-[#fdfcfc] flex flex-col gap-3 shadow-none">
      {/* 상단 뱃지 및 제목 */}
      <div className="flex items-center justify-between border-b border-[rgba(15,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] pb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-black bg-[#201d1d] text-white dark:bg-white dark:text-[#201d1d] px-1.5 py-0.5 rounded-sm">
            {isKo ? mission.genreKo : mission.genreEn}
          </span>
          <h3 className="text-xs font-black truncate max-w-[170px]">
            {isKo ? mission.titleKo : mission.titleEn}
          </h3>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-bold">
          <Sparkles size={13} />
          <span>{isKo ? '1분 퀵가이드' : '1-Min Guide'}</span>
        </div>
      </div>

      {/* 1. 핵심 승리 목표 */}
      <div className="flex flex-col gap-1 bg-[rgba(15,0,0,0.03)] dark:bg-[rgba(255,255,255,0.04)] p-2.5 rounded-sm border border-[rgba(15,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)]">
        <div className="flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400">
          <Award size={13} />
          <span>{isKo ? '[핵심 목표]' : '[CORE OBJECTIVE]'}</span>
        </div>
        <p className="text-xs leading-relaxed text-[#333] dark:text-[#ddd]">
          {isKo ? mission.objectiveKo : mission.objectiveEn}
        </p>
      </div>

      {/* 2. 한손 퓨어 제스처 조작법 */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1 text-[11px] font-bold text-purple-600 dark:text-purple-400">
          <HandMetal size={13} />
          <span>{isKo ? '[엄지 퓨어 제스처]' : '[1-THUMB GESTURES]'}</span>
        </div>
        <div className="grid grid-cols-1 gap-1">
          {(isKo ? mission.gestureGuideKo : mission.gestureGuideEn).map((guide, idx) => (
            <div
              key={idx}
              className="text-[11px] px-2 py-1 bg-white dark:bg-[#201d1d] border border-[rgba(15,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] rounded-sm flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
              <span className="leading-tight">{guide}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. 표준 기대 보상 */}
      <div className="flex items-center justify-between p-2 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-sm text-xs">
        <div className="flex items-center gap-1 text-amber-700 dark:text-amber-300 font-bold">
          <Clock size={13} />
          <span>{mission.estimatedDurationMin}분 기준 (~50P/분)</span>
        </div>
        <span className="font-black text-amber-900 dark:text-amber-200">
          기본 {mission.baseRewardSns}P (최대 +{mission.skillBonusMaxPct}%)
        </span>
      </div>

      {/* 출격 버튼 */}
      <div className="flex gap-2 pt-1">
        {onClose && (
          <button
            onClick={onClose}
            className="flex-1 py-2 text-xs font-bold border border-[rgba(15,0,0,0.2)] dark:border-[rgba(255,255,255,0.2)] rounded-sm hover:bg-black/5 dark:hover:bg-white/5 active:scale-98 cursor-pointer"
          >
            {isKo ? '닫기' : 'Cancel'}
          </button>
        )}
        <button
          onClick={() => onLaunch(mission.id)}
          className="flex-2 flex items-center justify-center gap-1.5 py-2 text-xs font-black bg-[#201d1d] text-[#fdfcfc] dark:bg-[#fdfcfc] dark:text-[#201d1d] rounded-sm active:scale-98 cursor-pointer shadow-md"
        >
          <Play size={14} className="fill-current" />
          <span>{isKo ? '지금 미션 출격!' : 'Deploy Mission!'}</span>
        </button>
      </div>
    </div>
  );
};
