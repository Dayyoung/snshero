import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { SportsMissionTutorial } from './SportsMissionTutorial';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelDojoBalanceGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelDojoBalanceGame: React.FC<VoxelDojoBalanceGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_dojo_balance') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const targetStreak = 3;
  const [balance, setBalance] = useState<number>(50);
  const [enemyHp, setEnemyHp] = useState<number>(100);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    balance: 50,
    balanceDrift: 0,
    playerHp: 100,
    enemyHp: 100,
    enemyAttackTimer: 1.5,
    isPlayerAttacking: false,
    isPlayerGuarding: false,
    isEnemyAttacking: false,
    score: 0,
    streak: 0,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    playerGroup: null as THREE.Group | null,
    playerStaff: null as THREE.Mesh | null,
    enemyGroup: null as THREE.Group | null,
    enemyStaff: null as THREE.Mesh | null
  });

  const handlePlayerAttack = (isHeavy: boolean = false) => {
    const s = stateRef.current;
    if (s.isPlayerAttacking || s.isGameOver || s.isPaused) return;

    s.isPlayerAttacking = true;
    const dmg = isHeavy ? 35 : 18;
    playSfx?.(isHeavy ? 'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3' : 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

    setTimeout(() => {
      s.isPlayerAttacking = false;
      s.enemyHp = Math.max(0, s.enemyHp - dmg);
      setEnemyHp(s.enemyHp);

      if (s.enemyHp <= 0) {
        s.streak += 1;
        s.score += 500;
        setStreak(s.streak);
        setScore(s.score);
        s.enemyHp = 100;
        setEnemyHp(100);

        if (s.streak >= targetStreak) {
          s.isGameOver = true;
          setIsGameOver(true);
          const duration = (Date.now() - s.startTime) / 1000;
          const receipt = calculateAndDepositMissionReward({
            gameId: 'voxel_dojo_balance',
            gameTitle: '복셀 도장 밸런스 결투',
            durationSeconds: duration,
            score: s.score + 1000,
            difficulty: 'HARD',
            isVictory: true
          });
          setSettlementReceipt(receipt);
          onReward(receipt.totalSns);
        }
      }
    }, 200);
  };

  const handleBalanceAdjust = (dir: number) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;
    s.balance = Math.max(0, Math.min(100, s.balance + dir * 8));
    setBalance(Math.round(s.balance));
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x18181b);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 3.5, 7.5);
    camera.lookAt(0, 1.2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    container.appendChild(renderer.domElement);

    // Warm Sunset Light
    const ambientLight = new THREE.AmbientLight(0xfef08a, 0.8);
    scene.add(ambientLight);

    const sun = new THREE.DirectionalLight(0xf97316, 2.2);
    sun.position.set(5, 12, 6);
    scene.add(sun);

    // Waterfall Mist Pool Below
    const waterGeo = new THREE.PlaneGeometry(30, 30);
    const waterMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1 });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(0, -3, 0);
    scene.add(water);

    // High Narrow Wooden Log Bridge
    const logGeo = new THREE.CylinderGeometry(0.5, 0.5, 12, 16);
    const logMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    const log = new THREE.Mesh(logGeo, logMat);
    log.rotation.z = Math.PI / 2;
    log.position.set(0, 0, 0);
    scene.add(log);

    // Player Ninja
    const playerGroup = new THREE.Group();
    const pBody = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.3, 0.6), new THREE.MeshStandardMaterial({ color: 0x0284c7 }));
    pBody.position.y = 1.0;
    playerGroup.add(pBody);

    const staffGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.4, 8);
    const staffMat = new THREE.MeshStandardMaterial({ color: 0xd97706 });
    const pStaff = new THREE.Mesh(staffGeo, staffMat);
    pStaff.rotation.z = Math.PI / 3;
    pStaff.position.set(0.4, 1.0, 0.3);
    playerGroup.add(pStaff);

    playerGroup.position.set(-1.8, 0, 0);
    scene.add(playerGroup);
    stateRef.current.playerGroup = playerGroup;
    stateRef.current.playerStaff = pStaff;

    // Enemy Ninja
    const enemyGroup = new THREE.Group();
    const eBody = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.3, 0.6), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
    eBody.position.y = 1.0;
    enemyGroup.add(eBody);

    const eStaff = new THREE.Mesh(staffGeo, staffMat);
    eStaff.rotation.z = -Math.PI / 3;
    eStaff.position.set(-0.4, 1.0, 0.3);
    enemyGroup.add(eStaff);

    enemyGroup.position.set(1.8, 0, 0);
    scene.add(enemyGroup);
    stateRef.current.enemyGroup = enemyGroup;
    stateRef.current.enemyStaff = eStaff;

    let animId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;

      // Natural Balance Drift
      s.balanceDrift += (Math.random() - 0.5) * 15 * dt;
      s.balance = THREE.MathUtils.clamp(s.balance + s.balanceDrift * dt, 0, 100);
      setBalance(Math.round(s.balance));

      if (playerGroup) {
        const tilt = (s.balance - 50) * 0.015;
        playerGroup.rotation.z = tilt;
      }

      // Check Fall from bridge
      if (s.balance <= 5 || s.balance >= 95) {
        s.isGameOver = true;
        setIsGameOver(true);
        const duration = (Date.now() - s.startTime) / 1000;
        const receipt = calculateAndDepositMissionReward({
          gameId: 'voxel_dojo_balance',
          gameTitle: '복셀 도장 밸런스 결투',
          durationSeconds: duration,
          score: s.score,
          difficulty: 'HARD',
          isVictory: false
        });
        setSettlementReceipt(receipt);
        onReward(receipt.totalSns);
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
    s.balance = 50;
    s.balanceDrift = 0;
    s.score = 0;
    s.streak = 0;
    s.enemyHp = 100;
    s.isGameOver = false;
    s.startTime = Date.now();
    setBalance(50);
    setScore(0);
    setStreak(0);
    setEnemyHp(100);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col font-mono select-none overflow-hidden">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '복셀 도장 밸런스 결투' : 'Voxel Dojo Balance'}
        language={language}
        hp={{ current: enemyHp, max: 100 }}
        telemetries={[
          { label: isKo ? '밸런스' : 'Balance', value: `${balance}%`, color: Math.abs(balance - 50) > 25 ? 'text-rose-400' : 'text-emerald-300' },
          { label: isKo ? '격파' : 'Streak', value: `${streak}/${targetStreak}KO`, color: 'text-amber-300' }
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
            let moved = false;

            const onMove = (moveEvt: PointerEvent) => {
              const curX = moveEvt.clientX - rect.left;
              const dx = curX - startX;

              if (Math.abs(dx) > 12) {
                moved = true;
                handleBalanceAdjust(dx > 0 ? 1 : -1);
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);

              if (!moved) {
                // Tap: Strike
                handlePlayerAttack(false);
              }
            };

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
            window.addEventListener('pointercancel', onUp);
          }}
          onDoubleClick={() => handlePlayerAttack(true)}
        />
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/75 border border-amber-500/30 rounded-full text-[10px] text-amber-300 font-mono backdrop-blur-xs">
          {isKo ? '좌우 스와이프: 균형 복구 | 탭: 빠른 타격 | 더블탭: 강타 (버튼 없음)' : 'Swipe L/R: Balance | Tap: Strike | Double Tap: Heavy (No Buttons)'}
        </div>
      </div>

      {/* 3-Step Interactive Sports Tutorial Modal */}
      {showTutorial && (
        <SportsMissionTutorial
          gameId="voxel_dojo_balance"
          gameTitle={isKo ? '3D 복셀 도장 밸런스 결투: 외나무다리 승부' : 'Voxel Dojo Balance: Bridge Duel'}
          sportType="martial_arts"
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
