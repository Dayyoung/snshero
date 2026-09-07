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
  language = 'ko',
  lowSpecMode = false,
  onExit,
  onBack,
  onClose,
}) => {
  const isKo = language === 'ko';
  const handleExit = onExit || onBack || onClose || (() => {});
  const containerRef = useRef<HTMLDivElement>(null);

  // Game Play States
  const [score, setScore] = useState<number>(0);
  const [speedLevel, setSpeedLevel] = useState<number>(1);
  const [distance, setDistance] = useState<number>(0);
  const totalTrackLength = 350; // Total distance to reach ESC goal
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'victory' | 'gameover'>('ready');
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

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
    inputForward: false,
    inputJump: false,
    inputBoost: false,
    touchStartX: 0,
    touchCurrentX: 0,
    isTouching: false,
    touchHoldTime: 0,
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
  }, [playBeep]);

  // Main Three.js Scene Setup & Animation Loop
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a); // Deep slate midnight
    scene.fog = new THREE.FogExp2(0x0f172a, 0.012);

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
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
      ['SHIFT', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', 'UP', 'SHIFT'],
      ['CTRL', 'WIN', 'ALT', 'SPACE', 'SPACE', 'ALT', 'FN', 'LEFT', 'DOWN', 'RIGHT']
    ];

    const keyCapGeo = new THREE.BoxGeometry(2.6, 1.2, 2.6);
    const keyCapMaterials = {
      normal: new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.2 }),
      slime: new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.1, metalness: 0.1, emissive: 0x059669, emissiveIntensity: 0.4 }),
      booster: new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.2, metalness: 0.5, emissive: 0xd97706, emissiveIntensity: 0.6 }),
      goal: new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.1, metalness: 0.4, emissive: 0xbe185d, emissiveIntensity: 0.8 }),
    };

    // Generate tracks of keys stretching forward (Z axis)
    let currentZ = 0;

    while (currentZ < totalTrackLength) {
      for (let col = -2; col <= 2; col++) {
        // Random gaps for obby platforming
        if (currentZ > 15 && Math.random() < 0.25) continue;

        const posX = col * 3.2;
        const posZ = currentZ;
        const isNearGoal = currentZ >= totalTrackLength - 10;

        let type: 'normal' | 'slime' | 'booster' | 'goal' = 'normal';
        let label = keyboardLayout[Math.floor(Math.random() * keyboardLayout.length)][Math.floor(Math.random() * 8)] || 'KEY';

        if (isNearGoal) {
          type = 'goal';
          label = 'ESC GOAL';
        } else if (Math.random() < 0.18) {
          type = 'booster';
          label = '+SPEED';
        } else if (Math.random() < 0.22) {
          type = 'slime';
          label = 'SLIME';
        }

        const mesh = new THREE.Mesh(keyCapGeo, keyCapMaterials[type].clone());
        mesh.position.set(posX, 0, posZ);
        mesh.castShadow = !lowSpecMode;
        mesh.receiveShadow = !lowSpecMode;

        // Apply textured key label on top face
        const topTexture = createKeycapTexture(
          label,
          type === 'booster' ? '#f59e0b' : type === 'slime' ? '#10b981' : type === 'goal' ? '#ec4899' : '#1e293b',
          '#ffffff'
        );
        (mesh.material as THREE.MeshStandardMaterial).map = topTexture;
        (mesh.material as THREE.MeshStandardMaterial).needsUpdate = true;

        scene.add(mesh);
        keycaps.push({
          mesh,
          type,
          label,
          originalY: 0,
        });
      }
      currentZ += 3.8;
    }

    // Add Goal Portal Ring at the end
    const portalGeo = new THREE.TorusGeometry(3.5, 0.4, 16, 64);
    const portalMat = new THREE.MeshStandardMaterial({
      color: 0xec4899,
      emissive: 0xf43f5e,
      emissiveIntensity: 1.2,
      roughness: 0.1,
    });
    const portalMesh = new THREE.Mesh(portalGeo, portalMat);
    portalMesh.position.set(0, 3, totalTrackLength - 2);
    scene.add(portalMesh);

    // 4. Slime 3D Player Mesh
    const slimeGroup = new THREE.Group();
    const slimeGeo = new THREE.SphereGeometry(1, 24, 24);
    slimeGeo.scale(1.1, 0.85, 1.1); // Squishy proportions
    const slimeMat = new THREE.MeshStandardMaterial({
      color: 0x34d399,
      roughness: 0.15,
      metalness: 0.1,
      transparent: true,
      opacity: 0.92,
      emissive: 0x059669,
      emissiveIntensity: 0.3,
    });
    const slimeBody = new THREE.Mesh(slimeGeo, slimeMat);
    slimeBody.castShadow = !lowSpecMode;
    slimeGroup.add(slimeBody);

    // Inner Glowing Core
    const coreGeo = new THREE.SphereGeometry(0.4, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x6ee7b7 });
    const slimeCore = new THREE.Mesh(coreGeo, coreMat);
    slimeGroup.add(slimeCore);

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.18, 12, 12);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.35, 0.25, 0.85);
    const leftPupil = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), pupilMat);
    leftPupil.position.set(-0.35, 0.28, 0.98);
    slimeGroup.add(leftEye);
    slimeGroup.add(leftPupil);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.35, 0.25, 0.85);
    const rightPupil = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), pupilMat);
    rightPupil.position.set(0.35, 0.28, 0.98);
    slimeGroup.add(rightEye);
    slimeGroup.add(rightPupil);

    // SNSHero Card No.01 Emblem Badge
    const heroCardCanvas = document.createElement('canvas');
    heroCardCanvas.width = 120;
    heroCardCanvas.height = 120;
    const heroCtx = heroCardCanvas.getContext('2d');
    if (heroCtx) {
      drawCardSprite(heroCtx, 1, 10, 10, 100, 100);
    }
    const cardTexture = new THREE.CanvasTexture(heroCardCanvas);
    const badgeMat = new THREE.SpriteMaterial({ map: cardTexture, transparent: true });
    const heroBadge = new THREE.Sprite(badgeMat);
    heroBadge.position.set(0, 1.8, 0);
    heroBadge.scale.set(1.2, 1.2, 1.2);
    slimeGroup.add(heroBadge);

    scene.add(slimeGroup);

    // 5. Input Listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') stateRef.current.inputLeft = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') stateRef.current.inputRight = true;
      if (e.code === 'ArrowUp' || e.code === 'KeyW') stateRef.current.inputForward = true;
      if (e.code === 'Space') {
        stateRef.current.inputJump = true;
        e.preventDefault();
      }
      if (e.shiftKey) stateRef.current.inputBoost = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') stateRef.current.inputLeft = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') stateRef.current.inputRight = false;
      if (e.code === 'ArrowUp' || e.code === 'KeyW') stateRef.current.inputForward = false;
      if (e.code === 'Space') stateRef.current.inputJump = false;
      if (!e.shiftKey) stateRef.current.inputBoost = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Touch Listeners for 100% Mobile Pure Gesture
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      stateRef.current.touchStartX = touch.clientX;
      stateRef.current.touchCurrentX = touch.clientX;
      stateRef.current.isTouching = true;
      stateRef.current.touchHoldTime = Date.now();
      stateRef.current.inputJump = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!stateRef.current.isTouching) return;
      const touch = e.touches[0];
      stateRef.current.touchCurrentX = touch.clientX;
      const diffX = stateRef.current.touchCurrentX - stateRef.current.touchStartX;

      // Smooth horizontal steer
      if (diffX < -15) {
        stateRef.current.inputLeft = true;
        stateRef.current.inputRight = false;
      } else if (diffX > 15) {
        stateRef.current.inputRight = true;
        stateRef.current.inputLeft = false;
      } else {
        stateRef.current.inputLeft = false;
        stateRef.current.inputRight = false;
      }

      // Long hold triggers speed boost
      if (Date.now() - stateRef.current.touchHoldTime > 400) {
        stateRef.current.inputBoost = true;
      }
    };

    const handleTouchEnd = () => {
      stateRef.current.isTouching = false;
      stateRef.current.inputLeft = false;
      stateRef.current.inputRight = false;
      stateRef.current.inputJump = false;
      stateRef.current.inputBoost = false;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    // 6. Resize Handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

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
        const boostMult = s.inputBoost ? 1.6 : 1.0;
        const forwardSpeed = (12 + s.speedLevel * 2.2) * boostMult;
        s.playerPos.z += forwardSpeed * delta;

        // Horizontal steer
        const steerSpeed = 9.0;
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
                playBeep(660, 0.1);
              } else if (k.type === 'slime') {
                s.speedLevel = Math.max(1, s.speedLevel - 1);
                setSpeedLevel(s.speedLevel);
                playBeep(240, 0.1);
              } else if (k.type === 'goal') {
                handleVictory();
                return;
              }
              break;
            }
          } else {
            k.mesh.position.y = THREE.MathUtils.lerp(k.mesh.position.y, k.originalY, 0.2);
          }
        }

        if (s.isGrounded) {
          if (s.inputJump) {
            s.playerVel.y = 14.5;
            playBeep(440, 0.08);
            s.inputJump = false;
          } else {
            s.playerVel.y = 7.5;
          }
        }

        const stretchY = 0.85 + (s.playerVel.y > 0 ? 0.25 : -0.15);
        slimeBody.scale.set(1.1 / Math.sqrt(stretchY), stretchY, 1.1 / Math.sqrt(stretchY));

        if (s.playerPos.y < -12) {
          s.gameState = 'gameover';
          setGameState('gameover');
          playBeep(180, 0.5);
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
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      renderer.dispose();
    };
  }, [lowSpecMode, handleVictory, playBeep, totalTrackLength]);

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col items-center select-none overflow-hidden font-mono">
      <MinimalistMissionHUD
        title={isKo ? 'No.01 슬라임 키보드 탈출 3D' : 'No.01 Slime Keyboard Escape 3D'}
        currentScore={score}
        targetScore={1000}
        scoreUnit="PT"
        stageInfo={`SPEED: Lv.${speedLevel} | DIST: ${distance}/${totalTrackLength}m`}
        onExit={handleExit}
      />

      {/* Main Three.js 3D Viewport */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing touch-none" />

      {/* Speed & Momentum HUD Meter */}
      {gameState === 'playing' && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1 pointer-events-none">
          <div className="px-4 py-1.5 bg-black/70 backdrop-blur-md border border-white/20 rounded-full text-xs font-bold text-amber-300 flex items-center gap-2 shadow-lg">
            <span>⚡ SPEED ACCUMULATION:</span>
            <span className="text-emerald-400 font-black text-sm">+{speedLevel}x</span>
            <div className="w-20 bg-slate-800 h-2 rounded-full overflow-hidden border border-white/20">
              <div
                className="bg-gradient-to-r from-emerald-500 to-amber-400 h-full transition-all duration-150"
                style={{ width: `${(speedLevel / 10) * 100}%` }}
              />
            </div>
          </div>
          <div className="text-[10px] text-slate-400 font-mono tracking-wide">
            {isKo ? '화면 드래그: 조향 | 탭: 점프 | 롱탭: 부스트' : 'Drag: Steer | Tap: Jump | Hold: Boost'}
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
          <p className="text-xs text-slate-300 mb-5">
            {isKo ? `도달 거리: ${distance}m | 획득 점수: ${score} PT` : `Distance: ${distance}m | Score: ${score} PT`}
          </p>
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
          receipt={settlementReceipt}
          language={language}
          onPlayAgain={handleStartGame}
          onExit={handleExit}
        />
      )}
    </div>
  );
};

export default PokiSlimeKeyboardGame;
