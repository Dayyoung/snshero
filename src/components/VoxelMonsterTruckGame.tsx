import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowLeft, ShieldAlert, Zap, Trophy, Flame } from 'lucide-react';
import { CardData } from '../types';

interface VoxelMonsterTruckGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface EnemyTruck {
  mesh: THREE.Group;
  pos: THREE.Vector3;
  rot: number;
  hp: number;
  maxHp: number;
  alive: boolean;
}

export const VoxelMonsterTruckGame: React.FC<VoxelMonsterTruckGameProps> = ({
  deck: _deck,
  language = 'ko',
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [playerHp, setPlayerHp] = useState<number>(100);
  const [enemiesLeft, setEnemiesLeft] = useState<number>(3);
  const [nitro, setNitro] = useState<number>(100);
  const [score, setScore] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const stateRef = useRef({
    truckPos: new THREE.Vector3(0, 0.8, 15),
    truckRot: 0,
    speed: 0,
    hp: 100,
    nitro: 100,
    isNitro: false,
    keys: {} as Record<string, boolean>,
    enemies: [] as EnemyTruck[],
    enemiesLeft: 3,
    score: 0,
    isGameOver: false
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      stateRef.current.keys[e.key.toLowerCase()] = true;
      if (e.key === ' ' || e.key.toLowerCase() === 'f') activateNitro();
      if (e.key.toLowerCase() === 'e') performDonutTurn();
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      stateRef.current.keys[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const activateNitro = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.nitro < 25) return;
    s.isNitro = true;
    s.nitro -= 25;
    s.speed = 1.1;
    setNitro(Math.floor(s.nitro));
    if (playSfx) playSfx('/sounds/nitro.mp3');
  };

  const performDonutTurn = () => {
    const s = stateRef.current;
    if (s.isGameOver) return;
    s.truckRot += Math.PI;
    if (playSfx) playSfx('/sounds/drift.mp3');
  };

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x3f2e1e); // Muddy dirt atmosphere
    scene.fog = new THREE.FogExp2(0x3f2e1e, 0.015);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const sun = new THREE.DirectionalLight(0xf59e0b, 1.4);
    sun.position.set(20, 40, 20);
    scene.add(sun);

    // Muddy Arena Floor
    const floorGeo = new THREE.PlaneGeometry(80, 80);
    const floorMat = new THREE.MeshLambertMaterial({ color: 0x78350f });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Arena Perimeter Barricade
    const wallMat = new THREE.MeshLambertMaterial({ color: 0xd97706 });
    const wallN = new THREE.Mesh(new THREE.BoxGeometry(80, 4, 2), wallMat);
    wallN.position.set(0, 2, -40);
    scene.add(wallN);
    const wallS = new THREE.Mesh(new THREE.BoxGeometry(80, 4, 2), wallMat);
    wallS.position.set(0, 2, 40);
    scene.add(wallS);
    const wallW = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 80), wallMat);
    wallW.position.set(-40, 2, 0);
    scene.add(wallW);
    const wallE = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 80), wallMat);
    wallE.position.set(40, 2, 0);
    scene.add(wallE);

    // Player Monster Truck
    const playerGroup = new THREE.Group();
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x10b981 });
    const pBody = new THREE.Mesh(new THREE.BoxGeometry(3, 1.6, 4.8), bodyMat);
    pBody.position.y = 1.4;
    playerGroup.add(pBody);

    const wheelMat = new THREE.MeshLambertMaterial({ color: 0x18181b });
    const wheelGeo = new THREE.CylinderGeometry(1.2, 1.2, 1.0, 16);
    [[-1.8, 1.8], [1.8, 1.8], [-1.8, -1.8], [1.8, -1.8]].forEach(([wx, wz]) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, 1.2, wz);
      playerGroup.add(wheel);
    });

    scene.add(playerGroup);

    // Enemy Trucks (3 Opponents)
    const enemies: EnemyTruck[] = [];
    const eColors = [0xef4444, 0x8b5cf6, 0xf59e0b];
    for (let i = 0; i < 3; i++) {
      const eGroup = new THREE.Group();
      const eMat = new THREE.MeshLambertMaterial({ color: eColors[i] });
      const eBody = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.5, 4.6), eMat);
      eBody.position.y = 1.4;
      eGroup.add(eBody);

      [[-1.7, 1.7], [1.7, 1.7], [-1.7, -1.7], [1.7, -1.7]].forEach(([wx, wz]) => {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, 1.2, wz);
        eGroup.add(wheel);
      });

      const ePos = new THREE.Vector3((i - 1) * 20, 0.8, -18);
      eGroup.position.copy(ePos);
      scene.add(eGroup);

      enemies.push({
        mesh: eGroup,
        pos: ePos,
        rot: 0,
        hp: 100,
        maxHp: 100,
        alive: true
      });
    }
    stateRef.current.enemies = enemies;

    // Nitro Refill Interval
    const nitroInterval = setInterval(() => {
      const s = stateRef.current;
      if (s.nitro < 100) {
        s.nitro = Math.min(100, s.nitro + 5);
        setNitro(Math.floor(s.nitro));
      }
    }, 1000);

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const s = stateRef.current;
      if (s.isGameOver) {
        renderer.render(scene, camera);
        return;
      }

      // Player Movement
      const keys = s.keys;
      if (keys['w'] || keys['arrowup']) s.speed = Math.min(0.7, s.speed + 0.04);
      else if (keys['s'] || keys['arrowdown']) s.speed = Math.max(-0.35, s.speed - 0.04);
      else s.speed *= 0.92;

      if (keys['a'] || keys['arrowleft']) s.truckRot += 0.05 * (s.speed >= 0 ? 1 : -1);
      if (keys['d'] || keys['arrowright']) s.truckRot -= 0.05 * (s.speed >= 0 ? 1 : -1);

      s.truckPos.x += Math.sin(s.truckRot) * s.speed;
      s.truckPos.z += Math.cos(s.truckRot) * s.speed;

      // Arena Boundary
      s.truckPos.x = Math.max(-36, Math.min(36, s.truckPos.x));
      s.truckPos.z = Math.max(-36, Math.min(36, s.truckPos.z));

      playerGroup.position.copy(s.truckPos);
      playerGroup.rotation.y = s.truckRot;

      // Enemy AI & Collision
      let aliveCount = 0;
      for (const enemy of s.enemies) {
        if (!enemy.alive) continue;
        aliveCount += 1;

        // Move towards player
        const toPlayer = s.truckPos.clone().sub(enemy.pos);
        const dist = toPlayer.length();

        if (dist > 3) {
          enemy.rot = Math.atan2(toPlayer.x, toPlayer.z);
          enemy.pos.x += Math.sin(enemy.rot) * 0.28;
          enemy.pos.z += Math.cos(enemy.rot) * 0.28;
          enemy.mesh.position.copy(enemy.pos);
          enemy.mesh.rotation.y = enemy.rot;
        }

        // Collision Check with Player
        if (dist < 4.0) {
          const impact = Math.abs(s.speed) * 40;
          if (impact > 15) {
            // Player Rammed Enemy!
            enemy.hp -= impact;
            s.score += Math.floor(impact);
            setScore(s.score);
            if (playSfx) playSfx('/sounds/crash.mp3');

            // Push Enemy back
            enemy.pos.add(toPlayer.normalize().multiplyScalar(-6));

            if (enemy.hp <= 0) {
              enemy.alive = false;
              enemy.mesh.visible = false;
              s.score += 100;
              setScore(s.score);
              if (playSfx) playSfx('/sounds/explosion.mp3');
            }
          } else {
            // Enemy hits player
            s.hp = Math.max(0, s.hp - 10);
            setPlayerHp(Math.floor(s.hp));
            if (s.hp <= 0) {
              s.isGameOver = true;
              setIsGameOver(true);
              const finalSns = Math.min(260, Math.max(30, s.score * 2 + 40));
              setRewardSns(finalSns);
              onReward(finalSns);
              if (playSfx) playSfx('/sounds/gameover.mp3');
            }
          }
        }
      }
      setEnemiesLeft(aliveCount);

      // All Enemies Defeated Win!
      if (aliveCount === 0 && !s.isGameOver) {
        s.isGameOver = true;
        setIsGameOver(true);
        const finalSns = Math.min(260, Math.max(50, s.score * 2 + 80));
        setRewardSns(finalSns);
        onReward(finalSns);
        if (playSfx) playSfx('/sounds/fanfare.mp3');
      }

      // Camera Follow
      const camOffset = new THREE.Vector3(
        -Math.sin(s.truckRot) * 18,
        14,
        -Math.cos(s.truckRot) * 18
      );
      camera.position.copy(s.truckPos).add(camOffset);
      camera.lookAt(s.truckPos.clone().add(new THREE.Vector3(0, 2, 0)));

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      clearInterval(nitroInterval);
      cancelAnimationFrame(animId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [lowSpecMode, onReward, playSfx]);

  return (
    <div className="relative w-full h-[100dvh] bg-[#3f2e1e] font-mono text-[#fdfcfc] select-none flex flex-col overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#201d1d] border-b border-[#201d1d]/30 z-20">
        <button
          onClick={onExit}
          className="flex items-center gap-1 px-2.5 py-1 bg-[#fdfcfc]/10 text-white rounded-sm text-xs active:bg-white/20"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> [뒤로]
        </button>
        <div className="text-center">
          <div className="text-xs font-bold text-amber-400 flex items-center justify-center gap-1">
            <Flame className="w-3.5 h-3.5" /> [No.74 그림리 전담] 3D 몬스터 트럭 스매시
          </div>
          <div className="text-[10px] text-slate-300">데몰리션 더비 & 차량 파괴 난투 배틀</div>
        </div>
        <div className="text-xs text-red-400 font-bold">
          생존 적: {enemiesLeft}대
        </div>
      </div>

      {/* Stats HUD */}
      <div className="grid grid-cols-3 gap-2 px-4 py-2 bg-[#18181b]/90 text-xs border-b border-slate-700 z-20">
        <div>내 체력: <strong className="text-emerald-400">{playerHp}%</strong></div>
        <div>니트로 부스트: <strong className="text-amber-400">{nitro}%</strong></div>
        <div>점수: <strong className="text-cyan-400">{score}P</strong></div>
      </div>

      {/* 3D Canvas */}
      <div ref={mountRef} className="relative flex-1 w-full overflow-hidden" />

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

              if (Math.abs(dx) > 8) {
                moved = true;
                stateRef.current.truckRot -= dx * 0.003;
              }
              if (Math.abs(dy) > 8) {
                moved = true;
                stateRef.current.speed = dy < 0 ? 0.6 : -0.3;
              }
              if (dy < -25) {
                activateNitro();
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);
              stateRef.current.speed = 0;

              if (!moved) {
                // Tap: Donut Turn
                performDonutTurn();
              }
            };

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
            window.addEventListener('pointercancel', onUp);
          }}
          onDoubleClick={() => activateNitro()}
        />
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/70 border border-amber-500/30 rounded-full text-[10px] text-amber-300 font-mono backdrop-blur-xs">
          {language === 'ko' ? '드래그: 조향 & 주행 | 탭: 360° 도넛 턴 | 더블탭/위로: 니트로 돌진 (버튼 없음)' : 'Drag: Steer & Drive | Tap: Donut Turn | Double Tap/Up: Nitro (No Buttons)'}
        </div>
      </div>

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-sm bg-[#201d1d] border border-amber-500/40 p-5 rounded-none text-center font-mono">
            <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-2" />
            <h2 className="text-base font-bold text-amber-400 mb-1">
              {enemiesLeft === 0 ? '[데몰리션 더비 우승!]' : '[경기 종료!]'}
            </h2>
            <p className="text-xs text-slate-300 mb-4">몬스터 트럭 난투 충돌 기록</p>

            <div className="bg-slate-900/80 p-3 rounded-sm text-xs space-y-1 mb-4 text-left border border-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-400">최종 점수:</span>
                <span className="text-cyan-400 font-bold">{score}P</span>
              </div>
              <div className="flex justify-between border-t border-slate-700 pt-1">
                <span className="text-amber-300 font-bold">확정 보상 SNS:</span>
                <span className="text-amber-400 font-bold">+{rewardSns} SNS</span>
              </div>
            </div>

            <button
              onClick={onExit}
              className="w-full py-2.5 bg-amber-500 text-black font-bold text-xs rounded-sm active:bg-amber-400"
            >
              [보상 수령 및 복귀]
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
