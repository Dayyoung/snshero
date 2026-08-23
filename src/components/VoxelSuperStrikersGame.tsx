import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Trophy, ArrowLeft, Zap, Sparkles, Flame, ShieldAlert } from 'lucide-react';
import { CardData } from '../types';

interface VoxelSuperStrikersGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelSuperStrikersGame: React.FC<VoxelSuperStrikersGameProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [playerScore, setPlayerScore] = useState<number>(0);
  const [aiScore, setAiScore] = useState<number>(0);
  const [boost, setBoost] = useState<number>(100);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);
  const [goalBanner, setGoalBanner] = useState<string | null>(null);

  const stateRef = useRef({
    carPos: new THREE.Vector3(0, 0.6, 20),
    carVel: new THREE.Vector3(0, 0, 0),
    carRot: 0,
    aiPos: new THREE.Vector3(0, 0.6, -20),
    aiVel: new THREE.Vector3(0, 0, 0),
    ballPos: new THREE.Vector3(0, 1.2, 0),
    ballVel: new THREE.Vector3(0, 0, 0),
    boost: 100,
    isBoosting: false,
    keys: {} as Record<string, boolean>,
    pScore: 0,
    aScore: 0,
    timeLeft: 60,
    isGameOver: false
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { stateRef.current.keys[e.key.toLowerCase()] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { stateRef.current.keys[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a1128);
    scene.fog = new THREE.FogExp2(0x0a1128, 0.015);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffea00, 1.2);
    dirLight.position.set(20, 40, 20);
    scene.add(dirLight);

    // Arena Floor
    const floorGeo = new THREE.PlaneGeometry(50, 80);
    const floorMat = new THREE.MeshLambertMaterial({ color: 0x1c3144 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Field Lines
    const grid = new THREE.GridHelper(80, 20, 0x00f5d4, 0x00bbf9);
    grid.position.y = 0.05;
    scene.add(grid);

    // Goal Posts
    const goalMat1 = new THREE.MeshBasicMaterial({ color: 0x00f5d4, wireframe: true });
    const goalMat2 = new THREE.MeshBasicMaterial({ color: 0xf15bb5, wireframe: true });
    const goalGeo = new THREE.BoxGeometry(16, 6, 4);
    
    const pGoal = new THREE.Mesh(goalGeo, goalMat1);
    pGoal.position.set(0, 3, 40);
    scene.add(pGoal);

    const aiGoal = new THREE.Mesh(goalGeo, goalMat2);
    aiGoal.position.set(0, 3, -40);
    scene.add(aiGoal);

    // Player Car Mesh
    const carGroup = new THREE.Group();
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x00bbf9 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(2, 0.8, 3.2), bodyMat);
    body.position.y = 0.4;
    carGroup.add(body);
    const spoiler = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.2, 0.6), new THREE.MeshLambertMaterial({ color: 0xffe600 }));
    spoiler.position.set(0, 1.0, 1.2);
    carGroup.add(spoiler);
    scene.add(carGroup);

    // AI Car Mesh
    const aiCarGroup = new THREE.Group();
    const aiBody = new THREE.Mesh(new THREE.BoxGeometry(2, 0.8, 3.2), new THREE.MeshLambertMaterial({ color: 0xf15bb5 }));
    aiBody.position.y = 0.4;
    aiCarGroup.add(aiBody);
    scene.add(aiCarGroup);

    // Bouncy Giant Ball
    const ballGeo = new THREE.DodecahedronGeometry(1.5, 1);
    const ballMat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x333333 });
    const ballMesh = new THREE.Mesh(ballGeo, ballMat);
    scene.add(ballMesh);

    let reqId: number;
    const timerInterval = setInterval(() => {
      const s = stateRef.current;
      if (s.isGameOver) return;
      s.timeLeft -= 1;
      setTimeLeft(s.timeLeft);
      if (s.timeLeft <= 0) {
        s.isGameOver = true;
        setIsGameOver(true);
        const reward = s.pScore > s.aScore ? 240 : (s.pScore === s.aScore ? 100 : 40);
        setRewardSns(reward);
        onReward(reward);
        playSfx?.(s.pScore >= s.aScore ? 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3' : 'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
      }
    }, 1000);

    const resetBallAndCars = (scorer: 'player' | 'ai') => {
      const s = stateRef.current;
      s.ballPos.set(0, 1.5, 0);
      s.ballVel.set(0, 0, 0);
      s.carPos.set(0, 0.6, 20);
      s.carVel.set(0, 0, 0);
      s.carRot = 0;
      s.aiPos.set(0, 0.6, -20);
      s.aiVel.set(0, 0, 0);
      setGoalBanner(scorer === 'player' ? '🔥 GOAL!! PLAYER SCORES!' : '💀 AI SCORED!');
      setTimeout(() => setGoalBanner(null), 1800);
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
    };

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const s = stateRef.current;
      if (s.isGameOver) {
        renderer.render(scene, camera);
        return;
      }

      // Input steering
      const isUp = s.keys['w'] || s.keys['arrowup'];
      const isDown = s.keys['s'] || s.keys['arrowdown'];
      const isLeft = s.keys['a'] || s.keys['arrowleft'];
      const isRight = s.keys['d'] || s.keys['arrowright'];
      const isBoost = (s.keys[' '] || s.isBoosting) && s.boost > 0;

      if (isBoost) {
        s.boost = Math.max(0, s.boost - 0.6);
      } else {
        s.boost = Math.min(100, s.boost + 0.2);
      }
      setBoost(Math.round(s.boost));

      const turnSpeed = 0.05;
      if (isLeft) s.carRot += turnSpeed;
      if (isRight) s.carRot -= turnSpeed;

      const accel = isBoost ? 0.035 : 0.018;
      const fwd = new THREE.Vector3(-Math.sin(s.carRot), 0, -Math.cos(s.carRot));
      if (isUp) s.carVel.addScaledVector(fwd, accel);
      if (isDown) s.carVel.addScaledVector(fwd, -accel * 0.5);

      s.carVel.multiplyScalar(0.94);
      s.carPos.add(s.carVel);

      // Arena boundary clamp for player
      s.carPos.x = Math.max(-23, Math.min(23, s.carPos.x));
      s.carPos.z = Math.max(-38, Math.min(38, s.carPos.z));

      // AI Simple Chasing
      const toBall = new THREE.Vector3().subVectors(s.ballPos, s.aiPos).normalize();
      s.aiVel.addScaledVector(toBall, 0.012);
      s.aiVel.multiplyScalar(0.93);
      s.aiPos.add(s.aiVel);
      s.aiPos.x = Math.max(-23, Math.min(23, s.aiPos.x));
      s.aiPos.z = Math.max(-38, Math.min(38, s.aiPos.z));

      // Ball Physics
      s.ballVel.multiplyScalar(0.985);
      s.ballPos.add(s.ballVel);

      // Wall Bounces
      if (Math.abs(s.ballPos.x) > 23) {
        s.ballVel.x *= -0.85;
        s.ballPos.x = Math.sign(s.ballPos.x) * 23;
      }
      if (Math.abs(s.ballPos.z) > 38) {
        // Goal Check
        if (Math.abs(s.ballPos.x) < 8) {
          if (s.ballPos.z < -38) {
            s.pScore += 1;
            setPlayerScore(s.pScore);
            resetBallAndCars('player');
          } else {
            s.aScore += 1;
            setAiScore(s.aScore);
            resetBallAndCars('ai');
          }
        } else {
          s.ballVel.z *= -0.85;
          s.ballPos.z = Math.sign(s.ballPos.z) * 38;
        }
      }

      // Car - Ball Collisions
      const pDist = s.carPos.distanceTo(s.ballPos);
      if (pDist < 3.0) {
        const hitDir = new THREE.Vector3().subVectors(s.ballPos, s.carPos).normalize();
        const force = isBoost ? 0.9 : 0.45;
        s.ballVel.addScaledVector(hitDir, force + s.carVel.length() * 1.5);
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
      }

      const aDist = s.aiPos.distanceTo(s.ballPos);
      if (aDist < 3.0) {
        const hitDir = new THREE.Vector3().subVectors(s.ballPos, s.aiPos).normalize();
        s.ballVel.addScaledVector(hitDir, 0.4);
      }

      // Update Meshes
      carGroup.position.copy(s.carPos);
      carGroup.rotation.y = s.carRot;
      aiCarGroup.position.copy(s.aiPos);
      aiCarGroup.lookAt(s.ballPos);
      ballMesh.position.copy(s.ballPos);
      ballMesh.rotation.x += s.ballVel.z * 0.5;
      ballMesh.rotation.z -= s.ballVel.x * 0.5;

      // Camera follow player
      const camOffset = new THREE.Vector3(Math.sin(s.carRot) * 12, 8, Math.cos(s.carRot) * 12);
      camera.position.lerp(s.carPos.clone().add(camOffset), 0.1);
      camera.lookAt(s.carPos.clone().add(new THREE.Vector3(0, 1.5, 0)));

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(timerInterval);
      cancelAnimationFrame(reqId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [lowSpecMode]);

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col font-mono select-none overflow-hidden">
      {/* Top HUD */}
      <div className="absolute top-0 left-0 right-0 z-20 px-3 py-2.5 bg-slate-900/85 backdrop-blur-xs border-b border-slate-800 flex items-center justify-between text-white text-xs">
        <button
          onClick={onExit}
          className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded-sm border border-slate-700 font-bold"
        >
          <ArrowLeft size={14} />
          <span>{language === 'ko' ? '나가기' : 'Exit'}</span>
        </button>

        <div className="flex items-center gap-4 text-sm font-black">
          <span className="text-cyan-400">PLAYER {playerScore}</span>
          <span className="text-slate-400">:</span>
          <span className="text-rose-400">{aiScore} AI</span>
          <span className="text-amber-300 ml-2 bg-slate-950 px-2 py-0.5 rounded-xs border border-amber-400/30">
            ⏳ {timeLeft}s
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-24 bg-slate-950 border border-slate-700 h-4 rounded-xs overflow-hidden relative">
            <div
              className="bg-amber-400 h-full transition-all duration-75"
              style={{ width: `${boost}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-slate-900">
              BOOST {boost}%
            </span>
          </div>
        </div>
      </div>

      {/* Goal Banner */}
      {goalBanner && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 bg-amber-400 text-slate-950 font-black text-lg sm:text-2xl px-6 py-3 rounded-sm border-2 border-white shadow-xl animate-bounce">
          {goalBanner}
        </div>
      )}

      {/* 3D Canvas */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

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

              if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                moved = true;
                stateRef.current.keys['w'] = dy < -8;
                stateRef.current.keys['s'] = dy > 12;
                stateRef.current.keys['a'] = dx < -10;
                stateRef.current.keys['d'] = dx > 10;
              }
              if (dy < -25) {
                stateRef.current.isBoosting = true;
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);
              stateRef.current.keys['w'] = false;
              stateRef.current.keys['s'] = false;
              stateRef.current.keys['a'] = false;
              stateRef.current.keys['d'] = false;
              stateRef.current.isBoosting = false;

              if (!moved) {
                // Tap: Boost burst
                stateRef.current.isBoosting = true;
                setTimeout(() => { stateRef.current.isBoosting = false; }, 800);
              }
            };

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
            window.addEventListener('pointercancel', onUp);
          }}
          onDoubleClick={() => {
            stateRef.current.isBoosting = true;
            setTimeout(() => { stateRef.current.isBoosting = false; }, 1200);
          }}
        />
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/70 border border-amber-400/30 rounded-full text-[10px] text-amber-300 font-mono backdrop-blur-xs">
          {language === 'ko' ? '드래그: 카 주행 및 조향 | 탭/더블탭/위로: 슈퍼 부스트 (버튼 없음)' : 'Drag: Drive & Steer | Tap/Double Tap/Up: Boost (No Buttons)'}
        </div>
      </div>

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="absolute inset-0 z-40 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-sm max-w-sm w-full text-center text-white flex flex-col gap-4">
            <Trophy size={48} className="mx-auto text-amber-400" />
            <h2 className="text-xl font-black">
              {playerScore > aiScore ? (language === 'ko' ? '경기 승리!' : 'VICTORY!') : (language === 'ko' ? '경기 종료' : 'MATCH OVER')}
            </h2>
            <p className="text-sm text-slate-300">
              {language === 'ko' ? `최종 스코어: ${playerScore} - ${aiScore}` : `Final Score: ${playerScore} - ${aiScore}`}
            </p>
            <div className="bg-slate-950 p-3 rounded-xs border border-amber-400/30 text-amber-300 font-bold text-sm">
              +{rewardSns} SNS 포인트 획득!
            </div>
            <button
              onClick={onExit}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-sm border border-amber-300 text-sm"
            >
              {language === 'ko' ? '확인 및 돌아가기' : 'Confirm & Exit'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
