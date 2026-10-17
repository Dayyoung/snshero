/**
 * HeroNineSlotModal.tsx
 * 상업용 아케이드 카지노 퀄리티 9구(3x3) 히어로 슬롯머신 ("HERO VEGAS 9-REEL")
 * - 실제 릴 스트립(Reel Strip) 수직 고속 스크롤 & 탄성 바운스 정지 물리 연출
 * - WILD(황금 카단) 심볼 조커 판정 + UR/SSR/SR/R/N 등급별 차등 배당
 * - 2릴 매칭 시 3번째 릴 '하이라이트 쪼기(Suspense Slow-Mo)' 특수 연출
 * - 8개 페이라인(가로 3, 세로 3, 대각선 2) SVG 네온 레이저 빔 & 개별 당첨 팝업
 * - 피버 게이지(FEVER MODE: 5스핀마다 무료 피버 스핀 & 배당 2배) & 프로그레시브 잭팟 전광판
 * - 60FPS HTML5 Canvas 금화 분수 파티클 + Web Audio API 카지노 사운드 신디사이저
 * - 터보 스핀(⚡) 및 연속 자동 스핀(AUTO) 완비
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Zap,
  Flame,
  HelpCircle,
  Play,
  Pause,
  FastForward,
  Trophy,
  Crown,
  Volume2,
  VolumeX,
  Sparkles,
} from 'lucide-react';
import { cn, getAssetUrl } from '../lib/utils';
import { Language, CardRarity, ItemRarity, Item } from '../types';
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

export interface SlotHeroSymbol {
  key: string;
  id: number;
  nameKo: string;
  nameEn: string;
  rarity: 'WILD' | 'UR' | 'SSR' | 'SR' | 'R' | 'N';
  rarityType: CardRarity;
  image: string;
  payoutMultiplier: number; // 3개 라인 완성 시 배팅액 대비 배율
  scatterReward: number; // 보드 내 3개 이상 스캐터 보너스 (100 SNS 베팅 기준)
  frameClass: string;
  badgeClass: string;
  accentHex: string;
  weight: number;
}

export const COMMERCIAL_SLOT_SYMBOLS: SlotHeroSymbol[] = [
  {
    key: 'wild_kadan',
    id: 105,
    nameKo: '황금 카단 (WILD)',
    nameEn: 'King Kadan (WILD)',
    rarity: 'WILD',
    rarityType: 'platinum',
    image: '/seat/Kadan.png',
    payoutMultiplier: 150,
    scatterReward: 1500,
    frameClass: 'from-yellow-400 via-amber-500 to-yellow-600 border-yellow-200',
    badgeClass: 'bg-gradient-to-r from-yellow-300 to-amber-500 text-black font-black',
    accentHex: '#facc15',
    weight: 4,
  },
  {
    key: 'ur_poseidon',
    id: 10,
    nameKo: '포세이돈',
    nameEn: 'Poseidon',
    rarity: 'UR',
    rarityType: 'platinum',
    image: '/seat/Poseidon.png',
    payoutMultiplier: 80,
    scatterReward: 800,
    frameClass: 'from-fuchsia-600 via-purple-700 to-indigo-900 border-fuchsia-400',
    badgeClass: 'bg-fuchsia-500 text-white font-black',
    accentHex: '#e879f9',
    weight: 6,
  },
  {
    key: 'ssr_phoenix',
    id: 19,
    nameKo: '피닉스',
    nameEn: 'Phoenix',
    rarity: 'SSR',
    rarityType: 'gold',
    image: '/seat/Phoenix.png',
    payoutMultiplier: 30,
    scatterReward: 400,
    frameClass: 'from-amber-500 via-orange-600 to-red-900 border-amber-400',
    badgeClass: 'bg-amber-400 text-slate-950 font-black',
    accentHex: '#fbbf24',
    weight: 11,
  },
  {
    key: 'sr_leviathan',
    id: 6,
    nameKo: '레비아탄',
    nameEn: 'Leviathan',
    rarity: 'SR',
    rarityType: 'silver',
    image: '/seat/Leviathan.png',
    payoutMultiplier: 12,
    scatterReward: 200,
    frameClass: 'from-cyan-500 via-blue-700 to-slate-900 border-cyan-400',
    badgeClass: 'bg-cyan-400 text-slate-950 font-black',
    accentHex: '#38bdf8',
    weight: 18,
  },
  {
    key: 'r_zephyros',
    id: 21,
    nameKo: '제피로스',
    nameEn: 'Zephyros',
    rarity: 'R',
    rarityType: 'bronze',
    image: '/seat/Zephyros.png',
    payoutMultiplier: 5,
    scatterReward: 100,
    frameClass: 'from-emerald-600 via-teal-800 to-slate-900 border-emerald-400',
    badgeClass: 'bg-emerald-500 text-slate-950 font-black',
    accentHex: '#34d399',
    weight: 27,
  },
  {
    key: 'n_aquaris',
    id: 1,
    nameKo: '아쿠아리스',
    nameEn: 'Aquaris',
    rarity: 'N',
    rarityType: 'bronze',
    image: '/seat/Aquaris.png',
    payoutMultiplier: 2,
    scatterReward: 50,
    frameClass: 'from-slate-600 via-slate-800 to-slate-950 border-slate-400',
    badgeClass: 'bg-slate-600 text-white font-bold',
    accentHex: '#94a3b8',
    weight: 34,
  },
];

// 3x3 보드 8개 페이라인 + SVG 선분 좌표 (0~100% 기준)
// 0(16.6,16.6)  1(50,16.6)  2(83.3,16.6)
// 3(16.6,50.0)  4(50,50.0)  5(83.3,50.0)
// 6(16.6,83.3)  7(50,83.3)  8(83.3,83.3)
export interface PaylineDef {
  id: string;
  nameKo: string;
  nameEn: string;
  indices: [number, number, number];
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
}

export const PAYLINES_8: PaylineDef[] = [
  { id: 'h1', nameKo: '상단 가로라인', nameEn: 'Top Row', indices: [0, 1, 2], x1: 8, y1: 16.6, x2: 92, y2: 16.6, color: '#fbbf24' },
  { id: 'h2', nameKo: '중앙 메인라인', nameEn: 'Center Row', indices: [3, 4, 5], x1: 8, y1: 50.0, x2: 92, y2: 50.0, color: '#f43f5e' },
  { id: 'h3', nameKo: '하단 가로라인', nameEn: 'Bottom Row', indices: [6, 7, 8], x1: 8, y1: 83.3, x2: 92, y2: 83.3, color: '#38bdf8' },
  { id: 'v1', nameKo: '좌측 세로라인', nameEn: 'Left Column', indices: [0, 3, 6], x1: 16.6, y1: 8, x2: 16.6, y2: 92, color: '#a855f7' },
  { id: 'v2', nameKo: '중앙 세로라인', nameEn: 'Mid Column', indices: [1, 4, 7], x1: 50.0, y1: 8, x2: 50.0, y2: 92, color: '#10b981' },
  { id: 'v3', nameKo: '우측 세로라인', nameEn: 'Right Column', indices: [2, 5, 8], x1: 83.3, y1: 8, x2: 83.3, y2: 92, color: '#f97316' },
  { id: 'd1', nameKo: '크로스 대각선 ↘', nameEn: 'Diagonal ↘', indices: [0, 4, 8], x1: 10, y1: 10, x2: 90, y2: 90, color: '#e879f9' },
  { id: 'd2', nameKo: '크로스 대각선 ↙', nameEn: 'Diagonal ↙', indices: [2, 4, 6], x1: 90, y1: 10, x2: 10, y2: 90, color: '#facc15' },
];

// Web Audio API 카지노 사운드 신디사이저 (네트워크 지연 0ms)
class SlotSoundSynth {
  private ctx: AudioContext | null = null;
  public muted: boolean = false;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  playLeverPull() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.12);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  playReelTick(pitchOffset = 0) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600 + pitchOffset * 40, now);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.035);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.035);
  }

  playReelStop(colIndex: number, isTension = false) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const freqs = [261.63, 329.63, 392.0]; // C4, E4, G4
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = isTension ? 'sine' : 'square';
    osc.frequency.setValueAtTime(freqs[colIndex] || 300, now);
    osc.frequency.exponentialRampToValueAtTime((freqs[colIndex] || 300) * 0.5, now + 0.12);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.008, now + 0.13);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  playSuspensePulse() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(880, now + 0.75);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.78);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.78);
  }

  playWinFanfare(isBigWin: boolean) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = isBigWin
      ? [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98]
      : [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      const start = now + i * 0.08;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.16, start);
      gain.gain.exponentialRampToValueAtTime(0.008, start + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(start);
      osc.stop(start + 0.35);
    });
  }
}

const slotSynth = new SlotSoundSynth();

function pickWeightedSymbol(isFever: boolean): SlotHeroSymbol {
  // 피버 모드일 때는 고등급(WILD, UR, SSR, SR) 확률 2배 부스트
  const pool = COMMERCIAL_SLOT_SYMBOLS.map((s) => ({
    sym: s,
    w: isFever && ['WILD', 'UR', 'SSR', 'SR'].includes(s.rarity) ? s.weight * 2.2 : s.weight,
  }));
  const total = pool.reduce((acc, item) => acc + item.w, 0);
  let r = Math.random() * total;
  for (const item of pool) {
    if (r < item.w) return item.sym;
    r -= item.w;
  }
  return COMMERCIAL_SLOT_SYMBOLS[COMMERCIAL_SLOT_SYMBOLS.length - 1];
}

// 3개 심볼이 매칭되는지 판정 (WILD는 조커 역할)
function evaluateThreeLine(
  s0: SlotHeroSymbol,
  s1: SlotHeroSymbol,
  s2: SlotHeroSymbol
): SlotHeroSymbol | null {
  const syms = [s0, s1, s2];
  const nonWilds = syms.filter((s) => s.rarity !== 'WILD');
  if (nonWilds.length === 0) {
    // 3개 모두 WILD!
    return COMMERCIAL_SLOT_SYMBOLS[0];
  }
  const targetKey = nonWilds[0].key;
  const allMatch = nonWilds.every((s) => s.key === targetKey);
  return allMatch ? nonWilds[0] : null;
}

interface HitLineInfo {
  payline: PaylineDef;
  matchedSymbol: SlotHeroSymbol;
  payout: number;
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
  const isKo = language === 'ko';
  const BET_OPTIONS = [100, 300, 500, 1000];
  const [betAmount, setBetAmount] = useState<number>(100);

  // 3x3 = 9개 슬롯 결과 심볼 배열 (인덱스 0~8)
  const [grid, setGrid] = useState<SlotHeroSymbol[]>(() =>
    Array.from({ length: 9 }, () => pickWeightedSymbol(false))
  );

  // 3개 열(Column 0, 1, 2) 각각의 회전 상태: 'idle' | 'spinning' | 'bouncing'
  const [colState, setColState] = useState<('idle' | 'spinning' | 'bouncing')[]>([
    'idle',
    'idle',
    'idle',
  ]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [tensionCol2, setTensionCol2] = useState(false); // 3번째 열 쪼기 이펙트

  // 스핀 중 빠르게 흐르는 더미 스트립 오프셋
  const [stripTick, setStripTick] = useState(0);

  // 피버 게이지 (0~100%, 5스핀마다 피버 발동 -> 3회 무료 2배 스핀)
  const [feverProgress, setFeverProgress] = useState<number>(0);
  const [feverSpinsLeft, setFeverSpinsLeft] = useState<number>(0);

  // 실시간 누적 그랜드 잭팟 전광판
  const [jackpotPool, setJackpotPool] = useState<number>(() => {
    const saved = localStorage.getItem('hero_vegas_jackpot_pool');
    return saved ? parseInt(saved, 10) || 158400 : 158400;
  });

  // 옵션: 터보 / 오토스핀 / 음소거 / 배당표
  const [isTurbo, setIsTurbo] = useState(false);
  const [autoSpinCount, setAutoSpinCount] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showPaytable, setShowPaytable] = useState(false);
  const [leverPulled, setLeverPulled] = useState(false);

  // 당첨 결과 상태
  const [hitLines, setHitLines] = useState<HitLineInfo[]>([]);
  const [winningCells, setWinningCells] = useState<Set<number>>(new Set());
  const [totalWinAmount, setTotalWinAmount] = useState<number>(0);
  const [animatedWinCount, setAnimatedWinCount] = useState<number>(0);
  const [scatterBonusText, setScatterBonusText] = useState<string | null>(null);
  const [bigWinOverlay, setBigWinOverlay] = useState<{
    title: string;
    subtitle: string;
    amount: number;
    hero: SlotHeroSymbol;
  } | null>(null);

  // 통계 (로컬스토리지)
  const [stats, setStats] = useState({ spins: 0, totalWon: 0, bestWin: 0 });

  // 금화 파티클 캔버스 Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<
    {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      rot: number;
      vRot: number;
      color: string;
      alpha: number;
    }[]
  >([]);
  const animFrameRef = useRef<number | null>(null);
  const timersRef = useRef<number[]>([]);

  // 로컬스토리지 통계 로드
  useEffect(() => {
    if (isOpen) {
      try {
        const raw = localStorage.getItem('hero_nine_slot_stats_v2');
        if (raw) setStats(JSON.parse(raw));
      } catch (e) {
        console.error(e);
      }
    }
  }, [isOpen]);

  // 잭팟 전광판 실시간 상승 연출
  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setInterval(() => {
      setJackpotPool((prev) => {
        const next = prev + Math.floor(Math.random() * 19) + 3;
        localStorage.setItem('hero_vegas_jackpot_pool', String(next));
        return next;
      });
    }, 1400);
    return () => clearInterval(timer);
  }, [isOpen]);

  // 당첨금 카운트업 애니메이션
  useEffect(() => {
    if (totalWinAmount <= 0) {
      setAnimatedWinCount(0);
      return;
    }
    let current = 0;
    const step = Math.max(1, Math.ceil(totalWinAmount / 25));
    const timer = window.setInterval(() => {
      current += step;
      if (current >= totalWinAmount) {
        setAnimatedWinCount(totalWinAmount);
        clearInterval(timer);
      } else {
        setAnimatedWinCount(current);
      }
    }, 24);
    return () => clearInterval(timer);
  }, [totalWinAmount]);

  // 금화 폭발 파티클 스폰 함수
  const spawnCoinFountain = useCallback((count = 55) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.width;
    const h = canvas.height;
    const colors = ['#facc15', '#fbbf24', '#f59e0b', '#fef08a', '#38bdf8', '#e879f9'];

    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x: w * 0.5 + (Math.random() - 0.5) * 80,
        y: h * 0.55,
        vx: (Math.random() - 0.5) * 13,
        vy: -Math.random() * 14 - 5,
        size: Math.random() * 8 + 7,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.25,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
      });
    }
  }, []);

  // 캔버스 파티클 루프
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderLoop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const list = particlesRef.current;
      for (let i = list.length - 1; i >= 0; i--) {
        const p = list[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.48; // 중력
        p.rot += p.vRot;
        p.alpha -= 0.012;

        if (p.alpha <= 0 || p.y > canvas.height + 30) {
          list.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        // 입체 금화 렌더링
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * Math.abs(Math.cos(p.rot * 2) * 0.65 + 0.35), 0, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
        ctx.restore();
      }
      animFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameRef.current = requestAnimationFrame(renderLoop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOpen]);

  // 회전 중 릴 스트립 틱 업데이트
  useEffect(() => {
    if (!isSpinning) return;
    const tickInterval = window.setInterval(() => {
      setStripTick((t) => {
        slotSynth.playReelTick(t % 5);
        return t + 1;
      });
    }, isTurbo ? 45 : 70);
    return () => clearInterval(tickInterval);
  }, [isSpinning, isTurbo]);

  // 오토스핀 트리거
  useEffect(() => {
    if (!isSpinning && autoSpinCount > 0 && !bigWinOverlay && isOpen) {
      const t = window.setTimeout(() => {
        setAutoSpinCount((c) => Math.max(0, c - 1));
        triggerSpin();
      }, 650);
      return () => clearTimeout(t);
    }
  }, [isSpinning, autoSpinCount, bigWinOverlay, isOpen]);

  // 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      timersRef.current.forEach((id) => clearTimeout(id));
    };
  }, []);

  const clearAllTimers = () => {
    timersRef.current.forEach((id) => clearTimeout(id));
    timersRef.current = [];
  };

  // 스핀 실행
  const triggerSpin = () => {
    if (isSpinning) return;

    const isFeverFreeSpin = feverSpinsLeft > 0;
    const currentCost = isFeverFreeSpin ? 0 : betAmount;

    if (!isFeverFreeSpin && sns < currentCost) {
      setAutoSpinCount(0);
      playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
      return;
    }

    clearAllTimers();

    // 레버 당김 모션
    setLeverPulled(true);
    setTimeout(() => setLeverPulled(false), 300);
    slotSynth.playLeverPull();
    triggerHaptic('medium');

    // SNS 차감 및 잭팟 풀 적립
    if (currentCost > 0) {
      updateSns(-currentCost, isKo ? '9구 베가스 슬롯 스핀' : 'Hero Vegas 9-Slot Spin');
      setJackpotPool((prev) => prev + Math.floor(currentCost * 0.25));
    }

    // 피버 카운트 업데이트
    if (isFeverFreeSpin) {
      setFeverSpinsLeft((prev) => prev - 1);
    } else {
      setFeverProgress((prev) => {
        const next = prev + 20;
        if (next >= 100) {
          setFeverSpinsLeft(3);
          return 0;
        }
        return next;
      });
    }

    setIsSpinning(true);
    setColState(['spinning', 'spinning', 'spinning']);
    setTensionCol2(false);
    setHitLines([]);
    setWinningCells(new Set());
    setTotalWinAmount(0);
    setScatterBonusText(null);
    setBigWinOverlay(null);

    // 최종 3x3 보드 심볼 생성
    const nextGrid: SlotHeroSymbol[] = Array.from({ length: 9 }, () =>
      pickWeightedSymbol(isFeverFreeSpin)
    );

    // 상업용 슬롯 재미 보정: 약 36% 확률로 최소 1개 라인 또는 짜릿한 조합 성사
    const hitAssistRoll = Math.random();
    if (hitAssistRoll < (isFeverFreeSpin ? 0.58 : 0.36)) {
      const targetLine = PAYLINES_8[Math.floor(Math.random() * PAYLINES_8.length)];
      const chosenSym = pickWeightedSymbol(isFeverFreeSpin);
      targetLine.indices.forEach((idx) => {
        // 간혹 WILD를 섞어 조커 매칭 쾌감 부여
        if (Math.random() < 0.22) {
          nextGrid[idx] = COMMERCIAL_SLOT_SYMBOLS[0]; // WILD
        } else {
          nextGrid[idx] = chosenSym;
        }
      });
    }

    // 1열(0,3,6)과 2열(1,4,7)에서 고등급 2매치가 성사되었는지 확인 (3열 쪼기 연출 여부)
    // 가로줄 또는 대각선에서 col0과 col1이 고등급 매칭인지 체크
    const checkNearMissTension = () => {
      const pairs: [number, number][] = [
        [0, 1],
        [3, 4],
        [6, 7],
        [0, 4],
        [6, 4],
      ];
      return pairs.some(([i0, i1]) => {
        const s0 = nextGrid[i0];
        const s1 = nextGrid[i1];
        const match =
          s0.key === s1.key || s0.rarity === 'WILD' || s1.rarity === 'WILD';
        const highTier = ['WILD', 'UR', 'SSR', 'SR'].includes(s0.rarity) || ['WILD', 'UR', 'SSR', 'SR'].includes(s1.rarity);
        return match && highTier;
      });
    };

    const hasSuspense = !isTurbo && checkNearMissTension();
    const baseDelay = isTurbo ? 260 : 620;

    // 1열 정지 (인덱스 0, 3, 6)
    const t1 = window.setTimeout(() => {
      setGrid((prev) => {
        const copy = [...prev];
        copy[0] = nextGrid[0];
        copy[3] = nextGrid[3];
        copy[6] = nextGrid[6];
        return copy;
      });
      setColState(['bouncing', 'spinning', 'spinning']);
      slotSynth.playReelStop(0);
      triggerHaptic('light');
    }, baseDelay);

    // 2열 정지 (인덱스 1, 4, 7)
    const t2 = window.setTimeout(() => {
      setGrid((prev) => {
        const copy = [...prev];
        copy[1] = nextGrid[1];
        copy[4] = nextGrid[4];
        copy[7] = nextGrid[7];
        return copy;
      });
      setColState(['idle', 'bouncing', 'spinning']);
      slotSynth.playReelStop(1);
      triggerHaptic('light');

      if (hasSuspense) {
        setTensionCol2(true);
        slotSynth.playSuspensePulse();
        triggerHaptic('heavy');
      }
    }, baseDelay * 1.85);

    // 3열 정지 (인덱스 2, 5, 8) 및 최종 정산
    const col3Delay = hasSuspense ? baseDelay * 3.4 : baseDelay * 2.65;
    const t3 = window.setTimeout(() => {
      setGrid(nextGrid);
      setColState(['idle', 'idle', 'bouncing']);
      setTensionCol2(false);
      slotSynth.playReelStop(2, hasSuspense);
      triggerHaptic('medium');

      const t4 = window.setTimeout(() => {
        setColState(['idle', 'idle', 'idle']);
        setIsSpinning(false);
        settleSpinResult(nextGrid, isFeverFreeSpin);
      }, 180);
      timersRef.current.push(t4);
    }, col3Delay);

    timersRef.current.push(t1, t2, t3);
  };

  // 결과 정산
  const settleSpinResult = (finalGrid: SlotHeroSymbol[], wasFever: boolean) => {
    const feverMult = wasFever ? 2 : 1;
    const matchedLines: HitLineInfo[] = [];
    const winIdxSet = new Set<number>();
    let totalWon = 0;
    let bestHero: SlotHeroSymbol | null = null;

    // 1. 8개 페이라인 검사 (WILD 조커 포함)
    PAYLINES_8.forEach((line) => {
      const [i0, i1, i2] = line.indices;
      const matchedSym = evaluateThreeLine(
        finalGrid[i0],
        finalGrid[i1],
        finalGrid[i2]
      );
      if (matchedSym) {
        const linePayout = Math.floor(
          betAmount * matchedSym.payoutMultiplier * feverMult
        );
        matchedLines.push({
          payline: line,
          matchedSymbol: matchedSym,
          payout: linePayout,
        });
        totalWon += linePayout;
        winIdxSet.add(i0);
        winIdxSet.add(i1);
        winIdxSet.add(i2);

        if (
          !bestHero ||
          matchedSym.payoutMultiplier > bestHero.payoutMultiplier
        ) {
          bestHero = matchedSym;
        }

        // 등급별 추가 카드/아이템 보상 지급
        if ((matchedSym.rarity === 'WILD' || matchedSym.rarity === 'UR') && addCard) {
          addCard('platinum', undefined, true);
        } else if (matchedSym.rarity === 'SSR' && addCard) {
          addCard('gold', undefined, true);
        } else if (matchedSym.rarity === 'SR' && addItem) {
          addItem();
        }
      }
    });

    // 2. 페이라인이 없더라도 9칸 중 동일 심볼(또는 WILD 포함) 3개 이상이면 스캐터 보너스!
    if (matchedLines.length === 0) {
      const countMap: Record<
        string,
        { sym: SlotHeroSymbol; indices: number[] }
      > = {};
      finalGrid.forEach((s, idx) => {
        if (!countMap[s.key]) countMap[s.key] = { sym: s, indices: [] };
        countMap[s.key].indices.push(idx);
      });

      Object.values(countMap).forEach(({ sym, indices }) => {
        if (indices.length >= 3) {
          const scatterPay = Math.floor(
            sym.scatterReward * (betAmount / 100) * feverMult
          );
          totalWon += scatterPay;
          indices.forEach((i) => winIdxSet.add(i));
          setScatterBonusText(
            isKo
              ? `✨ 스캐터 보너스! [${sym.rarity}] ${sym.nameKo} ${indices.length}개 포착 (+${scatterPay.toLocaleString()} SNS)`
              : `✨ SCATTER BONUS! ${indices.length}x ${sym.nameEn} (+${scatterPay.toLocaleString()} SNS)`
          );
        }
      });
    }

    setHitLines(matchedLines);
    setWinningCells(winIdxSet);
    setTotalWinAmount(totalWon);

    // 통계 업데이트
    setStats((prev) => {
      const next = {
        spins: prev.spins + 1,
        totalWon: prev.totalWon + totalWon,
        bestWin: Math.max(prev.bestWin, totalWon),
      };
      try {
        localStorage.setItem('hero_nine_slot_stats_v2', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });

    if (totalWon > 0) {
      updateSns(totalWon, isKo ? '9구 베가스 슬롯 당첨' : 'Hero Vegas 9-Slot Win');
      const isMegaWin = totalWon >= betAmount * 12;
      slotSynth.playWinFanfare(isMegaWin);
      spawnCoinFountain(isMegaWin ? 95 : 45);

      if (isMegaWin && bestHero) {
        const heroObj = bestHero as SlotHeroSymbol;
        setBigWinOverlay({
          title:
            heroObj.rarity === 'WILD' || heroObj.rarity === 'UR'
              ? 'GRAND MEGA JACKPOT!!'
              : 'SUPER BIG WIN!!',
          subtitle: isKo
            ? `[${heroObj.rarity}] ${heroObj.nameKo} 라인 완성!`
            : `[${heroObj.rarity}] ${heroObj.nameEn} Line Complete!`,
          amount: totalWon,
          hero: heroObj,
        });
        playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
        triggerHaptic('heavy');
      } else {
        playSfx('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');
        triggerHaptic('medium');
      }
    }
  };

  if (!isOpen) return null;

  const isFeverActive = feverSpinsLeft > 0;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md select-none font-mono">
      {/* 아케이드 카지노 캐비닛 메인 프레임 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        className={cn(
          'relative w-full max-w-md bg-[#0c0a12] border-2 rounded-none overflow-hidden flex flex-col max-h-[94dvh] shadow-[0_0_50px_rgba(251,191,36,0.28)]',
          isFeverActive ? 'border-fuchsia-400 shadow-[0_0_60px_rgba(232,121,249,0.5)]' : 'border-amber-400/80'
        )}
      >
        {/* 60FPS 금화 분수 파티클 Canvas 오버레이 */}
        <canvas
          ref={canvasRef}
          width={440}
          height={720}
          className="pointer-events-none absolute inset-0 w-full h-full z-40"
        />

        {/* 상단 카지노 네온 마키 헤더 */}
        <div className="relative px-3.5 py-2.5 bg-gradient-to-r from-[#1c1226] via-[#2d1810] to-[#1c1226] border-b border-amber-400/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-sm bg-gradient-to-br from-yellow-300 via-amber-500 to-red-600 flex items-center justify-center border border-yellow-200 shadow-md">
              <Crown size={17} className="text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-xs sm:text-sm font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-400">
                  {isKo ? 'HERO VEGAS 9-SLOT' : 'HERO VEGAS 9-SLOT'}
                </h2>
                <span className="px-1.5 py-0.5 text-[9px] font-black bg-rose-600 text-white rounded-sm animate-pulse">
                  PRO
                </span>
              </div>
              <p className="text-[10px] text-amber-200/70">
                {isKo ? '8라인 3x3 리얼 카지노 룰렛 & 피버 잭팟' : '8-Payline 3x3 Commercial Casino Slot'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                slotSynth.muted = !isMuted;
                setIsMuted(!isMuted);
              }}
              className="w-8 h-8 rounded-sm bg-stone-900/90 border border-stone-700 flex items-center justify-center text-stone-300 hover:text-white"
              title="사운드 켜기/끄기"
            >
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
            <button
              type="button"
              onClick={() => setShowPaytable(!showPaytable)}
              className={cn(
                'w-8 h-8 rounded-sm border flex items-center justify-center transition-colors',
                showPaytable
                  ? 'bg-amber-400 text-slate-950 border-yellow-200'
                  : 'bg-stone-900/90 border-stone-700 text-stone-300 hover:text-white'
              )}
              title="배당표 보기"
            >
              <HelpCircle size={15} />
            </button>
            <button
              type="button"
              onClick={() => {
                setAutoSpinCount(0);
                onClose();
              }}
              className="w-8 h-8 rounded-sm bg-stone-900/90 border border-stone-700 flex items-center justify-center text-stone-300 hover:bg-rose-600 hover:border-rose-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* 스크롤 본문 */}
        <div className="p-3 flex-1 overflow-y-auto space-y-2.5">
          {/* 실시간 프로그레시브 그랜드 잭팟 전광판 */}
          <div className="relative px-3 py-2 bg-gradient-to-r from-amber-950/60 via-yellow-900/30 to-amber-950/60 border border-amber-400/50 rounded-sm flex items-center justify-between overflow-hidden">
            <div className="flex items-center gap-1.5">
              <Trophy size={15} className="text-yellow-400 animate-bounce" />
              <span className="text-[10px] font-black tracking-widest text-yellow-300 uppercase">
                GRAND JACKPOT
              </span>
            </div>
            <div className="text-sm sm:text-base font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-yellow-200 to-amber-400 tracking-wider">
              {jackpotPool.toLocaleString()} <span className="text-[10px] text-amber-300">SNS</span>
            </div>
          </div>

          {/* 유저 잔액 & 당첨 금액 & 피버 게이지 바 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="px-3 py-1.5 bg-[#14121d] border border-stone-800 rounded-sm flex items-center justify-between">
              <span className="text-[10px] text-stone-400">{isKo ? '보유 SNS' : 'BALANCE'}</span>
              <span className="text-xs font-black text-amber-300 flex items-center gap-1">
                <Zap size={12} className="text-amber-400" />
                {sns.toLocaleString()}
              </span>
            </div>
            <div className="px-3 py-1.5 bg-[#14121d] border border-stone-800 rounded-sm flex items-center justify-between">
              <span className="text-[10px] text-stone-400">{isKo ? '이번 당첨' : 'WIN'}</span>
              <span
                className={cn(
                  'text-xs font-black flex items-center gap-1',
                  animatedWinCount > 0 ? 'text-emerald-400 scale-105' : 'text-stone-500'
                )}
              >
                <Sparkles size={12} className="text-emerald-400" />+
                {animatedWinCount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* FEVER 게이지 바 */}
          <div className="px-3 py-1.5 bg-[#14121d] border border-stone-800 rounded-sm">
            <div className="flex items-center justify-between text-[10px] mb-1">
              <span className="font-black flex items-center gap-1 text-fuchsia-300">
                <Flame size={12} className={cn(isFeverActive ? 'text-rose-400 animate-bounce' : 'text-fuchsia-400')} />
                {isFeverActive
                  ? isKo
                    ? `🔥 FEVER 타임 발동! (무료 & 2배 배당: ${feverSpinsLeft}회 남음)`
                    : `🔥 FEVER MODE ACTIVE! (${feverSpinsLeft} Free 2x Spins)`
                  : isKo
                  ? '피버 부스터 게이지 (100% 시 무료 스핀 3회 & 2배 배당)'
                  : 'FEVER GAUGE (100% = 3 Free 2x Spins)'}
              </span>
              <span className="font-black text-fuchsia-300">
                {isFeverActive ? 'MAX!' : `${feverProgress}%`}
              </span>
            </div>
            <div className="w-full h-2 bg-stone-900 rounded-none overflow-hidden border border-stone-800">
              <motion.div
                animate={{ width: isFeverActive ? '100%' : `${feverProgress}%` }}
                className={cn(
                  'h-full transition-all duration-300',
                  isFeverActive
                    ? 'bg-gradient-to-r from-fuchsia-500 via-rose-500 to-yellow-400 animate-pulse'
                    : 'bg-gradient-to-r from-purple-600 to-fuchsia-400'
                )}
              />
            </div>
          </div>

          {/* 배당표 모달 (토글) */}
          <AnimatePresence>
            {showPaytable && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden bg-[#161321] border border-amber-400/40 p-2.5 rounded-sm space-y-2"
              >
                <div className="flex items-center justify-between text-[11px] font-black text-amber-300">
                  <span>📜 {isKo ? '3매치 등급별 배당표 & 특수 규칙' : 'PAYTABLE & RULES'}</span>
                  <span className="text-[9px] text-stone-400">
                    {isKo ? '가로3·세로3·대각선2 (총 8라인)' : '8 Paylines Active'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {COMMERCIAL_SLOT_SYMBOLS.map((s) => (
                    <div
                      key={s.key}
                      className="p-1.5 bg-stone-900/90 border border-stone-800 rounded-sm flex items-center gap-1.5"
                    >
                      <img
                        src={getAssetUrl(s.image)}
                        alt={s.nameEn}
                        className="w-8 h-8 rounded-xs object-cover border border-white/20 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <span className={cn('text-[8px] px-1 rounded-xs inline-block', s.badgeClass)}>
                          {s.rarity}
                        </span>
                        <div className="text-[9px] font-bold text-stone-200 truncate">
                          {isKo ? s.nameKo.split(' ')[0] : s.nameEn.split(' ')[0]}
                        </div>
                        <div className="text-[10px] font-black text-yellow-300">
                          x{s.payoutMultiplier}배
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[9px] text-stone-300 leading-relaxed">
                  {isKo
                    ? '• [WILD 황금 카단]은 모든 캐릭터를 대체하여 3매치 라인을 완성합니다!\n• 라인이 안 맞아도 9칸 중 같은 캐릭터 3개 이상 등장 시 스캐터 보너스 지급!'
                    : '• [WILD Kadan] substitutes for all symbols! 3+ matching anywhere pays Scatter Bonus!'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 🎰 메인 3x3 릴 슬롯 머신 스테이지 */}
          <div className="relative p-2.5 bg-gradient-to-b from-[#1a1528] via-[#0f0c18] to-[#1a1528] border-2 border-amber-500/70 rounded-sm shadow-[inset_0_0_25px_rgba(0,0,0,0.9)]">
            {/* 좌/우측 8개 라인 마커 핍(Pip) 장식 */}
            <div className="absolute left-0.5 top-1/2 -translate-y-1/2 flex flex-col gap-9 pointer-events-none z-20">
              <span className="w-1.5 h-3 bg-amber-400 rounded-xs shadow-xs" />
              <span className="w-1.5 h-3 bg-rose-500 rounded-xs shadow-xs" />
              <span className="w-1.5 h-3 bg-sky-400 rounded-xs shadow-xs" />
            </div>
            <div className="absolute right-0.5 top-1/2 -translate-y-1/2 flex flex-col gap-9 pointer-events-none z-20">
              <span className="w-1.5 h-3 bg-amber-400 rounded-xs shadow-xs" />
              <span className="w-1.5 h-3 bg-rose-500 rounded-xs shadow-xs" />
              <span className="w-1.5 h-3 bg-sky-400 rounded-xs shadow-xs" />
            </div>

            {/* 3개 릴 컬럼 (각 컬럼 안에 3개 행 = 총 9구 슬롯) */}
            <div className="relative grid grid-cols-3 gap-2">
              {[0, 1, 2].map((colIdx) => {
                const state = colState[colIdx];
                const isColSpinning = state === 'spinning';
                const isColBouncing = state === 'bouncing';
                const isColTension = colIdx === 2 && tensionCol2 && isColSpinning;

                // 해당 열에 속한 3개의 셀 인덱스: [colIdx, colIdx+3, colIdx+6]
                const colCellIndices = [colIdx, colIdx + 3, colIdx + 6];

                return (
                  <div
                    key={colIdx}
                    className={cn(
                      'relative rounded-sm p-1 bg-[#09070e] border overflow-hidden transition-all',
                      isColTension
                        ? 'border-yellow-300 shadow-[0_0_25px_rgba(250,204,21,0.85)] ring-2 ring-amber-400'
                        : 'border-stone-800'
                    )}
                  >
                    {/* 3열 쪼기(Suspense) 불꽃 스포트라이트 */}
                    {isColTension && (
                      <div className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-b from-yellow-400/25 via-transparent to-amber-500/25 animate-pulse flex items-start justify-center pt-1">
                        <span className="px-1.5 py-0.5 text-[8px] font-black bg-yellow-400 text-black rounded-xs shadow-md">
                          CHANCE!!
                        </span>
                      </div>
                    )}

                    <motion.div
                      animate={
                        isColSpinning
                          ? { y: ['-18%', '18%'] }
                          : isColBouncing
                          ? { y: [14, -6, 0] }
                          : { y: 0 }
                      }
                      transition={
                        isColSpinning
                          ? { repeat: Infinity, duration: isTurbo ? 0.09 : 0.13, ease: 'linear' }
                          : { duration: 0.22, ease: 'easeOut' }
                      }
                      className="flex flex-col gap-2"
                    >
                      {colCellIndices.map((cellIndex) => {
                        // 회전 중에는 stripTick을 이용해 심볼이 실시간으로 계속 바뀌며 내려가는 착시 구현
                        const displaySym = isColSpinning
                          ? COMMERCIAL_SLOT_SYMBOLS[
                              (stripTick + cellIndex * 2 + colIdx) %
                                COMMERCIAL_SLOT_SYMBOLS.length
                            ]
                          : grid[cellIndex];

                        const isHit = !isSpinning && winningCells.has(cellIndex);

                        return (
                          <motion.div
                            key={cellIndex}
                            animate={
                              isHit
                                ? {
                                    scale: [1, 1.07, 1],
                                  }
                                : {}
                            }
                            transition={
                              isHit ? { repeat: Infinity, duration: 0.75 } : {}
                            }
                            className={cn(
                              'relative aspect-square rounded-sm border-2 bg-gradient-to-b p-1 flex flex-col items-center justify-between overflow-hidden transition-all',
                              displaySym.frameClass,
                              isColSpinning && 'blur-[0.7px] opacity-90',
                              isHit &&
                                'ring-2 ring-white shadow-[0_0_20px_rgba(250,204,21,0.9)] z-10'
                            )}
                          >
                            {/* 배경 광원 효과 */}
                            <div
                              className="absolute inset-0 opacity-30 pointer-events-none"
                              style={{
                                background: `radial-gradient(circle at 50% 45%, ${displaySym.accentHex}, transparent 75%)`,
                              }}
                            />

                            {/* 상단 등급 배지 */}
                            <div className="relative z-10 w-full flex items-center justify-between">
                              <span
                                className={cn(
                                  'text-[8px] px-1 py-0.2 rounded-xs leading-tight tracking-tighter shadow-xs',
                                  displaySym.badgeClass
                                )}
                              >
                                {displaySym.rarity}
                              </span>
                              {isHit && (
                                <span className="text-[8px] font-black bg-rose-600 text-white px-1 rounded-xs animate-bounce">
                                  WIN
                                </span>
                              )}
                            </div>

                            {/* 고화질 캐릭터 포트레이트 이미지 */}
                            <div className="relative z-10 w-13 h-13 sm:w-15 sm:h-15 rounded-xs overflow-hidden border border-white/30 bg-black/50 shadow-inner flex items-center justify-center my-0.5">
                              <img
                                src={getAssetUrl(displaySym.image)}
                                alt={displaySym.nameEn}
                                className="w-full h-full object-cover scale-105"
                                draggable={false}
                              />
                            </div>

                            {/* 하단 캐릭터 이름 & 배수 */}
                            <div className="relative z-10 w-full flex items-center justify-between px-0.5 bg-black/55 rounded-xs">
                              <span className="text-[9px] font-black text-white truncate">
                                {isKo
                                  ? displaySym.nameKo.split(' ')[0]
                                  : displaySym.nameEn.split(' ')[0]}
                              </span>
                              <span className="text-[8px] font-black text-yellow-300 shrink-0">
                                x{displaySym.payoutMultiplier}
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  </div>
                );
              })}

              {/* 8개 페이라인 당첨 시 SVG 네온 레이저 빔 오버레이 */}
              {!isSpinning && hitLines.length > 0 && (
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  className="pointer-events-none absolute inset-0 w-full h-full z-20"
                >
                  {hitLines.map((hit) => (
                    <g key={hit.payline.id}>
                      {/* 외곽 네온 글로우 선 */}
                      <motion.line
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: [0.5, 1, 0.5] }}
                        transition={{
                          pathLength: { duration: 0.25 },
                          opacity: { repeat: Infinity, duration: 0.8 },
                        }}
                        x1={hit.payline.x1}
                        y1={hit.payline.y1}
                        x2={hit.payline.x2}
                        y2={hit.payline.y2}
                        stroke={hit.payline.color}
                        strokeWidth="4.2"
                        strokeLinecap="round"
                      />
                      {/* 중심 코어 화이트 레이저 */}
                      <motion.line
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.25 }}
                        x1={hit.payline.x1}
                        y1={hit.payline.y1}
                        x2={hit.payline.x2}
                        y2={hit.payline.y2}
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </g>
                  ))}
                </svg>
              )}
            </div>

            {/* MEGA / BIG WIN 풀스크린 축하 배너 오버레이 */}
            <AnimatePresence>
              {bigWinOverlay && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setBigWinOverlay(null)}
                  className="absolute inset-0 z-30 bg-black/90 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center cursor-pointer"
                >
                  <motion.div
                    animate={{ scale: [1, 1.12, 1], rotate: [-2, 2, -2] }}
                    transition={{ repeat: Infinity, duration: 0.9 }}
                    className="relative w-20 h-20 rounded-sm border-2 border-yellow-300 overflow-hidden shadow-[0_0_30px_rgba(250,204,21,0.8)] mb-2"
                  >
                    <img
                      src={getAssetUrl(bigWinOverlay.hero.image)}
                      alt={bigWinOverlay.hero.nameEn}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                  <span className="px-2 py-0.5 text-[10px] font-black bg-gradient-to-r from-yellow-300 to-amber-500 text-black rounded-xs">
                    {bigWinOverlay.title}
                  </span>
                  <p className="text-xs font-bold text-stone-200 mt-1">
                    {bigWinOverlay.subtitle}
                  </p>
                  <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-yellow-300 to-amber-500 my-1">
                    +{bigWinOverlay.amount.toLocaleString()} SNS
                  </div>
                  <span className="text-[10px] text-stone-400 underline mt-1">
                    {isKo ? '화면을 탭하여 닫기' : 'Tap anywhere to continue'}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 당첨 라인 상세 내역 티커 */}
          <div className="min-h-[34px] px-3 py-1.5 bg-[#14121d] border border-stone-800 rounded-sm flex items-center justify-center text-center">
            {hitLines.length > 0 ? (
              <div className="text-[11px] font-black text-amber-300 truncate">
                🎉{' '}
                {hitLines
                  .map(
                    (h) =>
                      `${isKo ? h.payline.nameKo : h.payline.nameEn} [${
                        h.matchedSymbol.rarity
                      }] (+${h.payout.toLocaleString()})`
                  )
                  .join(' · ')}
              </div>
            ) : scatterBonusText ? (
              <div className="text-[11px] font-black text-cyan-300 truncate">
                {scatterBonusText}
              </div>
            ) : (
              <span className="text-[11px] text-stone-400">
                {isSpinning
                  ? isKo
                    ? '🎰 행운의 9구 릴이 회전하고 있습니다...'
                    : '🎰 Spinning reels...'
                  : isKo
                  ? '가로·세로·대각선 3개 일치 시 등급 배당 즉시 지급!'
                  : 'Match 3 on any of 8 lines or 3+ Scatter anywhere!'}
              </span>
            )}
          </div>

          {/* 하단 컨트롤 데크: 베팅 배율 + 터보 + 오토 + 스핀 레버 */}
          <div className="space-y-2 pt-0.5">
            <div className="flex items-center justify-between gap-1.5">
              {/* 베팅액 선택 */}
              <div className="flex items-center gap-1 flex-1">
                {BET_OPTIONS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    disabled={isSpinning || isFeverActive}
                    onClick={() => {
                      triggerHaptic('light');
                      setBetAmount(amt);
                    }}
                    className={cn(
                      'flex-1 py-1.5 text-[11px] font-black rounded-sm border transition-all',
                      betAmount === amt
                        ? 'bg-amber-400 text-slate-950 border-yellow-200 shadow-sm'
                        : 'bg-[#181522] text-stone-400 border-stone-800 hover:text-white'
                    )}
                  >
                    {amt}
                  </button>
                ))}
              </div>

              {/* 터보 모드 토글 */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setIsTurbo(!isTurbo);
                }}
                className={cn(
                  'px-2.5 py-1.5 text-[11px] font-black rounded-sm border flex items-center gap-1 transition-all',
                  isTurbo
                    ? 'bg-cyan-400 text-slate-950 border-cyan-200'
                    : 'bg-[#181522] text-stone-400 border-stone-800'
                )}
                title="고속 터보 스핀"
              >
                <FastForward size={13} />
                <span>TURBO</span>
              </button>

              {/* 오토스핀 (10회) 토글 */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setAutoSpinCount((c) => (c > 0 ? 0 : 10));
                }}
                className={cn(
                  'px-2.5 py-1.5 text-[11px] font-black rounded-sm border flex items-center gap-1 transition-all',
                  autoSpinCount > 0
                    ? 'bg-rose-600 text-white border-rose-400 animate-pulse'
                    : 'bg-[#181522] text-stone-400 border-stone-800'
                )}
              >
                {autoSpinCount > 0 ? <Pause size={13} /> : <Play size={13} />}
                <span>{autoSpinCount > 0 ? `AUTO (${autoSpinCount})` : 'AUTO'}</span>
              </button>
            </div>

            {/* 메인 스핀 레버 버튼 */}
            <motion.button
              type="button"
              disabled={isSpinning}
              animate={leverPulled ? { scale: 0.96, y: 2 } : { scale: 1, y: 0 }}
              onClick={triggerSpin}
              className={cn(
                'w-full h-13 rounded-sm font-black text-sm tracking-wider uppercase flex items-center justify-center gap-2 border-2 transition-all shadow-lg cursor-pointer',
                isSpinning
                  ? 'bg-stone-800 border-stone-700 text-stone-500 cursor-not-allowed'
                  : isFeverActive
                  ? 'bg-gradient-to-r from-fuchsia-600 via-rose-500 to-amber-500 border-yellow-200 text-white shadow-[0_0_25px_rgba(232,121,249,0.6)]'
                  : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-yellow-400 hover:to-amber-400 border-yellow-200 text-slate-950 shadow-[0_0_20px_rgba(251,191,36,0.35)]'
              )}
            >
              <Zap size={18} className={cn(isSpinning && 'animate-spin')} />
              <span>
                {isSpinning
                  ? isKo
                    ? 'REELS SPINNING...'
                    : 'REELS SPINNING...'
                  : isFeverActive
                  ? isKo
                    ? `🔥 무료 피버 스핀! (2배 배당 · 남은 횟수 ${feverSpinsLeft})`
                    : `🔥 FREE FEVER SPIN! (2X PAY · ${feverSpinsLeft} LEFT)`
                  : isKo
                  ? `🎰 슬롯 스핀 (${betAmount.toLocaleString()} SNS)`
                  : `🎰 SPIN REELS (${betAmount.toLocaleString()} SNS)`}
              </span>
            </motion.button>
          </div>

          {/* 하단 누적 플레이 레코드 */}
          <div className="pt-1 flex items-center justify-between text-[10px] text-stone-500 border-t border-stone-800/80">
            <span>{isKo ? `누적 스핀: ${stats.spins}회` : `Spins: ${stats.spins}`}</span>
            <span>
              {isKo
                ? `총 당첨: ${stats.totalWon.toLocaleString()} SNS`
                : `Total Won: ${stats.totalWon.toLocaleString()}`}
            </span>
            <span>
              {isKo
                ? `최고 기록: ${stats.bestWin.toLocaleString()} SNS`
                : `Best Win: ${stats.bestWin.toLocaleString()}`}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
