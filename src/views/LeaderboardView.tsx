import React, { useState } from 'react';
import { Trophy, ArrowLeft, Swords, Medal, Zap, Star } from 'lucide-react';
import { Language, ViewType } from '../types';

interface LeaderboardViewProps {
  onBack: () => void;
  language: Language;
  user?: any;
  sns: number;
  updateSns: (amount: number, reason: string) => void;
  playSfx: (sound: string) => void;
  onAttackUser?: (opp: any) => void;
  onNavigate: (view: ViewType) => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  onBack,
  language,
  user,
  sns,
  playSfx,
  onAttackUser,
  onNavigate
}) => {
  const isKo = language === 'ko';
  const [tab, setTab] = useState<'rating' | 'wins' | 'sns'>('rating');

  // 더미 명예의 전당 랭커 데이터
  const rankers = [
    { rank: 1, name: '카단마스터', title: '불패의 지휘관', score: 3850, wins: 284, tier: 'MASTER' },
    { rank: 2, name: 'ShadowDuelist', title: '황혼의 검성', score: 3620, wins: 241, tier: 'DIAMOND' },
    { rank: 3, name: '루시안기사단', title: '빛의 인도자', score: 3490, wins: 219, tier: 'DIAMOND' },
    { rank: 4, name: 'DragonSlayer', title: '용살자', score: 3210, wins: 198, tier: 'PLATINUM' },
    { rank: 5, name: '아르카나77', title: '마법 공학자', score: 3080, wins: 175, tier: 'PLATINUM' },
    { rank: 6, name: 'HeroKing', title: '전설의 수호자', score: 2950, wins: 160, tier: 'GOLD' },
    { rank: 7, name: 'PheonixWing', title: '불사조', score: 2820, wins: 142, tier: 'GOLD' },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 font-mono select-none text-[#201d1d] min-h-[85dvh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#201d1d]/15">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 border border-[#201d1d]/20 rounded-sm hover:bg-[#201d1d]/5 active:scale-95 transition-all text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>{isKo ? '뒤로' : 'Back'}</span>
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
              <Trophy size={18} className="text-amber-500" />
              <span>{isKo ? '랭킹 & 명예의 전당' : 'Leaderboard & Hall of Fame'}</span>
            </h1>
            <p className="text-[11px] text-[#201d1d]/60">
              {isKo ? '최고의 영웅들과 실시간 전적 랭킹을 확인하고 도전하세요.' : 'Check top players and challenge rivals.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs border border-[#201d1d]/20 px-3 py-1.5 rounded-sm bg-amber-50 font-bold text-amber-900">
          <Zap size={14} className="text-amber-600" />
          <span>{sns} SNS</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-[#201d1d]/10 pb-2">
        <button
          type="button"
          onClick={() => setTab('rating')}
          className={`px-3 py-1.5 text-xs font-bold rounded-sm cursor-pointer transition-all ${
            tab === 'rating' ? 'bg-[#201d1d] text-white' : 'border border-[#201d1d]/20 hover:bg-[#201d1d]/5'
          }`}
        >
          {isKo ? '배틀 레이팅 순' : 'Rating'}
        </button>
        <button
          type="button"
          onClick={() => setTab('wins')}
          className={`px-3 py-1.5 text-xs font-bold rounded-sm cursor-pointer transition-all ${
            tab === 'wins' ? 'bg-[#201d1d] text-white' : 'border border-[#201d1d]/20 hover:bg-[#201d1d]/5'
          }`}
        >
          {isKo ? '다승 순' : 'Wins'}
        </button>
      </div>

      {/* Ranking List Table */}
      <div className="border border-[#201d1d]/20 bg-white rounded-none overflow-hidden">
        <div className="p-3 bg-[#201d1d]/5 border-b border-[#201d1d]/10 flex items-center justify-between text-[11px] font-black text-[#201d1d]/60">
          <span className="w-12 text-center">{isKo ? '순위' : 'Rank'}</span>
          <span className="flex-1 px-3">{isKo ? '영웅 닉네임' : 'Hero'}</span>
          <span className="w-24 text-center">{isKo ? '티어' : 'Tier'}</span>
          <span className="w-20 text-right pr-4">{isKo ? '포인트' : 'Score'}</span>
          <span className="w-20 text-center">{isKo ? '도전' : 'Battle'}</span>
        </div>

        <div className="divide-y divide-[#201d1d]/10">
          {rankers.map((r) => (
            <div key={r.rank} className="p-3 flex items-center justify-between hover:bg-[#201d1d]/2 transition-all">
              <div className="w-12 text-center font-black flex items-center justify-center">
                {r.rank === 1 ? <Medal size={18} className="text-amber-500" /> :
                 r.rank === 2 ? <Medal size={18} className="text-slate-400" /> :
                 r.rank === 3 ? <Medal size={18} className="text-amber-700" /> :
                 <span className="text-xs text-[#201d1d]/70">#{r.rank}</span>}
              </div>

              <div className="flex-1 px-3">
                <div className="text-xs font-black text-[#201d1d]">{r.name}</div>
                <div className="text-[10px] text-[#201d1d]/50">{r.title}</div>
              </div>

              <div className="w-24 text-center">
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-xs bg-[#201d1d]/10 text-[#201d1d]">
                  {r.tier}
                </span>
              </div>

              <div className="w-20 text-right pr-4 text-xs font-black text-amber-700">
                {r.score.toLocaleString()}
              </div>

              <div className="w-20 text-center">
                <button
                  type="button"
                  onClick={() => {
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                    if (onAttackUser) {
                      onAttackUser({ name: r.name, rating: r.score });
                    } else {
                      onNavigate('play');
                    }
                  }}
                  className="px-2.5 py-1 text-[10px] font-bold bg-[#201d1d] text-white hover:bg-[#201d1d]/85 rounded-sm active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1 mx-auto"
                >
                  <Swords size={12} />
                  <span>{isKo ? '대결' : 'PvP'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardView;
