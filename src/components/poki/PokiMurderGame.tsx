import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { UniversalTutorialModal } from '../UniversalTutorialModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { Crown, Eye, Sparkles, Shield, AlertTriangle } from 'lucide-react';

interface PokiMurderGameProps {
  onBack?: () => void;
  onExit?: () => void;
  cardId?: number;
  deck?: any[];
  language?: string;
  lowSpecMode?: boolean;
  playSfx?: (name: string) => void;

  onClose?: () => void;
}

type GamePhase = 'ASSASSIN' | 'KING';

export const PokiMurderGame: React.FC<PokiMurderGameProps> = ({
  onBack,
  onExit,
  cardId = 29,
  deck,
  lowSpecMode = false,
  onClose
}) => {
  const handleExit = onExit || onBack || (() => {});
  const playerHeroId = deck?.[0]?.id || cardId || 29;

  // DOM Refs
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // UI State
  const [phase, setPhase] = useState<GamePhase>('ASSASSIN');
  const [chargePct, setChargePct] = useState(0);
  const [defendedCount, setDefendedCount] = useState(0);
  const [statusMsg, setStatusMsg] = useState('왕의 뒤를 밟으며 단검을 충전하세요!');
  const [showTutorial, setShowTutorial] = useState(true);
  const [gameWon, setGameWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  // Time & Score tracking
  const startTimeRef = useRef<number>(Date.now());
  const defendedRef = useRef<number>(0);

  // Internal Logic State
  const gameStateRef = useRef<{
    phase: GamePhase;
    isHolding: boolean;
    knifeCharge: number; // 0 ~ 100
    // King AI in Phase 1
    kingSuspectTimer: number;
    kingLookingBack: boolean;
    kingTurnTimer: number;
    // Assassin AI in Phase 2
    assassinTimer: number;
    assassinCharging: boolean;
    assassinCharge: number;
    assassinsCaught: number;
    // Animation
    walkCycle: number;
    particles: THREE.Points | null;
    particleVels: THREE.Vector3[];
    isTransitioning: boolean;
  }>({
    phase: 'ASSASSIN',
    isHolding: false,
    knifeCharge: 0,
    kingSuspectTimer: 3.2,
    kingLookingBack: false,
    kingTurnTimer: 0,
    assassinTimer: 2.5,
    assassinCharging: false,
    assassinCharge: 0,
    assassinsCaught: 0,
    walkCycle: 0,
    particles: null,
    particleVels: [],
    isTransitioning: false,
  });

  // Three.js References
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    kingGroup: THREE.Group;
    assassinGroup: THREE.Group;
    knifeMesh: THREE.Mesh;
    exclamationMesh: THREE.Mesh;
    guardLeft: THREE.Group;
    guardRight: THREE.Group;
    badgeSprite: THREE.Sprite | null;
    animFrameId: number;
  } | null>(null);

  // Confetti Burst Effect
  const spawnConfetti = useCallback(() => {
    const three = threeRef.current;
    if (!three) return;

    if (navigator.vibrate) navigator.vibrate([80, 40, 100, 50, 150]);

    const count = 50;
    const posArr = new Float32Array(count * 3);
    const colArr = new Float32Array(count * 3);
    const vels: THREE.Vector3[] = [];

    for (let i = 0; i < count; i++) {
      posArr[i * 3] = (Math.random() - 0.5) * 2;
      posArr[i * 3 + 1] = 2.0;
      posArr[i * 3 + 2] = -1.5 + (Math.random() - 0.5) * 2;

      const col = new THREE.Color().setHSL(Math.random(), 0.9, 0.6);
      colArr[i * 3] = col.r;
      colArr[i * 3 + 1] = col.g;
      colArr[i * 3 + 2] = col.b;

      vels.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 6,
          Math.random() * 5 + 3,
          (Math.random() - 0.5) * 6
        )
      );
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colArr, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.22,
      vertexColors: true,
      transparent: true,
      opacity: 1,
    });

    if (gameStateRef.current.particles) {
      three.scene.remove(gameStateRef.current.particles);
      gameStateRef.current.particles.geometry.dispose();
    }

    const pMesh = new THREE.Points(geo, mat);
    gameStateRef.current.particles = pMesh;
    gameStateRef.current.particleVels = vels;
    three.scene.add(pMesh);
  }, []);

  // Finish Game & Deposit Standardized Reward
  const finishGame = useCallback(
    (isVictory: boolean) => {
      const duration = Math.max(5, Math.floor((Date.now() - startTimeRef.current) / 1000));
      const finalScore = gameStateRef.current.phase === 'KING'
        ? 500 + defendedRef.current * 160
        : Math.floor(gameStateRef.current.knifeCharge * 4);

      const receipt = calculateAndDepositMissionReward({
        gameId: 'poki_murder',
        gameTitle: 'Murder 3D',
        durationSeconds: duration,
        score: Math.min(1000, finalScore),
        maxTargetScore: 1000,
        isVictory,
      });
      setRewardResult(receipt);
      if (isVictory) setGameWon(true);
      else setGameOver(true);
    },
    []
  );

  // Transition to Phase 2: King
  const transitionToKing = useCallback(() => {
    const s = gameStateRef.current;
    const three = threeRef.current;
    if (!three || s.isTransitioning) return;

    s.isTransitioning = true;
    s.phase = 'KING';
    s.isHolding = false;
    s.knifeCharge = 0;
    setChargePct(0);
    setPhase('KING');
    setStatusMsg('왕좌에 등극했습니다! 뒤에서 다가오는 암살자를 감시하세요.');
    spawnConfetti();

    // Attach Hero Badge on King's Crown
    if (three.badgeSprite) {
      three.kingGroup.add(three.badgeSprite);
      three.badgeSprite.position.set(0, 2.3, 0);
    }

    setTimeout(() => {
      s.isTransitioning = false;
      s.assassinTimer = 2.2;
      s.assassinCharge = 0;
      s.assassinCharging = false;
    }, 1800);
  }, [spawnConfetti]);

  // Three.js Scene Setup & Loop
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe3dbfc); // Royal Dark Wine/Purple
    scene.fog = new THREE.FogExp2(0xe3dbfc, 0.02);

    // 2. Camera (Side/Quarter Tracking View)
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(-6.8, 3.4, 0);
    camera.lookAt(0, 1.4, -0.6);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !lowSpecMode,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    if (!lowSpecMode) {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const goldChandelierLight = new THREE.PointLight(0xfef08a, 2.2, 18);
    goldChandelierLight.position.set(0, 6, 0);
    scene.add(goldChandelierLight);

    const dirLight = new THREE.DirectionalLight(0xffedd5, 1.2);
    dirLight.position.set(-5, 15, 8);
    if (!lowSpecMode) {
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
    }
    scene.add(dirLight);

    // 5. Royal Corridor Environment (Marble Floor & Red Carpet)
    const floorGeo = new THREE.PlaneGeometry(16, 32);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Dark slate marble
      roughness: 0.3,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = !lowSpecMode;
    scene.add(floor);

    // Red Velvet Carpet (Z: -16 to +16)
    const carpetMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b,
      roughness: 0.8,
    });
    const carpet = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 32), carpetMat);
    carpet.rotation.x = -Math.PI / 2;
    carpet.position.y = 0.015;
    carpet.receiveShadow = !lowSpecMode;
    scene.add(carpet);

    // Marble Columns
    const colMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 });
    [-3.8, 3.8].forEach((cx) => {
      [-8, 0, 8].forEach((cz) => {
        const column = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 7, 16), colMat);
        column.position.set(cx, 3.5, cz);
        column.castShadow = !lowSpecMode;
        scene.add(column);
      });
    });

    // 6. Build 3D King Character Mesh
    const kingGroup = new THREE.Group();
    const kRobeMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.5 }); // Crimson Royal Robe
    const kCapeMat = new THREE.MeshStandardMaterial({ color: 0xffffff }); // Ermine white trim
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xfde047 });

    // King Body (Plump King)
    const kBody = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 1.1, 16), kRobeMat);
    kBody.position.y = 0.85;
    kBody.castShadow = !lowSpecMode;
    kingGroup.add(kBody);

    // Cape Trim
    const kTrim = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.12, 8, 16), kCapeMat);
    kTrim.rotation.x = Math.PI / 2;
    kTrim.position.y = 1.35;
    kingGroup.add(kTrim);

    // Head
    const kHead = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 12), skinMat);
    kHead.position.y = 1.65;
    kingGroup.add(kHead);

    // White Beard
    const beard = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.5, 8), kCapeMat);
    beard.rotation.x = Math.PI;
    beard.position.set(0, 1.45, 0.28);
    kingGroup.add(beard);

    // Golden Crown
    const crownMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.2 });
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.32, 0.25, 8), crownMat);
    crown.position.y = 2.05;
    kingGroup.add(crown);

    // Suspicion Exclamation Mark [ ! ] 3D Mesh
    const exclamGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.45, 8);
    const exclamMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const exclamationMesh = new THREE.Mesh(exclamGeo, exclamMat);
    exclamationMesh.position.set(0, 2.5, 0);
    exclamationMesh.visible = false;
    kingGroup.add(exclamationMesh);

    // Start Position: King leads in front (Z: -1.8)
    kingGroup.position.set(0, 0, -1.8);
    scene.add(kingGroup);

    // 7. Build 3D Assassin Character Mesh
    const assassinGroup = new THREE.Group();
    const aRobeMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 }); // Stealth Cloak

    const aBody = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 1.1, 14), aRobeMat);
    aBody.position.y = 0.85;
    aBody.castShadow = !lowSpecMode;
    assassinGroup.add(aBody);

    const aHead = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 12), skinMat);
    aHead.position.y = 1.6;
    assassinGroup.add(aHead);

    // Dagger Mesh
    const knifeGeo = new THREE.BoxGeometry(0.08, 0.65, 0.04);
    const knifeMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.1 });
    const knifeMesh = new THREE.Mesh(knifeGeo, knifeMat);
    knifeMesh.position.set(0.42, 1.2, 0.25);
    assassinGroup.add(knifeMesh);

    // Start Position: Assassin stalks behind (Z: +1.8)
    assassinGroup.position.set(0, 0, 1.8);
    scene.add(assassinGroup);

    // 8. Royal Iron Armor Guards (For Arrest)
    const createGuard = () => {
      const g = new THREE.Group();
      const gMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.7 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.2, 0.45), gMat);
      body.position.y = 0.9;
      g.add(body);
      const spear = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.5, 8), gMat);
      spear.position.set(0.45, 1.25, 0);
      g.add(spear);
      return g;
    };
    const guardLeft = createGuard();
    guardLeft.position.set(-6, 0, 1.8);
    scene.add(guardLeft);

    const guardRight = createGuard();
    guardRight.position.set(6, 0, 1.8);
    scene.add(guardRight);

    // 9. Hero Card Sprite Badge
    const badgeCanvas = document.createElement('canvas');
    badgeCanvas.width = 64;
    badgeCanvas.height = 64;
    const heroCtx = badgeCanvas.getContext('2d');
    if (heroCtx) {
      drawCardSprite(heroCtx, playerHeroId, 0, 0, 64, 64);
    }
    const badgeTex = new THREE.CanvasTexture(badgeCanvas);
    const badgeSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: badgeTex, transparent: true }));
    badgeSprite.scale.set(0.65, 0.65, 0.65);
    badgeSprite.position.set(0, 2.15, 0);
    assassinGroup.add(badgeSprite); // Initially on Assassin

    threeRef.current = {
      scene,
      camera,
      renderer,
      kingGroup,
      assassinGroup,
      knifeMesh,
      exclamationMesh,
      guardLeft,
      guardRight,
      badgeSprite,
      animFrameId: 0,
    };

    // 10. Main Game Simulation Loop
    let lastTime = performance.now();
    const renderLoop = () => {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.08);
      lastTime = now;

      const s = gameStateRef.current;
      const three = threeRef.current;

      if (three && !gameOver && !gameWon) {
        s.walkCycle += dt * 4.5;
        const bob = Math.sin(s.walkCycle) * 0.04;

        if (s.phase === 'ASSASSIN') {
          // --- Phase 1: Player is Assassin ---
          three.kingGroup.position.y = bob;
          three.assassinGroup.position.y = bob;

          // Knife charge & raising
          if (s.isHolding) {
            s.knifeCharge = Math.min(100, s.knifeCharge + dt * 40);
            setChargePct(Math.round(s.knifeCharge));
            three.knifeMesh.position.set(0.42, 1.6 + s.knifeCharge * 0.005, 0.35);
            three.knifeMesh.rotation.x = -Math.PI / 3;

            // Successful 100% Stab!
            if (s.knifeCharge >= 100) {
              transitionToKing();
            }
          } else {
            s.knifeCharge = Math.max(0, s.knifeCharge - dt * 60);
            setChargePct(Math.round(s.knifeCharge));
            three.knifeMesh.position.set(0.35, 0.8, -0.15); // Hidden behind back
            three.knifeMesh.rotation.x = 0;
          }

          // King Suspicion & Turning AI
          s.kingSuspectTimer -= dt;
          if (s.kingSuspectTimer <= 0.9 && s.kingSuspectTimer > 0) {
            three.exclamationMesh.visible = true; // Exclamation warning!
          } else if (s.kingSuspectTimer <= 0) {
            s.kingLookingBack = true;
            three.exclamationMesh.visible = false;
            three.kingGroup.rotation.y = Math.PI; // Look back 180 deg!

            // Caught red-handed!
            if (s.isHolding && s.knifeCharge > 10) {
              if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
              finishGame(false);
              return;
            }

            s.kingTurnTimer += dt;
            if (s.kingTurnTimer > 1.2) {
              s.kingLookingBack = false;
              s.kingTurnTimer = 0;
              three.kingGroup.rotation.y = 0;
              s.kingSuspectTimer = 2.4 + Math.random() * 2.2;
            }
          }
        } else {
          // --- Phase 2: Player is King Defending Crown ---
          three.kingGroup.position.y = bob;
          three.assassinGroup.position.y = bob;

          // Player (King) Look Back Action
          if (s.isHolding) {
            three.kingGroup.rotation.y = Math.PI; // King turns around to catch!
            // Caught Assassin Red-Handed!
            if (s.assassinCharging && s.assassinCharge > 20) {
              s.assassinCharging = false;
              s.assassinCharge = 0;
              defendedRef.current++;
              setDefendedCount(defendedRef.current);
              s.assassinsCaught++;

              setStatusMsg(`암살자 체포 성공! (${s.assassinsCaught}/3)`);
              if (navigator.vibrate) navigator.vibrate([60, 40, 80]);

              // Guards arrest animation
              three.guardLeft.position.x = -1.2;
              three.guardRight.position.x = 1.2;
              setTimeout(() => {
                if (threeRef.current) {
                  threeRef.current.guardLeft.position.x = -6;
                  threeRef.current.guardRight.position.x = 6;
                }
              }, 1200);

              if (s.assassinsCaught >= 3) {
                // Victory! All 3 assassins thwarted
                finishGame(true);
                return;
              } else {
                s.assassinTimer = 2.2;
              }
            }
          } else {
            three.kingGroup.rotation.y = 0; // King faces forward
          }

          // Incoming Assassin AI
          s.assassinTimer -= dt;
          if (s.assassinTimer <= 0) {
            s.assassinCharging = true;
            s.assassinCharge += dt * 35;
            setChargePct(Math.round(s.assassinCharge));
            three.knifeMesh.position.set(0.42, 1.6 + s.assassinCharge * 0.005, 0.35);
            three.knifeMesh.rotation.x = -Math.PI / 3;

            // Assassin successfully stabs King!
            if (s.assassinCharge >= 100) {
              if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
              finishGame(false);
              return;
            }
          } else {
            three.knifeMesh.position.set(0.35, 0.8, -0.15); // Hidden
            three.knifeMesh.rotation.x = 0;
          }
        }

        // Particle Physics
        if (s.particles && s.particleVels.length > 0) {
          const posAttr = s.particles.geometry.getAttribute('position') as THREE.BufferAttribute;
          const posArr = posAttr.array as Float32Array;

          for (let i = 0; i < s.particleVels.length; i++) {
            const v = s.particleVels[i];
            posArr[i * 3] += v.x * dt;
            posArr[i * 3 + 1] += v.y * dt;
            posArr[i * 3 + 2] += v.z * dt;
            v.y -= 9.8 * dt;
          }
          posAttr.needsUpdate = true;
          (s.particles.material as THREE.PointsMaterial).opacity = Math.max(
            0,
            (s.particles.material as THREE.PointsMaterial).opacity - dt * 0.8
          );
        }

        three.renderer.render(three.scene, three.camera);
        three.animFrameId = requestAnimationFrame(renderLoop);
      }
    };
    threeRef.current.animFrameId = requestAnimationFrame(renderLoop);

    // Responsive Resize
    const handleResize = () => {
      if (!container || !threeRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      threeRef.current.camera.aspect = w / h;
      threeRef.current.camera.updateProjectionMatrix();
      threeRef.current.renderer.setSize(w, h, false);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (threeRef.current) {
        cancelAnimationFrame(threeRef.current.animFrameId);
        threeRef.current.renderer.dispose();
      }
    };
  }, [lowSpecMode, playerHeroId]);

  // Touch Hold Interactions
  const handlePointerDown = () => {
    gameStateRef.current.isHolding = true;
    if (navigator.vibrate) navigator.vibrate(15);
  };

  const handlePointerUp = () => {
    gameStateRef.current.isHolding = false;
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key.toLowerCase() === 'f') {
        gameStateRef.current.isHolding = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key.toLowerCase() === 'f') {
        gameStateRef.current.isHolding = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-[#e3dbfc] font-mono text-white"
    >
      {/* 3D WebGL Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* Top HUD */}
      <MinimalistMissionHUD
        onBack={handleExit}
        gameTitle="No.029 Murder 3D"
        score={phase === 'KING' ? 500 + defendedCount * 160 : Math.floor(chargePct * 4)}
        scoreLabel="권력 점수"
        targetLabel={phase === 'ASSASSIN' ? '왕 암살' : '왕좌 수호'}
        targetProgress={phase === 'ASSASSIN' ? `${chargePct}%` : `${defendedCount} / 3 체포`}
        onGiveUp={() => finishGame(false)}
      />

      {/* Status Overlay */}
      <div className="absolute top-16 left-4 right-4 flex items-center justify-between pointer-events-none">
        {/* Phase Badge */}
        <div className="bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-amber-500/40 flex items-center space-x-2 shadow-lg">
          <Crown className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-black text-amber-200">
            {phase === 'ASSASSIN' ? '1단계: 왕 암살' : '2단계: 왕좌 수호'}
          </span>
        </div>

        {/* Action Hint / Status */}
        <div className="bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-700 flex items-center space-x-1.5 shadow-lg">
          <span className="text-xs font-bold text-slate-200">{statusMsg}</span>
        </div>
      </div>

      {/* Center Charge Progress Bar (When Holding) */}
      <div className="absolute top-28 left-0 right-0 pointer-events-none flex justify-center">
        <div className="w-64 bg-slate-900/80 backdrop-blur-md p-2 rounded-2xl border border-slate-700 shadow-2xl flex flex-col items-center space-y-1">
          <div className="flex justify-between w-full text-[11px] font-bold text-slate-300">
            <span>{phase === 'ASSASSIN' ? '단검 충전' : '암살자 접근'}</span>
            <span className={chargePct > 70 ? 'text-rose-400 font-black' : 'text-amber-300'}>
              {chargePct}%
            </span>
          </div>
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-100 ${
                chargePct > 70 ? 'bg-rose-500' : 'bg-amber-400'
              }`}
              style={{ width: `${chargePct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Mobile Pure Touch Bottom Action Button */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-auto">
        <button
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          className={`w-24 h-24 rounded-3xl border-2 shadow-2xl flex flex-col items-center justify-center active:scale-90 transition-all ${
            phase === 'ASSASSIN'
              ? 'bg-gradient-to-tr from-rose-600 to-amber-600 border-rose-400'
              : 'bg-gradient-to-tr from-indigo-600 to-cyan-600 border-cyan-400'
          }`}
        >
          {phase === 'ASSASSIN' ? (
            <>
              <span className="text-3xl">🗡️</span>
              <span className="text-[11px] font-black text-white mt-0.5">찌르기 (HOLD)</span>
            </>
          ) : (
            <>
              <Eye className="w-8 h-8 text-cyan-200" />
              <span className="text-[11px] font-black text-white mt-0.5">뒤돌기 (HOLD)</span>
            </>
          )}
        </button>
      </div>

      {/* Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameTitle="머더 3D (Murder 3D: 왕 암살과 수호)"
          category="3D 코믹 잠입 심리 액션"
          guideSteps={[
            {
              title: '1단계: 왕 암살하기 (Hold to Charge)',
              desc: '화면이나 버튼을 길게 눌러 단검을 충전하세요. 왕 머리 위에 느낌표가 뜨고 뒤돌아볼 땐 손을 떼어 칼을 숨겨야 합니다!',
              iconType: 'GESTURES',
            },
            {
              title: '2단계: 왕좌 수호하기 (Watch your Back)',
              desc: '왕관을 쓴 후에는 뒤에서 몰래 접근하는 암살자를 주시하세요. 암살자가 칼을 빼드는 순간 뒤돌아보아 현행범으로 체포하세요!',
              iconType: 'GOAL',
            },
            {
              title: '왕국 수호 보상 (Rewards)',
              desc: '3명의 침입자를 모두 체포하여 왕좌를 지켜내고 트로피와 최대 50 SNS 보상을 쟁취하세요!',
              iconType: 'REWARDS',
            },
          ]}
          onStart={() => setShowTutorial(false)}
        />
      )}

      {/* Victory / Defeat Modal */}
      {(gameWon || gameOver) && (
        <VictoryRewardModal
          isOpen={gameWon || gameOver}
          reward={rewardResult}
          onClose={handleExit}
        />
      )}
    </div>
  );
};
