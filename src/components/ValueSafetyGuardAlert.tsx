/**
 * ValueSafetyGuardAlert.tsx - SCR-08-23
 * 고레벨/희귀 카드 선택 시 붉은 파동으로 경고하는 48px 가치 보존 세이프티 가드
 */

import React from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface ValueSafetyGuardAlertProps {
  cardName: string;
  rarity: string;
  onConfirmSacrifice: () => void;
  onCancel: () => void;
}

export const ValueSafetyGuardAlert: React.FC<ValueSafetyGuardAlertProps> = ({
  cardName,
  rarity,
  onConfirmSacrifice,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-slate-950 border-2 border-rose-500 rounded-3xl w-full max-w-sm overflow-hidden shadow-[0_0_30px_rgba(244,63,94,0.4)] flex flex-col text-center p-5 gap-4">
        <div className="w-14 h-14 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center text-rose-400 mx-auto animate-pulse">
          <ShieldAlert size={28} />
        </div>

        <div>
          <h4 className="text-sm font-black text-white">고가치 카드 희생 경고!</h4>
          <p className="text-[11px] text-slate-300 mt-1">
            선택하신 [{cardName} ({rarity})] 카드는 높은 가치를 지니고 있습니다. 융합 재료로 소모하면 영구히 소멸합니다.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 w-full">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              onCancel();
            }}
            className="h-12 bg-slate-900 border border-slate-700 text-white font-bold text-xs rounded-xl active:scale-95 cursor-pointer"
          >
            투입 취소
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('heavy');
              onConfirmSacrifice();
            }}
            className="h-12 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl active:scale-95 cursor-pointer shadow-lg"
          >
            확인 및 투입
          </button>
        </div>
      </div>
    </div>
  );
};
