import React, { useState, useEffect } from 'react';
import { Trophy, Flame, Zap, X, ChevronRight, CheckCircle, Sparkles } from 'lucide-react';
import { playSfx } from '../lib/sound';
import { triggerHaptic } from '../lib/haptic';

interface MiniGameChampionshipTickerProps {
  language: string;
  onSelectGame?: (gameId: string) => void;
}

const MOCK_CHAMPIONS = [
  { rank: 1, name: 'DragonSlayer99', game: '배틀 아레나', score: '98,420점', badge: '🥇' },
  { rank: 2, name: 'NeonRider', game: '스피드 러너', score: '91,200점', badge: '🥈' },
  { rank: 3, name: 'PixelMaster', game: '블록 블래스터', score: '86,750점', badge: '🥉' },
  { rank: 4, name: 'VoxelAce', game: '슬라임 키보드', score: '79,130점', badge: '4위' },
  { rank: 5, name: 'CyberBlade', game: '스틱맨 배틀', score: '72,400점', badge: '5위' },
];

export const MiniGameChampionshipTicker: React.FC<MiniGameChampionshipTickerProps> = ({
  language,
  onSelectGame
}) => {
  const isKo = language === 'ko';
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasDoubleTicket, setHasDoubleTicket] = useState<boolean>(() => {
    return typeof window !== 'undefined' && localStorage.getItem('hero_championship_double_ticket') === 'true';
  });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx(prev => (prev + 1) % MOCK_CHAMPIONS.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const curChamp = MOCK_CHAMPIONS[currentIdx];

  const handleBuyDoubleTicket = () => {
    setIsProcessing(true);
    triggerHaptic('heavy');
    playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    setTimeout(() => {
      localStorage.setItem('hero_championship_double_ticket', 'true');
      setHasDoubleTicket(true);
      setIsProcessing(false);
    }, 600);
  };

  return (
    <>
      <div className="w-full bg-[#131111] border border-amber-500/40 p-2.5 rounded-none font-mono flex items-center justify-between gap-2 shadow-sm text-xs">
        {/* Ticker Content */}
        <div className="flex items-center gap-2 overflow-hidden flex-1">
          <span className="p-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-none shrink-0 flex items-center gap-1 font-bold text-[11px]">
            <Trophy size={13} />
            {isKo ? '주간 챔피언십' : 'Championship'}
          </span>
          <div className="flex items-center gap-1.5 truncate text-[11px]">
            <span className="text-amber-300 font-bold">{curChamp.badge}</span>
            <span className="text-white font-black truncate">{curChamp.name}</span>
            <span className="text-white/40">|</span>
            <span className="text-amber-200/80 truncate">[{curChamp.game}]</span>
            <span className="text-emerald-400 font-bold shrink-0">{curChamp.score}</span>
          </div>
        </div>

        {/* 2x Ticket Button */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
            setIsModalOpen(true);
          }}
          className={`min-h-[44px] px-3 py-1 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 shrink-0 cursor-pointer transition-all border ${
            hasDoubleTicket
              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
              : 'bg-amber-400 hover:bg-amber-300 text-black border-amber-300 shadow-md active:scale-95'
          }`}
        >
          <Zap size={13} />
          <span>{hasDoubleTicket ? (isKo ? '2배 부스터 적용중' : '2X Active') : (isKo ? '2배 도전 티켓' : '2X Ticket')}</span>
        </button>
      </div>

      {/* 2X Ticket Purchase Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs font-mono select-none">
          <div className="relative w-full max-w-sm bg-[#161313] border border-amber-500/70 p-4 text-white shadow-2xl rounded-none flex flex-col space-y-3">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-2.5 right-2.5 text-white/60 hover:text-white p-1 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-1.5 text-amber-400">
              <Zap size={18} />
              <span className="text-xs font-black uppercase">
                {isKo ? '[주간 챔피언십 2배 도전권]' : '[CHAMPIONSHIP 2X BOOSTER]'}
              </span>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-center space-y-2">
              <h4 className="text-sm font-black text-amber-300">
                {isKo ? '모든 미니게임 점수 & SNS 보상 2배!' : 'Double Score & 2X SNS Rewards!'}
              </h4>
              <p className="text-[11px] text-white/70 leading-relaxed">
                {isKo
                  ? '구매 시 24시간 동안 모든 미션 게임의 랭킹 획득 점수와 승리 SNS 포인트가 200%로 2배 폭증합니다.'
                  : 'Get 2X Ranking points and 2X SNS victory rewards across all 110 games for 24 hours.'}
              </p>
            </div>

            {hasDoubleTicket ? (
              <div className="p-2.5 bg-emerald-950/40 border border-emerald-500 text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                <CheckCircle size={14} />
                <span>{isKo ? '현재 2배 도전 티켓 활성화 상태' : '2X Ticket Active'}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleBuyDoubleTicket}
                disabled={isProcessing}
                className="w-full min-h-[48px] bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-xs uppercase tracking-wider rounded-none flex items-center justify-center gap-1.5 cursor-pointer shadow-lg active:scale-98"
              >
                <Zap size={16} />
                <span>
                  {isProcessing
                    ? (isKo ? '결제 처리 중...' : 'Processing...')
                    : (isKo ? '[500원으로 24시간 2배 티켓 구매]' : '[Buy 2X Ticket for $0.50]')}
                </span>
              </button>
            )}

            <button
              onClick={() => setIsModalOpen(false)}
              className="w-full min-h-[40px] text-white/50 hover:text-white text-[11px] font-bold cursor-pointer"
            >
              [{isKo ? '닫기' : 'Close'}]
            </button>
          </div>
        </div>
      )}
    </>
  );
};
