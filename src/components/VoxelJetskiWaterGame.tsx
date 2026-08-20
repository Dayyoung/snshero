import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowLeft, Waves, Trophy, Zap, Sparkles } from 'lucide-react';
import { CardData } from '../types';

interface VoxelJetskiWaterGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface BuoyGate {
  mesh: THREE.Group;
  z: number;
  cleared: boolean;
}

export const VoxelJetskiWaterGame: React.FC<VoxelJetskiWaterGameProps> = ({
  deck: _deck,
  language: _language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState<number>(0);
  const [turboBoost, setTurboBoost] = useState<number>(100);
  const [stuntScore, setStuntScore] = useState<number>(0);
  const [isStunting, setIsStunting] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const stateRef = useRef({
    jetskiPos: new THREE.Vector3(0, 0.4, 0),
    jetskiRot: 0,
    speed: 0.6,
    isTurbo: false,
    turbo: 100,
    isAirborne: false,
    jumpY: 0,
    airRot: 0,
    stuntScore: 0,
    distance: 0,
    keys: {} as Record<string, boolean>,
    buoys: [] as BuoyGate[],
    isGameOver: false
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      stateRef.current.keys[e.key.toLowerCase()] = true;
      if (e.key === ' ' || e.key.toLowerCase() === 'f') activateTurbo();
      if (e.key.toLowerCase() === 'e' || e.key.toLowerCase() === 'w') triggerAirStunt();
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      stateRef.current.keys[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const activateTurbo = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.turbo < 30) return;
    s.isTurbo = true;
    s.turbo -= 30;
    s.speed = 1.2;
    setTurboBoost(Math.floor(s.turbo));
    if (playSfx) playSfx('/sounds/turbo.mp3');

    setTimeout(() => {
      s.speed = 0.6;
      s.isTurbo = false;
    }, 2000);
  };

  const triggerAirStunt = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isAirborne) return;
    s.isAirborne = true;
    setIsStunting(true);
    if (playSfx) playSfx('/sounds/jump.mp3');
  };

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0284c7);
    scene.fog = new THREE.FogExp2(0x0284c7, 0.01);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const sun = new THREE.DirectionalLight(0xfff8e7, 1.4);
    sun.position.set(20, 60, 40);
    scene.add(sun);

    // Ocean Water Floor
    const waterGeo = new THREE.PlaneGeometry(80, 400);
    const waterMat = new THREE.MeshLambertMaterial({ color: 0x0369a1 });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.z = -150;
    scene.add(water);

    // Player Jetski Mesh
    const jetskiGroup = new THREE.Group();
    const hullMat = new THREE.MeshLambertMaterial({ color: 0x06b6d4 });
    const hull = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 3.4), hullMat);
    hull.position.y = 0.3;
    jetskiGroup.add(hull);

    const seatMat = new THREE.MeshLambertMaterial({ color: 0x18181b });
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 1.4), seatMat);
    seat.position.set(0, 0.7, -0.2);
    jetskiGroup.add(seat);

    scene.add(jetskiGroup);

    // Buoy Gates along course
    const buoys: BuoyGate[] = [];
    for (let i = 0; i < 15; i++) {
      const bGroup = new THREE.Group();
      const zPos = -30 - i * 25;

      const buoy1 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.6, 1.6, 16),
        new THREE.MeshLambertMaterial({ color: 0xf59e0b })
      );
      buoy1.position.set(-6, 0.8, 0);
      bGroup.add(buoy1);

      const buoy2 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.6, 1.6, 16),
        new THREE.MeshLambertMaterial({ color: 0xf59e0b })
      );
      buoy2.position.set(6, 0.8, 0);
      bGroup.add(buoy2);

      bGroup.position.set(0, 0, zPos);
      scene.add(bGroup);

      buoys.push({
        mesh: bGroup,
        z: zPos,
        cleared: false
      });
    }
    stateRef.current.buoys = buoys;

    // Turbo Refill
    const turboInterval = setInterval(() => {
      const s = stateRef.current;
      if (s.turbo < 100) {
        s.turbo = Math.min(100, s.turbo + 5);
        setTurboBoost(Math.floor(s.turbo));
      }
    }, 1000);

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const s = stateRef.current;
      if (s.isGameOver) {
        renderer.render(scene, camera);
        return;
      }

      // Movement & Carving
      const keys = s.keys;
      if (keys['a'] || keys['arrowleft']) {
        s.jetskiPos.x -= 0.35;
        s.jetskiRot = Math.min(0.4, s.jetskiRot + 0.05);
      } else if (keys['d'] || keys['arrowright']) {
        s.jetskiPos.x += 0.35;
        s.jetskiRot = Math.max(-0.4, s.jetskiRot - 0.05);
      } else {
        s.jetskiRot *= 0.85;
      }

      s.jetskiPos.x = Math.max(-12, Math.min(12, s.jetskiPos.x));
      s.distance += s.speed;
      setDistance(Math.floor(s.distance));

      // Air Stunt Jump Physics
      if (s.isAirborne) {
        s.jumpY += 0.35;
        s.airRot += 0.25;
        jetskiGroup.rotation.y = s.airRot;

        if (s.jumpY >= 6.0) {
          s.isAirborne = false;
          s.jumpY = 0;
          setIsStunting(false);
          jetskiGroup.rotation.y = 0;
          s.stuntScore += 40;
          setStuntScore(s.stuntScore);
          if (playSfx) playSfx('/sounds/stunt_success.mp3');
        }
      }

      jetskiGroup.position.set(s.jetskiPos.x, 0.4 + s.jumpY, 0);
      jetskiGroup.rotation.z = s.jetskiRot;

      // Check Buoys
      for (const b of s.buoys) {
        b.z += s.speed;
        b.mesh.position.z = b.z;

        if (!b.cleared && b.z > -2 && b.z < 4) {
          if (Math.abs(s.jetskiPos.x) <= 6) {
            b.cleared = true;
            s.stuntScore += 20;
            setStuntScore(s.stuntScore);
            if (playSfx) playSfx('/sounds/gate_pass.mp3');
          }
        }

        if (b.z > 20) {
          b.z = -350;
          b.cleared = false;
        }
      }

      // Course complete check
      if (s.distance >= 400 && !s.isGameOver) {
        s.isGameOver = true;
        setIsGameOver(true);
        const finalSns = Math.min(260, Math.max(40, s.stuntScore + 50));
        setRewardSns(finalSns);
        onReward(finalSns);
        if (playSfx) playSfx('/sounds/fanfare.mp3');
      }

      // Camera Follow
      camera.position.set(s.jetskiPos.x * 0.5, 3.5, 7.5);
      camera.lookAt(s.jetskiPos.x * 0.5, 1.2, -15);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      clearInterval(turboInterval);
      cancelAnimationFrame(animId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [lowSpecMode, onReward, playSfx]);

  return (
    <div className="relative w-full h-[100dvh] bg-[#0284c7] font-mono text-[#fdfcfc] select-none flex flex-col overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#201d1d] border-b border-[#201d1d]/30 z-20">
        <button
          onClick={onExit}
          className="flex items-center gap-1 px-2.5 py-1 bg-[#fdfcfc]/10 text-white rounded-sm text-xs active:bg-white/20"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> [뒤로]
        </button>
        <div className="text-center">
          <div className="text-xs font-bold text-cyan-300 flex items-center justify-center gap-1">
            <Waves className="w-3.5 h-3.5" /> [No.79 베리포지 전담] 3D 제트스키 워터 레이스
          </div>
          <div className="text-[10px] text-slate-300">수상 제트스키 레이싱 & 파도 360° 스턴트</div>
        </div>
        <div className="text-xs text-amber-300 font-bold">
          코스 완주: {distance}m / 400m
        </div>
      </div>

      {/* Stats HUD */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#0c4a6e]/90 text-xs border-b border-sky-800 z-20">
        <div>하이드로 터보: <strong className="text-cyan-300">{turboBoost}%</strong></div>
        {isStunting && (
          <div className="text-amber-400 font-bold animate-bounce flex items-center gap-1">
            <Sparkles className="w-4 h-4" /> 360° 공중 에어 스핀!
          </div>
        )}
        <div>스턴트 점수: <strong className="text-amber-400">{stuntScore}P</strong></div>
      </div>

      {/* 3D Canvas */}
      <div ref={mountRef} className="relative flex-1 w-full overflow-hidden" />

      {/* Mobile Controls */}
      <div className="p-3 bg-[#0c4a6e]/95 border-t border-sky-800 flex items-center justify-between gap-2 z-20">
        <div className="flex gap-2">
          <button
            onPointerDown={() => { stateRef.current.jetskiPos.x -= 1.8; }}
            className="w-12 h-12 bg-sky-900 border border-sky-600 rounded-sm font-bold text-xs active:bg-sky-800"
          >
            ◀ 좌
          </button>
          <button
            onPointerDown={() => { stateRef.current.jetskiPos.x += 1.8; }}
            className="w-12 h-12 bg-sky-900 border border-sky-600 rounded-sm font-bold text-xs active:bg-sky-800"
          >
            우 ▶
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={triggerAirStunt}
            className="px-4 h-12 bg-amber-500 text-black font-bold text-xs rounded-sm active:bg-amber-400 flex items-center gap-1 shadow-lg"
          >
            <Sparkles className="w-4 h-4" /> [공중 스턴트]
          </button>
          <button
            onClick={activateTurbo}
            className="px-4 h-12 bg-cyan-500 text-black font-bold text-xs rounded-sm active:bg-cyan-400 flex items-center gap-1 shadow-lg"
          >
            <Zap className="w-4 h-4" /> [하이드로 터보]
          </button>
        </div>
      </div>

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-sm bg-[#201d1d] border border-cyan-500/40 p-5 rounded-none text-center font-mono">
            <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-2" />
            <h2 className="text-base font-bold text-cyan-400 mb-1">[제트스키 완주 성공!]</h2>
            <p className="text-xs text-slate-300 mb-4">수상 레이스 및 360° 공중 스턴트 기록</p>

            <div className="bg-slate-900/80 p-3 rounded-sm text-xs space-y-1 mb-4 text-left border border-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-400">스턴트 점수:</span>
                <span className="text-amber-400 font-bold">{stuntScore}P</span>
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
