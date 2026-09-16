/**
 * Milestone600CelebrationModal.tsx
 * 600대 플랫폼 혁신 돌파 기념 'Titan Core 600' 슬리브 및 'Grand Strategist' 칭호 지급 축하 모달
 * (Item 600 요구사항 구현)
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, Award, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playBattleSfx } from '../lib/AudioSpriteService';

interface Milestone600CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: string;
}

const STORAGE_KEY = 'hero_milestone_600_claimed';

export const Milestone600CelebrationModal: React.FC<Milestone600CelebrationModalProps> = ({
  isOpen,
  onClose,
  language = 'ko',
}) => {
  const isKo = language === 'ko';
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    if (isOpen) {
      playBattleSfx('badge_pop');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClaim = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
      localStorage.setItem('hero_user_title', 'grand_strategist');

      // 시즌별 카드 스킨 획득 처리
      const season = localStorage.getItem('hero_current_season') || 'season1';
      const skinsKey = `hero_card_skins_${season}`;
      let curSkins: string[] = [];
      try {
        const raw = localStorage.getItem(skinsKey);
        if (raw) curSkins = JSON.parse(raw);
      } catch {}
      if (!curSkins.includes('skin_titan_core_600')) {
        curSkins.push('skin_titan_core_600');
        localStorage.setItem(skinsKey, JSON.stringify(curSkins));
      }

      window.dispatchEvent(new CustomEvent('hero_skin_unlocked', { detail: { skinKey: 'skin_titan_core_600' } }));
      window.dispatchEvent(new CustomEvent('hero_profile_updated'));
    } catch {}

    playBattleSfx('victory');
    setClaimed(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 font-mono select-none"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-md bg-[#fdfcfc] border-2 border-amber-500 rounded-none p-5 shadow-2xl text-[#201d1d]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-[#646262] hover:text-[#201d1d] text-xs font-bold px-1.5 py-0.5 border border-[rgba(15,0,0,0.12)] rounded-xs cursor-pointer"
          >
            [X]
          </button>

          {/* 헤더 뱃지 */}
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-amber-500 text-stone-950 text-[10px] font-black px-2 py-0.5 rounded-xs tracking-wider uppercase flex items-center gap-1">
              <Sparkles size={11} className="fill-stone-950" />
              <span>MILESTONE #600</span>
            </span>
            <span className="text-[11px] text-[#646262] font-bold">
              {isKo ? 'SNSHero 플랫폼 혁신 대기록' : 'Platform Milestone Celebration'}
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-black tracking-tight text-[#201d1d] mb-1.5 flex items-center gap-1.5">
            <span>🎉</span>
            <span>{isKo ? '600대 플랫폼 개선 돌파 기념!' : '600 Milestone Celebration!'}</span>
          </h3>

          <p className="text-xs text-[#646262] leading-relaxed mb-4">
            {isKo
              ? '플레이어 여러분과 함께 이뤄낸 600번째 기능 개선을 기념하여 한정판 스킨과 골든 칭호를 증정합니다.'
              : 'Celebrating our 600th targeted improvement with an exclusive commemorative skin & golden title.'}
          </p>

          {/* 보상 카드 리스트 */}
          <div className="space-y-2.5 mb-5">
            {/* 1. Titan Core 600 카드 슬리브 */}
            <div className="p-3 bg-[#f8f7f7] border border-amber-500/40 rounded-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-sm bg-gradient-to-br from-amber-400 to-amber-700 flex items-center justify-center text-xl shadow-xs shrink-0 border border-amber-300">
                🛡️
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-[#201d1d]">
                    {isKo ? '타이탄 코어 600 슬리브' : 'Titan Core 600 Sleeve'}
                  </span>
                  <span className="text-[9px] bg-amber-200 text-amber-950 font-bold px-1 py-0.2 rounded-xs">
                    LIMITED
                  </span>
                </div>
                <div className="text-[10px] text-[#646262] mt-0.5 truncate">
                  {isKo ? '흑요석 골든 룬 사이버네틱 카드 스킨' : 'Cybernetic obsidian golden runic card skin'}
                </div>
              </div>
            </div>

            {/* 2. Grand Strategist 골든 칭호 */}
            <div className="p-3 bg-[#f8f7f7] border border-amber-500/40 rounded-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-sm bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-xl shadow-xs shrink-0 border border-amber-300">
                👑
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-amber-800">
                    {isKo ? '대군략가 (Grand Strategist)' : 'Grand Strategist Title'}
                  </span>
                  <span className="text-[9px] bg-amber-500 text-stone-950 font-black px-1 py-0.2 rounded-xs">
                    TITLE
                  </span>
                </div>
                <div className="text-[10px] text-[#646262] mt-0.5 truncate">
                  {isKo ? '프로필 황금빛 명예 전술가 칭호' : 'Commemorative golden strategist profile title'}
                </div>
              </div>
            </div>
          </div>

          {/* 액션 버튼 */}
          <button
            type="button"
            disabled={claimed}
            onClick={handleClaim}
            className="w-full py-2.5 px-4 bg-[#201d1d] hover:bg-amber-600 text-[#fdfcfc] font-black text-xs uppercase tracking-wider rounded-sm transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 border border-[#201d1d] shadow-sm disabled:bg-emerald-600 disabled:border-emerald-600"
          >
            {claimed ? (
              <>
                <CheckCircle2 size={14} className="text-white" />
                <span>{isKo ? '지급 완료! 장착되었습니다' : 'Claimed & Equipped!'}</span>
              </>
            ) : (
              <>
                <Award size={14} className="text-amber-300" />
                <span>{isKo ? '[ 🎁 600 기념 보상 모두 수령하기 ]' : '[ 🎁 Claim Milestone 600 Rewards ]'}</span>
              </>
            )}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
