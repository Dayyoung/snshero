/**
 * HeroNineSlotModal.tsx
 * 이벤트 화면 전용 9구 히어로 슬롯 머신 (3x3 룰렛)
 * - 1회 플레이 시 SNS 소진
 * - 3x3 (총 9개) 룰렛에서 캐릭터 3개 일치 시 등급에 따라 푸짐한 보상
 * - 가로 3줄, 세로 3줄, 대각선 2줄 (총 8개 페이라인) + 스캐터 보너스
 * - UR / SSR / SR / R / N 등급별 차등 보상 및 잭팟 연출
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Zap, Award, RotateCcw, Volume2, VolumeX, Flame, ChevronRight, HelpCircle } from 'lucide-react';
import { cn, getCardSpriteStyle } from '../lib/utils';
import { CARD_DATABASE } from '../cardDatabase';
import { Language, CardRarity, ItemRarity, Item } from '../types';
import { t } from '../lib/i18n';
import { triggerHaptic } from '../lib/haptic';

interface HeroNineSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  sns: number;
  updateSns: (amount: number, reason?: string) => void;
  playSfx: (url: string) => void;
  language: Language;
  addCard?: (rarity: CardRarity, indexOverride?: number, isSilent?: boolean) => void;
  addItem?: (rarity?: ItemRarity) => Item;
}

// 룰렛에 등장하는 대표 캐릭터 심볼 정의 (5단계 등급)
export interface SlotHeroSymbol {
  id: number; // 카드 ID
  nameKo: string;
  nameEn: string;
  rarity: 'UR' | 'SSR' | 'SR' | 'R' | 'N';
  rarityType: CardRarity;
  payoutMultiplier: number; // 3개 라인 일치 시 베팅액 대비 배율
  scatterReward: number; // 라인 불일치여도 3개 이상 등장 시 스캐터 보상(기본 100 베팅 기준)
  badgeColor: string;
  borderColor: string;
  glowColor: string;
  weight: number; // 가중치 (등장 확률)
}

export const HERO_SLOT_SYMBOLS: SlotHeroSymbol[] = [
  {
    id: 10, // 포세이돈
    nameKo: '포세이돈',
    nameEn: 'Poseidon',
    rarity: 'UR',
    rarityType: 'platinum',
    payoutMultiplier: 100, // 100배 (10,000 SNS)
    scatterReward: 1000,
    badgeColor: 'bg-purple-600 text-white border-purple-400',
    borderColor: 'border-purple-400',
    glowColor: 'shadow-[0_0_15px_rgba(168,85,247,0.6)]',
    weight: 3, // 희귀 (약 3%)
  },
  {
    id: 19, // 피닉스
    nameKo: '피닉스',
    nameEn: 'Phoenix',
    rarity: 'SSR',
    rarityType: 'gold',
    payoutMultiplier: 30, // 30배 (3,000 SNS)
    scatterReward: 400,
    badgeColor: 'bg-amber-500 text-slate-950 border-amber-300',
    borderColor: 'border-amber-400',
    glowColor: 'shadow-[0_0_12px_rgba(251,191,36,0.5)]',
    weight: 7, // 약 7%
  },
  {
    id: 16, // 무스펠
    nameKo: '무스펠',
    nameEn: 'Muspel',
    rarity: 'SR',
    rarityType: 'silver',
    payoutMultiplier: 10, // 10배 (1,000 SNS)
    scatterReward: 200,
    badgeColor: 'bg-sky-500 text-white border-sky-300',
    borderColor: 'border-sky-400',
    glowColor: 'shadow-[0_0_10px_rgba(56,189,248,0.4)]',
    weight: 15, // 약 15%
  },
  {
    id: 12, // 샐러맨더
    nameKo: '샐러맨더',
    nameEn: 'Salamander',
    rarity: 'R',
    rarityType: 'bronze',
    payoutMultiplier: 4, // 4배 (400 SNS)
    scatterReward: 100,
    badgeColor: 'bg-emerald-600 text-white border-emerald-400',
    borderColor: 'border-emerald-500',
    glowColor: 'shadow-[0_0_8px_rgba(16,185,129,0.3)]',
    weight: 30, // 약 30%
  },
  {
    id: 1, // 아쿠아리스
    nameKo: '아쿠아리스',
    nameEn: 'Aquaris',
    rarity: 'N',
    rarityType: 'bronze',
    payoutMultiplier: 1.5, // 1.5배 (150 SNS)
    scatterReward: 50,
    badgeColor: 'bg-slate-700 text-slate-200 border-slate-500',
    borderColor: 'border-slate-500',
    glowColor: 'shadow-none',
    weight: 45, // 약 45%
  },
];

// 3x3 슬롯 8개 페이라인 정의 (인덱스)
// 0 1 2
// 3 4 5
// 6 7 8
export const PAYLINES = [
  { id: 'h1', name: '가로 상단', nameEn: 'Top Row', indices: [0, 1, 2] },
  { id: 'h2', name: '가로 중단', nameEn: 'Mid Row', indices: [3, 4, 5] },
  { id: 'h3', name: '가로 하단', nameEn: 'Bot Row', indices: [6, 7, 8] },
  { id: 'v1', name: '세로 1열', nameEn: 'Col 1', indices: [0, 3, 6] },
  { id: 'v2', name: '세로 2열', nameEn: 'Col 2', indices: [1, 4, 7] },
  { id: 'v3', name: '세로 3열', nameEn: 'Col 3', indices: [2, 5, 8] },
  { id: 'd1', name: '대각선 ↘', nameEn: 'Diag ↘', indices: [0, 4, 8] },
  { id: 'd2', name: '대각선 ↙', nameEn: 'Diag ↙', indices: [2, 4, 6] },
];

// 가중치 기반 무작위 심볼 추첨
function pickRandomSymbol(): SlotHeroSymbol {
  const totalWeight = HERO_SLOT_SYMBOLS.reduce((sum, s) => sum + s.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const sym of HERO_SLOT_SYMBOLS) {
    if (roll < sym.weight) return sym;
    roll -= sym.weight;
  }
  return HERO_SLOT_SYMBOLS[HERO_SLOT_SYMBOLS.length - 1];
}

export const HeroNineSlotModal: React.FC<HeroNineSlotModalProps> = ({
  isOpen,
  onClose,
  sns,
  updateSns,
  playSfx,
  language,
  addCard,
  addItem,
}) => {
  // 베팅 금액 옵션
  const BET_OPTIONS = [100, 200, 500];
  const [betAmount, setBetAmount] = useState<number>(100);

  // 9개 룰렛 슬롯 상태 (0~8)
  const [grid, setGrid] = useState<SlotHeroSymbol[]>(() => {
    return Array.from({ length: 9 }, () => pickRandomSymbol());
  });

  // 슬롯 회전 상태 (각 릴별 혹은 전체)
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [reelSpinning, setReelSpinning] = useState<boolean[]>([false, false, false]); // 열 단위 3개 릴
  
  // 당첨 결과 상태
  const [winningPaylines, setWinningPaylines] = useState<typeof PAYLINES>([]);
  const [winningIndices, setWinningIndices] = useState<Set<number>>(new Set());
  const [lastWinAmount, setLastWinAmount] = useState<number>(0);
  const [lastWinDetails, setLastWinDetails] = useState<string | null>(null);
  const [showJackpotBanner, setShowJackpotBanner] = useState<boolean>(false);
  const [jackpotRarity, setJackpotRarity] = useState<string>('');
  const [showGuide, setShowGuide] = useState<boolean>(false);

  // 통계 상태 (로컬스토리지)
  const [stats, setStats] = useState({
    spins: 0,
    totalWon: 0,
    jackpotCount: 0,
  });

  // 로컬스토리지 로드
  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem('hero_nine_slot_stats');
        if (saved) {
          setStats(JSON.parse(saved));
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [isOpen]);

  const saveStats = (newWon: number, isJackpot: boolean) => {
    setStats((prev) => {
      const next = {
        spins: prev.spins + 1,
        totalWon: prev.totalWon + newWon,
        jackpotCount: prev.jackpotCount + (isJackpot ? 1 : 0),
      };
      try {
        localStorage.setItem('hero_nine_slot_stats', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  // 회전 애니메이션 루프용 인터벌 레퍼런스
  const spinIntervalRef = useRef<number | null>(null);

  const handleSpin = () => {
    if (isSpinning) return;

    if (sns < betAmount) {
      playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
      alert(language === 'ko' ? 'SNS 코인이 부족합니다! 이벤트 화면의 무료 충전을 이용해보세요.' : 'Insufficient SNS coins!');
      return;
    }

    // SNS 차감
    updateSns(-betAmount, language === 'ko' ? '9구 슬롯 머신 1회' : '9-Reel Slot Spin');
    triggerHaptic('medium');
    playSfx('https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3');

    setIsSpinning(true);
    setReelSpinning([true, true, true]);
    setWinningPaylines([]);
    setWinningIndices(new Set());
    setLastWinAmount(0);
    setLastWinDetails(null);
    setShowJackpotBanner(false);

    // 미리 최종 결과 슬롯 9개 결정
    const finalGrid: SlotHeroSymbol[] = Array.from({ length: 9 }, () => pickRandomSymbol());

    // 약 25% 확률로 잭팟/라인 당첨 유도 (흥미 극대화 알고리즘)
    const bonusLuckyRoll = Math.random();
    if (bonusLuckyRoll < 0.28) {
      const luckyLine = PAYLINES[Math.floor(Math.random() * PAYLINES.length)];
      const luckySymbol = pickRandomSymbol();
      luckyLine.indices.forEach((idx) => {
        finalGrid[idx] = luckySymbol;
      });
    }

    // 회전 중 가상 심볼 셔플 효과
    const startTime = performance.now();
    spinIntervalRef.current = window.setInterval(() => {
      setGrid((prev) =>
        prev.map((sym, i) => {
          const col = i % 3;
          if (reelSpinning[col]) {
            return pickRandomSymbol();
          }
          return sym;
        })
      );
    }, 60);

    // 1열(0,3,6) 정지 -> 0.8초
    setTimeout(() => {
      setReelSpinning((prev) => [false, prev[1], prev[2]]);
      setGrid((prev) => {
        const next = [...prev];
        next[0] = finalGrid[0];
        next[3] = finalGrid[3];
        next[6] = finalGrid[6];
        return next;
      });
      playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      triggerHaptic('light');
    }, 800);

    // 2열(1,4,7) 정지 -> 1.3초
    setTimeout(() => {
      setReelSpinning((prev) => [false, false, prev[2]]);
      setGrid((prev) => {
        const next = [...prev];
        next[1] = finalGrid[1];
        next[4] = finalGrid[4];
        next[7] = finalGrid[7];
        return next;
      });
      playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      triggerHaptic('light');
    }, 1300);

    // 3열(2,5,8) 정지 -> 1.8초 (최종 결과 판정)
    setTimeout(() => {
      if (spinIntervalRef.current) {
        clearInterval(spinIntervalRef.current);
        spinIntervalRef.current = null;
      }
      setReelSpinning([false, false, false]);
      setGrid(finalGrid);
      setIsSpinning(false);
      evaluateSlotResult(finalGrid);
    }, 1800);
  };

  // 슬롯 머신 결과 판정
  const evaluateSlotResult = (currentGrid: SlotHeroSymbol[]) => {
    const hits: typeof PAYLINES = [];
    const hitIdxs = new Set<number>();
    let totalPayout = 0;
    const detailList: string[] = [];
    let isUrOrSsrHit = false;
    let highestRarity = '';

    // 1. 8개 페이라인 검사
    PAYLINES.forEach((line) => {
      const sym0 = currentGrid[line.indices[0]];
      const sym1 = currentGrid[line.indices[1]];
      const sym2 = currentGrid[line.indices[2]];

      if (sym0.id === sym1.id && sym1.id === sym2.id) {
        hits.push(line);
        line.indices.forEach((idx) => hitIdxs.add(idx));
        
        // 당첨 금액: 배팅액 * 멀티플라이어
        const payout = Math.floor(betAmount * sym0.payoutMultiplier);
        totalPayout += payout;

        const lineName = language === 'ko' ? line.name : line.nameEn;
        const heroName = language === 'ko' ? sym0.nameKo : sym0.nameEn;
        detailList.push(`${lineName} [${sym0.rarity}] ${heroName} 3개 완성! (+${payout.toLocaleString()} SNS)`);

        if (sym0.rarity === 'UR' || sym0.rarity === 'SSR') {
          isUrOrSsrHit = true;
          highestRarity = sym0.rarity;
        }

        // 보너스 카드 / 아이템 지급
        if (sym0.rarity === 'UR' && addCard) {
          addCard('platinum', undefined, true);
        } else if (sym0.rarity === 'SSR' && addCard) {
          addCard('gold', undefined, true);
        } else if (sym0.rarity === 'SR' && addItem) {
          addItem();
        }
      }
    });

    // 2. 스캐터(Scatter) 검사: 라인이 아니더라도 보드 전체에 같은 캐릭터 3개 이상 모였을 때
    if (hits.length === 0) {
      const counts: Record<number, { sym: SlotHeroSymbol; count: number; indices: number[] }> = {};
      currentGrid.forEach((sym, idx) => {
        if (!counts[sym.id]) {
          counts[sym.id] = { sym, count: 0, indices: [] };
        }
        counts[sym.id].count += 1;
        counts[sym.id].indices.push(idx);
      });

      Object.values(counts).forEach(({ sym, count, indices }) => {
        if (count >= 3) {
          // 스캐터 보상 (베팅 배율 반영)
          const multiplier = betAmount / 100;
          const scatterBonus = Math.floor(sym.scatterReward * multiplier);
          totalPayout += scatterBonus;
          indices.forEach((idx) => hitIdxs.add(idx));

          const heroName = language === 'ko' ? sym.nameKo : sym.nameEn;
          detailList.push(
            language === 'ko'
              ? `스캐터 행운! ${heroName} ${count}개 포착 (+${scatterBonus.toLocaleString()} SNS)`
              : `Scatter Lucky! ${count}x ${heroName} (+${scatterBonus.toLocaleString()} SNS)`
          );

          if (sym.rarity === 'UR' || sym.rarity === 'SSR') {
            isUrOrSsrHit = true;
            highestRarity = sym.rarity;
          }
        }
      });
    }

    setWinningPaylines(hits);
    setWinningIndices(hitIdxs);
    setLastWinAmount(totalPayout);

    if (totalPayout > 0) {
      updateSns(totalPayout, language === 'ko' ? '9구 슬롯 머신 당첨' : '9-Reel Slot Win');
      setLastWinDetails(detailList.join(' / '));
      saveStats(totalPayout, isUrOrSsrHit);

      if (isUrOrSsrHit || totalPayout >= betAmount * 10) {
        setShowJackpotBanner(true);
        setJackpotRarity(highestRarity || 'JACKPOT');
        playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
        triggerHaptic('heavy');
      } else {
        playSfx('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');
        triggerHaptic('medium');
      }
    } else {
      setLastWinDetails(language === 'ko' ? '아쉽게도 일치하지 않았습니다. 다음 기회에!' : 'No match this time. Good luck next!');
      saveStats(0, false);
      triggerHaptic('light');
    }
  };

  // 언마운트 시 인터벌 정리
  useEffect(() => {
    return () => {
      if (spinIntervalRef.current) {
        clearInterval(spinIntervalRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-3 bg-black/85 backdrop-blur-md select-none font-mono">
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 15 }}
        className="relative w-full max-w-md bg-[#161414] border border-[#ffb703]/50 rounded-none shadow-[0_0_30px_rgba(255,183,3,0.2)] text-white overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* 상단 헤더 바 */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#201d1d] via-[#2a241b] to-[#201d1d] border-b border-[#ffb703]/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-sm bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-md">
              <span className="text-base">🎰</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black tracking-wide text-amber-300">
                  {language === 'ko' ? '9구 히어로 슬롯머신' : 'HERO 9-REEL SLOT'}
                </h3>
                <span className="px-1.5 py-0.5 text-[9px] font-black bg-rose-600 text-white rounded-sm animate-pulse">
                  NEW
                </span>
              </div>
              <p className="text-[10px] text-stone-400 font-mono">
                {language === 'ko' ? '3x3 룰렛 캐릭터 3개 맞추기' : 'Match 3 characters for tier rewards'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="p-1.5 rounded-sm bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors"
              title="배당표"
            >
              <HelpCircle size={16} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-sm bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* 메인 슬롯 영역 */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3.5">
          {/* 유저 보유 SNS & 최근 당첨액 표시 */}
          <div className="flex items-center justify-between px-3 py-2 bg-stone-900/90 border border-stone-800 rounded-sm">
            <div className="flex items-center gap-1.5">
              <Zap size={14} className="text-amber-400" />
              <span className="text-xs text-stone-400">{language === 'ko' ? '보유' : 'Balance'}:</span>
              <span className="text-xs font-black text-amber-300">{sns.toLocaleString()} SNS</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles size={13} className="text-emerald-400" />
              <span className="text-xs text-stone-400">{language === 'ko' ? '당첨' : 'Won'}:</span>
              <span className="text-xs font-black text-emerald-400">
                +{lastWinAmount.toLocaleString()} SNS
              </span>
            </div>
          </div>

          {/* 배당표 안내 아코디언 토글 */}
          <AnimatePresence>
            {showGuide && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden bg-stone-950/90 border border-amber-500/30 p-2.5 rounded-sm space-y-2 text-[11px]"
              >
                <div className="text-amber-400 font-bold flex items-center justify-between">
                  <span>📜 {language === 'ko' ? '등급별 3개 일치 당첨 배당표' : 'Payout Multipliers'}</span>
                  <span className="text-[9px] text-stone-400">8개 페이라인(가로/세로/대각선)</span>
                </div>
                <div className="grid grid-cols-5 gap-1 text-center font-mono">
                  {HERO_SLOT_SYMBOLS.map((sym) => (
                    <div key={sym.id} className="p-1 rounded-sm bg-stone-900 border border-stone-800 flex flex-col items-center">
                      <span className={cn('text-[9px] font-black px-1 rounded-xs', sym.badgeColor)}>
                        {sym.rarity}
                      </span>
                      <span className="text-[10px] text-stone-300 mt-0.5 truncate w-full">
                        {language === 'ko' ? sym.nameKo : sym.nameEn}
                      </span>
                      <span className="text-[10px] font-black text-amber-300 mt-0.5">
                        {sym.payoutMultiplier}배
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-[9px] text-stone-400 leading-tight">
                  {language === 'ko'
                    ? '※ 라인이 불일치해도 보드에 동일 캐릭터가 3개 이상 모이면 스캐터 행운 보상이 지급됩니다!'
                    : '※ Scatter: 3+ of any symbol anywhere pays bonus SNS even without paylines!'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 3x3 슬롯 머신 보드 (총 9개 룰렛 슬롯) */}
          <div className="relative p-2.5 bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 border-2 border-amber-500/60 rounded-sm shadow-inner">
            {/* 잭팟 대박 연출 배너 */}
            <AnimatePresence>
              {showJackpotBanner && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute inset-0 z-30 bg-black/85 flex flex-col items-center justify-center p-4 text-center"
                >
                  <motion.div
                    animate={{ rotate: [0, -5, 5, -5, 0], scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="text-4xl mb-1"
                  >
                    🎉👑💎
                  </motion.div>
                  <h4 className="text-xl font-black text-amber-300 tracking-wider animate-pulse">
                    {jackpotRarity} JACKPOT!!
                  </h4>
                  <p className="text-sm font-bold text-emerald-400 mt-1">
                    +{lastWinAmount.toLocaleString()} SNS 획득!
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowJackpotBanner(false)}
                    className="mt-3 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs rounded-sm shadow-md"
                  >
                    {language === 'ko' ? '확인 (수령)' : 'CLAIM'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 3x3 그리드 */}
            <div className="grid grid-cols-3 gap-2">
              {grid.map((sym, idx) => {
                const col = idx % 3;
                const isSpinningThis = reelSpinning[col];
                const isWinner = winningIndices.has(idx);

                return (
                  <motion.div
                    key={idx}
                    animate={
                      isSpinningThis
                        ? { y: [-6, 6, -6], scale: [0.97, 1.02, 0.97] }
                        : isWinner
                        ? { scale: [1, 1.06, 1], borderColor: ['#ffb703', '#ffffff', '#ffb703'] }
                        : {}
                    }
                    transition={
                      isSpinningThis
                        ? { repeat: Infinity, duration: 0.12, ease: 'linear' }
                        : isWinner
                        ? { repeat: Infinity, duration: 0.8 }
                        : {}
                    }
                    className={cn(
                      'relative aspect-square flex flex-col items-center justify-between p-1.5 rounded-sm bg-stone-900 border transition-all overflow-hidden',
                      isWinner
                        ? 'border-amber-400 bg-amber-950/40 shadow-[0_0_15px_rgba(251,191,36,0.6)] z-10'
                        : isSpinningThis
                        ? 'border-stone-700 bg-stone-950/80 opacity-90'
                        : 'border-stone-800 hover:border-stone-700'
                    )}
                  >
                    {/* 상단 뱃지: 등급 */}
                    <div className="w-full flex items-center justify-between">
                      <span className={cn('text-[8px] font-black px-1 py-0.2 rounded-xs uppercase', sym.badgeColor)}>
                        {sym.rarity}
                      </span>
                      {isWinner && (
                        <span className="text-[8px] font-black text-amber-300 animate-pulse">
                          HIT!
                        </span>
                      )}
                    </div>

                    {/* 캐릭터 카드 이미지 / 스프라이트 */}
                    <div className="relative w-12 h-12 my-0.5 rounded-sm overflow-hidden border border-stone-700 bg-stone-950 flex items-center justify-center">
                      <div
                        className="w-full h-full scale-105"
                        style={getCardSpriteStyle(sym.id)}
                      />
                    </div>

                    {/* 하단 영웅 이름 */}
                    <span className="text-[9px] font-bold text-stone-300 truncate w-full text-center">
                      {language === 'ko' ? sym.nameKo : sym.nameEn}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* 결과 안내 메시지 */}
          {lastWinDetails && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'p-2.5 text-center text-xs font-mono rounded-sm border',
                lastWinAmount > 0
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-stone-900/60 border-stone-800 text-stone-400'
              )}
            >
              {lastWinDetails}
            </motion.div>
          )}

          {/* 베팅 설정 & 스핀 버튼 */}
          <div className="space-y-2 pt-1">
            {/* 베팅 금액 선택 */}
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-stone-400">
                {language === 'ko' ? '베팅 금액 (1회):' : 'Bet Amount:'}
              </span>
              <div className="flex gap-1.5">
                {BET_OPTIONS.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    disabled={isSpinning}
                    onClick={() => {
                      triggerHaptic('light');
                      setBetAmount(amount);
                    }}
                    className={cn(
                      'px-2.5 py-1 text-xs font-black rounded-sm border transition-colors',
                      betAmount === amount
                        ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-sm'
                        : 'bg-stone-900 text-stone-400 border-stone-800 hover:border-stone-700'
                    )}
                  >
                    {amount} SNS
                  </button>
                ))}
              </div>
            </div>

            {/* 레버 당기기 / 스핀 액션 버튼 */}
            <button
              type="button"
              disabled={isSpinning}
              onClick={handleSpin}
              className={cn(
                'w-full h-12 flex items-center justify-center gap-2 font-black text-sm uppercase tracking-wider rounded-sm transition-all active:scale-[0.98] shadow-lg',
                isSpinning
                  ? 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 border border-amber-300 shadow-[0_0_20px_rgba(255,183,3,0.3)]'
              )}
            >
              <RotateCcw
                size={18}
                className={cn('transition-transform', isSpinning && 'animate-spin')}
              />
              <span>
                {isSpinning
                  ? language === 'ko'
                    ? '9개 룰렛 회전 중...'
                    : 'Spinning 9 Reels...'
                  : language === 'ko'
                  ? `슬롯 레버 당기기 (${betAmount} SNS)`
                  : `SPIN SLOT (${betAmount} SNS)`}
              </span>
            </button>
          </div>

          {/* 누적 통계 미니 바 */}
          <div className="pt-1 flex items-center justify-between text-[10px] text-stone-500 font-mono border-t border-stone-800/80">
            <span>{language === 'ko' ? `총 스핀: ${stats.spins}회` : `Spins: ${stats.spins}`}</span>
            <span>{language === 'ko' ? `누적 획득: ${stats.totalWon.toLocaleString()} SNS` : `Total Won: ${stats.totalWon}`}</span>
            <span>{language === 'ko' ? `잭팟: ${stats.jackpotCount}회` : `Jackpots: ${stats.jackpotCount}`}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
