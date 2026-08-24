import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelCastleBlasterGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelCastleBlasterGame: React.FC<VoxelCastleBlasterGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_castle_blaster') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [cannonAngle, setCannonAngle] = useState<number>(45);
  const [cannonPower, setCannonPower] = useState<number>(70);
  const [castleHp, setCastleHp] = useState<number>(100);
  const [ammo, setAmmo] = useState<number>(8);
  const [score, setScore] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const gameStateRef = useRef({
    angle: 45,
    power: 70,
    castleHp: 100,
    ammo: 8,
    score: 0,
    cannonBalls: [] as { mesh: THREE.Mesh; vx: number; vy: number; vz: number; life: number }[],
    blocks: [] as { mesh: THREE.Mesh; x: number; y: number; z: number; destroyed: boolean }[],
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    scene: null as THREE.Scene | null
  });

  const fireCannon = () => {
    const s = gameStateRef.current;
    if (s.ammo <= 0 || s.isGameOver || s.isVictory || s.isPaused || !s.scene) return;
    s.ammo -= 1;
    setAmmo(s.ammo);

    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

    const rad = (s.angle * Math.PI) / 180;
    const speed = (s.power / 100) * 45;

    const ballGeo = new THREE.SphereGeometry(0.8, 12, 12);
    const ballMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    const ball = new THREE.Mesh(ballGeo, ballMat);
    ball.position.set(0, 2, -5);
    s.scene.add(ball);

    s.cannonBalls.push({
      mesh: ball,
      vx: 0,
      vy: Math.sin(rad) * speed,
      vz: -Math.cos(rad) * speed,
      life: 4.0
    });
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x88bbff);
    gameStateRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 300);
    camera.position.set(-15, 12, 10);
    camera.lookAt(0, 4, -30);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffeedd, 1.2);
    sun.position.set(30, 60, 20);
    scene.add(sun);

    // Ground
    const groundGeo = new THREE.PlaneGeometry(120, 120);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x558833 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    scene.add(ground);

    // Build Voxel Castle at Z = -45
    const blockGeo = new THREE.BoxGeometry(1.8, 1.8, 1.8);
    const blockMat = new THREE.MeshLambertMaterial({ color: 0x888899 });
    const castleBlocks: { mesh: THREE.Mesh; x: number; y: number; z: number; destroyed: boolean }[] = [];

    for (let y = 0; y < 6; y++) {
      for (let x = -3; x <= 3; x++) {
        for (let z = -1; z <= 1; z++) {
          if (y > 3 && (Math.abs(x) > 2 || Math.abs(z) > 0)) continue; // Turret shape
          const b = new THREE.Mesh(blockGeo, blockMat);
          const bx = x * 2;
          const by = y * 2 + 1;
          const bz = -45 + z * 2;
          b.position.set(bx, by, bz);
          scene.add(b);
          castleBlocks.push({ mesh: b, x: bx, y: by, z: bz, destroyed: false });
        }
      }
    }
    gameStateRef.current.blocks = castleBlocks;

    let animId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const s = gameStateRef.current;
      if (s.isPaused || s.isGameOver) return;

      // Update Cannonballs
      for (let i = s.cannonBalls.length - 1; i >= 0; i--) {
        const cb = s.cannonBalls[i];
        cb.mesh.position.x += cb.vx * dt;
        cb.mesh.position.y += cb.vy * dt;
        cb.mesh.position.z += cb.vz * dt;
        cb.vy -= 9.8 * dt; // Gravity
        cb.life -= dt;

        // Collision with Castle Blocks
        for (let b of s.blocks) {
          if (!b.destroyed && cb.mesh.position.distanceTo(b.mesh.position) < 2.0) {
            b.destroyed = true;
            b.mesh.position.y = -10;
            s.castleHp = Math.max(0, s.castleHp - 3);
            s.score += 150;
            setCastleHp(s.castleHp);
            setScore(s.score);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

            if (s.castleHp <= 0) {
              s.isVictory = true;
              s.isGameOver = true;
              setIsGameOver(true);
              const duration = (Date.now() - s.startTime) / 1000;
              const receipt = calculateAndDepositMissionReward({
                gameId: 'voxel_castle_blaster',
                gameTitle: '복셀 캐슬 블래스터',
                durationSeconds: duration,
                score: s.score + 1000,
                difficulty: 'HARD',
                isVictory: true
              });
              setSettlementReceipt(receipt);
              onReward(receipt.totalSns);
            }
          }
        }

        if (cb.life <= 0 || cb.mesh.position.y < 0) {
          scene.remove(cb.mesh);
          s.cannonBalls.splice(i, 1);

          // Check ammo exhaustion
          if (s.ammo <= 0 && s.cannonBalls.length === 0 && !s.isGameOver) {
            s.isGameOver = true;
            setIsGameOver(true);
            const duration = (Date.now() - s.startTime) / 1000;
            const receipt = calculateAndDepositMissionReward({
              gameId: 'voxel_castle_blaster',
              gameTitle: '복셀 캐슬 블래스터',
              durationSeconds: duration,
              score: s.score,
              difficulty: 'NORMAL',
              isVictory: s.castleHp <= 30
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
    const s = gameStateRef.current;
    s.castleHp = 100;
    s.ammo = 8;
    s.score = 0;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    setCastleHp(100);
    setAmmo(8);
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
        title={isKo ? '복셀 캐슬 블래스터' : 'Voxel Castle Blaster'}
        language={language}
        hp={{ current: castleHp, max: 100 }}
        telemetries={[
          { label: isKo ? '포탄' : 'Ammo', value: `${ammo}발`, color: 'text-amber-300' },
          { label: isKo ? '각도' : 'Angle', value: `${cannonAngle}°`, color: 'text-cyan-300' },
          { label: isKo ? '파워' : 'Power', value: `${cannonPower}%`, color: 'text-emerald-300' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => {
          setIsPaused(prev => !prev);
          gameStateRef.current.isPaused = !isPaused;
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

              if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
                moved = true;
                gameStateRef.current.angle = Math.max(15, Math.min(80, gameStateRef.current.angle - dy * 0.15));
                setCannonAngle(Math.round(gameStateRef.current.angle));
                const newPow = Math.max(30, Math.min(100, gameStateRef.current.power + dx * 0.15));
                gameStateRef.current.power = newPow;
                setCannonPower(Math.round(newPow));
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);

              if (!moved) {
                // Tap: Fire Cannon
                fireCannon();
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
        <div className="px-3 py-1 bg-black/75 border border-rose-500/30 rounded-full text-[10px] text-rose-300 font-mono backdrop-blur-xs">
          {isKo ? '상하 드래그: 발사 각도 | 좌우: 파워 조절 | 탭: 대포 발사 (버튼 없음)' : 'Drag U/D: Angle | Drag L/R: Power | Tap: Fire Cannon (No Buttons)'}
        </div>
      </div>

      {/* 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="voxel_castle_blaster"
          gameTitle={isKo ? '3D 복셀 캐슬 블래스터: 요새 공성전' : 'Voxel Castle Blaster: Siege Warfare'}
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
