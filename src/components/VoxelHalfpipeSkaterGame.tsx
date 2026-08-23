import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowLeft, Trophy, Sparkles, Zap, Flame, Compass, Wind } from 'lucide-react';
import { CardData } from '../types';

interface VoxelHalfpipeSkaterGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelHalfpipeSkaterGame: React.FC<VoxelHalfpipeSkaterGameProps> = ({
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
  const [combo, setCombo] = useState<number>(0);
  const [currentAirHeight, setCurrentAirHeight] = useState<number>(0);
  const [lastTrickName, setLastTrickName] = useState<string>('');
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const stateRef = useRef({
    halfpipePos: 0, // -1 (left lip) to 1 (right lip), 0 is bottom
    halfpipeVel: 1.8,
    isAirborne: false,
    airY: 0,
    airVelY: 0,
    tricksInAir: 0,
    score: 0,
    combo: 0,
    isGameOver: false,
    skaterGroup: null as THREE.Group | null,
    skateboard: null as THREE.Mesh | null
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 8, 18);
    camera.lookAt(0, 4, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    container.appendChild(renderer.domElement);

    // Skatepark Floodlights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const spotLight = new THREE.SpotLight(0xf59e0b, 2.5);
    spotLight.position.set(0, 20, 10);
    spotLight.castShadow = !lowSpecMode;
    scene.add(spotLight);

    // 3D U-Shaped Halfpipe Ramp Mesh
    const pipeRadius = 8;
    const pipeWidth = 16;
    const pipeGeo = new THREE.CylinderGeometry(pipeRadius, pipeRadius, pipeWidth, 32, 1, true, Math.PI, Math.PI);
    const pipeMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.6,
      side: THREE.BackSide
    });
    const halfpipe = new THREE.Mesh(pipeGeo, pipeMat);
    halfpipe.rotation.z = Math.PI / 2;
    halfpipe.position.set(0, pipeRadius, 0);
    scene.add(halfpipe);

    // Coping Metal Rails on left and right lips
    const railMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });
    const railGeo = new THREE.CylinderGeometry(0.15, 0.15, pipeWidth, 12);
    const railLeft = new THREE.Mesh(railGeo, railMat);
    railLeft.rotation.z = Math.PI / 2;
    railLeft.position.set(0, pipeRadius, -pipeRadius);
    scene.add(railLeft);

    const railRight = new THREE.Mesh(railGeo, railMat);
    railRight.rotation.z = Math.PI / 2;
    railRight.position.set(0, pipeRadius, pipeRadius);
    scene.add(railRight);

    // Voxel Skater & Skateboard
    const skaterGroup = new THREE.Group();

    // Skateboard Deck
    const boardGeo = new THREE.BoxGeometry(0.6, 0.08, 1.8);
    const boardMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.2 });
    const board = new THREE.Mesh(boardGeo, boardMat);
    board.position.y = 0.2;
    skaterGroup.add(board);

    // Skater Body
    const bodyGeo = new THREE.BoxGeometry(0.7, 1.2, 0.6);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xec4899 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.0;
    skaterGroup.add(body);

    scene.add(skaterGroup);
    stateRef.current.skaterGroup = skaterGroup;
    stateRef.current.skateboard = board;

    let animId: number;
    let lastTime = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const state = stateRef.current;
      if (state.isGameOver) {
        renderer.render(scene, camera);
        return;
      }

      if (!state.isAirborne) {
        // Pendulum Motion inside U-Ramp
        state.halfpipePos += state.halfpipeVel * dt;

        // Calculate Position on U-Curve
        const angle = state.halfpipePos * (Math.PI / 2);
        const z = Math.sin(angle) * pipeRadius;
        const y = pipeRadius - Math.cos(angle) * pipeRadius;

        if (state.skaterGroup) {
          state.skaterGroup.position.set(0, y, z);
          state.skaterGroup.rotation.x = angle;
        }

        // Check Lip Launch
        if (Math.abs(state.halfpipePos) >= 0.98) {
          state.isAirborne = true;
          state.airY = pipeRadius;
          state.airVelY = Math.abs(state.halfpipeVel) * 3.5;
          state.tricksInAir = 0;
          state.halfpipeVel *= -1; // Reverse for next drop
        }
      } else {
        // Airborne Physics
        state.airVelY -= 18 * dt;
        state.airY += state.airVelY * dt;
        setCurrentAirHeight(Math.max(0, Math.round(state.airY)));

        if (state.skaterGroup) {
          state.skaterGroup.position.y = state.airY;
        }

        // Landing Check
        if (state.airY <= pipeRadius && state.airVelY < 0) {
          state.isAirborne = false;
          state.halfpipePos = state.halfpipePos > 0 ? 0.95 : -0.95;
          setCurrentAirHeight(0);

          if (state.tricksInAir > 0) {
            state.combo++;
            state.score += state.tricksInAir * 400 * state.combo;
            setScore(state.score);
            setCombo(state.combo);
            if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');
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
  }, [lowSpecMode, onReward, playSfx]);

  const handlePump = () => {
    const state = stateRef.current;
    if (state.isGameOver || state.isAirborne) return;

    // Pump adds velocity
    state.halfpipeVel = (state.halfpipeVel > 0 ? 1 : -1) * (Math.abs(state.halfpipeVel) + 0.6);
    if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
  };

  const handleTrick = (trickName: string, points: number) => {
    const state = stateRef.current;
    if (state.isGameOver || !state.isAirborne) return;

    state.tricksInAir++;
    state.score += points;
    setScore(state.score);
    setLastTrickName(trickName);

    if (state.skaterGroup) {
      state.skaterGroup.rotation.y += Math.PI * 2;
    }

    if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
  };

  return (
    <div className="relative w-full h-full min-h-[100dvh] bg-slate-950 flex flex-col items-center select-none overflow-hidden font-mono">
      {/* 3D Viewport */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* Header HUD */}
      <div className="relative z-10 w-full max-w-xl p-3 flex items-center justify-between pointer-events-auto bg-slate-900/85 backdrop-blur-sm border-b border-amber-500/40">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-amber-400 text-xs font-bold rounded-sm border border-amber-500/40"
        >
          <ArrowLeft size={14} />
          <span>{isKo ? '나가기' : 'Exit'}</span>
        </button>

        <div className="flex items-center gap-4 text-xs font-bold">
          <div className="flex items-center gap-1 text-amber-400">
            <Trophy size={14} />
            <span>{score.toLocaleString()}P</span>
          </div>
          <div className="flex items-center gap-1 text-cyan-400">
            <Wind size={14} />
            <span>{currentAirHeight}m AIR</span>
          </div>
          {combo > 1 && (
            <div className="flex items-center gap-1 text-rose-400 animate-bounce">
              <Sparkles size={14} />
              <span>x{combo} COMBO</span>
            </div>
          )}
        </div>
      </div>

      {/* Last Trick Display */}
      {lastTrickName && (
        <div className="relative z-10 mt-3 px-4 py-1 bg-amber-500 text-slate-950 text-xs font-black rounded-sm tracking-wider animate-pulse">
          {lastTrickName}!
        </div>
      )}

      {/* Screen Gesture Touch Overlay */}
      {!isGameOver && (
        <div
          className="absolute inset-0 z-10 select-none touch-none cursor-pointer"
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

              if (Math.abs(dx) > 15 || Math.abs(dy) > 15) {
                moved = true;
                if (Math.abs(dx) > Math.abs(dy)) {
                  handleTrick(dx > 0 ? '360 SPIN' : 'KICKFLIP', 450);
                } else {
                  handleTrick(dy > 0 ? 'HANDPLANT' : 'RODEO FLIP', 650);
                }
                window.removeEventListener('pointermove', onMove);
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);

              if (!moved) {
                // Tap: Pump speed or Air trick
                if (Math.abs(stateRef.current.posY) < 1.0) {
                  handlePump();
                } else {
                  handleTrick('KICKFLIP', 350);
                }
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
        <div className="px-3 py-1 bg-black/70 border border-amber-400/30 rounded-full text-[10px] text-amber-300 font-mono backdrop-blur-xs">
          {isKo ? '바닥에서 탭: 펌핑 가속 | 공중에서 스와이프: 에어 트릭 구사 (버튼 없음)' : 'Tap on pipe: Pump speed | Swipe in air: Air tricks (No Buttons)'}
        </div>
      </div>

      {/* Finish / Session Modal Button */}
      <div className="absolute top-16 right-4 z-10 pointer-events-auto">
        <button
          onClick={() => {
            setIsGameOver(true);
            const reward = Math.min(260, Math.floor(score / 45) + combo * 20);
            setRewardSns(reward);
            onReward(reward);
          }}
          className="px-3 py-1.5 bg-slate-900/90 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-sm"
        >
          {isKo ? '세션 완료' : 'Finish Run'}
        </button>
      </div>

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-sm bg-slate-900 border-2 border-amber-500 p-6 flex flex-col items-center gap-4 text-center rounded-none shadow-[0_0_30px_rgba(245,158,11,0.3)]">
            <Trophy size={40} className="text-amber-400 animate-bounce" />
            <h2 className="text-lg font-black text-white tracking-widest">
              {isKo ? '스케이트 세션 완료!' : 'SKATE SESSION COMPLETE!'}
            </h2>
            <div className="w-full bg-slate-950 p-3 border border-slate-800 flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>{isKo ? '최대 연속 콤보' : 'Max Combo'}</span>
                <span className="text-cyan-400 font-bold">x{combo}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>{isKo ? '최종 트릭 점수' : 'Final Score'}</span>
                <span className="text-amber-400 font-bold">{score.toLocaleString()}P</span>
              </div>
              <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-1.5">
                <span>{isKo ? 'SNS 보상 포인트' : 'SNS Reward'}</span>
                <span className="text-emerald-400 font-bold">+{rewardSns} SNS</span>
              </div>
            </div>

            <button
              onClick={onExit}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 font-black text-sm rounded-sm tracking-wider shadow-lg"
            >
              {isKo ? '확인 및 보상 수령' : 'Confirm & Claim'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
