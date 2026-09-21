import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Zap, Gift, X } from 'lucide-react';

interface GoldenGoblinEventProps {
  onTapReward: (amount: number) => void;
  onOpenCapturePack: () => void;
}

export const GoldenGoblinEvent: React.FC<GoldenGoblinEventProps> = ({
  onTapReward,
  onOpenCapturePack
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [tapCount, setTapCount] = useState<number>(0);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [showPackageBanner, setShowPackageBanner] = useState<boolean>(false);

  useEffect(() => {
    // Check goblin appearance every 60 seconds (or simulate chance)
    const interval = setInterval(() => {
      const chance = Math.random();
      if (chance > 0.4 && !isVisible) {
        setIsVisible(true);
        setTapCount(0);
        setPosition({
          x: 20 + Math.random() * 60,
          y: 20 + Math.random() * 50
        });
      }
    }, 45000);

    return () => clearInterval(interval);
  }, [isVisible]);

  const handleGoblinTap = () => {
    const newCount = tapCount + 1;
    setTapCount(newCount);
    onTapReward(20);

    if (newCount >= 5) {
      setIsVisible(false);
      setShowPackageBanner(true);
    } else {
      // Teleport goblin slightly
      setPosition({
        x: 15 + Math.random() * 70,
        y: 20 + Math.random() * 50
      });
    }
  };

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            style={{
              position: 'fixed',
              left: `${position.x}%`,
              top: `${position.y}%`,
              zIndex: 45
            }}
            onClick={handleGoblinTap}
            className="cursor-pointer select-none font-mono flex flex-col items-center group"
          >
            <div className="px-2 py-0.5 bg-amber-400 text-black text-[9px] font-black rounded-xs shadow-md animate-bounce">
              황금 고블린! 탭! ({5 - tapCount}회 남음)
            </div>
            <div className="w-14 h-14 bg-amber-500 border-2 border-amber-300 rounded-full flex items-center justify-center text-2xl shadow-xl active:scale-90 transition-transform">
              👺
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Capture Package Banner */}
      <AnimatePresence>
        {showPackageBanner && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-16 left-4 right-4 z-40 bg-[#fdfcfc] border-2 border-amber-500 p-3 shadow-xl flex items-center justify-between font-mono select-none"
          >
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-500" />
              <div>
                <div className="text-xs font-black text-[#201d1d]">
                  도주하는 황금 고블린 포획 기회!
                </div>
                <div className="text-[10px] text-[#504a4a]">
                  황금 그물 패키지: 1,000 SNS + 전설 상자 (990원)
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={onOpenCapturePack}
                className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold rounded-xs cursor-pointer"
              >
                포획 (990원)
              </button>
              <button
                onClick={() => setShowPackageBanner(false)}
                className="p-1 hover:bg-zinc-100 rounded-xs text-zinc-500"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
