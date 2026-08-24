import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { SportsMissionTutorial } from './SportsMissionTutorial';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelMightyBoxingGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelMightyBoxingGame: React.FC<VoxelMightyBoxingGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_mighty_boxing') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [playerHp, setPlayerHp] = useState<number>(100);
  const [enemyHp, setEnemyHp] = useState<number>(100);
  const [enemyDowns, setEnemyDowns] = useState<number>(0);
  const maxDowns = 3;
  const [combo, setCombo] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    playerHp: 100,
    enemyHp: 100,
    enemyDowns: 0,
    playerWeave: 0,
    weaveTimer: 0,
    enemyAttackTimer: 1.5,
    enemyIsAttacking: false,
    combo: 0,
    score: 0,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    enemyMesh: null as THREE.Group | null
  });

  const handlePunch = (isUppercut: boolean) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isVictory || s.isPaused) return;

    const baseDmg = isUppercut ? 28 : 14;
    const isCounter = s.enemyIsAttacking;
    const finalDmg = isCounter ? baseDmg * 2.0 : baseDmg;

    s.enemyHp = Math.max(0, s.enemyHp - finalDmg);
    s.combo += 1;
    s.score += Math.round(finalDmg * 20);
    setEnemyHp(Math.round(s.enemyHp));
    setCombo(s.combo);
    setScore(s.score);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

    if (s.enemyHp <= 0) {
      s.enemyDowns += 1;
      setEnemyDowns(s.enemyDowns);
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

      if (s.enemyDowns >= maxDowns) {
        s.isVictory = true;
        s.isGameOver = true;
        setIsGameOver(true);
        const duration = (Date.now() - s.startTime) / 1000;
        const receipt = calculateAndDepositMissionReward({
          gameId: 'voxel_mighty_boxing',
          gameTitle: '복셀 마이티 복싱',
          durationSeconds: duration,
          score: s.score + 2500,
          difficulty: 'NIGHTMARE',
          isVictory: true
        });
        setSettlementReceipt(receipt);
        onReward(receipt.totalSns);
      } else {
        s.enemyHp = 100;
        setEnemyHp(100);
      }
    }
  };

  const handleWeave = (dir: -1 | 1) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isVictory || s.isPaused) return;
    s.playerWeave = dir;
    s.weaveTimer = 0.5;
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x110d1c);
    scene.fog = new THREE.Fog(0x110d1c, 10, 35);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 1.6, 2.5);
    camera.lookAt(0, 1.4, -0.5);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x332244, 0.9);
    scene.add(hemiLight);

    const spotLight = new THREE.SpotLight(0xffddaa, 2.5);
    spotLight.position.set(0, 8, 1);
    scene.add(spotLight);

    // Ring Floor
    const ring = new THREE.Mesh(
      new THREE.BoxGeometry(8, 0.4, 8),
      new THREE.MeshStandardMaterial({ color: 0x1f2430, roughness: 0.7 })
    );
    ring.position.y = -0.2;
    scene.add(ring);

    // Opponent Minotaur Boxer
    const enemyGroup = new THREE.Group();
    const eBody = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.1, 0.5), new THREE.MeshStandardMaterial({ color: 0x8b3a2b }));
    eBody.position.y = 1.3;
    enemyGroup.add(eBody);

    const eHead = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), new THREE.MeshStandardMaterial({ color: 0x5a2318 }));
    eHead.position.y = 2.0;
    enemyGroup.add(eHead);

    enemyGroup.position.set(0, 0, -1.0);
    scene.add(enemyGroup);
    stateRef.current.enemyMesh = enemyGroup;

    let animId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;

      // Weave cooldown
      if (s.weaveTimer > 0) {
        s.weaveTimer -= dt;
        if (s.weaveTimer <= 0) s.playerWeave = 0;
      }

      // Camera weave
      camera.position.x = s.playerWeave * 0.8;

      // Enemy AI Attack cycle
      s.enemyAttackTimer -= dt;
      if (s.enemyAttackTimer <= 0.4 && s.enemyAttackTimer > 0) {
        s.enemyIsAttacking = true;
        if (enemyGroup) enemyGroup.position.z = -0.6;
      } else if (s.enemyAttackTimer <= 0) {
        // Attack lands
        s.enemyAttackTimer = 2.0 + Math.random() * 0.8;
        s.enemyIsAttacking = false;
        if (enemyGroup) enemyGroup.position.z = -1.0;

        if (s.playerWeave === 0) {
          // Player hit
          s.playerHp = Math.max(0, s.playerHp - 16);
          s.combo = 0;
          setPlayerHp(s.playerHp);
          setCombo(0);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

          if (s.playerHp <= 0 && !s.isGameOver) {
            s.isGameOver = true;
            setIsGameOver(true);
            const duration = (Date.now() - s.startTime) / 1000;
            const receipt = calculateAndDepositMissionReward({
              gameId: 'voxel_mighty_boxing',
              gameTitle: '복셀 마이티 복싱',
              durationSeconds: duration,
              score: s.score,
              difficulty: 'NIGHTMARE',
              isVictory: false
            });
            setSettlementReceipt(receipt);
            onReward(receipt.totalSns);
          }
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
    s.playerHp = 100;
    s.enemyHp = 100;
    s.enemyDowns = 0;
    s.playerWeave = 0;
    s.combo = 0;
    s.score = 0;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    setPlayerHp(100);
    setEnemyHp(100);
    setEnemyDowns(0);
    setCombo(0);
    setScore(0);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col font-mono select-none overflow-hidden">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '복셀 마이티 복싱' : 'Voxel Mighty Boxing'}
        language={language}
        hp={{ current: playerHp, max: 100 }}
        telemetries={[
          { label: isKo ? '보스HP' : 'Boss', value: `${enemyHp}%`, color: 'text-rose-400' },
          { label: isKo ? '다운' : 'Downs', value: `${enemyDowns}/${maxDowns} KO`, color: 'text-amber-300' },
          { label: isKo ? '콤보' : 'Combo', value: `x${combo}`, color: combo > 1 ? 'text-cyan-300 font-bold' : 'text-slate-400' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-yellow-300' }
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

              if (Math.abs(dx) > 15 || dy < -20) {
                moved = true;
                if (dy < -20) {
                  // Upward Swipe: Counter Uppercut
                  handlePunch(true);
                } else if (dx < -15) {
                  // Left Swipe: Weave Left
                  handleWeave(-1);
                } else if (dx > 15) {
                  // Right Swipe: Weave Right
                  handleWeave(1);
                }
                window.removeEventListener('pointermove', onMove);
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);

              if (!moved) {
                // Quick Tap: Straight Punch
                handlePunch(false);
              }
            };

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
            window.addEventListener('pointercancel', onUp);
          }}
          onDoubleClick={() => handlePunch(true)}
        />
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/75 border border-red-500/30 rounded-full text-[10px] text-red-300 font-mono backdrop-blur-xs">
          {isKo ? '탭: 잽/스트레이트 | 위로/더블탭: 카운터 어퍼컷 | 좌우 스와이프: 위빙 회피 (버튼 없음)' : 'Tap: Straight | Up/Double Tap: Uppercut | Swipe L/R: Weave Dodge (No Buttons)'}
        </div>
      </div>

      {/* 3-Step Interactive Sports Tutorial Modal */}
      {showTutorial && (
        <SportsMissionTutorial
          gameId="voxel_mighty_boxing"
          gameTitle={isKo ? '3D 복셀 마이티 복싱: 링 위의 혈투' : 'Voxel Mighty Boxing: Ring Bout'}
          sportType="boxing"
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
