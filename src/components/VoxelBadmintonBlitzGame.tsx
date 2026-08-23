import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowLeft, Trophy, Zap, Sparkles, Activity, Shield } from 'lucide-react';
import { CardData } from '../types';

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

  const [playerScore, setPlayerScore] = useState<number>(0);
  const [aiScore, setAiScore] = useState<number>(0);
  const [rallyCount, setRallyCount] = useState<number>(0);
  const [lastSmashSpeed, setLastSmashSpeed] = useState<number>(0);
  const [rallyText, setRallyText] = useState<string>('');
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);
  const [playerWon, setPlayerWon] = useState<boolean>(false);

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

    // Court Boundary & Service Lines (White lines)
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    // Center net line
    const netLineGeo = new THREE.PlaneGeometry(6.1, 0.08);
    const netLine = new THREE.Mesh(netLineGeo, lineMat);
    netLine.rotation.x = -Math.PI / 2;
    netLine.position.y = 0.005;
    scene.add(netLine);

    // Net Posts and Net Mesh
    const postGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.55, 8);
    const postMat = new THREE.MeshStandardMaterial({ color: 0xd97706 });
    const postL = new THREE.Mesh(postGeo, postMat);
    postL.position.set(-3.1, 0.775, 0);
    scene.add(postL);

    const postR = new THREE.Mesh(postGeo, postMat);
    postR.position.set(3.1, 0.775, 0);
    scene.add(postR);

    const netGeo = new THREE.PlaneGeometry(6.1, 0.76);
    const netGridMat = new THREE.MeshBasicMaterial({ color: 0xf1f5f9, transparent: true, opacity: 0.75, side: THREE.DoubleSide });
    const net = new THREE.Mesh(netGeo, netGridMat);
    net.position.set(0, 1.17, 0);
    scene.add(net);

    // Top Net White Band
    const netTopGeo = new THREE.BoxGeometry(6.1, 0.06, 0.04);
    const netTop = new THREE.Mesh(netTopGeo, lineMat);
    netTop.position.set(0, 1.55, 0);
    scene.add(netTop);

    // Character Builder
    const createPlayerVoxelModel = (suitColor: number) => {
      const group = new THREE.Group();

      // Head
      const headGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
      const headMat = new THREE.MeshStandardMaterial({ color: 0xfcd34d });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.y = 1.6;
      group.add(head);

      // Hair
      const hairGeo = new THREE.BoxGeometry(0.44, 0.15, 0.44);
      const hairMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
      const hair = new THREE.Mesh(hairGeo, hairMat);
      hair.position.y = 1.75;
      group.add(hair);

      // Torso
      const bodyGeo = new THREE.BoxGeometry(0.55, 0.65, 0.35);
      const bodyMat = new THREE.MeshStandardMaterial({ color: suitColor });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 1.05;
      group.add(body);

      // Legs
      const legMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });
      for (let i = 0; i < 2; i++) {
        const legGeo = new THREE.BoxGeometry(0.2, 0.7, 0.25);
        const leg = new THREE.Mesh(legGeo, legMat);
        leg.position.set(i === 0 ? -0.15 : 0.15, 0.35, 0);
        group.add(leg);
      }

      // Racket Arm & Badminton Racket
      const racketGroup = new THREE.Group();
      const shaftGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.6, 8);
      const shaftMat = new THREE.MeshStandardMaterial({ color: 0xd97706 });
      const shaft = new THREE.Mesh(shaftGeo, shaftMat);
      shaft.position.y = 0.3;
      racketGroup.add(shaft);

      const frameGeo = new THREE.TorusGeometry(0.18, 0.02, 8, 16);
      const frameMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
      const frame = new THREE.Mesh(frameGeo, frameMat);
      frame.position.y = 0.68;
      racketGroup.add(frame);

      racketGroup.position.set(0.35, 0.9, 0.2);
      racketGroup.rotation.x = Math.PI / 4;
      group.add(racketGroup);

      return { group, racketGroup };
    };

    const playerObj = createPlayerVoxelModel(0xef4444); // Player Red
    playerObj.group.position.set(0, 0, 4.5);
    scene.add(playerObj.group);
    stateRef.current.playerMesh = playerObj.group;

    const aiObj = createPlayerVoxelModel(0x3b82f6); // AI Blue
    aiObj.group.position.set(0, 0, -4.5);
    aiObj.group.rotation.y = Math.PI;
    scene.add(aiObj.group);
    stateRef.current.aiMesh = aiObj.group;

    // Voxel Shuttlecock Model
    const shuttleGroup = new THREE.Group();
    // Cork Head
    const corkGeo = new THREE.SphereGeometry(0.08, 12, 12);
    const corkMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const cork = new THREE.Mesh(corkGeo, corkMat);
    shuttleGroup.add(cork);

    // Feather Cone
    const featherGeo = new THREE.ConeGeometry(0.12, 0.22, 12, 1, true);
    const featherMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc, side: THREE.DoubleSide });
    const feather = new THREE.Mesh(featherGeo, featherMat);
    feather.position.z = -0.11;
    feather.rotation.x = -Math.PI / 2;
    shuttleGroup.add(feather);

    shuttleGroup.position.set(0, 1.8, 3.5);
    scene.add(shuttleGroup);
    stateRef.current.shuttleMesh = shuttleGroup;

    // Initial Serve Setup
    const serveShuttle = () => {
      const state = stateRef.current;
      state.isRallyActive = true;
      state.rally = 0;
      setRallyCount(0);

      if (state.servingPlayer) {
        state.shuttlePos.set(state.playerPos.x, 1.5, state.playerPos.z - 0.5);
        state.shuttleVel.set((Math.random() - 0.5) * 0.05, 0.12, -0.22);
        setRallyText(isKo ? '🏸 플레이어 서브!' : '🏸 PLAYER SERVE!');
      } else {
        state.shuttlePos.set(state.aiPos.x, 1.5, state.aiPos.z + 0.5);
        state.shuttleVel.set((Math.random() - 0.5) * 0.05, 0.12, 0.22);
        setRallyText(isKo ? '🤖 AI 서브!' : '🤖 AI SERVE!');
      }
    };

    serveShuttle();

    // Game Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const state = stateRef.current;

      if (!state.isGameOver) {
        // Player smooth movement
        state.playerPos.x += (state.targetPlayerX - state.playerPos.x) * 0.15;
        state.playerPos.z += (state.targetPlayerZ - state.playerPos.z) * 0.15;
        playerObj.group.position.copy(state.playerPos);

        // AI movement tracking shuttlecock
        if (state.isRallyActive && state.shuttleVel.z < 0) {
          state.aiTargetX = state.shuttlePos.x * 0.9;
          state.aiTargetZ = -5.0 + Math.abs(state.shuttlePos.x) * 0.2;
        }
        state.aiPos.x += (state.aiTargetX - state.aiPos.x) * 0.08;
        state.aiPos.z += (state.aiTargetZ - state.aiPos.z) * 0.08;
        aiObj.group.position.copy(state.aiPos);

        // Shuttlecock Flight & Gravity Physics
        if (state.isRallyActive) {
          state.shuttleVel.y -= 0.0035; // Gravity
          state.shuttlePos.add(state.shuttleVel);
          shuttleGroup.position.copy(state.shuttlePos);

          // Rotate shuttlecock head along trajectory
          shuttleGroup.lookAt(
            state.shuttlePos.x + state.shuttleVel.x,
            state.shuttlePos.y + state.shuttleVel.y,
            state.shuttlePos.z + state.shuttleVel.z
          );

          // AI Hit Return (at z <= -4.0 and y > 0.4)
          if (state.shuttlePos.z <= -4.0 && state.shuttleVel.z < 0 && state.shuttlePos.y > 0.4) {
            const aiHitDist = Math.hypot(state.aiPos.x - state.shuttlePos.x, state.aiPos.z - state.shuttlePos.z);
            if (aiHitDist < 2.5) {
              // AI returns shot
              state.rally += 1;
              setRallyCount(state.rally);
              state.shuttleVel.set(
                (Math.random() - 0.5) * 0.15,
                0.1 + Math.random() * 0.06,
                0.2 + Math.random() * 0.08
              );
              setRallyText(isKo ? `랠리 ${state.rally}회!` : `Rally x${state.rally}!`);
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
            }
          }

          // Player Auto Defensive Return (if near shuttle and moving toward player)
          if (state.shuttlePos.z >= 4.0 && state.shuttleVel.z > 0 && state.shuttlePos.y > 0.4) {
            const playerHitDist = Math.hypot(state.playerPos.x - state.shuttlePos.x, state.playerPos.z - state.shuttlePos.z);
            if (playerHitDist < 1.8) {
              state.rally += 1;
              setRallyCount(state.rally);
              state.shuttleVel.set(
                (Math.random() - 0.5) * 0.15,
                0.12,
                -0.22
              );
              setRallyText(isKo ? `랠리 ${state.rally}회 리턴!` : `Rally x${state.rally} Return!`);
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
            }
          }

          // Shuttle Lands on Court or Out (Ground hit y <= 0.1)
          if (state.shuttlePos.y <= 0.1) {
            state.isRallyActive = false;

            if (state.shuttlePos.z < 0) {
              // Landed on AI side -> Player Point
              state.playerScore += 1;
              setPlayerScore(state.playerScore);
              setRallyText(isKo ? '🎉 플레이어 득점 (+1P)!!' : '🎉 PLAYER POINT (+1P)!!');
              state.servingPlayer = true;
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
            } else {
              // Landed on Player side -> AI Point
              state.aiScore += 1;
              setAiScore(state.aiScore);
              setRallyText(isKo ? '💨 AI 득점 (+1P)' : '💨 AI POINT (+1P)');
              state.servingPlayer = false;
            }

            // Check Game End (11 Points)
            if (state.playerScore >= 11 || state.aiScore >= 11) {
              state.isGameOver = true;
              setIsGameOver(true);
              const won = state.playerScore >= 11;
              setPlayerWon(won);
              const earnedSns = won ? Math.min(260, 180 + state.playerScore * 8) : 40;
              setRewardSns(earnedSns);
              onReward(earnedSns);
            } else {
              setTimeout(() => serveShuttle(), 1200);
            }
          }
        }
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    // Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix;
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [lowSpecMode, onReward, isKo, playSfx]);

  // Touch Steer Player
  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (isGameOver) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const normX = (clientX / window.innerWidth - 0.5) * 2;
    stateRef.current.targetPlayerX = normX * 2.8;
  };

  // Jump Smash Action (Spike down into opponent court)
  const handleSmash = () => {
    const state = stateRef.current;
    if (!state.isRallyActive || state.shuttleVel.z <= 0) return;

    const dist = Math.hypot(state.playerPos.x - state.shuttlePos.x, state.playerPos.z - state.shuttlePos.z);
    if (dist < 3.0 && state.shuttlePos.y > 1.2) {
      const speedKmh = 210 + Math.floor(Math.random() * 30);
      setLastSmashSpeed(speedKmh);
      state.rally += 1;
      setRallyCount(state.rally);

      // Fast steep downward smash
      state.shuttleVel.set((Math.random() - 0.5) * 0.1, -0.06, -0.42);
      setRallyText(isKo ? `⚡ 썬더 점프 스매시! (${speedKmh} km/h)` : `⚡ THUNDER JUMP SMASH! (${speedKmh} km/h)`);
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
    }
  };

  // Clear Lob Shot
  const handleClearLob = () => {
    const state = stateRef.current;
    if (!state.isRallyActive || state.shuttleVel.z <= 0) return;
    state.shuttleVel.set((Math.random() - 0.5) * 0.08, 0.18, -0.2);
    setRallyText(isKo ? '🏸 하이 클리어 롭!' : '🏸 HIGH CLEAR LOB!');
  };

  // Drop Shot
  const handleDropShot = () => {
    const state = stateRef.current;
    if (!state.isRallyActive || state.shuttleVel.z <= 0) return;
    state.shuttleVel.set((Math.random() - 0.5) * 0.05, 0.07, -0.15);
    setRallyText(isKo ? '✨ 헤어핀 드롭 샷!' : '✨ HAIRPIN DROP SHOT!');
  };

  return (
    <div
      className="relative w-full h-[100dvh] bg-slate-950 overflow-hidden font-mono select-none"
      onTouchMove={handleTouchMove}
      onMouseMove={handleTouchMove}
    >
      <div ref={mountRef} className="w-full h-full" />

      {/* Top HUD */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
        <button
          onClick={onExit}
          className="pointer-events-auto p-2 bg-slate-900/80 border border-slate-700 text-slate-200 rounded-sm hover:bg-slate-800 transition-all flex items-center gap-1.5 text-xs font-bold"
        >
          <ArrowLeft size={16} />
          <span>{isKo ? '나가기' : 'Exit'}</span>
        </button>

        {/* Score Board */}
        <div className="flex items-center gap-3 bg-slate-900/90 border border-emerald-500/40 px-3 py-1.5 rounded-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-rose-400 font-black">YOU: {playerScore}</span>
            <span className="text-xs text-slate-500">VS</span>
            <span className="text-xs text-sky-400 font-black">AI: {aiScore}</span>
          </div>
          <span className="text-[10px] text-amber-400 font-bold border-l border-slate-700 pl-2">
            [11 PTS MATCH]
          </span>
        </div>
      </div>

      {/* Rally & Speed Banner */}
      <div className="absolute top-14 left-4 flex flex-col gap-1.5 z-10 pointer-events-none">
        <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-700 text-amber-300 px-2.5 py-1 rounded-sm text-xs font-bold w-fit">
          <Activity size={14} className="text-amber-400" />
          <span>RALLY: {rallyCount}</span>
        </div>
        {lastSmashSpeed > 0 && (
          <div className="flex items-center gap-1.5 bg-rose-600/90 text-white px-2.5 py-0.5 rounded-sm text-[11px] font-black animate-pulse w-fit">
            <Zap size={14} />
            <span>{lastSmashSpeed} km/h SMASH</span>
          </div>
        )}
      </div>

      {/* Rally Notification Banner */}
      {rallyText && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-emerald-500/90 text-slate-950 px-4 py-1 rounded-sm text-xs font-black tracking-wider shadow-lg z-10 pointer-events-none animate-bounce">
          {rallyText}
        </div>
      )}

      {/* Screen Gesture Touch Overlay */}
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
              stateRef.current.playerX = Math.max(-5.5, Math.min(5.5, (curX / rect.width - 0.5) * 12));
              stateRef.current.playerZ = Math.max(3, Math.min(8.5, 4 + (curY / rect.height) * 5));
            }
          };

          const onUp = (upEvt: PointerEvent) => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            window.removeEventListener('pointercancel', onUp);

            const curY = upEvt.clientY - rect.top;
            const dy = curY - startY;

            if (!moved) {
              // Tap: Power Smash
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

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-slate-900/80 border border-emerald-400/30 rounded-full text-[10px] text-emerald-300 font-mono backdrop-blur-xs">
          {isKo ? '드래그: 이동 | 탭: 스매시 | 위로 스와이프: 롭 | 아래로: 드롭 (버튼 없음)' : 'Drag: Move | Tap: Smash | Swipe Up: Lob | Swipe Down: Drop (No Buttons)'}
        </div>
      </div>

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-xs bg-slate-900 border border-emerald-500/50 p-5 rounded-none text-center space-y-4 shadow-2xl">
            <div className="flex justify-center">
              <Trophy size={36} className={playerWon ? 'text-amber-400 animate-pulse' : 'text-slate-400'} />
            </div>
            <h2 className="text-lg font-black uppercase tracking-widest text-amber-400">
              {playerWon
                ? (isKo ? '🏆 배드민턴 매치 승리!' : '🏆 MATCH VICTORY!')
                : (isKo ? '🥈 매치 종료 (패배)' : '🥈 MATCH FINISHED (DEFEAT)')}
            </h2>
            <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950/60 p-3 border border-slate-800">
              <div className="flex justify-between">
                <span>{isKo ? '최종 세트 스코어' : 'Final Score'}</span>
                <span className="font-bold text-amber-300">{playerScore} : {aiScore}</span>
              </div>
              <div className="flex justify-between">
                <span>{isKo ? '최다 랠리' : 'Max Rally'}</span>
                <span className="font-bold text-indigo-300">{rallyCount} 랠리</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-800 text-amber-400 font-bold">
                <span>{isKo ? '획득 SNS 보상' : 'Earned SNS'}</span>
                <span>+{rewardSns} SNS</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={onExit}
                className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase rounded-sm transition-all cursor-pointer"
              >
                {isKo ? '보상 수령 및 복귀' : 'Claim & Exit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
