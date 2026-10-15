import React, { useState, useEffect } from 'react';
import {
  LoreClue,
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
    setClaimed(isHeroClaimed(41));
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
    claimRecruitedHero(41);
    setClaimed(true);
    setIsContractModalOpen(false);
    if (typeof window !== 'undefined' && (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag) {
      (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('event', 'lore_battle_deploy_click', {
        hero_id: 41,
      });
    }
    if (onDeployToBattle) {
      onDeployToBattle();
    }
  };

  return (
    <>
      {/* 하단 슬림 도킹 바 (OpenCode.ai 모노스페이스 플랫 디자인) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#141212] border-t border-stone-800 text-stone-200 font-mono text-xs select-none">
        <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* 고대 나침반/룬 인라인 SVG */}
            <div className="w-7 h-7 rounded-none border border-stone-700 bg-stone-900 flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <circle cx="12" cy="12" r="9" />
                <polygon points="12 4 14.5 9.5 20 12 14.5 14.5 12 20 9.5 14.5 4 12 9.5 9.5 12 4" />
              </svg>
            </div>

            <div className="min-w-0 truncate">
              <div className="text-[10px] text-stone-400 uppercase tracking-wider truncate">
                {language === 'ko' ? '[카단 연대기 고대 유물 서약]' : '[KADAN CHRONICLES ANCIENT VOW]'}
              </div>
              <div className="text-white font-bold flex items-center gap-1.5 text-xs truncate">
                <span>{language === 'ko' ? '기록 수집' : 'Lore Fragments'}:</span>
                <span className="text-amber-400 font-extrabold">{totalCollected} / 3</span>
                <span className="text-[10px] text-stone-500 hidden sm:inline">
                  {isUnlocked
                    ? (language === 'ko' ? '[서약 완결]' : '[VOW COMPLETED]')
                    : (language === 'ko' ? '(소설 속 고유명사 단서 수집)' : '(Collect lore clues in text)')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isUnlocked ? (
              <button
                onClick={() => setIsContractModalOpen(true)}
                className="px-3 min-h-[44px] rounded-sm border border-amber-500 bg-amber-500/10 text-amber-300 font-bold text-xs flex items-center gap-1.5 hover:bg-amber-500/20 active:scale-95 transition-all"
              >
                <svg className="w-3.5 h-3.5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span>{claimed ? (language === 'ko' ? '[설원 배틀 출격]' : '[DEPLOY TO DUEL]') : (language === 'ko' ? '[영웅 서약 확인]' : '[HERO VOW]')}</span>
              </button>
            ) : (
              <div className="flex items-center gap-1">
                {[0, 1, 2].map((idx) => (
                  <div
                    key={idx}
                    className={`w-6 h-6 rounded-none border flex items-center justify-center text-[10px] font-mono ${
                      idx < totalCollected
                        ? 'border-amber-500/80 bg-amber-950/30 text-amber-400 font-bold'
                        : 'border-stone-800 bg-stone-900/50 text-stone-600'
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

      {/* 단서 상세 팝오버 모달 (OpenCode.ai 모노스페이스 플랫) */}
      {selectedClue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 font-mono text-xs animate-fade-in">
          <div className="w-full max-w-sm rounded-none border border-stone-800 bg-[#181616] p-5 text-stone-200 relative">
            <button
              onClick={() => setSelectedClue(null)}
              className="absolute top-4 right-4 p-1 text-stone-500 hover:text-white"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="flex items-center gap-2 mb-3">
              <span className="text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                {language === 'ko' ? '[카단 연대기 고대 유물]' : '[KADAN CHRONICLES RELIC]'}
              </span>
            </div>

            <div className="text-sm font-bold text-white mb-1.5">{selectedClue.title}</div>
            <div className="text-[11px] text-stone-400 mb-3">
              <span className="text-stone-500">{language === 'ko' ? '키워드: ' : 'Keyword: '}</span>
              <span className="text-amber-400 font-bold">[{selectedClue.keyword}]</span>
            </div>

            <div className="bg-stone-900/90 border border-stone-800 rounded-none p-3 text-stone-300 leading-relaxed text-xs mb-4">
              {selectedClue.secretBrief}
            </div>

            <div className="text-[11px] text-stone-400 mb-4 flex items-center justify-between">
              <span className="text-stone-500">{language === 'ko' ? '연관 인물' : 'Related Hero'}:</span>
              <span className="text-white font-bold">{selectedClue.relatedHeroName}</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedClue(null)}
                className="flex-1 min-h-[44px] rounded-sm border border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold"
              >
                {language === 'ko' ? '[닫기]' : '[CLOSE]'}
              </button>
              <button
                onClick={() => {
                  handleCollect(selectedClue);
                  setSelectedClue(null);
                }}
                disabled={collectedIds.includes(selectedClue.id)}
                className={`flex-1 min-h-[44px] rounded-sm border font-bold flex items-center justify-center gap-1.5 transition-all ${
                  collectedIds.includes(selectedClue.id)
                    ? 'border-stone-800 bg-stone-900 text-stone-600 cursor-not-allowed'
                    : 'border-amber-500 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                }`}
              >
                <span>
                  {collectedIds.includes(selectedClue.id)
                    ? (language === 'ko' ? '[수집 완료]' : '[COLLECTED]')
                    : (language === 'ko' ? '[기록 각인]' : '[IMPRINT LORE]')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3개 수집 완료 영웅 서약 해독 모달 (플랫 1px 보더) */}
      {isContractModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 font-mono text-xs animate-fade-in">
          <div className="w-full max-w-sm rounded-none border border-stone-700 bg-[#181616] p-6 text-stone-200 relative">
            <div className="flex items-center justify-center mb-3">
              <div className="w-12 h-12 rounded-none border border-amber-500/60 bg-amber-950/20 flex items-center justify-center text-amber-400">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
            </div>

            <div className="text-center mb-2">
              <div className="text-[10px] tracking-wider uppercase text-amber-400 font-bold">
                [VOW FULFILLED // HERO RECRUITED]
              </div>
              <div className="text-base font-bold text-white mt-1">
                {language === 'ko' ? '카단 연대기 서약 성취' : 'KADAN HERO VOW UNLOCKED'}
              </div>
            </div>

            <div className="bg-stone-900/80 border border-stone-800 rounded-none p-3 text-center my-4">
              <div className="text-amber-300 font-bold text-sm">
                #041 [SSR] 카단 (Kadan)
              </div>
              <div className="text-[11px] text-stone-400 mt-1 leading-relaxed">
                {language === 'ko'
                  ? '헤르쿨의 단검, 알렉산다르의 검집, 발리안의 창끝이 가리키는 진실을 모았습니다. 주인공 카단이 덱으로 합류합니다.'
                  : 'All 3 relic vows gathered. Protagonist Kadan joins your permanent hero pool.'}
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleClaimAndDeploy}
                className="w-full min-h-[44px] rounded-sm border border-amber-500 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <span>{language === 'ko' ? '[카단과 함께 엘윈 설원 출격]' : '[DEPLOY WITH KADAN]'}</span>
              </button>

              <button
                onClick={() => {
                  if (!claimed) {
                    claimRecruitedHero(41);
                    setClaimed(true);
                  }
                  setIsContractModalOpen(false);
                }}
                className="w-full min-h-[44px] rounded-sm border border-stone-800 bg-stone-900/60 hover:bg-stone-800 text-stone-400 font-bold"
              >
                {language === 'ko' ? '[인벤토리에 영웅 보관]' : '[KEEP IN INVENTORY]'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TacticalLoreDock;
export const AncientRuneAnnotation = TacticalLoreDock;
