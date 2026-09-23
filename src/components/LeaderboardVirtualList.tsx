import React, { useState } from 'react';
import { Trophy, Swords, Shield, ChevronRight } from 'lucide-react';

export interface LeaderboardRanker {
  rank: number;
  userId: string;
  userName: string;
  avatar: string;
  rating: number;
  tier: string;
  winCount: number;
  defenseDeckPower: number;
}

interface LeaderboardVirtualListProps {
  rankers: LeaderboardRanker[];
  currentUserId: string;
  onChallengeRival: (ranker: LeaderboardRanker) => void;
}

export const LeaderboardVirtualList: React.FC<LeaderboardVirtualListProps> = ({
  rankers,
  currentUserId,
  onChallengeRival
}) => {
  const [sliceCount, setSliceCount] = useState<number>(20);

  const visibleRankers = rankers.slice(0, sliceCount);

  return (
    <div className="space-y-2 font-mono select-none">
      <div className="space-y-1.5">
        {visibleRankers.map((ranker) => {
          const isMe = ranker.userId === currentUserId;
          const isTop3 = ranker.rank <= 3;

          return (
            <div
              key={ranker.userId}
              className={`p-2.5 border rounded-sm flex items-center justify-between transition-all ${
                isMe
                  ? 'bg-amber-50/70 border-amber-300'
                  : 'bg-white border-[rgba(15,0,0,0.12)] hover:border-zinc-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 flex items-center justify-center font-black text-xs rounded-sm ${
                    ranker.rank === 1
                      ? 'bg-amber-400 text-black'
                      : ranker.rank === 2
                      ? 'bg-zinc-300 text-black'
                      : ranker.rank === 3
                      ? 'bg-amber-700 text-white'
                      : 'bg-zinc-100 text-zinc-700'
                  }`}
                >
                  {ranker.rank}
                </div>
                <div>
                  <div className="text-xs font-black text-[#201d1d] flex items-center gap-1.5">
                    <span>{ranker.userName}</span>
                    {isMe && (
                      <span className="px-1 py-0.2 bg-[#201d1d] text-white text-[8px] rounded-xs font-normal">
                        나
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-[#504a4a]">
                    전투력: {ranker.defenseDeckPower.toLocaleString()} | 승률: {ranker.winCount}승
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-emerald-600">
                  {ranker.rating} LP
                </span>
                {!isMe && (
                  <button
                    onClick={() => onChallengeRival(ranker)}
                    className="px-2.5 py-1.5 bg-[#201d1d] hover:bg-zinc-800 text-white text-[10px] font-bold rounded-sm border border-[#201d1d] cursor-pointer flex items-center gap-1 active:scale-95"
                  >
                    <Swords size={11} />
                    <span>도전</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {rankers.length > sliceCount && (
        <button
          onClick={() => setSliceCount((prev) => prev + 20)}
          className="w-full py-2.5 bg-white border border-[rgba(15,0,0,0.12)] text-[#504a4a] text-xs font-bold rounded-sm hover:bg-zinc-50 cursor-pointer"
        >
          [더 보기 (현재 {Math.min(sliceCount, rankers.length)} / {rankers.length})]
        </button>
      )}
    </div>
  );
};
