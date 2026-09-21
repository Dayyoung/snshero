/**
 * LeaderboardView.tsx - SCR-10-13, SCR-10-14, SCR-10-15
 * 랭킹 & 명예의 전당 뷰 (Web Worker 순위 예측, 60fps 베지어 보간, 라이벌 매치업, 티어 승급 잭팟)
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Swords, Crown, Sparkles, Flame, ShieldAlert, ArrowUp, ArrowDown, 
  TrendingUp, RefreshCw, UserCheck, ChevronLeft 
} from 'lucide-react';
import { Language, ViewType } from '../types';
import { PageHeader } from '../components/PageHeader';
import { triggerHaptic } from '../lib/haptic';
import { RankSmoothInterpolator } from '../lib/RankSmoothInterpolator';
import { RivalMatchupCard, RivalUser } from '../components/RivalMatchupCard';
import { SwipeToChallengeGesture } from '../components/SwipeToChallengeGesture';
import { TierPromotionJackpotModal } from '../components/TierPromotionJackpotModal';

interface LeaderboardViewProps {
  onBack: () => void;
  language: Language;
  user?: any;
  sns?: number;
  updateSns?: (amount: number, reason?: string) => void;
  playSfx: (url: string) => void;
  onAttackUser?: (opponent: any) => void;
  onNavigate?: (view: ViewType) => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  onBack,
  language,
  user,
  sns = 0,
  updateSns,
  playSfx,
  onAttackUser,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'season' | 'rivals' | 'hall'>('rivals');
  const [displayPoints, setDisplayPoints] = useState(2450);
  const [isJackpotOpen, setIsJackpotOpen] = useState(false);
  const [promotedTier, setPromotedTier] = useState('다이아몬드 III');

  // SCR-10-13: Rank Smooth Interpolator
  const interpolatorRef = useRef<RankSmoothInterpolator>(new RankSmoothInterpolator(2450, 500));

  // SCR-10-14: Rival Users
  const sampleRivals: RivalUser[] = [
    { rank: 41, name: '크림슨나이트', totalPower: 4890, points: 2510, winRate: 68 },
    { rank: 42, name: user?.displayName || '나(Player)', totalPower: 4720, points: 2450, winRate: 64, isMe: true },
    { rank: 43, name: '아쿠아위자드', totalPower: 4610, points: 2410, winRate: 61 },
  ];

  // Interpolation tick animation loop
  useEffect(() => {
    let animId: number;
    const loop = () => {
      const current = interpolatorRef.current.getCurrentValue();
      setDisplayPoints(Math.round(current));
      if (!interpolatorRef.current.isFinished()) {
        animId = requestAnimationFrame(loop);
      }
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Challenge rival
  const handleChallenge = (rival: RivalUser) => {
    triggerHaptic('heavy');
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    if (onAttackUser) {
      onAttackUser({
        id: `rival_${rival.rank}`,
        name: rival.name,
        deck: [],
        totalPower: rival.totalPower,
        sns: 100,
        wins: 15,
        losses: 5,
        draws: 0,
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-mono flex flex-col select-none">
      <PageHeader
        title={language === 'ko' ? '[🏆 랭킹 & 명예의 전당]' : '[🏆 Leaderboard & Hall of Fame]'}
        description={language === 'ko' ? '60fps 베지어 실시간 보간 & 라이벌 즉시 매치업' : '60fps Bezier Interpolation & Rival Matchup'}
        onBack={onBack}
        rightElement={
          <button
            type="button"
            onClick={() => setIsJackpotOpen(true)}
            className="px-2.5 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-xs font-black rounded-lg flex items-center gap-1 cursor-pointer active:scale-95 shadow-md"
          >
            <Trophy size={13} />
            <span>승급 잭팟</span>
          </button>
        }
      />

      {/* Main Content */}
      <div className="flex-1 p-4 max-w-xl mx-auto w-full flex flex-col gap-4">
        {/* Tier & Points Status Banner */}
        <div className="p-4 bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 border border-indigo-500/40 rounded-2xl flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-400 flex items-center justify-center text-2xl">
              💎
            </div>
            <div>
              <div className="text-xs font-black text-indigo-300">{promotedTier}</div>
              <div className="text-lg font-black text-white">
                {displayPoints.toLocaleString()} <span className="text-xs text-amber-400">pt</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">내 현재 순위</span>
            <span className="text-sm font-black text-emerald-400">#42위 (상위 3.2%)</span>
          </div>
        </div>

        {/* Tab Switch */}
        <div className="grid grid-cols-3 p-1 bg-slate-900 rounded-xl gap-1 border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('rivals')}
            className={`py-2 text-xs font-black rounded-lg transition-all ${
              activeTab === 'rivals' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            라이벌 매치업
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('season')}
            className={`py-2 text-xs font-black rounded-lg transition-all ${
              activeTab === 'season' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            시즌 랭킹
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('hall')}
            className={`py-2 text-xs font-black rounded-lg transition-all ${
              activeTab === 'hall' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            명예의 전당
          </button>
        </div>

        {/* SCR-10-14: Rival Matchup Card with Swipe to Challenge */}
        {activeTab === 'rivals' && (
          <div className="flex flex-col gap-3">
            <SwipeToChallengeGesture
              rivalName="크림슨나이트"
              onChallenge={() => handleChallenge(sampleRivals[0])}
            >
              <RivalMatchupCard
                myRank={42}
                rivals={sampleRivals}
                onSelectRival={handleChallenge}
              />
            </SwipeToChallengeGesture>

            <div className="text-center text-[10px] text-slate-400">
              💡 라이벌 카드를 위로 스와이프하거나 [도전] 버튼을 눌러 즉시 결투를 시작하세요!
            </div>
          </div>
        )}

        {/* Season Ranking List */}
        {activeTab === 'season' && (
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col gap-2">
            <div className="text-xs font-bold text-slate-300 mb-2">실시간 시즌 TOP 랭커</div>
            {[
              { rank: 1, name: '용검사 카단', score: '3,820 pt', tier: '그랜드마스터' },
              { rank: 2, name: '그림자 암살자', score: '3,650 pt', tier: '마스터' },
              { rank: 3, name: '빛의 성녀', score: '3,540 pt', tier: '마스터' },
            ].map((r) => (
              <div key={r.rank} className="p-2 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-black text-amber-400">#{r.rank}</span>
                  <span className="font-bold text-white">{r.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-indigo-400">{r.tier}</span>
                  <span className="font-bold text-amber-300">{r.score}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Hall of Fame */}
        {activeTab === 'hall' && (
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl text-center flex flex-col items-center gap-3">
            <Crown size={32} className="text-amber-400" />
            <h4 className="text-sm font-black text-white">시즌 1 불멸의 챔피언</h4>
            <p className="text-xs text-slate-400">
              최고 승률 84.2%를 기록한 초대 챔피언 '용검사 카단' 님의 영구 기념비입니다.
            </p>
          </div>
        )}
      </div>

      {/* SCR-10-15: Tier Promotion Jackpot Modal */}
      <TierPromotionJackpotModal
        isOpen={isJackpotOpen}
        onClose={() => setIsJackpotOpen(false)}
        tierName={promotedTier}
        onClaimReward={(bonusSns) => {
          if (updateSns) {
            updateSns(bonusSns, `[${promotedTier} 승급 잭팟 보너스]`);
          }
        }}
        onBuySafeguardPass={() => {
          if (updateSns) {
            updateSns(-300, '[티어 세이프가드 패스 활성화]');
          }
        }}
      />
    </div>
  );
};
