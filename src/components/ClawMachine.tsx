import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, Coins, ChevronLeft, ChevronRight, Gavel, Zap } from 'lucide-react';
import { CardItem } from './CardItem';
import { CARD_DATABASE } from '../cardDatabase';
import { CardData, UserStats } from '../types';
import { cn } from '../lib/utils';
import { SNS_ECONOMY_COSTS } from '../content/snsEconomy';

interface PrizeCard extends CardData {
  x: number;
  y: number;
  rotate: number;
  scale: number;
  id: string;
}

interface ClawMachineProps {
  isOpen: boolean;
  onClose: () => void;
  userStats: UserStats;
  onReward: (card: CardData) => void;
  onPlay?: () => void;
  language: string;
  t: (key: string) => string;
}

export const ClawMachine: React.FC<ClawMachineProps> = ({
  isOpen,
  onClose,
  userStats,
  onReward,
  onPlay,
  language,
  t
}) => {
  const clawCost = SNS_ECONOMY_COSTS.event.claw;
  const [prizes, setPrizes] = useState<PrizeCard[]>([]);
  const [clawX, setClawX] = useState(50); // percentage 0-100
  const [isDropping, setIsDropping] = useState(false);
  const [isCatching, setIsCatching] = useState(false);
  const [isLifting, setIsLifting] = useState(false);
  const [isMovingToBin, setIsMovingToBin] = useState(false);
  const [isStruggling, setIsStruggling] = useState(false);
  const [isDroppingMidway, setIsDroppingMidway] = useState(false);
  const [caughtPrize, setCaughtPrize] = useState<PrizeCard | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  
  const clawDirection = useRef(1); // 1 for right, -1 for left

  // Stable initialize function
  const initGame = useCallback(() => {
    const newPrizes: PrizeCard[] = [];
    const cardIds = Object.keys(CARD_DATABASE)
      .map(Number)
      .filter(id => CARD_DATABASE[id].rarity !== 'gold');
      
    for (let i = 0; i < 40; i++) {
      const randomDbId = cardIds[Math.floor(Math.random() * cardIds.length)];
      const dbCard = CARD_DATABASE[randomDbId];
      newPrizes.push({
        ...dbCard,
        id: `prize-${i}-${Date.now()}`,
        imageIndex: dbCard.id,
        x: Math.random() * 70 + 15,
        y: Math.random() * 8 + 88,
        rotate: Math.random() * 360,
        scale: 0.9 + Math.random() * 0.3,
        stats: dbCard.stats || [1, 1, 1, 1],
        owner: 'player',
      } as PrizeCard);
    }
    setPrizes(newPrizes);
    setClawX(50);
    setIsDropping(false);
    setIsCatching(false);
    setIsLifting(false);
    setIsDroppingMidway(false);
    setIsMovingToBin(false);
    setIsStruggling(false);
    setCaughtPrize(null);
    setMessage(t('claw_instruction'));
  }, [t]);

  // Initialize prizes only when isOpen changes from false to true
  useEffect(() => {
    if (isOpen) {
      initGame();
    }
  }, [isOpen]); // Removed initGame to prevent re-run if t prop changes

  // Claw horizontal movement
  useEffect(() => {
    if (!isOpen || isDropping || isCatching || isLifting || isMovingToBin) return;

    const interval = setInterval(() => {
      setClawX(prev => {
        let next = prev + clawDirection.current * 1.5;
        if (next >= 85) {
          clawDirection.current = -1;
          return 85;
        }
        if (next <= 15) {
          clawDirection.current = 1;
          return 15;
        }
        return next;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [isOpen, isDropping, isCatching, isLifting, isMovingToBin]);

  const handleDrop = () => {
    if (isDropping || isCatching || isLifting || caughtPrize || isMovingToBin) return;
    if (userStats.sns < clawCost) {
      setMessage(t('insufficient_sns'));
      return;
    }

    setIsDropping(true);
    setMessage(null);
    onPlay?.();

    // Time it takes to drop all the way down
    setTimeout(() => {
      checkCollision();
    }, 1000); 
  };

  const checkCollision = () => {
    const catchRadius = 5; 
    const currentClawX = clawX;
    const targetIdx = prizes.findIndex(p => Math.abs(p.x - currentClawX) < catchRadius);
    
    if (targetIdx !== -1) {
      const prize = prizes[targetIdx];
      const roll = Math.random();
      
      // 10% pure success, 20% "near miss" (catch then drop)
      if (roll < 0.1) {
        executeSuccess(prize, targetIdx);
      } else if (roll < 0.3) {
        executeNearMiss(prize, targetIdx);
      } else {
        executeFail();
      }
    } else {
      executeFail();
    }
  };

  const executeSuccess = (prize: PrizeCard, idx: number) => {
    setCaughtPrize(prize);
    setIsCatching(true);
    setPrizes(prev => prev.filter((_, i) => i !== idx));

    setTimeout(() => {
      setIsDropping(false);
      setIsLifting(true);
      
      setTimeout(() => {
        // Move to collection bin (Left side)
        setIsMovingToBin(true);
        setIsLifting(false);
        setClawX(8); 

        setTimeout(() => {
          // Open claw and drop
          setIsCatching(false);
          setIsDroppingMidway(true);
          
          setTimeout(() => {
            onReward(prize);
            setMessage(t('claw_success') + ': ' + (language === 'ko' ? prize.title_dis : prize.title_en));
            setIsDroppingMidway(false);
            setIsMovingToBin(false);
            setCaughtPrize(null);
          }, 800);
        }, 1500); 
      }, 1500); 
    }, 500);
  };

  const executeNearMiss = (prize: PrizeCard, idx: number) => {
    setCaughtPrize(prize);
    setIsCatching(true);
    setPrizes(prev => prev.filter((_, i) => i !== idx));

    setTimeout(() => {
      setIsDropping(false);
      setIsLifting(true);
      
      // Struggle halfway
      setTimeout(() => {
        setIsStruggling(true);
        
        setTimeout(() => {
          setIsStruggling(false);
          setIsDroppingMidway(true);
          setIsCatching(false);
          
          // Let it fall back to the box
          setTimeout(() => {
            const fallenPrize = { ...prize, y: 92, rotate: prize.rotate + 20 };
            setPrizes(prev => [...prev, fallenPrize]);
            setIsDroppingMidway(false);
            setIsLifting(false);
            setCaughtPrize(null);
            setMessage(t('claw_fail'));
          }, 600);
        }, 1000); 
      }, 700); 
    }, 500);
  };

  const executeFail = () => {
    setTimeout(() => {
      setMessage(t('claw_fail'));
      setIsDropping(false);
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="relative w-full h-full sm:w-[95%] sm:h-[95%] bg-zinc-950 sm:rounded-3xl sm:border-[12px] border-zinc-800 shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden flex flex-col"
        >
          {/* Top Display Panel */}
          <div className="p-6 bg-zinc-900 border-b-4 border-zinc-800 flex justify-between items-center z-[100]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-500 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.3)]">
                <Gavel className="text-zinc-900" size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">
                  {language === 'ko' ? '인형 뽑기' : 'CLAW MACHINE'}
                </h2>
                <div className="flex items-center gap-2 mt-2">
                   <div className="bg-zinc-800 px-3 py-1 rounded-full flex items-center gap-1.5 border border-white/5">
                      <Coins className="text-yellow-500" size={14} />
                      <span className="text-sm font-black text-white/80">{userStats.sns}</span>
                   </div>
                   <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest opacity-50">Operation_Ready</div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
               {message && (
                 <motion.div 
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   className="hidden md:block bg-yellow-500 text-zinc-900 px-6 py-2 rounded-xl font-black text-sm shadow-xl italic"
                 >
                   {message}
                 </motion.div>
               )}
               <button onClick={onClose} className="p-3 bg-zinc-800 hover:bg-red-600 rounded-2xl transition-all text-zinc-400 hover:text-white border border-white/5 group">
                 <X size={24} className="group-hover:rotate-90 transition-transform" />
               </button>
            </div>
          </div>

          {/* Game Area */}
          <div 
            className="flex-1 relative bg-zinc-950 border-b-[40px] border-zinc-900 cursor-crosshair group/box perspective-[1000px]" 
            onClick={handleDrop}
          >
            {/* Top Mechanical Rail */}
            <div className="absolute top-0 left-0 right-0 h-10 bg-zinc-900/80 backdrop-blur-md flex items-center z-10 border-b border-white/5">
               <div className="h-1.5 w-full bg-zinc-800 mx-10 rounded-full shadow-inner" />
            </div>

            {/* INDUSTRIAL ROBOT ARM & PINCER CLAW */}
            <motion.div
              animate={{ 
                left: `${clawX}%`,
                height: isDropping ? '85%' : (isLifting ? '10%' : '15%'),
                x: isStruggling ? [0, -5, 5, -5, 5, 0] : 0
              }}
              className="absolute top-0 w-3 bg-zinc-800 border-x border-white/10 origin-top flex flex-col items-center z-[80] pointer-events-none shadow-2xl"
              transition={{ 
                left: {
                   duration: isMovingToBin ? 1.5 : 0.03,
                   ease: isMovingToBin ? "easeInOut" : "linear"
                },
                height: {
                  duration: isDropping ? 1 : (isLifting ? 1.5 : 0.8), 
                  ease: isDropping ? "easeIn" : "easeInOut"
                },
                x: isStruggling ? {
                  duration: 0.2,
                  repeat: Infinity,
                  ease: "linear"
                } : {
                  duration: 1.5,
                  ease: "easeInOut"
                }
              }}
            >
              {/* Mechanical Joint & Pincer Head */}
              <div className="absolute bottom-0 w-12 h-12 flex flex-col items-center translate-y-1/2">
                {/* Connector Ring */}
                <div className="w-8 h-4 bg-zinc-700 rounded-full border-2 border-zinc-600 shadow-lg relative z-20">
                   <div className={cn("absolute inset-0 rounded-full animate-pulse", isStruggling ? "bg-red-500/30" : "bg-yellow-500/10")} />
                </div>
                
                {/* Pincer Base */}
                <div className="w-10 h-6 bg-gradient-to-b from-zinc-700 to-zinc-900 rounded-b-xl border-x-2 border-b-2 border-zinc-600 relative z-10 flex justify-center">
                   <div className="absolute -top-1 w-2 h-2 bg-yellow-500 rounded-full shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
                </div>

                {/* MECHANICAL PINCERS */}
                <div className="relative w-20 h-20 flex justify-center mt-[-4px]">
                   {/* Left Pincer Blade */}
                   <motion.div 
                     className="absolute w-4 h-16 origin-top-right"
                     animate={{ 
                       rotate: (isCatching || isDroppingMidway) ? 0 : -35,
                       x: -4
                     }}
                   >
                     <div className="w-full h-full bg-zinc-400 rounded-bl-[100%] rounded-tr-lg border-l-4 border-b-4 border-zinc-500 shadow-inner relative">
                        <div className="absolute top-4 left-1 w-1.5 h-6 bg-zinc-600/50 rounded-full" />
                     </div>
                   </motion.div>
                   
                   {/* Right Pincer Blade */}
                   <motion.div 
                     className="absolute w-4 h-16 origin-top-left"
                     animate={{ 
                       rotate: (isCatching || isDroppingMidway) ? 0 : 35,
                       x: 4
                     }}
                   >
                     <div className="w-full h-full bg-zinc-400 rounded-br-[100%] rounded-tl-lg border-r-4 border-b-4 border-zinc-500 shadow-inner relative">
                        <div className="absolute top-4 right-1 w-1.5 h-6 bg-zinc-600/50 rounded-full" />
                     </div>
                   </motion.div>

                   {/* Center Support / Hydraulic Pin */}
                   <motion.div 
                     className="absolute top-0 w-2 h-8 bg-zinc-600 rounded-full border-x border-zinc-500"
                     animate={{ 
                       y: (isCatching || isDroppingMidway) ? 10 : 0,
                       scaleY: (isCatching || isDroppingMidway) ? 1.2 : 1
                     }}
                   />
                </div>
                
                {/* Caught Prize (Card) */}
                <AnimatePresence>
                  {caughtPrize && (
                    <motion.div
                      key={caughtPrize.id}
                      initial={{ scale: 0.5, y: 0, opacity: 0 }}
                      animate={{ 
                        scale: 1, 
                        y: isDroppingMidway ? 400 : 35, 
                        opacity: isDroppingMidway ? 0 : 1,
                        rotate: isDroppingMidway ? (isMovingToBin ? 360 : 180) : (isStruggling ? [0, -2, 2, -2, 2, 0] : 0),
                        x: isStruggling ? [0, -3, 3, -3, 3, 0] : 0
                      }}
                      exit={{ opacity: 0, scale: 0 }}
                      transition={{ 
                        y: { duration: isDroppingMidway ? 0.8 : 0.3, ease: "easeIn" },
                        rotate: { duration: isDroppingMidway ? 0.8 : 0.2, repeat: isStruggling ? Infinity : 0 },
                        x: { duration: 0.2, repeat: Infinity }
                      }}
                      className="absolute top-full z-[90]"
                    >
                      <CardItem card={caughtPrize} className="w-16 h-22 sm:w-20 sm:h-28 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-2 border-white/20" />
                      {isCatching && (
                        <div className="absolute inset-0 bg-yellow-400/10 animate-pulse border-2 border-yellow-400/50 rounded-xl" />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Piles of Cards at the bottom */}
            <div className="absolute inset-0 pt-20 [container-type:size]">
              {prizes.map((prize) => (
                <motion.div
                  key={prize.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ 
                    opacity: 1, 
                    scale: prize.scale,
                    left: `${prize.x}%`,
                    top: `${prize.y}cqh`,
                    rotate: prize.rotate
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                >
                  <CardItem card={prize} className="w-10 h-14 sm:w-16 sm:h-22 shadow-2xl pointer-events-none opacity-80" />
                </motion.div>
              ))}
            </div>
            
            {/* Collection Bin (Left Side) */}
            <div className="absolute bottom-[-40px] left-0 w-[15%] h-[40%] bg-zinc-900 border-r-4 border-zinc-800 z-10 flex flex-col items-center justify-end pb-10">
               <div className="w-full h-4 bg-black/40 mb-4" />
               <div className="text-[10px] font-black text-zinc-600 uppercase vertical-text tracking-[0.5em] mb-4">REWARD_BIN</div>
               <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center border-2 border-zinc-700">
                  <Trophy className="text-zinc-600" size={24} />
               </div>
            </div>

            {/* Glass Glare Effects */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/10 via-transparent to-white/5 z-[95]" />
            <div className="absolute top-0 bottom-0 left-10 w-20 bg-white/5 skew-x-[-20deg] blur-3xl pointer-events-none" />
            <div className="absolute top-0 bottom-0 right-10 w-40 bg-white/5 skew-x-[-20deg] blur-2xl pointer-events-none" />

            {/* Result Popup Overlay */}
            {message && !isDropping && !isLifting && !isMovingToBin && (
               <div className="absolute inset-x-0 top-1/3 flex justify-center z-[200]">
                  <motion.div 
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className={cn(
                      "px-8 py-4 rounded-2xl font-black text-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-4 italic uppercase tracking-tighter",
                      message.includes(t('claw_success')) ? "bg-yellow-500 text-zinc-900 border-white" : "bg-red-600 text-white border-red-400"
                    )}
                  >
                    {message}
                  </motion.div>
               </div>
            )}
          </div>

          {/* Bottom Controls Area */}
          <div className="p-8 bg-zinc-900 border-t-4 border-zinc-800 flex flex-col items-center gap-6">
            <div className="flex gap-10 items-center">
               <div className="flex flex-col items-center gap-2">
                  <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Left_Right_Auto</div>
                  <div className="flex gap-4">
                     <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center border border-white/5">
                        <ChevronLeft className="text-zinc-500" size={20} />
                     </div>
                     <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center border border-white/5">
                        <ChevronRight className="text-zinc-500" size={20} />
                     </div>
                  </div>
               </div>
               
               <button
                 onClick={handleDrop}
                 disabled={isDropping || isCatching || isLifting || isMovingToBin}
                 className={cn(
                   "w-48 h-20 rounded-3xl font-black text-2xl uppercase italic tracking-tighter transition-all flex flex-col items-center justify-center gap-1 shadow-2xl relative overflow-hidden group",
                   isDropping || isCatching || isLifting || isMovingToBin
                     ? "bg-zinc-800 text-zinc-600 grayscale cursor-not-allowed"
                     : "bg-red-600 text-white hover:bg-red-500 active:scale-95 border-b-8 border-red-900"
                 )}
               >
                 <span className="relative z-10">{t('claw_drop')}</span>
                 <span className="text-[10px] opacity-60 font-bold tracking-widest z-10">{clawCost} SNS REQUIRED</span>
                 {!isDropping && !isCatching && !isLifting && !isMovingToBin && (
                   <motion.div 
                     className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                     animate={{ x: ['-100%', '100%'] }}
                     transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                   />
                 )}
               </button>
            </div>

            <div className="flex gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 italic">
               <span>SYS_STATUS: ACTIVE</span>
               <span>•</span>
               <span>VOLTAGE: OPTIMAL</span>
               <span>•</span>
               <span>REWARD_POOL: LOADED</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
