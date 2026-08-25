import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelSpaceOdysseyGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface Asteroid {
  mesh: THREE.Mesh;
  x: number;
  y: number;
  z: number;
  hp: number;
  alive: boolean;
}

interface PirateShip {
  mesh: THREE.Group;
  x: number;
  y: number;
  z: number;
  hp: number;
  alive: boolean;
}

export const VoxelSpaceOdysseyGame: React.FC<VoxelSpaceOdysseyGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_space_odyssey') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [shield, setShield] = useState<number>(100);
  const [piratesDefeated, setPiratesDefeated] = useState<number>(0);
  const targetPirates = 4;
  const [minerals, setMinerals] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    shipPos: new THREE.Vector3(0, 0, 0),
    moveDir: new THREE.Vector2(0, 0),
    shield: 100,
    piratesDefeated: 0,
    minerals: 0,
    score: 0,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    shipMesh: null as THREE.Group | null,
    asteroids: [] as Asteroid[],
    pirates: [] as PirateShip[],
    lasers: [] as { mesh: THREE.Mesh; vx: number; vy: number; vz: number }[],
    scene: null as THREE.Scene | null,
    camera: null as THREE.PerspectiveCamera | null
  });

  const fireLaser = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isVictory || s.isPaused || !s.scene) return;

    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3');

    const lGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.0, 8);
    const lMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const laser = new THREE.Mesh(lGeo, lMat);
    laser.rotation.x = Math.PI / 2;
    laser.position.set(s.shipPos.x, s.shipPos.y, s.shipPos.z - 1.5);
    s.scene.add(laser);

    s.lasers.push({
      mesh: laser,
      vx: 0,
      vy: 0,
      vz: -80
    });
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x02040a);
    stateRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 500);
    camera.position.set(0, 3, 8);
    stateRef.current.camera = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0x38bdf8, 0.8);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xfff7d6, 1.6);
    sun.position.set(50, 100, 50);
    scene.add(sun);

    // Starfield Points
    const starGeo = new THREE.BufferGeometry();
    const starCount = 600;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 400;
      starPos[i + 1] = (Math.random() - 0.5) * 400;
      starPos[i + 2] = (Math.random() - 0.5) * 400;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starField = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.2 }));
    scene.add(starField);

    // Spaceship Group
    const ship = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.6, 2.4),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 })
    );
    ship.add(body);

    const cockpit = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.4, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1 })
    );
    cockpit.position.set(0, 0.35, -0.4);
    ship.add(cockpit);

    ship.position.set(0, 0, 0);
    scene.add(ship);
    stateRef.current.shipMesh = ship;

    // Spawn 4 Pirate Ships
    stateRef.current.pirates = [];
    for (let i = 0; i < targetPirates; i++) {
      const pGroup = new THREE.Group();
      const pMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.6, 2.2),
        new THREE.MeshStandardMaterial({ color: 0xdc2626 })
      );
      pGroup.add(pMesh);

      const px = (i % 2 === 0 ? 1 : -1) * (10 + i * 3);
      const py = (Math.random() - 0.5) * 6;
      const pz = -25 - i * 15;
      pGroup.position.set(px, py, pz);
      scene.add(pGroup);

      stateRef.current.pirates.push({
        mesh: pGroup,
        x: px,
        y: py,
        z: pz,
        hp: 3,
        alive: true
      });
    }

    // Spawn Asteroids
    stateRef.current.asteroids = [];
    for (let i = 0; i < 15; i++) {
      const aMesh = new THREE.Mesh(
        new THREE.DodecahedronGeometry(1.5, 0),
        new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.9 })
      );
      const ax = (Math.random() - 0.5) * 35;
      const ay = (Math.random() - 0.5) * 20;
      const az = -15 - i * 8;
      aMesh.position.set(ax, ay, az);
      scene.add(aMesh);

      stateRef.current.asteroids.push({
        mesh: aMesh,
        x: ax,
        y: ay,
        z: az,
        hp: 2,
        alive: true
      });
    }

    let animId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;

      // Ship controls
      const speed = 15;
      s.shipPos.x += s.moveDir.x * speed * dt;
      s.shipPos.y += s.moveDir.y * speed * dt;
      s.shipPos.x = THREE.MathUtils.clamp(s.shipPos.x, -20, 20);
      s.shipPos.y = THREE.MathUtils.clamp(s.shipPos.y, -10, 10);

      if (ship) {
        ship.position.set(s.shipPos.x, s.shipPos.y, s.shipPos.z);
        ship.rotation.z = -s.moveDir.x * 0.4;
        ship.rotation.x = s.moveDir.y * 0.3;
      }

      // Camera follow
      camera.position.set(s.shipPos.x * 0.5, s.shipPos.y * 0.5 + 3, s.shipPos.z + 8);
      camera.lookAt(s.shipPos.x * 0.5, s.shipPos.y * 0.5, s.shipPos.z - 20);

      // Update Lasers
      for (let i = s.lasers.length - 1; i >= 0; i--) {
        const l = s.lasers[i];
        l.mesh.position.z += l.vz * dt;

        // Check Pirate Hit
        for (const p of s.pirates) {
          if (p.alive && l.mesh.position.distanceTo(p.mesh.position) < 2.2) {
            p.hp -= 1;
            s.score += 200;
            setScore(s.score);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

            if (p.hp <= 0) {
              p.alive = false;
              scene.remove(p.mesh);
              s.piratesDefeated += 1;
              setPiratesDefeated(s.piratesDefeated);

              if (s.piratesDefeated >= targetPirates && !s.isGameOver) {
                s.isVictory = true;
                s.isGameOver = true;
                setIsGameOver(true);
                const duration = (Date.now() - s.startTime) / 1000;
                const receipt = calculateAndDepositMissionReward({
                  gameId: 'voxel_space_odyssey',
                  gameTitle: '복셀 스페이스 오디세이',
                  durationSeconds: duration,
                  score: s.score + 2500,
                  difficulty: 'NIGHTMARE',
                  isVictory: true
                });
                setSettlementReceipt(receipt);
                onReward(receipt.totalSns);
              }
            }
            break;
          }
        }

        // Check Asteroid Hit
        for (const a of s.asteroids) {
          if (a.alive && l.mesh.position.distanceTo(a.mesh.position) < 2.0) {
            a.hp -= 1;
            s.score += 80;
            setScore(s.score);
            if (a.hp <= 0) {
              a.alive = false;
              scene.remove(a.mesh);
              s.minerals += 5;
              setMinerals(s.minerals);
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
            }
            break;
          }
        }

        if (l.mesh.position.z < -150) {
          scene.remove(l.mesh);
          s.lasers.splice(i, 1);
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
    s.shipPos.set(0, 0, 0);
    s.shield = 100;
    s.piratesDefeated = 0;
    s.minerals = 0;
    s.score = 0;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    s.pirates.forEach((p, idx) => {
      p.alive = true;
      p.hp = 3;
      const px = (idx % 2 === 0 ? 1 : -1) * (10 + idx * 3);
      const py = (Math.random() - 0.5) * 6;
      const pz = -25 - idx * 15;
      p.mesh.position.set(px, py, pz);
      s.scene?.add(p.mesh);
    });
    setShield(100);
    setPiratesDefeated(0);
    setMinerals(0);
    setScore(0);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  const customTutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 성계 개척 & 우주 해적 소탕' : 'STEP 1: SPACE ODYSSEY',
      title: isKo ? '우주 해적선 4척 격추 승리' : 'Destroy 4 Pirate Vessels',
      description: isKo
        ? '심우주를 항해하며 소행성 광물을 채굴하고 은하 해적선 4척을 모두 격추하세요.'
        : 'Navigate deep space, mine asteroid minerals and eliminate 4 pirate ships.',
      keyPoints: isKo
        ? [
            '해적선 4척 격추 시 즉시 완승',
            '소행성 파괴 시 광물 자원 수집',
            '실드 HP 100% 방어 유지'
          ]
        : [
            'Destroy 4 pirate ships to win',
            'Mine asteroid minerals',
            'Maintain shield HP at 100%'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조작' : 'STEP 2: PURE GESTURES',
      title: isKo ? '드래그 비행 & 탭 레이저 포격' : 'Drag Fly & Tap Laser',
      description: isKo
        ? '가상 D-Pad 없이 화면 드래그로 360° 비행하고, 탭하여 고출력 레이저를 연사합니다.'
        : 'Drag anywhere to steer spaceship and tap to fire rapid plasma lasers with zero buttons.',
      keyPoints: isKo
        ? [
            '👆 드래그: 우주선 3D 방향 비행 조종',
            '💥 탭: 전방 플라즈마 레이저 발사',
            '⚡ 연속 격추 시 성계 해방 보너스'
          ]
        : [
            '👆 Drag: Smooth 3D flight steering',
            '💥 Tap: Fire plasma lasers',
            '⚡ Chain kills for star pioneer bonus'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '성계 도킹 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare multiplier payout calculated and deposited atomically to your wallet.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '광물 채굴량 및 실드 잔여 보너스',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Minerals and shield bonuses',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS'
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col font-mono select-none overflow-hidden">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '복셀 스페이스 오디세이' : 'Voxel Space Odyssey'}
        language={language}
        hp={{ current: shield, max: 100 }}
        telemetries={[
          { label: isKo ? '해적' : 'Pirates', value: `${piratesDefeated}/${targetPirates}`, color: 'text-rose-400 font-bold' },
          { label: isKo ? '광물' : 'Minerals', value: `${minerals}`, color: 'text-cyan-300' },
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

      {/* Crosshair Center */}
      <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
        <div className="w-6 h-6 border border-cyan-400/60 rounded-full flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
        </div>
      </div>

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

              if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
                moved = true;
                stateRef.current.moveDir.x = Math.abs(dx) > 8 ? (dx > 0 ? 1 : -1) : 0;
                stateRef.current.moveDir.y = Math.abs(dy) > 8 ? (dy > 0 ? -1 : 1) : 0;
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);
              stateRef.current.moveDir.x = 0;
              stateRef.current.moveDir.y = 0;

              if (!moved) {
                // Tap: Fire Laser
                fireLaser();
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
        <div className="px-3 py-1 bg-black/75 border border-cyan-500/30 rounded-full text-[10px] text-cyan-300 font-mono backdrop-blur-xs">
          {isKo ? '화면 드래그: 우주선 3D 비행 | 탭: 레이저 발사 (버튼 없음)' : 'Drag: 3D Flight Steer | Tap: Fire Lasers (No Buttons)'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="voxel_space_odyssey"
          gameTitle={isKo ? '3D 복셀 스페이스 오디세이: 은하 해적전' : 'Voxel Space Odyssey: Star Battle'}
          customSteps={customTutorialSteps}
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
export default VoxelSpaceOdysseyGame;
