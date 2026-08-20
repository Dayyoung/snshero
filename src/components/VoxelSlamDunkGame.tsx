import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowLeft, Flame, Trophy, Sparkles } from 'lucide-react';
import { CardData } from '../types';

interface VoxelSlamDunkGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelSlamDunkGame: React.FC<VoxelSlamDunkGameProps> = ({
  deck: _deck,
  language: _language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [isOnFire, setIsOnFire] = useState<boolean>(false);
  const [shotsLeft, setShotsLeft] = useState<number>(10);
  const [isDunking, setIsDunking] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const stateRef = useRef({
    ballPos: new THREE.Vector3(0, 1.2, 8),
    ballVel: new THREE.Vector3(0, 0, 0),
    isShooting: false,
    isDunking: false,
    playerPos: new THREE.Vector3(0, 1.0, 8),
    playerJumpY: 0,
    score: 0,
    streak: 0,
    shotsLeft: 10,
    isGameOver: false,
    dragStartX: 0,
    dragStartY: 0,
    isDragging: false,
    ballMesh: null as THREE.Mesh | null,
    playerGroup: null as THREE.Group | null
  });

  const performSlamDunk = () => {
    const s = stateRef.current;
    if (s.isShooting || s.isDunking || s.isGameOver || s.shotsLeft <= 0) return;

    s.isDunking = true;
    setIsDunking(true);
    s.shotsLeft -= 1;
    setShotsLeft(s.shotsLeft);

    let step = 0;
    const dunkAnim = setInterval(() => {
      step += 1;
      // Leap forward and up towards rim (Z: -12, Y: 6)
      s.playerPos.z = 8 - step * 0.8;
      s.playerJumpY = Math.sin((step / 25) * Math.PI) * 6;

      if (s.playerGroup && s.ballMesh) {
        s.playerGroup.position.set(0, 1.0 + s.playerJumpY, s.playerPos.z);
        s.ballMesh.position.set(0, 2.6 + s.playerJumpY, s.playerPos.z - 0.5);
      }

      if (step >= 25) {
        clearInterval(dunkAnim);
        s.isDunking = false;
        setIsDunking(false);

        // Dunk Success!
        s.streak += 1;
        const pts = s.streak >= 3 ? 30 : 20;
        s.score += pts;
        setStreak(s.streak);
        setScore(s.score);
        setIsOnFire(s.streak >= 3);
        if (playSfx) playSfx('/sounds/slamdunk.mp3');

        // Reset player & ball
        s.playerPos.set(0, 1.0, 8);
        s.playerJumpY = 0;
        if (s.playerGroup) s.playerGroup.position.copy(s.playerPos);
        if (s.ballMesh) s.ballMesh.position.set(0, 1.2, 7.5);

        if (s.shotsLeft <= 0) {
          endGame();
        }
      }
    }, 30);
  };

  const endGame = () => {
    const s = stateRef.current;
    if (s.isGameOver) return;
    s.isGameOver = true;
    setIsGameOver(true);
    const finalSns = Math.min(260, Math.max(30, s.score * 2 + 40));
    setRewardSns(finalSns);
    onReward(finalSns);
    if (playSfx) playSfx('/sounds/fanfare.mp3');
  };

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x18181b);
    scene.fog = new THREE.FogExp2(0x18181b, 0.015);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
    camera.position.set(0, 5, 18);
    camera.lookAt(0, 3, -12);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const spot = new THREE.SpotLight(0xffedd5, 1.6);
    spot.position.set(0, 25, 0);
    spot.angle = Math.PI / 3;
    scene.add(spot);

    // Basketball Wooden Court Floor
    const courtGeo = new THREE.PlaneGeometry(30, 45);
    const courtMat = new THREE.MeshLambertMaterial({ color: 0xd97706 });
    const court = new THREE.Mesh(courtGeo, courtMat);
    court.rotation.x = -Math.PI / 2;
    scene.add(court);

    // Basketball Hoop Stand at Z = -14
    const hoopGroup = new THREE.Group();
    hoopGroup.position.set(0, 0, -14);

    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 8),
      new THREE.MeshLambertMaterial({ color: 0x334155 })
    );
    pole.position.set(0, 4, -1.5);
    hoopGroup.add(pole);

    const backboard = new THREE.Mesh(
      new THREE.BoxGeometry(4.5, 3.0, 0.2),
      new THREE.MeshLambertMaterial({ color: 0xf8fafc })
    );
    backboard.position.set(0, 6.2, 0);
    hoopGroup.add(backboard);

    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(0.9, 0.08, 8, 24),
      new THREE.MeshLambertMaterial({ color: 0xef4444 })
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.set(0, 5.2, 1.0);
    hoopGroup.add(rim);

    scene.add(hoopGroup);

    // Player Mesh
    const playerGroup = new THREE.Group();
    playerGroup.position.set(0, 1.0, 8);

    const pBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.8, 0.8),
      new THREE.MeshLambertMaterial({ color: 0xef4444 })
    );
    pBody.position.y = 0.9;
    playerGroup.add(pBody);

    const pHead = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.8, 0.8),
      new THREE.MeshLambertMaterial({ color: 0xfacc15 })
    );
    pHead.position.y = 2.2;
    playerGroup.add(pHead);

    scene.add(playerGroup);
    stateRef.current.playerGroup = playerGroup;

    // Basketball Mesh
    const ballGeo = new THREE.SphereGeometry(0.55, 16, 16);
    const ballMat = new THREE.MeshLambertMaterial({ color: 0xea580c });
    const ballMesh = new THREE.Mesh(ballGeo, ballMat);
    ballMesh.position.set(0, 1.2, 7.5);
    scene.add(ballMesh);
    stateRef.current.ballMesh = ballMesh;

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const s = stateRef.current;
      if (s.isGameOver) {
        renderer.render(scene, camera);
        return;
      }

      // Ball Trajectory Physics during shot
      if (s.isShooting && s.ballMesh) {
        s.ballPos.add(s.ballVel);
        s.ballVel.y -= 0.018; // Gravity

        s.ballMesh.position.copy(s.ballPos);

        // Check basket hit around Z = -13, Y = 5.2
        if (s.ballPos.z <= -13 && Math.abs(s.ballPos.y - 5.2) < 1.2 && Math.abs(s.ballPos.x) < 1.2) {
          s.isShooting = false;
          s.streak += 1;
          const pts = s.streak >= 3 ? 30 : 15;
          s.score += pts;
          setStreak(s.streak);
          setScore(s.score);
          setIsOnFire(s.streak >= 3);
          if (playSfx) playSfx('/sounds/swish.mp3');

          setTimeout(() => {
            s.ballPos.set(0, 1.2, 7.5);
            if (s.ballMesh) s.ballMesh.position.copy(s.ballPos);
            if (s.shotsLeft <= 0) endGame();
          }, 600);
        } else if (s.ballPos.y <= 0.5 || s.ballPos.z <= -20) {
          // Missed shot
          s.isShooting = false;
          s.streak = 0;
          setStreak(0);
          setIsOnFire(false);

          setTimeout(() => {
            s.ballPos.set(0, 1.2, 7.5);
            if (s.ballMesh) s.ballMesh.position.copy(s.ballPos);
            if (s.shotsLeft <= 0) endGame();
          }, 600);
        }
      }

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

  const handlePointerDown = (e: React.PointerEvent) => {
    const s = stateRef.current;
    if (s.isShooting || s.isDunking || s.isGameOver || s.shotsLeft <= 0) return;
    s.isDragging = true;
    s.dragStartX = e.clientX;
    s.dragStartY = e.clientY;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const s = stateRef.current;
    if (!s.isDragging || s.isShooting || s.isDunking) return;
    s.isDragging = false;

    const dx = e.clientX - s.dragStartX;
    const dy = e.clientY - s.dragStartY;

    if (dy < -30) {
      // Release 3-Point Shot
      s.isShooting = true;
      s.shotsLeft -= 1;
      setShotsLeft(s.shotsLeft);

      s.ballPos.set(0, 1.6, 7.5);
      const power = Math.min(1.2, Math.abs(dy) * 0.007);
      s.ballVel.set(dx * 0.002, power * 0.55 + 0.35, -power * 0.9 - 0.4);

      if (playSfx) playSfx('/sounds/shoot.mp3');
    }
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#18181b] font-mono text-[#fdfcfc] select-none flex flex-col overflow-hidden">
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
            <Flame className="w-3.5 h-3.5" /> [No.76 브란디 전담] 3D 점핑 배스킷볼
          </div>
          <div className="text-[10px] text-slate-300">포물선 3점슛 & 360° 슬램덩크 아레나</div>
        </div>
        <div className="text-xs text-amber-300 font-bold">
          남은 슛: {shotsLeft}구
        </div>
      </div>

      {/* Stats HUD */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#09090b]/90 text-xs border-b border-slate-700 z-20">
        <div>연속 득점: <strong className="text-amber-400">{streak}콤보</strong></div>
        {isOnFire && (
          <div className="text-red-500 font-bold animate-pulse flex items-center gap-1">
            <Flame className="w-4 h-4" /> [ON FIRE! 점수 1.5배]
          </div>
        )}
        <div>총점: <strong className="text-cyan-400">{score}P</strong></div>
      </div>

      {/* 3D Canvas & Touch Target */}
      <div
        ref={mountRef}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        className="relative flex-1 w-full overflow-hidden cursor-grab active:cursor-grabbing"
      />

      {/* Mobile Controls */}
      <div className="p-3 bg-[#09090b]/95 border-t border-slate-700 flex items-center justify-between gap-3 z-20">
        <div className="text-xs text-slate-400">
          [화면을 아래에서 위로 쓸어올리면 3점슛 발사]
        </div>
        <button
          onClick={performSlamDunk}
          disabled={isDunking || shotsLeft <= 0}
          className="px-5 py-3 bg-red-600 text-white font-bold text-xs rounded-sm active:bg-red-500 shadow-lg flex items-center gap-1.5 disabled:opacity-50"
        >
          <Flame className="w-4 h-4 text-amber-300" />
          [360° 슬램덩크]
        </button>
      </div>

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-sm bg-[#201d1d] border border-amber-500/40 p-5 rounded-none text-center font-mono">
            <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-2" />
            <h2 className="text-base font-bold text-amber-400 mb-1">[농구 경기 종료!]</h2>
            <p className="text-xs text-slate-300 mb-4">10구 3점슛 및 슬램덩크 기록</p>

            <div className="bg-slate-900/80 p-3 rounded-sm text-xs space-y-1 mb-4 text-left border border-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-400">최종 점수:</span>
                <span className="text-cyan-400 font-bold">{score}P</span>
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
