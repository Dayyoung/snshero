import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowLeft, Trophy, Sparkles, Zap, Anchor, Compass, Fish, AlertCircle } from 'lucide-react';
import { CardData } from '../types';

interface VoxelKrakenHunterGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelKrakenHunterGame: React.FC<VoxelKrakenHunterGameProps> = ({
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
  const [fishCaught, setFishCaught] = useState<number>(0);
  const [lineTension, setLineTension] = useState<number>(30); // 0 (slack) ~ 100 (snap)
  const [monsterHp, setMonsterHp] = useState<number>(100);
  const [monsterDistance, setMonsterDistance] = useState<number>(45);
  const [monsterName, setMonsterName] = useState<string>('Deepsea Leviathan');
  const [isReeling, setIsReeling] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const stateRef = useRef({
    lineTension: 30,
    monsterHp: 100,
    monsterDist: 45,
    isReeling: false,
    score: 0,
    fishCaught: 0,
    isGameOver: false,
    shipGroup: null as THREE.Group | null,
    monsterGroup: null as THREE.Group | null,
    tentacles: [] as THREE.Mesh[],
    fishingLine: null as THREE.Line | null
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030712);
    scene.fog = new THREE.Fog(0x030712, 20, 80);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 5, -8);
    camera.lookAt(0, 1.5, 20);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    container.appendChild(renderer.domElement);

    // Moonlight & Ocean Waves
    const ambientLight = new THREE.AmbientLight(0x0284c7, 0.6);
    scene.add(ambientLight);

    const moonLight = new THREE.DirectionalLight(0x38bdf8, 1.6);
    moonLight.position.set(-10, 30, -20);
    scene.add(moonLight);

    // Deep Ocean Water Mesh
    const oceanGeo = new THREE.PlaneGeometry(80, 80, 24, 24);
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x0c4a6e,
      roughness: 0.1,
      metalness: 0.7,
      wireframe: lowSpecMode
    });
    const ocean = new THREE.Mesh(oceanGeo, oceanMat);
    ocean.rotation.x = -Math.PI / 2;
    scene.add(ocean);

    // Voxel Fishing Boat (Player)
    const shipGroup = new THREE.Group();
    const hullGeo = new THREE.BoxGeometry(3.5, 1.2, 7);
    const hullMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });
    const hull = new THREE.Mesh(hullGeo, hullMat);
    hull.position.y = 0.6;
    shipGroup.add(hull);

    // Cabin
    const cabinGeo = new THREE.BoxGeometry(2.4, 1.4, 2.5);
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0, 1.8, -1.2);
    shipGroup.add(cabin);

    // Fishing Rod
    const rodGeo = new THREE.CylinderGeometry(0.05, 0.08, 4.5, 8);
    const rodMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b });
    const rod = new THREE.Mesh(rodGeo, rodMat);
    rod.rotation.x = Math.PI / 4;
    rod.position.set(0, 2.2, 2.8);
    shipGroup.add(rod);

    shipGroup.position.set(0, 0, 0);
    scene.add(shipGroup);
    stateRef.current.shipGroup = shipGroup;

    // Voxel Kraken Monster
    const monsterGroup = new THREE.Group();
    const headGeo = new THREE.SphereGeometry(2.2, 8, 8);
    const headMat = new THREE.MeshStandardMaterial({ color: 0x881337, emissive: 0x4c0519, emissiveIntensity: 0.6 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.0;
    monsterGroup.add(head);

    // Glowing Eyes
    const eyeGeo = new THREE.SphereGeometry(0.4, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.9, 1.3, -1.8);
    monsterGroup.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.9, 1.3, -1.8);
    monsterGroup.add(eyeR);

    // Tentacles
    const tentacles: THREE.Mesh[] = [];
    const tGeo = new THREE.CylinderGeometry(0.25, 0.45, 4, 8);
    const tMat = new THREE.MeshStandardMaterial({ color: 0x9f1239 });

    for (let i = 0; i < 6; i++) {
      const tent = new THREE.Mesh(tGeo, tMat);
      const angle = (i / 6) * Math.PI * 2;
      tent.position.set(Math.cos(angle) * 2.2, 0.5, Math.sin(angle) * 2.2);
      tent.rotation.z = Math.sin(angle) * 0.4;
      tent.rotation.x = Math.cos(angle) * 0.4;
      monsterGroup.add(tent);
      tentacles.push(tent);
    }

    monsterGroup.position.set(0, -0.5, 45);
    scene.add(monsterGroup);
    stateRef.current.monsterGroup = monsterGroup;
    stateRef.current.tentacles = tentacles;

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

      // Boat Bobbing in Water
      if (state.shipGroup) {
        state.shipGroup.position.y = Math.sin(now * 0.002) * 0.2;
        state.shipGroup.rotation.z = Math.sin(now * 0.0015) * 0.05;
        state.shipGroup.rotation.x = Math.cos(now * 0.0018) * 0.04;
      }

      // Kraken Thrashing & Tentacle Animation
      if (state.monsterGroup) {
        state.monsterGroup.position.z = state.monsterDist;
        state.monsterGroup.position.y = Math.sin(now * 0.003) * 0.5;
        state.monsterGroup.position.x = Math.sin(now * 0.0025) * 4;

        state.tentacles.forEach((t, idx) => {
          t.rotation.z = Math.sin(now * 0.004 + idx) * 0.6;
          t.rotation.x = Math.cos(now * 0.004 + idx) * 0.6;
        });
      }

      // Fishing Line Tension Dynamics
      if (state.isReeling) {
        state.lineTension += 28 * dt;
        state.monsterDist -= 7 * dt;
        state.monsterHp -= 8 * dt;
      } else {
        state.lineTension = Math.max(10, state.lineTension - 35 * dt);
        state.monsterDist += 4 * dt;
      }

      // Monster Resistance Surge
      if (Math.random() < 0.04) {
        state.lineTension += 12;
      }

      state.lineTension = Math.max(0, Math.min(100, state.lineTension));
      state.monsterDist = Math.max(8, Math.min(65, state.monsterDist));
      state.monsterHp = Math.max(0, state.monsterHp);

      setLineTension(Math.round(state.lineTension));
      setMonsterDistance(Math.round(state.monsterDist));
      setMonsterHp(Math.round(state.monsterHp));

      // Line Snap Check
      if (state.lineTension >= 98) {
        state.isGameOver = true;
        setIsGameOver(true);
        const reward = Math.min(260, Math.floor(state.score / 50));
        setRewardSns(reward);
        onReward(reward);
        if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      }

      // Monster Caught Check!
      if (state.monsterDist <= 9 || state.monsterHp <= 0) {
        state.fishCaught++;
        state.score += 1500 + state.fishCaught * 500;
        setScore(state.score);
        setFishCaught(state.fishCaught);

        // Next Bigger Monster
        state.monsterDist = 48;
        state.monsterHp = 100;
        state.lineTension = 30;
        setMonsterName(`Ancient Abyssal Kraken #${state.fishCaught + 1}`);
        if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');
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

  const handleHarpoonStrike = () => {
    const state = stateRef.current;
    if (state.isGameOver) return;

    state.monsterHp -= 30;
    state.monsterDist -= 6;
    state.score += 300;
    setScore(state.score);
    if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
  };

  return (
    <div className="relative w-full h-full min-h-[100dvh] bg-slate-950 flex flex-col items-center select-none overflow-hidden font-mono">
      {/* 3D Viewport */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* Header HUD */}
      <div className="relative z-10 w-full max-w-xl p-3 flex items-center justify-between pointer-events-auto bg-slate-900/85 backdrop-blur-sm border-b border-sky-500/40">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-sky-400 text-xs font-bold rounded-sm border border-sky-500/40"
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
            <Fish size={14} />
            <span>x{fishCaught}</span>
          </div>
          <div className="flex items-center gap-1 text-rose-400">
            <Anchor size={14} />
            <span>{monsterDistance}m</span>
          </div>
        </div>
      </div>

      {/* Line Tension Meter */}
      <div className="relative z-10 mt-3 w-full max-w-xs px-4 flex flex-col items-center pointer-events-none gap-1 bg-slate-950/80 p-2 border border-slate-800 rounded-sm">
        <div className="w-full flex justify-between text-[10px] font-bold text-sky-400">
          <span>LINE TENSION</span>
          <span className={lineTension > 80 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}>
            {lineTension}%
          </span>
        </div>
        <div className="w-full h-3 bg-slate-800 rounded-sm overflow-hidden border border-slate-700">
          <div
            className={`h-full transition-all duration-75 ${
              lineTension > 80 ? 'bg-rose-500 animate-pulse' : lineTension > 55 ? 'bg-amber-400' : 'bg-cyan-400'
            }`}
            style={{ width: `${lineTension}%` }}
          />
        </div>
      </div>

      {/* Monster Stamina */}
      <div className="relative z-10 mt-2 w-full max-w-xs px-4 flex flex-col items-center pointer-events-none gap-1">
        <div className="w-full flex justify-between text-[11px] font-bold text-rose-400">
          <span>{monsterName}</span>
          <span>{monsterHp} HP</span>
        </div>
        <div className="w-full h-2 bg-slate-800 rounded-sm overflow-hidden border border-slate-700">
          <div className="h-full bg-rose-600 transition-all duration-75" style={{ width: `${monsterHp}%` }} />
        </div>
      </div>

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
            stateRef.current.isReeling = true;
            setIsReeling(true);

            const onMove = (moveEvt: PointerEvent) => {
              const curX = moveEvt.clientX - rect.left;
              const curY = moveEvt.clientY - rect.top;
              const dx = curX - startX;
              const dy = curY - startY;

              if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                moved = true;
                stateRef.current.shipAngle += (dx > 0 ? 0.04 : -0.04);
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);
              stateRef.current.isReeling = false;
              setIsReeling(false);

              if (!moved) {
                // Quick Tap: Harpoon Strike
                handleHarpoonStrike();
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
        <div className="px-3 py-1 bg-black/70 border border-sky-400/30 rounded-full text-[10px] text-sky-300 font-mono backdrop-blur-xs">
          {language === 'ko' ? '드래그: 조준 | 탭: 작살 발사 | 화면 홀드: 릴링 감기 (버튼 없음)' : 'Drag: Aim | Tap: Harpoon Strike | Hold: Reel In (No Buttons)'}
        </div>
      </div>

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-sm bg-slate-900 border-2 border-sky-500 p-6 flex flex-col items-center gap-4 text-center rounded-none shadow-[0_0_30px_rgba(56,189,248,0.3)]">
            <Trophy size={40} className="text-amber-400 animate-bounce" />
            <h2 className="text-lg font-black text-white tracking-widest">
              {isKo ? '심해 낚시 종료!' : 'EXPEDITION ENDED!'}
            </h2>
            <div className="w-full bg-slate-950 p-3 border border-slate-800 flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>{isKo ? '포획한 전설 해수' : 'Monsters Caught'}</span>
                <span className="text-cyan-400 font-bold">{fishCaught}마리</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>{isKo ? '최종 획득 점수' : 'Final Score'}</span>
                <span className="text-amber-400 font-bold">{score.toLocaleString()}P</span>
              </div>
              <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-1.5">
                <span>{isKo ? 'SNS 보상 포인트' : 'SNS Reward'}</span>
                <span className="text-emerald-400 font-bold">+{rewardSns} SNS</span>
              </div>
            </div>

            <button
              onClick={onExit}
              className="w-full py-3 bg-sky-600 hover:bg-sky-500 active:scale-98 text-white font-black text-sm rounded-sm tracking-wider shadow-lg"
            >
              {isKo ? '확인 및 보상 수령' : 'Confirm & Claim'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
