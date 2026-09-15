import React from 'react';
import { X, Percent, Gift, Sparkles, Shield } from 'lucide-react';
import { Language } from '../types';
import { CARD_DATABASE } from '../cardDatabase';

interface StageDropProbabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  stageId?: number;
  stageName?: string;
}

/**
 * ID 543: 스토리 스테이지 보상 드랍 테이블 퍼센트 확률 투명 공개 모달
 */
export const StageDropProbabilityModal: React.FC<StageDropProbabilityModalProps> = ({
  isOpen,
  onClose,
  language,
  stageId = 1,
  stageName,
}) => {
  if (!isOpen) return null;

  // 스테이지별 확률 풀 목업 데이터 (공정 투명 공개)
  const dropTable = [
    { tier: 'SSR', dropRate: '2.5%', cardIds: [10, 20, 30, 100, 110], color: 'text-amber-500 border-amber-500 bg-amber-50' },
    { tier: 'SR', dropRate: '12.5%', cardIds: [8, 9, 18, 19, 28, 29], color: 'text-purple-600 border-purple-500 bg-purple-50' },
    { tier: 'Rare', dropRate: '35.0%', cardIds: [5, 6, 7, 15, 16, 17], color: 'text-blue-600 border-blue-500 bg-blue-50' },
    { tier: 'Common', dropRate: '50.0%', cardIds: [1, 2, 3, 4, 11, 12, 13, 14], color: 'text-slate-600 border-slate-400 bg-slate-50' },
  ];

  return (
    <div className="fixed inset-0 z-[10010] flex items-center justify-center bg-black/75 p-4 font-mono select-none">
      <div className="bg-[#fdfcfc] border border-[#201d1d] text-[#201d1d] max-w-md w-full shadow-2xl overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="bg-[#201d1d] text-white p-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-black">
            <Percent size={15} className="text-amber-400" />
            <span>
              {language === 'ko'
                ? `[스테이지 ${stageId} 보상 드랍 확률 공시]`
                : `[Stage ${stageId} Drop Probability Table]`}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-amber-400 px-1.5 py-0.5 text-xs font-bold border border-white/20 hover:border-amber-400"
          >
            [X]
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          <div className="bg-amber-50 border border-amber-300 p-2.5 text-[11px] leading-relaxed text-amber-900">
            <div className="font-bold mb-1 flex items-center gap-1">
              <Shield size={12} className="text-amber-600" />
              <span>{language === 'ko' ? '공정 확률 보장 시스템' : 'Fair Probability Guarantee'}</span>
            </div>
            {language === 'ko'
              ? '모든 스테이지 클리어 보상은 서버-클라이언트 동일 난수 생성기(PRNG)를 통해 정밀하게 계산되며, 천장 시스템과 연동되어 일정 횟수 이상 시 상위 티어가 확정 드랍됩니다.'
              : 'All stage clear drops are computed transparently via deterministic PRNG and linked with the pity system.'}
          </div>

          <div className="space-y-3">
            {dropTable.map((group) => (
              <div key={group.tier} className={`border p-2.5 ${group.color}`}>
                <div className="flex items-center justify-between font-black text-xs mb-2">
                  <span>[{group.tier} 등급]</span>
                  <span className="text-xs bg-white px-1.5 py-0.5 border">{group.dropRate}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px]">
                  {group.cardIds.map((cid) => {
                    const card = CARD_DATABASE[cid];
                    if (!card) return null;
                    const name = language === 'ko' ? card.title : card.title_en;
                    return (
                      <div
                        key={cid}
                        className="bg-white/90 border border-current px-1.5 py-1 text-center truncate font-bold"
                        title={name}
                      >
                        #{cid} {name}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#f8f7f7] border-t border-[rgba(15,0,0,0.12)] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#201d1d] hover:bg-[#333030] text-white text-xs font-bold active:scale-95 cursor-pointer"
          >
            {language === 'ko' ? '[확인 닫기]' : '[Close]'}
          </button>
        </div>
      </div>
    </div>
  );
};
