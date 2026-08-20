import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowLeft, Trophy, Sparkles, Zap, Flame, Shield, Target } from 'lucide-react';
import { CardData } from '../types';

interface VoxelKarateBreakGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

const TARGET_TIERS = [
  { nameKo: '삼나무 송판 (10단)', nameEn: 'Cedar Wood Planks (x10)', color: 0xb45309, reqPower: 45, maxBlocks: 10, points: 150 },
  { nameKo: '붉은 점토 벽돌 (10단)', nameEn: 'Red Clay Bricks (x10)', color: 0xb91c1c, reqPower: 60, maxBlocks: 10, points: 250 },
  { nameKo: '단단한 화강암석 (10단)', nameEn: 'Granite Stones (x10)', color: 0x64748b, reqPower: 75, maxBlocks: 10, points: 400 },
  { nameKo: '강철 모루 블록 (10단)', nameEn: 'Forged Iron Anvils (x10)', color: 0x334155, reqPower: 88, maxBlocks: 10, points: 650 },
  { nameKo: '흑요석 크리스탈 (10단)', nameEn: 'Obsidian Crystals (x10)', color: 0x581c87, reqPower: 95, maxBlocks: 10, points: 1000 }
];

export const VoxelKarateBreakGame: React.FC<VoxelKarateBreakGameProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const isKo = language === 'ko';
  const mountRef = useRef<HTMLDivElement>(null);

  const [currentTierIdx, setCurrentTierIdx] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [gaugeVal, setGaugeVal] = useState<number>(0);
  const [isStriking, setIsStriking] = useState<boolean>(false);
  const [shatteredCount, setShatteredCount] = useState<number>(0);
  const [breakResultText, setBreakResultText] = useState<string>('');
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const stateRef = useRef({
    tierIdx: 0,
    gauge: 0,
    gaugeSpeed: 2.2,
    gaugeDir: 1,
    isFocusActive: false,
    focusTime: 0,
    isStriking: false,
    score: 0,
    isGameOver: false,
    blocks: [] as THREE.Mesh[],
    particles: [] as { mesh: THREE.Mesh; vel: THREE.Vector3 }[],
    karateMasterGroup: null as THREE.Group | null,
    armMesh: null as THREE.Mesh | null
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1c1917);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 2.5, 5.5);
    camera.lookAt(0, 1.2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    container.appendChild(renderer.domElement);

    // Dojo Lighting (Warm Torches & Spotlight)
    const hemiLight = new THREE.HemisphereLight(0xffedd5, 0x441a03, 0.9);
    scene.add(hemiLight);

    const spot = new THREE.SpotLight(0xffedd5, 2.5);
    spot.position.set(0, 8, 4);
    spot.castShadow = !lowSpecMode;
    scene.add(spot);

    // Tatami Mat Dojo Floor
    const floorGeo = new THREE.PlaneGeometry(16, 16);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.8 });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = !lowSpecMode;
    scene.add(floorMesh);

    // Dojo Wooden Stand Pedestal for Stacking Target Blocks
    const standGeo = new THREE.BoxGeometry(1.2, 0.8, 1.0);
    const standMat = new THREE.MeshStandardMaterial({ color: 0x451a03 });
    const stand = new THREE.Mesh(standGeo, standMat);
    stand.position.set(0, 0.4, 0);
    scene.add(stand);

    // Voxel Karate Master Model
    const masterGroup = new THREE.Group();

    // Gi Pants (White)
    const giMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.8 });
    const legGeo = new THREE.BoxGeometry(0.24, 0.65, 0.26);
    const legL = new THREE.Mesh(legGeo, giMat);
    legL.position.set(-0.2, 0.35, 0);
    masterGroup.add(legL);

    const legR = new THREE.Mesh(legGeo, giMat);
    legR.position.set(0.2, 0.35, 0);
    masterGroup.add(legR);

    // Gi Torso with Black Belt
    const bodyGeo = new THREE.BoxGeometry(0.65, 0.7, 0.4);
    const body = new THREE.Mesh(bodyGeo, giMat);
    body.position.y = 1.0;
    masterGroup.add(body);

    const beltGeo = new THREE.BoxGeometry(0.68, 0.1, 0.42);
    const beltMat = new THREE.MeshStandardMaterial({ color: 0x09090b });
    const belt = new THREE.Mesh(beltGeo, beltMat);
    belt.position.y = 0.85;
    masterGroup.add(belt);

    // Head with Martial Headband
    const headGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xfcd34d });
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 1.55;
    masterGroup.add(head);

    const bandGeo = new THREE.BoxGeometry(0.44, 0.1, 0.44);
    const bandMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
    const band = new THREE.Mesh(bandGeo, bandMat);
    band.position.y = 1.62;
    masterGroup.add(band);

    // Striking Fist / Chop Arm
    const armGeo = new THREE.BoxGeometry(0.2, 0.6, 0.2);
    const arm = new THREE.Mesh(armGeo, giMat);
    arm.position.set(0.45, 1.25, 0.2);
    arm.rotation.x = -Math.PI / 4;
    masterGroup.add(arm);
    stateRef.current.armMesh = arm;

    masterGroup.position.set(0, 0, 1.5);
    scene.add(masterGroup);
    stateRef.current.karateMasterGroup = masterGroup;

    // Build Stack of Target Blocks
    const buildStack = (tierIdx: number) => {
      // Clear old blocks
      stateRef.current.blocks.forEach(b => scene.remove(b));
      stateRef.current.blocks = [];

      const tier = TARGET_TIERS[tierIdx];
      const blockMat = new THREE.MeshStandardMaterial({ color: tier.color, roughness: 0.5 });
      const blockGeo = new THREE.BoxGeometry(1.0, 0.08, 0.6);

      for (let i = 0; i < 10; i++) {
        const b = new THREE.Mesh(blockGeo, blockMat);
        b.position.set(0, 0.84 + i * 0.09, 0);
        b.castShadow = !lowSpecMode;
        scene.add(b);
        stateRef.current.blocks.push(b);
      }
    };

    buildStack(0);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const state = stateRef.current;

      if (!state.isGameOver && !state.isStriking) {
        // Ping-pong power gauge oscillation
        const speed = state.isFocusActive ? state.gaugeSpeed * 0.5 : state.gaugeSpeed;
        state.gauge += state.gaugeDir * speed * delta * 60;

        if (state.gauge >= 100) {
          state.gauge = 100;
          state.gaugeDir = -1;
        } else if (state.gauge <= 0) {
          state.gauge = 0;
          state.gaugeDir = 1;
        }

        setGaugeVal(Math.floor(state.gauge));

        if (state.focusTime > 0) {
          state.focusTime -= delta;
          if (state.focusTime <= 0) state.isFocusActive = false;
        }
      }

      // Update particle physics if broken
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.mesh.position.add(p.vel);
        p.vel.y -= 0.015; // Gravity
        p.mesh.rotation.x += 0.1;
        p.mesh.rotation.y += 0.1;

        if (p.mesh.position.y < -1.0) {
          scene.remove(p.mesh);
          state.particles.splice(i, 1);
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
      camera.updateProjectionMatrix();
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

  // Ki Focus (Slows down bar oscillation)
  const handleKiFocus = () => {
    const state = stateRef.current;
    if (state.isStriking || state.isGameOver) return;
    state.isFocusActive = true;
    state.focusTime = 3.0;
    setBreakResultText(isKo ? '🧘 단전호흡 집중: 게이지 감속!' : '🧘 KI FOCUS: Gauge Slowed!');
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
  };

  // Chop Strike Strike Action
  const handleStrike = () => {
    const state = stateRef.current;
    if (state.isStriking || state.isGameOver) return;

    state.isStriking = true;
    setIsStriking(true);

    const tier = TARGET_TIERS[state.tierIdx];
    const power = state.gauge;

    // Calculate blocks shattered based on power vs tier requirement
    let broken = 0;
    if (power >= tier.reqPower) {
      if (power >= 90) {
        broken = 10; // CRITICAL 100% PERFECT BREAK
      } else {
        broken = 6 + Math.floor(((power - tier.reqPower) / (90 - tier.reqPower)) * 4);
      }
    } else {
      broken = Math.max(1, Math.floor((power / tier.reqPower) * 5));
    }

    setShatteredCount(broken);

    // Animate chop strike
    if (state.armMesh) {
      state.armMesh.rotation.x = Math.PI / 3;
    }

    // Shatter Voxel Blocks with fragmentation
    for (let i = 9; i >= 10 - broken; i--) {
      const b = state.blocks[i];
      if (b) {
        b.visible = false;
        // Spawn small voxel debris shards
        const debrisGeo = new THREE.BoxGeometry(0.2, 0.08, 0.2);
        const debrisMat = b.material;
        for (let j = 0; j < 6; j++) {
          const debris = new THREE.Mesh(debrisGeo, debrisMat);
          debris.position.copy(b.position);
          const vel = new THREE.Vector3(
            (Math.random() - 0.5) * 0.25,
            0.15 + Math.random() * 0.15,
            (Math.random() - 0.5) * 0.25
          );
          state.particles.push({ mesh: debris, vel });
          b.parent?.add(debris);
        }
      }
    }

    if (broken === 10) {
      const earned = tier.points;
      state.score += earned;
      setScore(state.score);
      setBreakResultText(isKo ? `💥 10단 완전 격파 대성공! (+${earned}P)` : `💥 PERFECT 10-BLOCK SHATTER! (+${earned}P)`);
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
    } else {
      const earned = Math.floor(tier.points * (broken / 10));
      state.score += earned;
      setScore(state.score);
      setBreakResultText(isKo ? `🥋 ${broken}단 부분 격파! (+${earned}P)` : `🥋 ${broken} Blocks Shattered! (+${earned}P)`);
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');
    }

    // Advance to next tier or end
    setTimeout(() => {
      if (state.tierIdx + 1 < TARGET_TIERS.length) {
        state.tierIdx += 1;
        setCurrentTierIdx(state.tierIdx);
        state.isStriking = false;
        setIsStriking(false);
        if (state.armMesh) state.armMesh.rotation.x = -Math.PI / 4;

        // Rebuild new tier stack
        state.blocks.forEach(b => b.visible = true);
        const newTier = TARGET_TIERS[state.tierIdx];
        state.blocks.forEach(b => {
          (b.material as THREE.MeshStandardMaterial).color.setHex(newTier.color);
        });
      } else {
        // Finished all 5 martial tiers!
        state.isGameOver = true;
        setIsGameOver(true);
        const earnedSns = Math.min(260, Math.max(50, Math.floor(state.score * 0.12)));
        setRewardSns(earnedSns);
        onReward(earnedSns);
      }
    }, 2200);
  };

  const currTier = TARGET_TIERS[currentTierIdx];

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 overflow-hidden font-mono select-none">
      <div ref={mountRef} className="w-full h-full" />

      {/* Top HUD */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
        <button
          onClick={onExit}
          className="pointer-events-auto p-2 bg-slate-900/80 border border-slate-700 text-slate-200 rounded-sm hover:bg-slate-800 transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>{isKo ? '나가기' : 'Exit'}</span>
        </button>

        <div className="flex items-center gap-2 bg-slate-900/90 border border-amber-500/40 px-3 py-1.5 rounded-sm">
          <Trophy size={16} className="text-amber-400" />
          <span className="text-xs text-amber-300 font-bold">
            {isKo ? `점수: ${score}P` : `Score: ${score}`}
          </span>
          <span className="text-[10px] text-amber-400 font-bold">
            [TIER {currentTierIdx + 1}/5]
          </span>
        </div>
      </div>

      {/* Target Info Banner */}
      <div className="absolute top-14 left-4 flex flex-col gap-1.5 z-10 pointer-events-none">
        <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-700 text-amber-300 px-2.5 py-1 rounded-sm text-xs font-bold w-fit">
          <Target size={14} className="text-amber-400" />
          <span>{isKo ? currTier.nameKo : currTier.nameEn}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-700 text-slate-300 px-2.5 py-0.5 rounded-sm text-[11px] font-bold w-fit">
          <span>{isKo ? `격파 요구 파워: ${currTier.reqPower}%+` : `Req Ki Power: ${currTier.reqPower}%+`}</span>
        </div>
      </div>

      {/* Break Result Banner */}
      {breakResultText && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-amber-500/90 text-slate-950 px-4 py-1 rounded-sm text-xs font-black tracking-wider shadow-lg z-10 pointer-events-none animate-bounce">
          {breakResultText}
        </div>
      )}

      {/* Power Gauge Bar */}
      <div className="absolute bottom-28 left-6 right-6 flex flex-col items-center gap-1.5 z-10">
        <div className="w-full max-w-sm flex justify-between text-xs font-black text-amber-400">
          <span>{isKo ? '기력 게이지' : 'KI POWER'}</span>
          <span>{gaugeVal}%</span>
        </div>
        <div className="w-full max-w-sm h-4 bg-slate-900 border-2 border-slate-700 rounded-full overflow-hidden relative">
          {/* Sweet Spot Highlight */}
          <div
            className="absolute top-0 bottom-0 bg-emerald-500/40 border-x border-emerald-400"
            style={{ left: `${currTier.reqPower}%`, right: 0 }}
          />
          {/* Dynamic Gauge Indicator */}
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 transition-all duration-75"
            style={{ width: `${gaugeVal}%` }}
          />
        </div>
      </div>

      {/* Mobile-First Action Controls */}
      <div className="absolute bottom-6 left-4 right-4 flex flex-col items-center gap-2.5 z-10">
        <div className="w-full max-w-sm flex gap-2">
          <button
            onClick={handleKiFocus}
            disabled={isStriking}
            className="flex-1 py-4 bg-slate-900/90 border border-sky-400 text-sky-300 font-black text-sm rounded-sm active:scale-95 shadow-xl flex items-center justify-center gap-1.5 uppercase cursor-pointer disabled:opacity-50"
          >
            <Zap size={18} />
            <span>{isKo ? '🧘 단전호흡 (감속)' : '🧘 KI FOCUS'}</span>
          </button>
          <button
            onClick={handleStrike}
            disabled={isStriking}
            className="flex-1 py-4 bg-gradient-to-r from-rose-500 to-amber-500 border border-rose-300 text-slate-950 font-black text-sm rounded-sm active:scale-95 shadow-xl flex items-center justify-center gap-1.5 uppercase cursor-pointer disabled:opacity-50"
          >
            <Flame size={20} />
            <span>{isKo ? '💥 정권 격파 (CHOP!)' : '💥 KA-CHOP!'}</span>
          </button>
        </div>
        <p className="text-[11px] text-slate-300 bg-slate-900/80 px-3 py-0.5 rounded-sm border border-slate-700">
          {isKo ? '파워 게이지가 녹색 임계 영역(90%+)에 도달했을 때 정권 격파를 누르세요!' : 'Hit KA-CHOP when the power gauge reaches the green critical zone!'}
        </p>
      </div>

      {/* Game Over Summary Modal */}
      {isGameOver && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-xs bg-slate-900 border border-amber-500/50 p-5 rounded-none text-center space-y-4 shadow-2xl">
            <div className="flex justify-center">
              <Sparkles size={36} className="text-amber-400 animate-pulse" />
            </div>
            <h2 className="text-lg font-black text-amber-400 uppercase tracking-widest">
              {isKo ? '🏆 무도 격파 단련 완료!' : '🏆 MARTIAL MASTERY!'}
            </h2>
            <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950/60 p-3 border border-slate-800">
              <div className="flex justify-between">
                <span>{isKo ? '도달한 무도 단계' : 'Max Tier Reached'}</span>
                <span className="font-bold text-amber-300">5 / 5 TIER</span>
              </div>
              <div className="flex justify-between">
                <span>{isKo ? '격파 총점' : 'Total Score'}</span>
                <span className="font-bold text-indigo-300">{score} PTS</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-800 text-amber-400 font-bold">
                <span>{isKo ? '획득 SNS 보상' : 'Earned SNS'}</span>
                <span>+{rewardSns} SNS</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={onExit}
                className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase rounded-sm transition-all cursor-pointer"
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
