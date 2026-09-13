import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Check, Shield, Flame, Droplets, Mountain, Wind, Skull, X } from "lucide-react";
import { CardData, Language } from "../types";
import { getCardSpriteStyle, cn } from "../lib/utils";
import { CARD_DATABASE } from "../cardDatabase";

interface CardAcquisitionModalProps {
  isOpen: boolean;
  card: CardData | null;
  language: Language;
  onClose: () => void;
  playSfx?: (url: string) => void;
  mode?: 'obtain' | 'enhance';
  enhancementLevel?: number;
}

export const CardAcquisitionModal: React.FC<CardAcquisitionModalProps> = ({
  isOpen,
  card,
  language,
  onClose,
  playSfx,
  mode = 'obtain',
  enhancementLevel = 2
}) => {
  const [countdown, setCountdown] = React.useState<number>(3);

  React.useEffect(() => {
    if (!isOpen || !card) {
      setCountdown(3);
      return;
    }

    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, card, onClose]);

  if (!isOpen || !card) return null;

  const cardId = card.imageIndex || card.id || 1;
  const numId = typeof cardId === "number" ? cardId : parseInt(String(cardId).replace(/\D/g, ""), 10) || 1;
  const dbCard = CARD_DATABASE[numId] || CARD_DATABASE[1];
  const cardNumFormatted = String(numId).padStart(2, "0");
  const cardTitle = language === "ko" ? (dbCard.title || card.title) : (dbCard.title_en || card.title_en || dbCard.title);
  const rarity = (dbCard.rarity || card.rarity || "bronze").toLowerCase();
  const element = (dbCard.element || card.element || "neutral").toLowerCase();
  const power = dbCard.power || card.power || 10;
  const stats = dbCard.stats || card.stats || [10, 10, 10, 10];

  const rarityColor = 
    rarity === "diamond" ? "from-cyan-400 to-blue-500 border-cyan-400 text-cyan-300 shadow-cyan-500/40" :
    rarity === "platinum" ? "from-slate-200 to-indigo-300 border-indigo-300 text-indigo-200 shadow-indigo-500/40" :
    rarity === "gold" ? "from-amber-300 to-yellow-500 border-amber-400 text-amber-300 shadow-amber-500/40" :
    rarity === "silver" ? "from-slate-300 to-slate-400 border-slate-300 text-slate-200 shadow-slate-400/40" :
    "from-amber-700 to-amber-900 border-amber-700 text-amber-200 shadow-amber-700/40";

  const elemIcon = 
    element === "water" ? <Droplets size={12} className="text-cyan-400" /> :
    element === "fire" ? <Flame size={12} className="text-rose-400" /> :
    element === "wind" || element === "air" ? <Wind size={12} className="text-sky-400" /> :
    element === "earth" || element === "land" ? <Mountain size={12} className="text-amber-400" /> :
    <Skull size={12} className="text-purple-400" />;

  const spriteStyle = getCardSpriteStyle(numId);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10005] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none">
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 20, stiffness: 260 }}
          className="relative w-full max-w-sm max-h-[90dvh] bg-gradient-to-b from-[#181326] via-[#100d1c] to-[#0a0814] border-2 border-amber-400 rounded-sm p-4 sm:p-5 text-white font-mono shadow-[0_0_40px_rgba(245,158,11,0.4)] overflow-hidden flex flex-col items-center gap-3 text-center"
        >
          {/* Subtle Radial Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(245,158,11,0.22),transparent_70%)] pointer-events-none" />

          {/* Top-right close button */}
          <button
            type="button"
            onClick={() => {
              playSfx?.("https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3");
              onClose();
            }}
            aria-label="닫기"
            className="absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 border border-amber-400/40 text-amber-300 flex items-center justify-center cursor-pointer transition-colors shadow-sm"
          >
            <X size={16} />
          </button>

          {/* Scrollable Main Content */}
          <div className="relative z-10 w-full flex-1 min-h-0 overflow-y-auto flex flex-col items-center gap-3 py-1 pr-0.5">
            {/* Header Banner */}
            <div className="flex flex-col items-center gap-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xs bg-amber-400/15 border border-amber-400/40 text-[10px] font-black uppercase tracking-widest text-amber-300">
                <Sparkles size={12} className="text-amber-300 animate-spin" style={{ animationDuration: "3s" }} />
                <span>{mode === 'enhance' ? "CARD ENHANCED" : "NEW CARD ACQUIRED"}</span>
                <Sparkles size={12} className="text-amber-300 animate-spin" style={{ animationDuration: "3s" }} />
              </div>
              <h2 className="text-base sm:text-lg font-black text-white drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)]">
                {mode === 'enhance'
                  ? (language === "ko" ? `히어로 카드 강화 성공! (Lv.${enhancementLevel})` : `Hero Card Enhanced! (Lv.${enhancementLevel})`)
                  : (language === "ko" ? "신규 히어로 카드 획득!" : "New Hero Card Unlocked!")}
              </h2>
              <p className="text-[11px] text-slate-300 max-w-xs">
                {mode === 'enhance'
                  ? (language === "ko"
                      ? "수호자와의 대결에서 승리하여 카드의 잠재력이 강화되었습니다!"
                      : "Defeated the guardian and unlocked card potential!")
                  : (language === "ko" 
                      ? "수호자와의 대결에서 승리하여 카드를 획득했습니다." 
                      : "Defeated the guardian and claimed the hero card!")}
              </p>
            </div>

            {/* Card Frame Showcase */}
            <div className="w-44 sm:w-48 bg-[#14121e] border-2 border-amber-400/90 rounded-sm overflow-hidden shadow-[0_0_24px_rgba(245,158,11,0.3)] flex flex-col shrink-0">
              {/* Header bar */}
              <div className="px-2 py-1 bg-slate-950/95 border-b border-slate-800 flex items-center justify-between text-[9px]">
                <span className="font-black text-amber-400 bg-amber-400/10 border border-amber-400/30 px-1 rounded-xs">
                  No.{cardNumFormatted}
                </span>
                <div className="flex items-center gap-1">
                  <span className="flex items-center gap-0.5 text-[8px] uppercase font-bold text-slate-300">
                    {elemIcon}
                    <span>{element}</span>
                  </span>
                  <span className={cn("px-1 py-0.2 rounded-xs border text-[8px] font-black uppercase bg-gradient-to-r", rarityColor)}>
                    {rarity}
                  </span>
                </div>
              </div>

              {/* Sprite Character Art Box */}
              <div className="w-full h-36 sm:h-40 bg-gradient-to-b from-slate-900 via-[#151128] to-[#0b0816] flex items-center justify-center relative overflow-hidden p-2">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.25),transparent_65%)] pointer-events-none" />
                <div 
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-xs shadow-md z-10"
                  style={spriteStyle}
                />
              </div>

              {/* Title & Stats */}
              <div className="p-2 bg-slate-950 border-t border-slate-800 flex flex-col gap-1 text-left">
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs text-white truncate">
                    {cardTitle}
                  </span>
                  <span className="text-[10px] font-black text-amber-300 bg-amber-950/70 border border-amber-700/50 px-1 rounded-xs">
                    {power} PW
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1 text-[8px] text-center font-mono pt-1 border-t border-slate-800/80">
                  <div className="bg-slate-900 px-0.5 py-0.5 rounded-xs border border-slate-800 text-slate-300">▲ {stats[0]}</div>
                  <div className="bg-slate-900 px-0.5 py-0.5 rounded-xs border border-slate-800 text-slate-300">▶ {stats[1]}</div>
                  <div className="bg-slate-900 px-0.5 py-0.5 rounded-xs border border-slate-800 text-slate-300">▼ {stats[2]}</div>
                  <div className="bg-slate-900 px-0.5 py-0.5 rounded-xs border border-slate-800 text-slate-300">◀ {stats[3]}</div>
                </div>
              </div>
            </div>

            {/* Storage Notification */}
            <div className="text-[10px] text-emerald-400 bg-emerald-950/80 border border-emerald-500/50 px-2.5 py-1 rounded-xs flex items-center gap-1.5 shrink-0">
              <Shield size={12} className="text-emerald-400 shrink-0" />
              <span>
                {mode === 'enhance'
                  ? (language === "ko" ? `잠재력 Lv.${enhancementLevel} 적용 및 로컬스토리지 영구 보존 완료` : `Potential Lv.${enhancementLevel} Saved Permanently`)
                  : (language === "ko" ? "인벤토리에 즉시 추가 및 로컬스토리지 영구 보존 완료" : "Added to Inventory & Saved Permanently")}
              </span>
            </div>
          </div>

          {/* Confirm Button Footer */}
          <div className="relative z-10 w-full shrink-0 pt-1">
            <button
              onClick={() => {
                playSfx?.("https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3");
                onClose();
              }}
              className="w-full py-3 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-black rounded-xs uppercase tracking-wider text-xs sm:text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all border border-amber-300"
            >
              <Check size={16} className="stroke-[3]" />
              <span>{language === "ko" ? `확인 & 다음 배틀 진행 (${countdown}초)` : `Next Battle (${countdown}s)`}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
