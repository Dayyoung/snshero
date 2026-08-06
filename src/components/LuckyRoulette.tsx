import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Zap, Coins, Star, Package, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { CardItem } from './CardItem';
import { CARD_DATABASE } from '../cardDatabase';
import { SNS_ECONOMY_COSTS } from '../content/snsEconomy';
import type { CardRarity } from '../types';

interface Prize {
  id: string;
  type: 'card' | 'lose';
  rarity?: CardRarity;
  weight: number; // Percentage
  label: string;
  label_ko: string;
  color: string;
  icon: any;
  startAngle: number;
  endAngle: number;
}

interface LuckyRouletteProps {
  isOpen: boolean;
  onClose: () => void;
  sns: number;
  updateSns: (amount: number) => void;
  addCard: (rarity: CardRarity, indexOverride?: number, isSilent?: boolean) => void;
  addItem: () => void;
  playSfx: (url: string) => void;
  language: string;
  triggerDeckUpgradeCheck?: (indexes: number[]) => void;
}

export const LuckyRoulette: React.FC<LuckyRouletteProps> = ({
  isOpen,
  onClose,
  sns,
  updateSns,
  addCard,
  addItem,
  playSfx,
  language,
  triggerDeckUpgradeCheck
}) => {
  const spinCost = SNS_ECONOMY_COSTS.event.roulette;
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [prize, setPrize] = useState<Prize | null>(null);
  const [showReward, setShowReward] = useState(false);
  const [rewardCardIdx, setRewardCardIdx] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  
  const rotationRef = useRef(0);
  const prizeRef = useRef<Prize | null>(null);
  const requestRef = useRef<number | null>(null);
  const stopTimeRef = useRef<number | null>(null);
  const currentSpeedRef = useRef(0);
  const targetRotationRef = useRef(0);

  // Define prizes with exact weights from user request
  // Total weight: 50 (꽝) + 25 (Bronze) + 24.5 (Silver) + 0.15 (Gold) + 0.35 (Platinum/Rem) = 100%
  const prizesData = [
    { id: 'lose', type: 'lose', weight: 50, label: 'BOOM!', label_ko: '꽝!', color: '#3f3f46', icon: XCircle },
    { id: 'bronze', type: 'card', rarity: 'bronze', weight: 25, label: 'BRONZE', label_ko: '브론즈', color: '#fb923c', icon: Star },
    { id: 'silver', type: 'card', rarity: 'silver', weight: 24.5, label: 'SILVER', label_ko: '실버', color: '#9ca3af', icon: Star },
    { id: 'gold', type: 'card', rarity: 'gold', weight: 0.15, label: 'GOLD', label_ko: '골드', color: '#facc15', icon: Star },
    { id: 'platinum', type: 'card', rarity: 'platinum', weight: 0.35, label: 'PLATINUM', label_ko: '플래티넘', color: '#60a5fa', icon: Sparkles },
  ];

  // Calculate angles based on weights
  const prizes: Prize[] = [];
  let currentAngle = 0;
  prizesData.forEach((p, i) => {
    const sweep = (p.weight / 100) * 360;
    prizes.push({
      ...p,
      startAngle: currentAngle,
      endAngle: currentAngle + sweep,
    } as Prize);
    currentAngle += sweep;
  });

  const animate = (time: number) => {
    if (!stopTimeRef.current) {
      // Constant fast rotation
      currentSpeedRef.current = Math.min(currentSpeedRef.current + 0.5, 15);
      rotationRef.current += currentSpeedRef.current;
    } else {
      // Deceleration
      const elapsed = time - stopTimeRef.current;
      const duration = 3500;
      const progress = Math.min(elapsed / duration, 1);
      
      const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);
      const currentProgress = easeOut(progress);
      
      const startRotation = targetRotationRef.current - 1500; 
      rotationRef.current = startRotation + (targetRotationRef.current - startRotation) * currentProgress;

      if (progress >= 1) {
        setIsSpinning(false);
        setRotation(rotationRef.current);
        finishSpin();
        return;
      }
    }
    setRotation(rotationRef.current);
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (isSpinning) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isSpinning]);

  const startSpin = () => {
    if (isSpinning || showReward) return;
    if (sns < spinCost) {
      setNotice(language === 'ko' ? 'SNS 코인이 부족합니다.' : 'Insufficient SNS coins.');
      setTimeout(() => setNotice(null), 3000);
      return;
    }

    updateSns(-spinCost);
    setIsSpinning(true);
    setPrize(null);
    setShowReward(false);
    stopTimeRef.current = null;
    currentSpeedRef.current = 0;
    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
  };

  const handleStop = () => {
    if (!isSpinning || stopTimeRef.current) return;

    stopTimeRef.current = performance.now();
    
    // Pick prize based on weighted random
    const roll = Math.random() * 100;
    let accum = 0;
    let selectedPrize = prizes[0];
    let prizeIndex = 0;
    
    for (let i = 0; i < prizes.length; i++) {
      accum += prizes[i].weight;
      if (roll <= accum) {
        selectedPrize = prizes[i];
        prizeIndex = i;
        break;
      }
    }

    prizeRef.current = selectedPrize;
    setPrize(selectedPrize);

    // Calculate target rotation to land on selected prize
    const currentRotationBase = Math.ceil(rotationRef.current / 360) * 360;
    
    // Middle of the segment relative to 0 (top)
    // CSS Conic starts at 0 (top). 
    // To make needle (0deg) point to a segment at angle A on the wheel, the wheel must be at rotate(360 - A).
    const midAngle = (selectedPrize.startAngle + selectedPrize.endAngle) / 2;
    const finalPrizeRotation = (360 - midAngle) % 360;
    
    targetRotationRef.current = currentRotationBase + 360 * 4 + finalPrizeRotation; 
    
    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
  };

  const finishSpin = () => {
    const finalPrize = prizeRef.current;
    if (!finalPrize) return;

    setTimeout(() => {
      setShowReward(true);
      playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
      
      if (finalPrize.type === 'card' && finalPrize.rarity) {
        const rarity = finalPrize.rarity;
        const possible = Object.keys(CARD_DATABASE)
          .map(Number)
          .filter(idx => CARD_DATABASE[idx].rarity === rarity);
        const idx = possible[Math.floor(Math.random() * possible.length)];
        setRewardCardIdx(idx);
        addCard(rarity, idx, true);
      }
    }, 500);
  };

  const closeReward = () => {
    if (rewardCardIdx !== null && triggerDeckUpgradeCheck) {
      triggerDeckUpgradeCheck([rewardCardIdx]);
    }
    setShowReward(false);
    setPrize(null);
    setRewardCardIdx(null);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 sm:p-8"
      >
        <div className="relative w-full max-w-4xl h-full flex flex-col items-center justify-center gap-8">
          <button onClick={onClose} className="absolute top-0 right-0 p-3 text-white/50 hover:text-white transition-colors"><X size={32} /></button>

          <div className="text-center space-y-2">
            <motion.h2 
              animate={{ scale: isSpinning ? [1, 1.05, 1] : 1 }}
              className="text-4xl sm:text-6xl font-black text-yellow-400 italic tracking-tighter"
            >
              LUCKY ROULETTE
            </motion.h2>
            <p className="text-white/60 font-bold tracking-widest text-xs uppercase">
              {language === 'ko' ? '정해진 확률에 도전하세요!' : 'CHALLENGE THE ODDS!'}
            </p>
          </div>

          <div className="relative w-72 h-72 sm:w-[400px] sm:h-[400px] shrink-0 aspect-square flex items-center justify-center">
            {/* Pointer */}
            <div className="absolute top-[-30px] left-1/2 -translate-x-1/2 z-[60] w-12 h-16 filter drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]">
              <div className="w-0 h-0 border-l-[24px] border-l-transparent border-r-[24px] border-r-transparent border-t-[48px] border-t-red-600" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full blur-[1px] opacity-80" />
            </div>

            {/* Outer Ring */}
            <div className="absolute inset-0 rounded-full border-[15px] border-zinc-800 shadow-[0_0_100px_rgba(0,0,0,0.9)] z-10 pointer-events-none" />

            {/* Wheel */}
            <div 
              className="w-full h-full rounded-full relative overflow-hidden border-4 border-zinc-700 transition-shadow duration-500 shrink-0 aspect-square"
              style={{ 
                transform: `rotate(${rotation}deg)`,
                background: `conic-gradient(
                  from 0deg,
                  ${prizes.map(p => `${p.color} ${p.startAngle}deg ${p.endAngle}deg`).join(', ')}
                )`
              }}
            >
              {/* Labels & Icons */}
              {prizes.map((p, i) => {
                const midAngle = (p.startAngle + p.endAngle) / 2;
                // Don't show labels for tiny segments (like 0.15%)
                const isTiny = p.weight < 1;
                
                return (
                  <div 
                    key={p.id}
                    className="absolute top-0 left-0 w-full h-full flex justify-center pt-10"
                    style={{ transform: `rotate(${midAngle}deg)` }}
                  >
                    <div className={cn("flex flex-col items-center gap-1 text-white", isTiny && "scale-50 opacity-0 group-hover:opacity-100")}>
                      {!isTiny && (
                        <>
                          <div className="p-2 bg-black/30 rounded-full backdrop-blur-md">
                            <p.icon size={28} className="drop-shadow-lg" />
                          </div>
                          <span className="text-[10px] font-black tracking-tighter uppercase italic bg-black/20 px-2 py-0.5 rounded border border-white/10">
                            {language === 'ko' ? p.label_ko : p.label}
                          </span>
                          <span className="text-[8px] font-bold opacity-40">{p.weight}%</span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {/* Divider Lines */}
              {prizes.map((p, i) => (
                <div 
                  key={i}
                  className="absolute top-0 left-1/2 w-0.5 h-1/2 bg-white/20 origin-bottom -translate-x-1/2"
                  style={{ transform: `rotate(${p.startAngle}deg)` }}
                />
              ))}

              {/* Special Highlight for Rare Segment (Gold) */}
              <div className="absolute inset-0 z-20 pointer-events-none">
                 <div 
                  className="absolute top-0 left-1/2 w-1 h-1/2 bg-white/40 origin-bottom -translate-x-1/2 blur-[2px]"
                  style={{ transform: `rotate(${prizes.find(p => p.rarity === 'gold')?.startAngle}deg)` }}
                 />
              </div>

              <div className="absolute inset-0 m-auto w-20 h-20 bg-zinc-800 rounded-full border-8 border-zinc-700 shadow-2xl z-30 flex items-center justify-center">
                <div className="w-8 h-8 bg-yellow-400 rounded-full animate-pulse shadow-[0_0_20px_rgba(250,204,21,1)]" />
              </div>
            </div>
          </div>

          <div className="w-full max-w-xs flex flex-col items-center gap-4">
            {notice && (
              <div className="w-full rounded-lg border border-red-500/40 bg-red-950/80 px-4 py-3 text-center text-xs font-bold text-red-100 shadow-md">
                {notice}
              </div>
            )}

            {!isSpinning ? (
              <button
                onClick={startSpin}
                className="w-full h-16 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xl tracking-widest uppercase rounded-lg shadow-[0_8px_0_rgb(161,98,7)] active:shadow-none active:translate-y-[8px] transition-all flex items-center justify-center gap-3"
              >
                <Sparkles size={24} />
                {language === 'ko' ? '시작하기' : 'START SPIN'}
                <span className="text-sm opacity-50 ml-2">{spinCost} SNS</span>
              </button>
            ) : (
              <button
                onClick={handleStop}
                disabled={!!stopTimeRef.current}
                className={cn(
                  "w-full h-16 bg-red-600 text-white font-black text-xl tracking-widest uppercase rounded-2xl shadow-[0_10px_0_rgb(153,27,27)] active:shadow-none active:translate-y-[10px] transition-all flex flex-col items-center justify-center leading-none",
                  stopTimeRef.current && "opacity-50 grayscale"
                )}
              >
                <span>{language === 'ko' ? '멈추기!' : 'STOP!'}</span>
                <span className="text-[10px] opacity-70 mt-1 uppercase">TOUCH TO STOP</span>
              </button>
            )}
            
            <div className="flex flex-col gap-1 items-center">
              <div className="flex items-center gap-2 text-white/40 text-[10px] font-black tracking-widest uppercase bg-white/5 px-4 py-1.5 rounded-full border border-white/10">
                <Zap size={10} className="text-yellow-400" />
                {sns.toLocaleString()} SNS AVAILABLE
              </div>
            </div>
          </div>

          {/* Compact Hero Information Section */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-sm bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 p-4 space-y-3 shadow-xl"
          >
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <Sparkles className="text-yellow-400" size={14} />
              <h3 className="text-[10px] font-black text-white/60 uppercase tracking-widest italic">Hero Odds</h3>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {prizes.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-[9px] font-bold">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="text-white/40 uppercase truncate max-w-[60px]">
                      {language === 'ko' ? p.label_ko : p.label}
                    </span>
                  </div>
                  <span className={cn(
                    "italic",
                    p.rarity === 'gold' ? "text-yellow-400" : "text-white/60"
                  )}>
                    {p.weight}%
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <AnimatePresence>
          {showReward && prize && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[400] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
              onClick={closeReward}
            >
              <motion.div 
                initial={{ scale: 0.5, rotate: -10 }} animate={{ scale: 1, rotate: 0 }}
                className="bg-zinc-900 border-4 border-yellow-400 rounded-3xl p-8 max-w-sm w-full text-center space-y-6 shadow-[0_0_100px_rgba(250,204,21,0.3)]"
                onClick={e => e.stopPropagation()}
              >
                <div className="space-y-2">
                  <div className="flex justify-center mb-4">
                    <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce shadow-lg">
                      <prize.icon size={40} className="text-black" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase">
                    {prize.type === 'lose' ? (language === 'ko' ? '아쉽네요!' : 'TOO BAD!') : (language === 'ko' ? '당첨 축하합니다!' : 'CONGRATULATIONS!')}
                  </h3>
                  <p className="text-yellow-400 font-black tracking-widest text-sm uppercase">
                    {prize.type === 'lose' ? (language === 'ko' ? '다음에 다시 도전하세요.' : 'BETTER LUCK NEXT TIME.') : (language === 'ko' ? `${prize.label_ko} 카드 획득!` : `${prize.label} CARD ACQUIRED!`)}
                  </p>
                </div>

                {prize.type === 'card' && rewardCardIdx !== null && (
                  <div className="flex justify-center py-4">
                    <div className="w-32 h-44">
                      <CardItem 
                        card={{
                          id: 'reward',
                          title_dis: CARD_DATABASE[rewardCardIdx]?.title_dis || '',
                          stats: CARD_DATABASE[rewardCardIdx]?.stats || [1,1,1,1],
                          rarity: CARD_DATABASE[rewardCardIdx]?.rarity || 'bronze',
                          level: 1,
                          imageIndex: rewardCardIdx,
                          owner: null,
                          power: CARD_DATABASE[rewardCardIdx]?.power || 0
                        }}
                        className="w-full h-full shadow-2xl"
                      />
                    </div>
                  </div>
                )}

                <button onClick={closeReward} className="w-full h-12 bg-white text-black font-black uppercase tracking-widest hover:bg-yellow-400 transition-colors rounded-xl">
                  {language === 'ko' ? '확인' : 'AWESOME!'}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};
