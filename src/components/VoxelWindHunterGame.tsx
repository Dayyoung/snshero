import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowLeft, Target, Wind, Trophy, Sparkles } from 'lucide-react';
import { CardData } from '../types';

interface VoxelWindHunterGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelWindHunterGame: React.FC<VoxelWindHunterGameProps> = ({
  deck: _deck,
  language: _language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [round, setRound] = useState<number>(1);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [lastShotScore, setLastShotScore] = useState<string | null>(null);
  const [windSpeed, setWindSpeed] = useState<number>(2.4);
  const [windAngle, setWindAngle] = useState<number>(45);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [drawPower, setDrawPower] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);
  const [shotHistory, setShotHistory] = useState<number[]>([]);

  const stateRef = useRef({
    aimX: 0,
    aimY: 0,
    isDrawing: false,
    drawPower: 0,
    windSpeed: 2.5,
    windDir: new THREE.Vector2(1, 0),
    round: 1,
    maxRounds: 5,
    totalScore: 0,
    isGameOver: false,
    arrowMesh: null as THREE.Group | null,
    isArrowFlying: false,
    arrowPos: new THREE.Vector3(0, 1.5, 0),
    arrowVel: new THREE.Vector3(0, 0, 0)
  });

  const generateWind = () => {
    const speed = +(Math.random() * 4.5 + 0.5).toFixed(1);
    const angleDeg = Math.floor(Math.random() * 360);
    const rad = (angleDeg * Math.PI) / 180;
    stateRef.current.windSpeed = speed;
    stateRef.current.windDir.set(Math.cos(rad), Math.sin(rad));
    setWindSpeed(speed);
    setWindAngle(angleDeg);
  };

  useEffect(() => {
    generateWind();
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Sky blue
    scene.fog = new THREE.FogExp2(0x87ceeb, 0.008);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 1.6, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff8e7, 1.4);
    sunLight.position.set(40, 80, -30);
    scene.add(sunLight);

    // Green Meadow Ground
    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x4ade80 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Pine Trees
    for (let i = 0; i < 30; i++) {
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.6, 3),
        new THREE.MeshLambertMaterial({ color: 0x854d0e })
      );
      trunk.position.y = 1.5;
      tree.add(trunk);

      const foliage = new THREE.Mesh(
        new THREE.ConeGeometry(2.5, 6, 6),
        new THREE.MeshLambertMaterial({ color: 0x15803d })
      );
      foliage.position.y = 5;
      tree.add(foliage);

      const tx = (Math.random() - 0.5) * 120;
      const tz = -15 - Math.random() * 80;
      if (Math.abs(tx) > 8) {
        tree.position.set(tx, 0, tz);
        scene.add(tree);
      }
    }

    // 100m Archery Target Stand at Z = -60
    const targetGroup = new THREE.Group();
    targetGroup.position.set(0, 2.2, -60);

    // Target Stand Legs
    const legMat = new THREE.MeshLambertMaterial({ color: 0x78350f });
    const leg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 4), legMat);
    leg1.position.set(-0.8, -1.2, 0);
    leg1.rotation.z = 0.2;
    targetGroup.add(leg1);

    const leg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 4), legMat);
    leg2.position.set(0.8, -1.2, 0);
    leg2.rotation.z = -0.2;
    targetGroup.add(leg2);

    // Concentric Target Rings
    const ringColors = [0xfbbf24, 0xef4444, 0x3b82f6, 0x1e293b, 0xf8fafc];
    const ringSizes = [0.4, 0.9, 1.4, 1.9, 2.4];
    for (let r = ringSizes.length - 1; r >= 0; r--) {
      const ring = new THREE.Mesh(
        new THREE.CylinderGeometry(ringSizes[r], ringSizes[r], 0.15, 32),
        new THREE.MeshLambertMaterial({ color: ringColors[r] })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.z = -0.05 * r;
      targetGroup.add(ring);
    }
    scene.add(targetGroup);

    // 3D Arrow Mesh
    const arrowGroup = new THREE.Group();
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 1.6),
      new THREE.MeshLambertMaterial({ color: 0xd97706 })
    );
    shaft.rotation.x = Math.PI / 2;
    arrowGroup.add(shaft);

    const tip = new THREE.Mesh(
      new THREE.ConeGeometry(0.1, 0.3, 6),
      new THREE.MeshLambertMaterial({ color: 0x94a3b8 })
    );
    tip.rotation.x = -Math.PI / 2;
    tip.position.z = -0.9;
    arrowGroup.add(tip);

    const fletch = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.25, 0.3),
      new THREE.MeshLambertMaterial({ color: 0xef4444 })
    );
    fletch.position.z = 0.7;
    arrowGroup.add(fletch);

    arrowGroup.visible = false;
    scene.add(arrowGroup);
    stateRef.current.arrowMesh = arrowGroup;

    // Bow Visual
    const bowMesh = new THREE.Mesh(
      new THREE.TorusGeometry(0.6, 0.04, 8, 24, Math.PI),
      new THREE.MeshLambertMaterial({ color: 0x92400e })
    );
    bowMesh.rotation.y = Math.PI / 2;
    bowMesh.position.set(0.3, 1.3, -0.6);
    scene.add(bowMesh);

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const state = stateRef.current;

      // Draw bow power increment
      if (state.isDrawing && state.drawPower < 100) {
        state.drawPower = Math.min(100, state.drawPower + 1.6);
        setDrawPower(Math.floor(state.drawPower));
      }

      // Arrow in Flight
      if (state.isArrowFlying && state.arrowMesh) {
        state.arrowPos.add(state.arrowVel);

        // Apply wind physics
        state.arrowVel.x += (state.windDir.x * state.windSpeed * 0.0006);
        state.arrowVel.y += (state.windDir.y * state.windSpeed * 0.0003) - 0.005; // Gravity

        state.arrowMesh.position.copy(state.arrowPos);
        state.arrowMesh.rotation.x = Math.atan2(-state.arrowVel.y, -state.arrowVel.z);
        state.arrowMesh.rotation.y = Math.atan2(state.arrowVel.x, -state.arrowVel.z);

        // Target Impact check at Z <= -60
        if (state.arrowPos.z <= -60) {
          state.isArrowFlying = false;

          const dx = state.arrowPos.x - targetGroup.position.x;
          const dy = state.arrowPos.y - targetGroup.position.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          let pts = 0;
          let label = '빗나감 (Miss)';
          if (dist <= 0.4) { pts = 10; label = '🎯 엑스링 (X-RING 10점!)'; }
          else if (dist <= 0.9) { pts = 9; label = '🟡 골드 (Gold 9점)'; }
          else if (dist <= 1.4) { pts = 7; label = '🔴 레드 (Red 7점)'; }
          else if (dist <= 1.9) { pts = 5; label = '🔵 블루 (Blue 5점)'; }
          else if (dist <= 2.4) { pts = 3; label = '⚫ 블랙 (Black 3점)'; }

          state.totalScore += pts;
          setTotalScore(state.totalScore);
          setLastShotScore(label);
          setShotHistory(prev => [...prev, pts]);

          if (playSfx) playSfx(pts >= 9 ? '/sounds/hit_bullseye.mp3' : '/sounds/arrow_hit.mp3');

          // Next Round or Game Over
          setTimeout(() => {
            if (state.round >= state.maxRounds) {
              state.isGameOver = true;
              setIsGameOver(true);
              const finalSns = Math.min(260, Math.max(40, state.totalScore * 5 + 40));
              setRewardSns(finalSns);
              onReward(finalSns);
              if (playSfx) playSfx('/sounds/fanfare.mp3');
            } else {
              state.round += 1;
              setRound(state.round);
              setLastShotScore(null);
              generateWind();
              if (state.arrowMesh) state.arrowMesh.visible = false;
            }
          }, 1400);
        }
      }

      // Camera Aim Rotation
      camera.rotation.y = -state.aimX * 0.003;
      camera.rotation.x = -state.aimY * 0.003;

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

  const handlePointerDown = () => {
    if (stateRef.current.isArrowFlying || stateRef.current.isGameOver) return;
    stateRef.current.isDrawing = true;
    stateRef.current.drawPower = 0;
    setIsDrawing(true);
  };

  const handlePointerUp = () => {
    if (!stateRef.current.isDrawing || stateRef.current.isArrowFlying) return;
    stateRef.current.isDrawing = false;
    setIsDrawing(false);

    const pwr = stateRef.current.drawPower;
    if (pwr < 20) return; // Too weak

    // Launch arrow
    const state = stateRef.current;
    state.isArrowFlying = true;
    state.arrowPos.set(0, 1.5, 0);

    const speed = (pwr / 100) * 1.8 + 0.4;
    state.arrowVel.set(
      -state.aimX * 0.003 * speed,
      -state.aimY * 0.003 * speed + 0.04,
      -speed
    );

    if (state.arrowMesh) {
      state.arrowMesh.position.copy(state.arrowPos);
      state.arrowMesh.visible = true;
    }

    if (playSfx) playSfx('/sounds/arrow_release.mp3');
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    stateRef.current.aimX = e.clientX - rect.left - cx;
    stateRef.current.aimY = e.clientY - rect.top - cy;
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#1e293b] font-mono text-[#fdfcfc] select-none flex flex-col overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#201d1d] border-b border-[#201d1d]/30 z-20">
        <button
          onClick={onExit}
          className="flex items-center gap-1 px-2.5 py-1 bg-[#fdfcfc]/10 text-white rounded-sm text-xs active:bg-white/20"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> [뒤로]
        </button>
        <div className="text-center">
          <div className="text-xs font-bold text-amber-400 flex items-center justify-center gap-1">
            <Target className="w-3.5 h-3.5" /> [No.71 발보 전담] 3D 양궁 마스터: 윈드 헌터
          </div>
          <div className="text-[10px] text-slate-300">정밀 활시위 당기기 & 100m 풍향 저격 스포츠</div>
        </div>
        <div className="text-xs text-amber-300 font-bold">
          라운드 {round} / 5
        </div>
      </div>

      {/* Wind & Score HUD */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#0f172a]/90 text-xs border-b border-slate-700 z-20">
        <div className="flex items-center gap-2">
          <Wind className="w-4 h-4 text-cyan-400" />
          <span>풍속: <strong className="text-cyan-300">{windSpeed} m/s</strong></span>
          <div
            className="w-4 h-4 border border-cyan-400 rounded-full flex items-center justify-center text-[8px]"
            style={{ transform: `rotate(${windAngle}deg)` }}
          >
            ↑
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-slate-400">기록: {shotHistory.map((s, i) => <span key={i} className="mx-0.5 text-amber-300">[{s}]</span>)}</div>
          <div>총점: <strong className="text-amber-400 text-sm">{totalScore}P</strong></div>
        </div>
      </div>

      {/* 3D Aiming Canvas & Touch Layer */}
      <div
        ref={mountRef}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
        className="relative flex-1 w-full overflow-hidden cursor-crosshair"
      >
        {/* Crosshair Overlay */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="relative w-16 h-16 border border-white/40 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            <div className="absolute w-full h-[1px] bg-white/30" />
            <div className="absolute h-full w-[1px] bg-white/30" />
          </div>
        </div>

        {/* Shot Result Banner */}
        {lastShotScore && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-black/80 px-4 py-2 rounded-sm border border-amber-400 text-amber-300 font-bold text-sm z-30 animate-bounce">
            {lastShotScore}
          </div>
        )}
      </div>

      {/* Bottom Controls / Power Gauge */}
      <div className="p-3 bg-[#0f172a] border-t border-slate-700 flex flex-col items-center gap-2 z-20">
        <div className="w-full max-w-md bg-slate-800 h-3 rounded-full overflow-hidden border border-slate-600">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-red-500 transition-all duration-75"
            style={{ width: `${drawPower}%` }}
          />
        </div>
        <div className="text-[11px] text-slate-300">
          {isDrawing ? `[당기는 중... 파워: ${drawPower}%] 손을 떼면 발사됩니다` : `화면을 누른 채 조준하고 손을 떼어 발사하세요`}
        </div>
      </div>

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-sm bg-[#201d1d] border border-amber-500/40 p-5 rounded-none text-center font-mono">
            <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-2" />
            <h2 className="text-base font-bold text-amber-400 mb-1">[양궁 사격 완주!]</h2>
            <p className="text-xs text-slate-300 mb-4">5라운드 정밀 풍향 저격 완료</p>

            <div className="bg-slate-900/80 p-3 rounded-sm text-xs space-y-1 mb-4 text-left border border-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-400">총 획득 점수:</span>
                <span className="text-amber-400 font-bold">{totalScore}점 / 50점 만점</span>
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
