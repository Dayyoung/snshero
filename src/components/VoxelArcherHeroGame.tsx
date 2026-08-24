import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelArcherHeroGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelArcherHeroGame: React.FC<VoxelArcherHeroGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_archer_hero') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [wave, setWave] = useState<number>(1);
  const [playerHp, setPlayerHp] = useState<number>(100);
  const [kills, setKills] = useState<number>(0);
  const [multiShot, setMultiShot] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    pPos: new THREE.Vector3(0, 0.5, 12),
    pVel: new THREE.Vector3(0, 0, 0),
    isMoving: false,
    arrows: [] as { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[],
    enemies: [] as { mesh: THREE.Mesh; hp: number; maxHp: number }[],
    shootCooldown: 0,
    wave: 1,
    kills: 0,
    score: 0,
    multiShot: 1,
    playerHp: 100,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now()
  });

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d1f12);
    scene.fog = new THREE.FogExp2(0x0d1f12, 0.02);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 16, 22);
    camera.lookAt(0, 0, 4);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const ambLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambLight);

    const dirLight = new THREE.DirectionalLight(0xa3e635, 1.4);
    dirLight.position.set(10, 30, 10);
    scene.add(dirLight);

    // Forest Grid Floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 50), new THREE.MeshLambertMaterial({ color: 0x1e3a1e }));
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Player Archer Mesh
    const playerGroup = new THREE.Group();
    const pMesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 1.2), new THREE.MeshLambertMaterial({ color: 0x84cc16 }));
    pMesh.position.y = 0.9;
    playerGroup.add(pMesh);
    const bowMesh = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.2, 0.4), new THREE.MeshLambertMaterial({ color: 0xfacc15 }));
    bowMesh.position.set(0, 1.0, 0.8);
    playerGroup.add(bowMesh);
    playerGroup.position.copy(stateRef.current.pPos);
    scene.add(playerGroup);

    // Spawn Enemy Wave
    const spawnWave = (w: number) => {
      const count = 4 + w * 2;
      for (let i = 0; i < count; i++) {
        const eGroup = new THREE.Group();
        const em = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 1.4), new THREE.MeshLambertMaterial({ color: 0xef4444 }));
        em.position.y = 0.7;
        eGroup.add(em);
        eGroup.position.set((Math.random() - 0.5) * 28, 0, -15 - Math.random() * 15);
        scene.add(eGroup);
        stateRef.current.enemies.push({ mesh: eGroup as any, hp: 25 + w * 5, maxHp: 25 + w * 5 });
      }
    };

    spawnWave(1);

    let animId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;

      playerGroup.position.copy(s.pPos);

      // Auto-Shooting when standing still
      if (!s.isMoving && s.enemies.length > 0) {
        s.shootCooldown -= dt;
        if (s.shootCooldown <= 0) {
          s.shootCooldown = 0.35;
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

          // Find closest target
          let target = s.enemies[0];
          let minDist = 999;
          for (let e of s.enemies) {
            const d = s.pPos.distanceTo(e.mesh.position);
            if (d < minDist) {
              minDist = d;
              target = e;
            }
          }

          if (target) {
            const dir = new THREE.Vector3().subVectors(target.mesh.position, s.pPos).normalize();

            // Multishot Spread
            for (let i = 0; i < s.multiShot; i++) {
              const spread = (i - (s.multiShot - 1) / 2) * 0.18;
              const arrowDir = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), spread);

              const aMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 4), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
              aMesh.rotation.x = Math.PI / 2;
              aMesh.position.copy(s.pPos).add(new THREE.Vector3(0, 0.9, 0));
              scene.add(aMesh);

              s.arrows.push({
                mesh: aMesh,
                vel: arrowDir.multiplyScalar(35),
                life: 2.0
              });
            }
          }
        }
      }

      // Update Arrows
      for (let i = s.arrows.length - 1; i >= 0; i--) {
        const a = s.arrows[i];
        a.mesh.position.addScaledVector(a.vel, dt);
        a.life -= dt;

        // Collision with enemies
        for (let j = s.enemies.length - 1; j >= 0; j--) {
          const e = s.enemies[j];
          if (a.mesh.position.distanceTo(e.mesh.position) < 1.4) {
            e.hp -= 20;
            a.life = 0;
            if (e.hp <= 0) {
              scene.remove(e.mesh);
              s.enemies.splice(j, 1);
              s.kills += 1;
              s.score += 150;
              setKills(s.kills);
              setScore(s.score);

              // Multishot Upgrade
              if (s.kills % 6 === 0 && s.multiShot < 3) {
                s.multiShot += 1;
                setMultiShot(s.multiShot);
              }
            }
            break;
          }
        }

        if (a.life <= 0) {
          scene.remove(a.mesh);
          s.arrows.splice(i, 1);
        }
      }

      // Update Enemies Movement & Attack
      for (let i = s.enemies.length - 1; i >= 0; i--) {
        const e = s.enemies[i];
        const dir = new THREE.Vector3().subVectors(s.pPos, e.mesh.position).normalize();
        e.mesh.position.addScaledVector(dir, 4.5 * dt);

        // Attack Player
        if (e.mesh.position.distanceTo(s.pPos) < 1.6) {
          s.playerHp = Math.max(0, s.playerHp - 15 * dt);
          setPlayerHp(Math.round(s.playerHp));
          if (s.playerHp <= 0) {
            s.isGameOver = true;
            setIsGameOver(true);
            const duration = (Date.now() - s.startTime) / 1000;
            const receipt = calculateAndDepositMissionReward({
              gameId: 'voxel_archer_hero',
              gameTitle: '복셀 아처 히어로',
              durationSeconds: duration,
              score: s.score,
              difficulty: 'NORMAL',
              isVictory: false
            });
            setSettlementReceipt(receipt);
            onReward(receipt.totalSns);
          }
        }
      }

      // Next Wave Progression
      if (s.enemies.length === 0 && !s.isGameOver) {
        if (s.wave >= 4) {
          s.isGameOver = true;
          setIsGameOver(true);
          const duration = (Date.now() - s.startTime) / 1000;
          const receipt = calculateAndDepositMissionReward({
            gameId: 'voxel_archer_hero',
            gameTitle: '복셀 아처 히어로',
            durationSeconds: duration,
            score: s.score + 1000,
            difficulty: 'HARD',
            isVictory: true
          });
          setSettlementReceipt(receipt);
          onReward(receipt.totalSns);
        } else {
          s.wave += 1;
          setWave(s.wave);
          spawnWave(s.wave);
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
    s.pPos.set(0, 0.5, 12);
    s.playerHp = 100;
    s.wave = 1;
    s.kills = 0;
    s.score = 0;
    s.multiShot = 1;
    s.isGameOver = false;
    s.startTime = Date.now();
    setWave(1);
    setPlayerHp(100);
    setKills(0);
    setScore(0);
    setMultiShot(1);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col font-mono select-none overflow-hidden">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '복셀 아처 히어로' : 'Voxel Archer Hero'}
        language={language}
        hp={{ current: playerHp, max: 100 }}
        telemetries={[
          { label: isKo ? '웨이브' : 'Wave', value: `${wave}/4`, color: 'text-lime-300' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300' },
          { label: isKo ? '멀티샷' : 'Multishot', value: `x${multiShot}`, color: 'text-cyan-300' }
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
          className="absolute inset-0 z-10 select-none touch-none"
          style={{ touchAction: 'none' }}
          onPointerDown={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const startX = e.clientX - rect.left;
            const startY = e.clientY - rect.top;
            stateRef.current.isMoving = true;

            const onMove = (moveEvt: PointerEvent) => {
              const curX = moveEvt.clientX - rect.left;
              const curY = moveEvt.clientY - rect.top;
              const dx = curX - startX;
              const dy = curY - startY;

              if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
                stateRef.current.isMoving = true;
                stateRef.current.pPos.x = Math.max(-18, Math.min(18, stateRef.current.pPos.x + dx * 0.05));
                stateRef.current.pPos.z = Math.max(-18, Math.min(18, stateRef.current.pPos.z + dy * 0.05));
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);
              stateRef.current.isMoving = false;
            };

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
            window.addEventListener('pointercancel', onUp);
          }}
        />
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/75 border border-lime-400/30 rounded-full text-[10px] text-lime-300 font-mono backdrop-blur-xs">
          {isKo ? '드래그: 궁수 이동 | 손 떼기: 자동 조준 사격 (버튼 없음)' : 'Drag: Move | Release: Auto Aim Shoot (No Buttons)'}
        </div>
      </div>

      {/* 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="voxel_archer_hero"
          gameTitle={isKo ? '3D 복셀 아처 히어로: 숲의 수호자' : 'Voxel Archer Hero: Forest Guardian'}
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
