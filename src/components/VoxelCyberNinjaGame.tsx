import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Swords, Shield, Zap, Sparkles, ArrowLeft, Trophy, Crosshair, Award } from 'lucide-react';
import { CardData } from '../types';

interface VoxelCyberNinjaGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelCyberNinjaGame: React.FC<VoxelCyberNinjaGameProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hp, setHp] = useState<number>(100);
  const [maxHp] = useState<number>(100);
  const [energy, setEnergy] = useState<number>(100);
  const [killCount, setKillCount] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const gameStateRef = useRef({
    posX: 0,
    posY: 1,
    posZ: 0,
    rotY: 0,
    hp: 100,
    maxHp: 100,
    energy: 100,
    killCount: 0,
    isSlashing: false,
    slashCooldown: 0,
    bulletTime: 1.0,
    keys: { w: false, s: false, a: false, d: false, jump: false, slash: false, blink: false },
    enemies: [] as { group: THREE.Group; x: number; z: number; hp: number; alive: boolean; shootTimer: number }[],
    enemyBullets: [] as { mesh: THREE.Mesh; vx: number; vz: number; life: number }[],
    isGameOver: false,
    isVictory: false
  });

  const performKatanaSlash = () => {
    const s = gameStateRef.current;
    if (s.isGameOver || s.isVictory || s.slashCooldown > 0) return;
    s.slashCooldown = 0.25;
    s.isSlashing = true;
    setTimeout(() => {
      s.isSlashing = false;
    }, 200);

    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

    // Slash hitbox check & deflect bullets
    s.enemies.forEach(e => {
      if (!e.alive) return;
      const dist = Math.hypot(e.x - s.posX, e.z - s.posZ);
      if (dist < 4.0) {
        e.hp -= 40;
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
        if (e.hp <= 0) {
          e.alive = false;
          s.killCount += 1;
          s.energy = Math.min(100, s.energy + 25);
          setKillCount(s.killCount);
          setEnergy(Math.round(s.energy));

          if (s.killCount >= 8) {
            s.isVictory = true;
            setIsVictory(true);
            const reward = 50 + s.killCount * 5;
            setRewardSns(reward);
            onReward(reward);
          }
        }
      }
    });

    // Deflect incoming bullets
    s.enemyBullets.forEach(b => {
      const d = Math.hypot(b.mesh.position.x - s.posX, b.mesh.position.z - s.posZ);
      if (d < 3.0) {
        b.vx = -b.vx * 1.5;
        b.vz = -b.vz * 1.5;
      }
    });
  };

  const performBlinkStrike = () => {
    const s = gameStateRef.current;
    if (s.isGameOver || s.isVictory || s.energy < 30) return;
    s.energy -= 30;
    setEnergy(Math.round(s.energy));

    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

    // Blink forward 10 meters
    s.posX += Math.sin(s.rotY) * 10;
    s.posZ -= Math.cos(s.rotY) * 10;
    performKatanaSlash();
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050512);
    scene.fog = new THREE.FogExp2(0x050512, 0.02);

    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 300);
    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    // Lights
    const ambient = new THREE.AmbientLight(0x221144, 0.8);
    scene.add(ambient);

    const neonLight = new THREE.PointLight(0x00ffff, 2, 40);
    neonLight.position.set(0, 10, 0);
    scene.add(neonLight);

    // Cyberpunk Rooftop Floor
    const floorGeo = new THREE.PlaneGeometry(120, 120, 16, 16);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshLambertMaterial({ color: 0x111122 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    scene.add(floor);

    // Cyber Ninja Mesh
    const ninja = new THREE.Group();

    // Body
    const bodyGeo = new THREE.BoxGeometry(0.8, 1.4, 0.5);
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.0;
    ninja.add(body);

    // Neon Scarf
    const scarfGeo = new THREE.BoxGeometry(0.85, 0.2, 0.6);
    const scarfMat = new THREE.MeshBasicMaterial({ color: 0xff0055 });
    const scarf = new THREE.Mesh(scarfGeo, scarfMat);
    scarf.position.y = 1.6;
    ninja.add(scarf);

    // Katana Blade
    const bladeGeo = new THREE.BoxGeometry(0.08, 0.12, 1.8);
    const bladeMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    blade.position.set(0.6, 1.0, -0.6);
    ninja.add(blade);

    scene.add(ninja);

    // Spawn 8 Cyber Guards
    for (let i = 0; i < 8; i++) {
      const eGroup = new THREE.Group();
      const eBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 1.5, 0.6),
        new THREE.MeshLambertMaterial({ color: 0x882222 })
      );
      eBody.position.y = 1.0;
      eGroup.add(eBody);

      const ex = (Math.random() - 0.5) * 80;
      const ez = -15 - Math.random() * 60;
      eGroup.position.set(ex, 0, ez);
      scene.add(eGroup);

      gameStateRef.current.enemies.push({
        group: eGroup,
        x: ex,
        z: ez,
        hp: 60,
        alive: true,
        shootTimer: Math.random() * 2 + 1
      });
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') gameStateRef.current.keys.w = true;
      if (k === 's' || k === 'arrowdown') gameStateRef.current.keys.s = true;
      if (k === 'a' || k === 'arrowleft') gameStateRef.current.keys.a = true;
      if (k === 'd' || k === 'arrowright') gameStateRef.current.keys.d = true;
      if (k === ' ' || k === 'j') performKatanaSlash();
      if (k === 'e' || k === 'k') performBlinkStrike();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') gameStateRef.current.keys.w = false;
      if (k === 's' || k === 'arrowdown') gameStateRef.current.keys.s = false;
      if (k === 'a' || k === 'arrowleft') gameStateRef.current.keys.a = false;
      if (k === 'd' || k === 'arrowright') gameStateRef.current.keys.d = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      const s = gameStateRef.current;

      if (s.slashCooldown > 0) s.slashCooldown -= dt;

      if (!s.isGameOver && !s.isVictory) {
        // Ninja Movement & Rotation
        if (s.keys.a) s.rotY += 2.5 * dt;
        if (s.keys.d) s.rotY -= 2.5 * dt;

        const forward = (s.keys.w ? 1 : 0) - (s.keys.s ? 1 : 0);
        s.posX += Math.sin(s.rotY) * forward * 16 * dt;
        s.posZ -= Math.cos(s.rotY) * forward * 16 * dt;

        ninja.position.set(s.posX, 0, s.posZ);
        ninja.rotation.y = s.rotY;

        // Katana swing animation
        if (s.isSlashing) {
          blade.rotation.x = -Math.PI / 3;
          blade.position.set(0.2, 1.0, -1.0);
        } else {
          blade.rotation.x = 0;
          blade.position.set(0.6, 1.0, -0.6);
        }

        // Camera Follow
        camera.position.set(s.posX - Math.sin(s.rotY) * 6, 4, s.posZ + Math.cos(s.rotY) * 6);
        camera.lookAt(s.posX, 1.5, s.posZ);

        // Cyber Guard AI Shooting
        s.enemies.forEach(e => {
          if (!e.alive) return;
          e.shootTimer -= dt;
          if (e.shootTimer <= 0) {
            e.shootTimer = 2.0 + Math.random() * 1.5;
            const bGeo = new THREE.SphereGeometry(0.2, 6, 6);
            const bMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });
            const bMesh = new THREE.Mesh(bGeo, bMat);
            bMesh.position.set(e.x, 1.2, e.z);
            scene.add(bMesh);

            const dx = s.posX - e.x;
            const dz = s.posZ - e.z;
            const dist = Math.hypot(dx, dz);

            s.enemyBullets.push({
              mesh: bMesh,
              vx: (dx / dist) * 18,
              vz: (dz / dist) * 18,
              life: 3.0
            });
          }
        });

        // Update Bullets
        for (let i = s.enemyBullets.length - 1; i >= 0; i--) {
          const b = s.enemyBullets[i];
          b.mesh.position.x += b.vx * dt;
          b.mesh.position.z += b.vz * dt;
          b.life -= dt;

          const dist = Math.hypot(b.mesh.position.x - s.posX, b.mesh.position.z - s.posZ);
          if (dist < 1.0) {
            scene.remove(b.mesh);
            s.enemyBullets.splice(i, 1);
            s.hp = Math.max(0, s.hp - 15);
            setHp(s.hp);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
            if (s.hp <= 0) {
              s.isGameOver = true;
              setIsGameOver(true);
            }
            continue;
          }

          if (b.life <= 0) {
            scene.remove(b.mesh);
            s.enemyBullets.splice(i, 1);
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

        {/* HP & Energy Stats */}
        <div className="flex items-center gap-3 bg-slate-900/80 px-3 py-1.5 rounded-2xl border border-slate-700">
          <div className="flex items-center gap-1.5">
            <Shield size={16} className="text-rose-400" />
            <div className="w-20 sm:w-28 h-2 bg-slate-950 rounded-full overflow-hidden">
              <div className="h-full bg-rose-500 transition-all" style={{ width: `${(hp / maxHp) * 100}%` }} />
            </div>
            <span className="text-xs font-mono font-bold text-rose-400">{hp}</span>
          </div>

          <div className="flex items-center gap-1 text-cyan-400 text-xs font-bold">
            <Zap size={14} />
            <span>{energy}% ENERGY</span>
          </div>

          <div className="bg-indigo-950 border border-indigo-500/40 px-2 py-0.5 rounded text-indigo-300 text-xs font-bold">
            KILLS: {killCount}/8
          </div>
        </div>
      </div>

      {/* Mobile Touch Controls */}
      <div className="absolute bottom-4 left-4 right-4 z-20 flex justify-between items-end pointer-events-none">
        {/* D-Pad */}
        <div className="flex flex-col items-center gap-1 pointer-events-auto">
          <button
            onPointerDown={() => (gameStateRef.current.keys.w = true)}
            onPointerUp={() => (gameStateRef.current.keys.w = false)}
            className="w-14 h-12 bg-slate-800/90 text-white rounded-xl border border-slate-600 font-bold flex items-center justify-center"
          >
            ▲
          </button>
          <div className="flex gap-1">
            <button
              onPointerDown={() => (gameStateRef.current.keys.a = true)}
              onPointerUp={() => (gameStateRef.current.keys.a = false)}
              className="w-14 h-12 bg-slate-800/90 text-white rounded-xl border border-slate-600 font-bold flex items-center justify-center"
            >
              ◀
            </button>
            <button
              onPointerDown={() => (gameStateRef.current.keys.s = true)}
              onPointerUp={() => (gameStateRef.current.keys.s = false)}
              className="w-14 h-12 bg-slate-800/90 text-white rounded-xl border border-slate-600 font-bold flex items-center justify-center"
            >
              ▼
            </button>
            <button
              onPointerDown={() => (gameStateRef.current.keys.d = true)}
              onPointerUp={() => (gameStateRef.current.keys.d = false)}
              className="w-14 h-12 bg-slate-800/90 text-white rounded-xl border border-slate-600 font-bold flex items-center justify-center"
            >
              ▶
            </button>
          </div>
        </div>

        {/* Action: Katana Slash & Blink Strike */}
        <div className="flex gap-2 pointer-events-auto">
          <button
            onClick={performBlinkStrike}
            className="w-16 h-16 bg-cyan-600/90 text-white rounded-2xl border-2 border-cyan-400 font-bold text-xs flex flex-col items-center justify-center cursor-pointer active:scale-95"
          >
            <Zap size={20} />
            <span>블링크 참격 [E]</span>
          </button>

          <button
            onClick={performKatanaSlash}
            className="w-16 h-16 bg-rose-600/90 text-white rounded-2xl border-2 border-rose-400 font-bold text-xs flex flex-col items-center justify-center cursor-pointer active:scale-95"
          >
            <Swords size={22} />
            <span>카타나 베기 [Space]</span>
          </button>
        </div>
      </div>

      {/* Victory / Game Over Modal */}
      {(isVictory || isGameOver) && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${isVictory ? 'bg-amber-400/20 text-yellow-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {isVictory ? <Trophy size={36} /> : <Award size={36} />}
            </div>

            <h2 className="text-2xl font-black italic uppercase">{isVictory ? '네온 섀도우 암살 완수! VICTORY' : '미션 실패! DEFEAT'}</h2>

            <p className="text-xs text-slate-300">
              {isVictory
                ? '모든 적 사이버 가드를 처치하고 코어 해킹을 성공적으로 마쳤습니다!'
                : '적들의 총격으로 치명상을 입었습니다.'}
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
