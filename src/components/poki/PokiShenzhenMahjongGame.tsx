import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';

interface PokiShenzhenMahjongGameProps {
  onBack?: () => void;
  onExit?: () => void;
  onClose?: () => void;
  deck?: any[];
  cardId?: number;
  language?: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onReward?: (amount: number) => void;
}

interface MahjongTile {
  id: number;
  symbol: string;
  matched: boolean;
}

const SYMBOLS = ['🀄', '🀅', '🀆', '🀇', '🀈', '🀉'];

export const PokiShenzhenMahjongGame: React.FC<PokiShenzhenMahjongGameProps> = ({
  onBack,
  onExit,
  onClose,
  language = 'ko',
  playSfx,
  onReward
}) => {
  const handleExit = onBack || onExit || onClose || (() => {});
  const isKo = language === 'ko';

  const [tiles, setTiles] = useState<MahjongTile[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  useEffect(() => {
    const list: MahjongTile[] = [];
    let id = 1;
    for (const sym of SYMBOLS) {
      list.push({ id: id++, symbol: sym, matched: false });
      list.push({ id: id++, symbol: sym, matched: false });
    }
    // Shuffle
    list.sort(() => Math.random() - 0.5);
    setTiles(list);
  }, []);

  const selectTile = (tile: MahjongTile) => {
    if (tile.matched || gameWon) return;

    if (selectedId === null) {
      setSelectedId(tile.id);
      if (playSfx) playSfx('/sfx/click.mp3');
      if (navigator.vibrate) navigator.vibrate(15);
    } else {
      if (selectedId === tile.id) {
        setSelectedId(null);
        return;
      }
      const first = tiles.find(t => t.id === selectedId);
      if (first && first.symbol === tile.symbol) {
        // Match!
        first.matched = true;
        tile.matched = true;
        const newMatched = matchedPairs + 1;
        setMatchedPairs(newMatched);
        setSelectedId(null);
        if (playSfx) playSfx('/sfx/match.mp3');
        if (navigator.vibrate) navigator.vibrate([20, 20]);

        if (newMatched >= SYMBOLS.length) {
          setGameWon(true);
          const receipt = calculateAndDepositMissionReward({
            gameId: 'pokishenzhenmahjong',
            gameTitle: isKo ? '선전 마작 솔리테어' : 'Shenzhen Mahjong',
            durationSeconds: 30,
            score: 1000,
            maxTargetScore: 1000,
            isVictory: true
          });
          setRewardReceipt(receipt);
          if (onReward) onReward(receipt.totalSns);
        }
      } else {
        // Mismatch
        setSelectedId(null);
        if (navigator.vibrate) navigator.vibrate(80);
      }
    }
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none bg-slate-950 text-white font-mono flex flex-col justify-between p-6">
      <MinimalistMissionHUD
        gameTitle={isKo ? '선전 마작 솔리테어' : 'Shenzhen Mahjong'}
        currentScore={matchedPairs}
        targetScore={6}
        onBack={handleExit}
        stageInfo={`🀄 Pairs: ${matchedPairs}/6`}
      />

      <div className="flex-1 flex flex-col justify-center items-center max-w-sm mx-auto w-full">
        <div className="grid grid-cols-3 gap-3 w-full">
          {tiles.map(tile => (
            <button
              key={tile.id}
              disabled={tile.matched}
              className={`h-24 rounded-2xl border-2 font-bold text-4xl flex items-center justify-center transition-all ${
                tile.matched
                  ? 'opacity-0 pointer-events-none'
                  : selectedId === tile.id
                  ? 'bg-amber-600 border-amber-300 text-white scale-105 shadow-xl'
                  : 'bg-emerald-800 border-emerald-600 active:bg-emerald-700 text-white shadow-md'
              }`}
              onClick={() => selectTile(tile)}
            >
              {tile.symbol}
            </button>
          ))}
        </div>
      </div>

      <div className="text-center text-xs text-emerald-200">
        {isKo ? '같은 문양의 마작 패를 2개씩 짝지어 모든 패를 제거하세요!' : 'Match 2 identical mahjong tiles to clear the board!'}
      </div>

      {rewardReceipt && (
        <VictoryRewardModal
          isOpen={gameWon}
          reward={rewardReceipt}
          onConfirm={handleExit}
        />
      )}
    </div>
  );
};

export default PokiShenzhenMahjongGame;
