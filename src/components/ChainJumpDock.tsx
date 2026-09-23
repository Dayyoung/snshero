/**
 * ChainJumpDock.tsx - SCR-11-23
 * 다음 추천 퀘스트 바로가기와 보상 수령을 통합한 48px 원핸드 1-Tap 연속 체인 점프 독
 */

import React from 'react';
import { ArrowRight, CheckCircle2, Gift } from 'lucide-react';
import { RecommendedQuest } from '../lib/QuestChainNavigator';
import { triggerHaptic } from '../lib/haptic';

interface ChainJumpDockProps {
  quest: RecommendedQuest;
  onJumpToView: (view: string) => void;
  onClaimReward: (questId: string) => void;
}

export const ChainJumpDock: React.FC<ChainJumpDockProps> = ({
  quest,
  onJumpToView,
  onClaimReward,
}) => {
  return (
    <div className="h-12 w-full bg-slate-950/95 border-t border-amber-400/60 px-4 flex items-center justify-between font-mono select-none shadow-xl">
      <div className="flex items-center gap-2 overflow-hidden">
        <span className="text-[10px] text-amber-400 font-black shrink-0">NEXT:</span>
        <span className="text-xs font-bold text-white truncate">{quest.title}</span>
      </div>

      {quest.isReadyToClaim ? (
        <button
          type="button"
          onClick={() => {
            triggerHaptic('heavy');
            onClaimReward(quest.id);
          }}
          className="h-8 px-3 rounded-lg bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1 active:scale-95 cursor-pointer shadow shrink-0"
        >
          <Gift size={13} />
          <span>수령</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => {
            triggerHaptic('medium');
            onJumpToView(quest.targetView);
          }}
          className="h-8 px-3 rounded-lg bg-slate-900 border border-slate-700 hover:border-amber-400 text-white font-bold text-xs flex items-center gap-1 active:scale-95 cursor-pointer shrink-0"
        >
          <span>바로가기</span>
          <ArrowRight size={13} className="text-amber-400" />
        </button>
      )}
    </div>
  );
};
