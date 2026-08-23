import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Trophy, ArrowLeft, Zap, Sparkles, Award, Gauge } from 'lucide-react';
import { CardData } from '../types';

interface VoxelDriftMasterGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelDriftMasterGame: React.FC<VoxelDriftMasterGameProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [speed, setSpeed] = useState<number>(0);
  const [driftScore, setDriftScore] = useState<number>(0);
  const [nitro, setNitro] = useState<number>(100);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const gameStateRef = useRef({
    posX: 0,
    posZ: 0,
    rotY: 0,
    speed: 0,
    driftScore: 0,
    nitro: 100,
    isDrifting: false,
    keys: { w: false, s: false, a: false, d: false, space: false, shift: false },
    isGameOver: false,
    isVictory: false
  });

  const triggerNitro = () => {
    const s = gameStateRef.current;
    if (s.nitro < 30 || s.isGameOver || s.isVictory) return;
    s.nitro -= 30;
    s.speed += 25;
    setNitro(Math.round(s.nitro));
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050510);
    scene.fog = new THREE.FogExp2(0x050510, 0.015);

    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 300);
    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0x223366, 0.8);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xff00ff, 1.2);
    dirLight.position.set(20, 50, 20);
    scene.add(dirLight);

    // Circuit Track
    const trackGeo = new THREE.RingGeometry(30, 60, 32);
    trackGeo.rotateX(-Math.PI / 2);
    const trackMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    const track = new THREE.Mesh(trackGeo, trackMat);
    scene.add(track);

    // Sports Car Mesh
    const car = new THREE.Group();
    const carBody = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.8, 3.6), new THREE.MeshPhongMaterial({ color: 0xff0055 }));
    carBody.position.y = 0.5;
    car.add(carBody);

    const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.2, 0.6), new THREE.MeshLambertMaterial({ color: 0x111111 }));
    spoiler.position.set(0, 1.1, 1.5);
    car.add(spoiler);

    car.position.set(45, 0, 0);
    scene.add(car);

    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') gameStateRef.current.keys.w = true;
      if (k === 's' || k === 'arrowdown') gameStateRef.current.keys.s = true;
      if (k === 'a' || k === 'arrowleft') gameStateRef.current.keys.a = true;
      if (k === 'd' || k === 'arrowright') gameStateRef.current.keys.d = true;
      if (k === ' ') gameStateRef.current.keys.space = true;
      if (k === 'shift' || k === 'e') triggerNitro();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') gameStateRef.current.keys.w = false;
      if (k === 's' || k === 'arrowdown') gameStateRef.current.keys.s = false;
      if (k === 'a' || k === 'arrowleft') gameStateRef.current.keys.a = false;
      if (k === 'd' || k === 'arrowright') gameStateRef.current.keys.d = false;
      if (k === ' ') gameStateRef.current.keys.space = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      const s = gameStateRef.current;

      if (!s.isGameOver && !s.isVictory) {
        // Accelerate & Brake
        if (s.keys.w) s.speed = Math.min(80, s.speed + 35 * dt);
        else if (s.keys.s) s.speed = Math.max(-20, s.speed - 40 * dt);
        else s.speed *= 0.98;

        // Turn
        const turnSpeed = s.keys.space ? 3.5 : 2.0;
        if (s.keys.a) s.rotY += turnSpeed * dt * (s.speed > 0 ? 1 : -1);
        if (s.keys.d) s.rotY -= turnSpeed * dt * (s.speed > 0 ? 1 : -1);

        // Drift scoring
        if (s.keys.space && Math.abs(s.speed) > 20 && (s.keys.a || s.keys.d)) {
          s.driftScore += Math.floor(100 * dt);
          setDriftScore(s.driftScore);
          s.nitro = Math.min(100, s.nitro + 15 * dt);
          setNitro(Math.round(s.nitro));

          if (s.driftScore >= 1000) {
            s.isVictory = true;
            setIsVictory(true);
            const reward = 50 + Math.floor(s.driftScore / 50);
            setRewardSns(reward);
            onReward(reward);
          }
        }

        s.posX += Math.sin(s.rotY) * s.speed * dt;
        s.posZ += Math.cos(s.rotY) * s.speed * dt;

        car.position.set(s.posX + 45, 0, s.posZ);
        car.rotation.y = s.rotY;

        setSpeed(Math.round(s.speed));

        camera.position.set(car.position.x - Math.sin(s.rotY) * 10, 5, car.position.z - Math.cos(s.rotY) * 10);
        camera.lookAt(car.position.x, 1, car.position.z);
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [lowSpecMode, onReward, playSfx]);

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 text-white select-none overflow-hidden flex flex-col font-sans">
      <div ref={mountRef} className="w-full h-full absolute inset-0" />

      {/* Top HUD */}
      <div className="relative z-10 p-3 sm:p-4 flex items-center justify-between bg-gradient-to-b from-slate-950/90 to-transparent pointer-events-none">
        <button
          onClick={onExit}
          className="pointer-events-auto p-2 bg-slate-900/80 hover:bg-slate-800 text-white rounded-xl border border-slate-700 active:scale-95 flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span className="text-xs font-bold">{language === 'ko' ? '나가기' : 'Exit'}</span>
        </button>

        {/* Speed & Drift Score */}
        <div className="flex items-center gap-3 bg-slate-900/80 px-3 py-1.5 rounded-2xl border border-slate-700">
          <div className="text-rose-400 font-mono font-black text-sm">
            🏎️ {speed} KM/H
          </div>

          <div className="text-yellow-400 font-bold text-xs">
            🔥 DRIFT: {driftScore}/1000
          </div>

          <div className="text-cyan-400 font-bold text-xs">
            ⚡ NITRO: {nitro}%
          </div>
        </div>
      </div>

      {/* Screen Gesture Touch Overlay */}
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
              gameStateRef.current.keys.w = dy < -8;
              gameStateRef.current.keys.s = dy > 12;
              gameStateRef.current.keys.a = dx < -10;
              gameStateRef.current.keys.d = dx > 10;
              if (Math.abs(dx) > 28) {
                gameStateRef.current.keys.space = true;
              } else {
                gameStateRef.current.keys.space = false;
              }
            }
          };

          const onUp = () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            window.removeEventListener('pointercancel', onUp);
            gameStateRef.current.keys.w = false;
            gameStateRef.current.keys.s = false;
            gameStateRef.current.keys.a = false;
            gameStateRef.current.keys.d = false;
            gameStateRef.current.keys.space = false;

            if (!moved) {
              // Tap: Trigger Nitro Boost
              triggerNitro();
            }
          };

          window.addEventListener('pointermove', onMove);
          window.addEventListener('pointerup', onUp);
          window.addEventListener('pointercancel', onUp);
        }}
        onDoubleClick={() => triggerNitro()}
      />

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/70 border border-cyan-500/30 rounded-full text-[10px] text-cyan-300 font-mono backdrop-blur-xs">
          {language === 'ko' ? '드래그: 주행 & 드리프트 | 탭/더블탭: 니트로 부스트 (버튼 없음)' : 'Drag: Drive & Drift | Tap/Double Tap: Nitro (No Buttons)'}
        </div>
      </div>

      {/* Victory / Game Over Modal */}
      {(isVictory || isGameOver) && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${isVictory ? 'bg-amber-400/20 text-yellow-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {isVictory ? <Trophy size={36} /> : <Award size={36} />}
            </div>

            <h2 className="text-2xl font-black italic uppercase">{isVictory ? '도쿄 드리프트 마스터 VICTORY' : '레이스 종료! DEFEAT'}</h2>

            <p className="text-xs text-slate-300">
              {isVictory
                ? '압도적인 드리프트 컨트롤과 터보 가속으로 나이트 서킷을 제패했습니다!'
                : '레이스가 종료되었습니다.'}
            </p>

            {isVictory && (
              <div className="bg-slate-950 border border-amber-500/30 p-3 rounded-2xl">
                <span className="text-xs text-slate-400 block uppercase font-bold">REWARD</span>
                <span className="text-2xl font-black text-yellow-400 flex items-center justify-center gap-1">
                  <Sparkles size={20} /> +{rewardSns} SNS
                </span>
              </div>
            )}

            <button
              onClick={onExit}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-slate-950 font-bold rounded-xl active:scale-95 transition-all cursor-pointer"
            >
              {language === 'ko' ? '확인 및 나가기' : 'Confirm & Exit'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
