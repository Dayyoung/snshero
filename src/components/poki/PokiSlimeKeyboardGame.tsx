import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../../types';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';

interface PokiSlimeKeyboardGameProps {
  deck?: CardData[];
  language?: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit?: () => void;
  onBack?: () => void;
  onClose?: () => void;
  onReward?: (amount: number) => void;
}

interface KeycapData {
  mesh: THREE.Mesh;
  type: 'normal' | 'slime' | 'booster' | 'goal';
  label: string;
  originalY: number;
}

export const PokiSlimeKeyboardGame: React.FC<PokiSlimeKeyboardGameProps> = ({
  deck = [],
  language = 'ko',
  lowSpecMode = false,
  onExit,
  onBack,
  onClose,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 1;
  const handleExit = onExit || onBack || onClose || (() => {});
  const containerRef = useRef<HTMLDivElement>(null);

  // Game Play States
  const [score, setScore] = useState<number>(0);
  const [speedLevel, setSpeedLevel] = useState<number>(1);
  const [distance, setDistance] = useState<number>(0);
  const totalTrackLength = 350; // Total distance to reach ESC goal
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'victory' | 'gameover'>('ready');
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  // Mobile Touch Feedback State
  const [touchSteerVal, setTouchSteerVal] = useState<number>(0); // -1 (left) ~ +1 (right)
  const [isBoosting, setIsBoosting] = useState<boolean>(false);

  // References for Three.js Loop
  const stateRef = useRef({
    gameState: 'ready',
    score: 0,
    speedLevel: 1,
    playerPos: new THREE.Vector3(0, 2, 0),
    playerVel: new THREE.Vector3(0, 0, 0),
    isGrounded: false,
    inputLeft: false,
    inputRight: false,
    inputJump: false,
    inputBoost: false,
    touchStartX: 0,
    touchStartY: 0,
    touchCurrentX: 0,
    touchCurrentY: 0,
    isTouchingSteer: false,
  });

  // Sound generator
  const playBeep = useCallback((freq: number, dur: number) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch {
      // ignore
    }
  }, []);

  // Helper to create keyboard keycap texture with embossed letter
  const createKeycapTexture = (text: string, bgColor: string, textColor: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, 128, 128);
      ctx.lineWidth = 6;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.strokeRect(6, 6, 116, 116);
      ctx.fillStyle = textColor;
      ctx.font = 'bold 36px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 64, 64);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  };

  const handleStartGame = () => {
    stateRef.current.gameState = 'playing';
    stateRef.current.score = 0;
    stateRef.current.speedLevel = 1;
    stateRef.current.playerPos.set(0, 2, 0);
    stateRef.current.playerVel.set(0, 0, 0);
    setScore(0);
    setSpeedLevel(1);
    setDistance(0);
    setGameState('playing');
    setSettlementReceipt(null);
  };

  const handleVictory = useCallback(() => {
    stateRef.current.gameState = 'victory';
    setGameState('victory');
    playBeep(880, 0.4);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokislimekeyboard',
      gameTitle: 'Slime Keyboard Escape 3D',
      durationSeconds: 35,
      score: stateRef.current.score + 500,
      maxTargetScore: 1000,
      isVictory: true,
      difficulty: 'NORMAL',
    });
    setSettlementReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [playBeep, onReward]);

  // Main Jump Trigger
  const triggerJump = useCallback(() => {
    const s = stateRef.current;
    if (s.isGrounded && s.gameState === 'playing') {
      s.inputJump = true;
      playBeep(440, 0.08);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(20);
      }
    }
  }, [playBeep]);

  // Main Three.js Scene Setup & Animation Loop
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a); // Deep slate midnight
    scene.fog = new THREE.FogExp2(0x0f172a, 0.012);

    const initialW = container.clientWidth || window.innerWidth;
    const initialH = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(60, initialW / initialH, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(initialW, initialH);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(20, 40, 20);
    dirLight.castShadow = !lowSpecMode;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // 3. Build 3D Keyboard Track
    const keycaps: KeycapData[] = [];
    const keyboardLayout = [
      ['ESC', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'DEL'],
      ['~', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'BKSP'],
      ['TAB', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'ENTER'],
      ['CAPS', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', '\''],
      ['SHIFT', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', 'SHIFT'],
      ['CTRL', 'ALT', 'CMD', 'SPACE', 'SPACE', 'SPACE', 'CMD', 'ALT', 'CTRL'],
    ];

    const keyGeo = new THREE.BoxGeometry(2.4, 1.2, 2.4);

    let currentZ = 0;
    const rowSpacing = 3.8;
    const colSpacing = 3.2;

    while (currentZ < totalTrackLength) {
      const rowIndex = Math.floor((currentZ / rowSpacing) % keyboardLayout.length);
      const rowKeys = keyboardLayout[rowIndex];
      const startX = -((rowKeys.length - 1) * colSpacing) / 2;

      for (let col = 0; col < rowKeys.length; col++) {
        const keyLabel = rowKeys[col];
        const isGoal = currentZ >= totalTrackLength - 10 && col === Math.floor(rowKeys.length / 2);

        let type: 'normal' | 'slime' | 'booster' | 'goal' = 'normal';
        let keyColor = '#1e293b';
        let textColor = '#94a3b8';

        if (isGoal) {
          type = 'goal';
          keyColor = '#10b981';
          textColor = '#ffffff';
        } else if (Math.random() < 0.18 && currentZ > 20) {
          type = 'slime';
          keyColor = '#16a34a';
          textColor = '#86efac';
        } else if (Math.random() < 0.15 && currentZ > 15) {
          type = 'booster';
          keyColor = '#f59e0b';
          textColor = '#fef08a';
        }

        const mat = new THREE.MeshStandardMaterial({
          color: type === 'goal' ? 0x10b981 : type === 'slime' ? 0x22c55e : type === 'booster' ? 0xf59e0b : 0x334155,
          roughness: 0.3,
          metalness: 0.2,
          map: createKeycapTexture(keyLabel, keyColor, textColor),
        });

        const keyMesh = new THREE.Mesh(keyGeo, mat);
        const posX = startX + col * colSpacing + (Math.random() - 0.5) * 0.4;
        const posY = 0;
        const posZ = currentZ;

        keyMesh.position.set(posX, posY, posZ);
        keyMesh.castShadow = !lowSpecMode;
        keyMesh.receiveShadow = !lowSpecMode;
        scene.add(keyMesh);

        keycaps.push({ mesh: keyMesh, type, label: keyLabel, originalY: posY });
      }

      currentZ += rowSpacing;
    }

    // 4. Player Slime Mesh
    const slimeGroup = new THREE.Group();
    const slimeGeo = new THREE.SphereGeometry(0.85, 24, 24);
    const slimeMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      roughness: 0.15,
      metalness: 0.1,
      transparent: true,
      opacity: 0.92,
    });
    const slimeBody = new THREE.Mesh(slimeGeo, slimeMat);
    slimeBody.position.y = 0.85;
    slimeBody.castShadow = !lowSpecMode;
    slimeGroup.add(slimeBody);

    // Hero Badge Sprite
    const heroCanvas = document.createElement('canvas');
    heroCanvas.width = 128;
    heroCanvas.height = 128;
    const heroCtx = heroCanvas.getContext('2d');
    if (heroCtx) {
      heroCtx.fillStyle = '#0f172a';
      heroCtx.beginPath();
      heroCtx.arc(64, 64, 60, 0, Math.PI * 2);
      heroCtx.fill();
      heroCtx.lineWidth = 6;
      heroCtx.strokeStyle = '#10b981';
      heroCtx.stroke();
      drawCardSprite(heroCtx, playerHeroId, 16, 16, 96, 96);
    }
    const heroTex = new THREE.CanvasTexture(heroCanvas);
    const heroSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: heroTex }));
    heroSprite.position.set(0, 2.3, 0);
    heroSprite.scale.set(1.4, 1.4, 1.4);
    slimeGroup.add(heroSprite);

    scene.add(slimeGroup);

    // Goal Portal Mesh
    const portalGeo = new THREE.TorusGeometry(3.5, 0.4, 16, 32);
    const portalMat = new THREE.MeshStandardMaterial({ color: 0x34d399, roughness: 0.2, metalness: 0.8 });
    const portalMesh = new THREE.Mesh(portalGeo, portalMat);
    portalMesh.position.set(0, 3, totalTrackLength);
    scene.add(portalMesh);

    // 5. Robust ResizeObserver for Zero-Distortion on Mobile Screen/Viewport Changes
    const updateSize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
      }
    };

    const resizeObserver = new ResizeObserver(() => updateSize());
    resizeObserver.observe(container);
    window.addEventListener('resize', updateSize);
    window.addEventListener('orientationchange', () => setTimeout(updateSize, 100));

    // 6. Keyboard Controls
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') stateRef.current.inputLeft = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') stateRef.current.inputRight = true;
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') triggerJump();
      if (e.key === 'Shift') stateRef.current.inputBoost = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') stateRef.current.inputLeft = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') stateRef.current.inputRight = false;
      if (e.key === 'Shift') stateRef.current.inputBoost = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // 7. Physics & Game Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = Math.min(0.05, clock.getDelta());
      const s = stateRef.current;

      // Rotate goal portal
      portalMesh.rotation.z += 0.03;

      if (s.gameState === 'playing') {
        // Base forward speed scales with speedLevel and boost
        const boostMult = s.inputBoost ? 1.65 : 1.0;
        const forwardSpeed = (12 + s.speedLevel * 2.2) * boostMult;
        s.playerPos.z += forwardSpeed * delta;

        // Horizontal steer
        const steerSpeed = 9.5;
        if (s.inputLeft) s.playerPos.x -= steerSpeed * delta;
        if (s.inputRight) s.playerPos.x += steerSpeed * delta;
        s.playerPos.x = THREE.MathUtils.clamp(s.playerPos.x, -7.5, 7.5);

        // Jump & Gravity Physics
        const gravity = -32.0;
        s.playerVel.y += gravity * delta;
        s.playerPos.y += s.playerVel.y * delta;

        // Check Collision with Keycaps
        s.isGrounded = false;

        for (const k of keycaps) {
          const dx = Math.abs(s.playerPos.x - k.mesh.position.x);
          const dz = Math.abs(s.playerPos.z - k.mesh.position.z);

          if (dx < 1.4 && dz < 1.4) {
            const keyTopY = k.mesh.position.y + 0.6;
            if (s.playerPos.y >= keyTopY && s.playerPos.y + s.playerVel.y * delta <= keyTopY + 0.3) {
              s.playerPos.y = keyTopY;
              s.playerVel.y = 0;
              s.isGrounded = true;

              k.mesh.position.y = -0.25;

              if (k.type === 'booster') {
                s.speedLevel = Math.min(10, s.speedLevel + 1);
                s.score += 50;
                setSpeedLevel(s.speedLevel);
                playBeep(660, 0.15);
              } else if (k.type === 'slime') {
                s.speedLevel = Math.max(1, s.speedLevel - 1);
                setSpeedLevel(s.speedLevel);
                playBeep(220, 0.2);
              }
              break;
            }
          } else {
            k.mesh.position.y = THREE.MathUtils.lerp(k.mesh.position.y, k.originalY, 0.2);
          }
        }

        if (s.isGrounded) {
          if (s.inputJump) {
            s.playerVel.y = 15.0;
            s.inputJump = false;
          } else {
            s.playerVel.y = 7.5; // Natural bouncy hop
          }
        }

        const stretchY = 0.85 + (s.playerVel.y > 0 ? 0.25 : -0.15);
        slimeBody.scale.set(1.1 / Math.sqrt(stretchY), stretchY, 1.1 / Math.sqrt(stretchY));

        if (s.playerPos.y < -12) {
          s.gameState = 'gameover';
          setGameState('gameover');
          playBeep(180, 0.5);
          const receipt = calculateAndDepositMissionReward({
            gameId: 'pokislimekeyboard',
            gameTitle: 'Slime Keyboard Escape 3D',
            durationSeconds: 25,
            score: s.score + Math.round(s.playerPos.z * 2),
            maxTargetScore: 1000,
            isVictory: false,
            difficulty: 'NORMAL',
          });
          setSettlementReceipt(receipt);
          if (onReward) onReward(receipt.totalSns);
        }

        if (s.playerPos.z >= totalTrackLength - 2) {
          handleVictory();
          return;
        }

        s.score += Math.round(forwardSpeed * delta * 2);
        setScore(s.score);
        setDistance(Math.min(totalTrackLength, Math.round(s.playerPos.z)));
      }

      slimeGroup.position.copy(s.playerPos);

      const targetCamX = s.playerPos.x * 0.5;
      const targetCamY = s.playerPos.y + 4.5;
      const targetCamZ = s.playerPos.z - 7.5;

      camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetCamX, 0.12);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetCamY, 0.12);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCamZ, 0.12);
      camera.lookAt(s.playerPos.x, s.playerPos.y + 1, s.playerPos.z + 8);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      renderer.dispose();
    };
  }, [lowSpecMode, handleVictory, playBeep, totalTrackLength, playerHeroId, triggerJump, onReward]);

  // Touch Handlers on Left Steer Zone
  const handleSteerTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const s = stateRef.current;
    s.isTouchingSteer = true;
    s.touchStartX = touch.clientX;
    s.touchStartY = touch.clientY;
    s.touchCurrentX = touch.clientX;
    s.touchCurrentY = touch.clientY;
  };

  const handleSteerTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const s = stateRef.current;
    if (!s.isTouchingSteer) return;

    s.touchCurrentX = touch.clientX;
    const diffX = s.touchCurrentX - s.touchStartX;

    // Normalizing -1 ~ +1
    const clampedDiff = Math.max(-50, Math.min(50, diffX));
    setTouchSteerVal(clampedDiff / 50);

    if (diffX < -10) {
      s.inputLeft = true;
      s.inputRight = false;
    } else if (diffX > 10) {
      s.inputRight = true;
      s.inputLeft = false;
    } else {
      s.inputLeft = false;
      s.inputRight = false;
    }
  };

  const handleSteerTouchEnd = () => {
    const s = stateRef.current;
    s.isTouchingSteer = false;
    s.inputLeft = false;
    s.inputRight = false;
    setTouchSteerVal(0);
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] bg-slate-950 select-none overflow-hidden font-mono touch-none">
      {/* 3D WebGL Canvas Viewport - Absolute Inset for Zero Pixel Misalignment */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* Minimalist Mission HUD */}
      <MinimalistMissionHUD
        gameTitle={isKo ? 'No.01 슬라임 키보드 탈출 3D' : 'No.01 Slime Keyboard Escape 3D'}
        score={score}
        targetScore={1000}
        language={language}
        onExit={() => {
          const receipt = calculateAndDepositMissionReward({
            gameId: 'pokislimekeyboard',
            gameTitle: 'Slime Keyboard Escape 3D',
            durationSeconds: 20,
            score: score + Math.round(distance * 2),
            maxTargetScore: 1000,
            isVictory: false,
            difficulty: 'NORMAL',
          });
          setSettlementReceipt(receipt);
          if (onReward) onReward(receipt.totalSns);
          handleExit();
        }}
      />

      {/* Speed & Momentum Status Bar */}
      {gameState === 'playing' && (
        <div className="absolute top-16 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-sm text-xs text-amber-300 shadow-md">
            <span>⚡ SPEED:</span>
            <span className="text-emerald-400 font-bold">+{speedLevel}x</span>
            <div className="w-16 bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700">
              <div
                className="bg-emerald-500 h-full transition-all duration-150"
                style={{ width: `${(speedLevel / 10) * 100}%` }}
              />
            </div>
          </div>

          <div className="px-3 py-1.5 bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-sm text-xs text-slate-200 shadow-md">
            <span className="text-emerald-400 font-bold">{distance}m</span>
            <span className="text-slate-400"> / {totalTrackLength}m</span>
          </div>
        </div>
      )}

      {/* Full-Screen Touch Control Zones for 100% Mobile Playability */}
      {gameState === 'playing' && (
        <div className="absolute inset-0 pointer-events-none z-20 flex">
          {/* Left 50% Touch Steer Pad with Visual Joystick Indicator */}
          <div
            className="w-1/2 h-full pointer-events-auto flex items-end p-6"
            onTouchStart={handleSteerTouchStart}
            onTouchMove={handleSteerTouchMove}
            onTouchEnd={handleSteerTouchEnd}
          >
            <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/80 rounded-sm p-3 flex flex-col items-center gap-2 shadow-xl">
              <div className="text-[10px] text-slate-400 font-bold tracking-wider">
                {isKo ? '◀ 좌우 슬라이드 조향 ▶' : '◀ SLIDE TO STEER ▶'}
              </div>
              <div className="w-28 h-3 bg-slate-800 rounded-full overflow-hidden relative border border-slate-700">
                <div
                  className="absolute top-0 bottom-0 w-6 bg-emerald-400 rounded-full transition-all duration-75"
                  style={{
                    left: `${50 + touchSteerVal * 40}%`,
                    transform: 'translateX(-50%)',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Right 50% Action Controls: Giant JUMP & BOOST Buttons */}
          <div className="w-1/2 h-full pointer-events-none flex flex-col justify-end items-end p-6 gap-3">
            {/* Boost Toggle/Hold Button */}
            <button
              type="button"
              className={`pointer-events-auto w-20 h-14 rounded-sm font-black text-xs flex flex-col items-center justify-center border-2 shadow-2xl transition-all active:scale-95 cursor-pointer ${
                isBoosting
                  ? 'bg-amber-500 border-amber-300 text-slate-950 animate-pulse'
                  : 'bg-slate-900/90 border-amber-500/80 text-amber-400 active:bg-amber-600'
              }`}
              onTouchStart={() => {
                stateRef.current.inputBoost = true;
                setIsBoosting(true);
              }}
              onTouchEnd={() => {
                stateRef.current.inputBoost = false;
                setIsBoosting(false);
              }}
              onMouseDown={() => {
                stateRef.current.inputBoost = true;
                setIsBoosting(true);
              }}
              onMouseUp={() => {
                stateRef.current.inputBoost = false;
                setIsBoosting(false);
              }}
            >
              <span className="text-base">⚡</span>
              <span>BOOST</span>
            </button>

            {/* Giant Jump Button */}
            <button
              type="button"
              onClick={triggerJump}
              className="pointer-events-auto w-24 h-24 rounded-sm bg-emerald-500 active:bg-emerald-600 text-slate-950 font-black border-2 border-emerald-300 shadow-2xl flex flex-col items-center justify-center transition-all active:scale-90 cursor-pointer"
            >
              <span className="text-3xl">🦘</span>
              <span className="text-xs tracking-wider mt-1 font-mono">JUMP</span>
            </button>
          </div>
        </div>
      )}

      {/* Ready Start Screen */}
      {gameState === 'ready' && (
        <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center font-mono">
          <div className="w-16 h-16 mb-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-3xl shadow-xl animate-bounce">
            ⌨️
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight mb-2 uppercase">
            [ Slime Keyboard Escape 3D ]
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mb-6 leading-relaxed">
            {isKo
              ? '거대한 3D 기계식 키보드 자판 위를 점프하며 탈출하세요! 멈추지 않고 달릴수록 스피드가 폭발적으로 증가합니다. 슬라임 트랩을 피하고 +SPEED 부스터를 밟아 [ESC] 골 포털에 도달하세요!'
              : 'Jump across massive 3D computer keyboard keys! Build insane speed as you dodge slime traps and reach the final [ESC] portal!'}
          </p>
          <button
            onClick={handleStartGame}
            className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-base rounded-sm shadow-xl transition-all cursor-pointer"
          >
            {isKo ? '3D 탈출 시작 [START]' : 'ESCAPE NOW [START]'}
          </button>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 z-30 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center font-mono">
          <div className="text-4xl mb-2">💥</div>
          <h2 className="text-2xl font-black text-rose-500 tracking-tight mb-2 uppercase">
            {isKo ? '[ 키보드 틈새로 낙사! ]' : '[ FALLEN OFF KEYBOARD ]'}
          </h2>
          <p className="text-xs text-slate-300 mb-4">
            {isKo ? `도달 거리: ${distance}m | 획득 점수: ${score} PT` : `Distance: ${distance}m | Score: ${score} PT`}
          </p>
          {settlementReceipt && (
            <div className="bg-slate-900/90 border border-slate-700 p-3 rounded-sm mb-5 text-xs text-slate-300">
              <span className="text-slate-400">{isKo ? '탈출 진행 보상: ' : 'Progress Reward: '}</span>
              <span className="text-amber-400 font-bold">+{settlementReceipt.totalSns} SNS</span>
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleStartGame}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-sm cursor-pointer transition-all"
            >
              {isKo ? '다시 도전' : 'Try Again'}
            </button>
            <button
              onClick={handleExit}
              className="px-6 py-2.5 border border-white/20 hover:bg-white/10 text-white font-bold text-xs rounded-sm cursor-pointer transition-all"
            >
              {isKo ? '미션 리스트' : 'Mission List'}
            </button>
          </div>
        </div>
      )}

      {/* Victory Reward Modal */}
      {gameState === 'victory' && settlementReceipt && (
        <VictoryRewardModal
          isOpen={true}
          receipt={settlementReceipt}
          language={language}
          onConfirm={handleExit}
        />
      )}
    </div>
  );
};

export default PokiSlimeKeyboardGame;
