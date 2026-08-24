import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelDragonSlayerGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelDragonSlayerGame: React.FC<VoxelDragonSlayerGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_dragon_slayer') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [playerHp, setPlayerHp] = useState<number>(100);
  const [dragonHp, setDragonHp] = useState<number>(200);
  const [isGroggy, setIsGroggy] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    pPos: new THREE.Vector3(0, 0, 10),
    pVel: new THREE.Vector3(0, 0, 0),
    isAttacking: false,
    attackCooldown: 0,
    isRolling: false,
    rollTime: 0,
    dragonHp: 200,
    headHp: 50,
    wingHp: 50,
    groggyTimer: 0,
    dragonAttackTimer: 90,
    playerHp: 100,
    score: 0,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    scene: null as THREE.Scene | null,
    dragonMesh: null as THREE.Group | null
  });

  const attackDragon = (isHeavy: boolean = false) => {
    const s = stateRef.current;
    if (s.attackCooldown > 0 || s.isGameOver || s.isVictory || s.isPaused) return;

    s.isAttacking = true;
    s.attackCooldown = isHeavy ? 20 : 10;
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

    let dmg = isHeavy ? 45 : 22;
    if (isHeavy) {
      s.headHp = Math.max(0, s.headHp - dmg);
      if (s.headHp === 0 && !s.groggyTimer) {
        s.groggyTimer = 180;
        setIsGroggy(true);
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      }
    }

    if (s.groggyTimer > 0) dmg *= 2;
    s.dragonHp = Math.max(0, s.dragonHp - dmg);
    s.score += dmg * 15;
    setDragonHp(s.dragonHp);

    if (s.dragonHp <= 0) {
      s.isGameOver = true;
      s.isVictory = true;
      setIsGameOver(true);
      const duration = (Date.now() - s.startTime) / 1000;
      const receipt = calculateAndDepositMissionReward({
        gameId: 'voxel_dragon_slayer',
        gameTitle: '복셀 드래곤 슬레이어',
        durationSeconds: duration,
        score: s.score + 1500,
        difficulty: 'NIGHTMARE',
        isVictory: true
      });
      setSettlementReceipt(receipt);
      onReward(receipt.totalSns);
    }
  };

  const rollDodge = () => {
    const s = stateRef.current;
    if (s.isRolling || s.isGameOver || s.isPaused) return;
    s.isRolling = true;
    s.rollTime = 20;
    s.pPos.x += (Math.random() > 0.5 ? 4 : -4);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    scene.fog = new THREE.Fog(0x0f172a, 15, 60);
    stateRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 7, 18);
    camera.lookAt(0, 3, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    container.appendChild(renderer.domElement);

    const hemiLight = new THREE.HemisphereLight(0xffeedd, 0x334155, 0.8);
    scene.add(hemiLight);

    const lavaLight = new THREE.PointLight(0xf97316, 2.5, 40);
    lavaLight.position.set(0, 1, 0);
    scene.add(lavaLight);

    // Arena Floor
    const arenaGeo = new THREE.CylinderGeometry(18, 18, 1, 32);
    const arenaMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
    const arena = new THREE.Mesh(arenaGeo, arenaMat);
    arena.position.y = -0.5;
    scene.add(arena);

    // Giant Voxel Dragon Boss
    const dragonGroup = new THREE.Group();
    const dBody = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 7), new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.6 }));
    dBody.position.y = 2.5;
    dragonGroup.add(dBody);

    const dHead = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2, 3), new THREE.MeshStandardMaterial({ color: 0x7f1d1d }));
    dHead.position.set(0, 3.8, 4.2);
    dragonGroup.add(dHead);

    const dWingL = new THREE.Mesh(new THREE.BoxGeometry(7, 0.3, 3), new THREE.MeshStandardMaterial({ color: 0xb91c1c }));
    dWingL.position.set(-4.5, 3.5, 0);
    dragonGroup.add(dWingL);

    const dWingR = new THREE.Mesh(new THREE.BoxGeometry(7, 0.3, 3), new THREE.MeshStandardMaterial({ color: 0xb91c1c }));
    dWingR.position.set(4.5, 3.5, 0);
    dragonGroup.add(dWingR);

    dragonGroup.position.set(0, 0, -2);
    scene.add(dragonGroup);
    stateRef.current.dragonMesh = dragonGroup;

    let animId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;

      if (s.attackCooldown > 0) s.attackCooldown -= dt * 60;
      if (s.groggyTimer > 0) {
        s.groggyTimer -= dt * 60;
        if (s.groggyTimer <= 0) setIsGroggy(false);
      }

      // Dragon Idle / Attack Logic
      if (s.dragonMesh) {
        if (s.groggyTimer > 0) {
          s.dragonMesh.position.y = -0.6;
          s.dragonMesh.rotation.z = Math.sin(now * 0.01) * 0.05;
        } else {
          s.dragonMesh.position.y = Math.sin(now * 0.003) * 0.4;
          s.dragonMesh.rotation.y = Math.sin(now * 0.002) * 0.2;
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
    s.dragonHp = 200;
    s.headHp = 50;
    s.wingHp = 50;
    s.playerHp = 100;
    s.groggyTimer = 0;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    setDragonHp(200);
    setPlayerHp(100);
    setIsGroggy(false);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col font-mono select-none overflow-hidden">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '복셀 드래곤 슬레이어' : 'Voxel Dragon Slayer'}
        language={language}
        hp={{ current: dragonHp, max: 200 }}
        telemetries={[
          { label: isKo ? '상태' : 'State', value: isGroggy ? '⚡ 그로기' : '🔥 분노', color: isGroggy ? 'text-amber-300' : 'text-rose-400' },
          { label: isKo ? '헌터HP' : 'HP', value: `${playerHp}/100`, color: 'text-cyan-300' }
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

              if (Math.abs(dx) > 15) {
                moved = true;
                rollDodge();
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);

              if (!moved) {
                // Tap: Attack
                attackDragon(false);
              }
            };

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
            window.addEventListener('pointercancel', onUp);
          }}
          onDoubleClick={() => attackDragon(true)}
        />
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/75 border border-rose-500/30 rounded-full text-[10px] text-rose-300 font-mono backdrop-blur-xs">
          {isKo ? '좌우 스와이프: 구르기 회피 | 탭: 대검 베기 | 더블탭: 부위파괴 강타 (버튼 없음)' : 'Swipe L/R: Roll Dodge | Tap: Slash | Double Tap: Heavy Part Strike (No Buttons)'}
        </div>
      </div>

      {/* 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="voxel_dragon_slayer"
          gameTitle={isKo ? '3D 복셀 드래곤 슬레이어: 거대 몬스터 토벌' : 'Voxel Dragon Slayer: Boss Raid'}
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
