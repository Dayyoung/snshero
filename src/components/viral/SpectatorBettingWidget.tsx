import React, { useState, useEffect, useRef } from 'react';
import { useGameSettings } from '../../contexts/GameSettingsContext';
import { triggerHaptic } from '../../lib/haptic';

export interface SpectatorBettingWidgetProps {
  deckCode: string;
  isOpen: boolean;
  onClose: () => void;
  onDeckClone?: (deckCode: string) => void;
  language?: string;
}

const SPECTATOR_I18N: Record<string, Record<string, string>> = {
  ko: {
    header: '[엘윈 투기장 // 대륙 영웅 결투 관전 & 승부 예측]',
    badge: '대륙 공인 AI 영웅 결투 시뮬레이션',
    voteBlue: '[블루: 엘윈 수호대 승리 (1.85x)]',
    voteRed: '[레드: 설원 도전자 승리 (2.10x)]',
    voted: '예측 완료: 승부 판정 대기 중...',
    blueLabel: '엘윈 수호대',
    redLabel: '설원 도전자',
    simulating: '대륙 영웅 결투 진행 중',
    correctTitle: '[승부 예측 적중: 200 SNS & 덱 전술 전수!]',
    wrongTitle: '[예측 실패: 결투 분석 완료]',
    correctDesc: '승리 영웅의 전투 전술을 정확히 예측하여 원정 보급품이 지급되었습니다.',
    cloneDeckBtn: '[승리 덱 1클릭 전술 전수]',
    closeBtn: '[투기장 나가기]'
  },
  en: {
    header: '[ELWIN ARENA // HERO DUEL SPECTATOR & BETTING]',
    badge: 'CONTINENTAL ACCREDITED HERO DUEL',
    voteBlue: '[VOTE BLUE: ELWIN GUARD (1.85x)]',
    voteRed: '[VOTE RED: FROST CHALLENGER (2.10x)]',
    voted: 'BET LOCKED: AWAITING DUEL OUTCOME...',
    blueLabel: 'ELWIN GUARD',
    redLabel: 'FROST CHALLENGER',
    simulating: 'HERO DUEL IN PROGRESS',
    correctTitle: '[PREDICTION VERIFIED: 200 SNS & DECK TOKEN!]',
    wrongTitle: '[PREDICTION MISSED: COMBAT RECORDED]',
    correctDesc: 'Accurately predicted the winning hero. Supplies granted.',
    cloneDeckBtn: '[CLONE WINNING DECK]',
    closeBtn: '[LEAVE ARENA]'
  }
};

export const SpectatorBettingWidget: React.FC<SpectatorBettingWidgetProps> = ({
  deckCode,
  isOpen,
  onClose,
  onDeckClone,
  language = 'ko'
}) => {
  const { theme } = useGameSettings();
  const [selectedSide, setSelectedSide] = useState<'blue' | 'red' | null>(null);
  const [isDuelFinished, setIsDuelFinished] = useState<boolean>(false);
  const [winner, setWinner] = useState<'blue' | 'red' | null>(null);
  const [combatProgress, setCombatProgress] = useState<number>(0);

  const t = SPECTATOR_I18N[language] || SPECTATOR_I18N.ko;

  useEffect(() => {
    if (!isOpen) {
      setSelectedSide(null);
      setIsDuelFinished(false);
      setWinner(null);
      setCombatProgress(0);
      return;
    }

    // 시드 기반 6초 가상 결투 시뮬레이션
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setCombatProgress(Math.min(100, progress));
      if (progress >= 100) {
        clearInterval(interval);
        // 결정론적 승자 판정 (덱코드 해시 기반)
        const hash = deckCode.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const resolvedWinner: 'blue' | 'red' = hash % 2 === 0 ? 'blue' : 'red';
        setWinner(resolvedWinner);
        setIsDuelFinished(true);
        triggerHaptic('victory');
      }
    }, 150);

    return () => clearInterval(interval);
  }, [isOpen, deckCode]);

  if (!isOpen) return null;

  const isPredictionCorrect = selectedSide !== null && selectedSide === winner;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[250] bg-black/85 flex items-center justify-center p-3 font-mono text-xs select-none animate-fade-in"
    >
      <div className="w-full max-w-lg bg-[#141212] border border-stone-800 rounded-none text-stone-200 flex flex-col relative overflow-hidden">
        {/* 헤더 */}
        <div className="p-4 border-b border-stone-800 flex items-center justify-between shrink-0 bg-[#181616]">
          <div>
            <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mb-0.5">
              {t.badge}
            </div>
            <h2 className="text-sm font-bold text-white tracking-wide">
              {t.header}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-500 hover:text-white"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* 결투 아레나 시뮬레이션 영역 */}
        <div className="p-4 space-y-4">
          {/* 양측 대진표 */}
          <div className="grid grid-cols-2 gap-3 text-center">
            {/* 블루팀 */}
            <div
              className={`p-3 border rounded-none transition-all ${
                winner === 'blue'
                  ? 'border-cyan-500 bg-cyan-950/30 text-white'
                  : 'border-stone-800 bg-stone-900/60 text-stone-400'
              }`}
            >
              <div className="text-[10px] uppercase font-bold text-cyan-400 mb-1">
                [BLUE TEAM]
              </div>
              <div className="text-sm font-bold text-white truncate">{t.blueLabel}</div>
              <div className="text-[10px] text-cyan-300 mt-1">배당률 1.85x</div>
            </div>

            {/* 레드팀 */}
            <div
              className={`p-3 border rounded-none transition-all ${
                winner === 'red'
                  ? 'border-red-500 bg-red-950/30 text-white'
                  : 'border-stone-800 bg-stone-900/60 text-stone-400'
              }`}
            >
              <div className="text-[10px] uppercase font-bold text-red-400 mb-1">
                [RED TEAM]
              </div>
              <div className="text-sm font-bold text-white truncate">{t.redLabel}</div>
              <div className="text-[10px] text-red-300 mt-1">배당률 2.10x</div>
            </div>
          </div>

          {/* 결투 진행도 게이지 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-stone-400">
              <span>{isDuelFinished ? '[결투 판정 완료]' : `[${t.simulating}]`}</span>
              <span className="text-amber-400 font-bold">{combatProgress}%</span>
            </div>
            <div className="w-full h-2 bg-stone-950 border border-stone-800 rounded-none overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-150"
                style={{ width: `${combatProgress}%` }}
              />
            </div>
          </div>

          {/* 승부 예측 베팅 버튼 (결투 진행 전/중 선택 가능) */}
          {!isDuelFinished ? (
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('tap');
                  setSelectedSide('blue');
                }}
                className={`p-2.5 rounded-sm border font-bold text-xs transition-all min-h-[44px] ${
                  selectedSide === 'blue'
                    ? 'border-cyan-400 bg-cyan-950/50 text-cyan-300'
                    : 'border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-300'
                }`}
              >
                {t.voteBlue}
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('tap');
                  setSelectedSide('red');
                }}
                className={`p-2.5 rounded-sm border font-bold text-xs transition-all min-h-[44px] ${
                  selectedSide === 'red'
                    ? 'border-red-400 bg-red-950/50 text-red-300'
                    : 'border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-300'
                }`}
              >
                {t.voteRed}
              </button>
            </div>
          ) : (
            <div className="p-3 border border-stone-800 bg-stone-900/80 rounded-none space-y-2 text-center">
              <div className={`font-bold text-sm ${isPredictionCorrect ? 'text-amber-300' : 'text-stone-400'}`}>
                {isPredictionCorrect ? t.correctTitle : t.wrongTitle}
              </div>
              <p className="text-xs text-stone-400 leading-relaxed">
                {isPredictionCorrect ? t.correctDesc : '다음 결투에서 다시 도전하세요.'}
              </p>
              {onDeckClone && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('victory');
                    onDeckClone(deckCode);
                    onClose();
                  }}
                  className="w-full mt-2 min-h-[44px] rounded-sm border border-amber-500 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold"
                >
                  {t.cloneDeckBtn}
                </button>
              )}
            </div>
          )}
        </div>

        {/* 하단 닫기 */}
        <div className="p-3 border-t border-stone-800 bg-[#181616] flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 min-h-[44px] rounded-sm border border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs"
          >
            {t.closeBtn}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpectatorBettingWidget;
export const ColosseumSpectatorWidget = SpectatorBettingWidget;
