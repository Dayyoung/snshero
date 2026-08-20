import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, Sparkles, X, Trophy, CheckCircle2 } from 'lucide-react';
import { playSfx } from '../lib/sound';

interface LuckyMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardClaim: (snsBonus: number, rewardItemType?: 'rare' | 'epic') => void;
  language: string;
}

interface CardTile {
  id: number;
  pairId: number;
  label: string;
  icon: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export const LuckyMatchModal: React.FC<LuckyMatchModalProps> = ({
  isOpen,
  onClose,
  onRewardClaim,
  language,
}) => {
  const [cards, setCards] = useState<CardTile[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [bonusEarned, setBonusEarned] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      const basePairs = [
        { pairId: 1, label: language === 'ko' ? '다이아 룬' : 'Diamond Rune', icon: '💎' },
        { pairId: 2, label: language === 'ko' ? '골드 체스트' : 'Gold Chest', icon: '👑' },
        { pairId: 3, label: language === 'ko' ? 'SNS 코인' : 'SNS Token', icon: '🪙' },
      ];
      const pairedList: CardTile[] = [];
      let idCounter = 0;
      basePairs.forEach(p => {
        pairedList.push({ id: idCounter++, pairId: p.pairId, label: p.label, icon: p.icon, isFlipped: false, isMatched: false });
        pairedList.push({ id: idCounter++, pairId: p.pairId, label: p.label, icon: p.icon, isFlipped: false, isMatched: false });
      });
      // Shuffle
      const shuffled = pairedList.sort(() => Math.random() - 0.5);
      setCards(shuffled);
      setSelectedCards([]);
      setMatchedPairs(0);
      setIsCompleted(false);
      setBonusEarned(0);
    }
  }, [isOpen, language]);

  const handleCardClick = (id: number) => {
    if (selectedCards.length >= 2) return;
    const card = cards.find(c => c.id === id);
    if (!card || card.isFlipped || card.isMatched) return;

    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    const newCards = cards.map(c => c.id === id ? { ...c, isFlipped: true } : c);
    setCards(newCards);

    const newSelected = [...selectedCards, id];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      const [firstId, secondId] = newSelected;
      const c1 = newCards.find(c => c.id === firstId)!;
      const c2 = newCards.find(c => c.id === secondId)!;

      if (c1.pairId === c2.pairId) {
        // Matched!
        setTimeout(() => {
          playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
          setCards(prev => prev.map(c => (c.id === firstId || c.id === secondId) ? { ...c, isMatched: true } : c));
          setSelectedCards([]);
          setMatchedPairs(m => {
            const nextM = m + 1;
            if (nextM >= 3) {
              setIsCompleted(true);
              const totalBounty = 50;
              setBonusEarned(totalBounty);
              onRewardClaim(totalBounty, 'epic');
            }
            return nextM;
          });
        }, 500);
      } else {
        // Not matched
        setTimeout(() => {
          setCards(prev => prev.map(c => (c.id === firstId || c.id === secondId) ? { ...c, isFlipped: false } : c));
          setSelectedCards([]);
        }, 800);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-mono">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative w-full max-w-sm bg-[#201d1d] border border-[rgba(255,255,255,0.2)] rounded-none p-4 text-[#fdfcfc] shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.12)] pb-2 mb-3">
            <div className="flex items-center gap-1.5">
              <Trophy size={16} className="text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                [ 5-STREAK LUCKY MATCH ]
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white p-1 rounded-sm border border-transparent hover:border-white/20"
            >
              <X size={14} />
            </button>
          </div>

          <p className="text-[10px] text-white/80 mb-3 leading-relaxed">
            {language === 'ko'
              ? '수동 5연승 달성 보너스 룸! 6장의 카드를 뒤집어 3쌍의 보물 짝을 맞추고 추가 보상을 획득하세요.'
              : '5-Win Streak Bonus Room! Match all 3 pairs from the 6 mystery cards to unlock +50 SNS bounty!'}
          </p>

          {/* 6 Cards Grid (2x3) */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {cards.map(card => (
              <button
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                disabled={card.isMatched || card.isFlipped}
                className={`h-20 rounded-sm border flex flex-col items-center justify-center transition-all ${
                  card.isMatched
                    ? 'bg-emerald-950/60 border-emerald-500/80 text-emerald-300'
                    : card.isFlipped
                    ? 'bg-amber-950/70 border-amber-400 text-amber-300'
                    : 'bg-[#141212] border-white/20 hover:border-amber-400/60 text-white/40'
                }`}
              >
                {card.isFlipped || card.isMatched ? (
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xl">{card.icon}</span>
                    <span className="text-[8px] font-bold">{card.label}</span>
                  </div>
                ) : (
                  <span className="text-xs font-bold text-white/30">[?]</span>
                )}
              </button>
            ))}
          </div>

          {/* Status / Claim Banner */}
          {isCompleted ? (
            <div className="bg-emerald-950/70 border border-emerald-400/80 p-2.5 rounded-sm flex flex-col items-center text-center gap-1 mb-3">
              <CheckCircle2 size={18} className="text-emerald-400" />
              <span className="text-xs font-bold text-emerald-300">
                {language === 'ko' ? '🎉 전체 짝맞추기 완료!' : '🎉 All Pairs Matched!'}
              </span>
              <span className="text-[10px] text-amber-300 font-bold">
                +{bonusEarned} SNS & [에픽 룬 비전서] 획득!
              </span>
            </div>
          ) : (
            <div className="text-[10px] text-center text-white/60 mb-3">
              {language === 'ko' ? `완료된 짝: ${matchedPairs} / 3` : `Pairs Matched: ${matchedPairs} / 3`}
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-2 bg-[#fdfcfc] text-[#201d1d] hover:bg-amber-300 transition-colors text-xs font-bold uppercase rounded-sm flex items-center justify-center gap-1.5"
          >
            <Sparkles size={13} />
            <span>{isCompleted ? (language === 'ko' ? '[ 보상 확인 및 닫기 ]' : '[ Claim & Close ]') : (language === 'ko' ? '[ 포기하고 나가기 ]' : '[ Exit ]')}</span>
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
