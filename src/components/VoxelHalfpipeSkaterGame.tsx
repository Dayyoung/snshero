import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { SportsMissionTutorial } from './SportsMissionTutorial';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelHalfpipeSkaterGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelHalfpipeSkaterGame: React.FC<VoxelHalfpipeSkaterGameProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const isKo = language === 'ko';
  const mountRef = useRef<HTMLDivElement>(null);

  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_voxel_halfpipe_skater') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const targetScore = 2000;
  const [combo, setCombo] = useState<number>(0);
  const [currentAirHeight, setCurrentAirHeight] = useState<number>(0);
  const [lastTrickName, setLastTrickName] = useState<string>('');
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    halfpipePos: 0,
    halfpipeVel: 2.2,
    isAirborne: false,
    airY: 0,
    airVelY: 0,
    score: 0,
    combo: 0,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    skaterGroup: null as THREE.Group | null
  });

  const handlePump = () => {
    const s = stateRef.current;
    if (s.isAirborne || s.isGameOver || s.isVictory || s.isPaused) return;
    s.halfpipeVel = Math.min(4.5, s.halfpipeVel + 0.6);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  const handleTrick = (trickName: string, points: number) => {
    const s = stateRef.current;
    if (!s.isAirborne || s.isGameOver || s.isVictory || s.isPaused) return;

    s.combo += 1;
    const gained = points * s.combo;
    s.score += gained;
    setScore(s.score);
    setCombo(s.combo);
    setLastTrickName(`${trickName} (+${gained}P)`);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

    if (s.score >= targetScore && !s.isGameOver) {
      s.isVictory = true;
      s.isGameOver = true;
      setIsGameOver(true);
      const duration = (Date.now() - s.startTime) / 1000;
      const receipt = calculateAndDepositMissionReward({
        gameId: 'voxel_halfpipe_skater',
        gameTitle: '복셀 하프파이프 스케이터',
        durationSeconds: duration,
        score: s.score + 1000,
        difficulty: 'HARD',
        isVictory: true
      });
      setSettlementReceipt(receipt);
      onReward(receipt.totalSns);
    }
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 8, 18);
    camera.lookAt(0, 4, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const spotLight = new THREE.SpotLight(0xf59e0b, 2.5);
    spotLight.position.set(0, 20, 10);
    scene.add(spotLight);

    // Halfpipe Ramp
    const pipeRadius = 8;
    const pipeWidth = 16;
    const pipeGeo = new THREE.CylinderGeometry(pipeRadius, pipeRadius, pipeWidth, 32, 1, true, Math.PI, Math.PI);
    const pipeMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.6,
      side: THREE.BackSide
    });
    const halfpipe = new THREE.Mesh(pipeGeo, pipeMat);
    halfpipe.rotation.z = Math.PI / 2;
    halfpipe.position.set(0, pipeRadius, 0);
    scene.add(halfpipe);

    // Skater Group
    const skaterGroup = new THREE.Group();
    const sBoard = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.15, 2.2),
      new THREE.MeshStandardMaterial({ color: 0xef4444 })
    );
    sBoard.position.y = 0.1;
    skaterGroup.add(sBoard);

    const sBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 1.6, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x3b82f6 })
    );
    sBody.position.y = 0.9;
    skaterGroup.add(sBody);

    scene.add(skaterGroup);
    stateRef.current.skaterGroup = skaterGroup;

    let animId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;

      if (!s.isAirborne) {
        // Pendulum movement inside pipe
        s.halfpipePos += s.halfpipeVel * dt;

        if (s.halfpipePos > 1.0) {
          s.halfpipePos = 1.0;
          s.isAirborne = true;
          s.airVelY = s.halfpipeVel * 4;
          s.airY = 8;
        } else if (s.halfpipePos < -1.0) {
          s.halfpipePos = -1.0;
          s.isAirborne = true;
          s.airVelY = s.halfpipeVel * 4;
          s.airY = 8;
        }

        // Skater position on pipe curve
        const angle = s.halfpipePos * (Math.PI / 2);
        const px = Math.sin(angle) * pipeRadius;
        const py = pipeRadius - Math.cos(angle) * pipeRadius;

        skaterGroup.position.set(0, py + 0.2, px);
        skaterGroup.rotation.x = -angle;
      } else {
        // Air Physics
        s.airVelY -= 9.8 * 2.0 * dt;
        s.airY += s.airVelY * dt;
        setCurrentAirHeight(Math.max(0, Math.round(s.airY - 8)));

        skaterGroup.position.y = s.airY;

        // Landing
        if (s.airY <= 8 && s.airVelY < 0) {
          s.isAirborne = false;
          s.halfpipeVel = -Math.sign(s.halfpipePos) * Math.max(1.8, Math.abs(s.airVelY * 0.25));
        }
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [lowSpecMode]);

  const handleRestart = () => {
    const s = stateRef.current;
    s.halfpipePos = 0;
    s.halfpipeVel = 2.2;
    s.isAirborne = false;
    s.airY = 0;
    s.airVelY = 0;
    s.score = 0;
    s.combo = 0;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    setScore(0);
    setCombo(0);
    setLastTrickName('');
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col font-mono select-none overflow-hidden">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '복셀 하프파이프 스케이터' : 'Voxel Halfpipe Skater'}
        language={language}
        telemetries={[
          { label: isKo ? '점수' : 'Score', value: `${score}/${targetScore}P`, color: 'text-amber-300' },
          { label: isKo ? '콤보' : 'Combo', value: `✨ x${combo}`, color: 'text-cyan-300' },
          { label: isKo ? '에어높이' : 'Air', value: `${currentAirHeight}m`, color: 'text-emerald-300' },
          { label: isKo ? '트릭' : 'Trick', value: lastTrickName || '-', color: 'text-pink-300' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => {
          setIsPaused(prev => !prev);
          stateRef.current.isPaused = !isPaused;
        }}
        isPaused={isPaused}
      />

      {/* Screen Gesture Touch Overlay */}
      {!isGameOver && !isPaused && !showTutorial && (
        <div
          className="absolute inset-0 z-10 select-none touch-none cursor-crosshair"
          style={{ touchAction: 'none' }}
          onPointerDown={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const startX = e.clientX - rect.left;
            const startY = e.clientY - rect.top;
            let moved = false;

            const onMove = (moveEvt: PointerEvent) => {
              const curX = moveEvt.clientX - rect.left;
              const curY = moveEvt.clientY - rect.top;
              const dx = curX - startX;
              const dy = curY - startY;

              if (Math.abs(dx) > 15 || Math.abs(dy) > 15) {
                moved = true;
                if (Math.abs(dx) > Math.abs(dy)) {
                  handleTrick(dx > 0 ? '360 SPIN' : 'KICKFLIP', 450);
                } else {
                  handleTrick(dy > 0 ? 'HANDPLANT' : 'RODEO FLIP', 650);
                }
                window.removeEventListener('pointermove', onMove);
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);

              if (!moved) {
                // Tap: Pump speed or Air trick
                if (!stateRef.current.isAirborne) {
                  handlePump();
                } else {
                  handleTrick('KICKFLIP', 350);
                }
              }
            };

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
            window.addEventListener('pointercancel', onUp);
          }}
        />
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/75 border border-amber-500/30 rounded-full text-[10px] text-amber-300 font-mono backdrop-blur-xs">
          {isKo ? '바닥에서 탭: 펌핑 가속 | 공중에서 스와이프: 에어 트릭 (버튼 없음)' : 'Tap on pipe: Pump speed | Swipe in air: Air tricks (No Buttons)'}
        </div>
      </div>

      {/* 3-Step Interactive Sports Tutorial Modal */}
      {showTutorial && (
        <SportsMissionTutorial
          gameId="voxel_halfpipe_skater"
          gameTitle={isKo ? '3D 복셀 하프파이프 스케이터: 익스트림 에어 트릭' : 'Voxel Halfpipe Skater: Extreme Air'}
          sportType="skate"
          language={language}
          onStartGame={() => setShowTutorial(false)}
          onClose={() => setShowTutorial(false)}
        />
      )}

      {/* Standardized Victory & Reward Settlement Modal */}
      {isGameOver && settlementReceipt && (
        <VictoryRewardModal
          receipt={settlementReceipt}
          language={language}
          onPlayAgain={handleRestart}
          onExit={onExit}
        />
      )}
    </div>
  );
};
