import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowLeft, Crosshair, Trophy, Sparkles, Flame, Eye } from 'lucide-react';
import { CardData } from '../types';

interface VoxelSniperHunterGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface SniperTarget {
  mesh: THREE.Group;
  pos: THREE.Vector3;
  type: 'target' | 'gas_can';
  alive: boolean;
  isHeadshot?: boolean;
}

export const VoxelSniperHunterGame: React.FC<VoxelSniperHunterGameProps> = ({
  deck: _deck,
  language = 'ko',
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [eliminatedCount, setEliminatedCount] = useState<number>(0);
  const [totalTargets] = useState<number>(4);
  const [isHoldingBreath, setIsHoldingBreath] = useState<boolean>(false);
  const [breathMeter, setBreathMeter] = useState<number>(100);
  const [score, setScore] = useState<number>(0);
  const [lastShotText, setLastShotText] = useState<string | null>(null);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const stateRef = useRef({
    aimX: 0,
    aimY: 0,
    sway: 0,
    isHoldingBreath: false,
    breath: 100,
    score: 0,
    eliminated: 0,
    isGameOver: false,
    targets: [] as SniperTarget[],
    scene: null as THREE.Scene | null,
    camera: null as THREE.PerspectiveCamera | null
  });

  const handleHoldBreath = (active: boolean) => {
    stateRef.current.isHoldingBreath = active;
    setIsHoldingBreath(active);
  };

  const handleShoot = () => {
    const s = stateRef.current;
    if (s.isGameOver || !s.camera) return;

    if (playSfx) playSfx('/sounds/sniper_shot.mp3');

    // Raycast center
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), s.camera);

    let hit = false;
    for (const t of s.targets) {
      if (!t.alive) continue;
      const intersects = raycaster.intersectObjects(t.mesh.children, true);
      if (intersects.length > 0) {
        hit = true;
        t.alive = false;
        t.mesh.visible = false;

        if (t.type === 'gas_can') {
          // Environmental Trap Explosion
          s.score += 80;
          s.eliminated += 1;
          setLastShotText('💥 환경 트랩 폭발 암살! (+80P)');
          if (playSfx) playSfx('/sounds/explosion.mp3');
        } else {
          // Headshot or body hit
          const isHead = intersects[0].point.y > t.pos.y + 1.2;
          const pts = isHead ? 60 : 35;
          s.score += pts;
          s.eliminated += 1;
          setLastShotText(isHead ? '🎯 시네마틱 헤드샷! (+60P)' : '🎯 표적 저격 완료 (+35P)');
          if (playSfx) playSfx(isHead ? '/sounds/headshot.mp3' : '/sounds/hit.mp3');
        }
        break;
      }
    }

    if (!hit) {
      setLastShotText('빗나감 (Miss)');
    }

    setEliminatedCount(s.eliminated);
    setScore(s.score);

    if (s.eliminated >= 4) {
      setTimeout(() => {
        s.isGameOver = true;
        setIsGameOver(true);
        const finalSns = Math.min(260, Math.max(40, s.score + 40));
        setRewardSns(finalSns);
        onReward(finalSns);
        if (playSfx) playSfx('/sounds/fanfare.mp3');
      }, 1000);
    }
  };

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x09090b);
    scene.fog = new THREE.FogExp2(0x09090b, 0.008);
    stateRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(28, width / height, 0.1, 1000); // 28 deg for zoomed scope
    camera.position.set(0, 6, 0);
    stateRef.current.camera = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const moon = new THREE.DirectionalLight(0x94a3b8, 1.0);
    moon.position.set(40, 80, 20);
    scene.add(moon);

    // City Buildings in distance
    for (let i = 0; i < 8; i++) {
      const bh = 15 + (i % 3) * 8;
      const bMesh = new THREE.Mesh(
        new THREE.BoxGeometry(10, bh, 10),
        new THREE.MeshLambertMaterial({ color: 0x1e293b })
      );
      bMesh.position.set((i - 4) * 14, bh / 2, -60 - (i % 2) * 15);
      scene.add(bMesh);
    }

    // Spawn 3 Enemies on roofs & 1 Gas Canister
    const targets: SniperTarget[] = [];

    // Target 1
    const t1 = new THREE.Group();
    const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.4, 0.8), new THREE.MeshLambertMaterial({ color: 0xef4444 }));
    b1.position.y = 0.7;
    t1.add(b1);
    const h1 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), new THREE.MeshLambertMaterial({ color: 0xfacc15 }));
    h1.position.y = 1.6;
    t1.add(h1);
    t1.position.set(-15, 15, -60);
    scene.add(t1);
    targets.push({ mesh: t1, pos: t1.position.clone(), type: 'target', alive: true });

    // Target 2
    const t2 = new THREE.Group();
    const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.4, 0.8), new THREE.MeshLambertMaterial({ color: 0xef4444 }));
    b2.position.y = 0.7;
    t2.add(b2);
    const h2 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), new THREE.MeshLambertMaterial({ color: 0xfacc15 }));
    h2.position.y = 1.6;
    t2.add(h2);
    t2.position.set(12, 18, -65);
    scene.add(t2);
    targets.push({ mesh: t2, pos: t2.position.clone(), type: 'target', alive: true });

    // Target 3
    const t3 = new THREE.Group();
    const b3 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.4, 0.8), new THREE.MeshLambertMaterial({ color: 0xef4444 }));
    b3.position.y = 0.7;
    t3.add(b3);
    const h3 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), new THREE.MeshLambertMaterial({ color: 0xfacc15 }));
    h3.position.y = 1.6;
    t3.add(h3);
    t3.position.set(0, 15, -55);
    scene.add(t3);
    targets.push({ mesh: t3, pos: t3.position.clone(), type: 'target', alive: true });

    // Red Gas Canister (Environmental Trap)
    const tGas = new THREE.Group();
    const gasCan = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.7, 1.8, 16),
      new THREE.MeshLambertMaterial({ color: 0xdc2626 })
    );
    gasCan.position.y = 0.9;
    tGas.add(gasCan);
    tGas.position.set(-2, 15, -55);
    scene.add(tGas);
    targets.push({ mesh: tGas, pos: tGas.position.clone(), type: 'gas_can', alive: true });

    stateRef.current.targets = targets;

    let animId: number;
    let time = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const s = stateRef.current;
      time += 0.05;

      // Scope Sway Physics (eliminated when holding breath)
      let swayX = 0;
      let swayY = 0;
      if (s.isHoldingBreath && s.breath > 0) {
        s.breath = Math.max(0, s.breath - 0.4);
        setBreathMeter(Math.floor(s.breath));
      } else {
        swayX = Math.sin(time) * 0.008;
        swayY = Math.cos(time * 0.8) * 0.008;
        s.breath = Math.min(100, s.breath + 0.3);
        setBreathMeter(Math.floor(s.breath));
      }

      camera.rotation.y = -s.aimX * 0.0015 + swayX;
      camera.rotation.x = -s.aimY * 0.0015 + swayY;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [lowSpecMode, onReward, playSfx]);

  const handlePointerMove = (e: React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    stateRef.current.aimX = e.clientX - rect.left - cx;
    stateRef.current.aimY = e.clientY - rect.top - cy;
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#09090b] font-mono text-[#fdfcfc] select-none flex flex-col overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#201d1d] border-b border-[#201d1d]/30 z-20">
        <button
          onClick={onExit}
          className="flex items-center gap-1 px-2.5 py-1 bg-[#fdfcfc]/10 text-white rounded-sm text-xs active:bg-white/20"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> [뒤로]
        </button>
        <div className="text-center">
          <div className="text-xs font-bold text-red-500 flex items-center justify-center gap-1">
            <Crosshair className="w-3.5 h-3.5" /> [No.78 토그림 전담] 3D 스나이퍼 헌터
          </div>
          <div className="text-[10px] text-slate-300">망원 스코프 줌 & 시네마틱 불릿캠 암살 슈터</div>
        </div>
        <div className="text-xs text-amber-300 font-bold">
          제거: {eliminatedCount} / {totalTargets}
        </div>
      </div>

      {/* Stats HUD */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#18181b]/90 text-xs border-b border-slate-700 z-20">
        <div>숨참기 게이지: <strong className="text-cyan-400">{breathMeter}%</strong></div>
        <div>총점: <strong className="text-amber-400">{score}P</strong></div>
      </div>

      {/* 3D Scope Canvas & Drag Layer */}
      <div
        ref={mountRef}
        onPointerMove={handlePointerMove}
        className="relative flex-1 w-full overflow-hidden cursor-crosshair"
      >
        {/* Sniper Scope Vignette & Reticle */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="relative w-72 h-72 rounded-full border-2 border-red-500/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.85)] flex items-center justify-center">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
            <div className="absolute w-full h-[1px] bg-red-500/60" />
            <div className="absolute h-full w-[1px] bg-red-500/60" />
            <div className="absolute top-4 text-[10px] text-red-400 font-bold">8X SCOPE ZOOM</div>
          </div>
        </div>

        {/* Shot Result Banner */}
        {lastShotText && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-black/80 px-4 py-2 rounded-sm border border-red-500 text-red-400 font-bold text-sm z-30 animate-bounce">
            {lastShotText}
          </div>
        )}
      </div>

      {/* Screen Gesture Touch Overlay */}
      {!isGameOver && (
        <div
          className="absolute inset-0 z-20 select-none touch-none cursor-crosshair"
          style={{ touchAction: 'none' }}
          onPointerDown={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const startX = e.clientX - rect.left;
            const startY = e.clientY - rect.top;
            let moved = false;
            handleHoldBreath(true);

            const onMove = (moveEvt: PointerEvent) => {
              const curX = moveEvt.clientX - rect.left;
              const curY = moveEvt.clientY - rect.top;
              const dx = curX - startX;
              const dy = curY - startY;

              if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
                moved = true;
                const state = stateRef.current;
                state.targetScopeX = Math.max(-12, Math.min(12, state.targetScopeX + dx * 0.02));
                state.targetScopeY = Math.max(-6, Math.min(6, state.targetScopeY - dy * 0.02));
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);
              handleHoldBreath(false);

              if (!moved) {
                // Tap: Shoot
                handleShoot();
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
        <div className="px-3 py-1 bg-black/70 border border-red-500/30 rounded-full text-[10px] text-red-300 font-mono backdrop-blur-xs">
          {language === 'ko' ? '드래그: 조준 | 화면 홀드: 숨참기 | 탭: 저격 사격 (버튼 없음)' : 'Drag: Aim | Hold: Breath Hold | Tap: Fire (No Buttons)'}
        </div>
      </div>

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-sm bg-[#201d1d] border border-red-500/40 p-5 rounded-none text-center font-mono">
            <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-2" />
            <h2 className="text-base font-bold text-amber-400 mb-1">[암살 작전 완료!]</h2>
            <p className="text-xs text-slate-300 mb-4">시네마틱 원거리 저격 성공</p>

            <div className="bg-slate-900/80 p-3 rounded-sm text-xs space-y-1 mb-4 text-left border border-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-400">제거 성공:</span>
                <span className="text-red-400 font-bold">{eliminatedCount} / {totalTargets}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">최종 점수:</span>
                <span className="text-amber-400 font-bold">{score}P</span>
              </div>
              <div className="flex justify-between border-t border-slate-700 pt-1">
                <span className="text-amber-300 font-bold">확정 보상 SNS:</span>
                <span className="text-amber-400 font-bold">+{rewardSns} SNS</span>
              </div>
            </div>

            <button
              onClick={onExit}
              className="w-full py-2.5 bg-amber-500 text-black font-bold text-xs rounded-sm active:bg-amber-400"
            >
              [보상 수령 및 복귀]
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
