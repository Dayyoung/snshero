/**
 * MaterialDeficitModal.tsx
 * ID 402: 마이덱 카드 레벨업 시 돌파 재료 부족 알림 모달 내 획득처 즉시 파밍 딥링크
 */

import React from 'react';
import { X, Sparkles, Compass, AlertCircle, ArrowRight } from 'lucide-react';
import { Language } from '../types';

interface MaterialDeficitModalProps {
  isOpen: boolean;
  onClose: () => void;
  materialName: string;
  requiredCount: number;
  currentCount: number;
  onNavigateStage?: (stageId: number) => void;
  language: Language;
}

export const MaterialDeficitModal: React.FC<MaterialDeficitModalProps> = ({
  isOpen,
  onClose,
  materialName,
  requiredCount,
  currentCount,
  onNavigateStage,
  language,
}) => {
  if (!isOpen) return null;

  const routes = [
    { stageId: 1, title: '스토리 챕터 1: 영웅의 시작', dropRate: '높음 (45%)', cost: '1 AP' },
    { stageId: 2, title: '스토리 챕터 2: 그림자 회랑', dropRate: '중간 (30%)', cost: '2 AP' },
    { stageId: 5, title: '일일 속성 던전 (화/수/지/풍)', dropRate: '확정 (100%)', cost: '5 AP' },
  ];

  return (
    <div className="fixed inset-0 z-[230] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-sm w-full max-w-md p-5 text-slate-100 font-mono space-y-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-amber-400" />
            <h3 className="font-bold text-sm text-slate-100">
              {language === 'ko' ? '돌파 재료 부족 안내' : 'Material Deficit'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Status */}
        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xs space-y-1">
          <div className="text-xs text-slate-300">
            {language === 'ko' ? '필요 재료:' : 'Required Material:'}{' '}
            <span className="text-amber-300 font-bold">{materialName}</span>
          </div>
          <div className="text-[11px] text-slate-400">
            {language === 'ko' ? '보유 현황:' : 'Current Balance:'}{' '}
            <span className="text-rose-400 font-bold">{currentCount}</span> / {requiredCount} (부족: {requiredCount - currentCount}개)
          </div>
        </div>

        {/* Acquisition Routes */}
        <div className="space-y-2">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Compass size={12} className="text-indigo-400" />
            {language === 'ko' ? '추천 파밍 획득처' : 'Recommended Farming Routes'}
          </span>
          <div className="space-y-1.5">
            {routes.map((r) => (
              <div
                key={r.stageId}
                className="p-2.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xs flex items-center justify-between transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-200">{r.title}</div>
                  <div className="text-[10px] text-slate-400">
                    드롭률: <span className="text-emerald-400">{r.dropRate}</span> | 소모: {r.cost}
                  </div>
                </div>
                <button
                  onClick={() => {
                    onNavigateStage?.(r.stageId);
                    onClose();
                  }}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold rounded-xs flex items-center gap-1 cursor-pointer"
                >
                  <span>{language === 'ko' ? '파밍 이동' : 'Farm Now'}</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xs cursor-pointer"
        >
          {language === 'ko' ? '닫기' : 'Close'}
        </button>
      </div>
    </div>
  );
};
