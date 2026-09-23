import React from 'react';

interface SwipeToBetCardProps {
  id: string;
  title: string;
  category?: string;
  homeTeam?: string;
  awayTeam?: string;
  homeOdds?: number;
  awayOdds?: number;
  onBet?: (choice: string) => void;
  [key: string]: any;
}

export const SwipeToBetCard: React.FC<SwipeToBetCardProps> = ({
  title,
  homeTeam = 'YES',
  awayTeam = 'NO',
  homeOdds = 1.85,
  awayOdds = 2.10,
  onBet
}) => {
  return (
    <div className="p-4 border border-[#201d1d]/20 bg-white rounded-sm font-mono my-2 text-[#201d1d]">
      <h4 className="text-xs font-black mb-3">{title}</h4>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onBet?.('home')}
          className="flex-1 py-2 text-xs font-bold border border-emerald-500 bg-emerald-50 text-emerald-900 rounded-sm hover:bg-emerald-100"
        >
          {homeTeam} ({homeOdds.toFixed(2)}x)
        </button>
        <button
          type="button"
          onClick={() => onBet?.('away')}
          className="flex-1 py-2 text-xs font-bold border border-rose-500 bg-rose-50 text-rose-900 rounded-sm hover:bg-rose-100"
        >
          {awayTeam} ({awayOdds.toFixed(2)}x)
        </button>
      </div>
    </div>
  );
};

export default SwipeToBetCard;
