import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowLeft, Trophy, Flame, Crosshair, Zap, Sparkles } from 'lucide-react';
import { CardData } from '../types';

interface VoxelMegaFlareAssaultGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface EnemyShip {
  mesh: THREE.Group;
  pos: THREE.Vector3;
  hp: number;
  maxHp: number;
  speed: number;
  points: number;
}

interface Laser {
  mesh: THREE.Mesh;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  isMega: boolean;
}

export const VoxelMegaFlareAssaultGame: React.FC<VoxelMegaFlareAssaultGameProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const isKo = language === 'ko';
  const mountRef = useRef<HTMLDivElement>(null);

  const [score, setScore] = useState<number>(0);
  const [wave, setWave] = useState<number>(1);
  const [megaGauge, setMegaGauge] = useState<number>(0); // 0 ~ 100%
  const [destroyedCount, setDestroyedCount] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const stateRef = useRef({
    aimX: 0,
    aimY: 0,
    score: 0,
    wave: 1,
    megaGauge: 0,
    destroyedCount: 0,
    timeLeft: 60,
    isGameOver: false,
    enemies: [] as EnemyShip[],
    lasers: [] as Laser[],
    particles: [] as { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[],
    playerDragon: null as THREE.Group | null,
    reticleMesh: null as THREE.Mesh | null
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c1322);
    scene.fog = new THREE.FogExp2(0x0c1322, 0.02);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 150);
    camera.position.set(0, 3, 10);
    camera.lookAt(0, 1, -20);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    container.appendChild(renderer.domElement);

    // Sky & Flare Lighting
    const ambientLight = new THREE.AmbientLight(0x60a5fa, 0.7);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xf59e0b, 1.8);
    sunLight.position.set(10, 30, 20);
    scene.add(sunLight);

    // Sky Clouds Grid
    const cloudGeo = new THREE.BoxGeometry(4, 1.5, 6);
    const cloudMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
    for (let c = 0; c < 20; c++) {
      const cloud = new THREE.Mesh(cloudGeo, cloudMat);
      cloud.position.set((Math.random() - 0.5) * 60, -6 - Math.random() * 8, -Math.random() * 80);
      scene.add(cloud);
    }

    // Build Bahamut Dragon (Dark Gold & Obsidian Voxel)
    const dragonGroup = new THREE.Group();
    const dragonMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.3 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.2, metalness: 0.8 });

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.0, 2.0), dragonMat);
    torso.position.y = 0;
    dragonGroup.add(torso);

    // Gold Armor Crest
    const crest = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8, 1.6), goldMat);
    crest.position.set(0, 0.7, 0);
    dragonGroup.add(crest);

    // Wings
    const wingMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.4 });
    const lWing = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.1, 1.2), wingMat);
    lWing.position.set(-1.8, 0.4, 0);
    dragonGroup.add(lWing);

    const rWing = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.1, 1.2), wingMat);
    rWing.position.set(1.8, 0.4, 0);
    dragonGroup.add(rWing);

    dragonGroup.position.set(0, -1, 4);
    scene.add(dragonGroup);
    stateRef.current.playerDragon = dragonGroup;

    // Crosshair Reticle in 3D
    const retGeo = new THREE.RingGeometry(0.3, 0.38, 16);
    const retMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide });
    const reticle = new THREE.Mesh(retGeo, retMat);
    reticle.position.set(0, 1, -15);
    scene.add(reticle);
    stateRef.current.reticleMesh = reticle;

    // Spawn Enemy Airship Function
    const spawnEnemy = (waveNum: number) => {
      const eGroup = new THREE.Group();
      const isBoss = Math.random() < 0.25;

      const hullMat = new THREE.MeshStandardMaterial({ color: isBoss ? 0x991b1b : 0x334155, roughness: 0.5 });
      const coreMat = new THREE.MeshBasicMaterial({ color: isBoss ? 0xef4444 : 0x38bdf8 });

      // Airship Hull
      const hull = new THREE.Mesh(new THREE.BoxGeometry(isBoss ? 3.0 : 1.8, isBoss ? 1.4 : 0.8, isBoss ? 4.0 : 2.2), hullMat);
      eGroup.add(hull);

      // Core Crystal
      const core = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), coreMat);
      core.position.y = 0.5;
      eGroup.add(core);

      const posX = (Math.random() - 0.5) * 16;
      const posY = Math.random() * 6 - 1;
      const posZ = -60 - Math.random() * 30;
      eGroup.position.set(posX, posY, posZ);
      scene.add(eGroup);

      stateRef.current.enemies.push({
        mesh: eGroup,
        pos: eGroup.position,
        hp: isBoss ? 4 : 1,
        maxHp: isBoss ? 4 : 1,
        speed: 10 + waveNum * 2,
        points: isBoss ? 500 : 150
      });
    };

    // Initial Wave Spawn
    for (let i = 0; i < 6; i++) {
      spawnEnemy(1);
    }

    // Fire Flare Shot
    const fireFlare = (isMega: boolean = false) => {
      if (stateRef.current.isGameOver) return;
      const laserGeo = new THREE.CylinderGeometry(isMega ? 0.35 : 0.12, isMega ? 0.35 : 0.12, isMega ? 4 : 2, 8);
      const laserMat = new THREE.MeshBasicMaterial({ color: isMega ? 0xf59e0b : 0xec4899 });
      const laserMesh = new THREE.Mesh(laserGeo, laserMat);
      laserMesh.rotation.x = Math.PI / 2;

      const spawnPos = dragonGroup.position.clone().add(new THREE.Vector3(0, 0.5, -1));
      laserMesh.position.copy(spawnPos);
      scene.add(laserMesh);

      const targetPos = new THREE.Vector3(stateRef.current.aimX * 8, stateRef.current.aimY * 4 + 1, -25);
      const dir = targetPos.sub(spawnPos).normalize();

      stateRef.current.lasers.push({
        mesh: laserMesh,
        pos: laserMesh.position,
        vel: dir.multiplyScalar(isMega ? 60 : 45),
        isMega
      });

      if (isMega) {
        stateRef.current.megaGauge = 0;
        setMegaGauge(0);
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
      } else {
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      }
    };

    const spawnExplosion = (pos: THREE.Vector3, color: number) => {
      const count = lowSpecMode ? 5 : 10;
      const pGeo = new THREE.BoxGeometry(0.25, 0.25, 0.25);
      const pMat = new THREE.MeshBasicMaterial({ color });
      for (let p = 0; p < count; p++) {
        const pm = new THREE.Mesh(pGeo, pMat);
        pm.position.copy(pos);
        scene.add(pm);
        stateRef.current.particles.push({
          mesh: pm,
          vel: new THREE.Vector3((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8),
          life: 0.6
        });
      }
    };

    // Keyboard Listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'f' || e.key === 'F') {
        fireFlare(false);
      } else if (e.key === 'm' || e.key === 'M' || e.key === 'e' || e.key === 'E') {
        if (stateRef.current.megaGauge >= 100) {
          fireFlare(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Animation Loop
    let lastTime = performance.now();
    let animId: number;
    let timerAcc = 0;

    const animate = (now: number) => {
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const state = stateRef.current;
      if (!state.isGameOver) {
        // Countdown
        timerAcc += delta;
        if (timerAcc >= 1.0) {
          timerAcc = 0;
          state.timeLeft = Math.max(0, state.timeLeft - 1);
          setTimeLeft(state.timeLeft);
          if (state.timeLeft <= 0) {
            state.isGameOver = true;
            setIsGameOver(true);
            const reward = Math.min(50, Math.max(10, Math.floor(state.score / 200)));
            setRewardSns(reward);
            onReward(reward);
          }
        }

        // Dragon & Reticle Movement
        const targetAimX = state.aimX * 6;
        const targetAimY = state.aimY * 3 + 1;
        dragonGroup.position.x += (targetAimX * 0.4 - dragonGroup.position.x) * 6 * delta;
        dragonGroup.position.y += ((targetAimY - 1) * 0.3 - dragonGroup.position.y) * 6 * delta;
        dragonGroup.rotation.z = -dragonGroup.position.x * 0.1;

        lWing.rotation.z = Math.sin(now * 0.008) * 0.25;
        rWing.rotation.z = -Math.sin(now * 0.008) * 0.25;

        if (reticle) {
          reticle.position.x = state.aimX * 8;
          reticle.position.y = state.aimY * 4 + 1;
          reticle.rotation.z += 1.5 * delta;
        }

        // Update Lasers
        for (let l = state.lasers.length - 1; l >= 0; l--) {
          const laser = state.lasers[l];
          laser.mesh.position.addScaledVector(laser.vel, delta);

          // Check hit against enemies
          let hit = false;
          for (let e = state.enemies.length - 1; e >= 0; e--) {
            const enemy = state.enemies[e];
            if (laser.mesh.position.distanceTo(enemy.mesh.position) < (laser.isMega ? 3.0 : 1.8)) {
              hit = true;
              enemy.hp -= laser.isMega ? 5 : 1;
              spawnExplosion(laser.mesh.position, laser.isMega ? 0xf59e0b : 0xec4899);

              if (enemy.hp <= 0) {
                scene.remove(enemy.mesh);
                state.enemies.splice(e, 1);
                state.score += enemy.points;
                state.destroyedCount++;
                state.megaGauge = Math.min(100, state.megaGauge + 15);
                setScore(state.score);
                setDestroyedCount(state.destroyedCount);
                setMegaGauge(state.megaGauge);
                spawnExplosion(enemy.pos, 0xf97316);
                playSfx?.('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3');
              }
              break;
            }
          }

          if (hit || laser.mesh.position.z < -90) {
            scene.remove(laser.mesh);
            state.lasers.splice(l, 1);
          }
        }

        // Update Enemies
        for (let e = state.enemies.length - 1; e >= 0; e--) {
          const enemy = state.enemies[e];
          enemy.pos.z += enemy.speed * delta;
          enemy.mesh.position.copy(enemy.pos);

          if (enemy.pos.z > 8) {
            scene.remove(enemy.mesh);
            state.enemies.splice(e, 1);
          }
        }

        // Replenish Wave
        while (state.enemies.length < 6) {
          spawnEnemy(state.wave);
        }
      }

      // Update Particles
      for (let p = state.particles.length - 1; p >= 0; p--) {
        const pt = state.particles[p];
        pt.life -= delta;
        pt.mesh.position.addScaledVector(pt.vel, delta);
        if (pt.life <= 0) {
          scene.remove(pt.mesh);
          state.particles.splice(p, 1);
        }
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [lowSpecMode, onReward, playSfx]);

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col select-none overflow-hidden font-mono">
      {/* 3D WebGL Canvas */}
      <div ref={mountRef} className="absolute inset-0 z-0" />

      {/* Top Header */}
      <div className="relative z-10 w-full p-3 sm:p-4 flex items-center justify-between bg-slate-950/80 border-b border-amber-900/40 backdrop-blur-md">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-700 hover:border-amber-400 text-slate-200 text-xs font-bold rounded-sm transition-all cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>{isKo ? '나가기' : 'Exit'}</span>
        </button>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-950/70 border border-amber-500/50 rounded-sm text-amber-300">
            <Trophy size={13} className="text-amber-400" />
            <span>{score.toLocaleString()}P</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-950/70 border border-cyan-500/50 rounded-sm text-cyan-300">
            <span>⏱️ {timeLeft}s</span>
          </div>
        </div>
      </div>

      {/* Mega Flare Gauge Bar */}
      <div className="relative z-10 w-full px-4 pt-2 flex flex-col items-center gap-1 pointer-events-none">
        <div className="w-full max-w-md flex justify-between text-[10px] text-amber-300 font-bold">
          <span>{isKo ? '메가 플레어 브레스 게이지' : 'MEGA FLARE GAUGE'}</span>
          <span>{megaGauge}%</span>
        </div>
        <div className="w-full max-w-md h-2.5 bg-slate-900 border border-amber-700 rounded-sm overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${megaGauge >= 100 ? 'bg-gradient-to-r from-amber-500 to-red-500 animate-pulse shadow-[0_0_15px_rgba(245,158,11,1)]' : 'bg-gradient-to-r from-orange-600 to-amber-400'}`}
            style={{ width: `${megaGauge}%` }}
          />
        </div>
      </div>

      {/* Screen Gesture Touch Overlay */}
      {!isGameOver && (
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

              if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
                moved = true;
                stateRef.current.aimX = Math.max(-1, Math.min(1, stateRef.current.aimX + dx * 0.003));
                stateRef.current.aimY = Math.max(-1, Math.min(1, stateRef.current.aimY - dy * 0.003));
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);

              if (!moved) {
                // Tap: Fire Shot
                window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
              }
            };

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
            window.addEventListener('pointercancel', onUp);
          }}
          onDoubleClick={() => {
            // Double Tap: Mega Flare
            if (megaGauge >= 100) {
              window.dispatchEvent(new KeyboardEvent('keydown', { key: 'm' }));
            }
          }}
        />
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/70 border border-amber-500/30 rounded-full text-[10px] text-amber-300 font-mono backdrop-blur-xs">
          {isKo ? '드래그: 조준 | 탭: 포격 발사 | 더블탭: 메가 플레어 궁극기 (버튼 없음)' : 'Drag: Aim | Tap: Fire | Double Tap: Mega Flare (No Buttons)'}
        </div>
      </div>

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-sm bg-slate-900 border-2 border-amber-500 p-6 flex flex-col items-center gap-4 text-center rounded-none shadow-[0_0_30px_rgba(245,158,11,0.3)]">
            <Trophy size={40} className="text-amber-400 animate-bounce" />
            <h2 className="text-lg font-black text-white tracking-widest">
              {isKo ? '공중 함대 요격 완료!' : 'SKY ASSAULT COMPLETE!'}
            </h2>
            <div className="w-full bg-slate-950 p-3 border border-slate-800 flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>{isKo ? '격추 함선 수' : 'Enemies Shot Down'}</span>
                <span className="text-amber-400 font-bold">{destroyedCount}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>{isKo ? '최종 점수' : 'Final Score'}</span>
                <span className="text-amber-400 font-bold">{score.toLocaleString()}P</span>
              </div>
              <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-1.5">
                <span>{isKo ? 'SNS 보상' : 'SNS Reward'}</span>
                <span className="text-emerald-400 font-bold">+{rewardSns} SNS</span>
              </div>
            </div>

            <button
              onClick={onExit}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 font-black text-sm rounded-sm tracking-wider shadow-lg cursor-pointer"
            >
              {isKo ? '확인 및 보상 수령' : 'Confirm & Claim'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
