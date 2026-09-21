import React, { useState } from 'react';
import { Check, Sparkles, Trophy, Zap } from 'lucide-react';

interface WeeklyBingoBoardProps {
  onClaimBingo: (lineIndex: number) => void;
  onUseJokerTicket: (cellIndex: number) => void;
  hasJokerTicket: boolean;
}

export const WeeklyBingoBoard: React.FC<WeeklyBingoBoardProps> = ({
  onClaimBingo,
  onUseJokerTicket,
  hasJokerTicket
}) => {
  // 3x3 board
  const [cells, setCells] = useState<boolean[]>([
    true, true, false,
    false, true, true,
    true, false, false
  ]);

  const bingoMissions = [
    '배틀 3회 승리', '카드 1회 강화', '출석 체크',
    '상점 1회 방문', 'PVP 1회 도전', '미션게임 플레이',
    '주식 1회 매수', '길드 출석', '덱 1회 편집'
  ];

  const toggleCell = (index: number) => {
    if (!cells[index] && hasJokerTicket) {
      const next = [...cells];
      next[index] = true;
      setCells(next);
      onUseJokerTicket(index);
    }
  };

  return (
    <div className="bg-white border border-[rgba(15,0,0,0.12)] p-3 rounded-none font-mono space-y-2.5 select-none">
      <div className="flex items-center justify-between text-xs font-bold text-[#201d1d]">
        <div className="flex items-center gap-1.5">
          <Trophy size={14} className="text-amber-500" />
          <span>[WEEKLY 3x3 GOLDEN BINGO]</span>
        </div>
        <span className="text-[10px] text-[#504a4a]">1줄 완성 시마다 룰렛권 증정</span>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {cells.map((done, idx) => (
          <button
            key={idx}
            onClick={() => toggleCell(idx)}
            className={`h-16 p-1.5 border rounded-sm flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
              done
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100 text-[#201d1d]'
            }`}
          >
            {done ? (
              <Check size={16} className="text-white mb-0.5" />
            ) : (
              <span className="text-[8px] text-zinc-400 mb-0.5">#{idx + 1}</span>
            )}
            <span className="text-[9px] font-bold leading-tight line-clamp-2">
              {bingoMissions[idx]}
            </span>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between bg-zinc-50 p-2 rounded-sm text-[10px]">
        <span className="text-[#504a4a]">황금 조커 티켓 보유: <b>{hasJokerTicket ? '1매' : '0매'}</b></span>
        <button
          onClick={() => onClaimBingo(0)}
          className="px-2 py-1 bg-[#201d1d] hover:bg-zinc-800 text-white font-bold rounded-xs cursor-pointer flex items-center gap-1"
        >
          <Sparkles size={11} className="text-amber-400" />
          <span>빙고 보상 수령</span>
        </button>
      </div>
    </div>
  );
};
