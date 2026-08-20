import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Trophy, ArrowLeft, Zap, Sparkles, Award, Crosshair } from 'lucide-react';
import { CardData } from '../types';

interface VoxelCastleBlasterGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelCastleBlasterGame: React.FC<VoxelCastleBlasterGameProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [cannonAngle, setCannonAngle] = useState<number>(45);
  const [cannonPower, setCannonPower] = useState<number>(70);
  const [castleHp, setCastleHp] = useState<number>(100);
  const [ammo, setAmmo] = useState<number>(8);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const gameStateRef = useRef({
    angle: 45,
    power: 70,
    castleHp: 100,
    ammo: 8,
    cannonBalls: [] as { mesh: THREE.Mesh; vx: number; vy: number; vz: number; life: number }[],
    blocks: [] as { mesh: THREE.Mesh; x: number; y: number; z: number; destroyed: boolean }[],
    isGameOver: false,
    isVictory: false
  });

  const fireCannon = (scene: THREE.Scene) => {
    const s = gameStateRef.current;
    if (s.ammo <= 0 || s.isGameOver || s.isVictory) return;
    s.ammo -= 1;
    setAmmo(s.ammo);

    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

    const rad = (s.angle * Math.PI) / 180;
    const speed = (s.power / 100) * 45;

    const ballGeo = new THREE.SphereGeometry(0.8, 12, 12);
    const ballMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    const ball = new THREE.Mesh(ballGeo, ballMat);
    ball.position.set(0, 2, -5);
    scene.add(ball);

    s.cannonBalls.push({
      mesh: ball,
      vx: 0,
      vy: Math.sin(rad) * speed,
      vz: -Math.cos(rad) * speed,
      life: 4.0
    });
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x88bbff);

    const camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 300);
    camera.position.set(-15, 12, 10);
    camera.lookAt(0, 4, -30);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffeedd, 1.2);
    sun.position.set(30, 60, 20);
    scene.add(sun);

    // Ground
    const groundGeo = new THREE.PlaneGeometry(120, 120);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x558833 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    scene.add(ground);

    // Build Voxel Castle at Z = -45
    const blockGeo = new THREE.BoxGeometry(1.8, 1.8, 1.8);
    const blockMat = new THREE.MeshLambertMaterial({ color: 0x888899 });

    for (let y = 0; y < 4; y++) {
      for (let x = -3; x <= 3; x++) {
        const block = new THREE.Mesh(blockGeo, blockMat);
        const bx = x * 2.0;
        const by = y * 2.0 + 1.0;
        const bz = -45;
        block.position.set(bx, by, bz);
        scene.add(block);

        gameStateRef.current.blocks.push({
          mesh: block,
          x: bx,
          y: by,
          z: bz,
          destroyed: false
        });
      }
    }

    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      const s = gameStateRef.current;

      if (!s.isGameOver && !s.isVictory) {
        // Update Cannonballs
        for (let i = s.cannonBalls.length - 1; i >= 0; i--) {
          const b = s.cannonBalls[i];
          b.mesh.position.x += b.vx * dt;
          b.mesh.position.y += b.vy * dt;
          b.mesh.position.z += b.vz * dt;
          b.vy -= 22 * dt; // gravity
          b.life -= dt;

          // Check block collision
          s.blocks.forEach(bl => {
            if (bl.destroyed) return;
            if (b.mesh.position.distanceTo(bl.mesh.position) < 2.5) {
              bl.destroyed = true;
              scene.remove(bl.mesh);
              s.castleHp = Math.max(0, s.castleHp - 15);
              setCastleHp(s.castleHp);
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

              if (s.castleHp <= 0) {
                s.isVictory = true;
                setIsVictory(true);
                const reward = 55 + s.ammo * 5;
                setRewardSns(reward);
                onReward(reward);
              }
            }
          });

          if (b.mesh.position.y < 0 || b.life <= 0) {
            scene.remove(b.mesh);
            s.cannonBalls.splice(i, 1);

            if (s.ammo <= 0 && s.cannonBalls.length === 0 && s.castleHp > 0) {
              s.isGameOver = true;
              setIsGameOver(true);
            }
          }
        }
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

        {/* Castle HP & Ammo */}
        <div className="flex items-center gap-3 bg-slate-900/80 px-3 py-1.5 rounded-2xl border border-slate-700">
          <div className="text-rose-400 font-bold text-xs">
            🏰 성채 내구도: {castleHp}%
          </div>

          <div className="text-yellow-400 font-bold text-xs">
            💣 포탄: {ammo}발
          </div>
        </div>
      </div>

      {/* Bottom Sliders & Fire Button */}
      <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-col sm:flex-row items-center justify-between gap-3 pointer-events-auto bg-slate-900/80 p-3 rounded-2xl border border-slate-700">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400">발사 각도: {cannonAngle}°</span>
            <input
              type="range"
              min="15"
              max="75"
              value={cannonAngle}
              onChange={e => {
                const v = Number(e.target.value);
                setCannonAngle(v);
                gameStateRef.current.angle = v;
              }}
              className="w-28"
            />
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400">발사 파워: {cannonPower}%</span>
            <input
              type="range"
              min="30"
              max="100"
              value={cannonPower}
              onChange={e => {
                const v = Number(e.target.value);
                setCannonPower(v);
                gameStateRef.current.power = v;
              }}
              className="w-28"
            />
          </div>
        </div>

        <button
          onClick={() => {
            const scene = (mountRef.current?.children[0] as any)?.__r3f?.scene;
            if (scene) fireCannon(scene);
          }}
          className="w-full sm:w-36 h-14 bg-rose-600 hover:bg-rose-500 text-white rounded-xl border border-rose-400 font-black text-sm flex items-center justify-center gap-1 cursor-pointer active:scale-95 shadow-xl"
        >
          <Crosshair size={18} />
          <span>대포 발사!</span>
        </button>
      </div>

      {/* Victory / Game Over Modal */}
      {(isVictory || isGameOver) && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${isVictory ? 'bg-amber-400/20 text-yellow-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {isVictory ? <Trophy size={36} /> : <Award size={36} />}
            </div>

            <h2 className="text-2xl font-black italic uppercase">{isVictory ? '성채 완전 함락! VICTORY' : '공성 실패! DEFEAT'}</h2>

            <p className="text-xs text-slate-300">
              {isVictory
                ? '정밀한 대포 사격으로 적의 견고한 복셀 요새를 완전히 파괴했습니다!'
                : '모든 포탄이 소진되었습니다.'}
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
