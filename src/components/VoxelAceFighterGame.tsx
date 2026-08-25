import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelAceFighterGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface RhythmNote {
  id: number;
  lane: number; // 0, 1, 2, 3
  y: number; // 0 to 100%
  hit: boolean;
  type: 'normal' | 'fever';
}

export const VoxelAceFighterGame: React.FC<VoxelAceFighterGameProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [feverMeter, setFeverMeter] = useState<number>(0);
  const [isFever, setIsFever] = useState<boolean>(false);
  const [songProgress, setSongProgress] = useState<number>(0);
  const [hitFeedback, setHitFeedback] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_cyber_rhythm_blaster') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const gameStateRef = useRef({
    notes: [] as RhythmNote[],
    score: 0,
    combo: 0,
    maxCombo: 0,
    feverMeter: 0,
    isFever: false,
    feverTimer: 0,
    songDuration: 35, // 35 seconds match
    elapsed: 0,
    noteCounter: 0,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    laneFeedback: [0, 0, 0, 0],
  });

  const initGame = useCallback(() => {
    const s = gameStateRef.current;
    s.notes = [];
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.feverMeter = 0;
    s.isFever = false;
    s.feverTimer = 0;
    s.elapsed = 0;
    s.noteCounter = 0;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.laneFeedback = [0, 0, 0, 0];

    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setFeverMeter(0);
    setIsFever(false);
    setSongProgress(0);
    setHitFeedback(null);
    setIsGameOver(false);
    setSettlementReceipt(null);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const handleHitLane = useCallback((laneIndex: number) => {
    const s = gameStateRef.current;
    if (s.isGameOver || s.isPaused) return;

    s.laneFeedback[laneIndex] = 0.25; // Visual flash duration

    // Find closest note in this lane near hit line (80% ~ 95%)
    let targetNote: RhythmNote | null = null;
    let minDistance = 999;

    for (const note of s.notes) {
      if (note.lane === laneIndex && !note.hit) {
        const dist = Math.abs(note.y - 85);
        if (dist < minDistance && note.y >= 65 && note.y <= 100) {
          minDistance = dist;
          targetNote = note;
        }
      }
    }

    if (targetNote) {
      targetNote.hit = true;
      let points = 100;
      let grade = 'PERFECT!';

      if (minDistance < 6) {
        points = 150;
        grade = 'PERFECT!';
      } else if (minDistance < 12) {
        points = 100;
        grade = 'GREAT!';
      } else {
        points = 60;
        grade = 'GOOD!';
      }

      if (s.isFever) points *= 2;

      s.combo += 1;
      if (s.combo > s.maxCombo) s.maxCombo = s.combo;
      s.score += points;

      if (!s.isFever) {
        s.feverMeter = Math.min(100, s.feverMeter + 8);
        if (s.feverMeter >= 100) {
          s.isFever = true;
          s.feverTimer = 6.0;
        }
      }

      setScore(s.score);
      setCombo(s.combo);
      setMaxCombo(s.maxCombo);
      setFeverMeter(s.feverMeter);
      setIsFever(s.isFever);
      setHitFeedback(grade);
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

      setTimeout(() => setHitFeedback(null), 300);
    } else {
      // Miss penalty
      s.combo = 0;
      setCombo(0);
      setHitFeedback('MISS');
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
      setTimeout(() => setHitFeedback(null), 250);
    }
  }, [playSfx]);

  // Direct Screen Touch Handler (Pure Touch - No Virtual D-pad)
  const handleTouchScreen = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const touchX = e.clientX - rect.left;
    const laneWidth = rect.width / 4;
    const laneIndex = Math.min(3, Math.max(0, Math.floor(touchX / laneWidth)));
    handleHitLane(laneIndex);
  };

  // Main Rhythm Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();
    let spawnAccum = 0;

    const loop = (now: number) => {
      animFrameRef.current = requestAnimationFrame(loop);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const s = gameStateRef.current;
      if (s.isPaused || s.isGameOver) return;

      s.elapsed += dt;
      setSongProgress(Math.min(100, (s.elapsed / s.songDuration) * 100));

      // Fever Timer
      if (s.isFever) {
        s.feverTimer -= dt;
        s.feverMeter = Math.max(0, (s.feverTimer / 6.0) * 100);
        setFeverMeter(s.feverMeter);
        if (s.feverTimer <= 0) {
          s.isFever = false;
          s.feverMeter = 0;
          setIsFever(false);
        }
      }

      // Lane feedback decay
      for (let i = 0; i < 4; i++) {
        if (s.laneFeedback[i] > 0) s.laneFeedback[i] -= dt;
      }

      // Spawn Notes
      spawnAccum += dt;
      const spawnInterval = s.isFever ? 0.28 : 0.38;
      if (spawnAccum >= spawnInterval && s.elapsed < s.songDuration - 2) {
        spawnAccum = 0;
        const lane = Math.floor(Math.random() * 4);
        s.notes.push({
          id: s.noteCounter++,
          lane,
          y: 0,
          hit: false,
          type: Math.random() < 0.2 ? 'fever' : 'normal',
        });
      }

      // Move Notes
      const noteSpeed = 65; // % per second
      for (let i = s.notes.length - 1; i >= 0; i--) {
        const note = s.notes[i];
        note.y += noteSpeed * dt;

        if (note.y > 105 && !note.hit) {
          // Missed note
          s.combo = 0;
          setCombo(0);
          s.notes.splice(i, 1);
        } else if (note.y > 110) {
          s.notes.splice(i, 1);
        }
      }

      // Song Finish Check
      if (s.elapsed >= s.songDuration && !s.isGameOver) {
        s.isGameOver = true;
        setIsGameOver(true);
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

        const duration = (Date.now() - s.startTime) / 1000;
        const receipt = calculateAndDepositMissionReward({
          gameId: 'arcade_rhythm_blaster',
          gameTitle: '사이버 리듬 블래스터',
          durationSeconds: duration,
          score: s.score + s.maxCombo * 20,
          difficulty: 'NIGHTMARE',
          isVictory: s.score >= 1800,
        });
        setSettlementReceipt(receipt);
        onReward(receipt.totalSns);
        return;
      }

      // ── Canvas Rendering ──
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Cyber Neon Background
      ctx.fillStyle = s.isFever ? '#180728' : '#080c14';
      ctx.fillRect(0, 0, w, h);

      // Track Lanes (4 columns)
      const laneW = w / 4;
      for (let i = 0; i < 4; i++) {
        const lx = i * laneW;
        ctx.strokeStyle = s.isFever ? 'rgba(217, 70, 239, 0.2)' : 'rgba(56, 189, 248, 0.15)';
        ctx.lineWidth = 1;
        ctx.strokeRect(lx, 0, laneW, h);

        if (s.laneFeedback[i] > 0) {
          ctx.fillStyle = s.isFever ? 'rgba(236, 72, 153, 0.35)' : 'rgba(56, 189, 248, 0.35)';
          ctx.fillRect(lx, 0, laneW, h);
        }
      }

      // Hit Target Line (at 85% height)
      const targetY = h * 0.85;
      ctx.strokeStyle = s.isFever ? '#ec4899' : '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, targetY);
      ctx.lineTo(w, targetY);
      ctx.stroke();

      // Render Target Rings
      for (let i = 0; i < 4; i++) {
        const cx = i * laneW + laneW / 2;
        ctx.strokeStyle = s.isFever ? 'rgba(244, 114, 182, 0.6)' : 'rgba(56, 189, 248, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, targetY, laneW * 0.35, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Render Falling Notes
      s.notes.forEach((note) => {
        if (note.hit) return;
        const nx = note.lane * laneW + laneW / 2;
        const ny = (note.y / 100) * h;
        const radius = laneW * 0.32;

        ctx.fillStyle = note.type === 'fever' || s.isFever ? '#f43f5e' : '#38bdf8';
        ctx.beginPath();
        ctx.arc(nx, ny, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚡', nx, ny);
      });
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isPaused, onReward, playSfx]);

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 4레인 네온 비트 히트' : 'STEP 1: 4-LANE RHYTHM HIT',
      title: isKo ? '화면 레인을 직접 터치하세요' : 'Direct Touch on Screen Lanes',
      description: isKo
        ? '가상 버튼 없이 떨어지는 4개 레인 화면을 손가락으로 직접 터치하여 비트를 연주하세요.'
        : 'Touch the 4 falling lane zones directly on screen with zero virtual buttons.',
      keyPoints: isKo
        ? [
            '화면을 가리는 가상 버튼 0개 (순수 화면 직접 터치)',
            'PERFECT / GREAT 판정 시 고득점 획득',
            '노트 적중 시 콤보 누적 및 피버 게이지 충전'
          ]
        : [
            'Zero virtual buttons: Direct screen tap',
            'PERFECT / GREAT hits yield maximum score',
            'Chain combos to charge Fever Gauge'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 터치 조작' : 'STEP 2: PURE TOUCH',
      title: isKo ? '화면 직접 터치 리듬 액션' : 'Direct Screen Touch Controls',
      description: isKo
        ? '화면의 4개 레인 중 떨어지는 노트의 레인을 손가락으로 직접 탭합니다.'
        : 'Directly tap the 4 track lanes on your mobile screen.',
      keyPoints: isKo
        ? [
            '👆 화면 직접 터치: 레인 위치를 탭하면 즉시 판정',
            '🔥 피버 모드: 게이지 100% 시 2배 득점 팡파레',
            '⚡ 60FPS 부드러운 네온 비트 스트림'
          ]
        : [
            '👆 Direct Touch: Instant hit upon screen lane tap',
            '🔥 Fever Mode: Double points when full',
            '⚡ 60FPS fluid neon beat stream'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '곡 완주 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon song clear.',
      keyPoints: isKo
        ? [
            '완주 즉시 LocalStorage 영구 지갑 입금',
            '최종 점수 및 맥스 콤보 비례 잭팟 보너스',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Max combo and score multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#080c14] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '사이버 리듬 블래스터' : 'Cyber Rhythm Blaster'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '콤보' : 'Combo', value: `${combo}x`, color: combo > 10 ? 'text-pink-400 font-bold' : 'text-cyan-400 font-bold' },
          { label: isKo ? '피버' : 'Fever', value: isFever ? 'FEVER!' : `${feverMeter.toFixed(0)}%`, color: isFever ? 'text-rose-500 font-bold animate-pulse' : 'text-amber-400' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-emerald-400 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Direct Touch Full Screen Rhythm Viewport (No Virtual Buttons) */}
      <div
        ref={containerRef}
        onPointerDown={handleTouchScreen}
        className="flex-1 w-full max-w-md relative overflow-hidden flex items-center justify-center cursor-pointer select-none touch-none"
      >
        <canvas
          ref={canvasRef}
          width={360}
          height={600}
          className="w-full h-full object-fill pointer-events-none"
        />

        {/* Floating Grade Feedback */}
        {hitFeedback && (
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-2xl font-bold tracking-wider text-amber-300 drop-shadow-lg animate-ping">
            {hitFeedback}
          </div>
        )}

        {/* 4 Touch Lane Visual Dividers */}
        <div className="absolute inset-0 grid grid-cols-4 pointer-events-none">
          {[0, 1, 2, 3].map((lane) => (
            <div
              key={lane}
              className="h-full border-r border-white/5 flex flex-col justify-end pb-6 items-center text-white/30 text-xs font-bold"
            >
              <span>TAP</span>
            </div>
          ))}
        </div>
      </div>

      {/* Song Progress Bar */}
      <div className="w-full h-1.5 bg-black/40">
        <div
          className="h-full bg-cyan-400 transition-all duration-100"
          style={{ width: `${songProgress}%` }}
        />
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_rhythm_blaster"
          gameTitle={isKo ? '사이버 리듬 블래스터: 네온 비트 액션' : 'Cyber Rhythm Blaster: Neon Beat'}
          customSteps={tutorialSteps}
          language={(language as Language) || 'ko'}
          onStartGame={() => setShowTutorial(false)}
          onClose={() => setShowTutorial(false)}
        />
      )}

      {/* Victory Reward Settlement Modal */}
      {isGameOver && settlementReceipt && (
        <VictoryRewardModal
          receipt={settlementReceipt}
          language={(language as Language) || 'ko'}
          onPlayAgain={initGame}
          onExit={onExit}
        />
      )}
    </div>
  );
};
export default VoxelAceFighterGame;
