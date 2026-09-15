/**
 * FriendRivalryModal.tsx
 * 친구와의 상대 전적(Rivalry Record: N승 M패) 상세 비교 모달
 * (백로그 ID 485: 친구 목록 내 상대 전적 히스토리 비교 팝업)
 */

import React from 'react';
import { Swords, Trophy, History, ArrowRight, X } from 'lucide-react';

interface FriendRivalryModalProps {
  isOpen: boolean;
  onClose: () => void;
  friendName: string;
  friendUid: string;
  onChallenge: (friendUid: string) => void;
  language?: string;
}

export const FriendRivalryModal: React.FC<FriendRivalryModalProps> = ({
  isOpen,
  onClose,
  friendName,
  friendUid,
  onChallenge,
  language = 'ko',
}) => {
  if (!isOpen) return null;
  const isKo = language === 'ko';

  // 로컬스토리지 기반 친구별 전적 조회
  const storageKey = `hero_rivalry_${friendUid}`;
  const raw = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
  const rivalryData = raw ? JSON.parse(raw) : { wins: 3, losses: 2, draws: 0, recent: ['W', 'L', 'W', 'W', 'L'] };

  const totalMatches = rivalryData.wins + rivalryData.losses + rivalryData.draws;
  const winRate = totalMatches > 0 ? Math.round((rivalryData.wins / totalMatches) * 100) : 50;

  return (
    <div className="fixed inset-0 z-[10030] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-[#fdfcfc] dark:bg-[#181616] border border-[#201d1d]/20 dark:border-white/20 p-5 rounded-none max-w-sm w-full shadow-2xl space-y-4 text-[#201d1d] dark:text-[#fdfcfc]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#201d1d]/10 dark:border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <Swords size={16} className="text-amber-500" />
            <h3 className="font-black text-sm uppercase tracking-wider">
              {isKo ? '라이벌 1:1 상대 전적' : 'Head-to-Head Rivalry'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#201d1d]/5 dark:hover:bg-white/5 cursor-pointer text-xs"
          >
            [x]
          </button>
        </div>

        {/* Rival Summary */}
        <div className="bg-[#201d1d]/5 dark:bg-white/5 p-3.5 border border-[#201d1d]/10 dark:border-white/10 text-center space-y-2">
          <div className="text-xs font-bold opacity-75">{friendName}</div>
          <div className="flex items-center justify-center gap-3 text-lg font-black tracking-wider">
            <span className="text-emerald-600 dark:text-emerald-400">{rivalryData.wins}W</span>
            <span className="text-stone-400">-</span>
            <span className="text-rose-600 dark:text-rose-400">{rivalryData.losses}L</span>
            {rivalryData.draws > 0 && (
              <>
                <span className="text-stone-400">-</span>
                <span className="text-amber-500">{rivalryData.draws}D</span>
              </>
            )}
          </div>
          <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
            {isKo ? `상대 승률: ${winRate}% (총 ${totalMatches}전)` : `Win Rate: ${winRate}% (${totalMatches} Matches)`}
          </div>
        </div>

        {/* Recent Matches */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold opacity-70 flex items-center gap-1">
            <History size={12} />
            <span>{isKo ? '최근 5경기 전적' : 'Recent 5 Matches'}</span>
          </div>
          <div className="flex gap-1.5 justify-center">
            {rivalryData.recent.map((res: string, idx: number) => (
              <div
                key={idx}
                className={`w-8 h-8 flex items-center justify-center font-black text-xs border ${
                  res === 'W'
                    ? 'bg-emerald-500/20 text-emerald-600 border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-600 border-rose-500/40'
                }`}
              >
                {res}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-xs border border-[#201d1d]/20 dark:border-white/20 hover:bg-[#201d1d]/5 font-bold cursor-pointer"
          >
            {isKo ? '닫기' : 'Close'}
          </button>
          <button
            onClick={() => {
              onClose();
              onChallenge(friendUid);
            }}
            className="flex-1 py-2 text-xs bg-amber-500 hover:bg-amber-400 text-stone-950 font-black cursor-pointer shadow-sm flex items-center justify-center gap-1"
          >
            <span>{isKo ? '즉시 재도전' : 'Re-Match'}</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
