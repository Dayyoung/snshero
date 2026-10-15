import React, { useState, useEffect } from 'react';
import {
  LoreClue,
  TACTICAL_LORE_CLUES,
  getCollectedClueIds,
  collectClue,
  isHeroClaimed,
  claimRecruitedHero,
} from '../../utils/loreRecruitmentStore';
import { triggerHaptic } from '../../lib/haptic';

interface TacticalLoreAnnotationProps {
  onDeployToBattle?: () => void;
  language?: string;
}

export const TacticalLoreDock: React.FC<TacticalLoreAnnotationProps> = ({
  onDeployToBattle,
  language = 'ko',
}) => {
  const [collectedIds, setCollectedIds] = useState<string[]>([]);
  const [selectedClue, setSelectedClue] = useState<LoreClue | null>(null);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [claimed, setClaimed] = useState(false);

  const refreshState = () => {
    const list = getCollectedClueIds();
    setCollectedIds(list);
    setClaimed(isHeroClaimed(4));
  };

  useEffect(() => {
    refreshState();
    const handleStorage = () => refreshState();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('snshero_clue_updated', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('snshero_clue_updated', handleStorage);
    };
  }, []);

  const totalCollected = collectedIds.length;
  const isUnlocked = totalCollected >= 3;

  const handleCollect = (clue: LoreClue) => {
    triggerHaptic('tap');
    const result = collectClue(clue.id);
    refreshState();
    window.dispatchEvent(new CustomEvent('snshero_clue_updated'));
    if (result.isUnlocked && !claimed) {
      setIsContractModalOpen(true);
    }
  };

  const handleClaimAndDeploy = () => {
    triggerHaptic('victory');
    claimRecruitedHero(4);
    setClaimed(true);
    setIsContractModalOpen(false);
    if (typeof window !== 'undefined' && (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag) {
      (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('event', 'lore_battle_deploy_click', {
        hero_id: 4,
      });
    }
    if (onDeployToBattle) {
      onDeployToBattle();
    }
  };

  return (
    <>
      {/* 하단 슬라이딩 미니 독 (독서 방해 없는 인텔 트래커) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#090d16]/95 border-t border-white/10 backdrop-blur-md px-4 py-2.5 font-mono text-xs select-none">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {/* 레이더 안테나 벡터 아이콘 */}
            <div className="relative w-7 h-7 rounded border border-emerald-500/30 bg-emerald-950/20 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M12 2a10 10 0 1 0 10 10" />
                <path d="M12 6a6 6 0 1 0 6 6" />
                <path d="M12 10a2 2 0 1 0 2 2" />
                <path d="M12 12l5 -5" />
              </svg>
              <div className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></div>
            </div>

            <div className="min-w-0 truncate">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 truncate">
                {language === 'ko' ? '전술 기밀 주석 트래커' : 'TACTICAL INTEL TRACKER'}
              </div>
              <div className="text-white font-bold flex items-center gap-1.5 text-xs truncate">
                <span>{language === 'ko' ? '단서 수집' : 'Intel Clues'}:</span>
                <span className="text-emerald-400 font-extrabold">{totalCollected} / 3</span>
                <span className="text-[10px] text-slate-500">
                  {isUnlocked
                    ? language === 'ko' ? '(해독 완료)' : '(DECRYPTED)'
                    : language === 'ko' ? '(본문 녹색 밑줄 단어 탭)' : '(Tap green keywords)'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isUnlocked ? (
              <button
                onClick={() => setIsContractModalOpen(true)}
                className="px-3 min-h-[44px] rounded border border-emerald-400 bg-emerald-500/20 text-emerald-300 font-bold text-xs flex items-center gap-1.5 hover:bg-emerald-500/30 active:scale-95 transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)]"
              >
                <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span>{claimed ? (language === 'ko' ? '배틀 배치' : 'DEPLOY') : (language === 'ko' ? '히어로 계약' : 'CONTRACT')}</span>
              </button>
            ) : (
              <div className="flex items-center gap-1">
                {[0, 1, 2].map((idx) => (
                  <div
                    key={idx}
                    className={`w-6 h-6 rounded border flex items-center justify-center text-[10px] font-mono transition-all ${
                      idx < totalCollected
                        ? 'border-emerald-500/80 bg-emerald-950/40 text-emerald-400 font-bold'
                        : 'border-white/10 bg-black/40 text-slate-600'
                    }`}
                  >
                    {idx < totalCollected ? '✓' : idx + 1}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 단서 상세 팝오버 모달 */}
      {selectedClue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-mono text-xs">
          <div className="w-full max-w-sm rounded-xl border border-white/15 bg-[#090d16] p-5 shadow-2xl relative text-slate-200">
            {/* 닫기 버튼 */}
            <button
              onClick={() => setSelectedClue(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded border border-cyan-500/40 bg-cyan-950/20 flex items-center justify-center text-cyan-400">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <span className="text-[10px] text-cyan-400 tracking-wider uppercase font-bold">
                {language === 'ko' ? '기밀 아카이브 단서' : 'CLASSIFIED INTEL ARCHIVE'}
              </span>
            </div>

            <div className="text-base font-bold text-white mb-1">{selectedClue.title}</div>
            <div className="text-[11px] text-slate-400 mb-3 flex items-center gap-1.5">
              <span>{language === 'ko' ? '키워드' : 'KEYWORD'}:</span>
              <span className="text-emerald-400 font-bold">[{selectedClue.keyword}]</span>
            </div>

            <div className="bg-black/50 border border-white/10 rounded-lg p-3 text-slate-300 leading-relaxed text-xs mb-4">
              {selectedClue.secretBrief}
            </div>

            <div className="text-[11px] text-slate-400 mb-4 flex items-center justify-between">
              <span>{language === 'ko' ? '연관 히어로' : 'Target Unit'}:</span>
              <span className="text-white font-bold">{selectedClue.relatedHeroName}</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedClue(null)}
                className="flex-1 min-h-[44px] rounded border border-white/15 bg-white/5 hover:bg-white/10 text-slate-300 font-bold"
              >
                {language === 'ko' ? '닫기' : 'CLOSE'}
              </button>
              <button
                onClick={() => {
                  handleCollect(selectedClue);
                  setSelectedClue(null);
                }}
                disabled={collectedIds.includes(selectedClue.id)}
                className={`flex-1 min-h-[44px] rounded border font-bold flex items-center justify-center gap-1.5 transition-all ${
                  collectedIds.includes(selectedClue.id)
                    ? 'border-white/10 bg-white/5 text-slate-500 cursor-not-allowed'
                    : 'border-emerald-500/50 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                }`}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>
                  {collectedIds.includes(selectedClue.id)
                    ? (language === 'ko' ? '수집 완료' : 'COLLECTED')
                    : (language === 'ko' ? '단서 수집' : 'COLLECT INTEL')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3개 수집 완료 히어로 계약서 해독 모달 */}
      {isContractModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-mono text-xs">
          <div className="w-full max-w-sm rounded-xl border border-emerald-500/40 bg-[#090d16] p-6 shadow-[0_0_30px_rgba(16,185,129,0.2)] relative text-slate-200">
            <div className="flex items-center justify-center mb-3">
              <div className="w-12 h-12 rounded-xl border border-emerald-500/60 bg-emerald-950/40 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
            </div>

            <div className="text-center mb-1">
              <div className="text-[10px] tracking-widest uppercase text-emerald-400 font-bold">
                INTEL DECRYPTED // HERO CONTRACT ACQUIRED
              </div>
              <div className="text-lg font-extrabold text-white mt-1">
                {language === 'ko' ? '기밀 계약 해독 성공' : 'HERO CONTRACT UNLOCKED'}
              </div>
            </div>

            <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-lg p-3 text-center my-4">
              <div className="text-white font-bold text-sm">
                [SSR] 섀도우 블레이드 (Shadow Blade)
              </div>
              <div className="text-[11px] text-slate-300 mt-1">
                {language === 'ko'
                  ? '3대 전술 기밀 단서 해독을 완료하여 전속 히어로 계약이 체결되었습니다.'
                  : 'All 3 intel fragments decrypted. Tactical Hero recruited into your main inventory.'}
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleClaimAndDeploy}
                className="w-full min-h-[48px] rounded border border-emerald-400 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-[0_0_15px_rgba(16,185,129,0.25)]"
              >
                <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <span>{language === 'ko' ? '1클릭 TCG 메인 배틀 출격' : 'DEPLOY TO MAIN TCG BATTLE'}</span>
              </button>

              <button
                onClick={() => {
                  if (!claimed) {
                    claimRecruitedHero(4);
                    setClaimed(true);
                  }
                  setIsContractModalOpen(false);
                }}
                className="w-full min-h-[44px] rounded border border-white/10 bg-white/5 hover:bg-white/10 text-slate-400 font-bold"
              >
                {language === 'ko' ? '인벤토리에 보관' : 'SAVE TO INVENTORY'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TacticalLoreDock;
