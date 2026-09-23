import React, { useState } from 'react';
import { Award, ArrowLeft, CheckCircle2, Zap, Calendar, Target, Gift } from 'lucide-react';
import { Language, ViewType } from '../types';

interface QuestAchievementViewProps {
  language: Language;
  sns: number;
  updateSns: (amount: number, reason: string) => void;
  playSfx: (sound: string) => void;
  onNavigate: (view: ViewType) => void;
}

export const QuestAchievementView: React.FC<QuestAchievementViewProps> = ({
  language,
  sns,
  updateSns,
  playSfx,
  onNavigate
}) => {
  const isKo = language === 'ko';
  const [claimedMissions, setClaimedMissions] = useState<Record<string, boolean>>({});

  const missions = [
    { id: 'm1', title: isKo ? '일일 로그인 완료' : 'Daily Login', reward: 20, desc: isKo ? '매일 SNS히어로 접속 시 보상' : 'Log in every day', progress: '1/1', done: true },
    { id: 'm2', title: isKo ? '카드 배틀 3회 승리' : 'Win 3 Card Battles', reward: 50, desc: isKo ? '미션 또는 랭킹대전에서 승리' : 'Win matches in game', progress: '2/3', done: false },
    { id: 'm3', title: isKo ? '카드 소환 또는 융합 1회' : 'Summon or Fuse Card', reward: 30, desc: isKo ? '상점 소환 또는 융합소 이용' : 'Use shop or fusion lab', progress: '1/1', done: true },
    { id: 'm4', title: isKo ? '길드 출석 체크' : 'Guild Check-in', reward: 15, desc: isKo ? '길드 아지트 방문' : 'Visit guild house', progress: '1/1', done: true },
  ];

  const handleClaim = (id: string, reward: number) => {
    if (claimedMissions[id]) return;
    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    updateSns(reward, '일일 퀘스트 보상 수령');
    setClaimedMissions(prev => ({ ...prev, [id]: true }));
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 font-mono select-none text-[#201d1d] min-h-[85dvh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#201d1d]/15">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="p-2 border border-[#201d1d]/20 rounded-sm hover:bg-[#201d1d]/5 active:scale-95 transition-all text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>{isKo ? '로비' : 'Lobby'}</span>
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
              <Award size={18} className="text-amber-500" />
              <span>{isKo ? '퀘스트 & 업적 센터' : 'Quest & Achievement Center'}</span>
            </h1>
            <p className="text-[11px] text-[#201d1d]/60">
              {isKo ? '매일 주어지는 미션을 달성하고 풍성한 SNS 보상을 획득하세요.' : 'Complete daily quests and claim SNS rewards.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs border border-[#201d1d]/20 px-3 py-1.5 rounded-sm bg-amber-50 font-bold text-amber-900">
          <Zap size={14} className="text-amber-600" />
          <span>{sns} SNS</span>
        </div>
      </div>

      {/* Quest List */}
      <div className="space-y-3">
        {missions.map((m) => {
          const isClaimed = claimedMissions[m.id];

          return (
            <div
              key={m.id}
              className="p-4 border border-[#201d1d]/20 bg-white rounded-none flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-sm flex items-center justify-center border ${
                  m.done ? 'bg-emerald-50 border-emerald-400 text-emerald-600' : 'bg-stone-50 border-stone-300 text-stone-400'
                }`}>
                  <Target size={18} />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-black text-[#201d1d] flex items-center gap-2">
                    <span>{m.title}</span>
                    <span className="text-[10px] text-amber-600 font-bold">+{m.reward} SNS</span>
                  </div>
                  <div className="text-[11px] text-[#201d1d]/60 mt-0.5">{m.desc}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-[#201d1d]/70">{m.progress}</span>
                {isClaimed ? (
                  <span className="px-3 py-1.5 text-xs font-bold text-stone-400 border border-stone-300 rounded-sm bg-stone-100 flex items-center gap-1">
                    <CheckCircle2 size={13} />
                    <span>{isKo ? '수령 완료' : 'Claimed'}</span>
                  </span>
                ) : m.done ? (
                  <button
                    type="button"
                    onClick={() => handleClaim(m.id, m.reward)}
                    className="px-3 py-1.5 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-sm active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Gift size={13} />
                    <span>{isKo ? '보상 받기' : 'Claim'}</span>
                  </button>
                ) : (
                  <span className="px-3 py-1.5 text-xs font-bold text-stone-400 border border-stone-200 rounded-sm">
                    {isKo ? '진행 중' : 'In Progress'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuestAchievementView;
