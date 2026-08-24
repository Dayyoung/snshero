import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { SportsMissionTutorial } from './SportsMissionTutorial';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelBadmintonBlitzGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelBadmintonBlitzGame: React.FC<VoxelBadmintonBlitzGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_badminton_blitz') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [playerScore, setPlayerScore] = useState<number>(0);
  const [aiScore, setAiScore] = useState<number>(0);
  const [rallyCount, setRallyCount] = useState<number>(0);
  const [lastSmashSpeed, setLastSmashSpeed] = useState<number>(0);
  const [rallyText, setRallyText] = useState<string>('');
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    playerPos: new THREE.Vector3(0, 0, 4.5),
    targetPlayerX: 0,
    targetPlayerZ: 4.5,
    aiPos: new THREE.Vector3(0, 0, -4.5),
    aiTargetX: 0,
    aiTargetZ: -4.5,
    shuttlePos: new THREE.Vector3(0, 1.8, 3.5),
    shuttleVel: new THREE.Vector3(0, 0, 0),
    isRallyActive: false,
    servingPlayer: true,
    playerScore: 0,
    aiScore: 0,
    rally: 0,
    maxRally: 0,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    playerMesh: null as THREE.Group | null,
    aiMesh: null as THREE.Group | null,
    shuttleMesh: null as THREE.Group | null,
    playerRacketSwing: 0,
    aiRacketSwing: 0
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    scene.fog = new THREE.Fog(0x0f172a, 15, 45);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 6.5, 9.5);
    camera.lookAt(0, 1.0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    container.appendChild(renderer.domElement);

    // Court Lights
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x334155, 0.85);
    scene.add(hemiLight);

    const courtSpot = new THREE.SpotLight(0xffffff, 2.2);
    courtSpot.position.set(0, 12, 0);
    courtSpot.castShadow = !lowSpecMode;
    scene.add(courtSpot);

    // Voxel Badminton Court (Mat: Green 0x15803d)
    const courtGeo = new THREE.PlaneGeometry(6.1, 13.4);
    const courtMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 });
    const courtMesh = new THREE.Mesh(courtGeo, courtMat);
    courtMesh.rotation.x = -Math.PI / 2;
    courtMesh.receiveShadow = !lowSpecMode;
    scene.add(courtMesh);

    // Net
    const netGroup = new THREE.Group();
    const netGeo = new THREE.PlaneGeometry(6.1, 1.55);
    const netMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.6,
      roughness: 0.3
    });
    const netMesh = new THREE.Mesh(netGeo, netMat);
    netMesh.position.set(0, 0.775, 0);
    netGroup.add(netMesh);
    scene.add(netGroup);

    // Player Voxel Avatar
    const playerGroup = new THREE.Group();
    const pBodyGeo = new THREE.BoxGeometry(0.8, 1.2, 0.5);
    const pBodyMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });
    const pBody = new THREE.Mesh(pBodyGeo, pBodyMat);
    pBody.position.y = 1.0;
    playerGroup.add(pBody);

    const pRacketGeo = new THREE.BoxGeometry(0.1, 0.7, 0.4);
    const pRacketMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b });
    const pRacket = new THREE.Mesh(pRacketGeo, pRacketMat);
    pRacket.position.set(0.6, 1.1, -0.4);
    playerGroup.add(pRacket);

    playerGroup.position.copy(stateRef.current.playerPos);
    scene.add(playerGroup);
    stateRef.current.playerMesh = playerGroup;

    // AI Voxel Avatar
    const aiGroup = new THREE.Group();
    const aiBodyGeo = new THREE.BoxGeometry(0.8, 1.2, 0.5);
    const aiBodyMat = new THREE.MeshStandardMaterial({ color: 0xe11d48 });
    const aiBody = new THREE.Mesh(aiBodyGeo, aiBodyMat);
    aiBody.position.y = 1.0;
    aiGroup.add(aiBody);

    const aiRacket = new THREE.Mesh(pRacketGeo, pRacketMat);
    aiRacket.position.set(-0.6, 1.1, 0.4);
    aiGroup.add(aiRacket);

    aiGroup.position.copy(stateRef.current.aiPos);
    scene.add(aiGroup);
    stateRef.current.aiMesh = aiGroup;

    // Shuttlecock
    const shuttleGroup = new THREE.Group();
    const sHead = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    const sSkirt = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.25, 8), new THREE.MeshStandardMaterial({ color: 0xfacc15, wireframe: true }));
    sSkirt.position.y = 0.12;
    shuttleGroup.add(sHead);
    shuttleGroup.add(sSkirt);
    shuttleGroup.position.copy(stateRef.current.shuttlePos);
    scene.add(shuttleGroup);
    stateRef.current.shuttleMesh = shuttleGroup;

    let animId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;

      // Lerp Player Position
      s.playerPos.x = THREE.MathUtils.lerp(s.playerPos.x, s.targetPlayerX, dt * 14);
      s.playerPos.z = THREE.MathUtils.lerp(s.playerPos.z, s.targetPlayerZ, dt * 14);
      if (s.playerMesh) s.playerMesh.position.copy(s.playerPos);

      // AI Logic
      if (s.isRallyActive) {
        if (s.shuttleVel.z < 0) {
          s.aiTargetX = THREE.MathUtils.clamp(s.shuttlePos.x + (Math.random() - 0.5) * 0.4, -2.6, 2.6);
          s.aiTargetZ = THREE.MathUtils.clamp(s.shuttlePos.z - 0.4, -6.0, -2.0);
        } else {
          s.aiTargetX = THREE.MathUtils.lerp(s.aiTargetX, 0, dt * 2);
          s.aiTargetZ = THREE.MathUtils.lerp(s.aiTargetZ, -4.5, dt * 2);
        }
        s.aiPos.x = THREE.MathUtils.lerp(s.aiPos.x, s.aiTargetX, dt * 8);
        s.aiPos.z = THREE.MathUtils.lerp(s.aiPos.z, s.aiTargetZ, dt * 8);
        if (s.aiMesh) s.aiMesh.position.copy(s.aiPos);
      }

      // Shuttlecock Physics
      if (s.isRallyActive) {
        s.shuttlePos.addScaledVector(s.shuttleVel, dt);
        s.shuttleVel.y -= 14.5 * dt; // Gravity
        s.shuttleVel.x *= 0.99;
        s.shuttleVel.z *= 0.99;

        if (s.shuttleMesh) {
          s.shuttleMesh.position.copy(s.shuttlePos);
          s.shuttleMesh.lookAt(s.shuttlePos.clone().add(s.shuttleVel));
        }

        // AI Return Hit
        if (s.shuttlePos.z < s.aiPos.z + 0.6 && s.shuttlePos.z > s.aiPos.z - 0.8 && s.shuttleVel.z < 0) {
          if (Math.abs(s.shuttlePos.x - s.aiPos.x) < 1.8 && s.shuttlePos.y > 0.3 && s.shuttlePos.y < 2.5) {
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
            s.rally += 1;
            s.maxRally = Math.max(s.maxRally, s.rally);
            setRallyCount(s.rally);

            const returnSpeed = 16 + Math.min(s.rally * 0.8, 12);
            const targetX = (Math.random() - 0.5) * 4.8;
            s.shuttleVel.set((targetX - s.shuttlePos.x) * 1.8, 6.0 + Math.random() * 2, returnSpeed);
          }
        }

        // Out / Floor Hit Detection
        if (s.shuttlePos.y <= 0.1) {
          s.isRallyActive = false;
          // Check who scored
          if (s.shuttlePos.z > 0 && Math.abs(s.shuttlePos.x) <= 3.05 && s.shuttlePos.z <= 6.7) {
            // Landed in player court -> AI scores
            s.aiScore += 1;
            setAiScore(s.aiScore);
            setRallyText(isKo ? '실점! (AI 득점)' : 'AI SCORED!');
          } else if (s.shuttlePos.z < 0 && Math.abs(s.shuttlePos.x) <= 3.05 && s.shuttlePos.z >= -6.7) {
            // Landed in AI court -> Player scores
            s.playerScore += 1;
            setPlayerScore(s.playerScore);
            setRallyText(isKo ? '스매시 득점! (+1P)' : 'PLAYER SCORED!');
          } else if (s.shuttleVel.z > 0) {
            // Player hit out -> AI scores
            s.aiScore += 1;
            setAiScore(s.aiScore);
            setRallyText(isKo ? '아웃! (AI 득점)' : 'OUT! AI SCORED');
          } else {
            // AI hit out -> Player scores
            s.playerScore += 1;
            setPlayerScore(s.playerScore);
            setRallyText(isKo ? '상대 아웃! (+1P)' : 'AI OUT! +1P');
          }

          // Match Winner Check (First to 5)
          if (s.playerScore >= 5 || s.aiScore >= 5) {
            s.isGameOver = true;
            setIsGameOver(true);
            const duration = (Date.now() - s.startTime) / 1000;
            const isWon = s.playerScore >= 5;
            const receipt = calculateAndDepositMissionReward({
              gameId: 'voxel_badminton_blitz',
              gameTitle: '복셀 배드민턴 블리츠',
              durationSeconds: duration,
              score: s.playerScore * 300 + s.maxRally * 50,
              difficulty: isWon ? 'HARD' : 'NORMAL',
              isVictory: isWon
            });
            setSettlementReceipt(receipt);
            onReward(receipt.totalSns);
          } else {
            setTimeout(() => {
              setRallyText('');
              resetService(s.playerScore > s.aiScore);
            }, 1200);
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

  const resetService = (playerServes: boolean) => {
    const s = stateRef.current;
    s.rally = 0;
    setRallyCount(0);
    s.shuttlePos.set(playerServes ? 0 : 0, 1.8, playerServes ? 3.5 : -3.5);
    s.shuttleVel.set(0, 0, 0);
    s.isRallyActive = false;
    if (s.shuttleMesh) s.shuttleMesh.position.copy(s.shuttlePos);
  };

  const handleSmash = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    if (!s.isRallyActive) {
      // Service Start
      s.isRallyActive = true;
      s.shuttleVel.set((Math.random() - 0.5) * 3, 7.5, -20);
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
      return;
    }

    // Player Smash Hit
    if (s.shuttlePos.z > s.playerPos.z - 1.2 && s.shuttlePos.z < s.playerPos.z + 1.2 && s.shuttleVel.z > 0) {
      if (Math.abs(s.shuttlePos.x - s.playerPos.x) < 2.0 && s.shuttlePos.y > 0.4) {
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
        s.rally += 1;
        s.maxRally = Math.max(s.maxRally, s.rally);
        setRallyCount(s.rally);

        const smashSpd = 28 + Math.random() * 6;
        setLastSmashSpeed(Math.round(smashSpd * 10));
        const targetX = (Math.random() - 0.5) * 4.8;
        s.shuttleVel.set((targetX - s.shuttlePos.x) * 2.2, 4.0, -smashSpd);
      }
    }
  };

  const handleClearLob = () => {
    const s = stateRef.current;
    if (!s.isRallyActive || s.isGameOver || s.isPaused) return;

    if (s.shuttlePos.z > s.playerPos.z - 1.2 && s.shuttlePos.z < s.playerPos.z + 1.2 && s.shuttleVel.z > 0) {
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      s.rally += 1;
      s.maxRally = Math.max(s.maxRally, s.rally);
      setRallyCount(s.rally);
      const targetX = (Math.random() - 0.5) * 4.5;
      s.shuttleVel.set((targetX - s.shuttlePos.x) * 1.5, 11.5, -18);
    }
  };

  const handleDropShot = () => {
    const s = stateRef.current;
    if (!s.isRallyActive || s.isGameOver || s.isPaused) return;

    if (s.shuttlePos.z > s.playerPos.z - 1.2 && s.shuttlePos.z < s.playerPos.z + 1.2 && s.shuttleVel.z > 0) {
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      s.rally += 1;
      s.maxRally = Math.max(s.maxRally, s.rally);
      setRallyCount(s.rally);
      const targetX = (Math.random() - 0.5) * 4.0;
      s.shuttleVel.set((targetX - s.shuttlePos.x) * 1.2, 3.5, -12);
    }
  };

  const handleRestart = () => {
    const s = stateRef.current;
    s.playerScore = 0;
    s.aiScore = 0;
    s.rally = 0;
    s.maxRally = 0;
    s.isGameOver = false;
    s.startTime = Date.now();
    setPlayerScore(0);
    setAiScore(0);
    setRallyCount(0);
    setLastSmashSpeed(0);
    setRallyText('');
    setIsGameOver(false);
    setSettlementReceipt(null);
    resetService(true);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col font-mono select-none overflow-hidden">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '복셀 배드민턴 블리츠' : 'Voxel Badminton Blitz'}
        language={language}
        telemetries={[
          { label: isKo ? '스코어' : 'Score', value: `${playerScore} : ${aiScore}`, color: 'text-emerald-300' },
          { label: isKo ? '랠리' : 'Rally', value: `${rallyCount}회`, color: 'text-amber-300' },
          { label: isKo ? '스매시' : 'Smash', value: `${lastSmashSpeed}km/h`, color: 'text-cyan-300' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => {
          setIsPaused(prev => !prev);
          stateRef.current.isPaused = !isPaused;
        }}
        isPaused={isPaused}
      />

      {/* Rally Notification Banner */}
      {rallyText && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-emerald-500/90 text-slate-950 px-4 py-1 rounded-sm text-xs font-black tracking-wider shadow-lg z-20 pointer-events-none animate-bounce">
          {rallyText}
        </div>
      )}

      {/* Screen Gesture Touch Overlay */}
      {!isGameOver && !isPaused && !showTutorial && (
        <div
          className="absolute inset-0 z-10 select-none touch-none"
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

              if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                moved = true;
                stateRef.current.targetPlayerX = THREE.MathUtils.clamp((curX / rect.width - 0.5) * 7.5, -2.6, 2.6);
                stateRef.current.targetPlayerZ = THREE.MathUtils.clamp(3.5 + (curY / rect.height) * 4.0, 2.5, 6.2);
              }
            };

            const onUp = (upEvt: PointerEvent) => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);

              const curY = upEvt.clientY - rect.top;
              const dy = curY - startY;

              if (!moved) {
                // Tap: Power Smash / Serve
                handleSmash();
              } else if (dy < -35) {
                // Swipe Up: Clear Lob
                handleClearLob();
              } else if (dy > 35) {
                // Swipe Down: Drop Shot
                handleDropShot();
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
        <div className="px-3 py-1 bg-black/75 border border-emerald-400/30 rounded-full text-[10px] text-emerald-300 font-mono backdrop-blur-xs">
          {isKo ? '드래그: 풋워크 | 탭: 스매시/서브 | 위로 스와이프: 롭 | 아래로: 드롭 (버튼 없음)' : 'Drag: Footwork | Tap: Smash/Serve | Swipe Up: Lob | Swipe Down: Drop (No Buttons)'}
        </div>
      </div>

      {/* 3-Step Interactive Sports Tutorial Modal */}
      {showTutorial && (
        <SportsMissionTutorial
          gameId="voxel_badminton_blitz"
          gameTitle={isKo ? '3D 복셀 배드민턴 블리츠: 번개 셔틀' : 'Voxel Badminton Blitz: Lightning Shuttle'}
          sportType="hockey"
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
